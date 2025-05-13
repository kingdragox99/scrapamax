const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const utils = require("./utils");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Search on Google with Puppeteer
 * @param {string} query - Search term
 * @param {Object} options - Search options
 * @param {string} options.region - Region code for search
 * @param {string} options.language - Language code for search
 * @returns {Promise<Array>} Array of search results
 */
async function searchGoogle(query, options = {}) {
  const { region = "global", language = "auto" } = options;

  console.log(`\n🔍 Attempting Google search for: "${query}"`);
  console.log(`📍 Region: ${region}, 🌐 Language: ${language}`);

  let browser;
  try {
    browser = await utils.getBrowser();
    console.log("📝 Setting up Google page...");
    const page = await browser.newPage();

    // Configure an appropriate user agent for region/language
    const userAgent = await utils.getUserAgent(region, language);
    await page.setUserAgent(userAgent);
    console.log(`🔒 User-Agent configured: ${userAgent.substring(0, 50)}...`);

    // Configure geolocation and language parameters
    await page.setExtraHTTPHeaders({
      "Accept-Language":
        language !== "auto"
          ? `${language},en-US;q=0.9,en;q=0.8`
          : "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    // Configure random screen size
    await utils.setupRandomScreenSize(page);

    // Anti-detection configuration
    await utils.setupBrowserAntiDetection(page);

    // Build URL with region and language parameters if specified
    let googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}`;

    // Add region parameters if specified and not global
    if (region && region !== "global") {
      const regionMappings = {
        us: "US",
        fr: "FR",
        uk: "GB",
        de: "DE",
        es: "ES",
        it: "IT",
        ca: "CA",
        jp: "JP",
        br: "BR",
      };

      const countryCode = regionMappings[region] || region.toUpperCase();
      googleUrl += `&gl=${countryCode}`;
    }

    // Add language parameters if specified and not automatic
    if (language && language !== "auto") {
      googleUrl += `&hl=${language}`;
    }

    console.log(`🌐 Navigating to Google with regional parameters...`);
    console.log(`🔗 URL: ${googleUrl}`);

    // Navigate to Google and wait for page to load
    await page.goto(googleUrl, {
      waitUntil: "networkidle2",
    });

    console.log(`⏳ Waiting after page load...`);
    // Short pause to avoid detection
    await utils.randomDelay(2000, 4000);

    // Check for a CAPTCHA
    const hasCaptcha = await utils.handleCaptcha(page, "Google");
    if (hasCaptcha) {
      console.log(`✅ CAPTCHA solved, resuming Google search...`);
      await utils.randomDelay(2000, 3000);
    }

    console.log(`🍪 Checking for popups and consent notices...`);
    // Handle consent banners
    try {
      // Check if there's a consent banner
      const consentSelectors = [
        "button.tHlp8d", // "I accept" button on consent banner
        "#L2AGLb", // "I accept" button (new version)
        "[aria-label='Accept all']", // Button by aria-label
        "form:nth-child(2) > div > div > button", // Commonly used pattern
      ];

      for (const selector of consentSelectors) {
        if (await page.$(selector)) {
          console.log(`🖱️ Popup detected, clicking on ${selector}`);
          await page.click(selector);
          await page.waitForTimeout(1500);
          break;
        }
      }
    } catch (e) {
      console.log("ℹ️ No popup to close or error:", e.message);
    }

    console.log(`🔍 Checking for CAPTCHA on Google...`);
    await utils.handleCaptcha(page, "Google");

    console.log(`🖱️ Simulating scrolling to appear human...`);
    // Add random scrolling
    await utils.humanScroll(page);

    await utils.randomDelay(1000, 3000);

    console.log(`🔍 Extracting Google results...`);
    // Extract results
    const results = await page.evaluate(() => {
      console.log("Searching for elements in Google page...");

      const searchResults = [];

      // Multiple selectors to adapt to Google's changes
      const selectors = [
        // 2024 updated structure
        {
          container: "div.v7W49e > div > div.MjjYud",
          title: "h3.LC20lb",
          link: ".yuRUbf > a",
          snippet: ".VwiC3b",
        },
        // 2024 alternative structure
        {
          container: "div.g",
          title: "h3.LC20lb",
          link: "div.yuRUbf > a",
          snippet: "div.VwiC3b",
        },
        // Structure for rich results
        {
          container: "div.N54PNb",
          title: "h3.LC20lb",
          link: "a",
          snippet: ".VwiC3b, .k8XOCe",
        },
        // Old main structure
        {
          container: ".g",
          title: "h3",
          link: "a",
          snippet: ".VwiC3b, .st",
        },
        // Other backup structures
        {
          container: ".Gx5Zad",
          title: "h3",
          link: "a",
          snippet: ".lEBKkf, .s3v9rd, .yDYNvb",
        },
        {
          container: ".MjjYud",
          title: "h3",
          link: "a",
          snippet: "[data-sncf], [data-content-feature='1']",
        },
      ];

      // Use console for debugging
      const allH3 = document.querySelectorAll("h3");
      console.log(`Total number of h3 in the page: ${allH3.length}`);

      document.querySelectorAll("div.g").forEach((el, i) => {
        console.log(
          `Content of div.g #${i + 1}:`,
          el.innerHTML.substring(0, 100) + "..."
        );
      });

      // Try each set of selectors
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector.container);

        if (elements.length > 0) {
          console.log(
            `Found ${elements.length} results with selector ${selector.container}`
          );

          elements.forEach((element) => {
            const titleElement = element.querySelector(selector.title);
            const linkElement = titleElement
              ? titleElement.closest("a") ||
                element.querySelector(selector.link)
              : element.querySelector(selector.link);
            const snippetElement = element.querySelector(selector.snippet);

            // Check conditions for a valid result
            if (
              titleElement &&
              linkElement &&
              linkElement.href &&
              linkElement.href.startsWith("http") &&
              !linkElement.href.includes("google.com/search") &&
              !linkElement.href.includes("accounts.google.com") &&
              !linkElement.href.includes("support.google.com")
            ) {
              // Clean up title text (may contain invisible elements)
              const titleText = titleElement.textContent.trim();

              searchResults.push({
                title: titleText,
                url: linkElement.href,
                description: snippetElement
                  ? snippetElement.textContent.trim().replace(/\s+/g, " ")
                  : "No description available",
              });
            }
          });
        }
      }

      // If no results were found, try a very generic method
      if (searchResults.length === 0) {
        console.log(
          "No results found with standard selectors, trying alternative method..."
        );

        // Try an even more generic approach based on links
        const allLinks = Array.from(
          document.querySelectorAll('a[href^="http"]')
        ).filter((link) => {
          const href = link.href.toLowerCase();
          return (
            !href.includes("google.com") &&
            !href.includes("accounts.google") &&
            !href.includes("support.google") &&
            !href.includes("policies.google") &&
            !href.includes("maps.google")
          );
        });

        console.log(`Found ${allLinks.length} links with external URLs`);

        allLinks.forEach((link) => {
          // Check if this link has a nearby h3 title or contains significant text
          const parentDiv = link.closest("div");
          const nearestH3 = parentDiv ? parentDiv.querySelector("h3") : null;
          const title = nearestH3
            ? nearestH3.textContent.trim()
            : link.textContent.trim().length > 10
            ? link.textContent.trim()
            : null;

          if (title) {
            // Look for descriptive text around the link
            let description = "";
            if (parentDiv) {
              // Try to find a paragraph or div containing text
              const textNodes = Array.from(
                parentDiv.querySelectorAll("div, span, p")
              ).filter((el) => {
                const text = el.textContent.trim();
                return (
                  text.length > 30 && // Long enough to be a description
                  !text.includes(title) && // Doesn't contain the title (duplicated)
                  !el.querySelector("h3")
                ); // Doesn't contain an h3
              });

              if (textNodes.length > 0) {
                description = textNodes[0].textContent
                  .trim()
                  .replace(/\s+/g, " ");
              }
            }

            searchResults.push({
              title: title,
              url: link.href,
              description: description || "No description available",
            });
          }
        });
      }

      return searchResults.slice(0, 20); // Limit to 20 results
    });

    console.log(
      `🏁 Google extraction completed, ${results.length} results found`
    );
    await browser.close();

    if (results.length === 0) {
      console.log(`⚠️ No results found for Google`);
      return [
        {
          title: `No Google results for "${query}"`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          description:
            "Scraping worked but found no results. Possibly an error in CSS selectors or Google changed its HTML structure.",
        },
      ];
    }

    return results;
  } catch (error) {
    console.error(`❌ Error during Google search:`, error.message);
    if (browser) await browser.close();

    return [
      {
        title: "Google search error",
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        description: `Error during scraping: ${error.message}. Google is probably blocking automated requests.`,
      },
    ];
  }
}

module.exports = searchGoogle;
