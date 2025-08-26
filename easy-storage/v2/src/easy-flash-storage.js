/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

import { debugLog } from './core/core';
import { Storage } from './storage';

/**
 * EasyFlashStorage: 
 * - Handles data sets that are too large for EasyStorage's single-blob model
 * - Minimizes RAM usage – only the file you're working with is loaded
 * - Reduces flash wear: small writes instead of rewriting a big file
 * - Survives unexpected reboots; corruption is isolated to one key
 */
export class EasyFlashStorage { // @add 1.4.0
  #directory;

  /**
   * Initializes the EasyFlashStorage with a specified directory.
   * @param {string} [directory="easy_flash_storage"] - The directory to use for storage.
   * @example
   * ```js
   * const storage = new EasyFlashStorage('my_custom_directory');
   * ```
   */
  constructor(directory = "easy_flash_storage") { // @rem 1.6.2
    this.#directory = directory;
    Storage.MakeDirectory(this.#directory);
  }

  /**
   * Sets a key with the given value in the storage. If the key already exists, it updates the value. The operation is automatically saved to the index file, debounced to reduce disk writes.
   * @param {string} key - The key to set or update in the storage.
   * @param {*} value - The value to associate with the key, which will be JSON stringified.
   * @example
   * ```js
   * storage.setKey('user', { name: 'John Doe', age: 30 });
   * ```
   */
  setKey(key, value) {
    const data = JSON.stringify(value);
    // the data is stored as an arraybuf
    Storage.WriteFile(`${this.#directory}/${key}`, data);
  }

  /**
   * Retrieves the value associated with the specified key. If the key does not exist, returns `undefined`.
   * @param {string} key - The key to retrieve the value for.
   * @returns {*} The value associated with the key, or `undefined` if the key does not exist.
   * @example
   * ```js
   * console.log(storage.getKey('user')); // outputs the user object or `undefined`
   * ```
   */
  getKey(key) { // @upd 1.6.5
    try {
      const file_content = Storage.ReadFile(`${this.#directory}/${key}`);
      debugLog(3, `Content for key ${key}:`, file_content);
      if (!file_content) {
        debugLog(1, `File content is empty for key ${key}`);
        return undefined;
      }
      const parsed_content = this.#parseJSON(file_content);
      if (parsed_content === null) {
        debugLog(1, `Failed to parse JSON for key ${key}`);
      }
      return parsed_content;
    } catch (error) {
      debugLog(1, "Error accessing or parsing file:", error);
      return undefined;
    }
  }

  /**
   * Removes the specified key (and its associated value) from the storage. The change is automatically reflected in the index file, debounced to reduce disk writes.
   * @param {string} key - The key to remove from the storage.
   * @example
   * ```js
   * storage.removeKey('user');
   * ```
   */
  removeKey(key) {
    if (this.hasKey(key)) {
      Storage.RemoveFile(`${this.#directory}/${key}`);
    }
  }

  // note: (!) doesn't treat empty files as non-existent as a key with an empty value is meaningful
  /**
   * Checks if the specified key exists in the storage.
   * @param {string} key - The key to check for existence.
   * @returns {boolean} `true` if the key exists, `false` otherwise.
   * @example
   * ```js
   * if(storage.hasKey('user')) {
   *     console.log('User exists');
   * } else {
   *     console.log('User does not exist');
   * }
   * ```
   */
  hasKey(key) {
    return Storage.Exists(`${this.#directory}/${key}`);
  }

  /**
   * Checks if the storage is empty (contains no keys).
   * @returns {boolean} `true` if the storage is empty, `false` otherwise.
   * @example
   * ```js
   * console.log(storage.isEmpty()); // true or false
   * ```
   */
  isEmpty() {
    const keys = Storage.ListDirectory(this.#directory);
    return keys.length === 0 || (keys.length === 1 && keys.includes("index"));
  }

  /**
   * Counts the number of keys in the storage.
   * @returns {number} The number of keys in the storage.
   * @example
   * ```js
   * console.log(storage.count()); // outputs the number of keys
   * ```
   */
  count() {
    const keys = Storage.ListDirectory(this.#directory);
    // ignore index file if it's stil thre
    return keys.includes("index") ? keys.length - 1 : keys.length;
  }

  // Note: the overhead of each file is 2 bytes. ie 6 byte file = 8 bytes.
  /**
   * Calculates the size of the data associated with a specific key, or returns 0 if the key does not exist.
   * @param {string} key - The key to calculate the size for.
   * @param {string} [unit='B'] - The unit for the size measurement ('B' for bytes, 'KB' for kilobytes, 'MB' for megabytes).
   * @returns {number} The size of the data in the specified unit, or 0 if the key does not exist.
   * @example
   * ```js
   * // example: get the size of 'user' data in bytes
   * console.log(storage.dataSize('user'));
   *
   * // example: get the size of 'user' data in kilobytes
   * console.log(storage.dataSize('user', 'KB'));
   * ```
   */
  dataSize(key, unit = "B") {
    if (this.hasKey(key)) {
      let stat = Storage.FileInfo(`${this.#directory}/${key}`);
      let size = stat ? stat.size : 0;
      return this.#convertSize(size, unit);
    } else {
      return 0;
    }
  }

  /**
   * Calculates the total size of all files stored in the directory.
   * @param {string} [unit='B'] - The unit for the total size measurement ('B' for bytes, 'KB' for kilobytes, 'MB' for megabytes).
   * @returns {number} The total size of all files in the specified unit.
   * @example
   * ```js
   * // example: get the total storage size in bytes
   * console.log(storage.size());
   *
   * // example: get the total storage size in kilobytes
   * console.log(storage.size('KB'));
   * ```
   */
  size(unit = "B") {
    let ttl_size = 0;
    const keys = Storage.ListDirectory(this.#directory);
    keys.forEach((key) => {
      if (key === "index") return; // skip index file
      const stat = Storage.FileInfo(`${this.#directory}/${key}`);
      if (stat) ttl_size += stat.size;
    });
    return this.#convertSize(ttl_size, unit);
  }

  /**
   * Retrieves all keys from the storage, optionally stringified.
   * @param {boolean} [stringify=false] - If `true`, returns the keys as a JSON string; otherwise, returns an array of keys.
   * @returns {string|array} The keys in the storage as a JSON string if `stringify` is true, or as an array if `stringify` is false.
   * @example
   * ```js
   * // example: get all storage keys as an array
   * const keys = storage.getAllKeys();
   * console.log(keys);
   *
   * // example: get all storage keys as a string
   * const str_keys = storage.getAllKeys(true);
   * console.log(str_keys);
   * ```
   */
  getAllKeys(stringify = false) {
    const keys = Storage.ListDirectory(this.#directory);
    return stringify ? JSON.stringify(keys) : keys;
  }

  /**
   * Retrieves all values from the storage, optionally stringified.
   * @param {boolean} [stringify=false] - If `true`, returns the values as a JSON string; otherwise, returns an array of values.
   * @returns {string|array} The values in the storage as a JSON string if `stringify` is true, or as an array if `stringify` is false.
   * @example
   * ```js
   * // example: get all storage values as an array
   * const values = storage.getAllValues();
   * console.log(values);
   *
   * // example: get all storage values as a string
   * const str_values = storage.getAllValues(true);
   * console.log(str_values);
   * ```
   */
  getAllValues(stringify = false) {
    // @add 1.6.0
    let values = [];
    const keys = Storage.ListDirectory(this.#directory);
    values = keys.map((key) => this.getKey(key));
    values = values.filter((value) => value !== undefined); // filter undefined
    return stringify ? JSON.stringify(values) : values;
  }

  /**
   * Retrieves all key-value pairs from the storage, optionally stringified.
   * @param {boolean} [stringify=false] - If `true`, returns the storage contents as a JSON string; otherwise, returns an object.
   * @returns {string|object} The storage contents as a JSON string if `stringify` is true, or as an object if `stringify` is false.
   * @example
   * ```js
   * // example: get all storage contents as an object
   * const contents = storage.getStorageSnapshot();
   * console.log(contents);
   *
   * // example: get all storage contents as a JSON string
   * const str_contents = storage.getStorageSnapshot(true);
   * console.log(str_contents);
   * ```
   */
  getStorageSnapshot(stringify = false) {
    // @add 1.6.0
    const keys = this.getAllKeys();
    const contents = keys.reduce((acc, key) => {
      try {
        const file_content = Storage.ReadFile(`${this.#directory}/${key}`);
        acc[key] = JSON.parse(file_content);
      } catch (error) {
        debugLog(1, `Error parsing JSON from file for key ${key}:`, error);
      }
      return acc;
    }, {});

    return stringify ? JSON.stringify(contents) : contents;
  }

  /**
   * Removes all keys and their associated values from the storage.
   * Essentially removing files from the disk.
   * @example
   * ```js
   * storage.deleteAll(); // clears the storage
   * ```
   */
  deleteAll() {
    let keys = this.getAllKeys();
    for (let key of keys) {
      this.removeKey(key);
    }
  }

  /**
   * Prints all keys and their associated values to the console.
   * @example
   * ```js
   * storage.printAllKeys(); // logs all keys and values
   * ```
   */
  printAllKeys() {
    let keys = this.getAllKeys();
    for (let key of keys) {
      console.log(key + ": " + this.getKey(key));
    }
  }

  // default unit is Byte
  #convertSize(size, unit) {
    let result;
    switch (unit) {
      case "KB": 	result = size / 1024; 			  break;
      case "MB": 	result = size / 1024 / 1024; 	break;
      default: 		result = size; 					      break; // "B"
    }
    return Number(result.toFixed(2));
  }

  #parseJSON(content) { // @add 1.6.6 getKey addition
    try {
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
}