const puppeteer = require("puppeteer-extra");
const { randomDelay } = require("./humanBehavior");

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
  handleCaptcha,
};
