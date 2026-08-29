/**
 * AUB Digital Academy — Shared Course Modal Component
 * Unified, single-source component for adding and editing courses
 * Used across Academic Management and Course Management
 */

(function (global) {
    'use strict';

    let courseLearningObjectives = [];
    let isSubmittingCourse = false;
    let modalInstance = null;

    const DEFAULT_COURSE_THUMBNAIL = 'assets/images/course_webdev.jpg';

    // HTML Template for Shared Course Modal
    function getCourseModalHTML() {
        return `
    <div class="modal fade" id="createCourseModal" tabindex="-1" aria-labelledby="courseModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered course-modal-dialog">
            <div class="modal-content course-modal-content">
                <!-- Modal Header -->
                <div class="modal-header course-modal-header d-flex align-items-center justify-content-between">
                    <div>
                        <h5 class="modal-title fw-bold text-dark mb-0 fs-5" id="courseModalTitle">Add New Course</h5>
                        <p class="text-muted text-xs mb-0 mt-0.5" id="courseModalSubtitle">Add a new specialized course to AUB Digital Academy.</p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close course dialog"></button>
                </div>

                <!-- Modal Form -->
                <form id="courseForm" class="course-modal-form" novalidate>
                    <input type="hidden" id="courseId" value="">

                    <!-- Modal Body (Scrollable) -->
                    <div class="modal-body course-modal-body">
                        <!-- 1. BASIC INFORMATION -->
                        <div class="mb-4">
                            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                <i class="bi bi-info-circle text-primary fs-6"></i>
                                <h6 class="fw-bold text-uppercase text-xs text-secondary mb-0 letter-spacing-1">Basic Information</h6>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-8">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseTitle">
                                        Course Title <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" class="form-control" id="courseTitle" placeholder="e.g. Full-Stack Web Development" required autocomplete="off">
                                    <div class="invalid-feedback text-xs" id="courseTitleFeedback">Course title is required (minimum 3 characters).</div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseCode">
                                        Course Code <span class="badge bg-light text-secondary border fw-normal text-xs ms-1">Optional</span>
                                    </label>
                                    <input type="text" class="form-control text-uppercase font-monospace" id="courseCode" placeholder="e.g. CS-WD101" maxlength="20" autocomplete="off">
                                    <div class="invalid-feedback text-xs" id="courseCodeFeedback">A course with this code already exists.</div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseShortDesc">
                                        Short Description <span class="badge bg-light text-secondary border fw-normal text-xs ms-1">Optional</span>
                                    </label>
                                    <textarea class="form-control" id="courseShortDesc" rows="2" placeholder="Brief summary of this course for cards and overviews..."></textarea>
                                    <div class="form-text text-xs text-muted">A concise summary used in course cards, catalogs, and student dashboards.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseCategorySelect">
                                        Category <span class="text-danger">*</span>
                                    </label>
                                    <select class="form-select" id="courseCategorySelect" required>
                                        <option value="" disabled selected>Select category...</option>
                                    </select>
                                    <div class="invalid-feedback text-xs" id="courseCategoryFeedback">Please select a category.</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseInstructorSelect">
                                        Instructor <span class="text-danger">*</span>
                                    </label>
                                    <select class="form-select" id="courseInstructorSelect" required>
                                        <option value="" disabled selected>Select instructor...</option>
                                    </select>
                                    <div class="invalid-feedback text-xs" id="courseInstructorFeedback">Please select an assigned instructor.</div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. COURSE DETAILS -->
                        <div class="mb-4">
                            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                <i class="bi bi-journal-text text-primary fs-6"></i>
                                <h6 class="fw-bold text-uppercase text-xs text-secondary mb-0 letter-spacing-1">Course Details</h6>
                            </div>
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseDuration">
                                        Duration
                                    </label>
                                    <input type="text" class="form-control" id="courseDuration" placeholder="e.g. 8 Weeks" value="8 Weeks">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseDifficulty">
                                        Difficulty
                                    </label>
                                    <select class="form-select" id="courseDifficulty">
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate" selected>Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                    <div class="invalid-feedback text-xs" id="courseDifficultyFeedback"></div>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="coursePrice">
                                        Price ($ USD)
                                    </label>
                                    <input type="number" class="form-control" id="coursePrice" placeholder="0.00" value="0.00" min="0" step="0.01">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseRating">
                                        Rating (1.0 - 5.0)
                                    </label>
                                    <input type="number" class="form-control" id="courseRating" placeholder="4.9" value="4.9" min="1.0" max="5.0" step="0.1">
                                </div>
                                <div class="col-12">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseFullDesc">
                                        Full Description <span class="badge bg-light text-secondary border fw-normal text-xs ms-1">Optional</span>
                                    </label>
                                    <textarea class="form-control" id="courseFullDesc" rows="3" placeholder="Comprehensive course description, syllabus overview, prerequisites, and learning roadmap..."></textarea>
                                    <div class="invalid-feedback text-xs" id="courseFullDescFeedback"></div>
                                </div>

                                <!-- Course Cover Image -->
                                <div class="col-12">
                                    <div class="p-3 bg-light rounded-3 border">
                                        <div class="d-flex align-items-center justify-content-between mb-2">
                                            <div class="d-flex align-items-center gap-1.5">
                                                <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-0">
                                                    Course Cover Image
                                                </label>
                                                <span class="badge bg-white text-secondary border fw-normal text-xs">Optional</span>
                                            </div>
                                            <span class="text-muted text-xs">JPG, PNG, WebP up to 5MB</span>
                                        </div>
                                        <div class="row g-3 align-items-center">
                                            <div class="col-md-6">
                                                <div class="course-image-dropzone p-3 text-center border border-2 border-dashed rounded-3 bg-white position-relative" id="courseImageDropzone">
                                                    <input type="file" id="courseImageFile" class="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" accept="image/png, image/jpeg, image/jpg, image/webp" aria-label="Upload course cover image">
                                                    <div id="courseImageUploadPrompt">
                                                        <i class="bi bi-cloud-arrow-up text-primary fs-4 mb-1 d-block"></i>
                                                        <div class="fw-semibold text-dark text-xs mb-0.5">Upload Cover Image</div>
                                                        <div class="text-secondary text-xs opacity-75" style="font-size: 11px;">Browse or drag &amp; drop</div>
                                                    </div>
                                                </div>
                                                <div class="course-upload-preview p-2 bg-white border rounded-3 d-none align-items-center justify-content-between mt-2" id="courseImagePreviewBox">
                                                    <div class="d-flex align-items-center gap-2">
                                                        <img src="" alt="Course Cover Preview" id="courseImagePreviewImg" class="rounded border object-fit-cover bg-light" style="width: 50px; height: 38px;">
                                                        <div>
                                                            <div class="fw-bold text-dark text-xs text-truncate" style="max-width: 140px;" id="courseImageFileName">cover.jpg</div>
                                                            <div class="text-muted" style="font-size: 10px;" id="courseImageFileSize">Image loaded</div>
                                                        </div>
                                                    </div>
                                                    <div class="d-flex gap-1">
                                                        <button type="button" class="btn btn-outline-primary btn-sm py-0.5 px-2 rounded-pill text-xs" id="replaceCourseImageBtn" aria-label="Change course image">
                                                            <i class="bi bi-arrow-repeat me-1"></i> Change
                                                        </button>
                                                        <button type="button" class="btn btn-outline-danger btn-sm py-0.5 px-2 rounded-pill text-xs" id="removeCourseImageBtn" aria-label="Remove course image">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="invalid-feedback d-block text-xs mt-1 d-none" id="courseImageFeedback"></div>
                                                <input type="hidden" id="courseImageUrl" value="assets/images/course_webdev.jpg">
                                            </div>
                                            <div class="col-md-6">
                                                <div class="p-2.5 bg-white rounded border d-flex align-items-center gap-2.5">
                                                    <img src="../../assets/images/course_webdev.jpg" id="courseDefaultPreviewThumb" class="rounded border object-fit-cover" style="width: 54px; height: 40px;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=150'">
                                                    <div>
                                                        <div class="fw-semibold text-dark text-xs" id="courseDefaultThumbLabel">Default Academy Banner</div>
                                                        <div class="text-muted" style="font-size: 11px;">Standard high-resolution course cover if no custom file is uploaded.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Learning Objectives (Dynamic List) -->
                                <div class="col-12">
                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <div class="d-flex align-items-center gap-1.5">
                                            <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-0">
                                                Learning Objectives
                                            </label>
                                            <span class="badge bg-light text-secondary border fw-normal text-xs">Optional</span>
                                        </div>
                                        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3 text-xs" id="addCourseLearningObjectiveBtn">
                                            <i class="bi bi-plus-lg me-1"></i> Add Objective
                                        </button>
                                    </div>
                                    <div class="d-flex flex-column gap-2" id="courseLearningObjectivesList">
                                        <!-- Dynamic inputs rendered here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. CURRICULUM INTEGRATION -->
                        <div class="mb-4">
                            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                <i class="bi bi-collection text-primary fs-6"></i>
                                <h6 class="fw-bold text-uppercase text-xs text-secondary mb-0 letter-spacing-1">Curriculum</h6>
                            </div>
                            <div class="p-3 bg-light rounded-3 border">
                                <div class="d-flex align-items-start gap-2.5">
                                    <i class="bi bi-diagram-3 text-primary fs-5 mt-0.5"></i>
                                    <div>
                                        <div class="fw-semibold text-dark small">Course &rarr; Module &rarr; Lesson Structure</div>
                                        <p class="text-muted text-xs mb-0 mt-0.5">New courses start with 0 modules and 0 lessons. After creating the course, use Curriculum Builder to organize modules, lessons, videos, articles, and quizzes.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 4. PUBLISHING & VISIBILITY -->
                        <div class="mb-2">
                            <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                                <i class="bi bi-sliders text-primary fs-6"></i>
                                <h6 class="fw-bold text-uppercase text-xs text-secondary mb-0 letter-spacing-1">Publishing &amp; Visibility</h6>
                            </div>
                            <div class="row g-3 align-items-center">
                                <div class="col-md-6">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1" for="courseStatus">
                                        Status <span class="text-danger">*</span>
                                    </label>
                                    <select class="form-select" id="courseStatus" required>
                                        <option value="Published" selected>Published (Visible to Students)</option>
                                        <option value="Draft">Draft (Hidden in Catalog)</option>
                                        <option value="Archived">Archived</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label text-xs fw-bold text-uppercase text-secondary mb-1 d-block">
                                        Featured / Popular Course
                                    </label>
                                    <div class="d-flex align-items-center gap-3 p-2 bg-light rounded-3 border">
                                        <div class="form-check form-switch mb-0">
                                            <input class="form-check-input" type="checkbox" id="courseFeaturedToggle" role="switch">
                                            <label class="form-check-label text-xs fw-bold text-muted" for="courseFeaturedToggle" id="courseFeaturedToggleLabel">OFF</label>
                                        </div>
                                        <span class="text-muted text-xs">Highlight as popular/featured course.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer (Fixed at bottom) -->
                    <div class="modal-footer course-modal-footer d-flex justify-content-end gap-2 flex-shrink-0">
                        <button type="button" class="adm-btn adm-btn-outline" data-bs-dismiss="modal" id="cancelCourseBtn">Cancel</button>
                        <button type="button" class="adm-btn adm-btn-outline" id="saveDraftCourseBtn">
                            <span class="spinner-border spinner-border-sm d-none me-1" id="saveDraftCourseSpinner" role="status" aria-hidden="true"></span>
                            <span id="saveDraftCourseBtnText">Save as Draft</span>
                        </button>
                        <button type="button" class="adm-btn adm-btn-primary" id="publishCourseBtn">
                            <span class="spinner-border spinner-border-sm d-none me-1" id="publishCourseSpinner" role="status" aria-hidden="true"></span>
                            <span id="publishCourseBtnText">Publish Course</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
        `;
    }

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Toast helper across admin pages
    function showCourseToast(type, title, message) {
        if (typeof global.showToast === 'function') {
            global.showToast(type, title, message);
        } else if (global.Swal) {
            global.Swal.fire({
                title: title,
                text: message,
                icon: type === 'danger' || type === 'error' ? 'error' : (type === 'success' ? 'success' : 'info'),
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            console.log(`[Toast ${type}] ${title}: ${message}`);
        }
    }

    // Mount or ensure modal exists in DOM
    function ensureCourseModalMounted() {
        let modalEl = document.getElementById('createCourseModal');
        if (!modalEl) {
            let container = document.getElementById('sharedCourseModalContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'sharedCourseModalContainer';
                document.body.appendChild(container);
            }
            container.innerHTML = getCourseModalHTML();
            modalEl = document.getElementById('createCourseModal');
        }
        setupCourseModalEvents();
        return modalEl;
    }

    // Reset validation visual states
    function clearCourseValidation() {
        const fields = ['courseTitle', 'courseCode', 'courseCategorySelect', 'courseInstructorSelect', 'courseDifficulty', 'courseFullDesc'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('is-invalid', 'is-valid');
            }
        });
        const feedback = document.getElementById('courseImageFeedback');
        if (feedback) {
            feedback.classList.add('d-none');
            feedback.textContent = '';
        }
    }

    function setFieldInvalid(fieldId, feedbackId, message) {
        const el = document.getElementById(fieldId);
        if (el) {
            el.classList.add('is-invalid');
            el.classList.remove('is-valid');
        }
        if (feedbackId) {
            const fb = document.getElementById(feedbackId);
            if (fb && message) fb.textContent = message;
        }
    }

    function setFieldValid(fieldId) {
        const el = document.getElementById(fieldId);
        if (el) {
            el.classList.remove('is-invalid');
            el.classList.add('is-valid');
        }
    }

    // Populate Category and Instructor Select Dropdowns
    function populateCourseSelects(selectedCategoryId = null, selectedInstructorId = null) {
        const catSelect = document.getElementById('courseCategorySelect');
        const insSelect = document.getElementById('courseInstructorSelect');

        // 1. Categories
        if (catSelect) {
            let categories = [];
            if (global.AdminStore && typeof global.AdminStore.getCategories === 'function') {
                categories = global.AdminStore.getCategories();
            }
            if (categories.length > 0) {
                catSelect.innerHTML = `<option value="" disabled ${!selectedCategoryId ? 'selected' : ''}>Select category...</option>` + categories.map(cat => `
                    <option value="${cat.id}" ${Number(selectedCategoryId) === Number(cat.id) ? 'selected' : ''}>${escapeHtml(cat.name)}</option>
                `).join('');
            }
            if (selectedCategoryId) {
                catSelect.value = String(selectedCategoryId);
            } else {
                catSelect.value = '';
            }
        }

        // 2. Instructors
        if (insSelect) {
            let instructors = [];
            if (global.AdminStore && typeof global.AdminStore.getInstructors === 'function') {
                instructors = global.AdminStore.getInstructors();
            }
            if (instructors.length > 0) {
                insSelect.innerHTML = `<option value="" disabled ${!selectedInstructorId ? 'selected' : ''}>Select instructor...</option>` + instructors.map(ins => {
                    const roleOrDept = ins.title || ins.department_name || ins.faculty || 'Faculty Lead';
                    return `<option value="${ins.id}" ${Number(selectedInstructorId) === Number(ins.id) ? 'selected' : ''}>${escapeHtml(ins.name)} (${escapeHtml(roleOrDept)})</option>`;
                }).join('');
            }
            if (selectedInstructorId) {
                insSelect.value = String(selectedInstructorId);
            } else {
                insSelect.value = '';
            }
        }
    }

    // Image Upload & Preview Controls
    function setCourseImagePreview(url, fileName = 'cover.jpg', fileSize = 'Custom image loaded') {
        const urlInput = document.getElementById('courseImageUrl');
        const previewBox = document.getElementById('courseImagePreviewBox');
        const previewImg = document.getElementById('courseImagePreviewImg');
        const nameEl = document.getElementById('courseImageFileName');
        const sizeEl = document.getElementById('courseImageFileSize');
        const dropzone = document.getElementById('courseImageDropzone');

        if (urlInput) urlInput.value = url;
        if (previewImg) {
            const imgSrc = (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) ? url : ('../../' + url);
            previewImg.src = imgSrc;
        }
        if (nameEl) nameEl.textContent = fileName;
        if (sizeEl) sizeEl.textContent = fileSize;

        if (previewBox) {
            previewBox.classList.remove('d-none');
            previewBox.classList.add('d-flex');
        }
        if (dropzone) {
            dropzone.classList.add('d-none');
        }
    }

    function resetCourseImage() {
        const urlInput = document.getElementById('courseImageUrl');
        const previewBox = document.getElementById('courseImagePreviewBox');
        const dropzone = document.getElementById('courseImageDropzone');
        const fileInput = document.getElementById('courseImageFile');

        if (urlInput) urlInput.value = DEFAULT_COURSE_THUMBNAIL;
        if (fileInput) fileInput.value = '';
        if (previewBox) {
            previewBox.classList.add('d-none');
            previewBox.classList.remove('d-flex');
        }
        if (dropzone) {
            dropzone.classList.remove('d-none');
        }
    }

    function handleCourseImageFile(file) {
        const feedback = document.getElementById('courseImageFeedback');
        if (feedback) {
            feedback.classList.add('d-none');
            feedback.textContent = '';
        }

        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
        const validExts = ['jpg', 'jpeg', 'png', 'webp'];

        if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
            if (feedback) {
                feedback.textContent = 'Invalid file format. Supported formats: JPG, PNG, WebP.';
                feedback.classList.remove('d-none');
            }
            showCourseToast('warning', 'Invalid File Format', 'Please select a JPG, PNG, or WebP image.');
            return;
        }

        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            if (feedback) {
                feedback.textContent = 'Image exceeds 5MB limit. Please select an image smaller than 5MB.';
                feedback.classList.remove('d-none');
            }
            showCourseToast('warning', 'File Too Large', 'Course image must be smaller than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            setCourseImagePreview(e.target.result, file.name, sizeStr);
        };
        reader.readAsDataURL(file);
    }

    // Dynamic Learning Objectives
    function renderCourseLearningObjectives() {
        const container = document.getElementById('courseLearningObjectivesList');
        if (!container) return;

        if (!Array.isArray(courseLearningObjectives) || courseLearningObjectives.length === 0) {
            container.innerHTML = '<div class="text-muted text-xs py-2 px-3 text-center border rounded-2 bg-white"><i class="bi bi-info-circle me-1"></i>No learning objectives added yet. Click "+ Add Objective" to add one.</div>';
            return;
        }

        container.innerHTML = courseLearningObjectives.map((obj, idx) => `
            <div class="learning-objective-row" data-index="${idx}">
                <input type="text" class="form-control text-xs" value="${escapeHtml(obj)}" placeholder="Students will understand / master..." oninput="window.updateCourseObjective(${idx}, this.value)" autocomplete="off">
                <button type="button" class="learning-objective-remove-btn" onclick="window.removeCourseObjective(${idx})" title="Remove objective" aria-label="Remove objective">
                    <i class="bi bi-dash-lg"></i>
                </button>
            </div>
        `).join('');
    }

    global.updateCourseObjective = function (idx, val) {
        if (courseLearningObjectives[idx] !== undefined) {
            courseLearningObjectives[idx] = val;
        }
    };

    global.removeCourseObjective = function (idx) {
        courseLearningObjectives.splice(idx, 1);
        renderCourseLearningObjectives();
    };

    // Validation Engine (Required: Title, Category, Instructor)
    function validateCourseForm() {
        clearCourseValidation();
        let isValid = true;
        let firstInvalidEl = null;

        const titleEl = document.getElementById('courseTitle');
        const catEl = document.getElementById('courseCategorySelect');
        const insEl = document.getElementById('courseInstructorSelect');
        const codeEl = document.getElementById('courseCode');
        const idVal = document.getElementById('courseId')?.value;

        // 1. Title (required min 3 chars)
        if (!titleEl || !titleEl.value.trim()) {
            setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course title is required (minimum 3 characters).');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else if (titleEl.value.trim().length < 3) {
            setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course title must be at least 3 characters.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = titleEl;
        } else {
            setFieldValid('courseTitle');
        }

        // 2. Category (required)
        if (!catEl || !catEl.value) {
            setFieldInvalid('courseCategorySelect', 'courseCategoryFeedback', 'Please select an academic category.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = catEl;
        } else {
            setFieldValid('courseCategorySelect');
        }

        // 3. Instructor (required)
        if (!insEl || !insEl.value) {
            setFieldInvalid('courseInstructorSelect', 'courseInstructorFeedback', 'Please select an assigned instructor.');
            isValid = false;
            if (!firstInvalidEl) firstInvalidEl = insEl;
        } else {
            setFieldValid('courseInstructorSelect');
        }

        // 4. Duplicate Code Check (Optional field, but if provided, must be unique)
        if (codeEl && codeEl.value.trim()) {
            const enteredCode = codeEl.value.trim().toUpperCase();
            let allCourses = [];
            if (global.AdminStore && typeof global.AdminStore.getCourses === 'function') {
                allCourses = global.AdminStore.getCourses();
            }
            const duplicate = allCourses.find(c => c.code && c.code.toUpperCase() === enteredCode && Number(c.id) !== Number(idVal));
            if (duplicate) {
                setFieldInvalid('courseCode', 'courseCodeFeedback', 'A course with this code already exists.');
                isValid = false;
                if (!firstInvalidEl) firstInvalidEl = codeEl;
            } else {
                setFieldValid('courseCode');
            }
        }

        return { isValid, firstInvalidEl };
    }

    // Save Course Handler (Draft or Publish)
    async function submitCourseData(isPublished) {
        if (isSubmittingCourse) return;

        const { isValid, firstInvalidEl } = validateCourseForm();
        if (!isValid) {
            if (firstInvalidEl) {
                try { firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
                firstInvalidEl.focus();
            }
            showCourseToast('warning', 'Validation Required', 'Please fill in all required fields (Course Title, Category, and Instructor).');
            return;
        }

        isSubmittingCourse = true;

        const publishBtn = document.getElementById('publishCourseBtn');
        const publishSpinner = document.getElementById('publishCourseSpinner');
        const publishBtnText = document.getElementById('publishCourseBtnText');
        const saveDraftBtn = document.getElementById('saveDraftCourseBtn');
        const saveDraftSpinner = document.getElementById('saveDraftCourseSpinner');
        const saveDraftBtnText = document.getElementById('saveDraftCourseBtnText');

        if (publishBtn) publishBtn.disabled = true;
        if (saveDraftBtn) saveDraftBtn.disabled = true;

        if (isPublished) {
            if (publishSpinner) publishSpinner.classList.remove('d-none');
            if (publishBtnText) publishBtnText.textContent = 'Publishing...';
        } else {
            if (saveDraftSpinner) saveDraftSpinner.classList.remove('d-none');
            if (saveDraftBtnText) saveDraftBtnText.textContent = 'Saving Draft...';
        }

        const id = document.getElementById('courseId')?.value;
        const title = document.getElementById('courseTitle')?.value.trim();
        const code = document.getElementById('courseCode')?.value.trim().toUpperCase() || `CS-${Math.floor(100 + Math.random() * 900)}`;
        const shortDesc = document.getElementById('courseShortDesc')?.value.trim() || '';
        const categoryId = parseInt(document.getElementById('courseCategorySelect')?.value);
        const instructorId = parseInt(document.getElementById('courseInstructorSelect')?.value);
        const difficulty = document.getElementById('courseDifficulty')?.value || 'Intermediate';
        const duration = document.getElementById('courseDuration')?.value.trim() || '12 Weeks';
        const rating = parseFloat(document.getElementById('courseRating')?.value) || 4.9;
        const price = parseFloat(document.getElementById('coursePrice')?.value) || 0;
        const fullDesc = document.getElementById('courseFullDesc')?.value.trim() || '';
        const isFeatured = document.getElementById('courseFeaturedToggle')?.checked ? 1 : 0;
        const imageUrl = document.getElementById('courseImageUrl')?.value.trim() || DEFAULT_COURSE_THUMBNAIL;
        const statusVal = document.getElementById('courseStatus')?.value || (isPublished ? 'Published' : 'Draft');

        const payload = {
            title: title,
            code: code,
            short_description: shortDesc,
            category_id: categoryId,
            categoryId: categoryId,
            instructor_id: instructorId,
            instructorId: instructorId,
            difficulty: difficulty,
            duration: duration,
            duration_hours: duration,
            rating: rating,
            price: price,
            description: fullDesc,
            learning_outcomes: courseLearningObjectives.filter(o => o.trim().length > 0),
            learning_objectives: courseLearningObjectives.filter(o => o.trim().length > 0),
            is_published: isPublished ? (statusVal === 'Draft' ? 0 : 1) : 0,
            status: isPublished ? (statusVal === 'Draft' ? 'Published' : statusVal) : 'Draft',
            is_archived: statusVal === 'Archived' ? 1 : 0,
            is_featured: isFeatured,
            badge: isFeatured ? 'Popular' : '',
            badge_text: isFeatured ? 'Popular' : '',
            thumbnail_url: imageUrl
        };

        console.log('[COURSE_CREATE] Form data:', {
            id,
            title,
            code,
            categoryId,
            instructorId,
            difficulty,
            duration,
            rating,
            price,
            descriptionLength: fullDesc.length,
            isFeatured,
            hasImage: Boolean(imageUrl && imageUrl !== DEFAULT_COURSE_THUMBNAIL),
            isPublished
        });
        console.log('[COURSE_CREATE] Validation: PASS');
        console.log('[COURSE_CREATE] Payload:', payload);

        try {
            let savedCourse = null;

            if (id) {
                // Update Course
                if (global.academicService && typeof global.academicService.updateCourse === 'function') {
                    const res = await global.academicService.updateCourse(id, payload);
                    savedCourse = res && res.data ? res.data : payload;
                } else if (global.AdminStore && typeof global.AdminStore.updateCourse === 'function') {
                    savedCourse = global.AdminStore.updateCourse(id, payload);
                }
                showCourseToast('success', 'Course Updated', `Course "${title}" updated successfully.`);
            } else {
                // Create Course (0 modules initially created)
                if (global.academicService && typeof global.academicService.createCourse === 'function') {
                    const res = await global.academicService.createCourse(payload);
                    savedCourse = res && res.data ? res.data : { ...payload, id: (res && res.id) ? res.id : Date.now() };
                } else if (global.AdminStore && typeof global.AdminStore.createCourse === 'function') {
                    savedCourse = global.AdminStore.createCourse(payload);
                }
                console.log('[COURSE_CREATE] Store response:', savedCourse);
            }

            // Close Modal
            global.closeCourseModal();

            // Notify all listening admin pages
            global.dispatchEvent(new CustomEvent('course:saved', {
                detail: {
                    course: savedCourse,
                    isNew: !id,
                    isPublished: isPublished
                }
            }));

            // Direct page refresh hooks if present
            if (typeof global.loadStoreData === 'function') {
                try { global.loadStoreData(); } catch (e) {}
            }
            if (typeof global.applyCourseFilters === 'function') {
                try { global.applyCourseFilters(); } catch (e) {}
            }
            if (typeof global.loadCourses === 'function') {
                try { global.loadCourses(true); } catch (e) {}
            }

            // Post-creation Success Action (Build Curriculum or Done)
            if (!id && savedCourse) {
                const newCourseId = savedCourse.id || (savedCourse.data && savedCourse.data.id);
                const courseTitle = savedCourse.title || title;

                if (global.Swal) {
                    global.Swal.fire({
                        title: isPublished ? 'Course Published!' : 'Course Saved as Draft!',
                        html: `<p class="text-secondary small mb-2">Course <strong>"${escapeHtml(courseTitle)}"</strong> has been created with <strong>0 Modules and 0 Lessons</strong>.</p>
                               <p class="text-muted text-xs mb-0">Would you like to open the <strong>Curriculum Builder</strong> to add modules and lessons now?</p>`,
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonText: '<i class="bi bi-diagram-3 me-1"></i> Build Curriculum',
                        cancelButtonText: 'Done / View Catalog',
                        confirmButtonColor: '#2563EB',
                        cancelButtonColor: '#64748B',
                        reverseButtons: true
                    }).then((result) => {
                        if (result.isConfirmed && newCourseId) {
                            if (typeof global.openCurriculumManager === 'function') {
                                global.openCurriculumManager(Number(newCourseId));
                            } else if (typeof global.openCourseContentBuilder === 'function') {
                                global.openCourseContentBuilder(Number(newCourseId));
                            }
                        }
                    });
                } else {
                    const actionWord = isPublished ? 'published' : 'saved as draft';
                    showCourseToast('success', isPublished ? 'Course Published' : 'Course Saved', `Course "${title}" ${actionWord} successfully.`);
                }
            }
        } catch (err) {
            console.error('[COURSE_CREATE] Error:', err);
            showCourseToast('danger', 'Failed to Save Course', err.message || 'Unable to save course. Please try again.');
        } finally {
            isSubmittingCourse = false;
            if (publishBtn) publishBtn.disabled = false;
            if (saveDraftBtn) saveDraftBtn.disabled = false;
            if (publishSpinner) publishSpinner.classList.add('d-none');
            if (saveDraftSpinner) saveDraftSpinner.classList.add('d-none');
            if (publishBtnText) publishBtnText.textContent = id ? 'Save Changes' : 'Publish Course';
            if (saveDraftBtnText) saveDraftBtnText.textContent = 'Save as Draft';
        }
    }

    // Attach all interactive event listeners
    function setupCourseModalEvents() {
        const modalEl = document.getElementById('createCourseModal');
        if (!modalEl || modalEl.dataset.eventsBound === 'true') return;
        modalEl.dataset.eventsBound = 'true';

        // 1. Live Validation Listeners
        const titleEl = document.getElementById('courseTitle');
        if (titleEl) {
            titleEl.addEventListener('blur', function () {
                if (!this.value.trim()) setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course title is required.');
                else if (this.value.trim().length < 3) setFieldInvalid('courseTitle', 'courseTitleFeedback', 'Course title must be at least 3 characters.');
                else setFieldValid('courseTitle');
            });
            titleEl.addEventListener('input', function () {
                if (this.value.trim().length >= 3) setFieldValid('courseTitle');
            });
        }

        const catEl = document.getElementById('courseCategorySelect');
        if (catEl) {
            catEl.addEventListener('change', function () {
                if (this.value) setFieldValid('courseCategorySelect');
                else setFieldInvalid('courseCategorySelect', 'courseCategoryFeedback', 'Please select a category.');
            });
        }

        const insEl = document.getElementById('courseInstructorSelect');
        if (insEl) {
            insEl.addEventListener('change', function () {
                if (this.value) setFieldValid('courseInstructorSelect');
                else setFieldInvalid('courseInstructorSelect', 'courseInstructorFeedback', 'Please select an assigned instructor.');
            });
        }

        // 2. Featured Toggle Listener
        const featToggle = document.getElementById('courseFeaturedToggle');
        const featLabel = document.getElementById('courseFeaturedToggleLabel');
        if (featToggle && featLabel) {
            featToggle.addEventListener('change', function () {
                featLabel.textContent = this.checked ? 'ON' : 'OFF';
                featLabel.className = `form-check-label text-xs fw-bold ${this.checked ? 'text-primary' : 'text-muted'}`;
            });
        }

        // 3. Image Upload Dropzone Events
        const dropzone = document.getElementById('courseImageDropzone');
        const fileInput = document.getElementById('courseImageFile');
        const replaceBtn = document.getElementById('replaceCourseImageBtn');
        const removeBtn = document.getElementById('removeCourseImageBtn');

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    handleCourseImageFile(this.files[0]);
                }
            });
        }

        if (dropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove('dragover');
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files[0]) {
                    handleCourseImageFile(dt.files[0]);
                }
            }, false);
        }

        if (replaceBtn) {
            replaceBtn.addEventListener('click', function () {
                if (fileInput) {
                    fileInput.value = '';
                    fileInput.click();
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                resetCourseImage();
            });
        }

        // 4. Learning Objectives Add Button
        const addObjBtn = document.getElementById('addCourseLearningObjectiveBtn');
        if (addObjBtn) {
            addObjBtn.addEventListener('click', function () {
                courseLearningObjectives.push('');
                renderCourseLearningObjectives();
                setTimeout(() => {
                    const inputs = document.querySelectorAll('#courseLearningObjectivesList input');
                    if (inputs.length > 0) inputs[inputs.length - 1].focus();
                }, 50);
            });
        }

        // 5. Publish & Save Draft Actions
        const publishBtn = document.getElementById('publishCourseBtn');
        if (publishBtn) {
            publishBtn.addEventListener('click', function (e) {
                e.preventDefault();
                submitCourseData(true);
            });
        }

        const saveDraftBtn = document.getElementById('saveDraftCourseBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', function (e) {
                e.preventDefault();
                submitCourseData(false);
            });
        }

        // Form Submit listener fallback
        const form = document.getElementById('courseForm');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                submitCourseData(true);
            });
        }
    }

    // ============================================================
    // PUBLIC API METHODS
    // ============================================================

    // Open Modal for Creating a New Course
    global.openCreateCourseModal = function () {
        const modalEl = ensureCourseModalMounted();
        if (!modalEl) return;

        const form = document.getElementById('courseForm');
        if (form) form.reset();

        document.getElementById('courseId').value = '';
        document.getElementById('courseModalTitle').textContent = 'Add New Course';
        document.getElementById('courseModalSubtitle').textContent = 'Add a new specialized course to AUB Digital Academy.';

        const publishBtnText = document.getElementById('publishCourseBtnText');
        if (publishBtnText) publishBtnText.textContent = 'Publish Course';

        // Populate dropdowns with placeholder selected
        populateCourseSelects();

        const catSelect = document.getElementById('courseCategorySelect');
        if (catSelect) catSelect.value = '';

        const insSelect = document.getElementById('courseInstructorSelect');
        if (insSelect) insSelect.value = '';

        const diffEl = document.getElementById('courseDifficulty');
        if (diffEl) diffEl.value = 'Intermediate';

        const durEl = document.getElementById('courseDuration');
        if (durEl) durEl.value = '12 Weeks';

        const priceEl = document.getElementById('coursePrice');
        if (priceEl) priceEl.value = '50.00';

        const ratingEl = document.getElementById('courseRating');
        if (ratingEl) ratingEl.value = '4.9';

        const ordEl = document.getElementById('courseOrderNum');
        if (ordEl && global.AdminStore && typeof global.AdminStore.getCourses === 'function') {
            ordEl.value = global.AdminStore.getCourses().length + 1;
        }

        const statEl = document.getElementById('courseStatus');
        if (statEl) statEl.value = 'Published';

        const featToggle = document.getElementById('courseFeaturedToggle');
        if (featToggle) featToggle.checked = false;
        const featLabel = document.getElementById('courseFeaturedToggleLabel');
        if (featLabel) {
            featLabel.textContent = 'OFF';
            featLabel.className = 'form-check-label text-xs fw-bold text-muted';
        }

        resetCourseImage();
        clearCourseValidation();

        courseLearningObjectives = [];
        renderCourseLearningObjectives();

        // Safely show modal
        if (global.bootstrap && global.bootstrap.Modal) {
            modalInstance = global.bootstrap.Modal.getOrCreateInstance(modalEl);
            if (modalInstance) modalInstance.show();
        }
    };

    // Open Modal for Editing an Existing Course
    global.openEditCourseModal = function (id) {
        const modalEl = ensureCourseModalMounted();
        if (!modalEl) return;

        let course = null;
        if (global.AdminStore && typeof global.AdminStore.getCourseById === 'function') {
            course = global.AdminStore.getCourseById(id);
        }
        if (!course) return;

        const form = document.getElementById('courseForm');
        if (form) form.reset();

        document.getElementById('courseId').value = course.id;
        document.getElementById('courseModalTitle').textContent = 'Edit Course';
        document.getElementById('courseModalSubtitle').textContent = `Update specialized course details for "${course.title}".`;

        const publishBtnText = document.getElementById('publishCourseBtnText');
        if (publishBtnText) publishBtnText.textContent = 'Save Changes';

        populateCourseSelects(course.category_id, course.instructor_id);

        const titleEl = document.getElementById('courseTitle');
        if (titleEl) titleEl.value = course.title || '';

        const codeEl = document.getElementById('courseCode');
        if (codeEl) codeEl.value = course.code || '';

        const shortDescEl = document.getElementById('courseShortDesc');
        if (shortDescEl) shortDescEl.value = course.short_description || '';

        const diffEl = document.getElementById('courseDifficulty');
        if (diffEl) diffEl.value = course.difficulty || 'Beginner';

        const durEl = document.getElementById('courseDuration');
        if (durEl) durEl.value = course.duration || course.duration_hours || '8 Weeks';

        const ratingEl = document.getElementById('courseRating');
        if (ratingEl) ratingEl.value = course.rating !== undefined ? course.rating : '4.9';

        const priceEl = document.getElementById('coursePrice');
        if (priceEl) priceEl.value = course.price !== undefined ? course.price : '0.00';

        const ordEl = document.getElementById('courseOrderNum');
        if (ordEl) ordEl.value = course.order_num || 1;

        const descEl = document.getElementById('courseFullDesc');
        if (descEl) descEl.value = course.description || '';

        const isPub = (course.is_published === 1 || course.is_published === true || course.is_published === '1');
        const statEl = document.getElementById('courseStatus');
        if (statEl) statEl.value = course.is_archived === 1 ? 'Archived' : (isPub ? 'Published' : 'Draft');

        const isFeat = Boolean(course.is_featured || course.badge === 'Popular' || course.badge === 'Featured');
        const featToggle = document.getElementById('courseFeaturedToggle');
        if (featToggle) featToggle.checked = isFeat;
        const featLabel = document.getElementById('courseFeaturedToggleLabel');
        if (featLabel) {
            featLabel.textContent = isFeat ? 'ON' : 'OFF';
            featLabel.className = `form-check-label text-xs fw-bold ${isFeat ? 'text-primary' : 'text-muted'}`;
        }

        // Image Preview
        if (course.thumbnail_url) {
            const fileName = course.thumbnail_url.split('/').pop() || 'cover.jpg';
            setCourseImagePreview(course.thumbnail_url, fileName, 'Saved cover image');
        } else {
            resetCourseImage();
        }

        // Objectives
        if (course.learning_outcomes) {
            try {
                courseLearningObjectives = Array.isArray(course.learning_outcomes)
                    ? [...course.learning_outcomes]
                    : JSON.parse(course.learning_outcomes);
            } catch (e) {
                courseLearningObjectives = [course.learning_outcomes];
            }
        } else {
            courseLearningObjectives = [];
        }
        renderCourseLearningObjectives();

        clearCourseValidation();

        // Safely show modal
        if (global.bootstrap && global.bootstrap.Modal) {
            modalInstance = global.bootstrap.Modal.getOrCreateInstance(modalEl);
            if (modalInstance) modalInstance.show();
        }
    };

    // Close Modal
    global.closeCourseModal = function () {
        const modalEl = document.getElementById('createCourseModal');
        if (modalEl && global.bootstrap && global.bootstrap.Modal) {
            const instance = global.bootstrap.Modal.getInstance(modalEl) || modalInstance;
            if (instance) instance.hide();
        }
    };

    // Auto mount on DOM load if document ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureCourseModalMounted);
    } else {
        ensureCourseModalMounted();
    }

})(typeof window !== 'undefined' ? window : this);
