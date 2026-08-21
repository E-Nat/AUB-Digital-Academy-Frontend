// ==========================================
// AUB Digital Academy - Course Management Controller
// Dedicated Specialized Course CRUD, 8-Tab Inspector, Duplication, Archive, Lifecycle Dates & Deadlines
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

    let allCourses = [];
    let allCategories = [];
    let allInstructors = [];
    let activeCourseIdInDetail = null;

    // Modals
    const courseModalEl = document.getElementById('courseModal');
    const courseModal = courseModalEl ? new bootstrap.Modal(courseModalEl) : null;

    const courseDetailModalEl = document.getElementById('courseDetailModal');
    const courseDetailModal = courseDetailModalEl ? new bootstrap.Modal(courseDetailModalEl) : null;

    // ==========================================
    // 1. DATA LOADING & KPI CALCULATION
    // ==========================================
    async function loadInitialData() {
        await Promise.all([loadCategories(), loadInstructors()]);
        await loadCoursesList();
    }

    async function loadCategories() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/categories`, { headers: getHeaders(), signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allCategories = data.data;
                }
            }
        } catch (e) {}

        if (allCategories.length === 0 && window.AdminStore) {
            allCategories = window.AdminStore.getCategories();
        }

        populateFilterCategories();
    }

    async function loadInstructors() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/instructors`, { headers: getHeaders(), signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allInstructors = data.data;
                }
            }
        } catch (e) {}

        if (allInstructors.length === 0 && window.AdminStore) {
            allInstructors = window.AdminStore.getInstructors();
        }
    }

    window.loadCoursesList = async function () {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`${API_BASE}/admin/courses`, { headers: getHeaders(), signal: controller.signal });
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

        updateKPICards();
        applyCourseFilters();
    };

    function updateKPICards() {
        const total = allCourses.length;
        const open = allCourses.filter(c => c.computed_status === 'Enrollment Open' || c.computed_status === 'Deadline Approaching').length;
        const inProgress = allCourses.filter(c => c.computed_status === 'In Progress').length;
        const drafts = allCourses.filter(c => c.computed_status === 'Draft' || c.is_archived === 1).length;

        document.getElementById('kpiTotalCourses').textContent = total;
        document.getElementById('kpiOpenEnrollment').textContent = open;
        document.getElementById('kpiInProgress').textContent = inProgress;
        document.getElementById('kpiDrafts').textContent = drafts;
        document.getElementById('totalCoursesBadge').textContent = `${total} Course${total === 1 ? '' : 's'}`;
    }

    function populateFilterCategories() {
        const select = document.getElementById('courseFilterCategory');
        if (!select) return;
        select.innerHTML = '<option value="all">All Categories</option>' + allCategories.map(c => `
            <option value="${c.id}">${escapeHtml(c.name)}</option>
        `).join('');
    }

    // ==========================================
    // 2. COURSES TABLE RENDERING
    // ==========================================
    function getStatusBadgeHtml(status) {
        switch (status) {
            case 'Enrollment Open':
                return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle me-1"></i>Enrollment Open</span>`;
            case 'Deadline Approaching':
                return `<span class="badge bg-warning bg-opacity-15 text-dark border border-warning px-2 py-1"><i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>Deadline Near</span>`;
            case 'Enrollment Closed':
                return `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-x-circle me-1"></i>Enrollment Closed</span>`;
            case 'In Progress':
                return `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1"><i class="bi bi-play-circle me-1"></i>In Progress</span>`;
            case 'Upcoming':
                return `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1"><i class="bi bi-hourglass-split me-1"></i>Upcoming</span>`;
            case 'Completed':
                return `<span class="badge bg-dark bg-opacity-10 text-dark border px-2 py-1"><i class="bi bi-flag me-1"></i>Completed</span>`;
            case 'Draft':
            default:
                return `<span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1"><i class="bi bi-pencil-square me-1"></i>Draft</span>`;
        }
    }

    function renderCourseTable(courses) {
        const tbody = document.getElementById('courseManagementTableBody');
        if (!tbody) return;

        if (courses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="bi bi-journal-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                        <h6 class="fw-bold text-dark mb-1">No Specialized Courses Found</h6>
                        <p class="small text-muted mb-3">Try adjusting your search criteria or create a new course.</p>
                        <button class="btn btn-primary btn-sm" onclick="openCreateCourseModal()">
                            <i class="bi bi-plus-circle me-1"></i> Add New Course
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = courses.map(c => {
            const priceDisplay = (Number(c.price) > 0) ? `$${Number(c.price).toFixed(2)}` : '<span class="badge bg-success bg-opacity-10 text-success">Free</span>';
            const statusHtml = getStatusBadgeHtml(c.computed_status || (c.is_published ? 'Enrollment Open' : 'Draft'));
            const deadlineText = c.enrollment_deadline ? String(c.enrollment_deadline).split('T')[0] : 'Open Admission';
            const warningBadge = c.deadline_warning ? `<div class="mt-1"><span class="badge bg-warning bg-opacity-15 text-dark border border-warning" style="font-size: 10.5px;">${escapeHtml(c.deadline_warning)}</span></div>` : '';
            const isArchived = c.is_archived === 1;

            return `
                <tr class="${isArchived ? 'bg-light opacity-75' : ''}">
                    <td>
                        <div class="d-flex align-items-center gap-2.5">
                            <div class="position-relative">
                                <img src="../../${escapeHtml(c.thumbnail_url || 'assets/images/course_webdev.jpg')}" class="rounded-2 object-fit-cover border shadow-sm" style="width: 48px; height: 36px;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=120'">
                                ${isArchived ? '<span class="position-absolute top-0 start-0 badge bg-secondary p-1" style="font-size: 8px;">ARCHIVED</span>' : ''}
                            </div>
                            <div>
                                <a href="javascript:void(0)" class="fw-bold text-dark text-decoration-none text-hover-primary" style="font-size: 13px;" onclick="openCourseDetailModal(${c.id})">
                                    ${escapeHtml(c.title)}
                                </a>
                                <div class="d-flex align-items-center gap-2 mt-0.5" style="font-size: 11px;">
                                    <span class="text-muted"><i class="bi bi-clock me-1"></i>${escapeHtml(c.duration || '8 Weeks')}</span>
                                    <span class="text-muted">&bull;</span>
                                    <span class="text-muted"><i class="bi bi-star-fill text-warning me-1"></i>${c.rating || 4.8}</span>
                                    ${c.badge ? `<span class="badge bg-primary bg-opacity-10 text-primary py-0 px-1.5" style="font-size: 9.5px;">${escapeHtml(c.badge)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-light text-primary border fw-semibold px-2 py-1" style="font-size: 11px;">
                            ${escapeHtml(c.category_name || 'Technology')}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${escapeHtml(c.instructor_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100')}" class="rounded-circle object-fit-cover border" style="width: 26px; height: 26px;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100'">
                            <span class="text-dark fw-medium" style="font-size: 12px;">${escapeHtml(c.instructor_name || 'Faculty Staff')}</span>
                        </div>
                    </td>
                    <td>
                        <span class="fw-bold text-dark" style="font-size: 12.5px;">${priceDisplay}</span>
                    </td>
                    <td>
                        <div>
                            <div class="text-dark fw-semibold" style="font-size: 12px;"><i class="bi bi-calendar-event me-1 text-primary opacity-75"></i>${deadlineText}</div>
                            ${warningBadge}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-1.5 text-dark fw-bold" style="font-size: 12px;">
                            <i class="bi bi-people text-secondary opacity-75"></i> ${c.enrolled_students_count || 0}
                        </div>
                    </td>
                    <td>
                        ${statusHtml}
                    </td>
                    <td class="text-end pe-3">
                        <div class="dropdown d-inline-block">
                            <button class="btn btn-light btn-sm border py-1 px-2 dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0" style="font-size: 12.5px;">
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="openCourseDetailModal(${c.id})">
                                        <i class="bi bi-eye text-primary me-2"></i> View (8-Tab Inspector)
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="openEditCourseModal(${c.id})">
                                        <i class="bi bi-pencil text-secondary me-2"></i> Edit Course
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="duplicateCourseAction(${c.id})">
                                        <i class="bi bi-files text-info me-2"></i> Duplicate Course
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="togglePublishAction(${c.id})">
                                        <i class="bi ${c.is_published ? 'bi-eye-slash text-warning' : 'bi-check2-circle text-success'} me-2"></i>
                                        ${c.is_published ? 'Unpublish (Draft)' : 'Publish Course'}
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item py-1.5" href="javascript:void(0)" onclick="archiveCourseAction(${c.id})">
                                        <i class="bi ${isArchived ? 'bi-box-arrow-up text-primary' : 'bi-archive text-secondary'} me-2"></i>
                                        ${isArchived ? 'Restore from Archive' : 'Archive Course'}
                                    </a>
                                </li>
                                <li><hr class="dropdown-divider my-1"></li>
                                <li>
                                    <a class="dropdown-item py-1.5 text-danger" href="javascript:void(0)" onclick="deleteCourseAction(${c.id})">
                                        <i class="bi bi-trash me-2"></i> Delete Course
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================
    // 3. SEARCH & FILTERS
    // ==========================================
    function applyCourseFilters() {
        const query = (document.getElementById('courseFilterSearch')?.value || document.getElementById('courseGlobalSearch')?.value || '').toLowerCase().trim();
        const cat = document.getElementById('courseFilterCategory')?.value || 'all';
        const status = document.getElementById('courseFilterStatus')?.value || 'all';
        const diff = document.getElementById('courseFilterDifficulty')?.value || 'all';

        const filtered = allCourses.filter(c => {
            const matchQ = !query || 
                (c.title && c.title.toLowerCase().includes(query)) ||
                (c.description && c.description.toLowerCase().includes(query)) ||
                (c.instructor_name && c.instructor_name.toLowerCase().includes(query));

            const matchCat = cat === 'all' || 
                (c.category_id && String(c.category_id) === cat) ||
                (c.category_name && c.category_name.toLowerCase() === cat.toLowerCase());

            const matchStatus = status === 'all' || 
                (c.computed_status && c.computed_status.toLowerCase() === status.toLowerCase());

            const matchDiff = diff === 'all' || 
                (c.difficulty && c.difficulty.toLowerCase() === diff.toLowerCase());

            return matchQ && matchCat && matchStatus && matchDiff;
        });

        renderCourseTable(filtered);
    }

    window.resetCourseFilters = function () {
        if (document.getElementById('courseFilterSearch')) document.getElementById('courseFilterSearch').value = '';
        if (document.getElementById('courseGlobalSearch')) document.getElementById('courseGlobalSearch').value = '';
        if (document.getElementById('courseFilterCategory')) document.getElementById('courseFilterCategory').value = 'all';
        if (document.getElementById('courseFilterStatus')) document.getElementById('courseFilterStatus').value = 'all';
        if (document.getElementById('courseFilterDifficulty')) document.getElementById('courseFilterDifficulty').value = 'all';
        applyCourseFilters();
    };

    ['courseFilterSearch', 'courseGlobalSearch'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', applyCourseFilters);
    });

    ['courseFilterCategory', 'courseFilterStatus', 'courseFilterDifficulty'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyCourseFilters);
    });

    // ==========================================
    // 4. MODAL: CREATE / EDIT WITH DATE ORDERING VALIDATION
    // ==========================================
    function updateModalStatusPreview() {
        const enrStart = document.getElementById('courseEnrollmentStart')?.value;
        const enrDeadline = document.getElementById('courseEnrollmentDeadline')?.value;
        const courseStart = document.getElementById('courseStartDate')?.value;
        const courseEnd = document.getElementById('courseEndDate')?.value;
        const isPublished = document.getElementById('coursePublished')?.checked;
        const badgeEl = document.getElementById('courseStatusPreviewBadge');
        if (!badgeEl) return;

        if (!isPublished) {
            badgeEl.className = 'badge bg-secondary';
            badgeEl.textContent = 'Draft';
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        let status = 'Enrollment Open';
        let badgeClass = 'badge bg-success';

        if (courseEnd && today > courseEnd) {
            status = 'Completed';
            badgeClass = 'badge bg-dark';
        } else if (courseStart && today >= courseStart) {
            status = 'In Progress';
            badgeClass = 'badge bg-primary';
        } else if (enrDeadline && today > enrDeadline) {
            status = 'Enrollment Closed';
            badgeClass = 'badge bg-danger';
        } else if (enrStart && today < enrStart) {
            status = 'Upcoming';
            badgeClass = 'badge bg-info text-dark';
        } else if (enrDeadline) {
            const diffMs = new Date(enrDeadline) - new Date(today);
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
                status = `Deadline Approaching (${diffDays}d left)`;
                badgeClass = 'badge bg-warning text-dark';
            }
        }

        badgeEl.className = badgeClass;
        badgeEl.textContent = status;
    }

    ['courseEnrollmentStart', 'courseEnrollmentDeadline', 'courseStartDate', 'courseEndDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateModalStatusPreview);
    });
    const coursePubEl = document.getElementById('coursePublished');
    if (coursePubEl) coursePubEl.addEventListener('change', updateModalStatusPreview);

    function populateFormSelects() {
        const catSelect = document.getElementById('courseCategorySelect');
        if (catSelect && allCategories.length > 0) {
            catSelect.innerHTML = allCategories.map(c => `
                <option value="${c.id}">${escapeHtml(c.name)}</option>
            `).join('');
        }

        const insSelect = document.getElementById('courseInstructorSelect');
        if (insSelect && allInstructors.length > 0) {
            insSelect.innerHTML = allInstructors.map(i => `
                <option value="${i.id}">${escapeHtml(i.name)} (${escapeHtml(i.title || 'Faculty Lead')})</option>
            `).join('');
        }
    }

    function setFieldError(inputId, feedbackId, msg) {
        const el = document.getElementById(inputId);
        const fb = document.getElementById(feedbackId);
        if (el) el.classList.add('is-invalid');
        if (fb && msg) fb.textContent = msg;
    }

    function clearFieldError(inputId) {
        const el = document.getElementById(inputId);
        if (el) el.classList.remove('is-invalid');
    }

    function validateCourseModalForm() {
        let valid = true;
        let firstEl = null;

        const title = document.getElementById('courseTitle');
        if (!title.value.trim() || title.value.trim().length < 3) {
            setFieldError('courseTitle', 'courseTitleFeedback', 'Course Title is required (minimum 3 characters).');
            if (!firstEl) firstEl = title;
            valid = false;
        } else {
            clearFieldError('courseTitle');
        }

        const desc = document.getElementById('courseDesc');
        if (!desc.value.trim() || desc.value.trim().length < 10) {
            setFieldError('courseDesc', 'courseDescFeedback', 'Course Description is required (minimum 10 characters).');
            if (!firstEl) firstEl = desc;
            valid = false;
        } else {
            clearFieldError('courseDesc');
        }

        const enrStart = document.getElementById('courseEnrollmentStart')?.value;
        const enrDeadline = document.getElementById('courseEnrollmentDeadline')?.value;
        const courseStart = document.getElementById('courseStartDate')?.value;
        const courseEnd = document.getElementById('courseEndDate')?.value;

        if (enrStart && enrDeadline && new Date(enrDeadline) < new Date(enrStart)) {
            setFieldError('courseEnrollmentDeadline', 'courseDeadlineFeedback', 'Date Error: Enrollment Deadline cannot be before Enrollment Start Date.');
            if (!firstEl) firstEl = document.getElementById('courseEnrollmentDeadline');
            valid = false;
        } else {
            clearFieldError('courseEnrollmentDeadline');
        }

        if (enrDeadline && courseStart && new Date(courseStart) < new Date(enrDeadline)) {
            setFieldError('courseStartDate', 'courseDeadlineFeedback', 'Date Error: Course Start Date cannot be before Enrollment Deadline.');
            if (!firstEl) firstEl = document.getElementById('courseStartDate');
            valid = false;
        } else if (courseStart) {
            clearFieldError('courseStartDate');
        }

        if (courseStart && courseEnd && new Date(courseEnd) < new Date(courseStart)) {
            setFieldError('courseEndDate', 'courseDeadlineFeedback', 'Date Error: Course End Date cannot be before Course Start Date.');
            if (!firstEl) firstEl = document.getElementById('courseEndDate');
            valid = false;
        } else if (courseEnd) {
            clearFieldError('courseEndDate');
        }

        return { valid, firstEl };
    }

    window.openCreateCourseModal = function () {
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
        document.getElementById('courseModalTitle').textContent = 'Add New Specialized Course';
        document.getElementById('coursePrice').value = '0.00';
        document.getElementById('courseDuration').value = '8 Weeks';
        document.getElementById('courseLessons').value = '12';
        document.getElementById('coursePublished').checked = true;

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('courseEnrollmentStart').value = today;

        populateFormSelects();
        updateModalStatusPreview();
        if (courseModal) courseModal.show();
    };

    window.openEditCourseModal = function (id) {
        const c = allCourses.find(course => course.id === id);
        if (!c) return;

        populateFormSelects();
        document.getElementById('courseId').value = c.id;
        document.getElementById('courseTitle').value = c.title;
        document.getElementById('courseDifficulty').value = c.difficulty || 'Beginner';
        document.getElementById('courseCategorySelect').value = c.category_id || 1;
        document.getElementById('courseInstructorSelect').value = c.instructor_id || 1;
        document.getElementById('courseDuration').value = c.duration || c.duration_hours || '8 Weeks';
        document.getElementById('courseLessons').value = c.lesson_count || 12;
        document.getElementById('coursePrice').value = c.price !== undefined ? c.price : '0.00';
        document.getElementById('courseBadge').value = c.badge || c.badge_text || '';
        document.getElementById('courseEnrollmentStart').value = c.enrollment_start_date ? String(c.enrollment_start_date).split('T')[0] : '';
        document.getElementById('courseEnrollmentDeadline').value = c.enrollment_deadline ? String(c.enrollment_deadline).split('T')[0] : '';
        document.getElementById('courseStartDate').value = c.start_date ? String(c.start_date).split('T')[0] : '';
        document.getElementById('courseEndDate').value = c.end_date ? String(c.end_date).split('T')[0] : '';
        document.getElementById('courseDesc').value = c.description || '';
        document.getElementById('coursePublished').checked = (c.is_published === 1 || c.is_published === true);
        document.getElementById('courseModalTitle').textContent = 'Edit Specialized Course';

        updateModalStatusPreview();
        if (courseModal) courseModal.show();
    };

    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        courseForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const { valid, firstEl } = validateCourseModalForm();
            if (!valid) {
                if (firstEl) firstEl.focus();
                if (window.AdminStore) window.AdminStore.constructor.toast('Please resolve the highlighted validation errors.', 'error');
                return;
            }

            const id = document.getElementById('courseId').value;
            const title = document.getElementById('courseTitle').value.trim();
            const isPublished = document.getElementById('coursePublished').checked ? 1 : 0;

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
                enrollment_start_date: document.getElementById('courseEnrollmentStart').value || null,
                enrollment_deadline: document.getElementById('courseEnrollmentDeadline').value || null,
                start_date: document.getElementById('courseStartDate').value || null,
                end_date: document.getElementById('courseEndDate').value || null,
                description: document.getElementById('courseDesc').value.trim(),
                is_published: isPublished
            };

            const saveBtn = document.getElementById('saveCourseBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;
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
                // Offline fallback
                apiSuccess = false;
            }

            try {
                if (id) {
                    if (window.AdminStore) {
                        window.AdminStore.updateCourse(id, payload);
                        allCourses = window.AdminStore.getCourses();
                    }
                    if (courseModal) courseModal.hide();
                    updateKPICards();
                    applyCourseFilters();
                    if (window.AdminStore) {
                        const noticeSuffix = apiSuccess ? '' : ' (saved locally for demo)';
                        window.AdminStore.constructor.notifySuccess('Course Updated', `"${title}" details have been updated successfully${noticeSuffix}.`);
                    }
                } else {
                    if (window.AdminStore) {
                        const newCourse = window.AdminStore.createCourse(payload);
                        window.AdminStore.createChapter({
                            course_id: newCourse.id,
                            chapter_num: 1,
                            title: 'Architecture & Core Foundations',
                            duration: '2 Hours',
                            lesson_count: 3,
                            description: 'Fundamental principles and foundational overview.'
                        });
                        window.AdminStore.createChapter({
                            course_id: newCourse.id,
                            chapter_num: 2,
                            title: 'Hands-on Implementation',
                            duration: '3.5 Hours',
                            lesson_count: 4,
                            description: 'Practical lab and component deployment.'
                        });
                        allCourses = window.AdminStore.getCourses();
                    }
                    if (courseModal) courseModal.hide();
                    updateKPICards();
                    applyCourseFilters();
                    if (window.AdminStore) {
                        const noticeSuffix = apiSuccess ? '' : ' (saved locally for demo)';
                        window.AdminStore.constructor.notifySuccess('Course Created', `"${title}" has been created with default starter modules${noticeSuffix}.`);
                    }
                }
            } catch (err) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to Save Course', err.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Course`;
                }
            }
        });
    }

    // ==========================================
    // 5. 8-TAB COURSE DETAIL INSPECTOR MODAL
    // ==========================================
    window.openCourseDetailModal = async function (courseId) {
        activeCourseIdInDetail = courseId;
        let details = null;

        if (window.AdminStore) {
            details = window.AdminStore.getCourseDetails(courseId);
        }

        try {
            const res = await fetch(`${API_BASE}/admin/courses/${courseId}/details`, { headers: getHeaders() });
            if (res.ok) {
                const apiData = await res.json();
                if (apiData.success && apiData.data) {
                    details = apiData.data;
                }
            }
        } catch (e) {}

        if (!details) {
            if (window.AdminStore) window.AdminStore.constructor.toast('Unable to load course inspector.', 'error');
            return;
        }

        const course = details.overview;
        document.getElementById('detailModalTitle').textContent = `Course Inspector: ${course.title}`;
        document.getElementById('detailModalSubtitle').textContent = `${course.category_name} • Led by ${course.instructor_name} • ${course.duration || '8 Weeks'}`;

        // 1. Overview Tab
        document.getElementById('content-overview').innerHTML = `
            <div class="row g-3">
                <div class="col-md-4">
                    <img src="../../${escapeHtml(course.thumbnail_url || 'assets/images/course_webdev.jpg')}" class="img-fluid rounded-3 border shadow-sm mb-3" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400'">
                    <div class="p-3 bg-light rounded-3 border">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Course Price:</span>
                            <span class="fw-bold text-dark">${course.price > 0 ? `$${Number(course.price).toFixed(2)}` : '<span class="badge bg-success">Free Course</span>'}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Difficulty:</span>
                            <span class="badge bg-light text-dark border">${course.difficulty}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted small">Status:</span>
                            ${getStatusBadgeHtml(course.computed_status)}
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="text-muted small">Rating:</span>
                            <span class="text-warning fw-bold"><i class="bi bi-star-fill me-1"></i>${course.rating || 4.8}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <h5 class="fw-bold text-dark mb-2">${escapeHtml(course.title)}</h5>
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <img src="${escapeHtml(course.instructor_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100')}" class="rounded-circle" style="width: 28px; height: 28px;">
                        <span class="small text-dark fw-semibold">${escapeHtml(course.instructor_name)}</span>
                        <span class="text-muted small">• ${escapeHtml(course.category_name)}</span>
                    </div>

                    <h6 class="fw-bold text-xs text-uppercase text-muted mb-2">Description & Learning Objectives</h6>
                    <p class="text-secondary bg-light p-3 rounded-2 border" style="font-size: 13.5px; line-height: 1.6;">
                        ${escapeHtml(course.description || 'Comprehensive curriculum designed for student excellence and practical skills.')}
                    </p>

                    <h6 class="fw-bold text-xs text-uppercase text-muted mb-2">Academic Deadlines & Milestones</h6>
                    <div class="row g-2">
                        <div class="col-6 col-md-3">
                            <div class="p-2 border rounded bg-white text-center">
                                <div class="text-muted small" style="font-size: 11px;">Enrollment Opens</div>
                                <div class="fw-bold text-dark" style="font-size: 12px;">${course.enrollment_start_date ? String(course.enrollment_start_date).split('T')[0] : 'N/A'}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-2 border rounded bg-white text-center">
                                <div class="text-muted small" style="font-size: 11px;">Enrollment Deadline</div>
                                <div class="fw-bold text-danger" style="font-size: 12px;">${course.enrollment_deadline ? String(course.enrollment_deadline).split('T')[0] : 'Open'}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-2 border rounded bg-white text-center">
                                <div class="text-muted small" style="font-size: 11px;">Course Starts</div>
                                <div class="fw-bold text-primary" style="font-size: 12px;">${course.start_date ? String(course.start_date).split('T')[0] : 'N/A'}</div>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="p-2 border rounded bg-white text-center">
                                <div class="text-muted small" style="font-size: 11px;">Course Ends</div>
                                <div class="fw-bold text-dark" style="font-size: 12px;">${course.end_date ? String(course.end_date).split('T')[0] : 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 2. Lessons & Syllabus Tab
        const chapters = details.chapters || [];
        document.getElementById('content-chapters').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span class="fw-bold text-dark fs-6">Syllabus Modules (${chapters.length})</span>
                    <span class="text-muted small ms-2">Calculated Total Lessons: <strong class="text-dark">${details.reports ? details.reports.total_lessons : chapters.reduce((sum, ch) => sum + (ch.lessons ? ch.lessons.length : 0), 0)}</strong></span>
                </div>
            </div>
            ${chapters.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No modules registered yet.</div>' : `
                <div class="accordion" id="detailChaptersAccordion">
                    ${chapters.map((ch, idx) => `
                        <div class="accordion-item border rounded mb-2 overflow-hidden">
                            <h2 class="accordion-header" id="headingChap${ch.id}">
                                <button class="accordion-button ${idx === 0 ? '' : 'collapsed'} bg-light py-2.5" type="button" data-bs-toggle="collapse" data-bs-target="#collapseChap${ch.id}">
                                    <span class="badge bg-primary me-2">Module ${ch.order_num || ch.chapter_num || (idx+1)}</span>
                                    <strong class="text-dark me-2">${escapeHtml(ch.title)}</strong>
                                    <span class="badge bg-white text-secondary border ms-auto me-2">${ch.lessons ? ch.lessons.length : 0} Lessons</span>
                                </button>
                            </h2>
                            <div id="collapseChap${ch.id}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#detailChaptersAccordion">
                                <div class="accordion-body p-3 bg-white">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <p class="text-muted small mb-0">${escapeHtml(ch.description || '')}</p>
                                        <button class="btn btn-outline-primary btn-sm py-0 px-2" style="font-size: 12px;" onclick="openAddLessonModal(${ch.id})">
                                            <i class="bi bi-plus-lg me-1"></i> Add Lesson
                                        </button>
                                    </div>
                                    ${(!ch.lessons || ch.lessons.length === 0) ? '<div class="text-muted small py-2 text-center border rounded bg-light">No lessons in this module. Click "Add Lesson" to create one.</div>' : `
                                        <div class="list-group list-group-flush border rounded">
                                            ${ch.lessons.map(l => `
                                                <div class="list-group-item d-flex align-items-center justify-content-between py-2 px-3">
                                                    <div class="d-flex align-items-center gap-2">
                                                        <i class="bi bi-play-circle-fill text-primary"></i>
                                                        <div>
                                                            <div class="fw-semibold text-dark" style="font-size: 13px;">${escapeHtml(l.title)}</div>
                                                            <div class="text-muted small" style="font-size: 11.5px;">
                                                                <span class="me-2"><i class="bi bi-clock me-1"></i>${escapeHtml(l.duration || '20 Mins')}</span>
                                                                ${l.video ? '<span class="badge bg-info bg-opacity-10 text-info me-1"><i class="bi bi-camera-video me-1"></i>Video Attached</span>' : ''}
                                                                ${(l.materials && l.materials.length > 0) ? `<span class="badge bg-success bg-opacity-10 text-success"><i class="bi bi-file-earmark-pdf me-1"></i>${l.materials.length} Material${l.materials.length > 1 ? 's' : ''}</span>` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex align-items-center gap-1">
                                                        <button class="btn btn-light btn-sm border py-0 px-2" title="Attach Material" onclick="openAddMaterialModal(${l.id}, ${course.id})" style="font-size: 11px;">
                                                            <i class="bi bi-paperclip"></i>
                                                        </button>
                                                        <button class="btn btn-light btn-sm border py-0 px-2 text-danger" title="Delete Lesson" onclick="deleteLessonAction(${l.id})" style="font-size: 11px;">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;

        // 3. Learning Materials Tab
        let allMaterials = [];
        chapters.forEach(ch => {
            if (ch.lessons) {
                ch.lessons.forEach(l => {
                    if (l.materials) {
                        l.materials.forEach(m => allMaterials.push({ ...m, lesson_title: l.title }));
                    }
                });
            }
        });
        if (allMaterials.length === 0 && window.AdminStore && window.AdminStore.state.materials) {
            allMaterials = window.AdminStore.state.materials.filter(m => m.course_id == course.id);
        }

        document.getElementById('content-materials').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold text-dark fs-6">Attached Learning Materials & Guides (${allMaterials.length})</span>
            </div>
            ${allMaterials.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No downloadable PDF materials attached to this course yet. Use the "Attach Material" button in the Lessons tab.</div>' : `
                <div class="admin-table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>DOCUMENT TITLE</th>
                                <th>LESSON</th>
                                <th>TYPE</th>
                                <th>FILE SIZE</th>
                                <th class="text-end">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allMaterials.map(m => `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <i class="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                                            <div>
                                                <div class="fw-bold text-dark" style="font-size: 13px;">${escapeHtml(m.title)}</div>
                                                <div class="text-muted small" style="font-size: 11px;">${escapeHtml(m.file_name)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="badge bg-light text-dark border">${escapeHtml(m.lesson_title || 'General')}</span></td>
                                    <td><span class="badge bg-danger bg-opacity-10 text-danger">${escapeHtml(m.type || 'PDF')}</span></td>
                                    <td class="text-muted small">${escapeHtml(m.file_size || '1.8 MB')}</td>
                                    <td class="text-end">
                                        <a href="${escapeHtml(m.file_url)}" target="_blank" class="btn btn-outline-primary btn-sm py-0 px-2" style="font-size: 12px;">
                                            <i class="bi bi-download me-1"></i> View / Download
                                        </a>
                                        <button class="btn btn-light btn-sm border text-danger py-0 px-2 ms-1" onclick="deleteMaterialAction(${m.id})" style="font-size: 12px;">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;

        // 4. Quizzes Tab
        const quizzes = details.quizzes || [];
        document.getElementById('content-quizzes').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold text-dark fs-6">Module Quizzes (${quizzes.length})</span>
            </div>
            ${quizzes.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No practice quizzes created yet.</div>' : `
                <div class="row g-2">
                    ${quizzes.map(q => `
                        <div class="col-md-6">
                            <div class="p-3 bg-light rounded border">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <strong class="text-dark">${escapeHtml(q.title)}</strong>
                                    <span class="badge bg-primary bg-opacity-10 text-primary">${q.passing_score || 60}% Pass Mark</span>
                                </div>
                                <div class="text-muted small"><i class="bi bi-collection me-1"></i>${q.questions_count || 10} Questions • ${q.time_limit_minutes || 30} Mins</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;

        // 5. Assignments Tab
        const assignments = details.assignments || [];
        document.getElementById('content-assignments').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold text-dark fs-6">Assignments & Projects (${assignments.length})</span>
            </div>
            ${assignments.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No assignments posted for this course.</div>' : `
                <div class="admin-table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ASSIGNMENT TITLE</th>
                                <th>DUE DATE</th>
                                <th>TOTAL POINTS</th>
                                <th>SUBMISSIONS</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(a => `
                                <tr>
                                    <td><strong class="text-dark">${escapeHtml(a.title)}</strong></td>
                                    <td class="text-muted small">${a.due_date ? String(a.due_date).split('T')[0] : 'N/A'}</td>
                                    <td><span class="badge bg-light text-dark border">${a.total_points || 100} pts</span></td>
                                    <td><span class="badge bg-primary bg-opacity-10 text-primary">${a.submissions_count || 0} Submissions</span></td>
                                    <td><span class="badge bg-success bg-opacity-10 text-success">${a.status || 'Published'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;

        // 6. Scheduled Exams Tab
        const exams = details.exams || [];
        document.getElementById('content-exams').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold text-dark fs-6">Formal Examination Windows (${exams.length})</span>
            </div>
            ${exams.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No formal examination windows scheduled for this course.</div>' : `
                <div class="row g-3">
                    ${exams.map(e => `
                        <div class="col-md-6">
                            <div class="p-3 bg-light rounded border">
                                <div class="d-flex justify-content-between mb-2">
                                    <h6 class="fw-bold text-dark mb-0">${escapeHtml(e.title)}</h6>
                                    <span class="badge bg-primary bg-opacity-10 text-primary">${e.status || 'Scheduled'}</span>
                                </div>
                                <div class="text-muted small mb-2"><i class="bi bi-clock me-1"></i>Duration: ${e.duration_minutes || 60} Mins • Max Attempts: ${e.attempts_allowed || 2}</div>
                                <div class="text-muted small mb-1"><i class="bi bi-calendar-event me-1"></i>Window: ${e.start_datetime ? String(e.start_datetime).split('T')[0] : 'N/A'} to ${e.end_datetime ? String(e.end_datetime).split('T')[0] : 'N/A'}</div>
                                <div class="text-muted small"><i class="bi bi-trophy me-1"></i>Passing Score: ${e.passing_score || 50}% • Submissions: ${e.submissions_count || 0}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;

        // 7. Students & Progress Tab
        const students = details.students || [];
        document.getElementById('content-students').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold text-dark fs-6">Enrolled Students & Progress Tracking (${students.length})</span>
            </div>
            ${students.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No students enrolled in this cohort yet.</div>' : `
                <div class="admin-table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>STUDENT</th>
                                <th>STUDENT ID</th>
                                <th>ENROLLMENT DATE</th>
                                <th>LEARNING PROGRESS</th>
                                <th>PAYMENT</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(s => `
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <img src="${escapeHtml(s.avatar_url || s.student_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80')}" class="rounded-circle border" style="width: 28px; height: 28px;">
                                            <div>
                                                <div class="fw-bold text-dark" style="font-size: 12.5px;">${escapeHtml(s.student_name)}</div>
                                                <div class="text-muted" style="font-size: 11px;">${escapeHtml(s.student_email)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="badge bg-light text-secondary border">${escapeHtml(s.university_id || s.student_uni_id || 'ID')}</span></td>
                                    <td class="text-muted small">${s.enrollment_date ? String(s.enrollment_date).split('T')[0] : 'N/A'}</td>
                                    <td style="min-width: 140px;">
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="progress flex-grow-1" style="height: 6px;">
                                                <div class="progress-bar ${s.progress_percentage >= 100 ? 'bg-success' : 'bg-primary'}" style="width: ${s.progress_percentage || 0}%;"></div>
                                            </div>
                                            <span class="small fw-bold text-dark">${s.progress_percentage || 0}%</span>
                                        </div>
                                    </td>
                                    <td><span class="badge bg-success bg-opacity-10 text-success">${s.payment_status || 'Paid'}</span></td>
                                    <td>
                                        <button class="btn btn-sm ${s.progress_percentage >= 100 ? 'btn-success' : 'btn-outline-secondary'} py-0 px-2" style="font-size: 11.5px;" onclick="issueCertificateAction(${s.student_id || s.user_id}, ${course.id})">
                                            <i class="bi bi-award me-1"></i> Issue Certificate
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;

        // 8. Schedule & Announcements Tab
        const announcements = details.announcements || [];
        const sched = details.schedule || {};
        document.getElementById('content-schedule').innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded border h-100">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="fw-bold text-dark mb-0"><i class="bi bi-broadcast text-primary me-2"></i>Course Announcements</h6>
                            <button class="btn btn-primary btn-sm py-0 px-2" style="font-size: 12px;" onclick="openAddAnnouncementModal(${course.id})">
                                <i class="bi bi-plus-lg me-1"></i> Post
                            </button>
                        </div>
                        ${announcements.length === 0 ? '<div class="text-muted small text-center py-3 border rounded bg-white">No announcements posted.</div>' : `
                            <div class="d-flex flex-column gap-2">
                                ${announcements.map(a => `
                                    <div class="p-2.5 bg-white rounded border">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <strong class="text-dark" style="font-size: 13px;">${escapeHtml(a.title)}</strong>
                                            <span class="badge ${a.priority === 'Urgent' ? 'bg-danger' : a.priority === 'Important' ? 'bg-warning text-dark' : 'bg-primary'}">${a.priority || 'Normal'}</span>
                                        </div>
                                        <p class="text-secondary small mb-1" style="font-size: 12px;">${escapeHtml(a.message)}</p>
                                        <div class="text-muted" style="font-size: 11px;">By ${escapeHtml(a.author_name || 'Faculty')} • ${a.published_at ? String(a.published_at).split('T')[0] : 'Today'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded border h-100">
                        <h6 class="fw-bold text-dark mb-3"><i class="bi bi-calendar3 text-primary me-2"></i>Timetable & Logistics</h6>
                        <div class="p-3 bg-white rounded border mb-2">
                            <span class="text-muted small">Lecture Sessions:</span>
                            <div class="fw-bold text-dark mt-1">${escapeHtml(sched.weekly_sessions || 'Tuesdays & Thursdays, 18:00 - 20:00 (GMT+7)')}</div>
                        </div>
                        <div class="p-3 bg-white rounded border mb-2">
                            <span class="text-muted small">Location:</span>
                            <div class="fw-bold text-dark mt-1">${escapeHtml(sched.room || 'Virtual Lab 102 & Zoom Auditorium')}</div>
                        </div>
                        <div class="p-3 bg-white rounded border">
                            <span class="text-muted small">Enrollment Window:</span>
                            <div class="fw-bold text-dark mt-1">${sched.enrollment_opens || '2026-08-20'} to ${sched.enrollment_deadline || '2026-09-05'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 9. Payments & Revenue Tab
        const paymentsData = details.payments || { transactions: [], total_revenue: 0 };
        const txns = paymentsData.transactions || [];
        document.getElementById('content-payments').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-bold text-dark fs-6">Gross Tuition Revenue: <span class="text-success">$${Number(paymentsData.total_revenue).toFixed(2)}</span></span>
                <span class="text-muted small">${txns.length} Transaction${txns.length === 1 ? '' : 's'}</span>
            </div>
            ${txns.length === 0 ? '<div class="text-center py-4 text-muted border rounded bg-light">No tuition transactions recorded for this course.</div>' : `
                <div class="admin-table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>TRANSACTION ID</th>
                                <th>STUDENT</th>
                                <th>AMOUNT</th>
                                <th>METHOD</th>
                                <th>STATUS</th>
                                <th>DATE</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${txns.map(t => `
                                <tr>
                                    <td><span class="badge bg-light text-secondary border">${escapeHtml(t.transaction_id || `TXN-${t.id}`)}</span></td>
                                    <td><span class="fw-bold text-dark">${escapeHtml(t.student_name || 'Student')}</span></td>
                                    <td class="fw-bold text-success">$${Number(t.amount).toFixed(2)}</td>
                                    <td><span class="badge bg-light text-dark border">${escapeHtml(t.payment_method || 'ABA PAY')}</span></td>
                                    <td><span class="badge bg-success bg-opacity-10 text-success">${t.payment_status || 'Paid'}</span></td>
                                    <td class="text-muted small">${t.payment_date ? String(t.payment_date).split('T')[0] : 'Today'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;

        // Reset to tab 1
        const firstTab = document.getElementById('tab-overview');
        if (firstTab) {
            const tabInstance = new bootstrap.Tab(firstTab);
            tabInstance.show();
        }

        const editBtn = document.getElementById('detailEditBtn');
        if (editBtn) {
            editBtn.onclick = () => {
                if (courseDetailModal) courseDetailModal.hide();
                openEditCourseModal(courseId);
            };
        }

        if (courseDetailModal) courseDetailModal.show();
    };

    // Helper Modals Handlers
    const lessonModalEl = document.getElementById('lessonModal');
    const lessonModal = lessonModalEl ? new bootstrap.Modal(lessonModalEl) : null;

    window.openAddLessonModal = function (moduleId) {
        document.getElementById('lessonModuleId').value = moduleId;
        document.getElementById('lessonId').value = '';
        document.getElementById('lessonTitle').value = '';
        document.getElementById('lessonDuration').value = '25 Mins';
        document.getElementById('lessonOrder').value = '1';
        document.getElementById('lessonVideoUrl').value = '';
        document.getElementById('lessonDesc').value = '';
        document.getElementById('lessonModalTitle').textContent = 'Add Lesson';
        if (lessonModal) lessonModal.show();
    };

    const lessonForm = document.getElementById('lessonForm');
    if (lessonForm) {
        lessonForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const moduleId = document.getElementById('lessonModuleId').value;
            const title = document.getElementById('lessonTitle').value.trim();
            const duration = document.getElementById('lessonDuration').value.trim();
            const order_num = document.getElementById('lessonOrder').value;
            const video_url = document.getElementById('lessonVideoUrl').value.trim();
            const description = document.getElementById('lessonDesc').value.trim();

            try {
                const res = await fetch(`${API_BASE}/admin/lessons`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ module_id: moduleId, title, duration, order_num, video_url, description })
                });
                if (lessonModal) lessonModal.hide();
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Lesson Added', `"${title}" has been added to the syllabus.`);
                if (activeCourseIdInDetail) openCourseDetailModal(activeCourseIdInDetail);
            } catch (err) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to add lesson', err.message);
            }
        });
    }

    window.deleteLessonAction = async function (lessonId) {
        const confirmed = confirm('Delete this lesson from the syllabus?');
        if (!confirmed) return;
        try {
            await fetch(`${API_BASE}/admin/lessons/${lessonId}`, { method: 'DELETE', headers: getHeaders() });
            if (activeCourseIdInDetail) openCourseDetailModal(activeCourseIdInDetail);
        } catch (e) {}
    };

    const materialModalEl = document.getElementById('materialModal');
    const materialModal = materialModalEl ? new bootstrap.Modal(materialModalEl) : null;

    window.openAddMaterialModal = function (lessonId, courseId) {
        document.getElementById('materialLessonId').value = lessonId;
        document.getElementById('materialCourseId').value = courseId;
        document.getElementById('materialTitle').value = '';
        document.getElementById('materialFileName').value = '';
        document.getElementById('materialFileUrl').value = '';
        if (materialModal) materialModal.show();
    };

    const materialForm = document.getElementById('materialForm');
    if (materialForm) {
        materialForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const lesson_id = document.getElementById('materialLessonId').value;
            const course_id = document.getElementById('materialCourseId').value;
            const title = document.getElementById('materialTitle').value.trim();
            const type = document.getElementById('materialType').value;
            const file_name = document.getElementById('materialFileName').value.trim();
            const file_url = document.getElementById('materialFileUrl').value.trim();
            const file_size = document.getElementById('materialSize').value.trim();

            try {
                await fetch(`${API_BASE}/admin/materials`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ lesson_id, course_id, title, type, file_name, file_url, file_size })
                });
                if (materialModal) materialModal.hide();
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Material Attached', `"${title}" has been attached successfully.`);
                if (activeCourseIdInDetail) openCourseDetailModal(activeCourseIdInDetail);
            } catch (err) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to attach material', err.message);
            }
        });
    }

    window.deleteMaterialAction = async function (materialId) {
        const confirmed = confirm('Delete this learning material?');
        if (!confirmed) return;
        try {
            await fetch(`${API_BASE}/admin/materials/${materialId}`, { method: 'DELETE', headers: getHeaders() });
            if (activeCourseIdInDetail) openCourseDetailModal(activeCourseIdInDetail);
        } catch (e) {}
    };

    const announcementModalEl = document.getElementById('announcementModal');
    const announcementModal = announcementModalEl ? new bootstrap.Modal(announcementModalEl) : null;

    window.openAddAnnouncementModal = function (courseId) {
        document.getElementById('announcementCourseId').value = courseId;
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementMessage').value = '';
        if (announcementModal) announcementModal.show();
    };

    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const courseId = document.getElementById('announcementCourseId').value;
            const title = document.getElementById('announcementTitle').value.trim();
            const priority = document.getElementById('announcementPriority').value;
            const message = document.getElementById('announcementMessage').value.trim();

            try {
                await fetch(`${API_BASE}/admin/courses/${courseId}/announcements`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ title, priority, message })
                });
                if (announcementModal) announcementModal.hide();
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Announcement Posted', 'Published announcement for enrolled students.');
                if (activeCourseIdInDetail) openCourseDetailModal(activeCourseIdInDetail);
            } catch (err) {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to post announcement', err.message);
            }
        });
    }

    window.issueCertificateAction = async function (studentId, courseId) {
        try {
            const res = await fetch(`${API_BASE}/admin/certificates/issue`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ student_id: studentId, course_id: courseId, grade_achieved: 'A (Distinction)' })
            });
            const data = await res.json();
            if (data.success) {
                if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Certificate Issued', `Certificate ${data.certificate_number} has been generated.`);
                if (activeCourseIdInDetail) openCourseDetailModal(activeCourseIdInDetail);
            } else {
                if (window.AdminStore) window.AdminStore.constructor.notifyError('Could not issue certificate', data.message);
            }
        } catch (err) {
            if (window.AdminStore) window.AdminStore.constructor.notifyError('Error', err.message);
        }
    };

    // ==========================================
    // 6. ACTIONS: DUPLICATE, PUBLISH, ARCHIVE, DELETE
    // ==========================================
    window.duplicateCourseAction = async function (id) {
        const original = allCourses.find(c => c.id === id);
        const name = original ? original.title : 'this course';

        let confirmed = true;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Duplicate Course?',
                `This will clone "${name}" and all its syllabus modules into a new Draft course.`,
                'Duplicate Course',
                '#2563EB'
            );
        }

        if (!confirmed) return;

        try {
            if (window.AdminStore) {
                window.AdminStore.duplicateCourse(id);
                allCourses = window.AdminStore.getCourses();
            }

            const res = await fetch(`${API_BASE}/admin/courses/${id}/duplicate`, { method: 'POST', headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    loadCoursesList();
                }
            }

            updateKPICards();
            applyCourseFilters();
            if (window.AdminStore) window.AdminStore.constructor.notifySuccess('Course Duplicated', `A draft copy of "${name}" has been created.`);
        } catch (err) {
            if (window.AdminStore) window.AdminStore.constructor.notifyError('Failed to Duplicate', err.message);
        }
    };

    window.togglePublishAction = async function (id) {
        let course = null;
        if (window.AdminStore) {
            course = window.AdminStore.toggleCoursePublish(id);
            allCourses = window.AdminStore.getCourses();
        }
        updateKPICards();
        applyCourseFilters();
        if (course && window.AdminStore) {
            window.AdminStore.constructor.toast(`Course is now ${course.is_published ? 'Published' : 'Draft'}`, 'info');
        }

        try {
            await fetch(`${API_BASE}/admin/courses/${id}/toggle-publish`, { method: 'PATCH', headers: getHeaders() });
        } catch (e) {}
    };

    window.archiveCourseAction = async function (id) {
        let course = null;
        if (window.AdminStore) {
            course = window.AdminStore.archiveCourse(id);
            allCourses = window.AdminStore.getCourses();
        }
        updateKPICards();
        applyCourseFilters();
        if (course && window.AdminStore) {
            window.AdminStore.constructor.toast(`Course is now ${course.is_archived ? 'Archived' : 'Active'}`, 'info');
        }

        try {
            await fetch(`${API_BASE}/admin/courses/${id}/archive`, { method: 'PATCH', headers: getHeaders() });
        } catch (e) {}
    };

    window.deleteCourseAction = async function (id) {
        const course = allCourses.find(c => c.id === id);
        const name = course ? course.title : 'this course';

        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Delete Course?',
                `Are you sure you want to permanently delete "${name}"?`,
                'Yes, Delete',
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
                if (errData.message) throw new Error(errData.message);
            }

            updateKPICards();
            applyCourseFilters();
            if (window.AdminStore) window.AdminStore.constructor.toast(`Course "${name}" deleted`, 'success');
        } catch (err) {
            if (window.AdminStore) {
                window.AdminStore.constructor.notifyError('Action Prohibited', err.message || 'Cannot delete course with active student enrollments.');
            } else {
                alert(err.message || 'Cannot delete course.');
            }
            loadCoursesList();
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize Page
    loadInitialData();
});
