const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");

/**
 * Search on Yandex with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchYandex(query, options = {}) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const {
      browser: initializedBrowser,
      page,
      region,
      language,
    } = await searchHelper.initSearch("Yandex", query, options);
    browser = initializedBrowser;

    // Créer l'URL Yandex spécifique à la région et langue (si fournies)
    let yandexUrl = `https://yandex.com/search/?text=${encodeURIComponent(
      query
    )}`;

    // Ajouter les paramètres de région si spécifiés
    // Yandex utilise 'lr' pour région et interface
    if (region && region !== "global") {
      const regionMapping = {
        ru: "213", // Moscou
        fr: "20430", // France
        us: "87", // États-Unis
        uk: "114", // Royaume-Uni
        de: "65", // Allemagne
        tr: "983", // Turquie
        ua: "143", // Ukraine
        by: "149", // Biélorussie
        kz: "159", // Kazakhstan
      };

      const regionCode = regionMapping[region];
      if (regionCode) {
        yandexUrl += `&lr=${regionCode}`;
      }
    }

    // Interface de langue
    if (language && language !== "auto") {
      // Yandex utilise 'lang' pour la langue d'interface
      yandexUrl += `&lang=${language}`;
    }

    console.log(`🌐 Navigation vers Yandex...`);
    await page.goto(yandexUrl, {
      waitUntil: "domcontentloaded",
      timeout: 40000,
    });

    console.log(`⏳ Attente après chargement de la page...`);
    await utils.randomDelay(1500, 3000);

    // Gestion des popups de consentement
    const consentSelectors = [
      ".button_view_primary", // Consentement nouveau design
      "button.desktopn-button.i-bem", // Consentement vieux design
      ".gdpr-popup button", // Popup GDPR
      "button[data-t='button:action']", // Autre bouton d'action
    ];
    await searchHelper.handleConsentPopups(page, "Yandex", consentSelectors);

    console.log(`🔍 Vérification pour CAPTCHA...`);
    const captchaResolved = await utils.handleCaptcha(page, "Yandex");
    if (captchaResolved) {
      console.log("✅ CAPTCHA résolu, reprise de la recherche Yandex...");
      await utils.randomDelay(2000, 3000);
    }

    console.log(`🖱️ Simulation de défilement pour paraître humain...`);
    await utils.humanScroll(page);
    await utils.randomDelay(1000, 2000);

    console.log(`🔍 Extraction des résultats Yandex...`);
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Sélecteurs pour les résultats organiques
      // Yandex utilise différentes structures selon la région et la langue
      const resultSelectors = [
        // Nouveau design Yandex (2023-2024)
        "li.serp-item",
        // Structure alternative récente
        ".organic",
        // Ancienne structure
        ".search-result__item",
      ];

      // Tester les différents sélecteurs
      let resultElements = [];
      for (const selector of resultSelectors) {
        resultElements = document.querySelectorAll(selector);
        if (resultElements.length > 0) {
          console.log(
            `Utilisation du sélecteur '${selector}' (${resultElements.length} résultats)`
          );
          break;
        }
      }

      resultElements.forEach((element, index) => {
        if (index < 20) {
          // Limiter aux 20 premiers résultats
          // Sélecteurs flexibles pour le titre et les URL
          const titleElement =
            element.querySelector(
              "h2 a, .OrganicTitle a, .organic__url, .organic__title, .organic__title-link a, .Typo a"
            ) ||
            element.querySelector("div[role='heading'] a") ||
            element.querySelector("a[target='_blank']");

          // Ne traiter que les éléments avec un titre
          if (titleElement) {
            // Extraire l'URL et le titre
            const url = titleElement.href;
            const title = titleElement.innerText.trim();

            // Sélecteurs possibles pour la description
            const snippetSelectors = [
              ".extended-text, .organic__content, .text-container, .serp-item__text",
              ".OrganicText, .organic__text, .extended-text",
            ];

            let description = "Pas de description disponible";
            for (const selector of snippetSelectors) {
              const snippetElement = element.querySelector(selector);
              if (snippetElement) {
                description = snippetElement.innerText
                  .trim()
                  .replace(/\s+/g, " ");
                break;
              }
            }

            // Vérifier si c'est un résultat valide
            if (
              url &&
              url.startsWith("http") &&
              !url.includes("yandex.") &&
              !url.includes("webmaster.yandex")
            ) {
              searchResults.push({
                title: title,
                url: url,
                description: description,
              });
            }
          }
        }
      });

      return searchResults;
    });

    console.log(
      `🏁 Extraction Yandex terminée, ${results.length} résultats trouvés`
    );
    await searchHelper.closeBrowser(browser);

    if (results.length === 0) {
      return await searchHelper.handleNoResults(
        browser,
        query,
        "Yandex",
        "https://yandex.com/search/?text="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "Yandex",
      "https://yandex.com/search/?text="
    );
  }
}

module.exports = searchYandex;
