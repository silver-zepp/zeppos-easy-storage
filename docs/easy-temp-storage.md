## 📦 EasyTempStorage for ZeppOS

#### Description
`EasyTempStorage` is designed for temporary, in-memory data storage. It's ideal for data that needs to be accessible throughout the app's lifecycle but not persisted between sessions. This makes it perfect for session data, temporary caches, or any scenario where data persistence beyond the app's current session is unnecessary.

## To install the library run (from the root of your project)
`npm i @silver-zepp/easy-storage`

## Navigation
#### [[ 📁 Download examples ]](../example-apps/) 
#### [[ 📐 Class Map ]](#map)
#### [[ 📝 API Reference ]](#apireference)
#### [[ ⬅️ Back to Index ]](../README.md)

## Example
```js
import { EasyTempStorage } from "@silver-zepp/easy-storage";
const temp = new EasyTempStorage();

temp.setKey("session", { token: "abc123" });
console.log(temp.getKey("session"));
```

# 📐 EasyTempStorage Class Map  <a id="map"></a>
- `setKey(key, value)`: Temporarily stores a value for a key.
- `getKey(key, defaultValue)`: Retrieves a value of a key.
- `hasKey(key)`: Checks existence of a key.
- `removeKey(key)`: Deletes a key and its value.
- `deleteAll()`: Clears all keys and values.
- `printAllKeys()`: Displays all keys and values.
- `getAllKeys(stringify)`: Lists all keys in temporary storage.

# 📝 EasyTempStorage API Reference  <a id="apireference"></a>
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
