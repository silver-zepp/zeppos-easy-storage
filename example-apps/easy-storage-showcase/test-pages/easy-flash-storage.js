import VisLog from "@silver-zepp/vis-log";
import { EasyFlashStorage } from "../../../easy-storage/v2"; // "@silver-zepp/easy-storage"
import { activateDefaultSettings, timeIt } from "../helpers/required";


const vis = new VisLog();
const flash = new EasyFlashStorage();

Page({
    onInit(){
      activateDefaultSettings();
      vis.updateSettings({ line_count: 10, timeout_enabled: false });
    },
    build() {
        //test2();
        test1();
    },
    onDestroy(){
        
    }
})

function test3_direct(){

}

function test3(){
  vis.log("Starting!");
  // test setKey
  if (!flash.hasKey("key1")){
    flash.setKey('key1', 'value1');
    flash.setKey('key2', 'value2');
    flash.setKey('key3', 'value3');
    vis.log("Storing keys");
  } else {
    vis.log("Retrieved saved keys");
  }

  // test dataSize
  vis.log("dataSize of 'value1'", flash.dataSize('key1'));
  // test size
  vis.log("total size of all values", flash.size());

  // (!) new TODO: docs and version updates 
  vis.log("should print 'key1', 'key2', 'key3' ->", flash.getAllKeys());
  vis.log("should print 'value1', 'value1', 'value1' ->", flash.getAllValues());
  vis.log("Storage snapshot:", flash.getStorageSnapshot(true));
}

// index vs readdir ((!) REQUIRES easy-storage-index.js)
function test2_indexVsDirect(){
  // clear files
  flash.clearDirectory();

  // create 100 files
  function populateStorage() {
    const files_creation_time = timeIt(() => {
      for (let i = 0; i < 100; i++) { // creating 1000 leads to Balance reboot most of the time
        flash.setKey(`key${i}`, `value${i}`);
    }
    });
    vis.log(`Files created in ${files_creation_time}ms`);
    vis.log(`Total amount of files is ${flash.count()}`);
  }
  populateStorage();

  function measureListingSpeed(storage, type) {
    const time = timeIt(() => storage.getAllKeys(true));
    vis.log(`${type} Time: ${time}ms`);
  }

  // index
  const indexed_storage = new EasyFlashStorage('my_custom_directory', true); // 3ms / 1000
  measureListingSpeed(indexed_storage, "Index");
  // direct (readdir)
  const direct_storage = new EasyFlashStorage('my_custom_directory', false); // 9ms / 1000
  measureListingSpeed(direct_storage, "Direct");
}

function test1(){
  const start_time = Date.now();

  vis.log("Starting!");
  // test setKey
  flash.setKey('key1', 'value1');
  flash.setKey('key2', 'value2');
  flash.setKey('key3', 'value3');

  // test getKey
  vis.log("should print 'value1' ->", flash.getKey('key1'));
  vis.log("should print 'value2' ->", flash.getKey('key2'));
  vis.log("should print 'value3' ->", flash.getKey('key3'));

  // test hasKey
  vis.log("should print true ->", flash.hasKey('key1'));
  vis.log("should print false ->", flash.hasKey('key4'));

  // test getAllKeys
  vis.log("should print ['key1', 'key2', 'key3'] ->", flash.getAllKeys());

  // test dataSize
  vis.log("dataSize of 'value1' ->", flash.dataSize('key1'));
  vis.log("should print 0 ->", flash.dataSize('key4'));

  // test size
  vis.log("total size of all values ->", flash.size());

  // test removeKey
  flash.removeKey('key1');
  vis.log("should print false ->", flash.hasKey('key1'));

  // test deleteAll
  flash.deleteAll();
  vis.log("should print [] ->", flash.getAllKeys());

  // test isEmpty
  vis.log("should print true ->", flash.isEmpty());

  // test printContents
  flash.printAllKeys(); // should print nothing

  console.log(`Exec time ${Date.now() - start_time}ms`);
}