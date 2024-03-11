export function ab2str(buffer: any): any;
/**
 * EasyFlashStorage: An extension of EasyStorage, tailored for handling larger datasets by offloading data
 * to the filesystem. It offers a more scalable storage option while maintaining a minimalistic API, making it
 * suitable for applications with heavier data requirements.
 * */
export class EasyFlashStorage {
    /**
     * Initializes the EasyFlashStorage with a specified directory.
     * @param {string} [directory="easy_flash_storage"] - The directory to use for storage.
     * @example
     * ```js
     * const storage = new EasyFlashStorage('my_custom_directory');
     * ```
     */
    constructor(directory?: string);
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
/**
 * EasyTempStorage provides a temporary, in-memory key-value store.
 * It's designed for temporary data storage within the lifespan of the application.
 * Data stored in EasyTempStorage is not persisted to disk and will be lost when the application is closed,
 * making it suitable for transient data that does not require long-term persistence.
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
    static WriteJson(filename: string, json: object): void;
    /**
     * Reads a JSON object from a specified file.
     * @param {string} filename - The name of the file to read the JSON object from.
     * @return {object} The JSON object read from the file.
     * @example
     * ```js
     * const config = Storage.ReadJson('config.json');
     * ```
     */
    static ReadJson(filename: string): object;
    /**
     * Writes data to a specified file.
     * @param {string} filename - The name of the file to write data to.
     * @param {string|ArrayBuffer} data - The data to be written.
     * @example
     * ```js
     * Storage.WriteFile('example.txt', 'Hello, World!');
     * ```
     */
    static WriteFile(filename: string, data: string | ArrayBuffer): void;
    /**
     * Reads data from a specified file.
     * @param {string} filename - The name of the file to read data from.
     * @return {string} The data read from the file.
     * @example
     * ```js
     * const data = Storage.ReadFile('example.txt');
     * ```
     */
    static ReadFile(filename: string): string;
    /**
     * Removes a specified file from the filesystem.
     * @param {string} filename - The name of the file to be removed.
     * @example
     * ```js
     * Storage.RemoveFile('obsolete_data.txt');
     * ```
     */
    static RemoveFile(filename: string): void;
    /**
     * Writes data to a specified asset file.
     * @param {string} filename - The name of the asset file to write data to.
     * @param {string|ArrayBuffer} data - The data to be written.
     * @example
     * ```js
     * Storage.WriteAsset('image.png', image_data);
     * ```
     */
    static WriteAsset(filename: string, data: string | ArrayBuffer): void;
    /**
     * Reads data from a specified asset file.
     * @param {string} filename - The name of the asset file to read data from.
     * @return {string} The data read from the asset file.
     * @example
     * ```js
     * const image = Storage.ReadAsset('image.png');
     * ```
     */
    static ReadAsset(filename: string): string;
}
export default EasyStorage;
/**
 * EasyStorage: A lightweight, JSON storage solution designed for managing simple data structures efficiently.
 * Ideal for small-scale applications or temporary data holding, it automates the persistence of changes to ensure data
 * integrity. Your data is permanently stored on the device and will be restored next time the app is open.
 * The whole database remains in RAM and filesystem.
 * */
declare class EasyStorage {
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
     * const keys = storage.getAllKeys();
     * console.log(JSON.stringify(keys));
     *
     * // example: get all storage keys as a string
     * console.log(storage.getAllKeys(true));
     * ```
     */
    getAllKeys(stringify?: boolean): string | object;
    /**
   * @deprecated This method is deprecated and will be removed in the future. Please use getAllKeys instead.
   */
    getContents(stringify?: boolean): {};
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
