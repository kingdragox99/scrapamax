const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

/**
 * Recherche sur Google avec Puppeteer
 * @param {string} query - Le terme de recherche
 * @param {Object} options - Options de recherche
 * @param {string} options.region - Code de région pour la recherche
 * @param {string} options.language - Code de langue pour la recherche
 * @returns {Promise<Array>} Tableau des résultats de recherche
 */
async function searchGoogle(query, options = {}) {
  const { region = "global", language = "auto" } = options;

  console.log(`\n🔍 Tentative de recherche Google pour: "${query}"`);
  console.log(`📍 Région: ${region}, 🌐 Langue: ${language}`);

  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Configuration de la page Google...");
    const page = await browser.newPage();

    // Configurer un user agent aléatoire
    const userAgent = await utils.getUserAgent();
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

    // Configurer les paramètres de géolocalisation et langue
    await page.setExtraHTTPHeaders({
      "Accept-Language":
        language !== "auto"
          ? `${language},en-US;q=0.9,en;q=0.8`
          : "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    // Configuration de la taille d'écran aléatoire
    await utils.setupRandomScreenSize(page);

    // Configuration anti-détection
    await utils.setupBrowserAntiDetection(page);

    // Construire l'URL avec les paramètres de région et langue si spécifiés
    let googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}`;

    // Ajouter les paramètres de région si spécifiés et non globaux
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

    // Ajouter les paramètres de langue si spécifiés et non automatiques
    if (language && language !== "auto") {
      googleUrl += `&hl=${language}`;
    }

    console.log(`🌐 Navigation vers Google avec les paramètres régionaux...`);
    console.log(`🔗 URL: ${googleUrl}`);

    // Naviguer vers Google et attendre que la page se charge
    await page.goto(googleUrl, {
      waitUntil: "networkidle2",
    });

    console.log(`⏳ Attente après chargement de la page...`);
    // Petite pause pour éviter la détection
    await utils.randomDelay(2000, 4000);

    // Vérifier la présence d'un CAPTCHA
    const hasCaptcha = await utils.handleCaptcha(page, "Google");
    if (hasCaptcha) {
      console.log(`✅ CAPTCHA résolu, reprise de la recherche Google...`);
      await utils.randomDelay(2000, 3000);
    }

    console.log(`🍪 Vérification des popups et consentements...`);
    // Gérer les bannières de consentement
    try {
      // Vérifier s'il y a une bannière de consentement
      const consentSelectors = [
        "button.tHlp8d", // Bouton "J'accepte" sur la bannière de consentement
        "#L2AGLb", // Bouton "J'accepte" (nouvelle version)
        "[aria-label='Accepter tout']", // Bouton par aria-label
        "form:nth-child(2) > div > div > button", // Pattern communément utilisé
      ];

      for (const selector of consentSelectors) {
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

    console.log(`🔍 Vérification de la présence d'un CAPTCHA sur Google...`);
    await utils.handleCaptcha(page, "Google");

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    // Ajouter un scrolling aléatoire
    await utils.humanScroll(page);

    await utils.randomDelay(1000, 3000);

    console.log(`🔍 Extraction des résultats Google...`);
    // Extraire les résultats
    const results = await page.evaluate(() => {
      console.log("Recherche des éléments dans la page Google...");

      const searchResults = [];

      // Plusieurs sélecteurs pour s'adapter aux changements de Google
      const selectors = [
        // Structure 2024 mise à jour
        {
          container: "div.v7W49e > div > div.MjjYud",
          title: "h3.LC20lb",
          link: ".yuRUbf > a",
          snippet: ".VwiC3b",
        },
        // Structure 2024 alternative
        {
          container: "div.g",
          title: "h3.LC20lb",
          link: "div.yuRUbf > a",
          snippet: "div.VwiC3b",
        },
        // Structure pour les résultats enrichis
        {
          container: "div.N54PNb",
          title: "h3.LC20lb",
          link: "a",
          snippet: ".VwiC3b, .k8XOCe",
        },
        // Ancienne structure principale
        {
          container: ".g",
          title: "h3",
          link: "a",
          snippet: ".VwiC3b, .st",
        },
        // Autres structures de rechange
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

      // Utiliser la console pour déboguer
      const allH3 = document.querySelectorAll("h3");
      console.log(`Nombre total de h3 dans la page: ${allH3.length}`);

      document.querySelectorAll("div.g").forEach((el, i) => {
        console.log(
          `Contenu div.g #${i + 1}:`,
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
          "Aucun résultat trouvé avec les sélecteurs standard, essai de méthode alternative..."
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
          // Vérifier si ce lien a un titre h3 proche ou contient du texte significatif
          const parentDiv = link.closest("div");
          const nearestH3 = parentDiv ? parentDiv.querySelector("h3") : null;
          const title = nearestH3
            ? nearestH3.textContent.trim()
            : link.textContent.trim().length > 10
            ? link.textContent.trim()
            : null;

          if (title) {
            // Chercher du texte descriptif autour du lien
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
