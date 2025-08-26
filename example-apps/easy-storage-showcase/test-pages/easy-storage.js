import VisLog from "@silver-zepp/vis-log";
import { EasyStorage } from "../../../easy-storage/v2"; //"@silver-zepp/easy-storage";
import { activateDefaultSettings } from "../libs/helpers";

const vis = new VisLog();
const storage = new EasyStorage();

const names_arr = [
  "Emma", "Olivia", "Ada", "Isabella", "Mia",
  "James", "William", "Charles", "Richard", "Benjamin"
]

Page({
  onInit() {
    activateDefaultSettings();
    vis.updateSettings({ line_count: 10, timeout_enabled: false });
  },
  build() {
    // check if specific key exists
    if (!storage.hasKey("name"))
      vis.error("The storage is fresh. Using the default values");
    else
      vis.warn("-> OLD data loaded");

    // get the keys that you saved before. if none - return the default values.
    // setting the "default" value or as in this example "DefaultName" is not required
    // let my_var = storage.getKey("health"); // general usage 
    vis.log("name : " + storage.getKey("name", "DefaultName"));
    vis.log("age : " + storage.getKey("age", 77));

    // // save new keys
    storage.setKey("name", getRandomName());
    storage.setKey("age", getRandomAge());

    vis.warn("-> NEW data saved");
    vis.log("name : " + storage.getKey("name"));
    vis.log("age : " + storage.getKey("age"));

    // prints all contents of the storage
    vis.log("Contents: " + storage.getStorageSnapshot(true));

    // // for the case when you want to remove all the user data 
    // // example: [button] Clear app data 
    // //storage.deleteAll();
  },
  onDestroy() {
    // save everything on app close, in case you have autosave disabled
    //storage.saveAll();
  }
})

// helpers
function getRandomName() { return names_arr[Math.floor(Math.random() * names_arr.length)] }
function getRandomAge() { return Math.floor(Math.random() * (60 - 10) + 10) }