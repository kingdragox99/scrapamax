/**
 * Result scoring module
 * Score from 1.0 to 5.0 based on presence in different search engines
 */

/**
 * Normalizes a URL for comparison (removes tracking parameters, etc.)
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  try {
    // Create a URL object to easily manipulate components
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "msclkid",
      "ref",
      "source",
      "referrer",
      "_ga",
    ];

    paramsToRemove.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    // Normalize hostname (remove www.)
    urlObj.hostname = urlObj.hostname.replace(/^www\./, "");

    // Return URL without hash fragment
    return `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
  } catch (e) {
    // In case of invalid URL, return the original
    console.log(`Error normalizing URL: ${e.message}`);
    return url;
  }
}

/**
 * Calculates the score of a result based on its presence across different engines
 * @param {Object} allResults - All search results
 * @returns {Array} Scored and sorted results
 */
function scoreResults(allResults) {
  // Create a map to store unique results by normalized URL
  const resultMap = new Map();

  // Get total number of engines used
  const totalEngines = Object.keys(allResults).length;

  // Loop through all search engines
  for (const engine in allResults) {
    const results = allResults[engine];

    // Check that results is an array
    if (!Array.isArray(results)) {
      console.log(`Warning: results for "${engine}" are not an array, ignored`);
      continue;
    }

    // Loop through the results of the current engine
    results.forEach((result) => {
      // Normalize URL for comparison
      const normalizedUrl = normalizeUrl(result.url);

      if (resultMap.has(normalizedUrl)) {
        // If URL already exists, update existing entry
        const existingEntry = resultMap.get(normalizedUrl);

        // Check if this engine is already in the engines list
        if (!existingEntry.engines.includes(engine)) {
          existingEntry.engines.push(engine);
          // Only update score if it's a new engine
          // Calculate score based on number of engines (out of 5)
          existingEntry.rawScore = existingEntry.engines.length;
          // Score based directly on number of engines (out of 5)
          existingEntry.score = Math.min(5.0, existingEntry.engines.length);
          existingEntry.score = parseFloat(existingEntry.score.toFixed(1)); // Round to 1 decimal place
        }

        // Keep the longest title and description
        if (result.title.length > existingEntry.title.length) {
          existingEntry.title = result.title;
        }
        if (result.description.length > existingEntry.description.length) {
          existingEntry.description = result.description;
        }
      } else {
        // Calculate initial score (1.0 for a single engine)
        // Create a new entry for this URL
        resultMap.set(normalizedUrl, {
          ...result,
          engines: [engine],
          normalizedUrl: normalizedUrl,
          rawScore: 1, // Raw score (number of engines)
          score: 1.0, // Normalized score between 1.0 and 5.0
        });
      }
    });
  }

  // Convert map to array and sort by score (descending)
  const scoredResults = Array.from(resultMap.values()).sort((a, b) => {
    // Sort first by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // In case of a tie, sort alphabetically by title
    return a.title.localeCompare(b.title);
  });

  return scoredResults;
}

/**
 * Gets the top 3 engines that found this result (for display)
 * @param {Array<string>} engines - List of engines that found the result
 * @returns {Array<string>} Top 3 engines (or fewer if less than 3 engines)
 */
function getTopEngines(engines) {
  // Priority order of engines (for display)
  const priority = {
    google: 1,
    bing: 2,
    duckduckgo: 3,
    yandex: 4,
    ecosia: 5,
  };

  // Sort engines by priority
  const sortedEngines = [...engines].sort((a, b) => {
    return (priority[a] || 99) - (priority[b] || 99);
  });

  // Return a maximum of 3 engines
  return sortedEngines.slice(0, 3);
}

/**
 * Adds scoring information to all results
 * @param {Object} searchData - The complete search data object
 * @returns {Object} Search data with scoring
 */
function processSearchResults(searchData) {
  // Check that search data is valid
  if (!searchData || !searchData.results) {
    return searchData;
  }

  // Calculate result scores
  const scoredResults = scoreResults(searchData.results);

  // Add scored results to the search object
  const enhancedData = {
    ...searchData,
    scoredResults: scoredResults,
    totalUniqueResults: scoredResults.length,
  };

  return enhancedData;
}

module.exports = {
  scoreResults,
  processSearchResults,
  getTopEngines,
  normalizeUrl,
};
