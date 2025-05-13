const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils/index");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Search on Brave Search with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Search region
 * @param {string} language - Search language
 * @returns {Promise<Array>} Array of search results
 */
async function searchBrave(query, region, language) {
  console.log(`\n🔍 Attempting Brave search for: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up Brave Search page...");
    const page = await browser.newPage();

    // Hide Puppeteer/WebDriver signature
    await utils.setupBrowserAntiDetection(page);

    // Configure appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure random screen size
    await utils.setupRandomScreenSize(page);

    console.log(`🌐 Navigating to Brave Search...`);
    // Navigate to Brave Search with longer timeout
    try {
      await page.goto(
        `https://search.brave.com/search?q=${encodeURIComponent(
          query
        )}&source=web`,
        {
          waitUntil: "domcontentloaded", // Use domcontentloaded instead of networkidle2
          timeout: 60000, // Increase to 60 seconds
        }
      );
    } catch (navError) {
      console.warn(`⚠️ Problem navigating to Brave: ${navError.message}`);
      console.log("Attempting alternative with simplified URL...");

      // Try alternative approach
      try {
        await page.goto(`https://search.brave.com/`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        // Wait for page to load
        await utils.randomDelay(2000, 4000);

        // Enter search in field
        await page.type('input[name="q"]', query);
        await page.keyboard.press("Enter");

        // Wait for results to load
        await page.waitForSelector("#results", { timeout: 30000 }).catch(() => {
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
        'button[data-t="acceptAllButton"]',
        "button.btn.btn-primary",
        "button.accept-all",
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
    const captchaResolved = await utils.handleCaptcha(page, "Brave");
    if (captchaResolved) {
      console.log("✅ CAPTCHA solved, resuming Brave search...");
      // Wait a bit after solving CAPTCHA
      await utils.randomDelay(2000, 4000);
    }

    console.log(`🖱️ Simulating scrolling to appear human...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extracting Brave results...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Updated selectors for Brave organic results
      const resultElements = document.querySelectorAll(
        ".snippet, .fdb, article.svelte-127ph0k"
      );

      if (resultElements.length === 0) {
        // Try other selectors if first ones don't work
        const altSelectors = [
          'article[data-type="organic"]',
          ".results-section .module-item",
          "div[data-results] > div",
          ".snippets-list .snippet",
          ".main-results-page .results-list > div",
        ];

        for (const selector of altSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((element) => {
              // Extract title
              const titleElement = element.querySelector(
                "h3, .title, h4, a[data-opt] > div:first-child"
              );
              if (!titleElement) return;

              const title = titleElement.textContent.trim();

              // Extract URL
              const linkElement = element.querySelector(
                'a[href]:not([href="#"])'
              );
              if (!linkElement) return;

              const url = linkElement.href;

              // Extract description
              const descriptionElement = element.querySelector(
                ".snippet-description, .description, .snippet-content, div > p"
              );
              const description = descriptionElement
                ? descriptionElement.textContent.trim()
                : "";

              if (title && url) {
                searchResults.push({ title, url, description });
              }
            });

            // If we found results, stop the loop
            if (searchResults.length > 0) break;
          }
        }
      } else {
        // Use results from original selectors if they work
        resultElements.forEach((element) => {
          // Extract title
          const titleElement = element.querySelector(".title, h3, h4, strong");
          if (!titleElement) return;

          const title = titleElement.textContent.trim();

          // Extract URL
          const linkElement = element.querySelector('a[href]:not([href="#"])');
          if (!linkElement) return;

          const url = linkElement.href;

          // Extract description
          const descriptionElement = element.querySelector(
            ".snippet-description, .description, .snippet-content, div > p"
          );
          const description = descriptionElement
            ? descriptionElement.textContent.trim()
            : "";

          if (title && url) {
            searchResults.push({ title, url, description });
          }
        });
      }

      // Check if page contains an error message or "No results found"
      const noResultsElement = document.querySelector(
        ".no-results, .empty-state, .message-area"
      );
      if (searchResults.length === 0 && noResultsElement) {
        console.log(
          "No results page message detected:",
          noResultsElement.textContent.trim()
        );
      }

      return searchResults;
    });

    // Take a diagnostic screenshot if no results are found
    if (results.length === 0) {
      try {
        console.log("⚠️ Diagnostic screenshot for Brave Search...");
        await page.screenshot({ path: "brave-debug.png" });
        console.log("✅ Screenshot saved to brave-debug.png");
      } catch (screenshotError) {
        console.log("❌ Unable to take screenshot:", screenshotError.message);
      }
    }

    console.log(
      `🏁 Brave extraction completed, ${results.length} results found`
    );

    if (results.length === 0) {
      console.warn("⚠️ No results found for Brave");
    }

    return results;
  } catch (error) {
    console.error("❌ Error during Brave search:", error);
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

module.exports = searchBrave;
