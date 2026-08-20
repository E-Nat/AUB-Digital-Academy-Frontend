const { dbAsync } = require('../db/database');

// GET /api/public/categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await dbAsync.all(
            `SELECT id, name, slug, icon, type, order_num
             FROM categories
             WHERE is_active = 1
             ORDER BY order_num ASC, name ASC`
        );
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching public categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

// GET /api/public/programs/featured
exports.getFeaturedPrograms = async (req, res) => {
    try {
        const programs = await dbAsync.all(
            `SELECT id, title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num
             FROM programs
             WHERE is_published = 1 AND is_featured = 1
             ORDER BY order_num ASC, id ASC`
        );

        // Fetch tags/categories for each program
        for (const prog of programs) {
            // Default mapped tags from descriptions or categories
            const tags = await dbAsync.all(
                `SELECT c.name
                 FROM categories c
                 JOIN program_categories pc ON c.id = pc.category_id
                 WHERE pc.program_id = ?
                 ORDER BY c.order_num ASC`,
                [prog.id]
            );

            // Fallback tags if no explicit mapping
            if (tags.length > 0) {
                prog.tags = tags.map(t => t.name);
            } else {
                // Generate clean default tags based on slug
                if (prog.slug.includes('computer-science')) prog.tags = ['Programming', 'AI', 'Systems'];
                else if (prog.slug.includes('it') || prog.slug.includes('information')) prog.tags = ['Development', 'Networks', 'Data'];
                else if (prog.slug.includes('finance')) prog.tags = ['Finance', 'Investment', 'Banking'];
                else if (prog.slug.includes('accounting')) prog.tags = ['Audit', 'Tax', 'Reporting'];
                else if (prog.slug.includes('business')) prog.tags = ['Management', 'Leadership', 'Strategy'];
                else if (prog.slug.includes('marketing')) prog.tags = ['Digital', 'Branding', 'Strategy'];
                else prog.tags = ['Academic', 'Degree', 'Professional'];
            }
        }

        res.json({ success: true, data: programs });
    } catch (error) {
        console.error('Error fetching featured programs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured programs.' });
    }
};

// GET /api/public/courses/popular
exports.getPopularCourses = async (req, res) => {
    try {
        const courses = await dbAsync.all(
            `SELECT c.*, cat.name as category_name, cat.slug as category_slug,
                    inst.name as instructor_name, inst.avatar_url as instructor_avatar
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.id
             LEFT JOIN instructors inst ON c.instructor_id = inst.id
             WHERE c.is_published = 1 AND c.is_popular = 1
             ORDER BY c.order_num ASC, c.id ASC`
        );
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching popular courses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch popular courses.' });
    }
};

// GET /api/public/courses
exports.getAllCourses = async (req, res) => {
    try {
        const { category } = req.query;
        let sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug,
                   inst.name as instructor_name
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            WHERE c.is_published = 1
        `;
        const params = [];

        if (category && category !== 'all') {
            sql += ` AND (cat.slug = ? OR LOWER(cat.name) = LOWER(?))`;
            params.push(category, category);
        }

        sql += ` ORDER BY c.order_num ASC, c.id ASC`;

        const courses = await dbAsync.all(sql, params);
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
    }
};

// GET /api/public/courses/:idOrSlug
exports.getCourseDetails = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const course = await dbAsync.get(
            `SELECT c.*, cat.name as category_name, inst.name as instructor_name, inst.bio as instructor_bio, inst.avatar_url as instructor_avatar
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.id
             LEFT JOIN instructors inst ON c.instructor_id = inst.id
             WHERE c.id = ? OR c.slug = ?`,
            [idOrSlug, idOrSlug]
        );

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        // Fetch modules and lessons
        const modules = await dbAsync.all(
            `SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC`,
            [course.id]
        );

        // Attach computed status and deadline countdown
        const today = new Date().toISOString().split('T')[0];
        let computedStatus = 'Enrollment Open';
        let isClosed = false;

        if (course.end_date && today > course.end_date) {
            computedStatus = 'Completed';
            isClosed = true;
        } else if (course.start_date && today >= course.start_date) {
            computedStatus = 'In Progress';
            isClosed = true;
        } else if (course.enrollment_deadline && today > course.enrollment_deadline) {
            computedStatus = 'Enrollment Closed';
            isClosed = true;
        } else if (course.enrollment_start_date && today < course.enrollment_start_date) {
            computedStatus = 'Upcoming';
            isClosed = true;
        }

        course.computed_status = computedStatus;
        course.is_enrollment_closed = isClosed;

        course.modules = modules;
        res.json({ success: true, data: course });
    } catch (error) {
        console.error('Error fetching course detail:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch course details.' });
    }
};

// POST /api/public/courses/:id/enroll
exports.enrollInCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, payment_method = 'Free', amount = 0 } = req.body;

        const actualUserId = (req.user && req.user.id) ? req.user.id : user_id;
        if (!actualUserId) {
            return res.status(401).json({ success: false, message: 'Please log in to enroll in this course.' });
        }

        const course = await dbAsync.get(`SELECT * FROM courses WHERE id = ?`, [id]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        // Deadline check: do NOT allow enrollment after enrollment deadline!
        const today = new Date().toISOString().split('T')[0];
        if (course.enrollment_deadline && today > course.enrollment_deadline) {
            return res.status(400).json({ 
                success: false, 
                message: `Enrollment is closed for this course. The deadline was ${course.enrollment_deadline}.` 
            });
        }

        // Check if already enrolled
        const existing = await dbAsync.get(`SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?`, [actualUserId, id]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
        }

        const isFree = !course.price || Number(course.price) === 0;
        const pStatus = isFree ? 'Paid' : 'Paid'; // If user submitted checkout, mark as paid

        const enrResult = await dbAsync.run(
            `INSERT INTO enrollments (user_id, course_id, status, payment_status, progress_percentage)
             VALUES (?, ?, 'Active', ?, 0.0)`,
            [actualUserId, id, pStatus]
        );
        const enrId = enrResult.lastID;

        // Record Payment transaction
        const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const invoiceNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
        await dbAsync.run(
            `INSERT INTO payments (transaction_id, enrollment_id, user_id, course_id, amount, payment_method, payment_status, invoice_number)
             VALUES (?, ?, ?, ?, ?, ?, 'Paid', ?)`,
            [txnId, enrId, actualUserId, id, Number(course.price) || 0.0, payment_method, invoiceNum]
        );

        // Update enrolled student count
        const countRow = await dbAsync.get(`SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?`, [id]);
        await dbAsync.run(`UPDATE courses SET enrolled_students_count = ? WHERE id = ?`, [countRow.count, id]);

        res.status(201).json({
            success: true,
            message: 'Enrollment confirmed successfully!',
            data: {
                enrollment_id: enrId,
                transaction_id: txnId,
                invoice_number: invoiceNum,
                course_title: course.title
            }
        });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ success: false, message: 'Failed to process course enrollment.' });
    }
};

// ==========================================
// STUDENT EXAM & QUIZ ACCESS (Rules 14 & 15)
// ==========================================

// GET /api/student/exams/:id
exports.getExamDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user ? req.user.id : req.query.student_id;

        const exam = await dbAsync.get(`
            SELECT ex.*, c.title as course_title, u.full_name as instructor_name
            FROM exams ex
            LEFT JOIN courses c ON ex.course_id = c.id
            LEFT JOIN users u ON ex.instructor_id = u.id
            WHERE ex.id = ?
        `, [id]);

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found.' });
        }

        // Check attempts made by this student
        let attemptCount = 0;
        if (studentId) {
            const countRow = await dbAsync.get(
                `SELECT COUNT(*) as count FROM exam_submissions WHERE exam_id = ? AND student_id = ?`,
                [id, studentId]
            );
            attemptCount = countRow ? countRow.count : 0;
        }

        const now = new Date().toISOString();
        const startISO = new Date(exam.start_datetime).toISOString();
        const endISO = new Date(exam.end_datetime).toISOString();

        let canStart = true;
        let blockReason = null;

        if (now < startISO) {
            canStart = false;
            blockReason = `Exam has not opened yet. It starts on ${new Date(exam.start_datetime).toLocaleString()}.`;
        } else if (now > endISO) {
            canStart = false;
            blockReason = `Exam deadline has passed. It ended on ${new Date(exam.end_datetime).toLocaleString()}.`;
        } else if (attemptCount >= exam.attempts_allowed) {
            canStart = false;
            blockReason = `Maximum attempt limit reached (${attemptCount}/${exam.attempts_allowed} attempts).`;
        }

        res.json({
            success: true,
            data: {
                ...exam,
                current_attempt_count: attemptCount,
                attempts_remaining: Math.max(0, exam.attempts_allowed - attemptCount),
                can_start: canStart,
                block_reason: blockReason
            }
        });
    } catch (error) {
        console.error('Error fetching exam details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exam details.' });
    }
};

// POST /api/student/exams/:id/start
exports.startExam = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user ? req.user.id : req.body.student_id;

        if (!studentId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
        }

        const exam = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [id]);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found.' });
        }

        // Time window enforcement (Rule 14)
        const now = new Date().toISOString();
        const startISO = new Date(exam.start_datetime).toISOString();
        const endISO = new Date(exam.end_datetime).toISOString();

        if (now < startISO) {
            return res.status(400).json({
                success: false,
                message: `You cannot start this exam before the start time (${new Date(exam.start_datetime).toLocaleString()}).`
            });
        }
        if (now > endISO) {
            return res.status(400).json({
                success: false,
                message: `You cannot start this exam after the deadline (${new Date(exam.end_datetime).toLocaleString()}).`
            });
        }

        // Attempt limit enforcement (Rule 15)
        const countRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM exam_submissions WHERE exam_id = ? AND student_id = ?`,
            [id, studentId]
        );
        const attemptCount = countRow ? countRow.count : 0;
        if (attemptCount >= exam.attempts_allowed) {
            return res.status(400).json({
                success: false,
                message: `You have exceeded the maximum allowed attempts (${exam.attempts_allowed}) for this exam.`
            });
        }

        // Retrieve questions without revealing correct answers
        const questions = await dbAsync.all(
            `SELECT id, question_type, question_text, options_json, points, order_num
             FROM exam_questions
             WHERE exam_id = ?
             ORDER BY order_num ASC, id ASC`,
            [id]
        );

        res.json({
            success: true,
            message: 'Exam session initialized.',
            data: {
                exam: {
                    id: exam.id,
                    title: exam.title,
                    duration_minutes: exam.duration_minutes,
                    total_marks: exam.total_marks,
                    passing_score: exam.passing_score,
                    attempt_number: attemptCount + 1,
                    attempts_allowed: exam.attempts_allowed
                },
                questions: questions.map(q => {
                    let parsedOptions = [];
                    try { parsedOptions = JSON.parse(q.options_json); } catch (e) { parsedOptions = []; }
                    return {
                        id: q.id,
                        question_type: q.question_type,
                        question_text: q.question_text,
                        options: parsedOptions,
                        points: q.points
                    };
                })
            }
        });
    } catch (error) {
        console.error('Error starting exam:', error);
        res.status(500).json({ success: false, message: 'Failed to start exam session.' });
    }
};

// POST /api/student/exams/:id/submit
exports.submitExam = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.user ? req.user.id : req.body.student_id;
        const { answers = {} } = req.body; // e.g. { "questionId": "selectedAnswer" }

        if (!studentId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
        }

        const exam = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [id]);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found.' });
        }

        // Time window enforcement
        const now = new Date().toISOString();
        const endISO = new Date(exam.end_datetime).toISOString();
        if (now > endISO) {
            return res.status(400).json({
                success: false,
                message: `Submission rejected: Exam deadline passed on ${new Date(exam.end_datetime).toLocaleString()}.`
            });
        }

        // Attempt limit enforcement
        const countRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM exam_submissions WHERE exam_id = ? AND student_id = ?`,
            [id, studentId]
        );
        const attemptCount = countRow ? countRow.count : 0;
        if (attemptCount >= exam.attempts_allowed) {
            return res.status(400).json({
                success: false,
                message: `Submission rejected: Maximum attempts (${exam.attempts_allowed}) already reached.`
            });
        }

        // Grade submission against exam_questions
        const questions = await dbAsync.all(`SELECT * FROM exam_questions WHERE exam_id = ?`, [id]);
        let totalCalculatedMarks = 0;
        let earnedScore = 0;
        let correctCount = 0;
        let wrongCount = 0;

        for (const q of questions) {
            const points = Number(q.points) || 1;
            totalCalculatedMarks += points;
            const studentAns = (answers[q.id] || '').trim();
            const correctAns = (q.correct_answer || '').trim();

            if (studentAns && studentAns.toLowerCase() === correctAns.toLowerCase()) {
                earnedScore += points;
                correctCount++;
            } else {
                wrongCount++;
            }
        }

        const totalExamMarks = Number(exam.total_marks) || totalCalculatedMarks || 100;
        const percentage = totalCalculatedMarks > 0 
            ? Math.round((earnedScore / totalCalculatedMarks) * 100) 
            : 0;
        const finalScore = Math.round((percentage / 100) * totalExamMarks);
        const status = percentage >= (exam.passing_score || 50) ? 'Passed' : 'Failed';
        const attemptNum = attemptCount + 1;

        const result = await dbAsync.run(`
            INSERT INTO exam_submissions (
                exam_id, student_id, course_id, score, total_marks,
                percentage, correct_count, wrong_count, attempt_number, answers_json, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, studentId, exam.course_id, finalScore, totalExamMarks,
            percentage, correctCount, wrongCount, attemptNum, JSON.stringify(answers), status
        ]);

        res.status(201).json({
            success: true,
            message: `Exam submitted successfully! Result: ${status}`,
            data: {
                submission_id: result.lastID,
                score: finalScore,
                total_marks: totalExamMarks,
                percentage: percentage,
                passing_score: exam.passing_score,
                status: status,
                attempt_number: attemptNum,
                attempts_allowed: exam.attempts_allowed,
                attempts_remaining: Math.max(0, exam.attempts_allowed - attemptNum),
                correct_count: correctCount,
                wrong_count: wrongCount
            }
        });
    } catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({ success: false, message: 'Failed to process exam submission.' });
    }
};
