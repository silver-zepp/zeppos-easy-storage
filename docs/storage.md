## 📦 Storage Utility for ZeppOS

#### Description
`Storage` is a utility library that provides static methods for direct file operations. This includes reading and writing JSON objects, text, and binary data directly to and from the filesystem.

## To install the library run (from the root of your project)
`npm i @silver-zepp/easy-storage`

## Navigation
#### [[ 📁 Download examples ]](../example-apps/) 
#### [[ 📐 Class Map ]](#map)
#### [[ 📝 API Reference ]](#apireference)
#### [[ ⬅️ Back to Index ]](../README.md)

## Example
```js
import { Storage } from "@silver-zepp/easy-storage";

Storage.WriteFile("log.txt", "log entry example");
console.log(Storage.ReadFile("log.txt"));
```

# 📐 Storage Utility Class Map  <a id="map"></a>
- `WriteJson(filename,json)` : Writes a JSON object to a file.
- `ReadJson(filename)`: Reads a JSON object from a file.
- `WriteFile(filename, data)`: Writes data to a file.
- `ReadFile(filename)`: Reads data from a file.
- `RemoveFile(filename)`: Deletes a file.
- `WriteAsset(filename, data)`: Writes data to an asset file.
- `ReadAsset(filename)`: Reads data from an asset file.
- `MakeDirectory(dirname)`: Creates a new directory.
- `ListDirectory(dirname)`: Lists contents of a directory.

# 📝 EasyStorage API Reference  <a id="apireference"></a>
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