/**
 * AUB Digital Academy - User Management Controller
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
    let currentRoleFilter = 'all';
    let currentStatusFilter = 'all';
    let currentDepartmentFilter = 'all';
    let currentSearchQuery = '';
    let currentUserInView = null;
    let currentWizardStep = 1;

    // DOM Elements
    const userModalEl = document.getElementById('userModal');
    const userModal = userModalEl ? new bootstrap.Modal(userModalEl) : null;

    const viewUserModalEl = document.getElementById('viewUserModal');
    const viewUserModal = viewUserModalEl ? new bootstrap.Modal(viewUserModalEl) : null;

    const searchInput = document.getElementById('userSearchInput');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const userStatusFilter = document.getElementById('userStatusFilter');
    const userDepartmentFilter = document.getElementById('userDepartmentFilter');
    const rolePillGroup = document.getElementById('rolePillGroup');
    const usersTableBody = document.getElementById('usersTableBody');
    const tableRecordCount = document.getElementById('tableRecordCount');

    // Multi-Step Wizard Elements
    const stepBtn1 = document.getElementById('stepBtn1');
    const stepBtn2 = document.getElementById('stepBtn2');
    const stepBtn3 = document.getElementById('stepBtn3');
    const wizardStep1 = document.getElementById('wizardStep1');
    const wizardStep2 = document.getElementById('wizardStep2');
    const wizardStep3 = document.getElementById('wizardStep3');
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

        // Populate Department Filter & Form Select
        if (userDepartmentFilter) {
            userDepartmentFilter.innerHTML = '<option value="all">All Departments</option>';
            departmentsList.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept.name;
                opt.textContent = `${dept.name} (${dept.code})`;
                userDepartmentFilter.appendChild(opt);
            });
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

        updateStatistics();
        applyFilters();
    }

    /**
     * 3. Update Statistics Cards and Pills
     */
    function updateStatistics() {
        const totalUsers = allUsers.length;
        const totalStudents = allUsers.filter(u => getNormalizedRole(u) === 'STUDENT').length;
        const totalTeachers = allUsers.filter(u => getNormalizedRole(u) === 'TEACHER').length;
        const totalAdmins = allUsers.filter(u => getNormalizedRole(u) === 'ADMIN').length;
        const totalActive = allUsers.filter(u => (u.status || 'Active').toLowerCase() === 'active').length;

        // Statistics Cards
        const elTotalUsers = document.getElementById('statTotalUsers');
        if (elTotalUsers) elTotalUsers.textContent = totalUsers;

        const elStudents = document.getElementById('statStudents');
        if (elStudents) elStudents.textContent = totalStudents;

        const elTeachers = document.getElementById('statTeachers');
        if (elTeachers) elTeachers.textContent = totalTeachers;

        const elAdmins = document.getElementById('statAdmins');
        if (elAdmins) elAdmins.textContent = totalAdmins;

        const elActive = document.getElementById('statActiveUsers');
        if (elActive) elActive.textContent = totalActive;

        // Filter Pills Badges
        const elCountAll = document.getElementById('countAll');
        if (elCountAll) elCountAll.textContent = totalUsers;

        const elCountStudents = document.getElementById('countStudents');
        if (elCountStudents) elCountStudents.textContent = totalStudents;

        const elCountTeachers = document.getElementById('countTeachers');
        if (elCountTeachers) elCountTeachers.textContent = totalTeachers;

        const elCountAdmins = document.getElementById('countAdmins');
        if (elCountAdmins) elCountAdmins.textContent = totalAdmins;
    }

    function getNormalizedRole(u) {
        if (u.role) return u.role.toUpperCase();
        if (u.role_id === 1) return 'ADMIN';
        if (u.role_id === 2) return 'TEACHER';
        return 'STUDENT';
    }

    /**
     * 4. Apply Dynamic Search & Filters
     */
    function applyFilters() {
        const search = currentSearchQuery.toLowerCase().trim();
        const role = currentRoleFilter.toLowerCase();
        const status = currentStatusFilter.toLowerCase();
        const department = currentDepartmentFilter.toLowerCase();

        const filtered = allUsers.filter(u => {
            // Search criteria: Full name, email, university ID, phone
            const matchSearch = !search ||
                (u.full_name && u.full_name.toLowerCase().includes(search)) ||
                (u.email && u.email.toLowerCase().includes(search)) ||
                (u.university_id && u.university_id.toLowerCase().includes(search)) ||
                (u.phone && u.phone.toLowerCase().includes(search));

            // Role criteria
            const uRole = getNormalizedRole(u).toLowerCase();
            const matchRole = role === 'all' || uRole === role;

            // Status criteria
            const uStatus = (u.status || 'Active').toLowerCase();
            const matchStatus = status === 'all' || uStatus === status;

            // Department criteria
            let userDept = (u.department_name || u.teacher_department || u.major_title || u.faculty || '').toLowerCase();
            const matchDepartment = department === 'all' || userDept.includes(department);

            return matchSearch && matchRole && matchStatus && matchDepartment;
        });

        renderUsers(filtered);
    }

    /**
     * 5. Render Users Table with Actions
     */
    function renderUsers(users) {
        if (!usersTableBody) return;

        if (tableRecordCount) {
            tableRecordCount.textContent = `Showing ${users.length} of ${allUsers.length} users`;
        }

        if (users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-people fs-2 d-block mb-2 text-secondary opacity-50"></i>
                        <span class="fw-bold text-dark">No user accounts found</span>
                        <div style="font-size: 12px;" class="mt-1">Try adjusting your search keywords, role pill, or filter dropdowns.</div>
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
            let roleBadge = '';
            if (role === 'ADMIN') {
                roleBadge = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 fw-bold px-2 py-1"><i class="bi bi-shield-lock-fill me-1"></i>ADMIN</span>`;
            } else if (role === 'TEACHER') {
                roleBadge = `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 fw-bold px-2 py-1"><i class="bi bi-person-badge-fill me-1"></i>TEACHER</span>`;
            } else {
                roleBadge = `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-bold px-2 py-1"><i class="bi bi-mortarboard-fill me-1"></i>STUDENT</span>`;
            }

            const status = u.status || 'Active';
            let statusDot = 'active';
            if (status === 'Pending') statusDot = 'pending';
            else if (status === 'Suspended') statusDot = 'suspended';
            else if (status === 'Inactive') statusDot = 'inactive';

            const avatar = u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`;
            const joinedDate = formatDate(u.created_at);

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${escapeHtml(avatar)}" class="rounded-circle object-fit-cover shadow-sm" style="width: 36px; height: 36px; border: 1.5px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                            <div>
                                <div class="fw-bold text-dark text-sm">${escapeHtml(u.full_name)}</div>
                                <div class="text-xs text-muted">${escapeHtml(u.department_name || u.teacher_department || u.major_title || u.faculty || 'AUB Academy')}</div>
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
                    <td class="text-muted text-xs">
                        ${joinedDate}
                    </td>
                    <td class="text-end">
                        <div class="d-flex align-items-center justify-content-end gap-1">
                            <!-- 1. View Button -->
                            <button class="btn btn-outline-primary btn-sm py-1 px-2" title="View Profile" onclick="openViewUserModal(${u.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <!-- 2. Edit Button -->
                            <button class="btn btn-outline-secondary btn-sm py-1 px-2" title="Edit User" onclick="openEditUserModal(${u.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <!-- 3. More Dropdown Menu -->
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
        }).join('');
    }

    /**
     * 6. Search & Filter Event Handlers
     */
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            applyFilters();
        });
    }

    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', function () {
            currentRoleFilter = this.value;
            if (rolePillGroup) {
                rolePillGroup.querySelectorAll('.btn-filter-pill').forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-role') === currentRoleFilter);
                });
            }
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
            if (userRoleFilter) userRoleFilter.value = currentRoleFilter;
            applyFilters();
        });
    }

    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', function () {
            currentStatusFilter = this.value;
            applyFilters();
        });
    }

    if (userDepartmentFilter) {
        userDepartmentFilter.addEventListener('change', function () {
            currentDepartmentFilter = this.value;
            applyFilters();
        });
    }

    window.resetFilters = function () {
        if (searchInput) searchInput.value = '';
        if (userRoleFilter) userRoleFilter.value = 'all';
        if (userStatusFilter) userStatusFilter.value = 'all';
        if (userDepartmentFilter) userDepartmentFilter.value = 'all';
        currentSearchQuery = '';
        currentRoleFilter = 'all';
        currentStatusFilter = 'all';
        currentDepartmentFilter = 'all';

        if (rolePillGroup) {
            rolePillGroup.querySelectorAll('.btn-filter-pill').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-role') === 'all');
            });
        }
        applyFilters();
    };

    /**
     * 7. View User Profile Drawer/Modal
     */
    window.openViewUserModal = async function (userId) {
        let u = allUsers.find(user => user.id === userId);
        if (!u) return;

        currentUserInView = u;
        const body = document.getElementById('viewUserModalBody');
        const leftActions = document.getElementById('viewModalLeftActions');
        if (!body) return;

        body.innerHTML = `
            <div class="text-center py-5 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading profile details...
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
        let roleBadgeClass = 'bg-primary';
        if (role === 'ADMIN') roleBadgeClass = 'bg-warning text-dark';
        else if (role === 'TEACHER') roleBadgeClass = 'bg-info text-dark';

        const status = u.status || 'Active';
        let statusDot = 'active';
        if (status === 'Pending') statusDot = 'pending';
        else if (status === 'Suspended') statusDot = 'suspended';
        else if (status === 'Inactive') statusDot = 'inactive';

        const avatar = u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`;

        // Academic Info Block based on Role
        let academicHtml = '';
        if (role === 'STUDENT') {
            academicHtml = `
                <div class="row g-3">
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">University ID</div>
                        <div class="profile-info-value font-monospace">${escapeHtml(u.university_id || 'N/A')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Faculty</div>
                        <div class="profile-info-value">${escapeHtml(u.faculty || 'Faculty of Computer Science & IT')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Major / Program</div>
                        <div class="profile-info-value">${escapeHtml(u.major_title || u.major || 'Computer Science')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Academic Year</div>
                        <div class="profile-info-value">${escapeHtml(u.academic_year || 'Year 2')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Semester</div>
                        <div class="profile-info-value">${escapeHtml(u.semester || 'Semester 1')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Enrollment Status</div>
                        <div class="profile-info-value">${escapeHtml(u.enrollment_status || 'Full-Time')}</div>
                    </div>
                </div>
            `;
        } else if (role === 'TEACHER') {
            academicHtml = `
                <div class="row g-3">
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Teacher / Faculty ID</div>
                        <div class="profile-info-value font-monospace">${escapeHtml(u.teacher_code || u.university_id || 'TCH')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Faculty</div>
                        <div class="profile-info-value">${escapeHtml(u.faculty || 'Academic Directorate')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Department</div>
                        <div class="profile-info-value">${escapeHtml(u.teacher_department || u.department_name || 'Computer Science')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Academic Position</div>
                        <div class="profile-info-value">${escapeHtml(u.position || 'Senior Lecturer')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Employment Type</div>
                        <div class="profile-info-value">${escapeHtml(u.teacher_employment_type || 'Full-Time')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Office / Room</div>
                        <div class="profile-info-value">${escapeHtml(u.teacher_office_room || 'Faculty Bldg A')}</div>
                    </div>
                </div>
            `;
        } else {
            academicHtml = `
                <div class="row g-3">
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Staff ID</div>
                        <div class="profile-info-value font-monospace">${escapeHtml(u.university_id || 'ADM-001')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Department</div>
                        <div class="profile-info-value">${escapeHtml(u.department_name || 'Information Technology Directorate')}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                        <div class="profile-info-label">Position</div>
                        <div class="profile-info-value">${escapeHtml(u.position || 'System Administrator')}</div>
                    </div>
                </div>
            `;
        }

        // Activity Logs Block
        let logsHtml = '';
        const logs = u.activity_logs || [
            { action: 'Account Created', details: `User registered with ${role} credentials`, created_at: u.created_at },
            { action: 'Profile Initialized', details: 'AUB Digital Academy system identity verified', created_at: u.created_at }
        ];

        logsHtml = logs.map(log => `
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
            <!-- HEADER -->
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
                        <i class="bi bi-envelope me-1"></i> ${escapeHtml(u.email)} &bull; 
                        <i class="bi bi-telephone me-1"></i> ${escapeHtml(u.phone || '+855 23 999 000')}
                    </div>
                    <div class="text-xs text-muted">
                        <i class="bi bi-card-text me-1"></i> University ID: <span class="font-monospace fw-bold">${escapeHtml(u.university_id || 'N/A')}</span>
                    </div>
                </div>
            </div>

            <!-- SECTION A: OVERVIEW -->
            <div class="card border-0 bg-light p-3 rounded-3 mb-3">
                <h6 class="fw-bold text-dark text-xs text-uppercase mb-3 d-flex align-items-center">
                    <i class="bi bi-info-circle-fill text-primary me-2"></i> Overview
                </h6>
                <div class="row g-3">
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Full Name</div>
                        <div class="profile-info-value">${escapeHtml(u.full_name)}</div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Email Address</div>
                        <div class="profile-info-value text-truncate" title="${escapeHtml(u.email)}">${escapeHtml(u.email)}</div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Phone Number</div>
                        <div class="profile-info-value">${escapeHtml(u.phone || 'N/A')}</div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Joined Date</div>
                        <div class="profile-info-value">${formatDate(u.created_at)}</div>
                    </div>
                </div>
            </div>

            <!-- SECTION B: ACADEMIC INFORMATION -->
            <div class="card border-0 bg-light p-3 rounded-3 mb-3">
                <h6 class="fw-bold text-dark text-xs text-uppercase mb-3 d-flex align-items-center">
                    <i class="bi bi-mortarboard-fill text-primary me-2"></i> Academic Information (${role})
                </h6>
                ${academicHtml}
            </div>

            <!-- SECTION C: ACCOUNT & SECURITY -->
            <div class="card border-0 bg-light p-3 rounded-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-dark text-xs text-uppercase mb-0 d-flex align-items-center">
                        <i class="bi bi-shield-check text-primary me-2"></i> Account & Security
                    </h6>
                    <button class="btn btn-outline-warning btn-sm py-1 px-2 text-xs" onclick="openResetPasswordDialog(${u.id})">
                        <i class="bi bi-key me-1"></i> Reset Password
                    </button>
                </div>
                <div class="row g-3">
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Email Verification</div>
                        <div class="profile-info-value text-success"><i class="bi bi-check-circle-fill me-1"></i> Verified</div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Two-Factor Authentication</div>
                        <div class="profile-info-value ${u.two_factor_enabled ? 'text-success' : 'text-muted'}">
                            <i class="bi ${u.two_factor_enabled ? 'bi-shield-fill-check' : 'bi-shield-slash'} me-1"></i>
                            ${u.two_factor_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Last Login</div>
                        <div class="profile-info-value">${u.last_login_at ? formatDate(u.last_login_at) : 'Active this week'}</div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                        <div class="profile-info-label">Account Created</div>
                        <div class="profile-info-value">${formatDate(u.created_at)}</div>
                    </div>
                </div>
            </div>

            <!-- SECTION D: ACTIVITY / AUDIT LOG -->
            <div class="card border-0 bg-light p-3 rounded-3">
                <h6 class="fw-bold text-dark text-xs text-uppercase mb-3 d-flex align-items-center">
                    <i class="bi bi-clock-history text-primary me-2"></i> Account Activity Log
                </h6>
                <div class="activity-timeline">
                    ${logsHtml}
                </div>
            </div>
        `;

        // Left Footer Actions: Suspend / Activate & Delete
        if (leftActions) {
            const isSuspended = (u.status || 'Active') === 'Suspended';
            leftActions.innerHTML = `
                <button type="button" class="btn ${isSuspended ? 'btn-outline-success' : 'btn-outline-warning'} btn-sm me-2" onclick="toggleUserStatus(${u.id})">
                    <i class="bi ${isSuspended ? 'bi-check-circle' : 'bi-dash-circle'} me-1"></i>
                    ${isSuspended ? 'Activate Account' : 'Suspend Account'}
                </button>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteUser(${u.id})">
                    <i class="bi bi-trash me-1"></i> Delete User
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
     * 8. Multi-Step Wizard Handlers (Add & Edit User)
     */
    function setWizardStep(step) {
        currentWizardStep = step;

        // Step headers
        [stepBtn1, stepBtn2, stepBtn3].forEach((btn, idx) => {
            if (btn) btn.classList.toggle('active', idx + 1 === step);
        });

        // Step panels
        if (wizardStep1) wizardStep1.classList.toggle('d-none', step !== 1);
        if (wizardStep2) wizardStep2.classList.toggle('d-none', step !== 2);
        if (wizardStep3) wizardStep3.classList.toggle('d-none', step !== 3);

        // Buttons
        if (prevStepBtn) prevStepBtn.disabled = step === 1;
        if (nextStepBtn) nextStepBtn.classList.toggle('d-none', step === 3);
        if (saveUserBtn) saveUserBtn.classList.toggle('d-none', step !== 3);
    }

    if (stepBtn1) stepBtn1.addEventListener('click', () => setWizardStep(1));
    if (stepBtn2) stepBtn2.addEventListener('click', () => validateStep(1) && setWizardStep(2));
    if (stepBtn3) stepBtn3.addEventListener('click', () => validateStep(1) && validateStep(2) && setWizardStep(3));

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
                Swal.fire({ icon: 'warning', title: 'Name Required', text: 'Please enter a valid full name.' });
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.fire({ icon: 'warning', title: 'Invalid Email', text: 'Please enter a valid email address.' });
                return false;
            }
            return true;
        } else if (step === 2) {
            const uniId = document.getElementById('userUniId').value.trim();
            if (!uniId) {
                Swal.fire({ icon: 'warning', title: 'University ID Required', text: 'Please provide a University / Staff / Teacher ID.' });
                return false;
            }
            return true;
        }
        return true;
    }

    // Role-specific dynamic fields in Wizard
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
            if (uniLabel) uniLabel.textContent = 'Staff / Admin ID *';
        } else if (id === 2) { // TEACHER
            if (studentSpecificFields) studentSpecificFields.classList.add('d-none');
            if (teacherSpecificFields) teacherSpecificFields.classList.remove('d-none');
            if (adminSpecificFields) adminSpecificFields.classList.add('d-none');
            if (uniLabel) uniLabel.textContent = 'Teacher ID *';
        } else { // STUDENT
            if (studentSpecificFields) studentSpecificFields.classList.remove('d-none');
            if (teacherSpecificFields) teacherSpecificFields.classList.add('d-none');
            if (adminSpecificFields) adminSpecificFields.classList.add('d-none');
            if (uniLabel) uniLabel.textContent = 'University / Student ID *';
        }
    }

    // Open Modal for Create
    window.openCreateUserModal = function () {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('userModalTitle').textContent = 'Add New User Account';
        document.getElementById('userRole').value = '3'; // Default STUDENT
        document.getElementById('userStatus').value = 'Active';
        document.getElementById('userPassword').value = '';
        document.getElementById('passwordLabel').textContent = 'Initial Password (Default: Password123!)';

        // Auto generate next University ID
        const nextNum = allUsers.length + 1001;
        document.getElementById('userUniId').value = `000${nextNum}`;

        document.getElementById('saveUserBtn').innerHTML = '<i class="bi bi-check2-circle me-1"></i> Create User';
        updateRoleFieldsVisibility('3');
        setWizardStep(1);
        if (userModal) userModal.show();
    };

    // Open Modal for Edit
    window.openEditUserModal = function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        document.getElementById('userId').value = u.id;
        document.getElementById('userModalTitle').textContent = `Edit User: ${u.full_name}`;
        document.getElementById('userName').value = u.full_name || '';
        document.getElementById('userEmail').value = u.email || '';
        document.getElementById('userPhone').value = u.phone || '';
        document.getElementById('userAvatarUrl').value = u.avatar_url || '';
        document.getElementById('userUniId').value = u.university_id || '';
        document.getElementById('userFacultySelect').value = u.faculty || 'Faculty of Computer Science & IT';
        document.getElementById('userMajorSelect').value = u.major_title || u.major || 'Computer Science';
        document.getElementById('userAcademicYearSelect').value = u.academic_year || 'Year 1';
        document.getElementById('userSemesterSelect').value = u.semester || 'Semester 1';

        const roleId = u.role_id || (u.role === 'ADMIN' ? 1 : u.role === 'TEACHER' ? 2 : 3);
        document.getElementById('userRole').value = String(roleId);
        document.getElementById('userStatus').value = u.status || 'Active';

        if (document.getElementById('userDepartmentSelect')) {
            document.getElementById('userDepartmentSelect').value = u.teacher_department || u.department_name || 'Computer Science';
        }
        if (document.getElementById('teacherPositionInput')) {
            document.getElementById('teacherPositionInput').value = u.position || u.teacher_specialization || 'Senior Lecturer';
        }
        if (document.getElementById('teacherSubjectsInput')) {
            document.getElementById('teacherSubjectsInput').value = u.teacher_specialization || '';
        }
        if (document.getElementById('adminDeptInput')) {
            document.getElementById('adminDeptInput').value = u.department_name || 'IT Directorate';
        }
        if (document.getElementById('adminPositionInput')) {
            document.getElementById('adminPositionInput').value = u.position || 'System Administrator';
        }

        document.getElementById('userPassword').value = '';
        document.getElementById('passwordLabel').textContent = 'New Password (leave blank to keep current password)';
        document.getElementById('saveUserBtn').innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save Changes';

        updateRoleFieldsVisibility(String(roleId));
        setWizardStep(1);
        if (userModal) userModal.show();
    };

    /**
     * 9. Form Submission: Create / Update
     */
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const id = document.getElementById('userId').value;
            const fullName = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const phone = document.getElementById('userPhone').value.trim();
            const avatarUrl = document.getElementById('userAvatarUrl').value.trim();
            const uniId = document.getElementById('userUniId').value.trim();
            const faculty = document.getElementById('userFacultySelect').value;
            const roleId = parseInt(document.getElementById('userRole').value);
            const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'TEACHER' : 'STUDENT';
            const status = document.getElementById('userStatus').value;
            const password = document.getElementById('userPassword').value.trim();

            let deptName = '';
            let position = '';
            let major = '';
            let academicYear = 'Year 1';
            let semester = 'Semester 1';

            if (roleId === 1) {
                deptName = document.getElementById('adminDeptInput').value.trim() || 'IT Directorate';
                position = document.getElementById('adminPositionInput').value.trim() || 'System Administrator';
            } else if (roleId === 2) {
                deptName = document.getElementById('userDepartmentSelect')?.value || 'Computer Science';
                position = document.getElementById('teacherPositionInput')?.value.trim() || 'Lecturer';
            } else {
                major = document.getElementById('userMajorSelect')?.value || 'Computer Science';
                academicYear = document.getElementById('userAcademicYearSelect')?.value || 'Year 1';
                semester = document.getElementById('userSemesterSelect')?.value || 'Semester 1';
            }

            const payload = {
                full_name: fullName,
                email: email,
                phone: phone,
                avatar_url: avatarUrl,
                university_id: uniId,
                faculty: faculty,
                role_id: roleId,
                role: roleName,
                status: status,
                department_name: deptName,
                position: position,
                major: major,
                academic_year: academicYear,
                semester: semester
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
                        title: id ? 'User Updated' : 'User Created',
                        text: result.message || 'User account successfully saved.',
                        timer: 1800,
                        showConfirmButton: false
                    });
                    loadUsers();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Save Failed',
                        text: result.message || 'Could not save user. Please check email or ID uniqueness.'
                    });
                }
            } catch (err) {
                // Local fallback update
                if (id) {
                    const idx = allUsers.findIndex(u => u.id === parseInt(id));
                    if (idx !== -1) allUsers[idx] = { ...allUsers[idx], ...payload };
                } else {
                    const newId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id || 0)) + 1 : 1;
                    allUsers.unshift({ id: newId, ...payload, created_at: new Date().toISOString() });
                }
                if (userModal) userModal.hide();
                updateStatistics();
                applyFilters();
                Swal.fire({ icon: 'success', title: 'Saved', text: 'Account updated successfully.' });
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Save Account`;
            }
        });
    }

    /**
     * 10. Change Role Dialog
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
                const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({ role_id: roleId, role: roleName })
                });

                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Role Updated',
                        text: `${u.full_name} is now a ${roleName}`,
                        timer: 1600,
                        showConfirmButton: false
                    });
                    loadUsers();
                }
            } catch (e) {
                u.role_id = roleId;
                u.role = roleName;
                updateStatistics();
                applyFilters();
                Swal.fire({ icon: 'success', title: 'Role Updated', text: `${u.full_name} is now a ${roleName}` });
            }
        }
    };

    /**
     * 11. Reset Password Dialog
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
                        <div class="text-xs text-muted mt-2">Please provide this password to the user. They will be prompted to update it on next sign-in.</div>
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
     * 12. Toggle User Status (Suspend / Activate)
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
        updateStatistics();
        applyFilters();
        Swal.fire({
            icon: isCurrentlyActive ? 'warning' : 'success',
            title: isCurrentlyActive ? 'Account Suspended' : 'Account Activated',
            text: `${u.full_name}'s account is now ${targetStatus}.`,
            timer: 1800,
            showConfirmButton: false
        });
    };

    /**
     * 13. Delete User with Confirmation
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
            confirmButtonText: 'Yes, Delete User',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });

                if (res.ok) {
                    if (viewUserModal) viewUserModal.hide();
                    Swal.fire({
                        icon: 'success',
                        title: 'User Deleted',
                        text: `User "${name}" has been permanently removed.`,
                        timer: 1800,
                        showConfirmButton: false
                    });
                    loadUsers();
                    return;
                }
            } catch (e) {}

            allUsers = allUsers.filter(user => user.id !== userId);
            if (viewUserModal) viewUserModal.hide();
            updateStatistics();
            applyFilters();
            Swal.fire({
                icon: 'success',
                title: 'User Deleted',
                text: `User "${name}" has been removed.`,
                timer: 1800,
                showConfirmButton: false
            });
        }
    };

    /**
     * 14. Export Users to CSV
     */
    window.exportUsersCSV = function () {
        if (allUsers.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No Data', text: 'No user accounts available to export.' });
            return;
        }

        const headers = ['ID', 'Full Name', 'University ID', 'Email', 'Phone', 'Role', 'Department/Major', 'Status', 'Joined Date'];
        const rows = allUsers.map(u => [
            u.id,
            `"${(u.full_name || '').replace(/"/g, '""')}"`,
            `"${u.university_id || ''}"`,
            `"${u.email || ''}"`,
            `"${u.phone || ''}"`,
            getNormalizedRole(u),
            `"${(u.department_name || u.teacher_department || u.major_title || u.faculty || '').replace(/"/g, '""')}"`,
            u.status || 'Active',
            formatDate(u.created_at)
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `AUB_Users_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: 'success',
            title: 'CSV Exported',
            text: `Successfully exported ${allUsers.length} user records.`,
            timer: 1800,
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
    await loadUsers();
});
