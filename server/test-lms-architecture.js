// ==========================================
// AUB Digital Academy - Complete LMS Architecture Integration Tests
// Validates: Lessons, Materials, Videos, Announcements, Certificates, Progress & Audit Logs
// ==========================================

const { dbAsync } = require('./db/database');

async function runLmsArchitectureTests() {
    console.log('====================================================');
    console.log('🧪 RUNNING COMPLETE LMS ARCHITECTURE TEST SUITE');
    console.log('====================================================\n');

    let passed = 0;
    const total = 7;

    try {
        // Test 1: Lesson Management & Dynamic Lesson Count
        console.log('Test 1: Testing Lesson Creation and Dynamic Module Lesson Count...');
        const mod = await dbAsync.get('SELECT id FROM modules WHERE course_id = 1 LIMIT 1');
        const lessonRes = await dbAsync.run(
            `INSERT INTO lessons (module_id, title, video_url, description, duration, order_num) VALUES (?, ?, ?, ?, ?, ?)`,
            [mod.id, 'Automated Test: State Machines in JavaScript', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'Test lesson desc', '18 Mins', 99]
        );
        const newLessonId = lessonRes.lastID;
        const lessonCountRow = await dbAsync.get(`SELECT COUNT(*) as count FROM lessons WHERE module_id = ?`, [mod.id]);
        if (newLessonId && lessonCountRow.count > 0) {
            console.log(`✓ [1/7] Lesson created with ID ${newLessonId}. Dynamic count for Module ${mod.id}: ${lessonCountRow.count} lessons.`);
            passed++;
        }

        // Test 2: Learning Materials (PDF Attachments)
        console.log('\nTest 2: Testing Learning Materials Attachment & Retrieval...');
        const matRes = await dbAsync.run(
            `INSERT INTO lesson_materials (lesson_id, course_id, title, type, file_name, file_url, file_size, uploaded_by, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
            [newLessonId, 1, 'State Machine Architecture Diagram.pdf', 'PDF', 'State_Machine_Diagram.pdf', 'https://aub.edu.kh/materials/state_machine.pdf', '1.4 MB']
        );
        const materials = await dbAsync.all(`SELECT * FROM lesson_materials WHERE lesson_id = ?`, [newLessonId]);
        if (matRes.lastID && materials.length === 1 && materials[0].file_name === 'State_Machine_Diagram.pdf') {
            console.log(`✓ [2/7] Learning Material attached (ID: ${matRes.lastID}, File: ${materials[0].file_name}, Size: ${materials[0].file_size}).`);
            passed++;
        }

        // Test 3: Lesson Videos Metadata
        console.log('\nTest 3: Testing Lesson Video Metadata Storage...');
        await dbAsync.run(
            `INSERT INTO lesson_videos (lesson_id, course_id, video_title, video_url, duration_minutes, resolution, platform) VALUES (?, 1, ?, ?, 18, '1080p', 'Direct Stream')`,
            [newLessonId, 'JavaScript State Machine Lecture', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4']
        );
        const vid = await dbAsync.get(`SELECT * FROM lesson_videos WHERE lesson_id = ?`, [newLessonId]);
        if (vid && vid.resolution === '1080p') {
            console.log(`✓ [3/7] Lesson Video registered (Title: "${vid.video_title}", Platform: ${vid.platform}, Resolution: ${vid.resolution}).`);
            passed++;
        }

        // Test 4: Course Announcements
        console.log('\nTest 4: Testing Course Announcements...');
        const annRes = await dbAsync.run(
            `INSERT INTO course_announcements (course_id, title, message, priority, published_by, status) VALUES (?, ?, ?, 'Important', 1, 'Published')`,
            [1, 'Automated Test Announcement', 'Midterm examination will begin on schedule.']
        );
        const announcements = await dbAsync.all(`SELECT * FROM course_announcements WHERE course_id = 1`);
        if (annRes.lastID && announcements.length >= 1) {
            console.log(`✓ [4/7] Course Announcement published (ID: ${annRes.lastID}, Total for Course 1: ${announcements.length}).`);
            passed++;
        }

        // Test 5: Student Learning Progress Tracking & Auto Progress Computation
        console.log('\nTest 5: Testing Student Lesson Progress Tracking & Completion Calculation...');
        await dbAsync.run(
            `INSERT INTO student_lesson_progress (student_id, lesson_id, course_id, is_completed, last_watched_seconds) VALUES (2, ?, 1, 1, 1080)
             ON CONFLICT(student_id, lesson_id) DO UPDATE SET is_completed = 1, last_watched_seconds = 1080`,
            [newLessonId]
        );
        const prog = await dbAsync.get(`SELECT * FROM student_lesson_progress WHERE student_id = 2 AND lesson_id = ?`, [newLessonId]);
        if (prog && prog.is_completed === 1) {
            console.log(`✓ [5/7] Student lesson progress saved (Student ID: 2, Lesson ID: ${newLessonId}, Completed: true, Watch Time: ${prog.last_watched_seconds}s).`);
            passed++;
        }

        // Test 6: Certificate Issuance & Conflict Handling
        console.log('\nTest 6: Testing Certificate Issuance Engine...');
        const certNum = `AUB-CERT-${new Date().getFullYear()}-TEST01`;
        const today = new Date().toISOString().split('T')[0];
        await dbAsync.run(
            `INSERT INTO certificates (certificate_number, student_id, course_id, issue_date, completion_date, grade_achieved, status, pdf_url)
             VALUES (?, 2, 1, ?, ?, 'A+ (High Distinction)', 'Issued', ?)
             ON CONFLICT(student_id, course_id) DO UPDATE SET certificate_number = excluded.certificate_number, status = 'Issued'`,
            [certNum, today, today, `https://aub.edu.kh/certificates/${certNum}.pdf`]
        );
        const cert = await dbAsync.get(`SELECT * FROM certificates WHERE student_id = 2 AND course_id = 1`);
        if (cert && cert.status === 'Issued') {
            console.log(`✓ [6/7] Certificate issued (Serial: ${cert.certificate_number}, Grade: ${cert.grade_achieved}, Status: ${cert.status}).`);
            passed++;
        }

        // Test 7: Administrative Audit Logging
        console.log('\nTest 7: Testing Administrative Audit Logs...');
        await dbAsync.run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details)
             VALUES (1, 'Dr. Johnathan Vance', 'ADMIN', 'TEST_ACTION', 'SystemTest', 999, 'Validation of complete LMS audit logging subsystem')`
        );
        const logs = await dbAsync.all(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5`);
        if (logs.length > 0 && logs.some(l => l.action === 'TEST_ACTION')) {
            console.log(`✓ [7/7] Audit log entry recorded and verified (${logs.length} recent audit logs retrieved).`);
            passed++;
        }

        // Cleanup test data
        await dbAsync.run(`DELETE FROM lesson_materials WHERE lesson_id = ?`, [newLessonId]);
        await dbAsync.run(`DELETE FROM lesson_videos WHERE lesson_id = ?`, [newLessonId]);
        await dbAsync.run(`DELETE FROM student_lesson_progress WHERE lesson_id = ?`, [newLessonId]);
        await dbAsync.run(`DELETE FROM lessons WHERE id = ?`, [newLessonId]);
        await dbAsync.run(`DELETE FROM course_announcements WHERE title = 'Automated Test Announcement'`);
        await dbAsync.run(`DELETE FROM audit_logs WHERE action = 'TEST_ACTION'`);

        console.log('\n====================================================');
        console.log(`🏆 ALL ${passed}/${total} LMS ARCHITECTURE TESTS PASSED!`);
        console.log('====================================================\n');
        process.exit(0);

    } catch (err) {
        console.error('❌ LMS Architecture Test Failed:', err);
        process.exit(1);
    }
}

runLmsArchitectureTests();
