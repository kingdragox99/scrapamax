const utils = require("./utils");

/**
 * Recherche sur Ecosia avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @param {string} region - La région pour le user agent
 * @param {string} language - La langue pour le user agent
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchEcosia(query, region, language) {
  console.log(`\n🔍 Tentative de recherche Ecosia pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Ecosia...");
    const page = await browser.newPage();

    // Masquer la signature Puppeteer/WebDriver
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

    // Configurer un user agent approprié à la région/langue
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer des comportements aléatoires
    await page.setViewport({
      width: 1500 + Math.floor(Math.random() * 100),
      height: 850 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigation vers Ecosia...`);
    // Naviguer vers Ecosia et attendre que la page se charge
    await page.goto(
      `https://www.ecosia.org/search?method=index&q=${encodeURIComponent(
        query
      )}`,
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Petite pause pour éviter la détection
    await utils.randomDelay(2000, 4000);

    console.log(`🍪 Vérification des popups et consentements...`);
    // Gérer les bannières de consentement
    try {
      const selectors = [
        "#accept",
        ".cookie-notice__accept",
        'button[data-test-id="consent-accept-button"]',
        "button.js-consent-accept",
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup détecté, clique sur ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ Pas de popup à fermer ou erreur:", e.message);
    }

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    // Ajouter un scrolling plus naturel
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

    console.log(`🔍 Extraction des résultats Ecosia...`);
    // Extraire les résultats avec plusieurs tentatives de sélecteurs
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Définir plusieurs jeux de sélecteurs car Ecosia change souvent
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

      // Essayer chaque jeu de sélecteurs
      for (const selectors of selectorSets) {
        const elements = document.querySelectorAll(selectors.container);
        console.log(
          `Essai avec ${selectors.container}: ${elements.length} éléments trouvés`
        );

        if (elements.length > 0) {
          elements.forEach((element, index) => {
            if (index < 20) {
              // Augmenté pour obtenir plus de résultats
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
                    : "Pas de description disponible",
                });
              }
            }
          });

          if (searchResults.length > 0) {
            break;
          }
        }
      }

      // Approche de secours si les sélecteurs spécifiques ne fonctionnent pas
      if (searchResults.length === 0) {
        console.log("Essai avec une méthode de secours générique");
        const allLinks = document.querySelectorAll(
          'main a[href^="http"]:not([href*="ecosia.org"])'
        );

        allLinks.forEach((link, index) => {
          if (
            index < 20 &&
            link.textContent &&
            link.textContent.trim().length > 10
          ) {
            // Trouver un élément texte à proximité qui pourrait être une description
            let description = "Pas de description disponible";
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
      `🏁 Extraction Ecosia terminée, ${results.length} résultats trouvés`
    );
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ Aucun résultat trouvé pour Ecosia`);
      return [
        {
          title: `Aucun résultat Ecosia pour "${query}"`,
          url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
          description:
            "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou Ecosia a changé sa structure HTML.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche Ecosia:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Erreur de recherche Ecosia",
        url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
        description: `Erreur lors du scraping: ${error.message}. Ecosia bloque probablement les requêtes automatisées.`,
      },
    ];
  }
}

module.exports = searchEcosia;
