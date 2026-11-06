const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all employees
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT e.*, 
             COALESCE(s.basic_salary, 0) AS basic_salary, 
             COALESCE(s.net_salary, 0) AS net_salary
      FROM employees e
      LEFT JOIN salary_details s ON e.id = s.employee_id
      ORDER BY e.id DESC
    `;
    const rows = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single employee by id
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT e.*, 
             s.basic_salary, s.hra, s.medical_allowance, s.special_allowance,
             s.pf_deduction, s.tax_deduction, s.other_deductions, s.net_salary
      FROM employees e
      LEFT JOIN salary_details s ON e.id = s.employee_id
      WHERE e.id = ?
    `;
    const rows = await db.query(sql, [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new employee
router.post('/', async (req, res) => {
  try {
    const { emp_code, first_name, last_name, email, phone, department, designation, joining_date, status } = req.body;
    
    if (!emp_code || !first_name || !last_name || !email || !department || !designation || !joining_date) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const sql = `
      INSERT INTO employees (emp_code, first_name, last_name, email, phone, department, designation, joining_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.query(sql, [
      emp_code, first_name, last_name, email, phone || '', department, designation, joining_date, status || 'Active'
    ]);

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      data: { id: result.insertId, emp_code, first_name, last_name }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const { emp_code, first_name, last_name, email, phone, department, designation, joining_date, status } = req.body;
    const empId = req.params.id;

    const sql = `
      UPDATE employees
      SET emp_code = ?, first_name = ?, last_name = ?, email = ?, phone = ?, department = ?, designation = ?, joining_date = ?, status = ?
      WHERE id = ?
    `;
    await db.query(sql, [
      emp_code, first_name, last_name, email, phone || '', department, designation, joining_date, status || 'Active', empId
    ]);

    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const sql = `DELETE FROM employees WHERE id = ?`;
    await db.query(sql, [req.params.id]);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
