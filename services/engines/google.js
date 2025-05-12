const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

/**
 * Recherche sur Google avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchGoogle(query) {
  console.log(`\n🔍 Tentative de recherche Google pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Google...");
    const page = await browser.newPage();

    // Masquer la signature Puppeteer/WebDriver
    await page.evaluateOnNewDocument(() => {
      // Surcharge des méthodes de détection d'automatisation
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      // Supprimer les attributs de détection de Chrome
      delete navigator.languages;
      Object.defineProperty(navigator, "languages", {
        get: () => ["fr-FR", "fr", "en-US", "en"],
      });
      // Simuler une plateforme non-headless
      Object.defineProperty(navigator, "platform", {
        get: () => "Win32",
      });
      // Masquer les fonctions de détection de Puppeteer
      window.chrome = {
        runtime: {},
      };
    });

    // Configurer un user agent aléatoire mais réaliste
    const userAgent = await utils.getUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer des cookies pour éviter les bannières
    await page.setCookie({
      name: "CONSENT",
      value: "YES+cb.20220301-11-p0.fr+FX+419",
      domain: ".google.com",
      path: "/",
      expires: Date.now() / 1000 + 1000 * 24 * 60 * 60,
    });

    console.log(`🖥️ Configuration de la taille d'écran aléatoire...`);
    // Configurer des comportements aléatoires
    await page.setViewport({
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });

    console.log(`🌐 Navigation vers Google...`);
    // Naviguer vers Google et attendre que la page se charge - utiliser la version française et un nombre plus élevé de résultats
    await page.goto(
      `https://www.google.fr/search?hl=fr&q=${encodeURIComponent(
        query
      )}&num=30`,
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );

    console.log(`⏳ Attente après chargement de la page...`);
    // Petite pause pour éviter la détection
    await utils.randomDelay(2000, 5000);

    console.log(`🍪 Vérification des popups et consentements...`);
    // Éviter les popups - plusieurs sélecteurs possibles
    try {
      const selectors = [
        'button[aria-label="Tout accepter"]',
        'button[aria-label="Accepter tout"]',
        'button[aria-label="J\'accepte"]',
        'button[aria-label="Accepter"]',
        "button.tHlp8d",
        "button#L2AGLb",
      ];

      for (const selector of selectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup détecté, clique sur ${selector}`);
          await page.click(selector);
          // Attendre un moment après le clic
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ Pas de popup à fermer ou erreur:", e.message);
    }

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    // Ajouter plusieurs scrollings plus naturels pour charger plus de résultats
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const maxScrolls = 5;
        let scrolls = 0;

        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrolls++;

          if (scrolls >= maxScrolls) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });

    await utils.randomDelay(2000, 3000);

    console.log(`🔍 Extraction des résultats Google...`);
    // Extraire les résultats avec une méthode plus directe qui fonctionne mieux sur Google
    const results = await page.evaluate(() => {
      console.log("Recherche des éléments dans la page Google...");

      const searchResults = [];

      // Approche 1: Cibler les résultats organiques avec plusieurs sélecteurs possibles
      const selectors = [
        {
          container: "#search .g",
          title: "h3",
          link: "a",
          snippet: "div.VwiC3b",
        },
        {
          container: "#rso .g",
          title: "h3",
          link: "a",
          snippet: "div.VwiC3b",
        },
        {
          container: "div[data-sokoban-grid] div[data-header-feature]",
          title: "h3",
          link: "a",
          snippet: "[data-content-feature]",
        },
        {
          container: "div.MjjYud",
          title: "h3",
          link: "a",
          snippet: "div[data-sncf]",
        },
      ];

      // Essayer chaque jeu de sélecteurs
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector.container);
        console.log(
          `Trouvé ${elements.length} éléments avec ${selector.container}`
        );

        if (elements.length > 0) {
          elements.forEach((element) => {
            const titleElement = element.querySelector(selector.title);
            const linkElement = titleElement
              ? titleElement.closest("a")
              : element.querySelector(selector.link);
            const snippetElement = element.querySelector(selector.snippet);

            if (
              titleElement &&
              linkElement &&
              linkElement.href &&
              linkElement.href.startsWith("http") &&
              !linkElement.href.includes("google.com/search")
            ) {
              searchResults.push({
                title: titleElement.textContent.trim(),
                url: linkElement.href,
                description: snippetElement
                  ? snippetElement.textContent.trim()
                  : "Pas de description disponible",
              });
            }
          });
        }
      }

      // Approche 2 (fallback): Prendre tous les liens dans le conteneur de résultats
      if (searchResults.length === 0) {
        console.log("Utilisation de la méthode fallback pour Google");
        const resultContainer =
          document.querySelector("#search") ||
          document.querySelector("#rso") ||
          document.querySelector('div[role="main"]');

        if (resultContainer) {
          const links = resultContainer.querySelectorAll(
            'a[href^="http"]:not([href*="google.com/search"])'
          );

          links.forEach((link) => {
            const headerTag = link.querySelector("h3") || link.closest("h3");

            if (headerTag && link.textContent.trim().length > 5) {
              // Chercher un potentiel snippet près du lien
              let snippet = "";
              let parent = link.parentElement;
              for (let i = 0; i < 3; i++) {
                if (parent) {
                  const snippetCandidate =
                    parent.querySelector("div:not(:has(a))");
                  if (
                    snippetCandidate &&
                    snippetCandidate.textContent.trim().length > 20
                  ) {
                    snippet = snippetCandidate.textContent.trim();
                    break;
                  }
                  parent = parent.parentElement;
                }
              }

              searchResults.push({
                title: headerTag.textContent.trim(),
                url: link.href,
                description: snippet || "Pas de description disponible",
              });
            }
          });
        }
      }

      // Limiter à 20 résultats uniques par URL
      const uniqueResults = [];
      const seenUrls = new Set();

      for (const result of searchResults) {
        if (!seenUrls.has(result.url) && uniqueResults.length < 20) {
          seenUrls.add(result.url);
          uniqueResults.push(result);
        }
      }

      return uniqueResults;
    });

    console.log(
      `🏁 Extraction Google terminée, ${results.length} résultats trouvés`
    );
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ Aucun résultat trouvé pour Google`);
      return [
        {
          title: `Aucun résultat Google pour "${query}"`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          description:
            "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou Google a changé sa structure HTML.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche Google:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Erreur de recherche Google",
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        description: `Erreur lors du scraping: ${error.message}. Google bloque probablement les requêtes automatisées.`,
      },
    ];
  }
}

module.exports = searchGoogle;
