# 💿 Easy Storage Library for ZeppOS

### Description
The `Easy Storage` library offers a suite of storage solutions designed for ZeppOS applications, providing a range of data persistence strategies to accommodate different data management needs. With `EasyStorage`, `EasyFlashStorage`, and `EasyTempStorage`, developers can choose between in-memory storage, persistent file-based storage, and temporary volatile storage, making data handling both flexible and efficient.

## Installation
To install the library, run the following command from the root of your project:

```bash
npm i @silver-zepp/easy-storage
```

## ✨️ Examples

### 1. Using `EasyStorage` for Persistent Storage [API](#easystorage)
A lightweight, hybrid storage solution combining in-memory efficiency with filesystem persistence, ideal for small to medium-sized data.
```js
import EasyStorage from "@silver-zepp/easy-storage";
const storage = new EasyStorage();

storage.setKey("name", "John Doe");
console.log(storage.getKey("user")); // "John Doe"
```

### 2. Using `EasyFlashStorage` for Large, Persistent Storage [API](#easyflashstorage)
Designed for heavy-duty storage needs, it leverages filesystem-based persistence to handle large datasets without compromising performance and saving RAM.
```js
import { EasyFlashStorage } from "@silver-zepp/easy-storage";
const flash = new EasyFlashStorage();

flash.setKey("config", { theme: "dark", notifications: true, ... });
console.log(flash.getKey("config"));
```

### 3. Using `EasyTempStorage` for Temporary, Volatile Storage [API](#easytempstorage)
Offers a transient, in-memory storage space for temporary data, ensuring fast access speeds and automatic clearance upon application closure.
```js
import { EasyTempStorage } from "@silver-zepp/easy-storage";
const temp = new EasyTempStorage();

temp.setKey("session", { token: "abc123" });
console.log(temp.getKey("session"));
```

### 4. Direct File Operations with `Storage` Utility [API](#storage-utility)
A utility library providing straightforward, static methods for direct file operations, simplifying reading and writing of data to the filesystem.
```js
import { Storage } from "@silver-zepp/easy-storage";

Storage.WriteFile("log.txt", "log entry example");
console.log(Storage.ReadFile("log.txt"));
```

# 📝 EasyStorage API Reference
## 📍 EasyStorage (default class) <a id="easystorage"></a>
#### Description
`EasyStorage` offers lightweight, JSON storage solution designed for managing simple data structures efficiently. Ideal for small-scale applications or temporary data holding, it automates the persistence of changes to ensure data integrity. Your data is permanently stored on the device and will be restored next time the app is open. The whole database remains in RAM and filesystem.


### `setKey(key, value)`
Sets a value for a specified key within the storage. If the key already exists, its value is updated.

#### Parameters
- `key` {string} - The key under which to store the value.
- `value` {any} - The value to store. Can be any type that is serializable to JSON.

#### Examples
```js
// set a simple value
storage.setKey('username', 'johnDoe');
// set an object
storage.setKey('user', { name: 'John', age: 30 });
// updating an existing key
storage.setKey('username', 'johnDoeUpdated');
```

### Returns
`void`

---

### `getKey(key, defaultValue)`
Retrieves the value associated with the specified key from the storage. If the key is not found, returns the default value if provided, or `undefined`.

#### Parameters
- `key` {string} - The key whose value to retrieve.
- `defaultValue` {any} - Optional. The default value to return if the key does not exist.

#### Examples
```js
// retrieve an existing key
console.log(storage.getKey('username')); // "johnDoeUpdated"
// retrieve a non-existing key with a default value
console.log(storage.getKey('nonexistent', 'defaultUser')); // "defaultUser"
```

### Returns
`any` - The value associated with the key, or the default value if the key doesn't exist.

---

### `hasKey(key)`
Checks if the specified key exists in the storage.

#### Parameters
- `key` {string} - The key to check for existence.

#### Examples
```js
// check an existing key
console.log(storage.hasKey('username')); // true
// check a non-existing key
console.log(storage.hasKey('nonexistent')); // false
```

### Returns
`boolean` - `true` if the key exists, `false` otherwise.

---

### `removeKey(key)`
Removes the specified key and its associated value from the storage.

#### Parameters
- `key` {string} - The key to remove.

#### Examples
```js
// remove an existing key
storage.removeKey('username');
```

### Returns
`void`

---

### `getAllKeys(stringify)`
Returns all keys stored in the storage, optionally stringified.

#### Parameters
- `stringify` {boolean} - If `true`, returns the keys as a JSON string; otherwise, returns an array of keys.

#### Examples
```js
// get all keys as an array
console.log(storage.getAllKeys());
// get all keys as a JSON string
console.log(storage.getAllKeys(true));
```

### Returns
`string | array` - The keys in the storage as a JSON string if `stringify` is true, or as an array if `stringify` is false.

## 📍 EasyFlashStorage <a id="easyflashstorage"></a>

#### Description
`EasyFlashStorage` provides a filesystem-based storage solution for large or persistent data, suitable for cases where data size exceeds the practical limits of in-memory storage.

### `constructor(directory = "easy_flash_storage")`

Initializes the storage with a specified directory.

#### Parameters
- `directory` {string} - The directory path to use for storage. Defaults to "easy_flash_storage".

#### Examples
```js
const flash = new EasyFlashStorage();
// or
const custom_dir_storage = new EasyFlashStorage('my_custom_dir');
```

### `setKey(key, value)`
Stores or updates a value associated with a key. The value is serialized to JSON and written to a file named after the key.

#### Parameters
- `key` {string} - The key under which to store the value.
- `value` {any} - The value to store, must be serializable to JSON.

#### Examples
```js
flash.setKey('config', { theme: 'dark' });
```

### `getKey(key)`
Retrieves the value associated with the specified key from the storage.

#### Parameters
- `key` {string} - The key whose value to retrieve.

#### Examples
```js
console.log(flash.getKey('config'));
```

### Returns
`any` - The value associated with the key, or `undefined` if not found.

### `hasKey(key)`
Checks if the specified key exists in the storage.

#### Parameters
- `key` {string} - The key to check.

#### Examples
```js
console.log(flash.hasKey('config')); // true or false
```

### Returns
`boolean` - True if the key exists, false otherwise.

### `removeKey(key)`
Removes the specified key and its associated file from the storage.

#### Parameters
- `key` {string} - The key to remove.

#### Examples
```js
flash.removeKey('config');
```

### `getAllKeys(stringify = false)`
Retrieves all keys stored in the storage, optionally stringified.

#### Parameters
- `stringify` {boolean} - If true, returns the keys as a JSON string; otherwise, as an array.

#### Examples
```js
console.log(flash.getAllKeys());
console.log(flash.getAllKeys(true));
```

### Returns
`string | array` - The keys as a JSON string if `stringify` is true, or as an array if false.

### `deleteAll()`
Removes all keys and their associated values from the storage.

#### Examples
```js
flash.deleteAll();
```

### `printAllKeys()`
Prints all keys and their associated values to the console.

#### Examples
```js
flash.printAllKeys();
```

### `dataSize(key, unit = 'B')`
Returns the size of the data associated with a specific key.

#### Parameters
- `key` {string} - The key whose data size to retrieve.
- `unit` {string} - The unit of measurement ('B', 'KB', 'MB'). Defaults to 'B'.

#### Examples
```js
console.log(flash.dataSize('config'));
console.log(flash.dataSize('config', 'KB'));
```

### `size(unit = 'B')`
Calculates the total size of all stored data.

#### Parameters
- `unit` {string} - The unit of measurement ('B', 'KB', 'MB'). Defaults to 'B'.

#### Examples
```js
console.log(flash.size());
console.log(flash.size('KB'));
```
## 📍 EasyTempStorage <a id="easytempstorage"></a>

#### Description
`EasyTempStorage` is designed for temporary, in-memory data storage. It's ideal for data that needs to be accessible throughout the app's lifecycle but not persisted between sessions. This makes it perfect for session data, temporary caches, or any scenario where data persistence beyond the app's current session is unnecessary.

### `constructor()`
Initializes the temporary storage instance.

#### Examples
```js
const temp = new EasyTempStorage();
```

### `setKey(key, value)`

Stores a value associated with a key in memory. The value is kept until the application is closed or explicitly removed.

#### Parameters
- `key` {string} - The key under which to store the value.
- `value` {any} - The value to store.

#### Examples
```js
temp.setKey('session', { user: 'John Doe', token: 'abc123' });
```

### `getKey(key)`
Retrieves the value associated with the specified key from the storage.

#### Parameters
- `key` {string} - The key whose value to retrieve.

#### Examples
```js
console.log(temp.getKey('session'));
```

### Returns
`any` - The value associated with the key, or `undefined` if not found.

### `hasKey(key)`
Checks if the specified key exists in the storage.

#### Parameters
- `key` {string} - The key to check.

#### Examples
```js
console.log(temp.hasKey('session')); // true or false
```

### Returns
`boolean` - True if the key exists, false otherwise.

### `removeKey(key)`
Removes the specified key and its value from the storage.

#### Parameters
- `key` {string} - The key to remove.

#### Examples
```js
temp.removeKey('session');
```

### `getAllKeys(stringify = false)`
Retrieves all keys stored in the storage, optionally stringified.

#### Parameters
- `stringify` {boolean} - If true, returns the keys as a JSON string; otherwise, as an array.

#### Examples
```js
console.log(temp.getAllKeys());
console.log(temp.getAllKeys(true));
```

### Returns
`string | array` - The keys as a JSON string if `stringify` is true, or as an array if false.

### `deleteAll()`
Removes all keys and their values from the storage.

#### Examples
```js
temp.deleteAll();
```

### `printAllKeys()`
Prints all keys and their associated values to the console.

#### Examples
```js
temp.printAllKeys();
```

## 📍 Storage Utility <a id="storage-utility"></a>

#### Description
`Storage` is a utility library that provides static methods for direct file operations. This includes reading and writing JSON objects, text, and binary data directly to and from the filesystem.

### `WriteJson(filename, json)`
Writes a JSON object to a specified file.

#### Parameters
- `filename` {string} - The name of the file to write the JSON object to.
- `json` {object} - The JSON object to be written.

#### Examples
```js
Storage.WriteJson('config.json', { key: 'value' });
```

### `ReadJson(filename)`
Reads a JSON object from a specified file.

#### Parameters
- `filename` {string} - The name of the file to read the JSON object from.

#### Examples
```js
const config = Storage.ReadJson('config.json');
```

### Returns
`object` - The JSON object read from the file.

### `WriteFile(filename, data)`
Writes data to a specified file.

#### Parameters
- `filename` {string} - The name of the file to write data to.
- `data` {string|ArrayBuffer} - The data to be written.

#### Examples
```js
Storage.WriteFile('example.txt', 'Hello, World!');
```

### `ReadFile(filename)`
Reads data from a specified file.

#### Parameters
- `filename` {string} - The name of the file to read data from.

#### Examples
```js
const data = Storage.ReadFile('example.txt');
```

### Returns
`string` - The data read from the file.

### `RemoveFile(filename)`
Removes a specified file from the filesystem.

#### Parameters
- `filename` {string} - The name of the file to be removed.

#### Examples
```js
Storage.RemoveFile('obsolete_data.txt');
```

### `WriteAsset(filename, data)`, `ReadAsset(filename)`
Methods for writing to and reading from asset files, functioning similarly to their file counterparts but intended for asset management.

