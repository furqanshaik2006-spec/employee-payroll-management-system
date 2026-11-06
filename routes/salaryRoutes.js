const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all salary details with employee info
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT s.*, e.emp_code, e.first_name, e.last_name, e.department, e.designation
      FROM salary_details s
      JOIN employees e ON s.employee_id = e.id
      ORDER BY s.id DESC
    `;
    const rows = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET salary details for specific employee
router.get('/:employee_id', async (req, res) => {
  try {
    const sql = `
      SELECT s.*, e.emp_code, e.first_name, e.last_name, e.department, e.designation
      FROM salary_details s
      JOIN employees e ON s.employee_id = e.id
      WHERE s.employee_id = ?
    `;
    const rows = await db.query(sql, [req.params.employee_id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Salary structure not defined for this employee' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST or PUT upsert salary details
router.post('/', async (req, res) => {
  try {
    const {
      employee_id,
      basic_salary,
      hra,
      medical_allowance,
      special_allowance,
      pf_deduction,
      tax_deduction,
      other_deductions
    } = req.body;

    if (!employee_id || basic_salary === undefined) {
      return res.status(400).json({ success: false, message: 'Employee ID and Basic Salary are required' });
    }

    const bSalary = parseFloat(basic_salary) || 0;
    const h = parseFloat(hra) || 0;
    const med = parseFloat(medical_allowance) || 0;
    const spec = parseFloat(special_allowance) || 0;
    const pf = parseFloat(pf_deduction) || 0;
    const tax = parseFloat(tax_deduction) || 0;
    const other = parseFloat(other_deductions) || 0;

    const totalAllowances = h + med + spec;
    const totalDeductions = pf + tax + other;
    const netSalary = Math.max(0, bSalary + totalAllowances - totalDeductions);

    const sql = `
      INSERT INTO salary_details (
        employee_id, basic_salary, hra, medical_allowance, special_allowance,
        pf_deduction, tax_deduction, other_deductions, net_salary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        basic_salary = VALUES(basic_salary),
        hra = VALUES(hra),
        medical_allowance = VALUES(medical_allowance),
        special_allowance = VALUES(special_allowance),
        pf_deduction = VALUES(pf_deduction),
        tax_deduction = VALUES(tax_deduction),
        other_deductions = VALUES(other_deductions),
        net_salary = VALUES(net_salary)
    `;

    await db.query(sql, [
      employee_id, bSalary, h, med, spec, pf, tax, other, netSalary
    ]);

    res.json({
      success: true,
      message: 'Salary details saved successfully',
      data: {
        employee_id,
        basic_salary: bSalary,
        total_allowances: totalAllowances,
        total_deductions: totalDeductions,
        net_salary: netSalary
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
