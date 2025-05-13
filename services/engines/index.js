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
 * Unified search function across multiple engines
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @param {string|Array} options.engines - Engine(s) to use
 * @param {string} options.region - Region for search
 * @param {string} options.language - Language for search
 * @returns {Promise<Object>} Results from all specified engines
 */
async function search(query, options = {}) {
  const { engines = "all", region = "global", language = "auto" } = options;

  // Format options object for all engines
  const searchOptions = { region, language };

  console.log(`🔎 Recherche pour: "${query}"`);
  console.log(`🌍 Région: ${region}, 🌐 Langue: ${language}`);

  // Determine which engines to use
  const enginesList =
    engines === "all" || !engines
      ? ["google", "bing", "duckduckgo", "yandex", "ecosia", "brave", "baidu"]
      : Array.isArray(engines)
      ? engines.map((e) => e.toLowerCase())
      : [engines.toLowerCase()];

  console.log(`🔧 Moteurs utilisés: ${enginesList.join(", ")}`);

  // Prepare result object
  const results = {};

  // Function map for executing searches
  const engineFunctions = {
    google: async () => await searchGoogle(query, searchOptions),
    bing: async () => await searchBing(query, searchOptions),
    duckduckgo: async () => await searchDuckDuckGo(query, searchOptions),
    yandex: async () => await searchYandex(query, searchOptions),
    ecosia: async () => await searchEcosia(query, searchOptions),
    brave: async () => await searchBrave(query, searchOptions),
    baidu: async () => await searchBaidu(query, searchOptions),
  };

  // Execute searches in parallel
  await Promise.allSettled(
    enginesList.map(async (engine) => {
      if (!engineFunctions[engine]) {
        console.warn(`⚠️ Moteur de recherche inconnu: ${engine}`);
        results[engine] = [
          {
            title: `Erreur: moteur "${engine}" non supporté`,
            url: "#",
            description: `Le moteur de recherche "${engine}" n'est pas pris en charge.`,
          },
        ];
        return;
      }

      console.log(`🚀 Lancement de la recherche sur ${engine}...`);

      try {
        // Execute search for this engine
        const engineResults = await engineFunctions[engine]();
        results[engine] = engineResults;

        console.log(`✅ Terminé ${engine}: ${engineResults.length} résultats`);
      } catch (error) {
        console.error(`❌ Erreur avec ${engine}:`, error.message);
        results[engine] = [
          {
            title: `Erreur avec ${engine}`,
            url: "#",
            description: `Une erreur s'est produite: ${error.message}`,
          },
        ];
      }
    })
  );

  return results;
}

/**
 * Calcule les résultats uniques et leur attribue un score
 * @param {Object} results - Les résultats par moteur
 * @returns {Object} Résultats uniques avec scores
 */
function computeUniqueResults(results) {
  // Tableau pour stocker les résultats uniques
  const uniqueResults = [];
  // Map pour suivre les URLs déjà vues
  const urlMap = new Map();
  // Compter les moteurs disponibles
  const totalEngines = Object.keys(results).length;

  // Parcourir tous les moteurs et résultats
  for (const engine in results) {
    for (const result of results[engine]) {
      // Normaliser l'URL pour la comparaison
      const url = result.url.toLowerCase().trim();

      // Si cette URL existe déjà dans notre map
      if (urlMap.has(url)) {
        const index = urlMap.get(url);
        uniqueResults[index].engines.push(engine);
        uniqueResults[index].rawScore += 1;
        uniqueResults[index].score = Math.min(
          5.0,
          ((uniqueResults[index].rawScore / totalEngines) * 5.0).toFixed(1)
        );
      } else {
        // Nouvelle URL
        const scoreEntry = {
          ...result,
          engines: [engine],
          rawScore: 1,
          score: ((1.0 / totalEngines) * 5.0).toFixed(1), // Score entre 1.0 et 5.0
        };

        urlMap.set(url, uniqueResults.length);
        uniqueResults.push(scoreEntry);
      }
    }
  }

  // Trier les résultats par score (descendant)
  const scoredResults = [...uniqueResults].sort(
    (a, b) => b.rawScore - a.rawScore
  );

  return {
    scored: scoredResults,
    total: uniqueResults.length,
  };
}

module.exports = search;
