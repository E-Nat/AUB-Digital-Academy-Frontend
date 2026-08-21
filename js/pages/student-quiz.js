// ==========================================================================
// AUB Digital Academy - Student Quiz Controller
// Connects Student UI to Verified REST APIs: /api/student/quizzes/:id & /submit
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

    // URL Query Param Check
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    // UI View Elements
    const quizListView = document.getElementById('quizListView');
    const quizTakingView = document.getElementById('quizTakingView');
    const quizResultView = document.getElementById('quizResultView');

    // Student Header Info
    const studentName = localStorage.getItem('user_full_name') || 'Sok Virak';
    const studentNameEl = document.getElementById('studentName');
    if (studentNameEl) studentNameEl.textContent = studentName;

    // State for Active Quiz
    let currentQuiz = null;
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    const studentAnswers = {}; // Map of { [question_id]: selected_option_index }

    if (!quizId) {
        // Mode 1: List View
        quizListView.style.display = 'block';
        await loadAvailableQuizzes();
    } else {
        // Mode 2: Take Quiz View
        quizTakingView.style.display = 'block';
        await loadQuizData(quizId);
    }

    // ==========================================================================
    // 1. LOAD AVAILABLE QUIZZES (List View)
    // ==========================================================================
    async function loadAvailableQuizzes() {
        const container = document.getElementById('availableQuizzesContainer');
        try {
            const res = await fetch(`${API_BASE}/admin/exams`, { headers: getHeaders() });
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const available = json.data.filter(q => q.status === 'Published' || q.status === 'Open' || q.status === 'Scheduled');
                    
                    if (available.length === 0) {
                        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No assessments currently available.</div>`;
                        return;
                    }

                    container.innerHTML = available.map(q => `
                        <div class="col-md-6 col-lg-4">
                            <div class="quiz-card p-4 h-100 d-flex flex-column justify-content-between">
                                <div>
                                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 mb-2">${escapeHtml(q.course_title || 'Enrolled Course')}</span>
                                    <h5 class="fw-bold mb-2">${escapeHtml(q.title)}</h5>
                                    <p class="text-muted small mb-3">${escapeHtml(q.description || 'Complete this assessment before the deadline.')}</p>
                                </div>
                                <div>
                                    <div class="d-flex justify-content-between text-muted small mb-3 border-top pt-2">
                                        <span><i class="bi bi-clock me-1"></i>${q.duration_minutes || 30} mins</span>
                                        <span><i class="bi bi-award me-1"></i>Pass: ${q.passing_score || 60}%</span>
                                    </div>
                                    <a href="quiz.html?id=${q.id}" class="btn btn-primary w-100">
                                        <i class="bi bi-play-circle me-1"></i> Start Assessment
                                    </a>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    return;
                }
            }
        } catch (e) {
            console.error('Error fetching quiz list:', e);
        }
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No assessments found.</div>`;
    }

    // ==========================================================================
    // 2. LOAD ACTIVE QUIZ DATA (Calls GET /api/student/quizzes/:id)
    // ==========================================================================
    async function loadQuizData(id) {
        const errorBanner = document.getElementById('quizErrorBanner');
        const errorMessage = document.getElementById('quizErrorMessage');
        const activeContent = document.getElementById('quizActiveContent');

        try {
            const res = await fetch(`${API_BASE}/student/quizzes/${id}`, { headers: getHeaders() });
            const data = await res.json();

            if (!res.ok || !data.success) {
                // Display Clear Authorization / Status Error Message
                errorBanner.classList.remove('d-none');
                errorMessage.textContent = data.message || 'Access Denied: Unable to access this quiz.';
                activeContent.classList.add('d-none');

                Swal.fire({
                    icon: 'warning',
                    title: 'Assessment Notice',
                    text: data.message || 'You cannot access this assessment.',
                    confirmButtonText: 'Back to Learning Portal'
                }).then(() => {
                    window.location.href = 'dashboard.html';
                });
                return;
            }

            // Successfully Loaded
            currentQuiz = data.data;
            currentQuestions = currentQuiz.questions || [];

            if (currentQuestions.length === 0) {
                errorBanner.classList.remove('d-none');
                errorMessage.textContent = 'This assessment has no questions registered yet.';
                activeContent.classList.add('d-none');
                return;
            }

            // Populate Metadata
            document.getElementById('topbarQuizTitle').textContent = currentQuiz.title;
            document.getElementById('quizDisplayTitle').textContent = currentQuiz.title;
            document.getElementById('courseBadge').textContent = currentQuiz.course_title || 'Enrolled Course';
            document.getElementById('quizDisplayDesc').textContent = currentQuiz.description || 'Read each question carefully and select your best answer.';
            document.getElementById('totalQsBadge').textContent = `${currentQuestions.length} Questions`;
            document.getElementById('timeRemaining').textContent = `${currentQuiz.duration_minutes || 30} mins`;

            currentQuestionIndex = 0;
            renderCurrentQuestion();

        } catch (err) {
            console.error('loadQuizData error:', err);
            errorBanner.classList.remove('d-none');
            errorMessage.textContent = 'Server connection error. Please check your network and try again.';
            activeContent.classList.add('d-none');
        }
    }

    // ==========================================================================
    // 3. RENDER CURRENT QUESTION & OPTIONS
    // ==========================================================================
    function renderCurrentQuestion() {
        if (!currentQuestions || currentQuestions.length === 0) return;

        const q = currentQuestions[currentQuestionIndex];
        document.getElementById('questionNumberIndicator').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
        document.getElementById('questionPointsIndicator').textContent = `${q.points || 10} Points`;
        document.getElementById('questionText').textContent = q.question_text;

        const optionsContainer = document.getElementById('optionsContainer');
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const selectedOpt = studentAnswers[q.id];

        optionsContainer.innerHTML = (q.options || []).map((optText, idx) => {
            const isSelected = selectedOpt !== undefined && selectedOpt === idx;
            return `
                <div class="qcm-option-card ${isSelected ? 'selected' : ''}" onclick="selectOption(${q.id}, ${idx})">
                    <span class="qcm-letter-badge">${letters[idx] || (idx + 1)}</span>
                    <span class="fw-medium text-dark flex-grow-1">${escapeHtml(optText)}</span>
                    ${isSelected ? '<i class="bi bi-check-circle-fill text-primary fs-5"></i>' : ''}
                </div>
            `;
        }).join('');

        // Navigation Button states
        document.getElementById('prevQuestionBtn').disabled = currentQuestionIndex === 0;

        const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
        const nextBtn = document.getElementById('nextQuestionBtn');
        const submitBtn = document.getElementById('submitQuizBtn');

        if (isLastQuestion) {
            nextBtn.classList.add('d-none');
            submitBtn.classList.remove('d-none');
        } else {
            nextBtn.classList.remove('d-none');
            submitBtn.classList.add('d-none');
        }
    }

    // Option Selection Callback
    window.selectOption = function (questionId, optionIndex) {
        studentAnswers[questionId] = optionIndex;
        renderCurrentQuestion();
    };

    // Navigation Listeners
    document.getElementById('prevQuestionBtn')?.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderCurrentQuestion();
        }
    });

    document.getElementById('nextQuestionBtn')?.addEventListener('click', () => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            renderCurrentQuestion();
        }
    });

    // ==========================================================================
    // 4. SUBMIT ASSESSMENT (Calls POST /api/student/quizzes/:id/submit)
    // ==========================================================================
    document.getElementById('submitQuizBtn')?.addEventListener('click', async function () {
        const answeredCount = Object.keys(studentAnswers).length;
        const totalCount = currentQuestions.length;

        const confirmMsg = answeredCount < totalCount
            ? `You answered ${answeredCount} of ${totalCount} questions. Are you sure you want to submit?`
            : `Submit your answers for authoritative server evaluation?`;

        const result = await Swal.fire({
            title: 'Ready to Submit?',
            text: confirmMsg,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit Now',
            cancelButtonText: 'Review Answers',
            confirmButtonColor: '#2563eb'
        });

        if (!result.isConfirmed) return;

        const submitBtn = document.getElementById('submitQuizBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Evaluating...';

        try {
            const res = await fetch(`${API_BASE}/student/quizzes/${quizId}/submit`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ answers: studentAnswers })
            });
            const data = await res.json();

            if (res.ok && data.success && data.results) {
                renderScoreResult(data.results);
            } else {
                Swal.fire('Submission Error', data.message || 'Failed to submit quiz.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Submit Assessment';
            }
        } catch (err) {
            console.error('Submit error:', err);
            Swal.fire('Error', 'Unable to connect to grading server.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Submit Assessment';
        }
    });

    // ==========================================================================
    // 5. RENDER AUTHORITATIVE SERVER SCORE
    // ==========================================================================
    function renderScoreResult(results) {
        quizTakingView.style.display = 'none';
        quizResultView.style.display = 'block';

        document.getElementById('resultQuizTitle').textContent = currentQuiz?.title || 'Quiz Assessment';
        document.getElementById('resultScore').textContent = `${results.score} / ${results.total_marks}`;
        document.getElementById('resultPercentage').textContent = `${results.percentage}%`;
        document.getElementById('resultCorrect').textContent = `${results.correct_count} Correct`;
        document.getElementById('resultWrong').textContent = `${results.wrong_count} Wrong`;
        document.getElementById('resultAttempt').textContent = `Attempt #${results.attempt_number || 1}`;

        const isPassed = results.status === 'Passed';
        const statusText = document.getElementById('resultStatusText');
        const iconEl = document.getElementById('resultIcon');
        const percentageEl = document.getElementById('resultPercentage');

        if (isPassed) {
            statusText.textContent = 'Congratulations! You Passed!';
            statusText.className = 'fw-bold mb-1 text-success';
            percentageEl.className = 'h2 fw-bold mb-0 text-success';
            iconEl.innerHTML = '<i class="bi bi-check-circle-fill text-success" style="font-size: 4.5rem;"></i>';
        } else {
            statusText.textContent = 'Assessment Incomplete / Failed';
            statusText.className = 'fw-bold mb-1 text-danger';
            percentageEl.className = 'h2 fw-bold mb-0 text-danger';
            iconEl.innerHTML = '<i class="bi bi-x-circle-fill text-danger" style="font-size: 4.5rem;"></i>';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
