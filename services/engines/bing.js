const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");
const { randomDelay } = require("./utils/humanBehavior");
const { decodeBingUrl } = require("./utils/urlDecoder");

/**
 * Search on Bing with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchBing(query, options = {}) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const { browser: initializedBrowser, page } = await searchHelper.initSearch(
      "Bing",
      query,
      options
    );
    browser = initializedBrowser;

    console.log(`🌐 Navigation vers Bing...`);
    // Navigation vers Bing et attente du chargement de la page
    await page.goto(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Courte pause pour éviter la détection
    await randomDelay(2000, 4000);

    // Gestion des bannières de consentement
    const consentSelectors = [
      "#bnp_btn_accept",
      ".bnp_btn_accept",
      '[aria-label="Accept"]',
    ];
    await searchHelper.handleConsentPopups(page, "Bing", consentSelectors);

    console.log(`🖱️ Simulation de défilement pour paraître humain...`);
    // Ajout de défilement aléatoire
    await page.evaluate(() => {
      window.scrollBy(0, 200 + Math.random() * 300);
    });

    await randomDelay(1000, 3000);

    console.log(`🔍 Extraction des résultats...`);
    // Extraction des résultats
    const results = await page.evaluate(() => {
      const searchResults = [];
      const resultElements = document.querySelectorAll(".b_algo");

      resultElements.forEach((element, index) => {
        if (index < 20) {
          // Augmenté pour obtenir plus de résultats
          const titleElement = element.querySelector("h2 a");
          const snippetElement = element.querySelector(".b_caption p");

          if (titleElement) {
            searchResults.push({
              title: titleElement.innerText,
              url: titleElement.href,
              description: snippetElement
                ? snippetElement.innerText
                : "Pas de description disponible",
            });
          }
        }
      });

      return searchResults;
    });

    console.log(`🔗 Décodage des URLs de redirection Bing...`);
    // Décodage des URLs de redirection Bing
    for (const result of results) {
      result.url = decodeBingUrl(result.url);
    }

    console.log(`🏁 Extraction terminée, ${results.length} résultats trouvés`);
    await searchHelper.closeBrowser(browser);

    if (results.length === 0) {
      return await searchHelper.handleNoResults(
        browser,
        query,
        "Bing",
        "https://www.bing.com/search?q="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "Bing",
      "https://www.bing.com/search?q="
    );
  }
}

module.exports = searchBing;
