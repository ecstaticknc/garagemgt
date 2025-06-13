// controllers/genericController.js

/**
 * Creates a generic controller for CRUD operations on a given model.
 * @param {object} modelInstance - An instance of GenericModel (e.g., new GenericModel('customers'))
 * @param {string[]} requiredFields - An array of field names that must be present in the request body for creation.
 */
const createGenericController = (modelInstance, requiredFields = []) => {
  return {
    getAll: async (req, res) => {
      try {
        const data = await modelInstance.findAll();
        res.json({ msg: `${modelInstance.tableName} List`, data });
      } catch (error) {
        console.error(`Error fetching ${modelInstance.tableName}:`, error);
        res.status(500).json({ msg: `Server Error fetching ${modelInstance.tableName}`, error: error.message });
      }
    },

    getById: async (req, res) => {
      try {
        const { id } = req.params;
        const item = await modelInstance.findById(id);
        if (!item) {
          return res.status(404).json({ msg: `${modelInstance.tableName} not found.` });
        }
        res.json({ msg: `${modelInstance.tableName} found`, data: item });
      } catch (error) {
        console.error(`Error fetching ${modelInstance.tableName} by ID:`, error);
        res.status(500).json({ msg: `Server Error fetching ${modelInstance.tableName} by ID`, error: error.message });
      }
    },

    create: async (req, res) => {
      try {
        const newData = req.body;

        // Validate required fields
        const missingFields = requiredFields.filter(field => !(field in newData));
        if (missingFields.length > 0) {
          return res.status(400).json({ msg: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const createdItem = await modelInstance.create(newData);
        res.status(201).json({ msg: `${modelInstance.tableName} created successfully`, data: createdItem });
      } catch (error) {
        console.error(`Error creating ${modelInstance.tableName}:`, error);
        res.status(500).json({ msg: `Server Error creating ${modelInstance.tableName}`, error: error.message });
      }
    },

    update: async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ msg: 'No update fields provided.' });
        }

        const result = await modelInstance.update(id, updateData);

        if (result.affectedRows === 0) {
          return res.status(404).json({ msg: `${modelInstance.tableName} not found or no changes made.` });
        }
        res.json({ msg: `${modelInstance.tableName} updated successfully`, data: { id: id, ...updateData } });
      } catch (error) {
        console.error(`Error updating ${modelInstance.tableName}:`, error);
        res.status(500).json({ msg: `Server Error updating ${modelInstance.tableName}`, error: error.message });
      }
    },

    delete: async (req, res) => {
      try {
        const { id } = req.params;
        const result = await modelInstance.delete(id);
        if (result.affectedRows === 0) {
          return res.status(404).json({ msg: `${modelInstance.tableName} not found.` });
        }
        res.json({ msg: `${modelInstance.tableName} deleted successfully` });
      } catch (error) {
        console.error(`Error deleting ${modelInstance.tableName}:`, error);
        res.status(500).json({ msg: `Server Error deleting ${modelInstance.tableName}`, error: error.message });
      }
    },
  };
};

module.exports = createGenericController;