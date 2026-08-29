/**
 * ============================================================
 * AUB Digital Academy — Student Shared Layout & Navigation Controller
 * Handles auth guard, persistent navigation, responsive sidebar,
 * topbar profile syncing, search shortcuts, and notifications.
 * ============================================================
 */

(function (global) {
    'use strict';

    // 1. Check / Resolve Student Session
    function checkStudentAuth() {
        const token = localStorage.getItem('aub_auth_token') || 
                      sessionStorage.getItem('aub_auth_token') || 
                      localStorage.getItem('token');
        const userStr = localStorage.getItem('aub_user') || sessionStorage.getItem('aub_user');
        
        let user = null;
        if (userStr) {
            try { user = JSON.parse(userStr); } catch (e) {}
        }

        // If not logged in as Student (or Admin testing), initialize default student session (Sreyneang)
        if (!user || (user.role !== 'STUDENT' && user.role !== 'ADMIN')) {
            user = {
                id: 3,
                full_name: 'Sreyneang Kim',
                first_name: 'Sreyneang',
                email: 'sreyneang.kim@example.com',
                university_id: 'STU-2026-002',
                role: 'STUDENT',
                role_id: 3,
                major: 'Software Engineering',
                faculty: 'Information Technology',
                academic_year: 'Year 2',
                semester: 'Semester 2',
                enrollment_status: 'Active',
                academic_status: 'Currently Enrolled',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150'
            };
            localStorage.setItem('aub_user', JSON.stringify(user));
        }

        return user;
    }

    const currentUser = checkStudentAuth();

    // 2. Global Logout Handler
    global.logoutStudent = function () {
        localStorage.removeItem('aub_auth_token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('aub_auth_token');
        sessionStorage.removeItem('token');
        window.location.href = '../authentication/login.html';
    };

    // 3. Document Lifecycle Initialization
    document.addEventListener('DOMContentLoaded', function () {
        initProfileData();
        initNavigationHighlight();
        initMobileSidebar();
        initNotificationsDropdown();
        initSearchShortcut();
    });

    // Populate Topbar & Profile Elements
    function initProfileData() {
        const studentNameEls = document.querySelectorAll('#topbarStudentName, #studentName, .student-name-display');
        const studentFirstNameEls = document.querySelectorAll('#welcomeStudentName');
        const studentAvatarEls = document.querySelectorAll('#topbarAvatar, #studentAvatar, .student-avatar-display');
        const studentIdEls = document.querySelectorAll('#studentIdDisplay, .student-id-display');
        const studentMajorEls = document.querySelectorAll('#studentMajorDisplay, .student-major-display');

        const firstName = currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'Sreyneang';

        studentNameEls.forEach(el => { if (el) el.textContent = currentUser.full_name || 'Sreyneang Kim'; });
        studentFirstNameEls.forEach(el => { if (el) el.textContent = firstName; });
        studentIdEls.forEach(el => { if (el) el.textContent = `ID: ${currentUser.university_id || 'STU-2026-002'}`; });
        studentMajorEls.forEach(el => { if (el) el.textContent = currentUser.major || 'Software Engineering'; });
        
        studentAvatarEls.forEach(el => {
            if (el && currentUser.avatar_url) {
                el.src = currentUser.avatar_url;
                el.alt = currentUser.full_name || 'Student';
            }
        });
    }

    // Highlight Current Active Nav Link
    function initNavigationHighlight() {
        const currentPath = window.location.pathname.toLowerCase();
        const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';

        const navLinks = document.querySelectorAll('.admin-sidebar-menu .admin-nav-item');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkFile = href.split('?')[0].split('#')[0].toLowerCase();
                if (linkFile === currentFile || (currentFile === '' && linkFile === 'dashboard.html')) {
                    link.classList.add('active');
                } else if (!href.startsWith('http') && !href.startsWith('..')) {
                    link.classList.remove('active');
                }
            }
        });
    }

    // Mobile Sidebar Drawer & Backdrop
    function initMobileSidebar() {
        const sidebar = document.querySelector('.admin-sidebar');
        const mobileToggle = document.getElementById('adminHamburger') || document.getElementById('mobileSidebarToggle');
        
        let backdrop = document.getElementById('sidebarBackdrop') || document.querySelector('.admin-sidebar-backdrop');
        if (!backdrop && sidebar) {
            backdrop = document.createElement('div');
            backdrop.className = 'admin-sidebar-backdrop';
            backdrop.id = 'sidebarBackdrop';
            document.body.appendChild(backdrop);
        }

        function openSidebar() {
            if (sidebar) sidebar.classList.add('show');
            if (backdrop) backdrop.classList.add('active');
            document.body.classList.add('sidebar-open');
        }

        function closeSidebar() {
            if (sidebar) sidebar.classList.remove('show');
            if (backdrop) backdrop.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }

        if (mobileToggle) {
            mobileToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                if (sidebar && sidebar.classList.contains('show')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', closeSidebar);
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar && sidebar.classList.contains('show')) {
                closeSidebar();
            }
        });
    }

    // Notifications Dropdown Handler
    function initNotificationsDropdown() {
        const notifBtn = document.getElementById('notificationBtn') || document.getElementById('studentNotificationBtn');
        const notifMenu = document.getElementById('notificationsMenu');
        const notifBadge = document.getElementById('notificationBadge');
        const markAllReadBtn = document.getElementById('markAllReadBtn');

        if (notifBtn && notifMenu) {
            notifBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                notifMenu.classList.toggle('show');
            });

            document.addEventListener('click', function (e) {
                if (!notifMenu.contains(e.target) && !notifBtn.contains(e.target)) {
                    notifMenu.classList.remove('show');
                }
            });
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (notifBadge) {
                    notifBadge.style.display = 'none';
                    notifBadge.textContent = '0';
                }
                const unreadItems = document.querySelectorAll('.notif-item.unread');
                unreadItems.forEach(item => item.classList.remove('unread'));
            });
        }
    }

    // Global Search Keyboard Shortcut (Ctrl+K or Cmd+K)
    function initSearchShortcut() {
        const searchInput = document.getElementById('globalSearchInput') || document.getElementById('studentSearchInput');
        if (!searchInput) return;

        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

})(typeof window !== 'undefined' ? window : this);
