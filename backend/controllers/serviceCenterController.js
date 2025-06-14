// controllers/serviceCenterController.js
const createGenericController = require('./genericController');
const GenericModel = require('../models/GenericModel');
const db = require('../config/db'); // This should be your mysql2 pool
const bcrypt = require('bcrypt'); // Import bcrypt

const serviceCenterModel = new GenericModel('servicecenters');

const serviceCenterRequiredFields = [
  'serviceCenterName',
  'proprietorMobile',
  'proprietorName',
  'proprietorEmail',
  'serviceCenterAddress'
];

const genericServiceCenterController = createGenericController(serviceCenterModel, serviceCenterRequiredFields);

const serviceCenterController = {
  ...genericServiceCenterController,

  create: async (req, res) => {
    let connection; // Declare connection variable here
    try {
      const newServiceCenterData = req.body;

      const missingFields = serviceCenterRequiredFields.filter(field => !(field in newServiceCenterData));
      if (missingFields.length > 0) {
        return res.status(400).json({ msg: `Missing required fields: ${missingFields.join(', ')}` });
      }

      // --- Acquire a connection from the pool and start transaction ---
      connection = await db.getConnection(); // Get a connection from the pool
      await connection.beginTransaction(); // Start the transaction on the acquired connection

      console.log('Transaction started.'); // Confirm transaction initiated

      let createdServiceCenter;
      try {
        // 1. Create the Service Center using the generic model's create method
        const serviceCenterFields = Object.keys(newServiceCenterData);
        const serviceCenterValues = Object.values(newServiceCenterData);
        const serviceCenterPlaceholders = Array(serviceCenterFields.length).fill('?').join(', ');
        const insertServiceCenterQuery = `INSERT INTO servicecenters (${serviceCenterFields.join(', ')}) VALUES (${serviceCenterPlaceholders})`;
        const [serviceCenterResult] = await connection.execute(insertServiceCenterQuery, serviceCenterValues); // Use connection.execute

        createdServiceCenter = { id: serviceCenterResult.insertId, ...newServiceCenterData };
        console.log(`Service Center created with ID: ${createdServiceCenter.id}`);

      } catch (err) {
        await connection.rollback(); // Rollback if service center creation fails
        console.error('Error creating service center during transaction (rolled back):', err);
        if (err.code === 'ER_DUP_ENTRY') {
          if (err.sqlMessage.includes('proprietorMobile')) { // Check the SQL error message for details
            return res.status(409).json({ msg: 'A service center with this mobile number already exists.' });
          } else if (err.sqlMessage.includes('proprietorEmail')) { // Assuming proprietorEmail is also unique
            return res.status(409).json({ msg: 'A service center with this email already exists.' });
          }
        }
        return res.status(500).json({ msg: `Failed to register service center: ${err.message}` });
      }

      const newServiceCenterId = createdServiceCenter.id;
      const proprietorMobile = newServiceCenterData.proprietorMobile;

      // --- HASH THE DEFAULT PASSWORD ---
      const DEFAULT_USER_PASSWORD = '1234';
      const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10); // Hash the password with 10 salt rounds
      console.log('Default password hashed.');

      try {
        console.log("In user creation step.");
        // 2. Create a default user for this service center with the HASHED password
        const insertUserQuery = `
          INSERT INTO users (username, password, scId, firstLoginDone)
          VALUES (?, ?, ?, 0);
        `;
        const [userResult] = await connection.execute(insertUserQuery, [proprietorMobile, hashedPassword, newServiceCenterId]); // Use hashed password
        console.log("User created result:", userResult);

        await connection.commit(); // Commit transaction if both successful
        console.log('Transaction committed successfully.');

        console.log(`Service Center (ID: ${newServiceCenterId}) registered and default user created.`);
        res.status(201).json({
          msg: 'Service Center registered and default user created successfully!',
          serviceCenterId: newServiceCenterId,
          defaultUsername: proprietorMobile,
          // DO NOT send defaultPassword in production responses.
          // For development/testing, it's ok, but comment out for live systems.
          // defaultPassword: DEFAULT_USER_PASSWORD
        });

      } catch (userErr) {
        await connection.rollback(); // Rollback if user creation fails
        console.error('Error creating default user for service center during transaction (rolled back):', userErr);
        // Add specific error handling for user creation (e.g., duplicate username)
        if (userErr.code === 'ER_DUP_ENTRY' && userErr.sqlMessage.includes('username')) {
          return res.status(409).json({ msg: 'A user with this mobile number (username) already exists.' });
        }
        res.status(500).json({ msg: 'Service center registration failed: could not create default user.', error: userErr.message });
      }

    } catch (error) {
      console.error('Unhandled error in serviceCenterController.create:', error);
      res.status(500).json({ msg: `Server Error creating service center: ${error.message}` });
    } finally {
      if (connection) {
        connection.release(); // Always release the connection back to the pool
        console.log('Connection released.');
      }
    }
  },
};

module.exports = serviceCenterController;