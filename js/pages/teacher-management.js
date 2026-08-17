/**
 * AUB Digital Academy - Teacher Management Controller
 * Handles CRUD, department filtering, pagination, live search, and academic relationships.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current User / Session Check
    let currentUser = null;
    try {
        const stored = localStorage.getItem('aub_user') || localStorage.getItem('aub_auth_user');
        if (stored) currentUser = JSON.parse(stored);
    } catch (e) {}

    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    const API_BASE = (isLocal && window.location.port !== '5000') ? 'http://localhost:5000/api' : '/api';

    function getAuthToken() {
        return localStorage.getItem('aub_auth_token') || 
               localStorage.getItem('token') || 
               localStorage.getItem('aub_token') || '';
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
    };

    // State Variables
    let currentPage = 1;
    const pageSize = 10;
    let totalRecords = 0;
    let totalPages = 1;

    let currentSearch = '';
    let currentDepartment = '';
    let currentStatus = 'ALL';
    let currentEmploymentType = '';

    let departmentsList = [];
    let allCoursesList = [];
    let teachersList = [];
    let selectedViewTeacherId = null;

    // DOM Elements
    const searchInput = document.getElementById('teacherSearchInput');
    const departmentFilterSelect = document.getElementById('departmentFilterSelect');
    const employmentTypeFilterSelect = document.getElementById('employmentTypeFilterSelect');
    const teachersTableBody = document.getElementById('teachersTableBody');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');

    const teacherModal = new bootstrap.Modal(document.getElementById('teacherModal'));
    const viewTeacherModal = new bootstrap.Modal(document.getElementById('viewTeacherModal'));
    const teacherForm = document.getElementById('teacherForm');
    const teacherDepartmentSelect = document.getElementById('teacherDepartmentSelect');
    const courseCheckboxesContainer = document.getElementById('courseCheckboxesContainer');

    // Debounce Timer
    let searchDebounce = null;

    // Mobile Sidebar Toggle
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    if (mobileToggle && adminSidebar) {
        mobileToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('show');
        });
    }

    /**
     * 1. Load Departments
     */
    async function loadDepartments() {
        try {
            const res = await fetch(`${API_BASE}/departments`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    departmentsList = data.data;
                }
            }
        } catch (e) {
            console.error('Failed to load departments from API, using fallback:', e);
            departmentsList = [
                { id: 1, name: 'Computer Science', code: 'CS' },
                { id: 2, name: 'Information Technology', code: 'IT' },
                { id: 3, name: 'Business Administration', code: 'BA' },
                { id: 4, name: 'Finance & Banking', code: 'FIN' },
                { id: 5, name: 'Accounting', code: 'ACC' },
                { id: 6, name: 'Marketing', code: 'MKT' },
                { id: 7, name: 'Economics', code: 'ECON' },
                { id: 8, name: 'Engineering', code: 'ENG' },
                { id: 9, name: 'Languages', code: 'LANG' },
                { id: 10, name: 'Law', code: 'LAW' }
            ];
        }

        // Populate Filters and Form Select
        departmentFilterSelect.innerHTML = '<option value="">All Departments</option>';
        teacherDepartmentSelect.innerHTML = '<option value="" disabled selected>Select Department...</option>';

        departmentsList.forEach(dept => {
            const opt1 = document.createElement('option');
            opt1.value = dept.id;
            opt1.textContent = `${dept.name} (${dept.code})`;
            departmentFilterSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = dept.id;
            opt2.textContent = `${dept.name} (${dept.code})`;
            teacherDepartmentSelect.appendChild(opt2);
        });

        const kpiTotalDepts = document.getElementById('kpiTotalDepartments');
        if (kpiTotalDepts) kpiTotalDepts.textContent = departmentsList.length;
    }

    /**
     * 2. Load Courses for Checkboxes
     */
    async function loadCourses() {
        try {
            const res = await fetch(`${API_BASE}/public/courses`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allCoursesList = data.data;
                }
            }
        } catch (e) {
            allCoursesList = [
                { id: 1, title: 'Full-Stack Web Development' },
                { id: 2, title: 'Advanced UI/UX Design' },
                { id: 3, title: 'Cyber Security Essentials' },
                { id: 4, title: 'Applied Data Science with Python' }
            ];
        }

        renderCourseCheckboxes();
    }

    function renderCourseCheckboxes(selectedCourseIds = []) {
        if (allCoursesList.length === 0) {
            courseCheckboxesContainer.innerHTML = `<div class="text-muted text-xs">No courses available.</div>`;
            return;
        }

        courseCheckboxesContainer.innerHTML = allCoursesList.map(course => {
            const isChecked = selectedCourseIds.includes(course.id) ? 'checked' : '';
            return `
                <div class="form-check mb-1">
                    <input class="form-check-input course-assign-checkbox" type="checkbox" value="${course.id}" id="courseChk_${course.id}" ${isChecked}>
                    <label class="form-check-label text-sm" for="courseChk_${course.id}">
                        ${escapeHtml(course.title)}
                    </label>
                </div>
            `;
        }).join('');
    }

    /**
     * 3. Load Real-Time Statistics
     */
    async function loadStatistics() {
        try {
            const res = await fetch(`${API_BASE}/teachers/statistics`, { headers });
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    const stats = result.data;
                    document.getElementById('kpiTotalTeachers').textContent = stats.totalTeachers || 0;
                    document.getElementById('kpiActiveTeachers').textContent = stats.activeTeachers || 0;
                    document.getElementById('kpiOnLeaveTeachers').textContent = stats.teachersOnLeave || 0;
                    document.getElementById('kpiNewThisMonth').textContent = `+${stats.newTeachersThisMonth || 0} this month`;

                    document.getElementById('countAll').textContent = stats.totalTeachers || 0;
                    document.getElementById('countActive').textContent = stats.activeTeachers || 0;
                    document.getElementById('countOnLeave').textContent = stats.teachersOnLeave || 0;
                    document.getElementById('countInactive').textContent = stats.inactiveTeachers || 0;
                }
            }
        } catch (e) {
            console.error('Failed to load teacher statistics', e);
        }
    }

    /**
     * 4. Load Paginated Teachers List
     */
    async function loadTeachers() {
        teachersTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div> Loading teachers directory...
                </td>
            </tr>
        `;

        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                size: pageSize,
                search: currentSearch,
                department: currentDepartment,
                status: currentStatus !== 'ALL' ? currentStatus : '',
                employment_type: currentEmploymentType,
                include_deleted: currentStatus === 'Inactive' ? 'true' : 'false'
            });

            const res = await fetch(`${API_BASE}/teachers?${queryParams.toString()}`, { headers });
            if (res.ok) {
                const result = await res.json();
                if (result.success) {
                    teachersList = result.data || [];
                    totalRecords = result.pagination?.total || teachersList.length;
                    totalPages = result.pagination?.totalPages || 1;
                    renderTeachersTable();
                    renderPagination();
                    return;
                }
            }
            throw new Error('API request unsuccessful');
        } catch (e) {
            console.error('Error fetching teachers, using local fallback:', e);
            renderEmptyState('Unable to load teachers from server. Please check your network connection.');
        }
    }

    /**
     * 5. Render Teachers Table
     */
    function renderTeachersTable() {
        if (teachersList.length === 0) {
            renderEmptyState('No teachers found matching your search or filter criteria.');
            return;
        }

        teachersTableBody.innerHTML = teachersList.map(teacher => {
            const avatar = teacher.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150';
            const deptName = teacher.department_name || 'Academic Faculty';
            const deptCode = teacher.department_code || 'AUB';

            let statusBadge = '';
            if (teacher.status === 'Active') {
                statusBadge = `<span class="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded-pill"><i class="bi bi-dot"></i> Active</span>`;
            } else if (teacher.status === 'On Leave') {
                statusBadge = `<span class="badge bg-warning bg-opacity-10 text-warning fw-semibold px-2 py-1 rounded-pill"><i class="bi bi-dot"></i> On Leave</span>`;
            } else {
                statusBadge = `<span class="badge bg-secondary bg-opacity-10 text-secondary fw-semibold px-2 py-1 rounded-pill"><i class="bi bi-dot"></i> Inactive</span>`;
            }

            const coursesCount = teacher.total_courses || (teacher.courses ? teacher.courses.length : 0);
            const studentsCount = teacher.total_students || 0;

            return `
                <tr>
                    <td>
                        <img src="${escapeHtml(avatar)}" class="teacher-avatar-sm" alt="Avatar">
                    </td>
                    <td>
                        <div class="fw-bold text-dark text-sm">${escapeHtml(teacher.full_name)}</div>
                        <div class="text-xs text-muted">${escapeHtml(teacher.employment_type || 'Full-Time')} &bull; ${teacher.experience_years || 0} yrs exp</div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border font-monospace text-xs">${escapeHtml(teacher.teacher_code || 'TCH')}</span>
                    </td>
                    <td>
                        <span class="badge bg-primary bg-opacity-10 text-primary dept-badge" title="${escapeHtml(deptName)}">${escapeHtml(deptCode)}</span>
                        <div class="text-xs text-muted text-truncate" style="max-width: 140px;">${escapeHtml(deptName)}</div>
                    </td>
                    <td>
                        <div class="text-sm text-dark text-truncate" style="max-width: 180px;" title="${escapeHtml(teacher.specialization || '')}">${escapeHtml(teacher.specialization || 'General Faculty')}</div>
                        <div class="text-xs text-muted">${escapeHtml(teacher.office_room || 'Main Campus')}</div>
                    </td>
                    <td>
                        <a href="mailto:${escapeHtml(teacher.email)}" class="text-muted text-xs text-decoration-none hover-primary">
                            ${escapeHtml(teacher.email)}
                        </a>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-info bg-opacity-10 text-info fw-bold px-2 py-1 rounded-pill">
                            ${coursesCount} Course${coursesCount === 1 ? '' : 's'}
                        </span>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-light text-dark border text-xs px-2 py-1">
                            ${studentsCount} Student${studentsCount === 1 ? '' : 's'}
                        </span>
                    </td>
                    <td>
                        ${statusBadge}
                    </td>
                    <td class="text-end">
                        <div class="d-flex align-items-center justify-content-end gap-1">
                            <button class="btn btn-outline-primary btn-sm py-1 px-2" onclick="viewTeacherProfile(${teacher.teacher_id || teacher.id})" title="View Full Profile">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary btn-sm py-1 px-2" onclick="editTeacher(${teacher.teacher_id || teacher.id})" title="Edit Teacher">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm py-1 px-2" onclick="deleteTeacherConfirm(${teacher.teacher_id || teacher.id}, '${escapeHtml(teacher.full_name)}')" title="Deactivate / Safe Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderEmptyState(message) {
        teachersTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5">
                    <i class="bi bi-person-x text-muted" style="font-size: 2.5rem;"></i>
                    <h6 class="fw-bold mt-2 text-dark">No Teachers Found</h6>
                    <p class="text-muted text-xs mb-3">${escapeHtml(message)}</p>
                    <button class="btn btn-primary btn-sm px-3" onclick="document.getElementById('addTeacherBtn').click()">
                        <i class="bi bi-person-plus me-1"></i> Add New Teacher
                    </button>
                </td>
            </tr>
        `;
        paginationInfo.textContent = 'Showing 0–0 of 0 teachers';
        paginationControls.innerHTML = '';
    }

    /**
     * 6. Render Pagination
     */
    function renderPagination() {
        const start = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, totalRecords);
        paginationInfo.textContent = `Showing ${start}–${end} of ${totalRecords} teachers`;

        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }

        let html = '';
        // Previous Button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="goToPage(${currentPage - 1})">&laquo; Prev</button>
            </li>
        `;

        // Page Number Buttons
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <button class="page-link" onclick="goToPage(${i})">${i}</button>
                    </li>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Next Button
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="goToPage(${currentPage + 1})">Next &raquo;</button>
            </li>
        `;

        paginationControls.innerHTML = html;
    }

    window.goToPage = function(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        loadTeachers();
    };

    /**
     * 7. Dynamic Search & Filters Event Listeners
     */
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            loadTeachers();
        }, 300);
    });

    departmentFilterSelect.addEventListener('change', (e) => {
        currentDepartment = e.target.value;
        currentPage = 1;
        loadTeachers();
    });

    employmentTypeFilterSelect.addEventListener('change', (e) => {
        currentEmploymentType = e.target.value;
        currentPage = 1;
        loadTeachers();
    });

    document.querySelectorAll('#statusFilterTabs .filter-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statusFilterTabs .filter-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatus = btn.getAttribute('data-status');
            currentPage = 1;
            loadTeachers();
        });
    });

    /**
     * 8. Create / Edit Teacher Form Submission
     */
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('teacherId').value;
        const name = document.getElementById('teacherNameInput').value.trim();
        const email = document.getElementById('teacherEmailInput').value.trim();
        const code = document.getElementById('teacherCodeInput').value.trim();
        const deptId = document.getElementById('teacherDepartmentSelect').value;
        const status = document.getElementById('teacherStatusSelect').value;
        const specialization = document.getElementById('teacherSpecializationInput').value.trim();
        const employmentType = document.getElementById('teacherEmploymentTypeSelect').value;
        const experience = parseInt(document.getElementById('teacherExperienceInput').value) || 0;
        const room = document.getElementById('teacherRoomInput').value.trim();
        const phone = document.getElementById('teacherPhoneInput').value.trim();
        const bio = document.getElementById('teacherBioInput').value.trim();

        // Selected Course IDs
        const selectedCourses = [];
        document.querySelectorAll('.course-assign-checkbox:checked').forEach(chk => {
            selectedCourses.push(parseInt(chk.value));
        });

        const payload = {
            full_name: name,
            email: email,
            teacher_code: code,
            department_id: deptId ? parseInt(deptId) : null,
            status: status,
            specialization: specialization,
            employment_type: employmentType,
            experience_years: experience,
            office_room: room,
            phone: phone,
            bio: bio,
            course_ids: selectedCourses
        };

        const saveBtn = document.getElementById('saveTeacherBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

        try {
            let res;
            if (id) {
                res = await fetch(`${API_BASE}/teachers/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE}/teachers`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }

            const result = await res.json();
            if (res.ok && result.success) {
                teacherModal.hide();
                Swal.fire({
                    icon: 'success',
                    title: id ? 'Teacher Profile Updated!' : 'Teacher Created!',
                    text: result.message || 'The teacher directory has been successfully updated.',
                    timer: 1800,
                    showConfirmButton: false
                });

                // Refresh List & Dashboard Statistics
                loadTeachers();
                loadStatistics();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Failed',
                    text: result.message || 'Failed to save teacher. Please check requirements and try again.'
                });
            }
        } catch (err) {
            console.error('Error saving teacher:', err);
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'Could not connect to the backend server. Please try again later.'
            });
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Teacher';
        }
    });

    // Reset Modal on Open for Add
    document.getElementById('addTeacherBtn').addEventListener('click', () => {
        document.getElementById('teacherModalTitle').textContent = 'Add New Teacher';
        teacherForm.reset();
        document.getElementById('teacherId').value = '';
        document.getElementById('teacherUserId').value = '';
        document.getElementById('teacherStatusSelect').value = 'Active';
        document.getElementById('teacherEmploymentTypeSelect').value = 'Full-Time';
        document.getElementById('teacherExperienceInput').value = 5;

        // Auto generate next code
        const count = totalRecords + 1;
        document.getElementById('teacherCodeInput').value = `TCH-${String(count).padStart(3, '0')}`;
        renderCourseCheckboxes([]);
    });

    /**
     * 9. Edit Teacher
     */
    window.editTeacher = async function(teacherId) {
        try {
            const res = await fetch(`${API_BASE}/teachers/${teacherId}`, { headers });
            if (!res.ok) throw new Error('Failed to fetch teacher details');

            const result = await res.json();
            if (result.success && result.data) {
                const t = result.data;
                document.getElementById('teacherModalTitle').textContent = `Edit Teacher: ${t.full_name}`;
                document.getElementById('teacherId').value = t.id;
                document.getElementById('teacherUserId').value = t.user_id;
                document.getElementById('teacherNameInput').value = t.full_name || '';
                document.getElementById('teacherEmailInput').value = t.email || '';
                document.getElementById('teacherCodeInput').value = t.teacher_code || '';
                document.getElementById('teacherDepartmentSelect').value = t.department_id || '';
                document.getElementById('teacherStatusSelect').value = t.status || 'Active';
                document.getElementById('teacherSpecializationInput').value = t.specialization || '';
                document.getElementById('teacherEmploymentTypeSelect').value = t.employment_type || 'Full-Time';
                document.getElementById('teacherExperienceInput').value = t.experience_years || 0;
                document.getElementById('teacherRoomInput').value = t.office_room || '';
                document.getElementById('teacherPhoneInput').value = t.phone || '';
                document.getElementById('teacherBioInput').value = t.bio || '';

                const selectedCourses = (t.courses || []).map(c => c.id);
                renderCourseCheckboxes(selectedCourses);

                teacherModal.show();
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to load teacher data for editing.' });
        }
    };

    /**
     * 10. Delete Teacher (Safe / Soft Deletion)
     */
    window.deleteTeacherConfirm = function(teacherId, teacherName) {
        Swal.fire({
            title: 'Deactivate / Delete Teacher?',
            html: `Are you sure you want to deactivate <b>"${escapeHtml(teacherName)}"</b>?<br><br><small class="text-muted">If this teacher is connected to courses, classes, assignments, or students, safe soft-deletion is applied to preserve historical academic records.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Deactivate Teacher',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`${API_BASE}/teachers/${teacherId}`, {
                        method: 'DELETE',
                        headers
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Teacher Deactivated',
                            text: data.message || 'Teacher record has been archived safely.',
                            timer: 2000,
                            showConfirmButton: false
                        });

                        // Refresh List & Dashboard Statistics
                        loadTeachers();
                        loadStatistics();
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed',
                            text: data.message || 'Could not delete teacher.'
                        });
                    }
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Server communication failed.'
                    });
                }
            }
        });
    };

    /**
     * 11. View Full Profile Modal
     */
    window.viewTeacherProfile = async function(teacherId) {
        selectedViewTeacherId = teacherId;
        const modalContent = document.getElementById('viewTeacherModalContent');

        modalContent.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border text-primary me-2"></div> Loading complete faculty profile...
            </div>
        `;

        viewTeacherModal.show();

        try {
            const res = await fetch(`${API_BASE}/teachers/${teacherId}`, { headers });
            if (!res.ok) throw new Error('Failed to load profile');

            const result = await res.json();
            if (result.success && result.data) {
                const t = result.data;
                const avatar = t.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150';

                // Query associated students
                let students = [];
                try {
                    const stuRes = await fetch(`${API_BASE}/teachers/${teacherId}/students`, { headers });
                    if (stuRes.ok) {
                        const stuData = await stuRes.json();
                        if (stuData.success) students = stuData.data || [];
                    }
                } catch (e) {}

                modalContent.innerHTML = `
                    <!-- Header Banner -->
                    <div class="bg-light p-4 rounded-3 border mb-4 d-flex flex-column flex-md-row align-items-center gap-4">
                        <img src="${escapeHtml(avatar)}" class="teacher-avatar-lg" alt="${escapeHtml(t.full_name)}">
                        <div class="flex-grow-1 text-center text-md-start">
                            <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
                                <h4 class="fw-bold text-dark mb-0">${escapeHtml(t.full_name)}</h4>
                                <span class="badge bg-primary text-white text-xs">${escapeHtml(t.teacher_code || 'TCH')}</span>
                                <span class="badge ${t.status === 'Active' ? 'bg-success' : 'bg-warning'} bg-opacity-10 ${t.status === 'Active' ? 'text-success' : 'text-warning'} text-xs">
                                    ${escapeHtml(t.status || 'Active')}
                                </span>
                            </div>
                            <div class="text-sm text-muted mb-2">
                                <i class="bi bi-building me-1"></i> ${escapeHtml(t.department_name || 'Faculty')} &bull; 
                                <i class="bi bi-briefcase me-1"></i> ${escapeHtml(t.employment_type || 'Full-Time')} &bull;
                                <i class="bi bi-award me-1"></i> ${t.experience_years || 0} Years Experience
                            </div>
                            <div class="text-xs text-muted">
                                <i class="bi bi-envelope me-1"></i> ${escapeHtml(t.email)} &bull;
                                <i class="bi bi-geo-alt me-1"></i> ${escapeHtml(t.office_room || 'Main Campus')} &bull;
                                <i class="bi bi-telephone me-1"></i> ${escapeHtml(t.phone || 'N/A')}
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Tabs -->
                    <ul class="nav nav-tabs mb-4" id="teacherProfileTabs" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active fw-bold text-xs" data-bs-toggle="tab" data-bs-target="#tab-overview">
                                <i class="bi bi-person-lines-fill me-1"></i> Overview
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link fw-bold text-xs" data-bs-toggle="tab" data-bs-target="#tab-courses">
                                <i class="bi bi-journal-bookmark me-1"></i> Courses Taught (${t.courses ? t.courses.length : 0})
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link fw-bold text-xs" data-bs-toggle="tab" data-bs-target="#tab-classes">
                                <i class="bi bi-calendar3 me-1"></i> Active Classes (${t.classes ? t.classes.length : 0})
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link fw-bold text-xs" data-bs-toggle="tab" data-bs-target="#tab-students">
                                <i class="bi bi-people me-1"></i> Enrolled Students (${students.length})
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link fw-bold text-xs" data-bs-toggle="tab" data-bs-target="#tab-assignments">
                                <i class="bi bi-card-checklist me-1"></i> Coursework & Assignments (${t.assignments ? t.assignments.length : 0})
                            </button>
                        </li>
                    </ul>

                    <!-- Tab Contents -->
                    <div class="tab-content">
                        <!-- 1. Overview -->
                        <div class="tab-pane fade show active" id="tab-overview">
                            <div class="row g-4">
                                <div class="col-md-7">
                                    <h6 class="fw-bold text-dark mb-2">Specialization & Research Focus</h6>
                                    <p class="text-sm text-dark bg-light p-3 rounded-3 border mb-4">
                                        ${escapeHtml(t.specialization || 'General Faculty Specialist')}
                                    </p>
                                    <h6 class="fw-bold text-dark mb-2">Biography & Academic Background</h6>
                                    <p class="text-sm text-muted" style="line-height: 1.6;">
                                        ${escapeHtml(t.bio || 'No biography provided yet.')}
                                    </p>
                                </div>
                                <div class="col-md-5">
                                    <div class="card bg-light border-0 p-3 rounded-3">
                                        <h6 class="fw-bold text-dark text-xs text-uppercase mb-3">Academic Summary</h6>
                                        <div class="d-flex justify-content-between text-sm py-2 border-bottom">
                                            <span class="text-muted">Faculty ID:</span>
                                            <span class="fw-semibold font-monospace">${escapeHtml(t.teacher_code || 'TCH')}</span>
                                        </div>
                                        <div class="d-flex justify-content-between text-sm py-2 border-bottom">
                                            <span class="text-muted">Department:</span>
                                            <span class="fw-semibold">${escapeHtml(t.department_name || 'Academic')}</span>
                                        </div>
                                        <div class="d-flex justify-content-between text-sm py-2 border-bottom">
                                            <span class="text-muted">Total Courses:</span>
                                            <span class="fw-semibold">${t.courses ? t.courses.length : 0}</span>
                                        </div>
                                        <div class="d-flex justify-content-between text-sm py-2 border-bottom">
                                            <span class="text-muted">Total Students Taught:</span>
                                            <span class="fw-semibold text-primary">${students.length}</span>
                                        </div>
                                        <div class="d-flex justify-content-between text-sm py-2">
                                            <span class="text-muted">Member Since:</span>
                                            <span class="fw-semibold">${new Date(t.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Courses Taught -->
                        <div class="tab-pane fade" id="tab-courses">
                            ${(!t.courses || t.courses.length === 0) ? `
                                <div class="text-center py-4 text-muted text-sm">No courses currently assigned to this teacher.</div>
                            ` : `
                                <div class="row g-3">
                                    ${t.courses.map(c => `
                                        <div class="col-md-6">
                                            <div class="card p-3 rounded-3 border">
                                                <div class="d-flex justify-content-between align-items-start mb-2">
                                                    <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${escapeHtml(c.category_name || 'Academic')}</span>
                                                    <span class="badge bg-light text-dark border text-xs">${escapeHtml(c.difficulty || 'All Levels')}</span>
                                                </div>
                                                <h6 class="fw-bold text-dark mb-1">${escapeHtml(c.title)}</h6>
                                                <div class="text-xs text-muted"><i class="bi bi-clock me-1"></i> ${escapeHtml(c.duration_hours || '8 Hours')}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>

                        <!-- 3. Active Classes -->
                        <div class="tab-pane fade" id="tab-classes">
                            ${(!t.classes || t.classes.length === 0) ? `
                                <div class="text-center py-4 text-muted text-sm">No active classes assigned to this teacher.</div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover align-middle">
                                        <thead class="table-light text-xs text-uppercase text-muted">
                                            <tr>
                                                <th>Class Name</th>
                                                <th>Course</th>
                                                <th>Schedule</th>
                                                <th>Room</th>
                                                <th>Enrolled</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${t.classes.map(cl => `
                                                <tr>
                                                    <td class="fw-semibold text-sm">${escapeHtml(cl.class_name)}</td>
                                                    <td class="text-xs text-muted">${escapeHtml(cl.course_title || 'Course')}</td>
                                                    <td class="text-xs"><i class="bi bi-clock me-1 text-muted"></i>${escapeHtml(cl.schedule || 'TBA')}</td>
                                                    <td class="text-xs">${escapeHtml(cl.room || 'Room 101')}</td>
                                                    <td><span class="badge bg-light text-dark border text-xs">${cl.enrolled_students || 0} Students</span></td>
                                                    <td><span class="badge bg-success bg-opacity-10 text-success text-xs">${escapeHtml(cl.status || 'Active')}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>

                        <!-- 4. Enrolled Students (Teacher -> Class -> Enrollment -> Student) -->
                        <div class="tab-pane fade" id="tab-students">
                            ${(students.length === 0) ? `
                                <div class="text-center py-4 text-muted text-sm">No students currently enrolled in this teacher's classes.</div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover align-middle">
                                        <thead class="table-light text-xs text-uppercase text-muted">
                                            <tr>
                                                <th>Student</th>
                                                <th>University ID</th>
                                                <th>Class</th>
                                                <th>Course</th>
                                                <th>Enrolled Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${students.map(s => `
                                                <tr>
                                                    <td>
                                                        <div class="d-flex align-items-center gap-2">
                                                            <img src="${s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100'}" class="rounded-circle" width="28" height="28">
                                                            <div>
                                                                <div class="fw-semibold text-sm text-dark">${escapeHtml(s.full_name)}</div>
                                                                <div class="text-xs text-muted">${escapeHtml(s.email)}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="text-xs font-monospace text-muted">${escapeHtml(s.university_id || 'ID')}</td>
                                                    <td class="text-xs fw-semibold">${escapeHtml(s.class_name || 'Class')}</td>
                                                    <td class="text-xs text-muted">${escapeHtml(s.course_title || 'Course')}</td>
                                                    <td class="text-xs text-muted">${new Date(s.enrolled_at).toLocaleDateString()}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>

                        <!-- 5. Coursework & Assignments -->
                        <div class="tab-pane fade" id="tab-assignments">
                            ${(!t.assignments || t.assignments.length === 0) ? `
                                <div class="text-center py-4 text-muted text-sm">No coursework assignments created yet by this teacher.</div>
                            ` : `
                                <div class="d-flex flex-column gap-2">
                                    ${t.assignments.map(a => `
                                        <div class="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                                            <div>
                                                <div class="badge bg-primary bg-opacity-10 text-primary text-xs mb-1">${escapeHtml(a.course_title || 'Course')}</div>
                                                <h6 class="fw-bold text-dark mb-1 text-sm">${escapeHtml(a.title)}</h6>
                                                <div class="text-xs text-muted">Due: ${new Date(a.due_date).toLocaleDateString()} &bull; Max Points: ${a.total_points || 100}</div>
                                            </div>
                                            <div class="text-end">
                                                <span class="badge bg-info bg-opacity-10 text-info text-xs">${a.total_submissions || 0} Submissions</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            modalContent.innerHTML = `<div class="text-danger text-center py-4">Failed to load teacher profile details.</div>`;
        }
    };

    // Edit button inside View modal
    document.getElementById('editFromViewModalBtn').addEventListener('click', () => {
        if (selectedViewTeacherId) {
            viewTeacherModal.hide();
            setTimeout(() => {
                editTeacher(selectedViewTeacherId);
            }, 300);
        }
    });

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Initial Execution
    loadDepartments().then(() => {
        loadCourses();
        loadStatistics();
        loadTeachers();
    });
});
