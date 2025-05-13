/**
 * Module d'aide pour les fonctions communes de recherche des moteurs
 */

const { getBrowser, setupRandomScreenSize } = require("./browserSetup");
const { setupBrowserAntiDetection } = require("./antiDetection");
const { getUserAgent } = require("./userAgents");
const { randomDelay } = require("./humanBehavior");
const { handleCaptcha } = require("./captchaHandler");

/**
 * Initialise le navigateur et la page pour une recherche
 * @param {string} engineName - Nom du moteur de recherche
 * @param {string} query - Requête à rechercher
 * @param {Object} options - Options de recherche
 * @returns {Promise<Object>} - Browser et page configurés
 */
async function initSearch(engineName, query, options = {}) {
  const { region = "global", language = "auto" } = options;
  console.log(`\n🔍 Tentative de recherche ${engineName} pour: "${query}"`);
  console.log(`📍 Région: ${region}, 🌐 Langue: ${language}`);

  const browser = await getBrowser();
  console.log(`📝 Configuration de la page ${engineName}...`);
  const page = await browser.newPage();

  // Configuration user-agent
  const userAgent = await getUserAgent(region, language);
  await page.setUserAgent(userAgent);
  console.log(`🔒 User-Agent configuré: ${userAgent.substring(0, 50)}...`);

  // Configuration anti-détection
  await setupBrowserAntiDetection(page);

  // Configuration taille d'écran aléatoire
  await setupRandomScreenSize(page);

  return { browser, page, region, language };
}

/**
 * Gère l'erreur de recherche et génère un résultat d'erreur
 * @param {Error} error - Erreur survenue
 * @param {string} query - Requête de recherche
 * @param {string} engineName - Nom du moteur de recherche
 * @param {string} engineUrl - URL de base du moteur
 * @returns {Array} - Résultat d'erreur formaté
 */
function handleSearchError(error, query, engineName, engineUrl) {
  console.error(`❌ Erreur durant la recherche ${engineName}:`, error.message);
  return [
    {
      title: `Erreur ${engineName}`,
      url: `${engineUrl}${encodeURIComponent(query)}`,
      description: `Erreur: ${error.message}. ${engineName} bloque probablement les requêtes automatisées.`,
    },
  ];
}

/**
 * Gère le cas où aucun résultat n'est trouvé
 * @param {Browser} browser - Instance du navigateur
 * @param {string} query - Requête de recherche
 * @param {string} engineName - Nom du moteur de recherche
 * @param {string} engineUrl - URL de base du moteur
 * @returns {Promise<Array>} - Résultat formaté pour aucun résultat
 */
async function handleNoResults(browser, query, engineName, engineUrl) {
  console.log(`⚠️ Aucun résultat trouvé pour ${engineName}`);
  await closeBrowser(browser);
  return [
    {
      title: `Aucun résultat ${engineName} pour "${query}"`,
      url: `${engineUrl}${encodeURIComponent(query)}`,
      description:
        "Le scraping a fonctionné mais n'a trouvé aucun résultat. Possible erreur dans les sélecteurs CSS ou structure HTML modifiée.",
    },
  ];
}

/**
 * Ferme proprement l'instance du navigateur
 * @param {Browser} browser - Instance du navigateur à fermer
 * @returns {Promise<void>}
 */
async function closeBrowser(browser) {
  if (browser) {
    try {
      await browser.close();
    } catch (e) {
      console.error("Erreur lors de la fermeture du navigateur:", e);
    }
  }
}

/**
 * Gère les popups de consentement courants
 * @param {Page} page - Instance de la page
 * @param {string} engineName - Nom du moteur de recherche
 * @param {Array} selectors - Sélecteurs pour les boutons de consentement
 * @returns {Promise<boolean>} - Vrai si un popup a été géré
 */
async function handleConsentPopups(page, engineName, selectors) {
  console.log(
    `🍪 Vérification des popups et bannières de consentement ${engineName}...`
  );
  try {
    for (const selector of selectors) {
      if (await page.$(selector)) {
        console.log(`🖱️ Popup détecté, clic sur ${selector}`);
        await page.click(selector);
        await page.waitForTimeout(1500);
        return true;
      }
    }
  } catch (e) {
    console.log("ℹ️ Aucun popup à fermer ou erreur:", e.message);
  }
  return false;
}

module.exports = {
  initSearch,
  handleSearchError,
  handleNoResults,
  closeBrowser,
  handleConsentPopups,
};
