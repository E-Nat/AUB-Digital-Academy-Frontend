// ==========================================
// AUB Digital Academy - Admin Dashboard Controller
// Dynamic Metrics, Real-time Charts, KPI Cards, Notifications & Global Search
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
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // 1. Session Check (Ensure demo admin session if none exists)
    if (window.AdminStore) {
        window.AdminStore.ensureDefaultAdminSession();
    }

    // 2. Load Dashboard KPI Metrics
    async function loadMetrics() {
        let metricsData = null;

        // Try API if available
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const response = await fetch(`${API_BASE}/admin/dashboard/metrics`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    metricsData = result.data;
                }
            }
        } catch (err) {
            // Backend offline - seamlessly fallback to local AdminStore
        }

        if (!metricsData && window.AdminStore) {
            metricsData = window.AdminStore.getDashboardMetrics();
        }

        if (metricsData) {
            const { totalUsers, totalCourses, totalStudents, totalTeachers, totalChapters, totalEnrollments } = metricsData;
            
            animateCounter('kpiTotalUsers', totalUsers || 0);
            animateCounter('kpiTotalCourses', totalCourses || 0);
            animateCounter('kpiTotalStudents', totalStudents || 0);
            animateCounter('kpiTotalTeachers', totalTeachers || 0);
            animateCounter('kpiTotalChapters', totalChapters || 0);
            animateCounter('kpiTotalEnrollments', totalEnrollments || 0);
        }
    }

    function animateCounter(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
        if (current === targetValue) {
            el.textContent = targetValue.toLocaleString();
            return;
        }

        const duration = 600;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = (targetValue - current) / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const val = Math.round(current + (increment * step));
            el.textContent = val.toLocaleString();
            if (step >= steps) {
                clearInterval(timer);
                el.textContent = targetValue.toLocaleString();
            }
        }, stepTime);
    }

    // 3. Load Dynamic Statistics (Donut Chart & Students by Major)
    async function loadStats() {
        const enrollmentSelect = document.getElementById('enrollmentTimeframeSelect');
        const majorSelect = document.getElementById('majorTimeframeSelect');

        const enrollmentTf = enrollmentSelect ? enrollmentSelect.value : 'this_month';
        const majorTf = majorSelect ? majorSelect.value : 'this_month';

        let statsData = null;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/dashboard/stats?enrollmentTimeframe=${encodeURIComponent(enrollmentTf)}&majorTimeframe=${encodeURIComponent(majorTf)}`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    statsData = result.data;
                }
            }
        } catch (err) {}

        if (!statsData && window.AdminStore) {
            statsData = window.AdminStore.getDashboardStats(enrollmentTf, majorTf);
        }

        if (statsData) {
            const { enrollmentStatistics, studentsByMajor } = statsData;

            // A. Update Donut Chart Total and SVG arcs
            const donutTotal = document.getElementById('donutTotalNumber');
            if (donutTotal && enrollmentStatistics) {
                donutTotal.textContent = (enrollmentStatistics.total || 0).toLocaleString();
            }

            const donutSvg = document.getElementById('enrollmentDonutSvg');
            if (donutSvg && enrollmentStatistics) {
                const total = enrollmentStatistics.total || 0;
                const categories = enrollmentStatistics.categories || [];
                const activeCats = categories.filter(c => c.count > 0);

                if (total === 0 || activeCats.length === 0) {
                    donutSvg.innerHTML = `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" stroke-width="3.2"></circle>`;
                } else {
                    let svgContent = `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" stroke-width="3.2"></circle>`;
                    let currentOffset = 0;
                    activeCats.forEach(c => {
                        const pct = isNaN(c.percentage) ? 0 : c.percentage;
                        const strokeDash = `${pct} ${100 - pct}`;
                        svgContent += `
                            <circle cx="18" cy="18" r="15.915" fill="transparent" 
                                    stroke="${c.color || '#2563EB'}" stroke-width="3.2" 
                                    stroke-dasharray="${strokeDash}" stroke-dashoffset="${-currentOffset}"
                                    style="transition: stroke-dasharray 0.5s ease;">
                            </circle>
                        `;
                        currentOffset += pct;
                    });
                    donutSvg.innerHTML = svgContent;
                }
            }

            // B. Render Enrollment Statistics Category List
            const catContainer = document.getElementById('enrollmentCategoriesList');
            if (catContainer && enrollmentStatistics) {
                const total = enrollmentStatistics.total || 0;
                const categories = enrollmentStatistics.categories || [];
                if (total === 0 || categories.length === 0) {
                    catContainer.innerHTML = `<div class="text-muted text-center py-3 text-xs">No enrollment data for this period</div>`;
                } else {
                    catContainer.innerHTML = categories.map(c => {
                        const count = c.count || 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return `
                            <div class="d-flex align-items-center justify-content-between py-1 border-bottom border-light">
                                <div class="d-flex align-items-center gap-2">
                                    <span class="rounded-circle flex-shrink-0" style="width: 8px; height: 8px; background: ${c.color || '#2563EB'};"></span>
                                    <span class="text-secondary fw-medium" style="font-size: 12.5px;">${escapeHtml(c.name)}</span>
                                </div>
                                <span class="fw-bold text-dark" style="font-size: 12.5px;">${count} <span class="text-muted fw-normal" style="font-size: 11px;">(${pct}%)</span></span>
                            </div>
                        `;
                    }).join('');
                }
            }

            // C. Render Students by Major
            const majorContainer = document.getElementById('studentsByMajorContainer');
            if (majorContainer && studentsByMajor) {
                const totalStudents = studentsByMajor.total || 0;
                const majors = studentsByMajor.majors || [];
                if (totalStudents === 0 || majors.length === 0) {
                    majorContainer.innerHTML = `<div class="text-muted text-center py-3 text-xs">No students registered in this period</div>`;
                } else {
                    majorContainer.innerHTML = majors.map(m => {
                        const count = m.count || 0;
                        const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                        return `
                            <div class="py-1 mb-1">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-medium text-secondary" style="font-size: 12.5px;">${escapeHtml(m.major)}</span>
                                    <span class="fw-bold text-dark" style="font-size: 12.5px;">${count} <span class="text-muted fw-normal" style="font-size: 11px;">(${pct}%)</span></span>
                                </div>
                                <div class="progress" style="height: 6px; background: #F1F5F9; border-radius: 6px; overflow: hidden;">
                                    <div class="progress-bar" role="progressbar" style="width: ${pct}%; background: ${m.color || '#2563EB'}; border-radius: 6px; transition: width 0.5s ease;"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        }
    }

    // 4. Fetch Recent Enrollments for Dashboard Table
    async function loadRecentEnrollments() {
        const tbody = document.getElementById('recentEnrollmentsTableBody');
        if (!tbody) return;

        let enrollments = null;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/dashboard/recent-enrollments`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    enrollments = result.data;
                }
            }
        } catch (e) {}

        if (!enrollments && window.AdminStore) {
            enrollments = window.AdminStore.getRecentEnrollments(6);
        }

        if (enrollments) {
            if (enrollments.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted text-xs">No recent enrollments recorded.</td></tr>`;
                return;
            }

            tbody.innerHTML = enrollments.slice(0, 6).map(e => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${e.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="rounded-circle object-fit-cover shadow-sm" style="width: 32px; height: 32px; border: 1px solid #E2E8F0;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                            <div>
                                <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(e.student_name || 'Student')}</div>
                                <div class="text-muted" style="font-size: 11px;">${escapeHtml(e.student_uni_id || e.student_email || '')}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="fw-semibold text-primary" style="font-size: 12.5px;">${escapeHtml(e.course_title || 'Academic Course')}</span></td>
                    <td class="text-muted" style="font-size: 11.5px;">${formatDate(e.enrollment_date)}</td>
                    <td style="width: 140px;">
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress flex-grow-1" style="height: 6px; background: #F1F5F9; border-radius: 4px;">
                                <div class="progress-bar ${e.progress_percentage === 100 ? 'bg-success' : 'bg-primary'}" style="width: ${e.progress_percentage || 0}%; border-radius: 4px;"></div>
                            </div>
                            <span class="fw-bold text-muted" style="font-size: 11px;">${e.progress_percentage || 0}%</span>
                        </div>
                    </td>
                    <td>
                        <span class="admin-status-badge ${(e.status || 'active').toLowerCase()}">
                            <i class="bi ${e.status === 'Completed' ? 'bi-check2-all' : e.status === 'Pending' ? 'bi-clock' : 'bi-check-circle-fill'} me-1"></i>
                            ${escapeHtml(e.status || 'Active')}
                        </span>
                    </td>
                    <td>
                        <a href="enrollment-management.html" class="action-btn" title="View in Enrollment Management">
                            <i class="bi bi-arrow-right-circle"></i>
                        </a>
                    </td>
                </tr>
            `).join('');
        }
    }

    // 5. Timeframe Filters Binding
    const enrollmentSelect = document.getElementById('enrollmentTimeframeSelect');
    if (enrollmentSelect) {
        enrollmentSelect.addEventListener('change', () => loadStats());
    }
    const majorSelect = document.getElementById('majorTimeframeSelect');
    if (majorSelect) {
        majorSelect.addEventListener('change', () => loadStats());
    }

    // 6. Notifications System
    function loadNotifications() {
        let notifs = [];
        if (window.AdminStore) {
            notifs = window.AdminStore.getNotifications();
        }

        const unreadCount = notifs.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        const list = document.getElementById('notificationsList');
        if (list) {
            if (notifs.length === 0) {
                list.innerHTML = `<div class="p-3 text-center text-muted text-xs">No notifications</div>`;
                return;
            }

            list.innerHTML = notifs.map(n => `
                <div class="notification-item ${n.read ? 'opacity-75' : ''}" onclick="window.location.href='${n.link_url || 'dashboard.html'}'">
                    <div class="rounded-circle p-2 bg-light d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; flex-shrink: 0;">
                        <i class="bi ${n.type === 'enrollment' ? 'bi-person-check-fill text-success' : n.type === 'course' ? 'bi-journal-code text-primary' : 'bi-info-circle text-warning'}" style="font-size: 12px;"></i>
                    </div>
                    <div class="text-start flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-dark" style="font-size: 12px;">${escapeHtml(n.title)}</span>
                            <span class="text-muted" style="font-size: 10px;">${escapeHtml(n.timestamp)}</span>
                        </div>
                        <div class="text-muted lh-sm" style="font-size: 11px;">${escapeHtml(n.message)}</div>
                    </div>
                </div>
            `).join('');
        }
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
        markAllReadBtn.addEventListener('click', () => {
            if (window.AdminStore) {
                window.AdminStore.markAllNotificationsRead();
                loadNotifications();
                if (window.AdminStore.constructor.toast) {
                    window.AdminStore.constructor.toast('All notifications marked as read', 'success');
                }
            }
        });
    }

    // 7. Functional Global Search in Topbar
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

            searchTimeout = setTimeout(() => {
                if (window.AdminStore) {
                    const { programs, courses, users } = window.AdminStore.searchGlobal(query);
                    const totalHits = programs.length + courses.length + users.length;

                    if (totalHits === 0) {
                        searchContainer.innerHTML = `<div class="p-3 text-center text-muted text-xs">No records found for "${escapeHtml(query)}"</div>`;
                    } else {
                        let html = '';
                        if (programs.length > 0) {
                            html += `<div class="px-3 pt-2 pb-1 text-xs fw-bold text-muted text-uppercase" style="font-size: 10px; background: #F8FAFC;">Programs</div>`;
                            programs.forEach(p => {
                                html += `<a href="${p.link}" class="search-result-item"><span><i class="bi bi-mortarboard me-2 text-primary"></i>${escapeHtml(p.title)}</span><span class="badge bg-light text-dark border" style="font-size: 10px;">${escapeHtml(p.degree_type)}</span></a>`;
                            });
                        }
                        if (courses.length > 0) {
                            html += `<div class="px-3 pt-2 pb-1 text-xs fw-bold text-muted text-uppercase" style="font-size: 10px; background: #F8FAFC;">Courses</div>`;
                            courses.forEach(c => {
                                html += `<a href="${c.link}" class="search-result-item"><span><i class="bi bi-journal-text me-2 text-success"></i>${escapeHtml(c.title)}</span><span class="badge bg-light text-warning border" style="font-size: 10px;"><i class="bi bi-star-fill me-1"></i>${c.rating}</span></a>`;
                            });
                        }
                        if (users.length > 0) {
                            html += `<div class="px-3 pt-2 pb-1 text-xs fw-bold text-muted text-uppercase" style="font-size: 10px; background: #F8FAFC;">Users</div>`;
                            users.forEach(u => {
                                html += `<a href="${u.link}" class="search-result-item"><span><i class="bi bi-person me-2 text-info"></i>${escapeHtml(u.title)}</span><span class="badge bg-light text-secondary border" style="font-size: 10px;">${escapeHtml(u.role)}</span></a>`;
                            });
                        }
                        searchContainer.innerHTML = html;
                    }
                    searchContainer.classList.add('active');
                }
            }, 200);
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

    // Execute Initial loads
    loadMetrics();
    loadStats();
    loadRecentEnrollments();
    loadNotifications();
});
