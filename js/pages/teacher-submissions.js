/**
 * AUB Digital Academy - Teacher Submissions & Clean 2-Panel Grading Controller
 */

document.addEventListener('DOMContentLoaded', function () {
    const submissionsData = [
        {
            id: 1,
            student_name: 'Dara Sok',
            student_id: '202401236',
            student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            assignment_title: 'Build a RESTful API with Express & JWT',
            course_title: 'Full-Stack Web Development',
            submitted_at: 'Aug 18, 2026 — 01:15 PM',
            status: 'Pending',
            score: null,
            feedback: '',
            private_note: '',
            github_url: 'https://github.com/darasok/aub-rest-api-jwt',
            file_name: 'dara_sok_rest_api_submission.zip',
            student_comment: 'Implemented all endpoints with JWT bearer token verification, SQLite database migrations, and 12 unit tests in Mocha/Chai.'
        },
        {
            id: 2,
            student_name: 'Sreyneang Sok',
            student_id: '202401234',
            student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            assignment_title: 'Frontend Responsive UI Layout',
            course_title: 'Full-Stack Web Development',
            submitted_at: 'Aug 18, 2026 — 11:30 AM',
            status: 'Pending',
            score: null,
            feedback: '',
            private_note: '',
            github_url: 'https://github.com/sreyneang/aub-responsive-ui',
            file_name: 'responsive_portal_layout.zip',
            student_comment: 'Designed pure CSS responsive grid matching the AUB university style tokens. Verified on 3 breakpoints.'
        },
        {
            id: 3,
            student_name: 'Chanthou Meas',
            student_id: '202401235',
            student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            assignment_title: 'Data Cleaning & Visualisation with Pandas',
            course_title: 'Python for Data Science & AI',
            submitted_at: 'Aug 17, 2026 — 05:45 PM',
            status: 'Reviewed',
            score: 92,
            feedback: 'Excellent data exploration notebooks. Clean histogram visualizations and robust outlier removal.',
            private_note: 'Demonstrates deep grasp of statistical variance.',
            github_url: 'https://github.com/chanthou/pandas-cleaning-project',
            file_name: 'housing_data_cleaning.ipynb',
            student_comment: 'Completed analysis on 50,000 housing data records.'
        },
        {
            id: 4,
            student_name: 'Kanha Rath',
            student_id: '202401237',
            student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            assignment_title: 'Dockerizing Node.js Microservices',
            course_title: 'Cloud Infrastructure & DevOps',
            submitted_at: 'Aug 17, 2026 — 02:20 PM',
            status: 'Returned',
            score: 96,
            feedback: 'Perfect multi-stage Docker build. Reduced image size from 850MB to 120MB using Alpine Linux.',
            private_note: 'Top student in cloud DevOps architecture.',
            github_url: 'https://github.com/kanha/dockerized-microservice',
            file_name: 'docker_compose_solution.zip',
            student_comment: 'Added Docker compose file with healthcheck configuration.'
        }
    ];

    let currentSubmission = null;
    let filteredSubmissions = [...submissionsData];

    const gradingModalEl = document.getElementById('gradingModal');
    const gradingModal = gradingModalEl ? new bootstrap.Modal(gradingModalEl) : null;

    const searchInput = document.getElementById('submissionSearchInput');
    const courseFilter = document.getElementById('subCourseFilter');
    const statusFilter = document.getElementById('subStatusFilter');

    function renderSubmissions(list) {
        const tbody = document.getElementById('submissionsTableBody');
        const countText = document.getElementById('submissionQueueCount');
        if (!tbody) return;

        if (countText) countText.textContent = `Showing ${list.length} of ${submissionsData.length} submissions`;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-3 d-block mb-2 text-secondary opacity-50"></i>
                        No student submissions found matching the selected filters.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(sub => {
            let statusBadge = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 text-xs"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
            if (sub.status === 'Reviewed') {
                statusBadge = `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 text-xs"><i class="bi bi-eye me-1"></i>Reviewed</span>`;
            } else if (sub.status === 'Returned') {
                statusBadge = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-xs"><i class="bi bi-check2-circle me-1"></i>Returned</span>`;
            } else if (sub.status === 'Late') {
                statusBadge = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 text-xs"><i class="bi bi-clock me-1"></i>Late</span>`;
            }

            const scoreDisplay = sub.score !== null ? `<span class="fw-bold text-primary font-monospace">${sub.score}/100</span>` : `<span class="text-muted text-xs">Ungraded</span>`;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${sub.student_avatar}" class="rounded-circle object-fit-cover" style="width: 34px; height: 34px; border: 1.5px solid #E2E8F0;">
                            <div>
                                <div class="fw-bold text-dark text-sm">${sub.student_name}</div>
                                <div class="text-xs text-muted font-monospace">${sub.student_id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="fw-semibold text-dark text-sm text-truncate d-inline-block" style="max-width: 200px;" title="${sub.assignment_title}">
                            ${sub.assignment_title}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${sub.course_title}</span>
                    </td>
                    <td class="text-muted text-xs">${sub.submitted_at}</td>
                    <td>${statusBadge}</td>
                    <td>${scoreDisplay}</td>
                    <td class="text-end">
                        <button class="btn ${sub.status === 'Pending' ? 'btn-primary' : 'btn-outline-primary'} btn-sm py-1 px-3 text-xs fw-semibold" onclick="openGradingModal(${sub.id})">
                            <i class="bi ${sub.status === 'Pending' ? 'bi-pencil-square' : 'bi-eye'} me-1"></i>
                            ${sub.status === 'Pending' ? 'Grade' : 'Review'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const course = courseFilter ? courseFilter.value : 'all';
        const status = statusFilter ? statusFilter.value : 'all';

        filteredSubmissions = submissionsData.filter(sub => {
            const matchQuery = !query || 
                sub.student_name.toLowerCase().includes(query) ||
                sub.student_id.toLowerCase().includes(query) ||
                sub.assignment_title.toLowerCase().includes(query);

            const matchCourse = course === 'all' || sub.course_title === course;
            const matchStatus = status === 'all' || sub.status === status;

            return matchQuery && matchCourse && matchStatus;
        });

        renderSubmissions(filteredSubmissions);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (courseFilter) courseFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    window.resetSubmissionFilters = function () {
        if (searchInput) searchInput.value = '';
        if (courseFilter) courseFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        filteredSubmissions = [...submissionsData];
        renderSubmissions(filteredSubmissions);
    };

    // Open Clean 2-Panel Grading UI (Requirement 9)
    window.openGradingModal = function (submissionId) {
        const sub = submissionsData.find(s => s.id === submissionId);
        if (!sub) return;

        currentSubmission = sub;

        document.getElementById('gradingModalTitle').textContent = `Grading: ${sub.student_name}`;
        document.getElementById('gradingModalSubtitle').textContent = `${sub.assignment_title} • ${sub.course_title}`;

        // Left Panel Render
        const leftPane = document.getElementById('gradingLeftPane');
        if (leftPane) {
            leftPane.innerHTML = `
                <!-- Student Card -->
                <div class="d-flex align-items-center gap-3 p-3 bg-white rounded-3 border mb-3">
                    <img src="${sub.student_avatar}" class="rounded-circle object-fit-cover" style="width: 48px; height: 48px; border: 2px solid #FFFFFF;">
                    <div>
                        <h6 class="fw-bold text-dark mb-0">${sub.student_name}</h6>
                        <div class="text-xs text-muted">
                            <i class="bi bi-card-text me-1"></i> ID: <span class="font-monospace fw-bold text-primary">${sub.student_id}</span> &bull; 
                            <i class="bi bi-clock me-1"></i> Submitted: ${sub.submitted_at}
                        </div>
                    </div>
                </div>

                <!-- Assignment Prompt -->
                <div class="mb-3">
                    <label class="form-label text-xs fw-bold text-uppercase text-muted">Assignment Prompt</label>
                    <div class="p-3 bg-white rounded-3 border text-xs text-dark">
                        ${sub.assignment_title} &bull; Maximum Score: <b>100 Points</b>
                    </div>
                </div>

                <!-- Student Deliverable & Answer -->
                <div class="mb-3">
                    <label class="form-label text-xs fw-bold text-uppercase text-muted">Student's Submission & Notes</label>
                    <div class="p-3 bg-white rounded-3 border text-xs text-muted mb-2">
                        "${sub.student_comment || 'No written comment attached.'}"
                    </div>

                    <!-- GitHub Repository Link -->
                    ${sub.github_url ? `
                        <div class="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between mb-2">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-github fs-4 text-dark"></i>
                                <div>
                                    <div class="fw-bold text-xs text-dark">Repository Link</div>
                                    <a href="${sub.github_url}" target="_blank" class="text-xs text-primary text-decoration-none">${sub.github_url}</a>
                                </div>
                            </div>
                            <a href="${sub.github_url}" target="_blank" class="btn btn-outline-primary btn-sm text-xs">
                                <i class="bi bi-box-arrow-up-right me-1"></i> Open Code
                            </a>
                        </div>
                    ` : ''}

                    <!-- Attached Archive File -->
                    ${sub.file_name ? `
                        <div class="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-file-earmark-zip-fill fs-4 text-warning"></i>
                                <div>
                                    <div class="fw-bold text-xs text-dark">${sub.file_name}</div>
                                    <span class="text-xs text-muted">2.8 MB &bull; Zip Archive</span>
                                </div>
                            </div>
                            <button type="button" class="btn btn-outline-secondary btn-sm text-xs" onclick="Swal.fire({ icon: 'info', title: 'Downloading file...', timer: 1200, showConfirmButton: false })">
                                <i class="bi bi-download me-1"></i> Download
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Right Panel Pre-fill
        document.getElementById('gradeScoreInput').value = sub.score || '';
        document.getElementById('gradeFeedbackInput').value = sub.feedback || '';
        document.getElementById('gradePrivateNoteInput').value = sub.private_note || '';

        if (gradingModal) gradingModal.show();
    };

    window.setPresetScore = function (val) {
        const input = document.getElementById('gradeScoreInput');
        if (input) input.value = val;
    };

    window.saveGradingDraft = function () {
        if (!currentSubmission) return;

        const score = document.getElementById('gradeScoreInput').value;
        const feedback = document.getElementById('gradeFeedbackInput').value;
        const note = document.getElementById('gradePrivateNoteInput').value;

        currentSubmission.score = score ? parseInt(score) : null;
        currentSubmission.feedback = feedback;
        currentSubmission.private_note = note;
        currentSubmission.status = 'Reviewed';

        renderSubmissions(filteredSubmissions);
        if (gradingModal) gradingModal.hide();

        Swal.fire({
            icon: 'success',
            title: 'Draft Saved',
            text: 'Your grading score and feedback draft have been recorded.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    window.submitGradedWork = function () {
        if (!currentSubmission) return;

        const score = document.getElementById('gradeScoreInput').value;
        const feedback = document.getElementById('gradeFeedbackInput').value;
        const note = document.getElementById('gradePrivateNoteInput').value;

        if (!score || isNaN(score) || score < 0 || score > 100) {
            Swal.fire({
                icon: 'warning',
                title: 'Valid Score Required',
                text: 'Please input a numerical grade score between 0 and 100.'
            });
            return;
        }

        currentSubmission.score = parseInt(score);
        currentSubmission.feedback = feedback;
        currentSubmission.private_note = note;
        currentSubmission.status = 'Returned';

        renderSubmissions(filteredSubmissions);
        if (gradingModal) gradingModal.hide();

        Swal.fire({
            icon: 'success',
            title: 'Grade Returned to Student',
            text: `${currentSubmission.student_name} has been notified with score ${score}/100.`,
            timer: 1800,
            showConfirmButton: false
        });
    };

    // Check URL parameters for direct grading
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    if (targetId) {
        setTimeout(() => openGradingModal(parseInt(targetId)), 300);
    }

    // Initialize
    renderSubmissions(filteredSubmissions);
});
