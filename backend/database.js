const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/visits.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salesperson_name TEXT NOT NULL,
      client_name TEXT NOT NULL,
      visit_date TEXT NOT NULL,
      purpose TEXT NOT NULL
    )
  `);
});

module.exports = db;