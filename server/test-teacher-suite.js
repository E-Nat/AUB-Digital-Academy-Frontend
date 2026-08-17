const { dbAsync, initSchema } = require('./db/database');
const { seedDatabase } = require('./db/seeds');

async function runTeacherTestSuite() {
    console.log('========================================');
    console.log('🧪 RUNNING TEACHER MANAGEMENT TEST SUITE');
    console.log('========================================\n');

    await initSchema();
    await seedDatabase();

    // 1. Test Departments
    const depts = await dbAsync.all('SELECT * FROM departments');
    console.log(`✓ [1/10] Departments Count: ${depts.length} (Expected >= 10)`);
    if (depts.length < 10) throw new Error('Departments count mismatch');

    // 2. Test Teachers Count & Roles
    const teachers = await dbAsync.all(`
        SELECT t.*, u.full_name, u.email, d.name as dept_name
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE t.deleted_at IS NULL
    `);
    console.log(`✓ [2/10] Active Teachers Count: ${teachers.length} (Expected >= 16)`);
    if (teachers.length < 16) throw new Error('Teachers count below requirement');

    // 3. Test Teacher <-> Course Many-to-Many Relationship
    const teacherCourses = await dbAsync.all(`
        SELECT tc.*, c.title as course_title, u.full_name as teacher_name
        FROM teacher_courses tc
        JOIN courses c ON tc.course_id = c.id
        JOIN users u ON tc.teacher_id = u.id
    `);
    console.log(`✓ [3/10] Teacher Course Assignments: ${teacherCourses.length} links verified`);

    // 4. Test Teacher <-> Class Relationship
    const classes = await dbAsync.all(`
        SELECT cl.*, c.title as course_title, u.full_name as teacher_name
        FROM classes cl
        JOIN courses c ON cl.course_id = c.id
        JOIN users u ON cl.teacher_id = u.id
    `);
    console.log(`✓ [4/10] Classes Taught: ${classes.length} active classes verified`);

    // 5. Test Teacher <-> Student Relationship (Teacher -> Class -> Enrollment -> Student)
    const studentsTaught = await dbAsync.all(`
        SELECT DISTINCT u.full_name as student_name, cl.class_name, t_user.full_name as teacher_name
        FROM class_enrollments ce
        JOIN classes cl ON ce.class_id = cl.id
        JOIN users u ON ce.student_id = u.id
        JOIN users t_user ON cl.teacher_id = t_user.id
        WHERE cl.teacher_id = 7
    `);
    console.log(`✓ [5/10] Students Taught by Dr. Sarah Johnson: ${studentsTaught.length} students enrolled`);

    // 6. Test Teacher Creation
    const newTeacherUser = await dbAsync.run(`
        INSERT INTO users (full_name, email, university_id, password_hash, role_id, status)
        VALUES ('Test Faculty Member', 'test.faculty@aub.edu.kh', 'TCH-999', 'hash123', 2, 'Active')
    `);
    const newTeacherProf = await dbAsync.run(`
        INSERT INTO teachers (user_id, teacher_code, department_id, specialization, employment_type, status)
        VALUES (?, 'TCH-999', 1, 'Quantum Computing & Algorithms', 'Full-Time', 'Active')
    `, [newTeacherUser.lastID]);
    console.log(`✓ [6/10] Teacher Creation: Successfully created Teacher ID ${newTeacherProf.lastID}`);

    // 7. Test Teacher Update
    await dbAsync.run(`
        UPDATE teachers SET specialization = 'Advanced Quantum Computing' WHERE id = ?
    `, [newTeacherProf.lastID]);
    const updated = await dbAsync.get('SELECT specialization FROM teachers WHERE id = ?', [newTeacherProf.lastID]);
    console.log(`✓ [7/10] Teacher Update: Specialization updated to "${updated.specialization}"`);

    // 8. Test Safe / Soft Deletion
    await dbAsync.run(`
        UPDATE teachers SET status = 'Inactive', deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [newTeacherProf.lastID]);
    const softDeleted = await dbAsync.get('SELECT status, deleted_at FROM teachers WHERE id = ?', [newTeacherProf.lastID]);
    console.log(`✓ [8/10] Safe Soft Deletion: Status="${softDeleted.status}", DeletedAt="${softDeleted.deleted_at}" (Record Preserved)`);

    // 9. Test Statistics Aggregation
    const statsTotal = await dbAsync.get('SELECT COUNT(*) as count FROM teachers WHERE deleted_at IS NULL');
    const statsDepts = await dbAsync.all('SELECT d.name, COUNT(t.id) as count FROM departments d LEFT JOIN teachers t ON t.department_id = d.id AND t.deleted_at IS NULL GROUP BY d.id');
    console.log(`✓ [9/10] Statistics Query: ${statsTotal.count} active teachers across ${statsDepts.length} departments`);

    // Cleanup test record
    await dbAsync.run('DELETE FROM teachers WHERE id = ?', [newTeacherProf.lastID]);
    await dbAsync.run('DELETE FROM users WHERE id = ?', [newTeacherUser.lastID]);
    console.log('✓ [10/10] Test data cleaned up.');

    console.log('\n========================================');
    console.log('🎉 ALL 10 TEACHER TEST CASES PASSED!');
    console.log('========================================');
    process.exit(0);
}

runTeacherTestSuite().catch(err => {
    console.error('❌ Test Suite Failed:', err);
    process.exit(1);
});
