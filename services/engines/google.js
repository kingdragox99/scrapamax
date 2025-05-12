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
        '[aria-modal="true"] button + button', // Nouvelle approche pour cibler le second bouton
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

    // Vérifier si un CAPTCHA est présent et le faire résoudre par l'utilisateur si nécessaire
    const captchaResolved = await utils.handleCaptcha(page, "Google");
    if (captchaResolved) {
      console.log("✅ CAPTCHA résolu, reprise de la recherche Google...");
      // Attendre un peu après la résolution du CAPTCHA
      await utils.randomDelay(2000, 4000);
    }

    console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
    // Utiliser la nouvelle fonction humanScroll au lieu du scrolling précédent
    await utils.humanScroll(page);

    await utils.randomDelay(2000, 3000);

    console.log(`🔍 Extraction des résultats Google...`);
    // Extraire les résultats avec une méthode plus directe qui fonctionne mieux sur Google
    const results = await page.evaluate(() => {
      console.log("Recherche des éléments dans la page Google...");

      const searchResults = [];

      // Nouveaux sélecteurs mis à jour pour la structure actuelle de Google
      const selectors = [
        // Structure principale actuelle de Google
        {
          container: "div.g, div[jscontroller]",
          title: "h3",
          link: "a",
          snippet: "div[data-snc], div.VwiC3b, div[data-sncf], div[style]",
        },
        // Autres dispositions possibles
        {
          container: ".MjjYud",
          title: "h3",
          link: "a[href]",
          snippet: "div[data-sncf], div.VwiC3b, div[style]",
        },
        // Résultats commerciaux et autres formats
        {
          container: "div[jscontroller][data-sokoban-feature]",
          title: "h3",
          link: "a[ping], a[data-ved]",
          snippet: "div[style], div[role='complementary'], div.a4bIc",
        },
        // Anciens sélecteurs pour compatibilité
        {
          container: "#search .g",
          title: "h3",
          link: "a",
          snippet: "div.VwiC3b",
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

            // Trouver le lien en priorisant celui proche du titre
            let linkElement = null;
            if (titleElement) {
              // Chercher d'abord dans le parent du titre
              const titleParent = titleElement.parentElement;
              if (titleParent) {
                linkElement =
                  titleParent.closest("a") ||
                  titleParent.querySelector("a[href]");
              }

              // Si toujours pas trouvé, chercher dans l'élément parent du conteneur
              if (!linkElement) {
                linkElement =
                  titleElement.closest("a") ||
                  element.querySelector(selector.link);
              }
            } else {
              // Pas de titre trouvé, chercher directement un lien
              linkElement = element.querySelector("a[href]");
            }

            // Chercher le snippet avec plusieurs sélecteurs possibles
            const snippetSelectors = Array.isArray(selector.snippet)
              ? selector.snippet
              : selector.snippet.split(", ");

            let snippetElement = null;

            for (const snippetSelector of snippetSelectors) {
              snippetElement = element.querySelector(snippetSelector);
              if (
                snippetElement &&
                snippetElement.textContent.trim().length > 10
              ) {
                break;
              }
            }

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

      // Méthode de secours si aucun résultat n'est trouvé
      if (searchResults.length === 0) {
        console.log("Utilisation de la méthode de secours pour Google");

        // Chercher tous les liens valides avec texte
        document
          .querySelectorAll('a[href^="http"]:not([href*="google.com/"])')
          .forEach((link) => {
            // Vérifier si le lien a un texte substantiel et ressemble à un titre
            if (link.textContent && link.textContent.trim().length > 15) {
              // Chercher un h3 proche, ou utiliser le texte du lien comme titre
              const nearH3 = link.querySelector("h3") || link.closest("h3");

              // Chercher un paragraphe ou div avec du texte à proximité pour la description
              let description = "Pas de description disponible";
              let parent = link.parentElement;

              // Remonter jusqu'à 3 niveaux pour trouver une description
              for (let i = 0; i < 3 && parent; i++) {
                const possibleDesc =
                  parent.querySelector("div:not(:has(a))") ||
                  parent.querySelector("span:not(:has(a))") ||
                  parent.querySelector("p");

                if (
                  possibleDesc &&
                  possibleDesc.textContent.trim().length > 20
                ) {
                  description = possibleDesc.textContent
                    .trim()
                    .replace(/\s+/g, " ");
                  break;
                }
                parent = parent.parentElement;
              }

              searchResults.push({
                title: nearH3
                  ? nearH3.textContent.trim()
                  : link.textContent.trim(),
                url: link.href,
                description: description,
              });
            }
          });
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
