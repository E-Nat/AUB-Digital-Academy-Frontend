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

    // Course Content Builder Modals
    const contentBuilderModalEl = document.getElementById('courseContentBuilderModal');
    const contentBuilderModal = contentBuilderModalEl ? new bootstrap.Modal(contentBuilderModalEl) : null;

    const moduleEditorModalEl = document.getElementById('moduleEditorModal');
    const moduleEditorModal = moduleEditorModalEl ? new bootstrap.Modal(moduleEditorModalEl) : null;

    const lessonEditorModalEl = document.getElementById('lessonEditorModal');
    const lessonEditorModal = lessonEditorModalEl ? new bootstrap.Modal(lessonEditorModalEl) : null;

    const quizEditorModalEl = document.getElementById('quizEditorModal');
    const quizEditorModal = quizEditorModalEl ? new bootstrap.Modal(quizEditorModalEl) : null;

    const assignmentEditorModalEl = document.getElementById('assignmentEditorModal');
    const assignmentEditorModal = assignmentEditorModalEl ? new bootstrap.Modal(assignmentEditorModalEl) : null;

    // Course Creation Wizard Sub-Modals
    const wizardModuleModalEl = document.getElementById('wizardModuleModal');
    const wizardModuleModal = wizardModuleModalEl ? new bootstrap.Modal(wizardModuleModalEl) : null;

    const wizardLessonModalEl = document.getElementById('wizardLessonModal');
    const wizardLessonModal = wizardLessonModalEl ? new bootstrap.Modal(wizardLessonModalEl) : null;

    const wizardQuizModalEl = document.getElementById('wizardQuizModal');
    const wizardQuizModal = wizardQuizModalEl ? new bootstrap.Modal(wizardQuizModalEl) : null;

    const wizardAssignmentModalEl = document.getElementById('wizardAssignmentModal');
    const wizardAssignmentModal = wizardAssignmentModalEl ? new bootstrap.Modal(wizardAssignmentModalEl) : null;

    let activeBuilderCourseId = null;
    let activeBuilderCourse = null;

    // ==========================================
    // 1. PROGRAMS MANAGEMENT (Featured Programs)
    // ==========================================
    const THEME_COLOR_MAP = {
        'theme-blue': '#2563eb',
        'theme-cyan': '#0891b2',
        'theme-green': '#16a34a',
        'theme-purple': '#9333ea',
        'theme-gold': '#d97706',
        'theme-orange': '#ea580c',
        'theme-rose': '#e11d48',
        'theme-indigo': '#4f46e5'
    };

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

        tbody.innerHTML = programs.map(p => {
            const themeClass = p.theme_class || 'theme-blue';
            const themeColor = THEME_COLOR_MAP[themeClass] || '#2563eb';
            const iconClass = p.icon_class || 'bi-laptop';

            return `
            <tr>
                <td class="text-muted fw-bold" style="font-size: 12px;">#${p.order_num !== undefined ? p.order_num : 1}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-2 p-1 d-flex align-items-center justify-content-center border" style="width: 36px; height: 36px; flex-shrink: 0; background-color: rgba(37, 99, 235, 0.06);">
                            <i class="bi ${escapeHtml(iconClass)}" style="font-size: 16px; color: ${themeColor};"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(p.title)}</div>
                            <div class="text-muted text-truncate" style="font-size: 11px; max-width: 280px;" title="${escapeHtml(p.description || '')}">${escapeHtml(p.description || '')}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-primary border fw-semibold px-2 py-1" style="font-size: 11px;">${escapeHtml(p.degree_type || 'BACHELOR DEGREE')}</span></td>
                <td class="text-muted fw-medium" style="font-size: 12px;"><i class="bi bi-clock me-1 opacity-75"></i>${escapeHtml(p.duration || '4 Years')}</td>
                <td>
                    <div class="d-inline-flex align-items-center gap-1.5 px-2 py-1 rounded bg-light border" style="font-size: 11px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${themeColor}; display: inline-block;"></span>
                        <span class="text-secondary text-capitalize">${themeClass.replace('theme-', '')}</span>
                    </div>
                </td>
                <td>
                    <span class="admin-status-badge ${p.is_published ? 'published' : 'draft'} cursor-pointer" onclick="toggleProgramStatus(${p.id})" title="Click to toggle publish status">
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
            `;
        }).join('');
    }

    // Live UI updaters for Program Modal
    function updateProgramIconPreview() {
        const iconInput = document.getElementById('programIcon');
        const iconPreview = document.getElementById('programIconPreview');
        if (!iconInput || !iconPreview) return;
        const val = iconInput.value.trim() || 'bi-laptop';
        iconPreview.className = `bi ${val}`;
    }

    function updateProgramThemePreview() {
        const themeSelect = document.getElementById('programTheme');
        const dot = document.getElementById('programThemePreviewDot');
        if (!themeSelect || !dot) return;
        const color = THEME_COLOR_MAP[themeSelect.value] || '#2563eb';
        dot.style.backgroundColor = color;
    }

    function updateProgramDescCount() {
        const descInput = document.getElementById('programDesc');
        const countEl = document.getElementById('programDescCharCount');
        if (!descInput || !countEl) return;
        const len = descInput.value.trim().length;
        if (len < 10) {
            countEl.textContent = `${len} / 10 min chars`;
            countEl.className = 'text-danger text-xs';
        } else {
            countEl.textContent = `${len} chars`;
            countEl.className = 'text-muted text-xs';
        }
    }

    // Program Field Validation
    function setFieldInvalid(inputId, feedbackId, message) {
        const input = document.getElementById(inputId);
        const feedback = document.getElementById(feedbackId);
        if (input) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
        }
        if (feedback && message) {
            feedback.textContent = message;
        }
    }

    function setFieldValid(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    }

    function clearProgramValidation() {
        const fields = ['programTitle', 'programDegree', 'programDuration', 'programIcon', 'programTheme', 'programDesc', 'programUrl', 'programOrder'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('is-invalid', 'is-valid');
            }
        });
    }

    function validateProgramForm() {
        let isValid = true;
        let firstInvalidEl = null;

        // 1. Program Title *
        const titleEl = document.getElementById('programTitle');
        const titleVal = titleEl ? titleEl.value.trim() : '';
        if (!titleVal) {
            setFieldInvalid('programTitle', 'programTitleFeedback', 'Program Title is required.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else if (titleVal.length < 3) {
            setFieldInvalid('programTitle', 'programTitleFeedback', 'Program Title must be at least 3 characters.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else if (titleVal.length > 150) {
            setFieldInvalid('programTitle', 'programTitleFeedback', 'Program Title cannot exceed 150 characters.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else {
            setFieldValid('programTitle');
        }

        // 2. Degree Type *
        const degreeEl = document.getElementById('programDegree');
        const degreeVal = degreeEl ? degreeEl.value.trim() : '';
        if (!degreeVal) {
            setFieldInvalid('programDegree', 'programDegreeFeedback', 'Please select a valid Degree Type.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = degreeEl;
        } else {
            setFieldValid('programDegree');
        }

        // 3. Duration *
        const durationEl = document.getElementById('programDuration');
        const durationVal = durationEl ? durationEl.value.trim() : '';
        if (!durationVal) {
            setFieldInvalid('programDuration', 'programDurationFeedback', 'Duration is required (e.g. 4 Years).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = durationEl;
        } else if (durationVal.length < 2) {
            setFieldInvalid('programDuration', 'programDurationFeedback', 'Duration must be at least 2 characters (e.g. 4 Years).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = durationEl;
        } else {
            setFieldValid('programDuration');
        }

        // 4. Description *
        const descEl = document.getElementById('programDesc');
        const descVal = descEl ? descEl.value.trim() : '';
        if (!descVal) {
            setFieldInvalid('programDesc', 'programDescFeedback', 'Program Description is required.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = descEl;
        } else if (descVal.length < 10) {
            setFieldInvalid('programDesc', 'programDescFeedback', 'Program Description must be at least 10 characters long.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = descEl;
        } else {
            setFieldValid('programDesc');
        }

        // 5. Sort Order
        const orderEl = document.getElementById('programOrder');
        const orderVal = orderEl ? orderEl.value : '';
        if (orderVal !== '' && (isNaN(Number(orderVal)) || Number(orderVal) < 0)) {
            setFieldInvalid('programOrder', 'programOrderFeedback', 'Sort order must be a non-negative number (0 or higher).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = orderEl;
        } else {
            setFieldValid('programOrder');
        }

        return { isValid, firstInvalidEl };
    }

    // Attach live listeners for Program fields
    const programTitleInput = document.getElementById('programTitle');
    if (programTitleInput) {
        programTitleInput.addEventListener('input', function () {
            if (this.value.trim().length >= 3) setFieldValid('programTitle');
            else if (this.classList.contains('is-invalid')) setFieldInvalid('programTitle', 'programTitleFeedback', 'Program Title must be at least 3 characters.');
        });
        programTitleInput.addEventListener('blur', function () {
            if (!this.value.trim()) setFieldInvalid('programTitle', 'programTitleFeedback', 'Program Title is required.');
            else if (this.value.trim().length < 3) setFieldInvalid('programTitle', 'programTitleFeedback', 'Program Title must be at least 3 characters.');
            else setFieldValid('programTitle');
        });
    }

    const programDegreeSelect = document.getElementById('programDegree');
    if (programDegreeSelect) {
        programDegreeSelect.addEventListener('change', function () {
            if (this.value) setFieldValid('programDegree');
            else setFieldInvalid('programDegree', 'programDegreeFeedback', 'Please select a Degree Type.');
        });
    }

    const programDurationInput = document.getElementById('programDuration');
    if (programDurationInput) {
        programDurationInput.addEventListener('input', function () {
            if (this.value.trim().length >= 2) setFieldValid('programDuration');
        });
        programDurationInput.addEventListener('blur', function () {
            if (!this.value.trim()) setFieldInvalid('programDuration', 'programDurationFeedback', 'Duration is required.');
            else setFieldValid('programDuration');
        });
    }

    const programDescInput = document.getElementById('programDesc');
    if (programDescInput) {
        programDescInput.addEventListener('input', function () {
            updateProgramDescCount();
            if (this.value.trim().length >= 10) setFieldValid('programDesc');
        });
        programDescInput.addEventListener('blur', function () {
            if (!this.value.trim()) setFieldInvalid('programDesc', 'programDescFeedback', 'Program Description is required.');
            else if (this.value.trim().length < 10) setFieldInvalid('programDesc', 'programDescFeedback', 'Program Description must be at least 10 characters.');
            else setFieldValid('programDesc');
        });
    }

    const programIconInput = document.getElementById('programIcon');
    if (programIconInput) {
        programIconInput.addEventListener('input', updateProgramIconPreview);
    }

    const programThemeSelect = document.getElementById('programTheme');
    if (programThemeSelect) {
        programThemeSelect.addEventListener('change', updateProgramThemePreview);
    }

    const programOrderInput = document.getElementById('programOrder');
    if (programOrderInput) {
        programOrderInput.addEventListener('input', function () {
            if (Number(this.value) >= 0) setFieldValid('programOrder');
            else setFieldInvalid('programOrder', 'programOrderFeedback', 'Sort order must be 0 or greater.');
        });
    }

    window.openCreateProgramModal = function () {
        document.getElementById('programForm').reset();
        document.getElementById('programId').value = '';
        document.getElementById('programDuration').value = '4 Years';
        document.getElementById('programIcon').value = 'bi-laptop';
        document.getElementById('programTheme').value = 'theme-blue';
        document.getElementById('programOrder').value = allPrograms.length + 1;
        document.getElementById('programPublished').checked = true;
        document.getElementById('programModalTitle').textContent = 'Add New Featured Program';
        
        clearProgramValidation();
        updateProgramIconPreview();
        updateProgramThemePreview();
        updateProgramDescCount();

        if (programModal) programModal.show();
    };

    window.openEditProgramModal = function (id) {
        const p = allPrograms.find(prog => prog.id === id);
        if (!p) return;

        clearProgramValidation();
        document.getElementById('programId').value = p.id;
        document.getElementById('programTitle').value = p.title;
        document.getElementById('programDegree').value = p.degree_type || 'BACHELOR DEGREE';
        document.getElementById('programDuration').value = p.duration || '4 Years';
        document.getElementById('programIcon').value = p.icon_class || 'bi-laptop';
        document.getElementById('programTheme').value = p.theme_class || 'theme-blue';
        document.getElementById('programDesc').value = p.description || '';
        document.getElementById('programUrl').value = p.detail_url || '';
        document.getElementById('programOrder').value = p.order_num !== undefined ? p.order_num : 1;
        document.getElementById('programPublished').checked = p.is_published === 1 || p.is_published === true;
        document.getElementById('programModalTitle').textContent = 'Edit Featured Program';

        updateProgramIconPreview();
        updateProgramThemePreview();
        updateProgramDescCount();

        if (programModal) programModal.show();
    };

    const programForm = document.getElementById('programForm');
    if (programForm) {
        programForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Run full validation
            const { isValid, firstInvalidEl } = validateProgramForm();
            if (!isValid) {
                if (firstInvalidEl) {
                    firstInvalidEl.focus();
                }
                if (window.AdminStore) {
                    window.AdminStore.constructor.toast('Please correct the highlighted errors in the form.', 'error');
                }
                return;
            }

            const id = document.getElementById('programId').value;
            const title = document.getElementById('programTitle').value.trim();
            const degreeType = document.getElementById('programDegree').value.trim();
            const duration = document.getElementById('programDuration').value.trim();
            const iconClass = document.getElementById('programIcon').value.trim() || 'bi-laptop';
            const themeClass = document.getElementById('programTheme').value || 'theme-blue';
            const description = document.getElementById('programDesc').value.trim();
            const detailUrl = document.getElementById('programUrl').value.trim() || '#';
            const orderNum = parseInt(document.getElementById('programOrder').value, 10);
            const isPublished = document.getElementById('programPublished').checked ? 1 : 0;

            const payload = {
                title: title,
                degree_type: degreeType,
                duration: duration,
                icon_class: iconClass,
                theme_class: themeClass,
                description: description,
                detail_url: detailUrl,
                order_num: isNaN(orderNum) ? 1 : Math.max(0, orderNum),
                is_published: isPublished
            };

            const saveBtn = document.getElementById('saveProgramBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
            }

            try {
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
                    if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Program Created', `"${title}" has been added to featured academic programs.`);
                }

                const url = id ? `${API_BASE}/admin/programs/${id}` : `${API_BASE}/admin/programs`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {
                console.error('Save program error:', err);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Program`;
                }
            }
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

        try {
            if (window.AdminStore) {
                window.AdminStore.deleteProgram(id);
                allPrograms = window.AdminStore.getPrograms();
            }

            const res = await fetch(`${API_BASE}/admin/programs/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.message) {
                    throw new Error(errData.message);
                }
            }

            renderProgramsTable(allPrograms);
            if (window.AdminStore) {
                window.AdminStore.constructor.toast(`Program "${name}" deleted`, 'success');
            }
        } catch (err) {
            if (window.AdminStore) {
                window.AdminStore.constructor.notifyError('Action Prohibited', err.message || 'Cannot delete program with registered students.');
            } else {
                alert(err.message || 'Cannot delete program.');
            }
            // Reload to restore state
            loadPrograms();
        }
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
            const chapterCount = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id).length : (c.module_count || 0);
            const lessonCount = window.AdminStore ? window.AdminStore.getAllLessonsByCourseId(c.id).length : (c.lesson_count || 0);
            const quizCount = window.AdminStore ? window.AdminStore.getAllQuizzesByCourseId(c.id).length : (c.quiz_count || 0);
            const assignmentCount = window.AdminStore ? window.AdminStore.getAllAssignmentsByCourseId(c.id).length : (c.assignment_count || 0);
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2 cursor-pointer" onclick="openViewCourseModal(${c.id})" title="Click to view course details">
                            <img src="../../${escapeHtml(c.thumbnail_url || 'assets/images/courses/fullstack.jpg')}" class="rounded-2 object-fit-cover border" style="width: 44px; height: 32px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=100'">
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
                        <button class="btn btn-sm btn-light border py-1 px-2 d-inline-flex align-items-center gap-1.5" style="font-size: 11px;" onclick="openCourseContentBuilder(${c.id})" title="Open Curriculum Builder">
                            <span class="fw-bold text-dark">${chapterCount} M</span>
                            <span class="text-muted">&bull;</span>
                            <span class="fw-semibold text-primary">${lessonCount} L</span>
                            <span class="text-muted">&bull;</span>
                            <span class="fw-semibold" style="color: #7C3AED;">${quizCount} Q</span>
                            <span class="text-muted">&bull;</span>
                            <span class="fw-semibold" style="color: #D97706;">${assignmentCount} A</span>
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
                            <button class="action-btn text-primary" title="Curriculum Content Builder (Modules, Lessons, Quizzes, Assignments)" onclick="openCourseContentBuilder(${c.id})">
                                <i class="bi bi-journal-bookmark"></i>
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
        const allLessons = window.AdminStore ? window.AdminStore.getAllLessonsByCourseId(c.id) : [];
        const allQuizzes = window.AdminStore ? window.AdminStore.getAllQuizzesByCourseId(c.id) : [];
        const allAssignments = window.AdminStore ? window.AdminStore.getAllAssignmentsByCourseId(c.id) : [];

        const body = document.getElementById('viewCourseModalBody');
        const titleEl = document.getElementById('viewCourseModalTitle');
        if (titleEl) titleEl.textContent = `Course Syllabus: ${c.title}`;

        if (body) {
            body.innerHTML = `
                <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-3 mb-3 border">
                    <img src="../../${escapeHtml(c.thumbnail_url || 'assets/images/courses/fullstack.jpg')}" class="rounded-3 object-fit-cover border shadow-sm" style="width: 80px; height: 60px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=150'">
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
                        <h6 class="text-xs fw-bold text-uppercase text-muted mb-0">Curriculum Units (${chapters.length} Modules &bull; ${allLessons.length} Lessons &bull; ${allQuizzes.length} Quizzes &bull; ${allAssignments.length} Assignments)</h6>
                    </div>

                    ${chapters.length === 0 ? `
                        <div class="text-center py-3 text-muted border rounded-2 bg-light" style="font-size: 12px;">
                            No curriculum modules registered yet for this course.
                        </div>
                    ` : `
                        <div class="d-flex flex-column gap-2" style="max-height: 280px; overflow-y: auto;">
                            ${chapters.map((ch, idx) => {
                                const chLessons = window.AdminStore ? window.AdminStore.getLessonsByModuleId(ch.id) : [];
                                const chQuizzes = window.AdminStore ? window.AdminStore.getQuizzesByModuleId(ch.id) : [];
                                const chAssignments = window.AdminStore ? window.AdminStore.getAssignmentsByModuleId(ch.id) : [];
                                return `
                                    <div class="p-3 bg-light rounded-2 border">
                                        <div class="d-flex align-items-center justify-content-between mb-2">
                                            <div>
                                                <span class="badge bg-primary me-2" style="font-size: 10px;">Module ${ch.chapter_num || idx + 1}</span>
                                                <span class="fw-bold text-dark" style="font-size: 13px;">${escapeHtml(ch.title)}</span>
                                            </div>
                                            <span class="badge bg-white text-secondary border" style="font-size: 11px;">${escapeHtml(ch.duration || '2 Weeks')}</span>
                                        </div>
                                        ${ch.description ? `<p class="text-muted small mb-2" style="font-size: 11.5px;">${escapeHtml(ch.description)}</p>` : ''}
                                        <div class="d-flex flex-column gap-1 ms-2 border-start ps-2" style="border-color: #CBD5E1 !important;">
                                            ${chLessons.map(l => {
                                                const icon = l.content_type === 'Document' ? 'bi-file-earmark-pdf text-danger' : l.content_type === 'Text' ? 'bi-file-text text-secondary' : 'bi-camera-video text-primary';
                                                return `
                                                    <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                                        <span class="text-truncate me-2"><i class="bi ${icon} me-1"></i> <span class="fw-medium text-dark">${escapeHtml(l.title)}</span></span>
                                                        <span class="badge bg-white text-muted border flex-shrink-0" style="font-size: 10px;">${escapeHtml(l.content_type || 'Video')} &bull; ${escapeHtml(l.duration || '45 Mins')}</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                            ${chQuizzes.map(q => `
                                                <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                                    <span class="text-truncate me-2"><i class="bi bi-question-square me-1" style="color: #7C3AED;"></i> <span class="fw-medium text-dark">${escapeHtml(q.title)}</span></span>
                                                    <span class="badge bg-white border flex-shrink-0" style="font-size: 10px; color: #7C3AED;">Quiz &bull; ${(q.questions || []).length} Qs &bull; Pass ${q.passing_score || 70}%</span>
                                                </div>
                                            `).join('')}
                                            ${chAssignments.map(a => `
                                                <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                                    <span class="text-truncate me-2"><i class="bi bi-journal-check me-1" style="color: #D97706;"></i> <span class="fw-medium text-dark">${escapeHtml(a.title)}</span></span>
                                                    <span class="badge bg-white border flex-shrink-0" style="font-size: 10px; color: #D97706;">Assignment &bull; ${a.max_score || 100} Pts${a.due_date ? ` &bull; Due ${a.due_date}` : ''}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
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
                openCourseContentBuilder(activeCourseInView.id);
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

    // ==========================================================================
    // MULTI-STEP COURSE CREATION STEPPER CONTROLLER (6 STEPS)
    // Step 1: Basic Info | Step 2: Course Structure | Step 3: Details & Pricing
    // Step 4: Course Media | Step 5: Schedule & Dates | Step 6: Review & Publish
    // ==========================================================================
    let currentCourseStep = 1;
    const totalCourseSteps = 6;
    const completedCourseSteps = new Set();

    // In-memory curriculum structure state for course creation / edit wizard
    let wizardModules = [];

    // Structure Statistics Sync (Calculates Modules, Lessons, Quizzes, Assignments)
    function updateWizardStructureStats() {
        const totalModules = wizardModules.length;
        const totalLessons = wizardModules.reduce((acc, m) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0);
        const totalQuizzes = wizardModules.reduce((acc, m) => acc + (Array.isArray(m.quizzes) ? m.quizzes.length : 0), 0);
        const totalAssignments = wizardModules.reduce((acc, m) => acc + (Array.isArray(m.assignments) ? m.assignments.length : 0), 0);
        const statsSummaryText = `${totalModules} Modules \u2022 ${totalLessons} Lessons \u2022 ${totalQuizzes} Quizzes \u2022 ${totalAssignments} Assignments`;

        // Step 2 Badge
        const sumCountText = document.getElementById('wizardSummaryCountText');
        if (sumCountText) sumCountText.textContent = statsSummaryText;

        // Step 3 Read-only Summary Badge & Detailed Metric Cards
        const step3Badge = document.getElementById('step3StructureSummaryBadge');
        if (step3Badge) step3Badge.textContent = statsSummaryText;

        const mEl = document.getElementById('step3MetricModules');
        const lEl = document.getElementById('step3MetricLessons');
        const qEl = document.getElementById('step3MetricQuizzes');
        const aEl = document.getElementById('step3MetricAssignments');
        if (mEl) mEl.textContent = totalModules;
        if (lEl) lEl.textContent = totalLessons;
        if (qEl) qEl.textContent = totalQuizzes;
        if (aEl) aEl.textContent = totalAssignments;

        // Step 6 Review Summary
        const reviewStructure = document.getElementById('reviewCourseStructure');
        if (reviewStructure) reviewStructure.textContent = statsSummaryText;

        return { totalModules, totalLessons, totalQuizzes, totalAssignments, statsSummaryText };
    }

    // Render Wizard Modules, Lessons, Quizzes & Assignments in Step 2
    function renderWizardModules() {
        const container = document.getElementById('wizardModulesContainer');
        updateWizardStructureStats();
        if (!container) return;

        if (wizardModules.length === 0) {
            container.innerHTML = `
                <div class="wizard-empty-box p-4 text-center bg-white rounded border">
                    <i class="bi bi-diagram-3 fs-2 text-primary opacity-50 d-block mb-2"></i>
                    <h6 class="fw-bold text-dark mb-1">No Modules in Curriculum Yet</h6>
                    <p class="text-muted small mb-3">Organize this course by adding its first module, lessons, quizzes, and assignments.</p>
                    <button type="button" class="btn btn-sm btn-primary" onclick="openWizardAddModuleModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add First Module
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = wizardModules.map((mod, mIdx) => {
            const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
            const quizzes = Array.isArray(mod.quizzes) ? mod.quizzes : [];
            const assignments = Array.isArray(mod.assignments) ? mod.assignments : [];
            const totalItems = lessons.length + quizzes.length + assignments.length;

            return `
                <div class="wizard-module-card border rounded bg-white shadow-sm overflow-hidden" data-module-index="${mIdx}">
                    <!-- Module Header -->
                    <div class="wizard-module-header p-3 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                            <span class="badge bg-primary px-2 py-1 flex-shrink-0" style="font-size: 11px;">Module ${mIdx + 1}</span>
                            <span class="fw-bold text-dark text-truncate" style="font-size: 13.5px;">${escapeHtml(mod.title)}</span>
                            <span class="badge bg-white text-secondary border flex-shrink-0" style="font-size: 11px;">${escapeHtml(mod.duration || '2 Weeks')}</span>
                            <div class="d-none d-md-flex align-items-center gap-1 flex-shrink-0">
                                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style="font-size: 10px;">${lessons.length} ${lessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
                                <span class="badge bg-purple bg-opacity-10 border border-opacity-25" style="font-size: 10px; color: #7C3AED; border-color: #7C3AED !important; background-color: rgba(124, 58, 237, 0.1);">${quizzes.length} ${quizzes.length === 1 ? 'Quiz' : 'Quizzes'}</span>
                                <span class="badge bg-warning bg-opacity-10 border border-opacity-25" style="font-size: 10px; color: #D97706; border-color: #D97706 !important; background-color: rgba(217, 119, 6, 0.1);">${assignments.length} ${assignments.length === 1 ? 'Assignment' : 'Assignments'}</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-1 flex-shrink-0">
                            <!-- Add Content Dropdown / Action Buttons -->
                            <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11px;" onclick="openWizardAddLessonModal(${mIdx})" title="Add Lesson to Module">
                                <i class="bi bi-plus-circle me-1"></i> Lesson
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-purple py-0 px-2" style="font-size: 11px; color: #7C3AED; border-color: #7C3AED;" onclick="openWizardAddQuizModal(${mIdx})" title="Add Quiz to Module">
                                <i class="bi bi-plus-circle me-1"></i> Quiz
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-warning py-0 px-2" style="font-size: 11px; color: #D97706; border-color: #D97706;" onclick="openWizardAddAssignmentModal(${mIdx})" title="Add Assignment to Module">
                                <i class="bi bi-plus-circle me-1"></i> Assignment
                            </button>
                            
                            <!-- Reorder / Edit / Delete Module -->
                            <button type="button" class="wizard-reorder-btn btn btn-sm btn-light border py-0 px-1.5 ms-1" title="Move Module Up" ${mIdx === 0 ? 'disabled' : ''} onclick="moveWizardModule(${mIdx}, -1)">
                                <i class="bi bi-arrow-up"></i>
                            </button>
                            <button type="button" class="wizard-reorder-btn btn btn-sm btn-light border py-0 px-1.5" title="Move Module Down" ${mIdx === wizardModules.length - 1 ? 'disabled' : ''} onclick="moveWizardModule(${mIdx}, 1)">
                                <i class="bi bi-arrow-down"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-light border py-0 px-2" style="font-size: 11px;" onclick="openWizardEditModuleModal(${mIdx})" title="Edit Module">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-light border text-danger py-0 px-2" style="font-size: 11px;" onclick="deleteWizardModule(${mIdx})" title="Delete Module">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Module Body (Lessons, Quizzes, Assignments) -->
                    <div class="wizard-module-body p-3">
                        ${mod.description ? `<p class="text-muted small mb-3" style="font-size: 11.5px;">${escapeHtml(mod.description)}</p>` : ''}
                        
                        ${totalItems === 0 ? `
                            <div class="text-muted small py-3 px-3 bg-light rounded border text-center" style="font-size: 11.5px;">
                                No content in this module yet. Add a 
                                <a href="javascript:void(0)" class="fw-semibold text-primary" onclick="openWizardAddLessonModal(${mIdx})">+ Lesson</a>, 
                                <a href="javascript:void(0)" class="fw-semibold" style="color: #7C3AED;" onclick="openWizardAddQuizModal(${mIdx})">+ Quiz</a>, or 
                                <a href="javascript:void(0)" class="fw-semibold" style="color: #D97706;" onclick="openWizardAddAssignmentModal(${mIdx})">+ Assignment</a>.
                            </div>
                        ` : `
                            <div class="d-flex flex-column gap-2">
                                <!-- 1. Lessons -->
                                ${lessons.map((les, lIdx) => {
                                    const contentType = les.content_type || (les.video_url ? 'Video' : les.pdf_url ? 'Document' : 'Text');
                                    const icon = contentType === 'Document' ? 'bi-file-earmark-pdf text-danger' : contentType === 'Text' ? 'bi-file-text text-secondary' : 'bi-camera-video text-primary';
                                    const mediaTag = les.video_size ? `${contentType} &bull; ${les.video_size}` : les.pdf_size ? `${contentType} &bull; ${les.pdf_size}` : contentType;
                                    return `
                                        <div class="p-2.5 bg-light rounded border d-flex align-items-center justify-content-between flex-wrap gap-2" data-lesson-index="${lIdx}">
                                            <div class="d-flex align-items-center gap-2.5 flex-grow-1 min-w-0">
                                                <div class="p-1.5 bg-white rounded border d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px;">
                                                    <i class="bi ${icon} fs-6"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="fw-semibold text-dark text-truncate" style="font-size: 12.5px;">
                                                        ${escapeHtml(les.title)}
                                                    </div>
                                                    <div class="d-flex align-items-center gap-2 text-muted" style="font-size: 11px;">
                                                        <span><i class="bi bi-clock me-1"></i>${escapeHtml(les.duration || '45 Mins')}</span>
                                                        <span>&bull;</span>
                                                        <span class="badge bg-white text-muted border px-1.5 py-0.5" style="font-size: 10px;">${escapeHtml(mediaTag)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                                <button type="button" class="btn btn-sm btn-light border py-0 px-1.5" title="Move Lesson Up" ${lIdx === 0 ? 'disabled' : ''} onclick="moveWizardLesson(${mIdx}, ${lIdx}, -1)">
                                                    <i class="bi bi-arrow-up" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-light border py-0 px-1.5" title="Move Lesson Down" ${lIdx === lessons.length - 1 ? 'disabled' : ''} onclick="moveWizardLesson(${mIdx}, ${lIdx}, 1)">
                                                    <i class="bi bi-arrow-down" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-light border py-0 px-2" title="Edit Lesson" onclick="openWizardEditLessonModal(${mIdx}, ${lIdx})">
                                                    <i class="bi bi-pencil" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-light border text-danger py-0 px-2" title="Delete Lesson" onclick="deleteWizardLesson(${mIdx}, ${lIdx})">
                                                    <i class="bi bi-trash" style="font-size: 11px;"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}

                                <!-- 2. Quizzes -->
                                ${quizzes.map((quiz, qIdx) => {
                                    const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
                                    return `
                                        <div class="p-2.5 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2" style="background-color: #FAF5FF; border-color: #E9D5FF !important;" data-quiz-index="${qIdx}">
                                            <div class="d-flex align-items-center gap-2.5 flex-grow-1 min-w-0">
                                                <div class="p-1.5 bg-white rounded border d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px; border-color: #E9D5FF !important;">
                                                    <i class="bi bi-question-square fs-6" style="color: #7C3AED;"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="fw-semibold text-dark text-truncate" style="font-size: 12.5px;">
                                                        ${escapeHtml(quiz.title)}
                                                    </div>
                                                    <div class="d-flex align-items-center gap-2 text-muted" style="font-size: 11px;">
                                                        <span><i class="bi bi-clock me-1"></i>${escapeHtml(quiz.duration_mins || 20)} Mins</span>
                                                        <span>&bull;</span>
                                                        <span class="badge bg-white border px-1.5 py-0.5" style="font-size: 10px; color: #7C3AED; border-color: #E9D5FF !important;">
                                                            ${qCount} ${qCount === 1 ? 'Question' : 'Questions'} &bull; Pass: ${quiz.passing_score || 70}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                                <button type="button" class="btn btn-sm btn-white border py-0 px-1.5" title="Move Quiz Up" ${qIdx === 0 ? 'disabled' : ''} onclick="moveWizardQuiz(${mIdx}, ${qIdx}, -1)">
                                                    <i class="bi bi-arrow-up" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-white border py-0 px-1.5" title="Move Quiz Down" ${qIdx === quizzes.length - 1 ? 'disabled' : ''} onclick="moveWizardQuiz(${mIdx}, ${qIdx}, 1)">
                                                    <i class="bi bi-arrow-down" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-white border py-0 px-2" title="Edit Quiz" onclick="openWizardEditQuizModal(${mIdx}, ${qIdx})">
                                                    <i class="bi bi-pencil" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-white border text-danger py-0 px-2" title="Delete Quiz" onclick="deleteWizardQuiz(${mIdx}, ${qIdx})">
                                                    <i class="bi bi-trash" style="font-size: 11px;"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}

                                <!-- 3. Assignments -->
                                ${assignments.map((assign, aIdx) => {
                                    return `
                                        <div class="p-2.5 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2" style="background-color: #FFFBEB; border-color: #FDE68A !important;" data-assignment-index="${aIdx}">
                                            <div class="d-flex align-items-center gap-2.5 flex-grow-1 min-w-0">
                                                <div class="p-1.5 bg-white rounded border d-flex align-items-center justify-content-center flex-shrink-0" style="width: 32px; height: 32px; border-color: #FDE68A !important;">
                                                    <i class="bi bi-journal-check fs-6" style="color: #D97706;"></i>
                                                </div>
                                                <div class="min-w-0">
                                                    <div class="fw-semibold text-dark text-truncate" style="font-size: 12.5px;">
                                                        ${escapeHtml(assign.title)}
                                                    </div>
                                                    <div class="d-flex align-items-center gap-2 text-muted" style="font-size: 11px;">
                                                        <span><i class="bi bi-award me-1"></i>${assign.max_score || 100} Points</span>
                                                        ${assign.due_date ? `<span>&bull;</span><span><i class="bi bi-calendar-event me-1"></i>Due ${escapeHtml(assign.due_date)}</span>` : ''}
                                                        ${assign.attachment_name ? `<span>&bull;</span><span class="badge bg-white border px-1.5 py-0.5" style="font-size: 10px; color: #D97706; border-color: #FDE68A !important;"><i class="bi bi-paperclip me-0.5"></i>${escapeHtml(assign.attachment_name)}</span>` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                                <button type="button" class="btn btn-sm btn-white border py-0 px-1.5" title="Move Assignment Up" ${aIdx === 0 ? 'disabled' : ''} onclick="moveWizardAssignment(${mIdx}, ${aIdx}, -1)">
                                                    <i class="bi bi-arrow-up" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-white border py-0 px-1.5" title="Move Assignment Down" ${aIdx === assignments.length - 1 ? 'disabled' : ''} onclick="moveWizardAssignment(${mIdx}, ${aIdx}, 1)">
                                                    <i class="bi bi-arrow-down" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-white border py-0 px-2" title="Edit Assignment" onclick="openWizardEditAssignmentModal(${mIdx}, ${aIdx})">
                                                    <i class="bi bi-pencil" style="font-size: 11px;"></i>
                                                </button>
                                                <button type="button" class="btn btn-sm btn-white border text-danger py-0 px-2" title="Delete Assignment" onclick="deleteWizardAssignment(${mIdx}, ${aIdx})">
                                                    <i class="bi bi-trash" style="font-size: 11px;"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Wizard Module CRUD & Reorder Actions
    window.openWizardAddModuleModal = function () {
        const form = document.getElementById('wizardModuleForm');
        if (form) form.reset();
        document.getElementById('wizardModuleEditIndex').value = '';
        document.getElementById('wizardModuleModalTitle').textContent = 'Add Curriculum Module';
        document.getElementById('wizardModuleDurationInput').value = '2 Weeks';
        const titleInput = document.getElementById('wizardModuleTitleInput');
        if (titleInput) {
            titleInput.classList.remove('is-invalid');
            titleInput.value = `Module ${wizardModules.length + 1} — `;
        }
        if (wizardModuleModal) wizardModuleModal.show();
    };

    window.openWizardEditModuleModal = function (modIndex) {
        const mod = wizardModules[modIndex];
        if (!mod) return;
        document.getElementById('wizardModuleEditIndex').value = String(modIndex);
        document.getElementById('wizardModuleModalTitle').textContent = `Edit Module ${modIndex + 1}`;
        document.getElementById('wizardModuleTitleInput').value = mod.title || '';
        document.getElementById('wizardModuleDurationInput').value = mod.duration || '2 Weeks';
        document.getElementById('wizardModuleDescInput').value = mod.description || '';
        const titleInput = document.getElementById('wizardModuleTitleInput');
        if (titleInput) titleInput.classList.remove('is-invalid');
        if (wizardModuleModal) wizardModuleModal.show();
    };

    window.deleteWizardModule = async function (modIndex) {
        const mod = wizardModules[modIndex];
        if (!mod) return;
        const lesCount = (mod.lessons || []).length;
        const qCount = (mod.quizzes || []).length;
        const aCount = (mod.assignments || []).length;
        const totalSubItems = lesCount + qCount + aCount;

        const confirmed = window.AdminStore ? await window.AdminStore.constructor.confirmDialog(
            'Delete Module?',
            `Are you sure you want to remove "${mod.title}"${totalSubItems > 0 ? ` and all its ${totalSubItems} curriculum items` : ''}?`,
            'Yes, Remove',
            '#DC2626'
        ) : confirm(`Delete module "${mod.title}"?`);

        if (confirmed) {
            wizardModules.splice(modIndex, 1);
            wizardModules.forEach((m, idx) => { m.chapter_num = idx + 1; });
            renderWizardModules();
            if (window.AdminStore) window.AdminStore.constructor.toast('Module removed from wizard', 'info');
        }
    };

    window.moveWizardModule = function (modIndex, direction) {
        const targetIndex = modIndex + direction;
        if (targetIndex < 0 || targetIndex >= wizardModules.length) return;
        const temp = wizardModules[modIndex];
        wizardModules[modIndex] = wizardModules[targetIndex];
        wizardModules[targetIndex] = temp;
        wizardModules.forEach((m, idx) => { m.chapter_num = idx + 1; });
        renderWizardModules();
    };

    // ==========================================================================
    // WIZARD LESSON CRUD, CONTENT TYPE SELECTOR & FILE UPLOADS
    // ==========================================================================
    window.setWizardLessonContentType = function (type) {
        const typeInput = document.getElementById('wizardLessonContentTypeVal');
        if (typeInput) typeInput.value = type;

        const btnVideo = document.getElementById('btnTypeVideo');
        const btnDoc = document.getElementById('btnTypeDocument');
        const btnText = document.getElementById('btnTypeText');

        if (btnVideo) btnVideo.classList.toggle('active', type === 'Video');
        if (btnDoc) btnDoc.classList.toggle('active', type === 'Document');
        if (btnText) btnText.classList.toggle('active', type === 'Text');

        const videoSec = document.getElementById('wizardLessonVideoSection');
        const docSec = document.getElementById('wizardLessonDocumentSection');
        const textSec = document.getElementById('wizardLessonTextSection');

        if (videoSec) videoSec.style.display = type === 'Video' ? 'block' : 'none';
        if (docSec) docSec.style.display = type === 'Document' ? 'block' : 'none';
        if (textSec) textSec.style.display = type === 'Text' ? 'block' : 'none';
    };

    window.openWizardAddLessonModal = function (modIndex) {
        const mod = wizardModules[modIndex];
        if (!mod) return;
        const form = document.getElementById('wizardLessonForm');
        if (form) form.reset();
        document.getElementById('wizardLessonModuleIndex').value = String(modIndex);
        document.getElementById('wizardLessonEditIndex').value = '';
        document.getElementById('wizardLessonModalTitle').textContent = `Add Lesson to Module ${modIndex + 1}`;
        document.getElementById('wizardLessonDurationInput').value = '45 Mins';
        
        // Reset preview boxes
        const videoPrevBox = document.getElementById('wizardLessonVideoPreviewBox');
        if (videoPrevBox) videoPrevBox.style.display = 'none';
        const docPrevBox = document.getElementById('wizardLessonDocPreviewBox');
        if (docPrevBox) docPrevBox.style.display = 'none';

        setWizardLessonContentType('Video');

        const titleInput = document.getElementById('wizardLessonTitleInput');
        if (titleInput) {
            titleInput.classList.remove('is-invalid');
            const lesCount = (mod.lessons || []).length;
            titleInput.value = `${modIndex + 1}.${lesCount + 1} `;
        }
        if (wizardLessonModal) wizardLessonModal.show();
    };

    window.openWizardEditLessonModal = function (modIndex, lesIndex) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.lessons || !mod.lessons[lesIndex]) return;
        const les = mod.lessons[lesIndex];
        document.getElementById('wizardLessonModuleIndex').value = String(modIndex);
        document.getElementById('wizardLessonEditIndex').value = String(lesIndex);
        document.getElementById('wizardLessonModalTitle').textContent = `Edit Lesson (${modIndex + 1}.${lesIndex + 1})`;
        document.getElementById('wizardLessonTitleInput').value = les.title || '';
        document.getElementById('wizardLessonDurationInput').value = les.duration || '45 Mins';
        document.getElementById('wizardLessonDescInput').value = les.description || '';
        
        const contentType = les.content_type || (les.video_url ? 'Video' : les.pdf_url ? 'Document' : 'Text');
        setWizardLessonContentType(contentType);

        // Preload video preview if available
        const videoPrevBox = document.getElementById('wizardLessonVideoPreviewBox');
        const videoPlayer = document.getElementById('wizardLessonVideoPlayer');
        const videoName = document.getElementById('wizardLessonVideoFileName');
        const videoSize = document.getElementById('wizardLessonVideoFileSize');
        const videoUrlInput = document.getElementById('wizardLessonVideoUrlInput');
        if (les.video_url) {
            if (videoUrlInput) videoUrlInput.value = les.video_url;
            if (videoPlayer) videoPlayer.src = les.video_url.startsWith('blob:') ? les.video_url : `../../${les.video_url}`;
            if (videoName) videoName.textContent = les.video_url.split('/').pop() || 'lesson_video.mp4';
            if (videoSize) videoSize.textContent = les.video_size || '18.4 MB';
            if (videoPrevBox) videoPrevBox.style.display = 'block';
        } else {
            if (videoPrevBox) videoPrevBox.style.display = 'none';
        }

        // Preload document preview if available
        const docPrevBox = document.getElementById('wizardLessonDocPreviewBox');
        const docName = document.getElementById('wizardLessonDocFileName');
        const docSize = document.getElementById('wizardLessonDocFileSize');
        if (les.pdf_url) {
            if (docName) docName.textContent = les.pdf_url.split('/').pop() || 'lesson_document.pdf';
            if (docSize) docSize.textContent = les.pdf_size || '2.1 MB';
            if (docPrevBox) docPrevBox.style.display = 'flex';
        } else {
            if (docPrevBox) docPrevBox.style.display = 'none';
        }

        // Preload text content
        const textInput = document.getElementById('wizardLessonTextInput');
        if (textInput) textInput.value = les.text_content || '';

        const titleInput = document.getElementById('wizardLessonTitleInput');
        if (titleInput) titleInput.classList.remove('is-invalid');
        if (wizardLessonModal) wizardLessonModal.show();
    };

    window.deleteWizardLesson = function (modIndex, lesIndex) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.lessons) return;
        mod.lessons.splice(lesIndex, 1);
        renderWizardModules();
        if (window.AdminStore) window.AdminStore.constructor.toast('Lesson removed', 'info');
    };

    window.moveWizardLesson = function (modIndex, lesIndex, direction) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.lessons) return;
        const targetIndex = lesIndex + direction;
        if (targetIndex < 0 || targetIndex >= mod.lessons.length) return;
        const temp = mod.lessons[lesIndex];
        mod.lessons[lesIndex] = mod.lessons[targetIndex];
        mod.lessons[targetIndex] = temp;
        renderWizardModules();
    };

    // ==========================================================================
    // WIZARD QUIZ CRUD & DYNAMIC QUESTIONS BUILDER
    // ==========================================================================
    let wizardQuizActiveQuestions = [];

    function renderWizardQuizQuestions() {
        const container = document.getElementById('wizardQuizQuestionsContainer');
        const countSpan = document.getElementById('wizardQuizQuestionCount');
        if (!container) return;
        if (countSpan) countSpan.textContent = wizardQuizActiveQuestions.length;

        if (wizardQuizActiveQuestions.length === 0) {
            container.innerHTML = `
                <div class="text-center p-3 bg-light rounded border text-muted small">
                    No questions added yet. Click <strong>+ Add Question</strong> to add multiple choice questions.
                </div>
            `;
            return;
        }

        container.innerHTML = wizardQuizActiveQuestions.map((q, idx) => `
            <div class="p-3 bg-white rounded border" data-question-index="${idx}">
                <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                    <span class="fw-bold text-dark small"><i class="bi bi-question-circle text-primary me-1"></i> Question ${idx + 1}</span>
                    <div class="d-flex align-items-center gap-2">
                        <span class="text-muted small">Points:</span>
                        <input type="number" class="form-control form-control-sm text-center py-0" style="width: 60px;" value="${q.points || 10}" min="1" onchange="updateWizardQuizQuestionPoints(${idx}, this.value)">
                        ${wizardQuizActiveQuestions.length > 1 ? `
                            <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 ms-1" style="font-size: 11px;" onclick="deleteWizardQuizQuestion(${idx})">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="mb-2">
                    <label class="form-label text-muted small mb-1">Question Prompt <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(q.question || '')}" placeholder="e.g. Which HTML5 tag is used for navigation links?" onchange="updateWizardQuizQuestionField(${idx}, 'question', this.value)">
                </div>

                <div class="row g-2 mb-2">
                    <div class="col-md-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text fw-bold">A</span>
                            <input type="text" class="form-control" value="${escapeHtml(q.option_a || '')}" placeholder="Option A" onchange="updateWizardQuizQuestionField(${idx}, 'option_a', this.value)">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text fw-bold">B</span>
                            <input type="text" class="form-control" value="${escapeHtml(q.option_b || '')}" placeholder="Option B" onchange="updateWizardQuizQuestionField(${idx}, 'option_b', this.value)">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text fw-bold">C</span>
                            <input type="text" class="form-control" value="${escapeHtml(q.option_c || '')}" placeholder="Option C" onchange="updateWizardQuizQuestionField(${idx}, 'option_c', this.value)">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text fw-bold">D</span>
                            <input type="text" class="form-control" value="${escapeHtml(q.option_d || '')}" placeholder="Option D" onchange="updateWizardQuizQuestionField(${idx}, 'option_d', this.value)">
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <label class="form-label text-muted small mb-0">Correct Answer:</label>
                    <select class="form-select form-select-sm" style="width: 140px;" onchange="updateWizardQuizQuestionField(${idx}, 'correct_answer', this.value)">
                        <option value="A" ${q.correct_answer === 'A' ? 'selected' : ''}>Option A</option>
                        <option value="B" ${q.correct_answer === 'B' ? 'selected' : ''}>Option B</option>
                        <option value="C" ${q.correct_answer === 'C' ? 'selected' : ''}>Option C</option>
                        <option value="D" ${q.correct_answer === 'D' ? 'selected' : ''}>Option D</option>
                    </select>
                </div>
            </div>
        `).join('');
    }

    window.addWizardQuizQuestion = function (qData) {
        wizardQuizActiveQuestions.push(qData || {
            question: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_answer: 'A',
            points: 10
        });
        renderWizardQuizQuestions();
    };

    window.deleteWizardQuizQuestion = function (qIdx) {
        wizardQuizActiveQuestions.splice(qIdx, 1);
        renderWizardQuizQuestions();
    };

    window.updateWizardQuizQuestionField = function (idx, field, value) {
        if (wizardQuizActiveQuestions[idx]) {
            wizardQuizActiveQuestions[idx][field] = value;
        }
    };

    window.updateWizardQuizQuestionPoints = function (idx, value) {
        if (wizardQuizActiveQuestions[idx]) {
            wizardQuizActiveQuestions[idx].points = parseInt(value) || 10;
        }
    };

    window.openWizardAddQuizModal = function (modIndex) {
        const mod = wizardModules[modIndex];
        if (!mod) return;
        const form = document.getElementById('wizardQuizForm');
        if (form) form.reset();
        document.getElementById('wizardQuizModuleIndex').value = String(modIndex);
        document.getElementById('wizardQuizEditIndex').value = '';
        document.getElementById('wizardQuizModalTitle').textContent = `Add Quiz to Module ${modIndex + 1}`;
        document.getElementById('wizardQuizDurationInput').value = '20';
        document.getElementById('wizardQuizPassingScoreInput').value = '70';

        const qCount = (mod.quizzes || []).length;
        const titleInput = document.getElementById('wizardQuizTitleInput');
        if (titleInput) {
            titleInput.classList.remove('is-invalid');
            titleInput.value = `Quiz ${qCount + 1} — Knowledge Check`;
        }

        wizardQuizActiveQuestions = [
            {
                question: 'Which element is used to structure content in HTML5?',
                option_a: '<header>',
                option_b: '<div>',
                option_c: '<section>',
                option_d: 'All of the above',
                correct_answer: 'D',
                points: 10
            }
        ];
        renderWizardQuizQuestions();

        if (wizardQuizModal) wizardQuizModal.show();
    };

    window.openWizardEditQuizModal = function (modIndex, qIndex) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.quizzes || !mod.quizzes[qIndex]) return;
        const quiz = mod.quizzes[qIndex];
        document.getElementById('wizardQuizModuleIndex').value = String(modIndex);
        document.getElementById('wizardQuizEditIndex').value = String(qIndex);
        document.getElementById('wizardQuizModalTitle').textContent = `Edit Quiz (${quiz.title})`;
        document.getElementById('wizardQuizTitleInput').value = quiz.title || '';
        document.getElementById('wizardQuizDurationInput').value = quiz.duration_mins || 20;
        document.getElementById('wizardQuizPassingScoreInput').value = quiz.passing_score || 70;
        document.getElementById('wizardQuizDescInput').value = quiz.description || '';

        wizardQuizActiveQuestions = Array.isArray(quiz.questions) && quiz.questions.length > 0
            ? JSON.parse(JSON.stringify(quiz.questions))
            : [
                {
                    question: 'Question prompt',
                    option_a: 'Option A',
                    option_b: 'Option B',
                    option_c: 'Option C',
                    option_d: 'Option D',
                    correct_answer: 'A',
                    points: 10
                }
            ];
        renderWizardQuizQuestions();

        const titleInput = document.getElementById('wizardQuizTitleInput');
        if (titleInput) titleInput.classList.remove('is-invalid');
        if (wizardQuizModal) wizardQuizModal.show();
    };

    window.deleteWizardQuiz = function (modIndex, qIndex) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.quizzes) return;
        mod.quizzes.splice(qIndex, 1);
        renderWizardModules();
        if (window.AdminStore) window.AdminStore.constructor.toast('Quiz removed', 'info');
    };

    window.moveWizardQuiz = function (modIndex, qIndex, direction) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.quizzes) return;
        const targetIndex = qIndex + direction;
        if (targetIndex < 0 || targetIndex >= mod.quizzes.length) return;
        const temp = mod.quizzes[qIndex];
        mod.quizzes[qIndex] = mod.quizzes[targetIndex];
        mod.quizzes[targetIndex] = temp;
        renderWizardModules();
    };

    // ==========================================================================
    // WIZARD ASSIGNMENT CRUD & ATTACHMENT HANDLERS
    // ==========================================================================
    let wizardAssignmentActiveAttachment = null;

    window.openWizardAddAssignmentModal = function (modIndex) {
        const mod = wizardModules[modIndex];
        if (!mod) return;
        const form = document.getElementById('wizardAssignmentForm');
        if (form) form.reset();
        document.getElementById('wizardAssignmentModuleIndex').value = String(modIndex);
        document.getElementById('wizardAssignmentEditIndex').value = '';
        document.getElementById('wizardAssignmentModalTitle').textContent = `Add Assignment to Module ${modIndex + 1}`;
        document.getElementById('wizardAssignmentMaxScoreInput').value = '100';

        const assignCount = (mod.assignments || []).length;
        const titleInput = document.getElementById('wizardAssignmentTitleInput');
        if (titleInput) {
            titleInput.classList.remove('is-invalid');
            titleInput.value = `Assignment ${assignCount + 1} — Practical Application`;
        }

        const prevBox = document.getElementById('wizardAssignmentPreviewBox');
        if (prevBox) prevBox.style.display = 'none';
        wizardAssignmentActiveAttachment = null;

        if (wizardAssignmentModal) wizardAssignmentModal.show();
    };

    window.openWizardEditAssignmentModal = function (modIndex, aIndex) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.assignments || !mod.assignments[aIndex]) return;
        const assign = mod.assignments[aIndex];
        document.getElementById('wizardAssignmentModuleIndex').value = String(modIndex);
        document.getElementById('wizardAssignmentEditIndex').value = String(aIndex);
        document.getElementById('wizardAssignmentModalTitle').textContent = `Edit Assignment (${assign.title})`;
        document.getElementById('wizardAssignmentTitleInput').value = assign.title || '';
        document.getElementById('wizardAssignmentMaxScoreInput').value = assign.max_score || 100;
        document.getElementById('wizardAssignmentDueDateInput').value = assign.due_date ? String(assign.due_date).split('T')[0] : '';
        document.getElementById('wizardAssignmentInstructionsInput').value = assign.instructions || '';

        const prevBox = document.getElementById('wizardAssignmentPreviewBox');
        const fileNameEl = document.getElementById('wizardAssignmentFileName');
        const fileSizeEl = document.getElementById('wizardAssignmentFileSize');
        if (assign.attachment_name) {
            if (fileNameEl) fileNameEl.textContent = assign.attachment_name;
            if (fileSizeEl) fileSizeEl.textContent = assign.attachment_size || '2.4 MB';
            if (prevBox) prevBox.style.display = 'flex';
            wizardAssignmentActiveAttachment = {
                name: assign.attachment_name,
                size: assign.attachment_size || '2.4 MB'
            };
        } else {
            if (prevBox) prevBox.style.display = 'none';
            wizardAssignmentActiveAttachment = null;
        }

        const titleInput = document.getElementById('wizardAssignmentTitleInput');
        if (titleInput) titleInput.classList.remove('is-invalid');
        if (wizardAssignmentModal) wizardAssignmentModal.show();
    };

    window.deleteWizardAssignment = function (modIndex, aIndex) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.assignments) return;
        mod.assignments.splice(aIndex, 1);
        renderWizardModules();
        if (window.AdminStore) window.AdminStore.constructor.toast('Assignment removed', 'info');
    };

    window.moveWizardAssignment = function (modIndex, aIndex, direction) {
        const mod = wizardModules[modIndex];
        if (!mod || !mod.assignments) return;
        const targetIndex = aIndex + direction;
        if (targetIndex < 0 || targetIndex >= mod.assignments.length) return;
        const temp = mod.assignments[aIndex];
        mod.assignments[aIndex] = mod.assignments[targetIndex];
        mod.assignments[targetIndex] = temp;
        renderWizardModules();
    };

    // Setup Wizard Upload Dropzones and Listeners
    function setupWizardMediaListeners() {
        // Lesson Video Dropzone & Input
        const lVideoInput = document.getElementById('wizardLessonVideoInput');
        const lVideoDropzone = document.getElementById('wizardLessonVideoDropzone');
        const lVideoPrevBox = document.getElementById('wizardLessonVideoPreviewBox');
        const lVideoPlayer = document.getElementById('wizardLessonVideoPlayer');
        const lVideoName = document.getElementById('wizardLessonVideoFileName');
        const lVideoSize = document.getElementById('wizardLessonVideoFileSize');
        const replaceLVideoBtn = document.getElementById('replaceWizardLessonVideoBtn');
        const removeLVideoBtn = document.getElementById('removeWizardLessonVideoBtn');

        function handleLessonVideoFile(file) {
            if (!file) return;
            const blobUrl = URL.createObjectURL(file);
            if (lVideoPlayer) lVideoPlayer.src = blobUrl;
            if (lVideoName) lVideoName.textContent = file.name;
            if (lVideoSize) lVideoSize.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
            if (lVideoPrevBox) lVideoPrevBox.style.display = 'block';
            const urlInput = document.getElementById('wizardLessonVideoUrlInput');
            if (urlInput) urlInput.value = `assets/videos/${file.name}`;
        }

        if (lVideoInput) {
            lVideoInput.addEventListener('change', function () {
                if (this.files && this.files[0]) handleLessonVideoFile(this.files[0]);
            });
        }
        if (replaceLVideoBtn && lVideoInput) {
            replaceLVideoBtn.addEventListener('click', () => lVideoInput.click());
        }
        if (removeLVideoBtn) {
            removeLVideoBtn.addEventListener('click', function () {
                if (lVideoInput) lVideoInput.value = '';
                if (lVideoPrevBox) lVideoPrevBox.style.display = 'none';
                if (lVideoPlayer) lVideoPlayer.src = '';
                const urlInput = document.getElementById('wizardLessonVideoUrlInput');
                if (urlInput) urlInput.value = '';
            });
        }

        // Lesson Document Dropzone & Input
        const lDocInput = document.getElementById('wizardLessonDocInput');
        const lDocPrevBox = document.getElementById('wizardLessonDocPreviewBox');
        const lDocName = document.getElementById('wizardLessonDocFileName');
        const lDocSize = document.getElementById('wizardLessonDocFileSize');
        const replaceLDocBtn = document.getElementById('replaceWizardLessonDocBtn');
        const removeLDocBtn = document.getElementById('removeWizardLessonDocBtn');

        function handleLessonDocFile(file) {
            if (!file) return;
            if (lDocName) lDocName.textContent = file.name;
            if (lDocSize) lDocSize.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
            if (lDocPrevBox) lDocPrevBox.style.display = 'flex';
        }

        if (lDocInput) {
            lDocInput.addEventListener('change', function () {
                if (this.files && this.files[0]) handleLessonDocFile(this.files[0]);
            });
        }
        if (replaceLDocBtn && lDocInput) {
            replaceLDocBtn.addEventListener('click', () => lDocInput.click());
        }
        if (removeLDocBtn) {
            removeLDocBtn.addEventListener('click', function () {
                if (lDocInput) lDocInput.value = '';
                if (lDocPrevBox) lDocPrevBox.style.display = 'none';
            });
        }

        // Assignment Attachment Dropzone & Input
        const aFileInput = document.getElementById('wizardAssignmentFileInput');
        const aPrevBox = document.getElementById('wizardAssignmentPreviewBox');
        const aFileName = document.getElementById('wizardAssignmentFileName');
        const aFileSize = document.getElementById('wizardAssignmentFileSize');
        const replaceAFileBtn = document.getElementById('replaceWizardAssignmentFileBtn');
        const removeAFileBtn = document.getElementById('removeWizardAssignmentFileBtn');

        function handleAssignmentFile(file) {
            if (!file) return;
            wizardAssignmentActiveAttachment = {
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
            };
            if (aFileName) aFileName.textContent = file.name;
            if (aFileSize) aFileSize.textContent = wizardAssignmentActiveAttachment.size;
            if (aPrevBox) aPrevBox.style.display = 'flex';
        }

        if (aFileInput) {
            aFileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) handleAssignmentFile(this.files[0]);
            });
        }
        if (replaceAFileBtn && aFileInput) {
            replaceAFileBtn.addEventListener('click', () => aFileInput.click());
        }
        if (removeAFileBtn) {
            removeAFileBtn.addEventListener('click', function () {
                if (aFileInput) aFileInput.value = '';
                if (aPrevBox) aPrevBox.style.display = 'none';
                wizardAssignmentActiveAttachment = null;
            });
        }
    }
    setupWizardMediaListeners();

    // ==========================================================================
    // SUB-MODAL FORMS LISTENERS
    // ==========================================================================
    const wizardModuleForm = document.getElementById('wizardModuleForm');
    if (wizardModuleForm) {
        wizardModuleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const editIndexVal = document.getElementById('wizardModuleEditIndex').value;
            const title = document.getElementById('wizardModuleTitleInput').value.trim();
            const duration = document.getElementById('wizardModuleDurationInput').value.trim() || '2 Weeks';
            const description = document.getElementById('wizardModuleDescInput').value.trim();

            if (!title || title.length < 2) {
                const titleInput = document.getElementById('wizardModuleTitleInput');
                if (titleInput) titleInput.classList.add('is-invalid');
                return;
            }

            if (editIndexVal !== '') {
                const idx = parseInt(editIndexVal);
                if (wizardModules[idx]) {
                    wizardModules[idx].title = title;
                    wizardModules[idx].duration = duration;
                    wizardModules[idx].description = description;
                }
            } else {
                wizardModules.push({
                    chapter_num: wizardModules.length + 1,
                    title: title,
                    duration: duration,
                    description: description,
                    lessons: [],
                    quizzes: [],
                    assignments: []
                });
            }

            if (wizardModuleModal) wizardModuleModal.hide();
            renderWizardModules();
            if (window.AdminStore) window.AdminStore.constructor.toast(editIndexVal !== '' ? 'Module updated' : 'Module added to curriculum', 'success');
        });
    }

    const wizardLessonForm = document.getElementById('wizardLessonForm');
    if (wizardLessonForm) {
        wizardLessonForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const modIndex = parseInt(document.getElementById('wizardLessonModuleIndex').value);
            const editIndexVal = document.getElementById('wizardLessonEditIndex').value;
            const title = document.getElementById('wizardLessonTitleInput').value.trim();
            const duration = document.getElementById('wizardLessonDurationInput').value.trim() || '45 Mins';
            const description = document.getElementById('wizardLessonDescInput').value.trim();
            const contentType = document.getElementById('wizardLessonContentTypeVal')?.value || 'Video';
            const videoUrl = document.getElementById('wizardLessonVideoUrlInput')?.value.trim() || '';
            const videoSize = document.getElementById('wizardLessonVideoFileSize')?.textContent || '18.4 MB';
            const docName = document.getElementById('wizardLessonDocFileName')?.textContent || 'document.pdf';
            const docSize = document.getElementById('wizardLessonDocFileSize')?.textContent || '1.2 MB';
            const textContent = document.getElementById('wizardLessonTextInput')?.value.trim() || '';

            if (!title || title.length < 2) {
                const titleInput = document.getElementById('wizardLessonTitleInput');
                if (titleInput) titleInput.classList.add('is-invalid');
                return;
            }

            const mod = wizardModules[modIndex];
            if (!mod) return;
            if (!Array.isArray(mod.lessons)) mod.lessons = [];

            const lessonObj = {
                title: title,
                duration: duration,
                description: description,
                content_type: contentType,
                video_url: contentType === 'Video' ? (videoUrl || 'assets/videos/lesson1.mp4') : '',
                video_size: contentType === 'Video' ? videoSize : '',
                pdf_url: contentType === 'Document' ? `assets/docs/${docName}` : '',
                pdf_size: contentType === 'Document' ? docSize : '',
                text_content: contentType === 'Text' ? textContent : ''
            };

            if (editIndexVal !== '') {
                const lIdx = parseInt(editIndexVal);
                if (mod.lessons[lIdx]) {
                    mod.lessons[lIdx] = Object.assign(mod.lessons[lIdx], lessonObj);
                }
            } else {
                mod.lessons.push(lessonObj);
            }

            if (wizardLessonModal) wizardLessonModal.hide();
            renderWizardModules();
            if (window.AdminStore) window.AdminStore.constructor.toast(editIndexVal !== '' ? 'Lesson updated' : 'Lesson added to module', 'success');
        });
    }

    const wizardQuizForm = document.getElementById('wizardQuizForm');
    if (wizardQuizForm) {
        wizardQuizForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const modIndex = parseInt(document.getElementById('wizardQuizModuleIndex').value);
            const editIndexVal = document.getElementById('wizardQuizEditIndex').value;
            const title = document.getElementById('wizardQuizTitleInput').value.trim();
            const duration = parseInt(document.getElementById('wizardQuizDurationInput').value) || 20;
            const passingScore = parseInt(document.getElementById('wizardQuizPassingScoreInput').value) || 70;
            const description = document.getElementById('wizardQuizDescInput').value.trim();

            if (!title || title.length < 2) {
                const titleInput = document.getElementById('wizardQuizTitleInput');
                if (titleInput) titleInput.classList.add('is-invalid');
                return;
            }

            const mod = wizardModules[modIndex];
            if (!mod) return;
            if (!Array.isArray(mod.quizzes)) mod.quizzes = [];

            const quizObj = {
                title: title,
                duration_mins: duration,
                passing_score: passingScore,
                description: description,
                questions: wizardQuizActiveQuestions.length > 0 ? JSON.parse(JSON.stringify(wizardQuizActiveQuestions)) : [
                    {
                        question: 'Sample Question',
                        option_a: 'Option A',
                        option_b: 'Option B',
                        option_c: 'Option C',
                        option_d: 'Option D',
                        correct_answer: 'A',
                        points: 10
                    }
                ]
            };

            if (editIndexVal !== '') {
                const qIdx = parseInt(editIndexVal);
                if (mod.quizzes[qIdx]) {
                    mod.quizzes[qIdx] = Object.assign(mod.quizzes[qIdx], quizObj);
                }
            } else {
                mod.quizzes.push(quizObj);
            }

            if (wizardQuizModal) wizardQuizModal.hide();
            renderWizardModules();
            if (window.AdminStore) window.AdminStore.constructor.toast(editIndexVal !== '' ? 'Quiz updated' : 'Quiz added to module', 'success');
        });
    }

    const wizardAssignmentForm = document.getElementById('wizardAssignmentForm');
    if (wizardAssignmentForm) {
        wizardAssignmentForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const modIndex = parseInt(document.getElementById('wizardAssignmentModuleIndex').value);
            const editIndexVal = document.getElementById('wizardAssignmentEditIndex').value;
            const title = document.getElementById('wizardAssignmentTitleInput').value.trim();
            const maxScore = parseInt(document.getElementById('wizardAssignmentMaxScoreInput').value) || 100;
            const dueDate = document.getElementById('wizardAssignmentDueDateInput').value;
            const instructions = document.getElementById('wizardAssignmentInstructionsInput').value.trim();

            if (!title || title.length < 2) {
                const titleInput = document.getElementById('wizardAssignmentTitleInput');
                if (titleInput) titleInput.classList.add('is-invalid');
                return;
            }

            if (!instructions || instructions.length < 5) {
                const instrInput = document.getElementById('wizardAssignmentInstructionsInput');
                if (instrInput) instrInput.classList.add('is-invalid');
                return;
            }

            const mod = wizardModules[modIndex];
            if (!mod) return;
            if (!Array.isArray(mod.assignments)) mod.assignments = [];

            const assignmentObj = {
                title: title,
                max_score: maxScore,
                due_date: dueDate,
                instructions: instructions,
                attachment_name: wizardAssignmentActiveAttachment ? wizardAssignmentActiveAttachment.name : '',
                attachment_size: wizardAssignmentActiveAttachment ? wizardAssignmentActiveAttachment.size : ''
            };

            if (editIndexVal !== '') {
                const aIdx = parseInt(editIndexVal);
                if (mod.assignments[aIdx]) {
                    mod.assignments[aIdx] = Object.assign(mod.assignments[aIdx], assignmentObj);
                }
            } else {
                mod.assignments.push(assignmentObj);
            }

            if (wizardAssignmentModal) wizardAssignmentModal.hide();
            renderWizardModules();
            if (window.AdminStore) window.AdminStore.constructor.toast(editIndexVal !== '' ? 'Assignment updated' : 'Assignment added to module', 'success');
        });
    }

    // Dynamic Course Status Preview Calculator
    function updateCourseStatusPreview() {
        const enrStart = document.getElementById('courseEnrollmentStart')?.value;
        const enrDeadline = document.getElementById('courseEnrollmentDeadline')?.value;
        const courseStart = document.getElementById('courseStartDate')?.value;
        const courseEnd = document.getElementById('courseEndDate')?.value;
        const isPublished = parseInt(document.getElementById('coursePublishedVal')?.value || '1') === 1;
        const badgeEl = document.getElementById('courseStatusPreviewBadge');
        if (!badgeEl) return;

        if (!isPublished) {
            badgeEl.className = 'badge bg-secondary ms-1';
            badgeEl.textContent = 'Draft';
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        let status = 'Enrollment Open';
        let badgeClass = 'badge bg-success ms-1';

        if (courseEnd && today > courseEnd) {
            status = 'Completed';
            badgeClass = 'badge bg-dark ms-1';
        } else if (courseStart && today >= courseStart) {
            status = 'In Progress';
            badgeClass = 'badge bg-primary ms-1';
        } else if (enrDeadline && today > enrDeadline) {
            status = 'Enrollment Closed';
            badgeClass = 'badge bg-danger ms-1';
        } else if (enrStart && today < enrStart) {
            status = 'Upcoming';
            badgeClass = 'badge bg-info text-dark ms-1';
        } else if (enrDeadline) {
            const diffMs = new Date(enrDeadline) - new Date(today);
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
                status = `Deadline Approaching (${diffDays}d left)`;
                badgeClass = 'badge bg-warning text-dark ms-1';
            }
        }

        badgeEl.className = badgeClass;
        badgeEl.textContent = status;
    }

    // Stepper Navigation & UI Manager (6 Steps)
    window.goToCourseStep = function (step) {
        if (step < 1 || step > 6) return;

        // If advancing forward, validate all intermediate steps
        if (step > currentCourseStep) {
            for (let s = currentCourseStep; s < step; s++) {
                const { isValid, firstInvalidEl } = validateCourseStep(s);
                if (!isValid) {
                    if (firstInvalidEl) firstInvalidEl.focus();
                    if (window.AdminStore) window.AdminStore.constructor.toast('Please complete all required fields before continuing.', 'error');
                    return;
                }
                completedCourseSteps.add(s);
            }
        }

        currentCourseStep = step;
        updateCourseStepperUI();

        // Switch active step pane
        for (let i = 1; i <= 6; i++) {
            const pane = document.getElementById(`step${i}Pane`);
            if (pane) {
                if (i === step) pane.classList.add('active');
                else pane.classList.remove('active');
            }
        }

        // Update modal footer buttons dynamically
        const cancelBtn = document.getElementById('stepperCancelBtn');
        const backBtn = document.getElementById('stepperBackBtn');
        const continueBtn = document.getElementById('stepperContinueBtn');
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const createCourseBtn = document.getElementById('createCourseSubmitBtn') || document.getElementById('saveCourseBtn');
        const isEditing = Boolean(document.getElementById('courseId')?.value);

        if (step === 1) {
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (backBtn) backBtn.style.display = 'none';
            if (continueBtn) continueBtn.style.display = 'inline-block';
            if (saveDraftBtn) saveDraftBtn.style.display = 'none';
            if (createCourseBtn) createCourseBtn.style.display = 'none';
        } else if (step >= 2 && step <= 5) {
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (backBtn) backBtn.style.display = 'inline-block';
            if (continueBtn) continueBtn.style.display = 'inline-block';
            if (saveDraftBtn) saveDraftBtn.style.display = 'none';
            if (createCourseBtn) createCourseBtn.style.display = 'none';
        } else if (step === 6) {
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (backBtn) backBtn.style.display = 'inline-block';
            if (continueBtn) continueBtn.style.display = 'none';
            if (saveDraftBtn) saveDraftBtn.style.display = 'inline-block';
            if (createCourseBtn) {
                createCourseBtn.style.display = 'inline-block';
                createCourseBtn.innerHTML = isEditing 
                    ? `<i class="bi bi-check-circle me-1"></i> Save Changes` 
                    : `<i class="bi bi-plus-circle me-1"></i> Create Course`;
            }
            populateCourseSummaryReview();
        }
    };

    function updateCourseStepperUI() {
        const stepTitles = [
            'Basic Information',
            'Course Structure',
            'Course Details & Pricing',
            'Course Media',
            'Schedule & Dates',
            'Review & Publish'
        ];

        for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById(`stepperStep${i}`);
            if (stepEl) {
                stepEl.classList.remove('active', 'completed');
                if (i === currentCourseStep) {
                    stepEl.classList.add('active');
                } else if (completedCourseSteps.has(i) && i < currentCourseStep) {
                    stepEl.classList.add('completed');
                }
            }

            if (i <= 5) {
                const lineEl = document.getElementById(`stepperLine${i}`);
                if (lineEl) {
                    if (completedCourseSteps.has(i) && currentCourseStep > i) {
                        lineEl.classList.add('completed');
                    } else {
                        lineEl.classList.remove('completed');
                    }
                }
            }
        }

        const compactBadge = document.getElementById('compactStepBadge');
        if (compactBadge) {
            compactBadge.textContent = `Step ${currentCourseStep} of 6: ${stepTitles[currentCourseStep - 1]}`;
        }
    }

    window.handleStepperClick = function (targetStep) {
        if (targetStep === currentCourseStep) return;
        if (targetStep < currentCourseStep || completedCourseSteps.has(targetStep)) {
            goToCourseStep(targetStep);
        } else if (targetStep === currentCourseStep + 1) {
            goToCourseStep(targetStep);
        }
    };

    // Step-by-Step Field Validation (6 Steps)
    function validateCourseStep(stepNumber) {
        let isValid = true;
        let firstInvalidEl = null;

        if (stepNumber === 1) {
            // Course Title
            const title = document.getElementById('courseTitle');
            const titleVal = title ? title.value.trim() : '';
            if (!titleVal) {
                setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title is required.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = title;
            } else if (titleVal.length < 3) {
                setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title must be at least 3 characters.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = title;
            } else {
                setFieldValid('courseTitle');
            }

            // Category
            const catSelect = document.getElementById('courseCategorySelect');
            if (!catSelect || !catSelect.value) {
                setFieldInvalid('courseCategorySelect', 'courseCategoryFeedback', 'Please select a category / discipline.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = catSelect;
            } else {
                setFieldValid('courseCategorySelect');
            }

            // Instructor
            const insSelect = document.getElementById('courseInstructorSelect');
            if (!insSelect || !insSelect.value) {
                setFieldInvalid('courseInstructorSelect', 'courseInstructorFeedback', 'Please select an assigned instructor.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = insSelect;
            } else {
                setFieldValid('courseInstructorSelect');
            }

            // Description
            const desc = document.getElementById('courseDesc');
            const descVal = desc ? desc.value.trim() : '';
            if (!descVal) {
                setFieldInvalid('courseDesc', 'courseDescFeedback', 'Course Description is required.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = desc;
            } else if (descVal.length < 10) {
                setFieldInvalid('courseDesc', 'courseDescFeedback', `Course Description must be at least 10 characters (${descVal.length}/10 entered).`);
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = desc;
            } else {
                setFieldValid('courseDesc');
            }
        }

        if (stepNumber === 2) {
            // Course Structure validation: ensure at least 1 module exists and all titles are valid
            if (wizardModules.length === 0) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Please add at least 1 module to the course structure.', 'error');
                isValid = false;
            } else {
                for (let i = 0; i < wizardModules.length; i++) {
                    if (!wizardModules[i].title || wizardModules[i].title.trim().length < 2) {
                        if (window.AdminStore) window.AdminStore.constructor.toast(`Module ${i + 1} requires a valid title.`, 'error');
                        isValid = false;
                        break;
                    }
                }
            }
        }

        if (stepNumber === 3) {
            // Details & Pricing validation
            const price = document.getElementById('coursePrice');
            if (price && (parseFloat(price.value) < 0 || isNaN(parseFloat(price.value)))) {
                setFieldInvalid('coursePrice', 'coursePriceFeedback', 'Price cannot be negative.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = price;
            } else if (price) {
                setFieldValid('coursePrice');
            }
        }

        if (stepNumber === 5) {
            // Schedule & Dates validation
            if (!validateCourseDates()) {
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = document.getElementById('courseEnrollmentDeadline');
            }
        }

        return { isValid, firstInvalidEl };
    }

    function validateCourseDates() {
        let datesValid = true;
        const enrStart = document.getElementById('courseEnrollmentStart')?.value;
        const enrDeadline = document.getElementById('courseEnrollmentDeadline')?.value;
        const courseStart = document.getElementById('courseStartDate')?.value;
        const courseEnd = document.getElementById('courseEndDate')?.value;

        if (enrStart && enrDeadline && new Date(enrDeadline) < new Date(enrStart)) {
            setFieldInvalid('courseEnrollmentDeadline', 'courseDeadlineFeedback', 'Enrollment Deadline cannot be before Enrollment Opens.');
            datesValid = false;
        } else {
            setFieldValid('courseEnrollmentDeadline');
        }

        if (enrDeadline && courseStart && new Date(courseStart) < new Date(enrDeadline)) {
            setFieldInvalid('courseStartDate', 'courseStartFeedback', 'Course Start Date cannot be before Enrollment Deadline.');
            datesValid = false;
        } else if (courseStart) {
            setFieldValid('courseStartDate');
        }

        if (courseStart && courseEnd && new Date(courseEnd) < new Date(courseStart)) {
            setFieldInvalid('courseEndDate', 'courseEndFeedback', 'Course End Date cannot be before Course Start Date.');
            datesValid = false;
        } else if (courseEnd) {
            setFieldValid('courseEndDate');
        }

        return datesValid;
    }

    // Step 6 Review Summary Card Population
    function populateCourseSummaryReview() {
        const title = document.getElementById('courseTitle')?.value.trim() || 'Untitled Course';
        const difficulty = document.getElementById('courseDifficulty')?.value || 'Beginner';
        const catSelect = document.getElementById('courseCategorySelect');
        const catName = (catSelect && catSelect.selectedIndex > 0) ? catSelect.options[catSelect.selectedIndex].text : 'General';
        const insSelect = document.getElementById('courseInstructorSelect');
        const insName = (insSelect && insSelect.selectedIndex > 0) ? insSelect.options[insSelect.selectedIndex].text : 'Faculty Member';
        const duration = document.getElementById('courseDuration')?.value.trim() || '8 Weeks';
        const price = parseFloat(document.getElementById('coursePrice')?.value || '0').toFixed(2);
        const prerequisites = document.getElementById('coursePrerequisites')?.value.trim() || 'None';
        const desc = document.getElementById('courseDesc')?.value.trim() || 'No description provided.';

        const enrStart = document.getElementById('courseEnrollmentStart')?.value;
        const enrDeadline = document.getElementById('courseEnrollmentDeadline')?.value;
        const courseStart = document.getElementById('courseStartDate')?.value;
        const courseEnd = document.getElementById('courseEndDate')?.value;

        const { statsSummaryText } = updateWizardStructureStats();

        // Set text values
        const revTitle = document.getElementById('reviewCourseTitle');
        const revCat = document.getElementById('reviewCourseCategory');
        const revIns = document.getElementById('reviewCourseInstructor');
        const revDiff = document.getElementById('reviewCourseDifficulty');
        const revDesc = document.getElementById('reviewCourseDesc');
        const revDur = document.getElementById('reviewCourseDuration');
        const revStruct = document.getElementById('reviewCourseStructure');
        const revPrice = document.getElementById('reviewCoursePrice');
        const revPrereq = document.getElementById('reviewCoursePrerequisites');
        const revSched = document.getElementById('reviewCourseSchedule');

        if (revTitle) revTitle.textContent = title;
        if (revCat) revCat.textContent = catName;
        if (revIns) revIns.textContent = insName;
        if (revDiff) revDiff.textContent = difficulty;
        if (revDesc) revDesc.textContent = desc;
        if (revDur) revDur.textContent = duration;
        if (revStruct) revStruct.textContent = statsSummaryText;
        if (revPrice) revPrice.textContent = `$${price}`;
        if (revPrereq) revPrereq.textContent = prerequisites;

        if (revSched) {
            if (courseStart && courseEnd) {
                revSched.textContent = `${courseStart} \u2192 ${courseEnd}`;
            } else if (enrStart) {
                revSched.textContent = `Starts: ${enrStart}`;
            } else {
                revSched.textContent = 'Open Enrollment / Ongoing';
            }
        }

        // Media Status indicators
        const thumbFileName = document.getElementById('thumbnailFileName')?.textContent;
        const thumbBoxVisible = document.getElementById('thumbnailPreviewBox')?.style.display !== 'none';
        const thumbUrl = document.getElementById('courseThumbnailUrl')?.value.trim();
        const revThumbStatus = document.getElementById('reviewThumbStatus');
        if (revThumbStatus) {
            if (thumbBoxVisible || thumbUrl) {
                revThumbStatus.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i> Thumbnail added ${thumbFileName ? `(${escapeHtml(thumbFileName)})` : ''}`;
            } else {
                revThumbStatus.innerHTML = `<span class="text-muted"><i class="bi bi-dash-circle me-1"></i> No thumbnail uploaded</span>`;
            }
        }

        const videoFileName = document.getElementById('videoFileName')?.textContent;
        const videoBoxVisible = document.getElementById('videoPreviewBox')?.style.display !== 'none';
        const videoUrl = document.getElementById('courseVideoUrl')?.value.trim();
        const revVideoStatus = document.getElementById('reviewVideoStatus');
        if (revVideoStatus) {
            if (videoBoxVisible || videoUrl) {
                revVideoStatus.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i> Introduction video added ${videoFileName ? `(${escapeHtml(videoFileName)})` : ''}`;
            } else {
                revVideoStatus.innerHTML = `<span class="text-muted"><i class="bi bi-dash-circle me-1"></i> No introduction video</span>`;
            }
        }

        // Curriculum Tree hierarchy rendering in Step 6
        const treeContainer = document.getElementById('reviewCurriculumTreeContainer');
        if (treeContainer) {
            if (wizardModules.length === 0) {
                treeContainer.innerHTML = '<div class="text-muted small py-2 text-center">No modules configured yet in Step 2.</div>';
            } else {
                treeContainer.innerHTML = wizardModules.map((m, mIdx) => {
                    const lessons = Array.isArray(m.lessons) ? m.lessons : [];
                    const quizzes = Array.isArray(m.quizzes) ? m.quizzes : [];
                    const assignments = Array.isArray(m.assignments) ? m.assignments : [];
                    return `
                        <div class="p-2.5 rounded bg-light border">
                            <div class="d-flex align-items-center justify-content-between mb-1.5">
                                <div class="fw-bold text-dark" style="font-size: 12.5px;">
                                    <span class="badge bg-primary me-1.5" style="font-size: 10px;">Module ${mIdx + 1}</span>
                                    ${escapeHtml(m.title)}
                                </div>
                                <span class="badge bg-white text-secondary border" style="font-size: 10.5px;">${escapeHtml(m.duration || '2 Weeks')}</span>
                            </div>
                            <div class="d-flex flex-column gap-1 ms-3 border-start ps-2.5" style="border-color: #E2E8F0 !important;">
                                ${lessons.map((l, lIdx) => {
                                    const icon = l.content_type === 'Document' ? 'bi-file-earmark-pdf text-danger' : l.content_type === 'Text' ? 'bi-file-text text-secondary' : 'bi-camera-video text-primary';
                                    return `
                                        <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                            <span class="text-truncate me-2"><i class="bi ${icon} me-1"></i> <span class="fw-medium text-dark">${escapeHtml(l.title)}</span></span>
                                            <span class="badge bg-white text-muted border flex-shrink-0" style="font-size: 10px;">${escapeHtml(l.content_type || 'Video')} &bull; ${escapeHtml(l.duration || '45 Mins')}</span>
                                        </div>
                                    `;
                                }).join('')}
                                ${quizzes.map((q, qIdx) => `
                                    <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                        <span class="text-truncate me-2"><i class="bi bi-question-square me-1" style="color: #7C3AED;"></i> <span class="fw-medium text-dark">${escapeHtml(q.title)}</span></span>
                                        <span class="badge bg-white border flex-shrink-0" style="font-size: 10px; color: #7C3AED;">Quiz &bull; ${(q.questions || []).length} Qs &bull; Pass ${q.passing_score || 70}%</span>
                                    </div>
                                `).join('')}
                                ${assignments.map((a, aIdx) => `
                                    <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                        <span class="text-truncate me-2"><i class="bi bi-journal-check me-1" style="color: #D97706;"></i> <span class="fw-medium text-dark">${escapeHtml(a.title)}</span></span>
                                        <span class="badge bg-white border flex-shrink-0" style="font-size: 10px; color: #D97706;">Assignment &bull; ${a.max_score || 100} Pts${a.due_date ? ` &bull; Due ${a.due_date}` : ''}</span>
                                    </div>
                                `).join('')}
                                ${lessons.length === 0 && quizzes.length === 0 && assignments.length === 0 ? `
                                    <div class="text-muted fst-italic" style="font-size: 11px;">No curriculum items in this module.</div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Step 6 Publish Status Choice
    window.setPublishStatusChoice = function (val) {
        const pubInput = document.getElementById('coursePublishedVal');
        if (pubInput) pubInput.value = val;

        const radioDraft = document.getElementById('statusRadioDraft');
        const radioPublish = document.getElementById('statusRadioPublished');
        const cardDraft = document.getElementById('statusCardDraft');
        const cardPublish = document.getElementById('statusCardPublished');

        if (val === 1) {
            if (radioPublish) radioPublish.checked = true;
            if (cardPublish) cardPublish.classList.add('selected');
            if (cardDraft) cardDraft.classList.remove('selected');
        } else {
            if (radioDraft) radioDraft.checked = true;
            if (cardDraft) cardDraft.classList.add('selected');
            if (cardPublish) cardPublish.classList.remove('selected');
        }
    };

    function setFieldInvalid(fieldId, feedbackId, message) {
        const field = document.getElementById(fieldId);
        const feedback = document.getElementById(feedbackId);
        if (field) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
        }
        if (feedback && message) {
            feedback.textContent = message;
        }
    }

    function setFieldValid(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    }

    // Real-Time Form Validation UX
    function setupCourseFormValidation() {
        const titleInput = document.getElementById('courseTitle');
        if (titleInput) {
            titleInput.addEventListener('input', function () {
                const val = this.value.trim();
                if (!val) {
                    setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title is required.');
                } else if (val.length < 3) {
                    setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title must be at least 3 characters.');
                } else {
                    setFieldValid('courseTitle');
                }
            });
            titleInput.addEventListener('blur', function () {
                const val = this.value.trim();
                if (!val) setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title is required.');
                else if (val.length < 3) setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title must be at least 3 characters.');
                else setFieldValid('courseTitle');
            });
        }

        const descInput = document.getElementById('courseDesc');
        const countSpan = document.getElementById('courseDescCount');
        if (descInput) {
            descInput.addEventListener('input', function () {
                const val = this.value.trim();
                if (countSpan) countSpan.textContent = `${val.length} / 500`;
                if (!val) {
                    setFieldInvalid('courseDesc', 'courseDescFeedback', 'Course Description is required.');
                } else if (val.length < 10) {
                    setFieldInvalid('courseDesc', 'courseDescFeedback', `Course Description must be at least 10 characters (${val.length}/10 entered).`);
                } else {
                    setFieldValid('courseDesc');
                }
            });
            descInput.addEventListener('blur', function () {
                const val = this.value.trim();
                if (!val) setFieldInvalid('courseDesc', 'courseDescFeedback', 'Course Description is required.');
                else if (val.length < 10) setFieldInvalid('courseDesc', 'courseDescFeedback', `Course Description must be at least 10 characters (${val.length}/10 entered).`);
                else setFieldValid('courseDesc');
            });
        }

        const catSelect = document.getElementById('courseCategorySelect');
        if (catSelect) {
            catSelect.addEventListener('change', function () {
                if (!this.value) {
                    setFieldInvalid('courseCategorySelect', 'courseCategoryFeedback', 'Please select a category.');
                } else {
                    setFieldValid('courseCategorySelect');
                }
            });
        }

        const insSelect = document.getElementById('courseInstructorSelect');
        if (insSelect) {
            insSelect.addEventListener('change', function () {
                if (!this.value) {
                    setFieldInvalid('courseInstructorSelect', 'courseInstructorFeedback', 'Please select an instructor.');
                } else {
                    setFieldValid('courseInstructorSelect');
                }
            });
        }

        const priceInput = document.getElementById('coursePrice');
        if (priceInput) {
            priceInput.addEventListener('input', function () {
                const val = parseFloat(this.value);
                if (isNaN(val) || val < 0) {
                    setFieldInvalid('coursePrice', 'coursePriceFeedback', 'Price cannot be negative.');
                } else {
                    setFieldValid('coursePrice');
                }
            });
        }

        ['courseEnrollmentStart', 'courseEnrollmentDeadline', 'courseStartDate', 'courseEndDate'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    validateCourseDates();
                    updateCourseStatusPreview();
                });
            }
        });

        // Stepper buttons
        const continueBtn = document.getElementById('stepperContinueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', function () {
                goToCourseStep(currentCourseStep + 1);
            });
        }

        const backBtn = document.getElementById('stepperBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                goToCourseStep(currentCourseStep - 1);
            });
        }

        const saveDraftBtn = document.getElementById('saveDraftBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', function () {
                submitCourseWithPublishStatus(0);
            });
        }

        const createCourseBtnEl = document.getElementById('createCourseSubmitBtn') || document.getElementById('saveCourseBtn');
        if (createCourseBtnEl) {
            createCourseBtnEl.addEventListener('click', function () {
                const isPub = parseInt(document.getElementById('coursePublishedVal')?.value || '1');
                submitCourseWithPublishStatus(isPub);
            });
        }
    }

    // Media Upload Handlers: Thumbnail & Introduction Video
    function setupMediaUploads() {
        // 1. Thumbnail Upload
        const thumbInput = document.getElementById('courseThumbnailInput');
        const thumbDropzone = document.getElementById('thumbnailDropzone');
        const thumbPreviewBox = document.getElementById('thumbnailPreviewBox');
        const thumbPreviewImg = document.getElementById('thumbnailPreviewImg');
        const thumbFileName = document.getElementById('thumbnailFileName');
        const thumbFileSize = document.getElementById('thumbnailFileSize');
        const replaceThumbBtn = document.getElementById('replaceThumbnailBtn');
        const removeThumbBtn = document.getElementById('removeThumbnailBtn');
        const thumbUrlInput = document.getElementById('courseThumbnailUrl');

        function handleThumbFile(file) {
            if (!file || !file.type.startsWith('image/')) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Image exceeds 5 MB limit', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                if (thumbPreviewImg) thumbPreviewImg.src = e.target.result;
                if (thumbFileName) thumbFileName.textContent = file.name;
                if (thumbFileSize) thumbFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                if (thumbPreviewBox) thumbPreviewBox.style.display = 'flex';
                if (thumbUrlInput) thumbUrlInput.value = `assets/images/courses/${file.name}`;
            };
            reader.readAsDataURL(file);
        }

        if (thumbInput) {
            thumbInput.addEventListener('change', function () {
                if (this.files && this.files[0]) handleThumbFile(this.files[0]);
            });
        }

        if (thumbDropzone) {
            thumbDropzone.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            thumbDropzone.addEventListener('dragleave', function (e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            thumbDropzone.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleThumbFile(e.dataTransfer.files[0]);
                }
            });
        }

        if (replaceThumbBtn && thumbInput) {
            replaceThumbBtn.addEventListener('click', () => thumbInput.click());
        }

        if (removeThumbBtn) {
            removeThumbBtn.addEventListener('click', function () {
                if (thumbInput) thumbInput.value = '';
                if (thumbPreviewBox) thumbPreviewBox.style.display = 'none';
                if (thumbPreviewImg) thumbPreviewImg.src = '';
                if (thumbUrlInput) thumbUrlInput.value = '';
            });
        }

        // 2. Video Upload
        const videoInput = document.getElementById('courseVideoInput');
        const videoDropzone = document.getElementById('videoDropzone');
        const videoPreviewBox = document.getElementById('videoPreviewBox');
        const videoPreviewPlayer = document.getElementById('videoPreviewPlayer');
        const videoFileName = document.getElementById('videoFileName');
        const videoFileSize = document.getElementById('videoFileSize');
        const replaceVideoBtn = document.getElementById('replaceVideoBtn');
        const removeVideoBtn = document.getElementById('removeVideoBtn');
        const videoUrlInput = document.getElementById('courseVideoUrl');

        function handleVideoFile(file) {
            if (!file || !file.type.startsWith('video/')) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Please select a valid video file (MP4, WebM, MOV)', 'error');
                return;
            }
            if (file.size > 100 * 1024 * 1024) {
                if (window.AdminStore) window.AdminStore.constructor.toast('Video exceeds 100 MB limit', 'error');
                return;
            }

            const videoBlobUrl = URL.createObjectURL(file);
            if (videoPreviewPlayer) videoPreviewPlayer.src = videoBlobUrl;
            if (videoFileName) videoFileName.textContent = file.name;
            if (videoFileSize) videoFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
            if (videoPreviewBox) videoPreviewBox.style.display = 'block';
            if (videoUrlInput) videoUrlInput.value = `assets/videos/${file.name}`;
        }

        if (videoInput) {
            videoInput.addEventListener('change', function () {
                if (this.files && this.files[0]) handleVideoFile(this.files[0]);
            });
        }

        if (videoDropzone) {
            videoDropzone.addEventListener('dragover', function (e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            videoDropzone.addEventListener('dragleave', function (e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            videoDropzone.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleVideoFile(e.dataTransfer.files[0]);
                }
            });
        }

        if (replaceVideoBtn && videoInput) {
            replaceVideoBtn.addEventListener('click', () => videoInput.click());
        }

        if (removeVideoBtn) {
            removeVideoBtn.addEventListener('click', function () {
                if (videoInput) videoInput.value = '';
                if (videoPreviewBox) videoPreviewBox.style.display = 'none';
                if (videoPreviewPlayer) videoPreviewPlayer.src = '';
                if (videoUrlInput) videoUrlInput.value = '';
            });
        }
    }

    setupCourseFormValidation();
    setupMediaUploads();

    window.openCreateCourseModal = function () {
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
        
        // Initialize default curriculum structure (2 Modules, with real Lessons, Quiz, and Assignment)
        wizardModules = [
            {
                chapter_num: 1,
                title: 'Module 1 — HTML & CSS Basics',
                duration: '2 Weeks',
                description: 'Core concepts of semantic HTML, page structure, modern CSS styling, and responsive layout foundations.',
                lessons: [
                    { 
                        title: '1.1 Getting Started with HTML5 Structure', 
                        duration: '45 Mins', 
                        description: 'Semantic tags, document hierarchy, and markup best practices.',
                        content_type: 'Video',
                        video_url: 'assets/videos/lesson1.mp4',
                        video_size: '18.4 MB'
                    },
                    { 
                        title: '1.2 Modern CSS Styling & Flexbox', 
                        duration: '50 Mins', 
                        description: 'Responsive container layouts with Flexbox and CSS Grid.',
                        content_type: 'Document',
                        pdf_url: 'assets/docs/css-cheatsheet.pdf',
                        pdf_size: '2.1 MB'
                    }
                ],
                quizzes: [
                    {
                        title: 'Quiz 1 — HTML & CSS Knowledge Check',
                        description: 'Test your understanding of semantic markup and responsive layout rules.',
                        duration_mins: 20,
                        passing_score: 70,
                        questions: [
                            {
                                question: 'Which semantic element should represent independent, self-contained content in HTML5?',
                                option_a: '<section>',
                                option_b: '<article>',
                                option_c: '<div>',
                                option_d: '<aside>',
                                correct_answer: 'B',
                                points: 10
                            },
                            {
                                question: 'What CSS property allows flex items to wrap across multiple lines?',
                                option_a: 'flex-wrap: wrap',
                                option_b: 'flex-direction: column',
                                option_c: 'display: grid',
                                option_d: 'align-items: center',
                                correct_answer: 'A',
                                points: 10
                            }
                        ]
                    }
                ],
                assignments: []
            },
            {
                chapter_num: 2,
                title: 'Module 2 — JavaScript Core & Interactivity',
                duration: '3 Weeks',
                description: 'DOM manipulation, asynchronous JavaScript, event handling, and modern ES6+ features.',
                lessons: [
                    { 
                        title: '2.1 DOM Selection & Event Listeners', 
                        duration: '45 Mins', 
                        description: 'Selecting DOM nodes and responding to user actions.',
                        content_type: 'Video',
                        video_url: 'assets/videos/lesson2.mp4',
                        video_size: '24.1 MB'
                    }
                ],
                quizzes: [],
                assignments: [
                    {
                        title: 'Assignment 1 — Interactive Responsive Layout',
                        instructions: 'Create a responsive 3-section personal portfolio website that adapts cleanly across mobile and desktop viewports.',
                        due_date: '2026-09-30',
                        max_score: 100,
                        attachment_name: 'starter-portfolio.zip',
                        attachment_size: '1.8 MB'
                    }
                ]
            }
        ];
        renderWizardModules();

        // Reset Stepper to Step 1
        completedCourseSteps.clear();
        goToCourseStep(1);

        document.getElementById('courseModalTitle').textContent = 'Add New Specialized Course';
        document.getElementById('coursePrice').value = '0.00';
        document.getElementById('courseDuration').value = '8 Weeks';
        document.getElementById('courseBadge').value = '';
        document.getElementById('coursePrerequisites').value = '';
        
        // Reset thumbnail preview
        const thumbPreviewBox = document.getElementById('thumbnailPreviewBox');
        if (thumbPreviewBox) thumbPreviewBox.style.display = 'none';
        const thumbInput = document.getElementById('courseThumbnailInput');
        if (thumbInput) thumbInput.value = '';
        const thumbUrl = document.getElementById('courseThumbnailUrl');
        if (thumbUrl) thumbUrl.value = 'assets/images/courses/fullstack.jpg';

        // Reset video preview
        const videoPreviewBox = document.getElementById('videoPreviewBox');
        if (videoPreviewBox) videoPreviewBox.style.display = 'none';
        const videoInput = document.getElementById('courseVideoInput');
        if (videoInput) videoInput.value = '';
        const videoUrl = document.getElementById('courseVideoUrl');
        if (videoUrl) videoUrl.value = '';

        // Reset character counter
        const countSpan = document.getElementById('courseDescCount');
        if (countSpan) countSpan.textContent = '0 / 500';

        // Clear validation errors
        ['courseTitle', 'courseCategorySelect', 'courseInstructorSelect', 'courseDesc', 'coursePrice', 'courseEnrollmentDeadline', 'courseStartDate', 'courseEndDate'].forEach(id => {
            setFieldValid(id);
        });
        
        // Default lifecycle dates
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('courseEnrollmentStart').value = today;
        
        setPublishStatusChoice(1);
        populateCourseSelects();
        updateCourseStatusPreview();
        if (courseModal) courseModal.show();
    };

    window.openEditCourseModal = function (id) {
        const c = allCourses.find(course => course.id === id);
        if (!c) return;

        // Load existing curriculum modules, lessons, quizzes, assignments from store into wizardModules
        const existingChapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id) : [];
        if (existingChapters.length > 0) {
            wizardModules = existingChapters.map((ch, idx) => {
                const lessons = window.AdminStore ? window.AdminStore.getLessonsByModuleId(ch.id) : [];
                const quizzes = window.AdminStore ? window.AdminStore.getQuizzesByModuleId(ch.id) : [];
                const assignments = window.AdminStore ? window.AdminStore.getAssignmentsByModuleId(ch.id) : [];
                return {
                    id: ch.id,
                    chapter_num: idx + 1,
                    title: ch.title,
                    duration: ch.duration || '2 Weeks',
                    description: ch.description || '',
                    lessons: lessons.map(l => ({
                        id: l.id,
                        module_id: ch.id,
                        course_id: c.id,
                        title: l.title,
                        duration: l.duration || '45 Mins',
                        description: l.description || '',
                        content_type: l.content_type || (l.video_url ? 'Video' : l.pdf_url ? 'Document' : 'Text'),
                        video_url: l.video_url || '',
                        video_size: l.video_size || '',
                        pdf_url: l.pdf_url || '',
                        pdf_size: l.pdf_size || '',
                        text_content: l.text_content || ''
                    })),
                    quizzes: quizzes.map(q => ({
                        id: q.id,
                        module_id: ch.id,
                        course_id: c.id,
                        title: q.title,
                        description: q.description || '',
                        duration_mins: q.duration_mins || 20,
                        passing_score: q.passing_score || 70,
                        questions: Array.isArray(q.questions) ? q.questions : []
                    })),
                    assignments: assignments.map(a => ({
                        id: a.id,
                        module_id: ch.id,
                        course_id: c.id,
                        title: a.title,
                        instructions: a.instructions || '',
                        due_date: a.due_date ? String(a.due_date).split('T')[0] : '',
                        max_score: a.max_score || 100,
                        attachment_name: a.attachment_name || '',
                        attachment_size: a.attachment_size || ''
                    }))
                };
            });
        } else {
            wizardModules = [
                {
                    chapter_num: 1,
                    title: 'Module 1 — Foundations & Core Principles',
                    duration: '2 Weeks',
                    description: 'Foundational architecture and setup.',
                    lessons: [
                        { title: '1.1 Introduction', duration: '30 Mins', description: 'Overview and setup.', content_type: 'Video', video_url: 'assets/videos/lesson1.mp4' },
                        { title: '1.2 Core Principles', duration: '45 Mins', description: 'Foundational concepts.', content_type: 'Document', pdf_url: 'assets/docs/cheatsheet.pdf' }
                    ],
                    quizzes: [],
                    assignments: []
                }
            ];
        }
        renderWizardModules();

        // Reset Stepper to Step 1 and prefill
        completedCourseSteps.clear();
        completedCourseSteps.add(1);
        completedCourseSteps.add(2);
        completedCourseSteps.add(3);
        completedCourseSteps.add(4);
        completedCourseSteps.add(5);
        goToCourseStep(1);

        populateCourseSelects();
        document.getElementById('courseId').value = c.id;
        document.getElementById('courseTitle').value = c.title;
        document.getElementById('courseDifficulty').value = c.difficulty || 'Beginner';
        document.getElementById('courseCategorySelect').value = c.category_id || (allCategories[0] ? allCategories[0].id : 1);
        document.getElementById('courseInstructorSelect').value = c.instructor_id || (allInstructors[0] ? allInstructors[0].id : 1);
        document.getElementById('courseDuration').value = c.duration || c.duration_hours || '8 Weeks';
        document.getElementById('coursePrice').value = c.price !== undefined ? parseFloat(c.price).toFixed(2) : '0.00';
        document.getElementById('courseBadge').value = c.badge || c.badge_text || '';
        document.getElementById('coursePrerequisites').value = c.prerequisites || '';
        document.getElementById('courseEnrollmentStart').value = c.enrollment_start_date ? String(c.enrollment_start_date).split('T')[0] : '';
        document.getElementById('courseEnrollmentDeadline').value = c.enrollment_deadline ? String(c.enrollment_deadline).split('T')[0] : '';
        document.getElementById('courseStartDate').value = c.start_date ? String(c.start_date).split('T')[0] : '';
        document.getElementById('courseEndDate').value = c.end_date ? String(c.end_date).split('T')[0] : '';
        document.getElementById('courseDesc').value = c.description || '';
        
        // Character counter
        const countSpan = document.getElementById('courseDescCount');
        if (countSpan) countSpan.textContent = `${(c.description || '').length} / 500`;

        // Thumbnail preview
        const thumbPreviewBox = document.getElementById('thumbnailPreviewBox');
        const thumbPreviewImg = document.getElementById('thumbnailPreviewImg');
        const thumbUrl = document.getElementById('courseThumbnailUrl');
        if (c.thumbnail_url) {
            if (thumbUrl) thumbUrl.value = c.thumbnail_url;
            if (thumbPreviewImg) thumbPreviewImg.src = `../../${c.thumbnail_url}`;
            if (thumbPreviewBox) thumbPreviewBox.style.display = 'flex';
        } else {
            if (thumbPreviewBox) thumbPreviewBox.style.display = 'none';
        }

        // Video preview
        const videoPreviewBox = document.getElementById('videoPreviewBox');
        const videoUrl = document.getElementById('courseVideoUrl');
        if (c.video_url) {
            if (videoUrl) videoUrl.value = c.video_url;
            if (videoPreviewBox) videoPreviewBox.style.display = 'block';
        } else {
            if (videoPreviewBox) videoPreviewBox.style.display = 'none';
        }

        const isPub = (c.is_published === 1 || c.is_published === true) ? 1 : 0;
        setPublishStatusChoice(isPub);
        document.getElementById('courseModalTitle').textContent = 'Edit Specialized Course';

        // Clear validation errors
        ['courseTitle', 'courseCategorySelect', 'courseInstructorSelect', 'courseDesc', 'coursePrice', 'courseEnrollmentDeadline', 'courseStartDate', 'courseEndDate'].forEach(id => {
            setFieldValid(id);
        });

        updateCourseStatusPreview();
        if (courseModal) courseModal.show();
    };

    function populateCourseSelects() {
        const catSelect = document.getElementById('courseCategorySelect');
        if (catSelect) {
            const currentVal = catSelect.value;
            catSelect.innerHTML = `<option value="">-- Select Category / Discipline --</option>` + allCategories.map(cat => `
                <option value="${cat.id}">${escapeHtml(cat.name)}</option>
            `).join('');
            if (currentVal) catSelect.value = currentVal;
        }

        const insSelect = document.getElementById('courseInstructorSelect');
        if (insSelect) {
            const currentVal = insSelect.value;
            insSelect.innerHTML = `<option value="">-- Select Assigned Instructor --</option>` + allInstructors.map(ins => `
                <option value="${ins.id}">${escapeHtml(ins.name)} (${escapeHtml(ins.title || 'Faculty Lead')})</option>
            `).join('');
            if (currentVal) insSelect.value = currentVal;
        }
    }

    // Submit Course Payload (Draft or Published) with Modules, Lessons, Quizzes, Assignments
    async function submitCourseWithPublishStatus(isPublished) {
        // Validate all 5 prior steps
        for (let s = 1; s <= 5; s++) {
            const { isValid, firstInvalidEl } = validateCourseStep(s);
            if (!isValid) {
                goToCourseStep(s);
                if (firstInvalidEl) {
                    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidEl.focus();
                }
                if (window.AdminStore) window.AdminStore.constructor.toast(`Please correct the highlighted items in Step ${s}.`, 'error');
                return;
            }
        }

        const id = document.getElementById('courseId').value;
        const title = document.getElementById('courseTitle').value.trim();
        const thumbUrlVal = document.getElementById('courseThumbnailUrl')?.value.trim() || 'assets/images/courses/fullstack.jpg';
        const videoUrlVal = document.getElementById('courseVideoUrl')?.value.trim() || '';

        const totalModules = wizardModules.length;
        const totalLessons = wizardModules.reduce((acc, m) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0);
        const totalQuizzes = wizardModules.reduce((acc, m) => acc + (Array.isArray(m.quizzes) ? m.quizzes.length : 0), 0);
        const totalAssignments = wizardModules.reduce((acc, m) => acc + (Array.isArray(m.assignments) ? m.assignments.length : 0), 0);

        const payload = {
            title: title,
            category_id: parseInt(document.getElementById('courseCategorySelect').value) || 1,
            instructor_id: parseInt(document.getElementById('courseInstructorSelect').value) || 1,
            difficulty: document.getElementById('courseDifficulty').value,
            duration: document.getElementById('courseDuration').value.trim() || '8 Weeks',
            duration_hours: document.getElementById('courseDuration').value.trim() || '8 Weeks',
            module_count: totalModules,
            lesson_count: totalLessons,
            quiz_count: totalQuizzes,
            assignment_count: totalAssignments,
            price: parseFloat(document.getElementById('coursePrice').value) || 0.00,
            badge: document.getElementById('courseBadge').value.trim(),
            badge_text: document.getElementById('courseBadge').value.trim(),
            prerequisites: document.getElementById('coursePrerequisites').value.trim(),
            thumbnail_url: thumbUrlVal,
            video_url: videoUrlVal,
            enrollment_start_date: document.getElementById('courseEnrollmentStart').value || null,
            enrollment_deadline: document.getElementById('courseEnrollmentDeadline').value || null,
            start_date: document.getElementById('courseStartDate').value || null,
            end_date: document.getElementById('courseEndDate').value || null,
            description: document.getElementById('courseDesc').value.trim(),
            is_published: isPublished,
            modules: wizardModules
        };

        const createCourseBtnEl = document.getElementById('createCourseSubmitBtn') || document.getElementById('saveCourseBtn');
        const saveDraftBtnEl = document.getElementById('saveDraftBtn');
        const isEditing = Boolean(id);

        if (createCourseBtnEl) createCourseBtnEl.disabled = true;
        if (saveDraftBtnEl) saveDraftBtnEl.disabled = true;

        if (isPublished) {
            if (createCourseBtnEl) {
                createCourseBtnEl.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> ${isEditing ? 'Saving...' : 'Creating Course...'}`;
            }
        } else {
            if (saveDraftBtnEl) {
                saveDraftBtnEl.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving Draft...`;
            }
        }

        let apiSuccess = false;
        try {
            const url = id ? `${API_BASE}/admin/courses/${id}` : `${API_BASE}/admin/courses`;
            const method = id ? 'PUT' : 'POST';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const res = await fetch(url, { 
                method, 
                headers: getHeaders(), 
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res.ok) apiSuccess = true;
        } catch (netErr) {
            // Backend offline or timeout: gracefully continue with local storage save
            apiSuccess = false;
        }

        // Local Storage / AdminStore Persistence (Offline-First Guarantee)
        try {
            if (id) {
                if (window.AdminStore) {
                    window.AdminStore.updateCourse(id, payload);
                    allCourses = window.AdminStore.getCourses();
                }
                if (courseModal) courseModal.hide();
                applyCourseFilters();
                if (window.AdminStore) {
                    const statusText = isPublished ? 'published to student catalog' : 'saved as private draft';
                    const noticeSuffix = apiSuccess ? '' : ' (saved locally for demo)';
                    window.AdminStore.constructor.notifySuccess('Course Updated', `"${title}" has been updated with ${totalModules} modules, ${totalLessons} lessons, ${totalQuizzes} quizzes, and ${totalAssignments} assignments, and ${statusText}${noticeSuffix}.`);
                }
            } else {
                if (window.AdminStore) {
                    const newCourse = window.AdminStore.createCourse(payload);
                    allCourses = window.AdminStore.getCourses();
                }
                if (courseModal) courseModal.hide();
                applyCourseFilters();
                if (window.AdminStore) {
                    const statusText = isPublished ? 'published to student catalog' : 'saved as draft';
                    const noticeSuffix = apiSuccess ? '' : ' (saved locally for demo)';
                    window.AdminStore.constructor.notifySuccess('Course Created Successfully', `"${title}" has been created with ${totalModules} modules, ${totalLessons} lessons, ${totalQuizzes} quizzes, and ${totalAssignments} assignments, and ${statusText}${noticeSuffix}.`);
                }
            }
        } catch (err) {
            if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to Save Course', err.message);
        } finally {
            if (createCourseBtnEl) {
                createCourseBtnEl.disabled = false;
                createCourseBtnEl.innerHTML = isEditing 
                    ? `<i class="bi bi-check-circle me-1"></i> Save Changes` 
                    : `<i class="bi bi-plus-circle me-1"></i> Create Course`;
            }
            if (saveDraftBtnEl) {
                saveDraftBtnEl.disabled = false;
                saveDraftBtnEl.innerHTML = `<i class="bi bi-save me-1"></i> Save as Draft`;
            }
        }
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
                `Are you sure you want to delete "${name}" and all its syllabus modules & lessons?`,
                'Yes, Delete Course',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Are you sure you want to delete "${name}"?`);
        }

        if (!confirmed) return;

        try {
            if (window.AdminStore) {
                window.AdminStore.deleteCourse(id);
                allCourses = window.AdminStore.getCourses();
            }

            const res = await fetch(`${API_BASE}/admin/courses/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.message) {
                    throw new Error(errData.message);
                }
            }

            applyCourseFilters();
            if (window.AdminStore) {
                window.AdminStore.constructor.toast(`Course "${name}" deleted`, 'success');
            }
        } catch (err) {
            if (window.AdminStore) {
                window.AdminStore.constructor.notifyError('Action Prohibited', err.message || 'Cannot delete course with active enrollments.');
            } else {
                alert(err.message || 'Cannot delete course.');
            }
            loadCourses();
        }
    };

    // ==========================================================================
    // 3. COURSE CONTENT BUILDER (Interactive Visual Syllabus Hierarchy)
    // Synchronized with AdminMockStore Chapters & Lessons
    // ==========================================================================
    window.openCourseContentBuilder = function (courseId) {
        activeBuilderCourseId = courseId;
        const course = allCourses.find(c => c.id === courseId);
        if (!course) return;

        activeBuilderCourse = course;
        const titleEl = document.getElementById('builderCourseTitle');
        const catEl = document.getElementById('builderCourseCategory');
        if (titleEl) titleEl.textContent = `Course Content: ${course.title}`;
        if (catEl) catEl.textContent = course.category_name || 'Academic';

        renderCourseContentTree(courseId);
        if (contentBuilderModal) contentBuilderModal.show();
    };

    function renderCourseContentTree(courseId) {
        const container = document.getElementById('courseContentTreeContainer');
        const statsBadge = document.getElementById('builderStatsBadge');
        if (!container) return;

        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(courseId) : [];
        const allCourseLessons = window.AdminStore ? window.AdminStore.getAllLessonsByCourseId(courseId) : [];

        if (statsBadge) {
            statsBadge.textContent = `${chapters.length} Modules \u2022 ${allCourseLessons.length} Lessons`;
        }

        if (chapters.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 bg-white rounded-3 border">
                    <i class="bi bi-diagram-3 fs-1 text-muted opacity-50 d-block mb-2"></i>
                    <h6 class="fw-bold text-dark">No Curriculum Modules Added</h6>
                    <p class="text-muted small mb-3">Begin structuring this course by adding the first chapter or module.</p>
                    <button class="btn btn-sm btn-primary" onclick="openAddModuleModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add First Module
                    </button>
                </div>
            `;
            return;
        }

        let html = '';

        // 1. Modules & Lessons Accordion
        html += chapters.map((ch, idx) => {
            const lessons = window.AdminStore ? window.AdminStore.getLessonsByModuleId(ch.id) : [];

            return `
                <div class="module-tree-card">
                    <div class="module-tree-header">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-primary px-2 py-1" style="font-size: 11px;">Module ${ch.chapter_num || (idx + 1)}</span>
                            <span class="fw-bold text-dark" style="font-size: 13.5px;">${escapeHtml(ch.title)}</span>
                            <span class="text-muted small">(${escapeHtml(ch.duration || '2 Weeks')})</span>
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style="font-size: 10.5px;">${lessons.length} ${lessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11px;" onclick="openAddLessonModal(${ch.id})" title="Add Lesson to this Module">
                                <i class="bi bi-plus-circle me-1"></i> Add Lesson
                            </button>
                            <button class="btn btn-sm btn-light border py-0 px-2" style="font-size: 11px;" onclick="openEditModuleModal(${ch.id})" title="Edit Module">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-light border text-danger py-0 px-2" style="font-size: 11px;" onclick="deleteModule(${ch.id})" title="Delete Module">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="lesson-tree-body">
                        ${lessons.length === 0 ? `
                            <div class="p-3 text-center text-muted small bg-light">
                                No lessons created in this module yet. <a href="javascript:void(0)" class="fw-semibold text-primary" onclick="openAddLessonModal(${ch.id})">+ Add First Lesson</a>
                            </div>
                        ` : lessons.map(l => `
                            <div class="lesson-tree-item">
                                <div class="flex-grow-1 min-w-0">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi bi-file-earmark-play text-primary"></i>
                                        <span class="fw-semibold text-dark" style="font-size: 13px;">${escapeHtml(l.title)}</span>
                                        <span class="text-muted" style="font-size: 11px;">&bull; ${escapeHtml(l.duration || '45 Mins')}</span>
                                    </div>
                                    ${l.description ? `<div class="text-muted mt-1" style="font-size: 11.5px;">${escapeHtml(l.description)}</div>` : ''}
                                    
                                    <!-- Resource Badges -->
                                    <div class="mt-2 d-flex flex-wrap">
                                        ${l.video_url ? `
                                            <span class="resource-pill video" title="Attached Streaming Video">
                                                <i class="bi bi-camera-video"></i> ${escapeHtml(l.video_url.split('/').pop() || 'video.mp4')} ${l.video_size ? `(${l.video_size})` : ''}
                                            </span>
                                        ` : ''}
                                        ${l.pdf_url ? `
                                            <span class="resource-pill pdf" title="Attached Learning Material">
                                                <i class="bi bi-file-earmark-pdf"></i> ${escapeHtml(l.pdf_url.split('/').pop() || 'document.pdf')} ${l.pdf_size ? `(${l.pdf_size})` : ''}
                                            </span>
                                        ` : ''}
                                        <button class="btn btn-link text-primary p-0 ms-1 align-middle" style="font-size: 11px; text-decoration: none;" onclick="openEditLessonModal(${l.id})" title="Attach Additional Materials">
                                            <i class="bi bi-paperclip"></i> + Add Material
                                        </button>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                    <button class="action-btn" title="Edit Lesson" onclick="openEditLessonModal(${l.id})">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="action-btn delete" title="Delete Lesson" onclick="deleteLesson(${l.id})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // 2. Quizzes & Tests Hierarchy Section
        html += `
            <div class="module-tree-card mt-3">
                <div class="module-tree-header bg-white">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-purple bg-opacity-10 text-purple border px-2 py-1" style="font-size: 11px; color: #7C3AED; background-color: #F5F3FF; border-color: #DDD6FE;">Assessment</span>
                        <span class="fw-bold text-dark" style="font-size: 13.5px;"><i class="bi bi-clipboard-check text-primary me-1"></i> Course Quizzes &amp; QCM Knowledge Checks</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11px;" onclick="openAddQuizModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add Quiz
                    </button>
                </div>
                <div class="p-3 bg-white">
                    <div class="p-3 bg-light rounded-2 border mb-2">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="fw-bold text-dark mb-1" style="font-size: 13px;">Module 1 Knowledge Check (QCM)</h6>
                                <div class="text-muted" style="font-size: 11px;"><i class="bi bi-clock me-1"></i> 20 Minutes &bull; Passing Score: 70% &bull; 4 Options Single Choice</div>
                            </div>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Active</span>
                        </div>
                        <div class="p-2 bg-white rounded border">
                            <div class="fw-semibold text-dark small mb-1">Q1: Which HTML5 tag is used to specify a section of navigation links?</div>
                            <div class="row g-1 small text-muted">
                                <div class="col-6"><span class="qcm-option-badge">A</span> &lt;navigation&gt;</div>
                                <div class="col-6"><span class="qcm-option-badge correct"><i class="bi bi-check"></i></span> &lt;nav&gt; (Correct)</div>
                                <div class="col-6"><span class="qcm-option-badge">C</span> &lt;navigate&gt;</div>
                                <div class="col-6"><span class="qcm-option-badge">D</span> &lt;links&gt;</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 3. Coursework & Assignments Hierarchy Section
        html += `
            <div class="module-tree-card mt-3">
                <div class="module-tree-header bg-white">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-warning bg-opacity-10 text-dark border border-warning px-2 py-1" style="font-size: 11px;">Coursework</span>
                        <span class="fw-bold text-dark" style="font-size: 13.5px;"><i class="bi bi-journal-text text-warning me-1"></i> Course Assignments &amp; Project Submissions</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11px;" onclick="openAddAssignmentModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add Assignment
                    </button>
                </div>
                <div class="p-3 bg-white">
                    <div class="p-3 bg-light rounded-2 border d-flex align-items-center justify-content-between">
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 13px;">Final Project — Applied Academic Implementation</div>
                            <div class="text-muted" style="font-size: 11px;">
                                <i class="bi bi-award me-1"></i> Total Points: 100 &bull; 
                                <i class="bi bi-calendar3 ms-2 me-1"></i> Due in 4 Weeks &bull; 
                                <span class="resource-pill doc ms-2"><i class="bi bi-file-earmark-zip"></i> starter-project.zip (2.8 MB)</span>
                            </div>
                        </div>
                        <span class="badge bg-primary bg-opacity-10 text-primary">Active</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Module CRUD Handlers in Content Builder
    window.openAddModuleModal = function () {
        const form = document.getElementById('moduleEditorForm');
        if (form) form.reset();
        document.getElementById('moduleEditorId').value = '';
        document.getElementById('moduleEditorCourseId').value = activeBuilderCourseId;
        
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(activeBuilderCourseId) : [];
        document.getElementById('moduleEditorOrder').value = chapters.length + 1;
        document.getElementById('moduleEditorTitle').textContent = 'Add New Module';
        
        if (moduleEditorModal) moduleEditorModal.show();
    };

    window.openEditModuleModal = function (moduleId) {
        if (!window.AdminStore) return;
        const ch = window.AdminStore.state.chapters.find(c => c.id === moduleId);
        if (!ch) return;

        document.getElementById('moduleEditorId').value = ch.id;
        document.getElementById('moduleEditorCourseId').value = ch.course_id;
        document.getElementById('moduleEditorTitleInput').value = ch.title;
        document.getElementById('moduleEditorOrder').value = ch.chapter_num;
        document.getElementById('moduleEditorDuration').value = ch.duration || '2 Weeks';
        document.getElementById('moduleEditorDesc').value = ch.description || '';
        document.getElementById('moduleEditorTitle').textContent = 'Edit Module';

        if (moduleEditorModal) moduleEditorModal.show();
    };

    const moduleEditorForm = document.getElementById('moduleEditorForm');
    if (moduleEditorForm) {
        moduleEditorForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('moduleEditorId').value;
            const courseId = parseInt(document.getElementById('moduleEditorCourseId').value) || activeBuilderCourseId;
            const title = document.getElementById('moduleEditorTitleInput').value.trim();

            const payload = {
                course_id: courseId,
                chapter_num: parseInt(document.getElementById('moduleEditorOrder').value) || 1,
                title: title,
                duration: document.getElementById('moduleEditorDuration').value.trim(),
                description: document.getElementById('moduleEditorDesc').value.trim(),
                lesson_count: 3
            };

            if (id) {
                if (window.AdminStore) window.AdminStore.updateChapter(id, payload);
                if (window.AdminStore) window.AdminStore.constructor.toast('Module updated successfully', 'success');
            } else {
                if (window.AdminStore) window.AdminStore.createChapter(payload);
                if (window.AdminStore) window.AdminStore.constructor.toast('Module added to syllabus', 'success');
            }

            if (moduleEditorModal) moduleEditorModal.hide();
            renderCourseContentTree(courseId);
            allCourses = window.AdminStore ? window.AdminStore.getCourses() : allCourses;
            applyCourseFilters();

            try {
                const url = id ? `${API_BASE}/admin/chapters/${id}` : `${API_BASE}/admin/chapters`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {}
        });
    }

    window.deleteModule = async function (moduleId) {
        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog('Delete Module?', 'Are you sure you want to delete this module and its lessons?', 'Yes, Delete', '#DC2626');
        } else {
            confirmed = confirm('Are you sure you want to delete this module?');
        }
        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteChapter(moduleId);
            window.AdminStore.constructor.toast('Module deleted', 'success');
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }

        try {
            await fetch(`${API_BASE}/admin/chapters/${moduleId}`, { method: 'DELETE', headers: getHeaders() });
        } catch (err) {}
    };

    // Lesson CRUD Handlers with Video & Material Previews in Content Builder
    window.openAddLessonModal = function (moduleId) {
        const form = document.getElementById('lessonEditorForm');
        if (form) form.reset();
        document.getElementById('lessonEditorId').value = '';
        document.getElementById('lessonEditorModuleId').value = moduleId;
        document.getElementById('lessonEditorCourseId').value = activeBuilderCourseId;
        document.getElementById('lessonEditorTitle').textContent = 'Add Lesson & Learning Materials';
        document.getElementById('lessonEditorDuration').value = '45 Mins';

        // Reset previews
        const vidPreview = document.getElementById('videoPreviewContainer');
        if (vidPreview) vidPreview.style.display = 'none';
        const matPreview = document.getElementById('materialPreviewContainer');
        if (matPreview) matPreview.style.display = 'none';

        if (lessonEditorModal) lessonEditorModal.show();
    };

    window.openEditLessonModal = function (lessonId) {
        let les = null;
        if (window.AdminStore && window.AdminStore.state.lessons) {
            les = window.AdminStore.state.lessons.find(l => l.id === lessonId);
        }
        
        document.getElementById('lessonEditorId').value = lessonId;
        document.getElementById('lessonEditorModuleId').value = les ? les.module_id : '';
        document.getElementById('lessonEditorCourseId').value = activeBuilderCourseId;
        document.getElementById('lessonEditorTitleInput').value = les ? les.title : `Lesson ${lessonId}`;
        document.getElementById('lessonEditorDuration').value = les ? (les.duration || '45 Mins') : '45 Mins';
        document.getElementById('lessonEditorDesc').value = les ? (les.description || '') : '';
        document.getElementById('lessonEditorTitle').textContent = 'Edit Lesson & Materials';

        const vidPreview = document.getElementById('videoPreviewContainer');
        if (vidPreview) vidPreview.style.display = (les && les.video_url) ? 'block' : 'none';

        const matPreview = document.getElementById('materialPreviewContainer');
        if (matPreview) matPreview.style.display = (les && les.pdf_url) ? 'flex' : 'none';

        if (lessonEditorModal) lessonEditorModal.show();
    };

    // Lesson Video & Material file listeners
    const lessonVideoInput = document.getElementById('lessonVideoInput');
    const lessonVideoDropzone = document.getElementById('lessonVideoDropzone');
    const replaceLessonVideoBtn = document.getElementById('replaceLessonVideoBtn');

    function handleLessonVideo(file) {
        if (!file || !file.type.startsWith('video/')) {
            if (window.AdminStore) window.AdminStore.constructor.toast('Please select a valid video file (MP4, WebM, MOV)', 'error');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            if (window.AdminStore) window.AdminStore.constructor.toast('Video exceeds 100 MB limit', 'error');
            return;
        }

        const previewContainer = document.getElementById('videoPreviewContainer');
        const player = document.getElementById('videoPreviewPlayer');
        const info = document.getElementById('videoFileInfo');
        
        if (player) player.src = URL.createObjectURL(file);
        if (info) info.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
        if (previewContainer) previewContainer.style.display = 'block';
    }

    if (lessonVideoInput) {
        lessonVideoInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                handleLessonVideo(this.files[0]);
            }
        });
    }

    if (replaceLessonVideoBtn && lessonVideoInput) {
        replaceLessonVideoBtn.addEventListener('click', () => lessonVideoInput.click());
    }

    if (lessonVideoDropzone) {
        lessonVideoDropzone.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        lessonVideoDropzone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        lessonVideoDropzone.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleLessonVideo(e.dataTransfer.files[0]);
            }
        });
    }

    const removeVideoBtn = document.getElementById('removeVideoBtn');
    if (removeVideoBtn) {
        removeVideoBtn.addEventListener('click', function () {
            if (lessonVideoInput) lessonVideoInput.value = '';
            const previewContainer = document.getElementById('videoPreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
        });
    }

    const lessonMaterialInput = document.getElementById('lessonMaterialInput');
    if (lessonMaterialInput) {
        lessonMaterialInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const previewContainer = document.getElementById('materialPreviewContainer');
                const nameEl = document.getElementById('materialFileName');
                const sizeEl = document.getElementById('materialFileSize');
                
                if (nameEl) nameEl.textContent = file.name;
                if (sizeEl) sizeEl.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
                if (previewContainer) previewContainer.style.display = 'flex';
            }
        });
    }

    const removeMaterialBtn = document.getElementById('removeMaterialBtn');
    if (removeMaterialBtn) {
        removeMaterialBtn.addEventListener('click', function () {
            if (lessonMaterialInput) lessonMaterialInput.value = '';
            const previewContainer = document.getElementById('materialPreviewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
        });
    }

    const lessonEditorForm = document.getElementById('lessonEditorForm');
    if (lessonEditorForm) {
        lessonEditorForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('lessonEditorId').value;
            const moduleId = parseInt(document.getElementById('lessonEditorModuleId').value);
            const title = document.getElementById('lessonEditorTitleInput').value.trim();
            const duration = document.getElementById('lessonEditorDuration').value.trim() || '45 Mins';
            const desc = document.getElementById('lessonEditorDesc').value.trim();
            const videoUrl = document.getElementById('lessonVideoUrl')?.value.trim() || '';

            const payload = {
                module_id: moduleId,
                course_id: activeBuilderCourseId,
                title: title,
                duration: duration,
                description: desc,
                video_url: videoUrl
            };

            if (id && window.AdminStore) {
                window.AdminStore.updateLesson(parseInt(id), payload);
            } else if (window.AdminStore) {
                window.AdminStore.createLesson(payload);
            }

            if (window.AdminStore) window.AdminStore.constructor.toast(`Lesson "${title}" saved`, 'success');
            if (lessonEditorModal) lessonEditorModal.hide();
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore ? window.AdminStore.getCourses() : allCourses;
            applyCourseFilters();
        });
    }

    window.deleteLesson = function (lessonId) {
        if (window.AdminStore) {
            window.AdminStore.deleteLesson(lessonId);
            window.AdminStore.constructor.toast('Lesson removed from module', 'info');
        }
        renderCourseContentTree(activeBuilderCourseId);
        allCourses = window.AdminStore ? window.AdminStore.getCourses() : allCourses;
        applyCourseFilters();
    };

    // Quiz & Assignment Handlers
    window.openAddQuizModal = function () {
        const form = document.getElementById('quizEditorForm');
        if (form) form.reset();
        document.getElementById('quizEditorCourseId').value = activeBuilderCourseId;
        if (quizEditorModal) quizEditorModal.show();
    };

    const quizEditorForm = document.getElementById('quizEditorForm');
    if (quizEditorForm) {
        quizEditorForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('quizEditorTitleInput').value.trim();
            if (window.AdminStore) window.AdminStore.constructor.toast(`Quiz "${title}" created with QCM questions`, 'success');
            if (quizEditorModal) quizEditorModal.hide();
            renderCourseContentTree(activeBuilderCourseId);
        });
    }

    window.openAddAssignmentModal = function () {
        const form = document.getElementById('assignmentEditorForm');
        if (form) form.reset();
        document.getElementById('assignmentEditorCourseId').value = activeBuilderCourseId;
        const prev = document.getElementById('assignmentPreviewContainer');
        if (prev) prev.style.display = 'none';
        if (assignmentEditorModal) assignmentEditorModal.show();
    };

    const assignmentFileInput = document.getElementById('assignmentFileInput');
    if (assignmentFileInput) {
        assignmentFileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const preview = document.getElementById('assignmentPreviewContainer');
                const nameEl = document.getElementById('assignmentFileName');
                const sizeEl = document.getElementById('assignmentFileSize');
                if (nameEl) nameEl.textContent = file.name;
                if (sizeEl) sizeEl.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
                if (preview) preview.style.display = 'flex';
            }
        });
    }

    const removeAssignmentBtn = document.getElementById('removeAssignmentBtn');
    if (removeAssignmentBtn) {
        removeAssignmentBtn.addEventListener('click', function () {
            if (assignmentFileInput) assignmentFileInput.value = '';
            const preview = document.getElementById('assignmentPreviewContainer');
            if (preview) preview.style.display = 'none';
        });
    }

    const assignmentEditorForm = document.getElementById('assignmentEditorForm');
    if (assignmentEditorForm) {
        assignmentEditorForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('assignmentEditorTitleInput').value.trim();
            if (window.AdminStore) window.AdminStore.constructor.toast(`Assignment "${title}" created successfully`, 'success');
            if (assignmentEditorModal) assignmentEditorModal.hide();
            renderCourseContentTree(activeBuilderCourseId);
        });
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
        populateCourseSelects();
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
        
        // Dynamic slug auto-population
        const nameInput = document.getElementById('categoryName');
        const slugInput = document.getElementById('categorySlug');
        if (nameInput && slugInput) {
            nameInput.oninput = function() {
                slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            };
        }

        if (categoryModal) categoryModal.show();
    };

    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('categoryName').value.trim();
            const slug = document.getElementById('categorySlug').value.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const id = document.getElementById('categoryId')?.value;

            if (!name) {
                setFieldInvalid('categoryName', 'catNameFeedback', 'Category Name is required.');
                return;
            }

            // Duplicate name or slug check
            const duplicate = allCategories.find(c => (!id || c.id !== Number(id)) && (c.name.toLowerCase() === name.toLowerCase() || c.slug.toLowerCase() === slug.toLowerCase()));
            if (duplicate) {
                if (duplicate.name.toLowerCase() === name.toLowerCase()) {
                    setFieldInvalid('categoryName', 'catNameFeedback', `Category "${name}" already exists.`);
                } else {
                    setFieldInvalid('categorySlug', 'catSlugFeedback', `Category slug "${slug}" already exists.`);
                }
                if (window.AdminStore) window.AdminStore.constructor.toast('Duplicate category detected.', 'error');
                return;
            }

            const payload = {
                name: name,
                slug: slug,
                icon: document.getElementById('categoryIcon').value.trim() || 'bi-laptop',
                order_num: parseInt(document.getElementById('categoryOrder').value) || 1,
                status: document.getElementById('categoryStatus')?.value || 'Active'
            };

            const saveBtn = document.getElementById('saveCategoryBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
            }

            try {
                if (id) {
                    if (window.AdminStore) {
                        window.AdminStore.updateCategory(id, payload);
                        allCategories = window.AdminStore.getCategories();
                    }
                    if (categoryModal) categoryModal.hide();
                    renderCategoriesTable(allCategories);
                    populateCategoryFilterOptions();
                    populateCourseSelects();
                    if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Category Updated', `"${name}" has been updated.`);
                } else {
                    if (window.AdminStore) {
                        window.AdminStore.createCategory(payload);
                        allCategories = window.AdminStore.getCategories();
                    }
                    if (categoryModal) categoryModal.hide();
                    renderCategoriesTable(allCategories);
                    populateCategoryFilterOptions();
                    populateCourseSelects();
                    if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Category Created', `"${name}" added to academic disciplines.`);
                }

                const url = id ? `${API_BASE}/admin/categories/${id}` : `${API_BASE}/admin/categories`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {
                if (window.AdminStore) {
                    window.AdminStore.constructor.notifyError('Failed to Save Category', err.message);
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Category`;
                }
            }
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

        try {
            if (window.AdminStore) {
                window.AdminStore.deleteCategory(id);
                allCategories = window.AdminStore.getCategories();
            }

            const res = await fetch(`${API_BASE}/admin/categories/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.message) {
                    throw new Error(errData.message);
                }
            }

            renderCategoriesTable(allCategories);
            populateCategoryFilterOptions();

            if (window.AdminStore) {
                window.AdminStore.constructor.toast(`Category "${name}" deleted`, 'success');
            }
        } catch (err) {
            if (window.AdminStore) {
                window.AdminStore.constructor.notifyError('Action Prohibited', err.message || 'Cannot delete category: assigned to courses.');
            } else {
                alert(err.message || 'Cannot delete category.');
            }
            loadCategories();
        }
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
        populateCourseSelects();
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
        const form = document.getElementById('instructorForm');
        if (form) form.reset();
        document.getElementById('instructorId').value = '';
        document.getElementById('instructorUserId').value = '';
        document.getElementById('instructorModalTitle').textContent = 'Add New Instructor';

        // Populate faculty user accounts dropdown
        const userSelect = document.getElementById('instructorUserSelect');
        if (userSelect && window.AdminStore) {
            const teachers = window.AdminStore.getUsers().filter(u => u.role === 'TEACHER');
            userSelect.innerHTML = `<option value="">-- Create or Enter Details Manually --</option>` + teachers.map(t => `
                <option value="${t.id}" data-name="${escapeHtml(t.full_name)}" data-email="${escapeHtml(t.email)}" data-avatar="${escapeHtml(t.avatar_url || '')}">
                    ${escapeHtml(t.full_name)} (${escapeHtml(t.university_id || t.email)})
                </option>
            `).join('');

            userSelect.onchange = function () {
                const selectedOpt = userSelect.options[userSelect.selectedIndex];
                if (selectedOpt && selectedOpt.value) {
                    document.getElementById('instructorUserId').value = selectedOpt.value;
                    document.getElementById('instructorName').value = selectedOpt.getAttribute('data-name') || '';
                    document.getElementById('instructorEmail').value = selectedOpt.getAttribute('data-email') || '';
                    document.getElementById('instructorTitle').value = 'Faculty Instructor';
                } else {
                    document.getElementById('instructorUserId').value = '';
                }
            };
        }

        if (instructorModal) instructorModal.show();
    };

    const instructorForm = document.getElementById('instructorForm');
    if (instructorForm) {
        instructorForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('instructorName').value.trim();
            const email = document.getElementById('instructorEmail').value.trim();
            const id = document.getElementById('instructorId')?.value;
            const userId = parseInt(document.getElementById('instructorUserId')?.value) || null;

            if (!name || name.length < 2) {
                setFieldInvalid('instructorName', 'instNameFeedback', 'Instructor Name is required (min 2 chars).');
                return;
            }

            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    setFieldInvalid('instructorEmail', 'instEmailFeedback', 'Please enter a valid email address (e.g. name@aub.edu.kh).');
                    return;
                } else {
                    setFieldValid('instructorEmail');
                }
            }

            const payload = {
                user_id: userId,
                name: name,
                title: document.getElementById('instructorTitle').value.trim() || 'Lecturer',
                email: email,
                phone: document.getElementById('instructorPhone')?.value.trim() || '',
                department: document.getElementById('instructorDepartment')?.value.trim() || 'Information Technology',
                faculty: document.getElementById('instructorDepartment')?.value.trim() || 'Information Technology',
                status: document.getElementById('instructorStatus')?.value || 'Active',
                expertise: document.getElementById('instructorExpertise').value.trim() || 'Computer Science & Technology',
                bio: document.getElementById('instructorBio')?.value.trim() || '',
                avatar_url: document.getElementById('instructorPhoto')?.value.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
            };

            const saveBtn = document.getElementById('saveInstructorBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
            }

            try {
                if (id) {
                    if (window.AdminStore) {
                        window.AdminStore.updateInstructor(id, payload);
                        allInstructors = window.AdminStore.getInstructors();
                    }
                    if (instructorModal) instructorModal.hide();
                    renderInstructorsTable(allInstructors);
                    populateCourseSelects();
                    if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Instructor Updated', `${name} profile updated.`);
                } else {
                    if (window.AdminStore) {
                        window.AdminStore.createInstructor(payload);
                        allInstructors = window.AdminStore.getInstructors();
                    }
                    if (instructorModal) instructorModal.hide();
                    renderInstructorsTable(allInstructors);
                    populateCourseSelects();
                    if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Instructor Added', `${name} is connected to academic faculty.`);
                }

                const url = id ? `${API_BASE}/admin/instructors/${id}` : `${API_BASE}/admin/instructors`;
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
            } catch (err) {
                if (window.AdminStore) {
                    window.AdminStore.constructor.notifyError('Failed to Save Instructor', err.message);
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Instructor`;
                }
            }
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

        try {
            if (window.AdminStore) {
                window.AdminStore.deleteInstructor(id);
                allInstructors = window.AdminStore.getInstructors();
            }

            const res = await fetch(`${API_BASE}/admin/instructors/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (errData.message) {
                    throw new Error(errData.message);
                }
            }

            renderInstructorsTable(allInstructors);

            if (window.AdminStore) {
                window.AdminStore.constructor.toast(`Instructor "${name}" deleted`, 'success');
            }
        } catch (err) {
            if (window.AdminStore) {
                window.AdminStore.constructor.notifyError('Action Prohibited', err.message || 'This instructor is assigned to courses. Please reassign these courses before deleting.');
            } else {
                alert(err.message || 'Cannot delete instructor.');
            }
            loadInstructors();
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle Hash Navigation & Tab Deep Linking (Courses, Programs, Categories, Instructors)
    function handleInitialRouteAndTab() {
        try {
            const hash = (window.location.hash || '').toLowerCase();
            const params = new URLSearchParams(window.location.search || '');
            const action = (params.get('action') || '').toLowerCase();
            const tab = (params.get('tab') || '').toLowerCase();

            if (hash === '#programs-pane' || hash === '#programs' || tab === 'programs') {
                const tabBtn = document.getElementById('programs-tab');
                if (tabBtn) {
                    const triggerTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
                    triggerTab.show();
                }
            } else if (hash === '#categories-pane' || hash === '#categories' || tab === 'categories') {
                const tabBtn = document.getElementById('categories-tab');
                if (tabBtn) {
                    const triggerTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
                    triggerTab.show();
                }
            } else if (hash === '#instructors-pane' || hash === '#instructors' || tab === 'instructors') {
                const tabBtn = document.getElementById('instructors-tab');
                if (tabBtn) {
                    const triggerTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
                    triggerTab.show();
                }
            } else if (hash === '#courses-pane' || hash === '#courses' || tab === 'courses' || hash === '#create-course' || action === 'create-course' || action === 'create') {
                const tabBtn = document.getElementById('courses-tab');
                if (tabBtn) {
                    const triggerTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
                    triggerTab.show();
                }
            }

            // Auto-trigger course creation modal if specified in query param or hash
            if (action === 'create-course' || action === 'create' || hash === '#create-course') {
                setTimeout(() => {
                    if (typeof window.openCreateCourseModal === 'function') {
                        window.openCreateCourseModal();
                    }
                }, 300);
            }
        } catch (e) {
            console.warn('Academic tab route handling note:', e);
        }
    }

    // Initialize All Tabs
    loadPrograms();
    loadCategories();
    loadInstructors();
    loadCourses();
    handleInitialRouteAndTab();
    window.addEventListener('hashchange', handleInitialRouteAndTab);
});
