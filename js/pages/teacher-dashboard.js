/**
 * AUB Digital Academy - Teacher Dashboard Controller
 * LMS Faculty workspace: Pending reviews, consultations, assigned courses, and student activity.
 */

document.addEventListener('DOMContentLoaded', function () {
    const mockTeacherCourses = [
        {
            id: 1,
            title: 'Full-Stack Web Development',
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
            category: 'Technology',
            students_count: 820,
            lessons_count: 10,
            pending_reviews: 4,
            rating: 4.8,
            status: 'Active',
            banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600'
        },
        {
            id: 3,
            title: 'Cloud DevOps',
            category: 'Technology',
            students_count: 540,
            lessons_count: 8,
            pending_reviews: 2,
            rating: 4.9,
            status: 'Active',
            banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600'
        }
    ];

    const mockPendingReviews = [
        {
            id: 1,
            assignment_title: 'REST API Project',
            course_title: 'Full-Stack Web Development',
            pending_count: 8,
            due_date: 'Due in 2 days'
        },
        {
            id: 2,
            assignment_title: 'Frontend Responsive UI Layout',
            course_title: 'Full-Stack Web Development',
            pending_count: 4,
            due_date: 'Due in 4 days'
        },
        {
            id: 3,
            assignment_title: 'Data Cleaning & Visualisation with Pandas',
            course_title: 'Python for Data Science & AI',
            pending_count: 2,
            due_date: 'Due tomorrow'
        }
    ];

    const mockConsultations = [
        {
            id: 1,
            student_name: 'Sokha Chan',
            student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
            topic: 'Backend Architecture',
            time_display: 'Today • 3:00 PM',
            course: 'Full-Stack Web Development'
        },
        {
            id: 2,
            student_name: 'Sreyneang Sok',
            student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            topic: 'Database Schema Normalization',
            time_display: 'Tomorrow • 2:00 PM',
            course: 'Full-Stack Web Development'
        }
    ];

    const mockStudentActivity = [
        {
            text: '<b>Sokha</b> submitted <span class="text-primary fw-semibold">REST API Project</span>',
            time: '15m ago',
            icon: 'bi-file-earmark-check-fill text-warning'
        },
        {
            text: '<b>Dara</b> completed <span class="text-success fw-semibold">Lesson 8</span>',
            time: '45m ago',
            icon: 'bi-check-circle-fill text-success'
        },
        {
            text: '<b>Malis</b> requested <span class="text-info fw-semibold">1-on-1 consultation</span>',
            time: '1h ago',
            icon: 'bi-calendar-plus-fill text-info'
        },
        {
            text: '<b>Kanha</b> submitted <span class="text-primary fw-semibold">Docker Microservice</span>',
            time: '2h ago',
            icon: 'bi-file-earmark-check-fill text-warning'
        }
    ];

    // 1. Render Summary Cards
    function renderStats() {
        const totalStudents = mockTeacherCourses.reduce((sum, c) => sum + c.students_count, 0);
        const totalCourses = mockTeacherCourses.length;
        const pendingReviews = mockTeacherCourses.reduce((sum, c) => sum + c.pending_reviews, 0);

        const elStudents = document.getElementById('statTeacherStudents');
        const elCourses = document.getElementById('statTeacherCourses');
        const elReviews = document.getElementById('statPendingReviews');
        const elConsultations = document.getElementById('statConsultations');

        if (elStudents) elStudents.textContent = totalStudents.toLocaleString();
        if (elCourses) elCourses.textContent = totalCourses;
        if (elReviews) elReviews.textContent = pendingReviews;
        if (elConsultations) elConsultations.textContent = 5;
    }

    // 2. Render PENDING REVIEWS (Requirement 9)
    function renderPendingReviews() {
        const container = document.getElementById('pendingReviewsCardList');
        if (!container) return;

        container.innerHTML = mockPendingReviews.map(item => `
            <div class="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                    <h6 class="fw-bold text-dark mb-1 text-sm">${item.assignment_title}</h6>
                    <div class="text-xs text-muted">
                        <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 me-1">
                            ${item.pending_count} submissions pending
                        </span>
                        &bull; ${item.course_title}
                    </div>
                </div>
                <a href="submissions.html?asgn=${item.id}" class="btn btn-primary btn-sm px-3 text-xs fw-semibold">
                    Review
                </a>
            </div>
        `).join('');
    }

    // 3. Render MY COURSES (Requirement 5 & 9)
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
                            <span class="badge bg-warning text-dark text-xs fw-bold"><i class="bi bi-star-fill me-1"></i> ${course.rating} ★</span>
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
                                <strong>${course.lessons_count} Lessons</strong>
                            </div>
                            <div class="teacher-meta-item">
                                <span>Pending</span>
                                <strong class="text-warning">${course.pending_reviews} to review</strong>
                            </div>
                            <div class="teacher-meta-item">
                                <span>Rating</span>
                                <strong class="text-warning">${course.rating} ★</strong>
                            </div>
                        </div>

                        <div class="d-flex gap-2 mt-auto pt-2">
                            <a href="my-courses.html?id=${course.id}" class="btn btn-outline-primary btn-sm flex-fill text-xs fw-semibold">
                                Open Course <i class="bi bi-arrow-right ms-1"></i>
                            </a>
                            <a href="my-students.html?course=${course.id}" class="btn btn-outline-secondary btn-sm flex-fill text-xs">
                                Students
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 4. Render UPCOMING CONSULTATIONS (Requirement 9)
    function renderConsultations() {
        const container = document.getElementById('upcomingConsultationsList');
        if (!container) return;

        container.innerHTML = mockConsultations.map(c => `
            <div class="consultation-card" style="border-left: 4px solid #2563EB;">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${c.student_avatar}" class="rounded-circle object-fit-cover" style="width: 34px; height: 34px;">
                        <div>
                            <div class="fw-bold text-dark text-xs">Student: ${c.student_name}</div>
                            <div class="text-muted text-xs" style="font-size: 11px;">Topic: ${c.topic}</div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                    <span class="text-xs text-primary fw-semibold"><i class="bi bi-clock me-1"></i> ${c.time_display}</span>
                    <a href="one-on-one.html" class="btn btn-outline-primary btn-sm py-0 px-2 text-xs">
                        View Session
                    </a>
                </div>
            </div>
        `).join('');
    }

    // 5. Render RECENT STUDENT ACTIVITY (Requirement 9)
    function renderActivityFeed() {
        const container = document.getElementById('studentActivityFeed');
        if (!container) return;

        container.innerHTML = mockStudentActivity.map(act => `
            <div class="d-flex align-items-start gap-2 pb-2 border-bottom">
                <i class="bi ${act.icon} fs-5 mt-0"></i>
                <div class="flex-grow-1">
                    <div class="text-xs text-dark">${act.text}</div>
                    <div class="text-muted" style="font-size: 11px;">${act.time}</div>
                </div>
            </div>
        `).join('');
    }

    // Initialize
    renderStats();
    renderPendingReviews();
    renderCourses();
    renderConsultations();
    renderActivityFeed();
});
