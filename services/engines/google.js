const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils/index");
const searchHelper = require("./utils/searchHelper");
const { randomDelay, humanScroll } = require("./utils/humanBehavior");
const { handleCaptcha } = require("./utils/captchaHandler");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Search on Google with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchGoogle(query, options = {}) {
  let browser;
  try {
    // Initialisation avec searchHelper
    const {
      browser: initializedBrowser,
      page,
      region,
      language,
    } = await searchHelper.initSearch("Google", query, options);
    browser = initializedBrowser;

    // Configuration geolocation et language pour Google
    await page.setExtraHTTPHeaders({
      "Accept-Language":
        language !== "auto"
          ? `${language},en-US;q=0.9,en;q=0.8`
          : "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    // Construction de l'URL avec paramètres régionaux
    let googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}`;

    // Ajout des paramètres de région si spécifiés et pas global
    if (region && region !== "global") {
      const regionMappings = {
        us: "US",
        fr: "FR",
        uk: "GB",
        de: "DE",
        es: "ES",
        it: "IT",
        ca: "CA",
        jp: "JP",
        br: "BR",
      };

      const countryCode = regionMappings[region] || region.toUpperCase();
      googleUrl += `&gl=${countryCode}`;
    }

    // Ajout des paramètres de langue si spécifiés et pas automatique
    if (language && language !== "auto") {
      googleUrl += `&hl=${language}`;
    }

    console.log(`🌐 Navigation vers Google avec paramètres régionaux...`);
    console.log(`🔗 URL: ${googleUrl}`);

    // Navigation vers Google et attente du chargement de la page
    await page.goto(googleUrl, {
      waitUntil: "networkidle2",
    });

    console.log(`⏳ Attente après chargement de la page...`);
    // Courte pause pour éviter la détection
    await randomDelay(2000, 4000);

    // Vérification des CAPTCHAs
    const hasCaptcha = await handleCaptcha(page, "Google");
    if (hasCaptcha) {
      console.log(`✅ CAPTCHA résolu, reprise de la recherche Google...`);
      await randomDelay(2000, 3000);
    }

    // Gestion des bannières de consentement
    const consentSelectors = [
      "button.tHlp8d", // Bouton "J'accepte" sur la bannière de consentement
      "#L2AGLb", // Bouton "J'accepte" (nouvelle version)
      "[aria-label='Accept all']", // Bouton par aria-label
      "form:nth-child(2) > div > div > button", // Pattern couramment utilisé
    ];
    await searchHelper.handleConsentPopups(page, "Google", consentSelectors);

    console.log(`🔍 Vérification des CAPTCHAs sur Google...`);
    await handleCaptcha(page, "Google");

    console.log(`🖱️ Simulation de défilement pour paraître humain...`);
    // Ajout de défilement aléatoire
    await humanScroll(page);

    await randomDelay(1000, 3000);

    console.log(`🔍 Extraction des résultats Google...`);
    // Extraction des résultats
    const results = await page.evaluate(() => {
      console.log("Recherche d'éléments dans la page Google...");

      const searchResults = [];

      // Sélecteurs multiples pour s'adapter aux changements de Google
      const selectors = [
        // Structure mise à jour 2024
        {
          container: "div.v7W49e > div > div.MjjYud",
          title: "h3.LC20lb",
          link: ".yuRUbf > a",
          snippet: ".VwiC3b",
        },
        // Structure alternative 2024
        {
          container: "div.g",
          title: "h3.LC20lb",
          link: "div.yuRUbf > a",
          snippet: "div.VwiC3b",
        },
        // Structure pour les résultats riches
        {
          container: "div.N54PNb",
          title: "h3.LC20lb",
          link: "a",
          snippet: ".VwiC3b, .k8XOCe",
        },
        // Structure principale ancienne
        {
          container: ".g",
          title: "h3",
          link: "a",
          snippet: ".VwiC3b, .st",
        },
        // Autres structures de secours
        {
          container: ".Gx5Zad",
          title: "h3",
          link: "a",
          snippet: ".lEBKkf, .s3v9rd, .yDYNvb",
        },
        {
          container: ".MjjYud",
          title: "h3",
          link: "a",
          snippet: "[data-sncf], [data-content-feature='1']",
        },
      ];

      // Utiliser console pour débogage
      const allH3 = document.querySelectorAll("h3");
      console.log(`Nombre total de h3 dans la page : ${allH3.length}`);

      document.querySelectorAll("div.g").forEach((el, i) => {
        console.log(
          `Contenu de div.g #${i + 1}:`,
          el.innerHTML.substring(0, 100) + "..."
        );
      });

      // Essayer chaque ensemble de sélecteurs
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector.container);

        if (elements.length > 0) {
          console.log(
            `Trouvé ${elements.length} résultats avec le sélecteur ${selector.container}`
          );

          elements.forEach((element) => {
            const titleElement = element.querySelector(selector.title);
            const linkElement = titleElement
              ? titleElement.closest("a") ||
                element.querySelector(selector.link)
              : element.querySelector(selector.link);
            const snippetElement = element.querySelector(selector.snippet);

            // Vérification des conditions pour un résultat valide
            if (
              titleElement &&
              linkElement &&
              linkElement.href &&
              linkElement.href.startsWith("http") &&
              !linkElement.href.includes("google.com/search") &&
              !linkElement.href.includes("accounts.google.com") &&
              !linkElement.href.includes("support.google.com")
            ) {
              // Nettoyage du texte du titre (peut contenir des éléments invisibles)
              const titleText = titleElement.textContent.trim();

              searchResults.push({
                title: titleText,
                url: linkElement.href,
                description: snippetElement
                  ? snippetElement.textContent.trim().replace(/\s+/g, " ")
                  : "Pas de description disponible",
              });
            }
          });
        }
      }

      // Si aucun résultat n'a été trouvé, essayer une méthode très générique
      if (searchResults.length === 0) {
        console.log(
          "Aucun résultat trouvé avec les sélecteurs standard, essai d'une méthode alternative..."
        );

        // Essayer une approche encore plus générique basée sur les liens
        const allLinks = Array.from(
          document.querySelectorAll('a[href^="http"]')
        ).filter((link) => {
          const href = link.href.toLowerCase();
          return (
            !href.includes("google.com") &&
            !href.includes("accounts.google") &&
            !href.includes("support.google") &&
            !href.includes("policies.google") &&
            !href.includes("maps.google")
          );
        });

        console.log(`Trouvé ${allLinks.length} liens avec URLs externes`);

        allLinks.forEach((link) => {
          // Vérifier si ce lien a un titre h3 à proximité ou contient du texte significatif
          const parentDiv = link.closest("div");
          const nearestH3 = parentDiv ? parentDiv.querySelector("h3") : null;
          const title = nearestH3
            ? nearestH3.textContent.trim()
            : link.textContent.trim().length > 10
            ? link.textContent.trim()
            : null;

          if (title) {
            // Rechercher du texte descriptif autour du lien
            let description = "";
            if (parentDiv) {
              // Essayer de trouver un paragraphe ou div contenant du texte
              const textNodes = Array.from(
                parentDiv.querySelectorAll("div, span, p")
              ).filter((el) => {
                const text = el.textContent.trim();
                return (
                  text.length > 30 && // Assez long pour être une description
                  !text.includes(title) && // Ne contient pas le titre (dupliqué)
                  !el.querySelector("h3")
                ); // Ne contient pas un h3
              });

              if (textNodes.length > 0) {
                description = textNodes[0].textContent
                  .trim()
                  .replace(/\s+/g, " ");
              }
            }

            searchResults.push({
              title: title,
              url: link.href,
              description: description || "Pas de description disponible",
            });
          }
        });
      }

      return searchResults.slice(0, 20); // Limiter à 20 résultats
    });

    console.log(
      `🏁 Extraction Google terminée, ${results.length} résultats trouvés`
    );
    await searchHelper.closeBrowser(browser);

    if (results.length === 0) {
      return await searchHelper.handleNoResults(
        browser,
        query,
        "Google",
        "https://www.google.com/search?q="
      );
    }

    return results;
  } catch (error) {
    return searchHelper.handleSearchError(
      error,
      query,
      "Google",
      "https://www.google.com/search?q="
    );
  }
}

module.exports = searchGoogle;
