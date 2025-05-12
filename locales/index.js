const translations = {
  en: require("./en/translations"),
  fr: require("./fr/translations"),
};

// Langue par défaut
let currentLanguage = "en";

/**
 * Change la langue courante de l'application
 * @param {string} lang - Code de langue ('en', 'fr')
 */
function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;

    // Stocke la langue dans localStorage pour la persistance
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("language", lang);
    }

    // Met à jour l'attribut lang sur le document pour l'accessibilité
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
    }

    return true;
  }
  return false;
}

/**
 * Initialise la langue depuis le localStorage ou le navigateur
 */
function initLanguage() {
  if (typeof window !== "undefined") {
    // Essaie de récupérer depuis localStorage en premier
    const savedLang = window.localStorage.getItem("language");
    if (savedLang && translations[savedLang]) {
      currentLanguage = savedLang;
    } else {
      // Sinon, utilise la langue du navigateur si disponible
      const browserLang = navigator.language || navigator.userLanguage;
      const lang = browserLang ? browserLang.split("-")[0] : "en";
      // Vérifie si la langue est prise en charge
      if (translations[lang]) {
        currentLanguage = lang;
      }
    }

    // Met à jour l'attribut lang sur le document
    document.documentElement.setAttribute("lang", currentLanguage);
  }
}

/**
 * Obtient une chaîne traduite par sa clé
 * @param {string} key - Clé de traduction
 * @param {Object} replacements - Variables à remplacer dans la chaîne
 * @returns {string} Chaîne traduite
 */
function t(key, replacements = {}) {
  const translation = translations[currentLanguage] || translations.en;
  let text = translation[key] || key;

  // Remplace les variables dans la chaîne {}
  if (text.includes("{}") && Object.keys(replacements).length > 0) {
    const values = Object.values(replacements);
    let i = 0;
    text = text.replace(/{}/g, () => values[i++] || "");
  }

  return text;
}

/**
 * Retourne la langue courante
 * @returns {string} Code de langue courant
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Retourne toutes les langues disponibles
 * @returns {Object} Liste des langues {code: nom}
 */
function getAvailableLanguages() {
  return {
    en: "English",
    fr: "Français",
  };
}

module.exports = {
  t,
  setLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
  initLanguage,
};
