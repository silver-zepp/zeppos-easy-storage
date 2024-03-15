const vis = getApp().globals.vis;
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