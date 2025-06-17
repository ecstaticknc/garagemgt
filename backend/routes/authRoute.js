// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/login', async (req, res) => {
  //console.log("req", req);
  //console.log("res", res);

  const { username, password } = req.body;

  console.log("username", username);
  console.log("password", password);

  // --- ADD THESE CONSOLE LOGS ---
//   console.log('----------------------------------------------------');
//   console.log('Backend received login request:');
//   console.log('  Username (from frontend):', username);
//   console.log('  Password (from frontend - CAUTION: Do not log in production!):', password);
//   console.log('----------------------------------------------------');

  try {
    const [rows] = await db.execute('SELECT id, username, password, scId FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      //console.log(`Backend Debug: User '${username}' NOT found in database.`);
      return res.status(401).json({ msg: 'Invalid credentials: User not found.' });
    }

    const user = rows[0];
   // console.log(`Backend Debug: User found. Stored username: '${user.username}', Stored password: '${user.password}'`);
    //console.log(`Backend Debug: Comparing frontend password ('${password}') with stored password ('${user.password}')`);

    // IMPORTANT: In production, use bcrypt.compare(password, user.password) for hashed passwords
    if (password !== user.password) {
    //  console.log('Backend Debug: Password mismatch!');
      return res.status(401).json({ msg: 'Invalid credentials: Incorrect password.' });
    }

    console.log(`Backend Debug: Login successful for user '${user.username}'`);
    res.status(200).json({
      msg: 'Login successful!',
      data: {
        id: user.id,
        username: user.username,
        scId: user.scId,
      }
    });

  } catch (error) {
    console.error('Backend Debug: Error during login process:', error);
    res.status(500).json({ msg: 'Server error during login', error: error.message });
  }
});

module.exports = router;