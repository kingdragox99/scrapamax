document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const searchForm = document.getElementById("search-form");
  const queryInput = document.getElementById("query");
  const searchButton = document.getElementById("search-button");
  const loadingIndicator = document.getElementById("loading");
  const resultsContainer = document.getElementById("results-container");
  const historyContainer = document.getElementById("history-container");
  const searchTermDisplay = document.getElementById("search-term");
  const resultsList = document.getElementById("results-list");
  const historyList = document.getElementById("history-list");
  const tabButtons = document.querySelectorAll(".tab-button");
  const mainTabButtons = document.querySelectorAll(".main-tab-button");

  // Elements for advanced search options
  const advancedSearchButton = document.getElementById(
    "advanced-search-button"
  );
  const advancedSearchModal = document.getElementById("advanced-search-modal");
  const closeModalButton = document.querySelector(".close-modal");
  const applyAdvancedOptionsButton = document.getElementById(
    "apply-advanced-options"
  );
  const selectAllEnginesButton = document.getElementById("select-all-engines");
  const deselectAllEnginesButton = document.getElementById(
    "deselect-all-engines"
  );
  const engineCheckboxes = document.querySelectorAll('input[name="engines"]');
  const regionSelect = document.getElementById("region");
  const languageSelect = document.getElementById("search-language");

  // Show/Hide the advanced search options modal
  if (advancedSearchButton) {
    advancedSearchButton.addEventListener("click", () => {
      advancedSearchModal.style.display = "block";
    });
  }

  // Close modal when clicking on X
  if (closeModalButton) {
    closeModalButton.addEventListener("click", () => {
      advancedSearchModal.style.display = "none";
    });
  }

  // Close modal when clicking outside its content
  window.addEventListener("click", (event) => {
    if (event.target === advancedSearchModal) {
      advancedSearchModal.style.display = "none";
    }
  });

  // Apply options and close the modal
  if (applyAdvancedOptionsButton) {
    applyAdvancedOptionsButton.addEventListener("click", () => {
      advancedSearchModal.style.display = "none";
    });
  }

  // Select all engines
  selectAllEnginesButton.addEventListener("click", () => {
    engineCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
    });
  });

  // Deselect all engines
  deselectAllEnginesButton.addEventListener("click", () => {
    engineCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  });

  // Main tabs management
  mainTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active tab
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show corresponding content
      const tabName = button.dataset.tab;
      document.querySelectorAll("[data-tab-content]").forEach((content) => {
        content.classList.remove("active");
      });

      const targetContent = document.querySelector(
        `[data-tab-content="${tabName}"]`
      );
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // Initialization: activate the history tab by default
  document
    .querySelector('[data-tab-content="history"]')
    .classList.add("active");

  // Load search history when page loads
  loadSearchHistory();

  // Handler for the search form
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();

    if (!query) {
      alert(
        window.t
          ? window.t("searchPlaceholder")
          : "Veuillez entrer un terme de recherche"
      );
      return;
    }

    // Check that at least one engine is selected
    const selectedEngines = Array.from(engineCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    if (selectedEngines.length === 0) {
      alert(
        window.t
          ? window.t("selectAtLeastOneEngine")
          : "Veuillez sélectionner au moins un moteur de recherche"
      );
      return;
    }

    // Get region and language options
    const region = regionSelect.value;
    const language = languageSelect.value;

    // Show loading indicator
    loadingIndicator.classList.remove("hidden");
    searchButton.disabled = true;
    resultsContainer.classList.add("hidden");

    try {
      // Send request to server with advanced options
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          engines: selectedEngines,
          region,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(
          window.t ? window.t("error") : "Erreur lors de la recherche"
        );
      }

      const data = await response.json();

      // Display results
      displayResults(data);

      // Switch to results tab
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      document.querySelector('[data-tab="results"]').classList.add("active");
      document.querySelectorAll("[data-tab-content]").forEach((content) => {
        content.classList.remove("active");
      });
      resultsContainer.classList.add("active");

      // Refresh search history
      loadSearchHistory();
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        window.t
          ? window.t("error")
          : "Une erreur est survenue lors de la recherche"
      );
    } finally {
      // Hide loading indicator
      loadingIndicator.classList.add("hidden");
      searchButton.disabled = false;
    }
  });

  // Handler for search engine tabs
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active tab
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Filter results by search engine
      const engine = button.dataset.engine;
      filterResultsByEngine(engine);
    });
  });

  // Function to display search results
  function displayResults(data) {
    // Update interface
    searchTermDisplay.textContent = data.query;
    resultsContainer.classList.remove("hidden");
    resultsList.innerHTML = "";

    // Store engines used for this search
    window.allSearchEngines = data.results;

    // Use scored results if available, otherwise use results by engine
    const hasResults = data.scoredResults
      ? data.scoredResults.length > 0
      : Object.values(data.results).some(
          (engineResults) => engineResults.length > 0
        );

    if (!hasResults) {
      resultsList.innerHTML = `<p class="no-results">${
        window.t
          ? window.t("noResults")
          : "Aucun résultat trouvé pour cette recherche."
      }</p>`;
      return;
    }

    // Display scored results if available
    if (data.scoredResults && data.scoredResults.length > 0) {
      // Create element for total unique results
      const totalResultsInfo = document.createElement("div");
      totalResultsInfo.className = "total-results-info";
      totalResultsInfo.textContent = window.t
        ? `${data.totalUniqueResults} ${window.t("uniqueResults")}`
        : `${data.totalUniqueResults} résultats uniques trouvés`;
      resultsList.appendChild(totalResultsInfo);

      // Display all scored results
      data.scoredResults.forEach((result) => {
        const resultItem = createScoredResultItem(result);
        resultsList.appendChild(resultItem);
      });
    } else {
      // Old display (by engine) if scoredResults is not available
      for (const engine in data.results) {
        data.results[engine].forEach((result) => {
          const resultItem = createResultItem(result, engine);
          resultsList.appendChild(resultItem);
        });
      }
    }

    // Reset active tab
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    document.querySelector('[data-engine="all"]').classList.add("active");

    // Update engine tabs to show only used engines
    updateEnginesTabs(Object.keys(data.results));
  }

  // Function to update engine tabs based on used engines
  function updateEnginesTabs(usedEngines) {
    tabButtons.forEach((button) => {
      const engine = button.dataset.engine;
      if (engine === "all") return; // Always show "All" tab

      if (usedEngines.includes(engine)) {
        button.style.display = "block";
      } else {
        button.style.display = "none";
      }
    });
  }

  // Function to create a scored result item
  function createScoredResultItem(result) {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item scored-result";
    resultItem.dataset.engines = result.engines.join(",");

    // Create score badge with tooltip
    const scoreLabel = document.createElement("div");
    scoreLabel.className = "result-score";
    scoreLabel.title = window.t
      ? `${window.t("scoreTooltip")} - ${result.rawScore}/${
          Object.keys(window.allSearchEngines).length
        } engines`
      : `Score de 1.0 a 5.0 - ${result.rawScore}/${
          Object.keys(window.allSearchEngines).length
        } moteurs`;

    // Determine score class based on value (1.0 to 5.0)
    let scoreClass = "";
    if (result.score >= 4.0) {
      scoreClass = "score-high"; // 4.0-5.0
    } else if (result.score >= 2.0) {
      scoreClass = "score-medium"; // 2.0-3.9
    } else {
      scoreClass = "score-low"; // 1.0-1.9
    }

    scoreLabel.classList.add(scoreClass);
    scoreLabel.textContent = `${result.score}`;

    // Display engines that found this result
    const enginesLabel = document.createElement("div");
    enginesLabel.className = "result-engines";

    // Display number of engines that found this result (max 5)
    const enginesCount = document.createElement("span");
    enginesCount.className = "engines-count";

    // Get total number of available engines
    const totalEnginesCount = Object.keys(
      window.allSearchEngines || {
        google: true,
        bing: true,
        duckduckgo: true,
        yandex: true,
        ecosia: true,
      }
    ).length;

    // Limit display to total number of engines
    enginesCount.textContent = `${Math.min(
      result.rawScore,
      totalEnginesCount
    )}/${totalEnginesCount}`;
    enginesLabel.appendChild(enginesCount);

    // Deduplicate engines before creating badges
    const uniqueEngines = [...new Set(result.engines)];

    uniqueEngines.forEach((engine) => {
      const engineBadge = document.createElement("span");
      engineBadge.className = `engine-badge engine-${engine}`;
      engineBadge.textContent =
        engine.charAt(0).toUpperCase() + engine.slice(1);
      enginesLabel.appendChild(engineBadge);
    });

    const title = document.createElement("h3");
    title.textContent = result.title;

    const url = document.createElement("a");
    url.href = result.url;
    url.className = "result-url";
    url.textContent = result.url;
    url.target = "_blank";
    url.rel = "noopener noreferrer";

    const description = document.createElement("p");
    description.className = "result-description";
    description.textContent = result.description;

    // Add a "Visit" button
    const visitButton = document.createElement("a");
    visitButton.href = result.url;
    visitButton.className = "visit-button";
    visitButton.textContent = window.t ? window.t("visitLink") : "Visiter";
    visitButton.target = "_blank";
    visitButton.rel = "noopener noreferrer";

    // Wrapper for score and engines
    const metaInfoWrapper = document.createElement("div");
    metaInfoWrapper.className = "result-meta-info";
    metaInfoWrapper.appendChild(scoreLabel);
    metaInfoWrapper.appendChild(enginesLabel);

    resultItem.appendChild(metaInfoWrapper);
    resultItem.appendChild(title);
    resultItem.appendChild(url);
    resultItem.appendChild(description);
    resultItem.appendChild(visitButton);

    return resultItem;
  }

  // Function to create a result item (old version)
  function createResultItem(result, engine) {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    resultItem.dataset.engine = engine;

    const engineLabel = document.createElement("span");
    engineLabel.className = "result-engine";
    engineLabel.textContent = window.t
      ? window.t(engine)
      : engine.charAt(0).toUpperCase() + engine.slice(1);

    const title = document.createElement("h3");
    title.textContent = result.title;

    const url = document.createElement("a");
    url.href = result.url;
    url.className = "result-url";
    url.textContent = result.url;
    url.target = "_blank";
    url.rel = "noopener noreferrer";

    const description = document.createElement("p");
    description.className = "result-description";
    description.textContent = result.description;

    // Add a "Visit" button
    const visitButton = document.createElement("a");
    visitButton.href = result.url;
    visitButton.className = "visit-button";
    visitButton.textContent = window.t ? window.t("visitLink") : "Visiter";
    visitButton.target = "_blank";
    visitButton.rel = "noopener noreferrer";

    resultItem.appendChild(engineLabel);
    resultItem.appendChild(title);
    resultItem.appendChild(url);
    resultItem.appendChild(description);
    resultItem.appendChild(visitButton);

    return resultItem;
  }

  // Function to filter results by search engine
  function filterResultsByEngine(engine) {
    // "All" tab shows all results
    if (engine === "all") {
      document.querySelectorAll(".result-item").forEach((item) => {
        item.style.display = "block";
      });
      return;
    }

    // Logic for scored results
    const scoredResults = document.querySelectorAll(".scored-result");
    if (scoredResults.length > 0) {
      scoredResults.forEach((item) => {
        const engines = item.dataset.engines.split(",");
        if (engines.includes(engine)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
      return;
    }

    // Old filtering by data-engine attribute for unscored results
    document.querySelectorAll(".result-item").forEach((item) => {
      if (item.dataset.engine === engine) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Function to load search history
  async function loadSearchHistory() {
    try {
      const response = await fetch("/api/history");

      if (!response.ok) {
        throw new Error(
          window.t
            ? window.t("error")
            : "Erreur lors du chargement de l'historique"
        );
      }

      const data = await response.json();

      // Update interface
      historyList.innerHTML = "";

      if (data.length === 0) {
        historyList.innerHTML = `<p>${
          window.t ? window.t("noHistory") : "Aucune recherche effectuée."
        }</p>`;
        return;
      }

      data.forEach((search) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";
        historyItem.dataset.searchId = search.id;

        const queryInfo = document.createElement("div");

        const query = document.createElement("span");
        query.className = "history-query";
        query.textContent = search.query;

        const date = document.createElement("span");
        date.className = "history-date";
        date.textContent = new Date(search.date).toLocaleString();

        queryInfo.appendChild(query);
        queryInfo.appendChild(document.createElement("br"));
        queryInfo.appendChild(date);

        const resultInfo = document.createElement("div");

        const count = document.createElement("span");
        count.className = "history-count";
        // Translate result count message
        const resultCountText = window.t
          ? `${search.resultCount} ${window.t("resultsLabel")}`
          : `${search.resultCount} résultats`;
        count.textContent = resultCountText;

        const actionButtons = document.createElement("div");
        actionButtons.className = "history-actions";

        const viewButton = document.createElement("button");
        viewButton.className = "view-results";
        viewButton.textContent = window.t ? window.t("view") : "Voir";
        viewButton.addEventListener("click", () => loadResults(search.id));

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-search";
        deleteButton.textContent = window.t ? window.t("delete") : "Supprimer";
        deleteButton.addEventListener("click", () => deleteSearch(search.id));

        actionButtons.appendChild(viewButton);
        actionButtons.appendChild(deleteButton);

        resultInfo.appendChild(count);
        resultInfo.appendChild(document.createElement("br"));
        resultInfo.appendChild(actionButtons);

        historyItem.appendChild(queryInfo);
        historyItem.appendChild(resultInfo);

        historyList.appendChild(historyItem);
      });
    } catch (error) {
      console.error("Erreur:", error);
      historyList.innerHTML = `<p>${
        window.t
          ? window.t("error")
          : "Erreur lors du chargement de l'historique."
      }</p>`;
    }
  }

  // Function to load results from a specific search in history
  async function loadResults(searchId) {
    // Show loading indicator
    loadingIndicator.classList.remove("hidden");
    resultsContainer.classList.add("hidden");

    try {
      const response = await fetch(`/api/results/${searchId}`);

      if (!response.ok) {
        throw new Error(
          window.t
            ? window.t("error")
            : "Erreur lors du chargement des résultats"
        );
      }

      const data = await response.json();

      // Display results
      displayResults(data);

      // Switch to results tab
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      document.querySelector('[data-tab="results"]').classList.add("active");
      document.querySelectorAll("[data-tab-content]").forEach((content) => {
        content.classList.remove("active");
      });
      resultsContainer.classList.add("active");
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        window.t
          ? window.t("error")
          : "Une erreur est survenue lors du chargement des résultats"
      );
    } finally {
      // Hide loading indicator
      loadingIndicator.classList.add("hidden");
    }
  }

  // Function to delete a search from history
  async function deleteSearch(searchId) {
    const confirmMessage = window.t
      ? window.t("confirmDelete")
      : "Êtes-vous sûr de vouloir supprimer cette recherche ?";
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${searchId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          window.t ? window.t("error") : "Erreur lors de la suppression"
        );
      }

      // Visual deletion effect
      const historyItem = document.querySelector(
        `.history-item[data-search-id="${searchId}"]`
      );
      if (historyItem) {
        historyItem.classList.add("fade-out");
        // Remove element after animation
        setTimeout(() => {
          historyItem.remove();

          // Check if there are any searches left
          if (historyList.querySelectorAll(".history-item").length === 0) {
            historyList.innerHTML = `<p>${
              window.t ? window.t("noHistory") : "Aucune recherche effectuée."
            }</p>`;
          }
        }, 500);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        window.t
          ? window.t("error")
          : "Une erreur est survenue lors de la suppression"
      );
    }
  }
});
