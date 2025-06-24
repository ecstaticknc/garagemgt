// routes/apiRoutes.js
const express = require("express");
const router = express.Router();

// Import and use the auth routes within this main router
const authRoutes = require("./authRoute");
router.use(authRoutes);

const GenericModel = require("../models/GenericModel");
const createGenericController = require("../controllers/genericController");
const serviceHistoryController = require("../controllers/serviceHistoryController");
const serviceCenterController = require("../controllers/serviceCenterController");
const reminderLogController = require("../controllers/reminderLogController");

// --- Define your resources and their required fields for creation ---
const customerModel = new GenericModel("customers");
const customerController = createGenericController(customerModel, [
  "customerName",
  "mobile",
]);

// --- Route Definitions ---

// Customers Routes
router.use(
  "/customers",
  (() => {
    const customerRouter = express.Router();
    customerRouter.get("/", customerController.getAll);
    customerRouter.get("/by-sc", customerController.getByScId);
    customerRouter.get("/:id", customerController.getById);
    customerRouter.post("/", customerController.create);
    customerRouter.put("/:id", customerController.update);
    customerRouter.delete("/:id", customerController.delete);

    return customerRouter;
  })()
);

// Service Centers Routes
router.use(
  "/servicecenters",
  (() => {
    const serviceCenterRouter = express.Router();
    serviceCenterRouter.get("/", serviceCenterController.getAll);
    serviceCenterRouter.get("/:id", serviceCenterController.getById);
    console.log("Attempting to hit POST /servicecenters route handler");
    serviceCenterRouter.post("/", serviceCenterController.create);
    serviceCenterRouter.put("/:id", serviceCenterController.update);
    serviceCenterRouter.delete("/:id", serviceCenterController.delete);
    return serviceCenterRouter;
  })()
);

// Service History Routes
router.use(
  "/servicehistory",
  (() => {
    const serviceHistoryRouter = express.Router();
    serviceHistoryRouter.get("/", serviceHistoryController.getAll);

    // ====================== THE FIX IS HERE ======================
    // Static routes MUST be defined before dynamic (parameterized) routes.
    serviceHistoryRouter.get(
      "/byServiceCenter",
      serviceHistoryController.getServiceHistoryByScId
    );

    // The /:id route is now AFTER /byServiceCenter
    serviceHistoryRouter.get("/:id", serviceHistoryController.getById);
    // =============================================================

    serviceHistoryRouter.post("/", serviceHistoryController.create);
    serviceHistoryRouter.put("/:id", serviceHistoryController.update);
    serviceHistoryRouter.delete("/:id", serviceHistoryController.delete);
    return serviceHistoryRouter;
  })()
);

// NEW: Reminder Logs Routes
router.use(
  "/reminderlogs",
  (() => {
    const reminderLogRouter = express.Router();
    reminderLogRouter.post("/", reminderLogController.create);
    reminderLogRouter.get("/", reminderLogController.getAll); // Get all reminder logs (might be too much data)
    reminderLogRouter.get(
      "/customer/:customerId",
      reminderLogController.getRemindersByCustomer
    ); // Get logs for a specific customer
    reminderLogRouter.get(
      "/servicecenter/:serviceCenterId",
      reminderLogController.getRemindersByServiceCenter
    ); // Get logs for a specific service center
    return reminderLogRouter;
  })()
);

module.exports = router;
