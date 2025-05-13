const utils = require("./utils");

/**
 * Search on Yandex with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchYandex(query, options = {}) {
  const { region = "global", language = "auto" } = options;

  console.log(`\n🔍 Attempting Yandex search for: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up Yandex page...");
    const page = await browser.newPage();

    // Hide Puppeteer/WebDriver signature for Yandex
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      window.navigator.chrome = {
        runtime: {},
      };
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    });

    // Configure appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure random behaviors
    await page.setViewport({
      width: 1400 + Math.floor(Math.random() * 100),
      height: 850 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigating to Yandex...`);
    // Navigate to Yandex and wait for page to load - use English interface
    await page.goto(
      `https://yandex.com/search/?text=${encodeURIComponent(query)}&lang=en`,
      {
        waitUntil: "networkidle2",
        timeout: 30000, // Increase timeout as Yandex can be slow
      }
    );

    console.log(`⏳ Waiting after Yandex page load...`);
    // Longer pause for Yandex
    await utils.randomDelay(3500, 6000);

    console.log(`🍪 Checking Yandex popups and consent notices...`);
    // Handle consent banners
    try {
      const selectors = [
        'button[data-t="button:action"]',
        ".button_type_action",
        ".cookie-consent__button",
        ".modal__close",
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Yandex popup detected, clicking on ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ No Yandex popup to close or error:", e.message);
    }

    console.log(`🖱️ Simulating scrolling to appear human on Yandex...`);
    // Add random scrolling - more subtle on Yandex
    await page.evaluate(() => {
      const maxScrolls = 3 + Math.floor(Math.random() * 3); // 3-5 scrolls
      let currentScroll = 0;

      const scrollDown = () => {
        if (currentScroll < maxScrolls) {
          window.scrollBy(0, 150 + Math.random() * 250);
          currentScroll++;
          setTimeout(scrollDown, 500 + Math.random() * 1000);
        }
      };

      scrollDown();
    });

    await utils.randomDelay(3000, 5000);

    console.log(`🔍 Extracting Yandex results...`);
    // Extract results - try different selectors for Yandex
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Try different selectors as Yandex changes often
      const selectors = [
        {
          container: ".serp-item",
          title: ".OrganicTitle-Link",
          snippet: ".OrganicText",
        },
        {
          container: ".organic",
          title: ".organic__url-text",
          snippet: ".organic__content",
        },
        {
          container: ".serp-item_type_search",
          title: "a",
          snippet: "div[class*='text']",
        },
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector.container);
        console.log(
          `Trying with selector ${selector.container}: ${elements.length} elements found`
        );

        if (elements.length > 0) {
          elements.forEach((element, index) => {
            if (index < 20) {
              // Increased to get more results
              const titleElement = element.querySelector(selector.title);
              const snippetElement = element.querySelector(selector.snippet);

              if (titleElement) {
                let url = titleElement.href;
                // If URL is not complete, check if there's a data-url attribute
                if (!url || url.startsWith("/")) {
                  url =
                    titleElement.getAttribute("data-url") ||
                    element.querySelector('a[href^="http"]')?.href ||
                    `https://yandex.com/search/?text=${encodeURIComponent(
                      document.title.split("—")[0]
                    )}`;
                }

                searchResults.push({
                  title: titleElement.innerText,
                  url: url,
                  description: snippetElement
                    ? snippetElement.innerText
                    : "No description available",
                });
              }
            }
          });

          if (searchResults.length > 0) {
            break;
          }
        }
      }

      // If no results found, try an even more generic approach
      if (searchResults.length === 0) {
        const allLinks = document.querySelectorAll('a[href^="http"]');
        let count = 0;

        allLinks.forEach((link) => {
          if (
            count < 20 &&
            link.textContent &&
            link.textContent.trim().length > 15
          ) {
            searchResults.push({
              title: link.textContent.trim(),
              url: link.href,
              description: "Description not available, fallback extraction",
            });
            count++;
          }
        });
      }

      return searchResults;
    });

    console.log(
      `🏁 Yandex extraction completed, ${results.length} results found`
    );
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ No results found for Yandex`);
      return [
        {
          title: `No Yandex results for "${query}"`,
          url: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
          description:
            "Scraping worked but found no results. Possibly an error in CSS selectors or Yandex changed its HTML structure.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Error during Yandex search:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Yandex search error",
        url: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
        description: `Error during scraping: ${error.message}. Yandex is probably blocking automated requests.`,
      },
    ];
  }
}

module.exports = searchYandex;
