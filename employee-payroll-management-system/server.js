const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const employeeRoutes = require('./routes/employeeRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/admin', adminRoutes);

// Fallback HTML navigation routes
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/employees', (req, res) => res.sendFile(path.join(__dirname, 'public', 'employees.html')));
app.get('/salary', (req, res) => res.sendFile(path.join(__dirname, 'public', 'salary.html')));
app.get('/payroll', (req, res) => res.sendFile(path.join(__dirname, 'public', 'payroll.html')));
app.get('/payslip', (req, res) => res.sendFile(path.join(__dirname, 'public', 'payslip.html')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server and initialize DB connection
async function startServer() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` Employee Payroll Management System is running!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

startServer();
