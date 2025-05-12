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

    // Afficher l'indicateur de chargement
    loadingIndicator.classList.remove("hidden");
    searchButton.disabled = true;
    resultsContainer.classList.add("hidden");

    try {
      // Envoyer la requête au serveur
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
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

    const { results } = data;

    // Vérifier s'il y a des résultats
    const hasResults = Object.values(results).some(
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

    // Afficher tous les résultats d'abord
    for (const engine in results) {
      results[engine].forEach((result) => {
        const resultItem = createResultItem(result, engine);
        resultsList.appendChild(resultItem);
      });
    }

    // Réinitialiser l'onglet actif
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    document.querySelector('[data-engine="all"]').classList.add("active");
  }

  // Fonction pour créer un élément de résultat
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
    const resultItems = document.querySelectorAll(".result-item");

    resultItems.forEach((item) => {
      if (engine === "all" || item.dataset.engine === engine) {
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

  // Fonction pour charger les résultats d'une recherche précédente
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

  // Fonction pour supprimer une recherche
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
