// models/GenericModel.js
const db = require('../config/db');

class GenericModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = Array(fields.length).fill('?').join(', ');
    const query = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await db.execute(query, values);
    return { id: result.insertId, ...data };
  }

  async findAll() {
    const query = `SELECT * FROM ${this.tableName}`;
    const [rows] = await db.execute(query);
    return rows;
  }

  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const [result] = await db.execute(query, [...values, id]);
    return { affectedRows: result.affectedRows };
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return { affectedRows: result.affectedRows };
  }

  // --- Specific queries not covered by generic CRUD ---
  // You can still add specific queries here if needed,
  // or define them in a 'specific' model if the generic one becomes too cluttered.
  // For example, if 'customers' needed a `findByMobile` or `findByName`
  // that's not just a generic ID lookup.
}

module.exports = GenericModel;