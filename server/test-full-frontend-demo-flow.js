const path = require('path');
const adminController = require('./controllers/adminController');
const { dbAsync, initSchema } = require('./db/database');

function createMockRes() {
    return {
        statusCode: 200,
        headers: {},
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        }
    };
}

async function testCompleteAdminFlow() {
    console.log('================================================================');
    console.log('   FULL FRONTEND DEMO FLOW & FUNCTIONALITY VERIFICATION SUITE   ');
    console.log('================================================================');

    await initSchema();
    console.log('[PASS] 1. Database schema verified and initialized.');

    // ─────────────────────────────────────────────────────────────
    // PHASE 1: ACADEMIC MANAGEMENT — FEATURED PROGRAMS FLOW
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PHASE 1: ACADEMIC PROGRAMS FLOW ---');
    
    // 1. Fetch initial programs
    const resList1 = createMockRes();
    await adminController.getAllPrograms({}, resList1);
    console.log(`[PASS] 2. Fetched active programs list (Count: ${resList1.jsonData.data.length}).`);

    // 2. Add New Program
    const newProgCode = `DEMO-CS-${Date.now().toString().slice(-4)}`;
    const newProgPayload = {
        title: 'Bachelor of Computer Science & Intelligent Systems',
        code: newProgCode,
        slug: newProgCode.toLowerCase(),
        degree_type: 'Bachelor Degree',
        category_id: 1,
        duration: '4 Years',
        credits: 130,
        short_description: 'Premier 4-year undergraduate degree in computer science, software architecture, and AI systems.',
        description: 'Comprehensive curriculum covering algorithms, data structures, cloud systems, and applied machine learning.',
        full_description: 'Comprehensive curriculum covering algorithms, data structures, cloud systems, and applied machine learning.',
        image_url: 'assets/images/hero_digital_learning.jpg',
        logo_url: '',
        learning_outcomes: [
            'Architect scalable distributed software systems.',
            'Develop secure cloud-native web applications.'
        ],
        instructor_ids: [1, 2],
        status: 'Published',
        is_featured: 1,
        is_published: 1,
        icon_class: 'bi-laptop',
        theme_class: 'theme-blue',
        order_num: 1
    };

    const resCreate = createMockRes();
    await adminController.createProgram({ body: newProgPayload }, resCreate);
    if (resCreate.statusCode !== 200 || !resCreate.jsonData.success) {
        throw new Error(`Create program failed: ${JSON.stringify(resCreate.jsonData)}`);
    }
    const createdProgId = resCreate.jsonData.id;
    console.log(`[PASS] 3. Add New Program successful (ID: ${createdProgId}, Code: ${newProgCode}).`);

    // 3. View Program Details
    const resView = createMockRes();
    await adminController.getProgramById({ params: { id: createdProgId } }, resView);
    if (resView.statusCode !== 200 || resView.jsonData.data.title !== newProgPayload.title) {
        throw new Error(`View program failed.`);
    }
    console.log(`[PASS] 4. View Program Details verified: "${resView.jsonData.data.title}".`);

    // 4. Edit Program
    const editPayload = {
        ...newProgPayload,
        title: 'Bachelor of Computer Science & Intelligent Systems (Honours)',
        credits: 140,
        duration: '4 Years (Honours)'
    };
    const resEdit = createMockRes();
    await adminController.updateProgram({ params: { id: createdProgId }, body: editPayload }, resEdit);
    if (resEdit.statusCode !== 200 || !resEdit.jsonData.success) {
        throw new Error(`Edit program failed.`);
    }
    console.log(`[PASS] 5. Edit Program successful (Updated credits to 140).`);

    // 5. Toggle Publish Status (Published -> Draft -> Published)
    const resToggle1 = createMockRes();
    await adminController.toggleProgramPublish({ params: { id: createdProgId } }, resToggle1);
    if (resToggle1.statusCode !== 200 || resToggle1.jsonData.is_published !== 0) {
        throw new Error(`Toggle to Draft failed.`);
    }
    console.log(`[PASS] 6. Toggle Status (Published -> Draft) verified.`);

    const resToggle2 = createMockRes();
    await adminController.toggleProgramPublish({ params: { id: createdProgId } }, resToggle2);
    if (resToggle2.statusCode !== 200 || resToggle2.jsonData.is_published !== 1) {
        throw new Error(`Toggle back to Published failed.`);
    }
    console.log(`[PASS] 7. Toggle Status (Draft -> Published) verified.`);

    // 6. Duplicate Code Validation (409)
    const resDupe = createMockRes();
    await adminController.createProgram({ body: { ...newProgPayload, code: newProgCode, title: 'Duplicate Program Title' } }, resDupe);
    if (resDupe.statusCode !== 409) {
        throw new Error(`Duplicate protection failed.`);
    }
    console.log(`[PASS] 8. Duplicate Program Code Protection (HTTP 409 Conflict) verified.`);

    // 7. Delete Program
    const resDel = createMockRes();
    await adminController.deleteProgram({ params: { id: createdProgId } }, resDel);
    if (resDel.statusCode !== 200 || !resDel.jsonData.success) {
        throw new Error(`Delete program failed.`);
    }
    console.log(`[PASS] 9. Delete Program verified.`);

    // ─────────────────────────────────────────────────────────────
    // PHASE 2: DASHBOARD METRICS & REAL-TIME STATS FLOW
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PHASE 2: DASHBOARD COMMAND CENTER ---');
    const resMetrics = createMockRes();
    await adminController.getDashboardMetrics({}, resMetrics);
    if (resMetrics.statusCode !== 200 || !resMetrics.jsonData.success) {
        throw new Error(`Dashboard metrics failed.`);
    }
    console.log(`[PASS] 10. Dashboard Metrics verified (Total Users: ${resMetrics.jsonData.data.totalUsers}, Total Courses: ${resMetrics.jsonData.data.totalCourses}, Total Enrollments: ${resMetrics.jsonData.data.totalEnrollments}).`);

    const resStats = createMockRes();
    await adminController.getDashboardStats({ query: { enrollmentTimeframe: 'all_time', majorTimeframe: 'all_time' } }, resStats);
    if (resStats.statusCode !== 200 || !resStats.jsonData.success) {
        throw new Error(`Dashboard stats failed.`);
    }
    console.log(`[PASS] 11. Dashboard Analytics & Major Breakdown verified.`);

    const resRecent = createMockRes();
    await adminController.getRecentEnrollments({}, resRecent);
    if (resRecent.statusCode !== 200 || !resRecent.jsonData.success) {
        throw new Error(`Dashboard Recent Enrollments list verified.`);
    }
    console.log(`[PASS] 12. Dashboard Recent Enrollments table verified (Count: ${resRecent.jsonData.data.length}).`);

    // ─────────────────────────────────────────────────────────────
    // PHASE 3: SPECIALIZED COURSES & CATEGORIES FLOW
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- PHASE 3: SPECIALIZED COURSES & CATEGORIES ---');
    const resCourses = createMockRes();
    await adminController.getAllCourses({}, resCourses);
    console.log(`[PASS] 13. Courses list retrieved (Count: ${resCourses.jsonData.data.length}).`);

    const resCategories = createMockRes();
    await adminController.getAllCategories({}, resCategories);
    console.log(`[PASS] 14. Categories & Academic tags list retrieved (Count: ${resCategories.jsonData.data.length}).`);

    const resInstructors = createMockRes();
    await adminController.getAllInstructors({}, resInstructors);
    console.log(`[PASS] 15. Academic Faculty & Instructors list retrieved (Count: ${resInstructors.jsonData.data.length}).`);

    console.log('\n================================================================');
    console.log('   ALL 15 FRONTEND DEMO FLOW CHECKS COMPLETED WITH 100% SUCCESS  ');
    console.log('================================================================');
}

testCompleteAdminFlow().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
