# Scrapamax

Scrapamax is a web application that allows you to search for a word or username across multiple search engines simultaneously and display the results in a unified interface.

## Features

- Advanced search on Google, Bing, DuckDuckGo, Yandex, Ecosia, Brave and Baidu
- Anti-detection technique with headless browsing
- Intelligent CAPTCHA management with automatic detection
- Support for Yandex SmartCaptcha
- Result scoring system (from 1.0 to 5.0) based on presence across different engines
- User agent customization based on region and language
- Modern user interface with improved contrast
- Filtering results by search engine
- Search history with ability to review previous results
- Multilingual support

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Chromium/Chrome (automatically installed with Puppeteer)

## Installation

1. Clone this repository:

```
git clone https://github.com/your-username/scrapamax.git
cd scrapamax
```

2. Install dependencies:

```
npm install
```

3. Start the application:

```
npm start
```

The application will be accessible at http://localhost:3000

## Development

To run the application in development mode (with automatic reloading):

```
npm run dev
```

## Project Structure

- `index.js` - Application entry point
- `database.js` - SQLite database management
- `scoring.js` - Result scoring module
- `routes/` - API route definitions
- `services/engines/` - Search engine-specific modules
- `public/` - Static files (CSS, JavaScript)
- `views/` - EJS templates for page rendering
- `locales/` - Translation files for internationalization

## Technical Details

This application uses several advanced techniques to retrieve search engine results:

- **Puppeteer** - Automated browsing with a headless browser
- **Puppeteer-extra and Stealth plugin** - Avoids detection of automated browsers
- **Custom User-Agent** - Adapts the User-Agent header according to region and language
- **CAPTCHA detection** - User interaction to solve CAPTCHAs
- **Random delays and pauses** - Simulates human behavior
- **Page interactions** - Management of popups, scrolling, and other actions
- **Cookie banner bypass** - Automatically accepts cookies
- **URL normalization** - Removal of tracking parameters for result deduplication
- **Intelligent scoring** - Evaluation of results based on their presence across different engines

These techniques allow the retrieval of results even from engines that normally block traditional scraping.

## Recent Improvements

- Fixed errors in search result processing
- Improved interface contrast and readability
- Repositioned CAPTCHA notification to avoid overlap
- Updated selectors to adapt to changes in search engines' HTML structures
- Optimized the result scoring system
- Extended support to Brave and Baidu

## Limitations and Considerations

- Sites may modify their HTML structures, which could break the CSS selectors used for extraction
- Result extraction can be slow (5-15 seconds per engine) as it simulates a complete browser
- Some engines may still detect and block access despite anti-detection techniques
- Intensive use may result in temporary IP restrictions

## License

This project is under the MIT license.

---

_Note: This application is designed for educational purposes. Please respect the terms of use of search engines and use this application responsibly and ethically xoxo._
