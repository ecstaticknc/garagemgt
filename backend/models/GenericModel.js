// models/GenericModel.js (Example - adjust based on your actual GenericModel implementation)
const db = require('../config/db'); // Your database connection pool

class GenericModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findAll() {
    const [rows] = await db.execute(`SELECT * FROM ${this.tableName}`);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    return rows[0];
  }

  // --- NEW METHOD FOR FILTERING ---
  async findByColumn(columnName, value) {
    const [rows] = await db.execute(`SELECT * FROM ${this.tableName} WHERE ${columnName} = ?`, [value]);
    return rows;
  }

  async create(data) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).fill('?').join(', ');
    const values = Object.values(data);
    const [result] = await db.execute(
      `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`,
      values
    );
    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    const [result] = await db.execute(
      `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
      values
    );
    return result; // contains affectedRows
  }

  async delete(id) {
    const [result] = await db.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return result; // contains affectedRows
  }
}

module.exports = GenericModel;