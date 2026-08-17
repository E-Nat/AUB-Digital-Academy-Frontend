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
        teacherRoleEls.forEach(el => { if (el) el.textContent = currentUser.position || 'Lead Instructor'; });
        teacherAvatarEls.forEach(el => { 
            if (el && currentUser.avatar_url) {
                el.src = currentUser.avatar_url;
            }
        });

        // Mobile Sidebar Toggle
        const mobileToggle = document.getElementById('mobileSidebarToggle');
        const sidebar = document.getElementById('teacherSidebar') || document.querySelector('.admin-sidebar');
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });
        }

        // Notifications Modal / Toast Handler
        const notificationBtn = document.getElementById('teacherNotificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', function () {
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
                                <a href="submissions.html" class="btn btn-sm btn-outline-primary py-0 px-2 text-xs mt-1">Review Now</a>
                            </div>
                            <div class="list-group-item py-3 px-0 border-bottom">
                                <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                                    <h6 class="mb-0 fw-bold text-xs"><i class="bi bi-calendar-event text-primary me-1"></i> Consultation Request</h6>
                                    <small class="text-muted" style="font-size: 11px;">1h ago</small>
                                </div>
                                <p class="mb-1 text-muted text-xs">Sreyneang Sok requested a 1-on-1 consultation for tomorrow at 2:00 PM.</p>
                                <a href="one-on-one.html" class="btn btn-sm btn-outline-primary py-0 px-2 text-xs mt-1">View Request</a>
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
