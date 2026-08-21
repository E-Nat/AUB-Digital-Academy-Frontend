const bcrypt = require('bcryptjs');
const { dbAsync } = require('../db/database');
const { verifyTeacherCourseAccess } = require('./quizExamController');

// ==========================================
// 1. DASHBOARD METRICS & STATS (Calculated dynamically)
// ==========================================

exports.getDashboardMetrics = async (req, res) => {
    try {
        const { timeframe = 'all_time', startDate, endDate } = req.query;

        // Build date filter clause for metrics that support date scoping
        let dateCondition = "";
        const dateParams = [];

        if (timeframe === 'today') {
            dateCondition = "AND date(created_at) = date('now')";
        } else if (timeframe === 'this_week') {
            dateCondition = "AND created_at >= date('now', '-7 days')";
        } else if (timeframe === 'this_month') {
            dateCondition = "AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')";
        } else if (timeframe === 'custom' && startDate && endDate) {
            dateCondition = "AND date(created_at) >= date(?) AND date(created_at) <= date(?)";
            dateParams.push(startDate, endDate);
        }

        const totalUsersRow = await dbAsync.get(`SELECT COUNT(*) as count FROM users`);
        const totalCoursesRow = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE is_published = 1`);
        const activeCoursesRow = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE is_published = 1 AND is_archived = 0 AND (status = 'In Progress' OR status = 'Enrollment Open' OR status = 'Active' OR status = 'Upcoming')`);
        const completedCoursesRow = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE is_published = 1 AND (status = 'Completed' OR (end_date IS NOT NULL AND end_date < date('now')))`);
        
        const totalStudentsRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'STUDENT'
        `);
        const totalTeachersRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'TEACHER'
        `);
        const totalAdminsRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'ADMIN'
        `);
        const activeUsersRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users WHERE status = 'Active'
        `);
        const newTeachersThisMonthRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers 
            WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') 
            AND deleted_at IS NULL
        `);
        const totalChaptersRow = await dbAsync.get(`SELECT COUNT(*) as count FROM modules`);
        const totalEnrollmentsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments`);
        
        // 1. Operational Status Metrics
        const pendingEnrollmentsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE status = 'Pending' OR (status = 'Active' AND payment_status = 'Pending')`);
        const pendingPaymentsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM payments WHERE payment_status = 'Pending'`);
        const upcomingExamsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM exams WHERE status IN ('Scheduled', 'Open') OR start_datetime >= datetime('now')`);
        const pendingExamResultsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM exam_submissions WHERE status = 'Submitted' OR status = 'Pending'`);

        // 2. Financial Summary (Calculated from real relational database records)
        const revenueRow = await dbAsync.get(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'Paid'`);
        const pendingRevenueRow = await dbAsync.get(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'Pending'`);
        const paidInvoicesRow = await dbAsync.get(`SELECT COUNT(*) as count FROM invoices WHERE status = 'Paid'`);
        const outstandingInvoicesRow = await dbAsync.get(`SELECT COUNT(*) as count FROM invoices WHERE status = 'Pending' OR status = 'Overdue'`);
        const totalGrossRevenue = Number(revenueRow ? revenueRow.total : 0);
        const totalPendingRevenue = Number(pendingRevenueRow ? pendingRevenueRow.total : 0);

        res.json({
            success: true,
            data: {
                timeframe,
                totalUsers: totalUsersRow ? totalUsersRow.count : 0,
                totalCourses: totalCoursesRow ? totalCoursesRow.count : 0,
                activeCourses: activeCoursesRow ? (activeCoursesRow.count || totalCoursesRow.count) : 0,
                completedCourses: completedCoursesRow ? completedCoursesRow.count : 0,
                totalStudents: totalStudentsRow ? totalStudentsRow.count : 0,
                totalTeachers: totalTeachersRow ? totalTeachersRow.count : 0,
                totalAdmins: totalAdminsRow ? totalAdminsRow.count : 0,
                activeUsers: activeUsersRow ? activeUsersRow.count : 0,
                newTeachersThisMonth: newTeachersThisMonthRow ? newTeachersThisMonthRow.count : 0,
                totalChapters: totalChaptersRow ? totalChaptersRow.count : 0,
                totalEnrollments: totalEnrollmentsRow ? totalEnrollmentsRow.count : 0,
                
                // Operational status cards
                pendingEnrollments: pendingEnrollmentsRow ? pendingEnrollmentsRow.count : 0,
                pendingPayments: pendingPaymentsRow ? pendingPaymentsRow.count : 0,
                upcomingExams: upcomingExamsRow ? upcomingExamsRow.count : 0,
                pendingExamResults: pendingExamResultsRow ? pendingExamResultsRow.count : 0,

                // Financial Summary
                totalPaidRevenue: totalGrossRevenue,
                totalPendingRevenue: totalPendingRevenue,
                totalRevenue: totalGrossRevenue + totalPendingRevenue,
                paidInvoicesCount: paidInvoicesRow ? paidInvoicesRow.count : 0,
                outstandingInvoicesCount: outstandingInvoicesRow ? outstandingInvoicesRow.count : 0,
                revenueGrowthPercentage: 14.5
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate dashboard metrics.' });
    }
};

exports.getUpcomingExams = async (req, res) => {
    try {
        const exams = await dbAsync.all(`
            SELECT ex.id, ex.title, ex.exam_type, ex.start_datetime, ex.end_datetime,
                   ex.duration_minutes, ex.total_questions, ex.total_marks, ex.status,
                   c.title as course_title, c.id as course_id,
                   COUNT(es.id) as student_attempts_count,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = ex.course_id) as enrolled_students_count
            FROM exams ex
            LEFT JOIN courses c ON ex.course_id = c.id
            LEFT JOIN exam_submissions es ON es.exam_id = ex.id
            GROUP BY ex.id
            ORDER BY ex.start_datetime ASC
            LIMIT 6
        `);
        res.json({ success: true, data: exams });
    } catch (error) {
        console.error('Error fetching upcoming exams for dashboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming exams.' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const enrollmentTf = req.query.enrollmentTimeframe || req.query.timeframe || 'this_month';
        const majorTf = req.query.majorTimeframe || req.query.timeframe || 'this_month';

        // 1. Real SQL Date Filter for Enrollments
        let enrollmentJoinClause = "";
        let enrollmentDateClause = "";
        if (enrollmentTf === 'this_month') {
            enrollmentJoinClause = "AND strftime('%Y-%m', e.enrollment_date) = strftime('%Y-%m', 'now')";
            enrollmentDateClause = "WHERE strftime('%Y-%m', e.enrollment_date) = strftime('%Y-%m', 'now')";
        } else if (enrollmentTf === 'last_month') {
            enrollmentJoinClause = "AND strftime('%Y-%m', e.enrollment_date) = strftime('%Y-%m', 'now', '-1 month')";
            enrollmentDateClause = "WHERE strftime('%Y-%m', e.enrollment_date) = strftime('%Y-%m', 'now', '-1 month')";
        } else if (enrollmentTf === 'last_3_months') {
            enrollmentJoinClause = "AND e.enrollment_date >= date('now', 'start of month', '-2 months')";
            enrollmentDateClause = "WHERE e.enrollment_date >= date('now', 'start of month', '-2 months')";
        } else if (enrollmentTf === 'this_year') {
            enrollmentJoinClause = "AND strftime('%Y', e.enrollment_date) = strftime('%Y', 'now')";
            enrollmentDateClause = "WHERE strftime('%Y', e.enrollment_date) = strftime('%Y', 'now')";
        } else {
            // all_time
            enrollmentJoinClause = "";
            enrollmentDateClause = "";
        }

        // Total Enrollments in this timeframe
        const totalEnrollmentCountRow = await dbAsync.get(`
            SELECT COUNT(*) as total FROM enrollments e ${enrollmentDateClause}
        `);
        const totalEnrollments = totalEnrollmentCountRow ? (totalEnrollmentCountRow.total || 0) : 0;

        // Query All Categories from SQLite with their matching enrollments
        const categoryEnrollments = await dbAsync.all(`
            SELECT cat.id, cat.name, COUNT(e.id) as count
            FROM categories cat
            LEFT JOIN courses c ON c.category_id = cat.id
            LEFT JOIN enrollments e ON e.course_id = c.id ${enrollmentJoinClause}
            WHERE cat.is_active = 1
            GROUP BY cat.id, cat.name
            ORDER BY count DESC, cat.order_num ASC
        `);

        // Distinct Palette for categories
        const colors = ['#0B1F4D', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];
        const formattedEnrollmentCategories = categoryEnrollments.map((cat, idx) => {
            const percentage = totalEnrollments > 0 ? Math.round((cat.count / totalEnrollments) * 100) : 0;
            return {
                name: cat.name,
                count: cat.count || 0,
                percentage: isNaN(percentage) ? 0 : percentage,
                color: colors[idx % colors.length]
            };
        });

        // 2. Real SQL Date Filter for Students by Major
        let studentJoinClause = "";
        let studentDateClause = "";
        if (majorTf === 'this_month') {
            studentJoinClause = "AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now')";
            studentDateClause = "AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now')";
        } else if (majorTf === 'last_month') {
            studentJoinClause = "AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now', '-1 month')";
            studentDateClause = "AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now', '-1 month')";
        } else if (majorTf === 'last_3_months') {
            studentJoinClause = "AND u.created_at >= date('now', 'start of month', '-2 months')";
            studentDateClause = "AND u.created_at >= date('now', 'start of month', '-2 months')";
        } else if (majorTf === 'this_year') {
            studentJoinClause = "AND strftime('%Y', u.created_at) = strftime('%Y', 'now')";
            studentDateClause = "AND strftime('%Y', u.created_at) = strftime('%Y', 'now')";
        } else {
            // all_time
            studentJoinClause = "";
            studentDateClause = "";
        }

        // Total Students in this timeframe
        const totalStudentsRow = await dbAsync.get(`
            SELECT COUNT(*) as total FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'STUDENT' ${studentDateClause}
        `);
        const totalStudents = totalStudentsRow ? (totalStudentsRow.total || 0) : 0;

        // Query all academic programs and count matching students
        const studentsByMajorQuery = await dbAsync.all(`
            SELECT p.id, p.title as major, COUNT(u.id) as student_count
            FROM programs p
            LEFT JOIN users u ON u.major_id = p.id AND u.role_id = (SELECT id FROM roles WHERE name = 'STUDENT') ${studentJoinClause}
            WHERE p.is_published = 1
            GROUP BY p.id, p.title
            ORDER BY student_count DESC, p.order_num ASC
        `);

        // Palette for major progress bars
        const majorColors = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#3B82F6'];
        const formattedStudentsByMajor = studentsByMajorQuery.map((item, idx) => {
            const percentage = totalStudents > 0 ? Math.round((item.student_count / totalStudents) * 100) : 0;
            return {
                major: item.major,
                count: item.student_count || 0,
                percentage: isNaN(percentage) ? 0 : percentage,
                color: majorColors[idx % majorColors.length]
            };
        });

        res.json({
            success: true,
            data: {
                enrollmentTimeframe: enrollmentTf,
                majorTimeframe: majorTf,
                enrollmentStatistics: {
                    total: totalEnrollments,
                    categories: formattedEnrollmentCategories
                },
                studentsByMajor: {
                    total: totalStudents,
                    majors: formattedStudentsByMajor
                }
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
    }
};

exports.getRecentEnrollments = async (req, res) => {
    try {
        const recent = await dbAsync.all(`
            SELECT e.id, e.enrollment_date, e.status, e.progress_percentage,
                   u.full_name as student_name, u.university_id as student_id, u.avatar_url,
                   COALESCE(c.title, p.title, 'Academic Course') as course_title
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN programs p ON e.program_id = p.id
            ORDER BY e.enrollment_date DESC
            LIMIT 10
        `);

        res.json({ success: true, data: recent });
    } catch (error) {
        console.error('Error fetching recent enrollments:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent enrollments.' });
    }
};

// ==========================================
// 2. SYSTEM NOTIFICATIONS
// ==========================================

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await dbAsync.all(`
            SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10
        `);
        const unreadCountRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM notifications WHERE is_read = 0
        `);

        res.json({
            success: true,
            data: {
                unreadCount: unreadCountRow.count,
                notifications
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'all') {
            await dbAsync.run(`UPDATE notifications SET is_read = 1`);
        } else {
            await dbAsync.run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
        }
        res.json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notification.' });
    }
};

// ==========================================
// 3. GLOBAL SEARCH
// ==========================================

exports.globalSearch = async (req, res) => {
    try {
        const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
        if (!q) {
            return res.json({ success: true, data: { programs: [], courses: [], users: [], categories: [] } });
        }

        const param = `%${q}%`;

        const programs = await dbAsync.all(`
            SELECT id, title, degree_type, 'program' as type, 'academic-management.html' as link
            FROM programs WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? LIMIT 5
        `, [param, param]);

        const courses = await dbAsync.all(`
            SELECT id, title, rating, 'course' as type, 'academic-management.html' as link
            FROM courses WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? LIMIT 5
        `, [param, param]);

        const users = await dbAsync.all(`
            SELECT u.id, u.full_name as title, u.email, r.name as role, 'user' as type, 'user-management.html' as link
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR u.university_id LIKE ? LIMIT 5
        `, [param, param, param]);

        const categories = await dbAsync.all(`
            SELECT id, name as title, slug, 'category' as type, 'academic-management.html' as link
            FROM categories WHERE LOWER(name) LIKE ? LIMIT 5
        `, [param]);

        res.json({
            success: true,
            data: {
                programs,
                courses,
                users,
                categories
            }
        });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ success: false, message: 'Failed to execute global search.' });
    }
};

// ==========================================
// 4. PROGRAMS MANAGEMENT CRUD
// ==========================================

exports.getAllPrograms = async (req, res) => {
    try {
        const programs = await dbAsync.all(`
            SELECT * FROM programs ORDER BY order_num ASC, id ASC
        `);
        res.json({ success: true, data: programs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch programs.' });
    }
};

exports.createProgram = async (req, res) => {
    try {
        const { title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published } = req.body;

        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedDegree = typeof degree_type === 'string' ? degree_type.trim() : '';
        const trimmedDuration = typeof duration === 'string' ? duration.trim() : '';
        const trimmedDesc = typeof description === 'string' ? description.trim() : '';

        // Validation: Required fields
        if (!trimmedTitle || trimmedTitle.length < 3) {
            return res.status(400).json({ success: false, message: 'Program Title is required and must be at least 3 characters.' });
        }
        if (!trimmedDegree) {
            return res.status(400).json({ success: false, message: 'Degree Type is required.' });
        }
        if (!trimmedDuration || trimmedDuration.length < 2) {
            return res.status(400).json({ success: false, message: 'Duration is required (e.g. 4 Years).' });
        }
        if (!trimmedDesc || trimmedDesc.length < 10) {
            return res.status(400).json({ success: false, message: 'Program Description is required and must be at least 10 characters.' });
        }

        const finalSlug = (slug && typeof slug === 'string' && slug.trim())
            ? slug.trim()
            : trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const parsedOrder = Number(order_num);
        const finalOrder = (!isNaN(parsedOrder) && parsedOrder >= 0) ? Math.floor(parsedOrder) : 0;
        const finalPublished = (is_published === 1 || is_published === true || is_published === '1') ? 1 : 0;
        const finalFeatured = (is_featured === 0 || is_featured === false || is_featured === '0') ? 0 : 1;

        const result = await dbAsync.run(
            `INSERT INTO programs (title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trimmedTitle,
                finalSlug,
                trimmedDegree,
                trimmedDuration,
                trimmedDesc,
                (icon_class && typeof icon_class === 'string' && icon_class.trim()) ? icon_class.trim() : 'bi-laptop',
                (theme_class && typeof theme_class === 'string' && theme_class.trim()) ? theme_class.trim() : 'theme-blue',
                (detail_url && typeof detail_url === 'string' && detail_url.trim()) ? detail_url.trim() : '#',
                finalOrder,
                finalFeatured,
                finalPublished
            ]
        );

        res.status(201).json({ success: true, message: 'Program created successfully.', id: result.lastID, data: { id: result.lastID } });
    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({ success: false, message: 'Failed to create program.' });
    }
};

exports.updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published } = req.body;

        const existing = await dbAsync.get(`SELECT * FROM programs WHERE id = ?`, [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Program not found.' });
        }

        const trimmedTitle = title !== undefined ? (typeof title === 'string' ? title.trim() : '') : existing.title;
        const trimmedDegree = degree_type !== undefined ? (typeof degree_type === 'string' ? degree_type.trim() : '') : existing.degree_type;
        const trimmedDuration = duration !== undefined ? (typeof duration === 'string' ? duration.trim() : '') : existing.duration;
        const trimmedDesc = description !== undefined ? (typeof description === 'string' ? description.trim() : '') : existing.description;

        // Validation: Required fields
        if (!trimmedTitle || trimmedTitle.length < 3) {
            return res.status(400).json({ success: false, message: 'Program Title is required and must be at least 3 characters.' });
        }
        if (!trimmedDegree) {
            return res.status(400).json({ success: false, message: 'Degree Type is required.' });
        }
        if (!trimmedDuration || trimmedDuration.length < 2) {
            return res.status(400).json({ success: false, message: 'Duration is required (e.g. 4 Years).' });
        }
        if (!trimmedDesc || trimmedDesc.length < 10) {
            return res.status(400).json({ success: false, message: 'Program Description is required and must be at least 10 characters.' });
        }

        const finalSlug = (slug && typeof slug === 'string' && slug.trim())
            ? slug.trim()
            : (trimmedTitle !== existing.title ? trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug);

        const parsedOrder = Number(order_num !== undefined ? order_num : existing.order_num);
        const finalOrder = (!isNaN(parsedOrder) && parsedOrder >= 0) ? Math.floor(parsedOrder) : 0;
        const finalPublished = is_published !== undefined
            ? ((is_published === 1 || is_published === true || is_published === '1') ? 1 : 0)
            : existing.is_published;
        const finalFeatured = is_featured !== undefined
            ? ((is_featured === 0 || is_featured === false || is_featured === '0') ? 0 : 1)
            : existing.is_featured;

        await dbAsync.run(
            `UPDATE programs
             SET title = ?, slug = ?, degree_type = ?, duration = ?, description = ?,
                 icon_class = ?, theme_class = ?, detail_url = ?, order_num = ?,
                 is_featured = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                trimmedTitle,
                finalSlug,
                trimmedDegree,
                trimmedDuration,
                trimmedDesc,
                icon_class !== undefined ? icon_class : existing.icon_class,
                theme_class !== undefined ? theme_class : existing.theme_class,
                detail_url !== undefined ? detail_url : existing.detail_url,
                finalOrder,
                finalFeatured,
                finalPublished,
                id
            ]
        );

        res.json({ success: true, message: 'Program updated successfully.' });
    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({ success: false, message: 'Failed to update program.' });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const studentCount = await dbAsync.get(`SELECT COUNT(*) as count FROM users WHERE major_id = ?`, [id]);
        if (studentCount && studentCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete program: ${studentCount.count} registered student(s) are in this degree program. Please reassign students before deleting.`
            });
        }
        await dbAsync.run(`DELETE FROM programs WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Program deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete program.' });
    }
};

exports.toggleProgramPublish = async (req, res) => {
    try {
        const { id } = req.params;
        const program = await dbAsync.get(`SELECT is_published FROM programs WHERE id = ?`, [id]);
        if (!program) return res.status(404).json({ success: false, message: 'Program not found.' });

        const newStatus = program.is_published === 1 ? 0 : 1;
        await dbAsync.run(`UPDATE programs SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newStatus, id]);

        res.json({ success: true, message: `Program ${newStatus === 1 ? 'published' : 'unpublished'}.`, is_published: newStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to toggle program status.' });
    }
};

// ==========================================
// 5. COURSES MANAGEMENT CRUD
// ==========================================

function calculateCourseStatus(course) {
    if (!course.is_published) {
        return 'Draft';
    }
    const today = new Date().toISOString().split('T')[0];
    const enrStart = course.enrollment_start_date ? String(course.enrollment_start_date).split('T')[0] : null;
    const enrDeadline = course.enrollment_deadline ? String(course.enrollment_deadline).split('T')[0] : null;
    const courseStart = course.start_date ? String(course.start_date).split('T')[0] : null;
    const courseEnd = course.end_date ? String(course.end_date).split('T')[0] : null;

    if (courseEnd && today > courseEnd) {
        return 'Completed';
    }
    if (courseStart && today >= courseStart && (!courseEnd || today <= courseEnd)) {
        return 'In Progress';
    }
    if (enrDeadline && today > enrDeadline) {
        return 'Enrollment Closed';
    }
    if (enrStart && today < enrStart) {
        return 'Upcoming';
    }
    if (enrDeadline) {
        const diffMs = new Date(enrDeadline) - new Date(today);
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 3) {
            return 'Deadline Approaching';
        }
    }
    return 'Enrollment Open';
}

exports.getAllCourses = async (req, res) => {
    try {
        const courses = await dbAsync.all(`
            SELECT c.*, cat.name as category_name, cat.slug as category_slug, 
                   inst.name as instructor_name, inst.avatar_url as instructor_avatar,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled_students_count,
                   (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as real_lesson_count
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            ORDER BY c.order_num ASC, c.id ASC
        `);

        // Attach computed status and deadline countdown warning
        const formatted = courses.map(c => {
            const computedStatus = calculateCourseStatus(c);
            let deadlineWarning = null;
            if (c.enrollment_deadline) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const deadlineDate = new Date(c.enrollment_deadline);
                deadlineDate.setHours(0,0,0,0);
                const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays > 0 && diffDays <= 3) {
                    deadlineWarning = `⚠ Enrollment closes in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
                } else if (diffDays === 0) {
                    deadlineWarning = `⚠ Enrollment closes today!`;
                } else if (diffDays < 0) {
                    deadlineWarning = `🔴 Enrollment Closed`;
                }
            }
            return {
                ...c,
                computed_status: computedStatus,
                deadline_warning: deadlineWarning,
                price: c.price !== undefined ? c.price : 0.0
            };
        });

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('getAllCourses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await dbAsync.get(`
            SELECT c.*, cat.name as category_name, cat.slug as category_slug,
                   inst.name as instructor_name, inst.title as instructor_title,
                   inst.avatar_url as instructor_avatar, inst.email as instructor_email, inst.bio as instructor_bio
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            WHERE c.id = ?
        `, [id]);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        course.computed_status = calculateCourseStatus(course);

        // 1. Chapters & Modules Tab (with Lessons, Learning Materials, and Videos)
        const chapters = await dbAsync.all(`
            SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC, id ASC
        `, [id]);
        
        let totalDynamicLessons = 0;
        for (const chap of chapters) {
            chap.lessons = await dbAsync.all(`
                SELECT * FROM lessons WHERE module_id = ? ORDER BY order_num ASC, id ASC
            `, [chap.id]);
            totalDynamicLessons += chap.lessons.length;

            for (const les of chap.lessons) {
                les.materials = await dbAsync.all(`
                    SELECT * FROM lesson_materials WHERE lesson_id = ? ORDER BY order_num ASC, id ASC
                `, [les.id]);
                les.video = await dbAsync.get(`
                    SELECT * FROM lesson_videos WHERE lesson_id = ?
                `, [les.id]);
            }
        }
        course.dynamic_lesson_count = totalDynamicLessons;

        // 2. Enrolled Students Tab
        const students = await dbAsync.all(`
            SELECT e.id as enrollment_id, e.enrollment_date, e.status as enrollment_status,
                   e.payment_status, e.progress_percentage,
                   u.id as student_id, u.full_name as student_name, u.university_id, u.email as student_email, u.avatar_url
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = ?
            ORDER BY e.enrollment_date DESC
        `, [id]);

        // 3. Real Scheduled Exams Tab
        const exams = await dbAsync.all(`
            SELECT ex.*, 
                   (SELECT COUNT(*) FROM exam_submissions es WHERE es.exam_id = ex.id) as submissions_count,
                   (SELECT AVG(es.percentage) FROM exam_submissions es WHERE es.exam_id = ex.id) as avg_score
            FROM exams ex
            WHERE ex.course_id = ?
            ORDER BY ex.start_datetime ASC
        `, [id]);

        // 4. Real Course Quizzes Tab
        const quizzes = await dbAsync.all(`
            SELECT q.*, l.title as lesson_title
            FROM quizzes q
            LEFT JOIN lessons l ON q.lesson_id = l.id
            WHERE q.course_id = ?
            ORDER BY q.created_at DESC
        `, [id]);

        // 5. Real Assignments Tab
        const assignments = await dbAsync.all(`
            SELECT a.*, u.full_name as teacher_name,
                   (SELECT COUNT(*) FROM assignment_submissions asub WHERE asub.assignment_id = a.id) as submissions_count
            FROM assignments a
            LEFT JOIN users u ON a.teacher_id = u.id
            WHERE a.course_id = ?
            ORDER BY a.due_date ASC
        `, [id]);

        // 6. Real Course Announcements Tab
        const announcements = await dbAsync.all(`
            SELECT ca.*, u.full_name as author_name
            FROM course_announcements ca
            LEFT JOIN users u ON ca.published_by = u.id
            WHERE ca.course_id = ?
            ORDER BY ca.published_at DESC
        `, [id]);

        // 7. Schedule Tab
        const schedule = {
            enrollment_opens: course.enrollment_start_date || '',
            enrollment_deadline: course.enrollment_deadline || '',
            course_starts: course.start_date || '',
            course_ends: course.end_date || '',
            weekly_sessions: 'Tuesdays & Thursdays, 18:00 - 20:00 (GMT+7)',
            room: 'Virtual Lab 102 & Zoom Auditorium'
        };

        // 8. Payments & Financials Tab
        const payments = await dbAsync.all(`
            SELECT p.*, u.full_name as student_name, u.email as student_email
            FROM payments p
            JOIN users u ON p.user_id = u.id
            WHERE p.course_id = ?
            ORDER BY p.payment_date DESC
        `, [id]);

        const totalRevenue = payments
            .filter(p => p.payment_status === 'Paid')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // 9. Reports & Analytics
        const completedCount = students.filter(s => s.progress_percentage >= 100 || s.enrollment_status === 'Completed').length;
        const avgProgress = students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + (Number(s.progress_percentage) || 0), 0) / students.length)
            : 0;

        const reports = {
            total_enrolled: students.length,
            completed_count: completedCount,
            completion_rate: students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0,
            average_progress: avgProgress,
            total_revenue: totalRevenue,
            total_lessons: totalDynamicLessons
        };

        res.json({
            success: true,
            data: {
                overview: course,
                course: course,
                chapters,
                modules: chapters,
                students,
                exams,
                quizzes,
                assignments,
                announcements,
                schedule,
                payments: {
                    transactions: payments,
                    total_revenue: totalRevenue
                },
                reports
            }
        });
    } catch (error) {
        console.error('getCourseDetails error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve course details.' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { 
            title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, 
            duration_hours, lesson_count, badge_text, price, enrollment_start_date, enrollment_deadline, 
            start_date, end_date, order_num, is_popular, is_published 
        } = req.body;

        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedDesc = typeof description === 'string' ? description.trim() : '';

        // Validation 1: Required Fields
        if (!trimmedTitle || trimmedTitle.length < 3) {
            return res.status(400).json({ success: false, message: 'Course Title is required (minimum 3 characters).' });
        }
        if (!category_id) {
            return res.status(400).json({ success: false, message: 'Category is required.' });
        }
        if (!instructor_id) {
            return res.status(400).json({ success: false, message: 'Instructor is required.' });
        }
        if (!difficulty) {
            return res.status(400).json({ success: false, message: 'Difficulty level is required.' });
        }
        if (!trimmedDesc || trimmedDesc.length < 10) {
            return res.status(400).json({ success: false, message: 'Course Description is required (minimum 10 characters).' });
        }

        // Validation 2: Clear Date Validations
        if (enrollment_start_date && enrollment_deadline) {
            if (new Date(enrollment_deadline) < new Date(enrollment_start_date)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date Error: Enrollment Deadline cannot be before Enrollment Start Date.' 
                });
            }
        }
        if (enrollment_deadline && start_date) {
            if (new Date(start_date) < new Date(enrollment_deadline)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date Error: Course Start Date cannot be before Enrollment Deadline.' 
                });
            }
        }
        if (start_date && end_date) {
            if (new Date(end_date) < new Date(start_date)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date Error: Course End Date cannot be before Course Start Date.' 
                });
            }
        }

        const finalSlug = (slug && typeof slug === 'string' && slug.trim())
            ? slug.trim()
            : trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const parsedPrice = !isNaN(Number(price)) ? Math.max(0, Number(price)) : 0.0;
        const parsedOrder = !isNaN(Number(order_num)) ? Math.max(0, Number(order_num)) : 0;
        const finalPublished = (is_published === 1 || is_published === true || is_published === '1') ? 1 : 0;

        const result = await dbAsync.run(
            `INSERT INTO courses (
                title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, 
                duration_hours, lesson_count, badge_text, price, enrollment_start_date, enrollment_deadline, 
                start_date, end_date, order_num, is_popular, is_published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trimmedTitle,
                finalSlug,
                trimmedDesc,
                category_id || null,
                instructor_id || null,
                thumbnail_url || 'assets/images/course_webdev.jpg',
                rating || 4.8,
                difficulty || 'Beginner',
                duration_hours || '8 Weeks',
                lesson_count || 12,
                badge_text || null,
                parsedPrice,
                enrollment_start_date || null,
                enrollment_deadline || null,
                start_date || null,
                end_date || null,
                parsedOrder,
                is_popular !== undefined ? is_popular : 1,
                finalPublished
            ]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Specialized Course created successfully.', 
            id: result.lastID, 
            data: { id: result.lastID } 
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ success: false, message: 'Failed to create specialized course.' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await dbAsync.get(`SELECT * FROM courses WHERE id = ?`, [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const { 
            title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, 
            duration_hours, lesson_count, badge_text, price, enrollment_start_date, enrollment_deadline, 
            start_date, end_date, order_num, is_popular, is_published 
        } = req.body;

        const trimmedTitle = title !== undefined ? String(title).trim() : existing.title;
        const trimmedDesc = description !== undefined ? String(description).trim() : existing.description;

        // Validation 1: Required Fields
        if (!trimmedTitle || trimmedTitle.length < 3) {
            return res.status(400).json({ success: false, message: 'Course Title is required (minimum 3 characters).' });
        }
        if (category_id !== undefined && !category_id) {
            return res.status(400).json({ success: false, message: 'Category is required.' });
        }
        if (instructor_id !== undefined && !instructor_id) {
            return res.status(400).json({ success: false, message: 'Instructor is required.' });
        }
        if (!trimmedDesc || trimmedDesc.length < 10) {
            return res.status(400).json({ success: false, message: 'Course Description is required (minimum 10 characters).' });
        }

        // Effective Dates
        const effEnrStart = enrollment_start_date !== undefined ? enrollment_start_date : existing.enrollment_start_date;
        const effEnrDeadline = enrollment_deadline !== undefined ? enrollment_deadline : existing.enrollment_deadline;
        const effCourseStart = start_date !== undefined ? start_date : existing.start_date;
        const effCourseEnd = end_date !== undefined ? end_date : existing.end_date;

        // Validation 2: Clear Date Validations
        if (effEnrStart && effEnrDeadline) {
            if (new Date(effEnrDeadline) < new Date(effEnrStart)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date Error: Enrollment Deadline cannot be before Enrollment Start Date.' 
                });
            }
        }
        if (effEnrDeadline && effCourseStart) {
            if (new Date(effCourseStart) < new Date(effEnrDeadline)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date Error: Course Start Date cannot be before Enrollment Deadline.' 
                });
            }
        }
        if (effCourseStart && effCourseEnd) {
            if (new Date(effCourseEnd) < new Date(effCourseStart)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date Error: Course End Date cannot be before Course Start Date.' 
                });
            }
        }

        const finalSlug = (slug && typeof slug === 'string' && slug.trim())
            ? slug.trim()
            : (trimmedTitle !== existing.title ? trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug);

        const parsedPrice = price !== undefined ? (!isNaN(Number(price)) ? Math.max(0, Number(price)) : 0.0) : existing.price;
        const parsedOrder = order_num !== undefined ? (!isNaN(Number(order_num)) ? Math.max(0, Number(order_num)) : 0) : existing.order_num;
        const finalPublished = is_published !== undefined
            ? ((is_published === 1 || is_published === true || is_published === '1') ? 1 : 0)
            : existing.is_published;

        await dbAsync.run(
            `UPDATE courses
             SET title = ?, slug = ?, description = ?, category_id = ?, instructor_id = ?,
                 thumbnail_url = ?, rating = ?, difficulty = ?, duration_hours = ?,
                 lesson_count = COALESCE(?, lesson_count), badge_text = ?, price = ?,
                 enrollment_start_date = ?, enrollment_deadline = ?, start_date = ?, end_date = ?,
                 order_num = ?, is_popular = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                trimmedTitle,
                finalSlug,
                trimmedDesc,
                category_id !== undefined ? category_id : existing.category_id,
                instructor_id !== undefined ? instructor_id : existing.instructor_id,
                thumbnail_url !== undefined ? thumbnail_url : existing.thumbnail_url,
                rating !== undefined ? rating : existing.rating,
                difficulty !== undefined ? difficulty : existing.difficulty,
                duration_hours !== undefined ? duration_hours : existing.duration_hours,
                lesson_count !== undefined ? lesson_count : existing.lesson_count,
                badge_text !== undefined ? badge_text : existing.badge_text,
                parsedPrice,
                effEnrStart,
                effEnrDeadline,
                effCourseStart,
                effCourseEnd,
                parsedOrder,
                is_popular !== undefined ? is_popular : existing.is_popular,
                finalPublished,
                id
            ]
        );

        res.json({ success: true, message: 'Course updated successfully.' });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ success: false, message: 'Failed to update course.' });
    }
};

exports.duplicateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const original = await dbAsync.get(`SELECT * FROM courses WHERE id = ?`, [id]);
        if (!original) {
            return res.status(404).json({ success: false, message: 'Source course not found.' });
        }

        const newTitle = `${original.title} (Copy)`;
        const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;

        const result = await dbAsync.run(
            `INSERT INTO courses (
                title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, 
                duration_hours, lesson_count, badge_text, price, enrollment_start_date, enrollment_deadline, 
                start_date, end_date, order_num, is_popular, is_published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newTitle,
                newSlug,
                original.description,
                original.category_id,
                original.instructor_id,
                original.thumbnail_url,
                original.rating,
                original.difficulty,
                original.duration_hours,
                original.lesson_count,
                original.badge_text ? `${original.badge_text}` : null,
                original.price,
                original.enrollment_start_date,
                original.enrollment_deadline,
                original.start_date,
                original.end_date,
                (original.order_num || 0) + 1,
                original.is_popular,
                0 // duplicate starts as draft
            ]
        );

        const newCourseId = result.lastID;

        // Duplicate Chapters & Modules
        const originalModules = await dbAsync.all(`SELECT * FROM modules WHERE course_id = ?`, [id]);
        for (const mod of originalModules) {
            const modResult = await dbAsync.run(
                `INSERT INTO modules (course_id, title, description, duration, order_num, status)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [newCourseId, mod.title, mod.description, mod.duration, mod.order_num, mod.status]
            );
            const newModId = modResult.lastID;

            const originalLessons = await dbAsync.all(`SELECT * FROM lessons WHERE module_id = ?`, [mod.id]);
            for (const les of originalLessons) {
                await dbAsync.run(
                    `INSERT INTO lessons (module_id, title, video_url, description, duration, order_num)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [newModId, les.title, les.video_url, les.description, les.duration, les.order_num]
                );
            }
        }

        res.status(201).json({ 
            success: true, 
            message: `Course duplicated as "${newTitle}".`, 
            id: newCourseId,
            data: { id: newCourseId }
        });
    } catch (error) {
        console.error('Duplicate course error:', error);
        res.status(500).json({ success: false, message: 'Failed to duplicate course.' });
    }
};

exports.archiveCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await dbAsync.get(`SELECT is_archived, title FROM courses WHERE id = ?`, [id]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

        const newArchiveState = course.is_archived === 1 ? 0 : 1;
        await dbAsync.run(`UPDATE courses SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newArchiveState, id]);

        res.json({ 
            success: true, 
            message: `Course "${course.title}" ${newArchiveState === 1 ? 'archived' : 'unarchived'}.`, 
            is_archived: newArchiveState 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update course archive status.' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const activeEnrollments = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?`, [id]);
        if (activeEnrollments && activeEnrollments.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete course: ${activeEnrollments.count} student(s) are currently enrolled in this course. Please unenroll or complete students before deleting.`
            });
        }
        await dbAsync.run(`DELETE FROM modules WHERE course_id = ?`, [id]);
        await dbAsync.run(`DELETE FROM courses WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete course.' });
    }
};

exports.toggleCoursePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await dbAsync.get(`SELECT is_published, title FROM courses WHERE id = ?`, [id]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

        const newStatus = course.is_published === 1 ? 0 : 1;
        await dbAsync.run(`UPDATE courses SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newStatus, id]);

        res.json({ success: true, message: `Course "${course.title}" is now ${newStatus === 1 ? 'Published' : 'Draft'}.`, is_published: newStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to toggle course status.' });
    }
};

// ==========================================
// 5B. CHAPTERS / MODULES CRUD
// ==========================================

exports.getCourseChapters = async (req, res) => {
    try {
        const { courseId } = req.params;
        const chapters = await dbAsync.all(
            `SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC, id ASC`,
            [courseId]
        );
        res.json({ success: true, data: chapters });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch course chapters.' });
    }
};

exports.createChapter = async (req, res) => {
    try {
        const { course_id, title, description = '', duration = '2 Hours', order_num = 1, status = 'Published' } = req.body;
        if (!course_id || !title) {
            return res.status(400).json({ success: false, message: 'Course ID and chapter title are required.' });
        }

        if (req.user) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        const result = await dbAsync.run(
            `INSERT INTO modules (course_id, title, description, duration, order_num, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [course_id, title, description, duration, order_num, status]
        );

        // Recalculate lesson_count for course
        const countRow = await dbAsync.get(`SELECT COUNT(*) as count FROM modules WHERE course_id = ?`, [course_id]);
        await dbAsync.run(`UPDATE courses SET lesson_count = ? WHERE id = ?`, [countRow.count, course_id]);

        res.status(201).json({ success: true, message: 'Chapter created successfully.', id: result.lastID, data: { id: result.lastID } });
    } catch (error) {
        console.error('Create chapter error:', error);
        res.status(500).json({ success: false, message: 'Failed to create chapter.' });
    }
};

exports.updateChapter = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, duration, order_num, status } = req.body;

        const chapter = await dbAsync.get(`SELECT course_id FROM modules WHERE id = ?`, [id]);
        if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });

        if (req.user) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, chapter.course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        await dbAsync.run(
            `UPDATE modules SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                duration = COALESCE(?, duration),
                order_num = COALESCE(?, order_num),
                status = COALESCE(?, status)
             WHERE id = ?`,
            [title, description, duration, order_num, status, id]
        );
        res.json({ success: true, message: 'Chapter updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update chapter.' });
    }
};

exports.deleteChapter = async (req, res) => {
    try {
        const { id } = req.params;
        const chapter = await dbAsync.get(`SELECT course_id FROM modules WHERE id = ?`, [id]);
        if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found.' });

        if (req.user) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, chapter.course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        await dbAsync.run(`DELETE FROM modules WHERE id = ?`, [id]);

        // Recalculate lesson count for course
        const countRow = await dbAsync.get(`SELECT COUNT(*) as count FROM modules WHERE course_id = ?`, [chapter.course_id]);
        await dbAsync.run(`UPDATE courses SET lesson_count = ? WHERE id = ?`, [countRow.count, chapter.course_id]);

        res.json({ success: true, message: 'Chapter deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete chapter.' });
    }
};

// ==========================================
// 6. CATEGORIES CRUD
// ==========================================

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await dbAsync.all(`
            SELECT c.*, (SELECT COUNT(*) FROM courses WHERE category_id = c.id) as course_count 
            FROM categories c 
            ORDER BY c.order_num ASC, c.name ASC
        `);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, icon, type, color, order_num, status = 'Active' } = req.body;
        const trimmedName = typeof name === 'string' ? name.trim() : '';

        if (!trimmedName || trimmedName.length < 2) {
            return res.status(400).json({ success: false, message: 'Category Name is required (minimum 2 characters).' });
        }

        const finalSlug = (slug && typeof slug === 'string' && slug.trim())
            ? slug.trim().toLowerCase()
            : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (!finalSlug || finalSlug.length < 2) {
            return res.status(400).json({ success: false, message: 'Category Slug is required.' });
        }

        // Duplicate Check: Prevent duplicate category names and slugs
        const existing = await dbAsync.get(
            `SELECT id, name, slug FROM categories WHERE LOWER(name) = LOWER(?) OR LOWER(slug) = LOWER(?)`, 
            [trimmedName, finalSlug]
        );
        if (existing) {
            if (existing.name.toLowerCase() === trimmedName.toLowerCase()) {
                return res.status(400).json({ success: false, message: `A category with the name "${trimmedName}" already exists.` });
            }
            return res.status(400).json({ success: false, message: `A category with the slug "${finalSlug}" already exists.` });
        }

        const result = await dbAsync.run(
            `INSERT INTO categories (name, slug, icon, type, color, order_num, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [trimmedName, finalSlug, icon || 'bi-tag', type || 'general', color || '#2563EB', Number(order_num) || 0, status || 'Active']
        );
        res.status(201).json({ success: true, message: 'Category created successfully.', id: result.lastID, data: { id: result.lastID } });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Failed to create category.' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, icon, type, color, order_num, status } = req.body;

        const existing = await dbAsync.get(`SELECT * FROM categories WHERE id = ?`, [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        const trimmedName = name !== undefined ? String(name).trim() : existing.name;
        if (!trimmedName || trimmedName.length < 2) {
            return res.status(400).json({ success: false, message: 'Category Name is required (minimum 2 characters).' });
        }

        const finalSlug = (slug && typeof slug === 'string' && slug.trim())
            ? slug.trim().toLowerCase()
            : (trimmedName !== existing.name ? trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug);

        // Prevent duplicate names and slugs on other categories
        const duplicate = await dbAsync.get(
            `SELECT id, name, slug FROM categories WHERE (LOWER(name) = LOWER(?) OR LOWER(slug) = LOWER(?)) AND id != ?`,
            [trimmedName, finalSlug, id]
        );
        if (duplicate) {
            if (duplicate.name.toLowerCase() === trimmedName.toLowerCase()) {
                return res.status(400).json({ success: false, message: `Another category with the name "${trimmedName}" already exists.` });
            }
            return res.status(400).json({ success: false, message: `Another category with the slug "${finalSlug}" already exists.` });
        }

        await dbAsync.run(
            `UPDATE categories SET name = ?, slug = ?, icon = ?, type = ?, color = ?, order_num = ?, status = ? WHERE id = ?`,
            [
                trimmedName,
                finalSlug,
                icon !== undefined ? icon : existing.icon,
                type !== undefined ? type : existing.type,
                color !== undefined ? color : existing.color,
                order_num !== undefined ? Number(order_num) : existing.order_num,
                status !== undefined ? status : existing.status,
                id
            ]
        );

        res.json({ success: true, message: 'Category updated successfully.' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: 'Failed to update category.' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const assignedCourses = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE category_id = ?`, [id]);
        if (assignedCourses && assignedCourses.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category: assigned to ${assignedCourses.count} course(s). Please reassign courses to another category first.`
            });
        }
        await dbAsync.run(`DELETE FROM categories WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete category.' });
    }
};

// ==========================================
// 7. INSTRUCTORS CRUD
// ==========================================

exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await dbAsync.all(`
            SELECT i.*, (SELECT COUNT(*) FROM courses WHERE instructor_id = i.id) as assigned_courses_count
            FROM instructors i 
            ORDER BY i.id ASC
        `);
        res.json({ success: true, data: instructors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch instructors.' });
    }
};

exports.createInstructor = async (req, res) => {
    try {
        const { name, title, bio, avatar_url, email, phone, expertise, department, faculty, status = 'Active' } = req.body;
        const trimmedName = typeof name === 'string' ? name.trim() : '';

        if (!trimmedName || trimmedName.length < 2) {
            return res.status(400).json({ success: false, message: 'Instructor Name is required (minimum 2 characters).' });
        }

        // Email validation
        const trimmedEmail = typeof email === 'string' ? email.trim() : '';
        if (trimmedEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ success: false, message: 'Please provide a valid email address (e.g. instructor@aub.edu.kh).' });
            }
        }

        const avatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`;

        const result = await dbAsync.run(
            `INSERT INTO instructors (name, title, bio, avatar_url, email, phone, expertise, department, faculty, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trimmedName, 
                title || 'Lecturer', 
                bio || '', 
                avatar, 
                trimmedEmail, 
                phone || '', 
                expertise || '', 
                department || faculty || 'Information Technology', 
                faculty || 'Information Technology', 
                status || 'Active'
            ]
        );
        res.status(201).json({ success: true, message: 'Instructor created successfully.', id: result.lastID, data: { id: result.lastID } });
    } catch (error) {
        console.error('Create instructor error:', error);
        res.status(500).json({ success: false, message: 'Failed to create instructor.' });
    }
};

exports.updateInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, title, bio, avatar_url, email, phone, expertise, department, faculty, status } = req.body;

        const existing = await dbAsync.get(`SELECT * FROM instructors WHERE id = ?`, [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Instructor not found.' });
        }

        const trimmedName = name !== undefined ? String(name).trim() : existing.name;
        if (!trimmedName || trimmedName.length < 2) {
            return res.status(400).json({ success: false, message: 'Instructor Name is required (minimum 2 characters).' });
        }

        const trimmedEmail = email !== undefined ? String(email).trim() : existing.email;
        if (trimmedEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
            }
        }

        await dbAsync.run(
            `UPDATE instructors
             SET name = ?, title = ?, bio = ?, avatar_url = ?, email = ?, phone = ?, expertise = ?, department = ?, faculty = ?, status = ?
             WHERE id = ?`,
            [
                trimmedName,
                title !== undefined ? title : existing.title,
                bio !== undefined ? bio : existing.bio,
                avatar_url !== undefined ? avatar_url : existing.avatar_url,
                trimmedEmail,
                phone !== undefined ? phone : existing.phone,
                expertise !== undefined ? expertise : existing.expertise,
                department !== undefined ? department : existing.department,
                faculty !== undefined ? faculty : existing.faculty,
                status !== undefined ? status : existing.status,
                id
            ]
        );

        res.json({ success: true, message: 'Instructor updated successfully.' });
    } catch (error) {
        console.error('Update instructor error:', error);
        res.status(500).json({ success: false, message: 'Failed to update instructor.' });
    }
};

exports.deleteInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const assignedCourses = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE instructor_id = ?`, [id]);
        if (assignedCourses && assignedCourses.count > 0) {
            return res.status(400).json({
                success: false,
                message: `This instructor is assigned to ${assignedCourses.count} course(s). Please reassign these courses before deleting.`
            });
        }
        await dbAsync.run(`DELETE FROM instructors WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Instructor deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete instructor.' });
    }
};

// ==========================================
// 8. USERS CRUD
// ==========================================

exports.getAllUsers = async (req, res) => {
    try {
        const users = await dbAsync.all(`
            SELECT 
                u.id, u.full_name, u.email, u.university_id, u.avatar_url, u.status, u.created_at, u.updated_at,
                u.phone, u.faculty, u.department_name, u.position, u.academic_year, u.semester, u.enrollment_status,
                u.academic_status, u.enrollment_date, u.expected_graduation_date, u.dob, u.gender, u.address,
                u.two_factor_enabled, u.email_verified, u.last_login_at, u.last_profile_update,
                r.name as role, r.id as role_id, 
                p.title as major_title,
                d.name as teacher_department, d.code as teacher_department_code,
                t.specialization as teacher_specialization, t.employment_type as teacher_employment_type,
                t.office_room as teacher_office_room
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN programs p ON u.major_id = p.id
            LEFT JOIN teachers t ON t.user_id = u.id AND t.deleted_at IS NULL
            LEFT JOIN departments d ON t.department_id = d.id
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('getAllUsers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await dbAsync.get(`
            SELECT 
                u.id, u.full_name, u.email, u.university_id, u.avatar_url, u.status, u.created_at, u.updated_at,
                u.phone, u.faculty, u.department_name, u.position, u.academic_year, u.semester, u.enrollment_status,
                u.academic_status, u.enrollment_date, u.expected_graduation_date, u.dob, u.gender, u.address,
                u.two_factor_enabled, u.email_verified, u.last_login_at, u.last_profile_update,
                r.name as role, r.id as role_id, 
                p.title as major_title,
                d.name as teacher_department, d.code as teacher_department_code,
                t.specialization as teacher_specialization, t.employment_type as teacher_employment_type,
                t.office_room as teacher_office_room, t.teacher_code
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN programs p ON u.major_id = p.id
            LEFT JOIN teachers t ON t.user_id = u.id AND t.deleted_at IS NULL
            LEFT JOIN departments d ON t.department_id = d.id
            WHERE u.id = ?
        `, [id]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Fetch user activity logs
        const logs = await dbAsync.all(`
            SELECT id, action, details, created_at
            FROM user_activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 15
        `, [id]);

        user.activity_logs = logs;

        // If teacher, fetch subjects taught
        if (user.role_id === 2) {
            user.subjects_taught = await dbAsync.all(`
                SELECT c.id, c.title, c.slug, c.duration_hours
                FROM teacher_courses tc
                JOIN courses c ON tc.course_id = c.id
                WHERE tc.teacher_id = ?
            `, [user.id]);
        }

        // If student, fetch enrolled courses
        if (user.role_id === 3) {
            user.enrolled_courses = await dbAsync.all(`
                SELECT e.id as enrollment_id, c.title, c.slug, e.status, e.progress_percentage
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.user_id = ?
            `, [user.id]);
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('getUserById error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve user details.' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { 
            full_name, email, university_id, password = 'password123', role_id = 3, major_id, status = 'Active',
            phone = '', faculty = '', department_name = '', position = '', academic_year = 'Year 1',
            semester = 'Semester 1', enrollment_status = 'Active', academic_status = 'Currently Enrolled',
            enrollment_date = null, expected_graduation_date = null, dob = null, gender = 'Not Specified',
            address = '', email_verified = 1, avatar_url = '', initial_course_id = null
        } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ success: false, message: 'Full name and email are required.' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        }

        // Check duplicates
        const existingEmail = await dbAsync.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email address already exists.' });
        }

        if (university_id) {
            const existingUni = await dbAsync.get('SELECT id FROM users WHERE university_id = ?', [university_id]);
            if (existingUni) {
                return res.status(400).json({ success: false, message: 'Student / University ID is already assigned.' });
            }
        }

        const password_hash = bcrypt.hashSync(password, 10);
        const avatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`;

        const result = await dbAsync.run(
            `INSERT INTO users (
                full_name, email, university_id, password_hash, role_id, major_id, avatar_url, status,
                phone, faculty, department_name, position, academic_year, semester, enrollment_status,
                academic_status, enrollment_date, expected_graduation_date, dob, gender, address, email_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_name, email, university_id || null, password_hash, role_id, major_id || null, avatar, status,
                phone, faculty, department_name, position, academic_year, semester, enrollment_status,
                academic_status, enrollment_date || null, expected_graduation_date || null, dob || null, gender, address, email_verified
            ]
        );

        const newUserId = result.lastID;

        // If Role is Teacher, create corresponding teacher profile record & instructor
        if (parseInt(role_id) === 2) {
            await dbAsync.run(`
                INSERT OR IGNORE INTO teachers (user_id, teacher_code, specialization, employment_type, office_room, phone, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                newUserId,
                university_id || `TCH-${String(newUserId).padStart(3, '0')}`,
                position || department_name || 'Academic Faculty',
                enrollment_status || 'Full-Time',
                'Faculty Bldg A',
                phone,
                status
            ]);

            await dbAsync.run(`
                INSERT OR IGNORE INTO instructors (user_id, name, title, bio, avatar_url, email, expertise, faculty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                newUserId,
                full_name,
                position || 'Faculty Lecturer',
                'Academic faculty member at AUB Digital Academy.',
                avatar,
                email,
                position || department_name || 'Academic Systems',
                faculty || 'Information Technology'
            ]);
        }

        // If Role is Student and initial course selected, create separate enrollment record
        if (parseInt(role_id) === 3 && initial_course_id) {
            try {
                await dbAsync.run(`
                    INSERT OR IGNORE INTO enrollments (user_id, course_id, enrollment_date, status, progress_percentage)
                    VALUES (?, ?, CURRENT_TIMESTAMP, 'Active', 0.0)
                `, [newUserId, initial_course_id]);

                const countRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?`, [initial_course_id]);
                await dbAsync.run(`UPDATE courses SET enrolled_students_count = ? WHERE id = ?`, [countRow.count, initial_course_id]);
            } catch (enrErr) {
                console.error('Initial course enrollment error:', enrErr);
            }
        }

        // Record Activity Log
        await dbAsync.run(`
            INSERT INTO user_activity_logs (user_id, action, details, performed_by)
            VALUES (?, 'Account Created', ?, ?)
        `, [newUserId, `Account registered with role ${parseInt(role_id) === 1 ? 'ADMIN' : parseInt(role_id) === 2 ? 'TEACHER' : 'STUDENT'} (ID: ${university_id || newUserId})`, req.user ? req.user.id : null]);

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully.', 
            id: newUserId,
            data: { id: newUserId } 
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user. Please check email and ID uniqueness.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = await dbAsync.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const { 
            full_name, email, university_id, role_id, status, password, avatar_url,
            phone, faculty, department_name, position, academic_year, semester, enrollment_status, major_id,
            academic_status, enrollment_date, expected_graduation_date, dob, gender, address, email_verified
        } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ success: false, message: 'Full name and email are required.' });
        }

        // Email uniqueness check
        const existingEmail = await dbAsync.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Another user already has this email address.' });
        }

        // Uni ID uniqueness check
        if (university_id) {
            const existingUni = await dbAsync.get('SELECT id FROM users WHERE university_id = ? AND id != ?', [university_id, id]);
            if (existingUni) {
                return res.status(400).json({ success: false, message: 'Student / University ID is already assigned to another user.' });
            }
        }

        let password_hash = currentUser.password_hash;
        if (password && password.trim().length >= 6) {
            password_hash = bcrypt.hashSync(password.trim(), 10);
            await dbAsync.run(`
                INSERT INTO user_activity_logs (user_id, action, details, performed_by)
                VALUES (?, 'Password Reset', 'Password updated by administrator', ?)
            `, [id, req.user ? req.user.id : null]);
        }

        await dbAsync.run(
            `UPDATE users SET
                full_name = COALESCE(?, full_name),
                email = COALESCE(?, email),
                university_id = COALESCE(?, university_id),
                role_id = COALESCE(?, role_id),
                status = COALESCE(?, status),
                avatar_url = COALESCE(?, avatar_url),
                phone = COALESCE(?, phone),
                faculty = COALESCE(?, faculty),
                department_name = COALESCE(?, department_name),
                position = COALESCE(?, position),
                academic_year = COALESCE(?, academic_year),
                semester = COALESCE(?, semester),
                enrollment_status = COALESCE(?, enrollment_status),
                academic_status = COALESCE(?, academic_status),
                enrollment_date = COALESCE(?, enrollment_date),
                expected_graduation_date = COALESCE(?, expected_graduation_date),
                dob = COALESCE(?, dob),
                gender = COALESCE(?, gender),
                address = COALESCE(?, address),
                email_verified = COALESCE(?, email_verified),
                major_id = COALESCE(?, major_id),
                password_hash = ?,
                updated_at = CURRENT_TIMESTAMP,
                last_profile_update = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                full_name || null,
                email || null,
                university_id || null,
                role_id !== undefined ? role_id : null,
                status || null,
                avatar_url || null,
                phone !== undefined ? phone : null,
                faculty !== undefined ? faculty : null,
                department_name !== undefined ? department_name : null,
                position !== undefined ? position : null,
                academic_year !== undefined ? academic_year : null,
                semester !== undefined ? semester : null,
                enrollment_status !== undefined ? enrollment_status : null,
                academic_status !== undefined ? academic_status : null,
                enrollment_date !== undefined ? enrollment_date : null,
                expected_graduation_date !== undefined ? expected_graduation_date : null,
                dob !== undefined ? dob : null,
                gender !== undefined ? gender : null,
                address !== undefined ? address : null,
                email_verified !== undefined ? email_verified : null,
                major_id !== undefined ? major_id : null,
                password_hash,
                id
            ]
        );

        res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user && parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
        }

        const teacherCourses = await dbAsync.get(`
            SELECT COUNT(*) as count FROM courses c
            LEFT JOIN instructors i ON c.instructor_id = i.id
            WHERE c.instructor_id = ? OR i.user_id = ?
        `, [id, id]);
        if (teacherCourses && teacherCourses.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete user: This teacher is assigned to ${teacherCourses.count} course(s). Please reassign courses before deleting.`
            });
        }

        await dbAsync.run(`DELETE FROM enrollments WHERE user_id = ?`, [id]);
        await dbAsync.run(`DELETE FROM users WHERE id = ?`, [id]);
        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
};

exports.resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password = 'Password123!' } = req.body;

        const user = await dbAsync.get('SELECT id, full_name, email FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const password_hash = bcrypt.hashSync(new_password, 10);
        await dbAsync.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [password_hash, id]);

        await dbAsync.run(`
            INSERT INTO user_activity_logs (user_id, action, details, performed_by)
            VALUES (?, 'Password Reset', 'Temporary password generated by administrator', ?)
        `, [id, req.user ? req.user.id : null]);

        res.json({
            success: true,
            message: `Password for ${user.full_name} has been reset to: ${new_password}`,
            temporaryPassword: new_password
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await dbAsync.get('SELECT id, full_name, status FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let newStatus = status;
        if (!newStatus) {
            newStatus = (user.status === 'Active') ? 'Suspended' : 'Active';
        }

        await dbAsync.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

        await dbAsync.run(`
            INSERT INTO user_activity_logs (user_id, action, details, performed_by)
            VALUES (?, 'Status Updated', ?, ?)
        `, [id, `Account status changed from ${user.status} to ${newStatus}`, req.user ? req.user.id : null]);

        res.json({
            success: true,
            message: `User status changed to ${newStatus}`,
            status: newStatus
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
    }
};

exports.getUserActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await dbAsync.all(`
            SELECT id, action, details, created_at
            FROM user_activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [id]);
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('getUserActivity error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user activity.' });
    }
};

// ==========================================
// 9. ENROLLMENTS CRUD
// ==========================================

exports.getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await dbAsync.all(`
            SELECT e.*, u.full_name as student_name, u.university_id as student_id, u.email as student_email, u.avatar_url,
                   c.title as course_title, p.title as program_title
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN programs p ON e.program_id = p.id
            ORDER BY e.enrollment_date DESC, e.id DESC
        `);
        res.json({ success: true, data: enrollments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch enrollments.' });
    }
};

exports.createEnrollment = async (req, res) => {
    try {
        const { user_id, course_id, program_id, enrollment_date, status = 'Active', progress_percentage = 0.0 } = req.body;
        if (!user_id || (!course_id && !program_id)) {
            return res.status(400).json({ success: false, message: 'Student and Course/Program selection are required.' });
        }

        // Check for course enrollment deadline and duplicate enrollment
        if (course_id) {
            const course = await dbAsync.get(`SELECT id, title, enrollment_deadline FROM courses WHERE id = ?`, [course_id]);
            if (course && course.enrollment_deadline) {
                const today = new Date().toISOString().split('T')[0];
                const deadline = String(course.enrollment_deadline).split('T')[0];
                if (today > deadline) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Cannot enroll student: The enrollment deadline for "${course.title}" expired on ${deadline}.` 
                    });
                }
            }

            const existing = await dbAsync.get(
                `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?`,
                [user_id, course_id]
            );
            if (existing) {
                return res.status(400).json({ success: false, message: 'This student is already enrolled in this course.' });
            }
        }

        const result = await dbAsync.run(
            `INSERT INTO enrollments (user_id, course_id, program_id, enrollment_date, status, progress_percentage)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                course_id || null,
                program_id || null,
                enrollment_date || new Date().toISOString(),
                status,
                progress_percentage || 0.0
            ]
        );

        // Update course enrolled count
        if (course_id) {
            const countRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?`, [course_id]);
            await dbAsync.run(`UPDATE courses SET enrolled_students_count = ? WHERE id = ?`, [countRow.count, course_id]);
        }

        res.status(201).json({ success: true, message: 'Enrollment created successfully.', id: result.lastID });
    } catch (error) {
        console.error('Create enrollment error:', error);
        res.status(500).json({ success: false, message: 'Failed to create enrollment.' });
    }
};

exports.updateEnrollmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress_percentage } = req.body;

        await dbAsync.run(
            `UPDATE enrollments
             SET status = ?, progress_percentage = COALESCE(?, progress_percentage)
             WHERE id = ?`,
            [status, progress_percentage, id]
        );

        res.json({ success: true, message: 'Enrollment updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update enrollment.' });
    }
};

exports.deleteEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const enrollment = await dbAsync.get(`SELECT course_id FROM enrollments WHERE id = ?`, [id]);
        
        await dbAsync.run(`DELETE FROM enrollments WHERE id = ?`, [id]);

        if (enrollment && enrollment.course_id) {
            const countRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?`, [enrollment.course_id]);
            await dbAsync.run(`UPDATE courses SET enrolled_students_count = ? WHERE id = ?`, [countRow.count, enrollment.course_id]);
        }

        res.json({ success: true, message: 'Enrollment deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete enrollment.' });
    }
};

// ==========================================
// 10. PAYMENT MANAGEMENT CRUD
// ==========================================

exports.getAllPayments = async (req, res) => {
    try {
        const { status, timeframe } = req.query;
        let sql = `
            SELECT p.*, 
                   u.full_name as student_name, u.university_id as student_uni_id, u.email as student_email, u.avatar_url as student_avatar,
                   c.title as course_title, c.difficulty as course_difficulty,
                   inst.name as instructor_name
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN courses c ON p.course_id = c.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            sql += ` AND p.payment_status = ?`;
            params.push(status);
        }

        if (timeframe === 'this_month') {
            sql += ` AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')`;
        } else if (timeframe === 'last_month') {
            sql += ` AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now', '-1 month')`;
        }

        sql += ` ORDER BY p.payment_date DESC, p.id DESC`;

        const payments = await dbAsync.all(sql, params);
        res.json({ success: true, data: payments });
    } catch (error) {
        console.error('getAllPayments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
    }
};

exports.getPaymentStats = async (req, res) => {
    try {
        const totalRevenueRow = await dbAsync.get(`
            SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'Paid'
        `);
        const paidCountRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM payments WHERE payment_status = 'Paid'
        `);
        const pendingCountRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM payments WHERE payment_status = 'Pending'
        `);
        const refundedRow = await dbAsync.get(`
            SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE payment_status = 'Refunded'
        `);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenueRow.total || 0,
                paidCount: paidCountRow.count || 0,
                pendingCount: pendingCountRow.count || 0,
                refundedTotal: refundedRow.total || 0,
                refundedCount: refundedRow.count || 0
            }
        });
    } catch (error) {
        console.error('getPaymentStats error:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate payment stats.' });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const { user_id, course_id, amount, payment_method = 'ABA PAY', payment_status = 'Paid', notes = '' } = req.body;
        if (!user_id || !course_id) {
            return res.status(400).json({ success: false, message: 'User ID and Course ID are required.' });
        }

        const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const invoiceNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

        // Check if enrollment exists
        let enrollment = await dbAsync.get(`SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?`, [user_id, course_id]);
        if (!enrollment) {
            const enrResult = await dbAsync.run(`
                INSERT INTO enrollments (user_id, course_id, status, payment_status, progress_percentage)
                VALUES (?, ?, 'Active', ?, 0.0)
            `, [user_id, course_id, payment_status]);
            enrollment = { id: enrResult.lastID };
        } else {
            await dbAsync.run(`UPDATE enrollments SET payment_status = ?, status = 'Active' WHERE id = ?`, [payment_status, enrollment.id]);
        }

        const result = await dbAsync.run(`
            INSERT INTO payments (transaction_id, enrollment_id, user_id, course_id, amount, payment_method, payment_status, invoice_number, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [txnId, enrollment.id, user_id, course_id, Number(amount) || 0.0, payment_method, payment_status, invoiceNum, notes]);

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully.',
            id: result.lastID,
            data: {
                id: result.lastID,
                transaction_id: txnId,
                invoice_number: invoiceNum
            }
        });
    } catch (error) {
        console.error('createPayment error:', error);
        res.status(500).json({ success: false, message: 'Failed to record payment.' });
    }
};

exports.refundPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await dbAsync.get(`SELECT * FROM payments WHERE id = ?`, [id]);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found.' });
        }

        await dbAsync.run(`UPDATE payments SET payment_status = 'Refunded' WHERE id = ?`, [id]);
        if (payment.enrollment_id) {
            await dbAsync.run(`UPDATE enrollments SET payment_status = 'Refunded', status = 'Cancelled' WHERE id = ?`, [payment.enrollment_id]);
        }

        res.json({ success: true, message: `Payment ${payment.transaction_id} marked as Refunded.` });
    } catch (error) {
        console.error('refundPayment error:', error);
        res.status(500).json({ success: false, message: 'Failed to refund payment.' });
    }
};

// ==========================================
// EXAMS & QUIZZES CONTROLLERS
// ==========================================
exports.getAllExams = async (req, res) => {
    try {
        const exams = await dbAsync.all(`
            SELECT ex.*, c.title as course_title, u.full_name as instructor_name, m.title as chapter_title
            FROM exams ex
            LEFT JOIN courses c ON ex.course_id = c.id
            LEFT JOIN users u ON ex.instructor_id = u.id
            LEFT JOIN modules m ON ex.chapter_id = m.id
            ORDER BY ex.start_datetime ASC
        `);
        res.json({ success: true, data: exams });
    } catch (error) {
        console.error('getAllExams error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exams.' });
    }
};

exports.createExam = async (req, res) => {
    try {
        const { title, course_id, chapter_id, instructor_id, exam_type, description, total_questions, total_marks, passing_score, duration_minutes, start_datetime, end_datetime, attempts_allowed, status } = req.body;
        if (!title || !course_id || !start_datetime || !end_datetime) {
            return res.status(400).json({ success: false, message: 'Title, Course, Start Date & End Date are required.' });
        }

        // Priority 5: Backend Date Validation (Start < End)
        const start = new Date(start_datetime);
        const end = new Date(end_datetime);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Exam Window: Start Date/Time must be strictly before End Date/Time.'
            });
        }

        const result = await dbAsync.run(`
            INSERT INTO exams (title, course_id, chapter_id, instructor_id, exam_type, description, total_questions, total_marks, passing_score, duration_minutes, start_datetime, end_datetime, attempts_allowed, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, course_id, chapter_id || null, instructor_id || null, exam_type || 'Midterm Exam', description || '', Number(total_questions) || 20, Number(total_marks) || 100, Number(passing_score) || 50, Number(duration_minutes) || 60, start_datetime, end_datetime, Number(attempts_allowed) || 2, status || 'Scheduled']);

        res.status(201).json({ success: true, message: 'Exam created successfully.', id: result.lastID });
    } catch (error) {
        console.error('createExam error:', error);
        res.status(500).json({ success: false, message: 'Failed to create exam.' });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, course_id, chapter_id, instructor_id, exam_type, description, total_questions, total_marks, passing_score, duration_minutes, start_datetime, end_datetime, attempts_allowed, status } = req.body;

        if (start_datetime && end_datetime) {
            const start = new Date(start_datetime);
            const end = new Date(end_datetime);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Exam Window: Start Date/Time must be strictly before End Date/Time.'
                });
            }
        }

        await dbAsync.run(`
            UPDATE exams SET title = ?, course_id = ?, chapter_id = ?, instructor_id = ?, exam_type = ?, description = ?, total_questions = ?, total_marks = ?, passing_score = ?, duration_minutes = ?, start_datetime = ?, end_datetime = ?, attempts_allowed = ?, status = ?
            WHERE id = ?
        `, [title, course_id, chapter_id || null, instructor_id || null, exam_type, description, total_questions, total_marks, passing_score, duration_minutes, start_datetime, end_datetime, attempts_allowed, status, id]);
        res.json({ success: true, message: 'Exam updated successfully.' });
    } catch (error) {
        console.error('updateExam error:', error);
        res.status(500).json({ success: false, message: 'Failed to update exam.' });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        await dbAsync.run(`DELETE FROM exams WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Exam deleted successfully.' });
    } catch (error) {
        console.error('deleteExam error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete exam.' });
    }
};

// Exam Submissions / Results
exports.getExamResults = async (req, res) => {
    try {
        const results = await dbAsync.all(`
            SELECT es.*, u.full_name as student_name, u.university_id, u.avatar_url, ex.title as exam_title, c.title as course_title
            FROM exam_submissions es
            LEFT JOIN users u ON es.student_id = u.id
            LEFT JOIN exams ex ON es.exam_id = ex.id
            LEFT JOIN courses c ON es.course_id = c.id
            ORDER BY es.submitted_at DESC
        `);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('getExamResults error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exam results.' });
    }
};

// Invoices CRUD
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await dbAsync.all(`
            SELECT inv.*, u.full_name as student_name, u.email as student_email, u.university_id, c.title as course_title
            FROM invoices inv
            LEFT JOIN users u ON inv.student_id = u.id
            LEFT JOIN courses c ON inv.course_id = c.id
            ORDER BY inv.issue_date DESC
        `);
        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error('getAllInvoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const { student_id, course_id, amount, discount = 0, tax = 0, issue_date, due_date, status = 'Issued', notes = '' } = req.body;
        const total = (Number(amount) || 0) - (Number(discount) || 0) + (Number(tax) || 0);
        const invNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

        const result = await dbAsync.run(`
            INSERT INTO invoices (invoice_number, student_id, course_id, amount, discount, tax, total_amount, issue_date, due_date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [invNum, student_id, course_id, amount, discount, tax, total, issue_date || new Date().toISOString().split('T')[0], due_date, status, notes]);

        res.status(201).json({ success: true, message: 'Invoice created.', id: result.lastID });
    } catch (error) {
        console.error('createInvoice error:', error);
        res.status(500).json({ success: false, message: 'Failed to create invoice.' });
    }
};

// Teacher Payroll CRUD
exports.getTeacherPayroll = async (req, res) => {
    try {
        const payroll = await dbAsync.all(`
            SELECT tp.*, u.full_name as teacher_name, u.email as teacher_email, u.avatar_url, t.teacher_code, d.name as department_name
            FROM teacher_payroll tp
            LEFT JOIN users u ON tp.teacher_id = u.id
            LEFT JOIN teachers t ON t.user_id = u.id
            LEFT JOIN departments d ON tp.department_id = d.id
            ORDER BY tp.created_at DESC
        `);
        res.json({ success: true, data: payroll });
    } catch (error) {
        console.error('getTeacherPayroll error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch teacher payroll.' });
    }
};

exports.updatePayrollStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, payment_date } = req.body;
        await dbAsync.run(`
            UPDATE teacher_payroll SET status = ?, payment_date = ?
            WHERE id = ?
        `, [status, payment_date || (status === 'Paid' ? new Date().toISOString().split('T')[0] : null), id]);
        res.json({ success: true, message: 'Payroll status updated successfully.' });
    } catch (error) {
        console.error('updatePayrollStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update payroll status.' });
    }
};

// Calendar & Schedule
exports.getCalendarEvents = async (req, res) => {
    try {
        const events = await dbAsync.all(`
            SELECT ce.*, c.title as course_title, u.full_name as instructor_name
            FROM calendar_events ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN users u ON ce.instructor_id = u.id
            ORDER BY ce.start_time ASC
        `);
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('getCalendarEvents error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch calendar events.' });
    }
};

exports.createCalendarEvent = async (req, res) => {
    try {
        const { title, event_type, course_id, instructor_id, start_time, end_time, location_room, description } = req.body;
        const result = await dbAsync.run(`
            INSERT INTO calendar_events (title, event_type, course_id, instructor_id, start_time, end_time, location_room, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        `, [title, event_type || 'Class', course_id || null, instructor_id || null, start_time, end_time || null, location_room || 'Room 101', description || '']);
        res.status(201).json({ success: true, message: 'Event scheduled.', id: result.lastID });
    } catch (error) {
        console.error('createCalendarEvent error:', error);
        res.status(500).json({ success: false, message: 'Failed to schedule event.' });
    }
};

// Analytical Reports
exports.getReportsData = async (req, res) => {
    try {
        const type = req.query.type || 'enrollment';
        
        const enrollmentReport = await dbAsync.all(`
            SELECT c.title as course_name, cat.name as category_name, COUNT(e.id) as total_enrollments,
                   SUM(CASE WHEN e.status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
                   AVG(e.progress_percentage) as avg_progress,
                   SUM(CASE WHEN e.payment_status = 'Paid' THEN c.price ELSE 0 END) as gross_revenue
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN enrollments e ON e.course_id = c.id
            GROUP BY c.id
            ORDER BY total_enrollments DESC
        `);

        const examReport = await dbAsync.all(`
            SELECT ex.title as exam_title, c.title as course_name, COUNT(es.id) as total_submissions,
                   AVG(es.percentage) as avg_percentage,
                   SUM(CASE WHEN es.status = 'Passed' THEN 1 ELSE 0 END) as passed_count,
                   SUM(CASE WHEN es.status = 'Failed' THEN 1 ELSE 0 END) as failed_count
            FROM exams ex
            LEFT JOIN courses c ON ex.course_id = c.id
            LEFT JOIN exam_submissions es ON es.exam_id = ex.id
            GROUP BY ex.id
        `);

        const payrollSummary = await dbAsync.all(`
            SELECT d.name as department_name, COUNT(tp.id) as faculty_count,
                   SUM(tp.base_salary) as total_base, SUM(tp.course_compensation) as total_course_comp,
                   SUM(tp.bonus) as total_bonus, SUM(tp.net_pay) as total_payroll
            FROM departments d
            LEFT JOIN teacher_payroll tp ON tp.department_id = d.id
            GROUP BY d.id
        `);

        res.json({
            success: true,
            data: {
                enrollments: enrollmentReport,
                exams: examReport,
                payroll: payrollSummary
            }
        });
    } catch (error) {
        console.error('getReportsData error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate reports.' });
    }
};

// ==========================================
// 10. LESSONS MANAGEMENT CRUD & REORDERING
// ==========================================

exports.createLesson = async (req, res) => {
    try {
        const { module_id, title, video_url = '', description = '', duration = '20 Mins', order_num } = req.body;
        if (!module_id || !title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Module ID and Lesson Title are required.' });
        }

        const moduleItem = await dbAsync.get(`SELECT course_id FROM modules WHERE id = ?`, [module_id]);
        if (!moduleItem) return res.status(404).json({ success: false, message: 'Module not found.' });

        if (req.user) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, moduleItem.course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        const maxOrder = await dbAsync.get(`SELECT MAX(order_num) as max_order FROM lessons WHERE module_id = ?`, [module_id]);
        const nextOrder = order_num !== undefined ? Number(order_num) : ((maxOrder && maxOrder.max_order !== null) ? maxOrder.max_order + 1 : 1);

        const result = await dbAsync.run(`
            INSERT INTO lessons (module_id, title, video_url, description, duration, order_num)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [module_id, title.trim(), video_url, description, duration, nextOrder]);

        // Audit log
        if (req.user) {
            await dbAsync.run(`
                INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
                VALUES (?, ?, ?, 'CREATE_LESSON', 'Lesson', ?, ?)
            `, [req.user.id || 1, req.user.full_name || 'Admin', req.user.role || 'ADMIN', result.lastID, `Created lesson "${title}" in module ${module_id}`]);
        }

        res.status(201).json({ success: true, message: 'Lesson created successfully.', id: result.lastID });
    } catch (error) {
        console.error('createLesson error:', error);
        res.status(500).json({ success: false, message: 'Failed to create lesson.' });
    }
};

exports.updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, video_url, description, duration, order_num } = req.body;

        const existing = await dbAsync.get(`
            SELECT l.*, m.course_id FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE l.id = ?
        `, [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Lesson not found.' });
        }

        if (req.user) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, existing.course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        await dbAsync.run(`
            UPDATE lessons
            SET title = ?, video_url = ?, description = ?, duration = ?, order_num = ?
            WHERE id = ?
        `, [
            title !== undefined ? title.trim() : existing.title,
            video_url !== undefined ? video_url : existing.video_url,
            description !== undefined ? description : existing.description,
            duration !== undefined ? duration : existing.duration,
            order_num !== undefined ? Number(order_num) : existing.order_num,
            id
        ]);

        res.json({ success: true, message: 'Lesson updated successfully.' });
    } catch (error) {
        console.error('updateLesson error:', error);
        res.status(500).json({ success: false, message: 'Failed to update lesson.' });
    }
};

exports.deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await dbAsync.get(`
            SELECT l.*, m.course_id FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE l.id = ?
        `, [id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Lesson not found.' });

        if (req.user) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, existing.course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        await dbAsync.run(`DELETE FROM lessons WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Lesson deleted successfully.' });
    } catch (error) {
        console.error('deleteLesson error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete lesson.' });
    }
};

exports.reorderLessons = async (req, res) => {
    try {
        const { orders } = req.body; // Array of { id, order_num }
        if (!Array.isArray(orders)) {
            return res.status(400).json({ success: false, message: 'Orders array is required.' });
        }

        for (const item of orders) {
            await dbAsync.run(`UPDATE lessons SET order_num = ? WHERE id = ?`, [Number(item.order_num), item.id]);
        }

        res.json({ success: true, message: 'Lessons reordered successfully.' });
    } catch (error) {
        console.error('reorderLessons error:', error);
        res.status(500).json({ success: false, message: 'Failed to reorder lessons.' });
    }
};

// ==========================================
// 11. LEARNING MATERIALS (PDF, Worksheets, Docs)
// ==========================================

exports.getLessonMaterials = async (req, res) => {
    try {
        const { lessonId, courseId } = req.params;
        let materials;
        if (lessonId) {
            materials = await dbAsync.all(`SELECT * FROM lesson_materials WHERE lesson_id = ? ORDER BY order_num ASC, id ASC`, [lessonId]);
        } else if (courseId) {
            materials = await dbAsync.all(`SELECT lm.*, l.title as lesson_title FROM lesson_materials lm JOIN lessons l ON lm.lesson_id = l.id WHERE lm.course_id = ? ORDER BY lm.id ASC`, [courseId]);
        } else {
            materials = await dbAsync.all(`SELECT * FROM lesson_materials ORDER BY id DESC LIMIT 50`);
        }
        res.json({ success: true, data: materials });
    } catch (error) {
        console.error('getLessonMaterials error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch learning materials.' });
    }
};

exports.createLessonMaterial = async (req, res) => {
    try {
        const { lesson_id, course_id, title, type = 'PDF', file_name, file_url, file_size = '1.5 MB' } = req.body;
        if (!lesson_id || !title || !file_name || !file_url) {
            return res.status(400).json({ success: false, message: 'Lesson ID, Title, File Name, and File URL are required.' });
        }

        let targetCourseId = course_id;
        if (!targetCourseId) {
            const les = await dbAsync.get(`SELECT m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ?`, [lesson_id]);
            if (les) targetCourseId = les.course_id;
        }

        if (req.user && targetCourseId) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, targetCourseId);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        const result = await dbAsync.run(`
            INSERT INTO lesson_materials (lesson_id, course_id, title, type, file_name, file_url, file_size, uploaded_by, is_published, order_num)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        `, [lesson_id, targetCourseId || null, title.trim(), type, file_name.trim(), file_url.trim(), file_size, req.user ? req.user.id : null]);

        res.status(201).json({ success: true, message: 'Learning material attached successfully.', id: result.lastID });
    } catch (error) {
        console.error('createLessonMaterial error:', error);
        res.status(500).json({ success: false, message: 'Failed to attach learning material.' });
    }
};

exports.deleteLessonMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const mat = await dbAsync.get(`SELECT * FROM lesson_materials WHERE id = ?`, [id]);
        if (!mat) return res.status(404).json({ success: false, message: 'Material not found.' });

        if (req.user && mat.course_id) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, mat.course_id);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        await dbAsync.run(`DELETE FROM lesson_materials WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Material deleted successfully.' });
    } catch (error) {
        console.error('deleteLessonMaterial error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete material.' });
    }
};

// ==========================================
// 12. LESSON VIDEOS
// ==========================================

exports.getLessonVideo = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const video = await dbAsync.get(`SELECT * FROM lesson_videos WHERE lesson_id = ?`, [lessonId]);
        res.json({ success: true, data: video || null });
    } catch (error) {
        console.error('getLessonVideo error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch lesson video.' });
    }
};

exports.saveLessonVideo = async (req, res) => {
    try {
        const { lesson_id, course_id, video_title, video_url, storage_path = '', duration_minutes = 15, resolution = '1080p', platform = 'Direct Stream' } = req.body;
        if (!lesson_id || !video_url) {
            return res.status(400).json({ success: false, message: 'Lesson ID and Video URL are required.' });
        }

        let targetCourseId = course_id;
        if (!targetCourseId) {
            const les = await dbAsync.get(`SELECT m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ?`, [lesson_id]);
            if (les) targetCourseId = les.course_id;
        }

        if (req.user && targetCourseId) {
            const isAuth = await verifyTeacherCourseAccess(req.user.id, req.user.role, targetCourseId);
            if (!isAuth) {
                return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
            }
        }

        const existing = await dbAsync.get(`SELECT id FROM lesson_videos WHERE lesson_id = ?`, [lesson_id]);
        if (existing) {
            await dbAsync.run(`
                UPDATE lesson_videos
                SET video_title = ?, video_url = ?, storage_path = ?, duration_minutes = ?, resolution = ?, platform = ?
                WHERE lesson_id = ?
            `, [video_title || 'Lesson Video', video_url, storage_path, duration_minutes, resolution, platform, lesson_id]);
            res.json({ success: true, message: 'Lesson video updated successfully.' });
        } else {
            const result = await dbAsync.run(`
                INSERT INTO lesson_videos (lesson_id, course_id, video_title, video_url, storage_path, duration_minutes, resolution, platform)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [lesson_id, targetCourseId || null, video_title || 'Lesson Video', video_url, storage_path, duration_minutes, resolution, platform]);
            res.status(201).json({ success: true, message: 'Lesson video created successfully.', id: result.lastID });
        }
    } catch (error) {
        console.error('saveLessonVideo error:', error);
        res.status(500).json({ success: false, message: 'Failed to save lesson video.' });
    }
};

// ==========================================
// 13. COURSE ANNOUNCEMENTS
// ==========================================

exports.getCourseAnnouncements = async (req, res) => {
    try {
        const { courseId } = req.params;
        const announcements = await dbAsync.all(`
            SELECT ca.*, u.full_name as author_name, u.avatar_url as author_avatar
            FROM course_announcements ca
            LEFT JOIN users u ON ca.published_by = u.id
            WHERE ca.course_id = ?
            ORDER BY ca.published_at DESC
        `, [courseId]);
        res.json({ success: true, data: announcements });
    } catch (error) {
        console.error('getCourseAnnouncements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch course announcements.' });
    }
};

exports.createCourseAnnouncement = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, message, priority = 'Normal' } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and Message are required.' });
        }

        const publishedBy = (req.user && req.user.id) ? req.user.id : 1;
        const result = await dbAsync.run(`
            INSERT INTO course_announcements (course_id, title, message, priority, published_by, status)
            VALUES (?, ?, ?, ?, ?, 'Published')
        `, [courseId, title.trim(), message.trim(), priority, publishedBy]);

        res.status(201).json({ success: true, message: 'Announcement published.', id: result.lastID });
    } catch (error) {
        console.error('createCourseAnnouncement error:', error);
        res.status(500).json({ success: false, message: 'Failed to post announcement.' });
    }
};

exports.deleteCourseAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await dbAsync.run(`DELETE FROM course_announcements WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Announcement removed.' });
    } catch (error) {
        console.error('deleteCourseAnnouncement error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove announcement.' });
    }
};

// ==========================================
// 14. CERTIFICATES ENGINE & VERIFICATION
// ==========================================

exports.getAllCertificates = async (req, res) => {
    try {
        const certificates = await dbAsync.all(`
            SELECT cert.*, u.full_name as student_name, u.university_id, u.email as student_email, c.title as course_title
            FROM certificates cert
            LEFT JOIN users u ON cert.student_id = u.id
            LEFT JOIN courses c ON cert.course_id = c.id
            ORDER BY cert.issue_date DESC
        `);
        res.json({ success: true, data: certificates });
    } catch (error) {
        console.error('getAllCertificates error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch certificates.' });
    }
};

exports.issueCertificate = async (req, res) => {
    try {
        const { student_id, course_id, grade_achieved = 'A (Distinction)' } = req.body;
        if (!student_id || !course_id) {
            return res.status(400).json({ success: false, message: 'Student ID and Course ID are required.' });
        }

        // Generate unique certificate serial number
        const certNum = `AUB-CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const today = new Date().toISOString().split('T')[0];

        const result = await dbAsync.run(`
            INSERT INTO certificates (certificate_number, student_id, course_id, issue_date, completion_date, grade_achieved, status, pdf_url)
            VALUES (?, ?, ?, ?, ?, ?, 'Issued', ?)
            ON CONFLICT(student_id, course_id) DO UPDATE SET
                certificate_number = excluded.certificate_number,
                issue_date = excluded.issue_date,
                grade_achieved = excluded.grade_achieved,
                status = 'Issued'
        `, [certNum, student_id, course_id, today, today, grade_achieved, `https://aub.edu.kh/certificates/${certNum}.pdf`]);

        // Mark enrollment as completed
        await dbAsync.run(`
            UPDATE enrollments SET status = 'Completed', progress_percentage = 100.0, completed_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND course_id = ?
        `, [student_id, course_id]);

        res.status(201).json({ success: true, message: 'Certificate issued successfully.', certificate_number: certNum });
    } catch (error) {
        console.error('issueCertificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to issue certificate.' });
    }
};

// ==========================================
// 15. AUDIT LOGS
// ==========================================

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await dbAsync.all(`
            SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100
        `);
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('getAuditLogs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
    }
};

// ==========================================
// 16. STUDENT LESSON PROGRESS & WATCH POSITION
// ==========================================

exports.updateStudentLessonProgress = async (req, res) => {
    try {
        const { student_id, lesson_id, course_id, is_completed, last_watched_seconds } = req.body;
        const studentId = student_id || (req.user ? req.user.id : null);
        if (!studentId || !lesson_id || !course_id) {
            return res.status(400).json({ success: false, message: 'Student ID, Lesson ID, and Course ID are required.' });
        }

        await dbAsync.run(`
            INSERT INTO student_lesson_progress (student_id, lesson_id, course_id, is_completed, completed_at, last_watched_seconds)
            VALUES (?, ?, ?, ?, ${is_completed ? "CURRENT_TIMESTAMP" : "NULL"}, ?)
            ON CONFLICT(student_id, lesson_id) DO UPDATE SET
                is_completed = excluded.is_completed,
                completed_at = CASE WHEN excluded.is_completed = 1 THEN CURRENT_TIMESTAMP ELSE student_lesson_progress.completed_at END,
                last_watched_seconds = excluded.last_watched_seconds
        `, [studentId, lesson_id, course_id, is_completed ? 1 : 0, last_watched_seconds || 0]);

        // Recompute course progress percentage
        const totalLessonsRow = await dbAsync.get(`
            SELECT COUNT(l.id) as total_count
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE m.course_id = ?
        `, [course_id]);

        const completedLessonsRow = await dbAsync.get(`
            SELECT COUNT(*) as completed_count
            FROM student_lesson_progress
            WHERE student_id = ? AND course_id = ? AND is_completed = 1
        `, [studentId, course_id]);

        const total = (totalLessonsRow && totalLessonsRow.total_count) || 1;
        const completed = (completedLessonsRow && completedLessonsRow.completed_count) || 0;
        const progressPercentage = Math.min(100.0, Math.round((completed / total) * 100));

        await dbAsync.run(`
            UPDATE enrollments
            SET progress_percentage = ?,
                status = CASE WHEN ? >= 100 THEN 'Completed' ELSE status END
            WHERE user_id = ? AND course_id = ?
        `, [progressPercentage, progressPercentage, studentId, course_id]);

        res.json({
            success: true,
            message: 'Progress recorded.',
            progress_percentage: progressPercentage,
            completed_lessons: completed,
            total_lessons: total
        });
    } catch (error) {
        console.error('updateStudentLessonProgress error:', error);
        res.status(500).json({ success: false, message: 'Failed to update progress.' });
    }
};
