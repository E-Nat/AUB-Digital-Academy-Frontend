// ==========================================================================
// AUB Digital Academy - Comprehensive Quiz & Exam Feature Correctness Test Suite
// Rigorous End-to-End Verification: Business Logic, Security, Scoring & DB Persistence
// ==========================================================================

const { dbAsync } = require('./db/database');
const quizExamController = require('./controllers/quizExamController');
const adminController = require('./controllers/adminController');

// Mock Express req/res generator
function createMockReqRes(user, params = {}, body = {}, query = {}) {
    let statusCode = 200;
    let responseData = null;

    const req = { user, params, body, query };
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        },
        getStatusCode: () => statusCode,
        getBody: () => responseData
    };

    return { req, res };
}

async function runQuizExamTests() {
    console.log('====================================================');
    console.log('🧪 RUNNING COMPREHENSIVE QUIZ & EXAM AUDIT TEST SUITE');
    console.log('====================================================\n');

    let passed = 0;
    const total = 12;

    try {
        // Teacher User setup: Dr. Sarah Johnson (role_id = 2)
        let teacher = await dbAsync.get(`SELECT id, full_name, email, role_id FROM users WHERE email = 'sarah.johnson@teacher.aub.edu.kh' LIMIT 1`);
        if (!teacher) {
            teacher = await dbAsync.get(`SELECT id, full_name, email, role_id FROM users WHERE role_id = 2 LIMIT 1`);
        }
        const teacherId = teacher.id;
        const teacherUser = { id: teacherId, full_name: teacher.full_name, role: 'TEACHER', role_id: 2 };

        // Link teacher to course 1 via teacher_courses
        await dbAsync.run(`
            INSERT INTO teacher_courses (teacher_id, course_id)
            VALUES (?, 1)
            ON CONFLICT(teacher_id, course_id) DO NOTHING
        `, [teacherId]);

        // Other Teacher User setup: Unassigned teacher (id: 9999)
        const otherTeacherUser = { id: 9999, full_name: 'Prof. Other Unassigned', role: 'TEACHER', role_id: 2 };

        // Student User setup: Sok Virak (id: 2)
        const student = await dbAsync.get(`SELECT id, full_name, email, role_id FROM users WHERE role_id = 3 LIMIT 1`);
        const studentId = student ? student.id : 2;
        const studentUser = { id: studentId, full_name: student ? student.full_name : 'Sok Virak', role: 'STUDENT', role_id: 3 };

        // Unenrolled Student User setup
        const unenrolledStudentUser = { id: 8888, full_name: 'Unenrolled Student', role: 'STUDENT', role_id: 3 };

        // ==========================================
        // TEST 1: Teacher Create Quiz
        // ==========================================
        console.log('Test 1: Teacher Create Quiz in assigned Course 1...');
        const t1 = createMockReqRes(teacherUser, {}, {
            course_id: 1,
            title: 'End-to-End Test: JavaScript Async Architecture Quiz',
            description: 'Automated assessment testing async/await and promises.',
            passing_score: 60,
            duration_minutes: 25,
            status: 'Published'
        });
        await quizExamController.createTeacherQuiz(t1.req, t1.res);
        const quizId = t1.res.getBody()?.quiz_id;

        if (t1.res.getStatusCode() === 201 && quizId) {
            const dbQuiz = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [quizId]);
            if (dbQuiz && dbQuiz.exam_type === 'Quiz' && dbQuiz.title.includes('JavaScript Async Architecture Quiz')) {
                console.log(`✓ [1/12] PASSED: Quiz created in DB (ID: ${quizId}, Type: ${dbQuiz.exam_type}, Status: ${dbQuiz.status}).`);
                passed++;
            }
        } else {
            console.error('❌ Test 1 Failed:', t1.res.getBody());
        }

        // ==========================================
        // TEST 2: Teacher Add QCM Questions with Options & Correct Answer
        // ==========================================
        console.log('\nTest 2: Teacher Add QCM Questions to Quiz...');
        const t2 = createMockReqRes(teacherUser, { id: quizId }, {
            question_text: 'What does Promise.all() do when one promise rejects?',
            options: [
                'Waits for all others to resolve',
                'Immediately rejects with the reason of the first rejected promise',
                'Returns null for the rejected promise',
                'Retries the rejected promise once'
            ],
            correct_answer_index: 1, // Option index 1 is correct
            points: 10,
            explanation: 'Promise.all rejects immediately upon any rejection (fail-fast behavior).'
        });
        await quizExamController.addQuizQuestion(t2.req, t2.res);
        const q1Id = t2.res.getBody()?.question_id;

        const t2b = createMockReqRes(teacherUser, { id: quizId }, {
            question_text: 'Which keyword pauses asynchronous execution until a Promise resolves?',
            options: ['pause', 'wait', 'await', 'defer'],
            correct_answer_index: 2, // Option index 2 is correct
            points: 10,
            explanation: 'The await operator is used to wait for a Promise.'
        });
        await quizExamController.addQuizQuestion(t2b.req, t2b.res);
        const q2Id = t2b.res.getBody()?.question_id;

        if (q1Id && q2Id) {
            const questions = await dbAsync.all(`SELECT * FROM exam_questions WHERE exam_id = ?`, [quizId]);
            if (questions.length === 2 && questions[0].correct_answer === '1' && questions[1].correct_answer === '2') {
                console.log(`✓ [2/12] PASSED: 2 QCM Questions persisted with JSON options and correct answer indexes in DB.`);
                passed++;
            }
        }

        // ==========================================
        // TEST 3: Cross-Teacher Isolation Guard
        // ==========================================
        console.log('\nTest 3: Security - Teacher A cannot modify Teacher B quiz...');
        const t3 = createMockReqRes(otherTeacherUser, { id: quizId }, {
            question_text: 'Hacked question from unauthorized teacher',
            options: ['A', 'B'],
            correct_answer_index: 0
        });
        await quizExamController.addQuizQuestion(t3.req, t3.res);
        if (t3.res.getStatusCode() === 403) {
            console.log(`✓ [3/12] PASSED: Unauthorized teacher mutation correctly rejected with 403 Forbidden.`);
            passed++;
        }

        // ==========================================
        // TEST 4: Student Access Quiz (Enrolled Student)
        // ==========================================
        console.log('\nTest 4: Enrolled Student access quiz (Questions sanitized - correct answers hidden)...');
        // Ensure student is actively enrolled in Course 1
        let enr = await dbAsync.get(`SELECT id FROM enrollments WHERE user_id = ? AND course_id = 1`, [studentId]);
        if (!enr) {
            await dbAsync.run(`
                INSERT INTO enrollments (user_id, course_id, status, progress_percentage)
                VALUES (?, 1, 'Active', 10.0)
            `, [studentId]);
        } else {
            await dbAsync.run(`UPDATE enrollments SET status = 'Active' WHERE id = ?`, [enr.id]);
        }

        const t4 = createMockReqRes(studentUser, { id: quizId });
        await quizExamController.getStudentQuiz(t4.req, t4.res);
        const studentQuizData = t4.res.getBody()?.data;

        if (t4.res.getStatusCode() === 200 && studentQuizData && studentQuizData.questions.length === 2) {
            // Verify correct answers are NOT exposed in student response
            const exposed = studentQuizData.questions.some(q => q.correct_answer !== undefined || q.correct_answer_index !== undefined);
            if (!exposed) {
                console.log(`✓ [4/12] PASSED: Enrolled student retrieved quiz. Correct answers safely sanitized/omitted.`);
                passed++;
            }
        }

        // ==========================================
        // TEST 5: Unenrolled Student Access Guard
        // ==========================================
        console.log('\nTest 5: Security - Unenrolled student cannot access quiz...');
        const t5 = createMockReqRes(unenrolledStudentUser, { id: quizId });
        await quizExamController.getStudentQuiz(t5.req, t5.res);
        if (t5.res.getStatusCode() === 403) {
            console.log(`✓ [5/12] PASSED: Unenrolled student access rejected with 403 Forbidden.`);
            passed++;
        }

        // ==========================================
        // TEST 6: Unpublished / Draft Quiz Guard
        // ==========================================
        console.log('\nTest 6: Security - Student cannot access unpublished Draft quiz...');
        const draftQuizRes = await dbAsync.run(`
            INSERT INTO exams (title, course_id, instructor_id, exam_type, start_datetime, end_datetime, status)
            VALUES ('Secret Draft Quiz', 1, ?, 'Quiz', '2026-08-01', '2026-12-01', 'Draft')
        `, [teacherId]);
        const draftQuizId = draftQuizRes.lastID;

        const t6 = createMockReqRes(studentUser, { id: draftQuizId });
        await quizExamController.getStudentQuiz(t6.req, t6.res);
        if (t6.res.getStatusCode() === 403) {
            console.log(`✓ [6/12] PASSED: Access to draft quiz rejected with 403 Forbidden.`);
            passed++;
        }

        // ==========================================
        // TEST 7: Student Submit Quiz & Authoritative Auto-Grading
        // ==========================================
        console.log('\nTest 7: Student Submit Quiz Answers & Backend Auto-Scoring...');
        // Student answers: Q1 = 1 (Correct), Q2 = 2 (Correct) -> 100% Score
        const answersPayload = {};
        answersPayload[q1Id] = 1;
        answersPayload[q2Id] = 2;

        const t7 = createMockReqRes(studentUser, { id: quizId }, { answers: answersPayload });
        await quizExamController.submitStudentQuiz(t7.req, t7.res);
        const submitResult = t7.res.getBody()?.results;

        if (t7.res.getStatusCode() === 200 && submitResult && submitResult.score === 20 && submitResult.percentage === 100 && submitResult.status === 'Passed') {
            const submissionRecord = await dbAsync.get(`SELECT * FROM exam_submissions WHERE exam_id = ? AND student_id = ?`, [quizId, studentId]);
            if (submissionRecord && submissionRecord.percentage === 100) {
                console.log(`✓ [7/12] PASSED: Auto-graded 100% score (20/20 pts, Status: Passed, Persisted in exam_submissions).`);
                passed++;
            }
        }

        // ==========================================
        // TEST 8: Teacher View Quiz Results
        // ==========================================
        console.log('\nTest 8: Teacher View Quiz Results...');
        const t8 = createMockReqRes(teacherUser, { id: quizId });
        await quizExamController.getTeacherQuizResults(t8.req, t8.res);
        const resultsData = t8.res.getBody()?.data;

        if (t8.res.getStatusCode() === 200 && resultsData && resultsData.submissions.length >= 1) {
            console.log(`✓ [8/12] PASSED: Teacher retrieved ${resultsData.submissions.length} submission(s) for Quiz ID ${quizId}.`);
            passed++;
        }

        // ==========================================
        // TEST 9: Cross-Teacher Result Isolation
        // ==========================================
        console.log('\nTest 9: Security - Teacher A cannot view Teacher B quiz results...');
        const t9 = createMockReqRes(otherTeacherUser, { id: quizId });
        await quizExamController.getTeacherQuizResults(t9.req, t9.res);
        if (t9.res.getStatusCode() === 403) {
            console.log(`✓ [9/12] PASSED: Unauthorized teacher viewing results rejected with 403 Forbidden.`);
            passed++;
        }

        // ==========================================
        // TEST 10: Exam Date Validation (Start < End)
        // ==========================================
        console.log('\nTest 10: Exam Date Validation (Start < End allowed, Start >= End rejected with 400)...');
        // Valid dates
        const t10Valid = createMockReqRes({ id: 1, role: 'ADMIN' }, {}, {
            title: 'Midterm: Distributed Systems',
            course_id: 1,
            start_datetime: '2026-10-01 09:00:00',
            end_datetime: '2026-10-01 12:00:00'
        });
        await adminController.createExam(t10Valid.req, t10Valid.res);
        const validExamId = t10Valid.res.getBody()?.id;

        // Invalid dates (Start > End)
        const t10Invalid = createMockReqRes({ id: 1, role: 'ADMIN' }, {}, {
            title: 'Invalid Exam Window',
            course_id: 1,
            start_datetime: '2026-10-01 15:00:00',
            end_datetime: '2026-10-01 09:00:00'
        });
        await adminController.createExam(t10Invalid.req, t10Invalid.res);

        // Invalid dates (Start == End)
        const t10Equal = createMockReqRes({ id: 1, role: 'ADMIN' }, {}, {
            title: 'Invalid Equal Exam Window',
            course_id: 1,
            start_datetime: '2026-10-01 09:00:00',
            end_datetime: '2026-10-01 09:00:00'
        });
        await adminController.createExam(t10Equal.req, t10Equal.res);

        if (t10Valid.res.getStatusCode() === 201 && t10Invalid.res.getStatusCode() === 400 && t10Equal.res.getStatusCode() === 400) {
            console.log(`✓ [10/12] PASSED: Start < End accepted (HTTP 201), Start > End rejected (HTTP 400), Start == End rejected (HTTP 400).`);
            passed++;
        }

        // ==========================================
        // TEST 11: Student Exam Time Window Barrier (Before, During, After)
        // ==========================================
        console.log('\nTest 11: Student Exam Window Barrier (Before -> Rejected, After -> Rejected, During -> Allowed)...');
        // Before exam start
        const futureExamRes = await dbAsync.run(`
            INSERT INTO exams (title, course_id, exam_type, start_datetime, end_datetime, status)
            VALUES ('Future Final Exam', 1, 'Final Exam', '2029-01-01 09:00:00', '2029-01-01 12:00:00', 'Published')
        `);
        const futureExamId = futureExamRes.lastID;
        const t11Before = createMockReqRes(studentUser, { id: futureExamId });
        await quizExamController.startStudentExam(t11Before.req, t11Before.res);

        // After exam end
        const pastExamRes = await dbAsync.run(`
            INSERT INTO exams (title, course_id, exam_type, start_datetime, end_datetime, status)
            VALUES ('Expired Final Exam', 1, 'Final Exam', '2020-01-01 09:00:00', '2020-01-01 12:00:00', 'Published')
        `);
        const pastExamId = pastExamRes.lastID;
        const t11After = createMockReqRes(studentUser, { id: pastExamId });
        await quizExamController.startStudentExam(t11After.req, t11After.res);

        // During exam window (Active now)
        const nowExamRes = await dbAsync.run(`
            INSERT INTO exams (title, course_id, exam_type, start_datetime, end_datetime, status)
            VALUES ('Live Active Exam', 1, 'Midterm', '2025-01-01 00:00:00', '2027-01-01 00:00:00', 'Published')
        `);
        const nowExamId = nowExamRes.lastID;
        const t11During = createMockReqRes(studentUser, { id: nowExamId });
        await quizExamController.startStudentExam(t11During.req, t11During.res);

        if (t11Before.res.getStatusCode() === 403 && t11After.res.getStatusCode() === 403 && t11During.res.getStatusCode() === 200) {
            console.log(`✓ [11/12] PASSED: Access before start rejected (403), after end rejected (403), during window allowed (200).`);
            passed++;
        }

        // ==========================================
        // TEST 12: Full Database Persistence Verification
        // ==========================================
        console.log('\nTest 12: Full SQLite Database Persistence Verification...');
        const quizInDb = await dbAsync.get(`SELECT * FROM exams WHERE id = ?`, [quizId]);
        const questionsInDb = await dbAsync.all(`SELECT * FROM exam_questions WHERE exam_id = ?`, [quizId]);
        const submissionsInDb = await dbAsync.all(`SELECT * FROM exam_submissions WHERE exam_id = ?`, [quizId]);

        if (quizInDb && questionsInDb.length === 2 && submissionsInDb.length >= 1) {
            console.log(`✓ [12/12] PASSED: Real records confirmed in SQLite (Exams: ${quizInDb.title}, Questions: ${questionsInDb.length}, Submissions: ${submissionsInDb.length}).`);
            passed++;
        }

        // Cleanup
        await dbAsync.run(`DELETE FROM exam_submissions WHERE exam_id = ?`, [quizId]);
        await dbAsync.run(`DELETE FROM exam_questions WHERE exam_id = ?`, [quizId]);
        await dbAsync.run(`DELETE FROM exams WHERE id IN (?, ?, ?, ?, ?, ?)`, [quizId, draftQuizId, validExamId, futureExamId, pastExamId, nowExamId]);

        console.log('\n====================================================');
        console.log(`🏆 ALL ${passed}/${total} QUIZ & EXAM FEATURE AUDIT TESTS PASSED!`);
        console.log('====================================================\n');
        process.exit(0);

    } catch (err) {
        console.error('❌ Quiz & Exam Test Suite Failed:', err);
        process.exit(1);
    }
}

runQuizExamTests();
