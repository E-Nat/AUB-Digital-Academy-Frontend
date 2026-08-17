/**
 * Student Assignments & Coursework
 * AUB Digital Academy - Student Portal
 */

document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    try {
        const stored = localStorage.getItem('aub_user');
        if (stored) currentUser = JSON.parse(stored);
    } catch (e) {}

    if (!currentUser) {
        currentUser = {
            id: 1,
            full_name: 'Sok Virak',
            university_id: '0001001',
            email: 'sok.virak@aub.edu.kh',
            role_id: 3,
            avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150'
        };
    }

    const studentNameEl = document.getElementById('studentName');
    const topbarStudentNameEl = document.getElementById('topbarStudentName');
    const studentAvatarEl = document.getElementById('studentAvatar');
    const topbarAvatarEl = document.getElementById('topbarAvatar');

    if (studentNameEl) studentNameEl.textContent = currentUser.full_name;
    if (topbarStudentNameEl) topbarStudentNameEl.textContent = currentUser.full_name;
    if (studentAvatarEl && currentUser.avatar_url) studentAvatarEl.src = currentUser.avatar_url;
    if (topbarAvatarEl && currentUser.avatar_url) topbarAvatarEl.src = currentUser.avatar_url;

    let assignmentsList = [];
    let mySubmissions = {};
    let currentStatusFilter = 'ALL';
    let searchQuery = '';

    const listContainer = document.getElementById('studentAssignmentsList');
    const searchInput = document.getElementById('searchAssignments');
    const submissionForm = document.getElementById('submissionForm');
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    const MOCK_ASSIGNMENTS = [
        {
            id: 1,
            course_id: 1,
            course_title: 'Full-Stack Web Development',
            teacher_name: 'Dr. Sarah Johnson',
            title: 'Milestone 1: Database Architecture & RESTful API Setup',
            description: 'Design the relational database schema, configure Express routes, and write comprehensive seed scripts.',
            due_date: '2026-08-25T23:59',
            total_points: 100,
            submission_type: 'GitHub Link',
            attachment_url: 'https://github.com/aub-academy/starter-milestone1',
            status: 'Published'
        },
        {
            id: 2,
            course_id: 2,
            course_title: 'Advanced UI/UX Design',
            teacher_name: 'Dr. Sarah Johnson',
            title: 'Design System & Interactive Mobile Prototype in Figma',
            description: 'Create a consistent typography scale, color tokens, reusable components, and high-fidelity wireframes.',
            due_date: '2026-08-22T18:00',
            total_points: 100,
            submission_type: 'File Upload',
            attachment_url: '',
            status: 'Published'
        }
    ];

    function loadSubmissions() {
        const stored = localStorage.getItem('aub_student_submissions');
        if (stored) {
            try { mySubmissions = JSON.parse(stored); } catch (e) {}
        } else {
            mySubmissions = {
                2: {
                    status: 'Graded',
                    submitted_at: '2026-08-21T11:00',
                    grade: 96,
                    feedback: 'Beautiful design system typography and clean Figma layout.'
                }
            };
            localStorage.setItem('aub_student_submissions', JSON.stringify(mySubmissions));
        }
    }

    function loadAssignments() {
        // Read from teacher assignments or fallback
        const storedTeacher = localStorage.getItem('aub_teacher_assignments');
        if (storedTeacher) {
            try {
                const parsed = JSON.parse(storedTeacher);
                assignmentsList = parsed.filter(a => a.status === 'Published');
            } catch (e) {
                assignmentsList = MOCK_ASSIGNMENTS;
            }
        } else {
            assignmentsList = MOCK_ASSIGNMENTS;
        }

        renderAssignments();
        updateKPISummaries();
    }

    function renderAssignments() {
        let filtered = assignmentsList.filter(item => {
            const sub = mySubmissions[item.id];
            const isSubmitted = !!sub;
            const isGraded = sub?.status === 'Graded';

            if (currentStatusFilter === 'Pending' && isSubmitted) return false;
            if (currentStatusFilter === 'Submitted' && (!isSubmitted || isGraded)) return false;
            if (currentStatusFilter === 'Graded' && !isGraded) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const titleMatch = item.title?.toLowerCase().includes(q);
                const courseMatch = item.course_title?.toLowerCase().includes(q);
                if (!titleMatch && !courseMatch) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="card p-5 text-center bg-white border rounded-3">
                    <i class="bi bi-check2-all text-success" style="font-size: 3rem;"></i>
                    <h5 class="fw-bold mt-3 text-dark">No Pending Coursework</h5>
                    <p class="text-muted text-sm mb-0">You are all caught up on assignments for your enrolled courses!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(assignment => {
            const sub = mySubmissions[assignment.id];
            const dueFormatted = assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'No Deadline';

            let submissionBadge = '';
            let actionBtn = '';

            if (sub && sub.status === 'Graded') {
                submissionBadge = `<span class="badge bg-success bg-opacity-10 text-success fw-bold px-2.5 py-1 rounded"><i class="bi bi-award-fill me-1"></i> Graded: ${sub.grade} / ${assignment.total_points || 100}</span>`;
                actionBtn = `<button class="btn btn-outline-success btn-sm px-3" disabled><i class="bi bi-check-circle me-1"></i> Completed</button>`;
            } else if (sub) {
                submissionBadge = `<span class="badge bg-info bg-opacity-10 text-info fw-bold px-2.5 py-1 rounded"><i class="bi bi-clock-fill me-1"></i> Submitted (${new Date(sub.submitted_at).toLocaleDateString()})</span>`;
                actionBtn = `<button class="btn btn-outline-secondary btn-sm px-3" onclick="openSubmitModal(${assignment.id})"><i class="bi bi-arrow-repeat me-1"></i> Re-submit</button>`;
            } else {
                submissionBadge = `<span class="badge bg-warning bg-opacity-10 text-warning fw-bold px-2.5 py-1 rounded"><i class="bi bi-hourglass-top me-1"></i> Due Soon</span>`;
                actionBtn = `<button class="btn btn-primary btn-sm px-4" onclick="openSubmitModal(${assignment.id})"><i class="bi bi-cloud-upload me-1"></i> Submit Work</button>`;
            }

            return `
                <div class="assignment-card">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                        <div class="flex-grow-1">
                            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                                <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2.5 py-1 rounded-pill text-xs">
                                    <i class="bi bi-book me-1"></i> ${escapeHtml(assignment.course_title || 'Course')}
                                </span>
                                ${submissionBadge}
                                <span class="badge bg-light text-dark border text-xs px-2 py-1">
                                    <i class="bi bi-award me-1 text-primary"></i> ${assignment.total_points || 100} Max Points
                                </span>
                            </div>

                            <h4 class="fw-bold text-dark mb-2 fs-5">${escapeHtml(assignment.title)}</h4>
                            <p class="text-muted text-sm mb-3">${escapeHtml(assignment.description)}</p>

                            ${sub?.feedback ? `
                                <div class="bg-light p-3 rounded-2 border-start border-success border-3 mb-3">
                                    <div class="text-xs fw-bold text-success text-uppercase mb-1"><i class="bi bi-chat-quote-fill me-1"></i> Instructor Feedback:</div>
                                    <div class="text-sm text-dark">${escapeHtml(sub.feedback)}</div>
                                </div>
                            ` : ''}

                            <div class="d-flex flex-wrap align-items-center gap-3 text-xs text-muted">
                                <div class="d-flex align-items-center gap-1 text-danger fw-semibold">
                                    <i class="bi bi-alarm"></i>
                                    <span>Deadline: ${dueFormatted}</span>
                                </div>
                                <div class="d-flex align-items-center gap-1">
                                    <i class="bi bi-person-badge"></i>
                                    <span>Instructor: ${escapeHtml(assignment.teacher_name || 'Faculty')}</span>
                                </div>
                                ${assignment.attachment_url ? `
                                    <a href="${escapeHtml(assignment.attachment_url)}" target="_blank" class="text-primary text-decoration-none d-flex align-items-center gap-1 fw-semibold">
                                        <i class="bi bi-download"></i> Starter Files
                                    </a>
                                ` : ''}
                            </div>
                        </div>

                        <div class="d-flex flex-row flex-md-column align-items-end justify-content-between gap-3 w-100 w-md-auto pt-3 pt-md-0">
                            ${actionBtn}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateKPISummaries() {
        const total = assignmentsList.length;
        let submittedCount = 0;
        let gradedCount = 0;

        assignmentsList.forEach(a => {
            if (mySubmissions[a.id]) {
                submittedCount++;
                if (mySubmissions[a.id].status === 'Graded') gradedCount++;
            }
        });

        const pendingCount = total - submittedCount;

        document.getElementById('statPendingAssignments').textContent = Math.max(0, pendingCount);
        document.getElementById('statSubmittedAssignments').textContent = submittedCount;
        document.getElementById('statGradedAssignments').textContent = gradedCount;

        document.getElementById('countAll').textContent = total;
        document.getElementById('countPending').textContent = Math.max(0, pendingCount);
        document.getElementById('countSubmitted').textContent = submittedCount - gradedCount;
        document.getElementById('countGraded').textContent = gradedCount;
    }

    document.querySelectorAll('#statusFilterTabs .filter-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statusFilterTabs .filter-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.getAttribute('data-status');
            renderAssignments();
        });
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderAssignments();
    });

    window.openSubmitModal = function(assignmentId) {
        const assignment = assignmentsList.find(a => a.id == assignmentId);
        if (!assignment) return;

        document.getElementById('submitAssignmentId').value = assignmentId;
        document.getElementById('submitModalTitle').textContent = `Submit Work: ${assignment.title}`;
        document.getElementById('submissionUrl').value = '';
        document.getElementById('submissionComments').value = '';

        submitModal.show();
    };

    submissionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const assignmentId = document.getElementById('submitAssignmentId').value;
        const url = document.getElementById('submissionUrl').value.trim();
        const comments = document.getElementById('submissionComments').value.trim();

        mySubmissions[assignmentId] = {
            status: 'Submitted',
            file_url: url,
            comments: comments,
            submitted_at: new Date().toISOString(),
            grade: null,
            feedback: ''
        };

        localStorage.setItem('aub_student_submissions', JSON.stringify(mySubmissions));
        submitModal.hide();
        renderAssignments();
        updateKPISummaries();

        Swal.fire({
            icon: 'success',
            title: 'Coursework Submitted!',
            text: 'Your instructor has received your submission and will review it shortly.',
            timer: 2000,
            showConfirmButton: false
        });
    });

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    loadSubmissions();
    loadAssignments();
});
