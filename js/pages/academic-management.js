// ==========================================
// AUB Digital Academy - Academic Management Controller
// Comprehensive Programs, Courses, Chapter/Module Manager, Categories & Instructors CRUD
// Integrated with SweetAlert2 & AdminMockStore
// ==========================================

let isAcademicManagementInitialized = false;

function initAcademicManagement() {
    if (isAcademicManagementInitialized) return;
    isAcademicManagementInitialized = true;

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

    // Safe Modal Helper
    const safeGetModal = (el) => {
        if (!el || typeof bootstrap === 'undefined' || !bootstrap.Modal) return null;
        try {
            return bootstrap.Modal.getOrCreateInstance(el);
        } catch (e) {
            return null;
        }
    };

    // Modals
    const programModalEl = document.getElementById('createProgramModal');
    const programModal = safeGetModal(programModalEl);

    const courseModalEl = document.getElementById('createCourseModal');
    const courseModal = safeGetModal(courseModalEl);

    const chaptersModalEl = document.getElementById('chaptersModal');
    const chaptersModal = safeGetModal(chaptersModalEl);

    const categoryModalEl = document.getElementById('createCategoryModal');
    const categoryModal = safeGetModal(categoryModalEl);

    const instructorModalEl = document.getElementById('createInstructorModal');
    const instructorModal = safeGetModal(instructorModalEl);

    const viewCourseModalEl = document.getElementById('viewCourseModal');
    const viewCourseModal = safeGetModal(viewCourseModalEl);
    let activeCourseInView = null;

    // Course Content Builder Modals
    const contentBuilderModalEl = document.getElementById('courseContentBuilderModal');
    const contentBuilderModal = safeGetModal(contentBuilderModalEl);

    const moduleEditorModalEl = document.getElementById('moduleEditorModal');
    const moduleEditorModal = safeGetModal(moduleEditorModalEl);

    const lessonEditorModalEl = document.getElementById('lessonEditorModal');
    const lessonEditorModal = safeGetModal(lessonEditorModalEl);

    const quizEditorModalEl = document.getElementById('quizEditorModal');
    const quizEditorModal = safeGetModal(quizEditorModalEl);

    const assignmentEditorModalEl = document.getElementById('assignmentEditorModal');
    const assignmentEditorModal = safeGetModal(assignmentEditorModalEl);

    // Course Creation Wizard Sub-Modals
    const wizardModuleModalEl = document.getElementById('wizardModuleModal');
    const wizardModuleModal = safeGetModal(wizardModuleModalEl);

    const wizardLessonModalEl = document.getElementById('wizardLessonModal');
    const wizardLessonModal = safeGetModal(wizardLessonModalEl);

    const wizardQuizModalEl = document.getElementById('wizardQuizModal');
    const wizardQuizModal = safeGetModal(wizardQuizModalEl);

    const wizardAssignmentModalEl = document.getElementById('wizardAssignmentModal');
    const wizardAssignmentModal = safeGetModal(wizardAssignmentModalEl);

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

    // 1. Instant Synchronous Rendering & Background Data Hydration
    async function loadPrograms(forceRefresh = false) {
        const tbody = document.getElementById('programsTableBody');

        // Step 1: Render immediately from cache/store (0ms - zero artificial delay)
        if (window.AdminStore && typeof window.AdminStore.getPrograms === 'function') {
            const storePrograms = window.AdminStore.getPrograms();
            if (Array.isArray(storePrograms) && storePrograms.length > 0) {
                allPrograms = storePrograms;
                renderProgramsTable(allPrograms);
            }
        } else if (allPrograms && allPrograms.length > 0) {
            renderProgramsTable(allPrograms);
        }

        // If no cached data exists and nothing rendered yet, show immediate inline table skeleton
        if ((!allPrograms || allPrograms.length === 0) && tbody && tbody.children.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                        <div class="text-muted text-xs">Loading academic programs...</div>
                    </td>
                </tr>
            `;
        }

        // Step 2: Fetch asynchronously in the background without blocking the UI
        try {
            let freshData = null;
            if (window.academicService && typeof window.academicService.getPrograms === 'function') {
                freshData = await window.academicService.getPrograms(forceRefresh);
            } else {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                const res = await fetch(`${API_BASE}/admin/programs`, { 
                    headers: getHeaders(), 
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) {
                        freshData = data.data;
                    }
                }
            }

            if (freshData && Array.isArray(freshData)) {
                allPrograms = freshData;
                renderProgramsTable(allPrograms);
            }
        } catch (err) {
            console.warn('[AcademicManagement] Background programs fetch note:', err.message);
            // If completely empty and API fails, show error state with retry button
            if (!allPrograms || allPrograms.length === 0) {
                renderProgramsTable([], true);
            }
        }
    }
    window.loadPrograms = loadPrograms;

    function renderProgramsTable(programs, isError = false) {
        const tbody = document.getElementById('programsTableBody');
        if (!tbody) return;

        // 7. ERROR STATE: Clear error + Retry button
        if (isError) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <i class="bi bi-exclamation-triangle fs-2 text-danger d-block mb-2 opacity-75"></i>
                        <div class="fw-semibold text-dark mb-1">Unable to load academic programs.</div>
                        <p class="text-muted text-xs mb-3">Please check your connection and try again.</p>
                        <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick="loadPrograms(true)">
                            <i class="bi bi-arrow-clockwise me-1"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        // 8. EMPTY STATE: Graduation cap icon + message + Add New Program button
        if (!programs || programs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <i class="bi bi-mortarboard fs-1 text-muted opacity-50 d-block mb-2"></i>
                        <div class="fw-bold text-dark fs-6 mb-1">No academic programs found</div>
                        <p class="text-muted text-xs mb-3">Create your first academic program to get started.</p>
                        <button class="btn btn-primary btn-sm rounded-pill px-4 fw-semibold d-inline-flex align-items-center gap-1.5" onclick="window.openCreateProgramModal ? window.openCreateProgramModal() : null">
                            <i class="bi bi-plus-lg"></i> Add New Program
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = programs.map(p => {
            const themeClass = p.theme_class || 'theme-blue';
            const themeColor = THEME_COLOR_MAP[themeClass] || '#2563eb';
            const iconClass = p.icon_class || 'bi-laptop';
            const logoUrl = p.logo_url || p.custom_logo || '';
            const imgUrl = p.image_url || '';

            return `
            <tr>
                <td class="text-muted fw-bold" style="font-size: 12px;">#${p.order_num !== undefined ? p.order_num : 1}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="rounded-2 p-1 d-flex align-items-center justify-content-center border bg-white position-relative overflow-hidden" style="width: 40px; height: 40px; flex-shrink: 0; background-color: rgba(37, 99, 235, 0.05);">
                            ${imgUrl
                                ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.title)}" class="w-100 h-100 object-fit-cover rounded">`
                                : (logoUrl 
                                    ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" class="w-100 h-100 object-fit-contain rounded">`
                                    : `<i class="bi ${escapeHtml(iconClass)}" style="font-size: 17px; color: ${themeColor};"></i>`
                                )
                            }
                        </div>
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(p.title)}</div>
                            <div class="text-muted text-truncate" style="font-size: 11px; max-width: 280px;" title="${escapeHtml(p.description || p.short_description || '')}">${escapeHtml(p.description || p.short_description || '')}</div>
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
                        <button class="action-btn" title="View Program Details" aria-label="View program ${escapeHtml(p.title)}" onclick="viewProgram(${p.id})">
                            <i class="bi bi-eye" aria-hidden="true"></i>
                        </button>
                        <button class="action-btn" title="Edit Program" aria-label="Edit program ${escapeHtml(p.title)}" onclick="openEditProgramModal(${p.id})">
                            <i class="bi bi-pencil" aria-hidden="true"></i>
                        </button>
                        <button class="action-btn delete" title="Delete Program" aria-label="Delete program ${escapeHtml(p.title)}" onclick="deleteProgram(${p.id})">
                            <i class="bi bi-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    // ==========================================
    // 1. PROGRAMS MANAGEMENT (Create Program Form & Modal Flow)
    // ==========================================
    let selectedProgramInstructors = [];
    let programLearningOutcomes = [];
    let isSubmittingProgram = false;

    // Toast Notification Helper
    function showProgramToast(type, title, message = '') {
        const toastType = type === 'danger' || type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info');
        if (typeof showToast === 'function') {
            showToast(toastType, title, message || '');
        } else if (window.AdminStore && typeof window.AdminStore.constructor.toast === 'function') {
            window.AdminStore.constructor.toast(message || title, toastType);
        } else if (window.Swal) {
            const Toast = window.Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: toastType,
                title: title,
                text: message || undefined
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }

    // Form Validation Helper
    function setFieldInvalid(fieldId, feedbackId, message) {
        const field = document.getElementById(fieldId);
        const feedback = document.getElementById(feedbackId);
        if (field) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
        }
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = 'block';
        }
    }

    function setFieldValid(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
        const feedback = document.getElementById(`${fieldId}Feedback`);
        if (feedback) {
            feedback.style.display = 'none';
        }
    }

    function clearProgramValidation() {
        const fields = ['programTitle', 'programCode', 'programDegree', 'programDuration', 'programCategorySelect', 'programCredits', 'programStatus'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('is-invalid', 'is-valid');
            const fb = document.getElementById(`${id}Feedback`);
            if (fb) fb.style.display = 'none';
        });
        const imgFb = document.getElementById('programImageFeedback');
        if (imgFb) imgFb.style.display = 'none';
    }

    function validateProgramForm() {
        let isValid = true;
        let firstInvalidEl = null;

        // 1. Program Title * (Required, min 3 chars)
        const titleEl = document.getElementById('programTitle');
        const titleVal = titleEl ? titleEl.value.trim() : '';
        if (!titleVal) {
            setFieldInvalid('programTitle', 'programTitleFeedback', 'Program title is required.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else if (titleVal.length < 3) {
            setFieldInvalid('programTitle', 'programTitleFeedback', 'Program title must be at least 3 characters.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else {
            setFieldValid('programTitle');
        }

        // 2. Degree Type * (Required)
        const degreeEl = document.getElementById('programDegree');
        const degreeVal = degreeEl ? degreeEl.value.trim() : '';
        if (!degreeVal) {
            setFieldInvalid('programDegree', 'programDegreeFeedback', 'Please select a degree type.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = degreeEl;
        } else {
            setFieldValid('programDegree');
        }

        // 3. Category * (Required)
        const catEl = document.getElementById('programCategorySelect');
        const catVal = catEl ? catEl.value.trim() : '';
        if (!catVal) {
            setFieldInvalid('programCategorySelect', 'programCategoryFeedback', 'Please select a category.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = catEl;
        } else {
            setFieldValid('programCategorySelect');
        }

        // 4. Duration (Optional, validate non-empty if present)
        const durationEl = document.getElementById('programDuration');
        if (durationEl && durationEl.value.trim()) {
            setFieldValid('programDuration');
        }

        // 5. Credits (Optional, numeric validation 1-500 if entered)
        const creditsEl = document.getElementById('programCredits');
        const creditsVal = creditsEl ? creditsEl.value.trim() : '';
        if (creditsVal !== '') {
            const num = Number(creditsVal);
            if (isNaN(num) || num < 1 || num > 500) {
                setFieldInvalid('programCredits', 'programCreditsFeedback', 'Credits must be a valid number between 1 and 500.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = creditsEl;
            } else {
                setFieldValid('programCredits');
            }
        }

        // 6. Status * (Required)
        const statusEl = document.getElementById('programStatus');
        const statusVal = statusEl ? statusEl.value.trim() : '';
        if (!statusVal) {
            setFieldInvalid('programStatus', 'programStatusFeedback', 'Please select a status.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = statusEl;
        } else {
            setFieldValid('programStatus');
        }

        if (!isValid && firstInvalidEl) {
            try {
                firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidEl.focus();
            } catch (e) {
                firstInvalidEl.focus();
            }
        }

        return { isValid, firstInvalidEl };
    }

    // Dynamic Category Loading for Program Modal (Instant Cache + Non-blocking Background Sync)
    async function loadCategoriesForProgramModal(selectedId = null) {
        const select = document.getElementById('programCategorySelect');
        if (!select) return;

        // 1. Synchronously populate from cache/store if available (0ms)
        let cats = allCategories;
        if ((!cats || cats.length === 0) && window.AdminStore) {
            cats = window.AdminStore.getCategories();
            if (Array.isArray(cats) && cats.length > 0) {
                allCategories = cats;
            }
        }

        // Fallback default categories if empty to prevent form submission lockout
        if (!cats || cats.length === 0) {
            cats = [
                { id: 1, name: 'Computer Science' },
                { id: 2, name: 'Software Engineering' },
                { id: 3, name: 'Cybersecurity' },
                { id: 4, name: 'Data Science & AI' },
                { id: 5, name: 'Information Technology' },
                { id: 6, name: 'General Studies' }
            ];
            allCategories = cats;
        }

        if (cats && cats.length > 0) {
            let options = '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select category...</option>';
            cats.forEach(c => {
                const isSel = selectedId && (Number(selectedId) === Number(c.id) || String(selectedId).toLowerCase() === c.name.toLowerCase()) ? ' selected' : '';
                options += `<option value="${c.id}"${isSel}>${escapeHtml(c.name)}</option>`;
            });
            select.innerHTML = options;
        } else {
            select.innerHTML = '<option value="" disabled selected>Loading categories...</option>';
        }

        // 2. Background sync from API if needed
        try {
            if (window.academicService && typeof window.academicService.getCategories === 'function') {
                const freshCats = await window.academicService.getCategories();
                if (Array.isArray(freshCats) && freshCats.length > 0) {
                    allCategories = freshCats;
                    let currentVal = select.value || selectedId;
                    let options = '<option value="" disabled' + (!currentVal ? ' selected' : '') + '>Select category...</option>';
                    freshCats.forEach(c => {
                        const isSel = currentVal && (Number(currentVal) === Number(c.id) || String(currentVal).toLowerCase() === c.name.toLowerCase()) ? ' selected' : '';
                        options += `<option value="${c.id}"${isSel}>${escapeHtml(c.name)}</option>`;
                    });
                    select.innerHTML = options;
                }
            }
        } catch (e) {}
    }

    // ==========================================
    // 1. INSTRUCTORS SEARCHABLE MULTI-SELECT
    // ==========================================
    let instructorSearchQuery = '';

    // Dynamic Instructor Loading & Sync
    async function loadInstructorsForProgramModal() {
        // 1. Synchronously populate from cache/store if available (0ms)
        let insts = allInstructors;
        if ((!insts || insts.length === 0) && window.AdminStore) {
            insts = window.AdminStore.getInstructors();
            if (Array.isArray(insts) && insts.length > 0) {
                allInstructors = insts;
            }
        }

        renderInstructorDropdownList(instructorSearchQuery);
        renderProgramInstructorChips();

        // 2. Background sync from API if needed
        try {
            if (window.academicService && typeof window.academicService.getInstructors === 'function') {
                const freshInsts = await window.academicService.getInstructors();
                if (Array.isArray(freshInsts) && freshInsts.length > 0) {
                    allInstructors = freshInsts;
                    renderInstructorDropdownList(instructorSearchQuery);
                    renderProgramInstructorChips();
                }
            }
        } catch (e) {}
    }

    // Render Searchable Instructor Dropdown List
    function renderInstructorDropdownList(query = '') {
        const listContainer = document.getElementById('instructorDropdownList');
        if (!listContainer) return;

        let insts = allInstructors;
        if ((!insts || insts.length === 0) && window.AdminStore) {
            insts = window.AdminStore.getInstructors();
            if (Array.isArray(insts) && insts.length > 0) {
                allInstructors = insts;
            }
        }

        if (!insts || insts.length === 0) {
            listContainer.innerHTML = '<div class="text-muted text-center py-3 text-xs"><span class="spinner-border spinner-border-sm me-1 text-primary"></span> Loading instructors...</div>';
            return;
        }

        const q = (query || '').trim().toLowerCase();
        const filtered = insts.filter(inst => {
            if (!q) return true;
            const nameMatch = inst.name && inst.name.toLowerCase().includes(q);
            const emailMatch = inst.email && inst.email.toLowerCase().includes(q);
            const idMatch = inst.id && String(inst.id).toLowerCase().includes(q);
            const titleMatch = inst.title && inst.title.toLowerCase().includes(q);
            const expMatch = inst.expertise && inst.expertise.toLowerCase().includes(q);
            const deptMatch = inst.department && inst.department.toLowerCase().includes(q);
            const facultyMatch = inst.faculty && inst.faculty.toLowerCase().includes(q);
            return nameMatch || emailMatch || idMatch || titleMatch || expMatch || deptMatch || facultyMatch;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="text-muted text-center py-4 text-xs"><i class="bi bi-person-x d-block fs-4 text-secondary opacity-50 mb-1"></i>No instructors found.</div>';
            return;
        }

        listContainer.innerHTML = filtered.map(inst => {
            const isSelected = selectedProgramInstructors.some(i => Number(i.id) === Number(inst.id));
            const sub = inst.title || inst.department || inst.expertise || 'Academic Faculty';
            const initials = inst.name ? inst.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'IN';

            return `
            <div class="instructor-dropdown-item ${isSelected ? 'selected' : ''}" onclick="toggleProgramInstructor(${inst.id}, event)" onkeydown="if(event.key==='Enter'||event.key===' '){toggleProgramInstructor(${inst.id}, event);}" role="checkbox" aria-checked="${isSelected}" tabindex="0">
                <div class="d-flex align-items-center gap-2.5 overflow-hidden">
                    <div class="instructor-avatar">
                        ${initials}
                    </div>
                    <div class="text-truncate">
                        <div class="fw-bold text-dark text-xs text-truncate">${escapeHtml(inst.name)}</div>
                        <div class="text-muted text-truncate" style="font-size: 11px;">${escapeHtml(sub)}</div>
                    </div>
                </div>
                <div class="instructor-checkbox ms-2">
                    ${isSelected ? '<i class="bi bi-check-lg"></i>' : ''}
                </div>
            </div>
            `;
        }).join('');
    }

    // Toggle Instructor Selection
    window.toggleProgramInstructor = function (id, event) {
        if (event) {
            event.stopPropagation();
        }
        const selectedId = Number(id);
        const idx = selectedProgramInstructors.findIndex(i => Number(i.id) === selectedId);

        if (idx !== -1) {
            selectedProgramInstructors.splice(idx, 1);
        } else {
            const inst = allInstructors.find(i => Number(i.id) === selectedId);
            if (inst) {
                selectedProgramInstructors.push({
                    id: inst.id,
                    name: inst.name,
                    title: inst.title || inst.department || inst.expertise || 'Academic Faculty'
                });
            }
        }

        renderProgramInstructorChips();
        renderInstructorDropdownList(instructorSearchQuery);
    };

    // Remove Selected Instructor Chip
    window.removeProgramInstructor = function (id, event) {
        if (event) {
            event.stopPropagation();
        }
        selectedProgramInstructors = selectedProgramInstructors.filter(i => Number(i.id) !== Number(id));
        renderProgramInstructorChips();
        renderInstructorDropdownList(instructorSearchQuery);
    };

    // Instructor Chips Handler & Placeholder Sync
    function renderProgramInstructorChips() {
        const container = document.getElementById('selectedInstructorsChips');
        const placeholder = document.getElementById('instructorDropdownPlaceholder');
        const footerCount = document.getElementById('instructorDropdownFooterCount');
        const count = selectedProgramInstructors.length;

        // 1. Sync Placeholder Text in Closed Selector
        if (placeholder) {
            if (count === 0) {
                placeholder.textContent = 'Select instructors...';
                placeholder.className = 'text-secondary text-truncate';
            } else if (count === 1) {
                placeholder.textContent = '1 instructor selected';
                placeholder.className = 'text-dark fw-semibold text-truncate';
            } else {
                placeholder.textContent = `${count} instructors selected`;
                placeholder.className = 'text-dark fw-semibold text-truncate';
            }
        }

        // 2. Sync Summary in Dropdown Footer
        if (footerCount) {
            if (count === 0) {
                footerCount.textContent = '0 instructors selected';
            } else if (count === 1) {
                footerCount.textContent = '1 instructor selected';
            } else {
                footerCount.textContent = `${count} instructors selected`;
            }
        }

        if (!container) return;

        // 3. Render Compact Chips Below Selector
        if (count === 0) {
            container.classList.add('d-none');
            container.classList.remove('d-flex');
            container.innerHTML = '';
            return;
        }

        container.classList.remove('d-none');
        container.classList.add('d-flex');

        const maxVisible = 2;
        const visibleList = selectedProgramInstructors.slice(0, maxVisible);
        const overflowCount = count - maxVisible;

        let chipsHtml = visibleList.map(inst => `
            <span class="instructor-chip" data-id="${inst.id}">
                <i class="bi bi-person-check text-primary" style="font-size: 13px;"></i>
                <span class="chip-name" title="${escapeHtml(inst.name)}">${escapeHtml(inst.name)}</span>
                <button type="button" class="chip-remove" onclick="removeProgramInstructor(${inst.id}, event)" title="Remove ${escapeHtml(inst.name)}" aria-label="Remove ${escapeHtml(inst.name)}">
                    <i class="bi bi-x"></i>
                </button>
            </span>
        `).join('');

        if (overflowCount > 0) {
            const overflowNames = selectedProgramInstructors.slice(maxVisible).map(i => i.name).join(', ');
            chipsHtml += `
                <span class="instructor-chip-more" onclick="window.openInstructorDropdown(event)" title="${escapeHtml(overflowNames)}">
                    +${overflowCount} more
                </span>
            `;
        }

        container.innerHTML = chipsHtml;
    }

    // Open Dropdown
    window.openInstructorDropdown = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const menu = document.getElementById('instructorDropdownMenu');
        const toggleBtn = document.getElementById('instructorDropdownToggleBtn');
        const searchInput = document.getElementById('instructorSearchInput');

        if (menu) menu.style.display = 'block';
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 50);
        }
    };

    // Close Dropdown
    window.closeInstructorDropdown = function () {
        const menu = document.getElementById('instructorDropdownMenu');
        const toggleBtn = document.getElementById('instructorDropdownToggleBtn');

        if (menu) menu.style.display = 'none';
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    };

    // Setup Instructor Search & Dropdown Events
    function setupInstructorDropdownEvents() {
        const toggleBtn = document.getElementById('instructorDropdownToggleBtn');
        const menu = document.getElementById('instructorDropdownMenu');
        const searchInput = document.getElementById('instructorSearchInput');
        const clearBtn = document.getElementById('clearInstructorSearchBtn');
        const doneBtn = document.getElementById('instructorDropdownDoneBtn');
        const container = document.getElementById('instructorSelectContainer');

        if (!toggleBtn || !menu) return;

        // Toggle dropdown open/close on button click
        toggleBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = menu.style.display === 'block';
            if (isOpen) {
                window.closeInstructorDropdown();
            } else {
                window.openInstructorDropdown();
            }
        });

        // Done button closes dropdown
        if (doneBtn) {
            doneBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.closeInstructorDropdown();
            });
        }

        // Live Search Input
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                instructorSearchQuery = this.value;
                if (clearBtn) {
                    if (this.value.trim()) {
                        clearBtn.classList.remove('d-none');
                    } else {
                        clearBtn.classList.add('d-none');
                    }
                }
                renderInstructorDropdownList(this.value);
            });
            searchInput.addEventListener('click', function (e) {
                e.stopPropagation();
            });
            searchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    window.closeInstructorDropdown();
                }
            });
        }

        // Clear Search Button
        if (clearBtn) {
            clearBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (searchInput) {
                    searchInput.value = '';
                    instructorSearchQuery = '';
                    clearBtn.classList.add('d-none');
                    renderInstructorDropdownList('');
                    searchInput.focus();
                }
            });
        }

        // Close on click outside
        document.addEventListener('click', function (e) {
            if (container && !container.contains(e.target)) {
                if (menu.style.display === 'block') {
                    window.closeInstructorDropdown();
                }
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (menu && menu.style.display === 'block') {
                    window.closeInstructorDropdown();
                }
            }
        });
    }

    // Dynamic Learning Outcomes Handler
    function renderProgramLearningOutcomes() {
        const container = document.getElementById('learningOutcomesList');
        if (!container) return;

        if (!Array.isArray(programLearningOutcomes) || programLearningOutcomes.length === 0) {
            container.innerHTML = '<div class="text-muted text-xs py-2 px-3 text-center border rounded-2 bg-light"><i class="bi bi-info-circle me-1"></i>No learning outcomes added yet. Click "+ Add Learning Outcome" to add one.</div>';
            return;
        }

        container.innerHTML = programLearningOutcomes.map((outcome, idx) => `
            <div class="learning-outcome-row" data-index="${idx}">
                <input type="text" class="form-control text-sm" value="${escapeHtml(outcome)}" placeholder="Students will learn / be able to..." oninput="updateProgramLearningOutcome(${idx}, this.value)" autocomplete="off">
                <button type="button" class="learning-outcome-remove-btn" onclick="removeProgramLearningOutcome(${idx})" title="Remove outcome" aria-label="Remove outcome">
                    <i class="bi bi-dash-lg"></i>
                </button>
            </div>
        `).join('');
    }

    window.updateProgramLearningOutcome = function (idx, text) {
        if (programLearningOutcomes[idx] !== undefined) {
            programLearningOutcomes[idx] = text;
        }
    };

    window.removeProgramLearningOutcome = function (idx) {
        programLearningOutcomes.splice(idx, 1);
        renderProgramLearningOutcomes();
    };

    const addLearningOutcomeBtn = document.getElementById('addLearningOutcomeBtn');
    if (addLearningOutcomeBtn) {
        addLearningOutcomeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            programLearningOutcomes.push('');
            renderProgramLearningOutcomes();
            // Focus on the newly added input
            setTimeout(() => {
                const inputs = document.querySelectorAll('#learningOutcomesList input');
                if (inputs.length > 0) {
                    inputs[inputs.length - 1].focus();
                }
            }, 50);
        });
    }

    // ==========================================
    // 2. PROGRAM COVER IMAGE UPLOADER
    // ==========================================
    function setupProgramImageUpload() {
        const dropzone = document.getElementById('programImageDropzone');
        const fileInput = document.getElementById('programImageFile');
        const previewBox = document.getElementById('programImagePreviewBox');
        const previewImg = document.getElementById('programImagePreviewImg');
        const fileNameEl = document.getElementById('programImageFileName');
        const fileSizeEl = document.getElementById('programImageFileSize');
        const imageUrlInput = document.getElementById('programImageUrl');
        const replaceBtn = document.getElementById('replaceProgramImageBtn');
        const removeBtn = document.getElementById('removeProgramImageBtn');
        const feedbackEl = document.getElementById('programImageFeedback');

        if (!dropzone || !fileInput) return;

        function handleFile(file) {
            if (!file) return;

            if (feedbackEl) feedbackEl.style.display = 'none';

            // Validate file type (JPG, PNG, WebP)
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : '';
            const validExts = ['png', 'jpg', 'jpeg', 'webp'];
            const isTypeValid = validTypes.includes((file.type || '').toLowerCase()) || validExts.includes(fileExt);

            if (!isTypeValid) {
                const msg = 'Invalid file format. Supported formats: JPG, PNG, WebP.';
                if (feedbackEl) {
                    feedbackEl.textContent = msg;
                    feedbackEl.style.display = 'block';
                }
                showProgramToast('error', 'Invalid Format', msg);
                fileInput.value = '';
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                const msg = 'Image exceeds 5MB limit. Please select an image smaller than 5MB.';
                if (feedbackEl) {
                    feedbackEl.textContent = msg;
                    feedbackEl.style.display = 'block';
                }
                showProgramToast('error', 'File Too Large', msg);
                fileInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const dataUrl = e.target.result;
                if (imageUrlInput) imageUrlInput.value = dataUrl;
                if (previewImg) previewImg.src = dataUrl;
                if (fileNameEl) fileNameEl.textContent = file.name;
                const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                if (fileSizeEl) fileSizeEl.textContent = `${sizeMb} MB`;

                if (dropzone) dropzone.classList.add('d-none');
                if (previewBox) {
                    previewBox.classList.remove('d-none');
                    previewBox.classList.add('d-flex');
                }
            };
            reader.onerror = function () {
                showProgramToast('error', 'Read Error', 'Failed to load the selected image file. Please try again.');
                fileInput.value = '';
            };
            reader.readAsDataURL(file);
        }

        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                handleFile(this.files[0]);
            }
        });

        // Drag and drop support
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files[0]) {
                handleFile(dt.files[0]);
            }
        });

        if (replaceBtn) {
            replaceBtn.addEventListener('click', function (e) {
                e.preventDefault();
                fileInput.value = '';
                fileInput.click();
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                resetProgramImage();
            });
        }
    }

    function resetProgramImage() {
        const dropzone = document.getElementById('programImageDropzone');
        const fileInput = document.getElementById('programImageFile');
        const previewBox = document.getElementById('programImagePreviewBox');
        const previewImg = document.getElementById('programImagePreviewImg');
        const imageUrlInput = document.getElementById('programImageUrl');
        const feedbackEl = document.getElementById('programImageFeedback');

        if (fileInput) fileInput.value = '';
        if (imageUrlInput) imageUrlInput.value = '';
        if (previewImg) previewImg.src = '';
        if (feedbackEl) feedbackEl.style.display = 'none';

        if (previewBox) {
            previewBox.classList.add('d-none');
            previewBox.classList.remove('d-flex');
        }
        if (dropzone) {
            dropzone.classList.remove('d-none');
        }
    }

    function setProgramImagePreview(url, name = 'Program Cover Image') {
        const dropzone = document.getElementById('programImageDropzone');
        const previewBox = document.getElementById('programImagePreviewBox');
        const previewImg = document.getElementById('programImagePreviewImg');
        const fileNameEl = document.getElementById('programImageFileName');
        const fileSizeEl = document.getElementById('programImageFileSize');
        const imageUrlInput = document.getElementById('programImageUrl');

        if (!url) {
            resetProgramImage();
            return;
        }

        if (imageUrlInput) imageUrlInput.value = url;
        if (previewImg) previewImg.src = url;
        if (fileNameEl) fileNameEl.textContent = name;
        if (fileSizeEl) fileSizeEl.textContent = 'Existing Image';

        if (dropzone) dropzone.classList.add('d-none');
        if (previewBox) {
            previewBox.classList.remove('d-none');
            previewBox.classList.add('d-flex');
        }
    }

    // ==========================================
    // 3. CUSTOM PROGRAM LOGO UPLOADER
    // ==========================================
    function setupProgramLogoUpload() {
        const dropzone = document.getElementById('programLogoDropzone');
        const fileInput = document.getElementById('programLogoFile');
        const previewBox = document.getElementById('programLogoPreviewBox');
        const previewImg = document.getElementById('programLogoPreviewImg');
        const fileNameEl = document.getElementById('programLogoFileName');
        const fileSizeEl = document.getElementById('programLogoFileSize');
        const logoUrlInput = document.getElementById('programLogoUrl');
        const replaceBtn = document.getElementById('replaceProgramLogoBtn');
        const removeBtn = document.getElementById('removeProgramLogoBtn');

        const visualPreviewBadge = document.getElementById('programVisualPreviewBadge');
        const visualPreviewTitle = document.getElementById('programVisualPreviewTitle');
        const visualPreviewDesc = document.getElementById('programVisualPreviewDesc');
        const iconSelect = document.getElementById('programIconSelect');

        function updateVisualPreview() {
            const hasCustomLogo = logoUrlInput && logoUrlInput.value.trim() !== '';
            const selectedIcon = iconSelect ? iconSelect.value : 'bi-laptop';

            if (hasCustomLogo) {
                if (visualPreviewTitle) visualPreviewTitle.textContent = 'Custom Logo Active';
                if (visualPreviewDesc) visualPreviewDesc.textContent = 'Custom logo will be used in program listings and headers.';
                if (visualPreviewBadge) {
                    visualPreviewBadge.innerHTML = `<img src="${logoUrlInput.value}" alt="Logo" class="w-100 h-100 object-fit-contain rounded">`;
                }
            } else {
                if (visualPreviewTitle) visualPreviewTitle.textContent = 'Predefined Icon Active';
                if (visualPreviewDesc) visualPreviewDesc.textContent = 'If no custom logo is uploaded, the selected icon is used.';
                if (visualPreviewBadge) {
                    visualPreviewBadge.innerHTML = `<i class="bi ${escapeHtml(selectedIcon)} text-primary fs-5"></i>`;
                }
            }
        }

        if (iconSelect) {
            iconSelect.addEventListener('change', updateVisualPreview);
        }

        if (!dropzone || !fileInput) return;

        function handleFile(file) {
            if (!file) return;

            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!validTypes.includes(file.type.toLowerCase())) {
                showProgramToast('danger', 'Invalid Format', 'Please upload a JPG, PNG, or WebP logo.');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showProgramToast('danger', 'File Too Large', 'Custom logo must be 2MB or smaller.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const dataUrl = e.target.result;
                if (logoUrlInput) logoUrlInput.value = dataUrl;
                if (previewImg) previewImg.src = dataUrl;
                if (fileNameEl) fileNameEl.textContent = file.name;
                if (fileSizeEl) fileSizeEl.textContent = `${(file.size / 1024).toFixed(0)} KB`;

                if (dropzone) dropzone.classList.add('d-none');
                if (previewBox) {
                    previewBox.classList.remove('d-none');
                    previewBox.classList.add('d-flex');
                }
                updateVisualPreview();
            };
            reader.readAsDataURL(file);
        }

        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                handleFile(this.files[0]);
            }
        });

        // Drag and drop support
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files[0]) {
                handleFile(dt.files[0]);
            }
        });

        if (replaceBtn) {
            replaceBtn.addEventListener('click', function (e) {
                e.preventDefault();
                fileInput.click();
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                resetProgramLogo();
            });
        }
    }

    function resetProgramLogo() {
        const dropzone = document.getElementById('programLogoDropzone');
        const fileInput = document.getElementById('programLogoFile');
        const previewBox = document.getElementById('programLogoPreviewBox');
        const previewImg = document.getElementById('programLogoPreviewImg');
        const logoUrlInput = document.getElementById('programLogoUrl');
        const visualPreviewBadge = document.getElementById('programVisualPreviewBadge');
        const visualPreviewTitle = document.getElementById('programVisualPreviewTitle');
        const visualPreviewDesc = document.getElementById('programVisualPreviewDesc');
        const iconSelect = document.getElementById('programIconSelect');

        if (fileInput) fileInput.value = '';
        if (logoUrlInput) logoUrlInput.value = '';
        if (previewImg) previewImg.src = '';

        if (previewBox) {
            previewBox.classList.add('d-none');
            previewBox.classList.remove('d-flex');
        }
        if (dropzone) {
            dropzone.classList.remove('d-none');
        }

        if (visualPreviewTitle) visualPreviewTitle.textContent = 'Predefined Icon Active';
        if (visualPreviewDesc) visualPreviewDesc.textContent = 'If no custom logo is uploaded, the selected icon is used.';
        if (visualPreviewBadge && iconSelect) {
            visualPreviewBadge.innerHTML = `<i class="bi ${escapeHtml(iconSelect.value || 'bi-laptop')} text-primary fs-5"></i>`;
        }
    }

    function setProgramLogoPreview(url, name = 'Custom Logo') {
        const dropzone = document.getElementById('programLogoDropzone');
        const previewBox = document.getElementById('programLogoPreviewBox');
        const previewImg = document.getElementById('programLogoPreviewImg');
        const fileNameEl = document.getElementById('programLogoFileName');
        const fileSizeEl = document.getElementById('programLogoFileSize');
        const logoUrlInput = document.getElementById('programLogoUrl');
        const visualPreviewBadge = document.getElementById('programVisualPreviewBadge');
        const visualPreviewTitle = document.getElementById('programVisualPreviewTitle');
        const visualPreviewDesc = document.getElementById('programVisualPreviewDesc');

        if (!url) {
            resetProgramLogo();
            return;
        }

        if (logoUrlInput) logoUrlInput.value = url;
        if (previewImg) previewImg.src = url;
        if (fileNameEl) fileNameEl.textContent = name;
        if (fileSizeEl) fileSizeEl.textContent = 'Existing Logo';

        if (dropzone) dropzone.classList.add('d-none');
        if (previewBox) {
            previewBox.classList.remove('d-none');
            previewBox.classList.add('d-flex');
        }

        if (visualPreviewTitle) visualPreviewTitle.textContent = 'Custom Logo Active';
        if (visualPreviewDesc) visualPreviewDesc.textContent = 'Custom logo will be used in program listings and headers.';
        if (visualPreviewBadge) {
            visualPreviewBadge.innerHTML = `<img src="${url}" alt="Logo" class="w-100 h-100 object-fit-contain rounded">`;
        }
    }

    // Featured Toggle Handler
    const programFeaturedToggle = document.getElementById('programFeaturedToggle');
    const featuredToggleLabel = document.getElementById('featuredToggleLabel');
    if (programFeaturedToggle && featuredToggleLabel) {
        programFeaturedToggle.addEventListener('change', function () {
            if (this.checked) {
                featuredToggleLabel.textContent = 'ON';
                featuredToggleLabel.className = 'form-check-label text-xs fw-bold text-primary';
            } else {
                featuredToggleLabel.textContent = 'OFF';
                featuredToggleLabel.className = 'form-check-label text-xs fw-bold text-muted';
            }
        });
    }

    // Attach real-time input listeners for validation
    const programTitleInput = document.getElementById('programTitle');
    if (programTitleInput) {
        programTitleInput.addEventListener('input', function () {
            if (this.value.trim().length >= 3) setFieldValid('programTitle');
        });
        programTitleInput.addEventListener('blur', function () {
            if (!this.value.trim()) setFieldInvalid('programTitle', 'programTitleFeedback', 'Program title is required.');
            else if (this.value.trim().length < 3) setFieldInvalid('programTitle', 'programTitleFeedback', 'Program title must be at least 3 characters.');
            else setFieldValid('programTitle');
        });
    }

    const programDegreeSelect = document.getElementById('programDegree');
    if (programDegreeSelect) {
        programDegreeSelect.addEventListener('change', function () {
            if (this.value) setFieldValid('programDegree');
            else setFieldInvalid('programDegree', 'programDegreeFeedback', 'Please select a degree type.');
        });
    }

    const programDurationInput = document.getElementById('programDuration');
    if (programDurationInput) {
        programDurationInput.addEventListener('input', function () {
            if (this.value.trim()) setFieldValid('programDuration');
            else setFieldInvalid('programDuration', 'programDurationFeedback', 'Duration is required.');
        });
    }

    const programCategorySelect = document.getElementById('programCategorySelect');
    if (programCategorySelect) {
        programCategorySelect.addEventListener('change', function () {
            if (this.value) setFieldValid('programCategorySelect');
            else setFieldInvalid('programCategorySelect', 'programCategoryFeedback', 'Please select a category.');
        });
    }

    const programCreditsInput = document.getElementById('programCredits');
    if (programCreditsInput) {
        programCreditsInput.addEventListener('input', function () {
            const num = Number(this.value);
            if (this.value === '' || (!isNaN(num) && num > 0 && num <= 500)) setFieldValid('programCredits');
            else setFieldInvalid('programCredits', 'programCreditsFeedback', 'Credits must be a positive number.');
        });
    }

    const programCodeInput = document.getElementById('programCode');
    if (programCodeInput) {
        programCodeInput.addEventListener('input', function () {
            if (this.classList.contains('is-invalid')) {
                setFieldValid('programCode');
            }
        });
    }

    const programStatusSelect = document.getElementById('programStatus');
    if (programStatusSelect) {
        programStatusSelect.addEventListener('change', function () {
            if (this.value) setFieldValid('programStatus');
            else setFieldInvalid('programStatus', 'programStatusFeedback', 'Please select a status.');
        });
    }

    // Open Create Program Modal
    window.openCreateProgramModal = function () {
        const form = document.getElementById('programForm');
        if (form) form.reset();

        isSubmittingProgram = false;
        const submitBtn = document.getElementById('submitProgramBtn');
        if (submitBtn) submitBtn.disabled = false;
        const submitSpinner = document.getElementById('submitProgramSpinner');
        if (submitSpinner) submitSpinner.classList.add('d-none');
        const submitBtnText = document.getElementById('submitProgramBtnText');
        if (submitBtnText) submitBtnText.textContent = 'Publish';
        const saveDraftBtn = document.getElementById('saveDraftProgramBtn');
        if (saveDraftBtn) saveDraftBtn.disabled = false;
        const saveDraftSpinner = document.getElementById('saveDraftProgramSpinner');
        if (saveDraftSpinner) saveDraftSpinner.classList.add('d-none');
        const saveDraftBtnText = document.getElementById('saveDraftProgramBtnText');
        if (saveDraftBtnText) saveDraftBtnText.textContent = 'Save as Draft';

        const idEl = document.getElementById('programId');
        if (idEl) idEl.value = '';
        const titleEl = document.getElementById('programModalTitle');
        if (titleEl) titleEl.textContent = 'Add New Program';
        const subTitleEl = document.getElementById('programModalSubtitle');
        if (subTitleEl) subTitleEl.textContent = 'Add a new academic program to AUB Digital Academy.';

        clearProgramValidation();
        resetProgramImage();
        resetProgramLogo();

        const durEl = document.getElementById('programDuration');
        if (durEl) durEl.value = '4 Years';
        const credEl = document.getElementById('programCredits');
        if (credEl) credEl.value = '120';
        const orderEl = document.getElementById('programOrderNum');
        if (orderEl) orderEl.value = (allPrograms.length + 1);
        const themeEl = document.getElementById('programThemeSelect');
        if (themeEl) themeEl.value = 'theme-blue';
        const iconEl = document.getElementById('programIconSelect');
        if (iconEl) iconEl.value = 'bi-laptop';
        const statusEl = document.getElementById('programStatus');
        if (statusEl) statusEl.value = 'Published';
        
        if (programFeaturedToggle) {
            programFeaturedToggle.checked = true;
            if (featuredToggleLabel) {
                featuredToggleLabel.textContent = 'ON';
                featuredToggleLabel.className = 'form-check-label text-xs fw-bold text-primary';
            }
        }

        selectedProgramInstructors = [];
        programLearningOutcomes = [];
        instructorSearchQuery = '';
        if (typeof window.closeInstructorDropdown === 'function') window.closeInstructorDropdown();
        const searchInput = document.getElementById('instructorSearchInput');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clearInstructorSearchBtn');
        if (clearBtn) clearBtn.classList.add('d-none');

        renderProgramInstructorChips();
        renderInstructorDropdownList('');
        renderProgramLearningOutcomes();
        loadCategoriesForProgramModal();
        loadInstructorsForProgramModal();

        const modalEl = document.getElementById('createProgramModal');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (modalInstance) modalInstance.show();
        }
    };

    // Open Edit Program Modal
    window.openEditProgramModal = function (id) {
        let p = allPrograms.find(prog => Number(prog.id) === Number(id));
        if (!p && window.AdminStore && typeof window.AdminStore.getPrograms === 'function') {
            p = window.AdminStore.getPrograms().find(prog => Number(prog.id) === Number(id));
        }
        if (!p) return;

        const form = document.getElementById('programForm');
        if (form) form.reset();

        clearProgramValidation();

        isSubmittingProgram = false;
        const submitBtn = document.getElementById('submitProgramBtn');
        if (submitBtn) submitBtn.disabled = false;
        const submitSpinner = document.getElementById('submitProgramSpinner');
        if (submitSpinner) submitSpinner.classList.add('d-none');
        const saveDraftBtn = document.getElementById('saveDraftProgramBtn');
        if (saveDraftBtn) saveDraftBtn.disabled = false;
        const saveDraftSpinner = document.getElementById('saveDraftProgramSpinner');
        if (saveDraftSpinner) saveDraftSpinner.classList.add('d-none');
        const saveDraftBtnText = document.getElementById('saveDraftProgramBtnText');
        if (saveDraftBtnText) saveDraftBtnText.textContent = 'Save as Draft';

        const idEl = document.getElementById('programId');
        if (idEl) idEl.value = p.id;
        const titleEl = document.getElementById('programModalTitle');
        if (titleEl) titleEl.textContent = 'Edit Academic Program';
        const subTitleEl = document.getElementById('programModalSubtitle');
        if (subTitleEl) subTitleEl.textContent = `Update program details for ${p.title}.`;
        const submitBtnText = document.getElementById('submitProgramBtnText');
        if (submitBtnText) submitBtnText.textContent = 'Save Changes';

        const pTitle = document.getElementById('programTitle');
        if (pTitle) pTitle.value = p.title || '';
        const pCode = document.getElementById('programCode');
        if (pCode) pCode.value = p.code || (p.slug ? p.slug.toUpperCase() : '');
        const pShortDesc = document.getElementById('programShortDesc');
        if (pShortDesc) pShortDesc.value = p.short_description || '';
        const pDegree = document.getElementById('programDegree');
        if (pDegree) pDegree.value = p.degree_type || "Bachelor Degree";
        const pDur = document.getElementById('programDuration');
        if (pDur) pDur.value = p.duration || '4 Years';
        const pCred = document.getElementById('programCredits');
        if (pCred) pCred.value = p.credits || '120';
        const pOrder = document.getElementById('programOrderNum');
        if (pOrder) pOrder.value = p.order_num !== undefined ? p.order_num : 1;
        const pTheme = document.getElementById('programThemeSelect');
        if (pTheme) pTheme.value = p.theme_class || 'theme-blue';
        const pIcon = document.getElementById('programIconSelect');
        if (pIcon) pIcon.value = p.icon_class || 'bi-laptop';
        const pFullDesc = document.getElementById('programFullDesc');
        if (pFullDesc) pFullDesc.value = p.description || p.full_description || '';
        const pStatus = document.getElementById('programStatus');
        if (pStatus) pStatus.value = p.status || (p.is_published === 1 ? 'Published' : 'Draft');

        if (programFeaturedToggle) {
            const isFeat = p.is_featured === 1 || p.is_featured === true;
            programFeaturedToggle.checked = isFeat;
            if (featuredToggleLabel) {
                featuredToggleLabel.textContent = isFeat ? 'ON' : 'OFF';
                featuredToggleLabel.className = `form-check-label text-xs fw-bold ${isFeat ? 'text-primary' : 'text-muted'}`;
            }
        }

        // Set Cover Image
        if (p.image_url) {
            setProgramImagePreview(p.image_url, `${p.title} Cover`);
        } else {
            resetProgramImage();
        }

        // Set Custom Logo
        if (p.logo_url || p.custom_logo) {
            setProgramLogoPreview(p.logo_url || p.custom_logo, `${p.title} Logo`);
        } else {
            resetProgramLogo();
        }

        // Parse Learning Outcomes
        if (p.learning_outcomes) {
            try {
                programLearningOutcomes = Array.isArray(p.learning_outcomes)
                    ? p.learning_outcomes
                    : JSON.parse(p.learning_outcomes);
            } catch (e) {
                programLearningOutcomes = [p.learning_outcomes];
            }
        } else {
            programLearningOutcomes = [];
        }
        renderProgramLearningOutcomes();

        // Parse Instructors
        selectedProgramInstructors = [];
        if (p.instructor_ids) {
            let instIds = [];
            try {
                instIds = Array.isArray(p.instructor_ids) ? p.instructor_ids : JSON.parse(p.instructor_ids);
            } catch (e) {
                instIds = [p.instructor_ids];
            }
            instIds.forEach(instId => {
                const found = allInstructors.find(i => Number(i.id) === Number(instId));
                if (found) {
                    selectedProgramInstructors.push({ id: found.id, name: found.name, title: found.title || '' });
                }
            });
        }
        instructorSearchQuery = '';
        if (typeof window.closeInstructorDropdown === 'function') window.closeInstructorDropdown();
        const searchInput = document.getElementById('instructorSearchInput');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clearInstructorSearchBtn');
        if (clearBtn) clearBtn.classList.add('d-none');

        renderProgramInstructorChips();
        renderInstructorDropdownList('');

        loadCategoriesForProgramModal(p.category_id);
        loadInstructorsForProgramModal();

        const modalEl = document.getElementById('createProgramModal');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (modalInstance) modalInstance.show();
        }
    };

    // Attach Add Button Click Event Directly
    const openAddProgramBtn = document.getElementById('openAddProgramBtn');
    if (openAddProgramBtn) {
        openAddProgramBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.openCreateProgramModal();
        });
    }

    // Modal Lifecycle Listeners for Accessibility & Focus Trap
    if (programModalEl) {
        programModalEl.addEventListener('shown.bs.modal', function () {
            const titleInput = document.getElementById('programTitle');
            if (titleInput) titleInput.focus();
        });
        programModalEl.addEventListener('hidden.bs.modal', function () {
            clearProgramValidation();
            const addBtn = document.getElementById('openAddProgramBtn');
            if (addBtn) addBtn.focus();
        });
    }

    // Initialize Program Image, Logo & Instructor Dropdown Listeners
    setupProgramImageUpload();
    setupProgramLogoUpload();
    setupInstructorDropdownEvents();

    // Hook up Save as Draft Button (Independent dedicated draft action)
    const saveDraftProgramBtn = document.getElementById('saveDraftProgramBtn');
    if (saveDraftProgramBtn) {
        saveDraftProgramBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            if (isSubmittingProgram) return;

            // Validate ONLY minimum required info (Program Title)
            const titleEl = document.getElementById('programTitle');
            const titleVal = titleEl ? titleEl.value.trim() : '';
            if (!titleVal || titleVal.length < 3) {
                setFieldInvalid('programTitle', 'programTitleFeedback', 'Please enter a program title (minimum 3 characters) to save as draft.');
                if (titleEl) {
                    try { titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); titleEl.focus(); } catch (err) { titleEl.focus(); }
                }
                showProgramToast('error', 'Validation Error', 'Please enter a program title to save as draft.');
                return;
            }

            const id = document.getElementById('programId')?.value;
            const code = document.getElementById('programCode')?.value.trim() || '';
            const shortDesc = document.getElementById('programShortDesc')?.value.trim() || '';
            const degreeType = document.getElementById('programDegree')?.value.trim() || 'Bachelor Degree';
            const categoryId = document.getElementById('programCategorySelect')?.value;
            const duration = document.getElementById('programDuration')?.value.trim() || '4 Years';
            const creditsVal = document.getElementById('programCredits')?.value.trim();
            const credits = creditsVal ? Number(creditsVal) : 120;
            const orderNumVal = document.getElementById('programOrderNum')?.value;
            const orderNum = orderNumVal ? Number(orderNumVal) : (allPrograms.length + 1);
            const themeClass = document.getElementById('programThemeSelect')?.value || 'theme-blue';
            const iconClass = document.getElementById('programIconSelect')?.value || 'bi-laptop';
            const fullDesc = document.getElementById('programFullDesc')?.value.trim() || '';
            const imageUrl = document.getElementById('programImageUrl')?.value.trim() || '';
            const logoUrl = document.getElementById('programLogoUrl')?.value.trim() || '';
            const isFeatured = programFeaturedToggle ? (programFeaturedToggle.checked ? 1 : 0) : 0;

            const outcomes = programLearningOutcomes.filter(o => o && o.trim().length > 0);
            const instructorIds = selectedProgramInstructors.map(i => i.id);
            const effectiveDesc = fullDesc || shortDesc || `${titleVal} academic program draft.`;

            const payload = {
                title: titleVal,
                code: code,
                slug: code ? code.toLowerCase() : titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                short_description: shortDesc,
                description: effectiveDesc,
                full_description: fullDesc || effectiveDesc,
                degree_type: degreeType,
                category_id: categoryId ? Number(categoryId) : null,
                duration: duration,
                credits: credits,
                image_url: imageUrl,
                logo_url: logoUrl,
                learning_outcomes: outcomes,
                instructor_ids: instructorIds,
                status: 'Draft',
                is_featured: isFeatured,
                is_published: 0,
                icon_class: iconClass,
                theme_class: themeClass,
                order_num: orderNum
            };

            const submitBtn = document.getElementById('submitProgramBtn');
            const saveDraftSpinner = document.getElementById('saveDraftProgramSpinner');
            const saveDraftBtnText = document.getElementById('saveDraftProgramBtnText');

            isSubmittingProgram = true;
            if (saveDraftProgramBtn) saveDraftProgramBtn.disabled = true;
            if (submitBtn) submitBtn.disabled = true;
            if (saveDraftSpinner) saveDraftSpinner.classList.remove('d-none');
            if (saveDraftBtnText) saveDraftBtnText.textContent = 'Saving Draft...';

            try {
                if (window.academicService && typeof window.academicService.createProgram === 'function') {
                    if (id) {
                        await window.academicService.updateProgram(id, payload);
                    } else {
                        await window.academicService.createProgram(payload);
                    }
                }

                // 1. Close Modal
                const modalEl = document.getElementById('createProgramModal');
                if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }

                // 2. Success notification
                showProgramToast('success', 'Draft Saved', 'Program saved as draft.');

                // 3. Force refresh table immediately
                await loadPrograms(true);

                // 4. Reset form state
                const progForm = document.getElementById('programForm');
                if (progForm) progForm.reset();
                clearProgramValidation();
                resetProgramImage();
                resetProgramLogo();
                selectedProgramInstructors = [];
                programLearningOutcomes = [];
                renderProgramInstructorChips();
                renderProgramLearningOutcomes();

            } catch (err) {
                console.error('[AcademicManagement] Save Draft error:', err);
                showProgramToast('error', 'Draft Save Failed', err.message || 'Unable to save draft.');
            } finally {
                isSubmittingProgram = false;
                if (saveDraftProgramBtn) saveDraftProgramBtn.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
                if (saveDraftSpinner) saveDraftSpinner.classList.add('d-none');
                if (saveDraftBtnText) saveDraftBtnText.textContent = 'Save as Draft';
            }
        });
    }

    // Hook up Publish / Submit Program Button
    const submitProgramBtn = document.getElementById('submitProgramBtn');
    if (submitProgramBtn) {
        submitProgramBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const form = document.getElementById('programForm');
            if (form) {
                if (typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                } else {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }
        });
    }

    // Program Form Submission Handler (Publish / Save Changes Flow)
    const programForm = document.getElementById('programForm');
    if (programForm) {
        programForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (isSubmittingProgram) return;

            // Run Validation on Required Fields (Title *, Degree *, Category *, Status *)
            const { isValid, firstInvalidEl } = validateProgramForm();
            if (!isValid) {
                if (firstInvalidEl) firstInvalidEl.focus();
                showProgramToast('error', 'Validation Error', 'Please correct the required fields in the form.');
                return;
            }

            const id = document.getElementById('programId')?.value;
            const title = document.getElementById('programTitle')?.value.trim() || '';
            const code = document.getElementById('programCode')?.value.trim() || '';
            const shortDesc = document.getElementById('programShortDesc')?.value.trim() || '';
            const degreeType = document.getElementById('programDegree')?.value.trim() || 'Bachelor Degree';
            const categoryId = document.getElementById('programCategorySelect')?.value;
            const duration = document.getElementById('programDuration')?.value.trim() || '4 Years';
            const creditsVal = document.getElementById('programCredits')?.value.trim();
            const credits = creditsVal ? Number(creditsVal) : 120;
            const orderNumVal = document.getElementById('programOrderNum') ? document.getElementById('programOrderNum').value : '';
            const orderNum = orderNumVal ? Number(orderNumVal) : (allPrograms.length + 1);
            const themeClass = document.getElementById('programThemeSelect') ? document.getElementById('programThemeSelect').value : 'theme-blue';
            const iconClass = document.getElementById('programIconSelect') ? document.getElementById('programIconSelect').value : 'bi-laptop';
            const fullDesc = document.getElementById('programFullDesc')?.value.trim() || '';
            const imageUrl = document.getElementById('programImageUrl') ? document.getElementById('programImageUrl').value.trim() : '';
            const logoUrl = document.getElementById('programLogoUrl') ? document.getElementById('programLogoUrl').value.trim() : '';
            const status = document.getElementById('programStatus')?.value || 'Published';
            const isFeatured = programFeaturedToggle ? (programFeaturedToggle.checked ? 1 : 0) : 1;
            const isPublished = status === 'Draft' ? 0 : 1;

            // Duplicate Program Protection (Client-side pre-check)
            if (Array.isArray(allPrograms)) {
                const existingDuplicate = allPrograms.find(p => {
                    if (id && Number(p.id) === Number(id)) return false;
                    const sameCode = code && p.code && p.code.trim().toLowerCase() === code.toLowerCase();
                    const sameTitle = p.title && p.title.trim().toLowerCase() === title.toLowerCase();
                    return sameCode || sameTitle;
                });

                if (existingDuplicate) {
                    const isCodeDupe = code && existingDuplicate.code && existingDuplicate.code.trim().toLowerCase() === code.toLowerCase();
                    const msg = isCodeDupe 
                        ? 'An academic program with this code already exists.' 
                        : 'An academic program with this title already exists.';
                    const fieldId = isCodeDupe ? 'programCode' : 'programTitle';
                    const feedbackId = isCodeDupe ? 'programCodeFeedback' : 'programTitleFeedback';
                    
                    setFieldInvalid(fieldId, feedbackId, msg);
                    const fieldEl = document.getElementById(fieldId);
                    if (fieldEl) {
                        try { fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); fieldEl.focus(); } catch (e) { fieldEl.focus(); }
                    }
                    showProgramToast('error', 'Duplicate Program', msg);
                    return;
                }
            }

            // Filter valid outcomes
            const outcomes = programLearningOutcomes.filter(o => o && o.trim().length > 0);
            const instructorIds = selectedProgramInstructors.map(i => i.id);

            const effectiveDesc = fullDesc || shortDesc || `${title} academic program at AUB Digital Academy.`;

            const payload = {
                title: title,
                code: code,
                slug: code ? code.toLowerCase() : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                short_description: shortDesc,
                description: effectiveDesc,
                full_description: fullDesc || effectiveDesc,
                degree_type: degreeType,
                category_id: categoryId ? Number(categoryId) : null,
                duration: duration,
                credits: credits,
                image_url: imageUrl,
                logo_url: logoUrl,
                learning_outcomes: outcomes,
                instructor_ids: instructorIds,
                status: status,
                is_featured: isFeatured,
                is_published: isPublished,
                icon_class: iconClass,
                theme_class: themeClass,
                order_num: orderNum
            };

            // Loading state on button [ Publishing... ] / [ Saving... ]
            const submitBtn = document.getElementById('submitProgramBtn');
            const submitSpinner = document.getElementById('submitProgramSpinner');
            const submitBtnText = document.getElementById('submitProgramBtnText');
            const saveDraftBtn = document.getElementById('saveDraftProgramBtn');

            isSubmittingProgram = true;
            if (submitBtn) submitBtn.disabled = true;
            if (saveDraftBtn) saveDraftBtn.disabled = true;
            if (submitSpinner) submitSpinner.classList.remove('d-none');
            if (submitBtnText) submitBtnText.textContent = id ? 'Saving...' : 'Publishing...';

            try {
                if (window.academicService && typeof window.academicService.createProgram === 'function') {
                    if (id) {
                        await window.academicService.updateProgram(id, payload);
                    } else {
                        await window.academicService.createProgram(payload);
                    }
                } else {
                    const url = id ? `${API_BASE}/admin/programs/${id}` : `${API_BASE}/admin/programs`;
                    const method = id ? 'PUT' : 'POST';

                    const res = await fetch(url, {
                        method: method,
                        headers: getHeaders(),
                        body: JSON.stringify(payload)
                    });

                    if (res.status === 409) {
                        const errData = await res.json().catch(() => ({}));
                        const msg = errData.message || 'An academic program with this code already exists.';
                        setFieldInvalid('programCode', 'programCodeFeedback', msg);
                        const codeEl = document.getElementById('programCode');
                        if (codeEl) {
                            try { codeEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); codeEl.focus(); } catch (e) { codeEl.focus(); }
                        }
                        showProgramToast('error', 'Duplicate Program', msg);
                        return;
                    }

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.message || 'Unable to create program. Please try again.');
                    }
                }

                // 1. Close Modal
                const modalEl = document.getElementById('createProgramModal');
                if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }

                // 2. Success notification
                showProgramToast('success', id ? 'Program Updated' : 'Program Created', id ? 'Program updated successfully.' : 'Program published successfully.');

                // 3. Force refresh table immediately from backend database / store
                await loadPrograms(true);

                // 4. Reset form state after success
                if (programForm) programForm.reset();
                clearProgramValidation();
                resetProgramImage();
                resetProgramLogo();
                selectedProgramInstructors = [];
                programLearningOutcomes = [];
                renderProgramInstructorChips();
                renderProgramLearningOutcomes();

            } catch (err) {
                console.error('[AcademicManagement] Submit error:', err);
                if (err.isDuplicate || err.status === 409) {
                    const fieldId = err.field || 'programCode';
                    const feedbackId = fieldId === 'programTitle' ? 'programTitleFeedback' : 'programCodeFeedback';
                    const msg = err.message || 'An academic program with this code already exists.';
                    setFieldInvalid(fieldId, feedbackId, msg);
                    const el = document.getElementById(fieldId);
                    if (el) {
                        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); } catch (e) { el.focus(); }
                    }
                    showProgramToast('error', 'Duplicate Program', msg);
                } else if (err.isNetworkError || err.name === 'TypeError' || (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')))) {
                    showProgramToast('error', 'Connection Error', 'Backend server unreachable. Please make sure the server is running.');
                } else {
                    showProgramToast('error', 'Publish Failed', err.message || 'Unable to publish program. Please try again.');
                }
            } finally {
                isSubmittingProgram = false;
                if (submitBtn) submitBtn.disabled = false;
                if (saveDraftBtn) saveDraftBtn.disabled = false;
                if (submitSpinner) submitSpinner.classList.add('d-none');
                if (submitBtnText) submitBtnText.textContent = id ? 'Save Changes' : 'Publish';
            }
        });
    }

    // View Program Details Modal Handler
    window.viewProgram = function (id) {
        let p = allPrograms.find(prog => Number(prog.id) === Number(id));
        if (!p && window.AdminStore && typeof window.AdminStore.getPrograms === 'function') {
            p = window.AdminStore.getPrograms().find(prog => Number(prog.id) === Number(id));
        }
        if (!p) return;

        const titleEl = document.getElementById('viewProgramTitle');
        const degreeEl = document.getElementById('viewProgramDegree');
        const statusEl = document.getElementById('viewProgramStatus');
        const bodyEl = document.getElementById('viewProgramBody');
        const editBtn = document.getElementById('viewProgramEditBtn');

        if (titleEl) titleEl.textContent = p.title || 'Program Details';
        if (degreeEl) degreeEl.textContent = p.degree_type || 'Bachelor Degree';
        if (statusEl) {
            const isPub = p.is_published === 1 || p.is_published === true || (p.status && p.status.toLowerCase() === 'published');
            statusEl.textContent = isPub ? 'Published' : 'Draft';
            statusEl.className = `badge ${isPub ? 'bg-success' : 'bg-secondary'}`;
        }

        if (editBtn) {
            editBtn.onclick = function () {
                const viewModalEl = document.getElementById('viewProgramModal');
                if (viewModalEl && typeof bootstrap !== 'undefined') {
                    const vm = bootstrap.Modal.getInstance(viewModalEl);
                    if (vm) vm.hide();
                }
                setTimeout(() => window.openEditProgramModal(p.id), 250);
            };
        }

        if (bodyEl) {
            let catName = 'Computer Science';
            const allCats = (allCategories && allCategories.length > 0) ? allCategories : (window.AdminStore && typeof window.AdminStore.getCategories === 'function' ? window.AdminStore.getCategories() : []);
            if (p.category_id && allCats.length > 0) {
                const cat = allCats.find(c => Number(c.id) === Number(p.category_id) || String(c.id) === String(p.category_id) || c.name.toLowerCase() === String(p.category_id).toLowerCase());
                if (cat) catName = cat.name;
            } else if (p.category_name) {
                catName = p.category_name;
            }

            let outcomesList = [];
            if (p.learning_outcomes) {
                try {
                    outcomesList = Array.isArray(p.learning_outcomes) ? p.learning_outcomes : JSON.parse(p.learning_outcomes);
                } catch (e) {
                    outcomesList = [p.learning_outcomes];
                }
            }

            let instructorNames = [];
            if (p.instructor_ids && window.AdminStore && typeof window.AdminStore.getInstructors === 'function') {
                let instIds = [];
                try {
                    instIds = Array.isArray(p.instructor_ids) ? p.instructor_ids : JSON.parse(p.instructor_ids);
                } catch (e) {
                    instIds = [p.instructor_ids];
                }
                const allInsts = window.AdminStore.getInstructors();
                instructorNames = instIds.map(iId => {
                    const found = allInsts.find(i => Number(i.id) === Number(iId));
                    return found ? found.name : null;
                }).filter(Boolean);
            }

            const themeClass = p.theme_class || 'theme-blue';
            const themeColor = THEME_COLOR_MAP[themeClass] || '#2563eb';
            const logoUrl = p.logo_url || p.custom_logo || '';
            const imgUrl = p.image_url || '';

            bodyEl.innerHTML = `
                <div class="row g-4">
                    ${imgUrl ? `
                    <div class="col-12">
                        <div class="rounded-3 overflow-hidden border" style="max-height: 200px;">
                            <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.title)}" class="w-100 h-100 object-fit-cover">
                        </div>
                    </div>
                    ` : ''}
                    <div class="col-md-6">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-1">Code</div>
                        <div class="fw-semibold text-dark text-sm">${escapeHtml(p.code || 'N/A')}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-1">Category</div>
                        <div class="fw-semibold text-dark text-sm">${escapeHtml(catName)}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-1">Duration</div>
                        <div class="fw-semibold text-dark text-sm"><i class="bi bi-clock me-1 text-muted"></i>${escapeHtml(p.duration || '4 Years')}</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-1">Credits</div>
                        <div class="fw-semibold text-dark text-sm">${escapeHtml(String(p.credits || 120))} Credits</div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-1">Display Order</div>
                        <div class="fw-semibold text-dark text-sm">#${p.order_num !== undefined ? p.order_num : 1}</div>
                    </div>
                    <div class="col-12">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-1">Description</div>
                        <p class="text-sm text-secondary mb-0" style="line-height: 1.6;">${escapeHtml(p.description || p.full_description || p.short_description || 'No description available.')}</p>
                    </div>
                    ${outcomesList.length > 0 ? `
                    <div class="col-12">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-2">Learning Outcomes</div>
                        <ul class="list-unstyled mb-0 d-flex flex-column gap-1.5">
                            ${outcomesList.map(o => `
                                <li class="text-xs text-dark d-flex align-items-start gap-2">
                                    <i class="bi bi-check-circle-fill text-success mt-0.5" style="font-size: 13px;"></i>
                                    <span>${escapeHtml(o)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${instructorNames.length > 0 ? `
                    <div class="col-12">
                        <div class="text-xs text-muted text-uppercase fw-bold mb-2">Assigned Faculty</div>
                        <div class="d-flex flex-wrap gap-2">
                            ${instructorNames.map(name => `
                                <span class="badge bg-light text-dark border fw-medium px-2.5 py-1.5 text-xs d-inline-flex align-items-center gap-1.5">
                                    <i class="bi bi-person-badge text-primary"></i> ${escapeHtml(name)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        const modalEl = document.getElementById('viewProgramModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (modalInstance) modalInstance.show();
        }
    };

    window.toggleProgramStatus = async function (id) {
        try {
            if (window.academicService && typeof window.academicService.toggleProgramPublish === 'function') {
                const res = await window.academicService.toggleProgramPublish(id);
                showProgramToast('info', 'Status Updated', `Program is now ${res?.is_published ? 'Published' : 'Draft'}`);
            } else {
                await fetch(`${API_BASE}/admin/programs/${id}/toggle-publish`, { method: 'PATCH', headers: getHeaders() });
            }
            await loadPrograms(true);
        } catch (err) {
            showProgramToast('danger', 'Error', err.message || 'Failed to toggle program status.');
            await loadPrograms(true);
        }
    };

    window.deleteProgram = async function (id) {
        let prog = allPrograms.find(p => Number(p.id) === Number(id));
        if (!prog && window.AdminStore && typeof window.AdminStore.getPrograms === 'function') {
            prog = window.AdminStore.getPrograms().find(p => Number(p.id) === Number(id));
        }
        const name = prog ? prog.title : 'this program';

        let confirmed = false;
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete this academic program?',
                text: `Are you sure you want to delete "${name}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                reverseButtons: true
            });
            confirmed = result.isConfirmed;
        } else if (window.AdminStore && typeof window.AdminStore.constructor.confirmDialog === 'function') {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete this academic program?',
                `Are you sure you want to delete "${name}"?`,
                'Delete',
                '#DC2626'
            );
        } else {
            confirmed = confirm(`Delete this academic program?\n\nAre you sure you want to delete "${name}"?`);
        }

        if (!confirmed) return;

        try {
            if (window.academicService && typeof window.academicService.deleteProgram === 'function') {
                await window.academicService.deleteProgram(id);
            } else {
                const res = await fetch(`${API_BASE}/admin/programs/${id}`, { method: 'DELETE', headers: getHeaders() });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Cannot delete program.');
                }
            }

            showProgramToast('success', 'Deleted', `Program "${name}" deleted successfully.`);
            await loadPrograms(true);
        } catch (err) {
            showProgramToast('danger', 'Action Prohibited', err.message || 'Cannot delete program.');
            await loadPrograms(true);
        }
    };

    // ==========================================
    // 2. COURSES MANAGEMENT
    // ==========================================
    async function loadCourses() {
        // Step 1: Render synchronously from cache immediately (0ms)
        if ((!allCourses || allCourses.length === 0) && window.AdminStore) {
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }

        // Step 2: Background fetch from API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${API_BASE}/admin/courses`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    allCourses = data.data;
                    applyCourseFilters();
                }
            }
        } catch (e) {}
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
            const imgSrc = (c.thumbnail_url && (c.thumbnail_url.startsWith('http') || c.thumbnail_url.startsWith('data:')))
                ? c.thumbnail_url
                : ('../../' + (c.thumbnail_url || 'assets/images/course_webdev.jpg'));
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2 cursor-pointer" onclick="openViewCourseModal(${c.id})" title="Click to view course details">
                            <img src="${escapeHtml(imgSrc)}" class="rounded-2 object-fit-cover border" style="width: 44px; height: 32px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=100'">
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
        let c = allCourses.find(course => Number(course.id) === Number(courseId));
        if (!c && window.AdminStore) {
            c = window.AdminStore.getCourseById(courseId);
        }
        if (!c) return;

        activeCourseInView = c;
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id) : [];
        const allLessons = window.AdminStore ? window.AdminStore.getAllLessonsByCourseId(c.id) : [];

        const titleEl = document.getElementById('viewCourseTitle') || document.getElementById('viewCourseModalTitle');
        const catEl = document.getElementById('viewCourseCategory');
        const diffEl = document.getElementById('viewCourseDifficulty');
        const body = document.getElementById('viewCourseBody') || document.getElementById('viewCourseModalBody');
        const editBtn = document.getElementById('viewCourseEditBtn');

        if (titleEl) titleEl.textContent = c.title;
        if (catEl) catEl.textContent = c.category_name || 'Academic';
        if (diffEl) diffEl.textContent = c.difficulty || 'Beginner';

        if (editBtn) {
            editBtn.onclick = function () {
                if (viewCourseModal) viewCourseModal.hide();
                openEditCourseModal(c.id);
            };
        }

        const imgSrc = (c.thumbnail_url && (c.thumbnail_url.startsWith('http') || c.thumbnail_url.startsWith('data:'))) 
            ? c.thumbnail_url 
            : ('../../' + (c.thumbnail_url || 'assets/images/course_webdev.jpg'));

        if (body) {
            body.innerHTML = `
                <!-- Course Hero Card -->
                <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-3 mb-3 border">
                    <img src="${escapeHtml(imgSrc)}" class="rounded-3 object-fit-cover border shadow-sm" style="width: 100px; height: 75px; flex-shrink: 0;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200'">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <span class="badge bg-primary px-2 py-1">${escapeHtml(c.category_name || 'Specialized Course')}</span>
                            <span class="badge bg-light text-dark border px-2 py-1">${escapeHtml(c.difficulty || 'Beginner')}</span>
                            <span class="badge ${c.is_published ? 'bg-success' : 'bg-secondary'} px-2 py-1">${c.is_published ? 'Published' : 'Draft'}</span>
                            ${c.code ? `<span class="badge bg-white text-secondary border px-2 py-1"><i class="bi bi-hash me-0.5"></i>${escapeHtml(c.code)}</span>` : ''}
                            ${c.is_featured ? `<span class="badge bg-warning bg-opacity-15 text-dark border border-warning px-2 py-1"><i class="bi bi-star-fill text-warning me-1"></i>Featured</span>` : ''}
                        </div>
                        <h5 class="fw-bold text-dark mb-1">${escapeHtml(c.title)}</h5>
                        <div class="text-muted" style="font-size: 12px;">
                            <i class="bi bi-person-badge me-1"></i> Instructor: <span class="text-dark fw-semibold">${escapeHtml(c.instructor_name || 'Faculty Staff')}</span> &bull; 
                            <i class="bi bi-clock ms-2 me-1"></i> ${escapeHtml(c.duration || '8 Weeks')} &bull; 
                            <i class="bi bi-people ms-2 me-1"></i> ${c.enrolled_students_count || 0} Enrolled &bull; 
                            <i class="bi bi-star-fill text-warning ms-2 me-1"></i> ${c.rating || '4.8'}
                        </div>
                    </div>
                </div>

                <!-- Course Description -->
                <div class="mb-3">
                    <h6 class="text-xs fw-bold text-uppercase text-muted mb-2">Course Overview</h6>
                    <p class="text-secondary bg-white p-3 rounded-2 border mb-0" style="font-size: 13px; line-height: 1.6;">
                        ${escapeHtml(c.description || c.short_description || 'Comprehensive curriculum designed for student mastery.')}
                    </p>
                </div>

                <!-- Curriculum Summary -->
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-xs fw-bold text-uppercase text-muted mb-0">Curriculum Units (${chapters.length} Modules &bull; ${allLessons.length} Lessons)</h6>
                        <button type="button" class="btn btn-outline-primary btn-sm py-0 px-2 rounded-pill text-xs" onclick="if (viewCourseModal) viewCourseModal.hide(); openCourseContentBuilder(${c.id});">
                            <i class="bi bi-journal-bookmark me-1"></i> Manage Curriculum
                        </button>
                    </div>

                    ${chapters.length === 0 ? `
                        <div class="text-center py-4 text-muted border rounded-2 bg-light" style="font-size: 12.5px;">
                            <i class="bi bi-diagram-3 fs-3 d-block mb-1 text-secondary opacity-50"></i>
                            No curriculum modules registered yet for this course. (0 Lessons)
                        </div>
                    ` : `
                        <div class="d-flex flex-column gap-2" style="max-height: 240px; overflow-y: auto;">
                            ${chapters.map((ch, idx) => {
                                const chLessons = window.AdminStore ? window.AdminStore.getLessonsByModuleId(ch.id) : [];
                                return `
                                    <div class="p-2.5 bg-light rounded-2 border">
                                        <div class="d-flex align-items-center justify-content-between mb-1.5">
                                            <div>
                                                <span class="badge bg-primary me-1.5" style="font-size: 10px;">Module ${ch.chapter_num || idx + 1}</span>
                                                <span class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(ch.title)}</span>
                                            </div>
                                            <span class="badge bg-white text-secondary border" style="font-size: 10.5px;">${escapeHtml(ch.duration || '2 Weeks')}</span>
                                        </div>
                                        <div class="d-flex flex-column gap-1 ms-2 border-start ps-2" style="border-color: #CBD5E1 !important;">
                                            ${chLessons.length === 0 ? `
                                                <span class="text-muted text-xs">No lessons added to this module yet.</span>
                                            ` : chLessons.map(l => `
                                                <div class="d-flex align-items-center justify-content-between text-muted" style="font-size: 11.5px;">
                                                    <span class="text-truncate me-2"><i class="bi bi-play-circle text-primary me-1"></i> <span class="text-dark">${escapeHtml(l.title)}</span></span>
                                                    <span class="badge bg-white text-muted border flex-shrink-0" style="font-size: 10px;">${escapeHtml(l.duration || '45 Mins')}</span>
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

        document.querySelectorAll('.modal-backdrop').forEach(el => {
            if (!document.querySelector('.modal.show')) el.remove();
        });
        const vModal = safeGetModal(document.getElementById('viewCourseModal')) || viewCourseModal;
        if (vModal) vModal.show();
    };

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

    // Course Form Real-Time Validation UX
    function setCourseFieldInvalid(fieldId, feedbackId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
        }
        const fb = document.getElementById(feedbackId);
        if (fb && message) {
            fb.textContent = message;
        }
    }

    function setCourseFieldValid(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    }

    function clearCourseValidation() {
        ['courseTitle', 'courseCode', 'courseCategorySelect', 'courseInstructorSelect', 'courseDifficulty', 'courseFullDesc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('is-invalid');
                el.classList.remove('is-valid');
            }
        });
    }

    function validateCourseForm() {
        let isValid = true;
        let firstInvalidEl = null;

        const titleEl = document.getElementById('courseTitle');
        const titleVal = (titleEl?.value || '').trim();
        if (!titleVal || titleVal.length < 3) {
            setCourseFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course title is required (minimum 3 characters).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else {
            setCourseFieldValid('courseTitle');
        }

        const codeEl = document.getElementById('courseCode');
        const codeVal = (codeEl?.value || '').trim().toUpperCase();
        const currentCourseId = document.getElementById('courseId')?.value;
        if (!codeVal) {
            setCourseFieldInvalid('courseCode', 'courseCodeFeedback', 'Course code is required (e.g. CS-WD101).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = codeEl;
        } else {
            const existingCourses = (window.AdminStore ? window.AdminStore.getCourses() : allCourses) || [];
            const codeExists = existingCourses.some(c => 
                c.code && 
                c.code.trim().toUpperCase() === codeVal && 
                String(c.id) !== String(currentCourseId)
            );
            if (codeExists) {
                setCourseFieldInvalid('courseCode', 'courseCodeFeedback', 'Course code already exists.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = codeEl;
            } else {
                setCourseFieldValid('courseCode');
            }
        }

        const catEl = document.getElementById('courseCategorySelect');
        if (!catEl || !catEl.value) {
            setCourseFieldInvalid('courseCategorySelect', 'courseCategoryFeedback', 'Please select a category.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = catEl;
        } else {
            setCourseFieldValid('courseCategorySelect');
        }

        const insEl = document.getElementById('courseInstructorSelect');
        if (!insEl || !insEl.value) {
            setCourseFieldInvalid('courseInstructorSelect', 'courseInstructorFeedback', 'Please select an instructor.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = insEl;
        } else {
            setCourseFieldValid('courseInstructorSelect');
        }

        const diffEl = document.getElementById('courseDifficulty');
        if (!diffEl || !diffEl.value) {
            setCourseFieldInvalid('courseDifficulty', 'courseDifficultyFeedback', 'Please select difficulty level.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = diffEl;
        } else {
            setCourseFieldValid('courseDifficulty');
        }

        const descEl = document.getElementById('courseFullDesc');
        const descVal = (descEl?.value || '').trim();
        if (!descVal || descVal.length < 10) {
            setCourseFieldInvalid('courseFullDesc', 'courseFullDescFeedback', 'Course description is required (at least 10 characters).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = descEl;
        } else {
            setCourseFieldValid('courseFullDesc');
        }

        return { isValid, firstInvalidEl };
    }

    function setupCourseFormHandlers() {
        // Real-time validation listeners
        const titleEl = document.getElementById('courseTitle');
        if (titleEl) {
            titleEl.addEventListener('input', () => {
                if (titleEl.value.trim().length >= 3) setCourseFieldValid('courseTitle');
            });
            titleEl.addEventListener('blur', () => {
                if (titleEl.value.trim().length < 3) setCourseFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course title is required (minimum 3 characters).');
                else setCourseFieldValid('courseTitle');
            });
        }

        const codeEl = document.getElementById('courseCode');
        if (codeEl) {
            codeEl.addEventListener('input', () => {
                if (codeEl.value.trim()) setCourseFieldValid('courseCode');
            });
            codeEl.addEventListener('blur', () => {
                const codeVal = codeEl.value.trim().toUpperCase();
                const currentCourseId = document.getElementById('courseId')?.value;
                if (!codeVal) {
                    setCourseFieldInvalid('courseCode', 'courseCodeFeedback', 'Course code is required (e.g. CS-WD101).');
                } else {
                    const existingCourses = (window.AdminStore ? window.AdminStore.getCourses() : allCourses) || [];
                    const codeExists = existingCourses.some(c => 
                        c.code && 
                        c.code.trim().toUpperCase() === codeVal && 
                        String(c.id) !== String(currentCourseId)
                    );
                    if (codeExists) {
                        setCourseFieldInvalid('courseCode', 'courseCodeFeedback', 'Course code already exists.');
                    } else {
                        setCourseFieldValid('courseCode');
                    }
                }
            });
        }

        const descEl = document.getElementById('courseFullDesc');
        if (descEl) {
            descEl.addEventListener('input', () => {
                if (descEl.value.trim().length >= 10) setCourseFieldValid('courseFullDesc');
            });
            descEl.addEventListener('blur', () => {
                if (descEl.value.trim().length < 10) setCourseFieldInvalid('courseFullDesc', 'courseFullDescFeedback', 'Course description is required (at least 10 characters).');
                else setCourseFieldValid('courseFullDesc');
            });
        }

        const catEl = document.getElementById('courseCategorySelect');
        if (catEl) {
            catEl.addEventListener('change', () => {
                if (catEl.value) setCourseFieldValid('courseCategorySelect');
            });
        }

        const insEl = document.getElementById('courseInstructorSelect');
        if (insEl) {
            insEl.addEventListener('change', () => {
                if (insEl.value) setCourseFieldValid('courseInstructorSelect');
            });
        }

        // Featured Switch toggle label
        const featToggle = document.getElementById('courseFeaturedToggle');
        const featLabel = document.getElementById('courseFeaturedToggleLabel');
        if (featToggle && featLabel) {
            featToggle.addEventListener('change', () => {
                featLabel.textContent = featToggle.checked ? 'ON' : 'OFF';
            });
        }

        // Image upload handlers
        const fileInput = document.getElementById('courseImageFile');
        const dropzone = document.getElementById('courseImageDropzone');
        const previewBox = document.getElementById('courseImagePreviewBox');
        const previewImg = document.getElementById('courseImagePreviewImg');
        const fileNameEl = document.getElementById('courseImageFileName');
        const fileSizeEl = document.getElementById('courseImageFileSize');
        const replaceBtn = document.getElementById('replaceCourseImageBtn');
        const removeBtn = document.getElementById('removeCourseImageBtn');
        const urlInput = document.getElementById('courseImageUrl');

        function handleImageFile(file) {
            if (!file || !file.type.startsWith('image/')) {
                showProgramToast('error', 'Invalid File', 'Please select a valid image file (PNG, JPG, WebP).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showProgramToast('error', 'File Too Large', 'Cover image cannot exceed 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                if (previewImg) previewImg.src = e.target.result;
                if (fileNameEl) fileNameEl.textContent = file.name;
                if (fileSizeEl) fileSizeEl.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                if (previewBox) {
                    previewBox.classList.remove('d-none');
                    previewBox.classList.add('d-flex');
                }
                if (urlInput) urlInput.value = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) handleImageFile(this.files[0]);
            });
        }

        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('border-primary');
            });
            dropzone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-primary');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('border-primary');
                if (e.dataTransfer?.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
            });
        }

        if (replaceBtn && fileInput) {
            replaceBtn.addEventListener('click', () => fileInput.click());
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (fileInput) fileInput.value = '';
                if (previewBox) {
                    previewBox.classList.remove('d-flex');
                    previewBox.classList.add('d-none');
                }
                if (previewImg) previewImg.src = '';
                if (urlInput) urlInput.value = 'assets/images/course_webdev.jpg';
            });
        }

        // Action buttons
        const saveDraftBtn = document.getElementById('saveDraftCourseBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => saveCourse(false));
        }

        const publishBtn = document.getElementById('publishCourseBtn');
        if (publishBtn) {
            publishBtn.addEventListener('click', () => saveCourse(true));
        }

        const courseForm = document.getElementById('courseForm');
        if (courseForm) {
            courseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const isPub = (document.getElementById('courseStatus')?.value || 'Published') === 'Published';
                saveCourse(isPub);
            });
        }

        const openAddCourseBtn = document.getElementById('openAddCourseBtn');
        if (openAddCourseBtn) {
            openAddCourseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.openCreateCourseModal === 'function') {
                    window.openCreateCourseModal();
                }
            });
        }
        // Listen to shared course saved event across admin pages
        window.addEventListener('course:saved', function () {
            if (window.AdminStore && typeof window.AdminStore.getCourses === 'function') {
                allCourses = window.AdminStore.getCourses();
            }
            applyCourseFilters();
            renderAcademicStats();
        });
    }

    window.toggleCourseStatus = async function (id) {
        let course = null;
        if (window.AdminStore) {
            course = window.AdminStore.toggleCoursePublish(id);
            allCourses = window.AdminStore.getCourses();
        }
        applyCourseFilters();
        if (course) {
            showProgramToast('info', 'Status Changed', `Course is now ${course.is_published ? 'Published' : 'Draft'}`);
        }
    };

    window.deleteCourse = async function (id) {
        let c = allCourses.find(course => Number(course.id) === Number(id));
        if (!c && window.AdminStore) {
            c = window.AdminStore.getCourseById(id);
        }
        const name = c ? c.title : 'this course';

        let confirmed = false;
        if (window.Swal) {
            const res = await Swal.fire({
                title: 'Delete Course?',
                text: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                reverseButtons: true
            });
            confirmed = res.isConfirmed;
        } else if (window.AdminStore && typeof window.AdminStore.constructor.confirmDialog === 'function') {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Course?',
                `Are you sure you want to delete "${name}"?`,
                'Delete',
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
            renderCoursesTable(allCourses);
            showProgramToast('success', 'Course Deleted', `Course "${name}" was deleted successfully.`);
        } catch (err) {
            showProgramToast('error', 'Action Prohibited', err.message || 'Cannot delete course.');
            renderCoursesTable(allCourses);
        }
    };

    setupCourseFormHandlers();

    // ==========================================================================
    // 3. COURSE CONTENT BUILDER (Interactive Visual Syllabus Hierarchy)
    // Synchronized with AdminMockStore Chapters & Lessons
    // ==========================================================================
    window.openCourseContentBuilder = function (courseId) {
        activeBuilderCourseId = courseId;
        let course = allCourses.find(c => Number(c.id) === Number(courseId));
        if (!course && window.AdminStore) {
            course = window.AdminStore.getCourseById(courseId);
        }
        if (!course) return;

        activeBuilderCourse = course;
        const titleEl = document.getElementById('builderCourseTitle');
        const catEl = document.getElementById('builderCourseCategory');
        if (titleEl) titleEl.textContent = `Course Curriculum: ${course.title}`;
        if (catEl) catEl.textContent = course.category_name || 'Specialized Course';

        renderCourseContentTree(courseId);

        document.querySelectorAll('.modal-backdrop').forEach(el => {
            if (!document.querySelector('.modal.show')) el.remove();
        });

        const modal = safeGetModal(document.getElementById('courseContentBuilderModal')) || contentBuilderModal;
        if (modal) modal.show();
    };

    function formatTotalDuration(lessons) {
        let totalMinutes = 0;
        lessons.forEach(l => {
            const d = String(l.duration || '').toLowerCase();
            const minMatch = d.match(/(\d+)\s*(?:min|minute)/);
            const hrMatch = d.match(/(\d+)\s*(?:hr|hour)/);
            if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
            if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
            if (!hrMatch && !minMatch) {
                const numOnly = parseInt(d, 10);
                if (!isNaN(numOnly)) totalMinutes += numOnly;
            }
        });
        if (totalMinutes === 0) return '0h 0m Total Duration';
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m Total Duration`;
        if (hrs > 0) return `${hrs}h Total Duration`;
        return `${mins}m Total Duration`;
    }

    window.toggleModuleCollapse = function (modId) {
        const bodyEl = document.getElementById(`moduleContent_${modId}`);
        const iconEl = document.getElementById(`moduleChevron_${modId}`);
        if (!bodyEl) return;
        const isHidden = bodyEl.classList.contains('d-none');
        if (isHidden) {
            bodyEl.classList.remove('d-none');
            if (iconEl) iconEl.className = 'bi bi-chevron-down';
        } else {
            bodyEl.classList.add('d-none');
            if (iconEl) iconEl.className = 'bi bi-chevron-right';
        }
    };

    function renderCourseContentTree(courseId) {
        const container = document.getElementById('courseContentTreeContainer');
        const statsBadge = document.getElementById('builderStatsBadge');
        if (!container) return;

        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(courseId) : [];
        const allCourseLessons = window.AdminStore ? window.AdminStore.getAllLessonsByCourseId(courseId) : [];
        const totalDurationStr = formatTotalDuration(allCourseLessons);

        if (statsBadge) {
            statsBadge.textContent = `${chapters.length} Modules \u2022 ${allCourseLessons.length} Lessons \u2022 ${totalDurationStr}`;
        }

        if (chapters.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 bg-white rounded-3 border">
                    <i class="bi bi-diagram-3 fs-1 text-muted opacity-50 d-block mb-2"></i>
                    <h6 class="fw-bold text-dark">No Curriculum Modules Added</h6>
                    <p class="text-muted small mb-3">Begin structuring this course by adding the first chapter or module.</p>
                    <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="openAddModuleModal()">
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
            const isFirstMod = idx === 0;
            const isLastMod = idx === chapters.length - 1;
            const isDraftMod = (ch.status === 'Draft');

            return `
                <div class="module-tree-card mb-3 border rounded-3 bg-white shadow-sm overflow-hidden" id="moduleCard_${ch.id}">
                    <div class="module-tree-header p-3 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2 cursor-pointer" onclick="toggleModuleCollapse(${ch.id})" title="Click to Expand/Collapse Module">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="text-secondary" style="font-size: 13px;">
                                <i class="bi bi-chevron-down" id="moduleChevron_${ch.id}"></i>
                            </span>
                            <span class="badge bg-primary px-2.5 py-1 fw-bold" style="font-size: 11px;">Module ${ch.chapter_num || (idx + 1)}</span>
                            <span class="fw-bold text-dark fs-6">${escapeHtml(ch.title)}</span>
                            <span class="badge bg-white text-secondary border px-2 py-1" style="font-size: 11px;"><i class="bi bi-clock me-1"></i>${escapeHtml(ch.duration || '2 Weeks')}</span>
                            <span class="badge ${isDraftMod ? 'bg-secondary' : 'bg-success'} bg-opacity-10 text-${isDraftMod ? 'secondary' : 'success'} border px-2 py-0.5" style="font-size: 10.5px;">${ch.status || 'Published'}</span>
                            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5" style="font-size: 10.5px;">${lessons.length} ${lessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
                        </div>
                        <div class="d-flex align-items-center gap-1.5 flex-wrap" onclick="event.stopPropagation()">
                            <button type="button" class="btn btn-sm btn-primary rounded-pill py-1 px-3 fw-semibold d-inline-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="openAddLessonModal(${ch.id})" title="Add Lesson to this Module">
                                <i class="bi bi-plus-circle"></i> Add Lesson
                            </button>
                            <button type="button" class="action-btn" ${isFirstMod ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : `onclick="moveModuleUp(${ch.id})"`} title="Move Module Up">
                                <i class="bi bi-arrow-up"></i>
                            </button>
                            <button type="button" class="action-btn" ${isLastMod ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : `onclick="moveModuleDown(${ch.id})"`} title="Move Module Down">
                                <i class="bi bi-arrow-down"></i>
                            </button>
                            <button type="button" class="action-btn" onclick="openEditModuleModal(${ch.id})" title="Edit Module">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="action-btn delete text-danger" onclick="deleteModule(${ch.id})" title="Delete Module">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div id="moduleContent_${ch.id}">
                        ${ch.description ? `
                            <div class="px-3 pt-2 pb-2 bg-light bg-opacity-50 text-muted small border-bottom" style="font-size: 12px;">
                                <i class="bi bi-info-circle me-1 text-secondary"></i>${escapeHtml(ch.description)}
                            </div>
                        ` : ''}
                        <div class="lesson-tree-body p-3 bg-white">
                            ${lessons.length === 0 ? `
                                <div class="p-3 text-center text-muted small bg-light rounded-2 border border-dashed">
                                    <i class="bi bi-journal-plus fs-4 d-block mb-1 text-secondary opacity-50"></i>
                                    No lessons created in this module yet. <a href="javascript:void(0)" class="fw-semibold text-primary" onclick="openAddLessonModal(${ch.id})">+ Add First Lesson</a>
                                </div>
                            ` : `
                                <div class="d-flex flex-column gap-2">
                                    ${lessons.map((l, lIdx) => {
                                        const isFirstLes = lIdx === 0;
                                        const isLastLes = lIdx === lessons.length - 1;
                                        const isDraftLes = (l.status === 'Draft');
                                        let typeIcon = 'bi-camera-video text-primary';
                                        if (l.type === 'Lab') typeIcon = 'bi-laptop text-success';
                                        else if (l.type === 'Reading') typeIcon = 'bi-file-earmark-text text-info';
                                        else if (l.type === 'Live') typeIcon = 'bi-broadcast text-danger';

                                        return `
                                            <div class="lesson-tree-item p-2.5 bg-light rounded-2 border d-flex align-items-start justify-content-between gap-2">
                                                <div class="flex-grow-1 min-w-0">
                                                    <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                                                        <span class="badge bg-white text-dark border" style="font-size: 10.5px;">#${l.order_num || (lIdx + 1)}</span>
                                                        <i class="bi ${typeIcon}"></i>
                                                        <span class="fw-bold text-dark" style="font-size: 13px;">${escapeHtml(l.title)}</span>
                                                        <span class="text-muted" style="font-size: 11.5px;">&bull; <i class="bi bi-clock me-0.5"></i>${escapeHtml(l.duration || '20 minutes')}</span>
                                                        <span class="badge bg-white text-secondary border px-1.5 py-0.5" style="font-size: 10px;">${escapeHtml(l.type || 'Video')}</span>
                                                        <span class="badge ${isDraftLes ? 'bg-secondary' : 'bg-success'} bg-opacity-10 text-${isDraftLes ? 'secondary' : 'success'} border px-1.5 py-0.5" style="font-size: 10px;">${l.status || 'Published'}</span>
                                                    </div>
                                                    ${l.description ? `<div class="text-muted mb-1.5" style="font-size: 11.5px; line-height: 1.4;">${escapeHtml(l.description)}</div>` : ''}
                                                    
                                                    <!-- Resource Badges -->
                                                    <div class="d-flex flex-wrap align-items-center gap-1.5">
                                                        ${l.video_url ? `
                                                            <span class="resource-pill video badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style="font-size: 10px;" title="Attached Video">
                                                                <i class="bi bi-camera-video me-1"></i> ${escapeHtml(l.video_url.split('/').pop() || 'video.mp4')} ${l.video_size ? `(${l.video_size})` : ''}
                                                            </span>
                                                        ` : ''}
                                                        ${l.pdf_url ? `
                                                            <span class="resource-pill pdf badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25" style="font-size: 10px;" title="Attached Learning Material">
                                                                <i class="bi bi-file-earmark-pdf me-1"></i> ${escapeHtml(l.pdf_url.split('/').pop() || 'document.pdf')} ${l.pdf_size ? `(${l.pdf_size})` : ''}
                                                            </span>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                                <div class="d-flex align-items-center gap-1 flex-shrink-0">
                                                    <button type="button" class="action-btn" ${isFirstLes ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : `onclick="moveLessonUp(${l.id})"`} title="Move Lesson Up">
                                                        <i class="bi bi-arrow-up"></i>
                                                    </button>
                                                    <button type="button" class="action-btn" ${isLastLes ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : `onclick="moveLessonDown(${l.id})"`} title="Move Lesson Down">
                                                        <i class="bi bi-arrow-down"></i>
                                                    </button>
                                                    <button type="button" class="action-btn" title="Edit Lesson" onclick="openEditLessonModal(${l.id})">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button type="button" class="action-btn delete text-danger" title="Delete Lesson" onclick="deleteLesson(${l.id})">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
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

    // Module Reordering Handlers
    window.moveModuleUp = function (moduleId) {
        if (window.AdminStore) {
            window.AdminStore.moveChapter(moduleId, 'up');
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }
    };

    window.moveModuleDown = function (moduleId) {
        if (window.AdminStore) {
            window.AdminStore.moveChapter(moduleId, 'down');
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }
    };

    // Lesson Reordering Handlers
    window.moveLessonUp = function (lessonId) {
        if (window.AdminStore) {
            window.AdminStore.moveLesson(lessonId, 'up');
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }
    };

    window.moveLessonDown = function (lessonId) {
        if (window.AdminStore) {
            window.AdminStore.moveLesson(lessonId, 'down');
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore.getCourses();
            applyCourseFilters();
        }
    };

    // Module CRUD Handlers in Content Builder
    window.openAddModuleModal = function () {
        const form = document.getElementById('moduleEditorForm');
        if (form) form.reset();
        document.getElementById('moduleEditorId').value = '';
        document.getElementById('moduleEditorCourseId').value = activeBuilderCourseId;
        
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(activeBuilderCourseId) : [];
        document.getElementById('moduleEditorOrder').value = chapters.length + 1;
        document.getElementById('moduleEditorTitle').textContent = 'Add New Module';
        document.getElementById('moduleEditorDuration').value = '2 Weeks';
        document.getElementById('moduleEditorStatus').value = 'Published';
        document.getElementById('moduleEditorDesc').value = '';
        
        const mModal = safeGetModal(document.getElementById('moduleEditorModal')) || moduleEditorModal;
        if (mModal) mModal.show();
    };

    window.openEditModuleModal = function (moduleId) {
        if (!window.AdminStore) return;
        const ch = window.AdminStore.state.chapters.find(c => c.id === moduleId);
        if (!ch) return;

        document.getElementById('moduleEditorId').value = ch.id;
        document.getElementById('moduleEditorCourseId').value = ch.course_id;
        document.getElementById('moduleEditorTitleInput').value = ch.title;
        document.getElementById('moduleEditorOrder').value = ch.chapter_num || 1;
        document.getElementById('moduleEditorDuration').value = ch.duration || '2 Weeks';
        document.getElementById('moduleEditorStatus').value = ch.status || 'Published';
        document.getElementById('moduleEditorDesc').value = ch.description || '';
        document.getElementById('moduleEditorTitle').textContent = 'Edit Module';

        const mModal = safeGetModal(document.getElementById('moduleEditorModal')) || moduleEditorModal;
        if (mModal) mModal.show();
    };

    const moduleEditorForm = document.getElementById('moduleEditorForm');
    if (moduleEditorForm) {
        moduleEditorForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('moduleEditorId').value;
            const courseId = parseInt(document.getElementById('moduleEditorCourseId').value) || activeBuilderCourseId;
            const title = document.getElementById('moduleEditorTitleInput').value.trim();

            if (!title) {
                document.getElementById('moduleEditorTitleInput').classList.add('is-invalid');
                return;
            } else {
                document.getElementById('moduleEditorTitleInput').classList.remove('is-invalid');
            }

            const payload = {
                course_id: courseId,
                chapter_num: parseInt(document.getElementById('moduleEditorOrder').value) || 1,
                title: title,
                duration: (document.getElementById('moduleEditorDuration').value || '2 Weeks').trim(),
                status: document.getElementById('moduleEditorStatus')?.value || 'Published',
                description: (document.getElementById('moduleEditorDesc')?.value || '').trim()
            };

            if (id) {
                if (window.AdminStore) window.AdminStore.updateChapter(id, payload);
                if (window.AdminStore) window.AdminStore.constructor.toast('Module updated successfully', 'success');
            } else {
                if (window.AdminStore) window.AdminStore.createChapter(payload);
                if (window.AdminStore) window.AdminStore.constructor.toast('Module added to curriculum', 'success');
            }

            const mModal = safeGetModal(document.getElementById('moduleEditorModal')) || moduleEditorModal;
            if (mModal) mModal.hide();
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
            confirmed = await window.AdminStore.constructor.confirmDialog('Delete Module?', 'Are you sure you want to delete this module and all its lessons?', 'Yes, Delete', '#DC2626');
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
        document.getElementById('lessonEditorTitle').textContent = 'Add Lesson';
        document.getElementById('lessonEditorDuration').value = '20 minutes';
        document.getElementById('lessonEditorType').value = 'Video';
        document.getElementById('lessonEditorStatus').value = 'Published';
        document.getElementById('lessonEditorDesc').value = '';
        document.getElementById('lessonVideoUrl').value = '';

        const existingLessons = window.AdminStore ? window.AdminStore.getLessonsByModuleId(moduleId) : [];
        document.getElementById('lessonEditorOrder').value = existingLessons.length + 1;

        // Reset previews
        const vidPreview = document.getElementById('videoPreviewContainer');
        if (vidPreview) vidPreview.style.display = 'none';
        const matPreview = document.getElementById('materialPreviewContainer');
        if (matPreview) matPreview.style.display = 'none';

        const lModal = safeGetModal(document.getElementById('lessonEditorModal')) || lessonEditorModal;
        if (lModal) lModal.show();
    };

    window.openEditLessonModal = function (lessonId) {
        let les = null;
        if (window.AdminStore && window.AdminStore.state.lessons) {
            les = window.AdminStore.state.lessons.find(l => l.id === lessonId);
        }
        
        document.getElementById('lessonEditorId').value = lessonId;
        document.getElementById('lessonEditorModuleId').value = les ? les.module_id : '';
        document.getElementById('lessonEditorCourseId').value = les ? (les.course_id || activeBuilderCourseId) : activeBuilderCourseId;
        document.getElementById('lessonEditorTitleInput').value = les ? les.title : `Lesson ${lessonId}`;
        document.getElementById('lessonEditorDuration').value = les ? (les.duration || '20 minutes') : '20 minutes';
        document.getElementById('lessonEditorOrder').value = les ? (les.order_num || 1) : 1;
        document.getElementById('lessonEditorType').value = les ? (les.type || 'Video') : 'Video';
        document.getElementById('lessonEditorStatus').value = les ? (les.status || 'Published') : 'Published';
        document.getElementById('lessonEditorDesc').value = les ? (les.description || '') : '';
        document.getElementById('lessonVideoUrl').value = les ? (les.video_url || '') : '';
        document.getElementById('lessonEditorTitle').textContent = 'Edit Lesson';

        const vidPreview = document.getElementById('videoPreviewContainer');
        if (vidPreview) vidPreview.style.display = (les && les.video_url) ? 'block' : 'none';

        const matPreview = document.getElementById('materialPreviewContainer');
        if (matPreview) matPreview.style.display = (les && les.pdf_url) ? 'flex' : 'none';

        const lModal = safeGetModal(document.getElementById('lessonEditorModal')) || lessonEditorModal;
        if (lModal) lModal.show();
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
            const duration = (document.getElementById('lessonEditorDuration').value || '20 minutes').trim();
            const desc = (document.getElementById('lessonEditorDesc')?.value || '').trim();
            const videoUrl = document.getElementById('lessonVideoUrl')?.value.trim() || '';
            const orderNum = parseInt(document.getElementById('lessonEditorOrder')?.value) || 1;
            const lessonType = document.getElementById('lessonEditorType')?.value || 'Video';
            const lessonStatus = document.getElementById('lessonEditorStatus')?.value || 'Published';

            if (!title) {
                document.getElementById('lessonEditorTitleInput').classList.add('is-invalid');
                return;
            } else {
                document.getElementById('lessonEditorTitleInput').classList.remove('is-invalid');
            }

            const payload = {
                module_id: moduleId,
                course_id: activeBuilderCourseId,
                title: title,
                duration: duration,
                description: desc,
                order_num: orderNum,
                type: lessonType,
                status: lessonStatus,
                video_url: videoUrl
            };

            if (id && window.AdminStore) {
                window.AdminStore.updateLesson(parseInt(id), payload);
                window.AdminStore.constructor.toast(`Lesson "${title}" updated successfully`, 'success');
            } else if (window.AdminStore) {
                window.AdminStore.createLesson(payload);
                window.AdminStore.constructor.toast(`Lesson "${title}" added to module`, 'success');
            }

            const lModal = safeGetModal(document.getElementById('lessonEditorModal')) || lessonEditorModal;
            if (lModal) lModal.hide();
            renderCourseContentTree(activeBuilderCourseId);
            allCourses = window.AdminStore ? window.AdminStore.getCourses() : allCourses;
            applyCourseFilters();
        });
    }

    window.deleteLesson = async function (lessonId) {
        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog('Delete Lesson?', 'Are you sure you want to delete this lesson?', 'Yes, Delete', '#DC2626');
        } else {
            confirmed = confirm('Are you sure you want to delete this lesson?');
        }
        if (!confirmed) return;

        if (window.AdminStore) {
            window.AdminStore.deleteLesson(lessonId);
            window.AdminStore.constructor.toast('Lesson deleted', 'success');
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
    // 3. CATEGORIES MANAGEMENT
    // ==========================================
    async function loadCategories(forceRefresh = false) {
        const tbody = document.getElementById('categoriesTableBody');
        if (tbody && (!allCategories || allCategories.length === 0)) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                        <div class="text-muted text-xs">Loading categories...</div>
                    </td>
                </tr>
            `;
        }

        try {
            if (window.academicService && typeof window.academicService.getCategories === 'function') {
                const cats = await window.academicService.getCategories();
                allCategories = Array.isArray(cats) ? cats : [];
            } else {
                const res = await fetch(`${API_BASE}/admin/categories`, { headers: getHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) {
                        allCategories = data.data;
                    }
                }
            }
            renderCategoriesTable(allCategories);
            populateCategoryFilterOptions();
            populateCourseSelects();
        } catch (err) {
            console.error('Failed to load categories:', err);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-danger">
                            <i class="bi bi-exclamation-triangle me-1"></i> Unable to load categories.
                            <button class="btn btn-sm btn-outline-primary ms-2 rounded-pill px-3" onclick="loadCategories(true)">Retry</button>
                        </td>
                    </tr>
                `;
            }
        }
    }
    window.loadCategories = loadCategories;

    function renderCategoriesTable(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-tags fs-2 text-secondary opacity-50 d-block mb-2"></i>
                        <div class="fw-semibold">No categories found</div>
                        <p class="text-xs text-muted mb-2">Create your first category discipline.</p>
                        <button class="btn btn-primary btn-sm rounded-pill px-3" onclick="window.openCreateCategoryModal()">
                            <i class="bi bi-plus-lg me-1"></i> Add Category
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = categories.map(c => `
            <tr>
                <td class="text-muted fw-bold" style="font-size: 12px;">#${c.id}</td>
                <td class="fw-bold" style="font-size: 12.5px;">${escapeHtml(c.name)}</td>
                <td class="text-muted" style="font-size: 12px;"><code>${escapeHtml(c.slug)}</code></td>
                <td><i class="bi ${escapeHtml(c.icon || 'bi-tag')} text-primary fs-6"></i></td>
                <td><span class="badge bg-light text-dark border">${(c.course_count || 0) + (c.program_count || 0)} Linked</span></td>
                <td><span class="badge ${c.status === 'Active' || c.is_active ? 'bg-success' : 'bg-secondary'}">${c.status || (c.is_active ? 'Active' : 'Inactive')}</span></td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="action-btn" title="Edit Category" onclick="window.openEditCategoryModal(${c.id})"><i class="bi bi-pencil"></i></button>
                        <button class="action-btn delete" title="Delete Category" onclick="window.deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function populateCategoryFilterOptions() {
        const filterSelect = document.getElementById('courseCategoryFilter');
        if (filterSelect && allCategories.length > 0) {
            filterSelect.innerHTML = `<option value="all">All Categories</option>` + allCategories.map(c => `
                <option value="${c.id}">${escapeHtml(c.name)}</option>
            `).join('');
        }
    }

    window.openCreateCategoryModal = function () {
        const form = document.getElementById('categoryForm');
        if (form) form.reset();
        const idEl = document.getElementById('categoryId');
        if (idEl) idEl.value = '';
        const titleEl = document.getElementById('categoryModalTitle');
        if (titleEl) titleEl.textContent = 'Add New Category';
        
        const nameInput = document.getElementById('categoryName');
        const slugInput = document.getElementById('categorySlug');
        if (nameInput && slugInput) {
            nameInput.oninput = function() {
                if (!document.getElementById('categoryId')?.value) {
                    slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                }
            };
        }

        const modalEl = document.getElementById('createCategoryModal');
        if (modalEl) {
            const m = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (m) m.show();
        }
    };

    window.openEditCategoryModal = function (id) {
        const cat = allCategories.find(c => Number(c.id) === Number(id));
        if (!cat) return;

        const form = document.getElementById('categoryForm');
        if (form) form.reset();

        const idEl = document.getElementById('categoryId');
        if (idEl) idEl.value = cat.id;
        const titleEl = document.getElementById('categoryModalTitle');
        if (titleEl) titleEl.textContent = 'Edit Category';

        const nameEl = document.getElementById('categoryName');
        if (nameEl) nameEl.value = cat.name || '';
        const slugEl = document.getElementById('categorySlug');
        if (slugEl) slugEl.value = cat.slug || '';
        const iconEl = document.getElementById('categoryIcon');
        if (iconEl) iconEl.value = cat.icon || 'bi-tag';
        const colorEl = document.getElementById('categoryColor');
        if (colorEl) colorEl.value = cat.color || '#2563EB';
        const orderEl = document.getElementById('categoryOrder');
        if (orderEl) orderEl.value = cat.order_num !== undefined ? cat.order_num : 1;
        const statusEl = document.getElementById('categoryStatus');
        if (statusEl) statusEl.value = cat.status || (cat.is_active ? 'Active' : 'Inactive');

        const modalEl = document.getElementById('createCategoryModal');
        if (modalEl) {
            const m = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (m) m.show();
        }
    };

    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('categoryName')?.value.trim();
            const slug = document.getElementById('categorySlug')?.value.trim() || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
            const id = document.getElementById('categoryId')?.value;

            if (!name) {
                setFieldInvalid('categoryName', 'categoryNameFeedback', 'Category Name is required.');
                return;
            }

            const payload = {
                name: name,
                slug: slug,
                icon: document.getElementById('categoryIcon')?.value.trim() || 'bi-tag',
                color: document.getElementById('categoryColor')?.value || '#2563EB',
                order_num: parseInt(document.getElementById('categoryOrder')?.value) || 0,
                status: document.getElementById('categoryStatus')?.value || 'Active'
            };

            const saveBtn = document.getElementById('saveCategoryBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
            }

            try {
                if (id) {
                    await window.academicService.updateCategory(id, payload);
                    showProgramToast('success', 'Category Updated', `"${name}" updated successfully.`);
                } else {
                    await window.academicService.createCategory(payload);
                    showProgramToast('success', 'Category Created', `"${name}" added to academic categories.`);
                }

                const modalEl = document.getElementById('createCategoryModal');
                if (modalEl) {
                    const m = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (m) m.hide();
                }

                await loadCategories(true);
            } catch (err) {
                showProgramToast('danger', 'Failed to Save Category', err.message || 'Error occurred.');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `Save Category`;
                }
            }
        });
    }

    window.deleteCategory = async function (id) {
        const cat = allCategories.find(c => Number(c.id) === Number(id));
        const name = cat ? cat.name : 'this category';

        let confirmed = false;
        if (window.AdminStore && typeof window.AdminStore.constructor.confirmDialog === 'function') {
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
            await window.academicService.deleteCategory(id);
            await loadCategories(true);
            showProgramToast('success', 'Category Deleted', `"${name}" has been removed.`);
        } catch (err) {
            showProgramToast('danger', 'Action Prohibited', err.message || 'Cannot delete category assigned to courses or programs.');
            loadCategories(true);
        }
    };

    // ==========================================
    // 4. INSTRUCTORS MANAGEMENT
    // ==========================================
    async function loadInstructors(forceRefresh = false) {
        const tbody = document.getElementById('instructorsTableBody');
        if (tbody && (!allInstructors || allInstructors.length === 0)) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                        <div class="text-muted text-xs">Loading instructors...</div>
                    </td>
                </tr>
            `;
        }

        try {
            if (window.academicService && typeof window.academicService.getInstructors === 'function') {
                const insts = await window.academicService.getInstructors();
                allInstructors = Array.isArray(insts) ? insts : [];
            } else {
                const res = await fetch(`${API_BASE}/admin/instructors`, { headers: getHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) {
                        allInstructors = data.data;
                    }
                }
            }
            renderInstructorsTable(allInstructors);
            populateCourseSelects();
        } catch (err) {
            console.error('Failed to load instructors:', err);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-danger">
                            <i class="bi bi-exclamation-triangle me-1"></i> Unable to load instructors.
                            <button class="btn btn-sm btn-outline-primary ms-2 rounded-pill px-3" onclick="loadInstructors(true)">Retry</button>
                        </td>
                    </tr>
                `;
            }
        }
    }
    window.loadInstructors = loadInstructors;

    function renderInstructorsTable(instructors) {
        const tbody = document.getElementById('instructorsTableBody');
        if (!tbody) return;

        if (!instructors || instructors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-people fs-2 text-secondary opacity-50 d-block mb-2"></i>
                        <div class="fw-semibold">No instructors registered</div>
                        <p class="text-xs text-muted mb-2">Add faculty members to assign to courses and programs.</p>
                        <button class="btn btn-primary btn-sm rounded-pill px-3" onclick="window.openCreateInstructorModal()">
                            <i class="bi bi-plus-lg me-1"></i> Add Instructor
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = instructors.map(i => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="${escapeHtml(i.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150')}" class="rounded-circle border" style="width: 36px; height: 36px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                        <div>
                            <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(i.name)}</div>
                            <div class="text-muted" style="font-size: 11px;">${escapeHtml(i.faculty || i.department || 'IT Faculty')}</div>
                        </div>
                    </div>
                </td>
                <td class="text-muted fw-semibold" style="font-size: 12px;">${escapeHtml(i.title || 'Faculty Member')}</td>
                <td class="text-muted" style="font-size: 12px;">${escapeHtml(i.email || 'N/A')}</td>
                <td><span class="badge bg-light text-primary border" style="font-size: 11px;">${escapeHtml(i.expertise || 'Computer Science')}</span></td>
                <td><span class="badge bg-light text-dark border">${i.course_count || 0} Courses</span></td>
                <td><span class="badge ${i.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${i.status || 'Active'}</span></td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="action-btn" title="View Profile" onclick="window.viewInstructor(${i.id})"><i class="bi bi-eye"></i></button>
                        <button class="action-btn" title="Edit Instructor" onclick="window.openEditInstructorModal(${i.id})"><i class="bi bi-pencil"></i></button>
                        <button class="action-btn delete" title="Delete Instructor" onclick="window.deleteInstructor(${i.id})"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.openCreateInstructorModal = function () {
        const form = document.getElementById('instructorForm');
        if (form) form.reset();
        const idEl = document.getElementById('instructorId');
        if (idEl) idEl.value = '';
        const titleEl = document.getElementById('instructorModalTitle');
        if (titleEl) titleEl.textContent = 'Add New Instructor';

        const facultyEl = document.getElementById('instructorFaculty');
        if (facultyEl) facultyEl.value = 'Information Technology Faculty';

        const modalEl = document.getElementById('createInstructorModal');
        if (modalEl) {
            const m = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (m) m.show();
        }
    };

    window.openEditInstructorModal = function (id) {
        const inst = allInstructors.find(i => Number(i.id) === Number(id));
        if (!inst) return;

        const form = document.getElementById('instructorForm');
        if (form) form.reset();

        const idEl = document.getElementById('instructorId');
        if (idEl) idEl.value = inst.id;
        const titleEl = document.getElementById('instructorModalTitle');
        if (titleEl) titleEl.textContent = 'Edit Instructor Profile';

        const nameEl = document.getElementById('instructorName');
        if (nameEl) nameEl.value = inst.name || '';
        const titleInput = document.getElementById('instructorTitleInput');
        if (titleInput) titleInput.value = inst.title || '';
        const emailEl = document.getElementById('instructorEmail');
        if (emailEl) emailEl.value = inst.email || '';
        const phoneEl = document.getElementById('instructorPhone');
        if (phoneEl) phoneEl.value = inst.phone || '';
        const facultyEl = document.getElementById('instructorFaculty');
        if (facultyEl) facultyEl.value = inst.faculty || inst.department || 'Information Technology Faculty';
        const expEl = document.getElementById('instructorExpertise');
        if (expEl) expEl.value = inst.expertise || '';
        const avatarEl = document.getElementById('instructorAvatarUrl');
        if (avatarEl) avatarEl.value = inst.avatar_url || '';
        const bioEl = document.getElementById('instructorBio');
        if (bioEl) bioEl.value = inst.bio || '';
        const statusEl = document.getElementById('instructorStatus');
        if (statusEl) statusEl.value = inst.status || 'Active';

        const modalEl = document.getElementById('createInstructorModal');
        if (modalEl) {
            const m = bootstrap.Modal.getOrCreateInstance(modalEl);
            if (m) m.show();
        }
    };

    window.viewInstructor = function (id) {
        const inst = allInstructors.find(i => Number(i.id) === Number(id));
        if (!inst) return;

        if (window.Swal) {
            window.Swal.fire({
                title: inst.name,
                html: `
                    <div class="text-start">
                        <div class="text-center mb-3">
                            <img src="${inst.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="rounded-circle border" style="width: 80px; height: 80px; object-fit: cover;">
                            <div class="text-primary fw-semibold mt-1">${escapeHtml(inst.title || 'Faculty Member')}</div>
                        </div>
                        <div class="mb-2"><strong>Email:</strong> ${escapeHtml(inst.email || 'N/A')}</div>
                        <div class="mb-2"><strong>Department:</strong> ${escapeHtml(inst.faculty || inst.department || 'Information Technology')}</div>
                        <div class="mb-2"><strong>Expertise:</strong> ${escapeHtml(inst.expertise || 'N/A')}</div>
                        <div><strong>Bio:</strong> <p class="text-muted small mb-0">${escapeHtml(inst.bio || 'Experienced academic educator at AUB Digital Academy.')}</p></div>
                    </div>
                `,
                showCloseButton: true,
                confirmButtonText: 'Close',
                confirmButtonColor: '#2563EB'
            });
        } else {
            alert(`${inst.name}\n${inst.title || ''}\nEmail: ${inst.email || ''}\nExpertise: ${inst.expertise || ''}\nBio: ${inst.bio || ''}`);
        }
    };

    const instructorForm = document.getElementById('instructorForm');
    if (instructorForm) {
        instructorForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('instructorName')?.value.trim();
            const email = document.getElementById('instructorEmail')?.value.trim();
            const id = document.getElementById('instructorId')?.value;

            if (!name || name.length < 2) {
                setFieldInvalid('instructorName', 'instructorNameFeedback', 'Instructor Name is required (min 2 chars).');
                return;
            }

            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    setFieldInvalid('instructorEmail', 'instructorEmailFeedback', 'Please enter a valid email address.');
                    return;
                } else {
                    setFieldValid('instructorEmail');
                }
            }

            const payload = {
                name: name,
                title: document.getElementById('instructorTitleInput')?.value.trim() || 'Lecturer',
                email: email,
                phone: document.getElementById('instructorPhone')?.value.trim() || '',
                department: document.getElementById('instructorFaculty')?.value.trim() || 'Information Technology Faculty',
                faculty: document.getElementById('instructorFaculty')?.value.trim() || 'Information Technology Faculty',
                status: document.getElementById('instructorStatus')?.value || 'Active',
                expertise: document.getElementById('instructorExpertise')?.value.trim() || 'Computer Science & Technology',
                bio: document.getElementById('instructorBio')?.value.trim() || '',
                avatar_url: document.getElementById('instructorAvatarUrl')?.value.trim() || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150`
            };

            const saveBtn = document.getElementById('saveInstructorBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
            }

            try {
                if (id) {
                    await window.academicService.updateInstructor(id, payload);
                    showProgramToast('success', 'Instructor Updated', `${name} profile updated.`);
                } else {
                    await window.academicService.createInstructor(payload);
                    showProgramToast('success', 'Instructor Added', `${name} is connected to academic faculty.`);
                }

                const modalEl = document.getElementById('createInstructorModal');
                if (modalEl) {
                    const m = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (m) m.hide();
                }

                await loadInstructors(true);
            } catch (err) {
                showProgramToast('danger', 'Failed to Save Instructor', err.message || 'Error occurred.');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `Save Instructor`;
                }
            }
        });
    }

    window.deleteInstructor = async function (id) {
        const ins = allInstructors.find(i => Number(i.id) === Number(id));
        const name = ins ? ins.name : 'this instructor';

        let confirmed = false;
        if (window.AdminStore && typeof window.AdminStore.constructor.confirmDialog === 'function') {
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
            await window.academicService.deleteInstructor(id);
            await loadInstructors(true);
            showProgramToast('success', 'Instructor Deleted', `Instructor "${name}" deleted.`);
        } catch (err) {
            showProgramToast('danger', 'Action Prohibited', err.message || 'Cannot delete instructor assigned to active courses.');
            loadInstructors(true);
        }
    };

    // ==========================================
    // 5. VIEW PROGRAM & COURSE MODAL LOGIC
    // ==========================================
    window.viewProgram = function (id) {
        const p = allPrograms.find(prog => Number(prog.id) === Number(id));
        if (!p) return;

        const modalEl = document.getElementById('viewProgramModal');
        if (!modalEl) return;

        const titleEl = document.getElementById('viewProgramTitle');
        const degreeEl = document.getElementById('viewProgramDegree');
        const statusEl = document.getElementById('viewProgramStatus');
        const bodyEl = document.getElementById('viewProgramBody');
        const editBtn = document.getElementById('viewProgramEditBtn');

        if (titleEl) titleEl.textContent = p.title;
        if (degreeEl) degreeEl.textContent = p.degree_type || 'BACHELOR DEGREE';
        if (statusEl) {
            statusEl.textContent = p.status || (p.is_published ? 'Published' : 'Draft');
            statusEl.className = `badge ${p.is_published ? 'bg-success' : 'bg-secondary'}`;
        }
        if (editBtn) {
            editBtn.onclick = () => {
                const viewModal = bootstrap.Modal.getInstance(modalEl);
                if (viewModal) viewModal.hide();
                openEditProgramModal(p.id);
            };
        }

        let outcomes = [];
        if (p.learning_outcomes) {
            try {
                outcomes = Array.isArray(p.learning_outcomes) ? p.learning_outcomes : JSON.parse(p.learning_outcomes);
            } catch (e) {
                outcomes = [p.learning_outcomes];
            }
        }

        let instList = [];
        if (p.instructor_ids) {
            try {
                const instIds = Array.isArray(p.instructor_ids) ? p.instructor_ids : JSON.parse(p.instructor_ids);
                instList = allInstructors.filter(i => instIds.includes(i.id) || instIds.includes(String(i.id)) || instIds.includes(Number(i.id)));
            } catch (e) {}
        }

        if (bodyEl) {
            bodyEl.innerHTML = `
                <div class="row g-3">
                    ${p.image_url ? `
                    <div class="col-12 text-center mb-2">
                        <img src="${escapeHtml(p.image_url)}" class="img-fluid rounded-3 border" style="max-height: 200px; width: 100%; object-fit: cover;">
                    </div>` : ''}
                    <div class="col-md-6">
                        <div class="text-xs text-muted fw-semibold text-uppercase">Program Code</div>
                        <div class="fw-bold">${escapeHtml(p.code || p.slug || 'N/A')}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-xs text-muted fw-semibold text-uppercase">Duration & Credits</div>
                        <div class="fw-bold">${escapeHtml(p.duration || '4 Years')} &bull; ${p.credits || 120} Credits</div>
                    </div>
                    <div class="col-12">
                        <div class="text-xs text-muted fw-semibold text-uppercase">Short Description</div>
                        <p class="text-secondary small mb-2">${escapeHtml(p.short_description || 'No short description provided.')}</p>
                    </div>
                    <div class="col-12">
                        <div class="text-xs text-muted fw-semibold text-uppercase">Full Curriculum Description</div>
                        <div class="p-3 bg-white rounded border small" style="line-height: 1.6;">${escapeHtml(p.description || p.full_description || 'No detailed description available.')}</div>
                    </div>
                    ${outcomes && outcomes.length > 0 ? `
                    <div class="col-12">
                        <div class="text-xs text-muted fw-semibold text-uppercase mb-1">Key Learning Outcomes</div>
                        <ul class="list-group list-group-flush border rounded-3 p-2 small">
                            ${outcomes.map(o => `<li class="list-group-item px-2 py-1 border-0 d-flex gap-2"><i class="bi bi-check-circle-fill text-success"></i> <span>${escapeHtml(o)}</span></li>`).join('')}
                        </ul>
                    </div>` : ''}
                    ${instList && instList.length > 0 ? `
                    <div class="col-12">
                        <div class="text-xs text-muted fw-semibold text-uppercase mb-1">Assigned Faculty / Instructors</div>
                        <div class="d-flex flex-wrap gap-2">
                            ${instList.map(i => `<span class="badge bg-light text-dark border p-2 d-inline-flex align-items-center gap-1.5"><i class="bi bi-person-badge text-primary"></i> ${escapeHtml(i.name)} (${escapeHtml(i.title || 'Faculty')})</span>`).join('')}
                        </div>
                    </div>` : ''}
                </div>
            `;
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        if (modal) modal.show();
    };

    // Course Creation / Edit Standard Form Submit
    const courseFormModal = document.getElementById('courseForm');
    if (courseFormModal) {
        courseFormModal.addEventListener('submit', async function (e) {
            e.preventDefault();
            const id = document.getElementById('courseId')?.value;
            const title = document.getElementById('courseTitle')?.value.trim();
            const diff = document.getElementById('courseDifficulty')?.value;
            const catId = document.getElementById('courseCategorySelect')?.value;
            const instId = document.getElementById('courseInstructorSelect')?.value;
            const duration = document.getElementById('courseDuration')?.value.trim() || '8 Hours';
            const lessons = parseInt(document.getElementById('courseLessons')?.value) || 12;
            const status = document.getElementById('courseStatus')?.value || 'Published';
            const badge = document.getElementById('courseBadge')?.value.trim();
            const price = parseFloat(document.getElementById('coursePrice')?.value) || 0.0;
            const desc = document.getElementById('courseDesc')?.value.trim();

            if (!title) {
                setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course Title is required.');
                return;
            }
            if (!catId) {
                setFieldInvalid('courseCategorySelect', 'courseCategoryFeedback', 'Please select a category.');
                return;
            }
            if (!instId) {
                setFieldInvalid('courseInstructorSelect', 'courseInstructorFeedback', 'Please select an instructor.');
                return;
            }
            if (!desc || desc.length < 10) {
                setFieldInvalid('courseDesc', 'courseDescFeedback', 'Course Description is required (minimum 10 characters).');
                return;
            }

            const saveBtn = document.getElementById('saveCourseSubmitBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
            }

            const payload = {
                title,
                category_id: Number(catId),
                instructor_id: Number(instId),
                difficulty: diff,
                duration_hours: duration,
                lesson_count: lessons,
                status,
                badge_text: badge || null,
                price,
                description: desc,
                is_published: status === 'Draft' ? 0 : 1
            };

            try {
                if (id) {
                    await window.academicService.updateCourse(id, payload);
                    showProgramToast('success', 'Course Updated', `"${title}" updated successfully.`);
                } else {
                    await window.academicService.createCourse(payload);
                    showProgramToast('success', 'Course Created', `"${title}" created successfully.`);
                }

                const modalEl = document.getElementById('createCourseModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                    if (modal) modal.hide();
                }
                await loadCourses(true);
            } catch (err) {
                showProgramToast('danger', 'Error Saving Course', err.message || 'Failed to save course.');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Save Course';
                }
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Top Search Bar Filter (Global & Tab-Aware)
    const adminSearchInput = document.getElementById('adminSearchInput') || document.getElementById('academicSearchInput');
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', function () {
            const q = this.value.toLowerCase().trim();
            if (allPrograms.length > 0) {
                const filteredProgs = allPrograms.filter(p => !q || (p.title && p.title.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q)) || (p.code && p.code.toLowerCase().includes(q)));
                renderProgramsTable(filteredProgs);
            }
            if (allCourses.length > 0) {
                const filteredCourses = allCourses.filter(c => !q || (c.title && c.title.toLowerCase().includes(q)) || (c.description && c.description.toLowerCase().includes(q)) || (c.instructor_name && c.instructor_name.toLowerCase().includes(q)));
                renderCoursesTable(filteredCourses);
            }
            if (allCategories.length > 0) {
                const filteredCats = allCategories.filter(c => !q || (c.name && c.name.toLowerCase().includes(q)) || (c.slug && c.slug.toLowerCase().includes(q)));
                renderCategoriesTable(filteredCats);
            }
            if (allInstructors.length > 0) {
                const filteredInsts = allInstructors.filter(i => !q || (i.name && i.name.toLowerCase().includes(q)) || (i.email && i.email.toLowerCase().includes(q)) || (i.expertise && i.expertise.toLowerCase().includes(q)));
                renderInstructorsTable(filteredInsts);
            }
        });
    }

    // Tab Switching Hydration
    const academicTabs = document.getElementById('academicTabs');
    if (academicTabs) {
        academicTabs.addEventListener('shown.bs.tab', (e) => {
            const targetId = e.target.id;
            if (targetId === 'programs-tab') loadPrograms(true);
            else if (targetId === 'courses-tab') loadCourses(true);
            else if (targetId === 'categories-tab') loadCategories(true);
            else if (targetId === 'instructors-tab') loadInstructors(true);
        });
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAcademicManagement);
} else {
    initAcademicManagement();
}

