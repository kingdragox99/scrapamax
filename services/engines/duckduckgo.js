const utils = require("./utils");

/**
 * Recherche sur DuckDuckGo avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @param {string} region - La région pour le user agent
 * @param {string} language - La langue pour le user agent
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchDuckDuckGo(query, region, language) {
  console.log(`\n🔍 Tentative de recherche DuckDuckGo pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page DuckDuckGo...");
    const page = await browser.newPage();

    // Configurer un user agent approprié à la région/langue
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer des comportements aléatoires
    await page.setViewport({
      width: 1440 + Math.floor(Math.random() * 100),
      height: 900 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigation vers DuckDuckGo...`);
    // Naviguer vers DuckDuckGo et attendre que la page se charge
    // Utiliser l'interface HTML qui est plus stable pour le scraping
    await page.goto(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Petite pause pour éviter la détection
    await utils.randomDelay();

    console.log(`🔍 Extraction des résultats...`);
    // Extraire les résultats
    const results = await page.evaluate(() => {
      const searchResults = [];
      const resultElements = document.querySelectorAll(".result");

      resultElements.forEach((element, index) => {
        if (index < 20) {
          // Augmenté pour obtenir plus de résultats
          const titleElement = element.querySelector(".result__title a");
          const snippetElement = element.querySelector(".result__snippet");

          if (titleElement) {
            // Récupérer l'URL brute
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

    // Nettoyer les URLs de DuckDuckGo
    console.log(`🧹 Nettoyage des URLs de redirection DuckDuckGo...`);
    for (const result of results) {
      result.url = utils.decodeDuckDuckGoUrl(result.url);
    }

    console.log(`🏁 Extraction terminée, ${results.length} résultats trouvés`);
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ Aucun résultat trouvé pour DuckDuckGo`);
      return [
        {
          title: `Aucun résultat DuckDuckGo pour "${query}"`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          description:
            "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou DuckDuckGo a changé sa structure HTML.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche DuckDuckGo:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Erreur de recherche DuckDuckGo",
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        description: `Erreur lors du scraping: ${error.message}.`,
      },
    ];
  }
}

module.exports = searchDuckDuckGo;
