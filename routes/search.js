const express = require("express");
const router = express.Router();
const db = require("../database");
const searchEngines = require("../services/searchEngines");
const scoring = require("../scoring");

// Route to perform a search
router.post("/search", async (req, res) => {
  try {
    const {
      query,
      engines = [],
      region = "global",
      language = "auto",
    } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Search term is required" });
    }

    if (engines.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one search engine is required" });
    }

    // Save the search in the database with options
    const searchId = await db.saveSearch(query, {
      engines: engines.join(","),
      region,
      language,
    });

    // Perform the search only on selected engines
    const results = await searchEngines.searchAllEngines(query, {
      engines,
      region,
      language,
    });

    if (!results) {
      console.error("Résultats de recherche non définis");
      return res.status(500).json({
        error: "Erreur de recherche",
        query,
        results: {},
      });
    }

    // Assurons-nous que les résultats sont au bon format
    const searchResult = {
      searchId,
      query,
      results, // results est maintenant directement l'objet renvoyé par searchAllEngines
      searchOptions: {
        engines: engines.join(","),
        region,
        language,
      },
    };

    // Save results in the database
    for (const engine in results) {
      // Check that results[engine] is a valid and non-empty array
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
        console.log(`No valid results for engine: ${engine}`);
      }
    }

    // Apply scoring to results
    const scoredData = scoring.processSearchResults(searchResult);

    // Return results with search ID and scores
    return res.json(scoredData);
  } catch (error) {
    console.error("Error during search:", error);
    return res.status(500).json({
      error: "Server error during search",
      query: req.body.query || "",
      results: {},
    });
  }
});

// Route to retrieve search history
router.get("/history", async (req, res) => {
  try {
    const history = await db.getSearchHistory();
    return res.json(history);
  } catch (error) {
    console.error("Error retrieving history:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Route to retrieve results for a specific search
router.get("/results/:searchId", async (req, res) => {
  try {
    const { searchId } = req.params;

    if (!searchId) {
      return res.status(400).json({ error: "Search ID required" });
    }

    const results = await db.getSearchResults(searchId);

    // Organize results by search engine
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

    // Apply scoring to results
    const scoredData = scoring.processSearchResults({
      searchId,
      query: searchQuery,
      results: organizedResults,
    });

    return res.json(scoredData);
  } catch (error) {
    console.error("Error retrieving results:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Route to delete a search and its results
router.delete("/history/:searchId", async (req, res) => {
  try {
    const { searchId } = req.params;

    if (!searchId) {
      return res.status(400).json({ error: "Search ID required" });
    }

    const rowsAffected = await db.deleteSearch(searchId);

    if (rowsAffected === 0) {
      return res.status(404).json({ error: "Search not found" });
    }

    return res.json({
      success: true,
      message: "Search successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting search:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// New route to get translations
router.get("/translations/:lang", (req, res) => {
  const lang = req.params.lang;
  let translations;

  try {
    // Load requested translations
    translations = require(`../locales/${lang}/translations`);
    res.json(translations);
  } catch (error) {
    // If requested language doesn't exist, return English translations
    console.error(
      `Translations not found for ${lang}, using English as default`
    );
    try {
      translations = require("../locales/en/translations");
      res.json(translations);
    } catch (err) {
      res.status(500).json({ error: "Error loading translations" });
    }
  }
});

module.exports = router;
