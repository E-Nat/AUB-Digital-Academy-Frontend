// ==========================================
// AUB Digital Academy - Schedule & Calendar Management Controller
// Milestones, Course Lifecycle Windows, Exam Deadlines & Lecture Sessions
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

    let allEvents = [];

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDateTime(dtStr) {
        if (!dtStr) return 'N/A';
        try {
            const d = new Date(dtStr);
            return d.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (e) {
            return dtStr;
        }
    }

    async function loadEvents() {
        let loaded = false;
        try {
            const res = await fetch(`${API_BASE}/admin/calendar-events`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allEvents = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded) {
            allEvents = [
                { id: 1, title: 'Web Architecture Cohort Lecture', event_type: 'Lecture Session', course_title: 'Full-Stack Modern Web Architecture', instructor_name: 'Prof. Alex Chen', start_time: '2026-08-25T18:00', end_time: '2026-08-25T20:00', location_room: 'Virtual Lab 102 & Zoom', status: 'Upcoming' },
                { id: 2, title: 'Algorithms Midterm Review Session', event_type: 'Review Class', course_title: 'Applied Programming & Algorithms', instructor_name: 'Dr. Sarah Johnson', start_time: '2026-08-27T14:00', end_time: '2026-08-27T16:00', location_room: 'Main Campus Hall B', status: 'Scheduled' },
                { id: 3, title: 'Cybersecurity Practical Defense Exam', event_type: 'Examination Window', course_title: 'Cybersecurity Fundamentals & Network Defense', instructor_name: 'Dr. Maria Garcia', start_time: '2026-08-28T10:00', end_time: '2026-08-28T12:00', location_room: 'Cyber Lab 304', status: 'Upcoming' },
                { id: 4, title: 'Fall 2026 Course Enrollment Deadline', event_type: 'Academic Deadline', course_title: 'All Specialized Courses', instructor_name: 'Bursar & Registrar Office', start_time: '2026-09-05T23:59', end_time: '2026-09-05T23:59', location_room: 'Portal System-wide', status: 'Critical Deadline' }
            ];
        }

        renderEvents(allEvents);
    }

    function renderEvents(events) {
        const tbody = document.getElementById('calendarTableBody');
        if (!tbody) return;

        if (events.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">No academic calendar events scheduled.</td></tr>`;
            return;
        }

        tbody.innerHTML = events.map(ev => {
            const typeBadge = ev.event_type === 'Academic Deadline' || ev.event_type === 'Critical Deadline'
                ? 'bg-danger bg-opacity-10 text-danger border border-danger'
                : ev.event_type === 'Examination Window'
                ? 'bg-warning bg-opacity-15 text-dark border border-warning'
                : 'bg-primary bg-opacity-10 text-primary border border-primary';

            return `
                <tr>
                    <td class="fw-bold text-dark">${escapeHtml(ev.title)}</td>
                    <td><span class="badge ${typeBadge}">${escapeHtml(ev.event_type)}</span></td>
                    <td class="fw-semibold text-dark">${escapeHtml(ev.course_title || 'General')}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(ev.instructor_name || 'Faculty Staff')}</span></td>
                    <td class="small text-nowrap"><i class="bi bi-clock me-1 text-primary"></i>${formatDateTime(ev.start_time)}</td>
                    <td class="small text-nowrap"><i class="bi bi-clock-history me-1 text-muted"></i>${formatDateTime(ev.end_time)}</td>
                    <td><span class="small text-muted"><i class="bi bi-geo-alt me-1 text-danger"></i>${escapeHtml(ev.location_room || 'Online')}</span></td>
                    <td><span class="badge bg-success bg-opacity-10 text-success border border-success">${escapeHtml(ev.status || 'Active')}</span></td>
                </tr>
            `;
        }).join('');
    }

    loadEvents();
});
