const bcrypt = require('bcryptjs');
const { dbAsync } = require('../db/database');

// ==========================================
// 1. DASHBOARD METRICS & STATS (Calculated dynamically)
// ==========================================

exports.getDashboardMetrics = async (req, res) => {
    try {
        const totalUsersRow = await dbAsync.get(`SELECT COUNT(*) as count FROM users`);
        const totalCoursesRow = await dbAsync.get(`SELECT COUNT(*) as count FROM courses WHERE is_published = 1`);
        const totalStudentsRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name = 'STUDENT'
        `);
        const totalTeachersRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers WHERE deleted_at IS NULL
        `);
        const newTeachersThisMonthRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers 
            WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') 
            AND deleted_at IS NULL
        `);
        const totalChaptersRow = await dbAsync.get(`SELECT COUNT(*) as count FROM modules`);
        const totalEnrollmentsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments`);

        res.json({
            success: true,
            data: {
                totalUsers: totalUsersRow ? totalUsersRow.count : 0,
                totalCourses: totalCoursesRow ? totalCoursesRow.count : 0,
                totalStudents: totalStudentsRow ? totalStudentsRow.count : 0,
                totalTeachers: totalTeachersRow ? totalTeachersRow.count : 0,
                newTeachersThisMonth: newTeachersThisMonthRow ? newTeachersThisMonthRow.count : 0,
                totalChapters: totalChaptersRow ? totalChaptersRow.count : 0,
                totalEnrollments: totalEnrollmentsRow ? totalEnrollmentsRow.count : 0
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

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required.' });
        }

        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const result = await dbAsync.run(
            `INSERT INTO programs (title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                finalSlug,
                degree_type || 'BACHELOR DEGREE',
                duration || '4 Years',
                description,
                icon_class || 'bi-laptop',
                theme_class || 'theme-blue',
                detail_url || '#',
                order_num || 0,
                is_featured !== undefined ? is_featured : 1,
                is_published !== undefined ? is_published : 1
            ]
        );

        res.json({ success: true, message: 'Program created successfully.', id: result.lastID });
    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({ success: false, message: 'Failed to create program.' });
    }
};

exports.updateProgram = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published } = req.body;

        await dbAsync.run(
            `UPDATE programs
             SET title = ?, slug = ?, degree_type = ?, duration = ?, description = ?,
                 icon_class = ?, theme_class = ?, detail_url = ?, order_num = ?,
                 is_featured = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published, id]
        );

        res.json({ success: true, message: 'Program updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update program.' });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        const { id } = req.params;
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
        res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, badge_text, order_num, is_popular, is_published } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required.' });
        }

        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const result = await dbAsync.run(
            `INSERT INTO courses (title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, badge_text, order_num, is_popular, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                finalSlug,
                description,
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

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await dbAsync.all(`SELECT * FROM categories ORDER BY order_num ASC, name ASC`);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, icon, type, order_num } = req.body;
        const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const result = await dbAsync.run(
            `INSERT INTO categories (name, slug, icon, type, order_num) VALUES (?, ?, ?, ?, ?)`,
            [name, finalSlug, icon || 'bi-tag', type || 'general', order_num || 0]
        );
        res.json({ success: true, message: 'Category created.', id: result.lastID });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create category.' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await dbAsync.run(`DELETE FROM categories WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Category deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete category.' });
    }
};

// ==========================================
// 7. INSTRUCTORS CRUD
// ==========================================

exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await dbAsync.all(`SELECT * FROM instructors ORDER BY id ASC`);
        res.json({ success: true, data: instructors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch instructors.' });
    }
};

exports.createInstructor = async (req, res) => {
    try {
        const { name, title, bio, avatar_url, email, expertise } = req.body;
        const result = await dbAsync.run(
            `INSERT INTO instructors (name, title, bio, avatar_url, email, expertise)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, title, bio, avatar_url || '', email || '', expertise || '']
        );
        res.json({ success: true, message: 'Instructor created.', id: result.lastID });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create instructor.' });
    }
};

exports.deleteInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        await dbAsync.run(`DELETE FROM instructors WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Instructor deleted.' });
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
                u.two_factor_enabled, u.email_verified, u.last_login_at,
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
                u.two_factor_enabled, u.email_verified, u.last_login_at,
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
            semester = 'Semester 1', enrollment_status = 'Full-Time', avatar_url = ''
        } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ success: false, message: 'Full name and email are required.' });
        }

        // Check duplicates
        const existingEmail = await dbAsync.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email address already exists.' });
        }

        if (university_id) {
            const existingUni = await dbAsync.get('SELECT id FROM users WHERE university_id = ?', [university_id]);
            if (existingUni) {
                return res.status(400).json({ success: false, message: 'University ID is already assigned.' });
            }
        }

        const password_hash = bcrypt.hashSync(password, 10);
        const avatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`;

        const result = await dbAsync.run(
            `INSERT INTO users (
                full_name, email, university_id, password_hash, role_id, major_id, avatar_url, status,
                phone, faculty, department_name, position, academic_year, semester, enrollment_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_name, email, university_id || null, password_hash, role_id, major_id || null, avatar, status,
                phone, faculty, department_name, position, academic_year, semester, enrollment_status
            ]
        );

        const newUserId = result.lastID;

        // If Role is Teacher, create corresponding teacher profile record
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
        }

        // Record Activity Log
        await dbAsync.run(`
            INSERT INTO user_activity_logs (user_id, action, details, performed_by)
            VALUES (?, 'Account Created', ?, ?)
        `, [newUserId, `Account created with role ${parseInt(role_id) === 1 ? 'ADMIN' : parseInt(role_id) === 2 ? 'TEACHER' : 'STUDENT'}`, req.user ? req.user.id : null]);

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
            phone, faculty, department_name, position, academic_year, semester, enrollment_status, major_id
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
                return res.status(400).json({ success: false, message: 'University ID is already assigned to another user.' });
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
                major_id = COALESCE(?, major_id),
                password_hash = ?,
                updated_at = CURRENT_TIMESTAMP
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
                major_id !== undefined ? major_id : null,
                password_hash,
                id
            ]
        );

        // Check role change
        if (role_id && role_id !== currentUser.role_id) {
            const oldRole = currentUser.role_id === 1 ? 'ADMIN' : currentUser.role_id === 2 ? 'TEACHER' : 'STUDENT';
            const newRole = parseInt(role_id) === 1 ? 'ADMIN' : parseInt(role_id) === 2 ? 'TEACHER' : 'STUDENT';
            await dbAsync.run(`
                INSERT INTO user_activity_logs (user_id, action, details, performed_by)
                VALUES (?, 'Role Changed', ?, ?)
            `, [id, `Role changed from ${oldRole} to ${newRole}`, req.user ? req.user.id : null]);
        }

        // Check status change
        if (status && status !== currentUser.status) {
            await dbAsync.run(`
                INSERT INTO user_activity_logs (user_id, action, details, performed_by)
                VALUES (?, 'Status Updated', ?, ?)
            `, [id, `Account status changed to ${status}`, req.user ? req.user.id : null]);
        }

        // Log Profile update
        await dbAsync.run(`
            INSERT INTO user_activity_logs (user_id, action, details, performed_by)
            VALUES (?, 'Profile Updated', 'User profile information updated by administrator', ?)
        `, [id, req.user ? req.user.id : null]);

        res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
        }
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
            SELECT e.*, u.full_name as student_name, u.university_id as student_id, u.email as student_email,
                   c.title as course_title, p.title as program_title
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN programs p ON e.program_id = p.id
            ORDER BY e.enrollment_date DESC
        `);
        res.json({ success: true, data: enrollments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch enrollments.' });
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
        await dbAsync.run(`DELETE FROM enrollments WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Enrollment deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete enrollment.' });
    }
};
