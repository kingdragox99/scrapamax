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
 * Effectue une recherche sur plusieurs moteurs de recherche
 * @param {string} query - Le terme de recherche
 * @param {Object} options - Options de recherche
 * @param {Array<string>} options.engines - Liste des moteurs à utiliser
 * @param {string} options.region - Région de recherche (fr, us, etc.)
 * @param {string} options.language - Langue de recherche (fr, en, etc.)
 * @returns {Promise<Object>} Résultats de recherche par moteur
 */
async function search(query, options = {}) {
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
    `🚀 Recherche lancée sur les moteurs sélectionnés pour: "${query}"`
  );
  console.log(`🌍 Région: ${region}, Langue: ${language}`);
  console.log(`🔍 Moteurs: ${engines.join(", ")}`);

  // Résultats par moteur
  const results = {};

  // Créer un tableau de promesses pour chaque moteur
  const searchPromises = [];

  // Ajouter des promesses pour les moteurs sélectionnés
  if (engines.includes("google")) {
    searchPromises.push(
      searchGoogle(query, { region, language })
        .then((res) => {
          results.google = res;
        })
        .catch((error) => {
          console.error("❌ Erreur Google:", error.message);
          results.google = [
            {
              title: "Erreur Google",
              url: `https://www.google.com/search?q=${encodeURIComponent(
                query
              )}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  if (engines.includes("bing")) {
    searchPromises.push(
      searchBing(query, { region, language })
        .then((res) => {
          results.bing = res;
        })
        .catch((error) => {
          console.error("❌ Erreur Bing:", error.message);
          results.bing = [
            {
              title: "Erreur Bing",
              url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  if (engines.includes("duckduckgo")) {
    searchPromises.push(
      searchDuckDuckGo(query, region, language)
        .then((res) => {
          results.duckduckgo = res;
        })
        .catch((error) => {
          console.error("❌ Erreur DuckDuckGo:", error.message);
          results.duckduckgo = [
            {
              title: "Erreur DuckDuckGo",
              url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  if (engines.includes("yandex")) {
    searchPromises.push(
      searchYandex(query, { region, language })
        .then((res) => {
          results.yandex = res;
        })
        .catch((error) => {
          console.error("❌ Erreur Yandex:", error.message);
          results.yandex = [
            {
              title: "Erreur Yandex",
              url: `https://yandex.com/search/?text=${encodeURIComponent(
                query
              )}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  if (engines.includes("ecosia")) {
    searchPromises.push(
      searchEcosia(query, region, language)
        .then((res) => {
          results.ecosia = res;
        })
        .catch((error) => {
          console.error("❌ Erreur Ecosia:", error.message);
          results.ecosia = [
            {
              title: "Erreur Ecosia",
              url: `https://www.ecosia.org/search?q=${encodeURIComponent(
                query
              )}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  if (engines.includes("brave")) {
    searchPromises.push(
      searchBrave(query, region, language)
        .then((res) => {
          results.brave = res;
        })
        .catch((error) => {
          console.error("❌ Erreur Brave:", error.message);
          results.brave = [
            {
              title: "Erreur Brave",
              url: `https://search.brave.com/search?q=${encodeURIComponent(
                query
              )}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  if (engines.includes("baidu")) {
    searchPromises.push(
      searchBaidu(query, region, language)
        .then((res) => {
          results.baidu = res;
        })
        .catch((error) => {
          console.error("❌ Erreur Baidu:", error.message);
          results.baidu = [
            {
              title: "Erreur Baidu",
              url: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
              description: `Erreur: ${error.message}`,
            },
          ];
        })
    );
  }

  // Attendre que toutes les recherches se terminent
  await Promise.all(searchPromises);

  // Afficher un résumé des résultats obtenus
  console.log("📊 Résultats obtenus:");
  Object.keys(results).forEach((engine) => {
    console.log(
      `  - ${engine.charAt(0).toUpperCase() + engine.slice(1)}: ${
        results[engine].length
      } résultats`
    );
  });

  // Calculer le score de chaque URL en fonction du nombre de moteurs qui l'ont trouvée
  const uniqueResults = computeUniqueResults(results);

  return {
    query,
    results,
    scoredResults: uniqueResults.scored,
    totalUniqueResults: uniqueResults.total,
  };
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

module.exports = { search };
