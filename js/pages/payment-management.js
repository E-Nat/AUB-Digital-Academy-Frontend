// ==========================================
// AUB Digital Academy - Payment Management Controller
// Dedicated Financial Dashboard, Receipts Generator, ABA KHQR Integration & Refunds
// Integrated with SweetAlert2 & AdminMockStore
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
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

    let allPayments = [];
    let allStudents = [];
    let allCourses = [];

    // Modals
    const receiptModalEl = document.getElementById('receiptModal');
    const receiptModal = receiptModalEl ? new bootstrap.Modal(receiptModalEl) : null;

    const recordPaymentModalEl = document.getElementById('recordPaymentModal');
    const recordPaymentModal = recordPaymentModalEl ? new bootstrap.Modal(recordPaymentModalEl) : null;

    // ==========================================
    // 1. DATA LOADING & KPI CALCULATION
    // ==========================================
    async function loadInitialData() {
        if (window.AdminStore) {
            allStudents = window.AdminStore.getUsers().filter(u => u.role === 'STUDENT');
            allCourses = window.AdminStore.getCourses();
        }
        await loadPayments();
    }

    window.loadPayments = async function () {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/payments`, { headers: getHeaders(), signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allPayments = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allPayments = window.AdminStore.getPayments();
        }

        updatePaymentKPIs();
        applyPaymentFilters();
    };

    function updatePaymentKPIs() {
        const paidItems = allPayments.filter(p => p.payment_status === 'Paid');
        const pendingItems = allPayments.filter(p => p.payment_status === 'Pending');
        const refundedItems = allPayments.filter(p => p.payment_status === 'Refunded');

        const totalRevenue = paidItems.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const refundedTotal = refundedItems.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        document.getElementById('kpiTotalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('totalRevenueBadge').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('kpiPaidCount').textContent = `${paidItems.length} successful payment${paidItems.length === 1 ? '' : 's'}`;
        document.getElementById('kpiPendingCount').textContent = `${pendingItems.length}`;
        document.getElementById('kpiRefundedTotal').textContent = `$${refundedTotal.toFixed(2)}`;
        document.getElementById('kpiRefundedCount').textContent = `${refundedItems.length} refund${refundedItems.length === 1 ? '' : 's'} recorded`;
    }

    // ==========================================
    // 2. PAYMENTS TABLE RENDERING
    // ==========================================
    function getPaymentStatusBadge(status) {
        switch (status) {
            case 'Paid':
                return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Paid</span>`;
            case 'Pending':
                return `<span class="badge bg-warning bg-opacity-15 text-dark border border-warning px-2 py-1"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
            case 'Refunded':
                return `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-arrow-counterclockwise me-1"></i>Refunded</span>`;
            case 'Failed':
            default:
                return `<span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1"><i class="bi bi-x-circle me-1"></i>Failed</span>`;
        }
    }

    function renderPaymentsTable(payments) {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) return;

        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="bi bi-cash-stack fs-1 d-block mb-2 text-secondary opacity-50"></i>
                        <h6 class="fw-bold text-dark mb-1">No Payment Transactions Found</h6>
                        <p class="small text-muted mb-0">Try changing your search filters or record a new offline payment.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = payments.map(p => {
            const avatar = p.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100';
            const txnId = p.transaction_id || `TXN-${p.id}`;
            const invNum = p.invoice_number || `INV-2026-${String(1000 + Number(p.id))}`;
            const dateStr = p.payment_date ? String(p.payment_date).replace('T', ' ').slice(0, 16) : 'Just now';

            return `
                <tr>
                    <td>
                        <div>
                            <span class="badge bg-light text-primary border fw-semibold" style="font-size: 11px;">${escapeHtml(txnId)}</span>
                            <div class="text-muted small mt-0.5" style="font-size: 11px;">${escapeHtml(invNum)}</div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${escapeHtml(avatar)}" class="rounded-circle object-fit-cover border" style="width: 32px; height: 32px;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100'">
                            <div>
                                <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(p.student_name || 'Student')}</div>
                                <div class="text-muted" style="font-size: 11px;">${escapeHtml(p.student_uni_id || p.student_email || 'AUB Student')}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="fw-semibold text-dark" style="font-size: 12.5px;">${escapeHtml(p.course_title || 'Academic Course')}</span>
                    </td>
                    <td>
                        <span class="fw-bold text-dark fs-6">$${Number(p.amount).toFixed(2)}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-1.5">
                            <i class="bi bi-credit-card-2-front text-primary opacity-75"></i>
                            <span class="text-dark fw-medium" style="font-size: 12px;">${escapeHtml(p.payment_method || 'ABA PAY')}</span>
                        </div>
                    </td>
                    <td>
                        ${getPaymentStatusBadge(p.payment_status || 'Paid')}
                    </td>
                    <td>
                        <div class="text-muted small" style="font-size: 11.5px;"><i class="bi bi-calendar3 me-1 opacity-75"></i>${dateStr}</div>
                    </td>
                    <td class="text-end pe-3">
                        <div class="d-flex justify-content-end gap-1">
                            <button class="action-btn" title="View Official Receipt" onclick="openReceiptModal(${p.id})">
                                <i class="bi bi-receipt"></i>
                            </button>
                            ${p.payment_status === 'Paid' ? `
                                <button class="action-btn delete" title="Refund Payment" onclick="refundPaymentAction(${p.id})">
                                    <i class="bi bi-arrow-counterclockwise"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================
    // 3. SEARCH & FILTERS
    // ==========================================
    function applyPaymentFilters() {
        const q = (document.getElementById('paymentFilterSearch')?.value || document.getElementById('paymentGlobalSearch')?.value || '').toLowerCase().trim();
        const status = document.getElementById('paymentFilterStatus')?.value || 'all';
        const method = document.getElementById('paymentFilterMethod')?.value || 'all';

        const filtered = allPayments.filter(p => {
            const matchQ = !q ||
                (p.transaction_id && p.transaction_id.toLowerCase().includes(q)) ||
                (p.invoice_number && p.invoice_number.toLowerCase().includes(q)) ||
                (p.student_name && p.student_name.toLowerCase().includes(q)) ||
                (p.student_email && p.student_email.toLowerCase().includes(q)) ||
                (p.course_title && p.course_title.toLowerCase().includes(q));

            const matchStatus = status === 'all' || 
                (p.payment_status && p.payment_status.toLowerCase() === status.toLowerCase());

            const matchMethod = method === 'all' || 
                (p.payment_method && p.payment_method.toLowerCase().includes(method.toLowerCase()));

            return matchQ && matchStatus && matchMethod;
        });

        renderPaymentsTable(filtered);
    }

    window.resetPaymentFilters = function () {
        if (document.getElementById('paymentFilterSearch')) document.getElementById('paymentFilterSearch').value = '';
        if (document.getElementById('paymentGlobalSearch')) document.getElementById('paymentGlobalSearch').value = '';
        if (document.getElementById('paymentFilterStatus')) document.getElementById('paymentFilterStatus').value = 'all';
        if (document.getElementById('paymentFilterMethod')) document.getElementById('paymentFilterMethod').value = 'all';
        applyPaymentFilters();
    };

    ['paymentFilterSearch', 'paymentGlobalSearch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', applyPaymentFilters);
    });

    ['paymentFilterStatus', 'paymentFilterMethod'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyPaymentFilters);
    });

    // ==========================================
    // 4. RECEIPT INSPECTOR MODAL
    // ==========================================
    window.openReceiptModal = function (paymentId) {
        const p = allPayments.find(pay => pay.id === paymentId);
        if (!p) return;

        const body = document.getElementById('receiptModalBody');
        if (!body) return;

        const txnId = p.transaction_id || `TXN-${p.id}`;
        const invNum = p.invoice_number || `INV-2026-${String(1000 + Number(p.id))}`;
        const dateStr = p.payment_date ? String(p.payment_date).replace('T', ' ').slice(0, 16) : '2026-08-20 10:00';

        body.innerHTML = `
            <div class="border rounded-3 p-4 bg-white shadow-sm position-relative">
                <!-- Watermark Stamp -->
                <div class="position-absolute top-50 start-50 translate-middle text-uppercase fw-extrabold ${p.payment_status === 'Refunded' ? 'text-danger' : 'text-success'} opacity-10" style="font-size: 60px; transform: translate(-50%, -50%) rotate(-25deg); pointer-events: none;">
                    ${p.payment_status === 'Refunded' ? 'REFUNDED' : 'PAID'}
                </div>

                <!-- Brand Header -->
                <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <img src="../../assets/logos/rel_icon.png" alt="AUB Logo" style="width: 40px; height: 40px;">
                        <div>
                            <h6 class="fw-bold text-dark mb-0">AUB Digital Academy</h6>
                            <span class="text-muted small">Bursar & Finance Office</span>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1">${escapeHtml(invNum)}</span>
                        <div class="text-muted small mt-1">${dateStr}</div>
                    </div>
                </div>

                <!-- Bill Details -->
                <div class="row g-3 mb-3">
                    <div class="col-6">
                        <span class="text-muted text-xs text-uppercase fw-semibold">Billed To:</span>
                        <div class="fw-bold text-dark mt-0.5">${escapeHtml(p.student_name || 'Student')}</div>
                        <div class="text-muted small">${escapeHtml(p.student_uni_id || 'ID: 202401234')}</div>
                        <div class="text-muted small">${escapeHtml(p.student_email || 'student@aub.edu.kh')}</div>
                    </div>
                    <div class="col-6 text-end">
                        <span class="text-muted text-xs text-uppercase fw-semibold">Payment Details:</span>
                        <div class="fw-semibold text-dark mt-0.5">${escapeHtml(p.payment_method || 'ABA PAY / KHQR')}</div>
                        <div class="text-muted small">TXN: ${escapeHtml(txnId)}</div>
                        <div class="mt-1">${getPaymentStatusBadge(p.payment_status || 'Paid')}</div>
                    </div>
                </div>

                <!-- Itemized Breakdown -->
                <div class="table-responsive mb-3">
                    <table class="table table-sm table-bordered mb-0">
                        <thead class="bg-light">
                            <tr>
                                <th class="text-xs text-uppercase text-muted">Item Description</th>
                                <th class="text-end text-xs text-uppercase text-muted" style="width: 100px;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="fw-semibold text-dark">${escapeHtml(p.course_title || 'Academic Specialized Course')}</span>
                                    <div class="text-muted small">Full Semester Course Tuition & Platform Access</div>
                                </td>
                                <td class="text-end fw-bold text-dark">$${Number(p.amount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="bg-light">
                                <th class="fw-bold text-dark">Total Paid:</th>
                                <th class="text-end fw-bold text-success fs-6">$${Number(p.amount).toFixed(2)}</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                ${p.notes ? `
                    <div class="p-2 bg-light rounded border small text-muted mb-0">
                        <strong>Notes:</strong> ${escapeHtml(p.notes)}
                    </div>
                ` : ''}

                <div class="text-center text-muted small mt-3 pt-2 border-top" style="font-size: 11px;">
                    Thank you for enrolling with American University of Phnom Penh (AUB Digital Academy).
                </div>
            </div>
        `;

        if (receiptModal) receiptModal.show();
    };

    // ==========================================
    // 5. REFUND PAYMENT ACTION
    // ==========================================
    window.refundPaymentAction = async function (paymentId) {
        const p = allPayments.find(pay => pay.id === paymentId);
        if (!p) return;

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Refund Payment?',
                `Are you sure you want to issue a refund of $${Number(p.amount).toFixed(2)} to ${p.student_name}? This will also cancel the corresponding student enrollment.`,
                'Confirm Refund',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to refund $${Number(p.amount).toFixed(2)} to ${p.student_name}?`);
        }

        if (!confirmed) return;

        try {
            if (window.AdminStore) {
                window.AdminStore.refundPayment(paymentId);
                allPayments = window.AdminStore.getPayments();
            }

            const res = await fetch(`${API_BASE}/admin/payments/${paymentId}/refund`, { method: 'PATCH', headers: getHeaders() });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.message) throw new Error(errData.message);
            }

            updatePaymentKPIs();
            applyPaymentFilters();
            if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Refund Processed', `Payment #${p.id} of $${Number(p.amount).toFixed(2)} has been refunded.`);
        } catch (err) {
            if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to Refund', err.message);
            loadPayments();
        }
    };

    // ==========================================
    // 6. RECORD MANUAL PAYMENT MODAL & SUBMIT
    // ==========================================
    window.openRecordPaymentModal = function () {
        const form = document.getElementById('recordPaymentForm');
        if (form) form.reset();

        const studentSelect = document.getElementById('payStudentSelect');
        if (studentSelect && allStudents.length > 0) {
            studentSelect.innerHTML = allStudents.map(s => `
                <option value="${s.id}">${escapeHtml(s.full_name)} (${escapeHtml(s.university_id || s.email)})</option>
            `).join('');
        }

        const courseSelect = document.getElementById('payCourseSelect');
        if (courseSelect && allCourses.length > 0) {
            courseSelect.innerHTML = allCourses.map(c => `
                <option value="${c.id}" data-price="${c.price || 0}">${escapeHtml(c.title)} - $${Number(c.price || 0).toFixed(2)}</option>
            `).join('');

            courseSelect.onchange = function () {
                const opt = courseSelect.options[courseSelect.selectedIndex];
                if (opt) {
                    const price = parseFloat(opt.getAttribute('data-price')) || 0;
                    document.getElementById('payAmount').value = price.toFixed(2);
                }
            };
            if (courseSelect.options.length > 0) {
                const initPrice = parseFloat(courseSelect.options[0].getAttribute('data-price')) || 250;
                document.getElementById('payAmount').value = initPrice.toFixed(2);
            }
        }

        if (recordPaymentModal) recordPaymentModal.show();
    };

    const recordPaymentForm = document.getElementById('recordPaymentForm');
    if (recordPaymentForm) {
        recordPaymentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const studentId = parseInt(document.getElementById('payStudentSelect').value);
            const courseId = parseInt(document.getElementById('payCourseSelect').value);
            const amount = parseFloat(document.getElementById('payAmount').value) || 0;
            const method = document.getElementById('payMethod').value;
            const status = document.getElementById('payStatus').value;
            const notes = document.getElementById('payNotes').value.trim();

            const payload = {
                user_id: studentId,
                course_id: courseId,
                amount: amount,
                payment_method: method,
                payment_status: status,
                notes: notes
            };

            const saveBtn = document.getElementById('savePaymentBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
            }

            try {
                if (window.AdminStore) {
                    window.AdminStore.createPayment(payload);
                    allPayments = window.AdminStore.getPayments();
                }

                if (recordPaymentModal) recordPaymentModal.hide();
                updatePaymentKPIs();
                applyPaymentFilters();
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Payment Recorded', `Transaction of $${amount.toFixed(2)} logged.`);

                await fetch(`${API_BASE}/admin/payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to Record Payment', err.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Record Transaction`;
                }
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize Page
    loadInitialData();
});
