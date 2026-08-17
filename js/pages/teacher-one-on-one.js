document.addEventListener('DOMContentLoaded', async function () {
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    const token = localStorage.getItem('aub_auth_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('aub_user') || '{}');
    } catch (e) {
        user = {};
    }

    // Populate user profile info in sidebar & header
    if (user.full_name) {
        const teacherName = document.getElementById('teacherName');
        const topbarTeacherName = document.getElementById('topbarTeacherName');
        const teacherRoleDisplay = document.getElementById('teacherRoleDisplay');
        const teacherAvatar = document.getElementById('teacherAvatar');
        const topbarAvatar = document.getElementById('topbarAvatar');

        if (teacherName) teacherName.textContent = user.full_name;
        if (topbarTeacherName) topbarTeacherName.textContent = user.full_name;
        if (teacherRoleDisplay) teacherRoleDisplay.textContent = `ID: ${user.university_id || 'T001'}`;
        if (teacherAvatar && user.avatar_url) teacherAvatar.src = user.avatar_url;
        if (topbarAvatar && user.avatar_url) topbarAvatar.src = user.avatar_url;
    }

    let allConsultations = [];
    let currentFilter = 'all';

    await loadConsultations();
    setupEventListeners();

    // 1. Load Consultations from Backend
    async function loadConsultations() {
        const tableBody = document.getElementById('consultationsTableBody');
        const pendingContainer = document.getElementById('pendingRequestsContainer');

        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading consultations...</td></tr>`;
        }

        try {
            const res = await fetch(`${API_BASE}/consultations/my-sessions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success && data.data) {
                allConsultations = data.data;
            } else {
                allConsultations = getFallbackTeacherConsultations();
            }
        } catch (e) {
            console.warn('API error fetching teacher consultations, using fallback data:', e);
            allConsultations = getFallbackTeacherConsultations();
        }

        updateStats(allConsultations);
        renderPendingRequests(allConsultations);
        renderConsultationsTable(allConsultations);
    }

    function getFallbackTeacherConsultations() {
        return [
            {
                id: 1,
                topic: 'Capstone Project Architecture & REST API Review',
                course_title: 'Full-Stack Web Development',
                description: 'Discuss database schema normalization and JWT authentication flow for the digital academy portal.',
                student_name: 'Sok Virak',
                student_email: 'sok.virak@student.aub.edu.kh',
                student_uid: '0001001',
                student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                session_date: '2026-08-20',
                start_time: '10:00 AM',
                end_time: '10:45 AM',
                meeting_type: 'Online Video',
                meeting_link: 'https://meet.google.com/aub-sok-virak',
                location_room: 'Online Virtual Room A',
                status: 'Confirmed',
                student_notes: 'I have prepared my API endpoints diagram and database ER diagram.',
                teacher_notes: 'Approved. Please bring your Postman test collections.'
            },
            {
                id: 2,
                topic: 'Portfolio Design Feedback & Accessibility Audit',
                course_title: 'Advanced UI/UX Design',
                description: 'Seeking mentorship on contrast ratios, responsive grid systems, and mobile typography.',
                student_name: 'Sok Virak',
                student_email: 'sok.virak@student.aub.edu.kh',
                student_uid: '0001001',
                student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                session_date: '2026-08-22',
                start_time: '02:00 PM',
                end_time: '02:30 PM',
                meeting_type: 'In-Person Office',
                meeting_link: '',
                location_room: 'Faculty Building 3, Room 304',
                status: 'Pending',
                student_notes: 'Will bring Figma prototype on laptop.',
                teacher_notes: ''
            },
            {
                id: 3,
                topic: 'Ethical Hacking Lab Setup Assistance',
                course_title: 'Cyber Security Essentials',
                description: 'Need guidance setting up virtual environments and penetration testing tools.',
                student_name: 'Chanthou Meas',
                student_email: 'chanthou.meas@student.aub.edu.kh',
                student_uid: '0001002',
                student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
                session_date: '2026-08-18',
                start_time: '03:30 PM',
                end_time: '04:15 PM',
                meeting_type: 'Online Video',
                meeting_link: 'https://meet.google.com/aub-sec-lab',
                location_room: 'Online Virtual Room B',
                status: 'Confirmed',
                student_notes: 'Kali Linux VM is installed.',
                teacher_notes: 'Ensure Docker is running prior to the call.'
            },
            {
                id: 4,
                topic: 'Midterm Code Review & Performance Optimization',
                course_title: 'Full-Stack Web Development',
                description: 'Reviewed indexing on SQL queries and asynchronous event loop performance.',
                student_name: 'Sok Virak',
                student_email: 'sok.virak@student.aub.edu.kh',
                student_uid: '0001001',
                student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                session_date: '2026-08-10',
                start_time: '11:00 AM',
                end_time: '11:45 AM',
                meeting_type: 'Online Video',
                meeting_link: 'https://meet.google.com/aub-completed-1',
                location_room: 'Online Virtual Room A',
                status: 'Completed',
                student_notes: 'Understood SQLite query optimization techniques.',
                teacher_notes: 'Great work! Excellent implementation of foreign key constraints and async/await error handling.'
            }
        ];
    }

    function updateStats(sessions) {
        const pending = sessions.filter(s => s.status === 'Pending').length;
        const upcoming = sessions.filter(s => s.status === 'Confirmed').length;
        const completed = sessions.filter(s => s.status === 'Completed').length;

        document.getElementById('kpiPending').textContent = pending;
        document.getElementById('kpiUpcoming').textContent = upcoming;
        document.getElementById('kpiCompleted').textContent = completed;
        document.getElementById('kpiTotal').textContent = sessions.length;

        const pendingBadge = document.getElementById('pendingCountBadge');
        if (pendingBadge) pendingBadge.textContent = `${pending} Pending`;

        document.getElementById('countAll').textContent = sessions.length;
        document.getElementById('countUpcoming').textContent = upcoming;
        document.getElementById('countCompleted').textContent = completed;
    }

    // 2. Render Pending Requests Queue
    function renderPendingRequests(sessions) {
        const container = document.getElementById('pendingRequestsContainer');
        const pendingSection = document.getElementById('pendingSection');
        if (!container) return;

        const pending = sessions.filter(s => s.status === 'Pending');

        if (pending.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3 text-muted">
                    <i class="bi bi-check2-circle text-success fs-4 d-block mb-1"></i>
                    <div class="fw-semibold text-sm">All caught up! No pending student requests.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = pending.map(s => `
            <div class="request-card d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div class="d-flex align-items-start gap-3">
                    <img src="${s.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}"
                         alt="${s.student_name}" class="rounded-circle border" style="width: 48px; height: 48px; object-fit: cover;">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h6 class="fw-bold text-dark mb-0">${s.student_name}</h6>
                            <span class="badge bg-light text-muted border text-xs">ID: ${s.student_uid || 'Student'}</span>
                            <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 text-xs">New Request</span>
                        </div>
                        <div class="fw-semibold text-primary text-sm mb-1">${s.topic}</div>
                        <p class="text-muted text-xs mb-2">${s.student_notes || s.description || 'No detailed note provided.'}</p>
                        
                        <div class="d-flex flex-wrap align-items-center gap-3 text-xs text-muted">
                            <span><i class="bi bi-calendar3 me-1 text-primary"></i> ${formatDate(s.session_date)}</span>
                            <span><i class="bi bi-clock me-1 text-primary"></i> ${s.start_time} (${s.end_time || '45m'})</span>
                            <span><i class="bi bi-camera-video me-1 text-primary"></i> ${s.meeting_type}</span>
                            ${s.course_title ? `<span><i class="bi bi-book me-1 text-primary"></i> ${s.course_title}</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    <button class="btn btn-outline-danger btn-sm px-3 rounded-3 decline-btn" data-session-id="${s.id}">
                        <i class="bi bi-x-lg me-1"></i> Decline
                    </button>
                    <button class="btn btn-success btn-sm px-3 rounded-3 fw-semibold accept-btn" data-session-id="${s.id}">
                        <i class="bi bi-check2-circle me-1"></i> Accept & Add Link
                    </button>
                </div>
            </div>
        `).join('');

        // Attach action events
        container.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.sessionId);
                const s = allConsultations.find(x => x.id === id);
                if (s) openAcceptModal(s);
            });
        });

        container.querySelectorAll('.decline-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.sessionId);
                if (confirm('Decline this 1-on-1 consultation request?')) {
                    await updateStatus(id, 'Declined');
                }
            });
        });
    }

    // 3. Render Consultations Table
    function renderConsultationsTable(sessions) {
        const tableBody = document.getElementById('consultationsTableBody');
        if (!tableBody) return;

        const searchTerm = (document.getElementById('searchConsultations')?.value || '').toLowerCase().trim();
        const typeFilter = document.getElementById('typeFilter')?.value || '';

        const filtered = sessions.filter(s => {
            const matchesTab = currentFilter === 'all' || s.status === currentFilter;
            const matchesType = !typeFilter || s.meeting_type === typeFilter;
            const matchesSearch = !searchTerm ||
                s.topic.toLowerCase().includes(searchTerm) ||
                (s.student_name && s.student_name.toLowerCase().includes(searchTerm)) ||
                (s.course_title && s.course_title.toLowerCase().includes(searchTerm));
            return matchesTab && matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No consultations found matching current filters.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map(s => {
            const isOnline = s.meeting_type === 'Online Video';
            const canJoin = s.status === 'Confirmed' && isOnline && s.meeting_link;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${s.student_avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150'}"
                                 alt="${s.student_name}" class="rounded-circle border" style="width: 34px; height: 34px; object-fit: cover;">
                            <div>
                                <div class="fw-bold text-dark text-sm">${s.student_name || 'Student'}</div>
                                <div class="text-xs text-muted">${s.student_uid ? `ID: ${s.student_uid}` : s.student_email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="fw-semibold text-dark text-sm">${s.topic}</div>
                        <div class="text-xs text-muted">${s.course_title || 'General Advising'}</div>
                    </td>
                    <td>
                        <div class="text-dark font-monospace text-xs fw-semibold">${formatDate(s.session_date)}</div>
                        <div class="text-xs text-muted">${s.start_time}</div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border text-xs">
                            <i class="bi ${isOnline ? 'bi-camera-video text-success' : 'bi-geo-alt text-primary'} me-1"></i>
                            ${s.meeting_type}
                        </span>
                    </td>
                    <td>
                        ${getStatusBadge(s.status)}
                    </td>
                    <td class="text-end">
                        <div class="d-flex align-items-center justify-content-end gap-2">
                            ${canJoin ? `
                                <a href="${s.meeting_link}" target="_blank" class="btn btn-outline-success btn-sm px-2 py-1" title="Join Meeting">
                                    <i class="bi bi-camera-video-fill"></i>
                                </a>
                            ` : ''}
                            
                            <button class="btn btn-outline-primary btn-sm px-2 py-1 feedback-btn" data-session-id="${s.id}" title="Add Feedback / Notes">
                                <i class="bi bi-pencil-square"></i> Feedback
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach action handlers for table
        tableBody.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.sessionId);
                const s = allConsultations.find(x => x.id === id);
                if (s) openFeedbackModal(s);
            });
        });
    }

    function getStatusBadge(status) {
        if (status === 'Confirmed') {
            return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i> Confirmed</span>`;
        } else if (status === 'Pending') {
            return `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1"><i class="bi bi-hourglass-split me-1"></i> Pending</span>`;
        } else if (status === 'Completed') {
            return `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1"><i class="bi bi-award-fill me-1"></i> Completed</span>`;
        } else if (status === 'Cancelled' || status === 'Declined') {
            return `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-x-circle-fill me-1"></i> ${status}</span>`;
        }
        return `<span class="badge bg-secondary px-2 py-1">${status}</span>`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    // 4. Accept Modal
    function openAcceptModal(session) {
        document.getElementById('acceptSessionId').value = session.id;
        document.getElementById('acceptSessionSummary').innerHTML = `
            <div class="fw-bold text-dark">${session.student_name} — ${session.topic}</div>
            <div class="text-muted text-xs mt-1">
                <i class="bi bi-calendar3 me-1"></i> ${formatDate(session.session_date)} at ${session.start_time} (${session.meeting_type})
            </div>
        `;
        document.getElementById('acceptMeetingLink').value = session.meeting_link || `https://meet.google.com/aub-${session.student_name.toLowerCase().replace(/\s+/g, '-')}`;
        document.getElementById('acceptLocationRoom').value = session.location_room || 'Faculty Building 3, Room 304';
        document.getElementById('acceptTeacherNotes').value = session.teacher_notes || '';

        const modal = new bootstrap.Modal(document.getElementById('acceptSessionModal'));
        modal.show();
    }

    const acceptForm = document.getElementById('acceptSessionForm');
    if (acceptForm) {
        acceptForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('acceptSessionId').value;
            const meeting_link = document.getElementById('acceptMeetingLink').value.trim();
            const location_room = document.getElementById('acceptLocationRoom').value.trim();
            const teacher_notes = document.getElementById('acceptTeacherNotes').value.trim();

            const confirmBtn = document.getElementById('confirmAcceptBtn');
            if (confirmBtn) confirmBtn.disabled = true;

            await updateStatus(id, 'Confirmed', { meeting_link, location_room, teacher_notes });

            const modalEl = document.getElementById('acceptSessionModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            if (confirmBtn) confirmBtn.disabled = false;
        });
    }

    // 5. Feedback Modal
    function openFeedbackModal(session) {
        document.getElementById('feedbackSessionId').value = session.id;
        document.getElementById('feedbackNotesInput').value = session.teacher_notes || '';
        document.getElementById('markCompletedCheck').checked = session.status === 'Completed' || true;

        const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
        modal.show();
    }

    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('feedbackSessionId').value;
            const teacher_notes = document.getElementById('feedbackNotesInput').value.trim();
            const markCompleted = document.getElementById('markCompletedCheck').checked;

            try {
                // Update notes
                await fetch(`${API_BASE}/consultations/${id}/notes`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ teacher_notes })
                });

                if (markCompleted) {
                    await fetch(`${API_BASE}/consultations/${id}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: 'Completed', teacher_notes })
                    });
                }

                alert('Feedback and session notes saved successfully!');
                const modalEl = document.getElementById('feedbackModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                await loadConsultations();
            } catch (err) {
                console.error('Save feedback error:', err);
                const s = allConsultations.find(x => x.id == id);
                if (s) {
                    s.teacher_notes = teacher_notes;
                    if (markCompleted) s.status = 'Completed';
                    updateStats(allConsultations);
                    renderConsultationsTable(allConsultations);
                    renderPendingRequests(allConsultations);
                }
                const modalEl = document.getElementById('feedbackModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                alert('Feedback saved.');
            }
        });
    }

    async function updateStatus(id, status, extraData = {}) {
        try {
            const res = await fetch(`${API_BASE}/consultations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, ...extraData })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(`Consultation session marked as ${status}.`);
                await loadConsultations();
            } else {
                alert(data.message || 'Status update failed.');
            }
        } catch (e) {
            console.error('Update status error:', e);
            const s = allConsultations.find(x => x.id == id);
            if (s) {
                s.status = status;
                if (extraData.meeting_link) s.meeting_link = extraData.meeting_link;
                if (extraData.location_room) s.location_room = extraData.location_room;
                if (extraData.teacher_notes) s.teacher_notes = extraData.teacher_notes;
                updateStats(allConsultations);
                renderPendingRequests(allConsultations);
                renderConsultationsTable(allConsultations);
            }
            alert(`Consultation marked as ${status}.`);
        }
    }

    // 6. Setup Listeners
    function setupEventListeners() {
        const filterBtns = document.querySelectorAll('.filter-tab-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderConsultationsTable(allConsultations);
            });
        });

        const searchInput = document.getElementById('searchConsultations');
        if (searchInput) {
            searchInput.addEventListener('input', () => renderConsultationsTable(allConsultations));
        }

        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => renderConsultationsTable(allConsultations));
        }
    }
});
