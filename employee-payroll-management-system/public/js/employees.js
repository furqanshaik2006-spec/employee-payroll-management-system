let allEmployees = [];

async function fetchEmployees() {
  try {
    const res = await fetch('/api/employees');
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    allEmployees = json.data;
    renderEmployees(allEmployees);
  } catch (err) {
    console.error(err);
    showToast('Failed to load employees', 'error');
  }
}

function renderEmployees(employees) {
  const tbody = document.getElementById('employees-tbody');
  if (!employees || employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748b;">No employees found.</td></tr>';
    return;
  }

  tbody.innerHTML = employees.map(emp => {
    let statusClass = 'badge-primary';
    if (emp.status === 'Active') statusClass = 'badge-success';
    if (emp.status === 'Inactive') statusClass = 'badge-danger';
    if (emp.status === 'On Leave') statusClass = 'badge-warning';

    return `
      <tr>
        <td><strong>${emp.emp_code}</strong></td>
        <td>
          <div style="font-weight: 600;">${emp.first_name} ${emp.last_name}</div>
        </td>
        <td>
          <div>${emp.email}</div>
          <small style="color: #64748b;">${emp.phone || 'No phone'}</small>
        </td>
        <td>
          <div>${emp.department}</div>
          <small style="color: #64748b;">${emp.designation}</small>
        </td>
        <td>${formatDate(emp.joining_date)}</td>
        <td><strong>${formatCurrency(emp.net_salary)}</strong></td>
        <td><span class="badge ${statusClass}">${emp.status}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="openEditEmployeeModal(${emp.id})">✏️ Edit</button>
            <a href="salary.html?employee_id=${emp.id}" class="btn btn-secondary btn-sm" title="Configure Salary">💰 Salary</a>
            <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${emp.id}, '${emp.first_name}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterEmployees() {
  const query = document.getElementById('employee-search').value.toLowerCase();
  const dept = document.getElementById('filter-department').value;
  const status = document.getElementById('filter-status').value;

  const filtered = allEmployees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const matchesQuery = fullName.includes(query) || 
                         emp.emp_code.toLowerCase().includes(query) || 
                         emp.department.toLowerCase().includes(query) ||
                         emp.designation.toLowerCase().includes(query) ||
                         emp.email.toLowerCase().includes(query);

    const matchesDept = !dept || emp.department === dept;
    const matchesStatus = !status || emp.status === status;

    return matchesQuery && matchesDept && matchesStatus;
  });

  renderEmployees(filtered);
}

function openAddEmployeeModal() {
  document.getElementById('modal-title').textContent = 'Add New Employee';
  document.getElementById('emp-id').value = '';
  document.getElementById('employee-form').reset();
  document.getElementById('emp-joining-date').value = new Date().toISOString().split('T')[0];
  openModal('employee-modal');
}

async function openEditEmployeeModal(id) {
  try {
    const res = await fetch(`/api/employees/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const emp = json.data;
    document.getElementById('modal-title').textContent = 'Edit Employee';
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-code').value = emp.emp_code;
    document.getElementById('emp-first-name').value = emp.first_name;
    document.getElementById('emp-last-name').value = emp.last_name;
    document.getElementById('emp-email').value = emp.email;
    document.getElementById('emp-phone').value = emp.phone || '';
    document.getElementById('emp-dept').value = emp.department;
    document.getElementById('emp-designation').value = emp.designation;
    document.getElementById('emp-joining-date').value = emp.joining_date ? emp.joining_date.split('T')[0] : '';
    document.getElementById('emp-status').value = emp.status;

    openModal('employee-modal');
  } catch (err) {
    showToast('Failed to load employee details', 'error');
  }
}

async function saveEmployee(e) {
  e.preventDefault();
  const id = document.getElementById('emp-id').value;

  const payload = {
    emp_code: document.getElementById('emp-code').value.trim(),
    first_name: document.getElementById('emp-first-name').value.trim(),
    last_name: document.getElementById('emp-last-name').value.trim(),
    email: document.getElementById('emp-email').value.trim(),
    phone: document.getElementById('emp-phone').value.trim(),
    department: document.getElementById('emp-dept').value,
    designation: document.getElementById('emp-designation').value.trim(),
    joining_date: document.getElementById('emp-joining-date').value,
    status: document.getElementById('emp-status').value
  };

  try {
    const url = id ? `/api/employees/${id}` : '/api/employees';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast(json.message || 'Employee saved successfully');
    closeModal('employee-modal');
    fetchEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteEmployee(id, name) {
  if (!confirm(`Are you sure you want to delete employee "${name}"? This will also remove associated salary structure and payroll entries.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast('Employee deleted successfully');
    fetchEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', fetchEmployees);
