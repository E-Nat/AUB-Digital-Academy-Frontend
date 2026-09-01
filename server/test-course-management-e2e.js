/**
 * End-to-End Test Suite: Course Creation & Verification in Real Course Management List
 * Verifies that:
 * 1. openCreateCourseModal opens properly without infinite recursion or clobbering.
 * 2. Form submission creates course in AdminStore with all relational links.
 * 3. Course appears immediately in the real Course Management list table DOM (#courseTableBody).
 * 4. KPIs and Tab Counters update accurately.
 * 5. Search and segment filtering find the newly created course.
 * 6. LocalStorage persistence ensures newly created courses appear upon page reloads.
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;

function pass(name) {
    testsPassed++;
    console.log(`  [PASS] Test ${testsPassed}: ${name}`);
}

function fail(name, err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    process.exit(1);
}

// 1. Build a DOM environment shim
class MockElement {
    constructor(tagName, id = '') {
        this.tagName = (tagName || 'DIV').toUpperCase();
        this.id = id;
        this.className = '';
        this.classList = {
            classes: new Set(),
            add: (...cls) => cls.forEach(c => this.classList.classes.add(c)),
            remove: (...cls) => cls.forEach(c => this.classList.classes.delete(c)),
            contains: (c) => this.classList.classes.has(c),
            toggle: (c, force) => {
                if (force !== undefined) {
                    force ? this.classList.add(c) : this.classList.remove(c);
                } else {
                    this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c);
                }
            }
        };
        this.style = {};
        this.dataset = {};
        this.attributes = {};
        this.children = [];
        this.value = '';
        this.textContent = '';
        this.innerHTML = '';
        this.checked = false;
        this.disabled = false;
        this.listeners = {};
        this.src = '';
        this.files = [];
    }

    appendChild(child) {
        this.children.push(child);
    }

    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k] || null; }

    addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
    }

    dispatchEvent(event) {
        const fns = this.listeners[event.type || event] || [];
        fns.forEach(fn => fn.call(this, event));
    }

    click() {
        this.dispatchEvent({ type: 'click', preventDefault: () => {} });
    }

    focus() {}
    scrollIntoView() {}
    reset() {
        this.value = '';
        this.checked = false;
    }

    querySelector(sel) {
        return null;
    }

    querySelectorAll(sel) {
        return [];
    }
}

// Store for all mocked DOM elements
const elementsRegistry = new Map();

function getOrCreateElement(id, tagName = 'div') {
    if (!elementsRegistry.has(id)) {
        elementsRegistry.set(id, new MockElement(tagName, id));
    }
    return elementsRegistry.get(id);
}

// Setup elements required by course-management.html and course-modal.js
const requiredElementIds = [
    'courseTableBody', 'courseTable', 'courseEmptyState', 'emptyStateHeading', 'emptyStateMessage',
    'emptyAddCourseBtn', 'emptyClearBtn', 'clearFiltersBtn', 'courseSearchInput', 'courseCategoryFilter',
    'courseDifficultyFilter', 'courseStatusFilter', 'openAddCourseModalBtn', 'resetDemoDataBtn',
    'kpiTotalCourses', 'kpiActiveCourses', 'kpiTotalModules', 'kpiTotalLessons',
    'tabCountAll', 'tabCountPublished', 'tabCountDrafts', 'tabCountArchived',
    'sharedCourseModalContainer', 'courseModal', 'courseDetailModal', 'curriculumModal', 'moduleModal', 'lessonModal',
    'lessonViewModal', 'moduleForm', 'lessonForm', 'curriculumAddModuleBtn', 'curriculumEmptyAddBtn',
    'expandAllModulesBtn', 'collapseAllModulesBtn', 'detailOpenCurriculumBtn', 'detailEditCourseBtn',
    'curriculumModulesList', 'curriculumEmptyState', 'curriculumStats', 'curriculumModalTitle',
    // Course modal elements:
    'createCourseModal', 'courseForm', 'courseId', 'courseModalTitle', 'courseModalSubtitle',
    'courseTitle', 'courseTitleFeedback', 'courseCode', 'courseCodeFeedback', 'courseShortDesc',
    'courseCategorySelect', 'courseCategoryFeedback', 'courseInstructorSelect', 'courseInstructorFeedback',
    'courseDifficulty', 'courseDuration', 'coursePrice', 'courseRating', 'courseStatus',
    'courseOrderNum', 'courseFeaturedToggle', 'courseFullDesc', 'courseObjectivesContainer',
    'publishCourseBtn', 'publishCourseBtnText', 'publishCourseSpinner',
    'saveDraftCourseBtn', 'saveDraftCourseBtnText', 'saveDraftCourseSpinner',
    'courseImageFeedback', 'customCourseImageFile', 'removeCustomCourseImageBtn', 'useDefaultCourseImageBtn',
    'courseCoverPreview', 'courseCoverPlaceholder', 'currentCoverBadge', 'customImageFileName', 'customImageFileSize'
];

requiredElementIds.forEach(id => getOrCreateElement(id));

// Setup segment tabs
const segmentTabs = [
    Object.assign(new MockElement('button', 'tab_all'), { attributes: { 'data-status-filter': 'all' }, className: 'course-segment-tab active' }),
    Object.assign(new MockElement('button', 'tab_published'), { attributes: { 'data-status-filter': 'Published' }, className: 'course-segment-tab' }),
    Object.assign(new MockElement('button', 'tab_draft'), { attributes: { 'data-status-filter': 'Draft' }, className: 'course-segment-tab' }),
    Object.assign(new MockElement('button', 'tab_archived'), { attributes: { 'data-status-filter': 'Archived' }, className: 'course-segment-tab' })
];

const mockLocalStorage = {
    data: {},
    getItem(k) { return this.data[k] || null; },
    setItem(k, v) { this.data[k] = String(v); },
    removeItem(k) { delete this.data[k]; },
    clear() { this.data = {}; }
};

const windowListeners = {};

global.window = {
    location: { hostname: 'localhost', port: '5000', search: '', hash: '', protocol: 'http:' },
    localStorage: mockLocalStorage,
    addEventListener(evt, fn) {
        if (!windowListeners[evt]) windowListeners[evt] = [];
        windowListeners[evt].push(fn);
    },
    dispatchEvent(event) {
        const fns = windowListeners[event.type || event] || [];
        fns.forEach(fn => fn.call(global.window, event));
    }
};

global.document = {
    readyState: 'complete',
    getElementById(id) {
        return getOrCreateElement(id);
    },
    querySelector(sel) {
        return null;
    },
    querySelectorAll(sel) {
        if (sel === '.course-segment-tab') return segmentTabs;
        return [];
    },
    createElement(tag) {
        return new MockElement(tag);
    },
    body: getOrCreateElement('body', 'body')
};

global.localStorage = mockLocalStorage;

global.bootstrap = {
    Modal: {
        getOrCreateInstance(el) {
            return {
                show() { el.style.display = 'block'; },
                hide() { el.style.display = 'none'; }
            };
        }
    }
};

global.Swal = {
    fire: async () => ({ isConfirmed: false }),
    mixin: () => ({ fire: () => {} })
};

console.log('================================================================');
console.log('🧪 VERIFYING COURSE CREATION & REAL COURSE MANAGEMENT APPEARANCE');
console.log('================================================================\n');

async function runVerification() {
    // 1. Load mock-store.js
    eval(fs.readFileSync(path.join(__dirname, '../js/data/mock-store.js'), 'utf-8'));
    pass('AdminMockStore loaded successfully');

    // 2. Load course-modal.js
    eval(fs.readFileSync(path.join(__dirname, '../js/components/course-modal.js'), 'utf-8'));
    pass('Course Modal Component loaded');

    // 3. Load course-management.js
    eval(fs.readFileSync(path.join(__dirname, '../js/pages/course-management.js'), 'utf-8'));
    pass('Course Management Controller loaded');

    // Verify openCreateCourseModal is a function and does not crash
    if (typeof window.openCreateCourseModal !== 'function') {
        throw new Error('window.openCreateCourseModal is not defined');
    }
    pass('window.openCreateCourseModal is exported properly');

    // Initial state checks
    const initialCourses = window.AdminStore.getCourses();
    console.log(`  Initial Catalog has ${initialCourses.length} courses.`);
    if (initialCourses.length < 5) throw new Error(`Expected at least 5 courses, got ${initialCourses.length}`);
    pass(`Initial catalog verified with ${initialCourses.length} default courses`);

    // Verify initial table rendering
    const tbody = document.getElementById('courseTableBody');
    if (!tbody.innerHTML || !tbody.innerHTML.includes('course-row-title')) {
        throw new Error('Course table body was not populated on initial page load');
    }
    pass('Initial Course Management table rendered rows in DOM');

    // Initial KPI check
    const kpiTotal = document.getElementById('kpiTotalCourses');
    if (Number(kpiTotal.textContent) !== initialCourses.length) {
        throw new Error(`Expected KPI Total Courses to be ${initialCourses.length}, got ${kpiTotal.textContent}`);
    }
    pass(`Initial KPI Total Courses accurately reflects ${initialCourses.length} courses`);

    // STEP 4: Open Add New Course Modal via window.openCreateCourseModal()
    window.openCreateCourseModal();
    const titleEl = document.getElementById('courseModalTitle');
    if (titleEl.textContent !== 'Add New Course') {
        throw new Error(`Expected modal title 'Add New Course', got '${titleEl.textContent}'`);
    }
    pass('openCreateCourseModal() opened cleanly without recursion error');

    // STEP 5: Fill out course creation form
    const courseTitle = 'Advanced Cloud & Kubernetes Architecture';
    const courseCode = 'CS-CLOUD-501';
    const courseDesc = 'Comprehensive enterprise curriculum on Docker, Kubernetes orchestration, and AWS microservices.';

    document.getElementById('courseTitle').value = courseTitle;
    document.getElementById('courseCode').value = courseCode;
    document.getElementById('courseShortDesc').value = 'Master microservices and Kubernetes orchestration.';
    document.getElementById('courseCategorySelect').value = '1';
    document.getElementById('courseInstructorSelect').value = '1';
    document.getElementById('courseDifficulty').value = 'Advanced';
    document.getElementById('courseDuration').value = '16 Weeks';
    document.getElementById('coursePrice').value = '299.00';
    document.getElementById('courseRating').value = '4.95';
    document.getElementById('courseStatus').value = 'Published';
    document.getElementById('courseFullDesc').value = courseDesc;
    document.getElementById('courseFeaturedToggle').checked = true;

    pass('Filled out all Course Creation modal inputs');

    // STEP 6: Trigger Course Publish
    const publishBtn = document.getElementById('publishCourseBtn');
    publishBtn.click();

    // Allow async save to complete
    await new Promise(r => setTimeout(r, 200));

    // STEP 7: Verify course exists in AdminStore
    const allCoursesAfterAdd = window.AdminStore.getCourses();
    const addedCourse = allCoursesAfterAdd.find(c => c.code === courseCode);
    if (!addedCourse) {
        throw new Error(`Course with code ${courseCode} not found in AdminStore`);
    }
    if (addedCourse.title !== courseTitle) {
        throw new Error(`Expected title "${courseTitle}", got "${addedCourse.title}"`);
    }
    pass(`Course "${courseTitle}" created in AdminStore (ID: ${addedCourse.id})`);

    const updatedTableHtml = tbody.innerHTML;
    const escapedTitle = courseTitle.replace(/&/g, '&amp;');
    if (!updatedTableHtml.includes(escapedTitle)) {
        throw new Error(`Newly created course "${courseTitle}" is missing from #courseTableBody HTML!`);
    }
    if (!updatedTableHtml.includes(courseCode)) {
        throw new Error(`Course code "${courseCode}" is missing from #courseTableBody HTML!`);
    }
    if (!updatedTableHtml.includes('0 Modules') || !updatedTableHtml.includes('0 Lessons')) {
        throw new Error('Course curriculum counters (0 Modules • 0 Lessons) missing from table row!');
    }
    if (!updatedTableHtml.includes('Published')) {
        throw new Error('Course status "Published" missing from table row!');
    }
    pass(`Verified: Course "${courseTitle}" appears directly in the real Course Management table list`);

    // STEP 9: Verify KPI metrics updated
    const updatedKpiTotal = document.getElementById('kpiTotalCourses');
    const updatedKpiPublished = document.getElementById('kpiActiveCourses');
    if (Number(updatedKpiTotal.textContent) !== initialCourses.length + 1) {
        throw new Error(`Expected KPI Total Courses ${initialCourses.length + 1}, got ${updatedKpiTotal.textContent}`);
    }
    if (Number(updatedKpiPublished.textContent) !== initialCourses.length + 1) {
        throw new Error(`Expected KPI Published Courses ${initialCourses.length + 1}, got ${updatedKpiPublished.textContent}`);
    }
    pass(`KPI Counters updated accurately: Total Courses = ${updatedKpiTotal.textContent}, Published = ${updatedKpiPublished.textContent}`);

    // STEP 10: Verify Search filtering finds the new course
    const searchInput = document.getElementById('courseSearchInput');
    searchInput.value = 'Kubernetes';
    // Trigger input event
    searchInput.dispatchEvent({ type: 'input' });

    // Wait for debounce
    await new Promise(r => setTimeout(r, 250));

    const searchedHtml = tbody.innerHTML;
    if (!searchedHtml.includes(escapedTitle)) {
        throw new Error('Search query "Kubernetes" failed to find the newly created course!');
    }
    pass('Search query finds newly created course in table');

    // Reset search
    searchInput.value = '';
    searchInput.dispatchEvent({ type: 'input' });
    await new Promise(r => setTimeout(r, 250));

    // STEP 11: Create a second course as DRAFT
    window.openCreateCourseModal();
    const draftTitle = 'AI Ethics & Algorithmic Governance';
    const draftCode = 'CS-ETH-301';

    document.getElementById('courseTitle').value = draftTitle;
    document.getElementById('courseCode').value = draftCode;
    document.getElementById('courseShortDesc').value = 'Exploring bias, accountability, and AI ethics.';
    document.getElementById('courseCategorySelect').value = '2';
    document.getElementById('courseInstructorSelect').value = '2';
    document.getElementById('courseDifficulty').value = 'Intermediate';
    document.getElementById('courseStatus').value = 'Draft';
    document.getElementById('courseFullDesc').value = 'Comprehensive study on responsible artificial intelligence.';

    const saveDraftBtn = document.getElementById('saveDraftCourseBtn');
    saveDraftBtn.click();
    await new Promise(r => setTimeout(r, 200));

    // Verify Draft course is in table under Drafts tab
    const tabDraftCount = document.getElementById('tabCountDrafts');
    if (Number(tabDraftCount.textContent) !== 1) {
        throw new Error(`Expected Draft count to be 1, got ${tabDraftCount.textContent}`);
    }
    pass(`Draft course created and verified in tab counters: Drafts = ${tabDraftCount.textContent}`);

    // STEP 12: Verify LocalStorage persistence across page reload
    const storedState = mockLocalStorage.getItem('aub_admin_mock_store_v4') || mockLocalStorage.getItem('aub_admin_mock_store_v3');
    if (!storedState) throw new Error('localStorage is empty! Courses were not persisted.');

    // Simulate page reload by re-running loadStoreData()
    window.loadStoreData();
    const reloadedTableHtml = tbody.innerHTML;
    const escapedDraftTitle = draftTitle.replace(/&/g, '&amp;');
    if (!reloadedTableHtml.includes(escapedDraftTitle)) {
        throw new Error('Draft course disappeared after reload!');
    }
    pass(`Simulated reload: Verified all newly created courses persist in the real Course Management list`);

    console.log('\n================================================================');
    console.log(`✅ ALL ${testsPassed} VERIFICATION TESTS PASSED (100% SUCCESS)`);
    console.log('================================================================');
}

runVerification().catch(err => {
    fail('E2E Verification Suite Failed', err);
});
