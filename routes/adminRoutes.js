const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    let stats = {
      totalEmployees: 0,
      activeEmployees: 0,
      totalPayroll: 0,
      pendingPayroll: 0,
      recentPayrolls: [],
      departmentDistribution: []
    };

    if (db.isMock()) {
      const mockStats = await db.query('SELECT COUNT(*) as total_employees');
      stats = { ...stats, ...mockStats[0] };
      const recent = await db.query('SELECT * FROM payroll');
      stats.recentPayrolls = recent.slice(0, 5);
    } else {
      // 1. Employee stats
      const empRes = await db.query(`
        SELECT 
          COUNT(*) as totalEmployees,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeEmployees
        FROM employees
      `);
      if (empRes && empRes[0]) {
        stats.totalEmployees = empRes[0].totalEmployees || 0;
        stats.activeEmployees = empRes[0].activeEmployees || 0;
      }

      // 2. Payroll stats
      const payRes = await db.query(`
        SELECT 
          COALESCE(SUM(net_pay), 0) as totalPayroll,
          SUM(CASE WHEN payment_status = 'Pending' THEN 1 ELSE 0 END) as pendingPayroll
        FROM payroll
      `);
      if (payRes && payRes[0]) {
        stats.totalPayroll = payRes[0].totalPayroll || 0;
        stats.pendingPayroll = payRes[0].pendingPayroll || 0;
      }

      // 3. Recent payroll records
      const recent = await db.query(`
        SELECT p.*, e.emp_code, e.first_name, e.last_name, e.department
        FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        ORDER BY p.id DESC
        LIMIT 5
      `);
      stats.recentPayrolls = recent;

      // 4. Department counts
      const depts = await db.query(`
        SELECT department, COUNT(*) as count 
        FROM employees 
        GROUP BY department
      `);
      stats.departmentDistribution = depts;
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const rows = await db.query('SELECT id, username, full_name, email, role FROM admins WHERE username = ? AND password = ?', [username, password]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin username or password' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
