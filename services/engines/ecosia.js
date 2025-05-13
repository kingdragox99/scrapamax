const utils = require("./utils/index");

/**
 * Search on Ecosia with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Region for user agent
 * @param {string} language - Language for user agent
 * @returns {Promise<Array>} Array of search results
 */
async function searchEcosia(query, region, language) {
  console.log(`\n🔍 Attempting Ecosia search for: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up Ecosia page...");
    const page = await browser.newPage();

    // Hide Puppeteer/WebDriver signature
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          {
            0: { type: "application/x-google-chrome-pdf" },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin",
          },
        ],
      });
    });

    // Configure appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure random behaviors
    await page.setViewport({
      width: 1500 + Math.floor(Math.random() * 100),
      height: 850 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigating to Ecosia...`);
    // Navigate to Ecosia and wait for page to load
    await page.goto(
      `https://www.ecosia.org/search?method=index&q=${encodeURIComponent(
        query
      )}`,
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );

    console.log(`⏳ Waiting after page load...`);
    // Short pause to avoid detection
    await utils.randomDelay(2000, 4000);

    console.log(`🍪 Checking for popups and consent notices...`);
    // Handle consent banners
    try {
      const selectors = [
        "#accept",
        ".cookie-notice__accept",
        'button[data-test-id="consent-accept-button"]',
        "button.js-consent-accept",
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup detected, clicking on ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ No popup to close or error:", e.message);
    }

    console.log(`🖱️ Simulating scrolling to appear human...`);
    // Add more natural scrolling
    await page.evaluate(() => {
      const maxScrolls = 4 + Math.floor(Math.random() * 3);
      let currentScroll = 0;

      const scrollDown = () => {
        if (currentScroll < maxScrolls) {
          window.scrollBy(0, 100 + Math.random() * 200);
          currentScroll++;
          setTimeout(scrollDown, 800 + Math.random() * 1200);
        }
      };

      scrollDown();
    });

    await utils.randomDelay(2500, 4000);

    console.log(`🔍 Extracting Ecosia results...`);
    // Extract results with multiple selector attempts
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Define multiple selector sets as Ecosia changes often
      const selectorSets = [
        {
          container: ".result",
          title: ".result-title",
          link: "a.js-result-url",
          snippet: ".result-snippet",
        },
        {
          container: ".result-container",
          title: "a.result-title",
          link: "a.result-url",
          snippet: ".result-snippet",
        },
        {
          container: ".js-result",
          title: "a.result-title",
          link: "a",
          snippet: ".snippet",
        },
        {
          container: "[data-test-id='search-result']",
          title: "a",
          link: "a",
          snippet: "p",
        },
      ];

      // Try each selector set
      for (const selectors of selectorSets) {
        const elements = document.querySelectorAll(selectors.container);
        console.log(
          `Trying with ${selectors.container}: ${elements.length} elements found`
        );

        if (elements.length > 0) {
          elements.forEach((element, index) => {
            if (index < 20) {
              // Increased to get more results
              const titleElement = element.querySelector(selectors.title);
              const linkElement =
                element.querySelector(selectors.link) || titleElement;
              const snippetElement = element.querySelector(selectors.snippet);

              if (titleElement && linkElement) {
                searchResults.push({
                  title: titleElement.innerText.trim(),
                  url: linkElement.href,
                  description: snippetElement
                    ? snippetElement.innerText.trim()
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

      // Fallback approach if specific selectors don't work
      if (searchResults.length === 0) {
        console.log("Trying with a generic fallback method");
        const allLinks = document.querySelectorAll(
          'main a[href^="http"]:not([href*="ecosia.org"])'
        );

        allLinks.forEach((link, index) => {
          if (
            index < 20 &&
            link.textContent &&
            link.textContent.trim().length > 10
          ) {
            // Find a nearby text element that could be a description
            let description = "No description available";
            const parent = link.closest("div");
            if (parent) {
              const possibleDescription = parent.querySelector("p");
              if (possibleDescription) {
                description = possibleDescription.innerText.trim();
              }
            }

            searchResults.push({
              title: link.textContent.trim(),
              url: link.href,
              description,
            });
          }
        });
      }

      return searchResults;
    });

    console.log(
      `🏁 Ecosia extraction completed, ${results.length} results found`
    );
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ No results found for Ecosia`);
      return [
        {
          title: `No Ecosia results for "${query}"`,
          url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
          description:
            "Scraping worked but found no results. Possibly an error in CSS selectors or Ecosia changed its HTML structure.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Error during Ecosia search:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Ecosia search error",
        url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
        description: `Error during scraping: ${error.message}. Ecosia is probably blocking automated requests.`,
      },
    ];
  }
}

module.exports = searchEcosia;
