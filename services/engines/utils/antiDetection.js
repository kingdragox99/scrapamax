/**
 * Sets up anti-detection protections on the page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
async function setupBrowserAntiDetection(page) {
  await page.evaluateOnNewDocument(() => {
    // Override automation detection methods
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    // Remove Chrome detection attributes
    delete navigator.languages;
    Object.defineProperty(navigator, "languages", {
      get: () => ["fr-FR", "fr", "en-US", "en"],
    });
    // Simulate a non-headless platform
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });
    // Hide Puppeteer detection functions
    window.chrome = {
      runtime: {},
    };
  });
}

module.exports = {
  setupBrowserAntiDetection,
};
