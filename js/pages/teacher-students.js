/**
 * AUB Digital Academy - Teacher Students Controller
 * Renders cohort roster, student academic profile drawer, and private mentorship notes.
 */

document.addEventListener('DOMContentLoaded', function () {
    const studentsData = [
        {
            id: 1,
            name: 'Sreyneang Sok',
            university_id: '202401234',
            email: 'sreyneang@aub.edu.kh',
            course: 'Full-Stack Web Development',
            progress: 85,
            last_activity: '2 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Responsive Layout', score: '95/100', status: 'Graded' },
                { title: 'Assignment 2: Express REST API', score: '90/100', status: 'Graded' },
                { title: 'Assignment 3: Database Models', score: 'Pending', status: 'Under Review' }
            ],
            notes: 'Consistently demonstrates strong architectural understanding of REST APIs. Participates actively in lectures.'
        },
        {
            id: 2,
            name: 'Sokha Chan',
            university_id: '202401235',
            email: 'sokha@aub.edu.kh',
            course: 'Full-Stack Web Development',
            progress: 78,
            last_activity: '5 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Responsive Layout', score: '88/100', status: 'Graded' },
                { title: 'Assignment 2: Express REST API', score: '82/100', status: 'Graded' }
            ],
            notes: 'Good progress. Needs minor clarification on asynchronous promises and middleware chaining.'
        },
        {
            id: 3,
            name: 'Dara Keo',
            university_id: '202401236',
            email: 'dara.keo@aub.edu.kh',
            course: 'Full-Stack Web Development',
            progress: 92,
            last_activity: 'Yesterday',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Responsive Layout', score: '98/100', status: 'Graded' },
                { title: 'Assignment 2: Express REST API', score: '94/100', status: 'Graded' }
            ],
            notes: 'Excellent student. Recommended for advanced capstone mentorship.'
        },
        {
            id: 4,
            name: 'Vannak Chan',
            university_id: '202401239',
            email: 'vannak.chan@aub.edu.kh',
            course: 'Python for Data Science & AI',
            progress: 65,
            last_activity: '1 hour ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Pandas Data Cleaning', score: '85/100', status: 'Graded' }
            ],
            notes: 'Working diligently on data wrangling exercises.'
        },
        {
            id: 5,
            name: 'Chanthou Meas',
            university_id: '202401235',
            email: 'chanthou.meas@aub.edu.kh',
            course: 'Python for Data Science & AI',
            progress: 70,
            last_activity: '3 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Pandas Data Cleaning', score: '90/100', status: 'Graded' }
            ],
            notes: 'Scheduled consultation for model evaluation techniques.'
        },
        {
            id: 6,
            name: 'Kanha Rath',
            university_id: '202401237',
            email: 'kanha.rath@aub.edu.kh',
            course: 'Cloud Infrastructure & DevOps',
            progress: 90,
            last_activity: '4 hours ago',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            grades: [
                { title: 'Assignment 1: Docker Multi-Stage Builds', score: '96/100', status: 'Graded' }
            ],
            notes: 'High aptitude for containerization and Kubernetes orchestration.'
        }
    ];

    let currentFiltered = [...studentsData];
    const studentModalEl = document.getElementById('studentDetailModal');
    const studentModal = studentModalEl ? new bootstrap.Modal(studentModalEl) : null;

    const searchInput = document.getElementById('studentSearchInput');
    const courseFilter = document.getElementById('courseFilterSelect');
    const statusFilter = document.getElementById('statusFilterSelect');

    function renderStudents(list) {
        const tbody = document.getElementById('teacherStudentsTableBody');
        const countEl = document.getElementById('studentRosterCount');
        if (!tbody) return;

        if (countEl) countEl.textContent = `Showing ${list.length} of ${studentsData.length} students`;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="bi bi-mortarboard fs-3 d-block mb-2 text-secondary opacity-50"></i>
                        No students found matching the selected filter criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(st => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${st.avatar}" class="rounded-circle object-fit-cover shadow-sm" style="width: 36px; height: 36px; border: 1.5px solid #E2E8F0;">
                        <span class="fw-bold text-dark text-sm">${st.name}</span>
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border font-monospace text-xs">${st.university_id}</span>
                </td>
                <td>
                    <a href="mailto:${st.email}" class="text-muted text-xs text-decoration-none hover-primary">${st.email}</a>
                </td>
                <td>
                    <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${st.course}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2" style="width: 130px;">
                        <div class="progress flex-grow-1" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: ${st.progress}%;"></div>
                        </div>
                        <span class="text-xs fw-bold text-dark">${st.progress}%</span>
                    </div>
                </td>
                <td class="text-muted text-xs">${st.last_activity}</td>
                <td>
                    <div class="d-flex align-items-center text-xs fw-semibold text-success">
                        <span class="status-dot active"></span> Active
                    </div>
                </td>
                <td class="text-end">
                    <div class="d-flex align-items-center justify-content-end gap-1">
                        <button class="btn btn-outline-primary btn-sm py-1 px-2 text-xs" title="View Academic Profile" onclick="openStudentDetail(${st.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm py-1 px-2 text-xs" title="Send Message" onclick="messageStudent('${st.name}')">
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
        const status = statusFilter ? statusFilter.value : 'all';

        currentFiltered = studentsData.filter(st => {
            const matchQuery = !query || 
                st.name.toLowerCase().includes(query) || 
                st.university_id.toLowerCase().includes(query) ||
                st.email.toLowerCase().includes(query);

            const matchCourse = course === 'all' || st.course === course;
            const matchStatus = status === 'all' || st.status === status;

            return matchQuery && matchCourse && matchStatus;
        });

        renderStudents(currentFiltered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (courseFilter) courseFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    window.resetStudentFilters = function () {
        if (searchInput) searchInput.value = '';
        if (courseFilter) courseFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        currentFiltered = [...studentsData];
        renderStudents(currentFiltered);
    };

    // Open Student Academic Profile Drawer (Requirement 6)
    window.openStudentDetail = function (studentId) {
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
                <img src="${st.avatar}" class="rounded-circle object-fit-cover shadow-sm" style="width: 60px; height: 60px; border: 2px solid #FFFFFF;">
                <div>
                    <h5 class="fw-bold text-dark mb-1">${st.name}</h5>
                    <div class="text-xs text-muted">
                        <i class="bi bi-card-text me-1"></i> ID: <span class="font-monospace fw-bold text-primary">${st.university_id}</span> &bull; 
                        <i class="bi bi-envelope me-1"></i> ${st.email}
                    </div>
                    <div class="text-xs text-muted mt-1">
                        <i class="bi bi-journal-bookmark me-1"></i> ${st.course} &bull; <span class="text-success fw-semibold">🟢 Active Enrollment</span>
                    </div>
                </div>
            </div>

            <!-- ACADEMIC PROGRESS -->
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="text-xs fw-bold text-uppercase text-muted">Syllabus Completion</span>
                    <span class="text-xs fw-bold text-primary">${st.progress}% Complete</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-primary" style="width: ${st.progress}%;"></div>
                </div>
            </div>

            <!-- GRADES BREAKDOWN -->
            <div class="mb-3">
                <div class="text-xs fw-bold text-uppercase text-muted mb-2">Assignment Grades & Submissions</div>
                <div class="bg-light p-2 rounded-3 border">
                    ${gradesHtml}
                </div>
            </div>

            <!-- PRIVATE TEACHER NOTES -->
            <div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label class="form-label text-xs fw-bold text-uppercase text-muted mb-0">Private Faculty Mentorship Notes</label>
                    <span class="text-muted" style="font-size: 11px;">Visible only to you</span>
                </div>
                <textarea class="form-control text-xs" id="teacherNoteInput" rows="3" placeholder="Write feedback notes, progress observations, or guidance points for this student...">${st.notes || ''}</textarea>
                <div class="text-end mt-2">
                    <button class="btn btn-primary btn-sm text-xs" onclick="saveTeacherNote(${st.id})">
                        <i class="bi bi-check2 me-1"></i> Save Note
                    </button>
                </div>
            </div>
        `;

        if (studentModal) studentModal.show();
    };

    window.saveTeacherNote = function (studentId) {
        const st = studentsData.find(s => s.id === studentId);
        const input = document.getElementById('teacherNoteInput');
        if (st && input) {
            st.notes = input.value.trim();
            Swal.fire({
                icon: 'success',
                title: 'Note Saved',
                text: 'Private mentorship note updated successfully.',
                timer: 1400,
                showConfirmButton: false
            });
        }
    };

    window.messageStudent = function (studentName) {
        Swal.fire({
            title: `Send Message to ${studentName}`,
            input: 'textarea',
            inputPlaceholder: 'Type your message or academic guidance here...',
            showCancelButton: true,
            confirmButtonText: 'Send Message',
            confirmButtonColor: '#2563eb'
        }).then((res) => {
            if (res.isConfirmed && res.value) {
                Swal.fire({
                    icon: 'success',
                    title: 'Message Sent',
                    text: `Your message has been sent to ${studentName}'s university inbox.`,
                    timer: 1600,
                    showConfirmButton: false
                });
            }
        });
    };

    window.exportStudentCohort = function () {
        const headers = ['Student Name', 'University ID', 'Email', 'Course', 'Progress', 'Status'];
        const rows = currentFiltered.map(s => [
            `"${s.name}"`,
            `"${s.university_id}"`,
            `"${s.email}"`,
            `"${s.course}"`,
            `"${s.progress}%"`,
            `"${s.status}"`
        ]);

        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', `AUB_Faculty_Student_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Initialize
    renderStudents(currentFiltered);
});
