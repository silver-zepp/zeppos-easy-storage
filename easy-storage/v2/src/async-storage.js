/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

import { O_CREAT, O_TRUNC, O_WRONLY, writeSync, closeSync } from "@zos/fs";
import { openFile, readFile, removeFile, writeFile, str2ab, debugLog } from "./core/core";

let asyncQueue = null;

// === tokenizer === //
const TOK  = { T:'type', A:'__arrays', D:'data', M:'meta' };
const REV  = { type:'T', __arrays:'A', data:'D', meta:'M' };
const RESERVED_MSET = { type:1, __arrays:1, data:1, meta:1, T:1, A:1, D:1, M:1 };

function nd_tokenEncode(rec){
  const out = {};
  for (const k in rec){
    const tk = REV[k] || k;
    out[tk] = rec[k];
  }
  return JSON.stringify(out);
}

/** @private */
export function nd_tokenDecode(obj){
  for (const k in obj){
    const nk = TOK[k];
    if (nk && nk !== k){
      obj[nk] = obj[k];
      delete obj[k];
    }
  }
  return obj;
}

function safeCopyToMetadata(metadata, key, val, arr_data) {
  if (key in RESERVED_MSET) {
    if (!metadata._u) metadata._u = {};
    metadata._u[key] = val;
    return;
  }

  if (val && typeof val === 'object' && (val.length >>> 0) === val.length && val.length) {
    metadata[key] = val.length;
    if (!metadata.__arrays) metadata.__arrays = [];
    metadata.__arrays.push(key);
    arr_data[key] = val;
  } else {
    metadata[key] = val;
  }
}
// ============================= //

function nd_streamJsonWrite(file, data, cb) {
  asyncQueue.startOperation();

  setTimeout(() => {
    let fd;
    let arr_data = {};
    let metadata = { type: 'meta' };

    try {
      fd = openFile(file, O_WRONLY | O_CREAT | O_TRUNC);
    } catch (e) {
      debugLog(1, `[ASYNC] Error opening file: ${file}`, e);
      asyncQueue.endOperation();
      if (cb) cb(e, false);
      return;
    }

    const data_keys = Object.keys(data);
    let key_index = 0;

    (function processMetadataChunk() {
      let done = 0;
      const chunk_start = Date.now();

      while (key_index < data_keys.length && Date.now() - chunk_start < 2 && done < 3) {
        const key = data_keys[key_index++];
        const val = data[key];

        safeCopyToMetadata(metadata, key, val, arr_data);
        done++;
      }

      if (key_index < data_keys.length) {
        setTimeout(processMetadataChunk, 2);
      } else {
        setTimeout(() => {
          const out_meta = {};
          for (const k in metadata) out_meta[REV[k] || k] = metadata[k];
          const metaline = JSON.stringify(out_meta) + '\n';
          writeSync({ fd, buffer: str2ab(metaline) });
          setTimeout(() => buildItemsAsync(fd, arr_data, cb), 2);
        }, 2);
      }
    })();
  }, 2);
}

function buildItemsAsync(fd, arr_data, cb) {
  const WRITE_CHUNK = 512;
  const keys = Object.keys(arr_data);
  let k = 0, i = 0;

  (function pump () {
    const t0 = Date.now();
    let block = '';

    while (k < keys.length && Date.now() - t0 < 1) {
      const key = keys[k];
      const arr = arr_data[key];

      if (i < arr.length) {
        block += nd_tokenEncode({ type: key, data: arr[i++] }) + '\n';
        if (block.length >= WRITE_CHUNK) {
          writeSync({ fd, buffer: str2ab(block) });
          block = '';
        }
      } else { k++; i = 0; }
    }

    if (block) writeSync({ fd, buffer: str2ab(block) });

    k < keys.length ? setTimeout(pump, 1) : finalizeBuild(fd, cb);
  })();
}

function finalizeBuild(fd, cb){
  closeSync({ fd });
  asyncQueue.endOperation();
  debugLog(3, `[ASYNC] Stream write complete`);
  if (cb) cb(null, true);
}

function nd_streamJsonRead(file, cb) {
  setTimeout(() => {
    try {
      const cont = readFile(file);
      if (!cont) {
        if (cb) cb(new Error('Empty file'), null);
        return;
      }

      const lines = cont.trim().split('\n');
      
      // nd parser
      if (lines.length > 0) {
        try {
          const first_line = nd_tokenDecode(JSON.parse(lines[0]));
          if (first_line.type === 'meta') {
            nd_parseJsonAsync(lines, cb);
            return;
          }
        } catch (e) {}
      }
      
      // reg JSON parser; in case SaveAndExit() was triggered
      const data = JSON.parse(cont);
      if (cb) cb(null, data);
      
    } catch (e) {
      if (cb) cb(e, null);
    }
  }, 0);
}

function nd_parseJsonAsync(lines, cb) {
  let idx = 0;
  const res = {};
  const arr_cache = {};

  (function parseSlice() {
    const t0 = Date.now();
    let done = 0;

    while (idx < lines.length && Date.now() - t0 < 1 && done < 5) {
      try {
        const txt = lines[idx++].trim();
        if (!txt) continue;

        const obj = nd_tokenDecode(JSON.parse(txt));

        if (obj.type === 'meta') {
          const lookup = {};
          const af = obj.__arrays || [];
          for (let j = 0; j < af.length; j++) lookup[af[j]] = 1;

          for (const k in obj) {
            if (k === 'type' || k === '__arrays') continue;
            const v = obj[k];
            if (lookup[k]) {
              arr_cache[k] = [];
              res[k] = arr_cache[k];
            } else {
              res[k] = v;
            }
          }
        } else {
          const akey = obj.type;
          if (!arr_cache[akey]) {
            arr_cache[akey] = [];
            res[akey] = arr_cache[akey];
          }
          arr_cache[akey].push(obj.data);
        }
        done++;
      } catch (e) {
        debugLog(1, `[ASYNC] Parse error at line ${idx}:`, e);
      }
    }

    idx < lines.length ? setTimeout(parseSlice, 6) 
        : (debugLog(3, `[ASYNC] Parse complete: ${lines.length} lines`),
        cb && cb(null, res));
  })();
}

class AsyncOperationQueue {
  constructor() {
    this.queue_arr = [];
    this.is_running = false;
    this.active_ops = 0;
  }

  isBusy() {
    return this.is_running && (this.queue_arr.length >= 4 || this.active_ops > 0);
  }

  getInfo() {
    return {
      running: this.is_running,
      queued: this.queue_arr.length,
      active: this.active_ops
    };
  }

  startOperation() {
    this.active_ops++;
  }

  endOperation() {
    this.active_ops--;
  }

  enqueue(operation) {
    this.queue_arr.push(operation);
    this.process();
  }

  process() {
    if (this.is_running || this.queue_arr.length === 0) return;

    this.is_running = true;
    this.processNext();
  }

  processNext() {
    if (this.queue_arr.length === 0) {
      this.is_running = false;
      return;
    }

    const op = this.queue_arr.shift();
    op(() => {
      // TODO: watch time complexity
      const delay = Math.min(100 + (this.queue_arr.length * 25), 300);
      setTimeout(() => this.processNext(), delay);
    });
  }

  emergencyStop() {
    debugLog(3, `[QUEUE] Emergency stop - clearing ${this.queue_arr.length} operations`);
    this.queue_arr = [];
    this.is_running = false;
  }

  reset() {
    this.queue_arr = [];
    this.is_running = false;
    this.active_ops = 0;
  }
}

asyncQueue = new AsyncOperationQueue();


/**
 * AsyncStorage: 
 * - Queued JSON file operations that won't overwhelm CPU and freeze UI during big writes/reads
 * - Automatically streams large datasets in small chunks to stay responsive
 * - Built-in flow control prevents overwhelming the system with too many operations
 * - Graceful shutdown saves any pending writes before app exits. Add `AsyncStorage.SaveAndQuit();` to your page's onDestroy().
 */
export class AsyncStorage {
  static pend_writes_map = new Map();

  /**
   * Writes JSON data to file without blocking the UI thread.
   * Operations are queued and processed in small chunks to keep animations smooth.
   * @param {string} filename - The filename to write to.
   * @param {Object} json - The json object to write.
   * @param {Function} callback - Callback function (err, success) when write finishes.
   * ```
   * // example: save config
   * AsyncStorage.WriteJson('config.json', { theme: 'dark' }, (err, ok) => {
   *   if (ok) console.log('config saved!');
   * });
   * ```
   */
  static WriteJson(filename, json, callback) {
    this.pend_writes_map.set(filename, json);

    asyncQueue.enqueue((on_complete) => {
      nd_streamJsonWrite(filename, json, (err, success) => {
        this.pend_writes_map.delete(filename);
        if (callback) callback(err, success);
        on_complete();
      });
    });
  }

  /**
   * Reads JSON files without blocking the UI.
   * Queued with other operations to maintain smooth app performance.
   * @param {string} filename - The filename to read from.
   * @param {Function} callback - Callback function (err, data) with the parsed JSON.
   * ```
   * // example: load config
   * AsyncStorage.ReadJson('config.json', (err, config) => {
   *   if (!err) console.log('theme:', config.theme);
   * });
   * ```
   */
  static ReadJson(filename, callback) {
    asyncQueue.enqueue((on_complete) => {
      nd_streamJsonRead(filename, (err, data) => {
        if (callback) callback(err, data);
        on_complete();
      });
    });
  }

  /**
   * Removes a file. This method is syncronous, but should be quick regardless.
   * @param {string} filename - The filename to delete.
   * @param {Function} callback - Callback function (err, success) when deletion completes.
   * ```
   * // example: remove a file
   * AsyncStorage.RemoveFile('temp.json', (err, ok) => {
   *   if (ok) console.log('done');
   * });
   * ```
   */
  static RemoveFile(filename, callback) {
    setTimeout(() => {
      try {
        removeFile(filename);
        if (callback) callback(null, true);
      } catch (e) {
        if (callback) callback(e, false);
      }
    }, 0);
  }

  /**
   * Check if the storage system is too busy to accept new work.
   * Useful for throttling operations when the queue gets backed up.
   * @returns {boolean} True if you should wait before adding more operations.
   * ```
   * // example: throttle file operations to prevent overload and RAM runout
   * if (!AsyncStorage.IsBusy()) {
   *   AsyncStorage.WriteJson('data.json', big_obj, callback);
   * } else {
   *   console.log('storage busy, try again later');
   * }
   * ```
   */
  static IsBusy() {
    return asyncQueue.isBusy();
  }

  /**
   * Force-save any pending writes and shut down the queue cleanly.
   * Essential for app shutdown - prevents losing data that was still being written.
   * @returns {Object} Number of files that were successfully saved.
   * ```
   * // example:
   * onDestroy() {
   *   AsyncStorage.SaveAndQuit(); // safe shutdown
   * }
   * // advanced example:
   * onDestroy() {
   *   const res = AsyncStorage.SaveAndQuit();
   *   console.log(`Saved ${res.saved} files before exit`); // ie 'saved 3 files'
   * }
   * ```
   */
  static SaveAndQuit() {
    let saved_count = 0;
    for (const [fname, data] of this.pend_writes_map.entries()) {
      try {
        writeFile(fname, JSON.stringify(data));
        saved_count++;
      } catch (e) {
        debugLog(1, `Save failed: ${fname}`, e);
      }
    }
    
    this.pend_writes_map.clear();
    asyncQueue.reset();
    
    return { saved: saved_count };
  }
}