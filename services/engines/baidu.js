const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Search on Baidu with Puppeteer
 * @param {string} query - Search term
 * @param {string} region - Region
 * @param {string} language - Language
 * @returns {Promise<Array>} Array of search results
 */
async function searchBaidu(query, region, language) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const { browser: initializedBrowser, page } = await searchHelper.initSearch(
      "Baidu",
      query,
      { region, language }
    );
    browser = initializedBrowser;

    console.log(`🌐 Navigation vers Baidu...`);
    // Navigation vers Baidu avec timeout augmenté
    try {
      await page.goto(
        `https://www.baidu.com/s?ie=utf-8&wd=${encodeURIComponent(query)}`,
        {
          waitUntil: "domcontentloaded", // Utiliser domcontentloaded au lieu de networkidle2
          timeout: 60000, // Augmenter à 60 secondes
        }
      );
    } catch (navError) {
      console.warn(`⚠️ Problème de navigation vers Baidu: ${navError.message}`);
      console.log("Tentative alternative avec URL simplifiée...");

      // Essayer une approche alternative
      try {
        await page.goto(`https://www.baidu.com/`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        // Attendre que la page se charge
        await utils.randomDelay(2000, 4000);

        // Entrer la recherche dans le champ
        await page.type("#kw", query);
        await page.click("#su");

        // Attendre que les résultats se chargent
        await page.waitForSelector(".result", { timeout: 30000 }).catch(() => {
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
    const consentSelectors = [".agree-btn", "#s-trust-closebtn", ".policy-btn"];
    await searchHelper.handleConsentPopups(page, "Baidu", consentSelectors);

    // Vérifier si CAPTCHA est présent et faire résoudre par l'utilisateur si nécessaire
    const captchaResolved = await utils.handleCaptcha(page, "Baidu");
    if (captchaResolved) {
      console.log("✅ CAPTCHA résolu, reprise de la recherche Baidu...");
      // Attendre un peu après avoir résolu le CAPTCHA
      await utils.randomDelay(2000, 4000);
    }

    console.log(`🖱️ Simulation de défilement pour paraître humain...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extraction des résultats Baidu...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Sélecteurs pour les résultats Baidu
      const resultElements = document.querySelectorAll(".c-container");

      resultElements.forEach((element) => {
        // Extraire le titre
        const titleElement = element.querySelector(".t a, h3.c-title a");
        if (!titleElement) return;

        const title = titleElement.textContent.trim();

        // Extraire l'URL
        let url = titleElement.getAttribute("href");

        // Tenter d'extraire l'URL réelle affichée
        const realUrlElement = element.querySelector(".c-showurl");
        if (realUrlElement) {
          const displayedUrl = realUrlElement.textContent.trim();
          if (displayedUrl && displayedUrl.startsWith("http")) {
            url = displayedUrl; // Utiliser l'URL affichée si elle semble être une URL valide
          }
        }

        // Extraire la description
        const descriptionElement = element.querySelector(".c-abstract");
        const description = descriptionElement
          ? descriptionElement.textContent.trim()
          : "";

        if (title && url) {
          searchResults.push({
            title,
            url: url.startsWith("http") ? url : "https://www.baidu.com" + url,
            description,
          });
        }
      });

      return searchResults;
    });

    console.log(
      `🏁 Extraction Baidu terminée, ${results.length} résultats trouvés`
    );

    if (results.length === 0) {
      return await searchHelper.handleNoResults(
        browser,
        query,
        "Baidu",
        "https://www.baidu.com/s?wd="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "Baidu",
      "https://www.baidu.com/s?wd="
    );
  } finally {
    if (browser) {
      await searchHelper.closeBrowser(browser);
    }
  }
}

module.exports = searchBaidu;
