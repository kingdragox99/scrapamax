const express = require("express");
const router = express.Router();
const db = require("../database");
const searchEngines = require("../services/searchEngines");
const scoring = require("../scoring");

// Route pour effectuer une recherche
router.post("/search", async (req, res) => {
  try {
    const {
      query,
      engines = [],
      region = "global",
      language = "auto",
    } = req.body;

    if (!query || query.trim() === "") {
      return res
        .status(400)
        .json({ error: "Le terme de recherche est requis" });
    }

    if (engines.length === 0) {
      return res
        .status(400)
        .json({ error: "Au moins un moteur de recherche est requis" });
    }

    // Sauvegarder la recherche dans la base de données avec les options
    const searchId = await db.saveSearch(query, {
      engines: engines.join(","),
      region,
      language,
    });

    // Effectuer la recherche uniquement sur les moteurs sélectionnés
    const searchResult = await searchEngines.searchAllEngines(query, {
      engines,
      region,
      language,
    });

    // Accéder à l'objet "results" qui contient les résultats par moteur
    const { results } = searchResult;

    // Sauvegarder les résultats dans la base de données
    for (const engine in results) {
      // Vérifier que results[engine] est un tableau valide et non vide
      if (Array.isArray(results[engine]) && results[engine].length > 0) {
        for (const result of results[engine]) {
          await db.saveResult(
            searchId,
            engine,
            result.title,
            result.url,
            result.description
          );
        }
      } else {
        console.log(`Pas de résultats valides pour le moteur: ${engine}`);
      }
    }

    // Appliquer le scoring aux résultats
    const scoredData = scoring.processSearchResults({
      searchId,
      query,
      results,
      searchOptions: {
        engines: engines.join(","),
        region,
        language,
      },
    });

    // Retourner les résultats avec l'ID de recherche et les scores
    return res.json(scoredData);
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la recherche" });
  }
});

// Route pour récupérer l'historique des recherches
router.get("/history", async (req, res) => {
  try {
    const history = await db.getSearchHistory();
    return res.json(history);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour récupérer les résultats d'une recherche spécifique
router.get("/results/:searchId", async (req, res) => {
  try {
    const { searchId } = req.params;

    if (!searchId) {
      return res.status(400).json({ error: "ID de recherche requis" });
    }

    const results = await db.getSearchResults(searchId);

    // Organiser les résultats par moteur de recherche
    const organizedResults = {};
    let searchQuery = "";

    results.forEach((result) => {
      searchQuery = result.query;
      if (!organizedResults[result.engine]) {
        organizedResults[result.engine] = [];
      }
      organizedResults[result.engine].push({
        title: result.title,
        url: result.url,
        description: result.description,
      });
    });

    // Appliquer le scoring aux résultats
    const scoredData = scoring.processSearchResults({
      searchId,
      query: searchQuery,
      results: organizedResults,
    });

    return res.json(scoredData);
  } catch (error) {
    console.error("Erreur lors de la récupération des résultats:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour supprimer une recherche et ses résultats
router.delete("/history/:searchId", async (req, res) => {
  try {
    const { searchId } = req.params;

    if (!searchId) {
      return res.status(400).json({ error: "ID de recherche requis" });
    }

    const rowsAffected = await db.deleteSearch(searchId);

    if (rowsAffected === 0) {
      return res.status(404).json({ error: "Recherche non trouvée" });
    }

    return res.json({
      success: true,
      message: "Recherche supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la recherche:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// Nouvelle route pour obtenir les traductions
router.get("/translations/:lang", (req, res) => {
  const lang = req.params.lang;
  let translations;

  try {
    // Charger les traductions demandées
    translations = require(`../locales/${lang}/translations`);
    res.json(translations);
  } catch (error) {
    // Si la langue demandée n'existe pas, renvoyer les traductions anglaises
    console.error(
      `Traductions non trouvées pour ${lang}, utilisation de l'anglais par défaut`
    );
    try {
      translations = require("../locales/en/translations");
      res.json(translations);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Erreur lors du chargement des traductions" });
    }
  }
});

module.exports = router;
