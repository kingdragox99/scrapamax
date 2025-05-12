const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

/**
 * Recherche sur Brave Search avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchBrave(query) {
  console.log(`\n🔍 Tentative de recherche Brave pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Brave...");
    const page = await browser.newPage();

    // Masquer la signature Puppeteer/WebDriver
    await utils.setupBrowserAntiDetection(page);

    // Configurer un user agent aléatoire mais réaliste
    const userAgent = await utils.getUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer une taille d'écran aléatoire
    await utils.setupRandomScreenSize(page);

    console.log(`🌐 Navigation vers Brave Search...`);
    // Naviguer vers Brave Search avec un timeout plus long
    try {
      await page.goto(
        `https://search.brave.com/search?q=${encodeURIComponent(
          query
        )}&source=web`,
        {
          waitUntil: "domcontentloaded", // Utiliser domcontentloaded au lieu de networkidle2
          timeout: 60000, // Augmenter à 60 secondes
        }
      );
    } catch (navError) {
      console.warn(
        `⚠️ Problème lors de la navigation vers Brave: ${navError.message}`
      );
      console.log("Tentative d'alternative avec une URL simplifiée...");

      // Tenter une approche alternative
      try {
        await page.goto(`https://search.brave.com/`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        // Attendre que la page se charge
        await utils.randomDelay(2000, 4000);

        // Saisir la recherche dans le champ
        await page.type('input[name="q"]', query);
        await page.keyboard.press("Enter");

        // Attendre que les résultats se chargent
        await page.waitForSelector("#results", { timeout: 30000 }).catch(() => {
          console.log("Sélecteur de résultats non trouvé, mais on continue");
        });
      } catch (altError) {
        console.error(
          `❌ L'approche alternative a également échoué: ${altError.message}`
        );
        throw navError; // Remonter l'erreur originale
      }
    }

    console.log(`⏳ Attente après chargement de la page...`);
    // Petite pause pour éviter la détection
    await utils.randomDelay(1000, 3000);

    // Gérer les popups de consentement éventuels
    try {
      const consentSelectors = [
        'button[data-t="acceptAllButton"]',
        "button.btn.btn-primary",
        "button.accept-all",
      ];

      for (const selector of consentSelectors) {
        const button = await page.$(selector);
        if (button) {
          console.log(`🍪 Popup de consentement détecté, clic sur ${selector}`);
          await button.click();
          await utils.randomDelay(1000, 2000);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ Pas de popup à fermer ou erreur:", e.message);
    }

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extraction des résultats Brave...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Mise à jour des sélecteurs pour les résultats organiques de Brave
      const resultElements = document.querySelectorAll(
        ".snippet, .fdb, article.svelte-127ph0k"
      );

      if (resultElements.length === 0) {
        // Essayer d'autres sélecteurs si les premiers ne fonctionnent pas
        const altSelectors = [
          'article[data-type="organic"]',
          ".results-section .module-item",
          "div[data-results] > div",
          ".snippets-list .snippet",
          ".main-results-page .results-list > div",
        ];

        for (const selector of altSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((element) => {
              // Extraire le titre
              const titleElement = element.querySelector(
                "h3, .title, h4, a[data-opt] > div:first-child"
              );
              if (!titleElement) return;

              const title = titleElement.textContent.trim();

              // Extraire l'URL
              const linkElement = element.querySelector(
                'a[href]:not([href="#"])'
              );
              if (!linkElement) return;

              const url = linkElement.href;

              // Extraire la description
              const descriptionElement = element.querySelector(
                ".snippet-description, .description, .snippet-content, div > p"
              );
              const description = descriptionElement
                ? descriptionElement.textContent.trim()
                : "";

              if (title && url) {
                searchResults.push({ title, url, description });
              }
            });

            // Si on a trouvé des résultats, on arrête la boucle
            if (searchResults.length > 0) break;
          }
        }
      } else {
        // Utiliser les résultats des sélecteurs originaux s'ils fonctionnent
        resultElements.forEach((element) => {
          // Extraire le titre
          const titleElement = element.querySelector(".title, h3, h4, strong");
          if (!titleElement) return;

          const title = titleElement.textContent.trim();

          // Extraire l'URL
          const linkElement = element.querySelector('a[href]:not([href="#"])');
          if (!linkElement) return;

          const url = linkElement.href;

          // Extraire la description
          const descriptionElement = element.querySelector(
            ".snippet-description, .description, .snippet-content, div > p"
          );
          const description = descriptionElement
            ? descriptionElement.textContent.trim()
            : "";

          if (title && url) {
            searchResults.push({ title, url, description });
          }
        });
      }

      // Vérifier si la page contient un message d'erreur ou "No results found"
      const noResultsElement = document.querySelector(
        ".no-results, .empty-state, .message-area"
      );
      if (searchResults.length === 0 && noResultsElement) {
        console.log(
          "Message de page sans résultats détecté:",
          noResultsElement.textContent.trim()
        );
      }

      return searchResults;
    });

    // Prendre une capture d'écran pour debug si aucun résultat n'est trouvé
    if (results.length === 0) {
      try {
        console.log("⚠️ Capture d'écran de diagnostic pour Brave Search...");
        await page.screenshot({ path: "brave-debug.png" });
        console.log("✅ Capture d'écran sauvegardée dans brave-debug.png");
      } catch (screenshotError) {
        console.log(
          "❌ Impossible de prendre une capture d'écran:",
          screenshotError.message
        );
      }
    }

    console.log(
      `🏁 Extraction Brave terminée, ${results.length} résultats trouvés`
    );

    if (results.length === 0) {
      console.warn("⚠️ Aucun résultat trouvé pour Brave");
    }

    return results;
  } catch (error) {
    console.error("❌ Erreur lors de la recherche Brave:", error);
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Erreur lors de la fermeture du navigateur:", e);
      }
    }
  }
}

module.exports = searchBrave;
