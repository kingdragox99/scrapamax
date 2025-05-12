const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

/**
 * Recherche sur Baidu avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchBaidu(query) {
  console.log(`\n🔍 Tentative de recherche Baidu pour: "${query}"`);
  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Baidu...");
    const page = await browser.newPage();

    // Masquer la signature Puppeteer/WebDriver
    await utils.setupBrowserAntiDetection(page);

    // Configurer un user agent aléatoire mais réaliste
    const userAgent = await utils.getUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer une taille d'écran aléatoire
    await utils.setupRandomScreenSize(page);

    console.log(`🌐 Navigation vers Baidu...`);
    // Naviguer vers Baidu avec timeout augmenté
    try {
      await page.goto(
        `https://www.baidu.com/s?ie=utf-8&wd=${encodeURIComponent(query)}`,
        {
          waitUntil: "domcontentloaded", // Utiliser domcontentloaded au lieu de networkidle2
          timeout: 60000, // Augmenter à 60 secondes
        }
      );
    } catch (navError) {
      console.warn(
        `⚠️ Problème lors de la navigation vers Baidu: ${navError.message}`
      );
      console.log("Tentative d'alternative avec une URL simplifiée...");

      // Tenter une approche alternative
      try {
        await page.goto(`https://www.baidu.com/`, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        // Attendre que la page se charge
        await utils.randomDelay(2000, 4000);

        // Saisir la recherche dans le champ
        await page.type("#kw", query);
        await page.click("#su");

        // Attendre que les résultats se chargent
        await page.waitForSelector(".result", { timeout: 30000 }).catch(() => {
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
        ".agree-btn",
        "#s-trust-closebtn",
        ".policy-btn",
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

    // Vérifier si un CAPTCHA est présent et le faire résoudre par l'utilisateur si nécessaire
    const captchaResolved = await utils.handleCaptcha(page, "Baidu");
    if (captchaResolved) {
      console.log("✅ CAPTCHA résolu, reprise de la recherche Baidu...");
      // Attendre un peu après la résolution du CAPTCHA
      await utils.randomDelay(2000, 4000);
    }

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extraction des résultats Baidu...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Sélecteurs pour les résultats de Baidu
      const resultElements = document.querySelectorAll(".c-container");

      resultElements.forEach((element) => {
        // Extraire le titre
        const titleElement = element.querySelector(".t a, h3.c-title a");
        if (!titleElement) return;

        const title = titleElement.textContent.trim();

        // Extraire l'URL
        let url = titleElement.getAttribute("href");
        // Baidu utilise parfois des redirections - essayer d'extraire la vraie URL
        const realUrlElement = element.querySelector(".c-showurl");
        if (realUrlElement) {
          const realUrl = realUrlElement.textContent.trim();
          if (realUrl && realUrl.startsWith("http")) {
            url = realUrl;
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
      console.warn("⚠️ Aucun résultat trouvé pour Baidu");
    }

    return results;
  } catch (error) {
    console.error("❌ Erreur lors de la recherche Baidu:", error);
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

module.exports = searchBaidu;
