/** @about Simple EasyTSDB example */

import { EasyTSDB } from "../../../easy-storage/v2"; //"@silver-zepp/easy-storage";
const db = new EasyTSDB();

class Example {
  onInit() {
    console.log("init");

    db.writePoint("hr", 77.7);
    db.writePoint("hr", 55.5);
    db.writePoint("hr", 99.9);

    // manually save the database
    db.flush();

    const start_time = Date.now() - 60 * 60 * 1000; // 1 hour ago
    const end_time = Date.now();
    const data_points = db.retrieveDataSeries(start_time, end_time);
    console.log("Data:", JSON.stringify(data_points));
  }

  onDestroy() {
    console.log("destroy");
  }
}

Page(new Example());