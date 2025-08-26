/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

import { debugLog, readFile } from './core/core';
import { AsyncStorage, nd_tokenDecode } from './async-storage';

/**
 * EasyStorageAsync:
 * - Single-file JSON blob kept in RAM, synced to disk without blocking UI
 * - Perfect for larger settings/prefs that might cause stutter with sync writes
 * - Queued autosave prevents overwhelming the storage system
 * - Same API as EasyStorage but all operations use callbacks
 * - Uses the same file `easy_storage.json` by default and maintains compatibility with older saves created by `EasyStorage`
 */
export class EasyStorageAsync {
  #filename;
  #content_obj = {};
  #autosave = true;
  #is_ready = false;

  constructor(filename = "easy_storage.json", callback) {
    this.#filename = filename;

    AsyncStorage.ReadJson(filename, (err, data) => {
      if (!this.#is_ready) {
        if (!err && data) this.#content_obj = data;
        this.#is_ready = true;
      }
      if (callback) callback(err, this);
    });
  }

  /**
   * Check if the storage has finished its initial asynchronous load.
   * ```
   * // example:
   * const t = Date.now();
   * (function waitUntilReady() {
   *   if (storage.isReady()) {
   *     console.log("loaded!", Date.now() - t, "ms");
   *     // safe to read keys now
   *     console.log("name:", storage.getKey("name"));
   *   } else {
   *     setTimeout(waitUntilReady, 5);
   *   }
   * })();
   * ```
   * @returns {boolean} `true` when ready, otherwise `false`.
   */
  isReady() {
    return this.#is_ready;
  }

  /**
   * Synchronously loads the storage file into RAM.
   * If you have to access the storage right away on page open use example below.
   * @example
   * if (!storage.isReady()) storage.synchronize();
   * // then access your keys
   * storage.getKey('my_key');
   * // ^ otherwise this might be undefined as initial DB load is async!
   * @returns {boolean}  `true` if parsing succeeded, `false` otherwise.
   */
  synchronize() {
    if (this.#is_ready) return true;

    try {
      const raw = readFile(this.#filename);
      if (raw) this.#content_obj = this.#parseMultiSync(raw);
    } catch (e) {
      debugLog(1, "[ASYNC] synchronize() read error:", e);
    }

    this.#is_ready = true;
    return this.#content_obj !== null;
  }

  /**
   * Sets a value for a specified key in the storage.
   * @param {string} key - The key to set the value for.
   * @param {*} value - The value to be set.
   * @param {Function} [callback] - Optional callback (err, success).
   * ```
   * // example: old approach maintains compatibility (also async)
   * storage.setKey('theme', 'dark');
   * // advanced example: new approach let's you know when the value finished storing
   * storage.setKey('theme', 'dark', (err, ok) => {
   *   if (ok) console.log('saved without blocking UI');
   * });
   * ```
   */
  setKey(key, value, callback) {
    debugLog(2, `[ASYNC] Saving key: ${key} with value: ${value}`);
    this.#content_obj[key] = value;

    if (this.#autosave) {
      this.saveAll(callback);
    } else if (callback) {
      callback(null, true);
    }
  }

  /**
   * Retrieves the value associated with the specified key from the storage.
   * @param {string} key - The key whose value to retrieve.
   * @param {*} [default_value=""] - The default value to return if key doesn't exist.
   * @returns {*} The value (synchronous - data is already in RAM).
   */
  getKey(key, default_value = "") {
    debugLog(3, `[ASYNC] Retrieving key: ${key}`);
    if (Object.prototype.hasOwnProperty.call(this.#content_obj, key)) {
      const value = this.#content_obj[key];
      debugLog(2, `[ASYNC] Found value for key '${key}': ${value}`);
      return value;
    }
    debugLog(3, `[ASYNC] Key '${key}' not found, returning default: ${default_value}`);
    return default_value === "" ? undefined : default_value;
  }

  /**
   * Checks if the specified key exists in the storage.
   * @param {string} key - The key to check for existence.
   * @returns {boolean} True if the key exists.
   */
  hasKey(key) {
    return Object.prototype.hasOwnProperty.call(this.#content_obj, key);
  }

  /**
   * Removes the specified key and its associated value from the storage.
   * @param {string} key - The key to remove.
   * @param {Function} [callback] - Optional callback (err, success).
   */
  removeKey(key, callback) {
    delete this.#content_obj[key];
    if (this.#autosave) {
      this.saveAll(callback);
    } else if (callback) {
      callback(null, true);
    }
  }

  /**
   * Saves all current key-value pairs without blocking the UI.
   * @param {Function} [callback] - Optional callback (err, success).
   */
  saveAll(callback) {
    AsyncStorage.WriteJson(this.#filename, this.#content_obj, callback || function () { });
  }

  /**
   * Clears all key-value pairs in the storage.
   * @param {Function} [callback] - Optional callback (err, success).
   */
  deleteAll(callback) {
    this.#content_obj = {};
    this.saveAll(callback);
  }

  /**
   * Returns the entire storage object.
   * @param {boolean} [stringify=false] - If true, returns JSON string.
   * @returns {string|object} The storage contents.
   */
  getStorageSnapshot(stringify = false) {
    return stringify ? JSON.stringify(this.#content_obj) : this.#content_obj;
  }

  /**
   * Force-save any pending data before app shutdown.
   * @returns {Object} Result with saved count.
   */
  saveAndQuit() {
    return AsyncStorage.SaveAndQuit();
  }

  /**
   * Enables or disables the autosave feature.
   * @param {boolean} bool - `true` to enable autosave, `false` to disable.
   * @examples
   * ```js
   * // example: enable autosave feature
   * storage.SetAutosaveEnable(true);
   * ```
   */
  SetAutosaveEnable(bool) { this.#autosave = bool; }

  /**
   * Sets the filename for the storage file.
   * @param {string} filename - The new filename to use for the storage.
   * @examples
   * ```js
   * // example: change the storage filename
   * storage.SetStorageFilename('new_storage.json');
   * ```
   */
  SetStorageFilename(filename) { this.#filename = filename; }

  /**
   * Retrieves the current filename used for the storage.
   * @returns {string} The current filename.
   * @examples
   * ```js
   * // example: get the current storage filename
   * console.log(storage.GetStorageFilename()); // "easy_storage.json"
   * ```
   */
  GetStorageFilename() { return this.#filename; }

  /**
   * Prints the contents of the storage to the console.
   * @examples
   * ```js
   * // example: log current storage contents
   * storage.printContents();
   * ```
   */
  printContents() {
    console.log("Storage contents: " + JSON.stringify(this.#content_obj));
  }

  /**
   * Check if storage system is too busy for new operations.
   * @returns {boolean} True if you should throttle operations.
   */
  isBusy() {
    return AsyncStorage.IsBusy();
  }

  #parseMultiSync(raw) {
    const lines = raw.trim().split("\n");
    if (!lines.length) return {};

    let first;
    try {
      first = nd_tokenDecode(JSON.parse(lines[0]));
    } catch (_) {
      return JSON.parse(raw);
    }

    if (!first || first.type !== "meta") {
      return JSON.parse(raw);
    }

    const res = {};
    const arrays = {};

    for (let i = 0; i < lines.length; i++) {
      let obj;
      try {
        obj = nd_tokenDecode(JSON.parse(lines[i]));
      } catch (_) {
        continue;
      }

      if (obj.type === "meta") {
        const arr_fields = obj.__arrays || [];
        Object.keys(obj).forEach(k => {
          if (k === "type" || k === "__arrays") return;
          if (arr_fields.includes(k)) {
            arrays[k] = [];
            res[k] = arrays[k];
          } else {
            res[k] = obj[k];
          }
        });
      } else {
        const k = obj.type;
        if (!arrays[k]) {
          arrays[k] = [];
          res[k] = arrays[k];
        }
        arrays[k].push(obj.data);
      }
    }
    return res;
  }
}