/**
 * Client-side translations management module
 */

// Store current translations
let currentTranslations = {};
let currentLanguage = "en";

// Load translations on startup
document.addEventListener("DOMContentLoaded", async () => {
  // Detect current language
  currentLanguage = document.documentElement.lang || "en";

  try {
    // Load translations for current language
    await loadTranslations(currentLanguage);

    // Observe changes to the lang attribute on the document
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

    // Configure and start the observer
    observer.observe(document.documentElement, { attributes: true });
  } catch (error) {
    console.error("Error loading translations:", error);
  }
});

/**
 * Load translations from the server
 * @param {string} lang - Language code
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/api/translations/${lang}`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    currentTranslations = await response.json();

    // Update static page elements
    updatePageTranslations();
  } catch (error) {
    console.error(`Error loading translations (${lang}):`, error);
  }
}

/**
 * Update static page elements with translations
 */
function updatePageTranslations() {
  // Update elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (currentTranslations[key]) {
      element.textContent = currentTranslations[key];
    }
  });
}

/**
 * Get a translation by its key
 * @param {string} key - Translation key
 * @param {Object} replacements - Variables to replace
 * @returns {string} - Translated text
 */
function t(key, replacements = {}) {
  let text = currentTranslations[key] || key;

  // Replace variables in the string
  if (text.includes("{}") && Object.keys(replacements).length > 0) {
    const values = Object.values(replacements);
    let i = 0;
    text = text.replace(/{}/g, () => values[i++] || "");
  }

  return text;
}

// Export functions for global use
window.t = t;
window.loadTranslations = loadTranslations;
