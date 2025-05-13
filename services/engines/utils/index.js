/**
 * Index file that combines and exports all utility functions
 */

const { getBrowser, setupRandomScreenSize } = require("./browserSetup");
const { setupBrowserAntiDetection } = require("./antiDetection");
const { getUserAgent } = require("./userAgents");
const {
  decodeDuckDuckGoUrl,
  decodeBaiduUrl,
  decodeBingUrl,
} = require("./urlDecoder");
const { randomDelay, humanScroll } = require("./humanBehavior");
const { handleCaptcha } = require("./captchaHandler");

// Export all utility functions
module.exports = {
  // Browser setup
  getBrowser,
  setupRandomScreenSize,

  // Anti-detection
  setupBrowserAntiDetection,

  // User agents
  getUserAgent,

  // URL decoders
  decodeDuckDuckGoUrl,
  decodeBaiduUrl,
  decodeBingUrl,

  // Human behavior simulation
  randomDelay,
  humanScroll,

  // CAPTCHA handling
  handleCaptcha,
};
