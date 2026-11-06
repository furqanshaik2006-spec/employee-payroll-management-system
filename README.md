# Employee Payroll Management System

A full-stack web application designed for HR & Payroll administrators to manage employee records, configure custom salary structures (allowances and deductions), execute monthly payroll cycles, and generate printable employee payslips.

Built with **HTML, CSS, JavaScript, Node.js / Express.js, and MySQL**.

---

## 🌟 Key Features

1. **Table 1: `employees` Management**
   - Manage employee profiles: Employee Code, Name, Email, Phone, Department, Designation, Date of Joining, and Status (`Active`, `Inactive`, `On Leave`).
   - Search and filter staff by keyword, department, or status.
   - Add, edit, and delete employee records.

2. **Table 2: `salary_details` Configuration**
   - Structure base compensation and custom components:
     - **Earnings**: Basic Salary, HRA (House Rent Allowance), Medical Allowance, Special Allowance.
     - **Deductions**: Provident Fund (PF), Income Tax (TDS), Other Deductions.
   - **Automated Net Calculation**: Real-time formula computation:  
     $$\text{Net Salary} = \text{Basic Salary} + \sum \text{Allowances} - \sum \text{Deductions}$$

3. **Table 3: `payroll` Monthly Execution**
   - Monthly payroll generation for individual employees or all active employees in batch.
   - Filter payroll records by Month, Year, and Payment Status (`Paid`, `Pending`, `Processing`).
   - One-click payment status toggles with recorded payment date and disbursement mode (`Bank Transfer`, `Cheque`, `Cash`).

4. **Table 4: `admins` & Executive Dashboard**
   - Live metrics: Total Employees, Active Staff, Total Monthly Payout, and Pending Transactions.
   - Recent payroll activities feed.

5. **Printable Payslip Generator**
   - Formatted payslip ready to print or export as PDF (`window.print()` styled).

---

## 🗄️ Database Architecture & Field Specifications

### 1. `employees`
| Field Name | Type | Key | Description |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PK | Unique identifier |
| `emp_code` | VARCHAR(20) | UNIQUE | Unique employee identifier (e.g. `EMP001`) |
| `first_name` | VARCHAR(50) | - | First name |
| `last_name` | VARCHAR(50) | - | Last name |
| `email` | VARCHAR(100) | UNIQUE | Work email address |
| `phone` | VARCHAR(20) | - | Contact phone number |
| `department` | VARCHAR(50) | - | Department (Engineering, HR, Finance, etc.) |
| `designation` | VARCHAR(50) | - | Job title |
| `joining_date` | DATE | - | Date joined |
| `status` | ENUM | - | `'Active'`, `'Inactive'`, `'On Leave'` |
| `created_at` | TIMESTAMP | - | Record timestamp |

### 2. `salary_details`
| Field Name | Type | Key | Description |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PK | Unique identifier |
| `employee_id` | INT | FK | References `employees(id)` |
| `basic_salary` | DECIMAL(10,2) | - | Base monthly salary |
| `hra` | DECIMAL(10,2) | - | House Rent Allowance |
| `medical_allowance` | DECIMAL(10,2) | - | Medical allowance |
| `special_allowance` | DECIMAL(10,2) | - | Special allowance |
| `pf_deduction` | DECIMAL(10,2) | - | Provident fund deduction |
| `tax_deduction` | DECIMAL(10,2) | - | TDS / Income Tax deduction |
| `other_deductions` | DECIMAL(10,2) | - | Other deductions |
| `net_salary` | DECIMAL(10,2) | - | Net computed take-home salary |
| `updated_at` | TIMESTAMP | - | Last modification timestamp |

### 3. `payroll`
| Field Name | Type | Key | Description |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PK | Unique identifier |
| `employee_id` | INT | FK | References `employees(id)` |
| `payroll_month` | VARCHAR(20) | - | Month (e.g. `'October'`) |
| `payroll_year` | INT | - | Year (e.g. `2026`) |
| `basic_salary` | DECIMAL(10,2) | - | Snapshot of basic pay |
| `total_allowances`| DECIMAL(10,2) | - | Sum of all allowances |
| `total_deductions`| DECIMAL(10,2) | - | Sum of all deductions |
| `net_pay` | DECIMAL(10,2) | - | Disbursed net amount |
| `payment_date` | DATE | - | Date payment was disbursed |
| `payment_status` | ENUM | - | `'Pending'`, `'Paid'`, `'Processing'` |
| `payment_method` | ENUM | - | `'Bank Transfer'`, `'Cheque'`, `'Cash'` |
| `created_at` | TIMESTAMP | - | Creation timestamp |

### 4. `admins`
| Field Name | Type | Key | Description |
|---|---|---|---|
| `id` | INT AUTO_INCREMENT | PK | Unique identifier |
| `username` | VARCHAR(50) | UNIQUE | Administrator login name |
| `password` | VARCHAR(255) | - | Login password |
| `full_name` | VARCHAR(100) | - | Admin name |
| `email` | VARCHAR(100) | UNIQUE | Contact email (`furqanshaik2006@gmail.com`) |
| `role` | VARCHAR(30) | - | Role (`Super Admin`) |

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
Open terminal in the project directory:
```bash
npm install
```

### Step 2: Database Setup (MySQL)
1. Start your local MySQL server (e.g. through XAMPP, WampServer, or MySQL CLI).
2. Open MySQL shell or phpMyAdmin and import `database.sql`:
   ```bash
   mysql -u root -p < database.sql
   ```
3. Update `.env` with your database credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=payroll_db
   DB_PORT=3306
   ```

*(Note: If MySQL is not running on your machine, the application automatically launches in **Safe Mock Storage Mode** with pre-seeded data so you can test all features immediately!)*

### Step 3: Run the Application
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📁 Project Directory Structure
```
employee-payroll-management-system/
├── config/
│   └── db.js                 # Database pool connection & safe fallback
├── routes/
│   ├── employeeRoutes.js     # Table 1: Employees API endpoints
│   ├── salaryRoutes.js       # Table 2: Salary Structure API endpoints
│   ├── payrollRoutes.js      # Table 3: Monthly Payroll API endpoints
│   └── adminRoutes.js        # Table 4: Dashboard stats & Admin API
├── public/
│   ├── index.html            # Dashboard UI
│   ├── employees.html        # Employee management interface
│   ├── salary.html           # Salary details & calculator interface
│   ├── payroll.html          # Monthly payroll execution & tracking
│   ├── payslip.html          # Printable / PDF payslip template
│   ├── css/
│   │   └── style.css         # SaaS dashboard styling & print rules
│   └── js/
│       ├── app.js            # Common utilities & toast alerts
│       ├── employees.js      # Employee operations
│       ├── salary.js         # Salary calculation & saving
│       ├── payroll.js        # Payroll generation & status updating
│       └── payslip.js        # Dynamic payslip renderer
├── .env.example              # Environment variables template
├── database.sql              # MySQL DDL schema and seed data
├── package.json              # Node.js dependencies
└── README.md                 # Project documentation
```

---

## 👤 Author
- **Developer**: Furqan Shaik
- **Email**: furqanshaik2006@gmail.com
