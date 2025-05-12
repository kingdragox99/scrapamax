const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

/**
 * Initialise la base de données et applique les migrations nécessaires
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Création de la table pour stocker les recherches
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

      // Création de la table pour stocker les résultats
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

          // Appliquer les migrations pour ajouter les nouvelles colonnes
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
 * Vérifie et ajoute les colonnes manquantes dans la base de données
 */
function migrateDatabase() {
  return new Promise((resolve, reject) => {
    // Vérifier si les colonnes existent déjà
    db.get("PRAGMA table_info(searches)", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Exécuter les migrations dans une transaction
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Ajouter la colonne engines si elle n'existe pas
        db.run(
          "ALTER TABLE searches ADD COLUMN engines TEXT DEFAULT 'google,bing,duckduckgo,yandex,ecosia,brave,baidu'",
          (err) => {
            // Ignorer l'erreur si la colonne existe déjà
            console.log("Migration: ajout de la colonne engines");

            // Ajouter la colonne region si elle n'existe pas
            db.run(
              "ALTER TABLE searches ADD COLUMN region TEXT DEFAULT 'global'",
              (err) => {
                // Ignorer l'erreur si la colonne existe déjà
                console.log("Migration: ajout de la colonne region");

                // Ajouter la colonne language si elle n'existe pas
                db.run(
                  "ALTER TABLE searches ADD COLUMN language TEXT DEFAULT 'auto'",
                  (err) => {
                    // Ignorer l'erreur si la colonne existe déjà
                    console.log("Migration: ajout de la colonne language");

                    // Terminer la transaction
                    db.run("COMMIT", (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        reject(err);
                        return;
                      }
                      console.log("✅ Migration de la base de données réussie");
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
    // Commencer une transaction pour s'assurer que tout est supprimé
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // Supprimer d'abord les résultats associés (contrainte de clé étrangère)
      db.run("DELETE FROM results WHERE search_id = ?", [searchId], (err) => {
        if (err) {
          db.run("ROLLBACK");
          reject(err);
          return;
        }

        // Ensuite supprimer la recherche
        db.run("DELETE FROM searches WHERE id = ?", [searchId], function (err) {
          if (err) {
            db.run("ROLLBACK");
            reject(err);
            return;
          }

          db.run("COMMIT");
          resolve(this.changes); // Retourne le nombre de lignes affectées
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
