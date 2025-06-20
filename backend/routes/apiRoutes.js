// routes/apiRoutes.js
const express = require('express');
const router = express.Router();

const GenericModel = require('../models/GenericModel'); //
const createGenericController = require('../controllers/genericController'); //
const serviceHistoryController = require('../controllers/serviceHistoryController');

// --- IMPORTANT CHANGE HERE ---
// REMOVE THIS LINE:
// const serviceCenterModel = new GenericModel('servicecenters');
// const serviceCenterController = createGenericController(serviceCenterModel, ['serviceCenterName', 'proprietorName', 'proprietorMobile']);

// INSTEAD, ADD THIS LINE to import your custom controller:
const serviceCenterController = require('../controllers/serviceCenterController'); // <-- THIS IS THE CORRECT IMPORT

// --- Define your resources and their required fields for creation ---
const customerModel = new GenericModel('customers'); //
const customerController = createGenericController(customerModel, ['customerName', 'mobile']);

//const serviceHistoryModel = new GenericModel('servicehistory'); //
//const serviceHistoryController = createGenericController(serviceHistoryModel, ['selectedBike', 'selectedServices', 'serviceDate', 'customerId']);


// --- Route Definitions ---

// Customers Routes
router.use('/customers', (() => {
  const customerRouter = express.Router();
  customerRouter.get('/', customerController.getAll);
  customerRouter.get('/by-sc', customerController.getByScId);
  customerRouter.get('/:id', customerController.getById);
  customerRouter.post('/', customerController.create);
  customerRouter.put('/:id', customerController.update);
  customerRouter.delete('/:id', customerController.delete);
  
  return customerRouter;
})());

// Service Centers Routes
router.use('/servicecenters', (() => {
  const serviceCenterRouter = express.Router();
  serviceCenterRouter.get('/', serviceCenterController.getAll);
  serviceCenterRouter.get('/:id', serviceCenterController.getById);
  // This line will now correctly call the 'create' method from your custom serviceCenterController
  console.log('Attempting to hit POST /servicecenters route handler');
  serviceCenterRouter.post('/', serviceCenterController.create);
  serviceCenterRouter.put('/:id', serviceCenterController.update);
  serviceCenterRouter.delete('/:id', serviceCenterRouter.delete);
  return serviceCenterRouter;
})());

// Service History Routes
router.use('/servicehistory', (() => {
  const serviceHistoryRouter = express.Router();
  serviceHistoryRouter.get('/', serviceHistoryController.getAll);
  serviceHistoryRouter.get('/:id', serviceHistoryController.getById);
  console.log("Registering GET /servicehistory/byServiceCenter");
  serviceHistoryRouter.get('/byServiceCenter', serviceHistoryController.getServiceHistoryByScId);
  //serviceHistoryRouter.get('/byCustomerAndSC', serviceHistoryController.getServiceHistoryByCustomerAndSC);
  serviceHistoryRouter.post('/', serviceHistoryController.create);
  serviceHistoryRouter.put('/:id', serviceHistoryController.update);
  serviceHistoryRouter.delete('/:id', serviceHistoryRouter.delete);
  return serviceHistoryRouter;
})());

module.exports = router;