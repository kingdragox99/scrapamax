const utils = require("./utils");

/**
 * Search on Bing with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchBing(query, options = {}) {
  const { region = "global", language = "auto" } = options;

  console.log(`\n🔍 Attempting Bing search for: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up Bing page...");
    const page = await browser.newPage();

    // Configure appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure random behaviors
    await page.setViewport({
      width: 1366 + Math.floor(Math.random() * 100),
      height: 768 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigating to Bing...`);
    // Navigate to Bing and wait for page to load
    await page.goto(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Waiting after page load...`);
    // Short pause to avoid detection
    await utils.randomDelay(2000, 4000);

    console.log(`🍪 Checking for popups and consent notices...`);
    // Handle consent banners
    try {
      const selectors = [
        "#bnp_btn_accept",
        ".bnp_btn_accept",
        '[aria-label="Accept"]',
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup detected, clicking on ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(1500);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ No popup to close or error:", e.message);
    }

    console.log(`🖱️ Simulating scrolling to appear human...`);
    // Add random scrolling
    await page.evaluate(() => {
      window.scrollBy(0, 200 + Math.random() * 300);
    });

    await utils.randomDelay(1000, 3000);

    console.log(`🔍 Extracting results...`);
    // Extract results
    const results = await page.evaluate(() => {
      const searchResults = [];
      const resultElements = document.querySelectorAll(".b_algo");

      resultElements.forEach((element, index) => {
        if (index < 20) {
          // Increased to get more results
          const titleElement = element.querySelector("h2 a");
          const snippetElement = element.querySelector(".b_caption p");

          if (titleElement) {
            searchResults.push({
              title: titleElement.innerText,
              url: titleElement.href,
              description: snippetElement
                ? snippetElement.innerText
                : "No description available",
            });
          }
        }
      });

      return searchResults;
    });

    console.log(`🔗 Decoding Bing redirect URLs...`);
    // Decode Bing redirect URLs
    for (const result of results) {
      result.url = utils.decodeBingUrl(result.url);
    }

    console.log(`🏁 Extraction completed, ${results.length} results found`);
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ No results found for Bing`);
      return [
        {
          title: `No Bing results for "${query}"`,
          url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
          description:
            "Scraping worked but found no results. Possibly an error in CSS selectors or Bing changed its HTML structure.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Error during Bing search:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Bing search error",
        url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        description: `Error during scraping: ${error.message}. Bing is probably blocking automated requests.`,
      },
    ];
  }
}

module.exports = searchBing;
