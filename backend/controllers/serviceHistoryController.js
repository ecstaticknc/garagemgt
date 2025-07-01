// controllers/serviceHistoryController.js
const db = require("../config/db");
const GenericModel = require("../models/GenericModel");
const createGenericController = require("./genericController");

const serviceHistoryModel = new GenericModel("servicehistory");

const serviceHistoryRequiredFields = [
  "selectedBike",
  "selectedServices",
  "serviceDate",
  "customerId",
  "lastKM"
];

const genericServiceHistoryController = createGenericController(
  serviceHistoryModel,
  serviceHistoryRequiredFields
);

const serviceHistoryController = {
  ...genericServiceHistoryController,

  // Corrected method definition syntax
  getServiceHistoryByScId: async (req, res) => {
    console.log("in controller");
    try {
      const { scId } = req.query;

      if (!scId) {
        return res.status(400).json({ msg: "scId is required" });
      }

      const query = `
                SELECT 
                    c.id AS customer_id,
                    c.customerName,
                    c.mobile,
                    c.vehicles,
                    sh.id AS service_history_id,
                    sh.selectedBike,
                    sh.selectedServices,
                    sh.serviceDate,
                    sh.serviceRemark,
                    sh.lastKM
                FROM 
                    customers c
                LEFT JOIN 
                    servicehistory sh ON c.id = sh.customerId
                WHERE 
                    c.scId = ?
                ORDER BY 
                    c.customerName, sh.serviceDate DESC
            `;

      const [rows] = await db.execute(query, [scId]);

      const groupedData = rows.reduce((acc, row) => {
        if (!acc[row.customer_id]) {
          acc[row.customer_id] = {
            customerId: row.customer_id,
            customerName: row.customerName,
            mobile: row.mobile,
            vehicles: row.vehicles,
            serviceHistory: [],
          };
        }

        if (row.service_history_id) {
          acc[row.customer_id].serviceHistory.push({
            id: row.service_history_id,
            selectedBike: row.selectedBike,
            selectedServices: row.selectedServices,
            serviceDate: row.serviceDate,
            serviceRemark: row.serviceRemark,
            lastKM: row.lastKM,
          });
        }

        return acc;
      }, {});

      res.json({
        msg: "Customers with service history for Service Center",
        data: Object.values(groupedData),
      });
    } catch (error) {
      console.error("Error fetching service history by SC:", error);
      res.status(500).json({ msg: "Server Error", error: error.message });
    }
  },
};

module.exports = serviceHistoryController;
