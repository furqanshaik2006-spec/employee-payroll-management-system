const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;
let useMock = false;

// In-memory mock storage if MySQL is not currently running locally
const mockData = {
  admins: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      full_name: 'System Administrator',
      email: 'furqanshaik2006@gmail.com',
      role: 'Super Admin',
      created_at: new Date()
    }
  ],
  employees: [
    {
      id: 1,
      emp_code: 'EMP001',
      first_name: 'Rahul',
      last_name: 'Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 9876543210',
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      joining_date: '2023-01-15',
      status: 'Active',
      created_at: new Date()
    },
    {
      id: 2,
      emp_code: 'EMP002',
      first_name: 'Priya',
      last_name: 'Verma',
      email: 'priya.verma@example.com',
      phone: '+91 9812345678',
      department: 'Human Resources',
      designation: 'HR Manager',
      joining_date: '2023-04-10',
      status: 'Active',
      created_at: new Date()
    },
    {
      id: 3,
      emp_code: 'EMP003',
      first_name: 'Aman',
      last_name: 'Gupta',
      email: 'aman.gupta@example.com',
      phone: '+91 9934567890',
      department: 'Finance',
      designation: 'Financial Analyst',
      joining_date: '2023-08-01',
      status: 'Active',
      created_at: new Date()
    },
    {
      id: 4,
      emp_code: 'EMP004',
      first_name: 'Sneha',
      last_name: 'Patel',
      email: 'sneha.patel@example.com',
      phone: '+91 9876501234',
      department: 'Marketing',
      designation: 'Digital Marketing Lead',
      joining_date: '2024-02-20',
      status: 'Active',
      created_at: new Date()
    }
  ],
  salary_details: [
    {
      id: 1,
      employee_id: 1,
      basic_salary: 60000.0,
      hra: 24000.0,
      medical_allowance: 3000.0,
      special_allowance: 8000.0,
      pf_deduction: 7200.0,
      tax_deduction: 5000.0,
      other_deductions: 800.0,
      net_salary: 82000.0,
      updated_at: new Date()
    },
    {
      id: 2,
      employee_id: 2,
      basic_salary: 50000.0,
      hra: 20000.0,
      medical_allowance: 2500.0,
      special_allowance: 6000.0,
      pf_deduction: 6000.0,
      tax_deduction: 3500.0,
      other_deductions: 500.0,
      net_salary: 68500.0,
      updated_at: new Date()
    },
    {
      id: 3,
      employee_id: 3,
      basic_salary: 45000.0,
      hra: 18000.0,
      medical_allowance: 2000.0,
      special_allowance: 5000.0,
      pf_deduction: 5400.0,
      tax_deduction: 3000.0,
      other_deductions: 600.0,
      net_salary: 61000.0,
      updated_at: new Date()
    },
    {
      id: 4,
      employee_id: 4,
      basic_salary: 40000.0,
      hra: 16000.0,
      medical_allowance: 2000.0,
      special_allowance: 4500.0,
      pf_deduction: 4800.0,
      tax_deduction: 2500.0,
      other_deductions: 200.0,
      net_salary: 55000.0,
      updated_at: new Date()
    }
  ],
  payroll: [
    {
      id: 1,
      employee_id: 1,
      payroll_month: 'October',
      payroll_year: 2026,
      basic_salary: 60000.0,
      total_allowances: 35000.0,
      total_deductions: 13000.0,
      net_pay: 82000.0,
      payment_date: '2026-10-31',
      payment_status: 'Paid',
      payment_method: 'Bank Transfer',
      created_at: new Date()
    },
    {
      id: 2,
      employee_id: 2,
      payroll_month: 'October',
      payroll_year: 2026,
      basic_salary: 50000.0,
      total_allowances: 28500.0,
      total_deductions: 10000.0,
      net_pay: 68500.0,
      payment_date: '2026-10-31',
      payment_status: 'Paid',
      payment_method: 'Bank Transfer',
      created_at: new Date()
    },
    {
      id: 3,
      employee_id: 3,
      payroll_month: 'October',
      payroll_year: 2026,
      basic_salary: 45000.0,
      total_allowances: 25000.0,
      total_deductions: 9000.0,
      net_pay: 61000.0,
      payment_date: '2026-10-31',
      payment_status: 'Paid',
      payment_method: 'Bank Transfer',
      created_at: new Date()
    },
    {
      id: 4,
      employee_id: 4,
      payroll_month: 'October',
      payroll_year: 2026,
      basic_salary: 40000.0,
      total_allowances: 22500.0,
      total_deductions: 7500.0,
      net_pay: 55000.0,
      payment_date: null,
      payment_status: 'Pending',
      payment_method: 'Bank Transfer',
      created_at: new Date()
    }
  ]
};

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'payroll_db',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(' Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'payroll_db'));
    connection.release();
    useMock = false;
  } catch (err) {
    console.warn('\n⚠️  Notice: Local MySQL server not accessible (' + err.message + ').');
    console.warn(' Running in Safe In-Memory Mock Mode with preloaded seed data.');
    console.warn(' To connect real MySQL: start MySQL, create database via database.sql, and update .env.\n');
    useMock = true;
  }
}

// Wrapper to execute queries with fallback
async function query(sql, params = []) {
  if (!useMock && pool) {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (err) {
      console.error('MySQL query error:', err.message);
      throw err;
    }
  }

  // Fallback mock operations
  return handleMockQuery(sql, params);
}

function handleMockQuery(sql, params) {
  const cleanSql = sql.trim().toLowerCase();

  // DASHBOARD STATS
  if (cleanSql.includes('count(distinct') || cleanSql.includes('as total_employees')) {
    const totalEmployees = mockData.employees.length;
    const activeEmployees = mockData.employees.filter(e => e.status === 'Active').length;
    const totalPayroll = mockData.payroll.reduce((sum, p) => sum + Number(p.net_pay || 0), 0);
    const pendingPayroll = mockData.payroll.filter(p => p.payment_status === 'Pending').length;
    return [{
      totalEmployees,
      activeEmployees,
      totalPayroll,
      pendingPayroll
    }];
  }

  // EMPLOYEES
  if (cleanSql.startsWith('select') && cleanSql.includes('from employees') && cleanSql.includes('where e.id =') || cleanSql.includes('where id =')) {
    const id = Number(params[0]);
    const emp = mockData.employees.find(e => e.id === id);
    if (!emp) return [];
    const sal = mockData.salary_details.find(s => s.employee_id === id) || {};
    return [{ ...emp, ...sal }];
  }

  if (cleanSql.startsWith('select') && cleanSql.includes('from employees')) {
    return mockData.employees.map(e => {
      const sal = mockData.salary_details.find(s => s.employee_id === e.id);
      return {
        ...e,
        basic_salary: sal ? sal.basic_salary : 0,
        net_salary: sal ? sal.net_salary : 0
      };
    });
  }

  if (cleanSql.startsWith('insert into employees')) {
    const newId = mockData.employees.length > 0 ? Math.max(...mockData.employees.map(e => e.id)) + 1 : 1;
    const [emp_code, first_name, last_name, email, phone, department, designation, joining_date, status] = params;
    const newEmp = {
      id: newId,
      emp_code,
      first_name,
      last_name,
      email,
      phone,
      department,
      designation,
      joining_date,
      status: status || 'Active',
      created_at: new Date()
    };
    mockData.employees.push(newEmp);
    return { insertId: newId, affectedRows: 1 };
  }

  if (cleanSql.startsWith('update employees')) {
    const id = Number(params[params.length - 1]);
    const index = mockData.employees.findIndex(e => e.id === id);
    if (index !== -1) {
      const [emp_code, first_name, last_name, email, phone, department, designation, joining_date, status] = params;
      mockData.employees[index] = {
        ...mockData.employees[index],
        emp_code, first_name, last_name, email, phone, department, designation, joining_date, status
      };
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (cleanSql.startsWith('delete from employees')) {
    const id = Number(params[0]);
    mockData.employees = mockData.employees.filter(e => e.id !== id);
    mockData.salary_details = mockData.salary_details.filter(s => s.employee_id !== id);
    mockData.payroll = mockData.payroll.filter(p => p.employee_id !== id);
    return { affectedRows: 1 };
  }

  // SALARY DETAILS
  if (cleanSql.startsWith('select') && cleanSql.includes('from salary_details') && cleanSql.includes('where employee_id =')) {
    const empId = Number(params[0]);
    return mockData.salary_details.filter(s => s.employee_id === empId);
  }

  if (cleanSql.startsWith('select') && cleanSql.includes('from salary_details')) {
    return mockData.salary_details.map(s => {
      const emp = mockData.employees.find(e => e.id === s.employee_id);
      return {
        ...s,
        emp_code: emp ? emp.emp_code : 'N/A',
        first_name: emp ? emp.first_name : 'N/A',
        last_name: emp ? emp.last_name : '',
        department: emp ? emp.department : 'N/A',
        designation: emp ? emp.designation : 'N/A'
      };
    });
  }

  if (cleanSql.startsWith('insert into salary_details') || cleanSql.includes('on duplicate key update')) {
    const [employee_id, basic_salary, hra, medical_allowance, special_allowance, pf_deduction, tax_deduction, other_deductions, net_salary] = params;
    const empId = Number(employee_id);
    const existingIndex = mockData.salary_details.findIndex(s => s.employee_id === empId);
    if (existingIndex !== -1) {
      mockData.salary_details[existingIndex] = {
        ...mockData.salary_details[existingIndex],
        basic_salary: Number(basic_salary),
        hra: Number(hra),
        medical_allowance: Number(medical_allowance),
        special_allowance: Number(special_allowance),
        pf_deduction: Number(pf_deduction),
        tax_deduction: Number(tax_deduction),
        other_deductions: Number(other_deductions),
        net_salary: Number(net_salary),
        updated_at: new Date()
      };
      return { affectedRows: 1 };
    } else {
      const newId = mockData.salary_details.length > 0 ? Math.max(...mockData.salary_details.map(s => s.id)) + 1 : 1;
      mockData.salary_details.push({
        id: newId,
        employee_id: empId,
        basic_salary: Number(basic_salary),
        hra: Number(hra),
        medical_allowance: Number(medical_allowance),
        special_allowance: Number(special_allowance),
        pf_deduction: Number(pf_deduction),
        tax_deduction: Number(tax_deduction),
        other_deductions: Number(other_deductions),
        net_salary: Number(net_salary),
        updated_at: new Date()
      });
      return { insertId: newId, affectedRows: 1 };
    }
  }

  // PAYROLL
  if (cleanSql.startsWith('select') && cleanSql.includes('from payroll') && cleanSql.includes('where p.id =')) {
    const id = Number(params[0]);
    const pay = mockData.payroll.find(p => p.id === id);
    if (!pay) return [];
    const emp = mockData.employees.find(e => e.id === pay.employee_id) || {};
    const sal = mockData.salary_details.find(s => s.employee_id === pay.employee_id) || {};
    return [{ ...pay, ...emp, ...sal, payroll_id: pay.id, employee_id: emp.id }];
  }

  if (cleanSql.startsWith('select') && cleanSql.includes('from payroll')) {
    return mockData.payroll.map(p => {
      const emp = mockData.employees.find(e => e.id === p.employee_id);
      return {
        ...p,
        emp_code: emp ? emp.emp_code : 'N/A',
        first_name: emp ? emp.first_name : 'N/A',
        last_name: emp ? emp.last_name : '',
        department: emp ? emp.department : 'N/A',
        designation: emp ? emp.designation : 'N/A'
      };
    });
  }

  if (cleanSql.startsWith('insert into payroll')) {
    const newId = mockData.payroll.length > 0 ? Math.max(...mockData.payroll.map(p => p.id)) + 1 : 1;
    const [employee_id, payroll_month, payroll_year, basic_salary, total_allowances, total_deductions, net_pay, payment_date, payment_status, payment_method] = params;
    
    // Check duplicate
    const existing = mockData.payroll.find(p => p.employee_id === Number(employee_id) && p.payroll_month === payroll_month && p.payroll_year === Number(payroll_year));
    if (existing) {
      existing.basic_salary = Number(basic_salary);
      existing.total_allowances = Number(total_allowances);
      existing.total_deductions = Number(total_deductions);
      existing.net_pay = Number(net_pay);
      existing.payment_date = payment_date;
      existing.payment_status = payment_status;
      existing.payment_method = payment_method;
      return { insertId: existing.id, affectedRows: 1 };
    }

    mockData.payroll.push({
      id: newId,
      employee_id: Number(employee_id),
      payroll_month,
      payroll_year: Number(payroll_year),
      basic_salary: Number(basic_salary),
      total_allowances: Number(total_allowances),
      total_deductions: Number(total_deductions),
      net_pay: Number(net_pay),
      payment_date,
      payment_status: payment_status || 'Pending',
      payment_method: payment_method || 'Bank Transfer',
      created_at: new Date()
    });
    return { insertId: newId, affectedRows: 1 };
  }

  if (cleanSql.startsWith('update payroll')) {
    const id = Number(params[params.length - 1]);
    const index = mockData.payroll.findIndex(p => p.id === id);
    if (index !== -1) {
      mockData.payroll[index].payment_status = params[0];
      mockData.payroll[index].payment_date = params[1] || new Date().toISOString().split('T')[0];
      if (params.length > 3) {
        mockData.payroll[index].payment_method = params[2];
      }
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (cleanSql.startsWith('delete from payroll')) {
    const id = Number(params[0]);
    mockData.payroll = mockData.payroll.filter(p => p.id !== id);
    return { affectedRows: 1 };
  }

  // ADMINS
  if (cleanSql.startsWith('select') && cleanSql.includes('from admins')) {
    const [username, password] = params;
    return mockData.admins.filter(a => a.username === username && a.password === password);
  }

  return [];
}

module.exports = {
  initDB,
  query,
  isMock: () => useMock
};
