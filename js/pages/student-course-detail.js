// ==========================================
// AUB Digital Academy - Student Course Detail & Learning Controller
// Resolves course via ID or Slug, Renders Syllabus & Modules from Mock Store / API
// ==========================================

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

    // Parse Course ID or Slug from URL
    const urlParams = new URLSearchParams(window.location.search);
    let courseId = parseInt(urlParams.get('id'), 10);
    const courseSlug = urlParams.get('slug');

    if (!courseId && courseSlug && window.AdminStore) {
        const courses = window.AdminStore.getCourses();
        const found = courses.find(c => c.slug === courseSlug || (c.slug && courseSlug.includes(c.slug)) || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(courseSlug));
        if (found) courseId = found.id;
    }

    if (!courseId) courseId = 1;

    let activeCourse = null;

    await loadCourse();

    // 1. Load Course Details
    async function loadCourse() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${API_BASE}/public/courses/${courseId}`, { headers: getHeaders(), signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    activeCourse = data.data;
                    loaded = true;
                }
            }
        } catch (e) {}

        if (!loaded && window.AdminStore) {
            activeCourse = window.AdminStore.getCourseById(courseId) || window.AdminStore.getCourses()[0];
        }

        if (!activeCourse) {
            activeCourse = {
                id: 1,
                title: 'Full-Stack Web Development',
                code: 'CS-WD101',
                category_name: 'Technology',
                difficulty: 'Intermediate',
                instructor_name: 'Prof. Alex Chen',
                instructor_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
                instructor_title: 'Head of Software Engineering',
                rating: 4.9,
                enrolled_students_count: 124,
                description: 'Master frontend engineering with modern HTML5, CSS3, JavaScript ES6+, Express routes, REST APIs, and relational database modeling.',
                thumbnail_url: '../../assets/images/course_webdev.jpg'
            };
        }

        renderCourseDetails(activeCourse);
    }

    function renderCourseDetails(c) {
        const titleEl = document.getElementById('cTitle');
        const catEl = document.getElementById('cCategory');
        const diffEl = document.getElementById('cDifficulty');
        const instNameEl = document.getElementById('cInstructorName');
        const instAvatarEl = document.getElementById('cInstructorAvatar');
        const instTitleEl = document.getElementById('cInstructorTitle');
        const ratingEl = document.getElementById('cRating');
        const studentsEl = document.getElementById('cStudentsCount');
        const descEl = document.getElementById('cDescription');
        const thumbEl = document.getElementById('cThumbnail');

        if (titleEl) titleEl.textContent = c.title;
        if (catEl) catEl.textContent = c.category_name || 'Technology';
        if (diffEl) diffEl.textContent = c.difficulty || 'Intermediate';
        if (instNameEl) instNameEl.textContent = c.instructor_name || 'Prof. Alex Chen';
        if (instAvatarEl && c.instructor_avatar) instAvatarEl.src = c.instructor_avatar;
        if (instTitleEl) instTitleEl.textContent = c.instructor_title || 'Senior Faculty Member';
        if (ratingEl) ratingEl.textContent = c.rating || '4.9';
        if (studentsEl) studentsEl.textContent = c.enrolled_students_count || '124';
        if (descEl) descEl.textContent = c.description || 'Comprehensive curriculum designed for practical student mastery.';
        if (thumbEl && c.thumbnail_url) {
            thumbEl.src = c.thumbnail_url.startsWith('http') || c.thumbnail_url.startsWith('/') || c.thumbnail_url.startsWith('..')
                ? c.thumbnail_url 
                : `../../${c.thumbnail_url}`;
        }

        // Render Syllabus Modules
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id) : [];
        const allLessons = window.AdminStore ? window.AdminStore.getAllLessonsByCourseId(c.id) : [];
        const totalLessonCount = allLessons.length > 0 ? allLessons.length : (chapters.length > 0 ? chapters.reduce((sum, ch) => sum + (ch.lesson_count || 0), 0) : 24);
        
        if (document.getElementById('cTotalLessons')) {
            document.getElementById('cTotalLessons').textContent = `${totalLessonCount} Lessons Total`;
        }
        
        const accordion = document.getElementById('syllabusAccordion');
        if (!accordion) return;

        if (chapters.length === 0) {
            // Default syllabus preview for demo
            accordion.innerHTML = `
                <div class="accordion-item border rounded-2 mb-2 overflow-hidden">
                    <h2 class="accordion-header" id="heading1">
                        <button class="accordion-button bg-light py-2.5" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1">
                            <div class="d-flex align-items-center justify-content-between w-100 me-3">
                                <span class="fw-bold text-dark" style="font-size: 13.5px;">Module 1: HTML5 &amp; CSS3 Architecture</span>
                                <span class="badge bg-white text-primary border">3 Lessons • Completed</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse1" class="accordion-collapse collapse show" data-bs-parent="#syllabusAccordion">
                        <div class="accordion-body p-3 bg-white" style="font-size: 13px;">
                            <div class="lesson-list-item">
                                <span><i class="bi bi-check-circle-fill text-success me-2"></i>Lesson 1: Semantic Markup &amp; Accessibility Landmarks</span>
                                <span class="badge bg-success bg-opacity-10 text-success">Completed</span>
                            </div>
                            <div class="lesson-list-item">
                                <span><i class="bi bi-check-circle-fill text-success me-2"></i>Lesson 2: Modern CSS Grid &amp; Responsive Layouts</span>
                                <span class="badge bg-success bg-opacity-10 text-success">Completed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="accordion-item border rounded-2 mb-2 overflow-hidden">
                    <h2 class="accordion-header" id="heading4">
                        <button class="accordion-button bg-light py-2.5" type="button" data-bs-toggle="collapse" data-bs-target="#collapse4">
                            <div class="d-flex align-items-center justify-content-between w-100 me-3">
                                <span class="fw-bold text-dark" style="font-size: 13.5px;">Module 4: REST API Development &amp; Express</span>
                                <span class="badge bg-primary text-white">In Progress • Current</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse4" class="accordion-collapse collapse show" data-bs-parent="#syllabusAccordion">
                        <div class="accordion-body p-3 bg-white" style="font-size: 13px;">
                            <div class="lesson-list-item">
                                <span><i class="bi bi-check-circle-fill text-success me-2"></i>Lesson 1: Express Server Scaffolding &amp; Controllers</span>
                                <span class="badge bg-success bg-opacity-10 text-success">Completed</span>
                            </div>
                            <div class="lesson-list-item bg-primary bg-opacity-10 rounded">
                                <span><i class="bi bi-play-circle-fill text-primary me-2"></i><strong>Lesson 2: Express Routing &amp; Middleware</strong></span>
                                <span class="badge bg-primary text-white">Current Lesson</span>
                            </div>
                            <div class="lesson-list-item">
                                <span><i class="bi bi-lock text-muted me-2"></i>Lesson 3: Error Handling &amp; Validation</span>
                                <span class="badge bg-light text-muted border">Upcoming</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            accordion.innerHTML = chapters.map((ch, idx) => {
                const chLessons = window.AdminStore ? window.AdminStore.getLessonsByModuleId(ch.id) : [];
                const lessonCount = chLessons.length > 0 ? chLessons.length : (ch.lesson_count || 0);

                return `
                    <div class="accordion-item border rounded-2 mb-2 overflow-hidden">
                        <h2 class="accordion-header" id="heading${ch.id}">
                            <button class="accordion-button ${idx > 1 ? 'collapsed' : ''} bg-light py-2.5" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${ch.id}">
                                <div class="d-flex align-items-center justify-content-between w-100 me-3">
                                    <span class="fw-bold text-dark" style="font-size: 13.5px;">Module ${ch.chapter_num}: ${escapeHtml(ch.title)}</span>
                                    <span class="badge bg-white text-primary border">${lessonCount} Lessons &bull; ${escapeHtml(ch.duration || '2 Weeks')}</span>
                                </div>
                            </button>
                        </h2>
                        <div id="collapse${ch.id}" class="accordion-collapse collapse ${idx <= 1 ? 'show' : ''}" data-bs-parent="#syllabusAccordion">
                            <div class="accordion-body p-3 bg-white" style="font-size: 13px;">
                                <p class="text-secondary mb-2">${escapeHtml(ch.description || 'Core interactive exercises, theory lecture, and hands-on laboratory.')}</p>
                                ${chLessons.length > 0 ? `
                                    <div class="d-flex flex-column gap-1 mt-2 border-top pt-2">
                                        ${chLessons.map(l => `
                                            <div class="lesson-list-item">
                                                <span><i class="bi bi-play-circle text-primary me-2"></i><span class="text-dark fw-medium">${escapeHtml(l.title)}</span></span>
                                                <span class="badge bg-light text-muted border">${escapeHtml(l.duration || '20 minutes')}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
