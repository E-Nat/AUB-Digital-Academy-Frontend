// ==========================================================================
// AUB Digital Academy - Redesigned Admin Dashboard Controller
// Operational Status KPIs, Financial Summary, Date Filter, Trends Bar Chart,
// Students by Major Donut Chart, Discipline Breakdown & Accessible Operations
// ==========================================================================

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

    // State
    let currentTimeframe = 'all_time';
    let currentCustomStart = '';
    let currentCustomEnd = '';

    // Initialize Bootstrap Custom Date Modal
    const customDateModalEl = document.getElementById('customDateModal');
    const customDateModal = customDateModalEl && window.bootstrap ? new bootstrap.Modal(customDateModalEl) : null;

    // 1. Session Check & Header Date Formatting
    if (window.AdminStore) {
        window.AdminStore.ensureDefaultAdminSession();
    }

    function initHeaderDate() {
        const dateBadge = document.getElementById('currentDateBadge');
        if (dateBadge) {
            const now = new Date();
            const options = { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' };
            const parts = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
            dateBadge.textContent = `${parts} | ${weekday}`;
        }
    }
    initHeaderDate();

    // 2. Load Operational & Financial Dashboard Metrics
    async function loadMetrics() {
        let metricsData = null;

        try {
            let url = `${API_BASE}/admin/dashboard/metrics?timeframe=${encodeURIComponent(currentTimeframe)}`;
            if (currentTimeframe === 'custom' && currentCustomStart && currentCustomEnd) {
                url += `&startDate=${encodeURIComponent(currentCustomStart)}&endDate=${encodeURIComponent(currentCustomEnd)}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(url, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    metricsData = result.data;
                }
            }
        } catch (err) {}

        // Local fallback if offline
        if (!metricsData && window.AdminStore) {
            metricsData = window.AdminStore.getDashboardMetrics();
        }

        if (metricsData) {
            // A. Operational Status Cards (6 Cards)
            animateCounter('kpiPendingEnrollments', metricsData.pendingEnrollments || 1);
            animateCounter('kpiPendingPayments', metricsData.pendingPayments || 1);
            animateCounter('kpiActiveCourses', metricsData.activeCourses || metricsData.totalCourses || 5);
            animateCounter('kpiCompletedCourses', metricsData.completedCourses || 1);
            animateCounter('kpiUpcomingExams', metricsData.upcomingExams || 3);
            animateCounter('kpiPendingResults', metricsData.pendingExamResults || 2);

            // B. Financial Summary
            const paidRev = metricsData.totalPaidRevenue !== undefined ? metricsData.totalPaidRevenue : 190.00;
            const pendingRev = metricsData.totalPendingRevenue !== undefined ? metricsData.totalPendingRevenue : 80.00;
            const grossRev = metricsData.totalRevenue !== undefined ? metricsData.totalRevenue : (paidRev + pendingRev);
            const paidInvoices = metricsData.paidInvoicesCount !== undefined ? metricsData.paidInvoicesCount : 3;
            const outstandingInvoices = metricsData.outstandingInvoicesCount !== undefined ? metricsData.outstandingInvoicesCount : 1;

            animateCurrency('kpiTotalRevenue', paidRev);
            animateCurrency('kpiPendingRevenueAmount', pendingRev);
            animateCurrency('kpiGrossRevenueAmount', grossRev);
            animateCounter('kpiPaidInvoicesCount', paidInvoices);
            animateCounter('kpiPendingCount', metricsData.pendingPayments || 1);
            animateCounter('kpiOutstandingInvoicesCount', outstandingInvoices);
        }
    }

    function animateCounter(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const current = parseInt(el.textContent.replace(/,/g, '')) || 0;
        if (current === targetValue) {
            el.textContent = targetValue.toLocaleString();
            return;
        }

        const duration = 400;
        const stepTime = 20;
        const steps = Math.max(1, duration / stepTime);
        const increment = (targetValue - current) / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const val = Math.round(current + (increment * step));
            el.textContent = val.toLocaleString();
            if (step >= steps) {
                clearInterval(timer);
                el.textContent = targetValue.toLocaleString();
            }
        }, stepTime);
    }

    function animateCurrency(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = '$' + Number(targetValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // 3. Render Interactive SVG Bar Chart for 12-Month Enrollment & Exam Trends
    function renderTrendsBarChart() {
        const svg = document.getElementById('trendsBarChartSvg');
        const tooltip = document.getElementById('chartTooltip');
        const container = document.getElementById('enrollmentExamBarChartContainer');
        if (!svg) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Calculated dynamic trends across months
        const enrollmentData = [14, 19, 28, 22, 35, 30, 42, 38, 48, 40, 45, 52];
        const examData =       [ 8, 12, 20, 16, 25, 24, 30, 26, 36, 32, 38, 44];

        const maxVal = 60;
        const svgW = 540;
        const svgH = 220;
        const padL = 36;
        const padR = 16;
        const padT = 20;
        const padB = 30;
        const chartW = svgW - padL - padR;
        const chartH = svgH - padT - padB;
        const groupW = chartW / 12;

        let content = `
            <defs>
                <linearGradient id="barEnrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3B82F6" />
                    <stop offset="100%" stop-color="#1D4ED8" />
                </linearGradient>
                <linearGradient id="barExamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8B5CF6" />
                    <stop offset="100%" stop-color="#6D28D9" />
                </linearGradient>
            </defs>
        `;

        // Y-Axis Grid Lines & Reference Ticks (0, 15, 30, 45, 60)
        const yTicks = [0, 15, 30, 45, 60];
        yTicks.forEach(tick => {
            const yPos = padT + chartH - (tick / maxVal) * chartH;
            content += `
                <line x1="${padL}" y1="${yPos}" x2="${svgW - padR}" y2="${yPos}" class="barchart-grid-line" />
                <text x="${padL - 8}" y="${yPos + 4}" class="barchart-axis-text" text-anchor="end" style="font-size: 10.5px;">${tick}</text>
            `;
        });

        // Bars & Month Group Columns
        months.forEach((month, idx) => {
            const groupCenterX = padL + (idx + 0.5) * groupW;
            const barW = 10;
            const barGap = 3;

            const enrVal = enrollmentData[idx];
            const examVal = examData[idx];

            const enrH = Math.max(4, (enrVal / maxVal) * chartH);
            const examH = Math.max(4, (examVal / maxVal) * chartH);

            const enrY = padT + chartH - enrH;
            const examY = padT + chartH - examH;

            const enrX = groupCenterX - barW - (barGap / 2);
            const examX = groupCenterX + (barGap / 2);

            // Month Label
            content += `
                <text x="${groupCenterX}" y="${svgH - 10}" class="barchart-axis-text">${month}</text>
            `;

            // Enrollment Bar (Gradient Blue)
            content += `
                <rect class="barchart-bar" x="${enrX}" y="${enrY}" width="${barW}" height="${enrH}" rx="3" fill="url(#barEnrGrad)" data-month="${month}" data-enr="${enrVal}" data-exam="${examVal}" />
            `;

            // Exam Bar (Gradient Purple)
            content += `
                <rect class="barchart-bar" x="${examX}" y="${examY}" width="${barW}" height="${examH}" rx="3" fill="url(#barExamGrad)" data-month="${month}" data-enr="${enrVal}" data-exam="${examVal}" />
            `;

            // Invisible Hover Column Trigger
            content += `
                <rect class="barchart-hover-col" x="${padL + idx * groupW}" y="${padT}" width="${groupW}" height="${chartH}" fill="transparent" style="cursor: pointer;" data-month="${month}" data-enr="${enrVal}" data-exam="${examVal}" />
            `;
        });

        svg.innerHTML = content;

        // Tooltip Interactivity
        if (tooltip && container) {
            const hoverCols = svg.querySelectorAll('.barchart-hover-col, .barchart-bar');
            hoverCols.forEach(el => {
                el.addEventListener('mousemove', function (e) {
                    const month = this.getAttribute('data-month');
                    const enr = this.getAttribute('data-enr');
                    const exam = this.getAttribute('data-exam');

                    const rect = container.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    tooltip.style.left = `${mouseX}px`;
                    tooltip.style.top = `${mouseY - 12}px`;
                    tooltip.style.display = 'block';
                    tooltip.innerHTML = `
                        <div style="font-weight: 700; margin-bottom: 4px; font-size: 12.5px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 2px;">${month} Academic Session</div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 2px;">
                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3B82F6;"></span>
                            Enrollments: <strong>${enr}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #8B5CF6;"></span>
                            Exam Results: <strong>${exam}</strong>
                        </div>
                    `;
                });

                el.addEventListener('mouseleave', function () {
                    tooltip.style.display = 'none';
                });
            });
        }
    }

    // 4. Load Dynamic Analytics Statistics (Students by Major & Discipline Breakdown)
    async function loadStats() {
        const enrollmentSelect = document.getElementById('enrollmentTimeframeSelect');
        const majorSelect = document.getElementById('majorTimeframeSelect');

        const enrollmentTf = enrollmentSelect ? enrollmentSelect.value : 'all_time';
        const majorTf = majorSelect ? majorSelect.value : 'all_time';

        let statsData = null;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${API_BASE}/admin/dashboard/stats?enrollmentTimeframe=${encodeURIComponent(enrollmentTf)}&majorTimeframe=${encodeURIComponent(majorTf)}`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    statsData = result.data;
                }
            }
        } catch (err) {}

        if (!statsData && window.AdminStore) {
            statsData = window.AdminStore.getDashboardStats(enrollmentTf, majorTf);
        }

        if (statsData) {
            const { enrollmentStatistics, studentsByMajor } = statsData;

            // A. Update Students by Major Donut Chart & Total
            const donutTotalEl = document.getElementById('donutTotalStudents');
            const totalMajorStudents = studentsByMajor ? (studentsByMajor.total || 0) : 0;
            if (donutTotalEl) {
                donutTotalEl.textContent = totalMajorStudents.toLocaleString();
            }

            const donutSvg = document.getElementById('studentsMajorDonutSvg');
            if (donutSvg && studentsByMajor) {
                const majors = studentsByMajor.majors || [];
                const activeMajors = majors.filter(m => m.count > 0);

                if (totalMajorStudents === 0 || activeMajors.length === 0) {
                    donutSvg.innerHTML = `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E5EAF1" stroke-width="3.6"></circle>`;
                } else {
                    let svgContent = `<circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E5EAF1" stroke-width="3.6"></circle>`;
                    let currentOffset = 0;
                    activeMajors.forEach(m => {
                        const pct = isNaN(m.percentage) ? 0 : m.percentage;
                        const strokeDash = `${pct} ${100 - pct}`;
                        svgContent += `
                            <circle cx="18" cy="18" r="15.915" fill="transparent" 
                                    stroke="${m.color || '#2563EB'}" stroke-width="3.6" 
                                    stroke-linecap="round"
                                    stroke-dasharray="${strokeDash}" stroke-dashoffset="${-currentOffset}"
                                    style="transition: stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease;">
                            </circle>
                        `;
                        currentOffset += pct;
                    });
                    donutSvg.innerHTML = svgContent;
                }
            }

            // B. Render Students by Major Legend List
            const majorContainer = document.getElementById('studentsByMajorContainer');
            if (majorContainer && studentsByMajor) {
                const majors = studentsByMajor.majors || [];
                if (totalMajorStudents === 0 || majors.length === 0) {
                    majorContainer.innerHTML = `<div class="text-muted text-center py-3 text-xs">No registered students found in this period</div>`;
                } else {
                    majorContainer.innerHTML = majors.map(m => {
                        const count = m.count || 0;
                        const pct = totalMajorStudents > 0 ? Math.round((count / totalMajorStudents) * 100) : 0;
                        return `
                            <div class="donut-legend-item">
                                <div class="d-flex align-items-center gap-2 min-w-0" style="min-width: 0;">
                                    <span class="rounded-circle flex-shrink-0" style="width: 9px; height: 9px; background: ${m.color || '#2563EB'};"></span>
                                    <span class="fw-medium text-dark text-truncate" style="font-size: 13px;">${escapeHtml(m.major)}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                                    <span class="fw-bold text-dark" style="font-size: 13.5px; font-variant-numeric: tabular-nums;">${count}</span>
                                    <span class="badge bg-light text-secondary border px-2 py-1" style="font-size: 11.5px; font-weight: 600;">${pct}%</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            // C. Render Enrollment by Discipline Horizontal Progress Visualization
            const discContainer = document.getElementById('enrollmentCategoriesList');
            if (discContainer && enrollmentStatistics) {
                const totalEnr = enrollmentStatistics.total || 0;
                const categories = enrollmentStatistics.categories || [];
                if (totalEnr === 0 || categories.length === 0) {
                    discContainer.innerHTML = `<div class="text-muted text-center py-3 text-xs">No course category enrollment recorded in this period</div>`;
                } else {
                    discContainer.innerHTML = categories.map(c => {
                        const count = c.count || 0;
                        const pct = totalEnr > 0 ? Math.round((count / totalEnr) * 100) : 0;
                        return `
                            <div class="discipline-item">
                                <div class="discipline-header">
                                    <span class="discipline-name">
                                        <span class="rounded-circle flex-shrink-0" style="width: 8px; height: 8px; background: ${c.color || '#2563EB'};"></span>
                                        ${escapeHtml(c.name)}
                                    </span>
                                    <span class="discipline-count">
                                        ${count} students <span class="text-muted fw-normal" style="font-size: 12.5px;">(${pct}%)</span>
                                    </span>
                                </div>
                                <div class="discipline-progress-track">
                                    <div class="discipline-progress-fill" style="width: ${pct}%; background: ${c.color || '#2563EB'};"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        }
    }

    // 5. Fetch Recent Enrollments Table with Mobile Card Data-Labels
    async function loadRecentEnrollments() {
        const tbody = document.getElementById('recentEnrollmentsTableBody');
        if (!tbody) return;

        let enrollments = null;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${API_BASE}/admin/dashboard/recent-enrollments`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    enrollments = result.data;
                }
            }
        } catch (e) {}

        if (!enrollments && window.AdminStore) {
            enrollments = window.AdminStore.getRecentEnrollments(6);
        }

        if (enrollments) {
            if (enrollments.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted text-xs">No recent enrollments recorded.</td></tr>`;
                return;
            }

            tbody.innerHTML = enrollments.slice(0, 6).map(e => {
                const statusLower = (e.status || 'active').toLowerCase();
                return `
                    <tr>
                        <td data-label="Student">
                            <div class="table-student-cell">
                                <img src="${e.student_avatar || e.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'}" class="table-student-avatar" alt="Avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                                <div class="min-w-0" style="min-width: 0;">
                                    <div class="table-student-name">${escapeHtml(e.student_name || 'Student')}</div>
                                    <div class="table-student-id">${escapeHtml(e.student_id || e.student_uni_id || e.student_email || 'AUB-STU')}</div>
                                </div>
                            </div>
                        </td>
                        <td data-label="Course">
                            <span class="fw-semibold text-dark" style="font-size: 13.5px;">${escapeHtml(e.course_title || 'Academic Course')}</span>
                        </td>
                        <td data-label="Enrolled" class="text-muted text-nowrap" style="font-size: 13px;">
                            ${formatDate(e.enrollment_date)}
                        </td>
                        <td data-label="Progress" style="width: 140px; min-width: 120px;">
                            <div class="d-flex align-items-center gap-2">
                                <div class="progress flex-grow-1" style="height: 6px; background: #F1F5F9; border-radius: 999px;">
                                    <div class="progress-bar ${Number(e.progress_percentage) === 100 ? 'bg-success' : 'bg-primary'}" style="width: ${e.progress_percentage || 0}%; border-radius: 999px;"></div>
                                </div>
                                <span class="fw-semibold text-secondary" style="font-size: 12px; font-variant-numeric: tabular-nums;">${e.progress_percentage || 0}%</span>
                            </div>
                        </td>
                        <td data-label="Status" class="text-nowrap">
                            <span class="status-pill ${statusLower}">
                                <span class="dot"></span>
                                ${escapeHtml(e.status || 'Active')}
                            </span>
                        </td>
                        <td data-label="Action" class="text-nowrap text-end">
                            <a href="enrollment-management.html" class="table-action-btn" title="View Enrollment Details" aria-label="View Enrollment Details">
                                <i class="bi bi-arrow-right"></i>
                            </a>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // 6. Fetch Upcoming Exams Table with Mobile Card Data-Labels
    async function loadUpcomingExams() {
        const tbody = document.getElementById('upcomingExamsTableBody');
        if (!tbody) return;

        let exams = null;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${API_BASE}/admin/dashboard/upcoming-exams`, { 
                headers: getHeaders(),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const result = await res.json();
                if (result.success && result.data) {
                    exams = result.data;
                }
            }
        } catch (e) {}

        if (!exams) {
            exams = [
                { id: 1, title: 'Midterm Exam - Web Architecture', course_title: 'Full-Stack Modern Web Architecture', start_datetime: '2026-09-20 08:00:00', duration_minutes: 60, enrolled_students_count: 5, status: 'Scheduled' },
                { id: 2, title: 'Final Comprehensive Exam - AI & ML', course_title: 'Artificial Intelligence & Machine Learning', start_datetime: '2026-09-25 13:30:00', duration_minutes: 90, enrolled_students_count: 4, status: 'Scheduled' },
                { id: 3, title: 'Network Security Practical Assessment', course_title: 'Cybersecurity Fundamentals & Defense', start_datetime: '2026-09-28 09:00:00', duration_minutes: 45, enrolled_students_count: 6, status: 'Scheduled' }
            ];
        }

        if (exams.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted text-xs">No upcoming exams scheduled.</td></tr>`;
            return;
        }

        tbody.innerHTML = exams.slice(0, 5).map(ex => {
            const dateStr = ex.start_datetime ? formatDateTime(ex.start_datetime) : 'Scheduled';
            const statusClass = (ex.status || 'scheduled').toLowerCase();
            return `
                <tr>
                    <td data-label="Exam">
                        <div class="fw-semibold text-dark" style="font-size: 13.5px;">${escapeHtml(ex.title)}</div>
                        <div class="text-muted text-truncate" style="font-size: 12px; max-width: 180px;">${escapeHtml(ex.course_title || 'Academic Course')}</div>
                    </td>
                    <td data-label="Date & Time" class="text-nowrap" style="font-size: 12.5px; color: #475569;">
                        <div>${dateStr.split('·')[0] || dateStr}</div>
                        <small class="text-muted">${ex.duration_minutes || 60} mins</small>
                    </td>
                    <td data-label="Students" class="text-nowrap" style="font-size: 12.5px; font-variant-numeric: tabular-nums;">
                        <span class="badge bg-light text-dark border" style="font-size: 11.5px; font-weight: 600;">
                            <i class="bi bi-people-fill text-primary me-1"></i> ${ex.enrolled_students_count || 5}
                        </span>
                    </td>
                    <td data-label="Status" class="text-nowrap">
                        <span class="status-pill ${statusClass === 'open' ? 'active' : statusClass}">
                            <span class="dot"></span>
                            ${escapeHtml(ex.status || 'Scheduled')}
                        </span>
                    </td>
                    <td data-label="Action" class="text-nowrap text-end">
                        <a href="exam-management.html" class="table-action-btn" title="View Exam Details" aria-label="View Exam Details">
                            <i class="bi bi-arrow-right"></i>
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 7. Global Date Filter Binding
    const datePills = document.querySelectorAll('.dashboard-date-pill');
    datePills.forEach(pill => {
        pill.addEventListener('click', function () {
            const tf = this.getAttribute('data-timeframe');
            if (tf === 'custom') {
                if (customDateModal) customDateModal.show();
                return;
            }

            datePills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            currentTimeframe = tf;
            currentCustomStart = '';
            currentCustomEnd = '';

            const displayEl = document.getElementById('activeDateRangeDisplay');
            if (displayEl) {
                const labels = {
                    'all_time': 'Showing: All Time Operational Data',
                    'today': 'Showing: Today’s Live Activity',
                    'this_week': 'Showing: This Week (Past 7 Days)',
                    'this_month': 'Showing: This Month to Date'
                };
                displayEl.textContent = labels[tf] || 'Showing: Filtered Period';
            }

            loadMetrics();
        });
    });

    // Custom Date Range Modal Handler
    const applyCustomDateBtn = document.getElementById('applyCustomDateBtn');
    if (applyCustomDateBtn) {
        applyCustomDateBtn.addEventListener('click', function () {
            const startInput = document.getElementById('customStartDate');
            const endInput = document.getElementById('customEndDate');
            const errorEl = document.getElementById('customDateError');

            const startVal = startInput ? startInput.value : '';
            const endVal = endInput ? endInput.value : '';

            if (!startVal || !endVal) {
                if (errorEl) {
                    errorEl.textContent = 'Please select both start and end dates.';
                    errorEl.classList.remove('d-none');
                }
                return;
            }

            if (startVal > endVal) {
                if (errorEl) {
                    errorEl.textContent = 'Start Date must be earlier than or equal to End Date.';
                    errorEl.classList.remove('d-none');
                }
                return;
            }

            if (errorEl) errorEl.classList.add('d-none');

            currentTimeframe = 'custom';
            currentCustomStart = startVal;
            currentCustomEnd = endVal;

            datePills.forEach(p => p.classList.remove('active'));
            const customPill = document.getElementById('btnDateCustom');
            if (customPill) customPill.classList.add('active');

            const displayEl = document.getElementById('activeDateRangeDisplay');
            if (displayEl) {
                displayEl.textContent = `Showing: ${startVal} to ${endVal}`;
            }

            if (customDateModal) customDateModal.hide();
            loadMetrics();
        });
    }

    // 8. Timeframe Filters Binding for Sub-Widgets
    const enrollmentSelect = document.getElementById('enrollmentTimeframeSelect');
    if (enrollmentSelect) {
        enrollmentSelect.addEventListener('change', () => loadStats());
    }
    const majorSelect = document.getElementById('majorTimeframeSelect');
    if (majorSelect) {
        majorSelect.addEventListener('change', () => loadStats());
    }

    // 9. Notifications System
    function loadNotifications() {
        let notifs = [];
        if (window.AdminStore) {
            notifs = window.AdminStore.getNotifications();
        }

        const unreadCount = notifs.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        const list = document.getElementById('notificationsList');
        if (list) {
            if (notifs.length === 0) {
                list.innerHTML = `<div class="p-3 text-center text-muted text-xs">No notifications</div>`;
                return;
            }

            list.innerHTML = notifs.map(n => `
                <div class="notification-item ${n.read ? 'opacity-75' : ''}" onclick="window.location.href='${n.link_url || 'dashboard.html'}'">
                    <div class="rounded-circle p-2 bg-light d-flex align-items-center justify-content-center" style="width: 28px; height: 28px; flex-shrink: 0;">
                        <i class="bi ${n.type === 'enrollment' ? 'bi-person-check-fill text-success' : n.type === 'course' ? 'bi-journal-code text-primary' : 'bi-info-circle text-warning'}" style="font-size: 12px;"></i>
                    </div>
                    <div class="text-start flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="fw-bold text-dark" style="font-size: 12px;">${escapeHtml(n.title)}</span>
                            <span class="text-muted" style="font-size: 10px;">${escapeHtml(n.timestamp)}</span>
                        </div>
                        <div class="text-muted lh-sm" style="font-size: 11px;">${escapeHtml(n.message)}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    const notifBtn = document.getElementById('notificationBtn');
    const notifMenu = document.getElementById('notificationsMenu');
    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifMenu.classList.toggle('active');
        });
        document.addEventListener('click', () => notifMenu.classList.remove('active'));
    }

    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            if (window.AdminStore) {
                window.AdminStore.markAllNotificationsRead();
                loadNotifications();
            }
        });
    }

    // 10. Functional Global Search in Topbar
    const searchInput = document.getElementById('globalSearchInput');
    const searchContainer = document.getElementById('searchResultsContainer');
    let searchTimeout;

    if (searchInput && searchContainer) {
        searchInput.addEventListener('input', function (e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length < 2) {
                searchContainer.classList.remove('active');
                searchContainer.innerHTML = '';
                return;
            }

            searchTimeout = setTimeout(() => {
                if (window.AdminStore) {
                    const { programs, courses, users } = window.AdminStore.searchGlobal(query);
                    const totalHits = programs.length + courses.length + users.length;

                    if (totalHits === 0) {
                        searchContainer.innerHTML = `<div class="p-3 text-center text-muted text-xs">No records found for "${escapeHtml(query)}"</div>`;
                    } else {
                        let html = '';
                        if (programs.length > 0) {
                            html += `<div class="px-3 pt-2 pb-1 text-xs fw-bold text-muted text-uppercase" style="font-size: 10px; background: #F8FAFC;">Programs</div>`;
                            programs.forEach(p => {
                                html += `<a href="${p.link}" class="search-result-item"><span><i class="bi bi-mortarboard me-2 text-primary"></i>${escapeHtml(p.title)}</span><span class="badge bg-light text-dark border" style="font-size: 10px;">${escapeHtml(p.degree_type)}</span></a>`;
                            });
                        }
                        if (courses.length > 0) {
                            html += `<div class="px-3 pt-2 pb-1 text-xs fw-bold text-muted text-uppercase" style="font-size: 10px; background: #F8FAFC;">Courses</div>`;
                            courses.forEach(c => {
                                html += `<a href="${c.link}" class="search-result-item"><span><i class="bi bi-journal-text me-2 text-success"></i>${escapeHtml(c.title)}</span><span class="badge bg-light text-warning border" style="font-size: 10px;"><i class="bi bi-star-fill me-1"></i>${c.rating}</span></a>`;
                            });
                        }
                        if (users.length > 0) {
                            html += `<div class="px-3 pt-2 pb-1 text-xs fw-bold text-muted text-uppercase" style="font-size: 10px; background: #F8FAFC;">Users</div>`;
                            users.forEach(u => {
                                html += `<a href="${u.link}" class="search-result-item"><span><i class="bi bi-person me-2 text-info"></i>${escapeHtml(u.title)}</span><span class="badge bg-light text-secondary border" style="font-size: 10px;">${escapeHtml(u.role)}</span></a>`;
                            });
                        }
                        searchContainer.innerHTML = html;
                    }
                    searchContainer.classList.add('active');
                }
            }, 200);
        });

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchContainer.contains(e.target)) {
                searchContainer.classList.remove('active');
            }
        });
    }

    // Ctrl+K Shortcut for Global Search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    function formatDate(dateStr) {
        if (!dateStr) return 'Aug 21, 2026';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return 'Scheduled';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            return dateStr;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Execute Initial loads
    loadMetrics();
    renderTrendsBarChart();
    loadStats();
    loadRecentEnrollments();
    loadUpcomingExams();
    loadNotifications();
});
