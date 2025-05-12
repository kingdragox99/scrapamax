const utils = require("./utils");

/**
 * Recherche sur Bing avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchBing(query) {
  console.log(`\n🔍 Tentative de recherche Bing pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Bing...");
    const page = await browser.newPage();

    // Configurer un user agent aléatoire
    const userAgent = await utils.getUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer des comportements aléatoires
    await page.setViewport({
      width: 1366 + Math.floor(Math.random() * 100),
      height: 768 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigation vers Bing...`);
    // Naviguer vers Bing et attendre que la page se charge
    await page.goto(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      {
        waitUntil: "networkidle2",
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Petite pause pour éviter la détection
    await utils.randomDelay(2000, 4000);

    console.log(`🍪 Vérification des popups et consentements...`);
    // Gérer les bannières de consentement
    try {
      const selectors = [
        "#bnp_btn_accept",
        ".bnp_btn_accept",
        '[aria-label="Accept"]',
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup détecté, clique sur ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(1500);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ Pas de popup à fermer ou erreur:", e.message);
    }

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    // Ajouter un scrolling aléatoire
    await page.evaluate(() => {
      window.scrollBy(0, 200 + Math.random() * 300);
    });

    await utils.randomDelay(1000, 3000);

    console.log(`🔍 Extraction des résultats...`);
    // Extraire les résultats
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

    console.log(`🏁 Extraction terminée, ${results.length} résultats trouvés`);
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ Aucun résultat trouvé pour Bing`);
      return [
        {
          title: `Aucun résultat Bing pour "${query}"`,
          url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
          description:
            "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou Bing a changé sa structure HTML.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche Bing:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Erreur de recherche Bing",
        url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        description: `Erreur lors du scraping: ${error.message}. Bing bloque probablement les requêtes automatisées.`,
      },
    ];
  }
}

module.exports = searchBing;
