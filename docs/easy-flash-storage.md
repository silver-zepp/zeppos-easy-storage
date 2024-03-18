## 📦 EasyFlashStorage for ZeppOS

#### Description
`EasyFlashStorage` provides a filesystem-based storage solution for large or persistent data, suitable for cases where data size exceeds the practical limits of in-memory storage.

## To install the library run (from the root of your project)
`npm i @silver-zepp/easy-storage`

## Navigation
#### [[ 📁 Download examples ]](../example-apps/) 
#### [[ 📐 Class Map ]](#map)
#### [[ 📝 API Reference ]](#apireference)
#### [[ ⬅️ Back to Index ]](../README.md)

## Example
```js
import { EasyFlashStorage } from "@silver-zepp/easy-storage";
const flash = new EasyFlashStorage();

flash.setKey("config", { theme: "dark", notifications: true, ... });
console.log(flash.getKey("config"));
```

# 📐 EasyFlashStorage Class Map  <a id="map"></a>
- `setKey(key, value)`: Stores or updates a value for a key, saving it to a file.
- `getKey(key)`: Retrieves the value of a key from a file.
- `removeKey(key)`: Deletes a file associated with a key.
- `hasKey(key)`: Checks for the existence of a file for a key.
- `dataSize(key, unit)`: Calculates the size of a file for a key.
- `size(unit)`: Calculates the total size of all storage files.
- `getAllKeys(stringify)`: Lists all keys in storage.
- `getAllValues(stringify)`: Lists all values in storage.
- `getStorageSnapshot(stringify)`: Returns all storage contents as a string or object.
- `deleteAll()`: Deletes all keys and values, removing associated files.
- `printAllKeys()`: Displays all keys and their values.

# 📝 EasyFlashStorage API Reference  <a id="apireference"></a>
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