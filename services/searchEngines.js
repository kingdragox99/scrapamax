/**
 * Service for searching across different search engines
 * This file is maintained for compatibility with the rest of the application
 * but it redirects to the modular implementation in /engines
 */

const { search } = require("./engines");

const searchEngines = {
  searchAllEngines: search,
};

module.exports = searchEngines;
