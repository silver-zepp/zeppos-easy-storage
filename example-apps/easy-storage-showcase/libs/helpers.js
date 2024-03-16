import { setStatusBarVisible } from "@zos/ui"; // bip 5
import { pauseDropWristScreenOff, setPageBrightTime } from "@zos/display";
import VisLog from "@silver-zepp/vis-log";
const vis = new VisLog();

export function timeIt(operation, description) {
    const start_time = Date.now(); 
    const result = operation(); 
    const end_time = Date.now();
    const duration = end_time - start_time; 
    vis.log(`${description} took: ${duration}ms`);
    return result;
}

export function runTest(test_name, test_func) {
    vis.log(`Running test: ${test_name}`);
    try {
        test_func();
        vis.log('✓', test_name, 'passed');
    } catch (error) {
        vis.error('✕', test_name, 'failed with error:', error.message);
    }
}

export function activateDefaultSettings(){
    setStatusBarVisible(false); // get rid of the bar on bip 5
    setPageBrightTime({ brightTime: 6e5 }); // don't turn off the screen for 600 seconds
    pauseDropWristScreenOff({ duration: 6e5 }); // don't turn off the screen on wrist down for 600 seconds
}