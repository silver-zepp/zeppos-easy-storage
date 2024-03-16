import AutoGUI from "@silver-zepp/autogui";
import { push } from "@zos/router";
import { activateDefaultSettings } from "./libs/helpers";
const gui = new AutoGUI();

Page({
    onInit(){
        activateDefaultSettings();

        gui.text("Pick example to run!");
            gui.newRow();
        gui.button("EasyStorage", ()=> { push({ url: "test-pages/easy-storage" })});
            gui.newRow();
        gui.button("EasyTSDB Heart Rate", ()=> { push({ url: "test-pages/easy-tsdb-heartrate" })});
            gui.newRow();
        gui.button("EasyTSDB Test Cases", ()=> { push({ url: "test-pages/easy-tsdb-testcases" })});
            gui.newRow();
        gui.button("EasyFlashStorage", ()=> { push({ url: "test-pages/easy-flash-storage" })});

        gui.render();
    },
    build(){
        
    },
});