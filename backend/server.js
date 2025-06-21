// server.js
require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

const db = require("./config/db"); // Import the database connection pool
const apiRoutes = require("./routes/apiRoutes"); // Import the single API routes file
// const authRoutes = require("./routes/authRoute"); // <<--- THIS LINE IS NO LONGER NEEDED

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for home page
app.get("/", (req, res) => {
  res.send("Welcome to the Generic AutoGarage Bike Service Center Backend!");
});
app.get("/test", (req, res) => {
  res.send("Test Succsess ");
});
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] INCOMING REQUEST: ${req.method} ${
      req.originalUrl
    }`
  );
  next();
});
// Use the consolidated API routes
app.use("/api", apiRoutes); // All routes will be prefixed with /api and are handled by apiRoutes.js

// app.use("/api", authRoutes); // <<--- THIS CONFLICTING LINE HAS BEEN REMOVED

// Test DB connection
db.getConnection()
  .then((connection) => {
    console.log("MySQL database pool connected successfully to autogarage!");
    connection.release();
  })
  .catch((err) => {
    console.error("MySQL database connection error:", err.message);
    process.exit(1);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Generic AutoGarage Backend Server running on port ${PORT}`);
});
