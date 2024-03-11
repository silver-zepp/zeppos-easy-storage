/** @about Easy Storage 1.4.0 @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */
import {
	statSync, readSync, readFileSync, writeFileSync, closeSync, openAssetsSync, readdirSync, mkdirSync, // openSync,
	O_RDONLY, O_CREAT, O_WRONLY, rmSync, // O_RDWR, O_TRUNC,
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
	#filename;  // specify the name of you database
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
		debugLog(3,`Retrieving key: ${key}`);
		if (Object.prototype.hasOwnProperty.call(this.#content_obj, key)) {
			const value = this.#content_obj[key].toString();
			debugLog(2,`Found value for key '${key}': ${value}`);
			return value;
		}
		debugLog(3,`Key '${key}' not found, returning default value: ${default_value}`);
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
	printContents() { console.log("Storage contents: " + JSON.stringify(this.#content_obj)); }

	/**
	 * Returns the entire storage object, optionally as a JSON string.
	 * @param {boolean} [stringify=false] - If `true`, returns the storage contents as a JSON string; otherwise, returns the object itself.
	 * @returns {string|object} The storage contents as a JSON string if `stringify` is true, or as an object if `stringify` is false.
	 * @examples
	 * ```js
	 * // example: get all storage keys as an object
	 * const keys = storage.getAllKeys();
	 * console.log(JSON.stringify(keys));
	 *
	 * // example: get all storage keys as a string
	 * console.log(storage.getAllKeys(true));
	 * ```
	 */
	getAllKeys(stringify = false) { // @upd 1.3.1
		return stringify ? JSON.stringify(this.#content_obj) : this.#content_obj;
	}

	/**
   * @deprecated This method is deprecated and will be removed in the future. Please use getAllKeys instead.
   */
	getContents(stringify = false) {
		console.log(ERR_DEPRECATED, "Please use getAllKeys instead.");
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
	SetAutosaveEnable(bool){ this.#autosave = bool; }

	/**
	 * Sets the filename for the storage file.
	 * @param {string} filename - The new filename to use for the storage.
	 * @examples
	 * ```js
	 * // example: change the storage filename
	 * storage.SetStorageFilename('new_storage.json');
	 * ```
	 */
	SetStorageFilename(filename){ this.#filename = filename; }

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
}

/** 
 * EasyFlashStorage: An extension of EasyStorage, tailored for handling larger datasets by offloading data 
 * to the filesystem. It offers a more scalable storage option while maintaining a minimalistic API, making it 
 * suitable for applications with heavier data requirements. 
 * */
export class EasyFlashStorage { // @add 1.4.0
    #directory;
	#index = {};
    #cb_save_index_debounced;

	/**
	 * Initializes the EasyFlashStorage with a specified directory.
	 * @param {string} [directory="easy_flash_storage"] - The directory to use for storage.
	 * @example
	 * ```js
	 * const storage = new EasyFlashStorage('my_custom_directory');
	 * ```
	 */
    constructor(directory = "easy_flash_storage") {
        this.#directory = directory;
        mkdirSync({ path: this.#directory });
		this.#cb_save_index_debounced = this.#debounce(this.#saveIndex.bind(this), 1000);
        this.#loadIndex();
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
		// readdirSync workaround
		this.#index[key] = true; // mark key as present
        this.#cb_save_index_debounced(); // debounced save
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
	getKey(key) {
		if (this.hasKey(key)) { // this.#index[key] <- not a robust approach
			const file_content = readFile(`${this.#directory}/${key}`);
			try {
				return JSON.parse(file_content); // directly parse the string content
			} catch (error) {
				debugLog(1, "Error parsing JSON from file:", error);
				return undefined;
			}
		} else {
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
			// readdirSync workaround
			delete this.#index[key]; // remove key from index
            this.#cb_save_index_debounced(); // debounced save
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
		const result = statSync({ path: this.#directory + '/' + key });
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
        let keys = this.getAllKeys();
        return keys.length === 0;
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
        let keys = this.getAllKeys();
        return keys.length;
    }

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
	dataSize(key, unit = 'B') {
        if (this.hasKey(key)) {
            let stat = statSync({ path: this.#directory + '/' + key });
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
    size(unit = 'B') {
		let keys = this.getAllKeys(); // should always return an array
		let ttl_size = 0;
	
		for (let key of keys) {
			const stat = statSync({ path: this.#directory + '/' + key });
			if (stat) {
				ttl_size += stat.size;
			}
		}
	
		return this.#convertSize(ttl_size, unit);
	}

	// warning (!) this call might be expensive if you have multiple big files in your storage
	// (!) for now this has zero performace hits while using an index approach
	// TODO: readdirSync is BUGGED, going with an index approach. TOBE: fixed
	// keys = readdirSync({ path: this.#directory });
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
        const keys = Object.keys(this.#index);
        return stringify ? JSON.stringify(keys) : keys;
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
            console.log(key + ': ' + this.getKey(key));
        }
    }

	// default unit is Byte
	#convertSize(size, unit) {
		let result;
		switch (unit) {
			case "KB": 	result = size / 1024; 			break;
			case "MB": 	result = size / 1024 / 1024; 	break;
			default: 	result = size; 					break; // "B"
		} return Number(result.toFixed(2));
	}

	#loadIndex() {
        try {
            const file_content = readFile(`${this.#directory}/index`);
            this.#index = file_content ? JSON.parse(file_content) : {};
        } catch (error) {
            debugLog(1, "Error loading or parsing index file:", error);
            this.#index = {};
        }
    }

    #saveIndex() {
		writeFile(`${this.#directory}/index`, JSON.stringify(this.#index));
    }

	#debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
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
        return Object.prototype.hasOwnProperty.call(this.#content_obj, key) ? this.#content_obj[key] : default_val;
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
        console.log("Temporary Storage Contents:", JSON.stringify(this.#content_obj, null, 2));
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
	static WriteJson(filename, json){
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
	static ReadJson(filename){
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
	static WriteFile(filename, data){
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
	static ReadFile(filename){
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
	static RemoveFile(filename){
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
	static WriteAsset(filename, data){
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
	static ReadAsset(filename){
		return readAsset(filename);
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


function readFile(filename) {
	const str_content = readFileSync({
		path: filename,
		options: {
			encoding: "utf8", // specify string encoding
		},
	});

	if (str_content === undefined) {
		debugLog(2,`Failed to read the file: ${filename}`);
		return ""; // return null
	} else {
		// successfully read the file as a string
		return str_content;
	}
}

function removeFile(filename) {
    try {
        rmSync({ path: filename });
        debugLog(3, `File removed successfully: '${filename}'`);
    } catch (error) {
        debugLog(1, `Failed to remove file '${filename}':`, error);
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
		debugLog(2,`writeSync success, wrote ${result} bytes`);
	} else {
		debugLog(1,'writeSync failed');
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
				position: null // reading from current position
			});

			if (bytes_read > 0) {
				debugLog(2,`readSync success, read ${bytes_read} bytes`);
				// convert ab to str
				return ab2str(file_content_buff);
			} else {
				debugLog(1,'readSync failed or read 0 bytes');
			}

			// always ensure the file is closed
			closeSync(fd);
		} else {
			debugLog(1,'Failed to open file');
		}
	} else {
		debugLog(1,'File does not exist:', filename);
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
	} return json;
}

export function ab2str(buffer) {
	return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function str2ab(str) {
	debugLog(3, `Converting string: ${str}`);
	const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	const bufView = new Uint16Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.codePointAt(i);
	}
	debugLog(2, `Buffer length: ${buf.byteLength}`);
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
		result += String.fromCodePoint(Number.parseInt(hex_string.substr(i, 2), 16));
	} return result;
};

function debugLog(level, ...params) {
	if (level <= DEBUG_LOG_LEVEL) {
		console.log("[easy-storage]", ...params);
	}
}

export default EasyStorage;

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
 */