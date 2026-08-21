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
            const chapterCount = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id).length : 4;
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
                        <button class="btn btn-sm btn-light border py-1 px-2 d-inline-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="openCourseContentBuilder(${c.id})" title="Open Course Content Builder">
                            <i class="bi bi-diagram-3 text-primary"></i>
                            <span class="fw-bold text-dark">${chapterCount}</span> Modules (${c.lesson_count || 12} Lessons)
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
                            <button class="action-btn text-primary" title="Course Content Builder (Modules, Lessons, Quizzes, Assignments)" onclick="openCourseContentBuilder(${c.id})">
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
    // MULTI-STEP COURSE CREATION STEPPER CONTROLLER
    // ==========================================================================
    let currentCourseStep = 1;
    const totalCourseSteps = 5;
    const completedCourseSteps = new Set();

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

    // Stepper Navigation & UI Manager
    window.goToCourseStep = function (step) {
        if (step < 1 || step > 5) return;

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
        for (let i = 1; i <= 5; i++) {
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
        } else if (step >= 2 && step <= 4) {
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (backBtn) backBtn.style.display = 'inline-block';
            if (continueBtn) continueBtn.style.display = 'inline-block';
            if (saveDraftBtn) saveDraftBtn.style.display = 'none';
            if (createCourseBtn) createCourseBtn.style.display = 'none';
        } else if (step === 5) {
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
            'Course Details & Pricing',
            'Course Media',
            'Schedule & Dates',
            'Review & Publish'
        ];

        for (let i = 1; i <= 5; i++) {
            const stepEl = document.getElementById(`stepperStep${i}`);
            if (stepEl) {
                stepEl.classList.remove('active', 'completed');
                if (i === currentCourseStep) {
                    stepEl.classList.add('active');
                } else if (completedCourseSteps.has(i) && i < currentCourseStep) {
                    stepEl.classList.add('completed');
                }
            }

            if (i <= 4) {
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
            compactBadge.textContent = `Step ${currentCourseStep} of 5: ${stepTitles[currentCourseStep - 1]}`;
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

    // Step-by-Step Field Validation
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
            const price = document.getElementById('coursePrice');
            if (price && (parseFloat(price.value) < 0 || isNaN(parseFloat(price.value)))) {
                setFieldInvalid('coursePrice', 'coursePriceFeedback', 'Price cannot be negative.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = price;
            } else if (price) {
                setFieldValid('coursePrice');
            }
        }

        if (stepNumber === 4) {
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

    // Step 5 Review Summary Card Population
    function populateCourseSummaryReview() {
        const title = document.getElementById('courseTitle')?.value.trim() || 'Untitled Course';
        const difficulty = document.getElementById('courseDifficulty')?.value || 'Beginner';
        const catSelect = document.getElementById('courseCategorySelect');
        const catName = (catSelect && catSelect.selectedIndex > 0) ? catSelect.options[catSelect.selectedIndex].text : 'General';
        const insSelect = document.getElementById('courseInstructorSelect');
        const insName = (insSelect && insSelect.selectedIndex > 0) ? insSelect.options[insSelect.selectedIndex].text : 'Faculty Member';
        const duration = document.getElementById('courseDuration')?.value.trim() || '8 Weeks';
        const lessons = document.getElementById('courseLessons')?.value || '12';
        const price = parseFloat(document.getElementById('coursePrice')?.value || '0').toFixed(2);
        const prerequisites = document.getElementById('coursePrerequisites')?.value.trim() || 'None';
        const desc = document.getElementById('courseDesc')?.value.trim() || 'No description provided.';

        const enrStart = document.getElementById('courseEnrollmentStart')?.value;
        const enrDeadline = document.getElementById('courseEnrollmentDeadline')?.value;
        const courseStart = document.getElementById('courseStartDate')?.value;
        const courseEnd = document.getElementById('courseEndDate')?.value;

        // Set text values
        const revTitle = document.getElementById('reviewCourseTitle');
        const revCat = document.getElementById('reviewCourseCategory');
        const revIns = document.getElementById('reviewCourseInstructor');
        const revDiff = document.getElementById('reviewCourseDifficulty');
        const revDesc = document.getElementById('reviewCourseDesc');
        const revDur = document.getElementById('reviewCourseDuration');
        const revLess = document.getElementById('reviewCourseLessons');
        const revPrice = document.getElementById('reviewCoursePrice');
        const revPrereq = document.getElementById('reviewCoursePrerequisites');
        const revSched = document.getElementById('reviewCourseSchedule');

        if (revTitle) revTitle.textContent = title;
        if (revCat) revCat.textContent = catName;
        if (revIns) revIns.textContent = insName;
        if (revDiff) revDiff.textContent = difficulty;
        if (revDesc) revDesc.textContent = desc;
        if (revDur) revDur.textContent = duration;
        if (revLess) revLess.textContent = `${lessons} Lessons`;
        if (revPrice) revPrice.textContent = `$${price}`;
        if (revPrereq) revPrereq.textContent = prerequisites;

        if (revSched) {
            if (courseStart && courseEnd) {
                revSched.textContent = `${courseStart} → ${courseEnd}`;
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
    }

    // Step 5 Publish Status Choice
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
        
        // Reset Stepper to Step 1
        completedCourseSteps.clear();
        goToCourseStep(1);

        document.getElementById('courseModalTitle').textContent = 'Add New Specialized Course';
        document.getElementById('coursePrice').value = '0.00';
        document.getElementById('courseDuration').value = '8 Weeks';
        document.getElementById('courseLessons').value = '12';
        
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

        // Reset Stepper to Step 1 and prefill
        completedCourseSteps.clear();
        completedCourseSteps.add(1);
        completedCourseSteps.add(2);
        completedCourseSteps.add(3);
        completedCourseSteps.add(4);
        goToCourseStep(1);

        populateCourseSelects();
        document.getElementById('courseId').value = c.id;
        document.getElementById('courseTitle').value = c.title;
        document.getElementById('courseDifficulty').value = c.difficulty || 'Beginner';
        document.getElementById('courseCategorySelect').value = c.category_id || (allCategories[0] ? allCategories[0].id : 1);
        document.getElementById('courseInstructorSelect').value = c.instructor_id || (allInstructors[0] ? allInstructors[0].id : 1);
        document.getElementById('courseDuration').value = c.duration || c.duration_hours || '8 Weeks';
        document.getElementById('courseLessons').value = c.lesson_count !== undefined ? c.lesson_count : 12;
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

    // Submit Course Payload (Draft or Published)
    async function submitCourseWithPublishStatus(isPublished) {
        // Validate all 4 prior steps
        for (let s = 1; s <= 4; s++) {
            const { isValid, firstInvalidEl } = validateCourseStep(s);
            if (!isValid) {
                goToCourseStep(s);
                if (firstInvalidEl) {
                    firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalidEl.focus();
                }
                if (window.AdminStore) window.AdminStore.constructor.toast(`Please correct the highlighted errors in Step ${s}.`, 'error');
                return;
            }
        }

        const id = document.getElementById('courseId').value;
        const title = document.getElementById('courseTitle').value.trim();
        const thumbUrlVal = document.getElementById('courseThumbnailUrl')?.value.trim() || 'assets/images/courses/fullstack.jpg';
        const videoUrlVal = document.getElementById('courseVideoUrl')?.value.trim() || '';

        const payload = {
            title: title,
            category_id: parseInt(document.getElementById('courseCategorySelect').value) || 1,
            instructor_id: parseInt(document.getElementById('courseInstructorSelect').value) || 1,
            difficulty: document.getElementById('courseDifficulty').value,
            duration: document.getElementById('courseDuration').value.trim() || '8 Weeks',
            duration_hours: document.getElementById('courseDuration').value.trim() || '8 Weeks',
            lesson_count: parseInt(document.getElementById('courseLessons').value) || 12,
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
            is_published: isPublished
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
                    window.AdminStore.constructor.notifySuccess('Course Updated', `"${title}" has been updated and ${statusText}${noticeSuffix}.`);
                }
            } else {
                if (window.AdminStore) {
                    const newCourse = window.AdminStore.createCourse(payload);
                    window.AdminStore.createChapter({
                        course_id: newCourse.id,
                        chapter_num: 1,
                        title: 'Module 1 — Foundations & Core Principles',
                        duration: '2 Weeks',
                        lesson_count: 3,
                        description: 'Foundational architecture, setup, and key concepts.'
                    });
                    window.AdminStore.createChapter({
                        course_id: newCourse.id,
                        chapter_num: 2,
                        title: 'Module 2 — Advanced Practical Application',
                        duration: '3 Weeks',
                        lesson_count: 4,
                        description: 'Hands-on practical development and comprehensive project building.'
                    });
                    allCourses = window.AdminStore.getCourses();
                }
                if (courseModal) courseModal.hide();
                applyCourseFilters();
                if (window.AdminStore) {
                    const statusText = isPublished ? 'published to student catalog' : 'saved as draft';
                    const noticeSuffix = apiSuccess ? '' : ' (saved locally for demo)';
                    window.AdminStore.constructor.notifySuccess('Course Created Successfully', `"${title}" has been created and ${statusText}${noticeSuffix}.`);
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
                `Are you sure you want to delete "${name}" and all its syllabus modules?`,
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
        let totalLessons = 0;
        chapters.forEach(ch => { totalLessons += (ch.lesson_count || 3); });

        if (statsBadge) {
            statsBadge.textContent = `${chapters.length} Modules • ${totalLessons} Lessons`;
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
            const lessons = [
                { id: idx * 10 + 1, title: `Lesson ${ch.chapter_num}.1 — Foundations & Setup`, duration: '30 Mins', desc: 'Environment initialization and theoretical fundamentals.', video: 'intro-lecture.mp4', videoSize: '18.4 MB', pdf: 'syllabus-guide.pdf', pdfSize: '1.2 MB' },
                { id: idx * 10 + 2, title: `Lesson ${ch.chapter_num}.2 — Core Concepts & Architecture`, duration: '45 Mins', desc: 'In-depth review of component structures.', video: 'architecture.mp4', videoSize: '24.1 MB', pdf: 'lecture-slides.pdf', pdfSize: '2.5 MB' },
                { id: idx * 10 + 3, title: `Lesson ${ch.chapter_num}.3 — Practical Lab Implementation`, duration: '50 Mins', desc: 'Hands-on programming laboratory.', video: null, pdf: 'exercise-worksheet.pdf', pdfSize: '850 KB' }
            ];

            return `
                <div class="module-tree-card">
                    <div class="module-tree-header">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-primary px-2 py-1" style="font-size: 11px;">Module ${ch.chapter_num}</span>
                            <span class="fw-bold text-dark" style="font-size: 13.5px;">${escapeHtml(ch.title)}</span>
                            <span class="text-muted small">(${escapeHtml(ch.duration || '2 Weeks')})</span>
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
                        ${lessons.map(l => `
                            <div class="lesson-tree-item">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="bi bi-file-earmark-play text-primary"></i>
                                        <span class="fw-semibold text-dark" style="font-size: 13px;">${escapeHtml(l.title)}</span>
                                        <span class="text-muted" style="font-size: 11px;">&bull; ${escapeHtml(l.duration)}</span>
                                    </div>
                                    <div class="text-muted mt-1" style="font-size: 11.5px;">${escapeHtml(l.desc)}</div>
                                    
                                    <!-- Resource Badges -->
                                    <div class="mt-2 d-flex flex-wrap">
                                        ${l.video ? `
                                            <span class="resource-pill video" title="Attached Streaming Video">
                                                <i class="bi bi-camera-video"></i> ${escapeHtml(l.video)} (${l.videoSize})
                                            </span>
                                        ` : ''}
                                        ${l.pdf ? `
                                            <span class="resource-pill pdf" title="Attached Learning Material">
                                                <i class="bi bi-file-earmark-pdf"></i> ${escapeHtml(l.pdf)} (${l.pdfSize})
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
                        <span class="fw-bold text-dark" style="font-size: 13.5px;"><i class="bi bi-clipboard-check text-primary me-1"></i> Course Quizzes & QCM Knowledge Checks</span>
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
                        <span class="fw-bold text-dark" style="font-size: 13.5px;"><i class="bi bi-journal-text text-warning me-1"></i> Course Assignments & Project Submissions</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 11px;" onclick="openAddAssignmentModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add Assignment
                    </button>
                </div>
                <div class="p-3 bg-white">
                    <div class="p-3 bg-light rounded-2 border d-flex align-items-center justify-content-between">
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 13px;">Final Project — Full-Stack Web Architecture</div>
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

    // Module CRUD Handlers
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

    // Lesson CRUD Handlers with Video & Material Previews
    window.openAddLessonModal = function (moduleId) {
        const form = document.getElementById('lessonEditorForm');
        if (form) form.reset();
        document.getElementById('lessonEditorId').value = '';
        document.getElementById('lessonEditorModuleId').value = moduleId;
        document.getElementById('lessonEditorCourseId').value = activeBuilderCourseId;
        document.getElementById('lessonEditorTitle').textContent = 'Add Lesson & Learning Materials';

        // Reset previews
        const vidPreview = document.getElementById('videoPreviewContainer');
        if (vidPreview) vidPreview.style.display = 'none';
        const matPreview = document.getElementById('materialPreviewContainer');
        if (matPreview) matPreview.style.display = 'none';

        if (lessonEditorModal) lessonEditorModal.show();
    };

    window.openEditLessonModal = function (lessonId) {
        document.getElementById('lessonEditorId').value = lessonId;
        document.getElementById('lessonEditorTitleInput').value = `Lesson 1.${lessonId} — Interactive Architecture Deep-Dive`;
        document.getElementById('lessonEditorDuration').value = '45 Mins';
        document.getElementById('lessonEditorDesc').value = 'Complete technical walkthrough and code architecture lecture.';
        document.getElementById('lessonEditorTitle').textContent = 'Edit Lesson & Materials';

        const vidPreview = document.getElementById('videoPreviewContainer');
        if (vidPreview) vidPreview.style.display = 'block';
        const vidPlayer = document.getElementById('videoPreviewPlayer');
        if (vidPlayer) vidPlayer.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

        const matPreview = document.getElementById('materialPreviewContainer');
        if (matPreview) matPreview.style.display = 'flex';

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
            const title = document.getElementById('lessonEditorTitleInput').value.trim();
            if (window.AdminStore) window.AdminStore.constructor.toast(`Lesson "${title}" saved with materials`, 'success');
            if (lessonEditorModal) lessonEditorModal.hide();
            renderCourseContentTree(activeBuilderCourseId);
        });
    }

    window.deleteLesson = function (lessonId) {
        if (window.AdminStore) window.AdminStore.constructor.toast('Lesson removed from module', 'info');
        renderCourseContentTree(activeBuilderCourseId);
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

    // Initialize All Tabs
    loadPrograms();
    loadCategories();
    loadInstructors();
    loadCourses();
});
