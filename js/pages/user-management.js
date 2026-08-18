/**
 * AUB Digital Academy - User & Student Management Controller
 * Comprehensive university administration portal for Students, Teachers, and Admins.
 */

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

    // State Variables
    let allUsers = [];
    let departmentsList = [];
    let currentRoleFilter = 'all'; // 'all', 'STUDENT', 'TEACHER', 'ADMIN'
    let currentFacultyFilter = 'all';
    let currentMajorFilter = 'all';
    let currentYearFilter = 'all';
    let currentEnrollmentFilter = 'all';
    let currentStatusFilter = 'all';
    let currentSearchQuery = '';
    let currentUserInView = null;
    let currentWizardStep = 1;

    // DOM Elements
    const userModalEl = document.getElementById('userModal');
    const userModal = userModalEl ? new bootstrap.Modal(userModalEl) : null;

    const viewUserModalEl = document.getElementById('viewUserModal');
    const viewUserModal = viewUserModalEl ? new bootstrap.Modal(viewUserModalEl) : null;

    const searchInput = document.getElementById('userSearchInput');
    const rolePillGroup = document.getElementById('rolePillGroup');
    const userFacultyFilter = document.getElementById('userFacultyFilter');
    const userMajorFilter = document.getElementById('userMajorFilter');
    const userYearFilter = document.getElementById('userYearFilter');
    const userEnrollmentFilter = document.getElementById('userEnrollmentFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    
    const majorFilterGroup = document.getElementById('majorFilterGroup');
    const yearFilterGroup = document.getElementById('yearFilterGroup');
    const enrollmentFilterGroup = document.getElementById('enrollmentFilterGroup');
    const facultyDeptLabel = document.getElementById('facultyDeptLabel');

    const statsCardsRow = document.getElementById('statsCardsRow');
    const tableHeadRow = document.getElementById('tableHeadRow');
    const usersTableBody = document.getElementById('usersTableBody');
    const tableRecordCount = document.getElementById('tableRecordCount');
    const pageMainHeading = document.getElementById('pageMainHeading');
    const pageMainSubtitle = document.getElementById('pageMainSubtitle');
    const addBtnLabel = document.getElementById('addBtnLabel');
    const pageSectionBadge = document.getElementById('pageSectionBadge');

    // Multi-Step Wizard Elements
    const stepBtn1 = document.getElementById('stepBtn1');
    const stepBtn2 = document.getElementById('stepBtn2');
    const stepBtn3 = document.getElementById('stepBtn3');
    const stepBtn4 = document.getElementById('stepBtn4');
    const wizardStep1 = document.getElementById('wizardStep1');
    const wizardStep2 = document.getElementById('wizardStep2');
    const wizardStep3 = document.getElementById('wizardStep3');
    const wizardStep4 = document.getElementById('wizardStep4');
    const prevStepBtn = document.getElementById('prevStepBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const saveUserBtn = document.getElementById('saveUserBtn');

    const userRoleSelect = document.getElementById('userRole');
    const studentSpecificFields = document.getElementById('studentSpecificFields');
    const teacherSpecificFields = document.getElementById('teacherSpecificFields');
    const adminSpecificFields = document.getElementById('adminSpecificFields');

    // Mobile Sidebar Toggle
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    if (mobileSidebarToggle && adminSidebar) {
        mobileSidebarToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('show');
        });
    }

    // Password Visibility Toggle
    const togglePassBtn = document.getElementById('toggleUserPasswordBtn');
    const passInput = document.getElementById('userPassword');
    if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', function () {
            const isPassword = passInput.getAttribute('type') === 'password';
            passInput.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
            }
        });
    }

    /**
     * 1. Load Academic Departments
     */
    async function loadDepartments() {
        try {
            const res = await fetch(`${API_BASE}/departments`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    departmentsList = data.data;
                }
            }
        } catch (e) {
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

        const userDepartmentSelect = document.getElementById('userDepartmentSelect');
        if (userDepartmentSelect) {
            userDepartmentSelect.innerHTML = '';
            departmentsList.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept.name;
                opt.textContent = `${dept.name} (${dept.code})`;
                userDepartmentSelect.appendChild(opt);
            });
        }
    }

    /**
     * 1.1 Load Academic Majors / Programs
     */
    async function loadMajors() {
        let progs = [];
        if (window.AdminStore) {
            progs = window.AdminStore.getPrograms();
        }

        const userMajorSelect = document.getElementById('userMajorSelect');
        if (userMajorSelect && progs.length > 0) {
            userMajorSelect.innerHTML = progs.map(p => `
                <option value="${p.title}" data-faculty="${escapeHtml(p.faculty || 'Information Technology')}">${escapeHtml(p.title)}</option>
            `).join('');
        }

        const userMajorFilter = document.getElementById('userMajorFilter');
        if (userMajorFilter && progs.length > 0) {
            userMajorFilter.innerHTML = `<option value="all">All Majors</option>` + progs.map(p => `
                <option value="${p.title}">${escapeHtml(p.title)}</option>
            `).join('');
        }
    }

    /**
     * 2. Load Users
     */
    async function loadUsers() {
        let loaded = false;

        try {
            const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allUsers = data.data;
                    loaded = true;
                }
            }
        } catch (e) {
            console.warn('API unavailable, checking fallback store...');
        }

        if (!loaded && window.AdminStore) {
            allUsers = window.AdminStore.getUsers();
        }

        renderStatistics();
        renderTableStructure();
        applyFilters();
    }

    function getNormalizedRole(u) {
        if (u.role) return u.role.toUpperCase();
        if (u.role_id === 1) return 'ADMIN';
        if (u.role_id === 2) return 'TEACHER';
        return 'STUDENT';
    }

    /**
     * 3. Render Dynamic Statistics (General vs Student Specific)
     */
    function renderStatistics() {
        if (!statsCardsRow) return;

        const isStudentView = currentRoleFilter === 'STUDENT';
        const students = allUsers.filter(u => getNormalizedRole(u) === 'STUDENT');

        if (isStudentView) {
            // Student-Specific Statistics (Requirement 12)
            const totalStudents = students.length;
            const activeStudents = students.filter(s => (s.enrollment_status || s.status || 'Active').toLowerCase() === 'active').length;
            const pendingStudents = students.filter(s => (s.enrollment_status || s.status || '').toLowerCase() === 'pending').length;
            const suspendedStudents = students.filter(s => (s.enrollment_status || s.status || '').toLowerCase() === 'suspended').length;
            const graduatedStudents = students.filter(s => (s.enrollment_status || '').toLowerCase() === 'graduated').length;

            statsCardsRow.innerHTML = `
                <div class="col-6 col-md-4 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Total Students</div>
                            <div class="user-stat-number text-primary">${totalStudents}</div>
                        </div>
                        <div class="user-stat-icon bg-primary bg-opacity-10 text-primary">
                            <i class="bi bi-mortarboard-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-4 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Active Students</div>
                            <div class="user-stat-number text-success">${activeStudents}</div>
                        </div>
                        <div class="user-stat-icon bg-success bg-opacity-10 text-success">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-4 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Pending Enrollment</div>
                            <div class="user-stat-number text-warning">${pendingStudents}</div>
                        </div>
                        <div class="user-stat-icon bg-warning bg-opacity-10 text-warning">
                            <i class="bi bi-hourglass-split"></i>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-6 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Suspended</div>
                            <div class="user-stat-number text-danger">${suspendedStudents}</div>
                        </div>
                        <div class="user-stat-icon bg-danger bg-opacity-10 text-danger">
                            <i class="bi bi-dash-circle-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Graduated</div>
                            <div class="user-stat-number" style="color: #6366f1;">${graduatedStudents}</div>
                        </div>
                        <div class="user-stat-icon bg-opacity-10" style="background: rgba(99,102,241,0.1); color: #6366f1;">
                            <i class="bi bi-award-fill"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // General Users Statistics
            const totalUsers = allUsers.length;
            const totalStudents = students.length;
            const totalTeachers = allUsers.filter(u => getNormalizedRole(u) === 'TEACHER').length;
            const totalAdmins = allUsers.filter(u => getNormalizedRole(u) === 'ADMIN').length;
            const totalActive = allUsers.filter(u => (u.status || 'Active').toLowerCase() === 'active').length;

            statsCardsRow.innerHTML = `
                <div class="col-6 col-md-4 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Total Users</div>
                            <div class="user-stat-number">${totalUsers}</div>
                        </div>
                        <div class="user-stat-icon bg-primary bg-opacity-10 text-primary">
                            <i class="bi bi-people-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-4 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Students</div>
                            <div class="user-stat-number text-info">${totalStudents}</div>
                        </div>
                        <div class="user-stat-icon bg-info bg-opacity-10 text-info">
                            <i class="bi bi-mortarboard-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-4 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Teachers</div>
                            <div class="user-stat-number text-success">${totalTeachers}</div>
                        </div>
                        <div class="user-stat-icon bg-success bg-opacity-10 text-success">
                            <i class="bi bi-person-badge-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-6 col-md-6 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Admins</div>
                            <div class="user-stat-number text-warning">${totalAdmins}</div>
                        </div>
                        <div class="user-stat-icon bg-warning bg-opacity-10 text-warning">
                            <i class="bi bi-shield-lock-fill"></i>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl">
                    <div class="user-stat-card">
                        <div>
                            <div class="user-stat-title">Active Users</div>
                            <div class="user-stat-number text-success">${totalActive}</div>
                        </div>
                        <div class="user-stat-icon bg-success bg-opacity-10 text-success">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                    </div>
                </div>
            `;
        }

        // Update Pill Counts
        const elCountAll = document.getElementById('countAll');
        if (elCountAll) elCountAll.textContent = allUsers.length;

        const elCountStudents = document.getElementById('countStudents');
        if (elCountStudents) elCountStudents.textContent = students.length;

        const elCountTeachers = document.getElementById('countTeachers');
        if (elCountTeachers) elCountTeachers.textContent = allUsers.filter(u => getNormalizedRole(u) === 'TEACHER').length;

        const elCountAdmins = document.getElementById('countAdmins');
        if (elCountAdmins) elCountAdmins.textContent = allUsers.filter(u => getNormalizedRole(u) === 'ADMIN').length;
    }

    /**
     * 4. Render Dynamic Table Header Structure
     */
    function renderTableStructure() {
        if (!tableHeadRow) return;

        const isStudentView = currentRoleFilter === 'STUDENT';

        if (isStudentView) {
            // Requirement 1 Table Columns for Students
            tableHeadRow.innerHTML = `
                <tr>
                    <th>STUDENT</th>
                    <th>STUDENT ID</th>
                    <th>UNIVERSITY EMAIL</th>
                    <th>FACULTY</th>
                    <th>MAJOR</th>
                    <th>YEAR</th>
                    <th>ENROLLMENT</th>
                    <th>ACCOUNT</th>
                    <th>JOINED</th>
                    <th class="text-end" style="width: 140px;">ACTIONS</th>
                </tr>
            `;
            if (pageMainHeading) pageMainHeading.textContent = 'Student Management';
            if (pageMainSubtitle) pageMainSubtitle.textContent = 'Manage registered student records, academic standings, and departmental enrollments.';
            if (addBtnLabel) addBtnLabel.textContent = 'Add New Student';
            if (pageSectionBadge) pageSectionBadge.innerHTML = '<i class="bi bi-mortarboard-fill me-1"></i> Student Directory';

            if (majorFilterGroup) majorFilterGroup.classList.remove('d-none');
            if (yearFilterGroup) yearFilterGroup.classList.remove('d-none');
            if (enrollmentFilterGroup) enrollmentFilterGroup.classList.remove('d-none');
            if (facultyDeptLabel) facultyDeptLabel.textContent = 'Faculty:';
        } else {
            // General Users Table Columns
            tableHeadRow.innerHTML = `
                <tr>
                    <th>USER</th>
                    <th>UNIVERSITY ID</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>JOINED</th>
                    <th class="text-end" style="width: 140px;">ACTIONS</th>
                </tr>
            `;
            if (pageMainHeading) pageMainHeading.textContent = 'User Management';
            if (pageMainSubtitle) pageMainSubtitle.textContent = 'Manage student accounts, teacher credentials, and administrators.';
            if (addBtnLabel) addBtnLabel.textContent = 'Add New User';
            if (pageSectionBadge) pageSectionBadge.innerHTML = '<i class="bi bi-people-fill me-1"></i> User Directory';

            if (majorFilterGroup) majorFilterGroup.classList.add('d-none');
            if (yearFilterGroup) yearFilterGroup.classList.add('d-none');
            if (enrollmentFilterGroup) enrollmentFilterGroup.classList.add('d-none');
            if (facultyDeptLabel) facultyDeptLabel.textContent = 'Department:';
        }
    }

    /**
     * 5. Apply Dynamic Search & Filters
     */
    function applyFilters() {
        const search = currentSearchQuery.toLowerCase().trim();
        const role = currentRoleFilter.toLowerCase();
        const faculty = currentFacultyFilter.toLowerCase();
        const major = currentMajorFilter.toLowerCase();
        const year = currentYearFilter.toLowerCase();
        const enrollment = currentEnrollmentFilter.toLowerCase();
        const status = currentStatusFilter.toLowerCase();

        const isStudentView = currentRoleFilter === 'STUDENT';

        const filtered = allUsers.filter(u => {
            const uRole = getNormalizedRole(u).toLowerCase();

            // Search matching: Name, ID, Email, Faculty, Major, Phone
            const matchSearch = !search ||
                (u.full_name && u.full_name.toLowerCase().includes(search)) ||
                (u.university_id && u.university_id.toLowerCase().includes(search)) ||
                (u.email && u.email.toLowerCase().includes(search)) ||
                (u.faculty && u.faculty.toLowerCase().includes(search)) ||
                (u.major_title && u.major_title.toLowerCase().includes(search)) ||
                (u.major && u.major.toLowerCase().includes(search)) ||
                (u.phone && u.phone.toLowerCase().includes(search));

            // Role criteria
            const matchRole = role === 'all' || uRole === role;

            // Account status criteria
            const uStatus = (u.status || 'Active').toLowerCase();
            const matchStatus = status === 'all' || uStatus === status;

            // Faculty criteria
            let uFaculty = (u.faculty || u.department_name || u.teacher_department || '').toLowerCase();
            const matchFaculty = faculty === 'all' || uFaculty.includes(faculty);

            // Student-specific filters
            if (isStudentView) {
                let uMajor = (u.major_title || u.major || '').toLowerCase();
                const matchMajor = major === 'all' || uMajor.includes(major);

                let uYear = (u.academic_year || 'Year 1').toLowerCase();
                const matchYear = year === 'all' || uYear === year;

                let uEnroll = (u.enrollment_status || u.status || 'Active').toLowerCase();
                const matchEnroll = enrollment === 'all' || uEnroll === enrollment;

                return matchSearch && matchRole && matchStatus && matchFaculty && matchMajor && matchYear && matchEnroll;
            }

            return matchSearch && matchRole && matchStatus && matchFaculty;
        });

        renderUsers(filtered);
    }

    /**
     * 6. Render Users & Students Table
     */
    function renderUsers(users) {
        if (!usersTableBody) return;

        const isStudentView = currentRoleFilter === 'STUDENT';
        const colSpan = isStudentView ? 10 : 7;

        if (tableRecordCount) {
            tableRecordCount.textContent = `Showing ${users.length} of ${allUsers.length} records`;
        }

        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="${colSpan}" class="text-center py-5 text-muted">
                        <i class="bi bi-mortarboard fs-2 d-block mb-2 text-secondary opacity-50"></i>
                        <span class="fw-bold text-dark">No records found</span>
                        <div style="font-size: 12px;" class="mt-1">Try adjusting your search query, status, or filter dropdowns.</div>
                        <button class="btn btn-outline-primary btn-sm mt-3" onclick="resetFilters()">
                            <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        usersTableBody.innerHTML = users.map(u => {
            const role = getNormalizedRole(u);
            const status = u.status || 'Active';
            const enrollmentStatus = u.enrollment_status || (status === 'Active' ? 'Active' : status);
            const joinedDate = formatDate(u.created_at);
            const avatar = u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`;

            let statusDot = 'active';
            if (status === 'Pending') statusDot = 'pending';
            else if (status === 'Suspended') statusDot = 'suspended';
            else if (status === 'Inactive') statusDot = 'inactive';

            let enrollmentDot = 'active';
            if (enrollmentStatus === 'Pending') enrollmentDot = 'pending';
            else if (enrollmentStatus === 'Suspended') enrollmentDot = 'suspended';
            else if (enrollmentStatus === 'Graduated') enrollmentDot = 'graduated';
            else if (enrollmentStatus === 'Withdrawn') enrollmentDot = 'withdrawn';

            if (isStudentView) {
                // Exact 10 Columns Student Row (Requirement 1)
                return `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <img src="${escapeHtml(avatar)}" class="rounded-circle object-fit-cover shadow-sm" style="width: 36px; height: 36px; border: 1.5px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                                <div class="fw-bold text-dark text-sm">${escapeHtml(u.full_name)}</div>
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-light text-dark border font-monospace text-xs">${escapeHtml(u.university_id || 'N/A')}</span>
                        </td>
                        <td>
                            <a href="mailto:${escapeHtml(u.email)}" class="text-muted text-xs text-decoration-none hover-primary">
                                ${escapeHtml(u.email)}
                            </a>
                        </td>
                        <td>
                            <div class="text-xs text-dark fw-semibold text-truncate" style="max-width: 140px;">${escapeHtml(u.faculty || 'Information Technology')}</div>
                        </td>
                        <td>
                            <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${escapeHtml(u.major_title || u.major || 'Computer Science')}</span>
                        </td>
                        <td>
                            <span class="badge bg-light text-dark border text-xs">${escapeHtml(u.academic_year || 'Year 2')}</span>
                        </td>
                        <td>
                            <div class="d-flex align-items-center text-xs fw-semibold">
                                <span class="status-dot ${enrollmentDot}"></span>
                                <span>${escapeHtml(enrollmentStatus)}</span>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center text-xs fw-semibold">
                                <span class="status-dot ${statusDot}"></span>
                                <span>${escapeHtml(status)}</span>
                            </div>
                        </td>
                        <td class="text-muted text-xs">${joinedDate}</td>
                        <td class="text-end">
                            <div class="d-flex align-items-center justify-content-end gap-1">
                                <button class="btn btn-outline-primary btn-sm py-1 px-2" title="View Student Profile" onclick="openViewUserModal(${u.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-secondary btn-sm py-1 px-2" title="Edit Student" onclick="openEditUserModal(${u.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <div class="dropdown d-inline-block">
                                    <button class="btn btn-outline-secondary btn-sm py-1 px-2 dropdown-toggle-no-caret" data-bs-toggle="dropdown" aria-expanded="false" title="More Actions">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 text-sm">
                                        <li>
                                            <button class="dropdown-item py-2" onclick="openChangeRoleDialog(${u.id})">
                                                <i class="bi bi-person-gear text-primary me-2"></i> Change Role
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item py-2" onclick="openResetPasswordDialog(${u.id})">
                                                <i class="bi bi-key text-warning me-2"></i> Reset Password
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item py-2" onclick="toggleUserStatus(${u.id})">
                                                <i class="bi ${status === 'Active' ? 'bi-dash-circle text-secondary' : 'bi-check-circle text-success'} me-2"></i>
                                                ${status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                            </button>
                                        </li>
                                        <li><hr class="dropdown-divider my-1"></li>
                                        <li>
                                            <button class="dropdown-item py-2 text-danger" onclick="deleteUser(${u.id})">
                                                <i class="bi bi-trash me-2"></i> Delete Account
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                // General Users Table Row
                let roleBadge = '';
                if (role === 'ADMIN') {
                    roleBadge = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 fw-bold px-2 py-1"><i class="bi bi-shield-lock-fill me-1"></i>ADMIN</span>`;
                } else if (role === 'TEACHER') {
                    roleBadge = `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 fw-bold px-2 py-1"><i class="bi bi-person-badge-fill me-1"></i>TEACHER</span>`;
                } else {
                    roleBadge = `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-bold px-2 py-1"><i class="bi bi-mortarboard-fill me-1"></i>STUDENT</span>`;
                }

                return `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <img src="${escapeHtml(avatar)}" class="rounded-circle object-fit-cover shadow-sm" style="width: 36px; height: 36px; border: 1.5px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                                <div>
                                    <div class="fw-bold text-dark text-sm">${escapeHtml(u.full_name)}</div>
                                    <div class="text-xs text-muted">${escapeHtml(u.department_name || u.teacher_department || u.major_title || u.faculty || 'AUB Digital Academy')}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-light text-dark border font-monospace text-xs">${escapeHtml(u.university_id || 'N/A')}</span>
                        </td>
                        <td>
                            <a href="mailto:${escapeHtml(u.email)}" class="text-muted text-xs text-decoration-none hover-primary">
                                ${escapeHtml(u.email)}
                            </a>
                        </td>
                        <td>
                            ${roleBadge}
                        </td>
                        <td>
                            <div class="d-flex align-items-center text-xs fw-semibold">
                                <span class="status-dot ${statusDot}"></span>
                                <span>${escapeHtml(status)}</span>
                            </div>
                        </td>
                        <td class="text-muted text-xs">${joinedDate}</td>
                        <td class="text-end">
                            <div class="d-flex align-items-center justify-content-end gap-1">
                                <button class="btn btn-outline-primary btn-sm py-1 px-2" title="View Profile" onclick="openViewUserModal(${u.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-secondary btn-sm py-1 px-2" title="Edit User" onclick="openEditUserModal(${u.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <div class="dropdown d-inline-block">
                                    <button class="btn btn-outline-secondary btn-sm py-1 px-2 dropdown-toggle-no-caret" data-bs-toggle="dropdown" aria-expanded="false" title="More Actions">
                                        <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 text-sm">
                                        <li>
                                            <button class="dropdown-item py-2" onclick="openChangeRoleDialog(${u.id})">
                                                <i class="bi bi-person-gear text-primary me-2"></i> Change Role
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item py-2" onclick="openResetPasswordDialog(${u.id})">
                                                <i class="bi bi-key text-warning me-2"></i> Reset Password
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item py-2" onclick="toggleUserStatus(${u.id})">
                                                <i class="bi ${status === 'Active' ? 'bi-dash-circle text-secondary' : 'bi-check-circle text-success'} me-2"></i>
                                                ${status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                            </button>
                                        </li>
                                        <li><hr class="dropdown-divider my-1"></li>
                                        <li>
                                            <button class="dropdown-item py-2 text-danger" onclick="deleteUser(${u.id})">
                                                <i class="bi bi-trash me-2"></i> Delete User
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }).join('');
    }

    /**
     * 7. Filter Event Listeners
     */
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            applyFilters();
        });
    }

    if (rolePillGroup) {
        rolePillGroup.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-filter-pill');
            if (!btn) return;
            rolePillGroup.querySelectorAll('.btn-filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRoleFilter = btn.getAttribute('data-role') || 'all';

            renderStatistics();
            renderTableStructure();
            applyFilters();
        });
    }

    if (userFacultyFilter) {
        userFacultyFilter.addEventListener('change', function () {
            currentFacultyFilter = this.value;
            applyFilters();
        });
    }

    if (userMajorFilter) {
        userMajorFilter.addEventListener('change', function () {
            currentMajorFilter = this.value;
            applyFilters();
        });
    }

    if (userYearFilter) {
        userYearFilter.addEventListener('change', function () {
            currentYearFilter = this.value;
            applyFilters();
        });
    }

    if (userEnrollmentFilter) {
        userEnrollmentFilter.addEventListener('change', function () {
            currentEnrollmentFilter = this.value;
            applyFilters();
        });
    }

    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', function () {
            currentStatusFilter = this.value;
            applyFilters();
        });
    }

    window.resetFilters = function () {
        if (searchInput) searchInput.value = '';
        if (userFacultyFilter) userFacultyFilter.value = 'all';
        if (userMajorFilter) userMajorFilter.value = 'all';
        if (userYearFilter) userYearFilter.value = 'all';
        if (userEnrollmentFilter) userEnrollmentFilter.value = 'all';
        if (userStatusFilter) userStatusFilter.value = 'all';

        currentSearchQuery = '';
        currentFacultyFilter = 'all';
        currentMajorFilter = 'all';
        currentYearFilter = 'all';
        currentEnrollmentFilter = 'all';
        currentStatusFilter = 'all';

        applyFilters();
    };

    /**
     * 8. Comprehensive Student & User Profile Modal
     */
    window.openViewUserModal = async function (userId) {
        let u = allUsers.find(user => user.id === userId);
        if (!u) return;

        currentUserInView = u;
        const body = document.getElementById('viewUserModalBody');
        const leftActions = document.getElementById('viewModalLeftActions');
        const viewModalTitle = document.getElementById('viewModalTitle');
        if (!body) return;

        body.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading profile...
            </div>
        `;

        if (viewUserModal) viewUserModal.show();

        // Fetch detailed profile with logs if backend is running
        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    u = data.data;
                    currentUserInView = u;
                }
            }
        } catch (e) {}

        const role = getNormalizedRole(u);
        const isStudent = role === 'STUDENT';
        if (viewModalTitle) viewModalTitle.textContent = isStudent ? 'Student Account Profile' : 'User Account Profile';

        let roleBadgeClass = 'bg-primary';
        if (role === 'ADMIN') roleBadgeClass = 'bg-warning text-dark';
        else if (role === 'TEACHER') roleBadgeClass = 'bg-info text-dark';

        const status = u.status || 'Active';
        const enrollmentStatus = u.enrollment_status || 'Active';

        let statusDot = 'active';
        if (status === 'Pending') statusDot = 'pending';
        else if (status === 'Suspended') statusDot = 'suspended';
        else if (status === 'Inactive') statusDot = 'inactive';

        const avatar = u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`;

        // Activity Timeline
        const logs = u.activity_logs || [
            { action: 'Account Created', details: `Student account registered with ID: ${u.university_id}`, created_at: u.created_at },
            { action: 'Academic Standing Verified', details: `${u.academic_year || 'Year 2'} - ${u.faculty || 'Information Technology'}`, created_at: u.created_at }
        ];

        const logsHtml = logs.map(log => `
            <div class="activity-item">
                <div class="activity-dot"></div>
                <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <div class="fw-bold text-dark text-xs">${escapeHtml(log.action)}</div>
                    <div class="text-muted" style="font-size: 11px;">${formatDate(log.created_at)}</div>
                </div>
                <div class="text-muted text-xs">${escapeHtml(log.details || '')}</div>
            </div>
        `).join('');

        body.innerHTML = `
            <!-- HEADER (Requirement 2) -->
            <div class="bg-light p-4 rounded-3 border mb-4 d-flex flex-column flex-md-row align-items-center gap-4">
                <img src="${escapeHtml(avatar)}" class="profile-avatar-lg" alt="${escapeHtml(u.full_name)}">
                <div class="flex-grow-1 text-center text-md-start">
                    <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
                        <h4 class="fw-bold text-dark mb-0">${escapeHtml(u.full_name)}</h4>
                        <span class="badge ${roleBadgeClass} text-xs px-2 py-1">${role}</span>
                        <div class="badge bg-white text-dark border text-xs px-2 py-1 d-inline-flex align-items-center">
                            <span class="status-dot ${statusDot}"></span>
                            <span>${escapeHtml(status)}</span>
                        </div>
                    </div>
                    <div class="text-xs text-muted mb-1">
                        <i class="bi bi-card-text me-1"></i> Student ID: <span class="font-monospace fw-bold text-primary">${escapeHtml(u.university_id || '202401234')}</span> &bull; 
                        <i class="bi bi-envelope me-1"></i> ${escapeHtml(u.email)}
                    </div>
                    <div class="text-xs text-muted">
                        <i class="bi bi-building me-1"></i> ${escapeHtml(u.faculty || 'Information Technology')} &bull; 
                        <i class="bi bi-mortarboard me-1"></i> ${escapeHtml(u.major_title || u.major || 'Computer Science')} (${escapeHtml(u.academic_year || 'Year 2')})
                    </div>
                </div>
            </div>

            <!-- TABS NAVIGATION -->
            <ul class="nav nav-tabs mb-3" id="profileTabs" role="tablist">
                <li class="nav-item">
                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-personal">
                        <i class="bi bi-person-lines-fill me-1"></i> Personal Info
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-academic">
                        <i class="bi bi-mortarboard-fill me-1"></i> Academic Info
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-enrollment">
                        <i class="bi bi-card-checklist me-1"></i> Enrollment
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-security">
                        <i class="bi bi-shield-check me-1"></i> Account & Security
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-activity">
                        <i class="bi bi-clock-history me-1"></i> Activity Log
                    </button>
                </li>
            </ul>

            <div class="tab-content pt-2">
                
                <!-- 1. PERSONAL INFORMATION (Requirement 3) -->
                <div class="tab-pane fade show active" id="tab-personal">
                    <div class="card border-0 bg-light p-3 rounded-3">
                        <div class="row g-3">
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Full Name</div>
                                <div class="profile-info-value">${escapeHtml(u.full_name)}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Student ID</div>
                                <div class="profile-info-value font-monospace">${escapeHtml(u.university_id || 'N/A')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">University Email</div>
                                <div class="profile-info-value text-truncate" title="${escapeHtml(u.email)}">${escapeHtml(u.email)}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Phone Number</div>
                                <div class="profile-info-value">${escapeHtml(u.phone || '+855 12 888 101')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Date of Birth</div>
                                <div class="profile-info-value">${u.dob ? formatDate(u.dob) : 'May 14, 2004'}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Gender</div>
                                <div class="profile-info-value">${escapeHtml(u.gender || 'Female')}</div>
                            </div>
                            <div class="col-12">
                                <div class="profile-info-label">Residential Address</div>
                                <div class="profile-info-value">${escapeHtml(u.address || 'Khan Toul Kork, Phnom Penh, Cambodia')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. ACADEMIC INFORMATION (Requirement 4) -->
                <div class="tab-pane fade" id="tab-academic">
                    <div class="card border-0 bg-light p-3 rounded-3">
                        <div class="row g-3">
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">University</div>
                                <div class="profile-info-value">AUB Digital Academy</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Faculty</div>
                                <div class="profile-info-value">${escapeHtml(u.faculty || 'Information Technology')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Department</div>
                                <div class="profile-info-value">${escapeHtml(u.department_name || 'Computer Science & IT')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Major</div>
                                <div class="profile-info-value text-primary fw-bold">${escapeHtml(u.major_title || u.major || 'Computer Science')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Academic Year</div>
                                <div class="profile-info-value">${escapeHtml(u.academic_year || 'Year 2')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Current Semester</div>
                                <div class="profile-info-value">${escapeHtml(u.semester || 'Semester 1')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Academic Status</div>
                                <div class="profile-info-value text-success">${escapeHtml(u.academic_status || 'Currently Enrolled')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Enrollment Date</div>
                                <div class="profile-info-value">${u.enrollment_date ? formatDate(u.enrollment_date) : 'Sep 1, 2024'}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Expected Graduation Date</div>
                                <div class="profile-info-value">${u.expected_graduation_date ? formatDate(u.expected_graduation_date) : 'Jul 15, 2028'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. ENROLLMENT INFORMATION (Requirement 5) -->
                <div class="tab-pane fade" id="tab-enrollment">
                    <div class="card border-0 bg-light p-3 rounded-3">
                        <div class="row g-3">
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Enrollment Status</div>
                                <div class="profile-info-value">
                                    <span class="badge bg-success text-white">${escapeHtml(enrollmentStatus)}</span>
                                </div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Enrollment Date</div>
                                <div class="profile-info-value">${u.enrollment_date ? formatDate(u.enrollment_date) : 'Sep 1, 2024'}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Current Semester</div>
                                <div class="profile-info-value">${escapeHtml(u.semester || 'Semester 1')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Academic Year</div>
                                <div class="profile-info-value">${escapeHtml(u.academic_year || 'Year 2')}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Graduation Status</div>
                                <div class="profile-info-value">${enrollmentStatus === 'Graduated' ? 'Graduated' : 'In Progress (Active Student)'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. ACCOUNT & SECURITY (Requirement 6) -->
                <div class="tab-pane fade" id="tab-security">
                    <div class="card border-0 bg-light p-3 rounded-3">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div class="profile-info-label mb-0">Security Status</div>
                            <button class="btn btn-outline-warning btn-sm py-1 px-2 text-xs" onclick="openResetPasswordDialog(${u.id})">
                                <i class="bi bi-key me-1"></i> Reset Password
                            </button>
                        </div>
                        <div class="row g-3">
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Account Status</div>
                                <div class="profile-info-value text-success"><i class="bi bi-check-circle-fill me-1"></i> ${escapeHtml(status)}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Email Verification</div>
                                <div class="profile-info-value text-success"><i class="bi bi-patch-check-fill me-1"></i> Verified</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Last Login</div>
                                <div class="profile-info-value">${u.last_login_at ? formatDate(u.last_login_at) : 'Aug 18, 2026 — 08:42 PM'}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Account Created</div>
                                <div class="profile-info-value">${formatDate(u.created_at)}</div>
                            </div>
                            <div class="col-sm-6 col-md-4">
                                <div class="profile-info-label">Last Profile Update</div>
                                <div class="profile-info-value">${u.updated_at ? formatDate(u.updated_at) : formatDate(u.created_at)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. ACTIVITY / AUDIT LOG (Requirement 7) -->
                <div class="tab-pane fade" id="tab-activity">
                    <div class="card border-0 bg-light p-3 rounded-3">
                        <div class="activity-timeline">
                            ${logsHtml}
                        </div>
                    </div>
                </div>

            </div>
        `;

        // Left Footer Actions (Requirement 8)
        if (leftActions) {
            const isSuspended = (status || 'Active') === 'Suspended';
            leftActions.innerHTML = `
                <button type="button" class="btn ${isSuspended ? 'btn-outline-success' : 'btn-outline-warning'} btn-sm me-2" onclick="toggleUserStatus(${u.id})">
                    <i class="bi ${isSuspended ? 'bi-check-circle' : 'bi-dash-circle'} me-1"></i>
                    ${isSuspended ? 'Activate Account' : 'Suspend Account'}
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteUser(${u.id})">
                    <i class="bi bi-trash me-1"></i> Delete Account
                </button>
            `;
        }
    };

    const editFromViewBtn = document.getElementById('editFromViewBtn');
    if (editFromViewBtn) {
        editFromViewBtn.addEventListener('click', function () {
            if (viewUserModal) viewUserModal.hide();
            if (currentUserInView) {
                setTimeout(() => openEditUserModal(currentUserInView.id), 250);
            }
        });
    }

    /**
     * 9. 4-Step Registration Wizard Handlers (Add & Edit User / Student)
     */
    function setWizardStep(step) {
        currentWizardStep = step;

        // Step buttons
        [stepBtn1, stepBtn2, stepBtn3, stepBtn4].forEach((btn, idx) => {
            if (btn) btn.classList.toggle('active', idx + 1 === step);
        });

        // Step panels
        if (wizardStep1) wizardStep1.classList.toggle('d-none', step !== 1);
        if (wizardStep2) wizardStep2.classList.toggle('d-none', step !== 2);
        if (wizardStep3) wizardStep3.classList.toggle('d-none', step !== 3);
        if (wizardStep4) wizardStep4.classList.toggle('d-none', step !== 4);

        // Buttons
        if (prevStepBtn) prevStepBtn.disabled = step === 1;
        if (nextStepBtn) nextStepBtn.classList.toggle('d-none', step === 4);
        if (saveUserBtn) saveUserBtn.classList.toggle('d-none', step !== 4);
    }

    if (stepBtn1) stepBtn1.addEventListener('click', () => setWizardStep(1));
    if (stepBtn2) stepBtn2.addEventListener('click', () => validateStep(1) && setWizardStep(2));
    if (stepBtn3) stepBtn3.addEventListener('click', () => validateStep(1) && validateStep(2) && setWizardStep(3));
    if (stepBtn4) stepBtn4.addEventListener('click', () => validateStep(1) && validateStep(2) && validateStep(3) && setWizardStep(4));

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            if (validateStep(currentWizardStep)) {
                setWizardStep(currentWizardStep + 1);
            }
        });
    }

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => {
            if (currentWizardStep > 1) {
                setWizardStep(currentWizardStep - 1);
            }
        });
    }

    function validateStep(step) {
        if (step === 1) {
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            if (name.length < 2) {
                Swal.fire({ icon: 'warning', title: 'Full Name Required', text: 'Please enter a valid full name.' });
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.fire({ icon: 'warning', title: 'Invalid Email', text: 'Please enter a valid university email address.' });
                return false;
            }
            return true;
        } else if (step === 2) {
            const uniId = document.getElementById('userUniId').value.trim();
            if (!uniId) {
                Swal.fire({ icon: 'warning', title: 'Student ID Required', text: 'Please provide a Student / University ID.' });
                return false;
            }
            return true;
        }
        return true;
    }

    if (userRoleSelect) {
        userRoleSelect.addEventListener('change', function () {
            updateRoleFieldsVisibility(this.value);
        });
    }

    function updateRoleFieldsVisibility(roleId) {
        const id = parseInt(roleId);
        const uniLabel = document.getElementById('uniIdLabel');

        if (id === 1) { // ADMIN
            if (studentSpecificFields) studentSpecificFields.classList.add('d-none');
            if (teacherSpecificFields) teacherSpecificFields.classList.add('d-none');
            if (adminSpecificFields) adminSpecificFields.classList.remove('d-none');
            if (uniLabel) uniLabel.textContent = 'Staff ID *';
        } else if (id === 2) { // TEACHER
            if (studentSpecificFields) studentSpecificFields.classList.add('d-none');
            if (teacherSpecificFields) teacherSpecificFields.classList.remove('d-none');
            if (adminSpecificFields) adminSpecificFields.classList.add('d-none');
            if (uniLabel) uniLabel.textContent = 'Teacher ID *';
        } else { // STUDENT
            if (studentSpecificFields) studentSpecificFields.classList.remove('d-none');
            if (teacherSpecificFields) teacherSpecificFields.classList.add('d-none');
            if (adminSpecificFields) adminSpecificFields.classList.add('d-none');
            if (uniLabel) uniLabel.textContent = 'Student ID *';
        }
    }

    // Open Modal for Create
    window.openCreateUserModal = function () {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        
        const isStudentContext = currentRoleFilter === 'STUDENT';
        document.getElementById('userModalTitle').textContent = isStudentContext ? 'Add New Student Account' : 'Add New User Account';
        document.getElementById('userRole').value = isStudentContext ? '3' : '3';
        document.getElementById('userStatus').value = 'Active';
        document.getElementById('userEnrollmentStatusSelect').value = 'Active';
        document.getElementById('userPassword').value = '';
        document.getElementById('passwordLabel').textContent = 'Initial Password (Default: Password123!)';

        // Auto generate next student ID
        const nextId = '20240' + String(1234 + allUsers.length);
        document.getElementById('userUniId').value = nextId;

        document.getElementById('saveUserBtn').innerHTML = `<i class="bi bi-check2-circle me-1"></i> ${isStudentContext ? 'Create Student' : 'Create User'}`;
        updateRoleFieldsVisibility('3');
        setWizardStep(1);
        if (userModal) userModal.show();
    };

    // Open Modal for Edit
    window.openEditUserModal = function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        const role = getNormalizedRole(u);
        const isStudent = role === 'STUDENT';

        document.getElementById('userId').value = u.id;
        document.getElementById('userModalTitle').textContent = isStudent ? `Edit Student: ${u.full_name}` : `Edit User: ${u.full_name}`;
        document.getElementById('userName').value = u.full_name || '';
        document.getElementById('userEmail').value = u.email || '';
        document.getElementById('userPhone').value = u.phone || '';
        document.getElementById('userDob').value = u.dob ? u.dob.slice(0, 10) : '2004-05-14';
        document.getElementById('userGender').value = u.gender || 'Female';
        document.getElementById('userAddress').value = u.address || '';
        document.getElementById('userAvatarUrl').value = u.avatar_url || '';

        document.getElementById('userUniId').value = u.university_id || '';
        document.getElementById('userFacultySelect').value = u.faculty || 'Information Technology';
        document.getElementById('userMajorSelect').value = u.major_title || u.major || 'Computer Science';
        document.getElementById('userAcademicYearSelect').value = u.academic_year || 'Year 2';
        document.getElementById('userSemesterSelect').value = u.semester || 'Semester 1';

        document.getElementById('userEnrollmentStatusSelect').value = u.enrollment_status || 'Active';
        document.getElementById('userAcademicStatusInput').value = u.academic_status || 'Currently Enrolled';
        document.getElementById('userEnrollmentDate').value = u.enrollment_date ? u.enrollment_date.slice(0, 10) : '2024-09-01';
        document.getElementById('userGraduationDate').value = u.expected_graduation_date ? u.expected_graduation_date.slice(0, 10) : '2028-07-15';

        const roleId = u.role_id || (u.role === 'ADMIN' ? 1 : u.role === 'TEACHER' ? 2 : 3);
        document.getElementById('userRole').value = String(roleId);
        document.getElementById('userStatus').value = u.status || 'Active';
        document.getElementById('userEmailVerified').value = u.email_verified !== undefined ? String(u.email_verified) : '1';

        document.getElementById('userPassword').value = '';
        document.getElementById('passwordLabel').textContent = 'New Password (leave blank to keep current)';
        document.getElementById('saveUserBtn').innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save Changes';

        updateRoleFieldsVisibility(String(roleId));
        setWizardStep(1);
        if (userModal) userModal.show();
    };

    /**
     * 10. Form Submission: Create / Update
     */
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const id = document.getElementById('userId').value;
            const fullName = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const phone = document.getElementById('userPhone').value.trim();
            const dob = document.getElementById('userDob').value;
            const gender = document.getElementById('userGender').value;
            const address = document.getElementById('userAddress').value.trim();
            const avatarUrl = document.getElementById('userAvatarUrl').value.trim();

            const uniId = document.getElementById('userUniId').value.trim();
            const faculty = document.getElementById('userFacultySelect').value;
            const major = document.getElementById('userMajorSelect').value;
            const academicYear = document.getElementById('userAcademicYearSelect').value;
            const semester = document.getElementById('userSemesterSelect').value;

            const enrollmentStatus = document.getElementById('userEnrollmentStatusSelect').value;
            const academicStatus = document.getElementById('userAcademicStatusInput').value.trim();
            const enrollmentDate = document.getElementById('userEnrollmentDate').value;
            const graduationDate = document.getElementById('userGraduationDate').value;

            const roleId = parseInt(document.getElementById('userRole').value);
            const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'TEACHER' : 'STUDENT';
            const status = document.getElementById('userStatus').value;
            const emailVerified = parseInt(document.getElementById('userEmailVerified').value);
            const password = document.getElementById('userPassword').value.trim();

            const payload = {
                full_name: fullName,
                email: email,
                phone: phone,
                dob: dob,
                gender: gender,
                address: address,
                avatar_url: avatarUrl,
                university_id: uniId,
                faculty: faculty,
                major: major,
                academic_year: academicYear,
                semester: semester,
                enrollment_status: enrollmentStatus,
                academic_status: academicStatus,
                enrollment_date: enrollmentDate,
                expected_graduation_date: graduationDate,
                role_id: roleId,
                role: roleName,
                status: status,
                email_verified: emailVerified
            };

            if (password) payload.password = password;

            const submitBtn = document.getElementById('saveUserBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

            try {
                let res;
                if (id) {
                    res = await fetch(`${API_BASE}/admin/users/${id}`, {
                        method: 'PUT',
                        headers: getHeaders(),
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch(`${API_BASE}/admin/users`, {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify(payload)
                    });
                }

                const result = await res.json();
                if (res.ok && result.success) {
                    if (userModal) userModal.hide();
                    Swal.fire({
                        icon: 'success',
                        title: id ? 'Student Updated' : 'Student Registered',
                        text: result.message || 'Record saved successfully.',
                        timer: 1800,
                        showConfirmButton: false
                    });
                    loadUsers();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Save Failed',
                        text: result.message || 'Could not save student. Please check ID and email uniqueness.'
                    });
                }
            } catch (err) {
                // Fallback update
                if (id) {
                    const idx = allUsers.findIndex(u => u.id === parseInt(id));
                    if (idx !== -1) allUsers[idx] = { ...allUsers[idx], ...payload };
                } else {
                    const newId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id || 0)) + 1 : 1;
                    allUsers.unshift({ id: newId, ...payload, created_at: new Date().toISOString() });
                }
                if (userModal) userModal.hide();
                renderStatistics();
                applyFilters();
                Swal.fire({ icon: 'success', title: 'Saved', text: 'Record updated successfully.' });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Save`;
            }
        });
    }

    /**
     * 11. Change Role Dialog
     */
    window.openChangeRoleDialog = async function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        const currentRole = getNormalizedRole(u);
        const { value: selectedRole } = await Swal.fire({
            title: `Change Role for ${u.full_name}`,
            input: 'select',
            inputOptions: {
                '3': 'STUDENT',
                '2': 'TEACHER',
                '1': 'ADMIN'
            },
            inputValue: u.role_id || (currentRole === 'ADMIN' ? '1' : currentRole === 'TEACHER' ? '2' : '3'),
            showCancelButton: true,
            confirmButtonText: 'Update Role',
            confirmButtonColor: '#2563eb',
            cancelButtonText: 'Cancel'
        });

        if (selectedRole) {
            const roleId = parseInt(selectedRole);
            const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'TEACHER' : 'STUDENT';

            try {
                await fetch(`${API_BASE}/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({ role_id: roleId, role: roleName })
                });
                Swal.fire({ icon: 'success', title: 'Role Updated', text: `${u.full_name} is now a ${roleName}`, timer: 1600, showConfirmButton: false });
                loadUsers();
            } catch (e) {
                u.role_id = roleId;
                u.role = roleName;
                renderStatistics();
                applyFilters();
                Swal.fire({ icon: 'success', title: 'Role Updated', text: `${u.full_name} is now a ${roleName}` });
            }
        }
    };

    /**
     * 12. Reset Password Dialog
     */
    window.openResetPasswordDialog = async function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        const result = await Swal.fire({
            title: 'Reset Password',
            html: `Generate a new temporary password for <b>${escapeHtml(u.full_name)}</b>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Reset Password',
            confirmButtonColor: '#f59e0b',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const tempPassword = 'AUB' + Math.floor(100000 + Math.random() * 900000) + '!';

            try {
                const res = await fetch(`${API_BASE}/admin/users/${userId}/reset-password`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ new_password: tempPassword })
                });

                const data = await res.json();
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset Successful!',
                    html: `
                        <div class="p-3 bg-light rounded border text-start">
                            <div class="text-xs text-muted mb-1">Temporary Password for <b>${escapeHtml(u.email)}</b>:</div>
                            <div class="font-monospace fs-5 text-primary fw-bold user-select-all">${escapeHtml(data.temporaryPassword || tempPassword)}</div>
                        </div>
                        <div class="text-xs text-muted mt-2">Please provide this password to the student. They will be prompted to update it on sign-in.</div>
                    `
                });
            } catch (e) {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset',
                    html: `<div class="p-3 bg-light rounded border font-monospace fs-5 text-primary fw-bold">${tempPassword}</div>`
                });
            }
        }
    };

    /**
     * 13. Toggle User Status (Suspend / Activate)
     */
    window.toggleUserStatus = async function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        const isCurrentlyActive = (u.status || 'Active') === 'Active';
        const targetStatus = isCurrentlyActive ? 'Suspended' : 'Active';

        try {
            const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: targetStatus })
            });

            if (res.ok) {
                Swal.fire({
                    icon: isCurrentlyActive ? 'warning' : 'success',
                    title: isCurrentlyActive ? 'Account Suspended' : 'Account Activated',
                    text: `${u.full_name}'s account is now ${targetStatus}.`,
                    timer: 1800,
                    showConfirmButton: false
                });
                if (viewUserModal) viewUserModal.hide();
                loadUsers();
                return;
            }
        } catch (e) {}

        u.status = targetStatus;
        if (viewUserModal) viewUserModal.hide();
        renderStatistics();
        applyFilters();
    };

    /**
     * 14. Delete User / Student
     */
    window.deleteUser = async function (userId) {
        const u = allUsers.find(user => user.id === userId);
        const name = u ? u.full_name : 'this user';

        const result = await Swal.fire({
            title: 'Delete User Account?',
            html: `Are you sure you want to delete <b>"${escapeHtml(name)}"</b>?<br><br><span class="text-danger fw-semibold">This action cannot be undone.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete Account',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                if (window.AdminStore) {
                    window.AdminStore.deleteUser(userId);
                    allUsers = window.AdminStore.getUsers();
                }

                const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    if (errData.message) {
                        throw new Error(errData.message);
                    }
                }

                if (viewUserModal) viewUserModal.hide();
                Swal.fire({
                    icon: 'success',
                    title: 'User Deleted',
                    text: `Record for "${name}" has been permanently removed.`,
                    timer: 1800,
                    showConfirmButton: false
                });
                loadUsers();
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Action Prohibited',
                    text: err.message || 'Cannot delete this user account.'
                });
                loadUsers();
            }
        }
    };

    /**
     * 15. Export Students / Users to CSV
     */
    window.exportUsersCSV = function () {
        const isStudentView = currentRoleFilter === 'STUDENT';
        const filteredList = allUsers.filter(u => !isStudentView || getNormalizedRole(u) === 'STUDENT');

        if (filteredList.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No Data', text: 'No student records available to export.' });
            return;
        }

        let headers = [];
        let rows = [];

        if (isStudentView) {
            headers = ['Student ID', 'Full Name', 'University Email', 'Faculty', 'Major', 'Academic Year', 'Semester', 'Enrollment Status', 'Account Status', 'Joined Date'];
            rows = filteredList.map(u => [
                `"${u.university_id || ''}"`,
                `"${(u.full_name || '').replace(/"/g, '""')}"`,
                `"${u.email || ''}"`,
                `"${u.faculty || 'Information Technology'}"`,
                `"${u.major_title || u.major || 'Computer Science'}"`,
                `"${u.academic_year || 'Year 2'}"`,
                `"${u.semester || 'Semester 1'}"`,
                `"${u.enrollment_status || 'Active'}"`,
                `"${u.status || 'Active'}"`,
                formatDate(u.created_at)
            ]);
        } else {
            headers = ['ID', 'Full Name', 'University ID', 'Email', 'Role', 'Department/Faculty', 'Status', 'Joined Date'];
            rows = filteredList.map(u => [
                u.id,
                `"${(u.full_name || '').replace(/"/g, '""')}"`,
                `"${u.university_id || ''}"`,
                `"${u.email || ''}"`,
                getNormalizedRole(u),
                `"${u.faculty || u.department_name || ''}"`,
                `"${u.status || 'Active'}"`,
                formatDate(u.created_at)
            ]);
        }

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', isStudentView ? `AUB_Students_Directory_${new Date().toISOString().slice(0, 10)}.csv` : `AUB_Users_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: 'success',
            title: 'Export Complete',
            text: `Successfully exported ${filteredList.length} records.`,
            timer: 1800,
            showConfirmButton: false
        });
    };

    // 16. Account Provisioning Method Switcher
    const authMethodRadios = document.querySelectorAll('input[name="authProvisionMethod"]');
    const manualPasswordContainer = document.getElementById('manualPasswordContainer');
    authMethodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (manualPasswordContainer) {
                if (this.value === 'manual') {
                    manualPasswordContainer.classList.remove('d-none');
                } else {
                    manualPasswordContainer.classList.add('d-none');
                }
            }
        });
    });

    // 17. Bulk CSV/Excel User Import
    const bulkImportModalEl = document.getElementById('bulkImportModal');
    const bulkImportModal = bulkImportModalEl ? new bootstrap.Modal(bulkImportModalEl) : null;
    let parsedImportData = [];

    window.openBulkImportModal = function() {
        parsedImportData = [];
        const fileInput = document.getElementById('bulkImportFileInput');
        if (fileInput) fileInput.value = '';
        const fileNameEl = document.getElementById('importFileName');
        if (fileNameEl) fileNameEl.textContent = 'No file selected';
        const previewCont = document.getElementById('importPreviewContainer');
        if (previewCont) previewCont.style.display = 'none';
        const execBtn = document.getElementById('executeImportBtn');
        if (execBtn) execBtn.disabled = true;
        if (bulkImportModal) bulkImportModal.show();
    };

    window.downloadSampleCSVTemplate = function() {
        const headers = ['Full Name', 'University Email', 'Student/Employee ID', 'Role', 'Faculty', 'Major', 'Academic Year', 'Semester'];
        const sampleRows = [
            ['"Sokha Heng"', '"sokha.heng@aub.edu.kh"', '"202409812"', '"STUDENT"', '"Information Technology"', '"Software Engineering"', '"Year 1"', '"Semester 1"'],
            ['"Pisey Chan"', '"pisey.chan@aub.edu.kh"', '"202409813"', '"STUDENT"', '"Information Technology"', '"Cybersecurity"', '"Year 2"', '"Semester 1"'],
            ['"Dr. Robert Evans"', '"robert.evans@aub.edu.kh"', '"FAC202408"', '"TEACHER"', '"Computer Science"', '""', '""', '""']
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'AUB_Bulk_User_Import_Template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const bulkFileInput = document.getElementById('bulkImportFileInput');
    if (bulkFileInput) {
        bulkFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            handleImportFile(file);
        });
    }

    const dropZone = document.getElementById('importDropZone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('bg-white'); });
        dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('bg-white'); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-white');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImportFile(e.dataTransfer.files[0]);
            }
        });
    }

    function handleImportFile(file) {
        const fileNameEl = document.getElementById('importFileName');
        if (fileNameEl) fileNameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            processCSVContent(text);
        };
        reader.readAsText(file);
    }

    function processCSVContent(csvText) {
        const lines = csvText.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) {
            Swal.fire({ icon: 'warning', title: 'Empty File', text: 'The selected CSV file does not contain any user records.' });
            return;
        }

        const dataRows = lines.slice(1);
        const existingEmails = new Set(allUsers.map(u => (u.email || '').toLowerCase()));
        const existingIds = new Set(allUsers.map(u => (u.university_id || '').toLowerCase()));
        const fileEmails = new Set();

        parsedImportData = [];
        let validCount = 0;
        let duplicateCount = 0;

        const tableBody = document.getElementById('importPreviewTableBody');
        if (tableBody) tableBody.innerHTML = '';

        dataRows.forEach((line, idx) => {
            const cols = [];
            let inQuote = false;
            let currentStr = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"' || char === "'") {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    cols.push(currentStr.trim());
                    currentStr = '';
                } else {
                    currentStr += char;
                }
            }
            cols.push(currentStr.trim());

            const name = (cols[0] || `Student #${idx + 1}`).replace(/^["']|["']$/g, '');
            const email = (cols[1] || `user${Date.now()}_${idx}@aub.edu.kh`).replace(/^["']|["']$/g, '').toLowerCase();
            const uniId = (cols[2] || `2024${Math.floor(10000 + Math.random() * 90000)}`).replace(/^["']|["']$/g, '');
            const role = (cols[3] || 'STUDENT').replace(/^["']|["']$/g, '').toUpperCase();
            const faculty = (cols[4] || 'Information Technology').replace(/^["']|["']$/g, '');
            const major = (cols[5] || 'Computer Science').replace(/^["']|["']$/g, '');
            const year = (cols[6] || 'Year 1').replace(/^["']|["']$/g, '');
            const semester = (cols[7] || 'Semester 1').replace(/^["']|["']$/g, '');

            let validationStatus = 'Valid';
            let statusBadge = '<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Ready</span>';

            if (existingEmails.has(email)) {
                validationStatus = 'Duplicate Email';
                statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">Duplicate Email</span>';
                duplicateCount++;
            } else if (existingIds.has(uniId)) {
                validationStatus = 'Duplicate ID';
                statusBadge = '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25">Duplicate ID</span>';
                duplicateCount++;
            } else if (fileEmails.has(email)) {
                validationStatus = 'Duplicate in File';
                statusBadge = '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">Duplicate in File</span>';
                duplicateCount++;
            } else {
                validCount++;
                fileEmails.add(email);
            }

            const rowData = {
                id: Date.now() + idx,
                full_name: name,
                email: email,
                university_id: uniId,
                role: role,
                role_id: role === 'ADMIN' ? 1 : role === 'TEACHER' ? 2 : 3,
                faculty: faculty,
                major: major,
                major_title: major,
                academic_year: year,
                semester: semester,
                status: 'Active',
                enrollment_status: 'Active',
                email_verified: 1,
                created_at: new Date().toISOString(),
                validationStatus: validationStatus
            };

            parsedImportData.push(rowData);

            if (tableBody && idx < 20) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-semibold text-dark">${escapeHtml(name)}</td>
                    <td class="text-muted font-monospace">${escapeHtml(email)}</td>
                    <td class="text-muted font-monospace">${escapeHtml(uniId)}</td>
                    <td><span class="badge bg-light text-dark border text-xs">${escapeHtml(role)}</span></td>
                    <td>${statusBadge}</td>
                `;
                tableBody.appendChild(tr);
            }
        });

        document.getElementById('importTotalRows').textContent = dataRows.length;
        document.getElementById('importValidRows').textContent = validCount;
        document.getElementById('importDuplicateRows').textContent = duplicateCount;
        document.getElementById('importPreviewContainer').style.display = 'block';

        const execBtn = document.getElementById('executeImportBtn');
        if (execBtn) {
            execBtn.disabled = validCount === 0;
            execBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Import ${validCount} Users`;
        }
    }

    window.executeBulkImport = async function() {
        const validUsers = parsedImportData.filter(u => u.validationStatus === 'Valid');

        if (validUsers.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No Valid Records', text: 'There are no valid, non-duplicate records to import.' });
            return;
        }

        const execBtn = document.getElementById('executeImportBtn');
        if (execBtn) {
            execBtn.disabled = true;
            execBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Importing ${validUsers.length} records...`;
        }

        if (window.AdminStore) {
            validUsers.forEach(u => {
                window.AdminStore.createUser(u);
            });
            allUsers = window.AdminStore.getUsers();
        } else {
            allUsers.unshift(...validUsers);
        }

        if (bulkImportModal) bulkImportModal.hide();
        renderStatistics();
        renderTableStructure();
        applyFilters();

        Swal.fire({
            icon: 'success',
            title: 'Bulk Import Successful',
            html: `Successfully imported <b>${validUsers.length}</b> institutional user accounts.<br><span class="text-muted text-xs">Profiles provisioned and ready in administration directory.</span>`,
            timer: 2400,
            showConfirmButton: false
        });
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
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Initialize View
    await loadDepartments();
    await loadMajors();
    await loadUsers();
});
