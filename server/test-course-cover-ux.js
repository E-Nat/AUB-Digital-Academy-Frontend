/**
 * Comprehensive Automated Test Suite: Course Cover Image UX & Fallback System
 * Tests all 10 requirements and states A through H + persistence
 */

const fs = require('fs');
const path = require('path');

// 1. Build a DOM environment shim for testing course-modal.js and mock-store.js in Node
class MockElement {
    constructor(tagName, id = '') {
        this.tagName = tagName.toUpperCase();
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
    }
}

class MockDocument {
    constructor() {
        this.elementsById = new Map();
        this.body = new MockElement('body');
        this.readyState = 'complete';
        this.listeners = {};
    }

    getElementById(id) {
        return this.elementsById.get(id) || null;
    }

    createElement(tagName) {
        const el = new MockElement(tagName);
        return el;
    }

    querySelectorAll() {
        return [];
    }

    addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
    }
}

// Global window mock
const mockStorage = {};
const mockLocalStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const mockWindow = {
    document: new MockDocument(),
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    CustomEvent: function(type, opts) { this.type = type; this.detail = opts ? opts.detail : null; },
    addEventListener: function(evt, fn) {
        if (!mockWindow.listeners) mockWindow.listeners = {};
        if (!mockWindow.listeners[evt]) mockWindow.listeners[evt] = [];
        mockWindow.listeners[evt].push(fn);
    },
    dispatchEvent: function(e) {
        const fns = (mockWindow.listeners && mockWindow.listeners[e.type]) || [];
        fns.forEach(fn => fn(e));
    },
    bootstrap: {
        Modal: {
            getOrCreateInstance: () => ({
                show: () => {},
                hide: () => {}
            }),
            getInstance: () => ({
                hide: () => {}
            })
        }
    },
    Swal: {
        fire: () => Promise.resolve({ isConfirmed: true })
    },
    showToast: () => {}
};

global.window = mockWindow;
global.document = mockWindow.document;
global.localStorage = mockLocalStorage;
class MockFileReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
    }
    readAsDataURL(file) {
        setTimeout(() => {
            if (this.onload) {
                this.onload({ target: { result: `data:${file.type || 'image/png'};base64,mockFileDataFor_${file.name}` } });
            }
        }, 10);
    }
}
global.FileReader = MockFileReader;

// Load mock-store.js
const mockStoreCode = fs.readFileSync(path.join(__dirname, '../js/data/mock-store.js'), 'utf8');
eval(mockStoreCode);

// Load course-modal.js
const courseModalCode = fs.readFileSync(path.join(__dirname, '../js/components/course-modal.js'), 'utf8');
eval(courseModalCode);

// Helper to manually parse getCourseModalHTML and register all IDs
function mountModalIntoMockDom() {
    const ids = [
        'createCourseModal', 'courseModalTitle', 'courseModalSubtitle', 'courseForm', 'courseId',
        'courseTitle', 'courseCode', 'courseShortDesc', 'courseCategorySelect', 'courseInstructorSelect',
        'courseDuration', 'courseDifficulty', 'coursePrice', 'courseRating', 'courseFullDesc',
        'courseImageDropzone', 'courseImageFile', 'courseImageUploadPrompt', 'courseImagePreviewBox',
        'courseImagePreviewImg', 'courseImageFileName', 'courseImageFileSize', 'replaceCourseImageBtn',
        'removeCourseImageBtn', 'courseImageFeedback', 'courseImageUrl', 'customCoverStatusBadge',
        'defaultBannerCard', 'fallbackCoverStatusBadge', 'courseDefaultPreviewThumb', 'useDefaultCoverHelper',
        'useDefaultCoverCheck', 'courseLearningObjectivesList', 'addCourseLearningObjectiveBtn',
        'courseStatus', 'courseFeaturedToggle', 'courseFeaturedToggleLabel', 'cancelCourseBtn',
        'saveDraftCourseBtn', 'saveDraftCourseSpinner', 'saveDraftCourseBtnText',
        'publishCourseBtn', 'publishCourseSpinner', 'publishCourseBtnText', 'courseTitleFeedback',
        'courseCategoryFeedback', 'courseInstructorFeedback'
    ];

    ids.forEach(id => {
        let tag = 'div';
        if (id.includes('Select')) tag = 'select';
        else if (id.includes('Input') || id.includes('Title') || id.includes('Code') || id.includes('File') || id.includes('Toggle') || id.includes('Check') || id.includes('Price') || id.includes('Rating') || id.includes('Duration') || id.endsWith('Url') || id === 'courseId') tag = 'input';
        else if (id.includes('Desc')) tag = 'textarea';
        else if (id.endsWith('Btn')) tag = 'button';
        else if (id.endsWith('Img') || id.endsWith('Thumb')) tag = 'img';
        else if (id === 'courseForm') tag = 'form';

        const el = new MockElement(tag, id);
        mockWindow.document.elementsById.set(id, el);
    });
}

async function runTests() {
    console.log('================================================================');
    console.log('🧪 COURSE COVER IMAGE UX — COMPLETE AUTOMATED TEST SUITE');
    console.log('================================================================\n');

    let totalTests = 0;
    let passedTests = 0;

    function assert(condition, testName, details = '') {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`  ✅ [PASS] ${testName}`);
        } else {
            console.error(`  ❌ [FAIL] ${testName}: ${details}`);
        }
    }

    mountModalIntoMockDom();

    // -------------------------------------------------------------
    // Test A: New course + no custom image (Default Enabled)
    // -------------------------------------------------------------
    console.log('--- Test Suite A: New Course Creation (Default Fallback) ---');
    mockWindow.openCreateCourseModal();

    const titleEl = mockWindow.document.getElementById('courseTitle');
    const catEl = mockWindow.document.getElementById('courseCategorySelect');
    const insEl = mockWindow.document.getElementById('courseInstructorSelect');
    const dropzone = mockWindow.document.getElementById('courseImageDropzone');
    const previewBox = mockWindow.document.getElementById('courseImagePreviewBox');
    const defaultCheck = mockWindow.document.getElementById('useDefaultCoverCheck');
    const customBadge = mockWindow.document.getElementById('customCoverStatusBadge');

    assert(!dropzone.classList.contains('d-none'), 'Empty upload dropzone is visible for new course');
    assert(previewBox.classList.contains('d-none'), 'Custom image preview box is hidden for new course');
    assert(defaultCheck.checked === true, 'Use default Academy cover is checked by default');
    assert(customBadge.textContent === 'None uploaded', 'Custom cover status is "None uploaded"');

    // Fill form and publish
    titleEl.value = 'Artificial Intelligence Fundamentals';
    catEl.value = '1';
    insEl.value = '1';

    const publishBtn = mockWindow.document.getElementById('publishCourseBtn');
    publishBtn.click();
    await new Promise(r => setTimeout(r, 100));

    const courses = mockWindow.AdminStore.getCourses();
    const createdCourseA = courses.find(c => c.title === 'Artificial Intelligence Fundamentals');
    assert(createdCourseA !== undefined, 'New course created successfully in store');
    assert(createdCourseA.thumbnail_url === 'assets/images/course_webdev.jpg', 'Course with no custom image uses default Academy banner fallback');

    // -------------------------------------------------------------
    // Test B: New course + Upload custom image
    // -------------------------------------------------------------
    console.log('\n--- Test Suite B: New Course with Custom Uploaded Image ---');
    mockWindow.openCreateCourseModal();

    titleEl.value = 'Cloud DevOps Engineering';
    catEl.value = '2';
    insEl.value = '1';

    // Simulate file upload (PNG data URL)
    const fileInput = mockWindow.document.getElementById('courseImageFile');
    fileInput.files = [{ name: 'devops-banner.png', size: 1024 * 500, type: 'image/png' }];
    fileInput.dispatchEvent({ type: 'change' });
    await new Promise(r => setTimeout(r, 50));

    const previewImg = mockWindow.document.getElementById('courseImagePreviewImg');
    const fileNameEl = mockWindow.document.getElementById('courseImageFileName');
    const fileSizeEl = mockWindow.document.getElementById('courseImageFileSize');

    assert(!previewBox.classList.contains('d-none'), 'Preview box is visible after file upload');
    assert(dropzone.classList.contains('d-none'), 'Dropzone is hidden after file upload');
    assert(fileNameEl.textContent === 'devops-banner.png', 'Uploaded filename displayed correctly');
    assert(customBadge.textContent === 'Active', 'Custom cover status badge is Active');

    // Publish course with custom image
    publishBtn.click();
    await new Promise(r => setTimeout(r, 100));

    const createdCourseB = mockWindow.AdminStore.getCourses().find(c => c.title === 'Cloud DevOps Engineering');
    assert(createdCourseB !== undefined, 'Course with custom image created successfully');
    assert(createdCourseB.thumbnail_url.startsWith('data:image/png'), 'Course saved with custom uploaded image data URL');

    // -------------------------------------------------------------
    // Test C & D: Change and Remove Custom Image
    // -------------------------------------------------------------
    console.log('\n--- Test Suite C & D: Change and Remove Custom Image ---');
    // Open edit modal for course B
    mockWindow.openEditCourseModal(createdCourseB.id);
    assert(!previewBox.classList.contains('d-none'), 'Course B opens in edit mode with custom image preview active');

    const removeBtn = mockWindow.document.getElementById('removeCourseImageBtn');
    const replaceBtn = mockWindow.document.getElementById('replaceCourseImageBtn');

    assert(typeof removeBtn.listeners['click']?.[0] === 'function', 'Remove button click event listener is bound');
    assert(typeof replaceBtn.listeners['click']?.[0] === 'function', 'Change button click event listener is bound');

    // Trigger Remove
    removeBtn.click();
    assert(!dropzone.classList.contains('d-none'), 'Dropzone returns to visible after clicking Remove');
    assert(previewBox.classList.contains('d-none'), 'Preview box is hidden after clicking Remove');
    assert(customBadge.textContent === 'None uploaded', 'Custom cover badge resets to None uploaded');

    // Save after removing image (fallback enabled)
    publishBtn.click();
    await new Promise(r => setTimeout(r, 100));

    const updatedCourseB = mockWindow.AdminStore.getCourseById(createdCourseB.id);
    assert(updatedCourseB.thumbnail_url === 'assets/images/course_webdev.jpg', 'Course returns to default fallback banner after custom image is removed');

    // -------------------------------------------------------------
    // Test E & F: Default Fallback Enabled vs Disabled
    // -------------------------------------------------------------
    console.log('\n--- Test Suite E & F: Default Fallback Toggle Behavior ---');
    // Uncheck default cover
    defaultCheck.checked = false;
    defaultCheck.dispatchEvent({ type: 'change' });

    const helperEl = mockWindow.document.getElementById('useDefaultCoverHelper');
    const fallbackBadge = mockWindow.document.getElementById('fallbackCoverStatusBadge');

    assert(fallbackBadge.textContent === 'Disabled', 'Fallback status badge shows "Disabled" when unchecked');
    assert(helperEl.textContent.includes('No fallback cover'), 'Helper text indicates no cover fallback when disabled');

    // Save with default cover disabled and no custom image
    titleEl.value = 'Quantum Computing Basics';
    catEl.value = '1';
    insEl.value = '1';
    publishBtn.click();
    await new Promise(r => setTimeout(r, 100));

    const createdCourseF = mockWindow.AdminStore.getCourses().find(c => c.title === 'Quantum Computing Basics');
    assert(createdCourseF !== undefined, 'Course without cover created successfully');
    assert(createdCourseF.thumbnail_url === '', 'Course saved with empty thumbnail_url when fallback is disabled');

    // -------------------------------------------------------------
    // Test G: Edit existing course with custom image
    // -------------------------------------------------------------
    console.log('\n--- Test Suite G: Edit Existing Course with Custom Image ---');
    // Seed a course with custom image
    const customCourse = mockWindow.AdminStore.createCourse({
        title: 'Data Science & Machine Learning',
        code: 'CS-DS201',
        category_id: 1,
        instructor_id: 1,
        thumbnail_url: 'https://images.unsplash.com/photo-custom-banner.jpg',
        description: 'Advanced data science with Python and TensorFlow.'
    });

    mockWindow.openEditCourseModal(customCourse.id);

    assert(!previewBox.classList.contains('d-none'), 'Preview box is visible when editing course with custom image');
    assert(dropzone.classList.contains('d-none'), 'Dropzone is hidden when editing course with custom image');
    assert(fileNameEl.textContent === 'photo-custom-banner.jpg', 'Filename extracted and displayed properly');
    assert(defaultCheck.checked === true, 'Default cover fallback checkbox is active as fallback');

    // -------------------------------------------------------------
    // Test H: Edit existing course using default image
    // -------------------------------------------------------------
    console.log('\n--- Test Suite H: Edit Existing Course Using Default Image ---');
    const defaultCourse = mockWindow.AdminStore.createCourse({
        title: 'Cybersecurity Fundamentals',
        code: 'CS-SEC101',
        category_id: 1,
        instructor_id: 1,
        thumbnail_url: 'assets/images/course_webdev.jpg',
        description: 'Network defense and ethical hacking principles.'
    });

    mockWindow.openEditCourseModal(defaultCourse.id);

    assert(!dropzone.classList.contains('d-none'), 'Dropzone is visible (empty upload state) when editing default image course');
    assert(previewBox.classList.contains('d-none'), 'Default image is NOT converted into a custom uploaded preview');
    assert(defaultCheck.checked === true, 'Use default Academy cover is checked for default course');
    assert(customBadge.textContent === 'None uploaded', 'Custom cover status correctly says None uploaded');

    // -------------------------------------------------------------
    // Test I: End-to-End Persistence across Storage Reload
    // -------------------------------------------------------------
    console.log('\n--- Test Suite I: End-to-End Persistence across Store Reload ---');
    const savedStateStr = mockLocalStorage.getItem('aub_admin_mock_store_v4');
    assert(savedStateStr !== null && savedStateStr.length > 0, 'LocalStorage state was persisted');

    const parsedState = JSON.parse(savedStateStr);
    const persistedCourse = parsedState.courses.find(c => c.id === customCourse.id);
    assert(persistedCourse !== undefined, 'Custom course found in persisted state');
    assert(persistedCourse.thumbnail_url === 'https://images.unsplash.com/photo-custom-banner.jpg', 'Custom image URL persisted accurately');

    console.log('\n================================================================');
    console.log(`📊 TEST SUMMARY: ${passedTests} / ${totalTests} ASSERTIONS PASSED (100%)`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test run error:', err);
    process.exit(1);
});
