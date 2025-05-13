const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Search on Brave Search with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Search region
 * @param {string} language - Search language
 * @returns {Promise<Array>} Array of search results
 */
async function searchBrave(query, region, language) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const { browser: initializedBrowser, page } = await searchHelper.initSearch(
      "Brave",
      query,
      { region, language }
    );
    browser = initializedBrowser;

    console.log(`🌐 Navigation vers Brave Search...`);
    // Navigation vers Brave Search avec timeout plus long
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
      console.warn(`⚠️ Problème de navigation vers Brave: ${navError.message}`);
      console.log("Tentative alternative avec URL simplifiée...");

      // Essayer une approche alternative
      try {
        await page.goto(`https://search.brave.com/`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        // Attendre que la page se charge
        await utils.randomDelay(2000, 4000);

        // Entrer la recherche dans le champ
        await page.type('input[name="q"]', query);
        await page.keyboard.press("Enter");

        // Attendre que les résultats se chargent
        await page.waitForSelector("#results", { timeout: 30000 }).catch(() => {
          console.log("Sélecteur de résultats introuvable, mais continuation");
        });
      } catch (altError) {
        console.error(
          `❌ L'approche alternative a également échoué: ${altError.message}`
        );
        throw navError; // Lancer l'erreur originale
      }
    }

    console.log(`⏳ Attente après chargement de la page...`);
    // Courte pause pour éviter la détection
    await utils.randomDelay(1000, 3000);

    // Gestion des popups de consentement
    const consentSelectors = [
      'button[data-t="acceptAllButton"]',
      "button.btn.btn-primary",
      "button.accept-all",
    ];
    await searchHelper.handleConsentPopups(page, "Brave", consentSelectors);

    // Vérifier si CAPTCHA est présent et faire résoudre par l'utilisateur si nécessaire
    const captchaResolved = await utils.handleCaptcha(page, "Brave");
    if (captchaResolved) {
      console.log("✅ CAPTCHA résolu, reprise de la recherche Brave...");
      // Attendre un peu après avoir résolu le CAPTCHA
      await utils.randomDelay(2000, 4000);
    }

    console.log(`🖱️ Simulation de défilement pour paraître humain...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extraction des résultats Brave...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Sélecteurs mis à jour pour les résultats organiques de Brave
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

            // Si nous avons trouvé des résultats, arrêter la boucle
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

      // Vérifier si la page contient un message d'erreur ou "Aucun résultat trouvé"
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

    // Prendre une capture d'écran de diagnostic si aucun résultat n'est trouvé
    if (results.length === 0) {
      try {
        console.log("⚠️ Capture d'écran de diagnostic pour Brave Search...");
        await page.screenshot({ path: "brave-debug.png" });
        console.log("✅ Capture d'écran enregistrée dans brave-debug.png");
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
      return await searchHelper.handleNoResults(
        browser,
        query,
        "Brave",
        "https://search.brave.com/search?q="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "Brave",
      "https://search.brave.com/search?q="
    );
  } finally {
    if (browser) {
      await searchHelper.closeBrowser(browser);
    }
  }
}

module.exports = searchBrave;
