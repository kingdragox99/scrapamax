const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");

/**
 * Search on Ecosia with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchEcosia(query, options = {}) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const { browser: initializedBrowser, page } = await searchHelper.initSearch(
      "Ecosia",
      query,
      options
    );
    browser = initializedBrowser;

    console.log(`🌐 Navigation vers Ecosia...`);
    // Navigation vers Ecosia et attente du chargement de la page
    await page.goto(
      `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Courte pause pour éviter la détection
    await utils.randomDelay(2000, 4000);

    // Gestion des bannières de consentement
    const consentSelectors = [
      "button.cmp-button_button.cmp-intro_acceptAll",
      "button.accept-all",
      "#accept",
      "button[data-testid='accept-all']",
    ];
    await searchHelper.handleConsentPopups(page, "Ecosia", consentSelectors);

    console.log(`🖱️ Simulation de défilement pour paraître humain...`);
    // Ajout de défilement aléatoire
    await utils.humanScroll(page);

    await utils.randomDelay(1000, 3000);

    console.log(`🔍 Extraction des résultats...`);
    // Extraction des résultats
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Sélecteurs pour les résultats Ecosia
      const resultElements = document.querySelectorAll(
        ".result.result-web, .js-result, .card-web"
      );

      resultElements.forEach((element, index) => {
        if (index < 20) {
          const titleElement = element.querySelector(
            ".result-title, h2 a, .title"
          );
          const linkElement = element.querySelector(
            "a.result-url, a.js-result-url, a.result-title, h2 a"
          );
          const snippetElement = element.querySelector(
            ".result-snippet, .snippet, .description"
          );

          if (titleElement && linkElement) {
            searchResults.push({
              title: titleElement.innerText,
              url: linkElement.href,
              description: snippetElement
                ? snippetElement.innerText
                : "Pas de description disponible",
            });
          }
        }
      });

      // Si aucun résultat n'est trouvé avec les sélecteurs principaux, essayer des méthodes alternatives
      if (searchResults.length === 0) {
        // Approche alternative pour les résultats
        document
          .querySelectorAll("div[data-test-id='organic-result']")
          .forEach((element) => {
            const titleElement = element.querySelector("h2, .title");
            const linkElement = element.querySelector("a[href]:not([href=''])");
            const snippetElement = element.querySelector(
              ".description, .snippet"
            );

            if (titleElement && linkElement) {
              searchResults.push({
                title: titleElement.innerText,
                url: linkElement.href,
                description: snippetElement
                  ? snippetElement.innerText
                  : "Pas de description disponible",
              });
            }
          });
      }

      return searchResults;
    });

    console.log(`🏁 Extraction terminée, ${results.length} résultats trouvés`);
    await searchHelper.closeBrowser(browser);

    if (results.length === 0) {
      return await searchHelper.handleNoResults(
        browser,
        query,
        "Ecosia",
        "https://www.ecosia.org/search?q="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "Ecosia",
      "https://www.ecosia.org/search?q="
    );
  }
}

module.exports = searchEcosia;
