const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Ajouter le plugin stealth pour éviter la détection
puppeteer.use(StealthPlugin());

/**
 * Obtient une instance du navigateur configurée pour éviter la détection
 * @returns {Promise<Browser>} Instance Puppeteer
 */
async function getBrowser() {
  console.log(
    "🚀 Initialisation du navigateur avec protection anti-détection..."
  );
  const browser = await puppeteer.launch({
    headless: "new", // Le nouveau mode headless est moins détectable
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
      "--lang=fr-FR,fr,en-US,en", // Spécifier la langue pour plus de cohérence
      "--disable-extensions", // Désactiver les extensions pour éviter les interférences
      "--mute-audio", // Couper le son
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: null, // Permettre au navigateur d'ajuster automatiquement la taille de la fenêtre
  });

  console.log("✅ Navigateur initialisé avec succès");
  return browser;
}

/**
 * Configure les protections anti-détection sur la page
 * @param {Page} page - L'instance de page Puppeteer
 * @returns {Promise<void>}
 */
async function setupBrowserAntiDetection(page) {
  await page.evaluateOnNewDocument(() => {
    // Surcharge des méthodes de détection d'automatisation
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    // Supprimer les attributs de détection de Chrome
    delete navigator.languages;
    Object.defineProperty(navigator, "languages", {
      get: () => ["fr-FR", "fr", "en-US", "en"],
    });
    // Simuler une plateforme non-headless
    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });
    // Masquer les fonctions de détection de Puppeteer
    window.chrome = {
      runtime: {},
    };
  });
}

/**
 * Configure une taille d'écran aléatoire pour simuler un comportement humain
 * @param {Page} page - L'instance de page Puppeteer
 * @returns {Promise<void>}
 */
async function setupRandomScreenSize(page) {
  console.log(`🖥️ Configuration de la taille d'écran aléatoire...`);
  // Configurer des comportements aléatoires
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
 * Génère une pause aléatoire pour simuler un comportement humain
 * @param {number} min - Délai minimum en ms
 * @param {number} max - Délai maximum en ms
 * @returns {Promise<void>}
 */
async function randomDelay(min = 1000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`⏱️ Pause aléatoire de ${delay}ms...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Retourne un user agent approprié en fonction de la région et de la langue
 * @param {string} region - Code de région (fr, us, etc.)
 * @param {string} language - Code de langue (fr, en, etc.)
 * @returns {Promise<string>} User agent
 */
async function getUserAgent(region = "global", language = "auto") {
  // Définir plusieurs user agents par région et langue
  const userAgentsByRegion = {
    // User agents pour les USA
    us: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ],
    // User agents pour la France
    fr: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    ],
    // User agents pour le Royaume-Uni
    uk: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.80",
    ],
    // User agents pour l'Allemagne
    de: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ],
    // User agents pour le Japon
    jp: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ],
    // User agents pour la Chine
    cn: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    ],
    // User agents globaux
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

  // User agents spécifiques à certaines langues
  const userAgentsByLanguage = {
    // User agents pour le Japonais
    ja: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ],
    // User agents pour le Chinois
    zh: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    ],
    // User agents pour le Russe
    ru: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 YaBrowser/23.3.0.0 Safari/537.36",
    ],
  };

  // Déterminer quels user agents utiliser
  let userAgents;

  // Si la langue est spécifiée et non automatique, privilégier les user agents spécifiques à la langue
  if (language !== "auto" && userAgentsByLanguage[language]) {
    userAgents = userAgentsByLanguage[language];
    console.log(
      `🌐 Utilisation d'un user agent spécifique à la langue: ${language}`
    );
  }
  // Sinon, utiliser les user agents spécifiques à la région
  else if (region !== "global" && userAgentsByRegion[region]) {
    userAgents = userAgentsByRegion[region];
    console.log(
      `🌐 Utilisation d'un user agent spécifique à la région: ${region}`
    );
  }
  // Par défaut, utiliser les user agents globaux
  else {
    userAgents = userAgentsByRegion.global;
    console.log(`🌐 Utilisation d'un user agent global`);
  }

  // Sélectionner un user agent aléatoire dans la liste appropriée
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
}

/**
 * Nettoie les URLs de redirection de DuckDuckGo pour obtenir l'URL réelle
 * @param {string} url - URL potentiellement de redirection
 * @returns {string} URL décodée ou originale
 */
function decodeDuckDuckGoUrl(url) {
  // Vérifie si c'est une URL de redirection DuckDuckGo
  if (url && url.startsWith("https://duckduckgo.com/l/")) {
    try {
      // Extraire le paramètre uddg qui contient l'URL originale encodée
      const urlObj = new URL(url);
      const uddg = urlObj.searchParams.get("uddg");
      if (uddg) {
        // Décoder l'URL pour obtenir l'URL originale
        return decodeURIComponent(uddg);
      }
    } catch (e) {
      console.log(
        `⚠️ Erreur lors du décodage de l'URL DuckDuckGo: ${e.message}`
      );
    }
  }

  // Si ce n'est pas une URL de redirection ou s'il y a une erreur, retourner l'URL originale
  return url;
}

/**
 * Décode les URLs de redirection de Baidu
 * @param {string} url - URL de redirection Baidu
 * @param {Page} page - Instance de page Puppeteer (optionnel)
 * @returns {Promise<string>} URL décodée
 */
async function decodeBaiduUrl(url, page = null) {
  // Vérifier si c'est une URL de redirection Baidu
  if (
    url &&
    (url.includes("baidu.com/link?") || url.includes("baidu.com/url?"))
  ) {
    try {
      // Si une page est fournie, utiliser cette page pour suivre la redirection
      if (page) {
        // Stocker l'URL courante
        const currentUrl = page.url();

        // Créer un événement pour capturer la redirection
        let realUrl = null;
        const client = await page.target().createCDPSession();
        await client.send("Network.enable");

        client.on("Network.requestWillBeSent", (event) => {
          // Ignorer les requêtes vers Baidu
          if (
            event.request.url &&
            !event.request.url.includes("baidu.com") &&
            event.request.url.startsWith("http")
          ) {
            realUrl = event.request.url;
          }
        });

        // Naviguer vers l'URL de redirection
        await page
          .goto(url, { waitUntil: "domcontentloaded", timeout: 10000 })
          .catch(() => {});

        // Attendre un peu pour la redirection
        await new Promise((r) => setTimeout(r, 2000));

        // Retourner à l'URL originale
        await page
          .goto(currentUrl, { waitUntil: "domcontentloaded" })
          .catch(() => {});

        // Si on a capturé une URL réelle
        if (realUrl) {
          console.log(`🔄 URL Baidu décodée: ${url} -> ${realUrl}`);
          return realUrl;
        }
      }

      // Méthode alternative: extraire le paramètre url de l'URL Baidu
      const urlObj = new URL(url);
      const redirectUrl = urlObj.searchParams.get("url");
      if (redirectUrl) {
        return redirectUrl;
      }
    } catch (e) {
      console.log(`⚠️ Erreur lors du décodage de l'URL Baidu: ${e.message}`);
    }
  }

  // Si ce n'est pas une URL de redirection ou s'il y a une erreur, retourner l'URL originale
  return url;
}

/**
 * Décode les URLs de redirection de Bing
 * @param {string} url - URL de redirection Bing
 * @returns {string} URL décodée
 */
function decodeBingUrl(url) {
  // Vérifier si c'est une URL de redirection Bing
  if (url && url.includes("bing.com/ck/")) {
    try {
      // L'URL réelle est encodée en Base64 dans le paramètre 'u'
      const match = url.match(/[?&]u=([^&]+)/);
      if (match && match[1]) {
        // Décoder la partie Base64
        let encodedUrl = match[1];

        // Pour Bing, le format est souvent 'a1' suivi de l'URL encodée en Base64
        if (encodedUrl.startsWith("a1")) {
          encodedUrl = encodedUrl.substring(2);
        }

        try {
          // Décoder l'URL en Base64
          const decodedUrl = Buffer.from(encodedUrl, "base64").toString(
            "utf-8"
          );
          if (decodedUrl && decodedUrl.startsWith("http")) {
            console.log(`🔄 URL Bing décodée: ${url} -> ${decodedUrl}`);
            return decodedUrl;
          }
        } catch (e) {
          console.log(`⚠️ Erreur lors du décodage Base64: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`⚠️ Erreur lors du décodage de l'URL Bing: ${e.message}`);
    }
  }

  // Si ce n'est pas une URL de redirection ou s'il y a une erreur, retourner l'URL originale
  return url;
}

/**
 * Effectue un défilement aléatoire et naturel sur la page
 * @param {Page} page - L'instance de page Puppeteer
 * @returns {Promise<void>}
 */
async function humanScroll(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      // Paramètres de défilement aléatoires
      const totalScrolls = 3 + Math.floor(Math.random() * 5); // 3-7 défilements
      let currentScroll = 0;

      const scroll = () => {
        if (currentScroll >= totalScrolls) {
          resolve();
          return;
        }

        // Distance aléatoire de défilement (plus humain)
        const distance = 100 + Math.floor(Math.random() * 400);

        // Vitesse aléatoire de défilement
        const delay = 500 + Math.floor(Math.random() * 1000);

        window.scrollBy(0, distance);
        currentScroll++;

        // Petite chance de remonter légèrement (comme un humain)
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

  // Pause après le défilement
  await randomDelay(1000, 2000);
}

/**
 * Détecte et gère les CAPTCHA avec intervention de l'utilisateur
 * @param {Page} page - L'instance de page Puppeteer
 * @param {string} engineName - Nom du moteur de recherche pour les logs
 * @returns {Promise<boolean>} True si un CAPTCHA a été détecté et résolu
 */
async function handleCaptcha(page, engineName) {
  console.log(
    `🔍 Vérification de la présence d'un CAPTCHA sur ${engineName}...`
  );

  // Sélecteurs pour différents types de CAPTCHA
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
      // SmartCaptcha par Yandex Cloud
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

  // Combiner les sélecteurs spécifiques au moteur et généraux
  const selectors = [
    ...(captchaSelectors[engineName.toLowerCase()] || []),
    ...captchaSelectors.general,
  ];

  // Vérifier si un CAPTCHA est présent
  const captchaDetected = await page.evaluate((selectors) => {
    // Fonction pour vérifier si un élément contient un texte spécifique
    const containsText = (element, text) => {
      return element && element.innerText && element.innerText.includes(text);
    };

    // Chercher des éléments qui correspondent aux sélecteurs
    for (const selector of selectors) {
      if (selector.includes(':contains("')) {
        // Traitement spécial pour les sélecteurs avec le pseudo-sélecteur :contains()
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
        // Sélecteurs CSS standard
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

    // Vérifier également le titre et le contenu de la page pour des indications de CAPTCHA
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

  // Si un CAPTCHA est détecté
  if (captchaDetected.found) {
    console.log(`⚠️ CAPTCHA détecté sur ${engineName}:`, captchaDetected);

    // Prendre une capture d'écran du CAPTCHA
    const screenshotPath = `${engineName.toLowerCase()}-captcha.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Capture d'écran du CAPTCHA sauvegardée: ${screenshotPath}`);

    // Configurer le navigateur pour être visible (non-headless)
    console.log(
      `🔄 Rechargement de la page en mode visible pour résolution manuelle...`
    );
    const context = page.browser().defaultBrowserContext();

    // Ouvrir une nouvelle page visible pour l'intervention de l'utilisateur
    const browser = await puppeteer.launch({
      headless: false, // Mode non-headless pour permettre l'interaction
      args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
    });

    const visiblePage = await browser.newPage();
    await visiblePage.setViewport({ width: 1280, height: 800 });

    // Aller sur la même URL
    const currentUrl = page.url();
    await visiblePage.goto(currentUrl, { waitUntil: "domcontentloaded" });

    // Afficher un message à l'utilisateur
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
        CAPTCHA détecté! Veuillez résoudre le CAPTCHA ci-dessus.<br>
        Une fois résolu, cliquez sur le bouton ci-dessous pour continuer la recherche.<br>
        <button id="captcha-solved" style="
          background-color: #ff7f00;
          color: white;
          padding: 8px 16px;
          margin-top: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">J'ai résolu le CAPTCHA</button>
      `;
      document.body.appendChild(div);

      // Ajouter un gestionnaire d'événements pour le bouton
      document
        .getElementById("captcha-solved")
        .addEventListener("click", () => {
          div.style.backgroundColor = "rgba(0, 128, 0, 0.8)";
          div.innerHTML = "Merci! La recherche va continuer...";
          setTimeout(() => {
            window.close();
          }, 2000);
        });
    });

    // Attendre que l'utilisateur résolve le CAPTCHA et ferme la fenêtre
    console.log(
      `⏳ En attente de la résolution du CAPTCHA par l'utilisateur...`
    );
    await new Promise((resolve) => {
      browser.on("disconnected", resolve);
    });

    console.log(`✅ CAPTCHA résolu par l'utilisateur!`);

    // Continuer avec la page originale
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
