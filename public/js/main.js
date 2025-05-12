document.addEventListener("DOMContentLoaded", () => {
  // Éléments DOM
  const searchForm = document.getElementById("search-form");
  const queryInput = document.getElementById("query");
  const searchButton = document.getElementById("search-button");
  const loadingIndicator = document.getElementById("loading");
  const resultsContainer = document.getElementById("results-container");
  const searchTermDisplay = document.getElementById("search-term");
  const resultsList = document.getElementById("results-list");
  const historyList = document.getElementById("history-list");
  const tabButtons = document.querySelectorAll(".tab-button");

  // Charger l'historique des recherches au chargement de la page
  loadSearchHistory();

  // Gestionnaire pour le formulaire de recherche
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();

    if (!query) {
      alert("Veuillez entrer un terme de recherche");
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
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();

      // Afficher les résultats
      displayResults(data);

      // Rafraîchir l'historique des recherches
      loadSearchHistory();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue lors de la recherche");
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
      resultsList.innerHTML =
        '<p class="no-results">Aucun résultat trouvé pour cette recherche.</p>';
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
    engineLabel.textContent = engine.charAt(0).toUpperCase() + engine.slice(1);

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

    resultItem.appendChild(engineLabel);
    resultItem.appendChild(title);
    resultItem.appendChild(url);
    resultItem.appendChild(description);

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
        throw new Error("Erreur lors du chargement de l'historique");
      }

      const data = await response.json();

      // Mise à jour de l'interface
      historyList.innerHTML = "";

      if (data.length === 0) {
        historyList.innerHTML = "<p>Aucune recherche effectuée.</p>";
        return;
      }

      data.forEach((search) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

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
        count.textContent = `${search.resultCount} résultats`;

        const viewButton = document.createElement("button");
        viewButton.className = "view-results";
        viewButton.textContent = "Voir";
        viewButton.addEventListener("click", () => loadResults(search.id));

        resultInfo.appendChild(count);
        resultInfo.appendChild(document.createElement("br"));
        resultInfo.appendChild(viewButton);

        historyItem.appendChild(queryInfo);
        historyItem.appendChild(resultInfo);

        historyList.appendChild(historyItem);
      });
    } catch (error) {
      console.error("Erreur:", error);
      historyList.innerHTML =
        "<p>Erreur lors du chargement de l'historique.</p>";
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
        throw new Error("Erreur lors du chargement des résultats");
      }

      const data = await response.json();

      // Afficher les résultats
      displayResults(data);

      // Faire défiler vers les résultats
      resultsContainer.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue lors du chargement des résultats");
    } finally {
      // Cacher l'indicateur de chargement
      loadingIndicator.classList.add("hidden");
    }
  }
});
