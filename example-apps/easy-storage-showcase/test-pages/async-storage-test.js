import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";
import { Storage, AsyncStorage } from "../../../easy-storage/v2"; //"@silver-zepp/easy-storage";
import { activateDefaultSettings } from "../helpers/required"; // long screen time
import { genTestPayload, rngStr, TEXTS } from "../helpers/async-storage-helpers";
import { getDeviceInfo } from "@zos/device";

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

let USE_ASYNC_STORAGE = true;
let cnt = 0;
let is_switching_mode = false;
let stutter_start_time = null;
let last_stutter_duration = 0;

// ui widgets
let cnt_text_widget = null;
let heavy_load_widget = null;
let cur_mode_text_widget = null;

// data and timers
let test_payload = null;
let storage_timer = null;
let cleanup_timeout = null;

function showStutter(active) {
  heavy_load_widget.setProperty(hmUI.prop.VISIBLE, active);

  if (active) {
    stutter_start_time = Date.now();
  } else if (stutter_start_time) {
    last_stutter_duration = Date.now() - stutter_start_time;
    stutter_start_time = null;
    cnt_text_widget?.setProperty(hmUI.prop.TEXT, `OP: ${cnt} LAG: ${last_stutter_duration}ms`);
  }
}

Page({
  anim_timer: null,

  onInit() {
    activateDefaultSettings();
  },

  build() {
    test_payload = genTestPayload();

    heavy_load_widget = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT, color: 0xFF0000
    });
    showStutter(false);

    cur_mode_text_widget = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: USE_ASYNC_STORAGE ? "Async Storage Demo" : "Sync Storage Demo",
      x: px(40), y: px(40),
      w: DEVICE_WIDTH - 2 * px(40), h: px(66),
      radius: px(8), normal_color: 0x222222, press_color: 0x444444,
      color: 0xffffff, text_size: px(32),
      click_func: () => this.switchMode()
    });

    this.status_text = hmUI.createWidget(hmUI.widget.TEXT, {
      text: USE_ASYNC_STORAGE ? TEXTS.TITLE_ASYNC : TEXTS.TITLE_SYNC,
      x: px(40), y: px(120), w: DEVICE_WIDTH - 2 * px(40), h: px(60),
      color: 0x999999, text_size: px(22),
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP,
    });

    hmUI.createWidget(hmUI.widget.ARC, {
      x: px(140), y: px(200), w: px(200), h: px(200),
      radius: px(90), start_angle: 0, end_angle: 360,
      line_width: px(2), color: 0x333333,
    });

    this.rot_hand = hmUI.createWidget(hmUI.widget.ARC, {
      x: px(140), y: px(200), w: px(200), h: px(200),
      radius: px(85), start_angle: -90, end_angle: -85,
      line_width: px(6), color: USE_ASYNC_STORAGE ? 0x00ff00 : 0xff6b35,
    });

    hmUI.createWidget(hmUI.widget.CIRCLE, {
      center_x: px(240), center_y: px(295), radius: 4, color: 0xffffff
    });

    cnt_text_widget = hmUI.createWidget(hmUI.widget.TEXT, {
      text: TEXTS.OP_LAG_PLH,
      x: px(40), y: px(420), w: DEVICE_WIDTH - 2 * px(40), h: px(40),
      color: USE_ASYNC_STORAGE ? 0x00ff00 : 0xff6b35,
      text_size: px(24), align_h: hmUI.align.CENTER_H,
    });

    this.startAnimation();
    setTimeout(() => this.startStorageOperations(), 2000);
  },

  switchMode() {
    if (is_switching_mode) return;
    is_switching_mode = true;

    this.clearAllTimers();

    if (USE_ASYNC_STORAGE) {
      AsyncStorage.SaveAndQuit();
    }

    cnt = 0;
    last_stutter_duration = 0;
    showStutter(false);

    USE_ASYNC_STORAGE = !USE_ASYNC_STORAGE;
    this.updateUI();

    cleanup_timeout = setTimeout(() => {
      cleanup_timeout = null;
      is_switching_mode = false;
      this.startStorageOperations();
    }, 2000);
  },

  clearAllTimers() {
    [storage_timer, cleanup_timeout].forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    storage_timer = cleanup_timeout = null;
  },

  updateUI() {
    const is_async = USE_ASYNC_STORAGE;
    const color = is_async ? 0x00ff00 : 0xff6b35;

    cur_mode_text_widget.setProperty(hmUI.prop.TEXT, is_async ? "Async Storage Demo" : "Sync Storage Demo");
    this.status_text.setProperty(hmUI.prop.TEXT, is_async ? TEXTS.TITLE_ASYNC : TEXTS.TITLE_SYNC);

    this.rot_hand.setProperty(hmUI.widget.MORE, {
      x: px(140), y: px(200), w: px(200), h: px(200),
      radius: px(85), start_angle: -90, end_angle: -85,
      line_width: px(8), color
    });

    cnt_text_widget.setProperty(hmUI.prop.TEXT, TEXTS.OP_LAG_PLH);
    cnt_text_widget.setProperty(hmUI.prop.COLOR, color);
  },

  startAnimation() {
    let angle = 0;
    this.anim_timer = setInterval(() => {
      if (USE_ASYNC_STORAGE && stutter_start_time) {
        showStutter(false);
      }

      this.rot_hand.setProperty(hmUI.widget.MORE, {
        x: px(140), y: px(200), w: px(200), h: px(200),
        radius: px(85), start_angle: angle, end_angle: angle + 30,
        line_width: px(8), color: USE_ASYNC_STORAGE ? 0x00ff00 : 0xff6b35,
      });

      angle = (angle + 1) % 360;
    }, 20);
  },

  startStorageOperations() {
    if (is_switching_mode || storage_timer) return;

    storage_timer = setInterval(() => {
      if (is_switching_mode) return;
      USE_ASYNC_STORAGE ? this.performAsyncOp() : this.performSyncOp();
    }, 1000);
  },

  performSyncOp() {
    cnt++;
    showStutter(true);

    setTimeout(() => {
      const data = {
        timestamp: Date.now(),
        counter: cnt,
        random_id: rngStr(),
        message: `Sync OP ${cnt}`,
        payload: test_payload
      };

      const fname = `sync_test_${cnt}.json`;
      Storage.WriteJson(fname, data);
      Storage.ReadJson(fname);

      showStutter(false);
      this.cleanup(cnt - 5);
    }, 0);
  },

  performAsyncOp() {
    if (AsyncStorage.IsBusy()) return;

    cnt++;
    showStutter(true);

    const data = {
      timestamp: Date.now(),
      counter: cnt,
      random_id: rngStr(),
      message: `Async OP ${cnt}`,
      payload: test_payload
    };

    const fname = `async_test_${cnt}.json`;

    AsyncStorage.WriteJson(fname, data, (write_error) => {
      if (write_error) return;

      AsyncStorage.ReadJson(fname, (read_error, json) => {
        if (!read_error) {
          // print parsed json contents as soon as the file's ready
          console.log("===== PARSED JSON FILE =====");
          console.log("counter:", json.counter);
          console.log("message:", json.message);
          console.log("payload size:", json.payload.length);

          const first = json.payload[0];
          const last = json.payload[json.payload.length - 1];
          console.log("first item", JSON.stringify(first));
          console.log("last item", JSON.stringify(last));
          console.log("=============================");

          cnt_text_widget?.setProperty(hmUI.prop.TEXT, `OP: ${cnt} LAG: ${last_stutter_duration}ms`);
        }
      });
    });

    this.cleanup(cnt - 5);
  },

  cleanup(old_cnt) {
    if (old_cnt > 0) {
      const prefix = USE_ASYNC_STORAGE ? 'async_test_' : 'sync_test_';
      const old_file = `${prefix}${old_cnt}.json`;

      if (USE_ASYNC_STORAGE) {
        AsyncStorage.RemoveFile(old_file, () => { });
      } else if (Storage.Exists(old_file)) {
        Storage.RemoveFile(old_file);
      }
    }
  },

  onDestroy() {
    is_switching_mode = true;
    this.clearAllTimers();
    if (this.anim_timer) {
      clearInterval(this.anim_timer);
    }

    // immidiately write all pending files before quiting the app
    AsyncStorage.SaveAndQuit();
  },

  onShow() {
    if (!this.anim_timer) this.startAnimation();
  },

  onHide() {
    if (this.anim_timer) {
      clearInterval(this.anim_timer);
      this.anim_timer = null;
    }
  }
});