## 📦 EasyStorage for ZeppOS (default class)

#### Description
`EasyStorage` offers lightweight, JSON storage solution designed for managing simple data structures efficiently. Ideal for small-scale applications or temporary data holding, it automates the persistence of changes to ensure data integrity. Your data is permanently stored on the device and will be restored next time the app is open. The whole database remains in RAM and filesystem.

## To install the library run (from the root of your project)
`npm i @silver-zepp/easy-storage`

## Navigation
#### [[ 📁 Download examples ]](../example-apps/) 
#### [[ 📐 Class Map ]](#map)
#### [[ 📝 API Reference ]](#apireference)
#### [[ ⬅️ Back to Index ]](../README.md)

## Example
```js
import { EasyStorage } from "@silver-zepp/easy-storage";
const storage = new EasyStorage();

storage.setKey("name", "John Doe");
console.log(storage.getKey("user")); // "John Doe"
```

# 📐 EasyStorage Class Map  <a id="map"></a>
- `setKey(key, value)`: Stores or updates a value for a key.
- `getKey(key, defaultValue)`: Retrieves the value of a key.
- `hasKey(key)`: Checks existence of a key.
- `removeKey(key)`: Deletes a key and its associated value.
- `saveAll()`: Forces saving all key-value pairs to the file.
- `deleteAll()`: Deletes all keys and values.
- `printContents()`: Displays all storage contents.
- `getStorageSnapshot(stringify)`: Returns storage contents as a string or object.
- `SetAutosaveEnable(bool)`: Enables or disables autosave.
- `SetStorageFilename(filename)`: Changes the storage file name.
- `GetStorageFilename()`: Returns the current storage filename.

# 📝 EasyStorage API Reference  <a id="apireference"></a>
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