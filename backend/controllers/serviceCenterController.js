// controllers/serviceCenterController.js
const createGenericController = require('./genericController');
const GenericModel = require('../models/GenericModel');
const db = require('../config/db'); // This should be your mysql2 pool
// const bcrypt = require('bcrypt'); // REMOVED: bcrypt import

const serviceCenterModel = new GenericModel('servicecenters');

const serviceCenterRequiredFields = [
    'serviceCenterName',
    'proprietorMobile',
    'proprietorName',
    'proprietorEmail',
    'serviceCenterAddress'
];

const genericServiceCenterController = createGenericController(serviceCenterModel, serviceCenterRequiredFields);

// Define a default password and role for newly created users associated with a service center
const DEFAULT_USER_PASSWORD = 'password123'; // IMPORTANT: Use a strong, hashed password in production!
const DEFAULT_USER_ROLE = 'service_center_user'; // Set a default role for new service center users

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

            console.log('Transaction started for service center creation...');

            // 1. Create the new service center entry
            const [serviceCenterResult] = await connection.execute(
                'INSERT INTO servicecenters (serviceCenterName, proprietorMobile, proprietorName, proprietorEmail, serviceCenterAddress) VALUES (?, ?, ?, ?, ?)',
                [
                    newServiceCenterData.serviceCenterName,
                    newServiceCenterData.proprietorMobile,
                    newServiceCenterData.proprietorName,
                    newServiceCenterData.proprietorEmail,
                    newServiceCenterData.serviceCenterAddress
                ]
            );

            const newServiceCenterId = serviceCenterResult.insertId;
            console.log(`Service Center created with ID: ${newServiceCenterId}`);

            try {
                // 2. Create a default user for the new service center
                //    Ensure the 'role' column is included in the INSERT statement
                const proprietorMobile = newServiceCenterData.proprietorMobile;
                const [userResult] = await connection.execute(
                    'INSERT INTO users (username, password, scId, role) VALUES (?, ?, ?, ?)', // Added 'role' column
                    [proprietorMobile, DEFAULT_USER_PASSWORD, newServiceCenterId, DEFAULT_USER_ROLE] // Added DEFAULT_USER_ROLE
                );
                console.log(`Default user created with ID: ${userResult.insertId} for SC ID: ${newServiceCenterId}`);

                await connection.commit(); // Commit the transaction if both operations succeed
                console.log('Transaction committed successfully.');

                res.status(201).json({
                    msg: 'Service center and default user created successfully!',
                    serviceCenterId: newServiceCenterId,
                    defaultUsername: proprietorMobile,
                    // WARNING: Sending defaultPassword in production responses is a major security risk.
                    defaultPassword: DEFAULT_USER_PASSWORD // Included for debugging/testing as requested
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
    // ... other genericServiceCenterController methods (getAll, getById, update, delete) ...
};

module.exports = serviceCenterController;
