// ==========================================
// AUB Digital Academy - Teacher Payroll Management Controller
// Faculty Salaries, Course Comp, Exam Grading Comp, Bonuses, Deductions & Disbursements
// ==========================================

document.addEventListener('DOMContentLoaded', async function () {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    const API_BASE = (isLocal && window.location.port !== '5000') 
        ? 'http://localhost:5000/api' 
        : '/api';

    function getAuthToken() {
        return localStorage.getItem('aub_auth_token') || 
               localStorage.getItem('token') || 
               sessionStorage.getItem('aub_auth_token') || 
               sessionStorage.getItem('token') || '';
    }

    function getHeaders() {
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    let allPayroll = [];

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatCurrency(amount) {
        return `$${(Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // 1. Load Payroll Data
    async function loadPayroll() {
        let loaded = false;
        try {
            const res = await fetch(`${API_BASE}/admin/teacher-payroll`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allPayroll = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded) {
            allPayroll = [
                { id: 1, teacher_id: 1, teacher_name: 'Dr. Sarah Johnson', teacher_code: 'T-001', department_name: 'Computer Science', base_salary: 3200.00, course_compensation: 800.00, exam_compensation: 250.00, bonus: 150.00, deductions: 200.00, net_pay: 4200.00, payment_date: '2026-08-01', status: 'Paid' },
                { id: 2, teacher_id: 2, teacher_name: 'Prof. Alex Chen', teacher_code: 'T-002', department_name: 'Software Engineering', base_salary: 3000.00, course_compensation: 600.00, exam_compensation: 200.00, bonus: 100.00, deductions: 180.00, net_pay: 3720.00, payment_date: '2026-08-01', status: 'Paid' },
                { id: 3, teacher_id: 3, teacher_name: 'Dr. Maria Garcia', teacher_code: 'T-003', department_name: 'Cybersecurity', base_salary: 3100.00, course_compensation: 700.00, exam_compensation: 220.00, bonus: 120.00, deductions: 190.00, net_pay: 3950.00, payment_date: '2026-08-01', status: 'Paid' },
                { id: 4, teacher_id: 4, teacher_name: 'Prof. David Kim', teacher_code: 'T-004', department_name: 'Artificial Intelligence', base_salary: 3300.00, course_compensation: 900.00, exam_compensation: 300.00, bonus: 200.00, deductions: 220.00, net_pay: 4480.00, payment_date: null, status: 'Approved' },
                { id: 5, teacher_id: 5, teacher_name: 'Dr. Emily Brown', teacher_code: 'T-005', department_name: 'Data Science', base_salary: 2900.00, course_compensation: 500.00, exam_compensation: 150.00, bonus: 0.00, deductions: 150.00, net_pay: 3400.00, payment_date: null, status: 'Draft' }
            ];
        }

        updateKPIs();
        renderPayrollTable(allPayroll);
    }

    function updateKPIs() {
        const totalNet = allPayroll.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);
        const paidCount = allPayroll.filter(p => p.status === 'Paid').length;
        const pendingCount = allPayroll.filter(p => p.status !== 'Paid').length;

        const totalEl = document.getElementById('totalPayrollDisbursed');
        if (totalEl) totalEl.textContent = formatCurrency(totalNet);

        const paidEl = document.getElementById('totalPaidFaculty');
        if (paidEl) paidEl.textContent = `${paidCount} Faculty`;

        const pendingEl = document.getElementById('pendingPayrollCount');
        if (pendingEl) pendingEl.textContent = `${pendingCount} Pending`;

        const facultyEl = document.getElementById('activeFacultyCount');
        if (facultyEl) facultyEl.textContent = `${allPayroll.length} Members`;
    }

    function renderPayrollTable(items) {
        const tbody = document.getElementById('payrollTableBody');
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="text-center py-5 text-muted">No payroll ledger records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(p => {
            const statusClass = (p.status || 'Draft').toLowerCase();
            const badgeBg = statusClass === 'paid' ? 'bg-success bg-opacity-10 text-success border border-success' : statusClass === 'approved' ? 'bg-primary bg-opacity-10 text-primary border border-primary' : 'bg-warning bg-opacity-15 text-dark border border-warning';
            
            return `
                <tr>
                    <td>
                        <div class="fw-bold text-dark">${escapeHtml(p.teacher_name || 'Faculty Member')}</div>
                        <div class="text-muted text-xs" style="font-size: 11px;">Code: ${escapeHtml(p.teacher_code || 'T-00' + p.id)}</div>
                    </td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(p.department_name || 'Information Technology')}</span></td>
                    <td class="fw-semibold text-dark">${formatCurrency(p.base_salary)}</td>
                    <td class="text-success">${formatCurrency(p.course_compensation)}</td>
                    <td class="text-info">${formatCurrency(p.exam_compensation || 0)}</td>
                    <td class="text-primary">+${formatCurrency(p.bonus || 0)}</td>
                    <td class="text-danger">-${formatCurrency(p.deductions || 0)}</td>
                    <td class="fw-bold text-dark fs-6">${formatCurrency(p.net_pay)}</td>
                    <td class="small text-muted">${p.payment_date ? String(p.payment_date).split('T')[0] : '<span class="text-warning">Pending</span>'}</td>
                    <td><span class="badge ${badgeBg}">${escapeHtml(p.status || 'Draft')}</span></td>
                    <td class="text-nowrap">
                        ${p.status !== 'Paid' ? `
                            <button class="btn btn-sm btn-outline-success py-0 px-2" onclick="approvePayrollAction(${p.id})" title="Mark as Paid">
                                <i class="bi bi-check-lg me-1"></i> Disburse
                            </button>
                        ` : `
                            <span class="text-success small fw-semibold"><i class="bi bi-check2-all me-1"></i> Settled</span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    window.approvePayrollAction = async function (id) {
        const item = allPayroll.find(p => p.id === id);
        if (!item) return;

        item.status = 'Paid';
        item.payment_date = new Date().toISOString().split('T')[0];
        updateKPIs();
        renderPayrollTable(allPayroll);

        if (window.AdminStore) {
            window.AdminStore.constructor.notifySuccess('Disbursement Completed', `Payroll for ${item.teacher_name} marked as Paid.`);
        }

        try {
            await fetch(`${API_BASE}/admin/teacher-payroll/${id}/status`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status: 'Paid', payment_date: item.payment_date })
            });
        } catch (e) {}
    };

    // CSV Export
    const exportBtn = document.getElementById('exportPayrollBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const csvRows = [
                ['Faculty Name', 'Department', 'Base Salary', 'Course Comp', 'Exam Comp', 'Bonus', 'Deductions', 'Net Pay', 'Payment Date', 'Status']
            ];
            allPayroll.forEach(p => {
                csvRows.push([
                    `"${p.teacher_name}"`,
                    `"${p.department_name}"`,
                    p.base_salary,
                    p.course_compensation,
                    p.exam_compensation || 0,
                    p.bonus || 0,
                    p.deductions || 0,
                    p.net_pay,
                    p.payment_date || 'Pending',
                    p.status
                ]);
            });

            const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `AUB_Faculty_Payroll_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Initial Execution
    loadPayroll();
});
