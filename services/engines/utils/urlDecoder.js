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

module.exports = {
  decodeDuckDuckGoUrl,
  decodeBaiduUrl,
  decodeBingUrl,
};
