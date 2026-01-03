const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Changes the cache location for Puppeteer to be inside the project folder
    // This ensures it is included in the build artifact on Render
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
