exports.config = {
    runner: 'local',
    port: 4723,
    specs: ['./test/specs/**/*.spec.js'],

    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Pixel_7_API_34',   // tên emulator của bạn
        'appium:automationName': 'UiAutomator2',

        // Nếu test Mobile Web (Option A):
        browserName: 'Chrome',

        // Nếu test Hybrid App (Option B):
        // 'appium:app': '/đường/dẫn/đến/app-debug.apk',
        // 'appium:appPackage': 'com.fpt.datechecker',
        // 'appium:appActivity': '.MainActivity',
    }],

    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: { timeout: 60000 }
};