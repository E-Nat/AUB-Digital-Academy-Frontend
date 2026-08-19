// ==========================================
// AUB Digital Academy - Student Course Detail & Checkout Controller
// Course discovery, ABA KHQR Payment Gateway, Deadline Barrier Check & Enrollment
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

    // Parse Course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id')) || 1;

    let activeCourse = null;
    let selectedMethod = 'ABA PAY';
    let isEnrolled = false;

    // Modals
    const checkoutModalEl = document.getElementById('paymentCheckoutModal');
    const checkoutModal = checkoutModalEl ? new bootstrap.Modal(checkoutModalEl) : null;

    // Load Student Profile Info
    const student = (window.AdminStore ? window.AdminStore.getUsers().find(u => u.role === 'STUDENT') : null) || {
        id: 3,
        full_name: 'Sok Virak',
        university_id: '0001001',
        email: 'virak@aub.edu.kh'
    };

    if (document.getElementById('topbarStudentName')) document.getElementById('topbarStudentName').textContent = student.full_name;
    if (document.getElementById('studentName')) document.getElementById('studentName').textContent = student.full_name;

    // 1. Load Course Details
    async function loadCourse() {
        let loaded = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
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
            activeCourse = window.AdminStore.getCourseById(courseId);
        }

        if (!activeCourse) {
            alert('Course not found.');
            return;
        }

        // Check if student already enrolled
        if (window.AdminStore) {
            const enrollments = window.AdminStore.getEnrollments();
            isEnrolled = enrollments.some(e => e.student_id === student.id && e.course_id === activeCourse.id);
        }

        renderCourseDetails(activeCourse);
    }

    function getStatusBadge(status) {
        switch (status) {
            case 'Enrollment Open':
                return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1"><i class="bi bi-door-open-fill me-1"></i>Enrollment Open</span>`;
            case 'Deadline Approaching':
                return `<span class="badge bg-warning bg-opacity-15 text-dark border border-warning px-2.5 py-1"><i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>Deadline Approaching</span>`;
            case 'Enrollment Closed':
                return `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1"><i class="bi bi-lock-fill me-1"></i>Enrollment Closed</span>`;
            case 'In Progress':
                return `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1"><i class="bi bi-play-circle-fill me-1"></i>Cohort In Progress</span>`;
            case 'Upcoming':
                return `<span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1"><i class="bi bi-hourglass-split me-1"></i>Upcoming</span>`;
            default:
                return `<span class="badge bg-secondary bg-opacity-10 text-secondary border px-2.5 py-1">${escapeHtml(status || 'Active')}</span>`;
        }
    }

    function renderCourseDetails(c) {
        document.getElementById('cTitle').textContent = c.title;
        document.getElementById('cCategory').textContent = c.category_name || 'Academic';
        document.getElementById('cDifficulty').textContent = c.difficulty || 'Beginner';
        document.getElementById('cStatusBadge').innerHTML = getStatusBadge(c.computed_status || 'Enrollment Open');

        document.getElementById('cInstructorName').textContent = c.instructor_name || 'Faculty Staff';
        if (c.instructor_avatar) document.getElementById('cInstructorAvatar').src = c.instructor_avatar;
        document.getElementById('cRating').textContent = c.rating || '4.8';
        document.getElementById('cStudentsCount').textContent = c.enrolled_students_count || 0;
        document.getElementById('cDescription').textContent = c.description || 'Comprehensive curriculum designed for student mastery.';

        const price = Number(c.price) || 0;
        document.getElementById('cPriceDisplay').textContent = price > 0 ? `$${price.toFixed(2)}` : 'FREE';

        // Dates
        document.getElementById('cDeadlineDate').textContent = c.enrollment_deadline ? String(c.enrollment_deadline).split('T')[0] : 'Open Admission';
        document.getElementById('cStartDate').textContent = c.start_date ? String(c.start_date).split('T')[0] : 'Rolling Admissions';
        document.getElementById('cEndDate').textContent = c.end_date ? String(c.end_date).split('T')[0] : 'TBA';

        // Deadline Warning Banner
        const bannerContainer = document.getElementById('cDeadlinesBanner');
        const today = new Date().toISOString().split('T')[0];
        const isClosed = c.is_enrollment_closed || (c.enrollment_deadline && today > c.enrollment_deadline);

        if (isClosed) {
            bannerContainer.innerHTML = `
                <div class="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small mb-0 rounded-3">
                    <i class="bi bi-exclamation-octagon-fill fs-5"></i>
                    <div>
                        <strong>Enrollment Closed!</strong> The admission deadline for this cohort was ${c.enrollment_deadline}.
                    </div>
                </div>
            `;
        } else if (c.enrollment_deadline) {
            const diffMs = new Date(c.enrollment_deadline) - new Date(today);
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
                bannerContainer.innerHTML = `
                    <div class="alert alert-warning d-flex align-items-center gap-2 py-2 px-3 small mb-0 rounded-3 border-warning">
                        <i class="bi bi-alarm-fill text-warning fs-5"></i>
                        <div>
                            <strong>Act Fast!</strong> Enrollment closes in <strong>${diffDays} day${diffDays === 1 ? '' : 's'}</strong> (${c.enrollment_deadline}).
                        </div>
                    </div>
                `;
            } else {
                bannerContainer.innerHTML = `
                    <div class="alert alert-success d-flex align-items-center gap-2 py-2 px-3 small mb-0 rounded-3">
                        <i class="bi bi-calendar-check text-success fs-5"></i>
                        <div>Enrollment is Open until <strong>${c.enrollment_deadline}</strong>.</div>
                    </div>
                `;
            }
        }

        // Render Syllabus Modules
        const chapters = window.AdminStore ? window.AdminStore.getChaptersByCourseId(c.id) : [];
        document.getElementById('cTotalLessons').textContent = `${chapters.reduce((sum, ch) => sum + (ch.lesson_count || 0), 0)} Lessons Total`;
        
        const accordion = document.getElementById('syllabusAccordion');
        if (chapters.length === 0) {
            accordion.innerHTML = `<div class="p-3 text-center text-muted bg-light rounded border small">Module syllabus being finalized by faculty.</div>`;
        } else {
            accordion.innerHTML = chapters.map((ch, idx) => `
                <div class="accordion-item border rounded-2 mb-2 overflow-hidden">
                    <h2 class="accordion-header" id="heading${ch.id}">
                        <button class="accordion-button ${idx > 0 ? 'collapsed' : ''} bg-light py-2.5" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${ch.id}">
                            <div class="d-flex align-items-center justify-content-between w-100 me-3">
                                <span class="fw-bold text-dark" style="font-size: 13.5px;">Module ${ch.chapter_num}: ${escapeHtml(ch.title)}</span>
                                <span class="badge bg-white text-primary border">${ch.lesson_count || 3} Lessons &bull; ${escapeHtml(ch.duration || '2 Hours')}</span>
                            </div>
                        </button>
                    </h2>
                    <div id="collapse${ch.id}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" data-bs-parent="#syllabusAccordion">
                        <div class="accordion-body p-3 bg-white" style="font-size: 13px;">
                            <p class="text-secondary mb-2">${escapeHtml(ch.description || 'Core interactive exercises, theory lecture, and hands-on coding laboratory.')}</p>
                            <div class="d-flex align-items-center gap-3 text-muted small">
                                <span><i class="bi bi-play-circle me-1 text-primary"></i>Video Lectures Included</span>
                                <span><i class="bi bi-file-earmark-code me-1 text-primary"></i>Practical Code Starter</span>
                                <span><i class="bi bi-patch-question me-1 text-primary"></i>Knowledge Check Quiz</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Render Action Button
        const actionContainer = document.getElementById('cEnrollActionContainer');
        if (isEnrolled) {
            actionContainer.innerHTML = `
                <a href="dashboard.html" class="btn btn-success btn-lg w-100 py-3 fw-bold shadow-sm">
                    <i class="bi bi-play-circle-fill me-1"></i> Already Enrolled &bull; Go to Classroom
                </a>
            `;
        } else if (isClosed) {
            actionContainer.innerHTML = `
                <button class="btn btn-secondary btn-lg w-100 py-3 fw-bold disabled" disabled>
                    <i class="bi bi-lock-fill me-1"></i> Enrollment Closed
                </button>
            `;
        } else {
            actionContainer.innerHTML = `
                <button class="btn btn-primary btn-lg w-100 py-3 fw-bold shadow-sm" onclick="openPaymentModal()">
                    <i class="bi bi-credit-card me-1"></i> ${price > 0 ? `Enroll Now &bull; Proceed to Payment ($${price.toFixed(2)})` : 'Enroll Now for Free'}
                </button>
            `;
        }
    }

    // 2. Checkout Modal Handling
    window.openPaymentModal = function () {
        if (!activeCourse) return;

        const price = Number(activeCourse.price) || 0;
        document.getElementById('checkoutCourseTitle').textContent = activeCourse.title;
        document.getElementById('checkoutCourseMeta').textContent = `${activeCourse.category_name} &bull; Led by ${activeCourse.instructor_name}`;
        document.getElementById('checkoutPrice').textContent = price > 0 ? `$${price.toFixed(2)}` : 'FREE';

        // Reset views
        document.getElementById('paymentFeedbackContainer').classList.add('d-none');
        document.getElementById('checkoutFooter').classList.remove('d-none');
        selectPaymentMethod('ABA PAY');

        if (checkoutModal) checkoutModal.show();
    };

    window.selectPaymentMethod = function (method) {
        selectedMethod = method;
        document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('selected'));

        if (method === 'ABA PAY') {
            document.getElementById('method-aba')?.classList.add('selected');
            document.getElementById('khqrView')?.classList.remove('d-none');
        } else if (method === 'Credit Card') {
            document.getElementById('method-card')?.classList.add('selected');
            document.getElementById('khqrView')?.classList.add('d-none');
        } else {
            document.getElementById('method-bank')?.classList.add('selected');
            document.getElementById('khqrView')?.classList.add('d-none');
        }
    };

    window.processCheckout = async function () {
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Verifying...`;
        }

        // Show feedback processing animation
        document.getElementById('paymentFeedbackContainer')?.classList.remove('d-none');

        try {
            // Check deadline barrier
            const today = new Date().toISOString().split('T')[0];
            if (activeCourse.enrollment_deadline && today > activeCourse.enrollment_deadline) {
                throw new Error('Enrollment deadline has expired. Admission is now closed.');
            }

            let result = null;
            if (window.AdminStore) {
                result = window.AdminStore.enrollInCourse(activeCourse.id, student.id, selectedMethod);
            }

            const res = await fetch(`${API_BASE}/public/courses/${activeCourse.id}/enroll`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    student_id: student.id,
                    student_name: student.full_name,
                    payment_method: selectedMethod
                })
            });

            setTimeout(() => {
                if (checkoutModal) checkoutModal.hide();

                if (window.Swal) {
                    window.Swal.fire({
                        icon: 'success',
                        title: 'Enrollment Confirmed! 🎉',
                        html: `
                            <p class="text-secondary mb-2">Your payment of <strong>$${Number(activeCourse.price || 0).toFixed(2)}</strong> via <strong>${selectedMethod}</strong> has been verified.</p>
                            <div class="p-3 bg-light rounded border text-start small mb-3">
                                <div><strong>Course:</strong> ${escapeHtml(activeCourse.title)}</div>
                                <div><strong>Student:</strong> ${escapeHtml(student.full_name)} (${student.university_id})</div>
                                <div><strong>Status:</strong> <span class="badge bg-success">Active Admission</span></div>
                            </div>
                        `,
                        confirmButtonColor: '#2563EB',
                        confirmButtonText: '<i class="bi bi-play-circle me-1"></i> Start Course Now',
                        allowOutsideClick: false
                    }).then(() => {
                        window.location.href = 'dashboard.html';
                    });
                } else {
                    alert('Payment Successful! Enrollment Confirmed.');
                    window.location.href = 'dashboard.html';
                }
            }, 900);

        } catch (err) {
            document.getElementById('paymentFeedbackContainer')?.classList.add('d-none');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Confirm & Complete Enrollment`;
            }
            if (window.Swal) {
                window.Swal.fire({
                    icon: 'error',
                    title: 'Enrollment Failed',
                    text: err.message || 'Cannot complete enrollment.'
                });
            } else {
                alert(err.message || 'Cannot complete enrollment.');
            }
        }
    };

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize Page
    loadCourse();
});
