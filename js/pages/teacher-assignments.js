/**
 * Teacher Assignments Management
 * AUB Digital Academy - Faculty Portal
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current authenticated user
    let currentUser = null;
    try {
        const stored = localStorage.getItem('aub_user');
        if (stored) currentUser = JSON.parse(stored);
    } catch (e) {
        console.error('Error parsing user session', e);
    }

    // Default faculty demo profile if not logged in
    if (!currentUser) {
        currentUser = {
            id: 2,
            full_name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@aub.edu.kh',
            role_id: 2,
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'
        };
    }

    // Update Header / Sidebar Profile
    const teacherNameEl = document.getElementById('teacherName');
    const topbarTeacherNameEl = document.getElementById('topbarTeacherName');
    const teacherAvatarEl = document.getElementById('teacherAvatar');
    const topbarAvatarEl = document.getElementById('topbarAvatar');

    if (teacherNameEl) teacherNameEl.textContent = currentUser.full_name;
    if (topbarTeacherNameEl) topbarTeacherNameEl.textContent = currentUser.full_name;
    if (teacherAvatarEl && currentUser.avatar_url) teacherAvatarEl.src = currentUser.avatar_url;
    if (topbarAvatarEl && currentUser.avatar_url) topbarAvatarEl.src = currentUser.avatar_url;

    // State
    let coursesList = [];
    let assignmentsList = [];
    let currentStatusFilter = 'ALL';
    let currentCourseFilter = '';
    let searchQuery = '';

    const token = localStorage.getItem('aub_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    // DOM Elements
    const assignmentsContainer = document.getElementById('assignmentsListContainer');
    const filterCourseSelect = document.getElementById('filterCourseSelect');
    const assignmentCourseId = document.getElementById('assignmentCourseId');
    const searchInput = document.getElementById('searchAssignments');
    const assignmentForm = document.getElementById('assignmentForm');
    const assignmentModal = new bootstrap.Modal(document.getElementById('assignmentModal'));
    const submissionsModal = new bootstrap.Modal(document.getElementById('submissionsModal'));

    // Mock initial data if backend is offline
    const MOCK_COURSES = [
        { id: 1, title: 'Full-Stack Web Development', category_name: 'Technology', difficulty: 'Beginner' },
        { id: 2, title: 'Advanced UI/UX Design', category_name: 'Design', difficulty: 'Intermediate' },
        { id: 3, title: 'Cyber Security Essentials', category_name: 'Security', difficulty: 'Advanced' },
        { id: 4, title: 'Applied Data Science with Python', category_name: 'Data Science', difficulty: 'Intermediate' }
    ];

    const MOCK_ASSIGNMENTS = [
        {
            id: 1,
            course_id: 1,
            course_title: 'Full-Stack Web Development',
            teacher_id: currentUser.id,
            teacher_name: currentUser.full_name,
            title: 'Milestone 1: Database Architecture & RESTful API Setup',
            description: 'Design the relational database schema, configure Express routes, and write comprehensive seed scripts.',
            start_date: '2026-08-15T08:00',
            due_date: '2026-08-25T23:59',
            end_date: '2026-08-27T23:59',
            total_points: 100,
            submission_type: 'GitHub Link',
            attachment_url: 'https://github.com/aub-academy/starter-milestone1',
            status: 'Published',
            total_submissions: 18,
            graded_submissions: 12
        },
        {
            id: 2,
            course_id: 2,
            course_title: 'Advanced UI/UX Design',
            teacher_id: currentUser.id,
            teacher_name: currentUser.full_name,
            title: 'Design System & Interactive Mobile Prototype in Figma',
            description: 'Create a consistent typography scale, color tokens, reusable components, and high-fidelity wireframes.',
            start_date: '2026-08-10T09:00',
            due_date: '2026-08-22T18:00',
            end_date: '2026-08-24T23:59',
            total_points: 100,
            submission_type: 'File Upload',
            attachment_url: '',
            status: 'Published',
            total_submissions: 24,
            graded_submissions: 24
        },
        {
            id: 3,
            course_id: 3,
            course_title: 'Cyber Security Essentials',
            teacher_id: currentUser.id,
            teacher_name: currentUser.full_name,
            title: 'Vulnerability Assessment & Penetration Testing Lab Report',
            description: 'Identify potential attack vectors on the simulated lab server and submit mitigation recommendations.',
            start_date: '2026-08-20T08:00',
            due_date: '2026-09-02T23:59',
            end_date: '2026-09-04T23:59',
            total_points: 150,
            submission_type: 'File Upload',
            attachment_url: '',
            status: 'Draft',
            total_submissions: 0,
            graded_submissions: 0
        }
    ];

    /**
     * Load Courses Taught
     */
    async function loadCourses() {
        try {
            const res = await fetch('/api/teacher/courses', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data?.length > 0) {
                    coursesList = data.data;
                } else {
                    coursesList = MOCK_COURSES;
                }
            } else {
                coursesList = MOCK_COURSES;
            }
        } catch (e) {
            coursesList = MOCK_COURSES;
        }

        // Populate dropdowns
        filterCourseSelect.innerHTML = '<option value="">All Taught Courses</option>';
        assignmentCourseId.innerHTML = '<option value="" disabled selected>Select course you teach...</option>';

        coursesList.forEach(course => {
            const opt1 = document.createElement('option');
            opt1.value = course.id;
            opt1.textContent = course.title;
            filterCourseSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = course.id;
            opt2.textContent = `${course.title} (${course.category_name || 'Academic'})`;
            assignmentCourseId.appendChild(opt2);
        });

        document.getElementById('statCoursesTaught').textContent = coursesList.length;
    }

    /**
     * Load Assignments
     */
    async function loadAssignments() {
        try {
            const res = await fetch('/api/teacher/assignments', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    assignmentsList = data.data;
                } else {
                    assignmentsList = getLocalAssignments();
                }
            } else {
                assignmentsList = getLocalAssignments();
            }
        } catch (e) {
            assignmentsList = getLocalAssignments();
        }

        renderAssignments();
        updateKPISummaries();
    }

    function getLocalAssignments() {
        const stored = localStorage.getItem('aub_teacher_assignments');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        localStorage.setItem('aub_teacher_assignments', JSON.stringify(MOCK_ASSIGNMENTS));
        return MOCK_ASSIGNMENTS;
    }

    function saveLocalAssignments(list) {
        localStorage.setItem('aub_teacher_assignments', JSON.stringify(list));
    }

    /**
     * Render Assignments List
     */
    function renderAssignments() {
        let filtered = assignmentsList.filter(item => {
            // Status Filter
            if (currentStatusFilter !== 'ALL' && item.status !== currentStatusFilter) return false;
            // Course Filter
            if (currentCourseFilter && String(item.course_id) !== String(currentCourseFilter)) return false;
            // Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const titleMatch = item.title?.toLowerCase().includes(q);
                const courseMatch = item.course_title?.toLowerCase().includes(q);
                const descMatch = item.description?.toLowerCase().includes(q);
                if (!titleMatch && !courseMatch && !descMatch) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            assignmentsContainer.innerHTML = `
                <div class="card p-5 text-center bg-white border rounded-3">
                    <i class="bi bi-journal-x text-muted" style="font-size: 3rem;"></i>
                    <h5 class="fw-bold mt-3 text-dark">No Assignments Found</h5>
                    <p class="text-muted text-sm mb-4">No assignments match your current filter criteria or search query.</p>
                    <div>
                        <button class="btn btn-primary btn-sm px-3" onclick="document.getElementById('createAssignmentBtn').click()">
                            <i class="bi bi-plus-lg me-1"></i> Create First Assignment
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        assignmentsContainer.innerHTML = filtered.map(assignment => {
            const dueFormatted = assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'No Deadline';

            const endFormatted = assignment.end_date ? new Date(assignment.end_date).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : null;

            const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date();

            let statusBadge = '';
            if (assignment.status === 'Published') {
                statusBadge = `<span class="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded"><i class="bi bi-check-circle me-1"></i> Published</span>`;
            } else if (assignment.status === 'Draft') {
                statusBadge = `<span class="badge bg-warning bg-opacity-10 text-warning fw-semibold px-2 py-1 rounded"><i class="bi bi-pencil-square me-1"></i> Draft</span>`;
            } else {
                statusBadge = `<span class="badge bg-secondary bg-opacity-10 text-secondary fw-semibold px-2 py-1 rounded"><i class="bi bi-lock-fill me-1"></i> Closed</span>`;
            }

            const totalSubs = assignment.total_submissions || 0;
            const gradedSubs = assignment.graded_submissions || 0;

            return `
                <div class="assignment-card">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                        <div class="flex-grow-1">
                            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                                <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2.5 py-1 rounded-pill text-xs">
                                    <i class="bi bi-book me-1"></i> ${escapeHtml(assignment.course_title || 'Course')}
                                </span>
                                ${statusBadge}
                                <span class="badge bg-light text-dark border text-xs px-2 py-1">
                                    <i class="bi bi-award me-1 text-primary"></i> ${assignment.total_points || 100} Points
                                </span>
                                <span class="badge bg-light text-secondary border text-xs px-2 py-1">
                                    <i class="bi bi-file-earmark-arrow-up me-1"></i> ${escapeHtml(assignment.submission_type || 'File Upload')}
                                </span>
                            </div>
                            
                            <h4 class="fw-bold text-dark mb-2 fs-5">${escapeHtml(assignment.title)}</h4>
                            <p class="text-muted text-sm mb-3" style="line-height: 1.5;">${escapeHtml(assignment.description)}</p>

                            <div class="d-flex flex-wrap align-items-center gap-3 text-xs text-muted">
                                <div class="d-flex align-items-center gap-1 ${isPastDue ? 'text-danger fw-semibold' : ''}">
                                    <i class="bi bi-clock-history"></i>
                                    <span>Due: ${dueFormatted}</span>
                                </div>
                                ${endFormatted ? `
                                    <div class="d-flex align-items-center gap-1">
                                        <i class="bi bi-hourglass-split"></i>
                                        <span>Cutoff: ${endFormatted}</span>
                                    </div>
                                ` : ''}
                                ${assignment.attachment_url ? `
                                    <a href="${escapeHtml(assignment.attachment_url)}" target="_blank" class="text-primary text-decoration-none d-flex align-items-center gap-1 fw-semibold">
                                        <i class="bi bi-link-45deg"></i> Starter Resource
                                    </a>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Right Stats & Actions -->
                        <div class="d-flex flex-row flex-md-column align-items-end justify-content-between gap-3 w-100 w-md-auto border-top border-md-0 pt-3 pt-md-0">
                            <div class="text-start text-md-end">
                                <div class="text-xs text-muted text-uppercase fw-bold">Submissions</div>
                                <div class="fw-bold fs-6 text-dark">${totalSubs} Received</div>
                                <div class="text-xs text-success">${gradedSubs} / ${totalSubs} Graded</div>
                            </div>

                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onclick="openSubmissionsModal(${assignment.id})">
                                    <i class="bi bi-inbox"></i>
                                    <span>Submissions</span>
                                </button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="editAssignment(${assignment.id})" title="Edit Assignment">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="deleteAssignment(${assignment.id})" title="Delete Assignment">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update KPI Cards & Filter Counts
     */
    function updateKPISummaries() {
        const total = assignmentsList.length;
        const published = assignmentsList.filter(a => a.status === 'Published').length;
        const draft = assignmentsList.filter(a => a.status === 'Draft').length;
        const closed = assignmentsList.filter(a => a.status === 'Closed').length;

        const totalSubs = assignmentsList.reduce((acc, cur) => acc + (cur.total_submissions || 0), 0);

        document.getElementById('statTotalAssignments').textContent = total;
        document.getElementById('statActiveAssignments').textContent = published;
        document.getElementById('statTotalSubmissions').textContent = totalSubs;

        document.getElementById('countAll').textContent = total;
        document.getElementById('countPublished').textContent = published;
        document.getElementById('countDraft').textContent = draft;
        document.getElementById('countClosed').textContent = closed;
    }

    // Filter status tab click
    document.querySelectorAll('#statusFilterTabs .filter-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statusFilterTabs .filter-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.getAttribute('data-status');
            renderAssignments();
        });
    });

    // Course filter change
    filterCourseSelect.addEventListener('change', (e) => {
        currentCourseFilter = e.target.value;
        renderAssignments();
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderAssignments();
    });

    /**
     * Create / Edit Form Submission
     */
    assignmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('assignmentId').value;
        const courseId = parseInt(document.getElementById('assignmentCourseId').value);
        const title = document.getElementById('assignmentTitle').value.trim();
        const description = document.getElementById('assignmentDescription').value.trim();
        const startDate = document.getElementById('assignmentStartDate').value;
        const dueDate = document.getElementById('assignmentDueDate').value;
        const endDate = document.getElementById('assignmentEndDate').value;
        const totalPoints = parseInt(document.getElementById('assignmentPoints').value) || 100;
        const submissionType = document.getElementById('assignmentSubmissionType').value;
        const attachmentUrl = document.getElementById('assignmentAttachment').value.trim();
        const status = document.getElementById('assignmentStatus').value;

        const selectedCourse = coursesList.find(c => c.id === courseId);

        const payload = {
            course_id: courseId,
            course_title: selectedCourse ? selectedCourse.title : 'Course',
            title,
            description,
            start_date: startDate || null,
            due_date: dueDate,
            end_date: endDate || null,
            total_points: totalPoints,
            submission_type: submissionType,
            attachment_url: attachmentUrl,
            status
        };

        const saveBtn = document.getElementById('saveAssignmentBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

        try {
            if (id) {
                // UPDATE
                const res = await fetch(`/api/teacher/assignments/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        const idx = assignmentsList.findIndex(a => a.id == id);
                        if (idx !== -1) assignmentsList[idx] = { ...assignmentsList[idx], ...payload };
                    }
                } else {
                    // Fallback to local
                    const idx = assignmentsList.findIndex(a => a.id == id);
                    if (idx !== -1) assignmentsList[idx] = { ...assignmentsList[idx], ...payload };
                    saveLocalAssignments(assignmentsList);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Assignment Updated!',
                    text: 'Your course assignment changes have been saved.',
                    timer: 1800,
                    showConfirmButton: false
                });
            } else {
                // CREATE
                const res = await fetch('/api/teacher/assignments', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        assignmentsList.unshift(data.data);
                    } else {
                        payload.id = Date.now();
                        payload.total_submissions = 0;
                        payload.graded_submissions = 0;
                        assignmentsList.unshift(payload);
                    }
                } else {
                    // Fallback to local
                    payload.id = Date.now();
                    payload.total_submissions = 0;
                    payload.graded_submissions = 0;
                    assignmentsList.unshift(payload);
                    saveLocalAssignments(assignmentsList);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Assignment Created!',
                    text: 'Students enrolled in the course can now view the assignment.',
                    timer: 1800,
                    showConfirmButton: false
                });
            }

            assignmentModal.hide();
            renderAssignments();
            updateKPISummaries();
        } catch (err) {
            console.error('Error saving assignment', err);
            // Local fallback
            if (id) {
                const idx = assignmentsList.findIndex(a => a.id == id);
                if (idx !== -1) assignmentsList[idx] = { ...assignmentsList[idx], ...payload };
            } else {
                payload.id = Date.now();
                payload.total_submissions = 0;
                payload.graded_submissions = 0;
                assignmentsList.unshift(payload);
            }
            saveLocalAssignments(assignmentsList);
            assignmentModal.hide();
            renderAssignments();
            updateKPISummaries();

            Swal.fire({
                icon: 'success',
                title: 'Saved Successfully',
                timer: 1500,
                showConfirmButton: false
            });
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Assignment';
        }
    });

    // Reset Modal on Open
    document.getElementById('createAssignmentBtn').addEventListener('click', () => {
        document.getElementById('assignmentModalTitle').textContent = 'Create New Course Assignment';
        assignmentForm.reset();
        document.getElementById('assignmentId').value = '';
        document.getElementById('assignmentPoints').value = 100;
        document.getElementById('assignmentStatus').value = 'Published';
    });

    /**
     * Edit Assignment
     */
    window.editAssignment = function(id) {
        const item = assignmentsList.find(a => a.id == id);
        if (!item) return;

        document.getElementById('assignmentModalTitle').textContent = 'Edit Course Assignment';
        document.getElementById('assignmentId').value = item.id;
        document.getElementById('assignmentCourseId').value = item.course_id;
        document.getElementById('assignmentTitle').value = item.title;
        document.getElementById('assignmentDescription').value = item.description;
        document.getElementById('assignmentStartDate').value = item.start_date ? item.start_date.substring(0, 16) : '';
        document.getElementById('assignmentDueDate').value = item.due_date ? item.due_date.substring(0, 16) : '';
        document.getElementById('assignmentEndDate').value = item.end_date ? item.end_date.substring(0, 16) : '';
        document.getElementById('assignmentPoints').value = item.total_points || 100;
        document.getElementById('assignmentSubmissionType').value = item.submission_type || 'File Upload';
        document.getElementById('assignmentAttachment').value = item.attachment_url || '';
        document.getElementById('assignmentStatus').value = item.status || 'Published';

        assignmentModal.show();
    };

    /**
     * Delete Assignment
     */
    window.deleteAssignment = function(id) {
        const item = assignmentsList.find(a => a.id == id);
        if (!item) return;

        Swal.fire({
            title: 'Delete Assignment?',
            text: `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete Assignment'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetch(`/api/teacher/assignments/${id}`, {
                        method: 'DELETE',
                        headers
                    });
                } catch (e) {}

                assignmentsList = assignmentsList.filter(a => a.id != id);
                saveLocalAssignments(assignmentsList);
                renderAssignments();
                updateKPISummaries();

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'The assignment has been removed.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    /**
     * Submissions & Grading Modal
     */
    window.openSubmissionsModal = async function(assignmentId) {
        const assignment = assignmentsList.find(a => a.id == assignmentId);
        if (!assignment) return;

        document.getElementById('submissionsModalTitle').textContent = `Submissions: ${assignment.title}`;
        document.getElementById('submissionsModalSubtitle').textContent = `Course: ${assignment.course_title} | Total Points: ${assignment.total_points || 100}`;

        const tableBody = document.getElementById('submissionsTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div> Loading student submissions...
                </td>
            </tr>
        `;

        submissionsModal.show();

        // Mock student submissions
        const mockSubs = [
            {
                id: 101,
                student_name: 'Vannak Chan',
                student_uni_id: 'AUB-2024-0012',
                student_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100',
                submitted_at: '2026-08-21T14:32',
                submission_text: 'Completed all required database schemas and verified indexes.',
                file_url: 'https://github.com/vannak-chan/project-milestone1',
                grade: 95,
                feedback: 'Excellent schema normalization and clean documentation.',
                status: 'Graded'
            },
            {
                id: 102,
                student_name: 'Sreypov Kim',
                student_uni_id: 'AUB-2024-0045',
                student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100',
                submitted_at: '2026-08-22T10:15',
                submission_text: 'Attached design tokens export and clickable prototype link.',
                file_url: 'https://www.figma.com/file/demo-prototype',
                grade: null,
                feedback: '',
                status: 'Submitted'
            }
        ];

        let subs = [];
        try {
            const res = await fetch(`/api/teacher/assignments/${assignmentId}/submissions`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data?.length > 0) subs = data.data;
                else subs = mockSubs;
            } else {
                subs = mockSubs;
            }
        } catch (e) {
            subs = mockSubs;
        }

        if (subs.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox fs-4 d-block mb-2 text-muted"></i>
                        No student submissions received yet for this assignment.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = subs.map(sub => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${sub.student_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100'}" class="rounded-circle" width="32" height="32" alt="Student">
                        <span class="fw-semibold text-dark text-sm">${escapeHtml(sub.student_name)}</span>
                    </div>
                </td>
                <td class="text-xs text-muted font-monospace">${escapeHtml(sub.student_uni_id || 'AUB-ID')}</td>
                <td class="text-xs text-muted">${new Date(sub.submitted_at).toLocaleDateString()}</td>
                <td class="text-xs">
                    ${sub.file_url ? `<a href="${escapeHtml(sub.file_url)}" target="_blank" class="text-primary text-decoration-none fw-semibold"><i class="bi bi-box-arrow-up-right me-1"></i>View Work</a>` : 'Text Submission'}
                    <div class="text-muted text-truncate" style="max-width: 220px;">${escapeHtml(sub.submission_text || '')}</div>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm text-center font-monospace" style="width: 75px;" value="${sub.grade !== null && sub.grade !== undefined ? sub.grade : ''}" placeholder="/${assignment.total_points || 100}" id="gradeInput_${sub.id}">
                </td>
                <td>
                    <span class="badge ${sub.status === 'Graded' ? 'bg-success' : 'bg-warning'} bg-opacity-10 ${sub.status === 'Graded' ? 'text-success' : 'text-warning'} text-xs">
                        ${sub.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary btn-sm px-2 py-1 text-xs" onclick="submitGrade(${sub.id}, ${assignmentId})">
                        Save Grade
                    </button>
                </td>
            </tr>
        `).join('');
    };

    window.submitGrade = async function(subId, assignmentId) {
        const gradeInput = document.getElementById(`gradeInput_${subId}`);
        const grade = parseFloat(gradeInput.value);

        if (isNaN(grade)) {
            Swal.fire({ icon: 'error', title: 'Invalid Grade', text: 'Please enter a valid numeric grade.' });
            return;
        }

        try {
            await fetch(`/api/teacher/submissions/${subId}/grade`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ grade, feedback: 'Graded by instructor' })
            });
        } catch (e) {}

        Swal.fire({
            icon: 'success',
            title: 'Grade Saved!',
            timer: 1200,
            showConfirmButton: false
        });

        // Update local count
        const assignment = assignmentsList.find(a => a.id == assignmentId);
        if (assignment && assignment.graded_submissions < assignment.total_submissions) {
            assignment.graded_submissions += 1;
            saveLocalAssignments(assignmentsList);
            renderAssignments();
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Initialize
    loadCourses().then(() => loadAssignments());
});
