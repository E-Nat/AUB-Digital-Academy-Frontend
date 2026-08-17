const { dbAsync, initSchema } = require('./db/database');

async function testAssignments() {
    console.log('Testing Assignments System...');
    await initSchema();

    // 1. Get or create test course & teacher
    let teacher = await dbAsync.get("SELECT id FROM users WHERE role_id = 2 LIMIT 1");
    if (!teacher) {
        teacher = { id: 2 };
    }

    let course = await dbAsync.get("SELECT id FROM courses LIMIT 1");
    if (!course) {
        const res = await dbAsync.run("INSERT INTO courses (title, slug, description) VALUES ('Full-Stack Web Dev', 'full-stack-web-dev', 'Course description')");
        course = { id: res.lastID };
    }

    // 2. Create Assignment
    const createRes = await dbAsync.run(`
        INSERT INTO assignments (course_id, teacher_id, title, description, due_date, total_points, status)
        VALUES (?, ?, 'Test Assignment 1', 'Build CRUD API', '2026-09-01T23:59:00', 100, 'Published')
    `, [course.id, teacher.id]);

    console.log('✓ Created Assignment ID:', createRes.lastID);

    // 3. Query Assignment
    const assignment = await dbAsync.get("SELECT * FROM assignments WHERE id = ?", [createRes.lastID]);
    console.log('✓ Retrieved Assignment Title:', assignment.title);

    // 4. Update Assignment
    await dbAsync.run("UPDATE assignments SET title = 'Updated Assignment 1' WHERE id = ?", [createRes.lastID]);
    const updated = await dbAsync.get("SELECT title FROM assignments WHERE id = ?", [createRes.lastID]);
    console.log('✓ Updated Assignment Title:', updated.title);

    // 5. Cleanup
    await dbAsync.run("DELETE FROM assignments WHERE id = ?", [createRes.lastID]);
    console.log('✓ Cleanup completed.');
    console.log('All Assignment DB tests passed successfully!');
    process.exit(0);
}

testAssignments().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
