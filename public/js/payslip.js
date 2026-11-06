async function loadPayslip() {
  const urlParams = new URLSearchParams(window.location.search);
  const payrollId = urlParams.get('id');

  if (!payrollId) {
    showToast('Invalid payslip ID', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/payroll/${payrollId}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const data = json.data;
    renderPayslipData(data);
  } catch (err) {
    console.error(err);
    showToast('Failed to load payslip data', 'error');
  }
}

function renderPayslipData(p) {
  document.getElementById('ps-title').textContent = `SALARY PAYSLIP - ${p.payroll_month.toUpperCase()} ${p.payroll_year}`;
  document.getElementById('ps-emp-code').textContent = p.emp_code || ('EMP' + p.employee_id);
  document.getElementById('ps-emp-name').textContent = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Employee #' + p.employee_id;
  document.getElementById('ps-dept').textContent = p.department || 'N/A';
  document.getElementById('ps-designation').textContent = p.designation || 'N/A';
  document.getElementById('ps-period').textContent = `${p.payroll_month} ${p.payroll_year}`;

  const statusBadge = document.getElementById('ps-status');
  statusBadge.textContent = p.payment_status;
  statusBadge.className = `badge ${p.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}`;

  document.getElementById('ps-method').textContent = p.payment_method || 'Bank Transfer';
  document.getElementById('ps-pay-date').textContent = formatDate(p.payment_date);

  // Earnings
  const basic = Number(p.basic_salary) || 0;
  const hra = Number(p.hra) || 0;
  const med = Number(p.medical_allowance) || 0;
  const spec = Number(p.special_allowance) || 0;
  const totalEarnings = basic + (Number(p.total_allowances) || (hra + med + spec));

  document.getElementById('ps-basic').textContent = formatCurrency(basic);
  document.getElementById('ps-hra').textContent = formatCurrency(hra);
  document.getElementById('ps-med').textContent = formatCurrency(med);
  document.getElementById('ps-spec').textContent = formatCurrency(spec);
  document.getElementById('ps-total-earnings').textContent = formatCurrency(totalEarnings);

  // Deductions
  const pf = Number(p.pf_deduction) || 0;
  const tax = Number(p.tax_deduction) || 0;
  const other = Number(p.other_deductions) || 0;
  const totalDeductions = Number(p.total_deductions) || (pf + tax + other);

  document.getElementById('ps-pf').textContent = formatCurrency(pf);
  document.getElementById('ps-tax').textContent = formatCurrency(tax);
  document.getElementById('ps-other').textContent = formatCurrency(other);
  document.getElementById('ps-total-deductions').textContent = formatCurrency(totalDeductions);

  // Net Pay
  document.getElementById('ps-net-pay').textContent = formatCurrency(p.net_pay);
}

document.addEventListener('DOMContentLoaded', loadPayslip);
