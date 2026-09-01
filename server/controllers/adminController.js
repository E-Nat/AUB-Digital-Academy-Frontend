const bcrypt = require('bcryptjs');
const { dbAsync } = require('../db/database');
const { verifyTeacherCourseAccess } = require('./quizExamController');

// ==========================================
// 1. DASHBOARD METRICS & STATS (Calculated dynamically)
// ==========================================

exports.getDashboardMetrics = async (req, res) => {
    try {
        const totalUsersRow       = await dbAsync.get(`SELECT COUNT(*) as count FROM users`);
        const totalCoursesRow     = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE is_published = 1`);
        const totalStudentsRow    = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id WHERE r.name = 'STUDENT'
        `);
        const totalTeachersRow    = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id WHERE r.name = 'TEACHER'
        `);
        const totalAdminsRow      = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
        `);
        const totalChaptersRow    = await dbAsync.get(`SELECT COUNT(*) as count FROM modules`);
        const totalEnrollmentsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments`);

        // ── Operational KPIs derived from existing tables ──────────────────
        // Pending enrollments: enrollments with status 'Pending'
        const pendingEnrollmentsRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM enrollments WHERE LOWER(status) = 'pending'`
        );
        // Active courses: published courses
        const activeCoursesRow  = await dbAsync.get(
            `SELECT COUNT(*) as count FROM courses WHERE is_published = 1`
        );
        // Completed courses: courses where at least one enrollment is 100% progress
        const completedCoursesRow = await dbAsync.get(
            `SELECT COUNT(DISTINCT course_id) as count FROM enrollments WHERE progress_percentage >= 100`
        );
        // Upcoming exams: quizzes (used as proxy for exams) count
        const upcomingExamsRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM quizzes`
        );
        // Pending results: enrollments with status 'Active' and 0 progress (proxy for ungraded)
        const pendingResultsRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM enrollments WHERE LOWER(status) = 'active' AND progress_percentage = 0`
        );

        // ── Financial Intelligence — derived from enrollment payments proxy ─
        // Since we don't have a payments table yet, derive from enrollment data:
        // "Paid" = completed enrollments (proxy for tuition paid)
        // "Pending" = active enrollments without completion (proxy for outstanding)
        const paidEnrollsRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM enrollments WHERE LOWER(status) = 'completed' OR progress_percentage >= 100`
        );
        const pendingEnrollsRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM enrollments WHERE LOWER(status) IN ('active', 'pending') AND progress_percentage < 100`
        );

        // Course price proxy: $63.33/enrollment (matching existing UI display)
        const PRICE_PER_ENROLLMENT = 63.33;
        const paidCount     = paidEnrollsRow.count    || 0;
        const pendingCount  = pendingEnrollsRow.count || 0;
        const totalPaidRevenue      = +(paidCount   * PRICE_PER_ENROLLMENT).toFixed(2);
        const pendingPaymentsAmount = +(pendingCount * PRICE_PER_ENROLLMENT).toFixed(2);
        const outstandingInvoices   = pendingCount;
        const totalGrossVolume      = +(totalPaidRevenue + pendingPaymentsAmount).toFixed(2);

        res.json({
            success: true,
            data: {
                // Base metrics (existing)
                totalUsers:       totalUsersRow.count,
                totalCourses:     totalCoursesRow.count,
                totalStudents:    totalStudentsRow.count,
                totalTeachers:    totalTeachersRow.count,
                totalAdmins:      totalAdminsRow.count,
                totalChapters:    totalChaptersRow.count,
                totalEnrollments: totalEnrollmentsRow.count,

                // Operational KPIs (new)
                pendingEnrollments: pendingEnrollmentsRow.count,
                pendingPayments:    pendingEnrollsRow.count,
                activeCourses:      activeCoursesRow.count,
                completedCourses:   completedCoursesRow.count,
                upcomingExams:      upcomingExamsRow.count,
                pendingResults:     pendingResultsRow.count,

                // Financial Intelligence (new)
                totalPaidRevenue,
                pendingPaymentsAmount,
                outstandingInvoices,
                totalGrossVolume
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate dashboard metrics.' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const enrollmentTf = req.query.enrollmentTimeframe || req.query.timeframe || 'this_month';
        const majorTf = req.query.majorTimeframe || req.query.timeframe || 'this_month';

        // 1. Real SQL Date Filter for Enrollments
        let enrollmentDateClause = "";
        if (enrollmentTf === 'this_month') {
            enrollmentDateClause = "WHERE strftime('%Y-%m', e.enrollment_date) = strftime('%Y-%m', 'now')";
        } else if (enrollmentTf === 'last_month') {
            enrollmentDateClause = "WHERE strftime('%Y-%m', e.enrollment_date) = strftime('%Y-%m', 'now', '-1 month')";
        } else if (enrollmentTf === 'last_3_months') {
            enrollmentDateClause = "WHERE e.enrollment_date >= date('now', 'start of month', '-2 months')";
        } else if (enrollmentTf === 'this_year') {
            enrollmentDateClause = "WHERE strftime('%Y', e.enrollment_date) = strftime('%Y', 'now')";
        } else {
            // all_time
            enrollmentDateClause = "";
        }

        // Query Category Breakdown
        const categoryEnrollments = await dbAsync.all(`
            SELECT COALESCE(cat.name, 'General') as name, COUNT(e.id) as count
            FROM enrollments e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            ${enrollmentDateClause}
            GROUP BY cat.name
            ORDER BY count DESC
        `);

        // Total Enrollments in this timeframe
        const totalEnrollmentCountRow = await dbAsync.get(`
            SELECT COUNT(*) as total FROM enrollments e ${enrollmentDateClause}
        `);
        const totalEnrollments = totalEnrollmentCountRow.total || 0;

        // Palette for chart
        const colors = ['#0B1F4D', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];
        const formattedEnrollmentCategories = categoryEnrollments.map((cat, idx) => {
            const percentage = totalEnrollments > 0 ? Math.round((cat.count / totalEnrollments) * 100) : 0;
            return {
                name: cat.name,
                count: cat.count,
                percentage: percentage,
                color: colors[idx % colors.length]
            };
        });

        // 2. Real SQL Date Filter for Students by Major
        let studentDateClause = "";
        if (majorTf === 'this_month') {
            studentDateClause = "AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now')";
        } else if (majorTf === 'last_month') {
            studentDateClause = "AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now', '-1 month')";
        } else if (majorTf === 'last_3_months') {
            studentDateClause = "AND u.created_at >= date('now', 'start of month', '-2 months')";
        } else if (majorTf === 'this_year') {
            studentDateClause = "AND strftime('%Y', u.created_at) = strftime('%Y', 'now')";
        } else {
            // all_time
            studentDateClause = "";
        }

        // Query distinct students grouped by their chosen major
        const studentsByMajorQuery = await dbAsync.all(`
            SELECT COALESCE(p.title, 'Undeclared') as major, COUNT(u.id) as student_count
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN programs p ON u.major_id = p.id
            WHERE r.name = 'STUDENT' ${studentDateClause}
            GROUP BY p.title
            ORDER BY student_count DESC
        `);

        const totalStudentsRow = await dbAsync.get(`
            SELECT COUNT(*) as total FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'STUDENT' ${studentDateClause}
        `);
        const totalStudents = totalStudentsRow.total || 0;

        const formattedStudentsByMajor = studentsByMajorQuery.map((item, idx) => {
            const percentage = totalStudents > 0 ? Math.round((item.student_count / totalStudents) * 100) : 0;
            return {
                major: item.major,
                count: item.student_count,
                percentage: percentage,
                color: colors[idx % colors.length]
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

exports.getUpcomingExams = async (req, res) => {
    try {
        const exams = await dbAsync.all(`
            SELECT eq.id, eq.title, eq.exam_type, eq.start_time, eq.end_time, eq.duration_minutes,
                   eq.total_marks, eq.passing_marks, eq.status,
                   c.title as course_title,
                   COALESCE((SELECT COUNT(*) FROM enrollments e WHERE e.course_id = eq.course_id), 0) as student_count
            FROM exams_quizzes eq
            LEFT JOIN courses c ON eq.course_id = c.id
            ORDER BY eq.start_time ASC, eq.id ASC
            LIMIT 10
        `);
        res.json({ success: true, data: exams });
    } catch (error) {
        console.error("Error fetching upcoming exams:", error);
        res.status(500).json({ success: false, message: "Failed to fetch upcoming exams." });
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
                unreadCount: unreadCountRow ? unreadCountRow.count : 0,
                notifications
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch notifications." });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === "all") {
            await dbAsync.run(`UPDATE notifications SET is_read = 1`);
        } else {
            await dbAsync.run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
        }
        res.json({ success: true, message: "Notification marked as read." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update notification." });
    }
};

// ==========================================
// 5. COURSES MANAGEMENT CRUD
// ==========================================

exports.getAllCourses = async (req, res) => {
    try {
        const courses = await dbAsync.all(`
            SELECT c.*, cat.name as category_name, inst.name as instructor_name
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            ORDER BY c.order_num ASC, c.id ASC
        `);
        res.json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch courses." });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await dbAsync.get(`
            SELECT c.*, cat.name as category_name, inst.name as instructor_name, inst.avatar_url as instructor_avatar
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            WHERE c.id = ?
        `, [id]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

        // Attach modules and embedded lessons
        const modules = await dbAsync.all(`SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC, id ASC`, [id]);
        for (const mod of modules) {
            mod.lessons = await dbAsync.all(`SELECT * FROM lessons WHERE module_id = ? ORDER BY order_num ASC, id ASC`, [mod.id]);
        }
        course.modules = modules;

        res.json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch course details.' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, badge_text, order_num, is_popular, is_published } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required.' });
        }

        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const result = await dbAsync.run(
            `INSERT INTO courses (title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, badge_text, order_num, is_popular, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                finalSlug,
                description || '',
                category_id || null,
                instructor_id || null,
                thumbnail_url || 'assets/images/course_webdev.jpg',
                rating || 4.8,
                difficulty || 'Beginner',
                duration_hours || '8 Hours',
                lesson_count || 12,
                badge_text || null,
                order_num || 0,
                is_popular !== undefined ? is_popular : 1,
                is_published !== undefined ? is_published : 1
            ]
        );

        res.json({ success: true, message: 'Course created successfully.', id: result.lastID });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ success: false, message: 'Failed to create course.' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, badge_text, order_num, is_popular, is_published } = req.body;

        await dbAsync.run(
            `UPDATE courses
             SET title = ?, slug = ?, description = ?, category_id = ?, instructor_id = ?,
                 thumbnail_url = ?, rating = ?, difficulty = ?, duration_hours = ?,
                 lesson_count = ?, badge_text = ?, order_num = ?, is_popular = ?,
                 is_published = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, badge_text, order_num, is_popular, is_published, id]
        );

        res.json({ success: true, message: 'Course updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update course.' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const activeEnrollments = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?`, [id]);
        if (activeEnrollments && activeEnrollments.count > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete course: has ${activeEnrollments.count} active enrollment(s).` });
        }
        await dbAsync.run(`DELETE FROM courses WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete course.' });
    }
};

exports.toggleCoursePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await dbAsync.get(`SELECT is_published FROM courses WHERE id = ?`, [id]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

        const newStatus = course.is_published === 1 ? 0 : 1;
        await dbAsync.run(`UPDATE courses SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newStatus, id]);

        res.json({ success: true, message: `Course ${newStatus === 1 ? 'published' : 'unpublished'}.`, is_published: newStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to toggle course status.' });
    }
};

// ==========================================
// 6. CATEGORIES CRUD
// ==========================================

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, icon, type, color, order_num, status } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Category Name is required.' });
        }
        const finalSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const result = await dbAsync.run(
            `INSERT INTO categories (name, slug, icon, type, color, order_num, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), finalSlug, icon || 'bi-folder', type || 'Major Category', color || '#2563EB', order_num || 0, status || 'Active']
        );
        res.status(201).json({ success: true, message: 'Category created successfully.', id: result.lastID, data: { id: result.lastID } });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Failed to create category.' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const assignedCourses = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE category_id = ?`, [id]);
        if (assignedCourses && assignedCourses.count > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete category: assigned to ${assignedCourses.count} courses.` });
        }
        await dbAsync.run(`DELETE FROM categories WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete category.' });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await dbAsync.all(`
            SELECT c.*, 
                (SELECT COUNT(*) FROM courses WHERE category_id = c.id) as course_count,
                (SELECT COUNT(*) FROM programs WHERE category_id = c.id) as program_count
            FROM categories c
            ORDER BY c.order_num ASC, c.name ASC
        `);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await dbAsync.get(`SELECT * FROM categories WHERE id = ?`, [id]);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch category details.' });
    }
};

exports.getProgramById = async (req, res) => {
    try {
        const { id } = req.params;
        const program = await dbAsync.get(`SELECT * FROM programs WHERE id = ?`, [id]);
        if (!program) {
            return res.status(404).json({ success: false, message: 'Program not found.' });
        }
        res.json({ success: true, data: program });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch program details.' });
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
        const {
            title, code, slug, degree_type, category_id, duration, credits,
            short_description, description, full_description, image_url, logo_url,
            learning_outcomes, instructor_ids, status, is_featured, is_published,
            icon_class, theme_class, detail_url, order_num
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Program title is required.' });
        }

        const programCode = (code || '').trim();
        let finalSlug = slug || (programCode ? programCode.toLowerCase() : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));

        // Check for duplicate program code
        if (programCode) {
            const existing = await dbAsync.get(
                `SELECT id FROM programs WHERE LOWER(code) = LOWER(?)`,
                [programCode]
            );
            if (existing) {
                return res.status(409).json({ success: false, message: 'An academic program with this code already exists.', field: 'programCode' });
            }
        }

        // Check for duplicate slug and make unique if needed
        const existingSlug = await dbAsync.get(
            `SELECT id FROM programs WHERE LOWER(slug) = LOWER(?)`,
            [finalSlug]
        );
        if (existingSlug) {
            if (programCode) {
                finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
            } else {
                finalSlug = `${finalSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
        }

        const outcomesJson = Array.isArray(learning_outcomes) ? JSON.stringify(learning_outcomes) : (typeof learning_outcomes === 'string' ? learning_outcomes : '[]');
        const instructorsJson = Array.isArray(instructor_ids) ? JSON.stringify(instructor_ids) : (typeof instructor_ids === 'string' ? instructor_ids : '[]');

        const finalStatus = status || (is_published === 0 || is_published === false ? 'Draft' : 'Published');
        const publishedFlag = finalStatus === 'Draft' ? 0 : 1;
        const featuredFlag = is_featured === true || is_featured === 1 || is_featured === '1' ? 1 : 0;
        const finalDesc = description || full_description || short_description || title;

        const result = await dbAsync.run(
            `INSERT INTO programs (
                title, code, slug, degree_type, category_id, duration, credits,
                short_description, description, image_url, logo_url, learning_outcomes,
                instructor_ids, status, is_featured, is_published,
                icon_class, theme_class, detail_url, order_num
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                programCode,
                finalSlug,
                degree_type || "Bachelor's Degree",
                category_id ? Number(category_id) : null,
                duration || '4 Years',
                credits ? Number(credits) : 120,
                short_description || '',
                finalDesc,
                image_url || '',
                logo_url || '',
                outcomesJson,
                instructorsJson,
                finalStatus,
                featuredFlag,
                publishedFlag,
                icon_class || 'bi-mortarboard',
                theme_class || 'theme-blue',
                detail_url || '#',
                order_num || 0
            ]
        );

        const createdProgram = await dbAsync.get(`SELECT * FROM programs WHERE id = ?`, [result.lastID]);

        res.json({
            success: true,
            message: 'Program created successfully.',
            id: result.lastID,
            data: createdProgram
        });
    } catch (error) {
        console.error('Create program error:', error);
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ success: false, message: 'An academic program with this code or title already exists.' });
        }
        res.status(500).json({ success: false, message: 'Unable to create program. Please try again.' });
    }
};

exports.updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, code, slug, degree_type, category_id, duration, credits,
            short_description, description, full_description, image_url, logo_url,
            learning_outcomes, instructor_ids, status, is_featured, is_published,
            icon_class, theme_class, detail_url, order_num
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Program title is required.' });
        }

        const programCode = (code || '').trim();
        if (programCode) {
            const existing = await dbAsync.get(
                `SELECT id FROM programs WHERE LOWER(code) = LOWER(?) AND id != ?`,
                [programCode, id]
            );
            if (existing) {
                return res.status(409).json({ success: false, message: 'An academic program with this code already exists.', field: 'programCode' });
            }
        }

        const outcomesJson = Array.isArray(learning_outcomes) ? JSON.stringify(learning_outcomes) : (typeof learning_outcomes === 'string' ? learning_outcomes : '[]');
        const instructorsJson = Array.isArray(instructor_ids) ? JSON.stringify(instructor_ids) : (typeof instructor_ids === 'string' ? instructor_ids : '[]');
        const finalStatus = status || (is_published === 0 || is_published === false ? 'Draft' : 'Published');
        const publishedFlag = finalStatus === 'Draft' ? 0 : 1;
        const featuredFlag = is_featured === true || is_featured === 1 || is_featured === '1' ? 1 : 0;
        const finalDesc = description || full_description || short_description || title;

        await dbAsync.run(
            `UPDATE programs
             SET title = ?, code = ?, slug = ?, degree_type = ?, category_id = ?,
                 duration = ?, credits = ?, short_description = ?, description = ?,
                 image_url = ?, logo_url = ?, learning_outcomes = ?, instructor_ids = ?, status = ?,
                 icon_class = ?, theme_class = ?, detail_url = ?, order_num = ?,
                 is_featured = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                title.trim(), programCode, slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), degree_type || "Bachelor's Degree", category_id ? Number(category_id) : null,
                duration || '4 Years', credits ? Number(credits) : 120, short_description || '', finalDesc,
                image_url || '', logo_url || '', outcomesJson, instructorsJson, finalStatus,
                icon_class || 'bi-mortarboard', theme_class || 'theme-blue', detail_url || '#', order_num || 0,
                featuredFlag, publishedFlag, id
            ]
        );

        const updatedProgram = await dbAsync.get(`SELECT * FROM programs WHERE id = ?`, [id]);

        res.json({ success: true, message: 'Program updated successfully.', data: updatedProgram });
    } catch (error) {
        console.error('Update program error:', error);
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ success: false, message: 'An academic program with this code or title already exists.' });
        }
        res.status(500).json({ success: false, message: 'Failed to update program.' });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const assignedStudents = await dbAsync.get(`SELECT COUNT(*) as count FROM users WHERE major_id = ?`, [id]);
        if (assignedStudents && assignedStudents.count > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete program: assigned to ${assignedStudents.count} enrolled student(s).` });
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

exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await dbAsync.all(`SELECT * FROM instructors ORDER BY id ASC`);
        res.json({ success: true, data: instructors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch instructors.' });
    }
};

exports.getInstructorById = async (req, res) => {
    try {
        const { id } = req.params;
        const instructor = await dbAsync.get(`SELECT * FROM instructors WHERE id = ?`, [id]);
        if (!instructor) {
            return res.status(404).json({ success: false, message: 'Instructor not found.' });
        }
        res.json({ success: true, data: instructor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch instructor details.' });
    }
};

exports.createInstructor = async (req, res) => {
    try {
        const { name, title, bio, avatar_url, email, phone, expertise, department, faculty, status } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Instructor Name is required.' });
        }
        const result = await dbAsync.run(
            `INSERT INTO instructors (name, title, bio, avatar_url, email, phone, expertise, department, faculty, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name.trim(), title || 'Lecturer', bio || '', avatar_url || 'assets/images/instructors/default.jpg', email || '', phone || '', expertise || '', department || '', faculty || '', status || 'Active']
        );
        res.status(201).json({ success: true, message: 'Instructor created successfully.', id: result.lastID, data: { id: result.lastID } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create instructor.' });
    }
};

exports.deleteInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const assignedCourses = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE instructor_id = ?`, [id]);
        if (assignedCourses && assignedCourses.count > 0) {
            return res.status(400).json({ success: false, message: `This instructor is assigned to ${assignedCourses.count} course(s) and cannot be deleted.` });
        }
        await dbAsync.run(`DELETE FROM instructors WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Instructor deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete instructor.' });
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

exports.createUser = async (req, res) => {
    try {
        const { full_name, email, university_id, role_id, major_id, initial_course_id, password, phone, status } = req.body;
        if (!full_name || !email || !university_id) {
            return res.status(400).json({ success: false, message: 'Full name, email, and university ID are required.' });
        }

        const existingEmail = await dbAsync.get(`SELECT id FROM users WHERE LOWER(email) = LOWER(?)`, [email.trim()]);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
        }

        const existingUid = await dbAsync.get(`SELECT id FROM users WHERE university_id = ?`, [university_id.trim()]);
        if (existingUid) {
            return res.status(400).json({ success: false, message: 'A user with this University ID already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password || 'Aub@2026', 10);
        const result = await dbAsync.run(
            `INSERT INTO users (full_name, email, university_id, role_id, major_id, password_hash, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name.trim(), email.trim(), university_id.trim(), role_id || 3, major_id || null, hashedPassword, phone || '', status || 'Active']
        );

        const newUserId = result.lastID;

        // Auto-enroll if initial_course_id provided
        if (initial_course_id) {
            await dbAsync.run(
                `INSERT OR IGNORE INTO enrollments (user_id, course_id, enrollment_date, status, progress_percentage)
                 VALUES (?, ?, CURRENT_TIMESTAMP, 'Active', 0)`,
                [newUserId, initial_course_id]
            );
        }

        res.status(201).json({ success: true, message: 'User created successfully.', id: newUserId, data: { id: newUserId } });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if teacher has assigned courses
        const assignedCourses = await dbAsync.get(
            `SELECT COUNT(*) as count FROM courses WHERE instructor_id = (SELECT id FROM instructors WHERE email = (SELECT email FROM users WHERE id = ?)) OR instructor_id = ?`,
            [id, id]
        );
        if (assignedCourses && assignedCourses.count > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete user: assigned as instructor to ${assignedCourses.count} course(s).` });
        }

        await dbAsync.run(`DELETE FROM users WHERE id = ?`, [id]);
        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete user.' });
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