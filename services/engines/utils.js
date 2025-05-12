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
    ],
    ignoreHTTPSErrors: true,
  });

  console.log("✅ Navigateur initialisé avec succès");
  return browser;
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

module.exports = {
  getBrowser,
  randomDelay,
  getUserAgent,
  decodeDuckDuckGoUrl,
};
