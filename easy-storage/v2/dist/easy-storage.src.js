/** @about Easy Storage 1.6.7 @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */
import {
  statSync, readSync, readFileSync, writeFileSync, closeSync, openAssetsSync, 
  mkdirSync, openSync, writeSync, rmSync, readdirSync,
  O_RDONLY, O_CREAT, O_WRONLY, O_RDWR, O_TRUNC,
} from "@zos/fs";

const DEBUG_LOG_LEVEL = 1;
const ERR_DEPRECATED = "This method is deprecated and will be removed in the future.";

/**
 * EasyStorage: A lightweight, JSON storage solution designed for managing simple data structures efficiently.
 * Ideal for small-scale applications or temporary data holding, it automates the persistence of changes to ensure data
 * integrity. Your data is permanently stored on the device and will be restored next time the app is open.
 * The whole database remains in RAM and filesystem.
 * */
class EasyStorage {
  #filename; // specify the name of you database
  #content_obj = {};
  #autosave = true; // should autosave on each write action?

  constructor(filename = "easy_storage.json") {
    this.#filename = filename;
    this.#content_obj = loadJson(filename);
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
      const value = this.#content_obj[key].toString();
      debugLog(2, `Found value for key '${key}': ${value}`);
      return value;
    }
    debugLog(
      3,
      `Key '${key}' not found, returning default value: ${default_value}`
    );
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
    saveJson(this.GetStorageFilename(), this.#content_obj);
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

  /**
   * @deprecated This method is deprecated and will be removed in the future. Please use getStorageSnapshot instead.
   */
  getAllKeys(stringify = false) {
    console.log(ERR_DEPRECATED, "Please use getStorageSnapshot instead.");
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

/**
 * EasyFlashStorage: An extension of EasyStorage, tailored for handling larger datasets by offloading data
 * to the filesystem. It offers a more scalable storage option while maintaining a minimalistic API, making it
 * suitable for applications with heavier data requirements.
 * */
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
    makeDirectory(this.#directory);
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
    writeFile(`${this.#directory}/${key}`, data);
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
      const file_content = readFile(`${this.#directory}/${key}`);
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
      removeFile(`${this.#directory}/${key}`);
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
    const result = statSync({ path: this.#directory + "/" + key });
    return result !== undefined;
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
    const keys = listDirectory(this.#directory);
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
    const keys = listDirectory(this.#directory);
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
      let stat = statSync({ path: this.#directory + "/" + key });
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
    const keys = listDirectory(this.#directory);
    keys.forEach((key) => {
      if (key === "index") return; // skip index file
      const stat = statSync({ path: `${this.#directory}/${key}` });
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
    const keys = listDirectory(this.#directory);
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
    const keys = listDirectory(this.#directory);
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
        const file_content = readFile(`${this.#directory}/${key}`);
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
      case "KB": 	result = size / 1024; 			break;
      case "MB": 	result = size / 1024 / 1024; 	break;
      default: 		result = size; 					break; // "B"
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

/**
 * EasyTempStorage provides a temporary, in-memory key-value store.
 * It's designed for temporary data storage within the lifespan of the application.
 * Data stored in EasyTempStorage is not persisted to disk and will be lost when the application is closed,
 * making it suitable for transient data that does not require long-term persistence.
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

/**
 * Storage: A utility library providing static methods for direct file operations,
 * including reading and writing JSON objects, text, and binary data.
 * */
export class Storage {
  /**
   * Writes a JSON object to a specified file.
   * @param {string} filename - The name of the file to write the JSON object to.
   * @param {object} json - The JSON object to be written.
   * @example
   * ```js
   * Storage.WriteJson('config.json', { key: 'value' });
   * ```
   */
  static WriteJson(filename, json) {
    saveJson(filename, json);
  }

  /**
   * Reads a JSON object from a specified file.
   * @param {string} filename - The name of the file to read the JSON object from.
   * @return {object} The JSON object read from the file.
   * @example
   * ```js
   * const config = Storage.ReadJson('config.json');
   * ```
   */
  static ReadJson(filename) {
    return loadJson(filename);
  }

  /**
   * Writes data to a specified file.
   * @param {string} filename - The name of the file to write data to.
   * @param {string|ArrayBuffer} data - The data to be written.
   * @example
   * ```js
   * Storage.WriteFile('example.txt', 'Hello, World!');
   * ```
   */
  static WriteFile(filename, data) {
    writeFile(filename, data);
  }

  /**
   * Reads data from a specified file.
   * @param {string} filename - The name of the file to read data from.
   * @return {string} The data read from the file.
   * @example
   * ```js
   * const data = Storage.ReadFile('example.txt');
   * ```
   */
  static ReadFile(filename) {
    return readFile(filename);
  }

  /**
   * Removes a specified file from the filesystem.
   * @param {string} filename - The name of the file to be removed.
   * @example
   * ```js
   * Storage.RemoveFile('obsolete_data.txt');
   * ```
   */
  static RemoveFile(filename) {
    return removeFile(filename);
  }

  /**
   * Writes data to a specified asset file.
   * @param {string} filename - The name of the asset file to write data to.
   * @param {string|ArrayBuffer} data - The data to be written.
   * @example
   * ```js
   * Storage.WriteAsset('image.png', image_data);
   * ```
   */
  static WriteAsset(filename, data) {
    writeAsset(filename, data);
  }

  /**
   * Reads data from a specified asset file.
   * @param {string} filename - The name of the asset file to read data from.
   * @return {string} The data read from the asset file.
   * @example
   * ```js
   * const image = Storage.ReadAsset('image.png');
   * ```
   */
  static ReadAsset(filename) {
    return readAsset(filename);
  }

  /**
   * Creates a new directory with the specified name. If the directory already exists, the behavior may depend on the underlying filesystem's implementation (it might throw an error or do nothing).
   * @param {string} dirname - The name (and path) of the directory to create.
   * @example
   * ```js
   * Storage.MakeDirectory('new_folder');
   * ```
   */
  static MakeDirectory(dirname) {
    return makeDirectory(dirname);
  }

  /**
   * Lists all files and directories within the specified directory. This method is useful for retrieving the contents of a directory to process or display them, such as generating a list of available files or performing operations on each file.
   * @param {string} dirname - The name (and path) of the directory whose contents are to be listed.
   * @return {string[]} An array of names representing the contents of the directory. This may include both files and directories.
   * @example
   * ```js
   * const contents = Storage.ListDirectory('documents');
   * console.log(contents); // Outputs: ['file1.txt', 'file2.txt', 'subdirectory']
   * ```
   */
  static ListDirectory(dirname) {
    return listDirectory(dirname);
  }
}

/**
 * EasyTSDB: A time-series database extension, optimized for efficient storage and retrieval of time-series data.
 * It uses a combination of RAM and filesystem storage to manage data efficiently, with capabilities to handle
 * data flushes to disk upon reaching RAM capacity limits. Designed for applications requiring efficient time-series
 * data management with options for custom aggregation and querying over specific time ranges.
 */
export class EasyTSDB { // @add 1.6.0
  #data_in_ram = {}; // data storage in RAM that flushes to disk on overflow
  #query_cache = {};
  #index = {}; // map
  #cur_index_checksum = "";
  #has_pending_writes = false;
  #db_cleared = false;
  #autosave_timeout_id = null;

  #defaults = {
    directory: "easy_timeseries_db",
    time_frame: "hour", // determines folder structure, not the autosave interval
    max_ram: 0.2 * 1024 * 1024, // 200KB of RAM after which the forced flush happens
    autosave_interval: 600, // 5 minutes in seconds
  };
  #user_options;

  /**
   * Initializes the EasyTSDB with customizable options. It sets up the necessary directory structures and loads any existing index data.
   * @param {Object} options - Configuration options for the database setup.
   * @examples
   * ```js
   * // example: basic initialization with default options
   * const db = new EasyTSDB();
   *
   * // advanced example: initialization with custom settings
   * const db = new EasyTSDB({
   *     directory: 'custom_timeseries_db',
   *     time_frame: 'minute',
   *     max_ram: 500 * 1024, // 500KB
   *     autosave_interval: 120 // 2 minutes in seconds
   * });
   * ```
   */
  constructor(options = {}) {
    this.#user_options = { ...this.#defaults, ...options };
    this.#setupDirectoryStructure();
    this.#loadIndex();
  }

  /**
   * Writes a data point to the database, managing temporary RAM storage and flushing to disk based on predefined thresholds.
   * @param {string} measurement - The name of the measurement.
   * @param {*} value - The value associated with the data point.
   * @param {number} [timestamp=Date.now()] - The timestamp for the data point. Defaults to the current time.
   * @examples
   * ```js
   * // example: write a temperature value without specifying a timestamp
   * db.writePoint('temperature', 23.5);
   * // advanced example: write a humidity value with a specific timestamp
   * db.writePoint('humidity', 55, new Date('2024-03-14T15:00:00Z').getTime());
   * ```
   */
  writePoint(measurement, value, timestamp = Date.now()) {
    const date = new Date(timestamp);

    // convert date components to UTC
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");

    const base_path = `${this.#user_options.directory}/${year}_${month}_${day}`;
    let file_path = base_path;

    if (this.#user_options.time_frame === "hour") {
      file_path = `${base_path}_${hour}.json`;
    } else if (this.#user_options.time_frame === "minute") {
      file_path = `${base_path}_${hour}_${minute}.json`;
    }

    if (!this.#data_in_ram[file_path]) {
      this.#data_in_ram[file_path] = [];
    }

    this.#data_in_ram[file_path].push({
      m: measurement,
      v: value,
      t: timestamp,
    }); // optimized

    // handling persistence
    this.#has_pending_writes = true;
    this.#resetAutosaveTimeout(); // debounce

    // check if current RAM usage exceeds the max_ram limit - flush if necessary
    if (this.#calculateUsageOfRAM() > this.#user_options.max_ram) {
      this.flush();
    }
  }

  /**
   * Forces the immediate flushing of all data from RAM to disk, ensuring data persistence and durability.
   * @examples
   * ```js
   * // example: manually trigger a flush to disk without waiting for autosave
   * db.flush();
   * ```
   */
  flush() {
    if (!this.#has_pending_writes && !this.#db_cleared) {
      return;
    }

    for (const [file_path, new_data_points] of Object.entries(
      this.#data_in_ram
    )) {
      let old_data_points = [];
      if (dirOrFileExists(file_path)) {
        const old_data_str = readFile(file_path);
        if (old_data_str) {
          old_data_points = JSON.parse(old_data_str);
        }
      }

      const merged_data_points = old_data_points.concat(new_data_points);
      writeFile(file_path, JSON.stringify(merged_data_points));

      this.#updateIndex(file_path);
    }

    this.#persistIndexIfNeeded();
    this.#has_pending_writes = false;
    this.#db_cleared = false;
    this.#data_in_ram = {};
  }

  /**
   * Queries the database for data points within a specified time range, applying aggregation according to the specified type.
   * Supports custom aggregation functions for advanced data processing.
   * @param {number} start_time - The start timestamp for the query range, in milliseconds since the Unix epoch.
   * @param {number} end_time - The end timestamp for the query range, in milliseconds since the Unix epoch.
   * @param {string} aggregation_type - The type of aggregation to apply (e.g., 'sum', 'average', 'min', 'max').
   * @param {Function} [cb_custom_aggregator=null] - An optional custom aggregator function.
   * @examples
   * ```js
   * // example: query the sum of 'temperature' measurements over the last 24 hours
   * const start_time = Date.now() - 60 * 60 * 24 * 1000; // 24 hours ago
   * const end_time = Date.now();
   * const result = db.query(start_time, end_time, 'sum');
   *
   * // advanced example: use a custom aggregation function to calculate the weighted average
   * const myWeightedAverage_CustomAggregator = (data_points) => {
   *     let total = 0;
   *     let weight_sum = 0;
   *     data_points.forEach(point => {
   *         total += point.value * point.weight;
   *         weight_sum += point.weight;
   *     });
   *     return total / weight_sum;
   * };
   * const weighted_avg = db.query(start_time, end_time, 'custom', myWeightedAverage_CustomAggregator);
   * ```
   */
  query(start_time, end_time, aggregation_type, cb_custom_aggregator = null) {
    // convert to UTC strings for consistent comparison, if user didn't do it
    const start_utc = new Date(start_time).toISOString();
    const end_utc = new Date(end_time).toISOString();
    // cache identical queries
    const cache_key = `${start_utc}_${end_utc}_${aggregation_type}`;
    if (this.#query_cache[cache_key]) {
      return this.#query_cache[cache_key];
    }

    const data_points = this.#collectDataPointsForRange(start_utc, end_utc);
    debugLog(
      3,
      `Querying from ${start_utc} to ${end_utc} with type ${aggregation_type}`
    );
    debugLog(3, "data_points:", data_points);
    let result;

    // custom aggregator
    if (cb_custom_aggregator && typeof cb_custom_aggregator === "function") {
      result = cb_custom_aggregator(data_points);
    } else {
      result = this.#performBuiltInAggregation(data_points, aggregation_type);
    }

    this.#query_cache[cache_key] = result;
    return result;
  }

  /**
   * Retrieves a series of raw data points within a specified time range.
   * This method is useful for obtaining the raw data points for visualization or further custom processing outside of predefined aggregations.
   * It does not apply aggregations and is intended for retrieving raw data points.
   * @param {number} start_time - The start timestamp for the query range, in milliseconds since the Unix epoch.
   * @param {number} end_time - The end timestamp for the query range, in milliseconds since the Unix epoch.
   * @return {Array<Object>} An array of objects where each object represents a data point with `timestamp`, `value`, and `measurement` keys.
   * @examples
   * ```js
   * // example: etrieve heart rate data points over the last hour
   * const start_time = Date.now() - 60 * 60 * 1000; // 1 hour ago
   * const end_time = Date.now();
   * const data_points = db.retrieveDataSeries(start_time, end_time);
   * data_points.forEach(dp => {
   *     console.log(`At ${new Date(dp.timestamp).toISOString()} the heart rate was ${dp.value}`);
   * });
   *
   * //
   * ```
   */
  retrieveDataSeries(start_time, end_time) {
    const start_utc = new Date(start_time).toISOString();
    const end_utc = new Date(end_time).toISOString();

    const data_points = this.#collectDataPointsForRange(start_utc, end_utc);
    return data_points.map((dp) => ({
      timestamp: dp.t,
      value: dp.v,
      measurement: dp.m,
    }));
  }

  /**
   * Removes data points older than a specified threshold from the database. This can be useful for data retention policies or freeing up disk space.
   * @param {number} older_than - The timestamp in milliseconds since the Unix epoch. Data points older than this timestamp will be purged.
   * @examples
   * ```js
   * // example: purge data points older than 1 year
   * const one_year_ago = Date.now() - (365 * 24 * 60 * 60 * 1000);
   * db.purge(one_year_ago);
   *
   * // advanced example: purge data points older than a specific date, with logging
   * const specific_date = new Date('2023-01-01').getTime();
   * db.purge(specific_date);
   * console.log(`Data older than ${new Date(specific_date).toISOString()} has been purged.`);
   * ```
   */
  purge(older_than) {
    const threshold_date = new Date(older_than);
    let is_index_modified = false;

    for (const date in this.#index) {
      // convert to YYYY-MM-DD format for Date comparison as we store it with underscores
      const file_date = new Date(date.split("_").join("-"));
      if (file_date < threshold_date) {
        const day_index = this.#index[date];
        for (const hour in day_index) {
          if (this.#user_options.time_frame === "hour") {
            const file_path = `${
              this.#user_options.directory
            }/${date}_${hour}.json`;
            removeFile(file_path);
          } else {
            // 'minute' time frame
            for (const minute in day_index[hour]) {
              const file_path = `${
                this.#user_options.directory
              }/${date}_${hour}_${minute}.json`;
              removeFile(file_path);
            }
          }
        }
        delete this.#index[date]; // clean up index when data is gone
        is_index_modified = true;
      }
    }

    // persist changes to the index and its backup if modifications were made
    if (is_index_modified) {
      this.#persistIndex();
    }
  }

  /**
   * Clears all data from the database, requiring explicit consent to prevent accidental data loss. This operation cannot be undone.
   * @param {string} consent - Must explicitly be the string "YES" to indicate deliberate action.
   * @examples
   * ```js
   * // wrong example: attempt to clear the database without consent (operation will fail)
   * db.databaseClear();
   * // corrent example: provide explicit `consent` and clear the database
   * db.databaseClear('YES');
   * ```
   */
  databaseClear(consent) {
    if (consent !== "YES") {
      debugLog(
        1,
        "You have to pass 'YES' to indicate you know what you're doing."
      );
      return;
    }

    // clear any existing autosave timeout
    if (this.#autosave_timeout_id !== null) {
      clearTimeout(this.#autosave_timeout_id);
      this.#autosave_timeout_id = null;
    }

    const files = listDirectory(this.#user_options.directory);
    files.forEach((file) => {
      const full_path = `${this.#user_options.directory}/${file}`;
      removeFile(full_path);
    });

    // remove index files
    removeFile(`${this.#user_options.directory}/index.json`);
    removeFile(`${this.#user_options.directory}/index_backup.json`);

    // reset in-memory state
    this.#data_in_ram = {};
    this.#index = {};
    this.#query_cache = {};
    this.#db_cleared = true;
    this.#has_pending_writes = false;

    debugLog(3, "Database cleared successfully.");
  }

  /**
   * Gracefully closes the database, ensuring that all pending writes are flushed to disk and autosave timers are cleared. This should be called before application shutdown to prevent data loss.
   * @examples
   * ```js
   * // example: close the database on application destroy
   * onDestroy(){
   *     db.databaseClose();
   * }
   * ```
   */
  databaseClose() {
    // flush any pending writes or clear state
    if (this.#has_pending_writes || this.#db_cleared) {
      this.flush();
    }
    // stop autosave
    if (this.#autosave_timeout_id !== null) {
      clearTimeout(this.#autosave_timeout_id);
    }
    // sync index
    this.#persistIndexIfNeeded();
  }

  /**
   * Creates a backup of the entire database, including data points and optionally the index. The backup is saved to a specified file in JSON format.
   * @param {string} [backup_path='database_backup.json'] - The path where the database backup will be saved.
   * @param {boolean} [includeIndex=false] - Whether to include the database index in the backup.
   * @examples
   * ```js
   * // example: backup the database without the index
   * db.databaseBackup();
   * // advanced example: backup the database and include the index
   * db.databaseBackup('path/to/my_database_backup.json', true);
   * ```
   */
  databaseBackup(backup_path = "easy_tsdb_backup.json", include_index = false) {
    const backup_dir = "easy_tsdb_backups";
    const full_path = `${backup_dir}/${backup_path}`;

    // ensure the backup directory exists
    makeDirectory(backup_dir);

    const backup = {
      database_directory: this.#user_options.directory,
      data_points: {},
      index: include_index ? this.#index : undefined,
    };

    // gather all data points from each file within the database directory
    const files = listDirectory(this.#user_options.directory);
    files.forEach((file) => {
      if (file === "index.json" || file === "index_backup.json") {
        return; // skip index by default
      }
      const data = readFile(full_path);
      if (data) {
        backup.data_points[file] = JSON.parse(data);
      }
    });

    // include the index in the backup
    if (include_index) {
      backup.index = this.#index;
    }

    // convert the backup object to a JSON string
    const backup_json = JSON.stringify(backup, null, 2); // pretty print

    // save the JSON string to the specified backup path
    writeFile(backup_path, backup_json);

    debugLog(1, `Backup successfully saved to ${backup_path}`);
  }

  /**
   * Restores the database from a backup file, requiring explicit consent due to the potentially destructive nature of this operation. The index is either restored from the backup or recalculated, depending on the backup file and method arguments.
   * @param {string} consent - Must explicitly be the string "YES" to confirm the restore operation.
   * @param {string} [backup_path='database_backup.json'] - The path to the backup file from which to restore the database.
   * @param {boolean} [recalculate_index=true] - Whether to recalculate the index after restoration, ignored if the backup does not include the index.
   * @examples
   * ```js
   * // example: attempt to restore the database without consent (operation will fail)
   * db.databaseRestore();
   * // advanced example: provide explicit consent and restore the database, opting to recalculate the index
   * db.databaseRestore('YES', 'path/to/my_database_backup.json', true);
   * ```
   */
  databaseRestore(
    consent,
    backup_path = "easy_tsdb_backup.json",
    recalculate_index = true
  ) {
    if (consent !== "YES") {
      debugLog(1, "Explicit consent not provided. Restore operation aborted.");
      return;
    }

    const backup_dir = "easy_tsdb_backups";
    const full_path = `${backup_dir}/${backup_path}`;

    try {
      // read the backup file
      const backup = JSON.parse(readFile(full_path));

      // use the database directory name from the backup to set the directory of the current db instance
      this.#user_options.directory = backup.database_directory;

      // clear current database before restoration
      this.databaseClear("YES");

      // restore data points from backup
      Object.entries(backup.data_points).forEach(([file, data]) => {
        writeFile(full_path, JSON.stringify(data));
      });

      // if index is included and recalculation is not requested, restore the index from backup
      if (backup.index && !recalculate_index) {
        this.#index = backup.index;
      } else {
        // recalculate the index based on restored data points, if necessary
        this.#rebuildIndex();
      }

      debugLog(1, `Database successfully restored from ${backup_path}.`);
    } catch (error) {
      debugLog(1, "Failed to restore database:", error);
    }
  }

  #rebuildIndex() {
    debugLog(1, "Rebuilding index...");
    this.#index = {}; // reset index
    const files = listDirectory(this.#user_options.directory);
    files.forEach((file) => {
      if (file === "index.json" || file === "index_backup.json") {
        return; // skip index files
      }
      const file_path = `${this.#user_options.directory}/${file}`;
      const data = readFile(file_path);
      if (data) {
        backup.data_points[file] = JSON.parse(data);
      }
    });
    debugLog(1, "Index rebuilt.");
  }

  #resetAutosaveTimeout() {
    if (this.#autosave_timeout_id !== null) {
      clearTimeout(this.#autosave_timeout_id);
    }
    this.#autosave_timeout_id = setTimeout(() => {
      if (this.#has_pending_writes || this.#db_cleared) {
        this.flush();
        this.#db_cleared = false; // reset after flushing
        this.#persistIndexIfNeeded();
      }
    }, this.#defaults.autosave_interval * 1000); // convert to ms
  }

  #collectDataPointsForRange(start_time, end_time) {
    let bugfixed_start_time = new Date(start_time);
    // TODO: utc bugfix. why is our starting UTC 1 day in the future??
    bugfixed_start_time.setUTCDate(bugfixed_start_time.getUTCDate() - 1);

    let current = new Date(bugfixed_start_time.toISOString());
    const end = new Date(end_time);
    let data_points = [];

    while (current <= end) {
      const data_key = this.#generateDateKey(current);
      const hour = String(current.getUTCHours()).padStart(2, "0");
      const minute =
        this.#user_options.time_frame === "minute"
          ? String(current.getUTCMinutes()).padStart(2, "0")
          : null;

      if (
        this.#index[data_key] &&
        this.#index[data_key][hour] &&
        (!minute || this.#index[data_key][hour][minute])
      ) {
        const file_path =
          this.#user_options.time_frame === "hour"
            ? `${this.#user_options.directory}/${data_key}_${hour}.json`
            : `${
                this.#user_options.directory
              }/${data_key}_${hour}_${minute}.json`;

        const file_data_points = this.#getDataPointsFromFile(file_path);
        data_points = [...data_points, ...file_data_points];
      }

      current = this.#incrementDate(current);
    }

    return data_points;
  }

  #getDataPointsFromFile(file_path) {
    // check if the file exists before attempting to read it
    if (!dirOrFileExists(file_path)) {
      debugLog(1, `No data file at path: ${file_path}, moving on.`);
      return [];
    }

    try {
      // file exists -> read it
      const data_points_str = readFile(file_path);
      // ensure the file is not empty and contains valid JSON before attempting to parse
      if (data_points_str.trim().length > 0) {
        const data_points = JSON.parse(data_points_str);
        debugLog(2, `Was able to read the data from file: ${file_path}`);
        // proxy our v, m, t = value, measurement and timestamp
        const data_points_proxied = data_points.map((dp) =>
          this.#wrapDataPoint(dp)
        );
        return data_points_proxied;
      } else {
        debugLog(2, `File at path: ${file_path} is empty, moving on.`);
        return [];
      }
    } catch (error) {
      debugLog(2, `Error reading data from file: ${file_path} - ${error.message}`);
      return []; // continue with an empty arr; avoid further errors
    }
  }

  #wrapDataPoint(data_point) {
    return new Proxy(data_point, {
      get(target, property, receiver) {
        if (property === "value") return target.v;
        if (property === "measurement") return target.m;
        if (property === "timestamp") return target.t;
        // TODO: FUTURE NOTE -> don't forget to update the proxy if the key structure changes
        return Reflect.get(...arguments); // default for other props
      },
    });
  }

  #generateDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const new_date_key = `${year}_${month}_${day}`;
    return new_date_key;
  }

  #performBuiltInAggregation(data_points, aggregation_type) {
    debugLog(2, `Performing aggregation: ${aggregation_type} on data: ${JSON.stringify(data_points)}`);
    let result;

    // Note: v = value, m = measurement, t = timestamp; handled by the proxy

    // exit on empty data_points early
    if (data_points.length === 0) return undefined;

    // TODO: document these aggregators
    // percentile: Finds the value below which a certain percentage of observations fall. For example, the 90th percentile is the value below which 90% of the observations may be found
    if (aggregation_type.startsWith("percentile_")) {
      // extract the percentile value from the aggregation type, e.g., "percentile_90" -> 90
      const percentile_value = parseInt(aggregation_type.split("_")[1], 10);
      result = this.#calculatePercentile(data_points, percentile_value);
    } else if (aggregation_type === "trend") {
      if (data_points.length > 1) {
        const firstPoint = data_points[0].v;
        const lastPoint = data_points[data_points.length - 1].v;
        result =
          lastPoint > firstPoint
            ? "up"
            : lastPoint < firstPoint
            ? "down"
            : "steady";
      } else {
        result = "steady"; // if there's one or no data points, we cannot determine a trend
      }
    } else {
      switch (aggregation_type) {
        case "raw": // raw: no transformation, just return AS IS
          result = data_points;
          break;
        case "sum": // sum
          result = data_points.reduce((acc, point) => acc + point.v, 0);
          break;
        case "average": // average
          result =
            data_points.reduce((acc, point) => acc + point.v, 0) /
            data_points.length;
          break;
        case "min": // min
          result = Math.min(...data_points.map((point) => point.v));
          break;
        case "max": // max
          result = Math.max(...data_points.map((point) => point.v));
          break;
        case "count": // count
          result = data_points.length;
          break;
        case "median": // median
          const sorted_vals = data_points
            .map((dp) => dp.v)
            .sort((a, b) => a - b);
          const middle_index = Math.floor(sorted_vals.length / 2);
          result =
            sorted_vals.length % 2 !== 0
              ? sorted_vals[middle_index]
              : (sorted_vals[middle_index - 1] + sorted_vals[middle_index]) / 2;
          break;
        case "mode": // mode
          const frequency_map = {};
          data_points.forEach((dp) => {
            if (!frequency_map[dp.v]) frequency_map[dp.v] = 0;
            frequency_map[dp.v]++;
          });
          const max_frequency = Math.max(...Object.values(frequency_map));
          result = Object.keys(frequency_map)
            .filter((key) => frequency_map[key] === max_frequency)
            .map(parseFloat);
          if (result.length === 1) result = result[0];
          break;
        case "stddev": // standard deviation
          if (data_points.length > 1) {
            const mean =
              data_points.reduce((acc, dp) => acc + dp.v, 0) /
              data_points.length;
            const variance =
              data_points.reduce(
                (acc, dp) => acc + Math.pow(dp.v - mean, 2),
                0
              ) /
              (data_points.length - 1);
            result = Math.sqrt(variance);
          } else {
            result = undefined;
          }
          break;
        case "first": // first
          result = data_points.length > 0 ? data_points[0].v : undefined;
          break;
        case "last": // last
          result =
            data_points.length > 0
              ? data_points[data_points.length - 1].v
              : undefined;
          break;
        case "range": // range: Calculates the difference between the maximum and minimum values in your dataset. This can be useful for understanding volatility or variability in your data.
          const max_val = Math.max(...data_points.map((point) => point.v));
          const min_val = Math.min(...data_points.map((point) => point.v));
          result = max_val - min_val;
          break;
        case "iqr": // interquartile range: Measures the spread of the middle 50% of data points (between the 25th and 75th percentiles). It's a robust measure of spread.
          const sorted = data_points.map((dp) => dp.v).sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length / 4)];
          // for Q3, find the 75th percentile position and interpolate if necessary
          const q3_pos = Math.floor((3 * sorted.length) / 4);
          const q3 =
            sorted.length % 2 === 0
              ? (sorted[q3_pos] + sorted[q3_pos - 1]) / 2
              : sorted[q3_pos];
          result = q3 - q1;
          break;
        case "variance": // variance: Calculates the variance of the data points. While standard deviation gives you a measure of spread in the same units as the data, variance squares these differences.
          if (data_points.length > 1) {
            const mean =
              data_points.reduce((acc, dp) => acc + dp.v, 0) /
              data_points.length;
            result =
              data_points.reduce(
                (acc, dp) => acc + Math.pow(dp.v - mean, 2),
                0
              ) /
              (data_points.length - 1);
          } else {
            result = undefined;
          }
          break;
        case "rate_of_change": // rate of change: Calculates the rate of change between points. This can be particularly useful for financial or performance data where you're interested in the rate of growth or decline of Bitcoin's price.
          if (data_points.length > 1) {
            result = [];
            for (let i = 1; i < data_points.length; i++) {
              const rate =
                (data_points[i].v - data_points[i - 1].v) /
                data_points[i - 1].v;
              result.push(rate);
            }
          } else {
            result = undefined;
          }
          break;
        default:
          throw new Error("Unsupported aggregation type");
      }
    }
    debugLog(3, `Aggregation result: ${result}`);
    return result;
  }

  // outside aggregators go here:
  #calculatePercentile(data_points, percentile_rank) {
    // sort data points by value
    const sorted_values = data_points
      .map((dp) => dp.value)
      .sort((a, b) => a - b);
    // calculate rank position
    const rank = (percentile_rank / 100) * (sorted_values.length - 1) + 1;
    // interpolate between closest ranks
    const index = Math.floor(rank) - 1;
    const frac = rank % 1;

    if (sorted_values.length === 0) return undefined;
    if (frac === 0) return sorted_values[index];
    else
      return (
        sorted_values[index] +
        frac * (sorted_values[index + 1] - sorted_values[index])
      );
  }
  // other aggregators (maybe in the future):
  // ...

  #calculateUsageOfRAM() {
    let ttl_size = 0;
    // rough estimation with the assumption of 1 byte per char
    for (const data_points of Object.values(this.#data_in_ram)) {
      const size = JSON.stringify(data_points).length;
      ttl_size += size;
    }
    return ttl_size;
  }

  #persistIndex() {
    const index_data = JSON.stringify(this.#index);
    const index_checksum = this.#calculateIndexChecksum(index_data);
    const index_content = JSON.stringify({ index_data, index_checksum });

    // save the current state of the index
    writeFile(`${this.#user_options.directory}/index.json`, index_content);
    // save a backup of the index
    writeFile(
      `${this.#user_options.directory}/index_backup.json`,
      index_content
    );

    this.#cur_index_checksum = index_checksum;
  }

  #loadIndex() {
    const index_path = `${this.#user_options.directory}/index.json`;
    const backup_index_path = `${
      this.#user_options.directory
    }/index_backup.json`;

    if (dirOrFileExists(index_path)) {
      const save_data = readFile(index_path);
      if (this.#tryLoadIndex(save_data)) {
        return; // ok
      }
    }

    debugLog(3, "Attempting to recover index from backup.");
    if (dirOrFileExists(backup_index_path)) {
      const backup_data = readFile(backup_index_path);
      if (this.#tryLoadIndex(backup_data)) {
        debugLog(2, "Successfully recovered index from backup.");
        return;
      }
    }

    debugLog(
      3,
      "Both main and backup index files are unavailable or corrupt. Initializing an empty index."
    );
    this.#initializeEmptyIndex();
    this.#persistIndex();
  }

  #tryLoadIndex(saved_data) {
    // attempt to load the index from the given data
    try {
      const { index_data, index_checksum } = JSON.parse(saved_data);
      const calculated_checksum = this.#calculateIndexChecksum(index_data);
      if (calculated_checksum === index_checksum) {
        this.#index = JSON.parse(index_data);
        this.#cur_index_checksum = index_checksum;
        return true; // ok
      }
    } catch (error) {
      debugLog(2, `Error loading or parsing index file: ${error}.`);
    }
    return false; // fail
  }

  #initializeEmptyIndex() {
    this.#index = {};
    this.#cur_index_checksum = this.#calculateIndexChecksum(
      JSON.stringify(this.#index)
    );
  }

  #updateIndex(file_path) {
    // extract the date component from the file path
    const regex = /(\d{4}_\d{2}_\d{2})_(\d{2})(?:_(\d{2}))?\.json$/;
    const match = file_path.match(regex);
    if (match) {
      const date_key = match[1]; // YYYY-MM-DD
      const hour = match[2];
      const minute = match[3]; // can be undefined for "hour" variant

      // ensure the date_key exists in the index
      if (!this.#index[date_key]) {
        this.#index[date_key] = {};
      }

      // for hour variant just mark it as present
      if (this.#user_options.time_frame === "hour") {
        this.#index[date_key][hour] = 1; // true
      }
      // for minute variant ensure an entry for the hour exists and mark the minute
      else if (this.#user_options.time_frame === "minute") {
        if (!this.#index[date_key][hour]) {
          this.#index[date_key][hour] = {};
        }
        this.#index[date_key][hour][minute] = 1; // true
      }
    }
  }

  #incrementDate(cur_date) {
    const new_date = new Date(cur_date);
    if (this.#user_options.time_frame === "hour") {
      new_date.setUTCHours(new_date.getUTCHours() + 1, 0, 0, 0); // reset m, s, and ms
    } else if (this.#user_options.time_frame === "minute") {
      new_date.setUTCMinutes(new_date.getUTCMinutes() + 1, 0, 0); // reset s and ms
    }
    return new_date;
  }

  #setupDirectoryStructure() {
    makeDirectory(this.#user_options.directory);
  }

  #persistIndexIfNeeded() {
    const index_data = JSON.stringify(this.#index);
    const new_index_checksum = this.#calculateIndexChecksum(index_data);
    if (this.#cur_index_checksum !== new_index_checksum) {
      this.#persistIndex();
      this.#cur_index_checksum = new_index_checksum;
    }
  }
  #calculateIndexChecksum(index_str) {
    let checksum = 0;
    for (let i = 0; i < index_str.length; i++) {
      checksum = (checksum + index_str.charCodeAt(i)) % 65535;
    }
    const checksum_str = checksum.toString();
    debugLog(3, `Index checksum: ${checksum_str}`);
    return checksum_str;
  }
}

// ================== UTILITIES ================== //

function openFile(path, flags) {
  try {
    return openSync({
      path,
      flag: flags,
    });
  } catch (error) {
    debugLog(1, `Failed to open file '${path}':`, error);
    return null;
  }
}

function writeFile(filename, data) {
  try {
    writeFileSync({
      path: filename,
      data: data, // directly use the string data; no need to convert to ab
      options: {
        encoding: "utf8", // specify encoding method for string data
      },
    });
    debugLog(3, `writeFileSync success, data written to '${filename}'`);
  } catch (error) {
    debugLog(1, `writeFileSync failed for '${filename}':`, error);
  }
}

function advancedWriteFile(filename, data, options = {}) {
  let fd = null;

  try {
    // determine the flags based on the provided options
    const flags = options.append ? O_RDWR | O_CREAT : O_WRONLY | O_CREAT;
    debugLog(3, `Opening file '${filename}' with flags:`, flags);

    fd = openFile(filename, flags);
    debugLog(3, `File opened with file descriptor: ${fd}`);

    let buffer;
    // convert to ab if needed
    if (typeof data === "string") {
      buffer = str2ab(data);
      debugLog(3, `Data converted to ArrayBuffer`);
    } else {
      buffer = data;
    }

    debugLog(3, `Buffer length: ${buffer.byteLength}`);

    // default options for writeSync
    const defaults = {
      offset: 0, // from the beginning
      length: buffer.byteLength,
      position: options.position !== undefined ? options.position : null, // allows for null (append mode) or specified position
    };

    debugLog(
      3,
      `Writing data with options: offset=${defaults.offset}, length=${defaults.length}, position=${defaults.position}`
    );

    const written = writeSync({
      fd,
      buffer,
      options: defaults,
    });

    debugLog(
      3,
      `Data successfully written to '${filename}', ${written} bytes written.`
    );
  } catch (error) {
    debugLog(1, `Failed to write to file '${filename}':`, error);
  } finally {
    // ensure fd is closed
    if (fd !== null) {
      closeSync(fd);
      debugLog(3, `File descriptor ${fd} closed.`);
    }
  }
}

function readFile(filename) {
  if (!dirOrFileExists(filename)) {
    debugLog(2, `File does not exist: ${filename}`);
    return ""; // null
  }

  const str_content = readFileSync({
    path: filename,
    options: {
      encoding: "utf8", // specify string encoding
    },
  });

  if (str_content === undefined) {
    debugLog(2, `Failed to read the file: ${filename}`);
    return ""; // return null
  } else {
    // successfully read the file as a string
    return str_content;
  }
}

function advancedReadFile(filename) {
  let fd = null;
  let file_content = "";

  try {
    fd = openFile(filename, O_RDONLY);
    debugLog(3, `File opened with file descriptor: ${fd}`);

    // determine the size of the file for buffer allocation
    const file_info = statSync({ path: filename });
    if (!file_info) {
      debugLog(2, `Failed to get file info: ${filename}`);
      return "";
    }
    const buffer_size = file_info.size;
    debugLog(3, `File size: ${buffer_size} bytes`);

    const buffer = new ArrayBuffer(buffer_size);

    // read into buf
    const bytes_read = readSync({
      fd,
      buffer,
      options: {
        length: buffer_size,
        position: null, // ... from the beginning of the file
      },
    });
    debugLog(3, `Bytes read: ${bytes_read}`);

    // ab to UTF8
    file_content = ab2str(buffer);
  } catch (error) {
    debugLog(1, `Failed to read file '${filename}':`, error);
    return "";
  } finally {
    // close
    if (fd !== null) {
      closeSync(fd);
      debugLog(3, `File descriptor ${fd} closed.`);
    }
  }

  return file_content;
}

function removeFile(filename) {
  try {
    rmSync({ path: filename });
    debugLog(3, `File removed successfully: '${filename}'`);
  } catch (error) {
    debugLog(1, `Failed to remove file '${filename}':`, error);
  }
}

function makeDirectory(directory) {
  try {
    mkdirSync({ path: directory });
    return true;
  } catch (error) {
    debugLog(1, `Error creating directory '${directory}':`, error);
    return false;
  }
}

function listDirectory(directory) {
  try {
    const files = readdirSync({ path: directory });
    return files;
  } catch (error) {
    debugLog(1, `Error listing directory contents for '${directory}':`, error);
    return [];
  }
}

function dirOrFileExists(path) {
  try {
    statSync({ path: path });
    return true;
  } catch (error) {
    return false;
  }
}

function removeFileOrDir(path, is_recursive = false) {
  try {
    if (is_recursive) {
      let files = [];
      try {
        files = readdirSync({ path });
      } catch (error) {}

      if (files.length > 0) {
        // if we got here, it's a dir
        files.forEach((file) => {
          const full_path = `${path}/${file}`;
          removeFileOrDir(full_path, true); // continue recursion
        });
      }
      // rem the directory or file
      rmSync({ path });
      debugLog(3, `Removed successfully: '${path}'`);
    } else {
      // non-recursive, just remove
      rmSync({ path });
      debugLog(3, `Removed successfully: '${path}'`);
    }
  } catch (error) {
    debugLog(1, `Failed to remove '${path}':`, error);
  }
}

function makeNestedDirectory(directory_path) {
  const path_segments = directory_path.split("/");
  let cur_path = "";

  for (const segment of path_segments) {
    cur_path += `${segment}/`;
    if (!dirOrFileExists(cur_path)) {
      debugLog(3, `Creating directory: ${cur_path}`);
      mkdirSync({ path: cur_path });
    }
  }
}

function writeAsset(filename, data) {
  const buffer = str2ab(data);
  const file = openAssetsSync({ path: filename, flag: O_WRONLY | O_CREAT });
  const result = writeSync({
    fd: file,
    buffer: buffer,
    // other params: 'offset', 'length', 'position'
  });

  if (result >= 0) {
    debugLog(2, `writeSync success, wrote ${result} bytes`);
  } else {
    debugLog(1, "writeSync failed");
  }

  closeSync(file);
}

function readAsset(filename) {
  // check if the file exists and get its size
  const file_info = statSync({ path: filename });
  if (file_info) {
    // file exists, proceed to open
    const fd = openAssetsSync({ path: filename, flag: O_RDONLY });
    if (fd !== undefined) {
      const file_content_buff = new ArrayBuffer(file_info.size);
      const bytes_read = readSync({
        fd: fd,
        buffer: file_content_buff,
        offset: 0,
        length: file_info.size,
        position: null, // reading from current position
      });

      if (bytes_read > 0) {
        debugLog(2, `readSync success, read ${bytes_read} bytes`);
        // convert ab to str
        return ab2str(file_content_buff);
      } else {
        debugLog(1, "readSync failed or read 0 bytes");
      }

      // always ensure the file is closed
      closeSync(fd);
    } else {
      debugLog(1, "Failed to open file");
    }
  } else {
    debugLog(1, "File does not exist:", filename);
  }
  return null; // null if reading was unsuccessful
}

function saveJson(filename, json) {
  writeFile(filename, JSON.stringify(json));
}

function loadJson(filename) {
  let json;
  try {
    const val = readFile(filename);
    json = val ? JSON.parse(val) : {};
  } catch {
    json = {};
  }
  return json;
}

// ================== HELPERS ================== //

function ab2str(buffer) {
  debugLog(3, `Converting buffer to str`);
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // has to be switched back to 1 byte for each character for utf8 writeSync
  var buf_view = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    buf_view[i] = str.charCodeAt(i);
  }
  return buf;
}

// let hex_string = "Hello World!".toHex();
// console.log(hex_string) // "48656c6c6f20576f726c6421"
String.prototype.toHex = function () {
  let result = "";
  for (let i = 0; i < this.length; i++) {
    result += this.codePointAt(i).toString(16);
  }
  return result;
};

// let hex_string = "48656c6c6f20576f726c6421";
// console.log(hex_string.fromHex()); // "Hello World!"
String.prototype.fromHex = function () {
  let hex_string = this.toString(); // ensure we have a string
  let result = "";
  for (let i = 0; i < hex_string.length; i += 2) {
    result += String.fromCodePoint(
      Number.parseInt(hex_string.substr(i, 2), 16)
    );
  }
  return result;
};

// debugLog v2.0
function debugLog(level, ...params) {
  if (level <= DEBUG_LOG_LEVEL) {
    const trunc_params = params.map((param) => {
      const MAX_ITEMS = 2;
      if (Array.isArray(param) && param.length > MAX_ITEMS) {
        return [...param.slice(0, MAX_ITEMS), " ...more"];
      } else {
        return param;
      }
    });
    console.log("[easy-storage]", ...trunc_params);
  }
}

export default EasyStorage;

/**
 * TESTS:
 * - Balance (hardware):
 * 		EasyFlashStorage -> index VS readdir = 3ms vs 9ms per 1000 files
 * 			- index implementation was dropped, due to complexity and maintanability. The difference isn't that marginal, plus the RAM consumption isn't worth it.
 * 		Creation of 1000 files takes: 27 seconds (!)
 *
 * - Bip 5 (hardware):
 * 		The filesystem appears to be about 25% slower than on Balance.
 *
 * - Bip 5 (simulator)
 * 		The simulator's FS appears to be faster by 61% from Balance (hardware) and 79% Bip 5 (hardware)
 *
 * Notes:
 * - (!) Nested directories after data/mydir/ are not supported. Where does this limit come from? Need to use ABS path?
 * 		- looks like nesting issue was related to inability to handle dashes "-" in the filenames
 * - (!) filenames 10-10-10.json not supported; only 10_10_10.json
 * - (!) bug: what's up with the requirement to UTC-1 day otherwise we pull data -1 day. did i miss something?
 */

/**
 * @changelog
 * 1.0.0
 * - initial release
 * 1.0.3
 * - @fix "return this.#content_obj[key]" was returning null without typecast; now returns strict string
 * - @add possibility to write/read arbitrary files
 * - @add separation between manual writes and easystorage
 * 1.0.5
 * - @fix consistency
 * - @add toHex / fromHex string extensions
 * 1.0.6
 * - @upd getContents() that retrieves whole contents of the storage as a JSON object
 * 1.0.7
 * - @upd getContents() returns a stringified version of JSON object (as in the original easy-save library)
 * 1.2.0
 * - @upd library migration to ZeppOS v2
 * - @upd getContents() by default returns json object but accepts additional `stringify` param
 * - @fix proper getKey empty return type "undefined" != undefined
 * - @add ab2str
 * 1.4.0
 * - @add EasyFlashStorage, a file storage for operating heavy files with a simple JSON approach
 * - @upd getContents() depracated; use getAllKeys() instead
 * - @add removeFile() utility
 * 1.6.0
 * - EasyStorage: 	   -------------------------------------------------------
 * - @upd getAllKeys() -> getStorageSnapshot() to be more descriptive
 * - EasyFlashStorage: -------------------------------------------------------
 * - @add getAllValues()
 * - @add getStorageSnapshot()
 * - @fix index file excluded from .size() and .count() methods as it should not be counted as a regular file
 * - @add constructor(..., use_index = true). index is used by default.
 * 		benefit - quicker filename resolution. con - all the keys (without their content, sit in the memory).
 * 		now with use_index = false, the flash lib will solely rely on the flash storage and use of readdirSync
 * - @upd getKey() making sure that retrieved file is in the index, otherwise - update it
 * - @rem index dropped, the complexity and memory requirement not worth it - full ssd approach from now. need it for a test? find easy-storage-index.js
 * - Storage:	--------------------------------------------------------------
 * - @add ListDirectory and MakeDirectory methods
 * - Utilities: --------------------------------------------------------------
 * - @add listDirectory() and makeDirectory()
 * - Other: 	--------------------------------------------------------------
 * - @add class EasyTSDB, the time-series database
 *  1.6.1
 * - @upd docs
 *  1.6.3
 * - @rem EasyFlashStorage -> use_index
 * - @upd docs
 *  1.6.4
 * - @upd npm docs
 *  1.6.7
 * - EasyFlashStorage: -------------------------------------------------------
 * - @upd getKey() returns proper errors when key or file don't exist
 * - @add #parseJSON utility
 * - @add minification to address OOMs
 */