// ==========================================================================
// AUB Digital Academy - Shared Admin Sidebar & Layout Controller
// Accessible Navigation, Responsive Drawer, Route Activation, High Contrast UX
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
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
    }

    // Helper functions for mobile drawer state
    function openMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('show');
        if (backdrop) backdrop.classList.add('active');
        document.body.classList.add('sidebar-open');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', 'true');
        }
    }

    function closeMobileSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('show');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
    }

    // 2. Mobile Sidebar Toggle & ARIA Controls
    if (mobileToggle && sidebar) {
        mobileToggle.setAttribute('aria-controls', sidebar.id || 'adminSidebar');
        mobileToggle.setAttribute('aria-expanded', sidebar.classList.contains('show') ? 'true' : 'false');

        mobileToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (sidebar.classList.contains('show')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    // 3. Backdrop Click Closes Sidebar
    if (backdrop) {
        backdrop.addEventListener('click', function () {
            closeMobileSidebar();
        });
    }

    // 4. Keyboard Navigation: Escape Closes Mobile Drawer
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('show')) {
            closeMobileSidebar();
            if (mobileToggle) mobileToggle.focus();
        }
    });

    // 5. Desktop/Tablet Sidebar Collapse Toggle & Global Preference Persistence
    function applySidebarCollapsedState(isCollapsed) {
        if (isCollapsed) {
            adminWrapper.classList.add('admin-sidebar-collapsed');
            if (sidebar) sidebar.classList.add('collapsed');
        } else {
            adminWrapper.classList.remove('admin-sidebar-collapsed');
            if (sidebar) sidebar.classList.remove('collapsed');
        }
    }

    if (collapseToggle && sidebar) {
        collapseToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const currentlyCollapsed = adminWrapper.classList.contains('admin-sidebar-collapsed') || (sidebar && sidebar.classList.contains('collapsed'));
            const newState = !currentlyCollapsed;
            applySidebarCollapsedState(newState);
            localStorage.setItem('aub_sidebar_collapsed', newState ? 'true' : 'false');
        });
    }

    // Restore collapsed preference across ALL admin pages (Default: EXPANDED)
    const savedCollapsed = localStorage.getItem('aub_sidebar_collapsed');
    if (savedCollapsed === 'true' && window.innerWidth >= 992) {
        applySidebarCollapsedState(true);
    } else {
        applySidebarCollapsedState(false);
    }

    // 6. Sidebar Menu Scroll Position Persistence Across Multi-Page Navigations
    const sidebarMenu = sidebar ? sidebar.querySelector('.admin-sidebar-menu') : null;

    function saveSidebarScroll() {
        if (sidebarMenu) {
            try {
                sessionStorage.setItem('aub_sidebar_scroll', String(sidebarMenu.scrollTop));
            } catch (e) {}
        }
    }

    function restoreSidebarScroll(activeItem) {
        if (!sidebarMenu) return;
        try {
            const savedScroll = sessionStorage.getItem('aub_sidebar_scroll');
            if (savedScroll !== null) {
                const scrollVal = parseInt(savedScroll, 10);
                if (!isNaN(scrollVal)) {
                    sidebarMenu.scrollTop = scrollVal;
                }
            }

            // Only if active item is NOT visible within the current scroll window, bring it minimally into view
            if (activeItem) {
                const menuRect = sidebarMenu.getBoundingClientRect();
                const itemRect = activeItem.getBoundingClientRect();
                // Check if completely outside top or bottom
                if (itemRect.top < menuRect.top || itemRect.bottom > menuRect.bottom) {
                    activeItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                    saveSidebarScroll();
                }
            }
        } catch (e) {
            console.warn('Sidebar scroll restore note:', e);
        }
    }

    // Attach scroll saving on user scroll and beforeunload/pagehide
    if (sidebarMenu) {
        let scrollTimeout = null;
        sidebarMenu.addEventListener('scroll', function () {
            if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
            scrollTimeout = requestAnimationFrame(saveSidebarScroll);
        }, { passive: true });

        window.addEventListener('beforeunload', saveSidebarScroll);
        window.addEventListener('pagehide', saveSidebarScroll);
    }

    // 7. Close Mobile Sidebar on Link Click, Save Scroll & Setup Titles for Collapsed Tooltips
    if (sidebar) {
        const navLinks = sidebar.querySelectorAll('.admin-nav-item');
        navLinks.forEach(link => {
            const spanText = link.querySelector('span')?.textContent?.trim();
            if (spanText && !link.getAttribute('title')) {
                link.setAttribute('title', spanText);
            }

            link.addEventListener('click', function () {
                saveSidebarScroll();
                if (window.innerWidth < 992) {
                    closeMobileSidebar();
                }
            });
        });

        const logoutBtn = sidebar.querySelector('.admin-logout-btn');
        if (logoutBtn && !logoutBtn.getAttribute('title')) {
            logoutBtn.setAttribute('title', 'Logout');
        }
    }

    // 8. Automatic Active Navigation Item Detection with Hash Support, ARIA & Scroll Restoration
    function updateActiveNavigation() {
        try {
            const currentPath = window.location.pathname.toLowerCase();
            const currentHash = (window.location.hash || '').toLowerCase();
            const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';
            const navItems = document.querySelectorAll('.admin-nav-item');
            
            let matchedItem = null;

            // 1. Check for exact file + hash match (e.g. payment-management.html#invoices)
            if (currentHash) {
                navItems.forEach(item => {
                    const href = (item.getAttribute('href') || '').toLowerCase();
                    const [itemFile, itemHash] = href.split('#');
                    const cleanItemFile = itemFile.substring(itemFile.lastIndexOf('/') + 1) || '';
                    if (itemHash && ('#' + itemHash) === currentHash) {
                        if (cleanItemFile === currentFile || (currentFile === '' && cleanItemFile === 'dashboard.html')) {
                            matchedItem = item;
                        }
                    }
                });
            }

            // 2. If no exact hash match, match primary page links (ignoring internal tab hashes)
            if (!matchedItem) {
                navItems.forEach(item => {
                    const href = (item.getAttribute('href') || '').toLowerCase();
                    const [itemFile, itemHash] = href.split('#');
                    const cleanItemFile = itemFile.substring(itemFile.lastIndexOf('/') + 1) || '';
                    if (!itemHash) {
                        if (cleanItemFile === currentFile || 
                            (currentFile === '' && cleanItemFile === 'dashboard.html') || 
                            (currentFile === 'index.html' && cleanItemFile === 'dashboard.html')) {
                            matchedItem = item;
                        }
                    }
                });
            }

            // 3. Fallbacks for aliases (e.g. course-management.html -> Academic Management)
            if (!matchedItem) {
                if (currentFile === 'course-management.html') {
                    navItems.forEach(item => {
                        const href = (item.getAttribute('href') || '').toLowerCase();
                        if (href.includes('academic-management.html')) matchedItem = item;
                    });
                }
            }

            // Apply active class & aria-current
            navItems.forEach(item => {
                if (item === matchedItem) {
                    item.classList.add('active');
                    item.setAttribute('aria-current', 'page');
                } else {
                    item.classList.remove('active');
                    item.removeAttribute('aria-current');
                }
            });

            // Restore / align sidebar menu scroll position stably
            restoreSidebarScroll(matchedItem);
        } catch (e) {
            console.warn('Active route detection note:', e);
        }
    }

    updateActiveNavigation();
    window.addEventListener('hashchange', updateActiveNavigation);

    // 8. Notification Dropdown Toggle & Outside Click Dismiss
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

    // 9. Global Keyboard Shortcut for Search (Ctrl + / or Ctrl + K)
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === '/')) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // 10. Hydrate Admin Profile Info in Topbar
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

    // 11. Hydrate Current Date Badge
    const dateBadge = document.getElementById('currentDateBadge');
    if (dateBadge) {
        const now = new Date();
        const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        dateBadge.textContent = `${formatted} | ${weekday}`;
    }

    // 12. Handle Responsive Window Resize
    window.addEventListener('resize', function () {
        if (window.innerWidth >= 992) {
            closeMobileSidebar();
        }
    });

    // 13. Global Logout with SweetAlert2 Confirmation
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

    // 14. Accessibility Text Size Scaling Preference (Standard 100%, Large 115%, Extra Large 130%)
    try {
        const savedTextSize = localStorage.getItem('aub_text_size') || 'standard';
        document.documentElement.setAttribute('data-text-size', savedTextSize);

        window.setAUBTextSize = function (size) {
            if (['standard', 'large', 'xlarge'].includes(size)) {
                localStorage.setItem('aub_text_size', size);
                document.documentElement.setAttribute('data-text-size', size);
                const radio = document.querySelector(`input[name="portalTextSize"][value="${size}"]`);
                if (radio) radio.checked = true;
            }
        };

        const textSizeRadios = document.querySelectorAll('input[name="portalTextSize"]');
        if (textSizeRadios.length > 0) {
            textSizeRadios.forEach(radio => {
                if (radio.value === savedTextSize) radio.checked = true;
                radio.addEventListener('change', function () {
                    if (this.checked) {
                        window.setAUBTextSize(this.value);
                    }
                });
            });
        }
    } catch (e) {
        console.warn('Text size initialization note:', e);
    }
});

