// server.js
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

const db = require('./config/db'); // Import the database connection pool
const apiRoutes = require('./routes/apiRoutes'); // Import the single API routes file
const authRoutes = require('./routes/authRoute');

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for home page
app.get('/', (req, res) => {
  res.send('Welcome to the Generic AutoGarage Bike Service Center Backend!');
});

// Use the consolidated API routes
app.use('/api', apiRoutes); // All routes will be prefixed with /api/resourceName

app.use('/api', authRoutes);

// Test DB connection
db.getConnection()
  .then(connection => {
    console.log('MySQL database pool connected successfully to autogarage!');
    connection.release();
  })
  .catch(err => {
    console.error('MySQL database connection error:', err.message);
    process.exit(1);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Generic AutoGarage Backend Server running on port ${PORT}`);
});