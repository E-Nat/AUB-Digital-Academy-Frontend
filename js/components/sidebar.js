// ==========================================================================
// AUB Digital Academy - Shared Admin Sidebar & Layout Controller (Phase 1)
// Responsive Drawer, Backdrop, Route Activation, Notifications, Collapse & Logout
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.admin-sidebar');
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const collapseToggle = document.getElementById('sidebarCollapseToggle');
    const adminWrapper = document.querySelector('.admin-wrapper') || document.body;

    // 1. Create or Find Backdrop Element for Mobile/Tablet Drawer
    let backdrop = document.querySelector('.admin-sidebar-backdrop');
    if (!backdrop && sidebar) {
        backdrop = document.createElement('div');
        backdrop.className = 'admin-sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    // 2. Mobile Sidebar Toggle
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            sidebar.classList.toggle('show');
            if (backdrop) backdrop.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
    }

    // 3. Backdrop Click Closes Sidebar
    if (backdrop) {
        backdrop.addEventListener('click', function () {
            if (sidebar) sidebar.classList.remove('show');
            backdrop.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
    }

    // 4. Desktop/Tablet Sidebar Collapse Toggle
    if (collapseToggle && sidebar) {
        collapseToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            adminWrapper.classList.toggle('admin-sidebar-collapsed');
            const isCollapsed = adminWrapper.classList.contains('admin-sidebar-collapsed');
            localStorage.setItem('aub_sidebar_collapsed', isCollapsed ? 'true' : 'false');
        });

        // Restore collapsed preference
        if (localStorage.getItem('aub_sidebar_collapsed') === 'true' && window.innerWidth >= 992) {
            adminWrapper.classList.add('admin-sidebar-collapsed');
        }
    }

    // 5. Close Mobile Sidebar on Link Click
    if (sidebar) {
        const navLinks = sidebar.querySelectorAll('.admin-nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth < 992) {
                    sidebar.classList.remove('show');
                    if (backdrop) backdrop.classList.remove('active');
                    document.body.classList.remove('sidebar-open');
                }
            });
        });
    }

    // 6. Automatic Active Navigation Item Detection
    try {
        const currentPath = window.location.pathname.toLowerCase();
        const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';
        const navItems = document.querySelectorAll('.admin-nav-item');
        
        let hasActive = false;
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href) {
                const itemFile = href.substring(href.lastIndexOf('/') + 1).toLowerCase().split('?')[0].split('#')[0];
                if (itemFile === currentFile || (currentFile === '' && itemFile === 'dashboard.html')) {
                    item.classList.add('active');
                    hasActive = true;
                } else {
                    item.classList.remove('active');
                }
            }
        });
        
        // Fallback: If no exact match (e.g. index), keep first item or match by alias
        if (!hasActive && navItems.length > 0) {
            if (currentFile.includes('course') || currentFile.includes('academic')) {
                const academicLink = document.querySelector('a[href*="academic"], a[href*="course"]');
                if (academicLink) academicLink.classList.add('active');
            } else if (currentFile.includes('dashboard')) {
                const dashLink = document.querySelector('a[href*="dashboard"]');
                if (dashLink) dashLink.classList.add('active');
            }
        }
    } catch (e) {
        console.warn('Active route detection note:', e);
    }

    // 7. Notification Dropdown Toggle & Outside Click Dismiss
    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationsMenu');
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

    // 8. Global Keyboard Shortcut for Search (Ctrl + / or Ctrl + K)
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // 9. Hydrate Admin Profile Info in Topbar
    try {
        let user = null;
        if (window.AdminStore && typeof window.AdminStore.getAdminUser === 'function') {
            user = window.AdminStore.getAdminUser();
        }
        if (!user) {
            const userStr = localStorage.getItem('aub_user') || sessionStorage.getItem('aub_user');
            if (userStr) user = JSON.parse(userStr);
        }

        if (user) {
            const nameEls = document.querySelectorAll('#topbarAdminName, .topbar-admin-name');
            nameEls.forEach(el => {
                if (user.full_name) el.textContent = user.full_name;
            });
            const avatarEls = document.querySelectorAll('#topbarAvatar, .topbar-admin-avatar');
            avatarEls.forEach(el => {
                if (user.avatar_url) el.src = user.avatar_url;
            });
        }
    } catch (e) {
        console.error('Error hydrating admin profile info:', e);
    }

    // 10. Hydrate Current Date Badge
    const dateBadge = document.getElementById('currentDateBadge');
    if (dateBadge) {
        const now = new Date();
        const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        dateBadge.textContent = `${formatted} | ${weekday}`;
    }

    // 11. Handle Responsive Window Resize
    window.addEventListener('resize', function () {
        if (window.innerWidth >= 992) {
            if (sidebar) sidebar.classList.remove('show');
            if (backdrop) backdrop.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });

    // 12. Global Logout with SweetAlert2 Confirmation
    const logoutBtns = document.querySelectorAll('.admin-logout-btn, #logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();

            let confirmed = true;
            if (window.Swal) {
                const res = await window.Swal.fire({
                    title: 'Sign Out Confirmation',
                    text: 'Are you sure you want to log out from the Admin Portal?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#EF4444',
                    cancelButtonColor: '#64748B',
                    confirmButtonText: 'Yes, Sign Out',
                    cancelButtonText: 'Stay Logged In',
                    reverseButtons: true
                });
                confirmed = res.isConfirmed;
            } else {
                confirmed = confirm('Are you sure you want to sign out?');
            }

            if (confirmed) {
                localStorage.removeItem('aub_auth_token');
                localStorage.removeItem('token');
                localStorage.removeItem('aub_user');
                sessionStorage.removeItem('aub_auth_token');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('aub_user');
                window.location.href = '../authentication/login.html';
            }
        });
    });
});
