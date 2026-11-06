let payrollRecords = [];

async function initPayrollPage() {
  await Promise.all([fetchPayrolls(), loadEmployeesForRun()]);
}

async function fetchPayrolls() {
  const month = document.getElementById('filter-pay-month').value;
  const year = document.getElementById('filter-pay-year').value;
  const status = document.getElementById('filter-pay-status').value;

  let query = [];
  if (month) query.push(`month=${encodeURIComponent(month)}`);
  if (year) query.push(`year=${encodeURIComponent(year)}`);
  if (status) query.push(`status=${encodeURIComponent(status)}`);

  const url = '/api/payroll' + (query.length > 0 ? `?${query.join('&')}` : '');

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    payrollRecords = json.data;
    renderPayrolls(payrollRecords);
  } catch (err) {
    console.error(err);
    showToast('Failed to load payroll records', 'error');
  }
}

function resetFilters() {
  document.getElementById('filter-pay-month').value = '';
  document.getElementById('filter-pay-year').value = '';
  document.getElementById('filter-pay-status').value = '';
  fetchPayrolls();
}

async function loadEmployeesForRun() {
  try {
    const res = await fetch('/api/employees');
    const json = await res.json();
    if (json.success) {
      const activeEmps = json.data.filter(e => e.status === 'Active');
      const select = document.getElementById('gen-employee');
      select.innerHTML = '<option value="all">⚡ All Active Employees (Batch Run - ' + activeEmps.length + ' Staff)</option>' +
        activeEmps.map(e => `<option value="${e.id}">${e.emp_code} - ${e.first_name} ${e.last_name}</option>`).join('');
    }
  } catch (err) {
    console.error('Error loading employees for run', err);
  }
}

function renderPayrolls(records) {
  const tbody = document.getElementById('payroll-tbody');
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #64748b;">No payroll records found for the selected filter.</td></tr>';
    return;
  }

  tbody.innerHTML = records.map(p => {
    const isPaid = p.payment_status === 'Paid';
    const statusClass = isPaid ? 'badge-success' : 'badge-warning';

    return `
      <tr>
        <td><strong>${p.payroll_month} ${p.payroll_year}</strong></td>
        <td><strong>${p.emp_code || 'EMP' + p.employee_id}</strong></td>
        <td>
          <div style="font-weight: 600;">${p.first_name ? p.first_name + ' ' + (p.last_name || '') : 'Employee #' + p.employee_id}</div>
          <small style="color: #64748b;">${p.department || ''}</small>
        </td>
        <td>${formatCurrency(p.basic_salary)}</td>
        <td style="color: #16a34a;">+ ${formatCurrency(p.total_allowances)}</td>
        <td style="color: #dc2626;">- ${formatCurrency(p.total_deductions)}</td>
        <td><strong style="color: #2563eb; font-size: 14px;">${formatCurrency(p.net_pay)}</strong></td>
        <td>
          <span class="badge ${statusClass}" style="cursor: pointer;" title="Click to toggle status" onclick="togglePaymentStatus(${p.id}, '${p.payment_status}')">
            ${p.payment_status} 🔄
          </span>
        </td>
        <td>${formatDate(p.payment_date)}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <a href="payslip.html?id=${p.id}" class="btn btn-secondary btn-sm" title="View & Print Payslip">📄 Payslip</a>
            <button class="btn btn-danger btn-sm" title="Delete Payroll Entry" onclick="deletePayroll(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openGeneratePayrollModal() {
  openModal('generate-payroll-modal');
}

async function generatePayroll(e) {
  e.preventDefault();

  const payload = {
    payroll_month: document.getElementById('gen-month').value,
    payroll_year: parseInt(document.getElementById('gen-year').value),
    employee_id: document.getElementById('gen-employee').value,
    payment_method: document.getElementById('gen-method').value
  };

  const btn = document.getElementById('btn-submit-run');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const res = await fetch('/api/payroll/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast(json.message);
    closeModal('generate-payroll-modal');
    fetchPayrolls();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Execute Payroll';
  }
}

async function togglePaymentStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
  const today = new Date().toISOString().split('T')[0];

  try {
    const res = await fetch(`/api/payroll/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_status: newStatus,
        payment_date: newStatus === 'Paid' ? today : null
      })
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast(`Payment status updated to ${newStatus}`);
    fetchPayrolls();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePayroll(id) {
  if (!confirm('Are you sure you want to delete this payroll record?')) return;

  try {
    const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    showToast('Payroll record deleted');
    fetchPayrolls();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', initPayrollPage);
