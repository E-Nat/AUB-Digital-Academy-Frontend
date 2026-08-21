// ==========================================================================
// AUB Digital Academy - Quiz & Exam Subsystem Controller
// Authoritative Business Logic, Ownership Guarding, Date Validation & Auto-Grading
// ==========================================================================

const { dbAsync } = require('../db/database');

/**
 * Helper: Verify if a user (Teacher or Admin) is authorized for a course
 */
async function verifyTeacherCourseAccess(userId, userRole, courseId) {
    if (userRole === 'ADMIN' || userRole === 1) return true;

    // 1. Check teacher_courses table
    const tc = await dbAsync.get(
        `SELECT id FROM teacher_courses WHERE teacher_id = ? AND course_id = ?`,
        [userId, courseId]
    );
    if (tc) return true;

    // 2. Check classes table
    const cls = await dbAsync.get(
        `SELECT id FROM classes WHERE teacher_id = ? AND course_id = ?`,
        [userId, courseId]
    );
    if (cls) return true;

    // 3. Check instructors table mapping to user
    const user = await dbAsync.get(`SELECT id, full_name, email FROM users WHERE id = ?`, [userId]);
    if (user) {
        const instCourse = await dbAsync.get(`
            SELECT c.id FROM courses c
            JOIN instructors i ON c.instructor_id = i.id
            WHERE c.id = ? AND (i.user_id = ? OR i.email = ? OR i.name = ?)
        `, [courseId, userId, user.email, user.full_name]);
        if (instCourse) return true;
    }

    // 4. Check direct instructor_id match
    const directCourse = await dbAsync.get(
        `SELECT id FROM courses WHERE id = ? AND instructor_id = ?`,
        [courseId, userId]
    );
    if (directCourse) return true;

    return false;
}

// ==========================================================================
// 1. TEACHER QUIZZES (Priority 1)
// ==========================================================================

/**
 * POST /api/teacher/quizzes
 * Create a Quiz for an assigned course
 */
exports.createTeacherQuiz = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const {
            course_id,
            chapter_id,
            title,
            description = '',
            passing_score = 60,
            duration_minutes = 30,
            start_datetime,
            end_datetime,
            attempts_allowed = 3,
            status = 'Published'
        } = req.body;

        if (!course_id || !title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Course ID and Quiz Title are required.' });
        }

        // Priority 8: Verify Teacher Ownership
        const isAuthorized = await verifyTeacherCourseAccess(userId, userRole, course_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to teach this course.' });
        }

        // Priority 5: Date Validation (Start < End if dates are provided)
        const now = new Date();
        const start = start_datetime ? new Date(start_datetime) : now;
        const end = end_datetime ? new Date(end_datetime) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

        if (start_datetime && end_datetime && new Date(start_datetime) >= new Date(end_datetime)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quiz schedule: Start Date/Time must be strictly before End Date/Time.'
            });
        }

        const startStr = start.toISOString().replace('T', ' ').substring(0, 19);
        const endStr = end.toISOString().replace('T', ' ').substring(0, 19);

        // Priority 9: Real DB Persistence to existing 'exams' table (exam_type = 'Quiz')
        const result = await dbAsync.run(`
            INSERT INTO exams (
                title, course_id, chapter_id, instructor_id, exam_type,
                description, total_questions, total_marks, passing_score,
                duration_minutes, start_datetime, end_datetime, attempts_allowed, status
            ) VALUES (?, ?, ?, ?, 'Quiz', ?, 0, 0, ?, ?, ?, ?, ?, ?)
        `, [
            title.trim(),
            course_id,
            chapter_id || null,
            userId,
            description.trim(),
            Number(passing_score) || 60,
            Number(duration_minutes) || 30,
            startStr,
            endStr,
            Number(attempts_allowed) || 3,
            status || 'Published'
        ]);

        res.status(201).json({
            success: true,
            message: 'Quiz created successfully.',
            quiz_id: result.lastID
        });
    } catch (err) {
        console.error('createTeacherQuiz error:', err);
        res.status(500).json({ success: false, message: 'Failed to create quiz.' });
    }
};

/**
 * POST /api/teacher/quizzes/:id/questions
 * Add QCM Question with Options and Correct Answer to a Quiz
 */
exports.addQuizQuestion = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const quizId = parseInt(req.params.id);
        const { question_text, options, correct_answer_index, points = 10, explanation = '' } = req.body;

        if (!question_text || !question_text.trim()) {
            return res.status(400).json({ success: false, message: 'Question text is required.' });
        }
        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ success: false, message: 'At least 2 answer options are required.' });
        }
        if (correct_answer_index === undefined || correct_answer_index === null || correct_answer_index < 0 || correct_answer_index >= options.length) {
            return res.status(400).json({ success: false, message: 'Valid correct answer index is required.' });
        }

        // Find Quiz
        const quiz = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [quizId]);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found.' });
        }

        // Priority 8: Verify Teacher Ownership
        const isAuthorized = await verifyTeacherCourseAccess(userId, userRole, quiz.course_id);
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to modify this quiz.' });
        }

        // Priority 9: Real DB Persistence to exam_questions
        const maxOrder = await dbAsync.get(`SELECT MAX(order_num) as max_order FROM exam_questions WHERE exam_id = ?`, [quizId]);
        const nextOrder = (maxOrder && maxOrder.max_order !== null) ? maxOrder.max_order + 1 : 1;

        const result = await dbAsync.run(`
            INSERT INTO exam_questions (
                exam_id, question_type, question_text, options_json, correct_answer, points, explanation, order_num
            ) VALUES (?, 'Multiple Choice', ?, ?, ?, ?, ?, ?)
        `, [
            quizId,
            question_text.trim(),
            JSON.stringify(options),
            String(correct_answer_index),
            Number(points) || 10,
            explanation.trim(),
            nextOrder
        ]);

        // Update total questions & total marks on quiz
        await dbAsync.run(`
            UPDATE exams
            SET total_questions = (SELECT COUNT(*) FROM exam_questions WHERE exam_id = ?),
                total_marks = (SELECT COALESCE(SUM(points), 0) FROM exam_questions WHERE exam_id = ?)
            WHERE id = ?
        `, [quizId, quizId, quizId]);

        res.status(201).json({
            success: true,
            message: 'Question added successfully.',
            question_id: result.lastID
        });
    } catch (err) {
        console.error('addQuizQuestion error:', err);
        res.status(500).json({ success: false, message: 'Failed to add question.' });
    }
};

// ==========================================================================
// 2. STUDENT QUIZ ACCESS (Priority 2) & EXAM START (Priority 6)
// ==========================================================================

/**
 * GET /api/student/quizzes/:id
 * Retrieve Quiz for taking (Enrolled Students Only, Active Time Window, Sanitized Questions)
 */
exports.getStudentQuiz = async (req, res) => {
    try {
        const studentId = req.user?.id;
        const quizId = parseInt(req.params.id);

        const quiz = await dbAsync.get(`
            SELECT ex.*, c.title as course_title
            FROM exams ex
            JOIN courses c ON ex.course_id = c.id
            WHERE ex.id = ?
        `, [quizId]);

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found.' });
        }

        // Priority 7: Reject Unpublished/Draft Quizzes
        if (quiz.status === 'Draft') {
            return res.status(403).json({ success: false, message: 'Quiz is currently unpublished (Draft mode).' });
        }

        // Priority 2: Verify Active Student Enrollment
        const enrollment = await dbAsync.get(`
            SELECT id, status FROM enrollments
            WHERE user_id = ? AND course_id = ? AND status = 'Active'
        `, [studentId, quiz.course_id]);

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied: You are not actively enrolled in this course.'
            });
        }

        // Priority 2 & 6: Time Window Validation
        const now = new Date();
        if (quiz.start_datetime && new Date(quiz.start_datetime) > now) {
            return res.status(403).json({
                success: false,
                message: `Quiz is not available yet. It opens at ${quiz.start_datetime}.`
            });
        }
        if (quiz.end_datetime && new Date(quiz.end_datetime) < now) {
            return res.status(403).json({
                success: false,
                message: `Quiz window has closed. The deadline was ${quiz.end_datetime}.`
            });
        }

        // Load Questions (Sanitized: NO correct_answer returned to student!)
        const rawQuestions = await dbAsync.all(`
            SELECT id, question_type, question_text, options_json, points, order_num
            FROM exam_questions
            WHERE exam_id = ?
            ORDER BY order_num ASC, id ASC
        `, [quizId]);

        const sanitizedQuestions = rawQuestions.map(q => {
            let parsedOptions = [];
            try {
                parsedOptions = JSON.parse(q.options_json);
            } catch (e) {
                parsedOptions = [];
            }
            return {
                id: q.id,
                question_type: q.question_type,
                question_text: q.question_text,
                options: parsedOptions,
                points: q.points,
                order_num: q.order_num
            };
        });

        res.json({
            success: true,
            data: {
                id: quiz.id,
                title: quiz.title,
                course_id: quiz.course_id,
                course_title: quiz.course_title,
                exam_type: quiz.exam_type,
                description: quiz.description,
                duration_minutes: quiz.duration_minutes,
                passing_score: quiz.passing_score,
                total_questions: sanitizedQuestions.length,
                total_marks: quiz.total_marks,
                questions: sanitizedQuestions
            }
        });
    } catch (err) {
        console.error('getStudentQuiz error:', err);
        res.status(500).json({ success: false, message: 'Failed to load quiz.' });
    }
};

/**
 * GET /api/student/exams/:id/start
 * Priority 6: Student Exam Start with Strict Time Window and Enrollment Guard
 */
exports.startStudentExam = async (req, res) => {
    // Delegates to same secure workflow as getStudentQuiz
    return exports.getStudentQuiz(req, res);
};

// ==========================================================================
// 3. AUTHORITATIVE AUTO-GRADING & SUBMISSION (Priority 3)
// ==========================================================================

/**
 * POST /api/student/quizzes/:id/submit
 * Authoritative Server-Side Scoring & Submission Persistence
 */
exports.submitStudentQuiz = async (req, res) => {
    try {
        const studentId = req.user?.id;
        const quizId = parseInt(req.params.id);
        const { answers } = req.body; // Map of { [question_id]: selected_option_index }

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ success: false, message: 'Answers payload is required.' });
        }

        const quiz = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [quizId]);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz / Exam not found.' });
        }

        // Priority 7: Unpublished Guard
        if (quiz.status === 'Draft') {
            return res.status(403).json({ success: false, message: 'Cannot submit to an unpublished draft.' });
        }

        // Verify Active Enrollment
        const enrollment = await dbAsync.get(`
            SELECT id FROM enrollments
            WHERE user_id = ? AND course_id = ? AND status = 'Active'
        `, [studentId, quiz.course_id]);

        if (!enrollment) {
            return res.status(403).json({ success: false, message: 'Access Denied: You are not enrolled in this course.' });
        }

        // Verify Time Window (grace period of 5 minutes for submission network latency)
        const now = new Date();
        if (quiz.end_datetime && (now.getTime() - new Date(quiz.end_datetime).getTime() > 5 * 60 * 1000)) {
            return res.status(403).json({ success: false, message: 'Submission rejected: Examination deadline has passed.' });
        }

        // Load Real Questions & Correct Answers from DB
        const questions = await dbAsync.all(`
            SELECT id, correct_answer, points
            FROM exam_questions
            WHERE exam_id = ?
        `, [quizId]);

        if (questions.length === 0) {
            return res.status(400).json({ success: false, message: 'This quiz has no questions registered.' });
        }

        let earnedScore = 0;
        let totalPossibleMarks = 0;
        let correctCount = 0;
        let wrongCount = 0;

        // Authoritative Scoring
        questions.forEach(q => {
            const points = q.points || 10;
            totalPossibleMarks += points;

            const studentSelected = answers[q.id];
            if (studentSelected !== undefined && String(studentSelected) === String(q.correct_answer)) {
                earnedScore += points;
                correctCount++;
            } else {
                wrongCount++;
            }
        });

        const percentage = totalPossibleMarks > 0 ? Math.round((earnedScore / totalPossibleMarks) * 100) : 0;
        const passMark = quiz.passing_score || 50;
        const status = percentage >= passMark ? 'Passed' : 'Failed';

        // Check Previous Attempt Number
        const previousAttempts = await dbAsync.get(`
            SELECT COUNT(*) as count FROM exam_submissions
            WHERE exam_id = ? AND student_id = ?
        `, [quizId, studentId]);

        const attemptNum = (previousAttempts?.count || 0) + 1;

        // Priority 9: Real DB Persistence to exam_submissions
        const result = await dbAsync.run(`
            INSERT INTO exam_submissions (
                exam_id, student_id, course_id, score, total_marks,
                percentage, correct_count, wrong_count, attempt_number,
                answers_json, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            quizId,
            studentId,
            quiz.course_id,
            earnedScore,
            totalPossibleMarks,
            percentage,
            correctCount,
            wrongCount,
            attemptNum,
            JSON.stringify(answers),
            status
        ]);

        res.json({
            success: true,
            message: 'Quiz submitted and graded successfully.',
            submission_id: result.lastID,
            results: {
                score: earnedScore,
                total_marks: totalPossibleMarks,
                percentage: percentage,
                passing_score: passMark,
                status: status,
                correct_count: correctCount,
                wrong_count: wrongCount,
                attempt_number: attemptNum
            }
        });
    } catch (err) {
        console.error('submitStudentQuiz error:', err);
        res.status(500).json({ success: false, message: 'Failed to process submission.' });
    }
};

// ==========================================================================
// 4. TEACHER QUIZ RESULTS (Priority 4)
// ==========================================================================

/**
 * GET /api/teacher/quizzes/:id/results
 * Teacher Result Inspector with Cross-Teacher Isolation
 */
exports.getTeacherQuizResults = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const quizId = parseInt(req.params.id);

        const quiz = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [quizId]);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found.' });
        }

        // Priority 8: Cross-Teacher Ownership Check
        const isAuthorized = await verifyTeacherCourseAccess(userId, userRole, quiz.course_id);
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You are not authorized to view results for this course.'
            });
        }

        // Retrieve real student attempts
        const submissions = await dbAsync.all(`
            SELECT es.id, es.score, es.total_marks, es.percentage, es.correct_count,
                   es.wrong_count, es.attempt_number, es.status, es.submitted_at,
                   u.id as student_id, u.full_name as student_name, u.email as student_email,
                   u.university_id, u.avatar_url
            FROM exam_submissions es
            JOIN users u ON es.student_id = u.id
            WHERE es.exam_id = ?
            ORDER BY es.submitted_at DESC
        `, [quizId]);

        res.json({
            success: true,
            data: {
                quiz_id: quiz.id,
                quiz_title: quiz.title,
                course_id: quiz.course_id,
                total_submissions: submissions.length,
                submissions: submissions
            }
        });
    } catch (err) {
        console.error('getTeacherQuizResults error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve quiz results.' });
    }
};

// ==========================================================================
// 5. EXAM DATE VALIDATION IN ADMIN/TEACHER MUTATIONS (Priority 5)
// ==========================================================================

exports.validateExamDates = (start_datetime, end_datetime) => {
    if (!start_datetime || !end_datetime) {
        return { valid: false, message: 'Start Date/Time and End Date/Time are required.' };
    }
    const start = new Date(start_datetime);
    const end = new Date(end_datetime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, message: 'Invalid datetime format.' };
    }

    if (start >= end) {
        return {
            valid: false,
            message: 'Invalid Exam Window: Start Date/Time must be strictly before End Date/Time.'
        };
    }

    return { valid: true };
};

exports.verifyTeacherCourseAccess = verifyTeacherCourseAccess;
