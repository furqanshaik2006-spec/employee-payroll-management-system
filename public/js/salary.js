let allSalaries = [];
let employeeList = [];

async function initSalaryPage() {
  await Promise.all([fetchSalaries(), loadEmployeesDropdown()]);

  // Check URL query parameters for pre-selected employee
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedEmp = urlParams.get('employee_id');
  if (preselectedEmp) {
    openSalaryModal(preselectedEmp);
  }
}

async function fetchSalaries() {
  try {
    const res = await fetch('/api/salary');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    allSalaries = json.data;
    renderSalaries(allSalaries);
  } catch (err) {
    console.error(err);
    showToast('Failed to load salary details', 'error');
  }
}

async function loadEmployeesDropdown() {
  try {
    const res = await fetch('/api/employees');
    const json = await res.json();
    if (json.success) {
      employeeList = json.data;
      const select = document.getElementById('salary-emp-select');
      select.innerHTML = '<option value="">-- Choose Employee --</option>' + 
        employeeList.map(e => `<option value="${e.id}">${e.emp_code} - ${e.first_name} ${e.last_name} (${e.department})</option>`).join('');
    }
  } catch (err) {
    console.error('Error loading employees dropdown', err);
  }
}

function renderSalaries(salaries) {
  const tbody = document.getElementById('salary-tbody');
  if (!salaries || salaries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b;">No salary structures defined yet.</td></tr>';
    return;
  }

  tbody.innerHTML = salaries.map(s => {
    const allowances = (Number(s.hra) || 0) + (Number(s.medical_allowance) || 0) + (Number(s.special_allowance) || 0);
    const deductions = (Number(s.pf_deduction) || 0) + (Number(s.tax_deduction) || 0) + (Number(s.other_deductions) || 0);

    return `
      <tr>
        <td><strong>${s.emp_code}</strong></td>
        <td><strong>${s.first_name} ${s.last_name || ''}</strong></td>
        <td>${s.department}</td>
        <td>${formatCurrency(s.basic_salary)}</td>
        <td style="color: #16a34a;">+ ${formatCurrency(allowances)}</td>
        <td style="color: #dc2626;">- ${formatCurrency(deductions)}</td>
        <td><strong style="color: #2563eb; font-size: 14px;">${formatCurrency(s.net_salary)}</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openSalaryModal(${s.employee_id})">✏️ Modify</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterSalaries() {
  const query = document.getElementById('salary-search').value.toLowerCase();
  const filtered = allSalaries.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(query) || 
           s.emp_code.toLowerCase().includes(query) || 
           s.department.toLowerCase().includes(query);
  });
  renderSalaries(filtered);
}

function calculateLiveNet() {
  const basic = parseFloat(document.getElementById('sal-basic').value) || 0;
  const hra = parseFloat(document.getElementById('sal-hra').value) || 0;
  const med = parseFloat(document.getElementById('sal-medical').value) || 0;
  const spec = parseFloat(document.getElementById('sal-special').value) || 0;

  const pf = parseFloat(document.getElementById('sal-pf').value) || 0;
  const tax = parseFloat(document.getElementById('sal-tax').value) || 0;
  const other = parseFloat(document.getElementById('sal-other').value) || 0;

  const totalEarnings = basic + hra + med + spec;
  const totalDeductions = pf + tax + other;
  const net = Math.max(0, totalEarnings - totalDeductions);

  document.getElementById('calc-earnings').textContent = formatCurrency(totalEarnings);
  document.getElementById('calc-deductions').textContent = formatCurrency(totalDeductions);
  document.getElementById('calc-net').textContent = formatCurrency(net);
}

async function onEmployeeSelectChange() {
  const empId = document.getElementById('salary-emp-select').value;
  if (!empId) return;

  const existing = allSalaries.find(s => s.employee_id == empId);
  if (existing) {
    populateSalaryForm(existing);
  } else {
    // Clear amounts
    document.getElementById('sal-basic').value = '';
    document.getElementById('sal-hra').value = '';
    document.getElementById('sal-medical').value = '';
    document.getElementById('sal-special').value = '';
    document.getElementById('sal-pf').value = '';
    document.getElementById('sal-tax').value = '';
    document.getElementById('sal-other').value = '';
    calculateLiveNet();
  }
}

function populateSalaryForm(s) {
  document.getElementById('sal-basic').value = s.basic_salary || '';
  document.getElementById('sal-hra').value = s.hra || '';
  document.getElementById('sal-medical').value = s.medical_allowance || '';
  document.getElementById('sal-special').value = s.special_allowance || '';
  document.getElementById('sal-pf').value = s.pf_deduction || '';
  document.getElementById('sal-tax').value = s.tax_deduction || '';
  document.getElementById('sal-other').value = s.other_deductions || '';
  calculateLiveNet();
}

async function openSalaryModal(empId = null) {
  document.getElementById('salary-form').reset();
  const select = document.getElementById('salary-emp-select');

  if (empId) {
    select.value = empId;
    select.disabled = true;
    const existing = allSalaries.find(s => s.employee_id == empId);
    if (existing) {
      populateSalaryForm(existing);
    } else {
      calculateLiveNet();
    }
  } else {
    select.disabled = false;
    calculateLiveNet();
  }

  openModal('salary-modal');
}

async function saveSalary(e) {
  e.preventDefault();

  const select = document.getElementById('salary-emp-select');
  const employee_id = select.value;

  if (!employee_id) {
    showToast('Please select an employee', 'error');
    return;
  }

  const payload = {
    employee_id: Number(employee_id),
    basic_salary: parseFloat(document.getElementById('sal-basic').value) || 0,
    hra: parseFloat(document.getElementById('sal-hra').value) || 0,
    medical_allowance: parseFloat(document.getElementById('sal-medical').value) || 0,
    special_allowance: parseFloat(document.getElementById('sal-special').value) || 0,
    pf_deduction: parseFloat(document.getElementById('sal-pf').value) || 0,
    tax_deduction: parseFloat(document.getElementById('sal-tax').value) || 0,
    other_deductions: parseFloat(document.getElementById('sal-other').value) || 0
  };

  try {
    const res = await fetch('/api/salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast('Salary structure saved successfully');
    closeModal('salary-modal');
    fetchSalaries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', initSalaryPage);
