/**
 * Module de gestion des traductions côté client
 */

// Stocker les traductions actuelles
let currentTranslations = {};
let currentLanguage = "en";

// Charger les traductions au démarrage
document.addEventListener("DOMContentLoaded", async () => {
  // Détecter la langue actuelle
  currentLanguage = document.documentElement.lang || "en";

  try {
    // Charger les traductions pour la langue actuelle
    await loadTranslations(currentLanguage);

    // Observer les changements d'attribut de langue sur le document
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "lang") {
          const newLang = document.documentElement.lang;
          if (newLang !== currentLanguage) {
            currentLanguage = newLang;
            loadTranslations(currentLanguage);
          }
        }
      });
    });

    // Configurer et démarrer l'observateur
    observer.observe(document.documentElement, { attributes: true });
  } catch (error) {
    console.error("Erreur lors du chargement des traductions:", error);
  }
});

/**
 * Charger les traductions depuis le serveur
 * @param {string} lang - Code de langue
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/api/translations/${lang}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    currentTranslations = await response.json();

    // Mettre à jour les éléments statiques de la page
    updatePageTranslations();
  } catch (error) {
    console.error(
      `Erreur lors du chargement des traductions (${lang}):`,
      error
    );
  }
}

/**
 * Mettre à jour les éléments statiques de la page avec les traductions
 */
function updatePageTranslations() {
  // Mettre à jour les éléments qui ont un attribut data-i18n
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (currentTranslations[key]) {
      element.textContent = currentTranslations[key];
    }
  });
}

/**
 * Obtenir une traduction par sa clé
 * @param {string} key - Clé de traduction
 * @param {Object} replacements - Variables à remplacer
 * @returns {string} - Texte traduit
 */
function t(key, replacements = {}) {
  let text = currentTranslations[key] || key;

  // Remplacer les variables dans la chaîne
  if (text.includes("{}") && Object.keys(replacements).length > 0) {
    const values = Object.values(replacements);
    let i = 0;
    text = text.replace(/{}/g, () => values[i++] || "");
  }

  return text;
}

// Exporter les fonctions pour une utilisation globale
window.t = t;
window.loadTranslations = loadTranslations;
