const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

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
          resolve();
        }
      );
    });
  });
}

function saveSearch(query) {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO searches (query) VALUES (?)", [query], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
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
      SELECT s.id, s.query, s.date, COUNT(r.id) as resultCount
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
      SELECT r.*, s.query
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

module.exports = {
  initDatabase,
  saveSearch,
  saveResult,
  getSearchHistory,
  getSearchResults,
};
