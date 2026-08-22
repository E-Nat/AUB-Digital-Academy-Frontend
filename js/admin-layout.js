/**
 * AUB Digital Academy — Admin Shared Layout
 * Phase 1: Sidebar, hamburger, Ctrl+K, logout, toast system
 * Included by EVERY admin page. Path: ../../js/admin-layout.js
 */

/* ============================================================
   1. SIDEBAR DEFINITION
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
   2. RENDER SIDEBAR INTO <aside class="admin-sidebar">
   ============================================================ */
function renderAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Brand
    const brandHTML = `
        <div class="admin-sidebar-brand">
            <img src="../../assets/logos/rel_icon.png" alt="AUB Logo" class="admin-brand-logo-img">
            <div class="admin-brand-text-wrapper">
                <span class="admin-brand-aub">AUB</span>
                <span class="admin-brand-divider"></span>
                <div class="admin-brand-titles">
                    <div class="admin-brand-digital">DIGITAL</div>
                    <div class="admin-brand-academy">ACADEMY</div>
                </div>
            </div>
        </div>`;

    // Nav items
    let navHTML = '<nav class="admin-sidebar-nav">';
    ADMIN_NAV.forEach(group => {
        navHTML += `<div class="admin-nav-section">${group.section}</div>`;
        group.items.forEach(item => {
            const isActive = currentPage === item.href ? 'active' : '';
            navHTML += `
                <a href="${item.href}" class="admin-nav-item ${isActive}" data-page="${item.href}">
                    <i class="bi ${item.icon}"></i>
                    <span>${item.label}</span>
                </a>`;
        });
    });
    navHTML += '</nav>';

    // Footer
    const footerHTML = `
        <div class="admin-sidebar-footer">
            <button class="admin-logout-btn" id="sidebarLogoutBtn">
                <i class="bi bi-box-arrow-left"></i>
                <span>Logout</span>
            </button>
        </div>`;

    sidebar.innerHTML = brandHTML + navHTML + footerHTML;

    // Logout handler
    document.getElementById('sidebarLogoutBtn')?.addEventListener('click', handleAdminLogout);
}

/* ============================================================
   3. RENDER TOPBAR HAMBURGER (for pages with existing topbar HTML)
   ============================================================ */
function initHamburger() {
    const hamburger = document.getElementById('adminHamburger');
    const sidebar = document.querySelector('.admin-sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', () => openSidebar(sidebar, backdrop));
    backdrop?.addEventListener('click', () => closeSidebar(sidebar, backdrop));

    // Close sidebar on nav click on mobile
    sidebar.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeSidebar(sidebar, backdrop);
        });
    });
}

function openSidebar(sidebar, backdrop) {
    sidebar?.classList.add('open');
    backdrop?.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeSidebar(sidebar, backdrop) {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('visible');
    document.body.style.overflow = '';
}

/* ============================================================
   4. LOGOUT
   ============================================================ */
function handleAdminLogout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '../authentication/login.html';
}

/* ============================================================
   5. AUTH HELPERS (used by all admin JS files)
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
   6. TOPBAR PROFILE POPULATION
   ============================================================ */
function populateTopbarProfile(user) {
    if (!user) return;
    const nameEl = document.getElementById('topbarAdminName');
    const avatarEl = document.getElementById('topbarAvatar');
    const profileNameEl = document.querySelector('.profile-name');
    const profileRoleEl = document.querySelector('.profile-role');

    if (nameEl) nameEl.textContent = user.full_name || 'Admin';
    if (profileNameEl) profileNameEl.textContent = user.full_name || 'Admin';
    if (profileRoleEl) profileRoleEl.textContent = user.role_name || 'Administrator';
    if (avatarEl && user.avatar_url) avatarEl.src = user.avatar_url;
}

/* ============================================================
   7. KEYBOARD SHORTCUT: Ctrl+K → focus search
   ============================================================ */
function initSearchShortcut() {
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const inp = document.getElementById('globalSearchInput');
            inp?.focus();
        }
    });
}

/* ============================================================
   8. TOAST NOTIFICATION SYSTEM
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
   9. FORMAT HELPERS
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
   10. CONFIRM DIALOG
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
   11. AUTO-INIT ON DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    renderAdminSidebar();
    initHamburger();
    initSearchShortcut();

    // Close dropdowns on outside click
    document.addEventListener('click', e => {
        if (!e.target.closest('#notificationBtn') && !e.target.closest('#notificationsMenu')) {
            document.getElementById('notificationsMenu')?.classList.remove('active');
        }
        if (!e.target.closest('.admin-search-wrapper')) {
            document.getElementById('searchResultsContainer')?.classList.remove('active');
        }
    });
});
