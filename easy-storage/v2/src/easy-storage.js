/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

import { debugLog } from './core/core';
import { Storage } from './storage';

/**
 * EasyStorage:
 * - Single-file JSON blob kept in RAM, synced to disk on every change
 * - Perfect for small settings or user prefs reads/writes
 * - Autosave guarantees data survives app restarts
 * - Simple but rewrites entire file; not ideal for very large datasets
 */
export class EasyStorage {
  #filename; // specify the name of you database
  #content_obj = {};
  #autosave = true; // should autosave on each write action?

  constructor(filename = "easy_storage.json") {
    this.#filename = filename;
    this.#content_obj = Storage.ReadJson(filename);
  }

  /**
   * Sets a value for a specified key in the storage.
   * @param {string} key - The key to set the value for.
   * @param {*} value - The value to be set.
   * @examples
   * ```js
   * // example: write a simple variable
   * storage.setKey('name', 'John Doe');
   * // advanced example: write the whole JSON into a singular key
   * storage.setKey('user', { name: 'John Doe', age: 30 });
   * ```
   */
  setKey(key, value) {
    debugLog(2, `Saving key: ${key} with value: ${value}`);
    this.#content_obj[key] = value;
    if (this.#autosave) this.saveAll();
  }

  /**
   * Retrieves the value associated with the specified key from the storage. If the key is not found, returns a default value or "undefined".
   * @param {string} key - The key whose value to retrieve.
   * @param {*} [default_value=""] - The default value to return if the key does not exist.
   * @returns {*} The value associated with the key, the default value if the key doesn't exist, or "undefined".
   * @examples
   * ```js
   * // example: retrieve an existing key
   * console.log(storage.getKey('name')); // "John Doe"
   *
   * // example: retrieve a non-existing key with a default value
   * console.log(storage.getKey('age', 25)); // 25
   * ```
   */
  getKey(key, default_value = "") {
    debugLog(3, `Retrieving key: ${key}`);
    if (Object.prototype.hasOwnProperty.call(this.#content_obj, key)) {
      const value = this.#content_obj[key]; // .toString() removed
      debugLog(2, `Found value for key '${key}': ${value}`);
      return value;
    }
    debugLog(3, `Key '${key}' not found, returning default value: ${default_value}`);
    return default_value === "" ? undefined : default_value;
  }

  /**
   * Checks if the specified key exists in the storage.
   * @param {string} key - The key to check for existence.
   * @returns {boolean} `true` if the key exists, `false` otherwise.
   * @examples
   * ```js
   * // example: check an existing key
   * console.log(storage.hasKey('name')); // true
   *
   * // example: check a non-existing key
   * console.log(storage.hasKey('non_existing_key')); // false
   * ```
   */
  hasKey(key) {
    return Object.prototype.hasOwnProperty.call(this.#content_obj, key);
  }

  /**
   * Removes the specified key and its associated value from the storage.
   * @param {string} key - The key to remove.
   * @examples
   * ```js
   * // example: remove an existing key
   * storage.removeKey('name');
   * ```
   */
  removeKey(key) {
    delete this.#content_obj[key];
    if (this.#autosave) this.saveAll();
  }

  /**
   * Saves all current key-value pairs in the storage to the file. This method is typically used when autosave is disabled.
   * @examples
   * ```js
   * // example: explicitly save all changes to the storage
   * storage.saveAll();
   * ```
   */
  saveAll() {
    Storage.WriteJson(this.GetStorageFilename(), this.#content_obj);
  }

  /**
   * Clears all key-value pairs in the storage and optionally saves the changes if autosave is enabled.
   * @examples
   * ```js
   * // example: clear all storage contents
   * storage.deleteAll();
   * ```
   */
  deleteAll() {
    this.#content_obj = {};
    if (this.#autosave) this.saveAll();
  }

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
   * Returns the entire storage object, optionally as a JSON string.
   * @param {boolean} [stringify=false] - If `true`, returns the storage contents as a JSON string; otherwise, returns the object itself.
   * @returns {string|object} The storage contents as a JSON string if `stringify` is true, or as an object if `stringify` is false.
   * @examples
   * ```js
   * // example: get all storage keys as an object
   * const snapshot = storage.getStorageSnapshot();
   * console.log(JSON.stringify(keys));
   *
   * // example: get all storage keys as a string
   * console.log(storage.getStorageSnapshot(true));
   * ```
   */
  getStorageSnapshot(stringify = false) {
    // @upd 1.4.1
    return stringify ? JSON.stringify(this.#content_obj) : this.#content_obj;
  }

  // note: these low-used getters and setters are Capitalized for purpose of decluttering
  // the most used getKey and setKey methods during the auto-completion

  /**
   * Enables or disables the autosave feature.
   * @param {boolean} bool - `true` to enable autosave, `false` to disable.
   * @examples
   * ```js
   * // example: enable autosave feature
   * storage.SetAutosaveEnable(true);
   * ```
   */
  SetAutosaveEnable(bool) {
    this.#autosave = bool;
  }

  /**
   * Sets the filename for the storage file.
   * @param {string} filename - The new filename to use for the storage.
   * @examples
   * ```js
   * // example: change the storage filename
   * storage.SetStorageFilename('new_storage.json');
   * ```
   */
  SetStorageFilename(filename) {
    this.#filename = filename;
  }

  /**
   * Retrieves the current filename used for the storage.
   * @returns {string} The current filename.
   * @examples
   * ```js
   * // example: get the current storage filename
   * console.log(storage.GetStorageFilename()); // "easy_storage.json"
   * ```
   */
  GetStorageFilename() {
    return this.#filename;
  }
}