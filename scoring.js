/**
 * Module de scoring des résultats de recherche
 * Score de 1.0 à 5.0 basé sur la présence dans différents moteurs
 */

/**
 * Normalise une URL pour comparaison (supprime les paramètres de tracking, etc.)
 * @param {string} url - URL à normaliser
 * @returns {string} URL normalisée
 */
function normalizeUrl(url) {
  try {
    // Créer un objet URL pour manipuler facilement les composants
    const urlObj = new URL(url);

    // Suppression des paramètres de suivi courants
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "ref",
      "source",
      "referrer",
      "_ga",
    ];

    paramsToRemove.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    // Normaliser le hostname (supprimer www.)
    urlObj.hostname = urlObj.hostname.replace(/^www\./, "");

    // Retourner l'URL sans le hash fragment
    return `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
  } catch (e) {
    // En cas d'URL invalide, retourner l'original
    console.log(`Erreur lors de la normalisation de l'URL: ${e.message}`);
    return url;
  }
}

/**
 * Calcule le score d'un résultat en fonction de sa présence dans différents moteurs
 * @param {Object} allResults - Tous les résultats de recherche
 * @returns {Array} Résultats scorés et triés
 */
function scoreResults(allResults) {
  // Création d'une map pour stocker les résultats uniques par URL normalisée
  const resultMap = new Map();

  // Obtenir le nombre total de moteurs utilisés
  const totalEngines = Object.keys(allResults).length;

  // Parcourir tous les moteurs de recherche
  for (const engine in allResults) {
    const results = allResults[engine];

    // Parcourir les résultats du moteur actuel
    results.forEach((result) => {
      // Normaliser l'URL pour la comparaison
      const normalizedUrl = normalizeUrl(result.url);

      if (resultMap.has(normalizedUrl)) {
        // Si l'URL existe déjà, mettre à jour l'entrée existante
        const existingEntry = resultMap.get(normalizedUrl);

        // Vérifier si ce moteur est déjà dans la liste des moteurs
        if (!existingEntry.engines.includes(engine)) {
          existingEntry.engines.push(engine);
          // Ne mettre à jour le score que si c'est un nouveau moteur
          // Calculer le score en fonction du nombre de moteurs (sur 5)
          existingEntry.rawScore = existingEntry.engines.length;
          // Score basé directement sur le nombre de moteurs (sur 5)
          existingEntry.score = Math.min(5.0, existingEntry.engines.length);
          existingEntry.score = parseFloat(existingEntry.score.toFixed(1)); // Arrondir à 1 décimale
        }

        // Garder le titre et la description les plus longs
        if (result.title.length > existingEntry.title.length) {
          existingEntry.title = result.title;
        }
        if (result.description.length > existingEntry.description.length) {
          existingEntry.description = result.description;
        }
      } else {
        // Calculer le score initial (1.0 pour un seul moteur)
        // Créer une nouvelle entrée pour cette URL
        resultMap.set(normalizedUrl, {
          ...result,
          engines: [engine],
          normalizedUrl: normalizedUrl,
          rawScore: 1, // Score brut (nombre de moteurs)
          score: 1.0, // Score normalisé entre 1.0 et 5.0
        });
      }
    });
  }

  // Convertir la map en tableau et trier par score (décroissant)
  const scoredResults = Array.from(resultMap.values()).sort((a, b) => {
    // Trier d'abord par score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // En cas d'égalité, trier par ordre alphabétique du titre
    return a.title.localeCompare(b.title);
  });

  return scoredResults;
}

/**
 * Obtient les 3 principaux moteurs qui ont trouvé ce résultat (pour l'affichage)
 * @param {Array<string>} engines - Liste des moteurs ayant trouvé le résultat
 * @returns {Array<string>} Top 3 des moteurs (ou moins si moins de 3 moteurs)
 */
function getTopEngines(engines) {
  // Ordre de priorité des moteurs (pour l'affichage)
  const priority = {
    google: 1,
    bing: 2,
    duckduckgo: 3,
    yandex: 4,
    ecosia: 5,
  };

  // Trier les moteurs par priorité
  const sortedEngines = [...engines].sort((a, b) => {
    return (priority[a] || 99) - (priority[b] || 99);
  });

  // Retourner au maximum 3 moteurs
  return sortedEngines.slice(0, 3);
}

/**
 * Ajoute des informations de scoring à tous les résultats
 * @param {Object} searchData - L'objet de données de recherche complet
 * @returns {Object} Données de recherche avec scoring
 */
function processSearchResults(searchData) {
  // Vérifier que les données de recherche sont valides
  if (!searchData || !searchData.results) {
    return searchData;
  }

  // Calculer les scores des résultats
  const scoredResults = scoreResults(searchData.results);

  // Ajouter les résultats scorés à l'objet de recherche
  const enhancedData = {
    ...searchData,
    scoredResults: scoredResults,
    totalUniqueResults: scoredResults.length,
  };

  return enhancedData;
}

module.exports = {
  scoreResults,
  processSearchResults,
  getTopEngines,
  normalizeUrl,
};
