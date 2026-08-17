/**
 * AUB Digital Academy - Teacher Dashboard Controller
 * Manages faculty overview metrics, pending reviews, upcoming consultations, and course cards.
 */

document.addEventListener('DOMContentLoaded', async function () {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    const API_BASE = (isLocal && window.location.port !== '5000') 
        ? 'http://localhost:5000/api' 
        : '/api';

    function getAuthToken() {
        return localStorage.getItem('aub_auth_token') || 
               sessionStorage.getItem('aub_auth_token') || 
               localStorage.getItem('token') || '';
    }

    function getHeaders() {
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    // Fallback Teacher Demo Data
    const mockTeacherCourses = [
        {
            id: 1,
            title: 'Full-Stack Web Development',
            slug: 'full-stack-web-development',
            category: 'Technology',
            students_count: 1250,
            lessons_count: 12,
            pending_reviews: 8,
            rating: 4.9,
            status: 'Active',
            banner: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=600'
        },
        {
            id: 2,
            title: 'Python for Data Science & AI',
            slug: 'python-data-science-ai',
            category: 'Data Science',
            students_count: 820,
            lessons_count: 10,
            pending_reviews: 4,
            rating: 4.8,
            status: 'Active',
            banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600'
        },
        {
            id: 3,
            title: 'Cloud Infrastructure & DevOps',
            slug: 'cloud-infrastructure-devops',
            category: 'Engineering',
            students_count: 450,
            lessons_count: 8,
            pending_reviews: 2,
            rating: 4.9,
            status: 'Active',
            banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600'
        }
    ];

    const mockPendingSubmissions = [
        {
            id: 1,
            student_name: 'Dara Sok',
            student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            assignment_title: 'Build a RESTful API with Express & JWT',
            course_title: 'Full-Stack Web Development',
            submitted_at: 'Aug 18, 2026 — 01:15 PM',
            status: 'Pending'
        },
        {
            id: 2,
            student_name: 'Sreyneang Sok',
            student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            assignment_title: 'Frontend Responsive UI Layout',
            course_title: 'Full-Stack Web Development',
            submitted_at: 'Aug 18, 2026 — 11:30 AM',
            status: 'Pending'
        },
        {
            id: 3,
            student_name: 'Chanthou Meas',
            student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            assignment_title: 'Data Cleaning & Visualisation with Pandas',
            course_title: 'Python for Data Science & AI',
            submitted_at: 'Aug 17, 2026 — 05:45 PM',
            status: 'Pending'
        },
        {
            id: 4,
            student_name: 'Kanha Rath',
            student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            assignment_title: 'Dockerizing Node.js Microservices',
            course_title: 'Cloud Infrastructure & DevOps',
            submitted_at: 'Aug 17, 2026 — 02:20 PM',
            status: 'Pending'
        }
    ];

    const mockConsultations = [
        {
            id: 101,
            student_name: 'Sreyneang Sok',
            student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            course: 'Full-Stack Web Development',
            date: 'Tomorrow, Aug 19',
            time: '02:00 PM – 02:30 PM',
            topic: 'Database architecture & foreign key constraints review'
        },
        {
            id: 102,
            student_name: 'Vannak Chan',
            student_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            course: 'Python for Data Science & AI',
            date: 'Thursday, Aug 20',
            time: '10:00 AM – 10:30 AM',
            topic: 'Capstone project guidance and dataset selection'
        }
    ];

    const mockStudentActivity = [
        {
            student_name: 'Sokha Chan',
            action: 'completed Lesson 8: JWT Authentication Flow',
            time: '25m ago',
            course: 'Full-Stack Web Development',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150'
        },
        {
            student_name: 'Dara Keo',
            action: 'scored 95/100 on Database Quiz',
            time: '1h ago',
            course: 'Full-Stack Web Development',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150'
        },
        {
            student_name: 'Kanha Rath',
            action: 'submitted Assignment 3',
            time: '2h ago',
            course: 'Cloud Infrastructure & DevOps',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150'
        }
    ];

    // 1. Render Summary Statistics (Requirement 3)
    function renderStats() {
        const totalStudents = mockTeacherCourses.reduce((sum, c) => sum + c.students_count, 0);
        const totalCourses = mockTeacherCourses.length;
        const pendingReviews = mockTeacherCourses.reduce((sum, c) => sum + c.pending_reviews, 0);

        const elStudents = document.getElementById('statTeacherStudents');
        const elCourses = document.getElementById('statTeacherCourses');
        const elReviews = document.getElementById('statPendingReviews');
        const elPendingCount = document.getElementById('pendingSubCount');

        if (elStudents) elStudents.textContent = totalStudents.toLocaleString();
        if (elCourses) elCourses.textContent = totalCourses;
        if (elReviews) elReviews.textContent = pendingReviews;
        if (elPendingCount) elPendingCount.textContent = pendingReviews;
    }

    // 2. Render Pending Submissions Table
    function renderPendingSubmissions() {
        const tableBody = document.getElementById('pendingSubmissionsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = mockPendingSubmissions.map(sub => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${sub.student_avatar}" class="rounded-circle object-fit-cover" style="width: 34px; height: 34px; border: 1.5px solid #E2E8F0;">
                        <span class="fw-bold text-dark text-sm">${sub.student_name}</span>
                    </div>
                </td>
                <td>
                    <span class="fw-semibold text-dark text-xs text-truncate d-inline-block" style="max-width: 220px;" title="${sub.assignment_title}">
                        ${sub.assignment_title}
                    </span>
                </td>
                <td>
                    <span class="badge bg-primary bg-opacity-10 text-primary text-xs">${sub.course_title}</span>
                </td>
                <td class="text-muted text-xs">${sub.submitted_at}</td>
                <td class="text-end">
                    <a href="submissions.html?id=${sub.id}" class="btn btn-sm btn-primary py-1 px-3 text-xs fw-semibold">
                        <i class="bi bi-pencil-square me-1"></i> Grade
                    </a>
                </td>
            </tr>
        `).join('');
    }

    // 3. Render Teacher Courses Grid
    function renderCourses() {
        const grid = document.getElementById('teacherCoursesGrid');
        if (!grid) return;

        grid.innerHTML = mockTeacherCourses.map(course => `
            <div class="col-md-6">
                <div class="teacher-course-card">
                    <div class="teacher-course-banner" style="background-image: url('${course.banner}');">
                        <div class="position-absolute top-0 start-0 p-3 z-1">
                            <span class="badge bg-dark bg-opacity-75 text-white text-xs">${course.category}</span>
                        </div>
                        <div class="position-absolute top-0 end-0 p-3 z-1">
                            <span class="badge bg-warning text-dark text-xs fw-bold"><i class="bi bi-star-fill text-dark me-1"></i> ${course.rating}</span>
                        </div>
                        <div class="position-absolute bottom-0 start-0 p-3 z-1 text-white">
                            <h6 class="fw-bold mb-0 text-white">${course.title}</h6>
                        </div>
                    </div>

                    <div class="teacher-course-body">
                        <div class="teacher-course-meta-grid">
                            <div class="teacher-meta-item">
                                <span>Students</span>
                                <strong>${course.students_count.toLocaleString()}</strong>
                            </div>
                            <div class="teacher-meta-item">
                                <span>Lessons</span>
                                <strong>${course.lessons_count} Modules</strong>
                            </div>
                            <div class="teacher-meta-item">
                                <span>Pending</span>
                                <strong class="text-warning">${course.pending_reviews} to review</strong>
                            </div>
                            <div class="teacher-meta-item">
                                <span>Status</span>
                                <strong class="text-success"><i class="bi bi-check-circle-fill me-1"></i> ${course.status}</strong>
                            </div>
                        </div>

                        <div class="d-flex gap-2 mt-auto pt-2">
                            <a href="my-courses.html?id=${course.id}" class="btn btn-outline-primary btn-sm flex-fill text-xs">
                                <i class="bi bi-gear me-1"></i> Manage Content
                            </a>
                            <a href="my-students.html?course=${course.id}" class="btn btn-outline-secondary btn-sm flex-fill text-xs">
                                <i class="bi bi-people me-1"></i> Students
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 4. Render Upcoming 1-on-1 Consultations
    function renderConsultations() {
        const container = document.getElementById('upcomingConsultationsList');
        if (!container) return;

        container.innerHTML = mockConsultations.map(c => `
            <div class="consultation-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${c.student_avatar}" class="rounded-circle object-fit-cover" style="width: 32px; height: 32px;">
                        <div>
                            <div class="fw-bold text-dark text-xs">${c.student_name}</div>
                            <div class="text-muted text-xs" style="font-size: 11px;">${c.course}</div>
                        </div>
                    </div>
                    <span class="consultation-time-badge">${c.date}</span>
                </div>
                <div class="text-xs text-muted mb-2 bg-light p-2 rounded">
                    <i class="bi bi-chat-left-dots text-primary me-1"></i> "${c.topic}"
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-xs text-muted"><i class="bi bi-clock me-1"></i> ${c.time}</span>
                    <button class="btn btn-primary btn-sm py-1 px-2 text-xs" onclick="joinMeeting('${c.student_name}')">
                        <i class="bi bi-camera-video-fill me-1"></i> Join Session
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 5. Render Student Activity Feed
    function renderActivityFeed() {
        const container = document.getElementById('studentActivityFeed');
        if (!container) return;

        container.innerHTML = mockStudentActivity.map(act => `
            <div class="d-flex align-items-start gap-2 pb-2 border-bottom">
                <img src="${act.avatar}" class="rounded-circle object-fit-cover mt-1" style="width: 28px; height: 28px;">
                <div class="flex-grow-1">
                    <div class="text-xs">
                        <span class="fw-bold text-dark">${act.student_name}</span> ${act.action}
                    </div>
                    <div class="text-muted" style="font-size: 11px;">${act.course} &bull; ${act.time}</div>
                </div>
            </div>
        `).join('');
    }

    window.joinMeeting = function (studentName) {
        Swal.fire({
            title: `Start Consultation with ${studentName}`,
            html: `
                <div class="p-3 bg-light rounded text-start text-xs mb-3">
                    <div class="fw-bold text-dark mb-1">Live Faculty Video Room</div>
                    <div class="text-muted">High-definition interactive session enabled with screen sharing and collaborative code editor.</div>
                </div>
                <div class="text-xs text-success fw-semibold"><i class="bi bi-shield-check me-1"></i> Encrypted University Room</div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Launch Live Classroom',
            confirmButtonColor: '#2563eb',
            cancelButtonText: 'Cancel'
        }).then((res) => {
            if (res.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Connecting Video Session...',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    // Initialize Dashboard Components
    renderStats();
    renderPendingSubmissions();
    renderCourses();
    renderConsultations();
    renderActivityFeed();
});
