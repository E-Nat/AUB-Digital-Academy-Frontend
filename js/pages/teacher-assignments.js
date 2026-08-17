/**
 * AUB Digital Academy - Teacher Assignments Controller
 * Handles coursework creation, deadline modifications, and assignment status management.
 */

document.addEventListener('DOMContentLoaded', function () {
    const assignmentsData = [
        {
            id: 1,
            title: 'Build a RESTful API with Express & JWT',
            course: 'Full-Stack Web Development',
            due_date: '2026-08-25',
            due_display: 'Aug 25, 2026',
            total_submissions: 42,
            pending_reviews: 8,
            status: 'Open',
            max_score: 100,
            type: 'GitHub / Code Link',
            instructions: '1. Create a secure Express server with bcrypt & JWT auth.\n2. Add SQLite database migrations.\n3. Submit GitHub repo URL.'
        },
        {
            id: 2,
            title: 'Frontend Responsive UI Layout Challenge',
            course: 'Full-Stack Web Development',
            due_date: '2026-08-28',
            due_display: 'Aug 28, 2026',
            total_submissions: 38,
            pending_reviews: 4,
            status: 'Open',
            max_score: 100,
            type: 'File Upload (ZIP / PDF)',
            instructions: 'Implement mobile-first responsive cards using CSS flexbox/grid and university brand tokens.'
        },
        {
            id: 3,
            title: 'Data Cleaning & Visualisation with Pandas',
            course: 'Python for Data Science & AI',
            due_date: '2026-08-20',
            due_display: 'Aug 20, 2026',
            total_submissions: 29,
            pending_reviews: 2,
            status: 'Open',
            max_score: 100,
            type: 'File Upload (ZIP / PDF)',
            instructions: 'Analyze the dataset, clean missing records, and generate descriptive statistical charts.'
        },
        {
            id: 4,
            title: 'Dockerizing Node.js Microservices',
            course: 'Cloud Infrastructure & DevOps',
            due_date: '2026-08-15',
            due_display: 'Aug 15, 2026',
            total_submissions: 35,
            pending_reviews: 0,
            status: 'Closed',
            max_score: 100,
            type: 'GitHub / Code Link',
            instructions: 'Create multi-stage Dockerfile and Docker Compose orchestration.'
        }
    ];

    let currentFiltered = [...assignmentsData];
    const assignmentModalEl = document.getElementById('assignmentModal');
    const assignmentModal = assignmentModalEl ? new bootstrap.Modal(assignmentModalEl) : null;

    const searchInput = document.getElementById('assignmentSearchInput');
    const courseFilter = document.getElementById('assignmentCourseFilter');

    function renderAssignments(list) {
        const tbody = document.getElementById('assignmentsTableBody');
        const countText = document.getElementById('assignmentCountText');
        if (!tbody) return;

        if (countText) countText.textContent = `Showing ${list.length} of ${assignmentsData.length} assignments`;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-card-checklist fs-3 d-block mb-2 text-secondary opacity-50"></i>
                        No assignments found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(asgn => `
            <tr>
                <td>
                    <div class="fw-bold text-dark text-sm">${asgn.title}</div>
                    <div class="text-xs text-muted"><i class="bi bi-code-slash me-1"></i> ${asgn.type} &bull; Max: ${asgn.max_score} pts</div>
                </td>
                <td>
                    <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${asgn.course}</span>
                </td>
                <td>
                    <span class="badge bg-light text-dark border text-xs">${asgn.due_display}</span>
                </td>
                <td>
                    <span class="fw-bold text-dark text-xs">${asgn.total_submissions} students</span>
                </td>
                <td>
                    ${asgn.pending_reviews > 0 
                        ? `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 text-xs">${asgn.pending_reviews} pending</span>` 
                        : `<span class="badge bg-success bg-opacity-10 text-success text-xs"><i class="bi bi-check2"></i> All graded</span>`
                    }
                </td>
                <td>
                    <span class="badge ${asgn.status === 'Open' ? 'bg-success' : 'bg-secondary'} text-white text-xs">${asgn.status}</span>
                </td>
                <td class="text-end">
                    <div class="d-flex align-items-center justify-content-end gap-1">
                        <a href="submissions.html" class="btn btn-outline-primary btn-sm py-1 px-2 text-xs" title="Grade Submissions">
                            <i class="bi bi-pencil-square"></i>
                        </a>
                        <button class="btn btn-outline-secondary btn-sm py-1 px-2 text-xs" title="Edit Assignment" onclick="openEditAssignmentModal(${asgn.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm py-1 px-2 text-xs" title="${asgn.status === 'Open' ? 'Close Assignment' : 'Reopen Assignment'}" onclick="toggleAssignmentStatus(${asgn.id})">
                            <i class="bi ${asgn.status === 'Open' ? 'bi-lock' : 'bi-unlock'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const course = courseFilter ? courseFilter.value : 'all';

        currentFiltered = assignmentsData.filter(asgn => {
            const matchQuery = !query || 
                asgn.title.toLowerCase().includes(query) ||
                asgn.course.toLowerCase().includes(query);

            const matchCourse = course === 'all' || asgn.course === course;
            return matchQuery && matchCourse;
        });

        renderAssignments(currentFiltered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (courseFilter) courseFilter.addEventListener('change', applyFilters);

    window.openCreateAssignmentModal = function () {
        document.getElementById('assignmentForm').reset();
        document.getElementById('assignmentId').value = '';
        document.getElementById('assignmentModalTitle').textContent = 'Create New Assignment';
        document.getElementById('asgnDueDate').value = '2026-08-30';
        document.getElementById('asgnMaxScore').value = '100';

        if (assignmentModal) assignmentModal.show();
    };

    window.openEditAssignmentModal = function (asgnId) {
        const asgn = assignmentsData.find(a => a.id === asgnId);
        if (!asgn) return;

        document.getElementById('assignmentId').value = asgn.id;
        document.getElementById('assignmentModalTitle').textContent = `Edit Assignment: ${asgn.title}`;
        document.getElementById('asgnTitle').value = asgn.title;
        document.getElementById('asgnCourseSelect').value = asgn.course;
        document.getElementById('asgnInstructions').value = asgn.instructions || '';
        document.getElementById('asgnDueDate').value = asgn.due_date;
        document.getElementById('asgnMaxScore').value = asgn.max_score || 100;
        document.getElementById('asgnSubmissionType').value = asgn.type || 'GitHub / Code Link';

        if (assignmentModal) assignmentModal.show();
    };

    window.toggleAssignmentStatus = function (asgnId) {
        const asgn = assignmentsData.find(a => a.id === asgnId);
        if (!asgn) return;

        asgn.status = asgn.status === 'Open' ? 'Closed' : 'Open';
        renderAssignments(currentFiltered);

        Swal.fire({
            icon: 'info',
            title: `Assignment ${asgn.status}`,
            text: `Assignment is now ${asgn.status.toLowerCase()} for student submissions.`,
            timer: 1400,
            showConfirmButton: false
        });
    };

    // Form submit
    const asgnForm = document.getElementById('assignmentForm');
    if (asgnForm) {
        asgnForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const id = document.getElementById('assignmentId').value;
            const title = document.getElementById('asgnTitle').value.trim();
            const course = document.getElementById('asgnCourseSelect').value;
            const instructions = document.getElementById('asgnInstructions').value.trim();
            const dueDate = document.getElementById('asgnDueDate').value;
            const maxScore = parseInt(document.getElementById('asgnMaxScore').value) || 100;
            const submissionType = document.getElementById('asgnSubmissionType').value;

            if (id) {
                const asgn = assignmentsData.find(a => a.id === parseInt(id));
                if (asgn) {
                    asgn.title = title;
                    asgn.course = course;
                    asgn.instructions = instructions;
                    asgn.due_date = dueDate;
                    asgn.due_display = dueDate;
                    asgn.max_score = maxScore;
                    asgn.type = submissionType;
                }
            } else {
                assignmentsData.unshift({
                    id: Date.now(),
                    title: title,
                    course: course,
                    instructions: instructions,
                    due_date: dueDate,
                    due_display: dueDate,
                    total_submissions: 0,
                    pending_reviews: 0,
                    status: 'Open',
                    max_score: maxScore,
                    type: submissionType
                });
            }

            if (assignmentModal) assignmentModal.hide();
            applyFilters();

            Swal.fire({
                icon: 'success',
                title: id ? 'Assignment Updated' : 'Assignment Created',
                text: 'Coursework published for enrolled students.',
                timer: 1600,
                showConfirmButton: false
            });
        });
    }

    // Initialize
    renderAssignments(currentFiltered);
});
