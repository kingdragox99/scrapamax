/**
 * Module central qui importe tous les moteurs de recherche et expose une fonction de recherche unifiée
 */

const searchGoogle = require("./google");
const searchBing = require("./bing");
const searchDuckDuckGo = require("./duckduckgo");
const searchYandex = require("./yandex");
const searchEcosia = require("./ecosia");
const searchBrave = require("./brave");
const searchBaidu = require("./baidu");

/**
 * Effectue une recherche sur tous les moteurs disponibles
 * @param {string} query - Le terme de recherche
 * @returns {Promise<Object>} Résultats de recherche organisés par moteur
 */
async function searchAllEngines(query) {
  console.log(`\n🚀 Recherche lancée sur tous les moteurs pour: "${query}"`);

  // Initialiser les résultats vides pour chaque moteur
  const allResults = {
    google: [],
    bing: [],
    duckduckgo: [],
    yandex: [],
    ecosia: [],
    brave: [],
    baidu: [],
  };

  // Fonction pour exécuter une recherche avec gestion d'erreurs
  const safeSearch = async (searchFn, engineName) => {
    try {
      const results = await searchFn(query);
      return results || [];
    } catch (error) {
      console.error(
        `❌ Erreur lors de la recherche ${engineName}:`,
        error.message
      );
      return [];
    }
  };

  try {
    // Exécuter toutes les recherches en parallèle avec gestion d'erreurs
    const [
      googleResults,
      bingResults,
      duckDuckGoResults,
      yandexResults,
      ecosiaResults,
      braveResults,
      baiduResults,
    ] = await Promise.all([
      safeSearch(searchGoogle, "Google"),
      safeSearch(searchBing, "Bing"),
      safeSearch(searchDuckDuckGo, "DuckDuckGo"),
      safeSearch(searchYandex, "Yandex"),
      safeSearch(searchEcosia, "Ecosia"),
      safeSearch(searchBrave, "Brave"),
      safeSearch(searchBaidu, "Baidu"),
    ]);

    // Assigner les résultats
    allResults.google = googleResults;
    allResults.bing = bingResults;
    allResults.duckduckgo = duckDuckGoResults;
    allResults.yandex = yandexResults;
    allResults.ecosia = ecosiaResults;
    allResults.brave = braveResults;
    allResults.baidu = baiduResults;

    console.log(
      `\n📊 Résultats obtenus:\n` +
        `  - Google: ${googleResults.length} résultats\n` +
        `  - Bing: ${bingResults.length} résultats\n` +
        `  - DuckDuckGo: ${duckDuckGoResults.length} résultats\n` +
        `  - Yandex: ${yandexResults.length} résultats\n` +
        `  - Ecosia: ${ecosiaResults.length} résultats\n` +
        `  - Brave: ${braveResults.length} résultats\n` +
        `  - Baidu: ${baiduResults.length} résultats`
    );

    return allResults;
  } catch (error) {
    console.error(
      "❌ Erreur générale lors de la recherche sur tous les moteurs:",
      error.message
    );

    // En cas d'erreur générale, nous retournons quand même les résultats
    // partiels qui ont pu être obtenus
    return allResults;
  }
}

module.exports = { searchAllEngines };
