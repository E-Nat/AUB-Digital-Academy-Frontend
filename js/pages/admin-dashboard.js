// Admin Dashboard dynamic script (Vanilla JS)
document.addEventListener('DOMContentLoaded', async function () {
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    const token = localStorage.getItem('aub_auth_token');
    const userStr = localStorage.getItem('aub_user');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // 1. Display Current Admin User Info
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const nameElements = [document.getElementById('sidebarAdminName'), document.getElementById('topbarAdminName')];
            nameElements.forEach(el => {
                if (el && user.full_name) el.textContent = user.full_name;
            });
            const avatarElements = [document.getElementById('sidebarAvatar'), document.getElementById('topbarAvatar')];
            avatarElements.forEach(el => {
                if (el && user.avatar_url) el.src = user.avatar_url;
            });
        } catch (e) {
            console.error('Error parsing stored user data', e);
        }
    }

    // 2. Set Dynamic Date Badge
    const dateBadge = document.getElementById('currentDateBadge');
    if (dateBadge) {
        const now = new Date();
        const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        dateBadge.textContent = `${formatted} | ${weekday}`;
    }

    // 3. Handle Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('aub_auth_token');
            localStorage.removeItem('aub_user');
            window.location.href = '../authentication/login.html';
        });
    }

    // 4. Fetch Real Dynamic Dashboard Metrics from SQLite Database
    async function loadMetrics() {
        try {
            const response = await fetch(`${API_BASE}/admin/dashboard/metrics`, { headers });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const { totalUsers, totalCourses, totalStudents, totalTeachers, totalChapters, totalEnrollments } = result.data;
                    
                    const elUsers = document.getElementById('kpiTotalUsers');
                    if (elUsers && totalUsers !== undefined) elUsers.textContent = totalUsers.toLocaleString();

                    const elCourses = document.getElementById('kpiTotalCourses');
                    if (elCourses && totalCourses !== undefined) elCourses.textContent = totalCourses.toLocaleString();

                    const elStudents = document.getElementById('kpiTotalStudents');
                    if (elStudents && totalStudents !== undefined) elStudents.textContent = totalStudents.toLocaleString();

                    const elTeachers = document.getElementById('kpiTotalTeachers');
                    if (elTeachers && totalTeachers !== undefined) elTeachers.textContent = totalTeachers.toLocaleString();

                    const elChapters = document.getElementById('kpiTotalChapters');
                    if (elChapters && totalChapters !== undefined) elChapters.textContent = totalChapters.toLocaleString();

                    const elEnrollments = document.getElementById('kpiTotalEnrollments');
                    if (elEnrollments && totalEnrollments !== undefined) {
                        elEnrollments.textContent = totalEnrollments.toLocaleString();
                        const donutTotal = document.getElementById('donutTotalNumber');
                        if (donutTotal) donutTotal.textContent = totalEnrollments.toLocaleString();
                    }
                }
            }
        } catch (err) {
            console.log('Metrics API note:', err.message);
        }
    }

    // 5. Fetch Real Dynamic Statistics with Timeframe
    async function loadStats(timeframe = 'this_month') {
        try {
            const res = await fetch(`${API_BASE}/admin/dashboard/stats?timeframe=${timeframe}`, { headers });
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    const { enrollmentStatistics, studentsByMajor } = result.data;

                    // Render Enrollment Statistics Categories
                    const catContainer = document.getElementById('enrollmentCategoriesList');
                    if (catContainer && enrollmentStatistics && enrollmentStatistics.categories) {
                        catContainer.innerHTML = enrollmentStatistics.categories.map(c => `
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="rounded-circle" style="width: 10px; height: 10px; background: ${c.color || '#2563eb'};"></span>
                                    <span class="text-secondary fw-medium">${escapeHtml(c.name)}</span>
                                </div>
                                <span class="fw-bold">${c.count} <span class="text-muted fw-normal text-xs">(${c.percentage}%)</span></span>
                            </div>
                        `).join('');
                    }

                    // Render Students by Major (Actual Students Count)
                    const majorContainer = document.getElementById('studentsByMajorContainer');
                    if (majorContainer && studentsByMajor) {
                        majorContainer.innerHTML = studentsByMajor.map(m => `
                            <div>
                                <div class="d-flex justify-content-between text-sm mb-1">
                                    <span class="fw-medium text-secondary">${escapeHtml(m.major)}</span>
                                    <span class="fw-bold">${m.count}</span>
                                </div>
                                <div class="progress" style="height: 10px; background: #F1F5F9; border-radius: 10px;">
                                    <div class="progress-bar" style="width: ${m.percentage}%; background: ${m.color || '#2563eb'}; border-radius: 10px;"></div>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            }
        } catch (err) {
            console.error('Stats API error:', err);
        }
    }

    // 6. Bind Timeframe Select Dropdowns
    const enrollmentSelect = document.getElementById('enrollmentTimeframeSelect');
    if (enrollmentSelect) {
        enrollmentSelect.addEventListener('change', (e) => loadStats(e.target.value));
    }
    const majorSelect = document.getElementById('majorTimeframeSelect');
    if (majorSelect) {
        majorSelect.addEventListener('change', (e) => loadStats(e.target.value));
    }

    // 7. Fetch Recent Enrollments from Database
    async function loadRecentEnrollments() {
        try {
            const res = await fetch(`${API_BASE}/admin/dashboard/recent-enrollments`, { headers });
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    const tbody = document.getElementById('recentEnrollmentsTableBody');
                    if (tbody) {
                        tbody.innerHTML = result.data.map(item => `
                            <tr>
                                <td class="text-muted fw-semibold">${escapeHtml(item.student_id || '000100' + item.id)}</td>
                                <td class="fw-bold text-dark">${escapeHtml(item.student_name || 'Student')}</td>
                                <td>${escapeHtml(item.course_title || 'Academic Course')}</td>
                                <td class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${formatDate(item.enrollment_date)}</td>
                                <td><span class="admin-status-badge ${item.status ? item.status.toLowerCase() : 'active'}">${escapeHtml(item.status || 'Active')}</span></td>
                            </tr>
                        `).join('');
                    }
                }
            }
        } catch (err) {
            console.log('Enrollments API note:', err.message);
        }
    }

    // 8. Notifications System
    async function loadNotifications() {
        try {
            const res = await fetch(`${API_BASE}/admin/notifications`, { headers });
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    const badge = document.getElementById('notificationBadge');
                    if (badge) {
                        badge.textContent = result.data.unreadCount;
                        badge.style.display = result.data.unreadCount > 0 ? 'flex' : 'none';
                    }

                    const list = document.getElementById('notificationsList');
                    if (list && result.data.notifications) {
                        list.innerHTML = result.data.notifications.map(n => `
                            <div class="notification-item" onclick="window.location.href='${n.link_url || 'dashboard.html'}'">
                                <div class="rounded-circle p-2 bg-light d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                    <i class="bi ${n.type === 'enrollment' ? 'bi-person-check-fill text-success' : n.type === 'course' ? 'bi-journal-code text-primary' : 'bi-info-circle text-warning'} text-xs"></i>
                                </div>
                                <div class="text-start">
                                    <div class="fw-bold text-xs text-dark">${escapeHtml(n.title)}</div>
                                    <div class="text-muted text-xs lh-sm">${escapeHtml(n.message)}</div>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            }
        } catch (e) {}
    }

    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationsMenu');
    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifMenu.classList.toggle('active');
        });
        document.addEventListener('click', () => notifMenu.classList.remove('active'));
    }

    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            await fetch(`${API_BASE}/admin/notifications/all/read`, { method: 'PATCH', headers });
            loadNotifications();
        });
    }

    // 9. Functional Global Search
    const searchInput = document.getElementById('globalSearchInput');
    const searchContainer = document.getElementById('searchResultsContainer');
    let searchTimeout;

    if (searchInput && searchContainer) {
        searchInput.addEventListener('input', function (e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length < 2) {
                searchContainer.classList.remove('active');
                searchContainer.innerHTML = '';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_BASE}/admin/search?q=${encodeURIComponent(query)}`, { headers });
                    if (res.ok) {
                        const result = await res.json();
                        if (result.success && result.data) {
                            const { programs, courses, users, categories } = result.data;
                            const totalHits = programs.length + courses.length + users.length + categories.length;

                            if (totalHits === 0) {
                                searchContainer.innerHTML = `<div class="p-3 text-center text-muted text-sm">No records found for "${escapeHtml(query)}"</div>`;
                            } else {
                                let html = '';
                                if (programs.length > 0) {
                                    html += `<div class="px-3 pt-2 text-xs fw-bold text-muted text-uppercase">Programs</div>`;
                                    programs.forEach(p => {
                                        html += `<a href="${p.link}" class="search-result-item"><span><i class="bi bi-mortarboard me-2 text-primary"></i>${escapeHtml(p.title)}</span><span class="badge bg-light text-dark">${escapeHtml(p.degree_type)}</span></a>`;
                                    });
                                }
                                if (courses.length > 0) {
                                    html += `<div class="px-3 pt-2 text-xs fw-bold text-muted text-uppercase">Courses</div>`;
                                    courses.forEach(c => {
                                        html += `<a href="${c.link}" class="search-result-item"><span><i class="bi bi-journal-text me-2 text-success"></i>${escapeHtml(c.title)}</span><span class="badge bg-light text-warning"><i class="bi bi-star-fill me-1"></i>${c.rating}</span></a>`;
                                    });
                                }
                                if (users.length > 0) {
                                    html += `<div class="px-3 pt-2 text-xs fw-bold text-muted text-uppercase">Users</div>`;
                                    users.forEach(u => {
                                        html += `<a href="${u.link}" class="search-result-item"><span><i class="bi bi-person me-2 text-info"></i>${escapeHtml(u.title)}</span><span class="badge bg-light text-secondary">${escapeHtml(u.role)}</span></a>`;
                                    });
                                }
                                searchContainer.innerHTML = html;
                            }
                            searchContainer.classList.add('active');
                        }
                    }
                } catch (e) {
                    console.error('Search error:', e);
                }
            }, 250);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchContainer.contains(e.target)) {
                searchContainer.classList.remove('active');
            }
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'May 24, 2026';
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

    // Initial loads
    loadMetrics();
    loadStats('this_month');
    loadRecentEnrollments();
    loadNotifications();
});
