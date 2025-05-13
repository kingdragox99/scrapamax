const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

/**
 * Initialize the database and apply necessary migrations
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create table to store searches
      db.run(
        `CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
        (err) => {
          if (err) {
            reject(err);
            return;
          }
        }
      );

      // Create table to store results
      db.run(
        `CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        search_id INTEGER,
        engine TEXT NOT NULL,
        title TEXT,
        url TEXT,
        description TEXT,
        FOREIGN KEY (search_id) REFERENCES searches(id)
      )`,
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Apply migrations to add new columns
          migrateDatabase()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        }
      );
    });
  });
}

/**
 * Check and add missing columns in the database
 */
function migrateDatabase() {
  return new Promise((resolve, reject) => {
    // Check if columns already exist
    db.get("PRAGMA table_info(searches)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Execute migrations in a transaction
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Add engines column if it doesn't exist
        db.run(
          "ALTER TABLE searches ADD COLUMN engines TEXT DEFAULT 'google,bing,duckduckgo,yandex,ecosia,brave,baidu'",
          (err) => {
            // Ignore error if column already exists
            console.log("Migration: adding engines column");

            // Add region column if it doesn't exist
            db.run(
              "ALTER TABLE searches ADD COLUMN region TEXT DEFAULT 'global'",
              (err) => {
                // Ignore error if column already exists
                console.log("Migration: adding region column");

                // Add language column if it doesn't exist
                db.run(
                  "ALTER TABLE searches ADD COLUMN language TEXT DEFAULT 'auto'",
                  (err) => {
                    // Ignore error if column already exists
                    console.log("Migration: adding language column");

                    // Finish the transaction
                    db.run("COMMIT", (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                        return;
                      }
                      console.log("✅ Database migration successful");
                      resolve();
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

function saveSearch(query, options = {}) {
  const {
    engines = "google,bing,duckduckgo,yandex,ecosia,brave,baidu",
    region = "global",
    language = "auto",
  } = options;

  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO searches (query, engines, region, language) VALUES (?, ?, ?, ?)",
      [query, engines, region, language],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

function saveResult(searchId, engine, title, url, description) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO results (search_id, engine, title, url, description) VALUES (?, ?, ?, ?, ?)",
      [searchId, engine, title, url, description],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );
  });
}

function getSearchHistory() {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT s.id, s.query, s.engines, s.region, s.language, s.date, COUNT(r.id) as resultCount
      FROM searches s
      LEFT JOIN results r ON s.id = r.search_id
      GROUP BY s.id
      ORDER BY s.date DESC
    `,
      [],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      }
    );
  });
}

function getSearchResults(searchId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT r.*, s.query, s.engines, s.region, s.language
      FROM results r
      JOIN searches s ON r.search_id = s.id
      WHERE r.search_id = ?
      ORDER BY r.engine
    `,
      [searchId],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      }
    );
  });
}

function deleteSearch(searchId) {
  return new Promise((resolve, reject) => {
    // Start a transaction to ensure everything is deleted
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // First delete associated results (foreign key constraint)
      db.run("DELETE FROM results WHERE search_id = ?", [searchId], (err) => {
        if (err) {
          db.run("ROLLBACK");
          reject(err);
          return;
        }

        // Then delete the search
        db.run("DELETE FROM searches WHERE id = ?", [searchId], function (err) {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
            return;
          }

          db.run("COMMIT");
          resolve(this.changes); // Returns the number of rows affected
        });
      });
    });
  });
}

module.exports = {
  initDatabase,
  saveSearch,
  saveResult,
  getSearchHistory,
  getSearchResults,
  deleteSearch,
};
