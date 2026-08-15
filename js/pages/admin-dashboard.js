// Admin Dashboard dynamic script (Vanilla JS)
document.addEventListener('DOMContentLoaded', async function () {
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    const token = localStorage.getItem('aub_auth_token');
    const userStr = localStorage.getItem('aub_user');

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
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        // Format: May 24, 2026 | Wednesday
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

    // 4. Fetch Real Dynamic Dashboard Metrics from API
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
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
        console.log('Backend not connected yet or running fallback metrics:', err.message);
    }

    // 5. Fetch Real Recent Enrollments
    try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/admin/dashboard/recent-enrollments`, { headers });
        if (res.ok) {
            const result = await res.json();
            if (result.success && result.data && result.data.length > 0) {
                const tbody = document.getElementById('recentEnrollmentsTableBody');
                if (tbody) {
                    tbody.innerHTML = result.data.map(item => `
                        <tr>
                            <td class="text-muted fw-semibold">${escapeHtml(item.student_id || '000100' + item.id)}</td>
                            <td class="fw-bold text-dark">${escapeHtml(item.student_name || 'Student')}</td>
                            <td>${escapeHtml(item.course_title || 'Course')}</td>
                            <td class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${formatDate(item.enrollment_date)}</td>
                            <td><span class="admin-status-badge ${item.status ? item.status.toLowerCase() : 'active'}">${escapeHtml(item.status || 'Active')}</span></td>
                        </tr>
                    `).join('');
                }
            }
        }
    } catch (err) {
        console.log('Using default enrollment rows fallback.');
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
});
