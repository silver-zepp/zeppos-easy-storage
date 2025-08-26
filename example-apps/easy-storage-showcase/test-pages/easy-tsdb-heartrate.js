import { createWidget, widget } from "@zos/ui";
import { px } from "@zos/utils";
import { EasyTSDB, Storage } from "../../../easy-storage/v2"; //"@silver-zepp/easy-storage";
import VisLog from "@silver-zepp/vis-log";
import { activateDefaultSettings } from "../helpers/required";

const vis = new VisLog();
const db = new EasyTSDB({ directory: "heart_rate_data" });
//db.databaseClear("YES"); // use to get new data

const generateHeartRateData = () => {
  const startTime = Date.now() - 60 * 60 * 1000; // start time (1 hour ago)
  const endTime = Date.now(); // end time (now)

  // retrieve existing data points in this time frame to count them
  const ex_datapoints = db.retrieveDataSeries(startTime, endTime);
  const count_ex_datapoints = ex_datapoints.length;

  // if less than 20 data points exist, generate more to reach a total of 20
  if (count_ex_datapoints < 20) {
    const to_gen = 20 - count_ex_datapoints;
    const cur_time = Date.now();
    for (let i = 0; i < to_gen; i++) {
      const timestamp = cur_time - (to_gen - i) * (60 * 1000 * 3); // every 3 minutes within the last part of the hour
      const hr = Math.floor(Math.random() * (120 - 50) + 50); // between 50 and 120
      db.writePoint("hr", hr, timestamp);
    }
  }
};

// init polyline
const polyline = createWidget(widget.GRADKIENT_POLYLINE, {
  x: 0,
  y: px(230),
  w: px(320),
  h: px(150),
  line_color: 0x00ffff,
  line_width: 1,
});

const displayHeartRateSeries = () => {
  const start = Date.now() - 60 * 60 * 1000; // Last hour
  const end = Date.now();

  // get actual data points
  const series = db.retrieveDataSeries(start, end);

  // calculate aggregations
  const min_hr = db.query(start, end, "min");
  const max_hr = db.query(start, end, "max");
  const avg_hr = db.query(start, end, "average");
  const avg_hr_f = avg_hr !== undefined ? avg_hr.toFixed(0) : "N/A";
  const trend = db.query(start, end, "trend");

  vis.log(`Trend:     ${trend}`);
  vis.log(`Avg HR:    ${avg_hr_f}`);
  vis.log(`Max HR:    ${max_hr}`);
  vis.log(`Min HR:    ${min_hr}`);

  if (trend === undefined) vis.warn("Data updated. Restart the App!");
  //vis.refresh();

  let hr_data = series.map((dp, index) => {
    // normalize and scale X, Y vals for visualization
    const x_pos = Math.round((index / (series.length - 1)) * 320);
    const y_pos = 150 - Math.round((dp.value / 120) * 150); // 120 as max hr
    return { x: px(x_pos), y: px(Math.max(y_pos, 0)) }; // y_pos cant' be negative
  });

  // draw
  polyline.clear();
  polyline.addLine({
    data: hr_data,
    count: hr_data.length,
    curve_style: true,
  });
};

Page({
  onInit() {
    activateDefaultSettings();
  },
  build() {
    vis.updateSettings({ line_count: 10, timeout_enabled: false });

    generateHeartRateData();
    displayHeartRateSeries();
  },
  onDestroy() {
    // save db on exit
    db.databaseClose();
  },
});
