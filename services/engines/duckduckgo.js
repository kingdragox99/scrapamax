const utils = require("./utils/index");

/**
 * Search on DuckDuckGo with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Region for user agent
 * @param {string} language - Language for user agent
 * @returns {Promise<Array>} Array of search results
 */
async function searchDuckDuckGo(query, region, language) {
  console.log(`\n🔍 Attempting DuckDuckGo search for: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up DuckDuckGo page...");
    const page = await browser.newPage();

    // Configure appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure random behaviors
    await page.setViewport({
      width: 1440 + Math.floor(Math.random() * 100),
      height: 900 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigating to DuckDuckGo...`);
    // Navigate to DuckDuckGo and wait for page to load
    // Use HTML interface which is more stable for scraping
    await page.goto(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Waiting after page load...`);
    // Short pause to avoid detection
    await utils.randomDelay();

    console.log(`🔍 Extracting results...`);
    // Extract results
    const results = await page.evaluate(() => {
      const searchResults = [];
      const resultElements = document.querySelectorAll(".result");

      resultElements.forEach((element, index) => {
        if (index < 20) {
          // Increased to get more results
          const titleElement = element.querySelector(".result__title a");
          const snippetElement = element.querySelector(".result__snippet");

          if (titleElement) {
            // Get raw URL
            const rawUrl = titleElement.href;

            searchResults.push({
              title: titleElement.innerText,
              url: rawUrl, // URL will be cleaned later
              description: snippetElement
                ? snippetElement.innerText
                : "No description available",
            });
          }
        }
      });

      return searchResults;
    });

    // Clean DuckDuckGo URLs
    console.log(`🧹 Cleaning DuckDuckGo redirect URLs...`);
    for (const result of results) {
      result.url = utils.decodeDuckDuckGoUrl(result.url);
    }

    console.log(`🏁 Extraction completed, ${results.length} results found`);
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ No results found for DuckDuckGo`);
      return [
        {
          title: `No DuckDuckGo results for "${query}"`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          description:
            "Scraping worked but found no results. Possibly an error in CSS selectors or DuckDuckGo changed its HTML structure.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Error during DuckDuckGo search:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "DuckDuckGo search error",
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        description: `Error during scraping: ${error.message}.`,
      },
    ];
  }
}

module.exports = searchDuckDuckGo;
