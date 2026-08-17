/**
 * AUB Digital Academy - Teacher Courses & Curriculum Controller
 * Handles course listings, lesson creation, materials management, and syllabus reordering.
 */

document.addEventListener('DOMContentLoaded', function () {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    const API_BASE = (isLocal && window.location.port !== '5000') 
        ? 'http://localhost:5000/api' 
        : '/api';

    // Mock Courses
    const coursesData = [
        {
            id: 1,
            title: 'Full-Stack Web Development',
            category: 'Technology',
            students_count: 1250,
            lessons_count: 12,
            pending_reviews: 8,
            rating: 4.9,
            status: 'Active',
            description: 'Master frontend architecture, backend REST APIs, relational databases, and enterprise authentication.',
            banner: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=600',
            lessons: [
                { id: 1, order: 1, title: 'Course Overview & Dev Environment Setup', duration: '45 mins', is_free: 1 },
                { id: 2, order: 2, title: 'HTML5 Semantic Layouts & CSS Grid System', duration: '60 mins', is_free: 1 },
                { id: 3, order: 3, title: 'Modern JavaScript ES6+ Features', duration: '75 mins', is_free: 0 },
                { id: 4, order: 4, title: 'Node.js & Express.js REST API Architecture', duration: '90 mins', is_free: 0 },
                { id: 5, order: 5, title: 'Relational Database Design with SQLite & PostgreSQL', duration: '80 mins', is_free: 0 },
                { id: 6, order: 6, title: 'JWT Authentication & Role-Based Access Control', duration: '85 mins', is_free: 0 }
            ],
            materials: [
                { id: 1, title: 'Full-Stack Architecture Slide Deck (PDF)', size: '4.8 MB', date: 'Aug 10, 2026' },
                { id: 2, title: 'Database Normalization & Schema Cheatsheet', size: '1.2 MB', date: 'Aug 14, 2026' }
            ],
            students: [
                { name: 'Sreyneang Sok', id: '202401234', progress: '85%', last: '2h ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150' },
                { name: 'Sokha Chan', id: '202401235', progress: '78%', last: '5h ago', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150' },
                { name: 'Dara Keo', id: '202401236', progress: '92%', last: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150' }
            ]
        },
        {
            id: 2,
            title: 'Python for Data Science & AI',
            category: 'Data Science',
            students_count: 820,
            lessons_count: 10,
            pending_reviews: 4,
            rating: 4.8,
            status: 'Active',
            description: 'Learn NumPy, Pandas, statistical modeling, machine learning algorithms, and deep neural networks.',
            banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600',
            lessons: [
                { id: 101, order: 1, title: 'Python Fundamentals & Data Structures', duration: '50 mins', is_free: 1 },
                { id: 102, order: 2, title: 'Data Cleaning & Wrangling with Pandas', duration: '70 mins', is_free: 0 },
                { id: 103, order: 3, title: 'Statistical Analysis & Visualizations with Seaborn', duration: '65 mins', is_free: 0 }
            ],
            materials: [
                { id: 11, title: 'Pandas Data Wrangling Guide.pdf', size: '2.5 MB', date: 'Aug 12, 2026' }
            ],
            students: [
                { name: 'Vannak Chan', id: '202401239', progress: '65%', last: '1h ago', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150' },
                { name: 'Chanthou Meas', id: '202401235', progress: '70%', last: '3h ago', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150' }
            ]
        },
        {
            id: 3,
            title: 'Cloud Infrastructure & DevOps',
            category: 'Engineering',
            students_count: 450,
            lessons_count: 8,
            pending_reviews: 2,
            rating: 4.9,
            status: 'Active',
            description: 'Containerization with Docker, CI/CD pipelines, Kubernetes orchestration, and cloud architecture.',
            banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600',
            lessons: [
                { id: 201, order: 1, title: 'Cloud Fundamentals & AWS Services Overview', duration: '60 mins', is_free: 1 },
                { id: 202, order: 2, title: 'Docker Containers & Multi-Stage Builds', duration: '85 mins', is_free: 0 }
            ],
            materials: [
                { id: 21, title: 'Docker & Kubernetes Cheat Sheet.pdf', size: '3.1 MB', date: 'Aug 15, 2026' }
            ],
            students: [
                { name: 'Kanha Rath', id: '202401237', progress: '90%', last: '4h ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150' }
            ]
        }
    ];

    let currentSelectedCourse = coursesData[0];
    const courseManageModalEl = document.getElementById('courseManageModal');
    const courseManageModal = courseManageModalEl ? new bootstrap.Modal(courseManageModalEl) : null;

    // 1. Render Courses Grid
    function renderCoursesGrid(courses) {
        const grid = document.getElementById('coursesListGrid');
        if (!grid) return;

        grid.innerHTML = courses.map(course => `
            <div class="col-lg-4 col-md-6">
                <div class="teacher-course-card">
                    <div class="teacher-course-banner" style="background-image: url('${course.banner}');">
                        <div class="position-absolute top-0 start-0 p-3 z-1">
                            <span class="badge bg-dark bg-opacity-75 text-white text-xs">${course.category}</span>
                        </div>
                        <div class="position-absolute top-0 end-0 p-3 z-1">
                            <span class="badge bg-warning text-dark text-xs fw-bold"><i class="bi bi-star-fill me-1"></i> ${course.rating}</span>
                        </div>
                        <div class="position-absolute bottom-0 start-0 p-3 z-1 text-white">
                            <h5 class="fw-bold mb-0 text-white">${course.title}</h5>
                        </div>
                    </div>

                    <div class="teacher-course-body">
                        <p class="text-muted text-xs mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${course.description}
                        </p>

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
                            <button type="button" class="btn btn-primary btn-sm flex-fill" onclick="openCourseManageModal(${course.id})">
                                <i class="bi bi-sliders me-1"></i> Manage Content
                            </button>
                            <a href="my-students.html?course=${course.id}" class="btn btn-outline-secondary btn-sm flex-fill">
                                <i class="bi bi-people me-1"></i> View Students
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 2. Open Course Management Modal (Requirement 5)
    window.openCourseManageModal = function (courseId) {
        const course = coursesData.find(c => c.id === courseId) || coursesData[0];
        currentSelectedCourse = course;

        document.getElementById('modalCourseTitle').textContent = course.title;
        document.getElementById('modalCourseSubtitle').textContent = `Category: ${course.category} • ${course.students_count.toLocaleString()} Enrolled Students`;
        document.getElementById('courseDescContent').textContent = course.description;
        document.getElementById('courseActiveStudents').textContent = course.students_count.toLocaleString();
        document.getElementById('courseTotalLessons').textContent = course.lessons.length;
        document.getElementById('courseRating').textContent = `${course.rating} ⭐`;

        renderLessonsTab(course);
        renderMaterialsTab(course);
        renderStudentsTab(course);

        if (courseManageModal) courseManageModal.show();
    };

    function renderLessonsTab(course) {
        const container = document.getElementById('lessonsListContainer');
        if (!container) return;

        container.innerHTML = course.lessons.map((lesson, idx) => `
            <div class="lesson-draggable-item">
                <div class="d-flex align-items-center gap-3">
                    <span class="badge bg-light text-dark border font-monospace text-xs">${idx + 1}</span>
                    <div>
                        <div class="fw-bold text-dark text-sm">${lesson.title}</div>
                        <div class="text-xs text-muted"><i class="bi bi-clock me-1"></i> ${lesson.duration} &bull; ${lesson.is_free ? '<span class="text-success fw-semibold">Preview Available</span>' : '<span class="text-muted">Enrolled Only</span>'}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <button class="btn btn-outline-secondary btn-sm py-1 px-2" title="Move Up" onclick="moveLesson(${course.id}, ${idx}, -1)">
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm py-1 px-2" title="Move Down" onclick="moveLesson(${course.id}, ${idx}, 1)">
                        <i class="bi bi-arrow-down"></i>
                    </button>
                    <button class="btn btn-outline-primary btn-sm py-1 px-2" title="Edit Lesson" onclick="editLesson(${course.id}, ${lesson.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function renderMaterialsTab(course) {
        const container = document.getElementById('courseMaterialsList');
        if (!container) return;

        container.innerHTML = course.materials.map(mat => `
            <div class="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-3">
                    <div class="p-2 bg-primary bg-opacity-10 text-primary rounded">
                        <i class="bi bi-file-earmark-pdf fs-4"></i>
                    </div>
                    <div>
                        <div class="fw-bold text-dark text-sm">${mat.title}</div>
                        <div class="text-xs text-muted">${mat.size} &bull; Uploaded ${mat.date}</div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-secondary btn-sm text-xs" onclick="Swal.fire({ icon: 'info', title: 'Downloading file...' })">
                        <i class="bi bi-download"></i> Download
                    </button>
                    <button class="btn btn-outline-danger btn-sm text-xs" onclick="deleteMaterial(${course.id}, ${mat.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function renderStudentsTab(course) {
        const tbody = document.getElementById('courseStudentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = course.students.map(st => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${st.avatar}" class="rounded-circle" style="width: 32px; height: 32px;">
                        <span class="fw-bold text-dark text-sm">${st.name}</span>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border font-monospace text-xs">${st.id}</span></td>
                <td>
                    <div class="d-flex align-items-center gap-2" style="width: 140px;">
                        <div class="progress flex-grow-1" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: ${st.progress};"></div>
                        </div>
                        <span class="text-xs fw-bold text-dark">${st.progress}</span>
                    </div>
                </td>
                <td class="text-muted text-xs">${st.last}</td>
                <td class="text-end">
                    <a href="my-students.html" class="btn btn-outline-primary btn-sm py-1 px-2 text-xs">
                        <i class="bi bi-eye me-1"></i> Profile
                    </a>
                </td>
            </tr>
        `).join('');
    }

    window.openAddLessonModal = async function () {
        const { value: formValues } = await Swal.fire({
            title: 'Add New Lesson',
            html: `
                <div class="text-start">
                    <div class="mb-3">
                        <label class="form-label text-xs fw-bold text-muted">Lesson Title *</label>
                        <input type="text" id="swalLessonTitle" class="form-control form-control-sm" placeholder="e.g. Asynchronous JavaScript & Promises">
                    </div>
                    <div class="mb-3">
                        <label class="form-label text-xs fw-bold text-muted">Duration Estimate</label>
                        <input type="text" id="swalLessonDuration" class="form-control form-control-sm" value="60 mins">
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="swalLessonFree">
                        <label class="form-check-label text-xs text-muted" for="swalLessonFree">Allow free public preview</label>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Lesson',
            confirmButtonColor: '#2563eb',
            preConfirm: () => {
                const title = document.getElementById('swalLessonTitle').value.trim();
                if (!title) { Swal.showValidationMessage('Lesson title is required'); return false; }
                return {
                    title: title,
                    duration: document.getElementById('swalLessonDuration').value.trim() || '45 mins',
                    is_free: document.getElementById('swalLessonFree').checked ? 1 : 0
                };
            }
        });

        if (formValues && currentSelectedCourse) {
            const nextOrder = currentSelectedCourse.lessons.length + 1;
            currentSelectedCourse.lessons.push({
                id: Date.now(),
                order: nextOrder,
                title: formValues.title,
                duration: formValues.duration,
                is_free: formValues.is_free
            });
            renderLessonsTab(currentSelectedCourse);
            Swal.fire({ icon: 'success', title: 'Lesson Added', timer: 1400, showConfirmButton: false });
        }
    };

    window.openUploadMaterialModal = async function () {
        const { value: title } = await Swal.fire({
            title: 'Upload Learning Material',
            input: 'text',
            inputLabel: 'Document / Slide Title',
            inputPlaceholder: 'e.g. Lecture 4 Architecture Slides.pdf',
            showCancelButton: true,
            confirmButtonText: 'Upload File',
            confirmButtonColor: '#2563eb'
        });

        if (title && currentSelectedCourse) {
            currentSelectedCourse.materials.push({
                id: Date.now(),
                title: title,
                size: '3.4 MB',
                date: 'Aug 18, 2026'
            });
            renderMaterialsTab(currentSelectedCourse);
            Swal.fire({ icon: 'success', title: 'Material Uploaded', timer: 1400, showConfirmButton: false });
        }
    };

    window.moveLesson = function (courseId, index, direction) {
        const course = coursesData.find(c => c.id === courseId);
        if (!course) return;

        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= course.lessons.length) return;

        const temp = course.lessons[index];
        course.lessons[index] = course.lessons[targetIndex];
        course.lessons[targetIndex] = temp;

        renderLessonsTab(course);
    };

    window.deleteMaterial = function (courseId, matId) {
        const course = coursesData.find(c => c.id === courseId);
        if (!course) return;

        course.materials = course.materials.filter(m => m.id !== matId);
        renderMaterialsTab(course);
    };

    // Initialize
    renderCoursesGrid(coursesData);
});
