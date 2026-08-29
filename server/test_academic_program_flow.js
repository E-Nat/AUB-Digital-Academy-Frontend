const { dbAsync, initSchema } = require('./db/database');
const adminController = require('./controllers/adminController');

function createMockRes() {
    const res = {
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
    return res;
}

async function runTests() {
    console.log('====================================================');
    console.log('   ACADEMIC MANAGEMENT - CREATE PROGRAM FLOW TESTS   ');
    console.log('====================================================');

    await initSchema();
    console.log('[PASS] 1. Database schema initialized.');

    // 1. Test: Create a full valid program
    const testProgramPayload = {
        title: 'Master of Artificial Intelligence & Robotics',
        code: 'MAIR-2026',
        slug: 'mair-2026',
        short_description: 'Advanced postgraduate degree in AI, neural systems, and robotic automation.',
        description: 'Comprehensive 2-year curriculum covering reinforcement learning, computer vision, kinematics, and generative models.',
        full_description: 'Comprehensive 2-year curriculum covering reinforcement learning, computer vision, kinematics, and generative models.',
        degree_type: "Master's Degree",
        category_id: 3,
        duration: '2 Years',
        credits: 60,
        image_url: 'assets/images/hero_digital_learning.jpg',
        learning_outcomes: [
            'Design and train deep neural architectures for autonomous robotics.',
            'Deploy computer vision models on edge computing devices.'
        ],
        instructor_ids: [1, 3],
        status: 'Published',
        is_featured: 1,
        is_published: 1,
        icon_class: 'bi-cpu',
        theme_class: 'theme-purple',
        order_num: 10
    };

    const req1 = { body: testProgramPayload };
    const res1 = createMockRes();

    await adminController.createProgram(req1, res1);
    console.log(`[TEST 1] Create Valid Program Status: ${res1.statusCode}`);
    if (res1.statusCode === 200 && res1.jsonData.success && res1.jsonData.id) {
        console.log(`[PASS] 2. Program created successfully with ID: ${res1.jsonData.id}`);
    } else {
        console.error(`[FAIL] Failed to create program:`, res1.jsonData);
        process.exit(1);
    }
    const createdId = res1.jsonData.id;

    // 2. Test: Verify program appears in database list
    const reqList = {};
    const resList = createMockRes();
    await adminController.getAllPrograms(reqList, resList);
    const foundProgram = resList.jsonData.data.find(p => p.id === createdId || p.code === 'MAIR-2026');
    if (foundProgram && foundProgram.title === testProgramPayload.title) {
        console.log(`[PASS] 3. Newly created program found in programs list: "${foundProgram.title}" (Code: ${foundProgram.code})`);
    } else {
        console.error(`[FAIL] Newly created program not found in list.`);
        process.exit(1);
    }

    // 3. Test: Duplicate Program Code Protection (409 Conflict)
    const reqDupe = { body: { ...testProgramPayload, title: 'Another Title Same Code' } };
    const resDupe = createMockRes();
    await adminController.createProgram(reqDupe, resDupe);
    console.log(`[TEST 3] Duplicate Code Status: ${resDupe.statusCode}`);
    if (resDupe.statusCode === 409 && resDupe.jsonData.message.includes('already exists')) {
        console.log(`[PASS] 4. Duplicate protection triggered: "${resDupe.jsonData.message}"`);
    } else {
        console.error(`[FAIL] Duplicate protection failed:`, resDupe.jsonData);
        process.exit(1);
    }

    // 4. Test: Missing Required Title (400 Bad Request)
    const reqMissingTitle = { body: { ...testProgramPayload, title: '', code: 'UNIQUE-123' } };
    const resMissingTitle = createMockRes();
    await adminController.createProgram(reqMissingTitle, resMissingTitle);
    if (resMissingTitle.statusCode === 400) {
        console.log(`[PASS] 5. Missing title validation triggered: "${resMissingTitle.jsonData.message}"`);
    } else {
        console.error(`[FAIL] Missing title validation failed:`, resMissingTitle.jsonData);
    }

    // 5. Clean up test record
    const reqDel = { params: { id: createdId } };
    const resDel = createMockRes();
    await adminController.deleteProgram(reqDel, resDel);
    if (resDel.statusCode === 200) {
        console.log(`[PASS] 6. Test program cleaned up successfully.`);
    }

    console.log('====================================================');
    console.log('   ALL BACKEND AND FLOW TESTS PASSED SUCCESSFULLY!  ');
    console.log('====================================================');
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
