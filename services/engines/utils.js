const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Gets a browser instance configured to avoid detection
 * @returns {Promise<Browser>} Puppeteer instance
 */
async function getBrowser() {
  console.log("🚀 Initializing browser with anti-detection protection...");
  const browser = await puppeteer.launch({
    headless: "new", // The new headless mode is less detectable
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=site-per-process,TranslateUI",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--lang=fr-FR,fr,en-US,en", // Specify language for more consistency
      "--disable-extensions", // Disable extensions to avoid interference
      "--mute-audio", // Mute audio
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: null, // Allow browser to automatically adjust window size
  });

  console.log("✅ Browser successfully initialized");
  return browser;
}

/**
 * Sets up anti-detection protections on the page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
async function setupBrowserAntiDetection(page) {
  await page.evaluateOnNewDocument(() => {
    // Override automation detection methods
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    // Remove Chrome detection attributes
    delete navigator.languages;
    Object.defineProperty(navigator, "languages", {
      get: () => ["fr-FR", "fr", "en-US", "en"],
    });
    // Simulate a non-headless platform
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });
    // Hide Puppeteer detection functions
    window.chrome = {
      runtime: {},
    };
  });
}

/**
 * Sets a random screen size to simulate human behavior
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
async function setupRandomScreenSize(page) {
  console.log(`🖥️ Setting up random screen size...`);
  // Configure random behaviors
  await page.setViewport({
    width: 1280 + Math.floor(Math.random() * 100),
    height: 800 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false,
  });
}

/**
 * Generates a random pause to simulate human behavior
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise<void>}
 */
async function randomDelay(min = 1000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`⏱️ Random pause of ${delay}ms...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Returns an appropriate user agent based on region and language
 * @param {string} region - Region code (fr, us, etc.)
 * @param {string} language - Language code (fr, en, etc.)
 * @returns {Promise<string>} User agent
 */
async function getUserAgent(region = "global", language = "auto") {
  // Define multiple user agents by region and language
  const userAgentsByRegion = {
    // User agents for USA
    us: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ],
    // User agents for France
    fr: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    ],
    // User agents for United Kingdom
    uk: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
    ],
    // User agents for Germany
    de: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ],
    // User agents for Japan
    jp: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ],
    // User agents for China
    cn: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    ],
    // Global user agents
    global: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
    ],
  };

  // User agents specific to certain languages
  const userAgentsByLanguage = {
    // User agents for Japanese
    ja: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ],
    // User agents for Chinese
    zh: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    ],
    // User agents for Russian
    ru: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 YaBrowser/23.3.0.0 Safari/537.36",
    ],
  };

  // Determine which user agents to use
  let userAgents;

  // If language is specified and not automatic, prioritize language-specific user agents
  if (language !== "auto" && userAgentsByLanguage[language]) {
    userAgents = userAgentsByLanguage[language];
    console.log(`🌐 Using language-specific user agent: ${language}`);
  }
  // Otherwise, use region-specific user agents
  else if (region !== "global" && userAgentsByRegion[region]) {
    userAgents = userAgentsByRegion[region];
    console.log(`🌐 Using region-specific user agent: ${region}`);
  }
  // By default, use global user agents
  else {
    userAgents = userAgentsByRegion.global;
    console.log(`🌐 Using global user agent`);
  }

  // Select a random user agent from the appropriate list
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
}

/**
 * Cleans DuckDuckGo redirect URLs to get the real URL
 * @param {string} url - Potentially a redirect URL
 * @returns {string} Decoded URL or original
 */
function decodeDuckDuckGoUrl(url) {
  // Check if it's a DuckDuckGo redirect URL
  if (url && url.startsWith("https://duckduckgo.com/l/")) {
    try {
      // Extract the uddg parameter containing the encoded original URL
      const urlObj = new URL(url);
      const uddg = urlObj.searchParams.get("uddg");
      if (uddg) {
        // Decode URL to get the original URL
        return decodeURIComponent(uddg);
      }
    } catch (e) {
      console.log(`⚠️ Error decoding DuckDuckGo URL: ${e.message}`);
    }
  }

  // If it's not a redirect URL or there's an error, return the original URL
  return url;
}

/**
 * Decodes Baidu redirect URLs
 * @param {string} url - Baidu redirect URL
 * @param {Page} page - Puppeteer page instance (optional)
 * @returns {Promise<string>} Decoded URL
 */
async function decodeBaiduUrl(url, page = null) {
  // Check if it's a Baidu redirect URL
  if (
    url &&
    (url.includes("baidu.com/link?") || url.includes("baidu.com/url?"))
  ) {
    try {
      // If a page is provided, use that page to follow the redirect
      if (page) {
        // Store the current URL
        const currentUrl = page.url();

        // Create an event to capture the redirect
        let realUrl = null;
        const client = await page.target().createCDPSession();
        await client.send("Network.enable");

        client.on("Network.requestWillBeSent", (event) => {
          // Ignore requests to Baidu
          if (
            event.request.url &&
            !event.request.url.includes("baidu.com") &&
            event.request.url.startsWith("http")
          ) {
            realUrl = event.request.url;
          }
        });

        // Navigate to the redirect URL
        await page
          .goto(url, { waitUntil: "domcontentloaded", timeout: 10000 })
          .catch(() => {});

        // Wait a bit for the redirect
        await new Promise((r) => setTimeout(r, 2000));

        // Return to the original URL
        await page
          .goto(currentUrl, { waitUntil: "domcontentloaded" })
          .catch(() => {});

        // If we captured a real URL
        if (realUrl) {
          console.log(`🔄 Baidu URL decoded: ${url} -> ${realUrl}`);
          return realUrl;
        }
      }

      // Alternative method: extract the url parameter from the Baidu URL
      const urlObj = new URL(url);
      const redirectUrl = urlObj.searchParams.get("url");
      if (redirectUrl) {
        return redirectUrl;
      }
    } catch (e) {
      console.log(`⚠️ Error decoding Baidu URL: ${e.message}`);
    }
  }

  // If it's not a redirect URL or there's an error, return the original URL
  return url;
}

/**
 * Decodes Bing redirect URLs
 * @param {string} url - Bing redirect URL
 * @returns {string} Decoded URL
 */
function decodeBingUrl(url) {
  // Check if it's a Bing redirect URL
  if (url && url.includes("bing.com/ck/")) {
    try {
      // The real URL is Base64 encoded in the 'u' parameter
      const match = url.match(/[?&]u=([^&]+)/);
      if (match && match[1]) {
        // Decode the Base64 part
        let encodedUrl = match[1];

        // For Bing, the format is often 'a1' followed by the Base64 encoded URL
        if (encodedUrl.startsWith("a1")) {
          encodedUrl = encodedUrl.substring(2);
        }

        try {
          // Decode Base64 URL
          const decodedUrl = Buffer.from(encodedUrl, "base64").toString(
            "utf-8"
          );
          if (decodedUrl && decodedUrl.startsWith("http")) {
            console.log(`🔄 Bing URL decoded: ${url} -> ${decodedUrl}`);
            return decodedUrl;
          }
        } catch (e) {
          console.log(`⚠️ Error with Base64 decoding: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`⚠️ Error decoding Bing URL: ${e.message}`);
    }
  }

  // If it's not a redirect URL or there's an error, return the original URL
  return url;
}

/**
 * Performs random and natural scrolling on the page
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<void>}
 */
async function humanScroll(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      // Random scrolling parameters
      const totalScrolls = 3 + Math.floor(Math.random() * 5); // 3-7 scrolls
      let currentScroll = 0;

      const scroll = () => {
        if (currentScroll >= totalScrolls) {
          resolve();
          return;
        }

        // Random scrolling distance (more human-like)
        const distance = 100 + Math.floor(Math.random() * 400);

        // Random scrolling speed
        const delay = 500 + Math.floor(Math.random() * 1000);

        window.scrollBy(0, distance);
        currentScroll++;

        // Small chance to scroll back up slightly (like a human)
        if (Math.random() > 0.7 && currentScroll > 1) {
          setTimeout(() => {
            window.scrollBy(0, -Math.floor(Math.random() * 100));
            setTimeout(scroll, delay);
          }, 300);
        } else {
          setTimeout(scroll, delay);
        }
      };

      scroll();
    });
  });

  // Pause after scrolling
  await randomDelay(1000, 2000);
}

/**
 * Detects and handles CAPTCHAs with user intervention
 * @param {Page} page - Puppeteer page instance
 * @param {string} engineName - Search engine name for logs
 * @returns {Promise<boolean>} True if a CAPTCHA was detected and resolved
 */
async function handleCaptcha(page, engineName) {
  console.log(`🔍 Checking for CAPTCHA presence on ${engineName}...`);

  // Selectors for different types of CAPTCHAs
  const captchaSelectors = {
    brave: [
      'button:contains("I\'m not a robot")',
      'button:contains("Je ne suis pas un robot")',
      ".captcha",
      '[aria-label="Captcha"]',
    ],
    google: ["#captcha", ".g-recaptcha", 'iframe[src*="recaptcha"]'],
    yandex: [
      ".CheckboxCaptcha",
      ".AdvancedCaptcha",
      ".AdvancedCaptcha-Image",
      ".Captcha-Image",
      ".captcha__image",
      'img[src*="captcha"]',
      'div[data-type="captcha"]',
      'form[action*="captcha"]',
      'div:contains("Je ne suis pas un robot")',
      'div:contains("I am not a robot")',
      // SmartCaptcha by Yandex Cloud
      ".SmartCaptcha",
      ".SmartCaptcha-Anchor",
      ".SmartCaptcha-CheckboxCaptcha",
      ".smartcaptcha",
      'iframe[src*="captcha.yandex.com"]',
      'iframe[src*="smart-captcha"]',
      'iframe[src*="smartcaptcha"]',
      'div[data-testid="checkbox-captcha"]',
      'a[href*="yandex.com/support/smart-captcha"]',
    ],
    general: [
      "#captcha",
      ".captcha",
      'iframe[src*="captcha"]',
      'iframe[src*="recaptcha"]',
    ],
  };

  // Combine engine-specific and general selectors
  const selectors = [
    ...(captchaSelectors[engineName.toLowerCase()] || []),
    ...captchaSelectors.general,
  ];

  // Check if a CAPTCHA is present
  const captchaDetected = await page.evaluate((selectors) => {
    // Function to check if an element contains specific text
    const containsText = (element, text) => {
      return element && element.innerText && element.innerText.includes(text);
    };

    // Look for elements that match the selectors
    for (const selector of selectors) {
      if (selector.includes(':contains("')) {
        // Special handling for selectors with :contains() pseudo-selector
        const plainSelector = selector.split(":contains(")[0];
        const searchText = selector.match(/:contains\("(.+?)"\)/)[1];

        const elements = document.querySelectorAll(plainSelector);
        for (const el of elements) {
          if (containsText(el, searchText)) {
            return {
              found: true,
              selector: selector,
              text: el.innerText,
            };
          }
        }
      } else {
        // Standard CSS selectors
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return {
            found: true,
            selector: selector,
            count: elements.length,
          };
        }
      }
    }

    // Also check page title and content for CAPTCHA indications
    const pageTitle = document.title.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase();

    if (
      pageTitle.includes("captcha") ||
      pageTitle.includes("robot") ||
      pageTitle.includes("verification") ||
      bodyText.includes("confirm you're a human") ||
      bodyText.includes("confirmer que vous êtes humain")
    ) {
      return {
        found: true,
        method: "text detection",
        title: document.title,
      };
    }

    return { found: false };
  }, selectors);

  // If a CAPTCHA is detected
  if (captchaDetected.found) {
    console.log(`⚠️ CAPTCHA detected on ${engineName}:`, captchaDetected);

    // Take a screenshot of the CAPTCHA
    const screenshotPath = `${engineName.toLowerCase()}-captcha.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 CAPTCHA screenshot saved: ${screenshotPath}`);

    // Configure browser to be visible (non-headless)
    console.log(`🔄 Reloading page in visible mode for manual resolution...`);
    const context = page.browser().defaultBrowserContext();

    // Open a new visible page for user intervention
    const browser = await puppeteer.launch({
      headless: false, // Non-headless mode to allow interaction
      args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
    });

    const visiblePage = await browser.newPage();
    await visiblePage.setViewport({ width: 1280, height: 800 });

    // Go to the same URL
    const currentUrl = page.url();
    await visiblePage.goto(currentUrl, { waitUntil: "domcontentloaded" });

    // Display a message to the user
    await visiblePage.evaluate(() => {
      const div = document.createElement("div");
      div.id = "captcha-notification";
      div.style.position = "fixed";
      div.style.bottom = "0";
      div.style.left = "0";
      div.style.right = "0";
      div.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      div.style.color = "white";
      div.style.padding = "15px";
      div.style.textAlign = "center";
      div.style.zIndex = "9999";
      div.style.fontSize = "16px";
      div.style.fontWeight = "bold";
      div.style.maxHeight = "30%";
      div.style.boxShadow = "0 -2px 10px rgba(0,0,0,0.3)";
      div.style.borderTop = "2px solid var(--primary-color, #ff7f00)";
      div.innerHTML = `
        CAPTCHA detected! Please solve the CAPTCHA above.<br>
        Once solved, click the button below to continue the search.<br>
        <button id="captcha-solved" style="
          background-color: #ff7f00;
          color: white;
          padding: 8px 16px;
          margin-top: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">I've solved the CAPTCHA</button>
      `;
      document.body.appendChild(div);

      // Add event handler for the button
      document
        .getElementById("captcha-solved")
        .addEventListener("click", () => {
          div.style.backgroundColor = "rgba(0, 128, 0, 0.8)";
          div.innerHTML = "Thank you! The search will continue...";
          setTimeout(() => {
            window.close();
          }, 2000);
        });
    });

    // Wait for the user to solve the CAPTCHA and close the window
    console.log(`⏳ Waiting for the user to solve the CAPTCHA...`);
    await new Promise((resolve) => {
      browser.on("disconnected", resolve);
    });

    console.log(`✅ CAPTCHA solved by user!`);

    // Continue with the original page
    await page.reload({ waitUntil: "domcontentloaded" });
    await randomDelay(2000, 3000);

    return true;
  }

  return false;
}

module.exports = {
  getBrowser,
  randomDelay,
  getUserAgent,
  decodeDuckDuckGoUrl,
  decodeBaiduUrl,
  decodeBingUrl,
  humanScroll,
  setupBrowserAntiDetection,
  setupRandomScreenSize,
  handleCaptcha,
};
