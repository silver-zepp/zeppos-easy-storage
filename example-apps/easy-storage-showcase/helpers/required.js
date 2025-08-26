import { setStatusBarVisible } from "@zos/ui"; // bip 5
import { pauseDropWristScreenOff, setPageBrightTime, setWakeUpRelaunch } from "@zos/display";
// const vis = getApp().globals.vis;


export function timeIt(operation, description, vis = null) {
	const start_time = Date.now();
	const result = operation();
	const end_time = Date.now();
	const duration = end_time - start_time;

	const out = `${description} took: ${duration}ms`;
	if (!vis) {
		console.log(out);
	} else {
		vis.log(out);
	}
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

export function activateDefaultSettings() {
	setStatusBarVisible(false); // get rid of the bar on Square devices
	setPageBrightTime({ brightTime: 6e6 });
	pauseDropWristScreenOff({ duration: 6e6 });
	setWakeUpRelaunch({ relaunch: true });
}