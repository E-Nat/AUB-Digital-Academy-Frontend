/**
 * AUB Digital Academy — Admin Shared Layout & Persistent Navigation Controller
 * Fixed sidebar, independent scrolling, scroll preservation, and seamless client-side routing.
 * Included by EVERY admin page. Path: ../../js/admin-layout.js
 */

/* ============================================================
   1. SIDEBAR DEFINITION (Preserves all existing routes & items)
   ============================================================ */
const ADMIN_NAV = [
    {
        section: 'MAIN',
        items: [
            { label: 'Dashboard',          icon: 'bi-grid',               href: 'dashboard.html' },
        ]
    },
    {
        section: 'ACADEMIC',
        items: [
            { label: 'Academic Management',icon: 'bi-mortarboard',        href: 'academic-management.html' },
            { label: 'Course Management',  icon: 'bi-journal-bookmark',   href: 'course-management.html' },
            { label: 'Exam & Quiz',        icon: 'bi-clipboard-check',    href: 'exam-quiz-management.html' },
            { label: 'Enrollment',         icon: 'bi-person-check',       href: 'enrollment-management.html' },
            { label: 'Schedule',           icon: 'bi-calendar3',          href: 'schedule.html' },
        ]
    },
    {
        section: 'PEOPLE',
        items: [
            { label: 'User Management',    icon: 'bi-people',             href: 'user-management.html' },
            { label: 'Teacher Management', icon: 'bi-person-workspace',   href: 'teacher-management.html' },
        ]
    },
    {
        section: 'FINANCE',
        items: [
            { label: 'Payments',           icon: 'bi-credit-card',        href: 'payments.html' },
            { label: 'Invoices',           icon: 'bi-receipt',            href: 'invoices.html' },
            { label: 'Teacher Payroll',    icon: 'bi-cash-coin',          href: 'teacher-payroll.html' },
        ]
    },
    {
        section: 'REPORTS',
        items: [
            { label: 'Reports',            icon: 'bi-bar-chart-line',     href: 'reports.html' },
        ]
    },
    {
        section: 'SYSTEM',
        items: [
            { label: 'Settings',           icon: 'bi-gear',               href: 'settings.html' },
        ]
    }
];

/* ============================================================
   2. ACTIVE NAV RESOLUTION & STATE MANAGEMENT
   ============================================================ */
function getActiveAdminNavHref(targetUrlStr) {
    let currentPath = window.location.pathname.toLowerCase();
    let currentHash = (window.location.hash || '').toLowerCase();

    if (targetUrlStr) {
        try {
            const u = new URL(targetUrlStr, window.location.href);
            currentPath = u.pathname.toLowerCase();
            currentHash = (u.hash || '').toLowerCase();
        } catch (e) {
            currentPath = String(targetUrlStr).toLowerCase();
        }
    }

    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';

    // Hash or exact file mappings
    if (currentHash === '#invoices' || currentFile === 'invoices.html') {
        return 'invoices.html';
    }
    if (currentFile === 'payment-management.html' || currentFile === 'payments.html') {
        return currentHash === '#invoices' ? 'invoices.html' : 'payments.html';
    }
    if (currentFile === 'payroll-management.html' || currentFile === 'teacher-payroll.html') {
        return 'teacher-payroll.html';
    }
    if (currentFile === 'exam-management.html' || currentFile === 'exam-quiz-management.html') {
        return 'exam-quiz-management.html';
    }
    if (currentFile === 'schedule-management.html' || currentFile === 'schedule.html') {
        return 'schedule.html';
    }
    if (currentFile === 'course-management.html') {
        return 'course-management.html';
    }
    if (currentFile === 'academic-management.html') {
        return 'academic-management.html';
    }
    if (currentFile === 'enrollment-management.html') {
        return 'enrollment-management.html';
    }
    if (currentFile === 'user-management.html') {
        return 'user-management.html';
    }
    if (currentFile === 'teacher-management.html') {
        return 'teacher-management.html';
    }
    if (currentFile === 'reports.html') {
        return 'reports.html';
    }
    if (currentFile === 'settings.html') {
        return 'settings.html';
    }
    if (currentFile === 'index.html' || currentFile === '' || currentFile === 'dashboard.html') {
        return 'dashboard.html';
    }
    return currentFile;
}

function updateAdminSidebarActiveState(targetUrlStr) {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;
    const activePage = getActiveAdminNavHref(targetUrlStr);
    sidebar.querySelectorAll('.admin-nav-item').forEach(item => {
        const href = (item.getAttribute('href') || item.getAttribute('data-page') || '').toLowerCase();
        const itemFile = href.substring(href.lastIndexOf('/') + 1);
        if (itemFile === activePage) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
        } else {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        }
    });
}

/* ============================================================
   3. RENDER SIDEBAR (Mounted once, persists across route changes)
   ============================================================ */
function renderAdminSidebar(force = false) {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    // If sidebar is already rendered and not forced, only update active state
    if (!force && sidebar.dataset.rendered === 'true' && sidebar.querySelector('.admin-sidebar-nav')) {
        updateAdminSidebarActiveState();
        return;
    }

    const activePage = getActiveAdminNavHref();

    // Brand / Header
    const brandHTML = `
        <div class="admin-sidebar-brand">
            <a href="dashboard.html" class="d-flex align-items-center gap-2 text-decoration-none text-reset" style="min-width:0;">
                <img src="../../assets/logos/rel_icon.png" alt="AUB Logo" class="admin-brand-logo-img">
                <div class="admin-brand-text-wrapper">
                    <span class="admin-brand-aub">AUB</span>
                    <span class="admin-brand-divider"></span>
                    <div class="admin-brand-titles">
                        <div class="admin-brand-digital">DIGITAL</div>
                        <div class="admin-brand-academy">ACADEMY</div>
                    </div>
                </div>
            </a>
        </div>`;

    // Nav items (Exact 44px rows, stable dimensions)
    let navHTML = '<nav class="admin-sidebar-nav" aria-label="Main Navigation">';
    ADMIN_NAV.forEach(group => {
        navHTML += `<div class="admin-nav-section">${group.section}</div>`;
        group.items.forEach(item => {
            const isActive = (item.href === activePage) ? 'active' : '';
            const ariaCurrent = isActive ? ' aria-current="page"' : '';
            navHTML += `
                <a href="${item.href}" class="admin-nav-item ${isActive}" data-page="${item.href}"${ariaCurrent} title="${item.label}">
                    <i class="bi ${item.icon}" aria-hidden="true"></i>
                    <span>${item.label}</span>
                </a>`;
        });
    });
    navHTML += '</nav>';

    // Footer with Logout
    const footerHTML = `
        <div class="admin-sidebar-footer">
            <button class="admin-logout-btn" id="sidebarLogoutBtn" type="button" aria-label="Sign Out" title="Logout">
                <i class="bi bi-box-arrow-left" aria-hidden="true"></i>
                <span>Logout</span>
            </button>
        </div>`;

    sidebar.innerHTML = brandHTML + navHTML + footerHTML;
    sidebar.dataset.rendered = 'true';

    // Logout handler
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', handleAdminLogout);

    // Sidebar scroll persistence & restoration (No jumping, predictable position)
    const navEl = sidebar.querySelector('.admin-sidebar-nav, .admin-sidebar-menu, .sidebar-scroll');
    if (navEl) {
        try {
            const savedScroll = sessionStorage.getItem('aub_sidebar_scroll');
            if (savedScroll !== null) {
                const scrollVal = parseInt(savedScroll, 10);
                if (!isNaN(scrollVal) && scrollVal > 0) {
                    navEl.scrollTop = scrollVal;
                }
            }
        } catch (e) {}

        navEl.addEventListener('scroll', function () {
            try {
                sessionStorage.setItem('aub_sidebar_scroll', String(navEl.scrollTop));
            } catch (e) {}
        }, { passive: true });
    }
}

/* ============================================================
   4. PERSISTENT CLIENT-SIDE ROUTER (Layout & Sidebar Persist)
   ============================================================ */
let isNavigating = false;

async function navigateToAdminPage(url, pushHistory = true) {
    if (isNavigating) return;
    isNavigating = true;

    try {
        const targetUrl = new URL(url, window.location.href);
        const targetHref = targetUrl.href;

        // 1. Instantly update active link in the sidebar (zero delay, zero jump)
        updateAdminSidebarActiveState(targetUrl.pathname + targetUrl.hash);

        // 2. Fetch page HTML
        const res = await fetch(targetHref, {
            headers: { 'X-Requested-With': 'AUB-Admin-Router' }
        });

        if (!res.ok) {
            window.location.href = targetHref;
            return;
        }

        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 3. Update Document Title & Synchronize Page Stylesheets
        if (doc.title) {
            document.title = doc.title;
        }
        syncPageStyles(doc, targetHref);

        // 4. Update Main Content Area (Sidebar element is untouched!)
        const currentMain = document.querySelector('.admin-main, .main-area, main');
        const newMain = doc.querySelector('.admin-main, .main-area, main');

        if (currentMain && newMain) {
            // Update Topbar if needed
            const curTopbar = currentMain.querySelector('.admin-topbar');
            const newTopbar = newMain.querySelector('.admin-topbar');
            if (curTopbar && newTopbar) {
                curTopbar.innerHTML = newTopbar.innerHTML;
            }

            // Update Page Content
            const curContent = currentMain.querySelector('.admin-content, .page-content');
            const newContent = newMain.querySelector('.admin-content, .page-content');
            if (curContent && newContent) {
                curContent.innerHTML = newContent.innerHTML;
                curContent.className = newContent.className;
            } else {
                currentMain.innerHTML = newMain.innerHTML;
            }

            // Reset scroll of MAIN CONTENT only (Sidebar scroll stays completely undisturbed)
            currentMain.scrollTop = 0;

            // Ensure no orphaned modal backdrops or scroll locks persist across navigation
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }

        // 5. Update browser history
        if (pushHistory) {
            window.history.pushState({ page: targetHref }, '', targetHref);
        }

        // 6. Close mobile drawer if open
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.admin-sidebar');
            const backdrop = document.getElementById('sidebarBackdrop');
            closeSidebar(sidebar, backdrop);
        }

        // 7. Re-initialize topbar widgets & search shortcut
        renderAdminHeader(false);

        // 8. Execute page-specific scripts for the newly loaded page
        await executeNewPageScripts(doc, targetHref);

        // 9. Dispatch events for any page controllers
        document.dispatchEvent(new Event('DOMContentLoaded'));
        window.dispatchEvent(new CustomEvent('aub:route-changed', { detail: { url: targetHref } }));

    } catch (err) {
        console.warn('Router fallback navigation:', err);
        window.location.href = url;
    } finally {
        isNavigating = false;
    }
}

function syncPageStyles(doc, targetHref) {
    // 1. Remove previous dynamic page-specific styles
    document.querySelectorAll('link[data-page-style], style[data-page-style]').forEach(el => el.remove());

    // 2. Add page-specific stylesheets from doc.head
    const links = doc.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(l => {
        const href = l.getAttribute('href');
        if (!href) return;
        const fullHref = new URL(href, targetHref).href;

        // Skip base shared stylesheets already loaded permanently
        if (fullHref.includes('bootstrap.min.css') ||
            fullHref.includes('bootstrap-icons') ||
            fullHref.includes('fonts.googleapis') ||
            fullHref.includes('css/layouts/admin.css')) {
            return;
        }

        // Avoid duplicate stylesheet injection
        const alreadyPresent = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(
            existing => existing.href === fullHref
        );
        if (!alreadyPresent) {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = fullHref;
            newLink.setAttribute('data-page-style', 'true');
            document.head.appendChild(newLink);
        }
    });

    // 3. Add page-specific inline styles if any
    const styles = doc.querySelectorAll('head > style, body > style');
    styles.forEach(s => {
        if (s.textContent && s.textContent.trim()) {
            const newStyle = document.createElement('style');
            newStyle.textContent = s.textContent;
            newStyle.setAttribute('data-page-style', 'true');
            document.head.appendChild(newStyle);
        }
    });
}

async function executeNewPageScripts(doc, targetHref) {
    const scripts = doc.querySelectorAll('script');
    const scriptsToLoad = [];

    scripts.forEach(oldScript => {
        const src = oldScript.getAttribute('src');
        if (src) {
            // Skip core layout scripts already loaded
            if (src.includes('admin-layout.js') || src.includes('bootstrap.bundle.min.js')) {
                return;
            }
            scriptsToLoad.push(new URL(src, targetHref).href);
        } else if (oldScript.textContent && oldScript.textContent.trim()) {
            try {
                // Execute inline script in global context
                const fn = new Function(oldScript.textContent);
                fn();
            } catch (e) {
                console.error('Error executing inline script:', e);
            }
        }
    });

    for (const scriptUrl of scriptsToLoad) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            const sep = scriptUrl.includes('?') ? '&' : '?';
            script.src = `${scriptUrl}${sep}_t=${Date.now()}`;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
        });
    }
}

function initAdminNavigationRouter() {
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.target && link.target !== '_self') return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        const targetUrl = new URL(link.href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return; // External link

        const targetPath = targetUrl.pathname.toLowerCase();
        if (targetPath.endsWith('.html') || targetPath.includes('/pages/admin/')) {
            e.preventDefault();
            navigateToAdminPage(link.href, true);
        }
    });

    window.addEventListener('popstate', () => {
        navigateToAdminPage(window.location.href, false);
    });
}

/* ============================================================
   5. TOPBAR HAMBURGER & RESPONSIVE DRAWER
   ============================================================ */
function initHamburger() {
    const hamburger = document.getElementById('adminHamburger') || document.getElementById('mobileSidebarToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    let backdrop = document.getElementById('sidebarBackdrop') || document.querySelector('.admin-sidebar-backdrop');
    
    if (!backdrop && sidebar) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebarBackdrop';
        backdrop.className = 'admin-sidebar-backdrop';
        document.body.appendChild(backdrop);
    }
    
    if (!hamburger || !sidebar) return;

    // Clone to remove old duplicate listeners
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);

    newHamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('open') || sidebar.classList.contains('show')) {
            closeSidebar(sidebar, backdrop);
        } else {
            openSidebar(sidebar, backdrop);
        }
    });

    backdrop?.addEventListener('click', () => closeSidebar(sidebar, backdrop));

    // Close sidebar on link click on mobile
    sidebar.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar(sidebar, backdrop);
        });
    });
}

function openSidebar(sidebar, backdrop) {
    sidebar?.classList.add('open', 'show');
    backdrop?.classList.add('visible', 'active', 'show');
}

function closeSidebar(sidebar, backdrop) {
    sidebar?.classList.remove('open', 'show');
    backdrop?.classList.remove('visible', 'active', 'show');
}

/* ============================================================
   6. LOGOUT
   ============================================================ */
function handleAdminLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../authentication/login.html';
}

/* ============================================================
   7. AUTH HELPERS (used across admin JS files)
   ============================================================ */
function getAdminToken() {
    return (
        localStorage.getItem('aub_auth_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('aub_auth_token') ||
        sessionStorage.getItem('token') ||
        null
    );
}

function getAdminHeaders() {
    const token = getAdminToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function requireAdminAuth() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = '../authentication/login.html';
        return null;
    }
    try {
        const res = await fetch('/api/admin/me', { headers: getAdminHeaders() });
        if (res.status === 401 || res.status === 403) {
            localStorage.clear(); sessionStorage.clear();
            window.location.href = '../authentication/login.html';
            return null;
        }
        const data = await res.json();
        return data?.user || null;
    } catch {
        return null;
    }
}

/* ============================================================
   8. GLOBAL HEADER (One Reusable Component across all Admin Pages)
   ============================================================ */
const GLOBAL_HEADER_HTML = `
    <button class="admin-hamburger" id="adminHamburger" aria-label="Toggle sidebar" type="button">
        <i class="bi bi-list"></i>
    </button>

    <div class="admin-search-wrapper">
        <i class="bi bi-search search-icon"></i>
        <input type="text" class="admin-search-input" id="globalSearchInput"
               placeholder="Search users, courses, enrollments…" autocomplete="off" aria-label="Search users, courses, enrollments">
        <span class="admin-search-kbd d-none d-md-flex">Ctrl K</span>
        <div class="search-results-dropdown" id="searchResultsContainer"></div>
    </div>

    <div class="admin-topbar-actions">
        <div class="position-relative">
            <button class="admin-icon-btn" id="notificationBtn" aria-label="Notifications" type="button">
                <i class="bi bi-bell"></i>
                <span class="admin-notification-badge has-count" id="notificationBadge" style="display:none">0</span>
            </button>
            <div class="notifications-dropdown" id="notificationsMenu">
                <div style="padding:12px 16px 8px;border-bottom:1px solid var(--adm-border);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;font-weight:700">Notifications</span>
                    <button class="adm-btn adm-btn-ghost adm-btn-sm" id="markAllReadBtn" type="button" style="font-size:11px;padding:2px 8px">Mark all read</button>
                </div>
                <div id="notificationsList" style="padding:4px 0;max-height:280px;overflow-y:auto;"></div>
            </div>
        </div>

        <div class="admin-topbar-profile" onclick="window.location.href='settings.html'" role="button" tabindex="0">
            <img src="https://ui-avatars.com/api/?name=Dr+Johnathan+Vance&background=2563EB&color=fff&size=64"
                 alt="Dr. Johnathan Vance" class="admin-topbar-avatar" id="topbarAvatar">
            <div class="admin-topbar-profile-info d-none d-md-block">
                <div class="profile-name" id="topbarAdminName">Dr. Johnathan Vance</div>
                <div class="profile-role">Administrator</div>
            </div>
        </div>
    </div>
`;

function renderAdminHeader(force = false) {
    const topbar = document.querySelector('.admin-topbar, header.topbar');
    if (!topbar) return;

    if (!force && topbar.dataset.rendered === 'true' && topbar.querySelector('#globalSearchInput')) {
        hydrateProfileFromStorage();
        return;
    }

    topbar.innerHTML = GLOBAL_HEADER_HTML;
    topbar.dataset.rendered = 'true';

    initHamburger();
    initSearchShortcut();
    initGlobalSearch();
    initGlobalNotifications();
    hydrateProfileFromStorage();
}

function escapeHtml(text) {
    if (!text && text !== 0) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function populateTopbarProfile(user) {
    const nameEl = document.getElementById('topbarAdminName');
    const avatarEl = document.getElementById('topbarAvatar');
    const profileNameEl = document.querySelector('.profile-name');
    const profileRoleEl = document.querySelector('.profile-role');

    const defaultName = 'Dr. Johnathan Vance';
    const defaultRole = 'Administrator';
    const defaultAvatar = `https://ui-avatars.com/api/?name=Dr+Johnathan+Vance&background=2563EB&color=fff&size=64`;

    const name = (user && user.full_name) ? user.full_name : defaultName;
    const role = (user && (user.role_name || user.role)) ? (user.role_name || user.role) : defaultRole;
    const avatar = (user && user.avatar_url) ? user.avatar_url : (user && user.full_name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=2563EB&color=fff&size=64` : defaultAvatar);

    if (nameEl) nameEl.textContent = name;
    if (profileNameEl) profileNameEl.textContent = name;
    if (profileRoleEl) profileRoleEl.textContent = role;
    if (avatarEl) {
        avatarEl.src = avatar;
        avatarEl.alt = name;
    }
}

function hydrateProfileFromStorage() {
    try {
        const userStr = localStorage.getItem('aub_user') || sessionStorage.getItem('aub_user');
        if (userStr) {
            populateTopbarProfile(JSON.parse(userStr));
        } else if (window.AdminStore && typeof window.AdminStore.getAdminUser === 'function') {
            populateTopbarProfile(window.AdminStore.getAdminUser());
        } else {
            populateTopbarProfile(null);
        }
    } catch (e) {
        populateTopbarProfile(null);
    }
}

/* ============================================================
   9. GLOBAL SEARCH WIDGET
   ============================================================ */
let globalSearchTimer = null;

function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    const searchContainer = document.getElementById('searchResultsContainer');
    if (!searchInput || !searchContainer) return;

    // Remove existing listener clones
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('input', e => {
        clearTimeout(globalSearchTimer);
        const q = e.target.value.trim();
        if (q.length < 2) {
            searchContainer.classList.remove('active');
            searchContainer.innerHTML = '';
            return;
        }

        globalSearchTimer = setTimeout(async () => {
            try {
                let results = null;
                if (window.AdminStore && typeof window.AdminStore.search === 'function') {
                    results = window.AdminStore.search(q);
                }
                if (!results) {
                    const token = getAdminToken();
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { headers });
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success) results = json.data;
                    }
                }

                if (!results) return;
                const { programs = [], courses = [], users = [] } = results;
                const total = programs.length + courses.length + users.length;

                if (!total) {
                    searchContainer.innerHTML = `<div style="padding:12px;text-align:center;color:var(--adm-muted);font-size:13px">No results found for "${escapeHtml(q)}"</div>`;
                } else {
                    let html = '';
                    if (programs.length) {
                        html += `<div style="padding:6px 14px 2px;font-size:10.5px;font-weight:700;color:var(--adm-muted);letter-spacing:0.06em;text-transform:uppercase">Programs</div>`;
                        programs.forEach(p => {
                            html += `<a href="${p.link || 'academic-management.html'}" class="search-result-item"><span><i class="bi bi-mortarboard me-2" style="color:var(--adm-primary)"></i>${escapeHtml(p.title)}</span><span style="font-size:11px;color:var(--adm-muted)">${escapeHtml(p.degree_type || '')}</span></a>`;
                        });
                    }
                    if (courses.length) {
                        html += `<div style="padding:6px 14px 2px;font-size:10.5px;font-weight:700;color:var(--adm-muted);letter-spacing:0.06em;text-transform:uppercase">Courses</div>`;
                        courses.forEach(c => {
                            html += `<a href="${c.link || 'academic-management.html?tab=courses'}" class="search-result-item"><span><i class="bi bi-journal-text me-2" style="color:var(--adm-green)"></i>${escapeHtml(c.title)}</span></a>`;
                        });
                    }
                    if (users.length) {
                        html += `<div style="padding:6px 14px 2px;font-size:10.5px;font-weight:700;color:var(--adm-muted);letter-spacing:0.06em;text-transform:uppercase">Users</div>`;
                        users.forEach(u => {
                            html += `<a href="${u.link || 'user-management.html'}" class="search-result-item"><span><i class="bi bi-person me-2" style="color:var(--adm-amber)"></i>${escapeHtml(u.title || u.full_name)}</span><span style="font-size:11px;color:var(--adm-muted)">${escapeHtml(u.role || '')}</span></a>`;
                        });
                    }
                    searchContainer.innerHTML = html;
                }
                searchContainer.classList.add('active');
            } catch (err) {
                console.warn('Search query error:', err);
            }
        }, 200);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            searchContainer.classList.remove('active');
        }
    });
}

/* ============================================================
   10. GLOBAL NOTIFICATIONS WIDGET
   ============================================================ */
function initGlobalNotifications() {
    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationsMenu');
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationsList');
    if (!notifBtn || !notifMenu) return;

    function renderNotificationsList(notifications = []) {
        if (!list) return;
        if (!notifications.length) {
            list.innerHTML = `<div class="text-center text-muted py-3" style="font-size:12.5px">No notifications</div>`;
            return;
        }
        list.innerHTML = notifications.map(n => `
            <div class="notification-item" onclick="window.location.href='${n.link_url || 'dashboard.html'}'">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--adm-primary-lt);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="bi ${n.type === 'enrollment' ? 'bi-person-check-fill' : n.type === 'course' ? 'bi-journal-code' : 'bi-info-circle'}"
                       style="font-size:13px;color:var(--adm-primary)"></i>
                </div>
                <div>
                    <div style="font-size:12.5px;font-weight:600;color:var(--adm-text)">${escapeHtml(n.title)}</div>
                    <div style="font-size:11.5px;color:var(--adm-muted)">${escapeHtml(n.message)}</div>
                </div>
            </div>
        `).join('');
    }

    async function loadGlobalNotifications() {
        let notifs = [];
        if (window.AdminStore && window.AdminStore.state && window.AdminStore.state.notifications) {
            notifs = window.AdminStore.state.notifications;
        }

        const unreadCount = notifs.filter(n => !n.is_read).length;
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        renderNotificationsList(notifs);

        try {
            const token = getAdminToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('/api/admin/notifications', { headers });
            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data && Array.isArray(result.data.notifications)) {
                    if (badge) {
                        const cnt = result.data.unreadCount || 0;
                        badge.textContent = cnt;
                        badge.style.display = cnt > 0 ? 'flex' : 'none';
                    }
                    renderNotificationsList(result.data.notifications);
                }
            }
        } catch (e) {}
    }

    notifBtn.onclick = (e) => {
        e.stopPropagation();
        notifMenu.classList.toggle('active');
    };

    document.getElementById('markAllReadBtn')?.addEventListener('click', async () => {
        if (window.AdminStore && window.AdminStore.state && window.AdminStore.state.notifications) {
            window.AdminStore.state.notifications.forEach(n => { n.is_read = 1; });
            window.AdminStore.saveState();
        }
        if (badge) badge.style.display = 'none';
        try {
            const token = getAdminToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            await fetch('/api/admin/notifications/all/read', { method: 'PATCH', headers });
        } catch (e) {}
        loadGlobalNotifications();
    });

    loadGlobalNotifications();
}

/* ============================================================
   11. KEYBOARD SHORTCUT: Ctrl+K → focus search
   ============================================================ */
function initSearchShortcut() {
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const inp = document.getElementById('globalSearchInput') || document.querySelector('.admin-search-input');
            inp?.focus();
        }
    });
}

/* ============================================================
   12. TOAST NOTIFICATION SYSTEM
   ============================================================ */
function ensureToastContainer() {
    let c = document.getElementById('admToastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'admToastContainer';
        c.className = 'adm-toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function showToast(type = 'info', title = '', message = '', duration = 4000) {
    const iconMap = {
        success: 'bi-check-circle-fill',
        error:   'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info:    'bi-info-circle-fill'
    };
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `adm-toast ${type}`;
    toast.innerHTML = `
        <i class="bi ${iconMap[type] || iconMap.info} adm-toast-icon"></i>
        <div class="adm-toast-body">
            ${title ? `<div class="adm-toast-title">${title}</div>` : ''}
            ${message ? `<div class="adm-toast-msg">${message}</div>` : ''}
        </div>
        <button class="adm-toast-close" onclick="this.closest('.adm-toast').remove()">
            <i class="bi bi-x"></i>
        </button>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
}

/* ============================================================
   13. FORMAT HELPERS
   ============================================================ */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return `$${Number(amount || 0).toFixed(2)}`;
}

function formatPercent(val) {
    return `${Math.round(Number(val || 0))}%`;
}

function statusBadgeClass(status) {
    const s = (status || '').toLowerCase().replace(/ /g, '-');
    return `adm-badge adm-badge-${s}`;
}

/* ============================================================
   14. CONFIRM DIALOG
   ============================================================ */
function admConfirm(title, message, onConfirm) {
    let overlay = document.getElementById('admConfirmOverlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'admConfirmOverlay';
    overlay.className = 'adm-modal-overlay active';
    overlay.innerHTML = `
        <div class="adm-modal" style="max-width:420px">
            <div class="adm-modal-header">
                <h5 class="adm-modal-title">${title}</h5>
                <button class="adm-modal-close" onclick="document.getElementById('admConfirmOverlay').remove()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="adm-modal-body">
                <p style="margin:0;font-size:14px;color:var(--adm-text-2)">${message}</p>
            </div>
            <div class="adm-modal-footer">
                <button class="adm-btn adm-btn-outline adm-btn-sm" onclick="document.getElementById('admConfirmOverlay').remove()">Cancel</button>
                <button class="adm-btn adm-btn-danger adm-btn-sm" id="admConfirmOk">Confirm</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('admConfirmOk').addEventListener('click', () => {
        overlay.remove();
        onConfirm();
    });
}

/* ============================================================
   15. AUTO-INIT ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderAdminSidebar();
    renderAdminHeader();
    initAdminNavigationRouter();
    window.addEventListener('hashchange', () => updateAdminSidebarActiveState());

    // Close dropdowns on outside click
    document.addEventListener('click', e => {
        if (!e.target.closest('#notificationBtn') && !e.target.closest('#notificationsMenu')) {
            document.getElementById('notificationsMenu')?.classList.remove('active', 'show');
        }
        if (!e.target.closest('.admin-search-wrapper')) {
            document.getElementById('searchResultsContainer')?.classList.remove('active');
        }
    });
});

