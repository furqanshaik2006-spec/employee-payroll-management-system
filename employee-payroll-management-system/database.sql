-- ========================================================
-- Employee Payroll Management System Database Schema
-- Database Name: payroll_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS payroll_db;
USE payroll_db;

-- --------------------------------------------------------
-- Table 1: employees
-- Stores basic employee profile and employment details
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL,
    status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table 2: salary_details
-- Stores employee salary structures, allowances, and deductions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    basic_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    hra DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    medical_allowance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    special_allowance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pf_deduction DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_deduction DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    other_deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_salary_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table 3: payroll
-- Stores generated monthly payroll runs and payslip records
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    payroll_month VARCHAR(20) NOT NULL,
    payroll_year INT NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_allowances DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_pay DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NULL,
    payment_status ENUM('Pending', 'Paid', 'Processing') DEFAULT 'Pending',
    payment_method ENUM('Bank Transfer', 'Cheque', 'Cash') DEFAULT 'Bank Transfer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_emp_month_year UNIQUE (employee_id, payroll_month, payroll_year),
    CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) 
        REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table 4: admins
-- Stores administrative user credentials for payroll admin
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(30) DEFAULT 'Super Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- Seed Initial Sample Data
-- ========================================================

-- Insert Default Admin (Password: admin123)
INSERT INTO admins (username, password, full_name, email, role)
VALUES ('admin', 'admin123', 'System Administrator', 'furqanshaik2006@gmail.com', 'Super Admin')
ON DUPLICATE KEY UPDATE username=username;

-- Insert Sample Employees
INSERT INTO employees (id, emp_code, first_name, last_name, email, phone, department, designation, joining_date, status)
VALUES 
(1, 'EMP001', 'Rahul', 'Sharma', 'rahul.sharma@example.com', '+91 9876543210', 'Engineering', 'Senior Software Engineer', '2023-01-15', 'Active'),
(2, 'EMP002', 'Priya', 'Verma', 'priya.verma@example.com', '+91 9812345678', 'Human Resources', 'HR Manager', '2023-04-10', 'Active'),
(3, 'EMP003', 'Aman', 'Gupta', 'aman.gupta@example.com', '+91 9934567890', 'Finance', 'Financial Analyst', '2023-08-01', 'Active'),
(4, 'EMP004', 'Sneha', 'Patel', 'sneha.patel@example.com', '+91 9876501234', 'Marketing', 'Digital Marketing Lead', '2024-02-20', 'Active')
ON DUPLICATE KEY UPDATE emp_code=emp_code;

-- Insert Salary Details for Employees
-- Net Salary = Basic + (HRA + Medical + Special) - (PF + Tax + Other)
INSERT INTO salary_details (employee_id, basic_salary, hra, medical_allowance, special_allowance, pf_deduction, tax_deduction, other_deductions, net_salary)
VALUES 
(1, 60000.00, 24000.00, 3000.00, 8000.00, 7200.00, 5000.00, 800.00, 82000.00),
(2, 50000.00, 20000.00, 2500.00, 6000.00, 6000.00, 3500.00, 500.00, 68500.00),
(3, 45000.00, 18000.00, 2000.00, 5000.00, 5400.00, 3000.00, 600.00, 61000.00),
(4, 40000.00, 16000.00, 2000.00, 4500.00, 4800.00, 2500.00, 200.00, 55000.00)
ON DUPLICATE KEY UPDATE employee_id=employee_id;

-- Insert Sample Monthly Payroll Records
INSERT INTO payroll (employee_id, payroll_month, payroll_year, basic_salary, total_allowances, total_deductions, net_pay, payment_date, payment_status, payment_method)
VALUES
(1, 'October', 2026, 60000.00, 35000.00, 13000.00, 82000.00, '2026-10-31', 'Paid', 'Bank Transfer'),
(2, 'October', 2026, 50000.00, 28500.00, 10000.00, 68500.00, '2026-10-31', 'Paid', 'Bank Transfer'),
(3, 'October', 2026, 45000.00, 25000.00, 9000.00, 61000.00, '2026-10-31', 'Paid', 'Bank Transfer'),
(4, 'October', 2026, 40000.00, 22500.00, 7500.00, 55000.00, NULL, 'Pending', 'Bank Transfer')
ON DUPLICATE KEY UPDATE employee_id=employee_id;
