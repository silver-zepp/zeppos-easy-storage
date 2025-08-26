/** @about Easy Storage @min_zeppos 2.0 @author: Silver, Zepp Health. @license: MIT */

import { debugLog } from './core/core';
import { Storage } from './storage';

/**
 * EasyTSDB:
 * - Lightweight time-series database; buffers points in RAM, shards to JSON files
 * - Auto-flush on size or timer keeps RAM low without losing data
 * - Built-in sum/avg/min/max plus pluggable custom aggregations
 * - Indexed file layout accelerates range queries - ideal for sensor logs
 */
export class EasyTSDB { // @add 1.6.0
  #data_in_ram = {}; // data storage in RAM that flushes to disk on overflow
  #query_cache = {};
  #index = {}; // map
  #cur_index_checksum = "";
  #has_pending_writes = false;
  #db_cleared = false;
  #autosave_timeout_id = null;

  #defaults = {
    directory: "easy_timeseries_db",
    time_frame: "hour", // determines folder structure, not the autosave interval
    max_ram: 0.2 * 1024 * 1024, // 200KB of RAM after which the forced flush happens
    autosave_interval: 600, // 5 minutes in seconds
  };
  #user_options;

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
  constructor(options = {}) {
    this.#user_options = { ...this.#defaults, ...options };
    this.#setupDirectoryStructure();
    this.#loadIndex();
  }

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
  writePoint(measurement, value, timestamp = Date.now()) {
    const date = new Date(timestamp);

    // convert date components to UTC
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");

    const base_path = `${this.#user_options.directory}/${year}_${month}_${day}`;
    let file_path = base_path;

    if (this.#user_options.time_frame === "hour") {
      file_path = `${base_path}_${hour}.json`;
    } else if (this.#user_options.time_frame === "minute") {
      file_path = `${base_path}_${hour}_${minute}.json`;
    }

    if (!this.#data_in_ram[file_path]) {
      this.#data_in_ram[file_path] = [];
    }

    this.#data_in_ram[file_path].push({
      m: measurement,
      v: value,
      t: timestamp,
    }); // optimized

    // handling persistence
    this.#has_pending_writes = true;
    this.#resetAutosaveTimeout(); // debounce

    // check if current RAM usage exceeds the max_ram limit - flush if necessary
    if (this.#calculateUsageOfRAM() > this.#user_options.max_ram) {
      this.flush();
    }
  }

  /**
   * Forces the immediate flushing of all data from RAM to disk, ensuring data persistence and durability.
   * @examples
   * ```js
   * // example: manually trigger a flush to disk without waiting for autosave
   * db.flush();
   * ```
   */
  flush() {
    if (!this.#has_pending_writes && !this.#db_cleared) {
      return;
    }

    for (const [file_path, new_data_points] of Object.entries(
      this.#data_in_ram
    )) {
      let old_data_points = [];
      if (Storage.Exists(file_path)) {
        const old_data_str = Storage.ReadFile(file_path);
        if (old_data_str) {
          old_data_points = JSON.parse(old_data_str);
        }
      }

      const merged_data_points = old_data_points.concat(new_data_points);
      Storage.WriteFile(file_path, JSON.stringify(merged_data_points));

      this.#updateIndex(file_path);
    }

    this.#persistIndexIfNeeded();
    this.#has_pending_writes = false;
    this.#db_cleared = false;
    this.#data_in_ram = {};
  }

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
  query(start_time, end_time, aggregation_type, cb_custom_aggregator = null) {
    // convert to UTC strings for consistent comparison, if user didn't do it
    const start_utc = new Date(start_time).toISOString();
    const end_utc = new Date(end_time).toISOString();
    // cache identical queries
    const cache_key = `${start_utc}_${end_utc}_${aggregation_type}`;
    if (this.#query_cache[cache_key]) {
      return this.#query_cache[cache_key];
    }

    const data_points = this.#collectDataPointsForRange(start_utc, end_utc);
    debugLog(3, `Querying from ${start_utc} to ${end_utc} with type ${aggregation_type}`);
    debugLog(3, "data_points:", data_points);
    let result;

    // custom aggregator
    if (cb_custom_aggregator && typeof cb_custom_aggregator === "function") {
      result = cb_custom_aggregator(data_points);
    } else {
      result = this.#performBuiltInAggregation(data_points, aggregation_type);
    }

    this.#query_cache[cache_key] = result;
    return result;
  }

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
  retrieveDataSeries(start_time, end_time) {
    const start_utc = new Date(start_time).toISOString();
    const end_utc = new Date(end_time).toISOString();

    const data_points = this.#collectDataPointsForRange(start_utc, end_utc);
    return data_points.map((dp) => ({
      timestamp: dp.t,
      value: dp.v,
      measurement: dp.m,
    }));
  }

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
  purge(older_than) {
    const threshold_date = new Date(older_than);
    let is_index_modified = false;

    for (const date in this.#index) {
      // convert to YYYY-MM-DD format for Date comparison as we store it with underscores
      const file_date = new Date(date.split("_").join("-"));
      if (file_date < threshold_date) {
        const day_index = this.#index[date];
        for (const hour in day_index) {
          if (this.#user_options.time_frame === "hour") {
            const file_path = `${this.#user_options.directory
              }/${date}_${hour}.json`;
            Storage.RemoveFile(file_path);
          } else {
            // 'minute' time frame
            for (const minute in day_index[hour]) {
              const file_path = `${this.#user_options.directory
                }/${date}_${hour}_${minute}.json`;
              Storage.RemoveFile(file_path);
            }
          }
        }
        delete this.#index[date]; // clean up index when data is gone
        is_index_modified = true;
      }
    }

    // persist changes to the index and its backup if modifications were made
    if (is_index_modified) {
      this.#persistIndex();
    }
  }

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
  databaseClear(consent) {
    if (consent !== "YES") {
      debugLog(1, "You have to pass 'YES' to indicate you know what you're doing.");
      return;
    }

    // clear any existing autosave timeout
    if (this.#autosave_timeout_id !== null) {
      clearTimeout(this.#autosave_timeout_id);
      this.#autosave_timeout_id = null;
    }

    const files = Storage.ListDirectory(this.#user_options.directory);
    files.forEach((file) => {
      const full_path = `${this.#user_options.directory}/${file}`;
      Storage.RemoveFile(full_path);
    });

    // remove index files
    Storage.RemoveFile(`${this.#user_options.directory}/index.json`);
    Storage.RemoveFile(`${this.#user_options.directory}/index_backup.json`);

    // reset in-memory state
    this.#data_in_ram = {};
    this.#index = {};
    this.#query_cache = {};
    this.#db_cleared = true;
    this.#has_pending_writes = false;

    debugLog(3, "Database cleared successfully.");
  }

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
  databaseClose() {
    // flush any pending writes or clear state
    if (this.#has_pending_writes || this.#db_cleared) {
      this.flush();
    }
    // stop autosave
    if (this.#autosave_timeout_id !== null) {
      clearTimeout(this.#autosave_timeout_id);
    }
    // sync index
    this.#persistIndexIfNeeded();
  }

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
  databaseBackup(backup_path = "easy_tsdb_backup.json", include_index = false) {
    const backup_dir = "easy_tsdb_backups";
    const full_path = `${backup_dir}/${backup_path}`;

    // ensure the backup directory exists
    Storage.MakeDirectory(backup_dir);

    const backup = {
      database_directory: this.#user_options.directory,
      data_points: {},
      index: include_index ? this.#index : undefined,
    };

    // gather all data points from each file within the database directory
    const files = Storage.ListDirectory(this.#user_options.directory);
    files.forEach((file) => {
      if (file === "index.json" || file === "index_backup.json") {
        return; // skip index by default
      }
      const data = Storage.ReadFile(full_path);
      if (data) {
        backup.data_points[file] = JSON.parse(data);
      }
    });

    // include the index in the backup
    if (include_index) {
      backup.index = this.#index;
    }

    // convert the backup object to a JSON string
    const backup_json = JSON.stringify(backup, null, 2); // pretty print

    // save the JSON string to the specified backup path
    Storage.WriteFile(backup_path, backup_json);

    debugLog(1, `Backup successfully saved to ${backup_path}`);
  }

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
  databaseRestore(
    consent,
    backup_path = "easy_tsdb_backup.json",
    recalculate_index = true
  ) {
    if (consent !== "YES") {
      debugLog(1, "Explicit consent not provided. Restore operation aborted.");
      return;
    }

    const backup_dir = "easy_tsdb_backups";
    const full_path = `${backup_dir}/${backup_path}`;

    try {
      // read the backup file
      const backup = JSON.parse(Storage.ReadFile(full_path));

      // use the database directory name from the backup to set the directory of the current db instance
      this.#user_options.directory = backup.database_directory;

      // clear current database before restoration
      this.databaseClear("YES");

      // restore data points from backup
      Object.entries(backup.data_points).forEach(([file, data]) => {
        Storage.WriteFile(full_path, JSON.stringify(data));
      });

      // if index is included and recalculation is not requested, restore the index from backup
      if (backup.index && !recalculate_index) {
        this.#index = backup.index;
      } else {
        // recalculate the index based on restored data points, if necessary
        this.#rebuildIndex();
      }

      debugLog(1, `Database successfully restored from ${backup_path}.`);
    } catch (error) {
      debugLog(1, "Failed to restore database:", error);
    }
  }

  #rebuildIndex() {
    debugLog(1, "Rebuilding index...");
    this.#index = {}; // reset index
    const files = Storage.ListDirectory(this.#user_options.directory);
    files.forEach((file) => {
      if (file === "index.json" || file === "index_backup.json") {
        return; // skip index files
      }
      const file_path = `${this.#user_options.directory}/${file}`;
      const data = Storage.ReadFile(file_path);
      if (data) {
        backup.data_points[file] = JSON.parse(data);
      }
    });
    debugLog(1, "Index rebuilt.");
  }

  #resetAutosaveTimeout() {
    if (this.#autosave_timeout_id !== null) {
      clearTimeout(this.#autosave_timeout_id);
    }
    this.#autosave_timeout_id = setTimeout(() => {
      if (this.#has_pending_writes || this.#db_cleared) {
        this.flush();
        this.#db_cleared = false; // reset after flushing
        this.#persistIndexIfNeeded();
      }
    }, this.#defaults.autosave_interval * 1000); // convert to ms
  }

  #collectDataPointsForRange(start_time, end_time) {
    let bugfixed_start_time = new Date(start_time);
    // TODO: utc bugfix. why is our starting UTC 1 day in the future??
    bugfixed_start_time.setUTCDate(bugfixed_start_time.getUTCDate() - 1);

    let current = new Date(bugfixed_start_time.toISOString());
    const end = new Date(end_time);
    let data_points = [];

    while (current <= end) {
      const data_key = this.#generateDateKey(current);
      const hour = String(current.getUTCHours()).padStart(2, "0");
      const minute =
        this.#user_options.time_frame === "minute"
          ? String(current.getUTCMinutes()).padStart(2, "0")
          : null;

      if (
        this.#index[data_key] &&
        this.#index[data_key][hour] &&
        (!minute || this.#index[data_key][hour][minute])
      ) {
        const file_path =
          this.#user_options.time_frame === "hour"
            ? `${this.#user_options.directory}/${data_key}_${hour}.json`
            : `${this.#user_options.directory
            }/${data_key}_${hour}_${minute}.json`;

        const file_data_points = this.#getDataPointsFromFile(file_path);
        data_points = [...data_points, ...file_data_points];
      }

      current = this.#incrementDate(current);
    }

    return data_points;
  }

  #getDataPointsFromFile(file_path) {
    // check if the file exists before attempting to read it
    if (!Storage.Exists(file_path)) {
      debugLog(1, `No data file at path: ${file_path}, moving on.`);
      return [];
    }

    try {
      // file exists -> read it
      const data_points_str = Storage.ReadFile(file_path);
      // ensure the file is not empty and contains valid JSON before attempting to parse
      if (data_points_str.trim().length > 0) {
        const data_points = JSON.parse(data_points_str);
        debugLog(2, `Was able to read the data from file: ${file_path}`);
        // proxy our v, m, t = value, measurement and timestamp
        const data_points_proxied = data_points.map((dp) =>
          this.#wrapDataPoint(dp)
        );
        return data_points_proxied;
      } else {
        debugLog(2, `File at path: ${file_path} is empty, moving on.`);
        return [];
      }
    } catch (error) {
      debugLog(2, `Error reading data from file: ${file_path} - ${error.message}`);
      return []; // continue with an empty arr; avoid further errors
    }
  }

  #wrapDataPoint(data_point) {
    return new Proxy(data_point, {
      get(target, property, receiver) {
        if (property === "value") return target.v;
        if (property === "measurement") return target.m;
        if (property === "timestamp") return target.t;
        // TODO: FUTURE NOTE -> don't forget to update the proxy if the key structure changes
        return Reflect.get(...arguments); // default for other props
      },
    });
  }

  #generateDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const new_date_key = `${year}_${month}_${day}`;
    return new_date_key;
  }

  #performBuiltInAggregation(data_points, aggregation_type) {
    debugLog(2, `Performing aggregation: ${aggregation_type} on data: ${JSON.stringify(data_points)}`);
    let result;

    // Note: v = value, m = measurement, t = timestamp; handled by the proxy

    // exit on empty data_points early
    if (data_points.length === 0) return undefined;

    // TODO: document these aggregators
    // percentile: Finds the value below which a certain percentage of observations fall. For example, the 90th percentile is the value below which 90% of the observations may be found
    if (aggregation_type.startsWith("percentile_")) {
      // extract the percentile value from the aggregation type, e.g., "percentile_90" -> 90
      const percentile_value = parseInt(aggregation_type.split("_")[1], 10);
      result = this.#calculatePercentile(data_points, percentile_value);
    } else if (aggregation_type === "trend") {
      if (data_points.length > 1) {
        const firstPoint = data_points[0].v;
        const lastPoint = data_points[data_points.length - 1].v;
        result =
          lastPoint > firstPoint
            ? "up"
            : lastPoint < firstPoint
              ? "down"
              : "steady";
      } else {
        result = "steady"; // if there's one or no data points, we cannot determine a trend
      }
    } else {
      switch (aggregation_type) {
        case "raw": // raw: no transformation, just return AS IS
          result = data_points;
          break;
        case "sum": // sum
          result = data_points.reduce((acc, point) => acc + point.v, 0);
          break;
        case "average": // average
          result =
            data_points.reduce((acc, point) => acc + point.v, 0) /
            data_points.length;
          break;
        case "min": // min
          result = Math.min(...data_points.map((point) => point.v));
          break;
        case "max": // max
          result = Math.max(...data_points.map((point) => point.v));
          break;
        case "count": // count
          result = data_points.length;
          break;
        case "median": // median
          const sorted_vals = data_points
            .map((dp) => dp.v)
            .sort((a, b) => a - b);
          const middle_index = Math.floor(sorted_vals.length / 2);
          result =
            sorted_vals.length % 2 !== 0
              ? sorted_vals[middle_index]
              : (sorted_vals[middle_index - 1] + sorted_vals[middle_index]) / 2;
          break;
        case "mode": // mode
          const frequency_map = {};
          data_points.forEach((dp) => {
            if (!frequency_map[dp.v]) frequency_map[dp.v] = 0;
            frequency_map[dp.v]++;
          });
          const max_frequency = Math.max(...Object.values(frequency_map));
          result = Object.keys(frequency_map)
            .filter((key) => frequency_map[key] === max_frequency)
            .map(parseFloat);
          if (result.length === 1) result = result[0];
          break;
        case "stddev": // standard deviation
          if (data_points.length > 1) {
            const mean =
              data_points.reduce((acc, dp) => acc + dp.v, 0) /
              data_points.length;
            const variance =
              data_points.reduce(
                (acc, dp) => acc + Math.pow(dp.v - mean, 2),
                0
              ) /
              (data_points.length - 1);
            result = Math.sqrt(variance);
          } else {
            result = undefined;
          }
          break;
        case "first": // first
          result = data_points.length > 0 ? data_points[0].v : undefined;
          break;
        case "last": // last
          result =
            data_points.length > 0
              ? data_points[data_points.length - 1].v
              : undefined;
          break;
        case "range": // range: Calculates the difference between the maximum and minimum values in your dataset. This can be useful for understanding volatility or variability in your data.
          const max_val = Math.max(...data_points.map((point) => point.v));
          const min_val = Math.min(...data_points.map((point) => point.v));
          result = max_val - min_val;
          break;
        case "iqr": // interquartile range: Measures the spread of the middle 50% of data points (between the 25th and 75th percentiles). It's a robust measure of spread.
          const sorted = data_points.map((dp) => dp.v).sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length / 4)];
          // for Q3, find the 75th percentile position and interpolate if necessary
          const q3_pos = Math.floor((3 * sorted.length) / 4);
          const q3 =
            sorted.length % 2 === 0
              ? (sorted[q3_pos] + sorted[q3_pos - 1]) / 2
              : sorted[q3_pos];
          result = q3 - q1;
          break;
        case "variance": // variance: Calculates the variance of the data points. While standard deviation gives you a measure of spread in the same units as the data, variance squares these differences.
          if (data_points.length > 1) {
            const mean =
              data_points.reduce((acc, dp) => acc + dp.v, 0) /
              data_points.length;
            result =
              data_points.reduce(
                (acc, dp) => acc + Math.pow(dp.v - mean, 2),
                0
              ) /
              (data_points.length - 1);
          } else {
            result = undefined;
          }
          break;
        case "rate_of_change": // rate of change: Calculates the rate of change between points. This can be particularly useful for financial or performance data where you're interested in the rate of growth or decline of Bitcoin's price.
          if (data_points.length > 1) {
            result = [];
            for (let i = 1; i < data_points.length; i++) {
              const rate =
                (data_points[i].v - data_points[i - 1].v) /
                data_points[i - 1].v;
              result.push(rate);
            }
          } else {
            result = undefined;
          }
          break;
        default:
          throw new Error("Unsupported aggregation type");
      }
    }
    debugLog(3, `Aggregation result: ${result}`);
    return result;
  }

  // outside aggregators go here:
  #calculatePercentile(data_points, percentile_rank) {
    // sort data points by value
    const sorted_values = data_points
      .map((dp) => dp.value)
      .sort((a, b) => a - b);
    // calculate rank position
    const rank = (percentile_rank / 100) * (sorted_values.length - 1) + 1;
    // interpolate between closest ranks
    const index = Math.floor(rank) - 1;
    const frac = rank % 1;

    if (sorted_values.length === 0) return undefined;
    if (frac === 0) return sorted_values[index];
    else
      return (
        sorted_values[index] +
        frac * (sorted_values[index + 1] - sorted_values[index])
      );
  }

  #calculateUsageOfRAM() {
    let ttl_size = 0;
    // rough estimation with the assumption of 1 byte per char
    for (const data_points of Object.values(this.#data_in_ram)) {
      const size = JSON.stringify(data_points).length;
      ttl_size += size;
    }
    return ttl_size;
  }

  #persistIndex() {
    const index_data = JSON.stringify(this.#index);
    const index_checksum = this.#calculateIndexChecksum(index_data);
    const index_content = JSON.stringify({ index_data, index_checksum });

    // save the current state of the index
    Storage.WriteFile(`${this.#user_options.directory}/index.json`, index_content);
    // save a backup of the index
    Storage.WriteFile(
      `${this.#user_options.directory}/index_backup.json`,
      index_content
    );

    this.#cur_index_checksum = index_checksum;
  }

  #loadIndex() {
    const index_path = `${this.#user_options.directory}/index.json`;
    const backup_index_path = `${this.#user_options.directory
      }/index_backup.json`;

    if (Storage.Exists(index_path)) {
      const save_data = Storage.ReadFile(index_path);
      if (this.#tryLoadIndex(save_data)) {
        return; // ok
      }
    }

    debugLog(3, "Attempting to recover index from backup.");
    if (Storage.Exists(backup_index_path)) {
      const backup_data = Storage.ReadFile(backup_index_path);
      if (this.#tryLoadIndex(backup_data)) {
        debugLog(2, "Successfully recovered index from backup.");
        return;
      }
    }

    debugLog(3, "Both main and backup index files are unavailable or corrupt. Initializing an empty index.");
    this.#initializeEmptyIndex();
    this.#persistIndex();
  }

  #tryLoadIndex(saved_data) {
    // attempt to load the index from the given data
    try {
      const { index_data, index_checksum } = JSON.parse(saved_data);
      const calculated_checksum = this.#calculateIndexChecksum(index_data);
      if (calculated_checksum === index_checksum) {
        this.#index = JSON.parse(index_data);
        this.#cur_index_checksum = index_checksum;
        return true; // ok
      }
    } catch (error) {
      debugLog(2, `Error loading or parsing index file: ${error}.`);
    }
    return false; // fail
  }

  #initializeEmptyIndex() {
    this.#index = {};
    this.#cur_index_checksum = this.#calculateIndexChecksum(
      JSON.stringify(this.#index)
    );
  }

  #updateIndex(file_path) {
    // extract the date component from the file path
    const regex = /(\d{4}_\d{2}_\d{2})_(\d{2})(?:_(\d{2}))?\.json$/;
    const match = file_path.match(regex);
    if (match) {
      const date_key = match[1]; // YYYY-MM-DD
      const hour = match[2];
      const minute = match[3]; // can be undefined for "hour" variant

      // ensure the date_key exists in the index
      if (!this.#index[date_key]) {
        this.#index[date_key] = {};
      }

      // for hour variant just mark it as present
      if (this.#user_options.time_frame === "hour") {
        this.#index[date_key][hour] = 1; // true
      }
      // for minute variant ensure an entry for the hour exists and mark the minute
      else if (this.#user_options.time_frame === "minute") {
        if (!this.#index[date_key][hour]) {
          this.#index[date_key][hour] = {};
        }
        this.#index[date_key][hour][minute] = 1; // true
      }
    }
  }

  #incrementDate(cur_date) {
    const new_date = new Date(cur_date);
    if (this.#user_options.time_frame === "hour") {
      new_date.setUTCHours(new_date.getUTCHours() + 1, 0, 0, 0); // reset m, s, and ms
    } else if (this.#user_options.time_frame === "minute") {
      new_date.setUTCMinutes(new_date.getUTCMinutes() + 1, 0, 0); // reset s and ms
    }
    return new_date;
  }

  #setupDirectoryStructure() {
    Storage.MakeDirectory(this.#user_options.directory);
  }

  #persistIndexIfNeeded() {
    const index_data = JSON.stringify(this.#index);
    const new_index_checksum = this.#calculateIndexChecksum(index_data);
    if (this.#cur_index_checksum !== new_index_checksum) {
      this.#persistIndex();
      this.#cur_index_checksum = new_index_checksum;
    }
  }

  #calculateIndexChecksum(index_str) {
    let checksum = 0;
    for (let i = 0; i < index_str.length; i++) {
      checksum = (checksum + index_str.charCodeAt(i)) % 65535;
    }
    const checksum_str = checksum.toString();
    debugLog(3, `Index checksum: ${checksum_str}`);
    return checksum_str;
  }
}