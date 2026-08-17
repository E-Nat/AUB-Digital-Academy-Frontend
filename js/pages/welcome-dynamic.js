// Public Website Dynamic Integration (Vanilla JS)
// Connects welcomepage.html to the SQLite Database & REST API as the single source of truth

(function () {
    'use strict';

    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    document.addEventListener('DOMContentLoaded', function () {
        fetchFeaturedPrograms();
        fetchPopularCourses();
        fetchCategoriesForFilters();
    });

    // 1. DYNAMIC FEATURED PROGRAMS (CAROUSEL)
    async function fetchFeaturedPrograms() {
        const track = document.querySelector('.featured-carousel-track');
        if (!track) return;

        try {
            const res = await fetch(`${API_BASE}/public/programs/featured`);
            if (!res.ok) throw new Error('API offline or error');
            const result = await res.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                // Render exact HTML structure matching public website
                track.innerHTML = result.data.map((p) => `
                    <div class="carousel-slide ${escapeHtml(p.theme_class || 'theme-blue')}">
                        <a href="${escapeHtml(p.detail_url || 'pages/programs/' + (p.slug || 'cs') + '.html')}" class="card-program-refined text-center text-decoration-none">
                            <div class="card-arrow-icon"><i class="bi bi-arrow-up-right"></i></div>
                            <div class="card-icon-square">
                                <i class="bi ${escapeHtml(p.icon_class || 'bi-laptop')}"></i>
                            </div>
                            <div class="card-content d-flex flex-column flex-grow-1 px-4 pb-4">
                                <h4 class="card-title-bold mb-1">${escapeHtml(p.title)}</h4>
                                <p class="card-degree text-xs fw-bold text-uppercase mb-3">${escapeHtml(p.degree_type || 'BACHELOR DEGREE')}</p>
                                <p class="text-muted text-sm mb-4 desc-clamp" style="line-height: 1.6;">
                                    ${escapeHtml(p.description)}
                                </p>
                                <div class="d-flex justify-content-center flex-wrap gap-2 mb-4 mt-auto">
                                    ${(p.tags || ['Academic', 'Professional']).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
                                </div>
                                <div class="click-to-explore mt-2">
                                    Click to Explore <i class="bi bi-arrow-right ms-1"></i>
                                </div>
                            </div>
                            <div class="card-footer-subtle d-flex justify-content-center align-items-center w-100 pt-3 pb-3">
                                <span class="text-muted text-sm fw-medium"><i class="bi bi-clock me-1 opacity-75"></i> ${escapeHtml(p.duration || '4 Years')}</span>
                            </div>
                        </a>
                    </div>
                `).join('');

                // Re-initialize carousel with new dynamic slides
                if (typeof window.initProgramsCarousel === 'function') {
                    window.initProgramsCarousel();
                }

                if (typeof window.refreshScrollReveal === 'function') {
                    window.refreshScrollReveal();
                }
            }
        } catch (e) {
            // Gracefully retain existing HTML markup if API is offline
        }
    }

    // 2. DYNAMIC POPULAR COURSES
    async function fetchPopularCourses() {
        const grid = document.getElementById('course-grid');
        if (!grid) return;

        try {
            const res = await fetch(`${API_BASE}/public/courses/popular`);
            if (!res.ok) throw new Error('API offline');
            const result = await res.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                grid.innerHTML = result.data.map((c, idx) => `
                    <div class="col-lg-3 col-md-6 reveal-up delay-${Math.min((idx + 1) * 100, 500)} course-item" data-category="${escapeHtml(c.category_slug || 'technology')}">
                        <div class="card card-course-premium h-100 bg-white shadow-sm border-0">
                            <div class="course-thumbnail position-relative overflow-hidden">
                                <img src="${escapeHtml(c.thumbnail_url || 'assets/images/course_webdev.jpg')}" class="w-100 h-100 object-fit-cover" alt="${escapeHtml(c.title)}" onerror="this.src='assets/images/course_webdev.jpg'">
                                ${c.badge_text ? `
                                <div class="course-badge top-right position-absolute" style="top: 12px; right: 12px;">
                                    <span class="badge bg-secondary rounded-pill shadow-sm px-3 py-2"><i class="bi bi-hand-thumbs-up-fill me-1"></i> ${escapeHtml(c.badge_text)}</span>
                                </div>` : ''}
                            </div>
                            <div class="card-body p-4 d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <span class="badge text-primary bg-primary bg-opacity-10 fw-semibold px-3 py-1 rounded-pill">${escapeHtml(c.category_name || 'Technology')}</span>
                                    <span class="text-warning fw-bold text-sm"><i class="bi bi-star-fill me-1"></i>${c.rating || '4.8'}</span>
                                </div>
                                <h5 class="fw-bold text-dark mb-2 course-title-clamp" style="font-size: 1.15rem;">${escapeHtml(c.title)}</h5>
                                <p class="text-muted text-sm mb-4 course-desc-clamp">${escapeHtml(c.description)}</p>
                                
                                <div class="row g-2 mb-4 mt-auto border-top pt-3 border-secondary border-opacity-10">
                                    <div class="col-6 d-flex align-items-center text-muted text-xs">
                                        <i class="bi bi-people me-2 text-secondary fs-6"></i> ${(c.enrolled_students_count || 1250).toLocaleString()}
                                    </div>
                                    <div class="col-6 d-flex align-items-center text-muted text-xs">
                                        <i class="bi bi-journal-text me-2 text-secondary fs-6"></i> ${c.lesson_count || 12} Lessons
                                    </div>
                                    <div class="col-6 d-flex align-items-center text-muted text-xs">
                                        <i class="bi bi-clock me-2 text-secondary fs-6"></i> ${escapeHtml(c.duration_hours || '8 Hours')}
                                    </div>
                                    <div class="col-6 d-flex align-items-center text-muted text-xs">
                                        <i class="bi bi-bar-chart me-2 text-secondary fs-6"></i> ${escapeHtml(c.difficulty || 'Beginner')}
                                    </div>
                                </div>
                                
                                <a href="pages/student/course-detail.html?slug=${escapeHtml(c.slug || '')}" class="btn btn-primary w-100 rounded-pill btn-course-cta fw-semibold py-2">
                                    Start Learning <i class="bi bi-arrow-right ms-1"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('');

                if (typeof window.refreshScrollReveal === 'function') {
                    window.refreshScrollReveal();
                }
            }
        } catch (e) {
            // Gracefully retain existing HTML markup if API is offline
        }
    }

    // 3. DYNAMIC CATEGORIES FOR MARQUEE & FILTER CHIPS
    function fetchCategoriesForFilters() {
        const filterContainer = document.querySelector('.course-filters');
        if (!filterContainer) return;

        // Attach click listener to filter chips
        filterContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-filter');
            if (!btn) return;

            filterContainer.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterVal = btn.getAttribute('data-filter');
            const items = document.querySelectorAll('.course-item');

            items.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filterVal === 'all' || category === filterVal) {
                    item.style.display = 'block';
                    item.classList.add('is-visible');
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();

