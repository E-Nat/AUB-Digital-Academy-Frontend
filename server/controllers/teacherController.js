const bcrypt = require('bcryptjs');
const { dbAsync } = require('../db/database');

/**
 * 1. GET /api/teachers
 * Paginated teacher list with dynamic search and filtering
 */
exports.getTeachers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const size = Math.max(1, Math.min(100, parseInt(req.query.size) || 10));
        const offset = (page - 1) * size;

        const search = req.query.search ? req.query.search.trim() : '';
        const department = req.query.department ? req.query.department.trim() : '';
        const status = req.query.status ? req.query.status.trim() : '';
        const employmentType = req.query.employment_type ? req.query.employment_type.trim() : '';
        const includeDeleted = req.query.include_deleted === 'true';

        let whereClause = "WHERE u.role_id = 2";
        const params = [];

        if (!includeDeleted) {
            whereClause += " AND t.deleted_at IS NULL";
        }

        if (search) {
            whereClause += ` AND (
                u.full_name LIKE ? OR 
                u.email LIKE ? OR 
                t.teacher_code LIKE ? OR 
                t.specialization LIKE ?
            )`;
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        if (department) {
            if (!isNaN(department)) {
                whereClause += " AND t.department_id = ?";
                params.push(parseInt(department));
            } else {
                whereClause += " AND (d.code = ? OR d.name LIKE ?)";
                params.push(department.toUpperCase(), `%${department}%`);
            }
        }

        if (status && status !== 'ALL') {
            whereClause += " AND t.status = ?";
            params.push(status);
        }

        if (employmentType) {
            whereClause += " AND t.employment_type = ?";
            params.push(employmentType);
        }

        // Count Total Matching
        const countSql = `
            SELECT COUNT(DISTINCT t.id) as total
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            ${whereClause}
        `;
        const countRow = await dbAsync.get(countSql, params);
        const total = countRow ? countRow.total : 0;
        const totalPages = Math.ceil(total / size) || 1;

        // Fetch Paginated Teachers
        const querySql = `
            SELECT 
                t.id as teacher_id,
                t.user_id,
                t.teacher_code,
                t.specialization,
                t.employment_type,
                t.experience_years,
                t.office_room,
                t.phone,
                t.status,
                t.created_at,
                t.deleted_at,
                u.full_name,
                u.email,
                u.avatar_url,
                d.id as department_id,
                d.name as department_name,
                d.code as department_code,
                (SELECT COUNT(*) FROM teacher_courses tc WHERE tc.teacher_id = u.id) as total_courses,
                (SELECT COUNT(*) FROM classes cl WHERE cl.teacher_id = u.id) as total_classes,
                (
                    SELECT COUNT(DISTINCT ce.student_id) 
                    FROM class_enrollments ce 
                    JOIN classes cl ON ce.class_id = cl.id 
                    WHERE cl.teacher_id = u.id
                ) as total_students
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            ${whereClause}
            ORDER BY t.created_at DESC, u.full_name ASC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, size, offset];
        const teachers = await dbAsync.all(querySql, queryParams);

        // Fetch assigned courses list for each teacher in view
        for (const teacher of teachers) {
            teacher.courses = await dbAsync.all(`
                SELECT c.id, c.title, c.slug, c.difficulty
                FROM teacher_courses tc
                JOIN courses c ON tc.course_id = c.id
                WHERE tc.teacher_id = ?
            `, [teacher.user_id]);
        }

        res.json({
            success: true,
            data: teachers,
            pagination: {
                page,
                size,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error('getTeachers error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve teachers list.' });
    }
};

/**
 * 2. GET /api/teachers/:id
 * Retrieve comprehensive teacher profile
 */
exports.getTeacherById = async (req, res) => {
    try {
        const id = req.params.id;

        const teacher = await dbAsync.get(`
            SELECT 
                t.*,
                u.full_name,
                u.email,
                u.avatar_url,
                d.name as department_name,
                d.code as department_code
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            WHERE t.id = ? OR t.user_id = ?
        `, [id, id]);

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
        }

        // Assigned Courses
        teacher.courses = await dbAsync.all(`
            SELECT c.id, c.title, c.slug, c.duration_hours, c.difficulty, cat.name as category_name
            FROM teacher_courses tc
            JOIN courses c ON tc.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE tc.teacher_id = ?
        `, [teacher.user_id]);

        // Active Classes
        teacher.classes = await dbAsync.all(`
            SELECT cl.*, c.title as course_title,
                (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = cl.id) as enrolled_students
            FROM classes cl
            JOIN courses c ON cl.course_id = c.id
            WHERE cl.teacher_id = ?
            ORDER BY cl.created_at DESC
        `, [teacher.user_id]);

        // Assignments Count
        teacher.assignments = await dbAsync.all(`
            SELECT a.*, c.title as course_title,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) as total_submissions
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.teacher_id = ?
            ORDER BY a.due_date DESC
            LIMIT 5
        `, [teacher.user_id]);

        // Total Students
        const studentCountRow = await dbAsync.get(`
            SELECT COUNT(DISTINCT ce.student_id) as count
            FROM class_enrollments ce
            JOIN classes cl ON ce.class_id = cl.id
            WHERE cl.teacher_id = ?
        `, [teacher.user_id]);
        teacher.total_students = studentCountRow ? studentCountRow.count : 0;

        res.json({ success: true, data: teacher });
    } catch (err) {
        console.error('getTeacherById error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve teacher details.' });
    }
};

/**
 * 3. POST /api/teachers
 * Create teacher account and profile
 */
exports.createTeacher = async (req, res) => {
    try {
        const {
            full_name,
            email,
            password = 'password123',
            teacher_code,
            department_id,
            specialization = '',
            employment_type = 'Full-Time',
            experience_years = 0,
            bio = '',
            office_room = '',
            phone = '',
            status = 'Active',
            avatar_url = '',
            course_ids = []
        } = req.body;

        if (!full_name || !email) {
            return res.status(400).json({ success: false, message: 'Full name and email are required.' });
        }

        // Check if email already exists
        const existingUser = await dbAsync.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
        }

        // Generate teacher code if not provided
        let code = teacher_code;
        if (!code) {
            const countRow = await dbAsync.get('SELECT COUNT(*) as count FROM teachers');
            const num = (countRow ? countRow.count : 0) + 1;
            code = `TCH-${String(num).padStart(3, '0')}`;
        } else {
            const existingCode = await dbAsync.get('SELECT id FROM teachers WHERE teacher_code = ?', [code]);
            if (existingCode) {
                return res.status(400).json({ success: false, message: 'Teacher Code already in use. Please use a unique code.' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const avatar = avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150`;

        // 1. Create User
        const userRes = await dbAsync.run(`
            INSERT INTO users (full_name, email, university_id, password_hash, role_id, avatar_url, status)
            VALUES (?, ?, ?, ?, 2, ?, ?)
        `, [full_name, email, code, passwordHash, avatar, status]);

        const userId = userRes.lastID;

        // 2. Create Teacher Profile
        const teacherRes = await dbAsync.run(`
            INSERT INTO teachers (
                user_id, teacher_code, department_id, specialization, employment_type,
                experience_years, bio, office_room, phone, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId,
            code,
            department_id || null,
            specialization,
            employment_type,
            experience_years || 0,
            bio,
            office_room,
            phone,
            status
        ]);

        // 3. Assign Courses if provided
        if (Array.isArray(course_ids) && course_ids.length > 0) {
            for (const courseId of course_ids) {
                await dbAsync.run(`
                    INSERT OR IGNORE INTO teacher_courses (teacher_id, course_id) VALUES (?, ?)
                `, [userId, courseId]);
            }
        }

        const newTeacher = await dbAsync.get(`
            SELECT 
                t.*, u.full_name, u.email, u.avatar_url, d.name as department_name, d.code as department_code
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            WHERE t.id = ?
        `, [teacherRes.lastID]);

        res.status(201).json({
            success: true,
            message: 'Teacher profile created successfully!',
            data: newTeacher
        });
    } catch (err) {
        console.error('createTeacher error:', err);
        res.status(500).json({ success: false, message: 'Failed to create teacher.' });
    }
};

/**
 * 4. PUT /api/teachers/:id
 * Update teacher profile and relationships
 */
exports.updateTeacher = async (req, res) => {
    try {
        const id = req.params.id;

        const teacher = await dbAsync.get('SELECT * FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
        }

        const {
            full_name,
            email,
            teacher_code,
            department_id,
            specialization,
            employment_type,
            experience_years,
            bio,
            office_room,
            phone,
            status,
            avatar_url,
            course_ids
        } = req.body;

        // Check email uniqueness if modified
        if (email) {
            const existing = await dbAsync.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, teacher.user_id]);
            if (existing) {
                return res.status(400).json({ success: false, message: 'Another user is already using this email.' });
            }
        }

        // Check code uniqueness if modified
        if (teacher_code && teacher_code !== teacher.teacher_code) {
            const existingCode = await dbAsync.get('SELECT id FROM teachers WHERE teacher_code = ? AND id != ?', [teacher_code, teacher.id]);
            if (existingCode) {
                return res.status(400).json({ success: false, message: 'Teacher code already in use.' });
            }
        }

        // Update User
        await dbAsync.run(`
            UPDATE users SET
                full_name = COALESCE(?, full_name),
                email = COALESCE(?, email),
                university_id = COALESCE(?, university_id),
                avatar_url = COALESCE(?, avatar_url),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            full_name || null,
            email || null,
            teacher_code || null,
            avatar_url || null,
            status || null,
            teacher.user_id
        ]);

        // Update Teacher Profile
        await dbAsync.run(`
            UPDATE teachers SET
                teacher_code = COALESCE(?, teacher_code),
                department_id = COALESCE(?, department_id),
                specialization = COALESCE(?, specialization),
                employment_type = COALESCE(?, employment_type),
                experience_years = COALESCE(?, experience_years),
                bio = COALESCE(?, bio),
                office_room = COALESCE(?, office_room),
                phone = COALESCE(?, phone),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            teacher_code || null,
            department_id !== undefined ? department_id : null,
            specialization !== undefined ? specialization : null,
            employment_type || null,
            experience_years !== undefined ? experience_years : null,
            bio !== undefined ? bio : null,
            office_room !== undefined ? office_room : null,
            phone !== undefined ? phone : null,
            status || null,
            teacher.id
        ]);

        // Update Assigned Courses if explicitly provided
        if (Array.isArray(course_ids)) {
            await dbAsync.run('DELETE FROM teacher_courses WHERE teacher_id = ?', [teacher.user_id]);
            for (const courseId of course_ids) {
                await dbAsync.run(
                    'INSERT OR IGNORE INTO teacher_courses (teacher_id, course_id) VALUES (?, ?)',
                    [teacher.user_id, courseId]
                );
            }
        }

        const updated = await dbAsync.get(`
            SELECT 
                t.*, u.full_name, u.email, u.avatar_url, d.name as department_name, d.code as department_code
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            WHERE t.id = ?
        `, [teacher.id]);

        res.json({
            success: true,
            message: 'Teacher profile updated successfully!',
            data: updated
        });
    } catch (err) {
        console.error('updateTeacher error:', err);
        res.status(500).json({ success: false, message: 'Failed to update teacher.' });
    }
};

/**
 * 5. DELETE /api/teachers/:id
 * Safe / Soft deletion preserving all academic histories
 */
exports.deleteTeacher = async (req, res) => {
    try {
        const id = req.params.id;

        const teacher = await dbAsync.get('SELECT * FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
        }

        // Soft deletion: Mark status as Inactive and record deleted_at timestamp
        await dbAsync.run(`
            UPDATE teachers SET
                status = 'Inactive',
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [teacher.id]);

        await dbAsync.run(`
            UPDATE users SET
                status = 'Inactive',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [teacher.user_id]);

        res.json({
            success: true,
            message: 'Teacher account deactivated and archived successfully. Historical academic records have been preserved.'
        });
    } catch (err) {
        console.error('deleteTeacher error:', err);
        res.status(500).json({ success: false, message: 'Failed to deactivate teacher.' });
    }
};

/**
 * 6. GET /api/teachers/:id/courses
 */
exports.getTeacherCourses = async (req, res) => {
    try {
        const id = req.params.id;
        const teacher = await dbAsync.get('SELECT user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        const userId = teacher ? teacher.user_id : id;

        const courses = await dbAsync.all(`
            SELECT c.*, cat.name as category_name, tc.assigned_at
            FROM teacher_courses tc
            JOIN courses c ON tc.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE tc.teacher_id = ?
            ORDER BY c.title ASC
        `, [userId]);

        res.json({ success: true, data: courses });
    } catch (err) {
        console.error('getTeacherCourses error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve teacher courses.' });
    }
};

/**
 * 7. GET /api/teachers/:id/students
 * Determines students taught by teacher through Teacher -> Class -> Enrollment -> Student
 */
exports.getTeacherStudents = async (req, res) => {
    try {
        const id = req.params.id;
        const teacher = await dbAsync.get('SELECT user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        const userId = teacher ? teacher.user_id : id;

        const students = await dbAsync.all(`
            SELECT DISTINCT 
                u.id as student_id,
                u.full_name,
                u.email,
                u.university_id,
                u.avatar_url,
                cl.id as class_id,
                cl.class_name,
                c.title as course_title,
                ce.enrolled_at,
                ce.status as enrollment_status
            FROM class_enrollments ce
            JOIN classes cl ON ce.class_id = cl.id
            JOIN users u ON ce.student_id = u.id
            JOIN courses c ON cl.course_id = c.id
            WHERE cl.teacher_id = ?
            ORDER BY u.full_name ASC
        `, [userId]);

        res.json({ success: true, data: students });
    } catch (err) {
        console.error('getTeacherStudents error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve students taught by this teacher.' });
    }
};

/**
 * 8. GET /api/teachers/:id/classes
 */
exports.getTeacherClasses = async (req, res) => {
    try {
        const id = req.params.id;
        const teacher = await dbAsync.get('SELECT user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        const userId = teacher ? teacher.user_id : id;

        const classes = await dbAsync.all(`
            SELECT 
                cl.*,
                c.title as course_title,
                c.slug as course_slug,
                (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = cl.id) as student_count
            FROM classes cl
            JOIN courses c ON cl.course_id = c.id
            WHERE cl.teacher_id = ?
            ORDER BY cl.start_date DESC, cl.created_at DESC
        `, [userId]);

        res.json({ success: true, data: classes });
    } catch (err) {
        console.error('getTeacherClasses error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve teacher classes.' });
    }
};

/**
 * 9. GET /api/teachers/:id/assignments
 */
exports.getTeacherAssignments = async (req, res) => {
    try {
        const id = req.params.id;
        const teacher = await dbAsync.get('SELECT user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        const userId = teacher ? teacher.user_id : id;

        const assignments = await dbAsync.all(`
            SELECT 
                a.*,
                c.title as course_title,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) as total_submissions,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id AND sub.status = 'Graded') as graded_submissions
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.teacher_id = ?
            ORDER BY a.due_date DESC
        `, [userId]);

        res.json({ success: true, data: assignments });
    } catch (err) {
        console.error('getTeacherAssignments error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve assignments.' });
    }
};

/**
 * 10. GET /api/teachers/statistics
 * Comprehensive real-time statistical aggregation
 */
exports.getTeacherStatistics = async (req, res) => {
    try {
        const totalRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers WHERE deleted_at IS NULL
        `);
        const activeRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers WHERE status = 'Active' AND deleted_at IS NULL
        `);
        const inactiveRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers WHERE status = 'Inactive' OR deleted_at IS NOT NULL
        `);
        const onLeaveRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers WHERE status = 'On Leave' AND deleted_at IS NULL
        `);

        // New teachers this month
        const newThisMonthRow = await dbAsync.get(`
            SELECT COUNT(*) as count FROM teachers 
            WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') 
            AND deleted_at IS NULL
        `);

        // Teachers by Department
        const byDepartment = await dbAsync.all(`
            SELECT 
                d.id, d.name, d.code,
                COUNT(t.id) as teacher_count
            FROM departments d
            LEFT JOIN teachers t ON t.department_id = d.id AND t.deleted_at IS NULL
            GROUP BY d.id, d.name, d.code
            ORDER BY teacher_count DESC, d.name ASC
        `);

        // Teachers by Employment Type
        const byEmploymentType = await dbAsync.all(`
            SELECT 
                t.employment_type,
                COUNT(t.id) as count
            FROM teachers t
            WHERE t.deleted_at IS NULL
            GROUP BY t.employment_type
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: {
                totalTeachers: totalRow ? totalRow.count : 0,
                activeTeachers: activeRow ? activeRow.count : 0,
                inactiveTeachers: inactiveRow ? inactiveRow.count : 0,
                teachersOnLeave: onLeaveRow ? onLeaveRow.count : 0,
                newTeachersThisMonth: newThisMonthRow ? newThisMonthRow.count : 0,
                byDepartment,
                byEmploymentType
            }
        });
    } catch (err) {
        console.error('getTeacherStatistics error:', err);
        res.status(500).json({ success: false, message: 'Failed to calculate teacher statistics.' });
    }
};

/**
 * 11. GET /api/departments
 */
exports.getDepartments = async (req, res) => {
    try {
        const departments = await dbAsync.all(`
            SELECT d.*, (SELECT COUNT(*) FROM teachers t WHERE t.department_id = d.id AND t.deleted_at IS NULL) as teacher_count
            FROM departments d
            ORDER BY d.name ASC
        `);
        res.json({ success: true, data: departments });
    } catch (err) {
        console.error('getDepartments error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve departments.' });
    }
};

/**
 * 12. POST /api/teachers/:id/assign-course
 */
exports.assignCourse = async (req, res) => {
    try {
        const id = req.params.id;
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ success: false, message: 'Course ID is required.' });
        }

        const teacher = await dbAsync.get('SELECT user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found.' });
        }

        await dbAsync.run(`
            INSERT OR IGNORE INTO teacher_courses (teacher_id, course_id) VALUES (?, ?)
        `, [teacher.user_id, course_id]);

        res.json({ success: true, message: 'Course assigned to teacher successfully!' });
    } catch (err) {
        console.error('assignCourse error:', err);
        res.status(500).json({ success: false, message: 'Failed to assign course.' });
    }
};
