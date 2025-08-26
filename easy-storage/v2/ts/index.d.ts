//#region EasyStorageAsync

/**
 * EasyStorageAsync:
 * - Single-file JSON blob kept in RAM, synced to disk without blocking UI
 * - Perfect for larger settings/prefs that might cause stutter with sync writes
 * - Queued autosave prevents overwhelming the storage system
 * - Same API as EasyStorage but all operations use callbacks
 */
export class EasyStorageAsync {
	constructor(filename?: string, callback?: InitCallback);
	/**
	 * Sets a value for a specified key in the storage.
	 * @param {string} key - The key to set the value for.
	 * @param {*} value - The value to be set.
	 * @param {Function} [callback] - Optional callback (err, success).
	 */
	setKey(key: string, value: any, callback?: ErrorCallback): void;
	/**
	 * Retrieves the value associated with the specified key from the storage.
	 * @param {string} key - The key whose value to retrieve.
	 * @param {*} [default_value=""] - The default value to return if key doesn't exist.
	 * @returns {*} The value (synchronous - data is already in RAM).
	 */
	getKey<T = any>(key: string, defaultValue?: T): T | undefined;
	/**
	 * Checks if the specified key exists in the storage.
	 * @param {string} key - The key to check for existence.
	 * @returns {boolean} True if the key exists.
	 */
	hasKey(key: string): boolean;
	/**
	 * Removes the specified key and its associated value from the storage.
	 * @param {string} key - The key to remove.
	 * @param {Function} [callback] - Optional callback (err, success).
	 */
	removeKey(key: string, callback?: ErrorCallback): void;
	/**
	 * Saves all current key-value pairs without blocking the UI.
	 * @param {Function} [callback] - Optional callback (err, success).
	 */
	saveAll(callback?: ErrorCallback): void;
	/**
	 * Clears all key-value pairs in the storage.
	 * @param {Function} [callback] - Optional callback (err, success).
	 */
	deleteAll(callback?: ErrorCallback): void;
	/**
	 * Prints the contents of the storage to the console.
	 * ```js
	 * // example: log current storage contents
	 * storage.printContents();
	 * ```
	 */
	printContents(): void;
	/**
	 * Returns the entire storage object, optionally as a JSON string.
	 * @param {boolean} [stringify=false] - If `true`, returns the storage contents as a JSON string; otherwise, returns the object itself.
	 * @returns {string|object} The storage contents as a JSON string if `stringify` is true, or as an object if `stringify` is false.
	 * ```js
	 * // example: get all storage keys as an object
	 * const snapshot = storage.getStorageSnapshot();
	 * console.log(JSON.stringify(keys));
	 *
	 * // example: get all storage keys as a string
	 * console.log(storage.getStorageSnapshot(true));
	 * ```
	 */
	getStorageSnapshot(stringify?: boolean): object | string;
	/**
	 * Force-save any pending data before app shutdown.
	 * @returns {Object} Result with saved count.
	 */
	saveAndQuit(): { saved: number };
	/**
	 * Check if storage system is too busy for new operations.
	 * @returns {boolean} True if you should throttle operations.
	 */
	isBusy(): boolean;
	/**
	 * Enables or disables the autosave feature.
	 * @param {boolean} bool - `true` to enable autosave, `false` to disable.
	 * ```js
	 * // example: enable autosave feature
	 * storage.SetAutosaveEnable(true);
	 * ```
	 */
	SetAutosaveEnable(bool: boolean): void;
	/**
	 * Sets the filename for the storage file.
	 * @param {string} filename - The new filename to use for the storage.
	 * ```js
	 * // example: change the storage filename
	 * storage.SetStorageFilename('new_storage.json');
	 * ```
	 */
	SetStorageFilename(filename: string): void;
	/**
	 * Retrieves the current filename used for the storage.
	 * @returns {string} The current filename.
	 * ```js
	 * // example: get the current storage filename
	 * console.log(storage.GetStorageFilename()); // "easy_storage.json"
	 * ```
	 */
	GetStorageFilename(): string;
	/**
	 * Check if the storage has finished its initial asynchronous load.
	 * @example
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
	isReady(): boolean;
	/**
	 * Synchronously loads the storage file into RAM.
	 * If you have to access the storage right away on page open use example below.
	 * @example
	 * if (!storage.isReady()) storage.synchronize();
	 * // then access your keys
	 * storage.getKey('my_key');
	 * // ^ otherwise this might be undefined as initial DB load is async
	 * @returns {boolean}  `true` if parsing succeeded, `false` otherwise.
	 */
	synchronize(): boolean;
}

//#endregion


// #region AsyncStorage

/**
 * Callback function for write operations
 */
type WriteCallback = (err: Error | null, success: boolean) => void;

/**
 * Callback function for read operations
 */
type ReadCallback = (err: Error | null, data: object) => void;

/**
 * Callback function for file removal operations
 */
type RemoveCallback = (err: Error | null, success: boolean) => void;

/**
 * Result object returned by SaveAndQuit operation
 */
interface SaveAndQuitResult {
	saved: number;
}

/**
 * Queue status information
 */
interface QueueStatus {
	running: boolean;
	queued: number;
	active: number;
}

/**
 * AsyncStorage: 
 * - Queued JSON file operations that won't overwhelm CPU and freeze UI during big writes/reads
 * - Automatically streams large datasets in small chunks to stay responsive
 * - Built-in flow control prevents overwhelming the system with too many operations
 * - Graceful shutdown saves any pending writes before app exits. Add `AsyncStorage.SaveAndQuit();` to your page's onDestroy().
 */
export declare class AsyncStorage {
	static pend_writes_map: Map<string, any>;

	/**
	 * Writes JSON data to file without blocking the UI thread.
	 * Operations are queued and processed in small chunks to keep animations smooth.
	 * @param filename - The filename to write to.
	 * @param json - The json object to write.
	 * @param callback - Callback function (err, success) when write finishes.
	 * @example
	 * ```
	 * // example: save config
	 * AsyncStorage.WriteJson('config.json', { theme: 'dark' }, (err, ok) => {
	 *   if (ok) console.log('config saved!');
	 * });
	 * ```
	 */
	static WriteJson(filename: string, json: any, callback?: WriteCallback): void;

	/**
	 * Reads JSON files without blocking the UI.
	 * Queued with other operations to maintain smooth app performance.
	 * @param filename - The filename to read from.
	 * @param callback - Callback function (err, data) with the parsed JSON.
	 * @example
	 * ```
	 * // example: load config
	 * AsyncStorage.ReadJson('config.json', (err, config) => {
	 *   if (!err) console.log('theme:', config.theme);
	 * });
	 * ```
	 */
	static ReadJson(filename: string, callback?: ReadCallback): void;

	/**
	 * Removes a file. This method is syncronous, but should be quick regardless.
	 * @param filename - The filename to delete.
	 * @param callback - Callback function (err, success) when deletion completes.
	 * @example
	 * ```
	 * // example: remove a file
	 * AsyncStorage.RemoveFile('temp.json', (err, ok) => {
	 *   if (ok) console.log('done');
	 * });
	 * ```
	 */
	static RemoveFile(filename: string, callback?: RemoveCallback): void;

	/**
	 * Check if the storage system is too busy to accept new work.
	 * Useful for throttling operations when the queue gets backed up.
	 * @returns True if you should wait before adding more operations.
	 * @example
	 * ```
	 * // example: throttle file operations to prevent overload and RAM runout
	 * if (!AsyncStorage.IsBusy()) {
	 *   AsyncStorage.WriteJson('data.json', big_obj, callback);
	 * } else {
	 *   console.log('storage busy, try again later');
	 * }
	 * ```
	 */
	static IsBusy(): boolean;

	/**
	 * Force-save any pending writes and shut down the queue cleanly.
	 * Essential for app shutdown - prevents losing data that was still being written.
	 * @returns Number of files that were successfully saved.
	 * @example
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
	static SaveAndQuit(): SaveAndQuitResult;
}
export type { WriteCallback, ReadCallback, RemoveCallback, SaveAndQuitResult, QueueStatus };

// #endregion

// #region EasyFlashStorage

/**
 * EasyFlashStorage: 
 * - Handles data sets that are too large for EasyStorage's single-blob model
 * - Minimizes RAM usage – only the file you're working with is loaded
 * - Reduces flash wear: small writes instead of rewriting a big file
 * - Survives unexpected reboots; corruption is isolated to one key
 */
export class EasyFlashStorage {
	/**
	 * Initializes the EasyFlashStorage with a specified directory.
	 * @param {string} [directory="easy_flash_storage"] - The directory to use for storage.
	 * @example
	 * ```js
	 * const storage = new EasyFlashStorage('my_custom_directory');
	 * ```
	 */
	constructor(directory?: string, use_index?: boolean);
	/**
	 * Sets a key with the given value in the storage. If the key already exists, it updates the value. The operation is automatically saved to the index file, debounced to reduce disk writes.
	 * @param {string} key - The key to set or update in the storage.
	 * @param {*} value - The value to associate with the key, which will be JSON stringified.
	 * @example
	 * ```js
	 * storage.setKey('user', { name: 'John Doe', age: 30 });
	 * ```
	 */
	setKey(key: string, value: any): void;
	/**
	 * Retrieves the value associated with the specified key. If the key does not exist, returns `undefined`.
	 * @param {string} key - The key to retrieve the value for.
	 * @returns {*} The value associated with the key, or `undefined` if the key does not exist.
	 * @example
	 * ```js
	 * console.log(storage.getKey('user')); // outputs the user object or `undefined`
	 * ```
	 */
	getKey(key: string): any;
	/**
	 * Removes the specified key (and its associated value) from the storage. The change is automatically reflected in the index file, debounced to reduce disk writes.
	 * @param {string} key - The key to remove from the storage.
	 * @example
	 * ```js
	 * storage.removeKey('user');
	 * ```
	 */
	removeKey(key: string): void;
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
	hasKey(key: string): boolean;
	/**
	 * Checks if the storage is empty (contains no keys).
	 * @returns {boolean} `true` if the storage is empty, `false` otherwise.
	 * @example
	 * ```js
	 * console.log(storage.isEmpty()); // true or false
	 * ```
	 */
	isEmpty(): boolean;
	/**
	 * Counts the number of keys in the storage.
	 * @returns {number} The number of keys in the storage.
	 * @example
	 * ```js
	 * console.log(storage.count()); // outputs the number of keys
	 * ```
	 */
	count(): number;
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
	dataSize(key: string, unit?: string): number;
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
	size(unit?: string): number;
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
	getAllKeys(stringify?: boolean): string | any[];
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
	getAllValues(stringify?: boolean): string | any[];
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
	getStorageSnapshot(stringify?: boolean): string | object;
	/**
	 * Removes all keys and their associated values from the storage.
	 * Essentially removing files from the disk.
	 * @example
	 * ```js
	 * storage.deleteAll(); // clears the storage
	 * ```
	 */
	deleteAll(): void;
	/**
	 * Prints all keys and their associated values to the console.
	 * @example
	 * ```js
	 * storage.printAllKeys(); // logs all keys and values
	 * ```
	 */
	printAllKeys(): void;
	#private;
}

// #endregion

// #region EasyTempStorage

/**
 * EasyTempStorage:
 * - Pure in-memory key-value cache, zero disk I/O
 * - Fastest choice for data that matters only while the app is open
 * - Cleared automatically on exit; no cleanup needed
 * - Shares EasyStorage-style API for easy swapping
 */
export class EasyTempStorage {
	/**
	 * Sets the value for a specified key in the temporary storage.
	 * @param {string} key - The key to associate the value with.
	 * @param {*} value - The value to store.
	 */
	setKey(key: string, value: any): void;
	/**
	 * Retrieves the value for a specified key from the temporary storage.
	 * @param {string} key - The key to retrieve the value for.
	 * @param {*} [defaultValue=""] - The default value to return if the key is not found.
	 * @returns {*} The value associated with the key, or the default value if the key is not found.
	 */
	getKey(key: string, default_val?: string): any;
	/**
	 * Checks if a specified key exists in the temporary storage.
	 * @param {string} key - The key to check.
	 * @returns {boolean} `true` if the key exists, otherwise `false`.
	 */
	hasKey(key: string): boolean;
	/**
	 * Removes a specified key and its associated value from the temporary storage.
	 * @param {string} key - The key to remove.
	 */
	removeKey(key: string): void;
	/**
	 * Clears all keys and their associated values from the temporary storage.
	 */
	deleteAll(): void;
	/**
	 * Prints all keys and their associated values to the console.
	 */
	printAllKeys(): void;
	/**
	 * Retrieves all keys from the temporary storage.
	 * @param {boolean} [stringify=false] - If `true`, returns the keys as a JSON string; otherwise, returns an array of keys.
	 * @returns {string|array} The keys in the storage as a JSON string if `stringify` is true, or as an array if `stringify` is false.
	 */
	getAllKeys(stringify?: boolean): string | any[];
	#private;
}

// #endregion

// #region Storage

/**
 * File information object returned by FileInfo
 */
interface FileStats {
	size: number;
	mtimeMs: number;
	isDir: boolean;
	isFile: boolean;
}

/**
 * Storage: 
 * - Direct file operations that happen immediately and block until complete
 * - Perfect for small files and simple read/write tasks where you need the result right away
 * - No queuing or async complexity - just straightforward "save this now" functionality
 * - Use `AsyncStorage` instead if you're dealing with large files or don't want UI stuttering
 */
export class Storage {
	/**
	 * Writes a JSON object to a specified file.
	 * @param {string} filename - The name of the file to write the JSON object to.
	 * @param {object} json - The JSON object to be written.
	 * ```js
	 * Storage.WriteJson('config.json', { key: 'value' });
	 * ```
	 */
	static WriteJson(filename: string, json: object): void;
	/**
	 * Reads a JSON object from a specified file.
	 * @param {string} filename - The name of the file to read the JSON object from.
	 * @param {boolean} stringify - (optional) If `true` returns stringified JSON object.
	 * @return {object} The JSON object read from the file.
	 * @example
	 * ```js
	 * const config = Storage.ReadJson('config.json');
	 * ```
	 */
	static ReadJson(filename: string, stringify?: boolean): object;
	/**
	 * Writes data to a specified file.
	 * @param {string} filename - The name of the file to write data to.
	 * @param {string|ArrayBuffer} data - The data to be written.
	 * ```js
	 * Storage.WriteFile('example.txt', 'Hello, World!');
	 * ```
	 */
	static WriteFile(filename: string, data: string | ArrayBuffer): void;
	/**
	 * Reads data from a specified file.
	 * @param {string} filename - The name of the file to read data from.
	 * @return {string} The data read from the file.
	 * ```js
	 * const data = Storage.ReadFile('example.txt');
	 * ```
	 */
	static ReadFile(filename: string): string;
	/**
	 * Removes a specified file from the filesystem.
	 * @param {string} filename - The name of the file to be removed.
	 * ```js
	 * Storage.RemoveFile('obsolete_data.txt');
	 * ```
	 */
	static RemoveFile(filename: string): void;
	/**
	 * Writes data to a specified asset file.
	 * @param {string} filename - The name of the asset file to write data to.
	 * @param {string|ArrayBuffer} data - The data to be written.
	 * ```js
	 * Storage.WriteAsset('image.png', image_data);
	 * ```
	 */
	static WriteAsset(filename: string, data: string | ArrayBuffer): void;
	/**
	 * Reads data from a specified asset file.
	 * @param {string} filename - The name of the asset file to read data from.
	 * @return {string} The data read from the asset file.
	 * ```js
	 * const image = Storage.ReadAsset('image.png');
	 * ```
	 */
	static ReadAsset(filename: string): string;
	/**
	 * Creates a new directory with the specified name. If the directory already exists, the behavior may depend on the underlying filesystem's implementation (it might throw an error or do nothing).
	 * @param {string} dirname - The name (and path) of the directory to create.
	 * ```js
	 * Storage.MakeDirectory('new_folder');
	 * ```
	 */
	static MakeDirectory(dirname: string): boolean;
	/**
	 * Lists all files and directories within the specified directory. This method is useful for retrieving the contents of a directory to process or display them, such as generating a list of available files or performing operations on each file.
	 * @param {string} dirname - The name (and path) of the directory whose contents are to be listed.
	 * @return {string[]} An array of names representing the contents of the directory. This may include both files and directories.
	 * ```js
	 * const contents = Storage.ListDirectory('documents');
	 * console.log(contents); // Outputs: ['file1.txt', 'file2.txt', 'subdirectory']
	 * ```
	 */
	static ListDirectory(dirname: string): string[];
	/**
	 * Returns detailed information about a file or directory.
	 * @param  {string} path – Absolute or relative path to inspect.
	 * @return {object|null} stat object from @zos/fs (size, mtime, etc.), or null if the path does not exist.
	 * const info = Storage.FileInfo('data.json');
	 * console.log(info.size);  // bytes
	 */
	static FileInfo(path: string): FileStats | null;
	/**
	 * Checks whether a file or directory exists.
	 * @param  {string} path – Path to test.
	 * @return {boolean} true if present, false otherwise.
	 * if (Storage.Exists('config.json')) { … }
	 */
	static Exists(path: string): boolean;
	/**
	 * Copies one file to another location.
	 * @param {string} src  – Source file path.
	 * @param {string} dest – Destination file path.
	 * Storage.CopyFile('a.txt', 'backup/a.txt');
	 */
	static CopyFile(src: string, dest: string): void;
	/**
	 * Moves (renames) a file.
	 * Implemented as copy + delete so it stays portable.
	 * @param {string} src  – Source file path.
	 * @param {string} dest – Destination file path.
	 * Storage.MoveFile('sensor.json', 'backup/sensor.json');
	 */
	static MoveFile(src: string, dest: string): void;
	/**
	 * Checks if the specified path is a regular file.
	 * @param {string} path - Path to test.
	 * @return {boolean} True if path exists and is a file.
	 * @example
	 * ```
	 * // example: process only actual files, not directories
	 * const items = Storage.ListDirectory('data');
	 * items.forEach(item => {
	 *   if (Storage.IsFile(`data/${item}`)) {
	 *     console.log(`processing file: ${item}`);
	 *   }
	 * });
	 * ```
	 */
	static IsFile(path: string): boolean;
	/**
	 * Checks if the specified path is a directory.
	 * @param {string} path - Path to test.
	 * @return {boolean} True if path exists and is a directory.
	 * @example
	 * ```
	 * // example: check if data folder exists before listing contents
	 * if (Storage.IsDir('user-data')) {
	 *   const files = Storage.ListDirectory('user-data');
	 *   console.log(`found ${files.length} files in user-data`);
	 * }
	 * ```
	 */
	static IsDir(path: string): boolean;
	/**
	 * Gets the size of a file in bytes.
	 * @param {string} path - Path to the file.
	 * @return {number} File size in bytes, or 0 if file doesn't exist.
	 * ```
	 * console.log(Storage.FileSize('big-data.json') / 1024, "KB"); // 1KB (1024B)
	 * ```
	 */
	static FileSize(path: string): number;
	/**
	 * Gets when a file was last modified.
	 * @param {string} path - Path to the file.
	 * @return {number} Last modification time in ms, or 0 if file doesn't exist.
	 * @example
	 * ```
	 * // example: check if config file was recently updated
	 * const last_mod_time = Storage.FileChangeTime('config.json');
	 * const hour_ago = Date.now() - (60 * 60 * 1000);
	 * if (last_mod_time > hour_ago) {
	 *   console.log('config was updated recently:', new Date(last_mod_time));
	 * }
	 * ```
	 */
	static FileChangeTime(path: string): number;
}

export type { FileStats };

// #endregion

// #region EasyTSDB

/**
 * EasyTSDB:
 * - Lightweight time-series database; buffers points in RAM, shards to JSON files
 * - Auto-flush on size or timer keeps RAM low without losing data
 * - Built-in sum/avg/min/max plus pluggable custom aggregations
 * - Indexed file layout accelerates range queries - ideal for sensor logs
 */
export class EasyTSDB {
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
	constructor(options?: any);
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
	writePoint(measurement: string, value: any, timestamp?: number): void;
	/**
	 * Forces the immediate flushing of all data from RAM to disk, ensuring data persistence and durability.
	 * @examples
	 * ```js
	 * // example: manually trigger a flush to disk without waiting for autosave
	 * db.flush();
	 * ```
	 */
	flush(): void;
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
	query(start_time: number, end_time: number, aggregation_type: string, cb_custom_aggregator?: Function): any;
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
	retrieveDataSeries(start_time: number, end_time: number): Array<any>;
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
	purge(older_than: number): void;
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
	databaseClear(consent: string): void;
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
	databaseClose(): void;
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
	databaseBackup(backup_path?: string, include_index?: boolean): void;
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
	databaseRestore(consent: string, backup_path?: string, recalculate_index?: boolean): void;
	#private;
}

// #endregion

// #region EasyStorage

/**
 * EasyStorage:
 * - Single-file JSON blob kept in RAM, synced to disk on every change
 * - Perfect for small settings or user prefs reads/writes
 * - Autosave guarantees data survives app restarts
 * - Simple but rewrites entire file; not ideal for very large datasets
 */
export class EasyStorage {
	constructor(filename?: string);
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
	setKey(key: string, value: any): void;
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
	getKey(key: string, default_value?: any): any;
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
	hasKey(key: string): boolean;
	/**
	 * Removes the specified key and its associated value from the storage.
	 * @param {string} key - The key to remove.
	 * @examples
	 * ```js
	 * // example: remove an existing key
	 * storage.removeKey('name');
	 * ```
	 */
	removeKey(key: string): void;
	/**
	 * Saves all current key-value pairs in the storage to the file. This method is typically used when autosave is disabled.
	 * @examples
	 * ```js
	 * // example: explicitly save all changes to the storage
	 * storage.saveAll();
	 * ```
	 */
	saveAll(): void;
	/**
	 * Clears all key-value pairs in the storage and optionally saves the changes if autosave is enabled.
	 * @examples
	 * ```js
	 * // example: clear all storage contents
	 * storage.deleteAll();
	 * ```
	 */
	deleteAll(): void;
	/**
	 * Prints the contents of the storage to the console.
	 * @examples
	 * ```js
	 * // example: log current storage contents
	 * storage.printContents();
	 * ```
	 */
	printContents(): void;
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
	getStorageSnapshot(stringify?: boolean): string | object;
	/**
	 * Enables or disables the autosave feature.
	 * @param {boolean} bool - `true` to enable autosave, `false` to disable.
	 * @examples
	 * ```js
	 * // example: enable autosave feature
	 * storage.SetAutosaveEnable(true);
	 * ```
	 */
	SetAutosaveEnable(bool: boolean): void;
	/**
	 * Sets the filename for the storage file.
	 * @param {string} filename - The new filename to use for the storage.
	 * @examples
	 * ```js
	 * // example: change the storage filename
	 * storage.SetStorageFilename('new_storage.json');
	 * ```
	 */
	SetStorageFilename(filename: string): void;
	/**
	 * Retrieves the current filename used for the storage.
	 * @returns {string} The current filename.
	 * @examples
	 * ```js
	 * // example: get the current storage filename
	 * console.log(storage.GetStorageFilename()); // "easy_storage.json"
	 * ```
	 */
	GetStorageFilename(): string;
	#private;
}

// #endregion