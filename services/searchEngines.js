/**
 * Service pour faire des recherches sur différents moteurs de recherche
 * Ce fichier est maintenu pour la compatibilité avec le reste de l'application
 * mais il redirige vers l'implémentation modulaire dans /engines
 */

const { search } = require("./engines");

const searchEngines = {
  searchAllEngines: search,
};

module.exports = searchEngines;
