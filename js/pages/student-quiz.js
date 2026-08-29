// ==========================================================================
// AUB Digital Academy - Student Quiz Controller
// Connects Student UI to REST APIs / Fallback Mock Store with Local Storage Persistence
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

    // Built-in Fallback Quizzes for Offline & Fast Preview
    const FALLBACK_QUIZZES = [
        {
            id: 1,
            title: 'Quiz 1 — HTML5 Standards & Semantic Elements',
            course_title: 'Full-Stack Web Development (CS-WD101)',
            description: 'Assesses understanding of semantic HTML tags, document outline algorithms, and accessibility landmarks.',
            duration_minutes: 20,
            passing_score: 70,
            total_points: 30,
            questions: [
                {
                    id: 101,
                    question_text: 'Which HTML5 element should be used to wrap the main navigation links of a webpage?',
                    points: 10,
                    options: ['<navigate>', '<nav>', '<navigation>', '<menu-links>'],
                    correct_index: 1
                },
                {
                    id: 102,
                    question_text: 'What is the primary benefit of using semantic HTML elements like <article> and <section>?',
                    points: 10,
                    options: [
                        'They make the webpage load 10x faster automatically',
                        'They improve accessibility for screen readers and SEO indexing',
                        'They eliminate the need for any CSS styling',
                        'They encrypt all client-side network traffic'
                    ],
                    correct_index: 1
                },
                {
                    id: 103,
                    question_text: 'Which HTML5 input type is specifically optimized for capturing email addresses with built-in validation?',
                    points: 10,
                    options: ['type="text"', 'type="mail"', 'type="email"', 'type="address"'],
                    correct_index: 2
                }
            ]
        },
        {
            id: 2,
            title: 'Quiz 2 — JavaScript Fundamentals & ES6+ Syntax',
            course_title: 'Full-Stack Web Development (CS-WD101)',
            description: 'Covers modern variable declarations, arrow functions, promises, and array transformations.',
            duration_minutes: 25,
            passing_score: 75,
            total_points: 30,
            questions: [
                {
                    id: 201,
                    question_text: 'What is the main difference between "let" and "const" in JavaScript?',
                    points: 10,
                    options: [
                        '"const" variables cannot be reassigned after declaration',
                        '"let" variables are globally scoped while "const" is block scoped',
                        '"const" can only store numbers while "let" stores strings',
                        'There is no difference between them'
                    ],
                    correct_index: 0
                },
                {
                    id: 202,
                    question_text: 'Which array method returns a brand new array with all elements that pass a given test function?',
                    points: 10,
                    options: ['Array.prototype.forEach()', 'Array.prototype.map()', 'Array.prototype.filter()', 'Array.prototype.reduce()'],
                    correct_index: 2
                },
                {
                    id: 203,
                    question_text: 'How do you correctly handle rejected promises when using async/await syntax?',
                    points: 10,
                    options: [
                        'Using a try...catch block',
                        'Using the onError() lifecycle event',
                        'Promises cannot fail when using async/await',
                        'By passing an error callback as the second parameter'
                    ],
                    correct_index: 0
                }
            ]
        },
        {
            id: 3,
            title: 'Assessment — UI/UX Heuristics & Design Tokens',
            course_title: 'Advanced UI/UX Design (UX-201)',
            description: 'Evaluate your understanding of Jakob Nielsen usability heuristics and scalable token design systems.',
            duration_minutes: 30,
            passing_score: 80,
            total_points: 30,
            questions: [
                {
                    id: 301,
                    question_text: 'Which usability heuristic emphasizes providing immediate feedback to user actions?',
                    points: 10,
                    options: [
                        'Visibility of system status',
                        'Aesthetic and minimalist design',
                        'Error prevention',
                        'Flexibility and efficiency of use'
                    ],
                    correct_index: 0
                },
                {
                    id: 302,
                    question_text: 'What are Design Tokens in a modern enterprise design system?',
                    points: 10,
                    options: [
                        'Cryptocurrency coins rewarded to UI designers',
                        'Key-value pairs representing design decisions (colors, spacing, typography)',
                        'Figma export plugin licenses',
                        'SVG icons used in mobile apps'
                    ],
                    correct_index: 1
                },
                {
                    id: 303,
                    question_text: 'According to WCAG AA guidelines, what is the minimum contrast ratio for standard body text?',
                    points: 10,
                    options: ['2.5 : 1', '3.0 : 1', '4.5 : 1', '7.0 : 1'],
                    correct_index: 2
                }
            ]
        }
    ];

    // URL Query Param Check
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = parseInt(urlParams.get('id'), 10);

    // UI View Elements
    const quizListView = document.getElementById('quizListView');
    const quizTakingView = document.getElementById('quizTakingView');
    const quizResultView = document.getElementById('quizResultView');

    // State for Active Quiz
    let currentQuiz = null;
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    const studentAnswers = {}; // Map of { [question_id]: selected_option_index }

    if (!quizId) {
        // Mode 1: List View
        if (quizListView) quizListView.style.display = 'block';
        await loadAvailableQuizzes();
    } else {
        // Mode 2: Take Quiz View
        if (quizTakingView) quizTakingView.style.display = 'block';
        await loadQuizData(quizId);
    }

    // ==========================================================================
    // 1. LOAD AVAILABLE QUIZZES (List View)
    // ==========================================================================
    async function loadAvailableQuizzes() {
        const container = document.getElementById('availableQuizzesContainer');
        if (!container) return;

        let quizzes = [];
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${API_BASE}/admin/exams`, { headers: getHeaders(), signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    quizzes = json.data;
                }
            }
        } catch (e) {}

        if (quizzes.length === 0) {
            quizzes = FALLBACK_QUIZZES;
        }

        container.innerHTML = quizzes.map(q => `
            <div class="col-md-6 col-lg-4">
                <div class="quiz-card p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                        <span class="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-2.5 py-1 mb-2">${escapeHtml(q.course_title || 'Enrolled Course')}</span>
                        <h3 class="fw-bold mb-2 fs-5 text-dark">${escapeHtml(q.title)}</h3>
                        <p class="text-muted text-xs mb-3">${escapeHtml(q.description || 'Complete this assessment before the scheduled deadline.')}</p>
                    </div>
                    <div>
                        <div class="d-flex justify-content-between text-muted text-xs mb-3 border-top pt-2">
                            <span><i class="bi bi-clock me-1"></i>${q.duration_minutes || 25} mins</span>
                            <span><i class="bi bi-award me-1"></i>Pass: ${q.passing_score || 70}%</span>
                        </div>
                        <a href="quiz.html?id=${q.id}" class="course-action-btn">
                            <i class="bi bi-play-circle me-1"></i> Start Assessment
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ==========================================================================
    // 2. LOAD ACTIVE QUIZ DATA
    // ==========================================================================
    async function loadQuizData(id) {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${API_BASE}/student/quizzes/${id}`, { headers: getHeaders(), signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    currentQuiz = data.data;
                    currentQuestions = currentQuiz.questions || [];
                    loaded = true;
                }
            }
        } catch (err) {}

        if (!loaded) {
            const matched = FALLBACK_QUIZZES.find(q => q.id === id) || FALLBACK_QUIZZES[0];
            currentQuiz = matched;
            currentQuestions = matched.questions;
        }

        if (!currentQuiz || !currentQuestions || currentQuestions.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Assessment Notice',
                text: 'Assessment data could not be found.',
                confirmButtonText: 'Back to Quizzes'
            }).then(() => {
                window.location.href = 'quiz.html';
            });
            return;
        }

        // Populate Metadata
        const titleEl = document.getElementById('quizDisplayTitle');
        const courseEl = document.getElementById('courseBadge');
        const descEl = document.getElementById('quizDisplayDesc');
        const countEl = document.getElementById('totalQsBadge');
        const timeEl = document.getElementById('timeRemaining');

        if (titleEl) titleEl.textContent = currentQuiz.title;
        if (courseEl) courseEl.textContent = currentQuiz.course_title || 'Enrolled Course';
        if (descEl) descEl.textContent = currentQuiz.description || 'Answer all questions carefully.';
        if (countEl) countEl.textContent = `${currentQuestions.length} Questions`;
        if (timeEl) timeEl.textContent = `${currentQuiz.duration_minutes || 20} mins`;

        currentQuestionIndex = 0;
        renderCurrentQuestion();
    }

    // ==========================================================================
    // 3. RENDER CURRENT QUESTION & OPTIONS
    // ==========================================================================
    function renderCurrentQuestion() {
        if (!currentQuestions || currentQuestions.length === 0) return;

        const q = currentQuestions[currentQuestionIndex];
        const numIndicator = document.getElementById('questionNumberIndicator');
        const ptsIndicator = document.getElementById('questionPointsIndicator');
        const qText = document.getElementById('questionText');

        if (numIndicator) numIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
        if (ptsIndicator) ptsIndicator.textContent = `${q.points || 10} Points`;
        if (qText) qText.textContent = q.question_text;

        const optionsContainer = document.getElementById('optionsContainer');
        if (!optionsContainer) return;

        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const selectedOpt = studentAnswers[q.id];

        optionsContainer.innerHTML = (q.options || []).map((optText, idx) => {
            const isSelected = selectedOpt !== undefined && selectedOpt === idx;
            return `
                <div class="qcm-option-card ${isSelected ? 'selected' : ''}" onclick="selectOption(${q.id}, ${idx})">
                    <span class="qcm-letter-badge">${letters[idx] || (idx + 1)}</span>
                    <span class="fw-medium text-dark flex-grow-1 text-sm">${escapeHtml(optText)}</span>
                    ${isSelected ? '<i class="bi bi-check-circle-fill text-primary fs-5"></i>' : ''}
                </div>
            `;
        }).join('');

        // Navigation Button states
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        const submitBtn = document.getElementById('submitQuizBtn');

        if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

        const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
        if (isLastQuestion) {
            if (nextBtn) nextBtn.classList.add('d-none');
            if (submitBtn) submitBtn.classList.remove('d-none');
        } else {
            if (nextBtn) nextBtn.classList.remove('d-none');
            if (submitBtn) submitBtn.classList.add('d-none');
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
    // 4. SUBMIT ASSESSMENT & SCORE CALCULATION
    // ==========================================================================
    document.getElementById('submitQuizBtn')?.addEventListener('click', async function () {
        const answeredCount = Object.keys(studentAnswers).length;
        const totalCount = currentQuestions.length;

        const confirmMsg = answeredCount < totalCount
            ? `You have answered ${answeredCount} of ${totalCount} questions. Submit assessment now?`
            : `Are you ready to submit your assessment for scoring?`;

        const result = await Swal.fire({
            title: 'Submit Assessment?',
            text: confirmMsg,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit Assessment',
            cancelButtonText: 'Review Answers',
            confirmButtonColor: '#2563EB'
        });

        if (!result.isConfirmed) return;

        let calculatedScore = 0;
        let totalPossible = 0;
        let correctCount = 0;

        currentQuestions.forEach(q => {
            const pts = q.points || 10;
            totalPossible += pts;
            if (studentAnswers[q.id] === q.correct_index) {
                calculatedScore += pts;
                correctCount++;
            }
        });

        const percentage = totalPossible > 0 ? Math.round((calculatedScore / totalPossible) * 100) : 100;
        const passingScore = currentQuiz.passing_score || 70;
        const isPassed = percentage >= passingScore;

        renderScoreResult({
            score: calculatedScore,
            total_marks: totalPossible,
            percentage: percentage,
            correct_count: correctCount,
            total_questions: currentQuestions.length,
            status: isPassed ? 'Passed' : 'Failed'
        });
    });

    // ==========================================================================
    // 5. RENDER SCORE RESULT
    // ==========================================================================
    function renderScoreResult(results) {
        if (quizTakingView) quizTakingView.style.display = 'none';
        if (quizResultView) quizResultView.style.display = 'block';

        const scoreEl = document.getElementById('resultScore');
        const statusEl = document.getElementById('resultStatus');
        const iconEl = document.getElementById('resultIcon');
        const titleEl = document.getElementById('resultTitle');

        if (scoreEl) scoreEl.textContent = `${results.percentage}%`;
        if (statusEl) {
            statusEl.textContent = `${results.status} (${results.correct_count} of ${results.total_questions} Correct)`;
            statusEl.className = results.status === 'Passed' ? 'text-sm fw-bold text-success mt-1' : 'text-sm fw-bold text-danger mt-1';
        }
        if (iconEl) {
            iconEl.innerHTML = results.status === 'Passed'
                ? '<i class="bi bi-check-circle-fill text-success" style="font-size: 3.5rem;"></i>'
                : '<i class="bi bi-exclamation-circle-fill text-warning" style="font-size: 3.5rem;"></i>';
        }
        if (titleEl) {
            titleEl.textContent = results.status === 'Passed' ? 'Congratulations! You Passed!' : 'Assessment Completed';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
