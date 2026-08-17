const { dbAsync } = require('../db/database');

/**
 * Get courses taught by the logged-in teacher
 */
exports.getTeacherCourses = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        // Find instructor record or return all active courses
        const teacher = await dbAsync.get('SELECT full_name, email FROM users WHERE id = ?', [userId]);
        
        let courses = [];
        if (teacher) {
            // Check if matched by instructor name
            courses = await dbAsync.all(`
                SELECT c.id, c.title, c.slug, c.difficulty, c.duration_hours, c.lesson_count, cat.name as category_name
                FROM courses c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN instructors i ON c.instructor_id = i.id
                WHERE i.name LIKE ? OR i.email = ? OR ? = 1
                ORDER BY c.title ASC
            `, [`%${teacher.full_name}%`, teacher.email, req.user?.role_id === 1 ? 1 : 0]);
        }

        if (courses.length === 0) {
            // Fallback: Return published courses
            courses = await dbAsync.all(`
                SELECT c.id, c.title, c.slug, c.difficulty, c.duration_hours, c.lesson_count, cat.name as category_name
                FROM courses c
                LEFT JOIN categories cat ON c.category_id = cat.id
                ORDER BY c.title ASC
            `);
        }

        res.json({ success: true, data: courses });
    } catch (err) {
        console.error('getTeacherCourses error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving teacher courses' });
    }
};

/**
 * Get all assignments for the teacher
 */
exports.getAssignments = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const roleId = req.user?.role_id;
        const courseId = req.query.course_id;

        let sql = `
            SELECT 
                a.*,
                c.title as course_title,
                c.slug as course_slug,
                u.full_name as teacher_name,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) as total_submissions,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id AND sub.status = 'Graded') as graded_submissions
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            JOIN users u ON a.teacher_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (roleId !== 1) {
            sql += ` AND (a.teacher_id = ? OR a.course_id IN (SELECT c2.id FROM courses c2 JOIN instructors i ON c2.instructor_id = i.id WHERE i.name = u.full_name))`;
            params.push(teacherId);
        }

        if (courseId) {
            sql += ` AND a.course_id = ?`;
            params.push(courseId);
        }

        sql += ` ORDER BY a.due_date DESC, a.created_at DESC`;

        const assignments = await dbAsync.all(sql, params);
        res.json({ success: true, data: assignments });
    } catch (err) {
        console.error('getAssignments error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving assignments' });
    }
};

/**
 * Create a new assignment
 */
exports.createAssignment = async (req, res) => {
    try {
        const teacherId = req.user?.id;
        const {
            course_id,
            title,
            description,
            start_date,
            due_date,
            end_date,
            total_points = 100,
            submission_type = 'File Upload',
            attachment_url = '',
            status = 'Published'
        } = req.body;

        if (!course_id || !title || !due_date) {
            return res.status(400).json({ 
                success: false, 
                message: 'Course, assignment title, and due date are required.' 
            });
        }

        // Verify course exists
        const course = await dbAsync.get('SELECT id, title FROM courses WHERE id = ?', [course_id]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Selected course not found.' });
        }

        const result = await dbAsync.run(`
            INSERT INTO assignments (
                course_id, teacher_id, title, description, start_date, due_date, end_date,
                total_points, submission_type, attachment_url, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            course_id,
            teacherId,
            title,
            description || '',
            start_date || null,
            due_date,
            end_date || null,
            total_points || 100,
            submission_type || 'File Upload',
            attachment_url || '',
            status || 'Published'
        ]);

        const newAssignment = await dbAsync.get(`
            SELECT a.*, c.title as course_title, u.full_name as teacher_name
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            JOIN users u ON a.teacher_id = u.id
            WHERE a.id = ?
        `, [result.lastID]);

        res.status(201).json({
            success: true,
            message: 'Assignment created successfully!',
            data: newAssignment
        });
    } catch (err) {
        console.error('createAssignment error:', err);
        res.status(500).json({ success: false, message: 'Failed to create assignment.' });
    }
};

/**
 * Update an existing assignment
 */
exports.updateAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const teacherId = req.user?.id;
        const roleId = req.user?.role_id;

        const assignment = await dbAsync.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        // Check ownership if not admin
        if (roleId !== 1 && assignment.teacher_id !== teacherId) {
            return res.status(403).json({ success: false, message: 'You can only edit assignments you created.' });
        }

        const {
            course_id,
            title,
            description,
            start_date,
            due_date,
            end_date,
            total_points,
            submission_type,
            attachment_url,
            status
        } = req.body;

        await dbAsync.run(`
            UPDATE assignments SET
                course_id = COALESCE(?, course_id),
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                start_date = COALESCE(?, start_date),
                due_date = COALESCE(?, due_date),
                end_date = COALESCE(?, end_date),
                total_points = COALESCE(?, total_points),
                submission_type = COALESCE(?, submission_type),
                attachment_url = COALESCE(?, attachment_url),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            course_id || assignment.course_id,
            title || assignment.title,
            description !== undefined ? description : assignment.description,
            start_date !== undefined ? start_date : assignment.start_date,
            due_date || assignment.due_date,
            end_date !== undefined ? end_date : assignment.end_date,
            total_points || assignment.total_points,
            submission_type || assignment.submission_type,
            attachment_url !== undefined ? attachment_url : assignment.attachment_url,
            status || assignment.status,
            assignmentId
        ]);

        const updated = await dbAsync.get(`
            SELECT a.*, c.title as course_title, u.full_name as teacher_name
            FROM assignments a
            JOIN courses c ON a.course_id = c.id
            JOIN users u ON a.teacher_id = u.id
            WHERE a.id = ?
        `, [assignmentId]);

        res.json({
            success: true,
            message: 'Assignment updated successfully!',
            data: updated
        });
    } catch (err) {
        console.error('updateAssignment error:', err);
        res.status(500).json({ success: false, message: 'Failed to update assignment.' });
    }
};

/**
 * Delete an assignment
 */
exports.deleteAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const teacherId = req.user?.id;
        const roleId = req.user?.role_id;

        const assignment = await dbAsync.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        if (roleId !== 1 && assignment.teacher_id !== teacherId) {
            return res.status(403).json({ success: false, message: 'You can only delete assignments you created.' });
        }

        await dbAsync.run('DELETE FROM assignments WHERE id = ?', [assignmentId]);
        res.json({ success: true, message: 'Assignment deleted successfully.' });
    } catch (err) {
        console.error('deleteAssignment error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete assignment.' });
    }
};

/**
 * Get submissions for an assignment
 */
exports.getSubmissions = async (req, res) => {
    try {
        const assignmentId = req.params.id;

        const submissions = await dbAsync.all(`
            SELECT 
                sub.*,
                u.full_name as student_name,
                u.email as student_email,
                u.university_id as student_uni_id,
                u.avatar_url as student_avatar
            FROM assignment_submissions sub
            JOIN users u ON sub.student_id = u.id
            WHERE sub.assignment_id = ?
            ORDER BY sub.submitted_at DESC
        `, [assignmentId]);

        res.json({ success: true, data: submissions });
    } catch (err) {
        console.error('getSubmissions error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve submissions.' });
    }
};

/**
 * Grade a student submission
 */
exports.gradeSubmission = async (req, res) => {
    try {
        const submissionId = req.params.id;
        const teacherId = req.user?.id;
        const { grade, feedback } = req.body;

        if (grade === undefined) {
            return res.status(400).json({ success: false, message: 'Grade is required.' });
        }

        await dbAsync.run(`
            UPDATE assignment_submissions SET
                grade = ?,
                feedback = ?,
                graded_by = ?,
                graded_at = CURRENT_TIMESTAMP,
                status = 'Graded'
            WHERE id = ?
        `, [grade, feedback || '', teacherId, submissionId]);

        res.json({ success: true, message: 'Submission graded successfully.' });
    } catch (err) {
        console.error('gradeSubmission error:', err);
        res.status(500).json({ success: false, message: 'Failed to grade submission.' });
    }
};
