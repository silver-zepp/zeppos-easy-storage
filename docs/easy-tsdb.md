## 📦 EasyTSDB (Time-Series DataBase) for ZeppOS

### Description
`EasyTSDB` is a time-series database extension similar to `InfluxDB` optimized for efficient storage and retrieval of time-series data. It leverages a combination of RAM and filesystem storage to manage data efficiently, with capabilities to handle data flushes to disk upon reaching RAM capacity limits. Designed for applications requiring effective time-series data management, it supports custom aggregation and querying over specific time ranges.

<img src="../assets/easy-tsdb-hr-example.gif" width="100%">

### Features
- Efficient Data Management: Utilizes both RAM and filesystem for data storage, ensuring fast access and persistence while managing memory usage effectively.
- Customizable Data Aggregation: Supports various built-in aggregation types such as sum, average, min, max, and more, as well as the ability to define custom aggregation functions, catering to a wide range of data analysis requirements.
- Time Range Queries: Offers the capability to perform queries over specific time ranges, enabling users to analyze trends, patterns, and anomalies within their time-series data efficiently.
- Flexible Time Frames: Accommodates data in various time frames (e.g., hourly, minutely), allowing for versatile data organization and retrieval.
- Data Persistence and Recovery: Provides features for data flushing, backup, and restoration, ensuring data durability and the ability to recover from unexpected data loss.

## To install the library run (from the root of your project)
`npm i @silver-zepp/easy-storage`

## Navigation
#### [[ 📁 Download examples ]](../example-apps/) 
#### [[ 📐 Class Map ]](#map)
#### [[ 🏛️ Architecture ]](#architecture)
#### [[ 📝 API Reference ]](#apireference)
#### [[ ⬅️ Back to Index ]](../README.md)

## Example
```js
// install -> npm i @silver-zepp/easy-storage -> import
import { EasyTSDB } from "@silver-zepp/easy-storage";

// initialize the database with default options
const db = new EasyTSDB();

// write some temperature and humidity data points
db.writePoint('temperature', 22.5); // if not provided -> use the current timestamp
db.writePoint('humidity', 55, Date.now() - 60 * 60 * 1000); // 1 hour ago

// query the average temperature over the last 2 hours
const two_hours_ago = Date.now() - 2 * 60 * 60 * 1000;
const now = Date.now();
const avg_temp = db.query(two_hours_ago, now, 'average', null);

console.log(`Average temperature over the last 2 hours: ${avg_temp}`);

// purge data points older than 24 hours
const one_day_ago = Date.now() - 24 * 60 * 60 * 1000;
db.purge(one_day_ago);

// close the database gracefully before your application exits
onDestroy(){
    db.databaseClose();
}

// optionally: 
// manual backup
db.databaseBackup('my_backup.json');
// then restore
db.databaseRestore('my_backup.json');
```

## Full list of currently supported Aggregators
- `sum`: Calculates the total sum of the values in the specified time range.
- `average` (or avg): Computes the mean of the values over the selected period.
- `min`: Finds the minimum value among the data points within the time frame.
- `max`: Identifies the maximum value from the data points in the given range.
- `count`: Counts the number of data points present within the specified interval.
- `median`: Determines the middle value when the data points are arranged in ascending order.
- `mode`: Identifies the most frequently occurring value(s) in the data set.
- `stddev` (Standard Deviation): Measures the amount of variation or dispersion of the set of values.
- `first`: Returns the first data value in the series for the selected time range.
- `last`: Retrieves the last data value in the series within the specified interval.
- `range`: Calculates the difference between the maximum and minimum values.
- `iqr` (Interquartile Range): Measures the spread of the middle 50% of data points, indicating variability.
- `variance`: Indicates how widely the data points in a set are spread from the average.
- `percentile_<N>`: Finds the value below which a certain percentage (N) (percentile_90 = 90%) of observations fall.
- `rate_of_change`: Calculates the rate of change between consecutive data points.
- `trend`: Indicates the overall direction of data points over time (up, down, steady).
- `custom`: User-specified, function passed to query as the fourth parameter.

# 📐 EasyTSDB Class Map  <a id="map"></a>
- `writePoint(measurement, value, timestamp)`: Writes a data point.
- `query(start_time, end_time, aggregation_type, custom_aggregator)`: Queries data with aggregation.
- `retrieveDataSeries(start_time, end_time)`: Retrieves raw data points.
- `purge(older_than)`: Removes data points older than a specified timestamp.
- `databaseClear(consent)`: Clears all database data.
- `databaseClose()`: Closes the database, flushing data to disk.
- `databaseBackup(backup_path, include_index)`: Backups the database.
- `databaseRestore(consent, backup_path, recalculate_index)`: Restores the database from a backup.

# 🏛️ EasyTSDB Library Architecture <a id="architecture"></a>
## 1. Index File Content Visualization
```json
{
  "2024_03_15": {
    "12": 1,    // hour 12 -> exists "true"
    "13": {
      "00": 1,
      "15": 1   // minute 15 -> exists
    }
  }
}
```
This structure allows for different granularity (hourly and minutely) depending on the `time_frame` setting. Where `1` indicates the existence of the entry file on disk.

### 2. Folder Structure for Hourly and Minute Data Files
    easy_timeseries_db/
    ├── 2024_03_15_12.json (Hourly file containing data points within the 12th hour)
    ├── 2024_03_15_12_30.json (Minute file containing data points for 12:30)
    └── 2024_03_15_12_45.json (Minute file containing data points for 12:45)

### 3. Data File Content Structure
```json
├── 2024_03_15_12.json
[
  {"m": "temperature", "v": 22.5, "t": 1647061200000},
  {"m": "humidity", "v": 45, "t": 1647061200000},
  {"m": "light", "v": 200, "t": 1647064800000},
  {"m": "motion", "v": 1, "t": 1647068400000},
  {"m": "energy_consumption", "v": 350, "t": 1647072000000}
]
```
The choice to abbreviate `value` as `v`, `measurement` as `m`, and `timestamp` as `t` in the data structure was made with both storage efficiency and performance in mind. Shorter keys result in smaller file sizes, which translates to lower disk space usage. This is particularly important for embedded systems where storage is at a premium. Additionally, smaller data sizes mean faster read and write operations, as there is less data to serialize or deserialize when loading from or saving to disk.

### 4. Backup Folder Structure Visualization
    easy_tsdb_backups/
    └── easy_tsdb_backup.json (Backup file containing a JSON of all data points and optionally the index)

### 5. Caching and Lazy Loading
    +-------------+      +-----------------+      +----------------+
    |             |      |                 |      |                |
    |  User Query +----->+  Query Caching  +----->+  Data on Disk  |
    |             |      |                 |      |                |
    +-------------+      +-----------------+      +----------------+
                                |                        ^
                                |                        |
                                |     +------------+     |
                                +---->+ Lazy  Load +-----+
                                      +------------+

`EasyTSDB` implements caching mechanisms for queries and lazy loading for data retrieval. Caching query results reduces the need to recompute aggregations or rerun queries if the underlying data has not changed, thereby speeding up repeated queries over the same time range. Lazy loading minimizes memory usage by loading data from disk only when it is needed for a query, rather than keeping all data in memory.

### 6. Automated Data Management
    +-------------+      +---------------------+      +--------------+
    |             |      |                     |      |              |
    | Data Writes +----->+  Automatic Indexing +----->+ Index on Disk|
    |             |      |                     |      |              |
    +-------------+      +---------------------+      +--------------+
                                   |
                                   |
                                   v
                         +---------------------+
                         |                     |
                         |  Autosave Mechanism |
                         |                     |
                         +----------+----------+
                                    |
                                    v
                          +-------------------+
                          |                   |
                          |   Data Flush to   |
                          |       Disk        |
                          |                   |
                          +-------------------+
Features like autosaving and automatic index management reduce the manual overhead required to ensure data integrity and consistency. The library handles the complexities of managing the file system and index.


# 📝 EasyTSDB API Reference <a id="apireference"></a>
### `constructor(options)`
Initializes the EasyTSDB with customizable options.

#### Parameters
- `options` {Object} - Configuration options for the database setup, including directory, time frame, maximum RAM usage, and autosave interval.

#### Examples
```js
// basic initialization with default options
const db = new EasyTSDB();

// initialization with custom settings
// note: using time_frame: 'minute' is currently not recommended due to its performance (only if really needed!)
const db = new EasyTSDB({
    directory: 'custom_timeseries_db',
    time_frame: 'minute',
    max_ram: 500 * 1024, // 500KB
    autosave_interval: 120 // 2 minutes in seconds
});
```

### `writePoint(measurement, value, timestamp)`
Writes a data point to the database.

#### Parameters
- `measurement` {string} - The name of the measurement.
- `value` {*} - The value associated with the data point.
- `timestamp` {number} - Optional. The timestamp for the data point. Defaults to the current time.

#### Examples
```js
// write a temperature value without specifying a timestamp
db.writePoint('temperature', 23.5);

// write a humidity value with a specific timestamp
db.writePoint('humidity', 55, new Date('2024-03-14T15:00:00Z').getTime());
```

### `flush()`
Forces the immediate flushing of all data from RAM to disk.

#### Examples
```js
// manually trigger a flush to disk without waiting for autosave
db.flush();
```

### `query(start_time, end_time, aggregation_type, cb_custom_aggregator)`
Queries the database for data points within a specified time range.

#### Parameters
- `start_time` {number} - The start timestamp for the query range, in milliseconds since the Unix epoch.
- `end_time` {number} - The end timestamp for the query range, in milliseconds since the Unix epoch.
- `aggregation_type` {string} - The type of aggregation to apply.
- `cb_custom_aggregator` {Function} - Optional. A custom aggregator function.

#### Examples
```js
// query the sum of 'temperature' measurements over the last 24 hours
const start_time = Date.now() - 60 * 60 * 24 * 1000; // 24 hours ago
const end_time = Date.now();
const result = db.query(start_time, end_time, 'sum');

// use a custom aggregation function to calculate the weighted average
const weighted_avg = db.query(start_time, end_time, 'custom', myWeightedAverage_CustomAggregator);
```

### `retrieveDataSeries(start_time, end_time)`
Retrieves a series of raw data points within a specified time range.

#### Parameters
- `start_time` {number} - The start timestamp for the query range, in milliseconds since the Unix epoch.
- `end_time` {number} - The end timestamp for the query range, in milliseconds since the Unix epoch.

#### Examples
```js
// retrieve heart rate data points over the last hour
const start_time = Date.now() - 60 * 60 * 1000; // 1 hour ago
const end_time = Date.now();
const data_points = db.retrieveDataSeries(start_time, end_time);
```

### `purge(older_than)`
Removes data points older than a specified threshold.

#### Parameters
- `older_than` {number} - The timestamp in milliseconds since the Unix epoch. Data points older than this timestamp will be purged.

#### Examples
```js
// purge data points older than 1 year
const one_year_ago = Date.now() - (365 * 24 * 60 * 60 * 1000);
db.purge(one_year_ago);
```

### `databaseClear(consent)`
Clears all data from the database, requiring explicit consent.

#### Parameters
- `consent` {string} - Must explicitly be the string "YES" to indicate deliberate action.

#### Examples
```js
// correct example: provide explicit `consent` and clear the database
db.databaseClear('YES');
```

### `databaseClose()`
Gracefully closes & autosaves the database.

#### Examples
```js
// close the database on application destroy
onDestroy(){
    db.databaseClose();
}
```

### `databaseBackup(backup_path, include_index)`
Creates a backup of the entire database.

#### Parameters
- `backup_path` {string} - Optional. The path where the database backup will be saved.
- `include_index` {boolean} - Optional. Whether to include the database index in the backup.

#### Examples
```js
// backup the database and include the index
db.databaseBackup('path/to/my_database_backup.json', true);
```

### `databaseRestore(consent, backup_path, recalculate_index)`
Restores the database from a backup file.

#### Parameters
- `consent` {string} - Must explicitly be the string "YES" to confirm the restore operation, which will overwrite current database.
- `backup_path` {string} - Optional. The path to the backup file from which to restore the database.
- `recalculate_index` {boolean} - Optional. Whether to recalculate the index after restoration.

#### Examples
```js
// provide explicit consent and restore the database, opting to recalculate the index
db.databaseRestore('YES', 'path/to/my_database_backup.json', true);
```
