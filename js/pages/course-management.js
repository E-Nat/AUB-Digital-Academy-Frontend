// ============================================================
// AUB DIGITAL ACADEMY — COURSE MANAGEMENT CONTROLLER
// High-grade university administration controller for Course, Curriculum, Module & Lesson CRUD
// Powered by centralized AdminStore & LocalStorage Persistence
// ============================================================

(function () {
    'use strict';

    // State Variables
    let allCourses = [];
    let allCategories = [];
    let allInstructors = [];
    let activeCurriculumCourseId = null;
    let expandedModuleIds = new Set();
    let currentStatusTab = 'all';

    // Bootstrap Modal Instances
    let courseModal = null;
    let courseDetailModal = null;
    let curriculumModal = null;
    let moduleModal = null;
    let lessonModal = null;
    let lessonViewModal = null;

    // ============================================================
    // 1. INITIALIZATION & LIFECYCLE
    // ============================================================
    function initPage() {
        if (!document.getElementById('courseTableBody')) return;
        initModals();
        initEventListeners();
        loadStoreData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    window.addEventListener('aub:route-changed', function (e) {
        if (e.detail && e.detail.url && e.detail.url.includes('course-management.html')) {
            initPage();
        }
    });

    function initModals() {
        const cModalEl = document.getElementById('courseModal');
        if (cModalEl) courseModal = bootstrap.Modal.getOrCreateInstance(cModalEl);

        const cdModalEl = document.getElementById('courseDetailModal');
        if (cdModalEl) courseDetailModal = bootstrap.Modal.getOrCreateInstance(cdModalEl);

        const currModalEl = document.getElementById('curriculumModal');
        if (currModalEl) curriculumModal = bootstrap.Modal.getOrCreateInstance(currModalEl);

        const mModalEl = document.getElementById('moduleModal');
        if (mModalEl) moduleModal = bootstrap.Modal.getOrCreateInstance(mModalEl);

        const lModalEl = document.getElementById('lessonModal');
        if (lModalEl) lessonModal = bootstrap.Modal.getOrCreateInstance(lModalEl);

        const lvModalEl = document.getElementById('lessonViewModal');
        if (lvModalEl) lessonViewModal = bootstrap.Modal.getOrCreateInstance(lvModalEl);
    }

    function initEventListeners() {
        // Segment Tabs
        document.querySelectorAll('.course-segment-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.course-segment-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentStatusTab = this.getAttribute('data-status-filter') || 'all';
                
                const statusSelect = document.getElementById('courseStatusFilter');
                if (statusSelect) statusSelect.value = currentStatusTab;
                
                filterAndRenderCourses();
            });
        });

        // Search & Filter Events
        const searchInput = document.getElementById('courseSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterAndRenderCourses, 150));
        }

        const catFilter = document.getElementById('courseCategoryFilter');
        if (catFilter) catFilter.addEventListener('change', filterAndRenderCourses);

        const diffFilter = document.getElementById('courseDifficultyFilter');
        if (diffFilter) diffFilter.addEventListener('change', filterAndRenderCourses);

        const statusFilter = document.getElementById('courseStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function () {
                currentStatusTab = this.value;
                document.querySelectorAll('.course-segment-tab').forEach(t => {
                    t.classList.toggle('active', t.getAttribute('data-status-filter') === currentStatusTab);
                });
                filterAndRenderCourses();
            });
        }

        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) clearBtn.addEventListener('click', resetSearchFilters);

        const emptyClearBtn = document.getElementById('emptyClearBtn');
        if (emptyClearBtn) emptyClearBtn.addEventListener('click', resetSearchFilters);

        // Header & Empty State Add Buttons
        const addCourseBtn = document.getElementById('openAddCourseModalBtn');
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', function () {
                if (typeof window.openCreateCourseModal === 'function') {
                    window.openCreateCourseModal();
                }
            });
        }

        const emptyAddBtn = document.getElementById('emptyAddCourseBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', function () {
                if (typeof window.openCreateCourseModal === 'function') {
                    window.openCreateCourseModal();
                }
            });
        }

        // Listen to shared course saved event across admin pages
        window.addEventListener('course:saved', function (e) {
            if (e && e.detail && e.detail.course) {
                const newCourse = e.detail.course;
                // If filters are active, clear search and category filters so the new course is visible
                const searchInput = document.getElementById('courseSearchInput');
                if (searchInput) searchInput.value = '';
                const catFilter = document.getElementById('courseCategoryFilter');
                if (catFilter) catFilter.value = 'all';
                const diffFilter = document.getElementById('courseDifficultyFilter');
                if (diffFilter) diffFilter.value = 'all';

                // Ensure tab matches course status
                if (newCourse.is_archived === 1) {
                    currentStatusTab = 'Archived';
                } else if (newCourse.is_published === 1) {
                    if (currentStatusTab !== 'all' && currentStatusTab !== 'Published') {
                        currentStatusTab = 'Published';
                    }
                } else {
                    if (currentStatusTab !== 'all' && currentStatusTab !== 'Draft') {
                        currentStatusTab = 'Draft';
                    }
                }
                document.querySelectorAll('.course-segment-tab').forEach(t => {
                    t.classList.toggle('active', t.getAttribute('data-status-filter') === currentStatusTab);
                });
            }
            loadStoreData();
        });

        const resetDemoBtn = document.getElementById('resetDemoDataBtn');
        if (resetDemoBtn) {
            resetDemoBtn.addEventListener('click', handleResetDemoData);
        }

        const moduleForm = document.getElementById('moduleForm');
        if (moduleForm) moduleForm.addEventListener('submit', handleSaveModule);

        const lessonForm = document.getElementById('lessonForm');
        if (lessonForm) lessonForm.addEventListener('submit', handleSaveLesson);

        // Curriculum Header Buttons
        const currAddModuleBtn = document.getElementById('curriculumAddModuleBtn');
        if (currAddModuleBtn) {
            currAddModuleBtn.addEventListener('click', function () {
                if (activeCurriculumCourseId) openAddModuleModal(activeCurriculumCourseId);
            });
        }

        const curriculumEmptyAddBtn = document.getElementById('curriculumEmptyAddBtn');
        if (curriculumEmptyAddBtn) {
            curriculumEmptyAddBtn.addEventListener('click', function () {
                if (activeCurriculumCourseId) openAddModuleModal(activeCurriculumCourseId);
            });
        }

        const expandAllBtn = document.getElementById('expandAllModulesBtn');
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', function () {
                if (!activeCurriculumCourseId) return;
                const modules = getStore().getModulesByCourseId(activeCurriculumCourseId);
                modules.forEach(m => expandedModuleIds.add(m.id));
                renderCurriculumModules();
            });
        }

        const collapseAllBtn = document.getElementById('collapseAllModulesBtn');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', function () {
                expandedModuleIds.clear();
                renderCurriculumModules();
            });
        }

        const detailOpenCurrBtn = document.getElementById('detailOpenCurriculumBtn');
        if (detailOpenCurrBtn) {
            detailOpenCurrBtn.addEventListener('click', function () {
                if (activeCurriculumCourseId) {
                    if (courseDetailModal) courseDetailModal.hide();
                    setTimeout(() => openCurriculumManager(activeCurriculumCourseId), 200);
                }
            });
        }

        const detailEditCourseBtn = document.getElementById('detailEditCourseBtn');
        if (detailEditCourseBtn) {
            detailEditCourseBtn.addEventListener('click', function () {
                if (activeCurriculumCourseId) {
                    if (courseDetailModal) courseDetailModal.hide();
                    setTimeout(() => window.editCourse(activeCurriculumCourseId), 200);
                }
            });
        }
    }

    function getStore() {
        if (window.AdminStore) return window.AdminStore;
        console.warn('AdminStore not yet available on window, fallback initialized.');
        return {
            getCourses: () => [],
            getCourseById: () => null,
            createCourse: () => null,
            updateCourse: () => null,
            duplicateCourse: () => null,
            archiveCourse: () => null,
            deleteCourse: () => false,
            getCategories: () => [],
            getInstructors: () => [],
            getModulesByCourseId: () => [],
            createModule: () => null,
            updateModule: () => null,
            deleteModule: () => false,
            moveModule: () => false,
            getLessonsByModuleId: () => [],
            createLesson: () => null,
            updateLesson: () => null,
            deleteLesson: () => false,
            moveLesson: () => false,
            getLessonById: () => null,
            resetDemoData: () => {}
        };
    }

    async function loadStoreData() {
        const store = getStore();
        allCourses = store.getCourses() || [];
        allCategories = store.getCategories() || [];
        allInstructors = store.getInstructors() || [];

        populateFilterDropdowns();
        updateKpiCounters();
        filterAndRenderCourses();

        // Background sync if academicService is present and online
        if (window.academicService && typeof window.academicService.getCourses === 'function') {
            try {
                const apiCourses = await window.academicService.getCourses();
                if (Array.isArray(apiCourses) && apiCourses.length > 0) {
                    allCourses = store.getCourses() || apiCourses;
                    allCategories = store.getCategories() || [];
                    allInstructors = store.getInstructors() || [];
                    updateKpiCounters();
                    filterAndRenderCourses();
                }
            } catch (err) {}
        }
    }

    function populateFilterDropdowns() {
        const catFilter = document.getElementById('courseCategoryFilter');
        if (catFilter) {
            const currentVal = catFilter.value;
            catFilter.innerHTML = '<option value="all">All Categories</option>' +
                allCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
            if (currentVal) catFilter.value = currentVal;
        }
    }

    function updateKpiCounters() {
        const store = getStore();
        const courses = store.getCourses() || [];
        const totalCourses = courses.length;
        const publishedCourses = courses.filter(c => c.is_published === 1 && c.is_archived !== 1).length;
        const draftCourses = courses.filter(c => c.is_published !== 1 && c.is_archived !== 1).length;
        const archivedCourses = courses.filter(c => c.is_archived === 1).length;

        let totalModules = 0;
        let totalLessons = 0;

        courses.forEach(c => {
            const mods = store.getModulesByCourseId(c.id) || [];
            totalModules += mods.length;
            mods.forEach(m => {
                const lessons = store.getLessonsByModuleId(m.id) || [];
                totalLessons += lessons.length;
            });
        });

        const elTotal = document.getElementById('kpiTotalCourses');
        if (elTotal) elTotal.textContent = totalCourses;

        const elActive = document.getElementById('kpiActiveCourses');
        if (elActive) elActive.textContent = publishedCourses;

        const elMods = document.getElementById('kpiTotalModules');
        if (elMods) elMods.textContent = totalModules;

        const elLessons = document.getElementById('kpiTotalLessons');
        if (elLessons) elLessons.textContent = totalLessons;

        // Tab counts
        const tabAll = document.getElementById('tabCountAll');
        if (tabAll) tabAll.textContent = totalCourses;

        const tabPub = document.getElementById('tabCountPublished');
        if (tabPub) tabPub.textContent = publishedCourses;

        const tabDraft = document.getElementById('tabCountDrafts');
        if (tabDraft) tabDraft.textContent = draftCourses;

        const tabArch = document.getElementById('tabCountArchived');
        if (tabArch) tabArch.textContent = archivedCourses;
    }

    // ============================================================
    // 2. TABLE RENDERING & FILTERING
    // ============================================================
    function filterAndRenderCourses() {
        const store = getStore();
        allCourses = store.getCourses() || [];

        const searchVal = (document.getElementById('courseSearchInput')?.value || '').trim().toLowerCase();
        const catVal = document.getElementById('courseCategoryFilter')?.value || 'all';
        const diffVal = document.getElementById('courseDifficultyFilter')?.value || 'all';
        const statusVal = currentStatusTab;

        const hasActiveFilters = searchVal.length > 0 || catVal !== 'all' || diffVal !== 'all' || statusVal !== 'all';
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) clearBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';

        const filtered = allCourses.filter(c => {
            // Search Query
            if (searchVal) {
                const matchTitle = (c.title || '').toLowerCase().includes(searchVal);
                const matchCode = (c.code || '').toLowerCase().includes(searchVal);
                const matchCat = (c.category_name || '').toLowerCase().includes(searchVal);
                const matchIns = (c.instructor_name || '').toLowerCase().includes(searchVal);
                const matchDiff = (c.difficulty || '').toLowerCase().includes(searchVal);
                const matchStatus = (c.is_published ? 'published' : 'draft').includes(searchVal);
                if (!matchTitle && !matchCode && !matchCat && !matchIns && !matchDiff && !matchStatus) {
                    return false;
                }
            }

            // Category Filter
            if (catVal !== 'all' && Number(c.category_id) !== Number(catVal)) {
                return false;
            }

            // Difficulty Filter
            if (diffVal !== 'all' && (c.difficulty || '').toLowerCase() !== diffVal.toLowerCase()) {
                return false;
            }

            // Status Filter
            if (statusVal !== 'all') {
                if (statusVal === 'Published' && (c.is_published !== 1 || c.is_archived === 1)) return false;
                if (statusVal === 'Draft' && (c.is_published === 1 || c.is_archived === 1)) return false;
                if (statusVal === 'Archived' && c.is_archived !== 1) return false;
            }

            return true;
        });

        renderCourseTableRows(filtered, hasActiveFilters);
    }

    function renderCourseTableRows(courses, hasFilters = false) {
        const tbody = document.getElementById('courseTableBody');
        const emptyState = document.getElementById('courseEmptyState');
        const table = document.getElementById('courseTable');
        if (!tbody) return;

        if (courses.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
                const emptyHeading = document.getElementById('emptyStateHeading');
                const emptyMessage = document.getElementById('emptyStateMessage');
                const emptyClear = document.getElementById('emptyClearBtn');
                const emptyAdd = document.getElementById('emptyAddCourseBtn');

                if (emptyHeading) emptyHeading.textContent = hasFilters ? 'No courses found' : 'No courses yet';
                if (emptyMessage) emptyMessage.textContent = hasFilters 
                    ? 'Try adjusting your search query or clear filters to find courses.' 
                    : 'Create your first academic course to start building your AUB Digital Academy catalog.';
                if (emptyClear) emptyClear.style.display = hasFilters ? 'inline-flex' : 'none';
                if (emptyAdd) emptyAdd.style.display = hasFilters ? 'none' : 'inline-flex';
            }
            if (table) table.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (table) table.style.display = 'table';

        const store = getStore();

        tbody.innerHTML = courses.map(c => {
            // Dynamic modules and lessons calculation from curriculum
            const mods = store.getModulesByCourseId(c.id) || [];
            let lessonCount = 0;
            mods.forEach(m => {
                const lessons = store.getLessonsByModuleId(m.id) || [];
                lessonCount += lessons.length;
            });
            const modCount = mods.length;

            const isArchived = c.is_archived === 1;
            const isPublished = c.is_published === 1 && !isArchived;

            let statusClass = 'status-published';
            let statusLabel = 'Published';
            if (isArchived) {
                statusClass = 'status-archived';
                statusLabel = 'Archived';
            } else if (!isPublished) {
                statusClass = 'status-draft';
                statusLabel = 'Draft';
            }

            const diffRaw = (c.difficulty || 'Beginner').toLowerCase();
            let diffClass = 'beginner';
            if (diffRaw === 'advanced') diffClass = 'advanced';
            else if (diffRaw === 'intermediate') diffClass = 'intermediate';

            const coverUrl = c.thumbnail_url || 'assets/images/course_webdev.jpg';
            const coverSrc = (coverUrl.startsWith('data:') || coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) 
                ? coverUrl 
                : (coverUrl.startsWith('/') ? coverUrl : `../../${coverUrl}`);
            const courseCode = c.code || `CS-${String(c.id).padStart(3, '0')}`;
            const durationText = c.duration || '12 Weeks';
            const ratingText = c.rating || 4.9;

            let catName = c.category_name;
            if (!catName && c.category_id && allCategories.length > 0) {
                const foundCat = allCategories.find(k => Number(k.id) === Number(c.category_id));
                if (foundCat) catName = foundCat.name;
            }
            catName = catName || 'Software Engineering';

            let insName = c.instructor_name;
            let insAvatar = c.instructor_avatar;
            if ((!insName || !insAvatar) && c.instructor_id && allInstructors.length > 0) {
                const foundIns = allInstructors.find(i => Number(i.id) === Number(c.instructor_id));
                if (foundIns) {
                    if (!insName) insName = foundIns.name;
                    if (!insAvatar) insAvatar = foundIns.avatar_url;
                }
            }
            insName = insName || 'Faculty Lead';
            insAvatar = insAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100';

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <div class="course-thumb-box">
                                <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(c.title)}"
                                     onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=120'">
                            </div>
                            <div>
                                <div class="course-row-title" onclick="window.viewCourse(${c.id})">${escapeHtml(c.title)}</div>
                                <div class="course-row-meta">
                                    <span class="course-code-pill">${escapeHtml(courseCode)}</span>
                                    <span>&bull;</span>
                                    <span>${escapeHtml(durationText)}</span>
                                    <span>&bull;</span>
                                    <span class="text-warning"><i class="bi bi-star-fill me-0.5"></i>${ratingText}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="adm-badge-blue">${escapeHtml(catName)}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="${escapeHtml(insAvatar)}"
                                 class="course-instructor-avatar" alt="${escapeHtml(insName)}"
                                 onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100'">
                            <div>
                                <span class="fw-semibold text-dark d-block" style="font-size:13px;line-height:1.2;">${escapeHtml(insName)}</span>
                                <span class="instructor-title-sub">Faculty Lead</span>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="curriculum-text-cell justify-content-center">
                            <i class="bi bi-collection text-primary"></i>
                            <span>${modCount} Modules</span>
                            <span class="curriculum-text-muted mx-1">&bull;</span>
                            <i class="bi bi-play-circle text-muted"></i>
                            <span class="curriculum-text-muted">${lessonCount} Lessons</span>
                        </div>
                    </td>
                    <td>
                        <span class="diff-badge-subtle ${diffClass}">${escapeHtml(c.difficulty || 'Beginner')}</span>
                    </td>
                    <td>
                        <span class="status-subtle ${statusClass}">
                            <span class="status-dot"></span>
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="text-end pe-3">
                        <div class="d-inline-flex align-items-center gap-1.5">
                            <button class="adm-btn adm-btn-outline adm-btn-xs" onclick="window.viewCourse(${c.id})" title="View Course Overview" type="button">
                                <i class="bi bi-eye"></i> View
                            </button>
                            <button class="adm-btn adm-btn-primary adm-btn-xs" onclick="window.openCurriculumManager(${c.id})" title="Manage Curriculum (Modules & Lessons)" type="button">
                                <i class="bi bi-collection"></i> Curriculum
                            </button>
                            <div class="dropdown d-inline-block">
                                <button class="adm-more-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More Options">
                                    <i class="bi bi-three-dots"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end course-dropdown-menu">
                                    <li>
                                        <button class="dropdown-item" type="button" onclick="window.editCourse(${c.id})">
                                            <i class="bi bi-pencil text-primary"></i> Edit Course
                                        </button>
                                    </li>
                                    <li>
                                        <button class="dropdown-item" type="button" onclick="window.duplicateCourseAction(${c.id})">
                                            <i class="bi bi-copy text-info"></i> Duplicate Course
                                        </button>
                                    </li>
                                    <li>
                                        <button class="dropdown-item" type="button" onclick="window.toggleArchiveCourseAction(${c.id})">
                                            <i class="bi bi-archive text-secondary"></i> ${isArchived ? 'Restore Course' : 'Archive Course'}
                                        </button>
                                    </li>
                                    <li><hr class="dropdown-divider course-dropdown-divider"></li>
                                    <li>
                                        <button class="dropdown-item text-danger" type="button" onclick="window.deleteCourseConfirm(${c.id})">
                                            <i class="bi bi-trash3 text-danger"></i> Delete Course
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function resetSearchFilters() {
        const searchInput = document.getElementById('courseSearchInput');
        if (searchInput) searchInput.value = '';

        const catFilter = document.getElementById('courseCategoryFilter');
        if (catFilter) catFilter.value = 'all';

        const diffFilter = document.getElementById('courseDifficultyFilter');
        if (diffFilter) diffFilter.value = 'all';

        currentStatusTab = 'all';
        document.querySelectorAll('.course-segment-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-status-filter') === 'all');
        });

        filterAndRenderCourses();
    }

    // ============================================================
    // 3. CREATE & EDIT COURSE (DELEGATED TO SHARED COMPONENT)
    // ============================================================
    function triggerCreateCourseModal() {
        if (typeof window.openCreateCourseModal === 'function') {
            window.openCreateCourseModal();
        }
    }

    window.editCourse = function (id) {
        if (typeof window.openEditCourseModal === 'function') {
            window.openEditCourseModal(id);
        }
    };

    window.duplicateCourseAction = function (id) {
        const store = getStore();
        try {
            const cloned = store.duplicateCourse(id);
            showToast(`Course "${cloned.title}" duplicated as Draft successfully!`, 'success');
            loadStoreData();
        } catch (err) {
            console.error('Error duplicating course:', err);
            showToast(err.message || 'Failed to duplicate course', 'error');
        }
    };

    window.toggleArchiveCourseAction = function (id) {
        const store = getStore();
        try {
            const course = store.archiveCourse(id);
            const msg = course.is_archived === 1 
                ? `Course "${course.title}" archived.` 
                : `Course "${course.title}" restored from archive.`;
            showToast(msg, 'info');
            loadStoreData();
        } catch (err) {
            console.error('Error archiving course:', err);
            showToast(err.message || 'Failed to update course status', 'error');
        }
    };

    window.deleteCourseConfirm = async function (id) {
        const store = getStore();
        const course = store.getCourseById(id);
        if (!course) return;

        let confirmed = false;
        if (window.Swal) {
            const res = await Swal.fire({
                title: `Delete "${course.title}"?`,
                text: 'This will permanently remove the course, its modules, and lessons from the demo data.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#64748B',
                confirmButtonText: 'Yes, Delete Course',
                cancelButtonText: 'Cancel'
            });
            confirmed = res.isConfirmed;
        } else {
            confirmed = window.confirm(`Delete "${course.title}"?\nThis will permanently remove the course, its modules, and lessons from the demo data.`);
        }

        if (confirmed) {
            store.deleteCourse(id);
            showToast(`Course "${course.title}" has been deleted.`, 'success');
            loadStoreData();
        }
    };

    // ============================================================
    // 4. VIEW COURSE (OVERVIEW + ACCORDION CURRICULUM)
    // ============================================================
    window.viewCourse = function (id) {
        const store = getStore();
        const course = store.getCourseById(id);
        if (!course) {
            showToast('Course not found', 'error');
            return;
        }

        activeCurriculumCourseId = id;

        const codeEl = document.getElementById('detailCourseCode');
        if (codeEl) codeEl.textContent = course.code || `CS-${String(id).padStart(3, '0')}`;

        const titleEl = document.getElementById('detailCourseTitle');
        if (titleEl) titleEl.textContent = course.title || 'Course Details';

        const instNameEl = document.getElementById('detailInstructorName');
        if (instNameEl) instNameEl.textContent = course.instructor_name || 'Prof. Alex Chen';

        const instAvatarEl = document.getElementById('detailInstructorAvatar');
        if (instAvatarEl) instAvatarEl.src = course.instructor_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100';

        const catEl = document.getElementById('detailCategory');
        if (catEl) catEl.textContent = course.category_name || 'Software Engineering';

        const diffEl = document.getElementById('detailDifficulty');
        if (diffEl) diffEl.textContent = course.difficulty || 'Intermediate';
        
        const statusEl = document.getElementById('detailStatus');
        if (statusEl) {
            const isArch = course.is_archived === 1;
            const isPub = course.is_published === 1 && !isArch;
            statusEl.className = isArch ? 'status-subtle status-archived' : (isPub ? 'status-subtle status-published' : 'status-subtle status-draft');
            statusEl.innerHTML = `<span class="status-dot"></span>${isArch ? 'Archived' : (isPub ? 'Published' : 'Draft')}`;
        }

        const descEl = document.getElementById('detailDescription');
        if (descEl) descEl.textContent = course.description || 'No description provided.';

        const durEl = document.getElementById('detailDuration');
        if (durEl) durEl.textContent = course.duration || '12 Weeks';

        const ratingEl = document.getElementById('detailRating');
        if (ratingEl) ratingEl.textContent = `${course.rating || 4.9} / 5.0`;

        const studEl = document.getElementById('detailStudents');
        if (studEl) studEl.textContent = `${course.enrolled_students_count || 1} Student${(course.enrolled_students_count || 1) === 1 ? '' : 's'}`;

        const modules = store.getModulesByCourseId(id) || [];
        let totalL = 0;
        modules.forEach(m => {
            const lessons = store.getLessonsByModuleId(m.id) || [];
            totalL += lessons.length;
        });

        const currCountEl = document.getElementById('detailCurriculumCount');
        if (currCountEl) currCountEl.textContent = `${modules.length} Modules • ${totalL} Lessons`;

        // Render embedded curriculum accordion in detail modal
        const container = document.getElementById('detailCurriculumContainer');
        if (container) {
            if (modules.length === 0) {
                container.innerHTML = `<div class="p-3 bg-light rounded text-center text-muted small">No syllabus modules added yet.</div>`;
            } else {
                container.innerHTML = modules.map((m, idx) => {
                    const lessons = store.getLessonsByModuleId(m.id) || [];
                    const isExpanded = idx === 0; // expand first by default
                    const modNum = String(m.chapter_num || idx + 1).padStart(2, '0');
                    return `
                        <div class="curriculum-module-card ${isExpanded ? 'expanded' : ''}" id="detailModuleCard_${m.id}">
                            <div class="curriculum-module-header" onclick="window.toggleDetailModule(${m.id})">
                                <div class="curriculum-module-title-wrap">
                                    <span class="curriculum-module-chevron"><i class="bi bi-chevron-right"></i></span>
                                    <span class="curriculum-module-num">MODULE ${modNum}</span>
                                    <h6 class="curriculum-module-title">${escapeHtml(m.title)}</h6>
                                </div>
                                <div class="curriculum-module-meta">
                                    <span class="badge bg-light text-muted border" style="font-size:11px;">
                                        <i class="bi bi-clock me-1"></i>${escapeHtml(m.duration || '2 Weeks')}
                                    </span>
                                    <span class="badge bg-primary bg-opacity-10 text-primary" style="font-size:11px;">
                                        ${lessons.length} Lesson${lessons.length === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>
                            <div class="curriculum-module-body" id="detailModuleBody_${m.id}">
                                ${m.description ? `<p class="curriculum-module-desc">${escapeHtml(m.description)}</p>` : ''}
                                <div class="curriculum-lessons-list">
                                    ${lessons.length === 0 ? `<div class="text-muted small py-1">No lessons in this module.</div>` : lessons.map((l, lIdx) => {
                                        const typeClass = getLessonTypeClass(l.type);
                                        const typeIcon = getLessonTypeIcon(l.type);
                                        const lesNum = String(lIdx + 1).padStart(2, '0');
                                        return `
                                            <div class="curriculum-lesson-item">
                                                <div class="curriculum-lesson-left">
                                                    <div class="curriculum-lesson-type-icon ${typeClass}">
                                                        <i class="${typeIcon}"></i>
                                                    </div>
                                                    <div class="curriculum-lesson-info">
                                                        <div class="curriculum-lesson-title">${lesNum}. ${escapeHtml(l.title)}</div>
                                                        <div class="curriculum-lesson-meta">
                                                            <span>${escapeHtml(l.type || 'Video')}</span>
                                                            <span>&bull;</span>
                                                            <span>${escapeHtml(l.duration || '20 Mins')}</span>
                                                            <span>&bull;</span>
                                                            <span class="badge ${l.status === 'Draft' ? 'bg-secondary' : 'bg-success'} bg-opacity-10 text-${l.status === 'Draft' ? 'secondary' : 'success'} py-0 px-1" style="font-size:10px;">${escapeHtml(l.status || 'Published')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button class="adm-btn adm-btn-outline adm-btn-xs" onclick="window.viewLessonDetails(${l.id})" type="button">
                                                    <i class="bi bi-eye"></i> View
                                                </button>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        if (courseDetailModal) courseDetailModal.show();
    };

    window.toggleDetailModule = function (moduleId) {
        const card = document.getElementById(`detailModuleCard_${moduleId}`);
        if (card) card.classList.toggle('expanded');
    };

    // ============================================================
    // 5. CURRICULUM MANAGEMENT MODAL (MODULES & LESSONS TREE)
    // ============================================================
    window.openCurriculumManager = function (courseId) {
        const store = getStore();
        const course = store.getCourseById(courseId);
        if (!course) {
            showToast('Course not found', 'error');
            return;
        }

        activeCurriculumCourseId = courseId;
        const modalTitle = document.getElementById('curriculumModalTitle');
        if (modalTitle) modalTitle.textContent = `Curriculum — ${course.title}`;

        // By default expand first module
        const modules = store.getModulesByCourseId(courseId) || [];
        expandedModuleIds.clear();
        if (modules.length > 0) expandedModuleIds.add(modules[0].id);

        renderCurriculumModules();

        if (curriculumModal) curriculumModal.show();
    };

    function renderCurriculumModules() {
        if (!activeCurriculumCourseId) return;

        const store = getStore();
        const modules = store.getModulesByCourseId(activeCurriculumCourseId) || [];
        const container = document.getElementById('curriculumModulesList');
        const emptyState = document.getElementById('curriculumEmptyState');

        let totalLessons = 0;
        modules.forEach(m => {
            const lessons = store.getLessonsByModuleId(m.id) || [];
            totalLessons += lessons.length;
        });

        const statsEl = document.getElementById('curriculumStats');
        if (statsEl) statsEl.textContent = `${modules.length} Modules • ${totalLessons} Lessons`;

        if (!container) return;

        if (modules.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = modules.map((m, idx) => {
            const lessons = store.getLessonsByModuleId(m.id) || [];
            const isExpanded = expandedModuleIds.has(m.id);
            const modNum = String(m.chapter_num || idx + 1).padStart(2, '0');
            const isFirstMod = idx === 0;
            const isLastMod = idx === modules.length - 1;

            return `
                <div class="curriculum-module-card ${isExpanded ? 'expanded' : ''}" id="curriculumModuleCard_${m.id}">
                    <div class="curriculum-module-header" onclick="window.toggleCurriculumModule(${m.id})">
                        <div class="curriculum-module-title-wrap">
                            <span class="curriculum-module-chevron"><i class="bi bi-chevron-right"></i></span>
                            <span class="curriculum-module-num">MODULE ${modNum}</span>
                            <h6 class="curriculum-module-title">${escapeHtml(m.title)}</h6>
                            <span class="badge bg-light text-muted border d-none d-md-inline-block" style="font-size:11px;">
                                <i class="bi bi-clock me-1"></i>${escapeHtml(m.duration || '2 Weeks')}
                            </span>
                            <span class="badge bg-primary bg-opacity-10 text-primary" style="font-size:11px;">
                                ${lessons.length} Lesson${lessons.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        <div class="curriculum-module-actions" onclick="event.stopPropagation()">
                            <button class="adm-btn-icon-xs" onclick="window.moveModuleUp(${m.id})" title="Move Module Up" ${isFirstMod ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} type="button">
                                <i class="bi bi-arrow-up"></i>
                            </button>
                            <button class="adm-btn-icon-xs" onclick="window.moveModuleDown(${m.id})" title="Move Module Down" ${isLastMod ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} type="button">
                                <i class="bi bi-arrow-down"></i>
                            </button>
                            <button class="adm-btn adm-btn-outline adm-btn-xs" onclick="window.openAddLessonModal(${m.id})" title="Add Lesson to this module" type="button">
                                <i class="bi bi-plus-lg"></i> Add Lesson
                            </button>
                            <button class="adm-btn-icon-xs" onclick="window.openEditModuleModal(${m.id})" title="Edit Module" type="button">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="adm-btn-icon-xs danger" onclick="window.deleteModuleConfirm(${m.id})" title="Delete Module" type="button">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="curriculum-module-body" id="curriculumModuleBody_${m.id}">
                        ${m.description ? `<p class="curriculum-module-desc">${escapeHtml(m.description)}</p>` : ''}
                        
                        <div class="curriculum-lessons-list">
                            ${lessons.length === 0 ? `
                                <div class="text-center py-4 bg-light rounded-2 border border-dashed text-muted small">
                                    <i class="bi bi-play-circle fs-3 d-block mb-1 opacity-50"></i>
                                    <span>No lessons inside this module yet.</span>
                                    <div class="mt-2">
                                        <button class="adm-btn adm-btn-primary adm-btn-xs" onclick="window.openAddLessonModal(${m.id})" type="button">
                                            <i class="bi bi-plus-lg"></i> Add First Lesson
                                        </button>
                                    </div>
                                </div>
                            ` : lessons.map((l, lIdx) => {
                                const typeClass = getLessonTypeClass(l.type);
                                const typeIcon = getLessonTypeIcon(l.type);
                                const lesNum = String(lIdx + 1).padStart(2, '0');
                                const isFirstLes = lIdx === 0;
                                const isLastLes = lIdx === lessons.length - 1;

                                return `
                                    <div class="curriculum-lesson-item">
                                        <div class="curriculum-lesson-left">
                                            <div class="curriculum-lesson-type-icon ${typeClass}">
                                                <i class="${typeIcon}"></i>
                                            </div>
                                            <div class="curriculum-lesson-info">
                                                <div class="curriculum-lesson-title">${lesNum}. ${escapeHtml(l.title)}</div>
                                                <div class="curriculum-lesson-meta">
                                                    <span>${escapeHtml(l.type || 'Video')}</span>
                                                    <span>&bull;</span>
                                                    <span>${escapeHtml(l.duration || '20 Mins')}</span>
                                                    <span>&bull;</span>
                                                    <span class="badge ${l.status === 'Draft' ? 'bg-secondary' : 'bg-success'} bg-opacity-10 text-${l.status === 'Draft' ? 'secondary' : 'success'} py-0 px-1.5" style="font-size:10px;">${escapeHtml(l.status || 'Published')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="curriculum-lesson-actions">
                                            <button class="adm-btn-icon-xs" onclick="window.moveLessonUp(${l.id})" title="Move Lesson Up" ${isFirstLes ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} type="button">
                                                <i class="bi bi-arrow-up"></i>
                                            </button>
                                            <button class="adm-btn-icon-xs" onclick="window.moveLessonDown(${l.id})" title="Move Lesson Down" ${isLastLes ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} type="button">
                                                <i class="bi bi-arrow-down"></i>
                                            </button>
                                            <button class="adm-btn adm-btn-outline adm-btn-xs" onclick="window.viewLessonDetails(${l.id})" title="View Lesson Details & Preview" type="button">
                                                <i class="bi bi-eye"></i> View
                                            </button>
                                            <button class="adm-btn-icon-xs" onclick="window.openEditLessonModal(${l.id})" title="Edit Lesson" type="button">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="adm-btn-icon-xs danger" onclick="window.deleteLessonConfirm(${l.id})" title="Delete Lesson" type="button">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.toggleCurriculumModule = function (moduleId) {
        if (expandedModuleIds.has(moduleId)) {
            expandedModuleIds.delete(moduleId);
        } else {
            expandedModuleIds.add(moduleId);
        }
        renderCurriculumModules();
    };

    // ============================================================
    // 6. MODULE CRUD & REORDERING
    // ============================================================
    window.openAddModuleModal = function (courseId) {
        const cId = courseId || activeCurriculumCourseId;
        if (!cId) return;

        const form = document.getElementById('moduleForm');
        if (form) form.reset();
        form.classList.remove('was-validated');

        const idInput = document.getElementById('moduleId');
        if (idInput) idInput.value = '';

        const cIdInput = document.getElementById('moduleCourseId');
        if (cIdInput) cIdInput.value = cId;

        const modalTitle = document.getElementById('moduleModalTitle');
        if (modalTitle) modalTitle.textContent = 'Add New Module';

        const durInput = document.getElementById('moduleDurationInput');
        if (durInput) durInput.value = '2 Weeks';

        const statusSelect = document.getElementById('moduleStatusSelect');
        if (statusSelect) statusSelect.value = 'Published';

        if (moduleModal) moduleModal.show();
    };

    window.openEditModuleModal = function (moduleId) {
        const store = getStore();
        const modules = store.getModulesByCourseId(activeCurriculumCourseId) || [];
        const mod = modules.find(m => m.id === Number(moduleId));
        if (!mod) return;

        const form = document.getElementById('moduleForm');
        if (form) form.reset();
        form.classList.remove('was-validated');

        const idInput = document.getElementById('moduleId');
        if (idInput) idInput.value = mod.id;

        const cIdInput = document.getElementById('moduleCourseId');
        if (cIdInput) cIdInput.value = mod.course_id;

        const modalTitle = document.getElementById('moduleModalTitle');
        if (modalTitle) modalTitle.textContent = `Edit Module — ${mod.title}`;

        const titleInput = document.getElementById('moduleTitleInput');
        if (titleInput) titleInput.value = mod.title || '';

        const durInput = document.getElementById('moduleDurationInput');
        if (durInput) durInput.value = mod.duration || '2 Weeks';

        const orderInput = document.getElementById('moduleOrderInput');
        if (orderInput) orderInput.value = mod.chapter_num || 1;

        const statusSelect = document.getElementById('moduleStatusSelect');
        if (statusSelect) statusSelect.value = mod.status || 'Published';

        const descInput = document.getElementById('moduleDescriptionInput');
        if (descInput) descInput.value = mod.description || '';

        if (moduleModal) moduleModal.show();
    };

    function handleSaveModule(e) {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const idVal = document.getElementById('moduleId')?.value;
        const courseId = Number(document.getElementById('moduleCourseId')?.value) || activeCurriculumCourseId;
        const title = (document.getElementById('moduleTitleInput')?.value || '').trim();
        const duration = (document.getElementById('moduleDurationInput')?.value || '').trim();
        const orderVal = Number(document.getElementById('moduleOrderInput')?.value) || 1;
        const status = document.getElementById('moduleStatusSelect')?.value || 'Published';
        const description = (document.getElementById('moduleDescriptionInput')?.value || '').trim();

        if (title.length < 3) {
            showToast('Module title must be at least 3 characters.', 'warning');
            return;
        }

        const moduleData = {
            course_id: courseId,
            title: title,
            duration: duration || '2 Weeks',
            order_num: orderVal,
            chapter_num: orderVal,
            status: status,
            description: description
        };

        const store = getStore();
        try {
            if (idVal) {
                store.updateModule(Number(idVal), moduleData);
                showToast(`Module "${title}" updated!`, 'success');
            } else {
                const newMod = store.createModule(moduleData);
                if (newMod && newMod.id) expandedModuleIds.add(newMod.id);
                showToast(`Module "${title}" created!`, 'success');
            }

            if (moduleModal) moduleModal.hide();
            renderCurriculumModules();
            updateKpiCounters();
            filterAndRenderCourses();
        } catch (err) {
            console.error('Error saving module:', err);
            showToast(err.message || 'Failed to save module', 'error');
        }
    }

    window.moveModuleUp = function (moduleId) {
        const store = getStore();
        store.moveModule(moduleId, 'up');
        renderCurriculumModules();
    };

    window.moveModuleDown = function (moduleId) {
        const store = getStore();
        store.moveModule(moduleId, 'down');
        renderCurriculumModules();
    };

    window.deleteModuleConfirm = async function (moduleId) {
        const store = getStore();
        const modules = store.getModulesByCourseId(activeCurriculumCourseId) || [];
        const mod = modules.find(m => m.id === Number(moduleId));
        if (!mod) return;

        let confirmed = false;
        if (window.Swal) {
            const res = await Swal.fire({
                title: `Delete "${mod.title}"?`,
                text: 'This will delete the module and all contained lessons.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#64748B',
                confirmButtonText: 'Yes, Delete Module',
                cancelButtonText: 'Cancel'
            });
            confirmed = res.isConfirmed;
        } else {
            confirmed = window.confirm(`Delete "${mod.title}" and its lessons?`);
        }

        if (confirmed) {
            store.deleteModule(moduleId);
            expandedModuleIds.delete(Number(moduleId));
            showToast(`Module "${mod.title}" deleted.`, 'success');
            renderCurriculumModules();
            updateKpiCounters();
            filterAndRenderCourses();
        }
    };

    // ============================================================
    // 7. LESSON CRUD & REORDERING
    // ============================================================
    window.openAddLessonModal = function (moduleId) {
        const form = document.getElementById('lessonForm');
        if (form) form.reset();
        form.classList.remove('was-validated');

        const idInput = document.getElementById('lessonId');
        if (idInput) idInput.value = '';

        const mIdInput = document.getElementById('lessonModuleId');
        if (mIdInput) mIdInput.value = moduleId;

        const cIdInput = document.getElementById('lessonCourseId');
        if (cIdInput) cIdInput.value = activeCurriculumCourseId;

        const modalTitle = document.getElementById('lessonModalTitle');
        if (modalTitle) modalTitle.textContent = 'Add New Lesson';

        const typeSelect = document.getElementById('lessonTypeSelect');
        if (typeSelect) typeSelect.value = 'Video';

        const durInput = document.getElementById('lessonDurationInput');
        if (durInput) durInput.value = '25 Mins';

        const statusSelect = document.getElementById('lessonStatusSelect');
        if (statusSelect) statusSelect.value = 'Published';

        if (lessonModal) lessonModal.show();
    };

    window.openEditLessonModal = function (lessonId) {
        const store = getStore();
        const lesson = store.getLessonById(lessonId);
        if (!lesson) return;

        const form = document.getElementById('lessonForm');
        if (form) form.reset();
        form.classList.remove('was-validated');

        const idInput = document.getElementById('lessonId');
        if (idInput) idInput.value = lesson.id;

        const mIdInput = document.getElementById('lessonModuleId');
        if (mIdInput) mIdInput.value = lesson.module_id;

        const cIdInput = document.getElementById('lessonCourseId');
        if (cIdInput) cIdInput.value = lesson.course_id || activeCurriculumCourseId;

        const modalTitle = document.getElementById('lessonModalTitle');
        if (modalTitle) modalTitle.textContent = `Edit Lesson — ${lesson.title}`;

        const titleInput = document.getElementById('lessonTitleInput');
        if (titleInput) titleInput.value = lesson.title || '';

        const typeSelect = document.getElementById('lessonTypeSelect');
        if (typeSelect) typeSelect.value = lesson.type || 'Video';

        const durInput = document.getElementById('lessonDurationInput');
        if (durInput) durInput.value = lesson.duration || '20 Mins';

        const orderInput = document.getElementById('lessonOrderInput');
        if (orderInput) orderInput.value = lesson.order_num || 1;

        const statusSelect = document.getElementById('lessonStatusSelect');
        if (statusSelect) statusSelect.value = lesson.status || 'Published';

        const descInput = document.getElementById('lessonDescriptionInput');
        if (descInput) descInput.value = lesson.description || '';

        const videoUrlInput = document.getElementById('lessonContentInput') || document.getElementById('lessonVideoUrlInput');
        if (videoUrlInput) videoUrlInput.value = lesson.video_url || lesson.content || '';

        if (lessonModal) lessonModal.show();
    };

    function handleSaveLesson(e) {
        e.preventDefault();
        const form = e.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const idVal = document.getElementById('lessonId')?.value;
        const moduleId = Number(document.getElementById('lessonModuleId')?.value);
        const title = (document.getElementById('lessonTitleInput')?.value || '').trim();
        const type = document.getElementById('lessonTypeSelect')?.value || 'Video';
        const duration = (document.getElementById('lessonDurationInput')?.value || '').trim();
        const orderVal = Number(document.getElementById('lessonOrderInput')?.value) || 1;
        const status = document.getElementById('lessonStatusSelect')?.value || 'Published';
        const description = (document.getElementById('lessonDescriptionInput')?.value || '').trim();
        const videoUrl = (document.getElementById('lessonContentInput')?.value || document.getElementById('lessonVideoUrlInput')?.value || '').trim();

        if (title.length < 3) {
            showToast('Lesson title must be at least 3 characters.', 'warning');
            return;
        }

        const lessonData = {
            module_id: moduleId,
            course_id: activeCurriculumCourseId,
            title: title,
            type: type,
            duration: duration || '20 Mins',
            order_num: orderVal,
            status: status,
            description: description,
            video_url: videoUrl
        };

        const store = getStore();
        try {
            if (idVal) {
                store.updateLesson(Number(idVal), lessonData);
                showToast(`Lesson "${title}" updated!`, 'success');
            } else {
                store.createLesson(lessonData);
                showToast(`Lesson "${title}" added!`, 'success');
            }

            if (lessonModal) lessonModal.hide();
            renderCurriculumModules();
            updateKpiCounters();
            filterAndRenderCourses();
        } catch (err) {
            console.error('Error saving lesson:', err);
            showToast(err.message || 'Failed to save lesson', 'error');
        }
    }

    window.moveLessonUp = function (lessonId) {
        const store = getStore();
        store.moveLesson(lessonId, 'up');
        renderCurriculumModules();
    };

    window.moveLessonDown = function (lessonId) {
        const store = getStore();
        store.moveLesson(lessonId, 'down');
        renderCurriculumModules();
    };

    window.deleteLessonConfirm = async function (lessonId) {
        const store = getStore();
        const lesson = store.getLessonById(lessonId);
        if (!lesson) return;

        let confirmed = false;
        if (window.Swal) {
            const res = await Swal.fire({
                title: `Delete "${lesson.title}"?`,
                text: 'This will permanently remove this lesson from the module.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#64748B',
                confirmButtonText: 'Yes, Delete Lesson',
                cancelButtonText: 'Cancel'
            });
            confirmed = res.isConfirmed;
        } else {
            confirmed = window.confirm(`Delete lesson "${lesson.title}"?`);
        }

        if (confirmed) {
            store.deleteLesson(lessonId);
            showToast(`Lesson "${lesson.title}" deleted.`, 'success');
            renderCurriculumModules();
            updateKpiCounters();
            filterAndRenderCourses();
        }
    };

    window.viewLessonDetails = function (lessonId) {
        const store = getStore();
        const lesson = store.getLessonById(lessonId);
        if (!lesson) return;

        const titleEl = document.getElementById('viewLessonTitle') || document.getElementById('lessonViewTitle');
        if (titleEl) titleEl.textContent = lesson.title;

        const typeEl = document.getElementById('viewLessonTypeBadge') || document.getElementById('lessonViewType');
        if (typeEl) typeEl.textContent = (lesson.type || 'Video').toUpperCase();

        const durEl = document.getElementById('viewLessonDuration') || document.getElementById('lessonViewDuration');
        if (durEl) durEl.textContent = lesson.duration || '20 Mins';

        const statusEl = document.getElementById('viewLessonStatusBadge') || document.getElementById('lessonViewStatus');
        if (statusEl) {
            const isPub = (lesson.status || 'Published') === 'Published';
            statusEl.innerHTML = `<span class="status-subtle ${isPub ? 'status-published' : 'status-draft'}"><span class="status-dot"></span>${lesson.status || 'Published'}</span>`;
        }

        const descEl = document.getElementById('viewLessonDescription') || document.getElementById('lessonViewDescription');
        if (descEl) descEl.textContent = lesson.description || 'No detailed lesson description provided.';

        const previewContainer = document.getElementById('lessonViewPreviewContainer') || document.getElementById('lessonPreviewContainer');
        if (previewContainer) {
            const type = lesson.type || 'Video';
            if (type === 'Video') {
                previewContainer.innerHTML = `
                    <div class="lesson-preview-box">
                        <i class="bi bi-play-circle-fill"></i>
                        <h6 class="text-white fw-bold mb-1">${escapeHtml(lesson.title)}</h6>
                        <p class="text-white-50 small mb-2">Streaming Video • ${escapeHtml(lesson.duration || '20 Mins')} • 1080p HD</p>
                        <span class="badge bg-primary px-3 py-1.5" style="font-size:11px;"><i class="bi bi-play-fill me-1"></i> Play Video Preview</span>
                    </div>
                `;
            } else if (type === 'Article') {
                previewContainer.innerHTML = `
                    <div class="lesson-article-view">
                        <div class="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small">
                            <i class="bi bi-file-text"></i> Article Content
                        </div>
                        <p>${escapeHtml(lesson.description || 'Welcome to this in-depth article. In this lesson, we study foundational concepts, syntax patterns, best practice conventions, and real-world architectures.')}</p>
                        <p class="m-0 text-muted small"><em>Estimated reading time: ${escapeHtml(lesson.duration || '15 Mins')}</em></p>
                    </div>
                `;
            } else if (type === 'PDF') {
                previewContainer.innerHTML = `
                    <div class="lesson-pdf-view">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                        <div class="flex-grow-1">
                            <strong class="text-dark d-block" style="font-size:13.5px;">${escapeHtml(lesson.pdf_url || `${lesson.title}.pdf`)}</strong>
                            <span class="text-muted small">Course Learning Material & Slides &bull; 2.4 MB</span>
                        </div>
                        <button class="adm-btn adm-btn-outline adm-btn-xs" onclick="alert('Demo Mode: Document preview verified.')" type="button">
                            <i class="bi bi-download"></i> Preview PDF
                        </button>
                    </div>
                `;
            } else if (type === 'Lab') {
                previewContainer.innerHTML = `
                    <div class="lesson-article-view" style="background:#F0FDF4;border-color:#BBF7D0;">
                        <div class="d-flex align-items-center gap-2 mb-2 text-success fw-bold small">
                            <i class="bi bi-laptop"></i> Hands-On Interactive Lab
                        </div>
                        <p>${escapeHtml(lesson.description || 'Interactive coding lab workspace with automated grading test cases and live output console.')}</p>
                        <span class="adm-badge-green">Interactive Sandbox</span>
                    </div>
                `;
            } else {
                previewContainer.innerHTML = `
                    <div class="lesson-assignment-view">
                        <div class="d-flex align-items-center gap-2 mb-2 text-purple fw-bold small">
                            <i class="bi bi-pencil-square"></i> Practical Assignment Brief
                        </div>
                        <p class="mb-2 text-dark small">${escapeHtml(lesson.description || 'Complete the hands-on project exercise according to the rubric requirements.')}</p>
                        <span class="adm-badge-purple">Max Score: 100 Points</span>
                    </div>
                `;
            }
        }

        if (lessonViewModal) lessonViewModal.show();
    };

    // ============================================================
    // 8. RESET DEMO DATA
    // ============================================================
    async function handleResetDemoData() {
        let confirmed = false;
        if (window.Swal) {
            const res = await Swal.fire({
                title: 'Reset Demo Data?',
                text: 'This will restore the original 5 demo courses, modules, and lessons.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2563EB',
                cancelButtonColor: '#64748B',
                confirmButtonText: 'Yes, Reset Data',
                cancelButtonText: 'Cancel'
            });
            confirmed = res.isConfirmed;
        } else {
            confirmed = window.confirm('Reset Demo Data?\nThis will restore the original 5 demo courses, modules, and lessons.');
        }

        if (confirmed) {
            const store = getStore();
            store.resetDemoData();
            showToast('Demo data restored to original catalog!', 'success');
            loadStoreData();
        }
    }

    // ============================================================
    // 9. HELPER UTILITIES
    // ============================================================
    function getLessonTypeClass(type) {
        switch ((type || '').toLowerCase()) {
            case 'video': return 'type-video';
            case 'article': return 'type-article';
            case 'pdf': return 'type-pdf';
            case 'lab': return 'type-lab';
            case 'quiz':
            case 'assignment': return 'type-assignment';
            default: return 'type-video';
        }
    }

    function getLessonTypeIcon(type) {
        switch ((type || '').toLowerCase()) {
            case 'video': return 'bi bi-play-circle-fill';
            case 'article': return 'bi bi-file-text-fill';
            case 'pdf': return 'bi bi-file-earmark-pdf-fill';
            case 'lab': return 'bi bi-laptop';
            case 'quiz': return 'bi bi-patch-question-fill';
            case 'assignment': return 'bi bi-pencil-square';
            default: return 'bi bi-play-circle-fill';
        }
    }

    function showToast(message, type = 'success') {
        if (window.AdminStore && typeof window.AdminStore.toast === 'function') {
            window.AdminStore.toast(message, type);
            return;
        }
        if (window.Swal) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            });
            Toast.fire({ icon: type, title: message });
            return;
        }
        alert(message);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Export global handlers for inline triggers
    window.loadCoursesList = loadStoreData;
    window.loadStoreData = loadStoreData;
    window.loadCourses = loadStoreData;
    window.applyCourseFilters = filterAndRenderCourses;
})();
