// ==========================================
// AUB Digital Academy - Enrollment Management Controller
// Full Frontend CRUD, Validation, SweetAlert2 Alerts, Dynamic Progress Sliders, View Modal & CSV Export
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

    let allEnrollments = [];
    let currentEnrollmentInView = null;

    // Modals
    const addModalEl = document.getElementById('addEnrollmentModal');
    const addModal = addModalEl ? new bootstrap.Modal(addModalEl) : null;

    const editModalEl = document.getElementById('editEnrollmentModal');
    const editModal = editModalEl ? new bootstrap.Modal(editModalEl) : null;

    const viewModalEl = document.getElementById('viewEnrollmentModal');
    const viewModal = viewModalEl ? new bootstrap.Modal(viewModalEl) : null;

    // Progress Range Sliders Labels Binding
    const addRange = document.getElementById('enrollProgressRange');
    const addRangeLabel = document.getElementById('addProgressLabel');
    if (addRange && addRangeLabel) {
        addRange.addEventListener('input', () => {
            addRangeLabel.textContent = `${addRange.value}%`;
        });
    }

    const editRange = document.getElementById('editEnrollProgressRange');
    const editRangeLabel = document.getElementById('editProgressLabel');
    if (editRange && editRangeLabel) {
        editRange.addEventListener('input', () => {
            editRangeLabel.textContent = `${editRange.value}%`;
        });
    }

    // 1. Load Enrollments
    async function loadEnrollments() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/enrollments`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allEnrollments = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allEnrollments = window.AdminStore.getEnrollments();
        }

        applyFilters();
    }

    function getPaymentBadgeHtml(paymentStatus) {
        const pStatus = (paymentStatus || 'Paid').toLowerCase();
        if (pStatus === 'paid') {
            return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Paid</span>`;
        } else if (pStatus === 'pending') {
            return `<span class="badge bg-warning bg-opacity-15 text-dark border border-warning px-2 py-1"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
        } else if (pStatus === 'refunded') {
            return `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-arrow-counterclockwise me-1"></i>Refunded</span>`;
        }
        return `<span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1">${escapeHtml(paymentStatus || 'Unpaid')}</span>`;
    }

    function renderEnrollments(items) {
        const tbody = document.getElementById('enrollmentsTableBody');
        const countEl = document.getElementById('enrollmentRecordCount');
        if (!tbody) return;

        if (countEl) {
            countEl.textContent = `Showing ${items.length} of ${allEnrollments.length} enrollments`;
        }

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="bi bi-person-x fs-3 d-block mb-2 text-secondary opacity-50"></i>
                        <span class="fw-semibold">No enrollment records match your search</span>
                        <div style="font-size: 11.5px;" class="mt-1">Try resetting the status filter or search keyword.</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = items.map(e => {
            const statusClass = (e.status || 'Active').toLowerCase();
            const isDone = statusClass === 'completed' || e.progress_percentage === 100;
            const course = window.AdminStore ? window.AdminStore.getCourseById(e.course_id) : null;
            const courseTimeline = (course && course.start_date && course.end_date)
                ? `<div class="text-dark fw-semibold" style="font-size: 11.5px;"><i class="bi bi-calendar-event text-primary me-1"></i>${String(course.start_date).split('T')[0]} &rarr; ${String(course.end_date).split('T')[0]}</div>`
                : `<div class="text-muted small" style="font-size: 11px;">Enrolled: ${formatDate(e.enrollment_date)}</div>`;

            return `
                <tr>
                    <td class="text-muted fw-bold" style="font-size: 12px;">#ENR-${e.id}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${e.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="rounded-circle object-fit-cover border shadow-sm" style="width: 32px; height: 32px;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                            <div>
                                <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(e.student_name || 'Student')}</div>
                                <div class="text-muted" style="font-size: 11px;">${escapeHtml(e.student_uni_id || e.student_email || '')}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="fw-semibold text-dark" style="font-size: 12.5px;">${escapeHtml(e.course_title || 'Academic Course')}</span>
                        <div class="text-muted" style="font-size: 10.5px;">${escapeHtml(e.major || 'Computer Science')}</div>
                    </td>
                    <td>
                        ${getPaymentBadgeHtml(e.payment_status || 'Paid')}
                    </td>
                    <td>
                        ${courseTimeline}
                    </td>
                    <td style="width: 130px;">
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress flex-grow-1" style="height: 6px; background: #F1F5F9; border-radius: 6px;">
                                <div class="progress-bar ${isDone ? 'bg-success' : 'bg-primary'}" style="width: ${e.progress_percentage || 0}%; border-radius: 6px;"></div>
                            </div>
                            <span class="fw-bold text-muted" style="font-size: 11px;">${e.progress_percentage || 0}%</span>
                        </div>
                    </td>
                    <td>
                        <span class="admin-status-badge ${statusClass}">
                            <i class="bi ${statusClass === 'completed' ? 'bi-check2-all' : statusClass === 'pending' ? 'bi-clock' : statusClass === 'cancelled' || statusClass === 'dropped' ? 'bi-x-circle' : 'bi-check-circle-fill'} me-1"></i>
                            ${escapeHtml(e.status || 'Active')}
                        </span>
                    </td>
                    <td class="text-end pe-3">
                        <div class="dropdown d-inline-block">
                            <button class="btn btn-light btn-sm border py-1 px-2 dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="font-size: 12px;">
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="openViewEnrollmentModal(${e.id})">
                                        <i class="bi bi-eye text-primary me-2"></i> View Details
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="openEditEnrollmentModal(${e.id})">
                                        <i class="bi bi-pencil text-secondary me-2"></i> Update Progress
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5 text-success" href="javascript:void(0)" onclick="approveEnrollmentAction(${e.id})">
                                        <i class="bi bi-check2-circle text-success me-2"></i> Approve Admission
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="payment-management.html">
                                        <i class="bi bi-credit-card text-info me-2"></i> View Payment Record
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="user-management.html">
                                        <i class="bi bi-person text-dark me-2"></i> View Student Profile
                                    </a>
                                </li>
                                <li><hr class="dropdown-divider my-1"></li>
                                <li>
                                    <a class="dropdown-item py-1.5 text-danger" href="javascript:void(0)" onclick="deleteEnrollment(${e.id})">
                                        <i class="bi bi-x-circle text-danger me-2"></i> Cancel Enrollment
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function applyFilters() {
        const searchInput = document.getElementById('enrollmentSearchInput');
        const statusFilter = document.getElementById('enrollmentStatusFilter');
        const paymentFilter = document.getElementById('enrollmentPaymentFilter');

        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const statusVal = statusFilter ? statusFilter.value.toLowerCase() : 'all';
        const payVal = paymentFilter ? paymentFilter.value.toLowerCase() : 'all';

        const filtered = allEnrollments.filter(item => {
            const matchQuery = !q || 
                (item.student_name && item.student_name.toLowerCase().includes(q)) ||
                (item.course_title && item.course_title.toLowerCase().includes(q)) ||
                (item.student_uni_id && item.student_uni_id.toLowerCase().includes(q)) ||
                (item.student_email && item.student_email.toLowerCase().includes(q));

            const itemStatus = (item.status || 'Active').toLowerCase();
            const matchStatus = statusVal === 'all' || itemStatus === statusVal;

            const itemPay = (item.payment_status || 'Paid').toLowerCase();
            const matchPay = payVal === 'all' || itemPay === payVal;

            return matchQuery && matchStatus && matchPay;
        });

        renderEnrollments(filtered);
    }

    const searchInput = document.getElementById('enrollmentSearchInput');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    const statusFilter = document.getElementById('enrollmentStatusFilter');
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    const paymentFilter = document.getElementById('enrollmentPaymentFilter');
    if (paymentFilter) paymentFilter.addEventListener('change', applyFilters);

    window.resetEnrollmentFilters = function () {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (paymentFilter) paymentFilter.value = 'all';
        applyFilters();
        if (window.AdminStore) window.AdminStore.constructor.toast('Enrollment filters reset', 'info');
    };

    window.approveEnrollmentAction = function (id) {
        const enr = allEnrollments.find(e => e.id === id);
        if (!enr) return;
        enr.status = 'Active';
        enr.payment_status = 'Paid';
        if (window.AdminStore) {
            window.AdminStore.updateEnrollment(id, { status: 'Active', payment_status: 'Paid' });
            window.AdminStore.constructor.notifySuccess('Admission Approved', `Student ${enr.student_name} is confirmed as Active in ${enr.course_title}.`);
        }
        applyFilters();
    };

    // 2. Add Enrollment Modal
    window.openAddEnrollmentModal = function () {
        const form = document.getElementById('addEnrollmentForm');
        if (form) form.reset();

        const dateInput = document.getElementById('enrollDate');
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

        if (addRange) addRange.value = 0;
        if (addRangeLabel) addRangeLabel.textContent = '0%';

        populateEnrollmentSelects();
        if (addModal) addModal.show();
    };

    function populateEnrollmentSelects() {
        const studentSelect = document.getElementById('enrollStudentSelect');
        const courseSelect = document.getElementById('enrollCourseSelect');

        if (studentSelect && window.AdminStore) {
            const students = window.AdminStore.getUsers().filter(u => (u.role || '').toUpperCase() === 'STUDENT');
            studentSelect.innerHTML = students.map(s => `
                <option value="${s.id}">${escapeHtml(s.full_name)} (${escapeHtml(s.university_id || 'ID')}) - ${escapeHtml(s.major || 'Student')}</option>
            `).join('');
        }

        if (courseSelect && window.AdminStore) {
            const courses = window.AdminStore.getCourses();
            courseSelect.innerHTML = courses.map(c => `
                <option value="${c.id}">${escapeHtml(c.title)} (${escapeHtml(c.difficulty || 'Course')})</option>
            `).join('');
        }
    }

    const addEnrollmentForm = document.getElementById('addEnrollmentForm');
    if (addEnrollmentForm) {
        addEnrollmentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const studentId = parseInt(document.getElementById('enrollStudentSelect').value);
            const courseId = parseInt(document.getElementById('enrollCourseSelect').value);
            const date = document.getElementById('enrollDate').value;
            const status = document.getElementById('enrollStatus').value;
            const progress = parseInt(document.getElementById('enrollProgressRange').value) || 0;

            const payload = {
                student_id: studentId,
                course_id: courseId,
                enrollment_date: date,
                status: status,
                progress_percentage: progress
            };

            try {
                let newEnr = null;
                if (window.AdminStore) {
                    newEnr = window.AdminStore.createEnrollment(payload);
                    allEnrollments = window.AdminStore.getEnrollments();
                }

                if (addModal) addModal.hide();
                applyFilters();

                if (window.AdminStore && newEnr) {
                    window.AdminStore.constructor.notifySuccess(
                        'Student Enrolled',
                        `${newEnr.student_name} has been enrolled into "${newEnr.course_title}".`
                    );
                }

                const res = await fetch(`${API_BASE}/admin/enrollments`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    if (errData.message) {
                        throw new Error(errData.message);
                    }
                }
            } catch (err) {
                if (window.AdminStore) {
                    window.AdminStore.constructor.notifyError('Enrollment Prohibited', err.message || 'Duplicate enrollment or error occurred.');
                } else {
                    alert(err.message || 'Failed to create enrollment.');
                }
                loadEnrollments();
            }
        });
    }

    // 3. Edit Enrollment Modal
    window.openEditEnrollmentModal = function (enrollmentId) {
        const enr = allEnrollments.find(e => e.id === enrollmentId);
        if (!enr) return;

        document.getElementById('editEnrollmentId').value = enr.id;
        document.getElementById('editStudentName').textContent = enr.student_name || 'Student';
        document.getElementById('editCourseTitle').textContent = enr.course_title || 'Academic Course';
        document.getElementById('editEnrollStatus').value = enr.status || 'Active';
        
        const prog = enr.progress_percentage || 0;
        if (editRange) editRange.value = prog;
        if (editRangeLabel) editRangeLabel.textContent = `${prog}%`;

        if (editModal) editModal.show();
    };

    const editEnrollmentForm = document.getElementById('editEnrollmentForm');
    if (editEnrollmentForm) {
        editEnrollmentForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const id = parseInt(document.getElementById('editEnrollmentId').value);
            const status = document.getElementById('editEnrollStatus').value;
            const progress = parseInt(document.getElementById('editEnrollProgressRange').value) || 0;

            const payload = {
                status: status,
                progress_percentage: progress
            };

            if (window.AdminStore) {
                window.AdminStore.updateEnrollment(id, payload);
                allEnrollments = window.AdminStore.getEnrollments();
                if (editModal) editModal.hide();
                applyFilters();
                window.AdminStore.constructor.notifySuccess('Enrollment Updated', 'Student progress and status updated successfully.');
            }
        });
    }

    // 4. View Enrollment Details Modal
    window.openViewEnrollmentModal = function (enrollmentId) {
        const enr = allEnrollments.find(e => e.id === enrollmentId);
        if (!enr) return;

        currentEnrollmentInView = enr;
        const statusClass = (enr.status || 'Active').toLowerCase();

        const body = document.getElementById('viewEnrollmentBody');
        if (body) {
            body.innerHTML = `
                <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3 border">
                    <img src="${enr.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="rounded-circle object-fit-cover shadow-sm" style="width: 48px; height: 48px; border: 2px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                    <div>
                        <div class="fw-bold text-dark" style="font-size: 14px;">${escapeHtml(enr.student_name)}</div>
                        <div class="text-muted" style="font-size: 12px;">University ID: ${escapeHtml(enr.student_uni_id || 'N/A')} | ${escapeHtml(enr.student_email || '')}</div>
                        <div class="mt-1">
                            <span class="admin-status-badge ${statusClass}">${escapeHtml(enr.status || 'Active')}</span>
                        </div>
                    </div>
                </div>

                <div class="row g-2 text-sm mb-3" style="font-size: 13px;">
                    <div class="col-6 py-1 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">ENROLLMENT ID</span>
                        <span class="fw-bold text-dark">#ENR-${enr.id}</span>
                    </div>
                    <div class="col-6 py-1 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">ENROLLED DATE</span>
                        <span class="fw-semibold text-dark">${formatDate(enr.enrollment_date)}</span>
                    </div>
                    <div class="col-12 py-2 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">COURSE / DEGREE PATHWAY</span>
                        <span class="fw-bold text-primary" style="font-size: 13.5px;">${escapeHtml(enr.course_title)}</span>
                    </div>
                </div>

                <div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="text-muted fw-semibold" style="font-size: 12px;">Syllabus Completion</span>
                        <span class="fw-bold text-primary" style="font-size: 13px;">${enr.progress_percentage || 0}%</span>
                    </div>
                    <div class="progress" style="height: 8px; background: #F1F5F9; border-radius: 6px;">
                        <div class="progress-bar ${enr.progress_percentage === 100 ? 'bg-success' : 'bg-primary'}" style="width: ${enr.progress_percentage || 0}%; border-radius: 6px;"></div>
                    </div>
                </div>
            `;
        }

        if (viewModal) viewModal.show();
    };

    const editFromEnrollViewBtn = document.getElementById('editFromEnrollViewBtn');
    if (editFromEnrollViewBtn) {
        editFromEnrollViewBtn.addEventListener('click', function () {
            if (viewModal) viewModal.hide();
            if (currentEnrollmentInView) {
                openEditEnrollmentModal(currentEnrollmentInView.id);
            }
        });
    }

    // 5. Delete Enrollment
    window.deleteEnrollment = async function (id) {
        const enr = allEnrollments.find(e => e.id === id);
        const name = enr ? `${enr.student_name} (${enr.course_title})` : 'this enrollment';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Cancel Enrollment?',
                `Are you sure you want to cancel the enrollment for ${name}?`,
                'Yes, Cancel Enrollment',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to cancel ${name}?`);
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteEnrollment(id);
            allEnrollments = window.AdminStore.getEnrollments();
            window.AdminStore.constructor.toast('Enrollment record removed', 'success');
        } else {
            allEnrollments = allEnrollments.filter(e => e.id !== id);
        }

        applyFilters();
    };

    // 6. Export CSV
    window.exportEnrollmentsCSV = function () {
        if (allEnrollments.length === 0) {
            if (window.AdminStore) window.AdminStore.constructor.notifyWarning('No Records', 'No enrollments to export.');
            return;
        }

        const headers = ['Enrollment ID', 'Student Name', 'University ID', 'Course Title', 'Enrollment Date', 'Progress (%)', 'Status'];
        const rows = allEnrollments.map(e => [
            `"#ENR-${e.id}"`,
            `"${(e.student_name || '').replace(/"/g, '""')}"`,
            `"${e.student_uni_id || ''}"`,
            `"${(e.course_title || '').replace(/"/g, '""')}"`,
            formatDate(e.enrollment_date),
            e.progress_percentage || 0,
            e.status || 'Active'
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `AUB_Enrollments_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`Exported ${allEnrollments.length} enrollment records to CSV`, 'success');
        }
    };

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadEnrollments();
});
