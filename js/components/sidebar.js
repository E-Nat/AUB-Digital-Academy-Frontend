// ==========================================
// AUB Digital Academy - Shared Admin Sidebar & Layout Controller
// Mobile Drawer, Topbar Hydration, Dynamic Date, SweetAlert2 Logout Confirmation
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // 1. Mobile Sidebar Toggle & Backdrop
    const sidebar = document.querySelector('.admin-sidebar');
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    
    // Create Backdrop Element if not already present
    let backdrop = document.querySelector('.admin-sidebar-backdrop');
    if (!backdrop && sidebar) {
        backdrop = document.createElement('div');
        backdrop.className = 'admin-sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            sidebar.classList.toggle('show');
            if (backdrop) backdrop.classList.toggle('active');
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', function () {
            if (sidebar) sidebar.classList.remove('show');
            backdrop.classList.remove('active');
        });
    }

    // Close sidebar on link click (mobile)
    if (sidebar) {
        const navLinks = sidebar.querySelectorAll('.admin-nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth < 992) {
                    sidebar.classList.remove('show');
                    if (backdrop) backdrop.classList.remove('active');
                }
            });
        });
    }

    // 2. Hydrate Admin Profile info in topbar
    try {
        let user = null;
        if (window.AdminStore) {
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

    // 3. Hydrate Date Badge if present
    const dateBadge = document.getElementById('currentDateBadge');
    if (dateBadge) {
        const now = new Date();
        const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        dateBadge.textContent = `${formatted} | ${weekday}`;
    }

    // 4. Global Logout with SweetAlert2 Confirmation
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
                sessionStorage.removeItem('aub_auth_token');
                sessionStorage.removeItem('token');
                window.location.href = '../authentication/login.html';
            }
        });
    });
});
