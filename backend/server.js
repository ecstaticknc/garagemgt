const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Create a visit
app.post('/visits', (req, res) => {
  const { salesperson_name, client_name, visit_date, purpose } = req.body;
  const sql = `INSERT INTO visits (salesperson_name, client_name, visit_date, purpose) VALUES (?, ?, ?, ?)`;
  db.run(sql, [salesperson_name, client_name, visit_date, purpose], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

// Get all visits
app.get('/visits', (req, res) => {
  const sql = `SELECT * FROM visits`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});