import VisLog from "@silver-zepp/vis-log";
import {EasyFlashStorage} from "@silver-zepp/easy-storage" //"../libs/easy-storage";

const vis = new VisLog();
const flash = new EasyFlashStorage();

Page({
    onInit(){
      vis.updateSettings({ line_count: 10 });
    },
    build() {
        vis.log("Starting!");
        // test setKey
        flash.setKey('key1', 'value1');
        flash.setKey('key2', 'value2');
        flash.setKey('key3', 'value3');

        // test getKey
        vis.log("should print 'value1'", flash.getKey('key1'));
        vis.log("should print 'value2'", flash.getKey('key2'));
        vis.log("should print 'value3'", flash.getKey('key3'));

        // test hasKey
        vis.log("should print true", flash.hasKey('key1'));
        vis.log("should print false", flash.hasKey('key4'));

        // test getAllKeys
        vis.log("should print ['key1', 'key2', 'key3']", flash.getAllKeys());

        // test dataSize
        vis.log("should print the size of 'value1'", flash.dataSize('key1'));
        vis.log("should print 0", flash.dataSize('key4'));

        // test size
        vis.log("should print the total size of all values", flash.size());

        // test removeKey
        flash.removeKey('key1');
        vis.log("should print false", flash.hasKey('key1'));

        // test deleteAll
        flash.deleteAll();
        vis.log("should print []", flash.getAllKeys());

        // test isEmpty
        vis.log("should print true", flash.isEmpty());

        // test printContents
        flash.printAllKeys(); // should print nothing
    },
    onDestroy(){
        
    }
  })