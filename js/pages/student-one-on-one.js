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
        const studentNameElem = document.getElementById('studentName');
        const topbarStudentName = document.getElementById('topbarStudentName');
        const studentIdDisplay = document.getElementById('studentIdDisplay');
        const studentAvatar = document.getElementById('studentAvatar');
        const topbarAvatar = document.getElementById('topbarAvatar');

        if (studentNameElem) studentNameElem.textContent = user.full_name;
        if (topbarStudentName) topbarStudentName.textContent = user.full_name;
        if (studentIdDisplay) studentIdDisplay.textContent = `ID: ${user.university_id || '0001001'}`;
        if (studentAvatar && user.avatar_url) studentAvatar.src = user.avatar_url;
        if (topbarAvatar && user.avatar_url) topbarAvatar.src = user.avatar_url;
    }

    let allConsultations = [];
    let currentFilter = 'all';
    let availableTeachers = [];

    // Initialize UI Elements
    initDatePicker();
    initTimeSlots();
    await loadTeachers();
    await loadConsultations();
    setupEventListeners();

    // 1. Minimum date for booking
    function initDatePicker() {
        const dateInput = document.getElementById('sessionDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }
    }

    // 2. Interactive Time Slot Selection
    function initTimeSlots() {
        const timePills = document.querySelectorAll('.time-slot-pill');
        const timeInput = document.getElementById('selectedStartTime');

        timePills.forEach(pill => {
            pill.addEventListener('click', function () {
                timePills.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                if (timeInput) {
                    timeInput.value = this.dataset.time;
                }
            });
        });
    }

    // 3. Load Teachers for the booking modal
    async function loadTeachers() {
        const container = document.getElementById('teachersSelectionList');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE}/consultations/teachers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success && data.data && data.data.length > 0) {
                availableTeachers = data.data;
            } else {
                availableTeachers = getFallbackTeachers();
            }
        } catch (e) {
            console.warn('API error fetching teachers, using default faculty mentors:', e);
            availableTeachers = getFallbackTeachers();
        }

        renderTeacherSelection(availableTeachers);
    }

    function getFallbackTeachers() {
        return [
            {
                id: 7,
                full_name: 'Dr. Sarah Johnson',
                title: 'Lead Software Architect & AI Researcher',
                email: 'sarah.johnson@aub.edu.kh',
                expertise: 'Full-Stack, Web Architecture, Cloud Systems',
                avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'
            },
            {
                id: 8,
                full_name: 'Prof. Alex Chen',
                title: 'Senior Faculty & UI/UX Specialist',
                email: 'alex.chen@aub.edu.kh',
                expertise: 'Design Systems, Human-Computer Interaction',
                avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150'
            }
        ];
    }

    function renderTeacherSelection(teachers) {
        const container = document.getElementById('teachersSelectionList');
        if (!container) return;

        const kpiMentors = document.getElementById('kpiMentors');
        if (kpiMentors) kpiMentors.textContent = teachers.length;

        container.innerHTML = teachers.map((t, idx) => `
            <div class="col-md-6">
                <div class="teacher-select-card d-flex align-items-center gap-3 ${idx === 0 ? 'selected' : ''}" data-teacher-id="${t.id}">
                    <img src="${t.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}"
                         alt="${t.full_name}" class="rounded-circle border" style="width: 44px; height: 44px; object-fit: cover;">
                    <div class="lh-sm overflow-hidden">
                        <div class="fw-bold text-sm text-dark text-truncate">${t.full_name}</div>
                        <div class="text-xs text-primary fw-medium text-truncate">${t.title || 'Faculty Mentor'}</div>
                        <div class="text-muted text-xs text-truncate">${t.expertise || ''}</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Select first teacher by default
        const teacherInput = document.getElementById('selectedTeacherId');
        if (teachers.length > 0 && teacherInput) {
            teacherInput.value = teachers[0].id;
        }

        // Attach click handlers
        const cards = container.querySelectorAll('.teacher-select-card');
        cards.forEach(card => {
            card.addEventListener('click', function () {
                cards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                if (teacherInput) {
                    teacherInput.value = this.dataset.teacherId;
                }
            });
        });
    }

    // 4. Load Student's Consultations
    async function loadConsultations() {
        const grid = document.getElementById('consultationsGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-12 text-center py-4">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="text-muted text-xs mt-2">Loading your 1-on-1 consultations...</div>
            </div>
        `;

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
                allConsultations = getFallbackConsultations();
            }
        } catch (e) {
            console.warn('API error fetching consultations, using fallback data:', e);
            allConsultations = getFallbackConsultations();
        }

        updateStats(allConsultations);
        renderConsultations(allConsultations);
    }

    function getFallbackConsultations() {
        return [
            {
                id: 1,
                topic: 'Capstone Project Architecture & REST API Review',
                course_title: 'Full-Stack Web Development',
                description: 'Discuss database schema normalization and JWT authentication flow for the digital academy portal.',
                teacher_name: 'Dr. Sarah Johnson',
                teacher_email: 'sarah.johnson@aub.edu.kh',
                teacher_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
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
                teacher_name: 'Prof. Alex Chen',
                teacher_email: 'alex.chen@aub.edu.kh',
                teacher_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
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
                id: 4,
                topic: 'Midterm Code Review & Performance Optimization',
                course_title: 'Full-Stack Web Development',
                description: 'Reviewed indexing on SQL queries and asynchronous event loop performance.',
                teacher_name: 'Dr. Sarah Johnson',
                teacher_email: 'sarah.johnson@aub.edu.kh',
                teacher_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
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
        const upcoming = sessions.filter(s => s.status === 'Confirmed').length;
        const pending = sessions.filter(s => s.status === 'Pending').length;
        const completed = sessions.filter(s => s.status === 'Completed').length;

        document.getElementById('kpiUpcoming').textContent = upcoming;
        document.getElementById('kpiPending').textContent = pending;
        document.getElementById('kpiCompleted').textContent = completed;

        document.getElementById('countAll').textContent = sessions.length;
        document.getElementById('countUpcoming').textContent = upcoming;
        document.getElementById('countPending').textContent = pending;
        document.getElementById('countCompleted').textContent = completed;
    }

    function renderConsultations(sessions) {
        const grid = document.getElementById('consultationsGrid');
        const emptyState = document.getElementById('emptyState');
        if (!grid) return;

        // Apply tab filter & search
        const searchTerm = (document.getElementById('searchConsultations')?.value || '').toLowerCase().trim();
        const typeFilter = document.getElementById('typeFilter')?.value || '';

        const filtered = sessions.filter(s => {
            const matchesTab = currentFilter === 'all' || s.status === currentFilter;
            const matchesType = !typeFilter || s.meeting_type === typeFilter;
            const matchesSearch = !searchTerm ||
                s.topic.toLowerCase().includes(searchTerm) ||
                (s.teacher_name && s.teacher_name.toLowerCase().includes(searchTerm)) ||
                (s.course_title && s.course_title.toLowerCase().includes(searchTerm));
            return matchesTab && matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
            return;
        }

        if (emptyState) emptyState.classList.add('d-none');

        grid.innerHTML = filtered.map(s => {
            const statusBadge = getStatusBadge(s.status);
            const isOnline = s.meeting_type === 'Online Video';
            const canJoin = s.status === 'Confirmed' && isOnline && s.meeting_link;

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="consultation-card">
                        <!-- Top Row: Teacher Avatar & Status -->
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="d-flex align-items-center gap-2">
                                <img src="${s.teacher_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'}"
                                     alt="${s.teacher_name}" class="rounded-circle border" style="width: 42px; height: 42px; object-fit: cover;">
                                <div>
                                    <div class="fw-bold text-dark text-sm leading-tight">${s.teacher_name || 'Faculty Instructor'}</div>
                                    <div class="text-xs text-muted">${s.teacher_email || 'Faculty Mentor'}</div>
                                </div>
                            </div>
                            ${statusBadge}
                        </div>

                        <!-- Topic & Course -->
                        <div class="mb-3">
                            ${s.course_title ? `<span class="badge bg-primary bg-opacity-10 text-primary mb-1 text-xs px-2 py-1 rounded">${s.course_title}</span>` : ''}
                            <h6 class="fw-bold text-dark mb-1" style="font-size: 14px;">${s.topic}</h6>
                            <p class="text-muted text-xs mb-0 text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${s.description || s.student_notes || 'No description provided.'}
                            </p>
                        </div>

                        <!-- Schedule Meta Box -->
                        <div class="p-2 rounded-3 bg-light border mb-3 text-xs">
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="text-muted"><i class="bi bi-calendar-event me-1 text-primary"></i> Date:</span>
                                <span class="fw-bold text-dark">${formatDate(s.session_date)}</span>
                            </div>
                            <div class="d-flex align-items-center justify-content-between mb-1">
                                <span class="text-muted"><i class="bi bi-clock me-1 text-primary"></i> Time:</span>
                                <span class="fw-semibold text-dark">${s.start_time} (${s.end_time || '45m'})</span>
                            </div>
                            <div class="d-flex align-items-center justify-content-between">
                                <span class="text-muted"><i class="bi ${isOnline ? 'bi-camera-video text-success' : 'bi-geo-alt text-danger'} me-1"></i> Mode:</span>
                                <span class="fw-semibold text-dark">${s.meeting_type}</span>
                            </div>
                        </div>

                        <!-- Footer Actions -->
                        <div class="mt-auto d-flex flex-column gap-2 pt-2 border-top">
                            ${canJoin ? `
                                <a href="${s.meeting_link}" target="_blank" class="btn btn-success btn-sm w-100 rounded-3 py-1 fw-semibold d-flex align-items-center justify-content-center gap-1">
                                    <i class="bi bi-camera-video-fill"></i> Join Virtual Session
                                </a>
                            ` : ''}

                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-primary btn-sm flex-grow-1 rounded-3 view-details-btn" data-session-id="${s.id}">
                                    <i class="bi bi-eye me-1"></i> View Details
                                </button>

                                ${(s.status === 'Pending' || s.status === 'Confirmed') ? `
                                    <button class="btn btn-outline-danger btn-sm rounded-3 cancel-session-btn" data-session-id="${s.id}" title="Cancel Consultation">
                                        <i class="bi bi-x-circle"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach action handlers
        grid.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.sessionId);
                const session = allConsultations.find(x => x.id === id);
                if (session) openDetailsModal(session);
            });
        });

        grid.querySelectorAll('.cancel-session-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.sessionId);
                if (confirm('Are you sure you want to cancel this 1-on-1 consultation?')) {
                    await cancelSession(id);
                }
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

    function openDetailsModal(session) {
        const body = document.getElementById('sessionDetailsBody');
        if (!body) return;

        const isOnline = session.meeting_type === 'Online Video';

        body.innerHTML = `
            <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
                <img src="${session.teacher_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'}"
                     alt="${session.teacher_name}" class="rounded-circle border" style="width: 52px; height: 52px; object-fit: cover;">
                <div>
                    <h6 class="fw-bold text-dark mb-0">${session.teacher_name}</h6>
                    <div class="text-xs text-muted">${session.teacher_email}</div>
                    <div class="mt-1">${getStatusBadge(session.status)}</div>
                </div>
            </div>

            <div class="mb-3">
                <label class="text-xs text-muted fw-bold text-uppercase">Topic / Agenda</label>
                <div class="fw-bold text-dark fs-6">${session.topic}</div>
                ${session.course_title ? `<span class="badge bg-primary bg-opacity-10 text-primary text-xs mt-1">${session.course_title}</span>` : ''}
            </div>

            <div class="row g-2 mb-3">
                <div class="col-6">
                    <label class="text-xs text-muted fw-bold text-uppercase">Scheduled Date</label>
                    <div class="fw-semibold text-dark text-sm"><i class="bi bi-calendar3 me-1 text-primary"></i> ${formatDate(session.session_date)}</div>
                </div>
                <div class="col-6">
                    <label class="text-xs text-muted fw-bold text-uppercase">Time Slot</label>
                    <div class="fw-semibold text-dark text-sm"><i class="bi bi-clock me-1 text-primary"></i> ${session.start_time}</div>
                </div>
            </div>

            <div class="mb-3">
                <label class="text-xs text-muted fw-bold text-uppercase">Location / Meeting Details</label>
                <div class="p-2 rounded bg-light border text-sm">
                    <div><strong>Format:</strong> ${session.meeting_type}</div>
                    ${session.location_room ? `<div><strong>Room:</strong> ${session.location_room}</div>` : ''}
                    ${session.meeting_link ? `
                        <div class="mt-2">
                            <strong>Meeting URL:</strong>
                            <div class="mt-1">
                                <a href="${session.meeting_link}" target="_blank" class="btn btn-success btn-sm px-3">
                                    <i class="bi bi-camera-video-fill me-1"></i> Open Google Meet Room
                                </a>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${session.student_notes ? `
                <div class="mb-3">
                    <label class="text-xs text-muted fw-bold text-uppercase">Your Questions & Notes</label>
                    <div class="p-2 rounded bg-light border text-xs text-dark">${session.student_notes}</div>
                </div>
            ` : ''}

            ${session.teacher_notes ? `
                <div class="mb-2">
                    <label class="text-xs text-success fw-bold text-uppercase"><i class="bi bi-check2-all me-1"></i> Professor's Feedback & Action Items</label>
                    <div class="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25 text-xs text-dark lh-base">
                        ${session.teacher_notes}
                    </div>
                </div>
            ` : `
                <div class="text-xs text-muted fst-italic">No feedback notes recorded yet.</div>
            `}
        `;

        const modal = new bootstrap.Modal(document.getElementById('sessionDetailsModal'));
        modal.show();
    }

    async function cancelSession(id) {
        try {
            const res = await fetch(`${API_BASE}/consultations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Cancelled' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Consultation session cancelled.');
                await loadConsultations();
            } else {
                alert(data.message || 'Failed to cancel session.');
            }
        } catch (e) {
            console.error('Cancel session error:', e);
            // Local state update fallback
            const s = allConsultations.find(x => x.id === id);
            if (s) {
                s.status = 'Cancelled';
                updateStats(allConsultations);
                renderConsultations(allConsultations);
                alert('Session status updated to Cancelled.');
            }
        }
    }

    // 5. Booking Form Submission Handler
    const bookForm = document.getElementById('bookConsultationForm');
    if (bookForm) {
        bookForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const teacher_id = parseInt(document.getElementById('selectedTeacherId')?.value);
            const topic = document.getElementById('consultationTopic')?.value.trim();
            const course_id = document.getElementById('consultationCourse')?.value || null;
            const session_date = document.getElementById('sessionDate')?.value;
            const start_time = document.getElementById('selectedStartTime')?.value || '10:00 AM';
            const duration = document.getElementById('durationSelect')?.value || '45 mins';
            const meeting_type = document.getElementById('meetingType')?.value;
            const student_notes = document.getElementById('studentNotes')?.value.trim();

            if (!teacher_id || !topic || !session_date) {
                alert('Please fill in all required fields.');
                return;
            }

            const submitBtn = document.getElementById('submitBookBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';
            }

            const payload = {
                teacher_id,
                course_id: course_id ? parseInt(course_id) : null,
                topic,
                session_date,
                start_time,
                end_time: duration,
                meeting_type,
                student_notes
            };

            try {
                const res = await fetch(`${API_BASE}/consultations/book`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alert('🎉 1-on-1 Consultation requested successfully! Your professor has been notified.');
                    const modalEl = document.getElementById('bookConsultationModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    bookForm.reset();
                    initDatePicker();
                    await loadConsultations();
                } else {
                    alert(data.message || 'Failed to submit booking request.');
                }
            } catch (err) {
                console.error('Booking submission error:', err);
                // Client fallback
                const teacherObj = availableTeachers.find(t => t.id === teacher_id) || { full_name: 'Dr. Sarah Johnson' };
                allConsultations.unshift({
                    id: Date.now(),
                    student_id: user.id || 2,
                    teacher_id,
                    teacher_name: teacherObj.full_name,
                    teacher_email: teacherObj.email,
                    teacher_avatar: teacherObj.avatar_url,
                    topic,
                    session_date,
                    start_time,
                    end_time: duration,
                    meeting_type,
                    status: 'Pending',
                    student_notes
                });
                updateStats(allConsultations);
                renderConsultations(allConsultations);
                const modalEl = document.getElementById('bookConsultationModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                bookForm.reset();
                alert('🎉 1-on-1 Consultation requested successfully!');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-send-fill me-1"></i> Submit Booking Request';
                }
            }
        });
    }

    // 6. Setup Filter & Search Listeners
    function setupEventListeners() {
        const filterBtns = document.querySelectorAll('.filter-tab-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderConsultations(allConsultations);
            });
        });

        const searchInput = document.getElementById('searchConsultations');
        if (searchInput) {
            searchInput.addEventListener('input', () => renderConsultations(allConsultations));
        }

        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => renderConsultations(allConsultations));
        }
    }
});
