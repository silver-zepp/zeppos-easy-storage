import VisLog from "@silver-zepp/vis-log";
const vis = new VisLog();

App({
  globals: { vis: vis },
  onCreate() {
    vis.updateSettings({ line_count: 15, timeout_enabled: false });
  },
  onDestroy() {}
})