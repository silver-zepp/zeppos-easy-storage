# 📦 Easy Storage Library for ZeppOS

### Description
The `EasyStorage` suite is a handy set of tools for `ZeppOS` applications. It includes `EasyStorage`, `EasyFlashStorage`, and `EasyTempStorage`. These tools give developers a wide range of options for managing data, from storing it in memory or in files, to using temporary storage. Each tool is designed to meet specific storage needs, making it easier and more efficient to handle application data. Next to these the suite has a `Storage` utility library that offers static methods for direct file operations. This includes reading and writing JSON objects, text, and binary data directly to and from the filesystem.

Alongside these storage solutions, we have `EasyTSDB` (time-series database). It’s a special part of the `EasyStorage` suite that’s all about managing time-series data. Just like `InfluxDB`, `EasyTSDB` is great at storing, retrieving, and analyzing time-series data. It uses a mix of `RAM` and filesystem storage to manage data effectively, and can handle data flushes to disk when `RAM` gets full. It’s perfect for applications that need to manage time-series data effectively, and it supports custom aggregation and querying over specific time ranges.

<img src="./assets/easy-tsdb-hr-example.gif" width="100%">

## Installation
To install the library, run the following command from the root of your project:

`npm i @silver-zepp/easy-storage`

## ✨️ Examples

### ➡️ 1. Using `EasyStorage` for Persistent Storage [[Read API🔗]](./docs/easy-storage.md)
A lightweight, hybrid storage solution combining in-memory efficiency with filesystem persistence, ideal for small to medium-sized data.
```js
import EasyStorage from "@silver-zepp/easy-storage";
const storage = new EasyStorage();

storage.setKey("name", "John Doe");
console.log(storage.getKey("user")); // "John Doe"
```

### ➡️ 2. Analyzing Time-Series Data with `EasyTSDB` [[Read API🔗]](./docs/easy-tsdb.md)
Efficiently manage and analyze time-series data, supporting a wide array of aggregation functions for comprehensive data analysis, making it perfect for applications requiring detailed time-based insights.
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

### ➡️ 3. Using `EasyFlashStorage` for Large, Persistent Storage [[Read API🔗]](./docs/easy-flash-storage.md)
Designed for heavy-duty storage needs, it leverages filesystem-based persistence to handle large datasets without compromising performance and saving RAM.
```js
import { EasyFlashStorage } from "@silver-zepp/easy-storage";
const flash = new EasyFlashStorage();

flash.setKey("config", { theme: "dark", notifications: true, ... });
console.log(flash.getKey("config"));
```

### ➡️ 4. Using `EasyTempStorage` for Temporary, Volatile Storage [[Read API🔗]](./docs/easy-temp-storage.md)
Offers a transient, in-memory storage space for temporary data, ensuring fast access speeds and automatic clearance upon application closure.
```js
import { EasyTempStorage } from "@silver-zepp/easy-storage";
const temp = new EasyTempStorage();

temp.setKey("session", { token: "abc123" });
console.log(temp.getKey("session"));
```

### ➡️ 5. Direct File Operations with `Storage` Utility [[Read API🔗]](./docs/storage.md)
A utility library providing straightforward, static methods for direct file operations, simplifying reading and writing of data to the filesystem.
```js
import { Storage } from "@silver-zepp/easy-storage";

Storage.WriteFile("log.txt", "log entry example");
console.log(Storage.ReadFile("log.txt"));
```

# 📝 EasyStorage API Reference
### 1. [EasyStorage API🔗](./docs/easy-storage.md)
### 2. [EasyTSDB API🔗](./docs/easy-tsdb.md)
### 3. [EasyFlashStorage API🔗](./docs/easy-flash-storage.md)
### 4. [EasyTempStorage API🔗](./docs/easy-temp-storage.md)
### 5. [Storage API🔗](./docs/storage.md)
