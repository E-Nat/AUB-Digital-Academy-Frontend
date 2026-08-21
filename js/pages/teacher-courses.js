/**
 * AUB Digital Academy - Teacher Courses & Content Hierarchy Controller
 * Connects Faculty Workspace directly to REST APIs: Courses, Modules, Lessons & Learning Materials
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

    // State
    let assignedCourses = [];
    let activeCourse = null;
    let activeCourseDetails = null;

    // Modals
    const courseManageModalEl = document.getElementById('courseManageModal');
    const courseManageModal = courseManageModalEl ? new bootstrap.Modal(courseManageModalEl) : null;

    const addModuleModalEl = document.getElementById('addModuleModal');
    const addModuleModal = addModuleModalEl ? new bootstrap.Modal(addModuleModalEl) : null;

    const addLessonModalEl = document.getElementById('addLessonModal');
    const addLessonModal = addLessonModalEl ? new bootstrap.Modal(addLessonModalEl) : null;

    const uploadMaterialModalEl = document.getElementById('uploadMaterialModal');
    const uploadMaterialModal = uploadMaterialModalEl ? new bootstrap.Modal(uploadMaterialModalEl) : null;

    // Update Teacher Name Display
    const currentUserName = localStorage.getItem('user_full_name') || 'Dr. Sarah Johnson';
    document.querySelectorAll('.teacher-name-display').forEach(el => el.textContent = currentUserName);

    // ==========================================================================
    // 1. LOAD ASSIGNED COURSES (GET /api/teacher/courses)
    // ==========================================================================
    async function loadAssignedCourses() {
        const grid = document.getElementById('coursesListGrid');
        if (grid) {
            grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading assigned courses...</div>`;
        }

        try {
            const res = await fetch(`${API_BASE}/teacher/courses`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    assignedCourses = data.data;
                }
            }
        } catch (err) {
            console.error('Error fetching teacher courses:', err);
        }

        renderCoursesGrid();
    }

    function renderCoursesGrid() {
        const grid = document.getElementById('coursesListGrid');
        if (!grid) return;

        const searchVal = (document.getElementById('courseSearchInput')?.value || '').toLowerCase().trim();
        let filtered = assignedCourses;

        if (searchVal) {
            filtered = filtered.filter(c => 
                (c.title || '').toLowerCase().includes(searchVal) ||
                (c.category_name || '').toLowerCase().includes(searchVal)
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="p-5 bg-light rounded-4 border text-center">
                        <i class="bi bi-book text-muted" style="font-size: 3rem;"></i>
                        <h5 class="fw-bold mt-3">No Assigned Courses Found</h5>
                        <p class="text-muted small">You currently have no active course assignments. Please contact the Academic Administrator.</p>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(course => {
            const bannerImg = course.thumbnail_url || 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=600';
            return `
                <div class="col-lg-4 col-md-6">
                    <div class="teacher-course-card border rounded-3 overflow-hidden shadow-sm h-100 d-flex flex-column bg-white">
                        <div class="position-relative" style="height: 160px; background-image: url('${bannerImg}'); background-size: cover; background-position: center;">
                            <span class="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 px-2 py-1">
                                ${escapeHtml(course.category_name || 'Academic')}
                            </span>
                        </div>
                        <div class="p-3 d-flex flex-column flex-grow-1 justify-content-between">
                            <div>
                                <h5 class="fw-bold text-dark mb-1">${escapeHtml(course.title)}</h5>
                                <div class="text-xs text-muted mb-3 d-flex gap-3">
                                    <span><i class="bi bi-clock me-1"></i>${course.duration_hours || 40} Hours</span>
                                    <span><i class="bi bi-journal-text me-1"></i>${course.lesson_count || 0} Lessons</span>
                                </div>
                            </div>
                            <div class="d-flex gap-2 pt-2 border-top">
                                <button class="btn btn-primary btn-sm flex-grow-1" onclick="openCourseInspector(${course.id})">
                                    <i class="bi bi-folder2-open me-1"></i> Open Course Content
                                </button>
                                <a href="quizzes.html" class="btn btn-outline-secondary btn-sm" title="Quizzes">
                                    <i class="bi bi-clipboard-check"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==========================================================================
    // 2. OPEN COURSE CONTENT INSPECTOR (GET /api/admin/courses/:id/details)
    // ==========================================================================
    window.openCourseInspector = async function (courseId) {
        activeCourse = assignedCourses.find(c => c.id === courseId) || { id: courseId, title: 'Course Content' };
        
        document.getElementById('modalCourseTitle').textContent = activeCourse.title;
        document.getElementById('modalCourseSubtitle').textContent = `Category: ${activeCourse.category_name || 'Academic'} • Course ID: #${courseId}`;
        
        if (courseManageModal) courseManageModal.show();
        await loadCourseFullDetails(courseId);
    };

    async function loadCourseFullDetails(courseId) {
        try {
            const res = await fetch(`${API_BASE}/admin/courses/${courseId}/details`, { headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    activeCourseDetails = data.data;
                    renderOverviewTab();
                    renderLessonsTab();
                    renderMaterialsTab();
                    renderAssignmentsTab();
                    renderStudentsTab();
                }
            }
        } catch (err) {
            console.error('Error fetching course details:', err);
        }
    }

    // Render Overview
    function renderOverviewTab() {
        if (!activeCourseDetails) return;
        const c = activeCourseDetails.course || activeCourse;
        const descEl = document.getElementById('courseDescContent');
        if (descEl) descEl.textContent = c.description || 'Comprehensive university curriculum.';

        const studentsCount = (activeCourseDetails.students || []).length;
        const lessonsCount = (activeCourseDetails.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0);

        document.getElementById('courseActiveStudents').textContent = studentsCount;
        document.getElementById('courseTotalLessons').textContent = lessonsCount;
    }

    // Render Lessons & Syllabus Hierarchy (Module -> Lessons -> Videos & PDFs)
    function renderLessonsTab() {
        const container = document.getElementById('lessonsListContainer');
        if (!container || !activeCourseDetails) return;

        const modules = activeCourseDetails.modules || [];
        if (modules.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted bg-light rounded-3 p-4">
                    <i class="bi bi-folder2 text-muted fs-2"></i>
                    <p class="mb-2 mt-2">No chapters/modules created yet.</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="openAddModuleModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add First Module
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = modules.map((mod, mIdx) => {
            const lessons = mod.lessons || [];
            return `
                <div class="card border rounded-3 mb-3 shadow-none">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-primary px-2 py-1">Ch. ${mIdx + 1}</span>
                            <span class="fw-bold text-dark">${escapeHtml(mod.title)}</span>
                            <span class="text-muted text-xs">(${lessons.length} lessons • ${mod.duration || '2 Hours'})</span>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" onclick="openAddLessonModal(${mod.id})" title="Add Lesson">
                                <i class="bi bi-plus-lg me-1"></i> Add Lesson
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteModule(${mod.id})" title="Delete Module">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-2">
                        ${lessons.length === 0 ? '<div class="text-muted small py-2 px-3">No lessons in this module.</div>' : `
                            <div class="list-group list-group-flush">
                                ${lessons.map(les => `
                                    <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 border-0 rounded-2 mb-1 bg-light-subtle">
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="bi bi-play-circle text-primary fs-5"></i>
                                            <div>
                                                <div class="fw-semibold text-dark text-sm">${escapeHtml(les.title)}</div>
                                                <div class="text-xs text-muted">
                                                    <span class="me-2"><i class="bi bi-clock me-1"></i>${les.duration || '20 Mins'}</span>
                                                    ${les.video_url ? '<span class="badge bg-info-subtle text-info-emphasis me-1"><i class="bi bi-camera-video me-1"></i>Video Attached</span>' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-secondary btn-sm" onclick="openUploadMaterialForLesson(${les.id})" title="Attach PDF">
                                                <i class="bi bi-paperclip"></i>
                                            </button>
                                            <button class="btn btn-outline-danger btn-sm" onclick="deleteLesson(${les.id})" title="Delete Lesson">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render Learning Materials
    function renderMaterialsTab() {
        const container = document.getElementById('courseMaterialsList');
        if (!container || !activeCourseDetails) return;

        const materials = activeCourseDetails.materials || [];
        if (materials.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-muted bg-light rounded-3">No learning materials / PDFs attached to this course yet.</div>`;
            return;
        }

        container.innerHTML = materials.map(mat => `
            <div class="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-file-earmark-pdf-fill text-danger fs-3"></i>
                    <div>
                        <div class="fw-bold text-dark">${escapeHtml(mat.title)}</div>
                        <div class="text-xs text-muted">${mat.file_name} • ${mat.file_size || '1.5 MB'}</div>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <a href="${mat.file_url}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="bi bi-download me-1"></i> View / Download
                    </a>
                </div>
            </div>
        `).join('');
    }

    // Render Assignments Tab
    function renderAssignmentsTab() {
        const container = document.getElementById('courseAssignmentsList');
        if (!container || !activeCourseDetails) return;

        const assignments = activeCourseDetails.assignments || [];
        if (assignments.length === 0) {
            container.innerHTML = `<div class="text-center py-4 text-muted bg-light rounded-3">No assignments created for this course yet.</div>`;
            return;
        }

        container.innerHTML = assignments.map(a => `
            <div class="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div class="fw-bold text-dark">${escapeHtml(a.title)}</div>
                    <div class="text-xs text-muted">Due: ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'} • Total Points: ${a.total_points || 100}</div>
                </div>
                <a href="submissions.html?assignmentId=${a.id}" class="btn btn-outline-success btn-sm">
                    <i class="bi bi-inbox me-1"></i> View Submissions
                </a>
            </div>
        `).join('');
    }

    // Render Enrolled Students
    function renderStudentsTab() {
        const tbody = document.getElementById('courseStudentsTableBody');
        if (!tbody || !activeCourseDetails) return;

        const students = activeCourseDetails.students || [];
        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No students enrolled in this course yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = students.map(st => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${st.avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150'}" class="rounded-circle" width="32" height="32">
                        <div>
                            <div class="fw-bold text-dark text-sm">${escapeHtml(st.full_name || 'Student')}</div>
                            <div class="text-xs text-muted">${st.email || st.university_id || ''}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: ${st.progress_percentage || 0}%;"></div>
                        </div>
                        <span class="text-xs fw-bold">${Math.round(st.progress_percentage || 0)}%</span>
                    </div>
                </td>
                <td class="text-muted text-xs">${st.enrolled_at ? new Date(st.enrolled_at).toLocaleDateString() : 'Active'}</td>
                <td class="text-end">
                    <span class="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                </td>
            </tr>
        `).join('');
    }

    // ==========================================================================
    // 3. ADD MODULE (POST /api/admin/chapters)
    // ==========================================================================
    window.openAddModuleModal = function () {
        const form = document.getElementById('addModuleForm');
        if (form) form.reset();
        if (addModuleModal) addModuleModal.show();
    };

    document.getElementById('addModuleForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!activeCourse) return;

        const btn = document.getElementById('saveModuleBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

        const payload = {
            course_id: activeCourse.id,
            title: document.getElementById('moduleTitle').value.trim(),
            description: document.getElementById('moduleDesc').value.trim(),
            duration: document.getElementById('moduleDuration').value.trim() || '2 Hours',
            order_num: parseInt(document.getElementById('moduleOrder').value) || 1,
            status: 'Published'
        };

        try {
            const res = await fetch(`${API_BASE}/admin/chapters`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                Swal.fire({ icon: 'success', title: 'Module Created!', timer: 1500, showConfirmButton: false });
                if (addModuleModal) addModuleModal.hide();
                await loadCourseFullDetails(activeCourse.id);
            } else {
                Swal.fire('Error', data.message || 'Failed to create module', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Unable to reach backend server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Create Module';
        }
    });

    // ==========================================================================
    // 4. ADD LESSON (POST /api/admin/lessons)
    // ==========================================================================
    window.openAddLessonModal = function (preselectModuleId) {
        const select = document.getElementById('lessonModuleSelect');
        const modules = activeCourseDetails?.modules || [];

        if (select) {
            select.innerHTML = modules.map(m => `<option value="${m.id}" ${m.id === preselectModuleId ? 'selected' : ''}>${m.title}</option>`).join('');
        }

        const form = document.getElementById('addLessonForm');
        if (form) form.reset();
        if (preselectModuleId && select) select.value = preselectModuleId;
        if (addLessonModal) addLessonModal.show();
    };

    document.getElementById('addLessonForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = document.getElementById('saveLessonBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

        const payload = {
            module_id: parseInt(document.getElementById('lessonModuleSelect').value),
            title: document.getElementById('lessonTitle').value.trim(),
            video_url: document.getElementById('lessonVideoUrl').value.trim(),
            duration: document.getElementById('lessonDuration').value.trim() || '20 Mins',
            order_num: parseInt(document.getElementById('lessonOrder').value) || 1,
            description: document.getElementById('lessonDesc').value.trim()
        };

        try {
            const res = await fetch(`${API_BASE}/admin/lessons`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                Swal.fire({ icon: 'success', title: 'Lesson Added!', timer: 1500, showConfirmButton: false });
                if (addLessonModal) addLessonModal.hide();
                await loadCourseFullDetails(activeCourse.id);
            } else {
                Swal.fire('Error', data.message || 'Failed to add lesson', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Unable to reach backend server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Save Lesson';
        }
    });

    // ==========================================================================
    // 5. ATTACH LEARNING MATERIAL (POST /api/admin/materials)
    // ==========================================================================
    window.openUploadMaterialModal = function () {
        openUploadMaterialForLesson(null);
    };

    window.openUploadMaterialForLesson = function (lessonId) {
        const select = document.getElementById('materialLessonSelect');
        const modules = activeCourseDetails?.modules || [];
        const allLessons = [];
        modules.forEach(m => (m.lessons || []).forEach(l => allLessons.push(l)));

        if (select) {
            select.innerHTML = allLessons.map(l => `<option value="${l.id}" ${l.id === lessonId ? 'selected' : ''}>${l.title}</option>`).join('');
        }

        const form = document.getElementById('uploadMaterialForm');
        if (form) form.reset();
        if (lessonId && select) select.value = lessonId;
        if (uploadMaterialModal) uploadMaterialModal.show();
    };

    document.getElementById('uploadMaterialForm')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = document.getElementById('saveMaterialBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Uploading...';

        const payload = {
            lesson_id: parseInt(document.getElementById('materialLessonSelect').value),
            course_id: activeCourse?.id,
            title: document.getElementById('materialTitle').value.trim(),
            type: document.getElementById('materialType').value,
            file_size: document.getElementById('materialSize').value.trim() || '1.5 MB',
            file_name: document.getElementById('materialFileName').value.trim(),
            file_url: document.getElementById('materialFileUrl').value.trim()
        };

        try {
            const res = await fetch(`${API_BASE}/admin/materials`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                Swal.fire({ icon: 'success', title: 'Document Attached!', timer: 1500, showConfirmButton: false });
                if (uploadMaterialModal) uploadMaterialModal.hide();
                await loadCourseFullDetails(activeCourse.id);
            } else {
                Swal.fire('Error', data.message || 'Failed to attach material', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Unable to reach backend server', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Attach Document';
        }
    });

    // Delete Lesson
    window.deleteLesson = async function (lessonId) {
        const confirm = await Swal.fire({
            title: 'Delete Lesson?',
            text: 'This will remove the lesson and its attached materials.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete'
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`${API_BASE}/admin/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Lesson Deleted', timer: 1200, showConfirmButton: false });
                await loadCourseFullDetails(activeCourse.id);
            }
        } catch (e) {
            Swal.fire('Error', 'Failed to delete lesson', 'error');
        }
    };

    // Delete Module
    window.deleteModule = async function (moduleId) {
        const confirm = await Swal.fire({
            title: 'Delete Module / Chapter?',
            text: 'This will delete the module and all its lessons.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete'
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`${API_BASE}/admin/chapters/${moduleId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Module Deleted', timer: 1200, showConfirmButton: false });
                await loadCourseFullDetails(activeCourse.id);
            }
        } catch (e) {
            Swal.fire('Error', 'Failed to delete module', 'error');
        }
    };

    // Search filter
    document.getElementById('courseSearchInput')?.addEventListener('input', renderCoursesGrid);

    // Initial Load
    await loadAssignedCourses();
});

window.logoutTeacher = function () {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../authentication/login.html';
};
