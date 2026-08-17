// ==========================================
// AUB Digital Academy - User Management Controller
// Specification: Full Name, Email Address, University ID, Role, Status, Password
// Integrated with SweetAlert2, Client Validation, & Local Mock Store
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

    let allUsers = [];
    let currentRoleFilter = 'all';
    let currentStatusFilter = 'all';
    let currentUserInView = null;

    const userModalEl = document.getElementById('userModal');
    const userModal = userModalEl ? new bootstrap.Modal(userModalEl) : null;

    const viewUserModalEl = document.getElementById('viewUserModal');
    const viewUserModal = viewUserModalEl ? new bootstrap.Modal(viewUserModalEl) : null;

    // 1. Password Visibility Toggle
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

    // 2. Load Users
    async function loadUsers() {
        let loaded = false;

        // Attempt API if available
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/users`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allUsers = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allUsers = window.AdminStore.getUsers();
        }

        updateCounters();
        applyFilters();
    }

    function updateCounters() {
        const countAll = allUsers.length;
        const countStudents = allUsers.filter(u => getNormalizedRole(u) === 'STUDENT').length;
        const countTeachers = allUsers.filter(u => getNormalizedRole(u) === 'TEACHER').length;
        const countAdmins = allUsers.filter(u => getNormalizedRole(u) === 'ADMIN').length;

        const elAll = document.getElementById('countAll');
        if (elAll) elAll.textContent = countAll;

        const elStudents = document.getElementById('countStudents');
        if (elStudents) elStudents.textContent = countStudents;

        const elTeachers = document.getElementById('countTeachers');
        if (elTeachers) elTeachers.textContent = countTeachers;

        const elAdmins = document.getElementById('countAdmins');
        if (elAdmins) elAdmins.textContent = countAdmins;
    }

    function getNormalizedRole(u) {
        if (u.role) return u.role.toUpperCase();
        if (u.role_id === 1) return 'ADMIN';
        if (u.role_id === 2) return 'TEACHER';
        return 'STUDENT';
    }

    function renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        const countIndicator = document.getElementById('tableRecordCount');
        if (!tbody) return;

        if (countIndicator) {
            countIndicator.textContent = `Showing ${users.length} of ${allUsers.length} users`;
        }

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-people fs-2 d-block mb-2 text-secondary opacity-50"></i>
                        <span class="fw-semibold">No user accounts found</span>
                        <div style="font-size: 11.5px;" class="mt-1">Try adjusting your search query, role pill, or status filter.</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(u => {
            const role = getNormalizedRole(u);
            const roleClass = role.toLowerCase();
            const statusClass = (u.status || 'Active').toLowerCase();
            const isActive = statusClass === 'active';
            
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="rounded-circle object-fit-cover shadow-sm" style="width: 34px; height: 34px; border: 1px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                            <div>
                                <div class="fw-bold text-dark" style="font-size: 13px;">${escapeHtml(u.full_name)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-muted fw-semibold" style="font-size: 12px;">${escapeHtml(u.university_id || 'N/A')}</td>
                    <td class="text-muted" style="font-size: 12px;">${escapeHtml(u.email)}</td>
                    <td>
                        <span class="admin-role-badge ${roleClass}">
                            ${role}
                        </span>
                    </td>
                    <td>
                        <span class="admin-status-badge ${statusClass} cursor-pointer" onclick="toggleUserStatus(${u.id})" title="Click to toggle status">
                            <i class="bi ${isActive ? 'bi-check-circle-fill' : 'bi-dash-circle'} me-1"></i>
                            ${escapeHtml(u.status || 'Active')}
                        </span>
                    </td>
                    <td class="text-muted" style="font-size: 11.5px;">${formatDate(u.created_at)}</td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="action-btn" title="View Profile" onclick="openViewUserModal(${u.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="action-btn" title="Edit User" onclick="openEditUserModal(${u.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn ${isActive ? 'text-warning' : 'text-success'}" title="${isActive ? 'Deactivate User' : 'Activate User'}" onclick="toggleUserStatus(${u.id})">
                                <i class="bi ${isActive ? 'bi-toggle-on text-primary' : 'bi-toggle-off'}"></i>
                            </button>
                            <button class="action-btn delete" title="Delete User" onclick="deleteUser(${u.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function applyFilters() {
        const search = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
        const status = (document.getElementById('userStatusFilter')?.value || 'all').toLowerCase();

        const filtered = allUsers.filter(u => {
            const matchSearch = !search || 
                (u.full_name && u.full_name.toLowerCase().includes(search)) ||
                (u.email && u.email.toLowerCase().includes(search)) ||
                (u.university_id && u.university_id.toLowerCase().includes(search));

            const uRole = getNormalizedRole(u).toLowerCase();
            const matchRole = currentRoleFilter === 'all' || uRole === currentRoleFilter.toLowerCase();

            const uStatus = (u.status || 'Active').toLowerCase();
            const matchStatus = status === 'all' || uStatus === status;

            return matchSearch && matchRole && matchStatus;
        });

        renderUsers(filtered);
    }

    // Role Filter Pill Selection
    const rolePillGroup = document.getElementById('rolePillGroup');
    if (rolePillGroup) {
        rolePillGroup.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-filter-pill');
            if (!btn) return;

            rolePillGroup.querySelectorAll('.btn-filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentRoleFilter = btn.getAttribute('data-role') || 'all';
            applyFilters();
        });
    }

    // Status Filter Selection
    const statusFilter = document.getElementById('userStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function () {
            currentStatusFilter = this.value;
            applyFilters();
        });
    }

    // Search Input Real-time Filtering
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Reset Filters Button
    window.resetFilters = function () {
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        currentRoleFilter = 'all';
        currentStatusFilter = 'all';

        if (rolePillGroup) {
            rolePillGroup.querySelectorAll('.btn-filter-pill').forEach(b => {
                if (b.getAttribute('data-role') === 'all') {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        }

        applyFilters();
        if (window.AdminStore) window.AdminStore.constructor.toast('Filters reset', 'info');
    };

    // Toggle User Status
    window.toggleUserStatus = async function (userId) {
        let updated = null;
        if (window.AdminStore) {
            updated = window.AdminStore.toggleUserStatus(userId);
            allUsers = window.AdminStore.getUsers();
        } else {
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                user.status = (user.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
                updated = user;
            }
        }

        if (updated) {
            updateCounters();
            applyFilters();
            const isNowActive = (updated.status || 'Active') === 'Active';
            if (window.AdminStore) {
                window.AdminStore.constructor.toast(
                    `${updated.full_name} is now ${isNowActive ? 'Active' : 'Inactive'}`,
                    isNowActive ? 'success' : 'info'
                );
            }
        }

        // Try API sync if running
        try {
            await fetch(`${API_BASE}/admin/users/${userId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status: updated ? updated.status : 'Active' })
            });
        } catch (e) {}
    };

    // View User Modal (Exact specification: Full Name, Email, University ID, Role, Status, Joined Date)
    window.openViewUserModal = function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        currentUserInView = u;
        const role = getNormalizedRole(u);
        const roleClass = role.toLowerCase();
        const statusClass = (u.status || 'Active').toLowerCase();

        const body = document.getElementById('viewUserModalBody');
        if (body) {
            body.innerHTML = `
                <div class="text-center pb-3 border-bottom mb-3">
                    <img src="${u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="rounded-circle object-fit-cover shadow-sm mb-2" style="width: 70px; height: 70px; border: 2px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                    <h5 class="fw-bold mb-1">${escapeHtml(u.full_name)}</h5>
                    <div class="d-flex justify-content-center align-items-center gap-2 mt-1">
                        <span class="admin-role-badge ${roleClass}">${role}</span>
                        <span class="admin-status-badge ${statusClass}">${escapeHtml(u.status || 'Active')}</span>
                    </div>
                </div>

                <div class="row g-2 text-sm" style="font-size: 13px;">
                    <div class="col-6 py-2 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">FULL NAME</span>
                        <span class="fw-semibold text-dark">${escapeHtml(u.full_name)}</span>
                    </div>
                    <div class="col-6 py-2 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">EMAIL ADDRESS</span>
                        <span class="fw-semibold text-dark">${escapeHtml(u.email)}</span>
                    </div>
                    <div class="col-6 py-2 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">UNIVERSITY ID</span>
                        <span class="fw-semibold text-dark">${escapeHtml(u.university_id || 'N/A')}</span>
                    </div>
                    <div class="col-6 py-2 border-bottom">
                        <span class="text-muted d-block" style="font-size: 11px;">JOINED DATE</span>
                        <span class="fw-semibold text-dark">${formatDate(u.created_at)}</span>
                    </div>
                </div>
            `;
        }

        if (viewUserModal) viewUserModal.show();
    };

    const editFromViewBtn = document.getElementById('editFromViewBtn');
    if (editFromViewBtn) {
        editFromViewBtn.addEventListener('click', function () {
            if (viewUserModal) viewUserModal.hide();
            if (currentUserInView) {
                openEditUserModal(currentUserInView.id);
            }
        });
    }

    // Modal Handlers: Add User
    window.openCreateUserModal = function () {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('userModalTitle').textContent = 'Add New User';
        document.getElementById('passwordLabel').textContent = 'Password *';
        document.getElementById('userPassword').required = true;
        document.getElementById('userPassword').placeholder = 'Enter secure password';
        document.getElementById('userPassword').setAttribute('type', 'password');
        document.getElementById('userRole').value = '3'; // Default STUDENT
        document.getElementById('userStatus').value = 'Active';
        const icon = document.querySelector('#toggleUserPasswordBtn i');
        if (icon) icon.className = 'bi bi-eye';
        if (userModal) userModal.show();
    };

    // Modal Handlers: Edit User (Password optional when editing)
    window.openEditUserModal = function (userId) {
        const u = allUsers.find(user => user.id === userId);
        if (!u) return;

        document.getElementById('userId').value = u.id;
        document.getElementById('userName').value = u.full_name;
        document.getElementById('userEmail').value = u.email;
        document.getElementById('userUniId').value = u.university_id || '';
        document.getElementById('userRole').value = u.role_id || (u.role === 'ADMIN' ? 1 : u.role === 'TEACHER' ? 2 : 3);
        document.getElementById('userStatus').value = u.status || 'Active';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';
        document.getElementById('userPassword').setAttribute('type', 'password');
        document.getElementById('passwordLabel').textContent = 'Password (leave blank to keep current)';
        document.getElementById('userModalTitle').textContent = 'Edit User Account';
        const icon = document.querySelector('#toggleUserPasswordBtn i');
        if (icon) icon.className = 'bi bi-eye';
        if (userModal) userModal.show();
    };

    // Form Submit: Create or Update User with Exact Field Specification & SweetAlert2
    const form = document.getElementById('userForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const id = document.getElementById('userId').value;
            const roleId = parseInt(document.getElementById('userRole').value);
            const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'TEACHER' : 'STUDENT';
            const fullName = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const uniId = document.getElementById('userUniId').value.trim();
            const status = document.getElementById('userStatus').value;
            const password = document.getElementById('userPassword').value;

            // Form Validation
            if (fullName.length < 2) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Validation Error', 'Full Name must be at least 2 characters long.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Invalid Email', 'Please enter a valid email address.');
                return;
            }

            if (!uniId) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Missing University ID', 'University ID is required.');
                return;
            }

            // Check duplicate University ID or Email if new user
            if (!id) {
                const dupUni = allUsers.find(u => (u.university_id || '').toLowerCase() === uniId.toLowerCase());
                if (dupUni) {
                    if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Duplicate ID', `University ID "${uniId}" is already assigned to ${dupUni.full_name}.`);
                    return;
                }
                const dupEmail = allUsers.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
                if (dupEmail) {
                    if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Duplicate Email', `Email "${email}" is already registered.`);
                    return;
                }
            }

            // Password validation
            if (!id && password.length < 6) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Password Required', 'Password must be at least 6 characters.');
                return;
            }
            if (id && password && password.length < 6) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Password Too Short', 'New password must be at least 6 characters.');
                return;
            }

            const payload = {
                full_name: fullName,
                email: email,
                university_id: uniId,
                role_id: roleId,
                role: roleName,
                status: status
            };
            if (password) payload.password = password;

            if (id) {
                // Update User
                if (window.AdminStore) {
                    window.AdminStore.updateUser(id, payload);
                    allUsers = window.AdminStore.getUsers();
                } else {
                    const existingIdx = allUsers.findIndex(u => u.id === parseInt(id));
                    if (existingIdx !== -1) {
                        allUsers[existingIdx] = { ...allUsers[existingIdx], ...payload };
                    }
                }

                if (userModal) userModal.hide();
                updateCounters();
                applyFilters();
                if (window.AdminStore) {
                    window.AdminStore.constructor.notifySuccess('User Updated', 'User updated successfully');
                }
            } else {
                // Create New User
                if (window.AdminStore) {
                    window.AdminStore.createUser(payload);
                    allUsers = window.AdminStore.getUsers();
                } else {
                    const newId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id || 0)) + 1 : 1;
                    const newUser = {
                        id: newId,
                        ...payload,
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
                        created_at: new Date().toISOString()
                    };
                    allUsers.unshift(newUser);
                }

                if (userModal) userModal.hide();
                updateCounters();
                applyFilters();
                if (window.AdminStore) {
                    window.AdminStore.constructor.notifySuccess('User Created', 'User created successfully');
                }
            }

            // Try backend save if running
            try {
                const url = id ? `${API_BASE}/admin/users/${id}` : `${API_BASE}/admin/users`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, {
                    method: method,
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });
            } catch (err) {}
        });
    }

    // Delete User with SweetAlert2 Confirmation Dialog
    window.deleteUser = async function (id) {
        const user = allUsers.find(u => u.id === id);
        const name = user ? user.full_name : 'this user';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete User Account?',
                `Are you sure you want to delete ${name}? This action cannot be undone.`,
                'Yes, Delete User',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to delete ${name}?`);
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteUser(id);
            allUsers = window.AdminStore.getUsers();
        } else {
            allUsers = allUsers.filter(u => u.id !== id);
        }

        updateCounters();
        applyFilters();

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`User "${name}" deleted successfully`, 'success');
        }

        try {
            await fetch(`${API_BASE}/admin/users/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
        } catch (err) {}
    };

    // Export Users to CSV
    window.exportUsersCSV = function () {
        if (allUsers.length === 0) {
            if (window.AdminStore) window.AdminStore.constructor.notifyWarning('No Data', 'No user records available to export.');
            return;
        }

        const headers = ['ID', 'Full Name', 'University ID', 'Email', 'Role', 'Status', 'Joined Date'];
        const rows = allUsers.map(u => [
            u.id,
            `"${(u.full_name || '').replace(/"/g, '""')}"`,
            `"${u.university_id || ''}"`,
            `"${u.email || ''}"`,
            getNormalizedRole(u),
            u.status || 'Active',
            formatDate(u.created_at)
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `AUB_Users_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`Exported ${allUsers.length} user accounts to CSV`, 'success');
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

    // Initialize View
    loadUsers();
});
