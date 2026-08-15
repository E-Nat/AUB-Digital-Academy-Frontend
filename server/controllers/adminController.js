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
            SELECT COUNT(*) as count FROM instructors
        `);
        const totalChaptersRow = await dbAsync.get(`SELECT COUNT(*) as count FROM modules`);
        const totalEnrollmentsRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments`);

        res.json({
            success: true,
            data: {
                totalUsers: totalUsersRow.count,
                totalCourses: totalCoursesRow.count,
                totalStudents: totalStudentsRow.count,
                totalTeachers: totalTeachersRow.count,
                totalChapters: totalChaptersRow.count,
                totalEnrollments: totalEnrollmentsRow.count
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
            SELECT u.id, u.full_name, u.email, u.university_id, u.avatar_url, u.status, u.created_at,
                   r.name as role, r.id as role_id, p.title as major_title
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN programs p ON u.major_id = p.id
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { full_name, email, university_id, password, role_id, major_id, status } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
        }

        const password_hash = bcrypt.hashSync(password, 10);
        const result = await dbAsync.run(
            `INSERT INTO users (full_name, email, university_id, password_hash, role_id, major_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, university_id || null, password_hash, role_id || 3, major_id || null, status || 'Active']
        );

        res.json({ success: true, message: 'User created successfully.', id: result.lastID });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user. Email or University ID might already exist.' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, university_id, role_id, status, password } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ success: false, message: 'Full name and email are required.' });
        }

        if (password && password.trim()) {
            const password_hash = bcrypt.hashSync(password, 10);
            await dbAsync.run(
                `UPDATE users
                 SET full_name = ?, email = ?, university_id = ?, role_id = ?, status = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [full_name, email, university_id || null, role_id || 3, status || 'Active', password_hash, id]
            );
        } else {
            await dbAsync.run(
                `UPDATE users
                 SET full_name = ?, email = ?, university_id = ?, role_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [full_name, email, university_id || null, role_id || 3, status || 'Active', id]
            );
        }

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
        res.status(500).json({ success: false, message: 'Failed to delete user.' });
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
