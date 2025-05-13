const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");

/**
 * Search on DuckDuckGo with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Region for user agent
 * @param {string} language - Language for user agent
 * @returns {Promise<Array>} Array of search results
 */
async function searchDuckDuckGo(query, region, language) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const { browser: initializedBrowser, page } = await searchHelper.initSearch(
      "DuckDuckGo",
      query,
      { region, language }
    );
    browser = initializedBrowser;

    console.log(`🌐 Navigation vers DuckDuckGo...`);
    // Navigation vers DuckDuckGo et attente du chargement de la page
    // Utiliser l'interface HTML qui est plus stable pour le scraping
    await page.goto(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Courte pause pour éviter la détection
    await utils.randomDelay();

    console.log(`🔍 Extraction des résultats...`);
    // Extraction des résultats
    const results = await page.evaluate(() => {
      const searchResults = [];
      const resultElements = document.querySelectorAll(".result");

      resultElements.forEach((element, index) => {
        if (index < 20) {
          // Augmenté pour obtenir plus de résultats
          const titleElement = element.querySelector(".result__title a");
          const snippetElement = element.querySelector(".result__snippet");

          if (titleElement) {
            // Obtenir l'URL brute
            const rawUrl = titleElement.href;

            searchResults.push({
              title: titleElement.innerText,
              url: rawUrl, // L'URL sera nettoyée plus tard
              description: snippetElement
                ? snippetElement.innerText
                : "Pas de description disponible",
            });
          }
        }
      });

      return searchResults;
    });

    // Nettoyer les URLs DuckDuckGo
    console.log(`🧹 Nettoyage des URLs de redirection DuckDuckGo...`);
    for (const result of results) {
      result.url = utils.decodeDuckDuckGoUrl(result.url);
    }

    console.log(`🏁 Extraction terminée, ${results.length} résultats trouvés`);
    await searchHelper.closeBrowser(browser);

    if (results.length === 0) {
      return await searchHelper.handleNoResults(
        browser,
        query,
        "DuckDuckGo",
        "https://duckduckgo.com/?q="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "DuckDuckGo",
      "https://duckduckgo.com/?q="
    );
  }
}

module.exports = searchDuckDuckGo;
