/**
 * AUB Digital Academy - Teacher Students Controller
 * Student list with academic profile view, assignment grades, and student messaging.
 */

document.addEventListener('DOMContentLoaded', function () {
    const studentsData = [
        {
            id: 1,
            name: 'Sreyneang Sok',
            university: 'American University of Phnom Penh (AUB)',
            student_id: '202401234',
            course: 'Full-Stack Web Development',
            progress: 85,
            last_activity: '2 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Responsive Layout', score: '95/100', status: 'Graded' },
                { title: 'Assignment 2: Express REST API', score: '90/100', status: 'Graded' },
                { title: 'Assignment 3: Database Models', score: 'Pending Review', status: 'Under Review' }
            ],
            recent_activity: 'Completed Module 6: JWT Authentication (Today, 11:30 AM)',
            notes: 'Consistently demonstrates strong architectural understanding of REST APIs. Participates actively in lectures.'
        },
        {
            id: 2,
            name: 'Sokha Chan',
            university: 'American University of Phnom Penh (AUB)',
            student_id: '202401235',
            course: 'Full-Stack Web Development',
            progress: 78,
            last_activity: '5 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Responsive Layout', score: '88/100', status: 'Graded' },
                { title: 'Assignment 2: Express REST API', score: '82/100', status: 'Graded' }
            ],
            recent_activity: 'Submitted REST API Project (Yesterday, 03:00 PM)',
            notes: 'Good progress. Needs minor clarification on asynchronous promises and middleware chaining.'
        },
        {
            id: 3,
            name: 'Dara Keo',
            university: 'American University of Phnom Penh (AUB)',
            student_id: '202401236',
            course: 'Full-Stack Web Development',
            progress: 92,
            last_activity: 'Yesterday',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Responsive Layout', score: '98/100', status: 'Graded' },
                { title: 'Assignment 2: Express REST API', score: '94/100', status: 'Graded' }
            ],
            recent_activity: 'Completed Lesson 8: Full-Stack Integration (Yesterday)',
            notes: 'Excellent student. Recommended for advanced capstone mentorship.'
        },
        {
            id: 4,
            name: 'Vannak Chan',
            university: 'American University of Phnom Penh (AUB)',
            student_id: '202401239',
            course: 'Python for Data Science & AI',
            progress: 65,
            last_activity: '1 hour ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Pandas Data Cleaning', score: '85/100', status: 'Graded' }
            ],
            recent_activity: 'Watched Video: Exploratory Data Analysis (1 hour ago)',
            notes: 'Working diligently on data wrangling exercises.'
        },
        {
            id: 5,
            name: 'Chanthou Meas',
            university: 'American University of Phnom Penh (AUB)',
            student_id: '202401235',
            course: 'Python for Data Science & AI',
            progress: 70,
            last_activity: '3 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Pandas Data Cleaning', score: '90/100', status: 'Graded' }
            ],
            recent_activity: 'Submitted Data Cleaning Notebook (Aug 17)',
            notes: 'Scheduled consultation for model evaluation techniques.'
        },
        {
            id: 6,
            name: 'Kanha Rath',
            university: 'American University of Phnom Penh (AUB)',
            student_id: '202401237',
            course: 'Cloud DevOps',
            progress: 90,
            last_activity: '4 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Docker Multi-Stage Builds', score: '96/100', status: 'Graded' }
            ],
            recent_activity: 'Tested Docker Compose cluster setup (4 hours ago)',
            notes: 'High aptitude for containerization and Kubernetes orchestration.'
        }
    ];

    let currentFiltered = [...studentsData];
    const studentModalEl = document.getElementById('studentDetailModal');
    const studentModal = studentModalEl ? new bootstrap.Modal(studentModalEl) : null;

    const searchInput = document.getElementById('studentSearchInput');
    const courseFilter = document.getElementById('courseFilterSelect');

    // 1. Render Students Table (Requirement 7: Student, Course, Progress, Last Activity, Status, Actions)
    function renderStudents(list) {
        const tbody = document.getElementById('teacherStudentsTableBody');
        const countEl = document.getElementById('studentRosterCount');
        if (!tbody) return;

        if (countEl) countEl.textContent = `Showing ${list.length} enrolled students`;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="bi bi-mortarboard fs-3 d-block mb-2 text-secondary opacity-50"></i>
                        No students found matching the selected course or search term.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(st => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="${st.avatar}" class="rounded-circle object-fit-cover shadow-sm" style="width: 36px; height: 36px; border: 1.5px solid #E2E8F0;">
                        <div>
                            <div class="fw-bold text-dark text-sm">${st.name}</div>
                            <div class="text-xs text-muted font-monospace">${st.student_id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${st.course}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2" style="width: 130px;">
                        <div class="progress flex-grow-1" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: ${st.progress}%;"></div>
                        </div>
                        <span class="text-xs fw-bold text-dark">${st.progress}%</span>
                    </div>
                </td>
                <td class="text-muted text-xs">${st.last_activity}</td>
                <td>
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-xs">
                        🟢 Active
                    </span>
                </td>
                <td class="text-end">
                    <div class="d-flex align-items-center justify-content-end gap-1">
                        <button class="btn btn-outline-primary btn-sm py-1 px-2 text-xs" title="View Progress" onclick="openStudentAcademicProfile(${st.id})">
                            <i class="bi bi-graph-up me-1"></i> View Progress
                        </button>
                        <a href="submissions.html" class="btn btn-outline-secondary btn-sm py-1 px-2 text-xs" title="View Submissions">
                            <i class="bi bi-inbox me-1"></i> Submissions
                        </a>
                        <button class="btn btn-outline-secondary btn-sm py-1 px-2 text-xs" title="Message Student" onclick="messageStudent('${st.name}')">
                            <i class="bi bi-chat-dots"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const course = courseFilter ? courseFilter.value : 'all';

        currentFiltered = studentsData.filter(st => {
            const matchQuery = !query || 
                st.name.toLowerCase().includes(query) || 
                st.student_id.toLowerCase().includes(query) ||
                st.course.toLowerCase().includes(query);

            const matchCourse = course === 'all' || st.course === course;
            return matchQuery && matchCourse;
        });

        renderStudents(currentFiltered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (courseFilter) courseFilter.addEventListener('change', applyFilters);

    // 2. Open Student Academic Profile (Requirement 8)
    window.openStudentAcademicProfile = function (studentId) {
        const st = studentsData.find(s => s.id === studentId);
        if (!st) return;

        const body = document.getElementById('studentDetailModalBody');
        if (!body) return;

        const gradesHtml = st.grades.map(g => `
            <div class="p-2 bg-white rounded border d-flex align-items-center justify-content-between mb-1">
                <span class="text-xs fw-semibold text-dark">${g.title}</span>
                <span class="badge ${g.status === 'Graded' ? 'bg-success' : 'bg-warning text-dark'} text-xs">${g.score}</span>
            </div>
        `).join('');

        body.innerHTML = `
            <!-- HEADER -->
            <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3 border">
                <img src="${st.avatar}" class="rounded-circle object-fit-cover shadow-sm" style="width: 58px; height: 58px; border: 2px solid #FFFFFF;">
                <div>
                    <h5 class="fw-bold text-dark mb-1">${st.name}</h5>
                    <div class="text-xs text-muted mb-1">
                        ${st.university} &bull; ID: <span class="font-monospace fw-bold text-primary">${st.student_id}</span>
                    </div>
                    <div class="text-xs text-muted">
                        <i class="bi bi-journal-bookmark me-1"></i> Course: <span class="fw-semibold text-dark">${st.course}</span>
                    </div>
                </div>
            </div>

            <!-- COURSE PROGRESS -->
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-xs fw-bold text-uppercase text-muted">Course Progress</span>
                    <span class="text-xs fw-bold text-primary">${st.progress}% Completed</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-primary" style="width: ${st.progress}%;"></div>
                </div>
            </div>

            <!-- RECENT ACTIVITY -->
            <div class="mb-3">
                <span class="text-xs fw-bold text-uppercase text-muted d-block mb-1">Recent Activity</span>
                <div class="p-2 bg-light rounded border text-xs text-muted">
                    <i class="bi bi-clock-history text-primary me-1"></i> ${st.recent_activity}
                </div>
            </div>

            <!-- ASSIGNMENT RESULTS & SUBMISSIONS -->
            <div class="mb-3">
                <div class="text-xs fw-bold text-uppercase text-muted mb-2">Assignment Results</div>
                <div class="bg-light p-2 rounded-3 border">
                    ${gradesHtml}
                </div>
            </div>

            <!-- TEACHER FEEDBACK & NOTES -->
            <div>
                <label class="form-label text-xs fw-bold text-uppercase text-muted mb-1">Teacher Feedback & Progress Notes</label>
                <textarea class="form-control text-xs" id="teacherFeedbackInput" rows="3" placeholder="Add feedback or private progress observations for this student...">${st.notes || ''}</textarea>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <button class="btn btn-outline-secondary btn-sm text-xs" onclick="messageStudent('${st.name}')">
                        <i class="bi bi-chat-dots me-1"></i> Message Student
                    </button>
                    <button class="btn btn-primary btn-sm text-xs px-3" onclick="saveStudentFeedback(${st.id})">
                        <i class="bi bi-check2 me-1"></i> Save Feedback
                    </button>
                </div>
            </div>
        `;

        if (studentModal) studentModal.show();
    };

    window.saveStudentFeedback = function (studentId) {
        const st = studentsData.find(s => s.id === studentId);
        const input = document.getElementById('teacherFeedbackInput');
        if (st && input) {
            st.notes = input.value.trim();
            Swal.fire({
                icon: 'success',
                title: 'Feedback Saved',
                text: 'Teacher note updated successfully.',
                timer: 1400,
                showConfirmButton: false
            });
        }
    };

    window.messageStudent = function (studentName) {
        Swal.fire({
            title: `Message ${studentName}`,
            input: 'textarea',
            inputPlaceholder: 'Write your academic message here...',
            showCancelButton: true,
            confirmButtonText: 'Send Message',
            confirmButtonColor: '#2563eb'
        }).then((res) => {
            if (res.isConfirmed && res.value) {
                Swal.fire({
                    icon: 'success',
                    title: 'Message Sent',
                    text: `Your message has been sent to ${studentName}.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    // Check URL parameters for direct course filtering
    const urlParams = new URLSearchParams(window.location.search);
    const courseParam = urlParams.get('course');
    if (courseParam && courseFilter) {
        if (courseParam === '1') courseFilter.value = 'Full-Stack Web Development';
        else if (courseParam === '2') courseFilter.value = 'Python for Data Science & AI';
        else if (courseParam === '3') courseFilter.value = 'Cloud DevOps';
        applyFilters();
    } else {
        renderStudents(currentFiltered);
    }
});
