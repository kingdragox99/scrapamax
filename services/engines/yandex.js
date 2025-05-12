const utils = require("./utils");

/**
 * Recherche sur Yandex avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @param {Object} options - Options de recherche
 * @param {string} options.region - Code de région pour la recherche
 * @param {string} options.language - Code de langue pour la recherche
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchYandex(query, options = {}) {
  const { region = "global", language = "auto" } = options;

  console.log(`\n🔍 Tentative de recherche Yandex pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Yandex...");
    const page = await browser.newPage();

    // Masquer la signature Puppeteer/WebDriver pour Yandex
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

    // Configurer un user agent approprié à la région/langue
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer des comportements aléatoires
    await page.setViewport({
      width: 1400 + Math.floor(Math.random() * 100),
      height: 850 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
    });

    console.log(`🌐 Navigation vers Yandex...`);
    // Naviguer vers Yandex et attendre que la page se charge - utiliser l'interface anglaise
    await page.goto(
      `https://yandex.com/search/?text=${encodeURIComponent(query)}&lang=en`,
      {
        waitUntil: "networkidle2",
        timeout: 30000, // Augmenter le timeout car Yandex peut être lent
      }
    );

    console.log(`⏳ Attente après chargement de la page Yandex...`);
    // Pause plus longue pour Yandex
    await utils.randomDelay(3500, 6000);

    console.log(`🍪 Vérification des popups et consentements Yandex...`);
    // Gérer les bannières de consentement
    try {
      const selectors = [
        'button[data-t="button:action"]',
        ".button_type_action",
        ".cookie-consent__button",
        ".modal__close",
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup Yandex détecté, clique sur ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ Pas de popup Yandex à fermer ou erreur:", e.message);
    }

    console.log(
      `🖱️ Simulation de scrolling pour paraître humain sur Yandex...`
    );
    // Ajouter un scrolling aléatoire - plus subtil sur Yandex
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

    console.log(`🔍 Extraction des résultats Yandex...`);
    // Extraire les résultats - essayer différents sélecteurs pour Yandex
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Essayer différents sélecteurs car Yandex change souvent
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
          `Essai avec sélecteur ${selector.container}: ${elements.length} éléments trouvés`
        );

        if (elements.length > 0) {
          elements.forEach((element, index) => {
            if (index < 20) {
              // Augmenté pour obtenir plus de résultats
              const titleElement = element.querySelector(selector.title);
              const snippetElement = element.querySelector(selector.snippet);

              if (titleElement) {
                let url = titleElement.href;
                // Si l'URL n'est pas complète, vérifier s'il y a un attribut data-url
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

      // Si aucun résultat trouvé, essayer une approche encore plus générique
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
              description: "Description non disponible, extraction de secours",
            });
            count++;
          }
        });
      }

      return searchResults;
    });

    console.log(
      `🏁 Extraction Yandex terminée, ${results.length} résultats trouvés`
    );
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ Aucun résultat trouvé pour Yandex`);
      return [
        {
          title: `Aucun résultat Yandex pour "${query}"`,
          url: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
          description:
            "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou Yandex a changé sa structure HTML.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche Yandex:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Erreur de recherche Yandex",
        url: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
        description: `Erreur lors du scraping: ${error.message}. Yandex bloque probablement les requêtes automatisées.`,
      },
    ];
  }
}

module.exports = searchYandex;
