const express = require("express");
const router = express.Router();
const db = require("../database");
const searchEngines = require("../services/searchEngines");

// Route pour effectuer une recherche
router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res
        .status(400)
        .json({ error: "Le terme de recherche est requis" });
    }

    // Sauvegarder la recherche dans la base de données
    const searchId = await db.saveSearch(query);

    // Effectuer la recherche sur tous les moteurs
    const results = await searchEngines.searchAllEngines(query);

    // Sauvegarder les résultats dans la base de données
    for (const engine in results) {
      for (const result of results[engine]) {
        await db.saveResult(
          searchId,
          engine,
          result.title,
          result.url,
          result.description
        );
      }
    }

    // Retourner les résultats avec l'ID de recherche
    return res.json({
      searchId,
      query,
      results,
    });
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

    return res.json({
      searchId,
      query: searchQuery,
      results: organizedResults,
    });
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

module.exports = router;
