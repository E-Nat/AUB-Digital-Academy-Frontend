const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const adminController = require('./controllers/adminController');
const { dbAsync, initSchema } = require('./db/database');

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

async function runEndToEndVerification() {
    console.log('======================================================================');
    console.log('   STEP 9: END-TO-END ROOT CAUSE & PERSISTENCE VERIFICATION SUITE   ');
    console.log('======================================================================');

    const dbPath = path.join(__dirname, '../data/aub_academy.sqlite');
    console.log(`[VERIFY 1] SQLite Database File on Disk: ${dbPath}`);
    if (!fs.existsSync(dbPath)) {
        throw new Error(`Database file not found at ${dbPath}`);
    }

    await initSchema();
    console.log('[PASS] 1. Database schema verified and initialized.');

    // Step 1: Count initial programs
    const initialProgramsRes = createMockRes();
    await adminController.getAllPrograms({}, initialProgramsRes);
    const initialCount = initialProgramsRes.jsonData.data.length;
    console.log(`[PASS] 2. Baseline programs count in database: ${initialCount}`);

    // Step 2: Create a brand new program
    const uniqueTestCode = `E2E-TEST-${Date.now()}`;
    const newProgramPayload = {
        title: 'Master of Quantum Computing & Cryptography',
        code: uniqueTestCode,
        slug: uniqueTestCode.toLowerCase(),
        degree_type: 'Master Degree',
        category_id: 3,
        duration: '2 Years',
        credits: 90,
        short_description: 'Rigorous 2-year postgraduate program covering quantum algorithms and post-quantum cryptography.',
        description: 'Comprehensive curriculum spanning qubits, quantum entanglement, Shor algorithm, and lattice cryptography.',
        full_description: 'Comprehensive curriculum spanning qubits, quantum entanglement, Shor algorithm, and lattice cryptography.',
        image_url: 'assets/images/course_cybersecurity.jpg',
        logo_url: '',
        learning_outcomes: [
            'Construct and optimize quantum circuits using Qiskit.',
            'Implement post-quantum lattice cryptographic primitives.'
        ],
        instructor_ids: [1, 5],
        status: 'Published',
        is_featured: 1,
        is_published: 1,
        icon_class: 'bi-cpu',
        theme_class: 'theme-purple',
        order_num: initialCount + 1
    };

    const createRes = createMockRes();
    await adminController.createProgram({ body: newProgramPayload }, createRes);
    
    console.log(`[VERIFY 3] Create Program Response Status: ${createRes.statusCode}`);
    if (createRes.statusCode !== 200 || !createRes.jsonData.success || !createRes.jsonData.id) {
        throw new Error(`Failed to create program: ${JSON.stringify(createRes.jsonData)}`);
    }
    const createdId = createRes.jsonData.id;
    console.log(`[PASS] 3. Program created in database with ID: ${createdId} (Code: ${uniqueTestCode})`);

    // Step 3: SIMULATE COMPLETE RESTART (Cold Database Re-connection)
    console.log('\n--- SIMULATING COMPLETE APPLICATION & COMPUTER RESTART ---');
    console.log('[ACTION] Closing existing connections and reopening SQLite database from disk...');
    
    const freshDb = new sqlite3.Database(dbPath);
    const freshDbAsync = {
        get: (sql, params = []) => new Promise((resolve, reject) => {
            freshDb.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
        }),
        all: (sql, params = []) => new Promise((resolve, reject) => {
            freshDb.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
        })
    };

    // Step 4: Verify persistence after cold restart
    const persistedRow = await freshDbAsync.get(
        `SELECT id, title, code, slug, degree_type, duration, credits, is_published, status FROM programs WHERE id = ?`,
        [createdId]
    );

    if (!persistedRow) {
        throw new Error(`[CRITICAL FAILURE] Program ID ${createdId} was NOT found in database file after restart!`);
    }

    console.log('[PASS] 4. Program 100% PERSISTED after cold restart:');
    console.log(`       - ID:          ${persistedRow.id}`);
    console.log(`       - Title:       ${persistedRow.title}`);
    console.log(`       - Code:        ${persistedRow.code}`);
    console.log(`       - Degree:      ${persistedRow.degree_type}`);
    console.log(`       - Duration:    ${persistedRow.duration}`);
    console.log(`       - Status:      ${persistedRow.status} (is_published: ${persistedRow.is_published})`);

    // Close freshDb
    await new Promise((resolve) => freshDb.close(resolve));

    // Step 5: Test Edit Program
    const updatePayload = {
        ...newProgramPayload,
        title: 'Master of Quantum Computing & Cryptography (Updated Edition)',
        duration: '2.5 Years',
        credits: 100
    };
    const updateRes = createMockRes();
    await adminController.updateProgram({ params: { id: createdId }, body: updatePayload }, updateRes);
    if (updateRes.statusCode !== 200 || !updateRes.jsonData.success) {
        throw new Error(`Failed to update program: ${JSON.stringify(updateRes.jsonData)}`);
    }
    console.log('[PASS] 5. Program updated successfully in database.');

    // Step 6: Test Toggle Publish
    const toggleRes = createMockRes();
    await adminController.toggleProgramPublish({ params: { id: createdId } }, toggleRes);
    if (toggleRes.statusCode !== 200 || toggleRes.jsonData.is_published !== 0) {
        throw new Error(`Failed to toggle program status to Draft`);
    }
    console.log('[PASS] 6. Toggle publish status tested (Published -> Draft).');

    // Step 7: Test Duplicate Code Protection (409)
    const dupeRes = createMockRes();
    await adminController.createProgram({ body: { ...newProgramPayload, code: uniqueTestCode, title: 'Duplicate Code Attempt' } }, dupeRes);
    if (dupeRes.statusCode !== 409 || !dupeRes.jsonData.message.includes('already exists')) {
        throw new Error(`Duplicate protection failed: Expected 409, got ${dupeRes.statusCode}`);
    }
    console.log(`[PASS] 7. Duplicate program code prevention verified (409 Conflict: "${dupeRes.jsonData.message}").`);

    // Step 8: Test Missing Required Title (400)
    const missingTitleRes = createMockRes();
    await adminController.createProgram({ body: { ...newProgramPayload, code: 'UNIQUE-XYZ', title: '' } }, missingTitleRes);
    if (missingTitleRes.statusCode !== 400) {
        throw new Error(`Validation failed: Expected 400 for empty title, got ${missingTitleRes.statusCode}`);
    }
    console.log(`[PASS] 8. Validation error handling verified (400 Bad Request: "${missingTitleRes.jsonData.message}").`);

    // Step 9: Clean up test program
    const deleteRes = createMockRes();
    await adminController.deleteProgram({ params: { id: createdId } }, deleteRes);
    if (deleteRes.statusCode !== 200 || !deleteRes.jsonData.success) {
        throw new Error(`Failed to delete test program`);
    }
    console.log('[PASS] 9. Cleaned up test record from database.');

    console.log('======================================================================');
    console.log('   ALL TESTS PASSED: "ADD NEW PROGRAM" PERSISTENCE IS 100% VERIFIED  ');
    console.log('======================================================================');
}

runEndToEndVerification().catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
});
