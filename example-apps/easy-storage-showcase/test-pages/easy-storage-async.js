import VisLog from "@silver-zepp/vis-log";
import { EasyStorageAsync, Storage } from "../../../easy-storage/v2"; //"@silver-zepp/easy-storage";
import { activateDefaultSettings } from "../helpers/required";

const vis = new VisLog();
const storage = new EasyStorageAsync();

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
    // ========================================
    // Manual Storage Synchronization:
    // by default EasyStorageAsync loads its database file in a lazy-load async manner to avoid UI lag
    // without manual syncronization, your keys might not be available at access time
    // this is (optional) and should be used only when data concistency is necessary right away.
    // the sync, if necessary, has to be done only once. after that, the whole DB remains in RAM
    if (!storage.isReady()) storage.synchronize();
    // ========================================

    // note: this key would be undefined if we didn't synchronize() the storage
    // as initial async db load takes some time while we're trying to access the key right away
    if (!storage.hasKey("name")) // check if specific key exists
      vis.error("The storage is fresh. Using the default values");
    else
      vis.warn("-> OLD data loaded");

    // get the keys that you saved before. if none - return the default values.
    // setting the "default" value or as in this example "DefaultName" is not required
    // let my_var = storage.getKey("health"); // general usage 
    vis.log("name : " + storage.getKey("name", "DefaultName"));
    vis.log("age : " + storage.getKey("age", 77));

    // save new keys
    storage.setKey("name", getRandomName());
    storage.setKey("age", getRandomAge());

    vis.warn("-> NEW data saved");
    vis.log("name : " + storage.getKey("name"));
    vis.log("age : " + storage.getKey("age"));

    // prints all contents of the storage
    vis.log("Contents: " + storage.getStorageSnapshot(true));

    // ========================================
    // example: instantly read the whole EasyStorage json object and then again after 1 second passed.
    // you will see that the first read will return the old value, 
    // while the next one will return value that was updated asynchronously
    function getESDB() {
      console.log(Storage.ReadJson("data://easy_storage.json", true)); // true = stringify content
    }

    getESDB(); // first call

    setTimeout(() => {
      getESDB(); // same call, different result
    }, 1000);
    // ========================================

    // in case you want to remove all the user data 
    // example: [button] Clear app data 
    // storage.deleteAll();
  },
  onDestroy() {
    // save everything on app close, in case you have autosave disabled
    //storage.saveAll();

    // immediately save all pending writes synchronously (if any)
    // making sure no data is lost on app crash or a force-close during write times
    storage.saveAndQuit();
  }
})

// helpers
function getRandomName() { return names_arr[Math.floor(Math.random() * names_arr.length)] }
function getRandomAge() { return Math.floor(Math.random() * (60 - 10) + 10) }