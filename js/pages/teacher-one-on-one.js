/**
 * AUB Digital Academy - Teacher 1-on-1 Consultations Controller
 * Manages student video mentoring requests, upcoming scheduled meetings, and office hours.
 */

document.addEventListener('DOMContentLoaded', function () {
    const consultationsData = [
        {
            id: 1,
            student_name: 'Sreyneang Sok',
            student_id: '202401234',
            student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            course: 'Full-Stack Web Development',
            requested_date: 'Tomorrow, Aug 19, 2026',
            requested_time: '02:00 PM – 02:30 PM',
            topic: 'Clarification on SQLite Foreign Key CASCADE behavior and JWT refresh rotation tokens',
            status: 'pending'
        },
        {
            id: 2,
            student_name: 'Vannak Chan',
            student_id: '202401239',
            student_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            course: 'Python for Data Science & AI',
            requested_date: 'Thursday, Aug 20, 2026',
            requested_time: '10:00 AM – 10:30 AM',
            topic: 'Reviewing dataset distributions and feature engineering for capstone project',
            status: 'pending'
        },
        {
            id: 3,
            student_name: 'Dara Sok',
            student_id: '202401236',
            student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            course: 'Full-Stack Web Development',
            requested_date: 'Friday, Aug 21, 2026',
            requested_time: '03:30 PM – 04:00 PM',
            topic: 'Docker Compose networking and persistent database volume mounts',
            status: 'upcoming'
        },
        {
            id: 4,
            student_name: 'Kanha Rath',
            student_id: '202401237',
            student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            course: 'Cloud Infrastructure & DevOps',
            requested_date: 'Monday, Aug 24, 2026',
            requested_time: '04:00 PM – 04:30 PM',
            topic: 'CI/CD GitHub Actions workflow deployment strategy',
            status: 'upcoming'
        },
        {
            id: 5,
            student_name: 'Chanthou Meas',
            student_id: '202401235',
            student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            course: 'Python for Data Science & AI',
            requested_date: 'Aug 14, 2026',
            requested_time: '02:00 PM – 02:30 PM',
            topic: 'Pandas groupby aggregation and statistical outliers removal',
            status: 'completed'
        }
    ];

    let currentTab = 'pending';
    const tabGroup = document.getElementById('consultationTabGroup');
    const searchInput = document.getElementById('consultSearchInput');

    function updateBadgeCounts() {
        const pendingCount = consultationsData.filter(c => c.status === 'pending').length;
        const upcomingCount = consultationsData.filter(c => c.status === 'upcoming').length;

        const elP = document.getElementById('countPendingRequests');
        const elU = document.getElementById('countUpcomingSessions');

        if (elP) elP.textContent = pendingCount;
        if (elU) elU.textContent = upcomingCount;
    }

    function renderConsultations() {
        const grid = document.getElementById('consultationsGrid');
        if (!grid) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const filtered = consultationsData.filter(c => {
            const matchTab = c.status === currentTab;
            const matchQuery = !query || 
                c.student_name.toLowerCase().includes(query) ||
                c.topic.toLowerCase().includes(query) ||
                c.course.toLowerCase().includes(query);
            return matchTab && matchQuery;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-calendar2-x fs-2 d-block mb-2 text-secondary opacity-50"></i>
                    No ${currentTab} consultations found.
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(item => {
            if (currentTab === 'pending') {
                return `
                    <div class="col-lg-6">
                        <div class="consultation-card">
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${item.student_avatar}" class="rounded-circle object-fit-cover" style="width: 44px; height: 44px; border: 1.5px solid #E2E8F0;">
                                    <div>
                                        <h6 class="fw-bold text-dark mb-0">${item.student_name}</h6>
                                        <div class="text-xs text-muted font-monospace">ID: ${item.student_id} &bull; ${item.course}</div>
                                    </div>
                                </div>
                                <span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 text-xs">Pending Approval</span>
                            </div>

                            <div class="p-3 bg-light rounded-3 mb-3">
                                <div class="d-flex align-items-center gap-2 text-xs text-muted mb-1">
                                    <i class="bi bi-calendar-event text-primary"></i> <span class="fw-bold text-dark">${item.requested_date}</span>
                                    &bull; <i class="bi bi-clock"></i> <span class="fw-bold text-dark">${item.requested_time}</span>
                                </div>
                                <div class="text-xs text-dark mt-2">
                                    <i class="bi bi-chat-left-text text-primary me-1"></i> "${item.topic}"
                                </div>
                            </div>

                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-outline-danger btn-sm text-xs" onclick="declineConsultation(${item.id})">
                                    <i class="bi bi-x-circle me-1"></i> Decline
                                </button>
                                <button type="button" class="btn btn-outline-secondary btn-sm text-xs" onclick="rescheduleConsultation(${item.id})">
                                    <i class="bi bi-clock-history me-1"></i> Reschedule
                                </button>
                                <button type="button" class="btn btn-success btn-sm text-xs px-3" onclick="acceptConsultation(${item.id})">
                                    <i class="bi bi-check2-circle me-1"></i> Accept Session
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else if (currentTab === 'upcoming') {
                return `
                    <div class="col-lg-6">
                        <div class="consultation-card" style="border-left: 4px solid #2563EB;">
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${item.student_avatar}" class="rounded-circle object-fit-cover" style="width: 44px; height: 44px; border: 1.5px solid #E2E8F0;">
                                    <div>
                                        <h6 class="fw-bold text-dark mb-0">${item.student_name}</h6>
                                        <div class="text-xs text-muted">${item.course}</div>
                                    </div>
                                </div>
                                <span class="consultation-time-badge">${item.requested_date}</span>
                            </div>

                            <div class="p-3 bg-light rounded-3 mb-3">
                                <div class="text-xs text-muted mb-1"><i class="bi bi-clock text-primary me-1"></i> ${item.requested_time}</div>
                                <div class="text-xs text-dark fw-semibold">"${item.topic}"</div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="btn btn-outline-secondary btn-sm text-xs" onclick="rescheduleConsultation(${item.id})">
                                    <i class="bi bi-eye me-1"></i> View Session
                                </button>
                                <button class="btn btn-primary btn-sm px-3 text-xs fw-bold" onclick="joinMeetingRoom('${item.student_name}')">
                                    <i class="bi bi-camera-video-fill me-1"></i> Start Consultation
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="col-lg-6">
                        <div class="consultation-card opacity-75">
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <div class="d-flex align-items-center gap-2">
                                    <img src="${item.student_avatar}" class="rounded-circle object-fit-cover" style="width: 36px; height: 36px;">
                                    <div>
                                        <div class="fw-bold text-dark text-sm">${item.student_name}</div>
                                        <div class="text-xs text-muted">${item.requested_date} &bull; ${item.requested_time}</div>
                                    </div>
                                </div>
                                <span class="badge bg-light text-dark border text-xs"><i class="bi bi-check2-all text-success me-1"></i> Completed</span>
                            </div>
                            <div class="text-xs text-muted p-2 bg-light rounded">
                                "${item.topic}"
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    if (tabGroup) {
        tabGroup.addEventListener('click', function (e) {
            const btn = e.target.closest('.consultation-tab-btn');
            if (!btn) return;
            tabGroup.querySelectorAll('.consultation-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            renderConsultations();
        });
    }

    if (searchInput) searchInput.addEventListener('input', renderConsultations);

    window.acceptConsultation = function (id) {
        const item = consultationsData.find(c => c.id === id);
        if (!item) return;

        item.status = 'upcoming';
        updateBadgeCounts();
        renderConsultations();

        Swal.fire({
            icon: 'success',
            title: 'Consultation Accepted',
            text: `Meeting confirmed with ${item.student_name} for ${item.requested_date}.`,
            timer: 1600,
            showConfirmButton: false
        });
    };

    window.declineConsultation = async function (id) {
        const item = consultationsData.find(c => c.id === id);
        if (!item) return;

        const { value: reason } = await Swal.fire({
            title: `Decline Request from ${item.student_name}`,
            input: 'textarea',
            inputPlaceholder: 'Reason for declining or alternate suggestion...',
            showCancelButton: true,
            confirmButtonText: 'Decline Session',
            confirmButtonColor: '#ef4444'
        });

        if (reason !== undefined) {
            consultationsData.splice(consultationsData.indexOf(item), 1);
            updateBadgeCounts();
            renderConsultations();

            Swal.fire({
                icon: 'info',
                title: 'Session Declined',
                text: 'Student has been notified with your reason.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    window.rescheduleConsultation = async function (id) {
        const item = consultationsData.find(c => c.id === id);
        if (!item) return;

        const { value: newTime } = await Swal.fire({
            title: 'Reschedule Consultation',
            html: `
                <div class="text-start mb-2">
                    <label class="form-label text-xs fw-bold text-muted">Propose New Date & Time</label>
                    <input type="datetime-local" id="swalRescheduleDate" class="form-control form-control-sm" value="2026-08-22T14:00">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Send Reschedule Notice',
            confirmButtonColor: '#2563eb'
        });

        if (newTime !== undefined) {
            item.requested_date = 'Aug 22, 2026';
            item.requested_time = '02:00 PM – 02:30 PM';
            renderConsultations();

            Swal.fire({
                icon: 'success',
                title: 'Reschedule Sent',
                text: `${item.student_name} has received the new proposed consultation slot.`,
                timer: 1600,
                showConfirmButton: false
            });
        }
    };

    window.joinMeetingRoom = function (studentName) {
        Swal.fire({
            title: `Live Room: ${studentName}`,
            text: 'Launching secure high-definition video session with code editor...',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Enter Room',
            confirmButtonColor: '#2563eb'
        });
    };

    window.configureAvailability = function () {
        Swal.fire({
            title: 'Set Faculty Office Hours',
            html: `
                <div class="text-start text-xs">
                    <div class="mb-3">
                        <label class="form-label fw-bold text-muted">Weekly Consultation Slots</label>
                        <div class="form-check mb-1">
                            <input class="form-check-input" type="checkbox" id="availTue" checked>
                            <label class="form-check-label" for="availTue">Tuesdays: 02:00 PM – 04:00 PM</label>
                        </div>
                        <div class="form-check mb-1">
                            <input class="form-check-input" type="checkbox" id="availThu" checked>
                            <label class="form-check-label" for="availThu">Thursdays: 10:00 AM – 12:00 PM</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="availFri" checked>
                            <label class="form-check-label" for="availFri">Fridays: 03:00 PM – 05:00 PM</label>
                        </div>
                    </div>
                    <div>
                        <label class="form-label fw-bold text-muted">Max Slot Duration</label>
                        <select class="form-select form-select-sm" id="slotDuration">
                            <option value="30">30 Minutes per session</option>
                            <option value="45">45 Minutes per session</option>
                        </select>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Availability',
            confirmButtonColor: '#2563eb'
        }).then((res) => {
            if (res.isConfirmed) {
                Swal.fire({ icon: 'success', title: 'Office Hours Saved', timer: 1400, showConfirmButton: false });
            }
        });
    };

    // Initialize
    updateBadgeCounts();
    renderConsultations();
});
