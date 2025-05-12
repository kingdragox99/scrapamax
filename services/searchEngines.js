const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

// Service pour faire des recherches sur différents moteurs de recherche
const searchEngines = {
  // Fonction utilitaire pour obtenir un browser Puppeteer configuré contre la détection
  async getBrowser() {
    console.log(
      "🚀 Initialisation du navigateur avec protection anti-détection..."
    );
    const browser = await puppeteer.launch({
      headless: "new", // Le nouveau mode headless est moins détectable
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-spki-list",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=site-per-process,TranslateUI",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      ignoreHTTPSErrors: true,
    });

    console.log("✅ Navigateur initialisé avec succès");
    return browser;
  },

  // Fonction utilitaire pour faire des pauses aléatoires (évite les modèles de comportement)
  async randomDelay(min = 1000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`⏱️ Pause aléatoire de ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  },

  // Corriger la fonction pour obtenir un user agent valide
  async getUserAgent() {
    // Définir plusieurs user agents statiques fiables au lieu d'utiliser random-useragent
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    ];

    // Sélectionner un user agent aléatoire dans la liste
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
  },

  // Fonction utilitaire pour nettoyer les URLs de DuckDuckGo
  decodeDuckDuckGoUrl(url) {
    // Vérifie si c'est une URL de redirection DuckDuckGo
    if (url && url.startsWith("https://duckduckgo.com/l/")) {
      try {
        // Extraire le paramètre uddg qui contient l'URL originale encodée
        const urlObj = new URL(url);
        const uddg = urlObj.searchParams.get("uddg");
        if (uddg) {
          // Décoder l'URL pour obtenir l'URL originale
          return decodeURIComponent(uddg);
        }
      } catch (e) {
        console.log(
          `⚠️ Erreur lors du décodage de l'URL DuckDuckGo: ${e.message}`
        );
      }
    }

    // Si ce n'est pas une URL de redirection ou s'il y a une erreur, retourner l'URL originale
    return url;
  },

  // Recherche sur Google avec Puppeteer
  async searchGoogle(query) {
    console.log(`\n🔍 Tentative de recherche Google pour: "${query}"`);
    let browser;
    try {
      browser = await this.getBrowser();
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
      const userAgent = await this.getUserAgent();
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
      // Naviguer vers Google et attendre que la page se charge
      await page.goto(
        `https://www.google.com/search?hl=fr&q=${encodeURIComponent(query)}`,
        {
          waitUntil: "networkidle2",
        }
      );

      console.log(`⏳ Attente après chargement de la page...`);
      // Petite pause pour éviter la détection
      await this.randomDelay(2000, 5000);

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
            await page.waitForTimeout(1500);
            break;
          }
        }
      } catch (e) {
        console.log("ℹ️ Pas de popup à fermer ou erreur:", e.message);
      }

      console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
      // Ajouter un scrolling aléatoire pour simuler un comportement humain
      await page.evaluate(() => {
        window.scrollBy(0, 100 + Math.random() * 400);
      });

      await this.randomDelay(1000, 2000);

      console.log(`🔍 Extraction des résultats...`);
      // Extraire les résultats - essayer différents sélecteurs car Google peut changer sa structure
      const results = await page.evaluate(() => {
        console.log("Recherche des éléments dans la page...");

        // Fonction pour extraire du texte avec sécurité
        const safeText = (element) => (element ? element.innerText.trim() : "");
        const safeHref = (element) =>
          element && element.href ? element.href : "";

        const searchResults = [];

        // Essayer différents sélecteurs (Google change souvent sa structure)
        const selectors = [
          {
            container: "#search .g",
            title: "h3",
            link: "a",
            snippet: ".VwiC3b",
          },
          { container: "#rso .g", title: "h3", link: "a", snippet: ".VwiC3b" },
          { container: ".MjjYud", title: "h3", link: "a", snippet: ".VwiC3b" },
          {
            container: "[data-hveid]",
            title: "h3",
            link: "a",
            snippet: "[data-sncf]",
          },
        ];

        // Essayer chaque jeu de sélecteurs
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector.container);
          if (elements.length > 0) {
            console.log(
              `Trouvé ${elements.length} éléments avec le sélecteur ${selector.container}`
            );

            elements.forEach((element, index) => {
              if (index < 10) {
                const titleElement = element.querySelector(selector.title);
                const linkElement = element.querySelector(selector.link);
                const snippetElement = element.querySelector(selector.snippet);

                if (titleElement && linkElement) {
                  searchResults.push({
                    title: safeText(titleElement),
                    url: safeHref(linkElement),
                    description:
                      safeText(snippetElement) ||
                      "Pas de description disponible",
                  });
                }
              }
            });

            // Si on a trouvé des résultats, on arrête d'essayer les autres sélecteurs
            if (searchResults.length > 0) {
              break;
            }
          }
        }

        // Si les sélecteurs standards ne fonctionnent pas, essayer une approche plus générale
        if (searchResults.length === 0) {
          console.log("Essai avec des sélecteurs génériques...");
          // Chercher tous les h3 qui ont un parent avec un lien
          const h3Elements = document.querySelectorAll("h3");
          h3Elements.forEach((h3) => {
            const parent = h3.closest("div");
            if (parent) {
              const link = parent.querySelector("a");
              const snippet = parent.querySelector("div > div");

              if (link && h3.textContent) {
                searchResults.push({
                  title: h3.textContent.trim(),
                  url: link.href,
                  description: snippet
                    ? snippet.textContent.trim()
                    : "Pas de description disponible",
                });
              }
            }
          });
        }

        return searchResults;
      });

      console.log(
        `🏁 Extraction terminée, ${results.length} résultats trouvés`
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
  },

  // Recherche sur Bing avec Puppeteer - celui-ci fonctionne bien donc peu de modifications
  async searchBing(query) {
    console.log(`\n🔍 Tentative de recherche Bing pour: "${query}"`);
    let browser;
    try {
      browser = await this.getBrowser();
      console.log("📝 Configuration de la page Bing...");
      const page = await browser.newPage();

      // Configurer un user agent aléatoire
      const userAgent = await this.getUserAgent();
      await page.setUserAgent(userAgent);
      console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

      // Configurer des comportements aléatoires
      await page.setViewport({
        width: 1366 + Math.floor(Math.random() * 100),
        height: 768 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      });

      console.log(`🌐 Navigation vers Bing...`);
      // Naviguer vers Bing et attendre que la page se charge
      await page.goto(
        `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        {
          waitUntil: "networkidle2",
        }
      );

      console.log(`⏳ Attente après chargement de la page...`);
      // Petite pause pour éviter la détection
      await this.randomDelay(2000, 4000);

      console.log(`🍪 Vérification des popups et consentements...`);
      // Gérer les bannières de consentement
      try {
        const selectors = [
          "#bnp_btn_accept",
          ".bnp_btn_accept",
          '[aria-label="Accept"]',
        ];

        for (const selector of selectors) {
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

      console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
      // Ajouter un scrolling aléatoire
      await page.evaluate(() => {
        window.scrollBy(0, 200 + Math.random() * 300);
      });

      await this.randomDelay(1000, 3000);

      console.log(`🔍 Extraction des résultats...`);
      // Extraire les résultats
      const results = await page.evaluate(() => {
        const searchResults = [];
        const resultElements = document.querySelectorAll(".b_algo");

        resultElements.forEach((element, index) => {
          if (index < 10) {
            const titleElement = element.querySelector("h2 a");
            const snippetElement = element.querySelector(".b_caption p");

            if (titleElement) {
              searchResults.push({
                title: titleElement.innerText,
                url: titleElement.href,
                description: snippetElement
                  ? snippetElement.innerText
                  : "Pas de description disponible",
              });
            }
          }
        });

        return searchResults;
      });

      console.log(
        `🏁 Extraction terminée, ${results.length} résultats trouvés`
      );
      await browser.close();

      if (results.length === 0) {
        console.log(`⚠️ Aucun résultat trouvé pour Bing`);
        return [
          {
            title: `Aucun résultat Bing pour "${query}"`,
            url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
            description:
              "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou Bing a changé sa structure HTML.",
          },
        ];
      }

      return results;
    } catch (error) {
      console.error(`❌ Erreur lors de la recherche Bing:`, error.message);
      if (browser) await browser.close();

      return [
        {
          title: "Erreur de recherche Bing",
          url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
          description: `Erreur lors du scraping: ${error.message}. Bing bloque probablement les requêtes automatisées.`,
        },
      ];
    }
  },

  // Recherche sur DuckDuckGo avec Puppeteer
  async searchDuckDuckGo(query) {
    console.log(`\n🔍 Tentative de recherche DuckDuckGo pour: "${query}"`);
    let browser;
    try {
      browser = await this.getBrowser();
      console.log("📝 Configuration de la page DuckDuckGo...");
      const page = await browser.newPage();

      // Configurer un user agent aléatoire
      const userAgent = await this.getUserAgent();
      await page.setUserAgent(userAgent);
      console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

      // Configurer des comportements aléatoires
      await page.setViewport({
        width: 1440 + Math.floor(Math.random() * 100),
        height: 900 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      });

      console.log(`🌐 Navigation vers DuckDuckGo...`);
      // Naviguer vers DuckDuckGo et attendre que la page se charge
      // Utiliser l'interface HTML qui est plus stable pour le scraping
      await page.goto(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        {
          waitUntil: "networkidle2",
        }
      );

      console.log(`⏳ Attente après chargement de la page...`);
      // Petite pause pour éviter la détection
      await this.randomDelay();

      console.log(`🔍 Extraction des résultats...`);
      // Extraire les résultats
      const results = await page.evaluate(() => {
        const searchResults = [];
        const resultElements = document.querySelectorAll(".result");

        resultElements.forEach((element, index) => {
          if (index < 10) {
            const titleElement = element.querySelector(".result__title a");
            const snippetElement = element.querySelector(".result__snippet");

            if (titleElement) {
              // Récupérer l'URL brute
              const rawUrl = titleElement.href;

              searchResults.push({
                title: titleElement.innerText,
                url: rawUrl, // L'URL sera nettoyée plus tard
                description: snippetElement
                  ? snippetElement.innerText
                  : "Pas de description disponible",
              });
            }
          }
        });

        return searchResults;
      });

      // Nettoyer les URLs de DuckDuckGo
      console.log(`🧹 Nettoyage des URLs de redirection DuckDuckGo...`);
      for (const result of results) {
        result.url = this.decodeDuckDuckGoUrl(result.url);
      }

      console.log(
        `🏁 Extraction terminée, ${results.length} résultats trouvés`
      );
      await browser.close();

      if (results.length === 0) {
        console.log(`⚠️ Aucun résultat trouvé pour DuckDuckGo`);
        return [
          {
            title: `Aucun résultat DuckDuckGo pour "${query}"`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            description:
              "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou DuckDuckGo a changé sa structure HTML.",
          },
        ];
      }

      return results;
    } catch (error) {
      console.error(
        `❌ Erreur lors de la recherche DuckDuckGo:`,
        error.message
      );
      if (browser) await browser.close();

      return [
        {
          title: "Erreur de recherche DuckDuckGo",
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          description: `Erreur lors du scraping: ${error.message}.`,
        },
      ];
    }
  },

  // Recherche sur Yandex avec Puppeteer
  async searchYandex(query) {
    console.log(`\n🔍 Tentative de recherche Yandex pour: "${query}"`);
    let browser;
    try {
      browser = await this.getBrowser();
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

      // Configurer un user agent aléatoire pour Yandex
      const userAgent = await this.getUserAgent();
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
      await this.randomDelay(3500, 6000);

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

      await this.randomDelay(3000, 5000);

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
              if (index < 10) {
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
              count < 10 &&
              link.textContent &&
              link.textContent.trim().length > 15
            ) {
              searchResults.push({
                title: link.textContent.trim(),
                url: link.href,
                description:
                  "Description non disponible, extraction de secours",
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
  },

  // Recherche sur Ecosia avec Puppeteer
  async searchEcosia(query) {
    console.log(`\n🔍 Tentative de recherche Ecosia pour: "${query}"`);
    let browser;
    try {
      browser = await this.getBrowser();
      console.log("📝 Configuration de la page Ecosia...");
      const page = await browser.newPage();

      // Masquer la signature Puppeteer/WebDriver
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });
        Object.defineProperty(navigator, "plugins", {
          get: () => [
            {
              0: { type: "application/x-google-chrome-pdf" },
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
              name: "Chrome PDF Plugin",
            },
          ],
        });
      });

      // Configurer un user agent aléatoire mais réaliste
      const userAgent = await this.getUserAgent();
      await page.setUserAgent(userAgent);
      console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

      // Configurer des comportements aléatoires
      await page.setViewport({
        width: 1500 + Math.floor(Math.random() * 100),
        height: 850 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
      });

      console.log(`🌐 Navigation vers Ecosia...`);
      // Naviguer vers Ecosia et attendre que la page se charge
      await page.goto(
        `https://www.ecosia.org/search?method=index&q=${encodeURIComponent(
          query
        )}`,
        {
          waitUntil: "networkidle2",
          timeout: 30000,
        }
      );

      console.log(`⏳ Attente après chargement de la page...`);
      // Petite pause pour éviter la détection
      await this.randomDelay(2000, 4000);

      console.log(`🍪 Vérification des popups et consentements...`);
      // Gérer les bannières de consentement
      try {
        const selectors = [
          "#accept",
          ".cookie-notice__accept",
          'button[data-test-id="consent-accept-button"]',
          "button.js-consent-accept",
        ];

        for (const selector of selectors) {
          if (await page.$(selector)) {
            console.log(`🖱️ Popup détecté, clique sur ${selector}`);
            await page.click(selector);
            await page.waitForTimeout(2000);
            break;
          }
        }
      } catch (e) {
        console.log("ℹ️ Pas de popup à fermer ou erreur:", e.message);
      }

      console.log(`🖱️ Simulation de scrolling pour paraître humain...`);
      // Ajouter un scrolling plus naturel
      await page.evaluate(() => {
        const maxScrolls = 4 + Math.floor(Math.random() * 3);
        let currentScroll = 0;

        const scrollDown = () => {
          if (currentScroll < maxScrolls) {
            window.scrollBy(0, 100 + Math.random() * 200);
            currentScroll++;
            setTimeout(scrollDown, 800 + Math.random() * 1200);
          }
        };

        scrollDown();
      });

      await this.randomDelay(2500, 4000);

      console.log(`🔍 Extraction des résultats Ecosia...`);
      // Extraire les résultats avec plusieurs tentatives de sélecteurs
      const results = await page.evaluate(() => {
        const searchResults = [];

        // Définir plusieurs jeux de sélecteurs car Ecosia change souvent
        const selectorSets = [
          {
            container: ".result",
            title: ".result-title",
            link: "a.js-result-url",
            snippet: ".result-snippet",
          },
          {
            container: ".result-container",
            title: "a.result-title",
            link: "a.result-url",
            snippet: ".result-snippet",
          },
          {
            container: ".js-result",
            title: "a.result-title",
            link: "a",
            snippet: ".snippet",
          },
          {
            container: "[data-test-id='search-result']",
            title: "a",
            link: "a",
            snippet: "p",
          },
        ];

        // Essayer chaque jeu de sélecteurs
        for (const selectors of selectorSets) {
          const elements = document.querySelectorAll(selectors.container);
          console.log(
            `Essai avec ${selectors.container}: ${elements.length} éléments trouvés`
          );

          if (elements.length > 0) {
            elements.forEach((element, index) => {
              if (index < 10) {
                const titleElement = element.querySelector(selectors.title);
                const linkElement =
                  element.querySelector(selectors.link) || titleElement;
                const snippetElement = element.querySelector(selectors.snippet);

                if (titleElement && linkElement) {
                  searchResults.push({
                    title: titleElement.innerText.trim(),
                    url: linkElement.href,
                    description: snippetElement
                      ? snippetElement.innerText.trim()
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

        // Approche de secours si les sélecteurs spécifiques ne fonctionnent pas
        if (searchResults.length === 0) {
          console.log("Essai avec une méthode de secours générique");
          const allLinks = document.querySelectorAll(
            'main a[href^="http"]:not([href*="ecosia.org"])'
          );

          allLinks.forEach((link, index) => {
            if (
              index < 10 &&
              link.textContent &&
              link.textContent.trim().length > 10
            ) {
              // Trouver un élément texte à proximité qui pourrait être une description
              let description = "Pas de description disponible";
              const parent = link.closest("div");
              if (parent) {
                const possibleDescription = parent.querySelector("p");
                if (possibleDescription) {
                  description = possibleDescription.innerText.trim();
                }
              }

              searchResults.push({
                title: link.textContent.trim(),
                url: link.href,
                description,
              });
            }
          });
        }

        return searchResults;
      });

      console.log(
        `🏁 Extraction Ecosia terminée, ${results.length} résultats trouvés`
      );
      await browser.close();

      if (results.length === 0) {
        console.log(`⚠️ Aucun résultat trouvé pour Ecosia`);
        return [
          {
            title: `Aucun résultat Ecosia pour "${query}"`,
            url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
            description:
              "Le scraping a fonctionné mais n'a trouvé aucun résultat. Peut-être une erreur dans les sélecteurs CSS ou Ecosia a changé sa structure HTML.",
          },
        ];
      }

      return results;
    } catch (error) {
      console.error(`❌ Erreur lors de la recherche Ecosia:`, error.message);
      if (browser) await browser.close();

      return [
        {
          title: "Erreur de recherche Ecosia",
          url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
          description: `Erreur lors du scraping: ${error.message}. Ecosia bloque probablement les requêtes automatisées.`,
        },
      ];
    }
  },

  // Recherche sur tous les moteurs disponibles
  async searchAllEngines(query) {
    console.log(`\n🚀 Recherche lancée sur tous les moteurs pour: "${query}"`);
    try {
      // Exécuter toutes les recherches en parallèle
      const results = await Promise.all([
        this.searchGoogle(query),
        this.searchBing(query),
        this.searchDuckDuckGo(query),
        this.searchYandex(query),
        this.searchEcosia(query),
      ]);

      const [
        googleResults,
        bingResults,
        duckDuckGoResults,
        yandexResults,
        ecosiaResults,
      ] = results;

      console.log(
        `\n📊 Résultats obtenus:\n` +
          `  - Google: ${googleResults.length} résultats\n` +
          `  - Bing: ${bingResults.length} résultats\n` +
          `  - DuckDuckGo: ${duckDuckGoResults.length} résultats\n` +
          `  - Yandex: ${yandexResults.length} résultats\n` +
          `  - Ecosia: ${ecosiaResults.length} résultats`
      );

      return {
        google: googleResults,
        bing: bingResults,
        duckduckgo: duckDuckGoResults,
        yandex: yandexResults,
        ecosia: ecosiaResults,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la recherche sur tous les moteurs:",
        error
      );
      return {
        google: [
          {
            title: "Erreur générale",
            url: "#",
            description:
              "Une erreur est survenue lors de la recherche multi-moteurs.",
          },
        ],
        bing: [],
        duckduckgo: [],
        yandex: [],
        ecosia: [],
      };
    }
  },
};

module.exports = searchEngines;
