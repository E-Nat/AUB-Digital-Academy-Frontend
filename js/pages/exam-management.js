// ==========================================
// AUB Digital Academy - Exam & Quiz Management Controller
// Exams (Date+Time, Duration, Attempts), Quizzes (Availability Window), Question Bank, Results
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

    let allExams = [];
    let allQuizzes = [];
    let allQuestions = [];
    let allResults = [];

    // Modals
    const examModalEl = document.getElementById('examModal');
    const examModal = examModalEl ? new bootstrap.Modal(examModalEl) : null;

    const quizModalEl = document.getElementById('quizModal');
    const quizModal = quizModalEl ? new bootstrap.Modal(quizModalEl) : null;

    // Helper: format datetime
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

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 1. Load Data
    async function loadExams() {
        let loaded = false;
        try {
            const res = await fetch(`${API_BASE}/admin/exams`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allExams = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded) {
            // Default seed exams
            allExams = [
                { id: 1, title: 'Midterm Examination: Web Architecture', course_id: 1, course_title: 'Full-Stack Modern Web Architecture', start_datetime: '2026-09-15T09:00', end_datetime: '2026-09-15T11:00', duration_minutes: 90, attempts_allowed: 1, status: 'Scheduled' },
                { id: 2, title: 'Final Algorithms & Data Structures Assessment', course_id: 2, course_title: 'Applied Programming & Algorithms', start_datetime: '2026-09-20T13:30', end_datetime: '2026-09-20T16:00', duration_minutes: 120, attempts_allowed: 1, status: 'Scheduled' },
                { id: 3, title: 'Cybersecurity Defense Practical Exam', course_id: 4, course_title: 'Cybersecurity Fundamentals & Network Defense', start_datetime: '2026-08-28T10:00', end_datetime: '2026-08-28T12:00', duration_minutes: 90, attempts_allowed: 2, status: 'Open' },
                { id: 4, title: 'AI & Neural Networks Midterm Assessment', course_id: 5, course_title: 'Artificial Intelligence & Machine Learning', start_datetime: '2026-08-10T14:00', end_datetime: '2026-08-10T16:00', duration_minutes: 90, attempts_allowed: 1, status: 'Completed' }
            ];
        }
        renderExams(allExams);
    }

    function renderExams(exams) {
        const tbody = document.getElementById('examsTableBody');
        if (!tbody) return;

        if (exams.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No scheduled exams found.</td></tr>`;
            return;
        }

        tbody.innerHTML = exams.map(ex => {
            const statusClass = (ex.status || 'Scheduled').toLowerCase();
            const badgeBg = statusClass === 'open' ? 'bg-success' : statusClass === 'completed' ? 'bg-secondary' : 'bg-primary';
            return `
                <tr>
                    <td class="fw-bold text-dark">${escapeHtml(ex.title)}</td>
                    <td><span class="badge bg-light text-dark border">${escapeHtml(ex.course_title || 'Course')}</span></td>
                    <td class="text-nowrap small text-muted"><i class="bi bi-clock me-1 text-primary"></i>${formatDateTime(ex.start_datetime)}</td>
                    <td class="text-nowrap small text-muted"><i class="bi bi-clock-history me-1 text-danger"></i>${formatDateTime(ex.end_datetime)}</td>
                    <td class="fw-semibold">${ex.duration_minutes || 90} mins</td>
                    <td><span class="badge bg-light text-primary border">${ex.attempts_allowed || 1} attempt${(ex.attempts_allowed || 1) > 1 ? 's' : ''}</span></td>
                    <td><span class="badge ${badgeBg}">${escapeHtml(ex.status || 'Scheduled')}</span></td>
                    <td class="text-nowrap">
                        <button class="btn btn-sm btn-light border py-0 px-2" onclick="editExamAction(${ex.id})" title="Edit Exam">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-light border text-danger py-0 px-2 ms-1" onclick="deleteExamAction(${ex.id})" title="Delete Exam">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 2. Load Quizzes
    function loadQuizzes() {
        allQuizzes = [
            { id: 1, title: 'HTML5 Semantic Layouts Quiz', course_title: 'Full-Stack Modern Web Architecture', start_datetime: '2026-08-01T08:00', end_datetime: '2026-08-30T23:59', time_limit: 30, max_attempts: 3, status: 'Active' },
            { id: 2, title: 'Binary Search & Tree Balancing Quiz', course_title: 'Applied Programming & Algorithms', start_datetime: '2026-08-05T08:00', end_datetime: '2026-09-05T23:59', time_limit: 25, max_attempts: 2, status: 'Active' },
            { id: 3, title: 'Cryptography & PKI Concept Verification', course_title: 'Cybersecurity Fundamentals & Network Defense', start_datetime: '2026-08-10T08:00', end_datetime: '2026-09-10T23:59', time_limit: 45, max_attempts: 3, status: 'Active' },
            { id: 4, title: 'Gradient Descent Optimization Quiz', course_title: 'Artificial Intelligence & Machine Learning', start_datetime: '2026-08-15T08:00', end_datetime: '2026-09-15T23:59', time_limit: 30, max_attempts: 2, status: 'Active' }
        ];
        renderQuizzes(allQuizzes);
    }

    function renderQuizzes(quizzes) {
        const tbody = document.getElementById('quizzesTableBody');
        if (!tbody) return;

        if (quizzes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No quizzes found.</td></tr>`;
            return;
        }

        tbody.innerHTML = quizzes.map(q => `
            <tr>
                <td class="fw-bold text-dark">${escapeHtml(q.title)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(q.course_title || 'Course')}</span></td>
                <td class="text-nowrap small text-muted"><i class="bi bi-calendar2-check me-1 text-success"></i>${formatDateTime(q.start_datetime)}</td>
                <td class="text-nowrap small text-muted"><i class="bi bi-calendar2-x me-1 text-warning"></i>${formatDateTime(q.end_datetime)}</td>
                <td class="fw-semibold">${q.time_limit} mins</td>
                <td><span class="badge bg-light text-primary border">${q.max_attempts} attempts</span></td>
                <td><span class="badge bg-success">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-light border py-0 px-2" title="Manage Quiz Questions">
                        <i class="bi bi-list-check"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 3. Load Question Bank
    function loadQuestionBank() {
        allQuestions = [
            { id: 1, text: 'What is the time complexity of searching in a balanced Binary Search Tree?', topic: 'Data Structures', type: 'Multiple Choice', difficulty: 'Intermediate', points: 5, options: 'A) O(1)  B) O(log n)  C) O(n)  D) O(n log n)', correct: 'B' },
            { id: 2, text: 'Which HTTP response code indicates that the client is not authenticated?', topic: 'Web Development', type: 'Multiple Choice', difficulty: 'Beginner', points: 3, options: 'A) 400  B) 401  C) 403  D) 404', correct: 'B' },
            { id: 3, text: 'Which cryptographic algorithm is asymmetric?', topic: 'Cybersecurity', type: 'Multiple Choice', difficulty: 'Intermediate', points: 5, options: 'A) AES-256  B) RSA-4096  C) DES  D) Blowfish', correct: 'B' },
            { id: 4, text: 'In deep learning, what problem does the vanishing gradient cause?', topic: 'Artificial Intelligence', type: 'Multiple Choice', difficulty: 'Advanced', points: 10, options: 'A) Overfitting  B) Slow/Stalled learning in early layers  C) Exploding weights', correct: 'B' }
        ];
        renderQuestions(allQuestions);
    }

    function renderQuestions(questions) {
        const tbody = document.getElementById('questionsTableBody');
        if (!tbody) return;

        tbody.innerHTML = questions.map(q => `
            <tr>
                <td class="fw-medium text-dark" style="max-width: 280px;">${escapeHtml(q.text)}</td>
                <td><span class="badge bg-light text-secondary border">${escapeHtml(q.topic)}</span></td>
                <td><span class="badge bg-light text-dark">${escapeHtml(q.type)}</span></td>
                <td><span class="badge ${q.difficulty === 'Advanced' ? 'bg-danger bg-opacity-10 text-danger border border-danger' : q.difficulty === 'Intermediate' ? 'bg-warning bg-opacity-15 text-dark border border-warning' : 'bg-success bg-opacity-10 text-success border border-success'}">${escapeHtml(q.difficulty)}</span></td>
                <td class="fw-bold text-primary">${q.points} pts</td>
                <td class="small text-muted font-monospace">${escapeHtml(q.options)}</td>
                <td>
                    <button class="btn btn-sm btn-light border py-0 px-2" title="Edit Question"><i class="bi bi-pencil"></i></button>
                </td>
            </tr>
        `).join('');
    }

    // 4. Load Results
    async function loadResults() {
        let loaded = false;
        try {
            const res = await fetch(`${API_BASE}/admin/exam-results`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allResults = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded) {
            allResults = [
                { id: 1, student_name: 'Sok Virak', university_id: '202401234', exam_title: 'Midterm Examination: Web Architecture', score_obtained: 88, total_score: 100, percentage: 88, grade_letter: 'A', status: 'Passed', submitted_at: '2026-08-16T10:45:00' },
                { id: 2, student_name: 'Chanthou Meas', university_id: '202401235', exam_title: 'Midterm Examination: Web Architecture', score_obtained: 92, total_score: 100, percentage: 92, grade_letter: 'A+', status: 'Passed', submitted_at: '2026-08-16T11:10:00' },
                { id: 3, student_name: 'Dara Keo', university_id: '202401236', exam_title: 'Cybersecurity Defense Practical Exam', score_obtained: 74, total_score: 100, percentage: 74, grade_letter: 'B', status: 'Passed', submitted_at: '2026-08-15T15:20:00' },
                { id: 4, student_name: 'Kanha Rath', university_id: '202401237', exam_title: 'AI & Neural Networks Midterm Assessment', score_obtained: 95, total_score: 100, percentage: 95, grade_letter: 'A+', status: 'Passed', submitted_at: '2026-08-10T15:40:00' },
                { id: 5, student_name: 'Vibol Pen', university_id: '202401238', exam_title: 'Final Algorithms & Data Structures Assessment', score_obtained: 62, total_score: 100, percentage: 62, grade_letter: 'C', status: 'Passed', submitted_at: '2026-08-14T17:00:00' }
            ];
        }
        renderResults(allResults);
    }

    function renderResults(results) {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;

        tbody.innerHTML = results.map(r => `
            <tr>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(r.student_name || 'Student')}</div>
                    <div class="text-muted text-xs" style="font-size: 11px;">ID: ${escapeHtml(r.university_id || '202401000')}</div>
                </td>
                <td class="fw-semibold text-dark">${escapeHtml(r.exam_title || 'Assessment')}</td>
                <td class="fw-bold">${r.score_obtained || r.percentage} / ${r.total_score || 100}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 6px; width: 60px;">
                            <div class="progress-bar bg-primary" style="width: ${r.percentage}%;"></div>
                        </div>
                        <span class="fw-bold text-dark">${r.percentage}%</span>
                    </div>
                </td>
                <td><span class="badge bg-primary bg-opacity-10 text-primary border border-primary fw-bold px-2">${r.grade_letter || 'A'}</span></td>
                <td><span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="bi bi-check-circle me-1"></i>${r.status || 'Passed'}</span></td>
                <td class="small text-muted">${formatDateTime(r.submitted_at)}</td>
            </tr>
        `).join('');
    }

    // 5. Populate Select dropdowns
    function populateDropdowns() {
        const courseSelect = document.getElementById('examCourseSelect');
        const quizCourseSelect = document.getElementById('quizCourseSelect');
        const insSelect = document.getElementById('examInstructorSelect');

        if (window.AdminStore) {
            const courses = window.AdminStore.getCourses();
            const courseOpts = courses.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
            if (courseSelect) courseSelect.innerHTML = courseOpts;
            if (quizCourseSelect) quizCourseSelect.innerHTML = courseOpts;

            const teachers = window.AdminStore.getUsers().filter(u => (u.role || '').toUpperCase() === 'TEACHER');
            if (insSelect) {
                insSelect.innerHTML = teachers.map(t => `<option value="${t.id}">${escapeHtml(t.full_name)}</option>`).join('');
            }
        }
    }

    // 6. Schedule Exam Validation & Submit (Requirement 5)
    const examForm = document.getElementById('examForm');
    if (examForm) {
        examForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const title = document.getElementById('examTitle').value.trim();
            const courseId = document.getElementById('examCourseSelect').value;
            const insId = document.getElementById('examInstructorSelect').value;
            const examType = document.getElementById('examType').value;
            const startDt = document.getElementById('examStartDatetime').value;
            const endDt = document.getElementById('examEndDatetime').value;
            const duration = parseInt(document.getElementById('examDuration').value, 10);
            const attempts = parseInt(document.getElementById('examAttempts').value, 10);
            const passingScore = parseInt(document.getElementById('examPassingScore').value, 10);
            const desc = document.getElementById('examDesc').value.trim();

            if (!title || !courseId || !startDt || !endDt) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Please fill in all required fields.', 'error');
                return;
            }

            // Strict Validation: Exam Start < Exam End
            const startMs = new Date(startDt).getTime();
            const endMs = new Date(endDt).getTime();
            if (endMs <= startMs) {
                const feedback = document.getElementById('examTimeFeedback');
                if (feedback) feedback.style.display = 'block';
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Invalid Exam Timing', 'Exam End Date & Time must be strictly after Exam Start Date & Time.');
                return;
            }

            // Duration check: duration must fit within start and end window
            const windowMinutes = (endMs - startMs) / (1000 * 60);
            if (duration > windowMinutes) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Duration Exceeds Window', `Exam duration (${duration} mins) exceeds total availability window (${Math.round(windowMinutes)} mins).`);
                return;
            }

            const payload = {
                title,
                course_id: parseInt(courseId, 10),
                instructor_id: insId ? parseInt(insId, 10) : null,
                exam_type: examType,
                start_datetime: startDt,
                end_datetime: endDt,
                duration_minutes: duration,
                attempts_allowed: attempts || 1,
                passing_score: passingScore || 50,
                description: desc,
                status: 'Scheduled'
            };

            const course = window.AdminStore ? window.AdminStore.getCourseById(courseId) : null;
            allExams.unshift({
                id: allExams.length + 1,
                ...payload,
                course_title: course ? course.title : 'Course'
            });

            if (examModal) examModal.hide();
            renderExams(allExams);

            if (window.AdminStore) {
                window.AdminStore.constructor.notifySuccess('Exam Scheduled', `"${title}" has been successfully scheduled.`);
            }

            // API Sync
            try {
                await fetch(`${API_BASE}/admin/exams`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });
            } catch (err) {}
        });
    }

    // 7. Create Quiz Validation & Submit (Requirement 6)
    const quizForm = document.getElementById('quizForm');
    if (quizForm) {
        quizForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const title = document.getElementById('quizTitle').value.trim();
            const courseId = document.getElementById('quizCourseSelect').value;
            const startDt = document.getElementById('quizStartDatetime').value;
            const endDt = document.getElementById('quizEndDatetime').value;
            const timeLimit = parseInt(document.getElementById('quizTimeLimit').value, 10);
            const maxAttempts = parseInt(document.getElementById('quizMaxAttempts').value, 10);

            if (!title || !courseId || !startDt || !endDt) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Please fill in all required quiz fields.', 'error');
                return;
            }

            if (new Date(endDt).getTime() <= new Date(startDt).getTime()) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Invalid Availability Window', 'Quiz Availability Closes must be strictly after Availability Opens.');
                return;
            }

            const course = window.AdminStore ? window.AdminStore.getCourseById(courseId) : null;
            allQuizzes.unshift({
                id: allQuizzes.length + 1,
                title,
                course_id: courseId,
                course_title: course ? course.title : 'Course',
                start_datetime: startDt,
                end_datetime: endDt,
                time_limit: timeLimit,
                max_attempts: maxAttempts,
                status: 'Active'
            });

            if (quizModal) quizModal.hide();
            renderQuizzes(allQuizzes);

            if (window.AdminStore) {
                window.AdminStore.constructor.notifySuccess('Quiz Created', `"${title}" availability window configured.`);
            }
        });
    }

    // Modal Trigger Buttons
    const createExamBtn = document.getElementById('createExamBtn');
    if (createExamBtn) {
        createExamBtn.addEventListener('click', () => {
            if (examForm) examForm.reset();
            const now = new Date();
            const startStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 16);
            const endStr = new Date(now.getTime() + 86400000 + 7200000).toISOString().slice(0, 16);
            document.getElementById('examStartDatetime').value = startStr;
            document.getElementById('examEndDatetime').value = endStr;
            populateDropdowns();
            if (examModal) examModal.show();
        });
    }

    const createQuizBtn = document.getElementById('createQuizBtn');
    if (createQuizBtn) {
        createQuizBtn.addEventListener('click', () => {
            if (quizForm) quizForm.reset();
            const now = new Date();
            const startStr = now.toISOString().slice(0, 16);
            const endStr = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 16);
            document.getElementById('quizStartDatetime').value = startStr;
            document.getElementById('quizEndDatetime').value = endStr;
            populateDropdowns();
            if (quizModal) quizModal.show();
        });
    }

    // Filter Listeners
    const examFilter = document.getElementById('examFilterSearch');
    if (examFilter) {
        examFilter.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            renderExams(allExams.filter(ex => ex.title.toLowerCase().includes(q) || (ex.course_title || '').toLowerCase().includes(q)));
        });
    }

    const quizFilter = document.getElementById('quizFilterSearch');
    if (quizFilter) {
        quizFilter.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            renderQuizzes(allQuizzes.filter(qz => qz.title.toLowerCase().includes(q) || (qz.course_title || '').toLowerCase().includes(q)));
        });
    }

    // Initial Execution
    populateDropdowns();
    loadExams();
    loadQuizzes();
    loadQuestionBank();
    loadResults();
});
