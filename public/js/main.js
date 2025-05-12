document.addEventListener("DOMContentLoaded", () => {
  // Éléments DOM
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

  // Éléments pour les options de recherche avancées
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

  // Afficher/Cacher la modale des options de recherche avancées
  if (advancedSearchButton) {
    advancedSearchButton.addEventListener("click", () => {
      advancedSearchModal.style.display = "block";
    });
  }

  // Fermer la modale en cliquant sur le X
  if (closeModalButton) {
    closeModalButton.addEventListener("click", () => {
      advancedSearchModal.style.display = "none";
    });
  }

  // Fermer la modale en cliquant en dehors de son contenu
  window.addEventListener("click", (event) => {
    if (event.target === advancedSearchModal) {
      advancedSearchModal.style.display = "none";
    }
  });

  // Appliquer les options et fermer la modale
  if (applyAdvancedOptionsButton) {
    applyAdvancedOptionsButton.addEventListener("click", () => {
      advancedSearchModal.style.display = "none";
    });
  }

  // Sélectionner tous les moteurs
  selectAllEnginesButton.addEventListener("click", () => {
    engineCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
    });
  });

  // Désélectionner tous les moteurs
  deselectAllEnginesButton.addEventListener("click", () => {
    engineCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  });

  // Gestion des onglets principaux
  mainTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Mise à jour de l'onglet actif
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Afficher le contenu correspondant
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

  // Initialisation : activer l'onglet historique par défaut
  document
    .querySelector('[data-tab-content="history"]')
    .classList.add("active");

  // Charger l'historique des recherches au chargement de la page
  loadSearchHistory();

  // Gestionnaire pour le formulaire de recherche
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

    // Vérifier qu'au moins un moteur est sélectionné
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

    // Récupérer les options de région et langue
    const region = regionSelect.value;
    const language = languageSelect.value;

    // Afficher l'indicateur de chargement
    loadingIndicator.classList.remove("hidden");
    searchButton.disabled = true;
    resultsContainer.classList.add("hidden");

    try {
      // Envoyer la requête au serveur avec les options avancées
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

      // Afficher les résultats
      displayResults(data);

      // Basculer vers l'onglet des résultats
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      document.querySelector('[data-tab="results"]').classList.add("active");
      document.querySelectorAll("[data-tab-content]").forEach((content) => {
        content.classList.remove("active");
      });
      resultsContainer.classList.add("active");

      // Rafraîchir l'historique des recherches
      loadSearchHistory();
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        window.t
          ? window.t("error")
          : "Une erreur est survenue lors de la recherche"
      );
    } finally {
      // Cacher l'indicateur de chargement
      loadingIndicator.classList.add("hidden");
      searchButton.disabled = false;
    }
  });

  // Gestionnaire pour les onglets de moteurs de recherche
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Mise à jour de l'onglet actif
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Filtrer les résultats par moteur de recherche
      const engine = button.dataset.engine;
      filterResultsByEngine(engine);
    });
  });

  // Fonction pour afficher les résultats de recherche
  function displayResults(data) {
    // Mise à jour de l'interface
    searchTermDisplay.textContent = data.query;
    resultsContainer.classList.remove("hidden");
    resultsList.innerHTML = "";

    // Stocker les moteurs utilisés pour cette recherche
    window.allSearchEngines = data.results;

    // Utiliser les résultats scorés si disponibles, sinon utiliser les résultats par moteur
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

    // Afficher les résultats scorés s'ils sont disponibles
    if (data.scoredResults && data.scoredResults.length > 0) {
      // Créer un élément pour le nombre total de résultats uniques
      const totalResultsInfo = document.createElement("div");
      totalResultsInfo.className = "total-results-info";
      totalResultsInfo.textContent = window.t
        ? `${data.totalUniqueResults} ${window.t("uniqueResults")}`
        : `${data.totalUniqueResults} résultats uniques trouvés`;
      resultsList.appendChild(totalResultsInfo);

      // Afficher tous les résultats scorés
      data.scoredResults.forEach((result) => {
        const resultItem = createScoredResultItem(result);
        resultsList.appendChild(resultItem);
      });
    } else {
      // Ancien affichage (par moteur) si scoredResults n'est pas disponible
      for (const engine in data.results) {
        data.results[engine].forEach((result) => {
          const resultItem = createResultItem(result, engine);
          resultsList.appendChild(resultItem);
        });
      }
    }

    // Réinitialiser l'onglet actif
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    document.querySelector('[data-engine="all"]').classList.add("active");

    // Mettre à jour les onglets de moteur pour n'afficher que les moteurs utilisés
    updateEnginesTabs(Object.keys(data.results));
  }

  // Fonction pour mettre à jour les onglets de moteurs en fonction des moteurs utilisés
  function updateEnginesTabs(usedEngines) {
    tabButtons.forEach((button) => {
      const engine = button.dataset.engine;
      if (engine === "all") return; // Toujours afficher l'onglet "Tous"

      if (usedEngines.includes(engine)) {
        button.style.display = "block";
      } else {
        button.style.display = "none";
      }
    });
  }

  // Fonction pour créer un élément de résultat scoré
  function createScoredResultItem(result) {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item scored-result";
    resultItem.dataset.engines = result.engines.join(",");

    // Création du badge de score avec tooltip
    const scoreLabel = document.createElement("div");
    scoreLabel.className = "result-score";
    scoreLabel.title = window.t
      ? `${window.t("scoreTooltip")} - ${result.rawScore}/${
          Object.keys(window.allSearchEngines).length
        } moteurs`
      : `Score de 1.0 a 5.0 - ${result.rawScore}/${
          Object.keys(window.allSearchEngines).length
        } moteurs`;

    // Déterminer la classe de score en fonction de la valeur (1.0 à 5.0)
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

    // Afficher les moteurs qui ont trouvé ce résultat
    const enginesLabel = document.createElement("div");
    enginesLabel.className = "result-engines";

    // Afficher le nombre de moteurs ayant trouvé ce résultat (max 5)
    const enginesCount = document.createElement("span");
    enginesCount.className = "engines-count";

    // Récupérer le nombre total de moteurs disponibles
    const totalEnginesCount = Object.keys(
      window.allSearchEngines || {
        google: true,
        bing: true,
        duckduckgo: true,
        yandex: true,
        ecosia: true,
      }
    ).length;

    // Limiter le affichage au nombre total de moteurs
    enginesCount.textContent = `${Math.min(
      result.rawScore,
      totalEnginesCount
    )}/${totalEnginesCount}`;
    enginesLabel.appendChild(enginesCount);

    // Dédupliquer les moteurs avant de créer les badges
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

    // Ajouter un bouton "Visiter"
    const visitButton = document.createElement("a");
    visitButton.href = result.url;
    visitButton.className = "visit-button";
    visitButton.textContent = window.t ? window.t("visitLink") : "Visiter";
    visitButton.target = "_blank";
    visitButton.rel = "noopener noreferrer";

    // Wrapper pour le score et les moteurs
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

  // Fonction pour créer un élément de résultat (ancienne version)
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

    // Ajouter un bouton "Visiter"
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

  // Fonction pour filtrer les résultats par moteur de recherche
  function filterResultsByEngine(engine) {
    // L'onglet "Tous" montre tous les résultats
    if (engine === "all") {
      document.querySelectorAll(".result-item").forEach((item) => {
        item.style.display = "block";
      });
      return;
    }

    // Logique pour les résultats scorés
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

    // Ancien filtrage par attribut data-engine pour les résultats non scorés
    document.querySelectorAll(".result-item").forEach((item) => {
      if (item.dataset.engine === engine) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Fonction pour charger l'historique des recherches
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

      // Mise à jour de l'interface
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
        // Traduire le message de comptage de résultats
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

  // Fonction pour charger les résultats d'une recherche spécifique de l'historique
  async function loadResults(searchId) {
    // Afficher l'indicateur de chargement
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

      // Afficher les résultats
      displayResults(data);

      // Basculer vers l'onglet des résultats
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
      // Cacher l'indicateur de chargement
      loadingIndicator.classList.add("hidden");
    }
  }

  // Fonction pour supprimer une recherche de l'historique
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

      // Effet visuel de suppression
      const historyItem = document.querySelector(
        `.history-item[data-search-id="${searchId}"]`
      );
      if (historyItem) {
        historyItem.classList.add("fade-out");
        // Enlever l'élément après l'animation
        setTimeout(() => {
          historyItem.remove();

          // Vérifier s'il reste des recherches
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
