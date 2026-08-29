/**
 * AUB Digital Academy - Teacher Dashboard Controller
 * LMS Faculty workspace: Pending reviews, consultations, assigned courses, and student activity.
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Core Faculty Demo Data
    const mockTeacherCourses = [
        {
            id: 1,
            title: 'Web Development',
            code: 'CS-WD101',
            category: 'Software Engineering',
            category_color: '#2563EB',
            students_count: 45,
            modules_count: 5,
            lessons_count: 15,
            pending_reviews: 8,
            rating: 4.9,
            status: 'Active',
            instructor: 'Dr. Sarah Johnson',
            instructor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
            banner: 'assets/images/course_webdev.jpg'
        },
        {
            id: 2,
            title: 'Python for Data Science & AI',
            code: 'CS-PY201',
            category: 'Data Science & Analytics',
            category_color: '#D97706',
            students_count: 38,
            modules_count: 4,
            lessons_count: 12,
            pending_reviews: 4,
            rating: 4.8,
            status: 'Active',
            instructor: 'Dr. Sarah Johnson',
            instructor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
            banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600'
        },
        {
            id: 3,
            title: 'Cloud DevOps Engineering',
            code: 'CS-CD301',
            category: 'Computer Science',
            category_color: '#059669',
            students_count: 29,
            modules_count: 5,
            lessons_count: 14,
            pending_reviews: 2,
            rating: 4.9,
            status: 'Active',
            instructor: 'Dr. Sarah Johnson',
            instructor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
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
            text: '<strong>Sokha</strong> submitted <span class="text-primary fw-semibold">REST API Project</span>',
            time: '15m ago',
            icon: 'bi-file-earmark-check-fill',
            theme: 'amber'
        },
        {
            text: '<strong>Sreyneang</strong> completed <span class="text-success fw-semibold">Database Quiz</span>',
            time: '1h ago',
            icon: 'bi-check-circle-fill',
            theme: 'green'
        },
        {
            text: '<strong>Dara</strong> submitted <span class="text-primary fw-semibold">Frontend Assignment</span>',
            time: '2h ago',
            icon: 'bi-file-earmark-code-fill',
            theme: 'blue'
        },
        {
            text: '<strong>Malis</strong> requested <span class="text-info fw-semibold">1-on-1 Consultation</span>',
            time: '3h ago',
            icon: 'bi-calendar-plus-fill',
            theme: 'purple'
        }
    ];

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Helper: Safe Image Resolution
    function resolveImgSrc(url) {
        if (!url) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600';
        if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/')) return url;
        return `../../${url}`;
    }

    // 1. Render Summary Cards
    function renderStats() {
        const elStudents = document.getElementById('statTeacherStudents');
        const elCourses = document.getElementById('statTeacherCourses');
        const elReviews = document.getElementById('statPendingReviews');
        const elConsultations = document.getElementById('statConsultations');

        if (elStudents) elStudents.textContent = '2,610';
        if (elCourses) elCourses.textContent = '3';
        if (elReviews) elReviews.textContent = '14';
        if (elConsultations) elConsultations.textContent = '5';
    }

    // 2. Render PENDING REVIEWS
    function renderPendingReviews() {
        const container = document.getElementById('pendingReviewsCardList');
        if (!container) return;

        container.innerHTML = mockPendingReviews.map(item => `
            <div class="pending-review-row">
                <div class="pending-review-info">
                    <div class="pending-review-title">${escapeHtml(item.assignment_title)}</div>
                    <div class="pending-review-meta">
                        <span class="pending-badge">
                            <i class="bi bi-clock-history"></i> ${item.pending_count} submissions pending
                        </span>
                        <span>&bull;</span>
                        <span>${escapeHtml(item.course_title)}</span>
                        ${item.due_date ? `<span>&bull;</span> <span class="text-muted">${escapeHtml(item.due_date)}</span>` : ''}
                    </div>
                </div>
                <a href="submissions.html?asgn=${item.id}" class="adm-btn adm-btn-primary adm-btn-sm" title="Grade Submissions">
                    Review
                </a>
            </div>
        `).join('');
    }

    // 3. Render MY COURSES
    function renderCourses() {
        const grid = document.getElementById('teacherCoursesGrid');
        if (!grid) return;

        grid.innerHTML = mockTeacherCourses.map(course => {
            const bannerSrc = resolveImgSrc(course.banner);
            return `
                <div class="col-md-6 col-xl-4">
                    <div class="teacher-course-card">
                        <div class="teacher-course-thumb" style="background-image: url('${bannerSrc}');">
                            <div class="teacher-course-thumb-overlay">
                                <div class="d-flex justify-content-between align-items-center w-100">
                                    <span class="teacher-course-badge-category">${escapeHtml(course.category)}</span>
                                    <span class="badge bg-warning text-dark text-xs fw-bold px-2 py-1"><i class="bi bi-star-fill me-0.5"></i> ${course.rating}</span>
                                </div>
                                <h6 class="teacher-course-thumb-title">${escapeHtml(course.title)}</h6>
                            </div>
                        </div>

                        <div class="teacher-course-body">
                            <div>
                                <div class="teacher-course-meta-pills">
                                    <span class="teacher-course-pill"><i class="bi bi-tag-fill text-primary"></i> ${escapeHtml(course.code)}</span>
                                    <span class="teacher-course-pill"><i class="bi bi-people-fill text-muted"></i> ${course.students_count} Students</span>
                                    <span class="teacher-course-pill"><i class="bi bi-collection-fill text-muted"></i> ${course.modules_count} Mod • ${course.lessons_count} Les</span>
                                </div>
                                <div class="teacher-course-instructor-line">
                                    <img src="${course.instructor_avatar}" alt="${escapeHtml(course.instructor)}" class="teacher-course-instructor-avatar">
                                    <span>Instructor: <strong class="text-dark">${escapeHtml(course.instructor)}</strong></span>
                                </div>
                            </div>

                            <div class="teacher-course-actions">
                                <a href="my-courses.html?id=${course.id}" class="adm-btn adm-btn-primary adm-btn-sm flex-fill">
                                    <i class="bi bi-sliders"></i> Manage Course
                                </a>
                                <a href="my-courses.html?id=${course.id}&view=overview" class="adm-btn adm-btn-outline adm-btn-sm">
                                    <i class="bi bi-eye"></i> View
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Render UPCOMING CONSULTATIONS
    function renderConsultations() {
        const container = document.getElementById('upcomingConsultationsList');
        if (!container) return;

        container.innerHTML = mockConsultations.map(c => `
            <div class="consultation-item-card">
                <div class="consultation-student-row">
                    <img src="${c.student_avatar}" class="consultation-student-avatar" alt="${escapeHtml(c.student_name)}">
                    <div>
                        <div class="consultation-student-name">${escapeHtml(c.student_name)}</div>
                        <div class="consultation-topic">${escapeHtml(c.topic)}</div>
                    </div>
                </div>
                <div class="consultation-footer-row">
                    <span class="consultation-time-badge">
                        <i class="bi bi-clock"></i> ${escapeHtml(c.time_display)}
                    </span>
                    <a href="one-on-one.html?id=${c.id}" class="adm-btn adm-btn-outline adm-btn-xs">
                        View Session
                    </a>
                </div>
            </div>
        `).join('');
    }

    // 5. Render RECENT STUDENT ACTIVITY
    function renderActivityFeed() {
        const container = document.getElementById('studentActivityFeed');
        if (!container) return;

        const themeMap = {
            amber: 'bg-warning bg-opacity-10 text-warning',
            green: 'bg-success bg-opacity-10 text-success',
            blue: 'bg-primary bg-opacity-10 text-primary',
            purple: 'bg-purple-lt text-purple'
        };

        container.innerHTML = mockStudentActivity.map(act => {
            const iconClass = themeMap[act.theme] || 'bg-light text-secondary';
            return `
                <div class="activity-feed-item">
                    <div class="activity-feed-icon ${iconClass}">
                        <i class="bi ${act.icon}"></i>
                    </div>
                    <div class="activity-feed-content">
                        <div class="activity-feed-text">${act.text}</div>
                        <div class="activity-feed-time">${act.time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Global Search Shortcut (Ctrl + K)
    window.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('teacherSearchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    // Initialize Dashboard
    renderStats();
    renderPendingReviews();
    renderCourses();
    renderConsultations();
    renderActivityFeed();
});
