// controllers/reminderLogController.js
const GenericModel = require("../models/GenericModel");
const createGenericController = require("./genericController"); // Reusing your generic controller

const reminderLogModel = new GenericModel("reminder_logs");

// Define required fields for creating a reminder log
const reminderLogRequiredFields = [
  "customerId",
  "serviceCenterId",
  "sentVia",
  "status",
];

const reminderLogController = {
  ...createGenericController(reminderLogModel, reminderLogRequiredFields),

  // You can add custom methods here if needed,
  // but the generic create/getAll/getById/update/delete should suffice for logs.
  // For instance, a method to get all reminders for a specific customer or service center.
  getRemindersByCustomer: async (req, res) => {
    try {
      const { customerId } = req.params;
      const logs = await reminderLogModel.findByColumn(
        "customerId",
        customerId
      );
      res.json({ msg: "Reminder logs for customer", data: logs });
    } catch (error) {
      console.error(
        `Error fetching reminder logs for customer ${customerId}:`,
        error
      );
      res
        .status(500)
        .json({ msg: "Server Error fetching reminder logs", error: error.message });
    }
  },

  getRemindersByServiceCenter: async (req, res) => {
    try {
      const { serviceCenterId } = req.params;
      const logs = await reminderLogModel.findByColumn(
        "serviceCenterId",
        serviceCenterId
      );
      res.json({ msg: "Reminder logs for service center", data: logs });
    } catch (error) {
      console.error(
        `Error fetching reminder logs for service center ${serviceCenterId}:`,
        error
      );
      res
        .status(500)
        .json({ msg: "Server Error fetching reminder logs", error: error.message });
    }
  },
};

module.exports = reminderLogController;