import { EasyTSDB, Storage } from "../../../easy-storage/v2"; //"@silver-zepp/easy-storage";
import { timeIt, runTest, activateDefaultSettings } from "../helpers/required";
import VisLog from "@silver-zepp/vis-log";

const vis = new VisLog();

//const db = new EasyTSDB();

Page({
  onInit() {
    activateDefaultSettings();
    vis.updateSettings({ line_count: 15 });
  },
  build() {
    multipleTests();
  },
  onDestroy() {
    // save db on exit
    //db.databaseClose();
  },
});

function multipleTests() {
  // basic tests
  testAverageOfTwoDataPoints();       // ✓ Test passed
  testSumOfMultipleDataPoints();      // ✓ Test passed
  testMinimumOfMultipleDataPoints();  // ✓ Test passed
  testMaximumOfMultipleDataPoints();  // ✓ Test passed

  // UNCOMMENT TO RUN MORE TESTS //

  // custom test with user defined aggregator
  // testTemperatureFluctuationRange_withCustomAggregator(); // ✓ Test passed

  // all additional tests - ✓ Test passed
  // runTest('Write and Query Single Point', testWriteAndQuerySinglePoint);
  // runTest('Query Without Data', testQueryWithoutData);
  // runTest('Multiple Data Points with Different Measurements', testMultipleDataPointsDifferentMeasurements);
  // runTest('Aggregation Over Empty Range', testAggregationOverEmptyRange);
  // runTest('Real-Time Data Insertion and Query', testRealTimeDataInsertionAndQuery);

  // timezones handling
  //testCrossHourBoundary();                    // ✓ Test passed
  //testMinuteGranularityInsertionAndQuery();   // ✓ Test passed
  //testExactHourBoundary();                    // ✓ Test passed

  // test index corruption and autosave
  //testIndexAndAutosave();                    // ✓ Test passed

  // test database backup & restore mechanism
  //test_BackupAndRestoreDB();                  // ✓ Test passed

  // testing the timeframe cycle
  //comprehensiveAggregationTestHourly(); // ✓ Test passed <- hourly is marginally faster
  // (!) warning this one is super slow and might crash the device
  //comprehensiveAggregationTest();       // ✓ Test passed
}

// START - BASIC TESTS
function testAverageOfTwoDataPoints() {
  const db = new EasyTSDB({ directory: "test_db_average" });

  db.databaseClear("YES");

  const start_time = new Date("2024-03-15T12:00:00Z").getTime();
  const end_time = new Date("2024-03-15T13:00:00Z").getTime();

  db.writePoint("temperature", 10, start_time);
  db.writePoint("temperature", 20, end_time);
  db.flush();

  const average = db.query(
    new Date("2024-03-15T00:00:00Z").toISOString(),
    new Date("2024-03-16T00:00:00Z").toISOString(),
    "average"
  );

  if (average !== 15) {
    throw new Error(`Test failed: Expected average of 15, but got ${average}`);
  } else {
    vis.log("✓ Test passed: Average of Two Data Points is 15");
  }

  db.databaseClear("YES"); // clean up
}

function testSumOfMultipleDataPoints() {
  const db = new EasyTSDB({ directory: "test_db_sum" });

  db.databaseClear("YES"); // clean up

  db.writePoint("temperature", 10, new Date("2024-03-15T12:00:00Z").getTime());
  db.writePoint("temperature", 20, new Date("2024-03-15T13:00:00Z").getTime());
  db.writePoint("temperature", 30, new Date("2024-03-15T14:00:00Z").getTime());
  db.flush();

  const sum = db.query(
    new Date("2024-03-15T00:00:00Z").toISOString(),
    new Date("2024-03-16T00:00:00Z").toISOString(),
    "sum"
  );

  if (sum !== 60) {
    throw new Error(`Test failed: Expected sum of 60, but got ${sum}`);
  } else {
    vis.log("✓ Test passed: Sum of Multiple Data Points is 60");
  }
}

function testMinimumOfMultipleDataPoints() {
  const db = new EasyTSDB({ directory: "test_db_min" });

  db.databaseClear("YES"); // clean up

  db.writePoint("humidity", 40, new Date("2024-03-15T12:00:00Z").getTime());
  db.writePoint("humidity", 20, new Date("2024-03-15T13:00:00Z").getTime());
  db.writePoint("humidity", 60, new Date("2024-03-15T14:00:00Z").getTime());
  db.flush();

  const min = db.query(
    new Date("2024-03-15T00:00:00Z").toISOString(),
    new Date("2024-03-16T00:00:00Z").toISOString(),
    "min"
  );

  if (min !== 20) {
    throw new Error(`Test failed: Expected minimum of 20, but got ${min}`);
  } else {
    vis.log("✓ Test passed: Minimum of Multiple Data Points is 20");
  }
}

function testMaximumOfMultipleDataPoints() {
  const db = new EasyTSDB({ directory: "test_db_max" });

  db.databaseClear("YES"); // clean up

  db.writePoint("pressure", 1020, new Date("2024-03-15T12:00:00Z").getTime());
  db.writePoint("pressure", 1040, new Date("2024-03-15T13:00:00Z").getTime());
  db.writePoint("pressure", 1010, new Date("2024-03-15T14:00:00Z").getTime());
  db.flush();

  const max = db.query(
    new Date("2024-03-15T00:00:00Z").toISOString(),
    new Date("2024-03-16T00:00:00Z").toISOString(),
    "max"
  );

  if (max !== 1040) {
    throw new Error(`Test failed: Expected maximum of 1040, but got ${max}`);
  } else {
    vis.log("✓ Test passed: Maximum of Multiple Data Points is 1040");
  }
}

// custom aggregator: here you can write your own stuff if built in methods aren't enough
function custom_tempRangeAggregator(data_points) {
  if (!data_points.length) return undefined; // no data points

  let min = data_points[0].value;
  let max = data_points[0].value;

  for (const point of data_points) {
    if (point.value < min) min = point.value;
    if (point.value > max) max = point.value;
  }

  return max - min; // the range of the temp
}

function testTemperatureFluctuationRange_withCustomAggregator() {
  const db = new EasyTSDB({ directory: "test_db_temperature_range" });

  db.databaseClear("YES"); // clean up

  // simulate writing temperature data points over a day
  db.writePoint("temperature", 15, new Date("2024-03-12T06:00:00Z").getTime()); // morning
  db.writePoint("temperature", 22, new Date("2024-03-12T12:00:00Z").getTime()); // midday
  db.writePoint("temperature", 18, new Date("2024-03-12T18:00:00Z").getTime()); // evening

  db.flush(); // ensure all data points are written

  // define the start and end times for the query
  const start_time = new Date("2024-03-12T00:00:00Z").toISOString();
  const end_time = new Date("2024-03-13T00:00:00Z").toISOString();

  // use the custom aggregator to calculate the temperature range
  const temp_range = db.query(
    start_time,
    end_time,
    "custom",
    custom_tempRangeAggregator
  );

  // expected range = max temperature - min temperature = 22 - 15 = 7
  vis.log(`Temperature fluctuation range: ${temp_range}`);
  if (temp_range !== 7) {
    throw new Error(
      `Expected temperature fluctuation range to be 7, but got ${temp_range}`
    );
  } else {
    vis.log("✓ Test passed: Correct temperature fluctuation range calculated");
  }
}

function comprehensiveAggregationTest() {
  const db = new EasyTSDB({
    directory: "comprehensive_test_db",
    time_frame: "minute",
  });

  // measure database cleanup time
  timeIt(() => db.databaseClear("YES"), "Database Cleanup");

  // predefined data points and their timestamps
  const data_points = [
    { value: 10, timestamp: "2024-03-12T01:00:00Z" },
    { value: 12, timestamp: "2024-03-12T02:00:00Z" },
  ];

  // measure time taken to write points
  timeIt(() => {
    data_points.forEach((dp) => {
      db.writePoint("temperature", dp.value, new Date(dp.timestamp).getTime());
    });
  }, "Writing Data Points");

  // measure flush time
  timeIt(() => db.flush(), "Flushing Data");

  // define start and end time for queries
  const start_time = new Date("2024-03-12T00:00:00Z").toISOString();
  const end_time = new Date("2024-03-13T00:00:00Z").toISOString();

  // query for each aggregation and measure their execution times
  let aggregation_types = [
    "count",
    "median",
    "mode",
    "stddev",
    "first",
    "last",
    "range",
    "percentile_90",
    "iqr",
    "variance",
    "rate_of_change",
  ];
  let actual_res = {};

  aggregation_types.forEach((type) => {
    actual_res[type] = timeIt(
      () => db.query(start_time, end_time, type),
      `Querying ${type}`
    );
  });

  // logging the results for each test, including expected outcomes
  vis.log("Actual results:", actual_res);

  // checking one of the results
  vis.log(`Count expected to be 2, got: ${actual_res.count}`);
}

// why only 16 counts instead of 24? Does it have something to do with hardcoded UTC+8? 24 - 8 = 16. nvm fixed - the utc-1 issue
function comprehensiveAggregationTestHourly() {
  const db = new EasyTSDB({
    directory: "comprehensive_hourly_test_db",
    time_frame: "hour",
    autosave_interval: 2000,
  });

  // measure database cleanup time
  timeIt(() => db.databaseClear("YES"), "Database Cleanup");

  // generate data points for every hour within a 24-hour period UTC
  let data_points = [];
  for (let i = 0; i < 24; i++) {
    data_points.push({
      value: Math.floor(Math.random() * 100),
      timestamp: `2024-03-12T${String(i).padStart(2, "0")}:00:00Z`,
    });
  }

  // measure time taken to write points
  timeIt(() => {
    data_points.forEach((dp) => {
      db.writePoint("temperature", dp.value, new Date(dp.timestamp).getTime());
    });
  }, "Writing Data Points");

  // Measure flush time
  timeIt(() => db.flush(), "Flushing Data");

  // start and end times for queries are correctly specified as UTC
  const start_time = new Date("2024-03-12T00:00:00Z").toISOString();
  const end_time = new Date("2024-03-13T00:00:00Z").toISOString();

  // query for each aggregation and measure their execution times
  let aggregation_types = [
    "count",
    "median",
    "mode",
    "stddev",
    "first",
    "last",
    "range",
    "percentile_90",
    "iqr",
    "variance",
    "rate_of_change",
  ];
  let actual_res = {};

  aggregation_types.forEach((type) => {
    actual_res[type] = timeIt(
      () => db.query(start_time, end_time, type),
      `Querying ${type}`
    );
  });

  // logging the results for each test, including expected outcomes
  vis.log("Actual results:", JSON.stringify(actual_res));

  // checking one of the results
  vis.log(`Count expected to be 24, got: ${actual_res["count"]}`);
}
// END - BASIC TESTS

// ========== START - TEST DB BACKUP & RESTORE FEATURE ========== //
function test_BackupAndRestoreDB() {
  const db = new EasyTSDB({ directory: "backup_and_restore_db" });

  vis.log("Starting Backup & Restore test...");

  // Measure database cleanup time
  timeIt(() => db.databaseClear("YES"), "Database Cleanup");

  // Generate data points for every hour within a 24-hour period UTC
  let data_points = [];
  for (let i = 0; i < 24; i++) {
    data_points.push({
      value: Math.floor(Math.random() * 100),
      timestamp: `2024-03-12T${String(i).padStart(2, "0")}:00:00Z`,
    });
  }

  // time taken to write points
  timeIt(() => {
    data_points.forEach((dp) => {
      db.writePoint("temperature", dp.value, new Date(dp.timestamp).getTime());
    });
  }, "Writing Data Points");

  // flush time
  timeIt(() => db.flush(), "Flushing Data");

  // backup
  timeIt(
    () => db.databaseBackup("backup_and_restore_db_backup.json", true),
    "Database Backup"
  );
  // restore
  timeIt(
    () => db.databaseRestore("YES", "backup_and_restore_db_backup.json"),
    "Database Restore"
  );

  // utc!
  const start_time = new Date("2024-03-12T00:00:00Z").getTime();
  const end_time = new Date("2024-03-13T00:00:00Z").getTime();

  // query for each aggregation and measure their execution times
  let aggregation_types = [
    "count",
    "median",
    "mode",
    "stddev",
    "first",
    "last",
    "range",
    "percentile_90",
    "iqr",
    "variance",
    "rate_of_change",
  ];
  let actual_res = {};

  aggregation_types.forEach((type) => {
    actual_res[type] = timeIt(
      () => db.query(start_time, end_time, type),
      `Querying ${type}`
    );
  });

  // results for each test + outcomes
  vis.log("Actual results:", JSON.stringify(actual_res));

  // checking most important result - count expected to be 24
  vis.log(`Count expected to be 24, got: ${actual_res["count"]}`);
}
// ========== END - TEST DB BACKUP & RESTORE FEATURE ========== //

// START test checksum and autosave
function testIndexAndAutosave() {
  const db_options = {
    directory: "test_autosave_db",
    autosave_interval: 2000, // Set autosave interval to 2 seconds for testing.
  };

  const db = new EasyTSDB(db_options);
  db.writePoint("test_measurement", 1, Date.now());
  db.writePoint("test_measurement", 2, Date.now() + 1000);

  setTimeout(() => {
    const index_filepath = `${db_options.directory}/index.json`;
    let index_data = Storage.ReadFile(index_filepath);
    index_data += "corruption!"; // corrupt the index file.
    Storage.WriteFile(index_filepath, index_data);
    vis.log("Index file has been corrupted for testing purposes.");

    setTimeout(() => {
      const reloaded_db = new EasyTSDB(db_options);
      // attempt to write a new point to verify if the database is operational.
      reloaded_db.writePoint("test_measurement", 3, Date.now());
      const new_data = reloaded_db.query(
        new Date(Date.now() - 2000).toISOString(),
        new Date().toISOString(),
        "raw"
      );
      if (new_data && new_data.length > 0) {
        vis.log("Test passed: Database recovered and is operational.");
      } else {
        vis.log("Test failed: Database did not recover as expected.");
      }
    }, 1000); // wait to ensure the corrupted index
  }, 2000); // wait to ensure autosave
}
// END test checksum and autosave

function testWriteAndQuerySinglePoint() {
  const db = new EasyTSDB({ directory: "test_db" });

  db.databaseClear("YES"); // clean up

  db.writePoint(
    "temperature",
    22.5,
    new Date("2024-03-12T12:00:00Z").getTime()
  );
  db.flush();

  const result = db.query(
    "2024-03-12T00:00:00Z",
    "2024-03-13T00:00:00Z",
    "average"
  );
  if (result !== 22.5) {
    throw new Error(`Expected 22.5, got ${result}`);
  }
}

function testQueryWithoutData() {
  const db = new EasyTSDB({ directory: "test_db_empty" });

  db.databaseClear("YES"); // clean up

  const result = db.query(
    "2024-01-01T00:00:00Z",
    "2024-01-02T00:00:00Z",
    "average"
  );
  if (result !== undefined) {
    //
    throw new Error(`Expected undefined, got ${result}`);
  }
}

function testMultipleDataPointsDifferentMeasurements() {
  const db = new EasyTSDB({ directory: "test_db_multiple" });

  db.databaseClear("YES"); // clean up

  db.writePoint("temperature", 22, new Date("2024-03-12T10:00:00Z").getTime());
  db.writePoint("temperature", 24, new Date("2024-03-12T11:00:00Z").getTime());
  db.writePoint("humidity", 55, new Date("2024-03-12T10:00:00Z").getTime());
  db.writePoint("humidity", 60, new Date("2024-03-12T11:00:00Z").getTime());
  db.flush();

  // Test average temperature with explicit logging
  const avgTemp = db.query(
    "2024-03-12T00:00:00Z",
    "2024-03-13T00:00:00Z",
    "average",
    (data_points) => {
      const filtered_points = data_points.filter(
        (p) => p.measurement === "temperature"
      );
      return (
        filtered_points.reduce((acc, curr) => acc + curr.value, 0) /
        filtered_points.length
      );
    }
  );

  if (avgTemp !== 23) {
    throw new Error(`Expected average temperature of 23, got ${avgTemp}`);
  }

  // test max humidity with explicit logging
  const max_humidity = db.query(
    "2024-03-12T00:00:00Z",
    "2024-03-13T00:00:00Z",
    "max",
    (data_points) => {
      vis.log(
        "Custom aggregator for humidity called with dataPoints:",
        data_points
      );
      return Math.max(
        ...data_points
          .filter((p) => p.measurement === "humidity")
          .map((p) => p.value)
      );
    }
  );

  if (max_humidity !== 60) {
    throw new Error(`Expected max humidity of 60, got ${max_humidity}`);
  }
}

function testAggregationOverEmptyRange() {
  const db = new EasyTSDB({ directory: "test_db_empty_range" });

  db.databaseClear("YES"); // clean up

  const aggregation_types = ["sum", "average", "min", "max"];
  aggregation_types.forEach((type) => {
    const result = db.query(
      "2024-03-15T00:00:00Z",
      "2024-03-16T00:00:00Z",
      type
    );
    if (result !== undefined) {
      throw new Error(
        `Expected undefined result for ${type} aggregation over empty range, got ${result}`
      );
    }
  });
}

function testRealTimeDataInsertionAndQuery() {
  const db = new EasyTSDB({ directory: "test_db_real_time" });

  db.databaseClear("YES"); // clean up

  const now = Date.now();
  db.writePoint("pressure", 1015, now - 60000); // 1 min ago
  db.writePoint("pressure", 1017, now); // now
  db.flush();

  // query the last 2 mins
  const avg_pressure = db.query(
    new Date(now - 120000).toISOString(),
    new Date(now + 1000).toISOString(),
    "average"
  );
  if (avg_pressure !== 1016) {
    throw new Error(`Expected average pressure of 1016, got ${avg_pressure}`);
  }
}

// new tests for cross timezones
function testMinuteGranularityInsertionAndQuery() {
  const db = new EasyTSDB({
    directory: "test_db_minute",
    time_frame: "minute",
  });

  db.databaseClear("YES"); // clean up

  const now = Date.now();
  db.writePoint("pressure", 1015, now - 60000); // 1 minute ago
  db.writePoint("pressure", 1017, now); // now
  db.flush();

  // query the last 2 minutes
  const avg_pressure = db.query(
    new Date(now - 120000).toISOString(),
    new Date(now + 1000).toISOString(),
    "average"
  );

  if (avg_pressure !== 1016) {
    throw new Error(`Expected average pressure of 1016, got ${avg_pressure}`);
  } else {
    vis.log("Test passed: Minute granularity insertion and query.");
  }
}

function testCrossHourBoundary() {
  const db = new EasyTSDB({
    directory: "test_db_cross_hour",
    time_frame: "hour",
  });

  db.databaseClear("YES"); // clean up

  const now = new Date("2024-03-15T00:05:00Z");
  const ts_now = now.getTime();

  // subtract 70 minutes to cross the hour boundary
  const ts_past_hour = new Date(ts_now - 70 * 60000).getTime();

  db.writePoint("pressure", 1015, ts_past_hour);
  db.writePoint("pressure", 1017, ts_now);
  db.flush();

  // query across the hour boundary
  const avg_pressure = db.query(
    new Date(ts_past_hour).toISOString(),
    new Date(ts_now + 1000).toISOString(),
    "average"
  );

  if (avg_pressure !== 1016) {
    throw new Error(
      `Expected average pressure of 1016 across the hour boundary, got ${avg_pressure}`
    );
  } else {
    vis.log("Test passed: Cross-hour boundary query.");
  }
}

function testExactHourBoundary() {
  const db = new EasyTSDB({
    directory: "test_db_exact_hour",
    time_frame: "hour",
  });

  db.databaseClear("YES"); // clean up

  // define exact hours for testing
  const ts_hour_before = new Date("2024-03-14T23:00:00Z").getTime(); // 23:00 (11 PM) of the previous day
  const ts_hour_after = new Date("2024-03-15T00:00:00Z").getTime(); // 00:00 (midnight) of the next day

  // write data points exactly on the hour boundary
  db.writePoint("pressure", 1015, ts_hour_before);
  db.writePoint("pressure", 1017, ts_hour_after);
  db.flush();

  // query exactly across the hour boundary
  const avg_pressure = db.query(
    new Date(ts_hour_before).toISOString(),
    new Date(ts_hour_after).toISOString(),
    "average"
  );

  if (avg_pressure !== 1016) {
    throw new Error(
      `Expected average pressure of 1016 across the hour boundary, got ${avg_pressure}`
    );
  } else {
    vis.log("Test passed: Exact hour boundary query.");
  }
}

// ============= //
// DO NOT REMOVE //
// ============= //
// // START merge verification
// function testMergingDataBehavior() {
//     const db = new EasyTSDB({ directory: 'test_db', time_interval: 'hour' });
//     const measurement = 'test_measurement';
//     const now = Date.now();

//     // initial write
//     db.writePoint(measurement, 1, now - 2000); // point 1, 2 seconds ago
//     db.writePoint(measurement, 2, now - 1000); // point 2, 1 second ago
//     db.flush();

//     // simulate reading and verifying initial data directly from the file
//     const init_filepath = db.getDataFilePathForDate(new Date(now - 2000));
//     let init_data = Storage.ReadJson(init_filepath);
//     vis.log("Initial data:", JSON.stringify(init_data));

//     // clear in-memory data to force next write to merge with file data
//     db.clearRAM();

//     // second write to test merging
//     db.writePoint(measurement, 3, now); // point 3, now
//     db.flush();

//     // verify merged data directly from the file
//     const merged_file_path = db.getDataFilePathForDate(new Date(now));
//     let merged_data = Storage.ReadJson(merged_file_path);
//     vis.log("Merged data:", JSON.stringify(merged_data));

//     // additional verification using query
//     let query_res = db.query(new Date(now - 3000).toISOString(), new Date().toISOString(), 'raw');
//     vis.log("Query result:", JSON.stringify(query_res));

//     // NOTE: this test requires addition methods added into the EasyTSDB class:
//     // clearRAM(){
// 	// 	this.#data_in_ram = {};
// 	// }

// 	// // Retrieve path of a data file for a specified date and time
//     // getDataFilePathForDate(date) {
// 	// 	const year = date.getUTCFullYear();
// 	// 	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
// 	// 	const day = String(date.getUTCDate()).padStart(2, '0');
// 	// 	const hour = String(date.getUTCHours()).padStart(2, '0'); // UTC hour for consistency
// 	// 	const file_path = `${this.#options.directory}/${year}-${month}-${day}-${hour}.json`;
// 	// 	return file_path;
// 	// }

// }
// // test merge
// testMergingDataBehavior();
// // END - MERGE VERIFICATION