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
 * Effectue une recherche sur les moteurs sélectionnés avec les options spécifiées
 * @param {string} query - Le terme de recherche
 * @param {Object} options - Options de recherche
 * @param {Array} options.engines - Liste des moteurs à utiliser
 * @param {string} options.region - Région pour la recherche (si supportée)
 * @param {string} options.language - Langue pour la recherche (si supportée)
 * @returns {Promise<Object>} Résultats de recherche organisés par moteur
 */
async function searchAllEngines(query, options = {}) {
  const {
    engines = [
      "google",
      "bing",
      "duckduckgo",
      "yandex",
      "ecosia",
      "brave",
      "baidu",
    ],
    region = "global",
    language = "auto",
  } = options;

  console.log(
    `\n🚀 Recherche lancée sur les moteurs sélectionnés pour: "${query}"`
  );
  console.log(`🌍 Région: ${region}, Langue: ${language}`);
  console.log(`🔍 Moteurs: ${engines.join(", ")}`);

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
      // Ne faire la recherche que si le moteur est dans la liste sélectionnée
      if (!engines.includes(engineName.toLowerCase())) {
        console.log(
          `⏭️ Moteur ${engineName} non sélectionné, recherche ignorée`
        );
        return [];
      }

      // Passer les options de région et langue à la fonction de recherche
      const searchOptions = { region, language };
      const results = await searchFn(query, searchOptions);
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
    // Préparer un tableau pour les promesses des moteurs sélectionnés
    const searchPromises = [];

    // Google
    if (engines.includes("google")) {
      searchPromises.push(safeSearch(searchGoogle, "Google"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Bing
    if (engines.includes("bing")) {
      searchPromises.push(safeSearch(searchBing, "Bing"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // DuckDuckGo
    if (engines.includes("duckduckgo")) {
      searchPromises.push(safeSearch(searchDuckDuckGo, "DuckDuckGo"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Yandex
    if (engines.includes("yandex")) {
      searchPromises.push(safeSearch(searchYandex, "Yandex"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Ecosia
    if (engines.includes("ecosia")) {
      searchPromises.push(safeSearch(searchEcosia, "Ecosia"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Brave
    if (engines.includes("brave")) {
      searchPromises.push(safeSearch(searchBrave, "Brave"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Baidu
    if (engines.includes("baidu")) {
      searchPromises.push(safeSearch(searchBaidu, "Baidu"));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Exécuter toutes les recherches en parallèle
    const [
      googleResults,
      bingResults,
      duckDuckGoResults,
      yandexResults,
      ecosiaResults,
      braveResults,
      baiduResults,
    ] = await Promise.all(searchPromises);

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
