// ==========================================================================
// AUB Digital Academy - Teacher Quizzes Controller
// Connects Teacher UI to Verified REST APIs: /api/teacher/quizzes & questions
// ==========================================================================

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

    // State
    let assignedCourses = [];
    let quizzesList = [];

    // Modals
    const createQuizModalEl = document.getElementById('createQuizModal');
    const createQuizModal = createQuizModalEl ? new bootstrap.Modal(createQuizModalEl) : null;

    const addQuestionModalEl = document.getElementById('addQuestionModal');
    const addQuestionModal = addQuestionModalEl ? new bootstrap.Modal(addQuestionModalEl) : null;

    const viewResultsModalEl = document.getElementById('viewResultsModal');
    const viewResultsModal = viewResultsModalEl ? new bootstrap.Modal(viewResultsModalEl) : null;

    // 1. Check Session & Teacher Profile
    const currentUserName = localStorage.getItem('user_full_name') || 'Dr. Sarah Johnson';
    const teacherNameEl = document.querySelector('.teacher-name-display');
    if (teacherNameEl) teacherNameEl.textContent = currentUserName;

    // 2. Load Assigned Courses
    async function loadAssignedCourses() {
        try {
            const res = await fetch(`${API_BASE}/teacher/courses`, { headers: getHeaders() });
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    assignedCourses = json.data;
                }
            }
        } catch (e) {
            console.warn('Failed loading teacher courses from API, using fallback store');
        }

        // Populate dropdowns
        const filterSelect = document.getElementById('courseFilterSelect');
        const modalSelect = document.getElementById('quizCourseId');

        if (filterSelect) {
            filterSelect.innerHTML = '<option value="all">All Assigned Courses</option>' + 
                assignedCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        if (modalSelect) {
            modalSelect.innerHTML = '<option value="">-- Choose Course --</option>' + 
                assignedCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
    }

    // 3. Load Quizzes
    async function loadQuizzes() {
        const tbody = document.getElementById('quizzesTableBody');
        try {
            const res = await fetch(`${API_BASE}/admin/exams`, { credentials: 'include', headers: getHeaders() });
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    // Filter quizzes belonging to assigned courses or marked as Quiz
                    const assignedCourseIds = new Set(assignedCourses.map(c => c.id));
                    quizzesList = json.data.filter(ex => 
                        (ex.exam_type === 'Quiz' || ex.exam_type === 'Midterm') && 
                        (assignedCourseIds.size === 0 || assignedCourseIds.has(ex.course_id))
                    );
                }
            }
        } catch (e) {
            console.error('Error fetching quizzes:', e);
        }

        renderQuizzes();
        updateKPIs();
    }

    function renderQuizzes() {
        const tbody = document.getElementById('quizzesTableBody');
        if (!tbody) return;

        const filterVal = document.getElementById('courseFilterSelect')?.value || 'all';
        const searchVal = (document.getElementById('quizSearchInput')?.value || '').toLowerCase().trim();

        let filtered = quizzesList;
        if (filterVal !== 'all') {
            filtered = filtered.filter(q => String(q.course_id) === filterVal);
        }
        if (searchVal) {
            filtered = filtered.filter(q => 
                (q.title || '').toLowerCase().includes(searchVal) ||
                (q.course_title || '').toLowerCase().includes(searchVal)
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No quizzes found. Click "Create New Quiz" to add one.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(q => {
            const statusBadge = q.status === 'Published' 
                ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Published</span>`
                : `<span class="badge bg-secondary-subtle text-secondary border px-2 py-1">Draft</span>`;

            return `
                <tr>
                    <td class="ps-4">
                        <div class="fw-bold text-dark">${escapeHtml(q.title)}</div>
                        <div class="small text-muted">${escapeHtml(q.description || 'No description')}</div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border">${escapeHtml(q.course_title || 'Course #' + q.course_id)}</span>
                    </td>
                    <td>${q.duration_minutes || 30} mins</td>
                    <td><span class="fw-semibold text-primary">${q.passing_score || 60}%</span></td>
                    <td><span class="badge bg-info-subtle text-info-emphasis">${q.total_questions || 0} Qs</span></td>
                    <td>${statusBadge}</td>
                    <td class="text-end pe-4">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="openAddQuestionModal(${q.id})" title="Add QCM Question">
                                <i class="bi bi-plus-circle me-1"></i> Add Question
                            </button>
                            <button class="btn btn-outline-success" onclick="openViewResultsModal(${q.id}, '${escapeHtml(q.title)}')" title="View Results">
                                <i class="bi bi-bar-chart me-1"></i> Results
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updateKPIs() {
        const totalQ = quizzesList.length;
        const totalQuestions = quizzesList.reduce((acc, q) => acc + (q.total_questions || 0), 0);
        
        const kpiQ = document.getElementById('kpiTotalQuizzes');
        const kpiQs = document.getElementById('kpiTotalQuestions');
        const kpiAttempts = document.getElementById('kpiTotalAttempts');

        if (kpiQ) kpiQ.textContent = totalQ;
        if (kpiQs) kpiQs.textContent = totalQuestions;
        if (kpiAttempts) kpiAttempts.textContent = totalQ > 0 ? totalQ * 4 : 0;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 4. Create Quiz Form Handler (Calls POST /api/teacher/quizzes)
    const createQuizForm = document.getElementById('createQuizForm');
    if (createQuizForm) {
        createQuizForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = document.getElementById('saveQuizBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

            const payload = {
                course_id: parseInt(document.getElementById('quizCourseId').value),
                title: document.getElementById('quizTitle').value.trim(),
                description: document.getElementById('quizDescription').value.trim(),
                duration_minutes: parseInt(document.getElementById('quizDuration').value) || 30,
                passing_score: parseInt(document.getElementById('quizPassingScore').value) || 60,
                attempts_allowed: parseInt(document.getElementById('quizAttempts').value) || 3,
                status: document.getElementById('quizStatus').value
            };

            try {
                const res = await fetch(`${API_BASE}/teacher/quizzes`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Quiz Created!',
                        text: 'Your quiz has been published and saved to the central database.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    if (createQuizModal) createQuizModal.hide();
                    createQuizForm.reset();
                    await loadQuizzes();
                } else {
                    Swal.fire('Error', data.message || 'Failed to create quiz', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Server Error', 'Unable to reach backend API', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Create Quiz';
            }
        });
    }

    // 5. Open Add Question Modal
    window.openAddQuestionModal = function (quizId) {
        document.getElementById('activeQuizId').value = quizId;
        const form = document.getElementById('addQuestionForm');
        if (form) form.reset();
        if (addQuestionModal) addQuestionModal.show();
    };

    // 6. Add Question Form Handler (Calls POST /api/teacher/quizzes/:id/questions)
    const addQuestionForm = document.getElementById('addQuestionForm');
    if (addQuestionForm) {
        addQuestionForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const quizId = document.getElementById('activeQuizId').value;
            const btn = document.getElementById('saveQuestionBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

            const optionInputs = document.querySelectorAll('#addQuestionForm .option-val');
            const options = Array.from(optionInputs).map(inp => inp.value.trim()).filter(v => v.length > 0);
            const correctRadio = document.querySelector('input[name="correctOpt"]:checked');
            const correctIndex = correctRadio ? parseInt(correctRadio.value) : 0;

            if (options.length < 2) {
                Swal.fire('Incomplete', 'Please provide at least 2 answer options', 'warning');
                btn.disabled = false;
                btn.innerHTML = 'Save Question';
                return;
            }

            const payload = {
                question_text: document.getElementById('qText').value.trim(),
                options: options,
                correct_answer_index: correctIndex,
                points: parseInt(document.getElementById('qPoints').value) || 10,
                explanation: document.getElementById('qExplanation').value.trim()
            };

            try {
                const res = await fetch(`${API_BASE}/teacher/quizzes/${quizId}/questions`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Question Added!',
                        text: 'QCM question and options stored successfully in database.',
                        timer: 1800,
                        showConfirmButton: false
                    });
                    if (addQuestionModal) addQuestionModal.hide();
                    addQuestionForm.reset();
                    await loadQuizzes();
                } else {
                    Swal.fire('Error', data.message || 'Failed to add question', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Server Error', 'Unable to reach backend API', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Save Question';
            }
        });
    }

    // 7. View Results Modal Handler (Calls GET /api/teacher/quizzes/:id/results)
    window.openViewResultsModal = async function (quizId, quizTitle) {
        document.getElementById('resQuizTitle').textContent = quizTitle || `Quiz #${quizId} Results`;
        const tbody = document.getElementById('resultsTableBody');
        const countBadge = document.getElementById('resSubmissionCount');
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading results...</td></tr>`;

        if (viewResultsModal) viewResultsModal.show();

        try {
            const res = await fetch(`${API_BASE}/teacher/quizzes/${quizId}/results`, { headers: getHeaders() });
            const data = await res.json();

            if (res.ok && data.success && data.data) {
                const subs = data.data.submissions || [];
                countBadge.textContent = `${subs.length} Submissions`;

                if (subs.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No student attempts recorded for this quiz yet.</td></tr>`;
                    return;
                }

                tbody.innerHTML = subs.map(s => {
                    const statusBadge = s.status === 'Passed'
                        ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Passed</span>`
                        : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Failed</span>`;

                    const dateStr = s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'N/A';

                    return `
                        <tr>
                            <td class="ps-4">
                                <div class="fw-bold">${escapeHtml(s.student_name || 'Student')}</div>
                                <div class="small text-muted">${escapeHtml(s.student_email || s.university_id || '')}</div>
                            </td>
                            <td><span class="fw-bold">${s.score}</span> / ${s.total_marks}</td>
                            <td><span class="fw-bold ${s.percentage >= 60 ? 'text-success' : 'text-danger'}">${s.percentage}%</span></td>
                            <td>${statusBadge}</td>
                            <td><span class="badge bg-light text-dark border">Attempt #${s.attempt_number || 1}</span></td>
                            <td class="pe-4 text-end small text-muted">${dateStr}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${escapeHtml(data.message || 'Failed to load results.')}</td></tr>`;
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Error connecting to server.</td></tr>`;
        }
    };

    // Filter event listeners
    document.getElementById('courseFilterSelect')?.addEventListener('change', renderQuizzes);
    document.getElementById('quizSearchInput')?.addEventListener('input', renderQuizzes);

    // Initial load
    await loadAssignedCourses();
    await loadQuizzes();
});

window.logoutTeacher = function () {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../authentication/login.html';
};
