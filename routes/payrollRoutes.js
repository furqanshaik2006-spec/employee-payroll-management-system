const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all payroll records
router.get('/', async (req, res) => {
  try {
    const { month, year, status } = req.query;
    let sql = `
      SELECT p.*, e.emp_code, e.first_name, e.last_name, e.department, e.designation, e.email
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (month) {
      sql += ` AND p.payroll_month = ?`;
      params.push(month);
    }
    if (year) {
      sql += ` AND p.payroll_year = ?`;
      params.push(year);
    }
    if (status) {
      sql += ` AND p.payment_status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY p.payroll_year DESC, p.id DESC`;

    const rows = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single payslip details
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, 
             e.emp_code, e.first_name, e.last_name, e.email, e.phone, e.department, e.designation, e.joining_date,
             s.hra, s.medical_allowance, s.special_allowance, s.pf_deduction, s.tax_deduction, s.other_deductions
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN salary_details s ON e.id = s.employee_id
      WHERE p.id = ?
    `;
    const rows = await db.query(sql, [req.params.id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payslip record not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST generate payroll for a single employee or all active employees
router.post('/generate', async (req, res) => {
  try {
    const { employee_id, payroll_month, payroll_year, payment_method } = req.body;

    if (!payroll_month || !payroll_year) {
      return res.status(400).json({ success: false, message: 'Payroll Month and Year are required' });
    }

    // Determine target employees
    let empQuery = `
      SELECT e.id, s.basic_salary, s.hra, s.medical_allowance, s.special_allowance, 
             s.pf_deduction, s.tax_deduction, s.other_deductions, s.net_salary
      FROM employees e
      JOIN salary_details s ON e.id = s.employee_id
      WHERE e.status = 'Active'
    `;
    const empParams = [];

    if (employee_id && employee_id !== 'all') {
      empQuery += ` AND e.id = ?`;
      empParams.push(employee_id);
    }

    const employeesToProcess = await db.query(empQuery, empParams);

    if (!employeesToProcess || employeesToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees with configured salary details found to process'
      });
    }

    let processedCount = 0;
    for (const emp of employeesToProcess) {
      const basic = parseFloat(emp.basic_salary) || 0;
      const allowances = (parseFloat(emp.hra) || 0) + (parseFloat(emp.medical_allowance) || 0) + (parseFloat(emp.special_allowance) || 0);
      const deductions = (parseFloat(emp.pf_deduction) || 0) + (parseFloat(emp.tax_deduction) || 0) + (parseFloat(emp.other_deductions) || 0);
      const netPay = Math.max(0, basic + allowances - deductions);

      const insertSql = `
        INSERT INTO payroll (
          employee_id, payroll_month, payroll_year, basic_salary, 
          total_allowances, total_deductions, net_pay, payment_status, payment_method
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
        ON DUPLICATE KEY UPDATE
          basic_salary = VALUES(basic_salary),
          total_allowances = VALUES(total_allowances),
          total_deductions = VALUES(total_deductions),
          net_pay = VALUES(net_pay),
          payment_method = VALUES(payment_method)
      `;

      await db.query(insertSql, [
        emp.id,
        payroll_month,
        parseInt(payroll_year),
        basic,
        allowances,
        deductions,
        netPay,
        payment_method || 'Bank Transfer'
      ]);
      processedCount++;
    }

    res.json({
      success: true,
      message: `Successfully processed monthly payroll for ${processedCount} employee(s) for ${payroll_month} ${payroll_year}`,
      processedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update payroll payment status
router.put('/:id/status', async (req, res) => {
  try {
    const { payment_status, payment_date, payment_method } = req.body;
    const date = payment_status === 'Paid' ? (payment_date || new Date().toISOString().split('T')[0]) : null;

    const sql = `
      UPDATE payroll
      SET payment_status = ?, payment_date = ?, payment_method = COALESCE(?, payment_method)
      WHERE id = ?
    `;
    await db.query(sql, [payment_status, date, payment_method || null, req.params.id]);

    res.json({ success: true, message: 'Payroll status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE payroll record
router.delete('/:id', async (req, res) => {
  try {
    const sql = `DELETE FROM payroll WHERE id = ?`;
    await db.query(sql, [req.params.id]);
    res.json({ success: true, message: 'Payroll record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
