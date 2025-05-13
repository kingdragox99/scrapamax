const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Search on Baidu with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Region
 * @param {string} language - Language
 * @returns {Promise<Array>} Array of search results
 */
async function searchBaidu(query, region, language) {
  console.log(`\n🔍 Attempting Baidu search for: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up Baidu page...");
    const page = await browser.newPage();

    // Hide Puppeteer/WebDriver signature
    await utils.setupBrowserAntiDetection(page);

    // Configure appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure random screen size
    await utils.setupRandomScreenSize(page);

    console.log(`🌐 Navigating to Baidu...`);
    // Navigate to Baidu with increased timeout
    try {
      await page.goto(
        `https://www.baidu.com/s?ie=utf-8&wd=${encodeURIComponent(query)}`,
        {
          waitUntil: "domcontentloaded", // Use domcontentloaded instead of networkidle2
          timeout: 60000, // Increase to 60 seconds
        }
      );
    } catch (navError) {
      console.warn(`⚠️ Problem navigating to Baidu: ${navError.message}`);
      console.log("Attempting alternative with simplified URL...");

      // Try alternative approach
      try {
        await page.goto(`https://www.baidu.com/`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        // Wait for page to load
        await utils.randomDelay(2000, 4000);

        // Enter search in field
        await page.type("#kw", query);
        await page.click("#su");

        // Wait for results to load
        await page.waitForSelector(".result", { timeout: 30000 }).catch(() => {
          console.log("Results selector not found, but continuing");
        });
      } catch (altError) {
        console.error(
          `❌ Alternative approach also failed: ${altError.message}`
        );
        throw navError; // Throw original error
      }
    }

    console.log(`⏳ Waiting after page load...`);
    // Short pause to avoid detection
    await utils.randomDelay(1000, 3000);

    // Handle possible consent popups
    try {
      const consentSelectors = [
        ".agree-btn",
        "#s-trust-closebtn",
        ".policy-btn",
      ];

      for (const selector of consentSelectors) {
        const button = await page.$(selector);
        if (button) {
          console.log(`🍪 Consent popup detected, clicking on ${selector}`);
          await button.click();
          await utils.randomDelay(1000, 2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ No popup to close or error:", e.message);
    }

    // Check if CAPTCHA is present and have user solve it if necessary
    const captchaResolved = await utils.handleCaptcha(page, "Baidu");
    if (captchaResolved) {
      console.log("✅ CAPTCHA solved, resuming Baidu search...");
      // Wait a bit after solving CAPTCHA
      await utils.randomDelay(2000, 4000);
    }

    console.log(`🖱️ Simulating scrolling to appear human...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extracting Baidu results...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Selectors for Baidu results
      const resultElements = document.querySelectorAll(".c-container");

      resultElements.forEach((element) => {
        // Extract title
        const titleElement = element.querySelector(".t a, h3.c-title a");
        if (!titleElement) return;

        const title = titleElement.textContent.trim();

        // Extract URL
        let url = titleElement.getAttribute("href");
        // Baidu sometimes uses redirects - try to extract the real URL
        const realUrlElement = element.querySelector(".c-showurl");
        if (realUrlElement) {
          const realUrl = realUrlElement.textContent.trim();
          if (realUrl && realUrl.startsWith("http")) {
            url = realUrl;
          }
        }

        // Extract description
        const descriptionElement = element.querySelector(".c-abstract");
        const description = descriptionElement
          ? descriptionElement.textContent.trim()
          : "";

        if (title && url) {
          searchResults.push({
            title,
            url: url.startsWith("http") ? url : "https://www.baidu.com" + url,
            description,
          });
        }
      });

      return searchResults;
    });

    console.log(
      `🏁 Baidu extraction completed, ${results.length} results found`
    );

    if (results.length === 0) {
      console.warn("⚠️ No results found for Baidu");
    }

    return results;
  } catch (error) {
    console.error("❌ Error during Baidu search:", error);
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Error closing browser:", e);
      }
    }
  }
}

module.exports = searchBaidu;
