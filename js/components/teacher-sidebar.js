/**
 * AUB Digital Academy - Teacher Portal Shared Navigation & Guard Component
 */

(function () {
    // 1. Role Guard & Session Verification
    function checkTeacherAuth() {
        const token = localStorage.getItem('aub_auth_token') || 
                      sessionStorage.getItem('aub_auth_token') || 
                      localStorage.getItem('token');
        const userStr = localStorage.getItem('aub_user') || sessionStorage.getItem('aub_user');
        
        let user = null;
        if (userStr) {
            try { user = JSON.parse(userStr); } catch (e) {}
        }

        // If not logged in as Teacher (or Admin testing), initialize default teacher demo session
        if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
            user = {
                id: 7,
                full_name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@aub.edu.kh',
                university_id: 'T001',
                role: 'TEACHER',
                position: 'Lead Instructor',
                department_name: 'Computer Science & IT',
                avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'
            };
            localStorage.setItem('aub_user', JSON.stringify(user));
        }

        return user;
    }

    const currentUser = checkTeacherAuth();

    // 2. Populate Teacher Profile on Sidebar & Topbar
    document.addEventListener('DOMContentLoaded', function () {
        // Teacher Avatar & Name
        const teacherNameEls = document.querySelectorAll('.teacher-name-display, #teacherName, #topbarTeacherName');
        const teacherRoleEls = document.querySelectorAll('.teacher-role-display, #teacherRole');
        const teacherAvatarEls = document.querySelectorAll('.teacher-avatar-display, #teacherAvatar, #topbarAvatar');

        teacherNameEls.forEach(el => { if (el) el.textContent = currentUser.full_name || 'Dr. Sarah Johnson'; });
        teacherRoleEls.forEach(el => { if (el) el.textContent = currentUser.position || 'Teacher'; });
        teacherAvatarEls.forEach(el => { 
            if (el && currentUser.avatar_url) {
                el.src = currentUser.avatar_url;
            }
        });

        const sidebar = document.getElementById('teacherSidebar') || document.querySelector('.admin-sidebar');

        // Auto active navigation item detection
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        if (sidebar) {
            sidebar.querySelectorAll('.admin-nav-item').forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href === currentPage || (currentPage === '' && href === 'dashboard.html'))) {
                    link.classList.add('active');
                } else if (href && !href.startsWith('#') && href !== currentPage && !href.includes(currentPage)) {
                    link.classList.remove('active');
                }
            });
        }

        // Mobile Sidebar Toggle & Backdrop
        let backdrop = document.querySelector('.admin-sidebar-backdrop');
        if (!backdrop && sidebar) {
            backdrop = document.createElement('div');
            backdrop.className = 'admin-sidebar-backdrop';
            document.body.appendChild(backdrop);
        }

        const mobileToggle = document.getElementById('mobileSidebarToggle');
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                if (backdrop) backdrop.classList.toggle('show');
            });
        }
        if (backdrop && sidebar) {
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('show');
                backdrop.classList.remove('show');
            });
        }

        // Sidebar Scroll Position Persistence (Predictable, No jumping)
        const scrollMenu = sidebar ? sidebar.querySelector('.admin-sidebar-menu, .admin-sidebar-nav, .sidebar-scroll') : null;
        if (scrollMenu) {
            try {
                const savedScroll = sessionStorage.getItem('aub_teacher_sidebar_scroll');
                if (savedScroll !== null) {
                    const val = parseInt(savedScroll, 10);
                    if (!isNaN(val)) scrollMenu.scrollTop = val;
                }
            } catch (e) {}

            scrollMenu.addEventListener('scroll', function () {
                try {
                    sessionStorage.setItem('aub_teacher_sidebar_scroll', String(scrollMenu.scrollTop));
                } catch (e) {}
            }, { passive: true });

            sidebar.querySelectorAll('.admin-nav-item').forEach(link => {
                link.addEventListener('click', function () {
                    try {
                        sessionStorage.setItem('aub_teacher_sidebar_scroll', String(scrollMenu.scrollTop));
                    } catch (e) {}
                });
            });

            window.addEventListener('beforeunload', function () {
                try {
                    sessionStorage.setItem('aub_teacher_sidebar_scroll', String(scrollMenu.scrollTop));
                } catch (e) {}
            });
            window.addEventListener('pagehide', function () {
                try {
                    sessionStorage.setItem('aub_teacher_sidebar_scroll', String(scrollMenu.scrollTop));
                } catch (e) {}
            });
        }

        // Notifications Modal / Toast Handler
        const notificationBtn = document.getElementById('teacherNotificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', function () {
                if (!window.Swal) return;
                Swal.fire({
                    title: 'Teaching Notifications',
                    html: `
                        <div class="list-group list-group-flush text-start text-sm">
                            <div class="list-group-item py-3 px-0 border-bottom">
                                <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                                    <h6 class="mb-0 fw-bold text-xs"><i class="bi bi-file-earmark-check-fill text-warning me-1"></i> 8 New Submissions Need Review</h6>
                                    <small class="text-muted" style="font-size: 11px;">10m ago</small>
                                </div>
                                <p class="mb-1 text-muted text-xs">Students submitted "Full-Stack REST API Project" in CS301.</p>
                                <a href="submissions.html" class="adm-btn adm-btn-primary adm-btn-xs mt-1">Review Now</a>
                            </div>
                            <div class="list-group-item py-3 px-0 border-bottom">
                                <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                                    <h6 class="mb-0 fw-bold text-xs"><i class="bi bi-calendar-event text-primary me-1"></i> Consultation Request</h6>
                                    <small class="text-muted" style="font-size: 11px;">1h ago</small>
                                </div>
                                <p class="mb-1 text-muted text-xs">Sreyneang Sok requested a 1-on-1 consultation for tomorrow at 2:00 PM.</p>
                                <a href="one-on-one.html" class="adm-btn adm-btn-outline adm-btn-xs mt-1">View Request</a>
                            </div>
                            <div class="list-group-item py-3 px-0 border-bottom">
                                <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                                    <h6 class="mb-0 fw-bold text-xs"><i class="bi bi-clock-history text-danger me-1"></i> Assignment Deadline Tomorrow</h6>
                                    <small class="text-muted" style="font-size: 11px;">3h ago</small>
                                </div>
                                <p class="mb-1 text-muted text-xs">"Database Architecture Schema Design" closes in 24 hours.</p>
                            </div>
                            <div class="list-group-item py-3 px-0">
                                <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                                    <h6 class="mb-0 fw-bold text-xs"><i class="bi bi-person-plus text-success me-1"></i> New Student Enrolled</h6>
                                    <small class="text-muted" style="font-size: 11px;">Yesterday</small>
                                </div>
                                <p class="mb-1 text-muted text-xs">Vannak Chan enrolled in Full-Stack Web Development.</p>
                            </div>
                        </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: 480
                });
            });
        }
    });

    window.logoutTeacher = function () {
        if (!window.Swal) {
            localStorage.removeItem('aub_auth_token');
            localStorage.removeItem('token');
            sessionStorage.clear();
            window.location.href = '../authentication/login.html';
            return;
        }
        Swal.fire({
            title: 'Sign Out?',
            text: 'Are you sure you want to end your faculty session?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Sign Out',
            confirmButtonColor: '#2563eb',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('aub_auth_token');
                localStorage.removeItem('token');
                sessionStorage.clear();
                window.location.href = '../authentication/login.html';
            }
        });
    };
})();
