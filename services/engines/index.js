/**
 * Module central qui importe tous les moteurs de recherche et expose une fonction de recherche unifiée
 */

const searchGoogle = require("./google");
const searchBing = require("./bing");
const searchDuckDuckGo = require("./duckduckgo");
const searchYandex = require("./yandex");
const searchEcosia = require("./ecosia");

/**
 * Effectue une recherche sur tous les moteurs disponibles
 * @param {string} query - Le terme de recherche
 * @returns {Promise<Object>} Résultats de recherche organisés par moteur
 */
async function searchAllEngines(query) {
  console.log(`\n🚀 Recherche lancée sur tous les moteurs pour: "${query}"`);
  try {
    // Exécuter toutes les recherches en parallèle
    const results = await Promise.all([
      searchGoogle(query),
      searchBing(query),
      searchDuckDuckGo(query),
      searchYandex(query),
      searchEcosia(query),
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
}

module.exports = { searchAllEngines };
