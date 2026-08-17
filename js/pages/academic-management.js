// ==========================================
// AUB Digital Academy - Academic Management Controller
// Comprehensive Programs, Courses, Chapter/Module Manager, Categories & Instructors CRUD
// Integrated with SweetAlert2 & AdminMockStore
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
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

    let allPrograms = [];
    let allCourses = [];
    let allCategories = [];
    let allInstructors = [];
    let activeChapterCourseId = null;

    // Modals
    const programModalEl = document.getElementById('createProgramModal');
    const programModal = programModalEl ? new bootstrap.Modal(programModalEl) : null;

    const courseModalEl = document.getElementById('createCourseModal');
    const courseModal = courseModalEl ? new bootstrap.Modal(courseModalEl) : null;

    const chaptersModalEl = document.getElementById('chaptersModal');
    const chaptersModal = chaptersModalEl ? new bootstrap.Modal(chaptersModalEl) : null;

    const categoryModalEl = document.getElementById('createCategoryModal');
    const categoryModal = categoryModalEl ? new bootstrap.Modal(categoryModalEl) : null;

    const instructorModalEl = document.getElementById('createInstructorModal');
    const instructorModal = instructorModalEl ? new bootstrap.Modal(instructorModalEl) : null;

    const viewCourseModalEl = document.getElementById('viewCourseModal');
    const viewCourseModal = viewCourseModalEl ? new bootstrap.Modal(viewCourseModalEl) : null;
    let activeCourseInView = null;

    // ==========================================
    // 1. PROGRAMS MANAGEMENT
    // ==========================================
    async function loadPrograms() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/programs`, { 
                headers: getHeaders(), 
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allPrograms = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allPrograms = window.AdminStore.getPrograms();
        }

        renderProgramsTable(allPrograms);
    }

    function renderProgramsTable(programs) {
        const tbody = document.getElementById('programsTableBody');
        if (!tbody) return;

        if (programs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-mortarboard fs-3 d-block mb-2 text-secondary opacity-50"></i>No academic programs found</td></tr>`;
            return;
        }

        tbody.innerHTML = programs.map(p => `
            <tr>
                <td class="text-muted fw-bold" style="font-size: 12px;">#${p.order_num || 1}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-2 p-1 d-flex align-items-center justify-content-center bg-light border" style="width: 34px; height: 34px; flex-shrink: 0;">
                            <i class="bi ${escapeHtml(p.icon_class || 'bi-laptop')} text-primary" style="font-size: 15px;"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(p.title)}</div>
                            <div class="text-muted text-truncate" style="font-size: 11px; max-width: 280px;">${escapeHtml(p.description || '')}</div>
                        </div>
                    </div>
                </td>
                <td class="text-muted fw-semibold" style="font-size: 11.5px;">${escapeHtml(p.degree_type || 'BACHELOR DEGREE')}</td>
                <td class="text-muted" style="font-size: 12px;">${escapeHtml(p.duration || '4 Years')}</td>
                <td><span class="badge bg-light text-secondary border px-2 py-1" style="font-size: 11px;">${escapeHtml(p.theme_class || 'theme-blue')}</span></td>
                <td>
                    <span class="admin-status-badge ${p.is_published ? 'published' : 'draft'} cursor-pointer" onclick="toggleProgramStatus(${p.id})" title="Click to toggle publish">
                        <i class="bi ${p.is_published ? 'bi-check-circle-fill' : 'bi-dash-circle'} me-1"></i>
                        ${p.is_published ? 'Published' : 'Draft'}
                    </span>
                </td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="action-btn" title="Edit Program" onclick="openEditProgramModal(${p.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" title="Delete Program" onclick="deleteProgram(${p.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.openCreateProgramModal = function () {
        document.getElementById('programForm').reset();
        document.getElementById('programId').value = '';
        document.getElementById('programPublished').checked = true;
        document.getElementById('programModalTitle').textContent = 'Add New Featured Program';
        if (programModal) programModal.show();
    };

    window.openEditProgramModal = function (id) {
        const p = allPrograms.find(prog => prog.id === id);
        if (!p) return;

        document.getElementById('programId').value = p.id;
        document.getElementById('programTitle').value = p.title;
        document.getElementById('programDegree').value = p.degree_type || 'BACHELOR DEGREE';
        document.getElementById('programDuration').value = p.duration || '4 Years';
        document.getElementById('programIcon').value = p.icon_class || 'bi-laptop';
        document.getElementById('programTheme').value = p.theme_class || 'theme-blue';
        document.getElementById('programDesc').value = p.description || '';
        document.getElementById('programUrl').value = p.detail_url || '';
        document.getElementById('programOrder').value = p.order_num || 1;
        document.getElementById('programPublished').checked = p.is_published === 1;
        document.getElementById('programModalTitle').textContent = 'Edit Featured Program';

        if (programModal) programModal.show();
    };

    const programForm = document.getElementById('programForm');
    if (programForm) {
        programForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const id = document.getElementById('programId').value;
            const title = document.getElementById('programTitle').value.trim();
            const payload = {
                title: title,
                degree_type: document.getElementById('programDegree').value.trim(),
                duration: document.getElementById('programDuration').value.trim(),
                icon_class: document.getElementById('programIcon').value.trim(),
                theme_class: document.getElementById('programTheme').value,
                description: document.getElementById('programDesc').value.trim(),
                detail_url: document.getElementById('programUrl').value.trim(),
                order_num: parseInt(document.getElementById('programOrder').value) || 1,
                is_published: document.getElementById('programPublished').checked ? 1 : 0
            };

            if (id) {
                if (window.AdminStore) {
                    window.AdminStore.updateProgram(id, payload);
                    allPrograms = window.AdminStore.getPrograms();
                }
                if (programModal) programModal.hide();
                renderProgramsTable(allPrograms);
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Program Updated', `"${title}" has been successfully updated.`);
            } else {
                if (window.AdminStore) {
                    window.AdminStore.createProgram(payload);
                    allPrograms = window.AdminStore.getPrograms();
                }
                if (programModal) programModal.hide();
                renderProgramsTable(allPrograms);
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Program Created', `"${title}" has been added to academic programs.`);
            }

            try {
                const url = id ? `${API_BASE}/admin/programs/${id}` : `${API_BASE}/admin/programs`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {}
        });
    }

    window.toggleProgramStatus = async function (id) {
        let prog = null;
        if (window.AdminStore) {
            prog = window.AdminStore.toggleProgramPublish(id);
            allPrograms = window.AdminStore.getPrograms();
        }
        renderProgramsTable(allPrograms);
        if (prog && window.AdminStore) {
            window.AdminStore.constructor.toast(`Program is now ${prog.is_published ? 'Published' : 'Draft'}`, 'info');
        }

        try {
            await fetch(`${API_BASE}/admin/programs/${id}/toggle-publish`, { method: 'PATCH', headers: getHeaders() });
        } catch (e) {}
    };

    window.deleteProgram = async function (id) {
        const prog = allPrograms.find(p => p.id === id);
        const name = prog ? prog.title : 'this program';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Program?',
                `Are you sure you want to delete "${name}"?`,
                'Yes, Delete Program',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to delete "${name}"?`);
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteProgram(id);
            allPrograms = window.AdminStore.getPrograms();
        }
        renderProgramsTable(allPrograms);

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`Program "${name}" deleted`, 'success');
        }

        try {
            await fetch(`${API_BASE}/admin/programs/${id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (e) {}
    };

    // ==========================================
    // 2. COURSES MANAGEMENT
    // ==========================================
    async function loadCourses() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/courses`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allCourses = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allCourses = window.AdminStore.getCourses();
        }

        applyCourseFilters();
    }

    function renderCoursesTable(courses) {
        const tbody = document.getElementById('coursesTableBody');
        if (!tbody) return;

        if (courses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-journal-x fs-3 d-block mb-2 text-secondary opacity-50"></i>No courses found matching criteria</td></tr>`;
            return;
        }

        tbody.innerHTML = courses.map(c => {
            const chapterCount = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id).length : 4;
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2 cursor-pointer" onclick="openViewCourseModal(${c.id})" title="Click to view course details">
                            <img src="../../${escapeHtml(c.thumbnail_url)}" class="rounded-2 object-fit-cover border" style="width: 44px; height: 32px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=100'">
                            <div>
                                <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(c.title)}</div>
                                <div class="text-muted" style="font-size: 11px;">
                                    <i class="bi bi-star-fill text-warning me-1"></i>${c.rating || '4.8'} 
                                    <span class="ms-1">(${c.enrolled_students_count || 0} enrolled)</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill" style="font-size: 11px;">${escapeHtml(c.category_name || 'General')}</span></td>
                    <td class="text-muted" style="font-size: 12px;">${escapeHtml(c.instructor_name || 'Faculty Staff')}</td>
                    <td>
                        <button class="btn btn-sm btn-light border py-1 px-2 d-inline-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="openChaptersModal(${c.id})" title="Manage Course Chapters">
                            <i class="bi bi-collection-play text-primary"></i>
                            <span class="fw-bold text-dark">${chapterCount}</span> Chapters (${c.lesson_count || 12} Lessons)
                        </button>
                    </td>
                    <td><span class="badge bg-light text-dark border px-2 py-1" style="font-size: 11px;">${escapeHtml(c.difficulty || 'Beginner')}</span></td>
                    <td>
                        <span class="admin-status-badge ${c.is_published ? 'published' : 'draft'} cursor-pointer" onclick="toggleCourseStatus(${c.id})" title="Click to toggle publish">
                            <i class="bi ${c.is_published ? 'bi-check-circle-fill' : 'bi-dash-circle'} me-1"></i>
                            ${c.is_published ? 'Published' : 'Draft'}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex gap-1">
                            <button class="action-btn" title="View Course Details" onclick="openViewCourseModal(${c.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="action-btn text-primary" title="Manage Chapters & Modules" onclick="openChaptersModal(${c.id})">
                                <i class="bi bi-collection-play"></i>
                            </button>
                            <button class="action-btn" title="Edit Course" onclick="openEditCourseModal(${c.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="action-btn delete" title="Delete Course" onclick="deleteCourse(${c.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function applyCourseFilters() {
        const q = (document.getElementById('academicSearchInput')?.value || '').toLowerCase().trim();
        const catFilter = (document.getElementById('courseCategoryFilter')?.value || 'all').toLowerCase();

        const filtered = allCourses.filter(c => {
            const matchQuery = !q || 
                (c.title && c.title.toLowerCase().includes(q)) ||
                (c.description && c.description.toLowerCase().includes(q)) ||
                (c.instructor_name && c.instructor_name.toLowerCase().includes(q));

            const matchCat = catFilter === 'all' || 
                (c.category_name && c.category_name.toLowerCase() === catFilter) ||
                (c.category_id && String(c.category_id) === catFilter);

            return matchQuery && matchCat;
        });

        renderCoursesTable(filtered);
    }

    const courseCatFilter = document.getElementById('courseCategoryFilter');
    if (courseCatFilter) {
        courseCatFilter.addEventListener('change', applyCourseFilters);
    }

    const academicSearchInput = document.getElementById('academicSearchInput');
    if (academicSearchInput) {
        academicSearchInput.addEventListener('input', () => {
            applyCourseFilters();
            const q = academicSearchInput.value.toLowerCase().trim();
            if (allPrograms.length > 0) {
                const filteredProgs = allPrograms.filter(p => !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
                renderProgramsTable(filteredProgs);
            }
        });
    }

    // View Course Details Modal
    window.openViewCourseModal = function (courseId) {
        const c = allCourses.find(course => course.id === courseId);
        if (!c) return;

        activeCourseInView = c;
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id) : [];

        const body = document.getElementById('viewCourseModalBody');
        const titleEl = document.getElementById('viewCourseModalTitle');
        if (titleEl) titleEl.textContent = `Course Syllabus: ${c.title}`;

        if (body) {
            body.innerHTML = `
                <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-3 mb-3 border">
                    <img src="../../${escapeHtml(c.thumbnail_url)}" class="rounded-3 object-fit-cover border shadow-sm" style="width: 80px; height: 60px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=150'">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1">${escapeHtml(c.category_name || 'Academic')}</span>
                            <span class="badge bg-light text-dark border px-2 py-1">${escapeHtml(c.difficulty || 'Beginner')}</span>
                            <span class="admin-status-badge ${c.is_published ? 'published' : 'draft'}">${c.is_published ? 'Published' : 'Draft'}</span>
                            ${c.badge ? `<span class="badge bg-warning bg-opacity-10 text-dark border border-warning px-2 py-1">${escapeHtml(c.badge)}</span>` : ''}
                        </div>
                        <h5 class="fw-bold text-dark mb-1">${escapeHtml(c.title)}</h5>
                        <div class="text-muted" style="font-size: 12px;">
                            <i class="bi bi-person-badge me-1"></i> Instructor: <span class="text-dark fw-semibold">${escapeHtml(c.instructor_name)}</span> &bull; 
                            <i class="bi bi-clock ms-2 me-1"></i> ${escapeHtml(c.duration || '8 Weeks')} &bull; 
                            <i class="bi bi-people ms-2 me-1"></i> ${c.enrolled_students_count || 0} Students &bull; 
                            <i class="bi bi-star-fill text-warning ms-2 me-1"></i> ${c.rating || '4.8'}
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <h6 class="text-xs fw-bold text-uppercase text-muted mb-2">Course Overview & Syllabus</h6>
                    <p class="text-secondary bg-white p-3 rounded-2 border" style="font-size: 13px; line-height: 1.6;">
                        ${escapeHtml(c.description || 'Comprehensive curriculum designed for student mastery.')}
                    </p>
                </div>

                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-xs fw-bold text-uppercase text-muted mb-0">Syllabus Chapters (${chapters.length})</h6>
                        <span class="text-muted" style="font-size: 11.5px;">Total Lessons: ${c.lesson_count || 12}</span>
                    </div>

                    ${chapters.length === 0 ? `
                        <div class="text-center py-3 text-muted border rounded-2 bg-light" style="font-size: 12px;">
                            No chapters registered yet for this course.
                        </div>
                    ` : `
                        <div class="d-flex flex-column gap-2" style="max-height: 240px; overflow-y: auto;">
                            ${chapters.map(ch => `
                                <div class="p-2 px-3 bg-light rounded-2 border d-flex align-items-center justify-content-between">
                                    <div>
                                        <span class="badge bg-secondary me-2" style="font-size: 10px;">Ch ${ch.chapter_num}</span>
                                        <span class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(ch.title)}</span>
                                        <div class="text-muted text-truncate mt-1" style="font-size: 11px; max-width: 480px;">${escapeHtml(ch.description || '')}</div>
                                    </div>
                                    <div class="text-end flex-shrink-0 ms-2">
                                        <span class="badge bg-white text-primary border" style="font-size: 11px;">${ch.lesson_count || 3} Lessons</span>
                                        <div class="text-muted" style="font-size: 10.5px; margin-top: 2px;">${escapeHtml(ch.duration || '2 Hours')}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }

        if (viewCourseModal) viewCourseModal.show();
    };

    const manageChaptersFromViewBtn = document.getElementById('manageChaptersFromViewBtn');
    if (manageChaptersFromViewBtn) {
        manageChaptersFromViewBtn.addEventListener('click', function () {
            if (viewCourseModal) viewCourseModal.hide();
            if (activeCourseInView) {
                openChaptersModal(activeCourseInView.id);
            }
        });
    }

    const editCourseFromViewBtn = document.getElementById('editCourseFromViewBtn');
    if (editCourseFromViewBtn) {
        editCourseFromViewBtn.addEventListener('click', function () {
            if (viewCourseModal) viewCourseModal.hide();
            if (activeCourseInView) {
                openEditCourseModal(activeCourseInView.id);
            }
        });
    }

    window.openCreateCourseModal = function () {
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
        document.getElementById('courseModalTitle').textContent = 'Add New Specialized Course';
        populateCourseSelects();
        if (courseModal) courseModal.show();
    };

    window.openEditCourseModal = function (id) {
        const c = allCourses.find(course => course.id === id);
        if (!c) return;

        populateCourseSelects();
        document.getElementById('courseId').value = c.id;
        document.getElementById('courseTitle').value = c.title;
        document.getElementById('courseDifficulty').value = c.difficulty || 'Beginner';
        document.getElementById('courseCategorySelect').value = c.category_id || 1;
        document.getElementById('courseInstructorSelect').value = c.instructor_id || 1;
        document.getElementById('courseDuration').value = c.duration || '8 Weeks';
        document.getElementById('courseLessons').value = c.lesson_count || 12;
        document.getElementById('courseBadge').value = c.badge || '';
        document.getElementById('courseDesc').value = c.description || '';
        document.getElementById('courseModalTitle').textContent = 'Edit Specialized Course';

        if (courseModal) courseModal.show();
    };

    function populateCourseSelects() {
        const catSelect = document.getElementById('courseCategorySelect');
        if (catSelect && allCategories.length > 0) {
            catSelect.innerHTML = allCategories.map(cat => `
                <option value="${cat.id}">${escapeHtml(cat.name)}</option>
            `).join('');
        }

        const insSelect = document.getElementById('courseInstructorSelect');
        if (insSelect && allInstructors.length > 0) {
            insSelect.innerHTML = allInstructors.map(ins => `
                <option value="${ins.id}">${escapeHtml(ins.name)} (${escapeHtml(ins.title || 'Faculty')})</option>
            `).join('');
        }
    }

    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const id = document.getElementById('courseId').value;
            const title = document.getElementById('courseTitle').value.trim();
            const payload = {
                title: title,
                category_id: parseInt(document.getElementById('courseCategorySelect').value) || 1,
                instructor_id: parseInt(document.getElementById('courseInstructorSelect').value) || 1,
                difficulty: document.getElementById('courseDifficulty').value,
                duration: document.getElementById('courseDuration').value.trim(),
                lesson_count: parseInt(document.getElementById('courseLessons').value) || 12,
                badge: document.getElementById('courseBadge').value.trim(),
                description: document.getElementById('courseDesc').value.trim(),
                is_published: 1
            };

            if (id) {
                if (window.AdminStore) {
                    window.AdminStore.updateCourse(id, payload);
                    allCourses = window.AdminStore.getCourses();
                }
                if (courseModal) courseModal.hide();
                applyCourseFilters();
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Course Updated', `"${title}" details have been updated successfully.`);
            } else {
                if (window.AdminStore) {
                    const newCourse = window.AdminStore.createCourse(payload);
                    // Add initial sample chapters for newly created course
                    window.AdminStore.createChapter({
                        course_id: newCourse.id,
                        chapter_num: 1,
                        title: 'Foundations & Architecture Overview',
                        duration: '2 Hours',
                        lesson_count: 3,
                        description: 'Core introductory concepts and system setup.'
                    });
                    window.AdminStore.createChapter({
                        course_id: newCourse.id,
                        chapter_num: 2,
                        title: 'Hands-on Implementation & Best Practices',
                        duration: '3 Hours',
                        lesson_count: 4,
                        description: 'Step-by-step practical laboratory exercise.'
                    });
                    allCourses = window.AdminStore.getCourses();
                }
                if (courseModal) courseModal.hide();
                applyCourseFilters();
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Course Created', `"${title}" has been created with default starter modules.`);
            }

            try {
                const url = id ? `${API_BASE}/admin/courses/${id}` : `${API_BASE}/admin/courses`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {}
        });
    }

    window.toggleCourseStatus = async function (id) {
        let course = null;
        if (window.AdminStore) {
            course = window.AdminStore.toggleCoursePublish(id);
            allCourses = window.AdminStore.getCourses();
        }
        applyCourseFilters();
        if (course && window.AdminStore) {
            window.AdminStore.constructor.toast(`Course is now ${course.is_published ? 'Published' : 'Draft'}`, 'info');
        }

        try {
            await fetch(`${API_BASE}/admin/courses/${id}/toggle-publish`, { method: 'PATCH', headers: getHeaders() });
        } catch (e) {}
    };

    window.deleteCourse = async function (id) {
        const course = allCourses.find(c => c.id === id);
        const name = course ? course.title : 'this course';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Course?',
                `Are you sure you want to delete "${name}" and all its syllabus chapters?`,
                'Yes, Delete Course',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to delete "${name}"?`);
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteCourse(id);
            allCourses = window.AdminStore.getCourses();
        }
        applyCourseFilters();

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`Course "${name}" deleted`, 'success');
        }

        try {
            await fetch(`${API_BASE}/admin/courses/${id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (e) {}
    };

    // ==========================================
    // 3. CHAPTER / MODULE MANAGEMENT
    // ==========================================
    window.openChaptersModal = function (courseId) {
        activeChapterCourseId = courseId;
        const course = allCourses.find(c => c.id === courseId);
        if (!course) return;

        const titleEl = document.getElementById('chaptersModalTitle');
        const subEl = document.getElementById('chaptersModalSubtitle');
        if (titleEl) titleEl.textContent = `Modules: ${course.title}`;
        if (subEl) subEl.textContent = `Instructor: ${course.instructor_name} | Category: ${course.category_name}`;

        hideChapterForm();
        renderChaptersList(courseId);
        if (chaptersModal) chaptersModal.show();
    };

    function renderChaptersList(courseId) {
        const tbody = document.getElementById('chaptersTableBody');
        const countEl = document.getElementById('chapterListCount');
        if (!tbody) return;

        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(courseId) : [];
        if (countEl) countEl.textContent = `Syllabus Chapters (${chapters.length})`;

        if (chapters.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No chapters added yet for this course. Click "Add Chapter" above to create one.</td></tr>`;
            return;
        }

        tbody.innerHTML = chapters.map(ch => `
            <tr>
                <td class="fw-bold text-muted" style="font-size: 12px;">#${ch.chapter_num}</td>
                <td>
                    <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(ch.title)}</div>
                    <div class="text-muted" style="font-size: 11px;">${escapeHtml(ch.description || 'Module curriculum overview')}</div>
                </td>
                <td class="text-muted" style="font-size: 12px;">${escapeHtml(ch.duration || '2 Hours')}</td>
                <td><span class="badge bg-light text-primary border px-2 py-1" style="font-size: 11px;">${ch.lesson_count || 4} Lessons</span></td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="action-btn" title="Edit Chapter" onclick="editChapter(${ch.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" title="Delete Chapter" onclick="deleteChapter(${ch.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.showAddChapterForm = function () {
        const container = document.getElementById('chapterFormContainer');
        const form = document.getElementById('chapterForm');
        if (form) form.reset();
        document.getElementById('chapterFormId').value = '';
        document.getElementById('chapterFormCourseId').value = activeChapterCourseId;
        
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(activeChapterCourseId) : [];
        document.getElementById('chapterNum').value = chapters.length + 1;
        document.getElementById('chapterFormTitle').textContent = 'Add New Chapter Module';
        
        if (container) container.style.display = 'block';
    };

    window.hideChapterForm = function () {
        const container = document.getElementById('chapterFormContainer');
        if (container) container.style.display = 'none';
    };

    window.editChapter = function (chapterId) {
        if (!window.AdminStore) return;
        const chapter = window.AdminStore.state.chapters.find(ch => ch.id === chapterId);
        if (!chapter) return;

        document.getElementById('chapterFormId').value = chapter.id;
        document.getElementById('chapterFormCourseId').value = chapter.course_id;
        document.getElementById('chapterNum').value = chapter.chapter_num;
        document.getElementById('chapterTitle').value = chapter.title;
        document.getElementById('chapterDuration').value = chapter.duration;
        document.getElementById('chapterLessons').value = chapter.lesson_count;
        document.getElementById('chapterDesc').value = chapter.description || '';
        document.getElementById('chapterFormTitle').textContent = 'Edit Chapter Module';

        const container = document.getElementById('chapterFormContainer');
        if (container) container.style.display = 'block';
    };

    const chapterForm = document.getElementById('chapterForm');
    if (chapterForm) {
        chapterForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const chapterId = document.getElementById('chapterFormId').value;
            const courseId = parseInt(document.getElementById('chapterFormCourseId').value) || activeChapterCourseId;
            const title = document.getElementById('chapterTitle').value.trim();

            const payload = {
                course_id: courseId,
                chapter_num: parseInt(document.getElementById('chapterNum').value) || 1,
                title: title,
                duration: document.getElementById('chapterDuration').value.trim(),
                lesson_count: parseInt(document.getElementById('chapterLessons').value) || 3,
                description: document.getElementById('chapterDesc').value.trim()
            };

            if (chapterId) {
                if (window.AdminStore) {
                    window.AdminStore.updateChapter(chapterId, payload);
                }
                if (window.AdminStore) window.AdminStore.constructor.toast('Chapter updated successfully', 'success');
            } else {
                if (window.AdminStore) {
                    window.AdminStore.createChapter(payload);
                }
                if (window.AdminStore) window.AdminStore.constructor.toast('Chapter added to course', 'success');
            }

            hideChapterForm();
            renderChaptersList(courseId);
            allCourses = window.AdminStore ? window.AdminStore.getCourses() : allCourses;
            applyCourseFilters();
        });
    }

    window.deleteChapter = async function (chapterId) {
        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Chapter?',
                'Are you sure you want to remove this chapter from the course syllabus?',
                'Yes, Delete',
                '#DC2626'
            );
        } else {
            confirmed = confirm('Are you sure you want to delete this chapter?');
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteChapter(chapterId);
            window.AdminStore.constructor.toast('Chapter deleted', 'success');
            renderChaptersList(activeChapterCourseId);
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }
    };

    // ==========================================
    // 4. CATEGORIES MANAGEMENT
    // ==========================================
    async function loadCategories() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/categories`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allCategories = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allCategories = window.AdminStore.getCategories();
        }

        renderCategoriesTable(allCategories);
        populateCategoryFilterOptions();
    }

    function renderCategoriesTable(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        if (categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No categories found</td></tr>`;
            return;
        }

        tbody.innerHTML = categories.map(c => `
            <tr>
                <td class="text-muted fw-bold" style="font-size: 12px;">#${c.id}</td>
                <td class="fw-bold" style="font-size: 12.5px;">${escapeHtml(c.name)}</td>
                <td class="text-muted" style="font-size: 12px;">${escapeHtml(c.slug)}</td>
                <td><i class="bi ${escapeHtml(c.icon || 'bi-tag')} text-primary fs-6"></i></td>
                <td class="text-muted" style="font-size: 12px;">${c.order_num || 1}</td>
                <td>
                    <button class="action-btn delete" title="Delete Category" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function populateCategoryFilterOptions() {
        const filterSelect = document.getElementById('courseCategoryFilter');
        if (filterSelect && allCategories.length > 0) {
            filterSelect.innerHTML = `<option value="all">All Categories</option>` + allCategories.map(c => `
                <option value="${c.name}">${escapeHtml(c.name)}</option>
            `).join('');
        }
    }

    window.openCreateCategoryModal = function () {
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryModalTitle').textContent = 'Add New Category';
        if (categoryModal) categoryModal.show();
    };

    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('categoryName').value.trim();
            const payload = {
                name: name,
                slug: document.getElementById('categorySlug').value.trim(),
                icon: document.getElementById('categoryIcon').value.trim(),
                order_num: parseInt(document.getElementById('categoryOrder').value) || 1
            };

            if (window.AdminStore) {
                window.AdminStore.createCategory(payload);
                allCategories = window.AdminStore.getCategories();
            }

            if (categoryModal) categoryModal.hide();
            renderCategoriesTable(allCategories);
            populateCategoryFilterOptions();
            if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Category Created', `"${name}" added to academic disciplines.`);

            try {
                await fetch(`${API_BASE}/admin/categories`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {}
        });
    }

    window.deleteCategory = async function (id) {
        const cat = allCategories.find(c => c.id === id);
        const name = cat ? cat.name : 'this category';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Category?',
                `Are you sure you want to delete "${name}"?`,
                'Yes, Delete',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to delete "${name}"?`);
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteCategory(id);
            allCategories = window.AdminStore.getCategories();
        }
        renderCategoriesTable(allCategories);
        populateCategoryFilterOptions();

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`Category "${name}" deleted`, 'success');
        }

        try {
            await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (e) {}
    };

    // ==========================================
    // 5. INSTRUCTORS MANAGEMENT
    // ==========================================
    async function loadInstructors() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/instructors`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allInstructors = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            allInstructors = window.AdminStore.getInstructors();
        }

        renderInstructorsTable(allInstructors);
    }

    function renderInstructorsTable(instructors) {
        const tbody = document.getElementById('instructorsTableBody');
        if (!tbody) return;

        if (instructors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No instructors registered</td></tr>`;
            return;
        }

        tbody.innerHTML = instructors.map(i => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${escapeHtml(i.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150')}" class="rounded-circle object-fit-cover border shadow-sm" style="width: 34px; height: 34px;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                        <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(i.name)}</div>
                    </div>
                </td>
                <td class="text-muted" style="font-size: 12px;">${escapeHtml(i.title || 'Faculty Member')}</td>
                <td class="text-muted" style="font-size: 12px;">${escapeHtml(i.email || '')}</td>
                <td><span class="badge bg-light text-secondary border px-2 py-1" style="font-size: 11px;">${escapeHtml(i.expertise || 'General Tech')}</span></td>
                <td>
                    <button class="action-btn delete" title="Delete Instructor" onclick="deleteInstructor(${i.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.openCreateInstructorModal = function () {
        document.getElementById('instructorForm').reset();
        document.getElementById('instructorId').value = '';
        document.getElementById('instructorModalTitle').textContent = 'Add New Instructor';
        if (instructorModal) instructorModal.show();
    };

    const instructorForm = document.getElementById('instructorForm');
    if (instructorForm) {
        instructorForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('instructorName').value.trim();
            const payload = {
                name: name,
                title: document.getElementById('instructorTitle').value.trim(),
                email: document.getElementById('instructorEmail').value.trim(),
                expertise: document.getElementById('instructorExpertise').value.trim(),
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
            };

            if (window.AdminStore) {
                window.AdminStore.createInstructor(payload);
                allInstructors = window.AdminStore.getInstructors();
            }

            if (instructorModal) instructorModal.hide();
            renderInstructorsTable(allInstructors);
            if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Instructor Added', `${name} has been added to academic faculty.`);

            try {
                await fetch(`${API_BASE}/admin/instructors`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {}
        });
    }

    window.deleteInstructor = async function (id) {
        const ins = allInstructors.find(i => i.id === id);
        const name = ins ? ins.name : 'this instructor';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Instructor?',
                `Are you sure you want to delete ${name}?`,
                'Yes, Delete',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to delete ${name}?`);
        }

        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteInstructor(id);
            allInstructors = window.AdminStore.getInstructors();
        }
        renderInstructorsTable(allInstructors);

        if (window.AdminStore) {
            window.AdminStore.constructor.toast(`Instructor "${name}" deleted`, 'success');
        }

        try {
            await fetch(`${API_BASE}/admin/instructors/${id}`, { method: 'DELETE', headers: getHeaders() });
        } catch (e) {}
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize All Tabs
    loadPrograms();
    loadCategories();
    loadInstructors();
    loadCourses();
});
