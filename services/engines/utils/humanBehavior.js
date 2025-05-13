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

module.exports = {
  randomDelay,
  humanScroll,
};
