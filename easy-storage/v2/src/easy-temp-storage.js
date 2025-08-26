/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

/**
 * EasyTempStorage:
 * - Pure in-memory key-value cache, zero disk I/O
 * - Fastest choice for data that matters only while the app is open
 * - Cleared automatically on exit; no cleanup needed
 * - Shares EasyStorage-style API for easy swapping
 */
export class EasyTempStorage {
  #content_obj = {};

  constructor() {
    this.#content_obj = {};
  }

  /**
   * Sets the value for a specified key in the temporary storage.
   * @param {string} key - The key to associate the value with.
   * @param {*} value - The value to store.
   */
  setKey(key, value) {
    this.#content_obj[key] = value;
  }

  /**
   * Retrieves the value for a specified key from the temporary storage.
   * @param {string} key - The key to retrieve the value for.
   * @param {*} [defaultValue=""] - The default value to return if the key is not found.
   * @returns {*} The value associated with the key, or the default value if the key is not found.
   */
  getKey(key, default_val = "") {
    return Object.prototype.hasOwnProperty.call(this.#content_obj, key)
      ? this.#content_obj[key]
      : default_val;
  }

  /**
   * Checks if a specified key exists in the temporary storage.
   * @param {string} key - The key to check.
   * @returns {boolean} `true` if the key exists, otherwise `false`.
   */
  hasKey(key) {
    return Object.prototype.hasOwnProperty.call(this.#content_obj, key);
  }

  /**
   * Removes a specified key and its associated value from the temporary storage.
   * @param {string} key - The key to remove.
   */
  removeKey(key) {
    delete this.#content_obj[key];
  }

  /**
   * Clears all keys and their associated values from the temporary storage.
   */
  deleteAll() {
    this.#content_obj = {};
  }

  /**
   * Prints all keys and their associated values to the console.
   */
  printAllKeys() {
    console.log(
      "Temporary Storage Contents:",
      JSON.stringify(this.#content_obj, null, 2)
    );
  }

  /**
   * Retrieves all keys from the temporary storage.
   * @param {boolean} [stringify=false] - If `true`, returns the keys as a JSON string; otherwise, returns an array of keys.
   * @returns {string|array} The keys in the storage as a JSON string if `stringify` is true, or as an array if `stringify` is false.
   */
  getAllKeys(stringify = false) {
    const keys = Object.keys(this.#content_obj);
    return stringify ? JSON.stringify(keys) : keys;
  }
}