const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Gets a browser instance configured to avoid detection
 * @returns {Promise<Browser>} Puppeteer instance
 */
async function getBrowser() {
  console.log("🚀 Initializing browser with anti-detection protection...");
  const browser = await puppeteer.launch({
    headless: "new", // The new headless mode is less detectable
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=site-per-process,TranslateUI",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--lang=fr-FR,fr,en-US,en", // Specify language for more consistency
      "--disable-extensions", // Disable extensions to avoid interference
      "--mute-audio", // Mute audio
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: null, // Allow browser to automatically adjust window size
  });

  console.log("✅ Browser successfully initialized");
  return browser;
}

/**
 * Sets a random screen size to simulate human behavior
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
async function setupRandomScreenSize(page) {
  console.log(`🖥️ Setting up random screen size...`);
  // Configure random behaviors
  await page.setViewport({
    width: 1280 + Math.floor(Math.random() * 100),
    height: 800 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false,
  });
}

module.exports = {
  getBrowser,
  setupRandomScreenSize,
};
