# 📦 Easy Storage Library for ZeppOS

## EasyStorage 2.0 Update: `AsyncStorage` & `EasyStorageAsync` added!
- This update brings Async storage solutions that don't render block the UI and barely consume any CPU power making UI/UX interaction buttery smooth.
- If you've been with us for a while, you know that our `ZeppOS` storage solution is **slow**, and whenever you read or write a file, the whole UI freezes; moreover the bigger the file, the worse it feels.
- With `AsyncStorage` and `EasyStorageAsync` solutions this is no longer the case. Take a look at the example youtube video below.

<a href="https://youtu.be/DEkwlz1RCa4">
  <img src="https://img.youtube.com/vi/DEkwlz1RCa4/maxresdefault.jpg" width="640" height="360">
</a>

> [!NOTE] 
> This solution should be useful for mini apps that have menus with dynamic updates (quick ON/OFF switch), games and apps that have to write / read data during runtime, as well as advanced watch face developers that rely on storage operations.

## How to use new `AsyncStorage` & `EasyStorageAsync` (bare minimum code samples)
> [!TIP] 
> you can download working example shown above from the [example-apps/showcase](https://github.com/silver-zepp/zeppos-easy-storage/tree/master/example-apps/easy-storage-showcase/) folder

### Install `EasyStorage`
```js
npm i @silver-zepp/easy-storage
```

### 1. `AsyncStorage`
- Queued JSON file operations that won't overwhelm CPU and freeze UI during big writes/reads
- Automatically streams large datasets in small chunks to stay responsive
- Built-in flow control prevents overwhelming the system with too many operations
- Graceful shutdown saves any pending writes before app exits. Add `AsyncStorage.SaveAndQuit();` to your page's onDestroy().

> [!TIP] 
> `AsyncStorage` example page [async-storage.js](https://github.com/silver-zepp/zeppos-easy-storage/tree/master/example-apps/easy-storage-showcase/test-pages/async-storage.js)

```js
import { AsyncStorage } from "@silver-zepp/easy-storage";

// write
AsyncStorage.WriteJson('config.json', { theme: 'dark' }, (err, ok) => {
  if (ok) console.log('config saved!');
});

// read
AsyncStorage.ReadJson('config.json', (err, config) => {
  if (!err) {
    console.log('theme:', config.theme);
    // apply your theme to UI widget
    // ...
  }
});

// === ADDITIONAL HELPERS === //

// example: throttle file operations to prevent overload and RAM runout
if (!AsyncStorage.IsBusy()) {
  AsyncStorage.WriteJson('data.json', big_obj, callback);
} else {
  console.log('storage busy, try again later');
}

// immediately save all pending writes synchronously (if any)
// making sure no data is lost on app crash or a force-close during write times
Page({
  // ...
  onDestroy() {
    AsyncStorage.SaveAndQuit();
  },
})
```

### 2. `EasyStorageAsync`
- Single-file JSON blob kept in RAM, synced to disk without blocking UI
- Perfect for larger settings/prefs that might cause stutter with sync writes
- Queued autosave prevents overwhelming the storage system
- Same API as EasyStorage but all operations use callbacks

> [!TIP] 
> `EasyStorageAsync` example page [easy-storage-async.js](https://github.com/silver-zepp/zeppos-easy-storage/tree/master/example-apps/easy-storage-showcase/test-pages/easy-storage-async.js)

For the most part API remains the same as `EasyStorage` (sync) and works as a drop in replacement, reusing its old storage database file `easy_storage.js` but there are a few areas you have to pay attention to observing the example.
```js
// basic interaction remains the same
import { EasyStorageAsync } from "@silver-zepp/easy-storage";
const storage = new EasyStorageAsync();

Page({
  onInit() {
    // ===============================
    // Manual Storage Synchronization:
    // ===============================
    // by default EasyStorageAsync loads its database file in a lazy-load async manner to avoid UI lag
    // without manual syncronization, your keys might not be available at access time
    // this is (optional) and should be used only when data concistency is necessary right away.
    // the sync, if necessary, has to be done only once. after that, the whole DB remains in RAM
    if (!storage.isReady()) storage.synchronize();
  },
  build() {
    storage.setKey("name", "John");       // set the key
    const name = storage.getKey("name");  // get the key
  },
  onDestroy() {
    // immediately save all pending writes synchronously (if any)
    // making sure no data is lost on app crash or a force-close during write times
    storage.saveAndQuit();
  }
})

// === ADDITIONAL ASYNC BENEFITS === //

// now that the writes are asynchronous you can rely on write callback when the value finished storing
storage.setKey('theme', 'dark', (err, ok) => {
  if (ok) console.log('saved without blocking UI');
});
```

### The rest of the API remains mostly the same and you can read about it below

### 3. `EasyStorage` [[Read API🔗]](./docs/easy-storage.md)
 - Single-file JSON blob kept in RAM, synced to disk on every change
 - Perfect for small settings or user prefs reads/writes
 - Autosave guarantees data survives app restarts
 - Simple but rewrites entire file; not ideal for very large datasets
```js
import { EasyStorage } from "@silver-zepp/easy-storage";
const storage = new EasyStorage();

storage.setKey("name", "John Doe");
console.log(storage.getKey("user")); // "John Doe"
```

### 4. `EasyTSDB` [[Read API🔗]](./docs/easy-tsdb.md)
- Lightweight time-series database; buffers points in RAM, shards to JSON files
- Auto-flush on size or timer keeps RAM low without losing data
- Built-in sum/avg/min/max plus pluggable custom aggregations
- Indexed file layout accelerates range queries - ideal for sensor logs
```js
import { EasyTSDB } from "@silver-zepp/easy-storage";
const db = new EasyTSDB();

// write some data points
db.writePoint('temperature', 22.5); // if not provided -> use the current timestamp
db.writePoint('humidity', 55, Date.now() - 60 * 60 * 1000); // 1 hour ago

// query the average temperature over the last 2 hours
const start_time = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
const end_time = Date.now();
const avg_temp = db.query(start_time, end_time, 'average');

console.log(`Average temperature over the last 2 hours: ${avg_temp}`);
```

### 5. `EasyFlashStorage` [[Read API🔗]](./docs/easy-flash-storage.md)
- Handles data sets that are too large for EasyStorage's single-blob model
- Minimizes RAM usage – only the file you're working with is loaded
- Reduces flash wear: small writes instead of rewriting a big file
- Survives unexpected reboots; corruption is isolated to one key

```js
import { EasyFlashStorage } from "@silver-zepp/easy-storage";
const flash = new EasyFlashStorage();

flash.setKey("config", { theme: "dark", notifications: true, ... });
console.log(flash.getKey("config"));
```

### 6. `EasyTempStorage` [[Read API🔗]](./docs/easy-temp-storage.md)
- Pure in-memory key-value cache, zero disk I/O
- Fastest choice for data that matters only while the app is open
- Cleared automatically on exit; no cleanup needed
- Shares EasyStorage-style API for easy swapping
```js
import { EasyTempStorage } from "@silver-zepp/easy-storage";
const temp = new EasyTempStorage();

temp.setKey("session", { token: "abc123" });
console.log(temp.getKey("session"));
```

### 7. `Storage` [[Read API🔗]](./docs/storage.md)
- Direct file operations that happen immediately and block until complete
- Perfect for small files and simple read/write tasks where you need the result right away
- No queuing or async complexity - just straightforward "save this now" functionality
- Use `AsyncStorage` instead if you're dealing with large files or don't want UI stuttering

```js
import { Storage } from "@silver-zepp/easy-storage";

Storage.WriteFile("log.txt", "log entry example");
console.log(Storage.ReadFile("log.txt"));
```

# 📐 Library Quick API
### EasyStorageAsync
- `setKey(key, value, callback?)`: Stores a value; queued to disk without blocking UI.
- `getKey(key, defaultValue?)`: Returns a value immediately from RAM (or default).
- `hasKey(key)`: Returns `true` if the key exists in RAM.
- `removeKey(key, callback?)`: Deletes a key; write is queued.
- `saveAll(callback?)`: Flushes all in-RAM data to disk now.
- `deleteAll(callback?)`: Clears every key and saves an empty blob.
- `printContents()`: Logs the current in-RAM store to console.
- `getStorageSnapshot(stringify?)`: Returns the whole store as object or JSON string.
- `saveAndQuit()`: Forces final flush; returns `{ saved }` count.
- `isBusy()`: `true` when the internal queue is saturated.
- `SetAutosaveEnable(bool)`: Toggles periodic autosave timer.
- `SetStorageFilename(filename)`: Changes the on-disk filename for future saves.
- `GetStorageFilename()`: Returns the current filename in use.
- `isReady()`: `true` once the initial async load has finished.
- `synchronize()`: Synchronous fallback; loads file into RAM instantly.

### AsyncStorage
- `WriteJson(filename, json, callback?)`: Queues a JSON write; non-blocking.
- `ReadJson(filename, callback?)`: Queues a JSON read and parses result.
- `RemoveFile(filename, callback?)`: Deletes a file (quick sync op).
- `IsBusy()`: Returns `true` if the operation queue is near capacity.
- `SaveAndQuit()`: Flushes all pending writes and returns `{ saved }` count.

### EasyStorage
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

### EasyTSDB (time-series database)
- `writePoint(measurement, value, timestamp)`: Writes a data point.
- `query(start_time, end_time, aggregation_type, custom_aggregator)`: Queries data with aggregation.
- `retrieveDataSeries(start_time, end_time)`: Retrieves raw data points.
- `purge(older_than)`: Removes data points older than a specified timestamp.
- `databaseClear(consent)`: Clears all database data.
- `databaseClose()`: Closes the database, flushing data to disk.
- `databaseBackup(backup_path, include_index)`: Backups the database.
- `databaseRestore(consent, backup_path, recalculate_index)`: Restores the database from a backup.

### EasyFlashStorage
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

### EasyTempStorage
- `setKey(key, value)`: Temporarily stores a value for a key.
- `getKey(key, defaultValue)`: Retrieves a value of a key.
- `hasKey(key)`: Checks existence of a key.
- `removeKey(key)`: Deletes a key and its value.
- `deleteAll()`: Clears all keys and values.
- `printAllKeys()`: Displays all keys and values.
- `getAllKeys(stringify)`: Lists all keys in temporary storage.

### Storage
- `WriteJson(filename,json)` : Writes a JSON object to a file.
- `ReadJson(filename)`: Reads a JSON object from a file.
- `WriteFile(filename, data)`: Writes data to a file.
- `ReadFile(filename)`: Reads data from a file.
- `RemoveFile(filename)`: Deletes a file.
- `WriteAsset(filename, data)`: Writes data to an asset file.
- `ReadAsset(filename)`: Reads data from an asset file.
- `MakeDirectory(dirname)`: Creates a new directory.
- `ListDirectory(dirname)`: Lists contents of a directory.
- `FileInfo(path)`: Returns size, mtime and other stats for a file or dir.
- `Exists(path)`: Checks whether a file or directory exists.
- `CopyFile(src, dest)`: Copies a file to a new location.
- `MoveFile(src, dest)`: Moves (renames) a file; implemented as copy + delete.
- `IsFile(path)`: Returns `true` if the path points to a regular file.
- `IsDir(path)`: Returns `true` if the path points to a directory.
- `FileSize(path)`: Returns the size of a file in bytes (0 if missing).
- `FileChangeTime(path)`: Returns the last-modified timestamp in ms.

# 📝 EasyStorage API Reference
### 1. [EasyStorage API🔗](./docs/easy-storage.md)
### 2. [EasyTSDB API🔗](./docs/easy-tsdb.md)
### 3. [EasyFlashStorage API🔗](./docs/easy-flash-storage.md)
### 4. [EasyTempStorage API🔗](./docs/easy-temp-storage.md)
### 5. [Storage API🔗](./docs/storage.md)
