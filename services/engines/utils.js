const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

/**
 * Obtient une instance du navigateur configurée pour éviter la détection
 * @returns {Promise<Browser>} Instance Puppeteer
 */
async function getBrowser() {
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
      "--lang=fr-FR,fr,en-US,en", // Spécifier la langue pour plus de cohérence
      "--disable-extensions", // Désactiver les extensions pour éviter les interférences
      "--mute-audio", // Couper le son
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: null, // Permettre au navigateur d'ajuster automatiquement la taille de la fenêtre
  });

  console.log("✅ Navigateur initialisé avec succès");
  return browser;
}

/**
 * Configure les protections anti-détection sur la page
 * @param {Page} page - L'instance de page Puppeteer
 * @returns {Promise<void>}
 */
async function setupBrowserAntiDetection(page) {
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
}

/**
 * Configure une taille d'écran aléatoire pour simuler un comportement humain
 * @param {Page} page - L'instance de page Puppeteer
 * @returns {Promise<void>}
 */
async function setupRandomScreenSize(page) {
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
}

/**
 * Génère une pause aléatoire pour simuler un comportement humain
 * @param {number} min - Délai minimum en ms
 * @param {number} max - Délai maximum en ms
 * @returns {Promise<void>}
 */
async function randomDelay(min = 1000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`⏱️ Pause aléatoire de ${delay}ms...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Retourne un user agent aléatoire parmi une liste de user agents modernes
 * @returns {Promise<string>} User agent
 */
async function getUserAgent() {
  // Définir plusieurs user agents statiques fiables et mis à jour 2023-2024
  const userAgents = [
    // Chrome sur Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    // Chrome sur Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    // Firefox sur Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
    // Firefox sur Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
    // Safari sur Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    // Chrome sur Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    // Edge sur Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
  ];

  // Sélectionner un user agent aléatoire dans la liste
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
}

/**
 * Nettoie les URLs de redirection de DuckDuckGo pour obtenir l'URL réelle
 * @param {string} url - URL potentiellement de redirection
 * @returns {string} URL décodée ou originale
 */
function decodeDuckDuckGoUrl(url) {
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
}

/**
 * Effectue un défilement aléatoire et naturel sur la page
 * @param {Page} page - L'instance de page Puppeteer
 * @returns {Promise<void>}
 */
async function humanScroll(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      // Paramètres de défilement aléatoires
      const totalScrolls = 3 + Math.floor(Math.random() * 5); // 3-7 défilements
      let currentScroll = 0;

      const scroll = () => {
        if (currentScroll >= totalScrolls) {
          resolve();
          return;
        }

        // Distance aléatoire de défilement (plus humain)
        const distance = 100 + Math.floor(Math.random() * 400);

        // Vitesse aléatoire de défilement
        const delay = 500 + Math.floor(Math.random() * 1000);

        window.scrollBy(0, distance);
        currentScroll++;

        // Petite chance de remonter légèrement (comme un humain)
        if (Math.random() > 0.7 && currentScroll > 1) {
          setTimeout(() => {
            window.scrollBy(0, -Math.floor(Math.random() * 100));
            setTimeout(scroll, delay);
          }, 300);
        } else {
          setTimeout(scroll, delay);
        }
      };

      scroll();
    });
  });

  // Pause après le défilement
  await randomDelay(1000, 2000);
}

module.exports = {
  getBrowser,
  randomDelay,
  getUserAgent,
  decodeDuckDuckGoUrl,
  humanScroll,
  setupBrowserAntiDetection,
  setupRandomScreenSize,
};
