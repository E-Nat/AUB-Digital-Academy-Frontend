/**
 * AUB Digital Academy — Admin Dashboard JS
 * Powers the redesigned modern Executive Dashboard.
 * Synchronizes with AdminStore (offline-first) + REST API endpoints.
 */

document.addEventListener('DOMContentLoaded', async function () {

    // ── API BASE ────────────────────────────────────────────────
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.protocol === 'file:';
    const API_BASE = (isLocal && window.location.port !== '5000')
        ? 'http://localhost:5000/api'
        : '/api';

    function getAuthToken() {
        let token = localStorage.getItem('aub_auth_token') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('aub_auth_token') ||
                    sessionStorage.getItem('token') || '';
        if (!token && window.AdminStore && typeof window.AdminStore.ensureDefaultAdminSession === 'function') {
            try {
                window.AdminStore.ensureDefaultAdminSession();
                token = localStorage.getItem('aub_auth_token') || sessionStorage.getItem('aub_auth_token') || '';
            } catch (e) {}
        }
        return token;
    }

    function getHeaders() {
        const token = getAuthToken();
        const h = { 'Content-Type': 'application/json' };
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }

    // ── AUTH CHECK ──────────────────────────────────────────────
    const token = getAuthToken();
    if (!token && !window.AdminStore) {
        window.location.href = '../authentication/login.html';
        return;
    }

    // ── ADMIN NAME / AVATAR ─────────────────────────────────────
    const userStr = localStorage.getItem('aub_user') || sessionStorage.getItem('aub_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const el = document.getElementById('topbarAdminName');
            if (el) el.textContent = user.full_name || 'Dr. Johnathan Vance';
            const av = document.getElementById('topbarAvatar');
            if (av && user.avatar_url) av.src = user.avatar_url;
        } catch (e) { /* ignore */ }
    } else {
        const el = document.getElementById('topbarAdminName');
        if (el) el.textContent = 'Dr. Johnathan Vance';
    }

    // ── DATE & SEMESTER BADGES ──────────────────────────────────
    function initDateBadge() {
        const el = document.getElementById('currentDateBadge');
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if (el) el.textContent = dateStr;

        const semesterEl = document.getElementById('semesterLabel');
        if (semesterEl) {
            const semester = now.getMonth() < 6 ? 'Spring' : 'Fall';
            semesterEl.textContent = `${semester} Semester ${now.getFullYear()}`;
        }
    }
    initDateBadge();

    // ── TIMEFRAME SELECTOR ──────────────────────────────────────
    document.getElementById('timeframeSelect')?.addEventListener('change', e => {
        loadMetrics(e.target.value);
        loadStats(e.target.value);
    });

    document.getElementById('majorTimeframeSelect')?.addEventListener('change', e => {
        loadStats(e.target.value);
    });

    // ── HELPERS ─────────────────────────────────────────────────
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return dateStr; }
    }

    function escapeHtml(text) {
        if (!text && text !== 0) return '';
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function getInitials(name) {
        if (!name) return 'ST';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    function setEl(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ── 1. KPI METRICS (5 Key Indicators) ───────────────────────
    function renderMetricsData(d) {
        if (!d) return;

        const totalStudents   = d.totalStudents ?? 5;
        const activeCourses   = d.activeCourses ?? 5;
        const totalEnrollments = d.totalEnrollments ?? 5;
        const pendingPayments = d.pendingPayments ?? 1;
        const upcomingExams   = d.upcomingExams ?? 3;

        setEl('kpiTotalStudents', totalStudents);
        setEl('kpiActiveCourses', activeCourses);
        setEl('kpiEnrollments', totalEnrollments);
        setEl('kpiPendingPayments', pendingPayments);
        setEl('kpiUpcomingExams', upcomingExams);
    }

    async function loadMetrics(tf = 'all_time') {
        // Step 1: Render immediately from AdminStore
        if (window.AdminStore && typeof window.AdminStore.getDashboardMetrics === 'function') {
            try {
                const storeData = window.AdminStore.getDashboardMetrics();
                renderMetricsData(storeData);
            } catch (err) {
                console.warn('Error reading metrics from AdminStore:', err);
            }
        }

        // Step 2: Non-blocking API sync
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/dashboard/metrics?timeframe=${tf}`, {
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.status === 401 || res.status === 403) {
                localStorage.clear();
                window.location.href = '../authentication/login.html';
                return;
            }
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    renderMetricsData(result.data);
                }
            }
        } catch (err) {
            // AdminStore fallback is already rendered
        }
    }

    // ── 2. ANALYTICS (Donut & Bar Charts) ───────────────────────
    const MAJOR_COLORS = {
        'Computer Science': '#2563EB',
        'Software Engineering': '#0891B2',
        'Data Science': '#D97706',
        'Cybersecurity': '#16A34A',
        'Artificial Intelligence': '#7C3AED',
        'Business Information Technology': '#4F46E5'
    };
    const COLOR_PALETTE = ['#2563EB', '#0891B2', '#D97706', '#16A34A', '#7C3AED', '#4F46E5'];

    function renderDonut(stats, studentsByMajor) {
        const svg = document.getElementById('enrollmentDonutSvg');
        const totalEl = document.getElementById('donutTotalNumber');
        if (!svg) return;

        let total = studentsByMajor?.total || 5;
        let majors = studentsByMajor?.majors || [];

        if (!majors.length) {
            majors = [
                { major: 'Computer Science', count: 2, percentage: 40, color: '#2563EB' },
                { major: 'Software Engineering', count: 1, percentage: 20, color: '#0891B2' },
                { major: 'Data Science', count: 1, percentage: 20, color: '#D97706' },
                { major: 'Cybersecurity', count: 1, percentage: 20, color: '#16A34A' }
            ];
            total = 5;
        }

        if (totalEl) totalEl.textContent = total;

        let svgHTML = `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" stroke-width="3.5"></circle>`;
        let offset = 0;
        majors.forEach((m, i) => {
            const count = m.count || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const color = m.color || MAJOR_COLORS[m.major] || COLOR_PALETTE[i % COLOR_PALETTE.length];
            if (pct > 0) {
                svgHTML += `<circle cx="18" cy="18" r="15.915" fill="transparent"
                    stroke="${color}"
                    stroke-width="3.5"
                    stroke-dasharray="${pct} ${100 - pct}"
                    stroke-dashoffset="${-offset}"></circle>`;
                offset += pct;
            }
        });
        svg.innerHTML = svgHTML;
    }

    function renderMajorList(data) {
        const container = document.getElementById('enrollmentCategoriesList');
        if (!container) return;

        let majors = data?.majors || [];
        if (!majors.length) {
            majors = [
                { major: 'Computer Science', count: 2, percentage: 40, color: '#2563EB' },
                { major: 'Software Engineering', count: 1, percentage: 20, color: '#0891B2' },
                { major: 'Data Science', count: 1, percentage: 20, color: '#D97706' },
                { major: 'Cybersecurity', count: 1, percentage: 20, color: '#16A34A' }
            ];
        }

        container.innerHTML = majors.map((m, i) => {
            const color = m.color || MAJOR_COLORS[m.major] || COLOR_PALETTE[i % COLOR_PALETTE.length];
            return `
                <div class="dash-major-item">
                    <span class="dash-major-dot" style="background:${color}"></span>
                    <span class="dash-major-name" title="${escapeHtml(m.major)}">${escapeHtml(m.major)}</span>
                    <span class="dash-major-count">${m.count}</span>
                    <span class="dash-major-pct">${m.percentage}%</span>
                </div>
            `;
        }).join('');
    }

    function renderBarChart(enrollmentStats, trendsData) {
        const chart  = document.getElementById('enrollmentBarChart');
        const labels = document.getElementById('enrollmentBarLabels');
        if (!chart || !labels) return;

        const months = trendsData?.months || ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
        const enrollData = trendsData?.enrollments || [3, 5, 7, 8, 10, 12];
        const examData = trendsData?.examResults || [2, 3, 5, 6, 8, 10];
        const maxVal = Math.max(...enrollData, ...examData, 1);

        chart.innerHTML = months.map((m, i) => {
            const eVal = enrollData[i] || 0;
            const rVal = examData[i] || 0;
            const eH = Math.round((eVal / maxVal) * 100);
            const rH = Math.round((rVal / maxVal) * 100);
            return `
                <div class="dash-bar-group">
                    <div class="dash-bar enroll"  style="height:${Math.max(eH, 12)}%" title="${m} Enrollments: ${eVal}"></div>
                    <div class="dash-bar results" style="height:${Math.max(rH, 12)}%" title="${m} Exam Results: ${rVal}"></div>
                </div>`;
        }).join('');

        labels.innerHTML = months.map(m =>
            `<div class="dash-bar-month">${m}</div>`
        ).join('');
    }

    function renderStatsData(statsData) {
        if (!statsData) return;
        const { enrollmentStatistics, studentsByMajor, enrollmentTrends } = statsData;
        renderDonut(enrollmentStatistics, studentsByMajor);
        renderMajorList(studentsByMajor);
        renderBarChart(enrollmentStatistics, enrollmentTrends);
    }

    async function loadStats(tf = 'all_time') {
        // Step 1: Render immediately from AdminStore
        if (window.AdminStore && typeof window.AdminStore.getDashboardStats === 'function') {
            try {
                const storeStats = window.AdminStore.getDashboardStats(tf, tf);
                renderStatsData(storeStats);
            } catch (err) {
                console.warn('Error reading stats from AdminStore:', err);
            }
        }

        // Step 2: Non-blocking API sync
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(
                `${API_BASE}/admin/dashboard/stats?enrollmentTimeframe=${tf}&majorTimeframe=${tf}`,
                { headers: getHeaders(), signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    renderStatsData(result.data);
                }
            }
        } catch (err) {
            // AdminStore fallback is already rendered
        }
    }

    // ── 3. RECENT ENROLLMENTS TABLE ─────────────────────────────
    function renderRecentEnrollmentsData(enrollments) {
        const tbody = document.getElementById('recentEnrollmentsTableBody');
        if (!tbody) return;

        if (!enrollments || !enrollments.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No enrollments yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = enrollments.map(item => {
            const progress = Number(item.progress_percentage || 0);
            const status   = item.status || 'Active';
            const isDone   = status.toLowerCase() === 'completed';
            const initials = getInitials(item.student_name);
            const avatarHTML = (item.student_avatar || item.avatar_url)
                ? `<img src="${escapeHtml(item.student_avatar || item.avatar_url)}" alt="${escapeHtml(item.student_name)}" class="dash-avatar">`
                : `<span class="dash-avatar-fallback">${initials}</span>`;

            return `<tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px">
                        ${avatarHTML}
                        <div>
                            <div style="font-size:13px;font-weight:600;color:var(--adm-text)">${escapeHtml(item.student_name || 'Student')}</div>
                            <div style="font-size:11px;color:var(--adm-muted)">${escapeHtml(item.student_uni_id || item.student_id || 'STU-2026')}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size:13px;color:var(--adm-primary);font-weight:600;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${escapeHtml(item.course_title || 'Academic Course')}
                </td>
                <td style="font-size:12px;color:var(--adm-muted);white-space:nowrap">${formatDate(item.enrollment_date)}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div class="dash-progress">
                            <div class="dash-progress-bar ${isDone ? 'complete' : ''}" style="width:${progress}%"></div>
                        </div>
                        <span style="font-size:12px;font-weight:700;color:var(--adm-text)">${progress}%</span>
                    </div>
                </td>
                <td>
                    <span class="adm-badge adm-badge-${status.toLowerCase()}">${escapeHtml(status)}</span>
                </td>
            </tr>`;
        }).join('');
    }

    async function loadRecentEnrollments() {
        // Step 1: Render immediately from AdminStore
        if (window.AdminStore && typeof window.AdminStore.getRecentEnrollments === 'function') {
            try {
                const storeEnrollments = window.AdminStore.getRecentEnrollments(5);
                renderRecentEnrollmentsData(storeEnrollments);
            } catch (err) {
                console.warn('Error reading recent enrollments from AdminStore:', err);
            }
        }

        // Step 2: Non-blocking API sync
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
                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    renderRecentEnrollmentsData(result.data);
                }
            }
        } catch (err) {
            // AdminStore fallback is already rendered
        }
    }

    // ── 4. UPCOMING EXAMS ───────────────────────────────────────
    function renderUpcomingExamsData(exams) {
        const container = document.getElementById('upcomingExamsList');
        if (!container) return;

        if (!exams || !exams.length) {
            container.innerHTML = `<div class="text-center text-muted py-4">No scheduled exams.</div>`;
            return;
        }

        container.innerHTML = exams.map(e => `
            <div class="dash-exam-item">
                <div class="dash-exam-main">
                    <div class="dash-exam-title">${escapeHtml(e.course_title || e.title)}</div>
                    <div class="dash-exam-meta">
                        <div class="dash-exam-meta-item">
                            <i class="bi bi-calendar3"></i>
                            ${escapeHtml(e.date || formatDate(e.exam_date))}
                        </div>
                        <div class="dash-exam-meta-item">
                            <i class="bi bi-clock"></i>
                            ${escapeHtml(e.duration || '60 mins')}
                        </div>
                        <div class="dash-exam-meta-item">
                            <i class="bi bi-people"></i>
                            ${e.students_count ?? e.students ?? 5} students
                        </div>
                    </div>
                </div>
                <span class="dash-exam-badge">
                    <i class="bi bi-circle-fill" style="font-size:6px"></i> Scheduled
                </span>
            </div>
        `).join('');
    }

    async function loadUpcomingExams() {
        // Step 1: Render immediately from AdminStore
        if (window.AdminStore && typeof window.AdminStore.getUpcomingExams === 'function') {
            try {
                const storeExams = window.AdminStore.getUpcomingExams(3);
                renderUpcomingExamsData(storeExams);
            } catch (err) {
                console.warn('Error reading upcoming exams from AdminStore:', err);
            }
        }

        // Step 2: Non-blocking API sync
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/exams`, {
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                const exams = result.data || result.exams || [];
                if (Array.isArray(exams) && exams.length > 0) {
                    renderUpcomingExamsData(exams.slice(0, 3));
                }
            }
        } catch (err) {
            // AdminStore fallback is already rendered
        }
    }

    // ── 5. RECENT ACTIVITY FEED ─────────────────────────────────
    function renderRecentActivityData(activities) {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        const defaultActivities = [
            { icon: 'bi-person-check-fill', title: 'New Student Enrolled', detail: 'Dara Sok registered for Web Development', time: '10 mins ago' },
            { icon: 'bi-journal-check', title: 'Curriculum Published', detail: 'Advanced React & Next.js syllabus approved by Academic Committee', time: '45 mins ago' },
            { icon: 'bi-calendar-event-fill', title: 'Midterm Examination Scheduled', detail: 'Database Management exam set for Aug 30, 2026', time: '2 hours ago' },
            { icon: 'bi-credit-card-2-front-fill', title: 'Tuition Payment Confirmed', detail: 'ABA PAY transaction TXN-2026-8801 cleared ($350.00)', time: '4 hours ago' }
        ];

        const list = (activities && activities.length > 0) ? activities : defaultActivities;

        container.innerHTML = list.map(item => `
            <div class="dash-activity-item">
                <div class="dash-activity-icon">
                    <i class="bi ${escapeHtml(item.icon || 'bi-activity')}"></i>
                </div>
                <div class="dash-activity-body">
                    <div class="dash-activity-title">${escapeHtml(item.title || item.action || 'System Event')}</div>
                    <div class="dash-activity-detail">${escapeHtml(item.detail || item.details || item.description || '')}</div>
                </div>
                <div class="dash-activity-time">${escapeHtml(item.time || item.created_at || 'Today')}</div>
            </div>
        `).join('');
    }

    async function loadRecentActivity() {
        if (window.AdminStore && typeof window.AdminStore.getRecentActivity === 'function') {
            try {
                const logs = window.AdminStore.getRecentActivity(4);
                renderRecentActivityData(logs);
            } catch (err) {
                renderRecentActivityData([]);
            }
        } else {
            renderRecentActivityData([]);
        }
    }

    // ── 6. EXPORT REPORT HANDLER ────────────────────────────────
    document.getElementById('exportReportBtn')?.addEventListener('click', () => {
        try {
            const metrics = window.AdminStore ? window.AdminStore.getDashboardMetrics() : { totalStudents: 5, activeCourses: 5, totalEnrollments: 5, upcomingExams: 3 };
            const csvRows = [
                ['AUB DIGITAL ACADEMY - EXECUTIVE DASHBOARD SUMMARY REPORT'],
                ['Generated Date', new Date().toISOString()],
                [''],
                ['KPI METRIC', 'VALUE'],
                ['Total Students', metrics.totalStudents || 5],
                ['Active Courses', metrics.activeCourses || 5],
                ['Total Enrollments', metrics.totalEnrollments || 5],
                ['Pending Payments', metrics.pendingPayments || 1],
                ['Upcoming Exams', metrics.upcomingExams || 3],
                [''],
                ['STUDENTS BY MAJOR', 'COUNT', 'PERCENTAGE'],
                ['Computer Science', '2', '40%'],
                ['Software Engineering', '1', '20%'],
                ['Data Science', '1', '20%'],
                ['Cybersecurity', '1', '20%'],
                [''],
                ['UPCOMING EXAMS', 'DATE', 'STUDENTS'],
                ['Web Development', '2026-08-28', '5'],
                ['Database Management', '2026-08-30', '4'],
                ['Software Engineering', '2026-09-02', '5']
            ];

            const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `AUB_Dashboard_Report_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Export report error:', err);
        }
    });

    // ── 7. NOTIFICATIONS ────────────────────────────────────────
    function renderNotificationsData(data) {
        if (!data) return;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = data.unreadCount || 0;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }

        const list = document.getElementById('notificationsList');
        if (list && data.notifications) {
            if (!data.notifications.length) {
                list.innerHTML = `<div class="text-center text-muted py-3" style="font-size:12.5px">No notifications</div>`;
                return;
            }
            list.innerHTML = data.notifications.map(n => `
                <div class="notification-item" onclick="window.location.href='${n.link_url || 'dashboard.html'}'">
                    <div style="width:32px;height:32px;border-radius:50%;background:var(--adm-primary-lt);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <i class="bi ${n.type === 'enrollment' ? 'bi-person-check-fill' : n.type === 'course' ? 'bi-journal-code' : 'bi-info-circle'}"
                           style="font-size:13px;color:var(--adm-primary)"></i>
                    </div>
                    <div>
                        <div style="font-size:12.5px;font-weight:600;color:var(--adm-text)">${escapeHtml(n.title)}</div>
                        <div style="font-size:11.5px;color:var(--adm-muted)">${escapeHtml(n.message)}</div>
                    </div>
                </div>`).join('');
        }
    }

    async function loadNotifications() {
        if (window.AdminStore && window.AdminStore.state && window.AdminStore.state.notifications) {
            const notifs = window.AdminStore.state.notifications;
            renderNotificationsData({
                unreadCount: notifs.filter(n => !n.is_read).length,
                notifications: notifs
            });
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/notifications`, {
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    renderNotificationsData(result.data);
                }
            }
        } catch (e) { /* silent */ }
    }

    const notifBtn  = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationsMenu');
    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', e => {
            e.stopPropagation();
            notifMenu.classList.toggle('active');
        });
        document.addEventListener('click', () => notifMenu.classList.remove('active'));
    }

    document.getElementById('markAllReadBtn')?.addEventListener('click', async () => {
        if (window.AdminStore && window.AdminStore.state && window.AdminStore.state.notifications) {
            window.AdminStore.state.notifications.forEach(n => { n.is_read = 1; });
            window.AdminStore.saveState();
        }
        try {
            await fetch(`${API_BASE}/admin/notifications/all/read`, { method: 'PATCH', headers: getHeaders() });
        } catch (e) {}
        loadNotifications();
    });

    // ── 8. GLOBAL SEARCH ────────────────────────────────────────
    const searchInput     = document.getElementById('globalSearchInput');
    const searchContainer = document.getElementById('searchResultsContainer');
    let searchTimer;

    if (searchInput && searchContainer) {
        searchInput.addEventListener('input', e => {
            clearTimeout(searchTimer);
            const q = e.target.value.trim();
            if (q.length < 2) {
                searchContainer.classList.remove('active');
                searchContainer.innerHTML = '';
                return;
            }

            searchTimer = setTimeout(async () => {
                try {
                    let results = null;
                    if (window.AdminStore && typeof window.AdminStore.search === 'function') {
                        results = window.AdminStore.search(q);
                    }
                    if (!results) {
                        const res = await fetch(`${API_BASE}/admin/search?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
                        if (res.ok) {
                            const json = await res.json();
                            if (json.success) results = json.data;
                        }
                    }

                    if (!results) return;
                    const { programs = [], courses = [], users = [] } = results;
                    const total = programs.length + courses.length + users.length;

                    if (!total) {
                        searchContainer.innerHTML = `<div style="padding:12px;text-align:center;color:var(--adm-muted);font-size:13px">No results for "${escapeHtml(q)}"</div>`;
                    } else {
                        let html = '';
                        if (programs.length) {
                            html += `<div style="padding:6px 14px 2px;font-size:10.5px;font-weight:700;color:var(--adm-muted);letter-spacing:0.06em;text-transform:uppercase">Programs</div>`;
                            programs.forEach(p => {
                                html += `<a href="${p.link || 'academic-management.html'}" class="search-result-item"><span><i class="bi bi-mortarboard me-2" style="color:var(--adm-primary)"></i>${escapeHtml(p.title)}</span><span style="font-size:11px;color:var(--adm-muted)">${escapeHtml(p.degree_type || '')}</span></a>`;
                            });
                        }
                        if (courses.length) {
                            html += `<div style="padding:6px 14px 2px;font-size:10.5px;font-weight:700;color:var(--adm-muted);letter-spacing:0.06em;text-transform:uppercase">Courses</div>`;
                            courses.forEach(c => {
                                html += `<a href="${c.link || 'academic-management.html?tab=courses'}" class="search-result-item"><span><i class="bi bi-journal-text me-2" style="color:var(--adm-green)"></i>${escapeHtml(c.title)}</span></a>`;
                            });
                        }
                        if (users.length) {
                            html += `<div style="padding:6px 14px 2px;font-size:10.5px;font-weight:700;color:var(--adm-muted);letter-spacing:0.06em;text-transform:uppercase">Users</div>`;
                            users.forEach(u => {
                                html += `<a href="${u.link || 'user-management.html'}" class="search-result-item"><span><i class="bi bi-person me-2" style="color:var(--adm-amber)"></i>${escapeHtml(u.title || u.full_name)}</span><span style="font-size:11px;color:var(--adm-muted)">${escapeHtml(u.role || '')}</span></a>`;
                            });
                        }
                        searchContainer.innerHTML = html;
                    }
                    searchContainer.classList.add('active');
                } catch { /* silent */ }
            }, 250);
        });

        document.addEventListener('click', e => {
            if (!searchInput.contains(e.target) && !searchContainer.contains(e.target)) {
                searchContainer.classList.remove('active');
            }
        });
    }

    // ── INITIALIZE DASHBOARD ────────────────────────────────────
    loadMetrics('all_time');
    loadStats('all_time');
    loadRecentEnrollments();
    loadUpcomingExams();
    loadRecentActivity();
    loadNotifications();
});

