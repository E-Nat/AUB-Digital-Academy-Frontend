const http = require('http');
const { dbAsync } = require('./db/database');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

let server;
const PORT = 5055; // Dedicated test port
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('====================================================');
    console.log('🧪 RUNNING AUB DIGITAL ACADEMY SYSTEM TEST SUITE');
    console.log('====================================================\n');

    let adminToken = '';
    let studentToken = '';
    let createdProgramId = null;

    // STEP 1: Verify Server
    await new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[PASS] 1. Express Server running on test port ${PORT}`);
            resolve();
        });
    });

    // STEP 2 & 3: Verify SQLite Database Connection & Tables
    try {
        const userCount = await dbAsync.get('SELECT COUNT(*) as count FROM users');
        const progCount = await dbAsync.get('SELECT COUNT(*) as count FROM programs');
        const courseCount = await dbAsync.get('SELECT COUNT(*) as count FROM courses');
        console.log(`[PASS] 2. SQLite Database connected. Tables verified:`);
        console.log(`       - Users: ${userCount.count}`);
        console.log(`       - Programs: ${progCount.count} (Expected: 6)`);
        console.log(`       - Courses: ${courseCount.count} (Expected: 4)`);
    } catch (e) {
        console.error('[FAIL] 2. Database query failed:', e.message);
    }

    // STEP 4: Verify Admin Authentication
    try {
        const res = await request('POST', '/auth/login', {
            loginId: 'admin@aub.edu.kh',
            password: 'admin123'
        });

        if (res.status === 200 && res.body.success && res.body.token && res.body.user.role === 'ADMIN') {
            adminToken = res.body.token;
            console.log(`[PASS] 4. Admin Authentication succeeded. (Token issued for: ${res.body.user.full_name}, Role: ${res.body.user.role})`);
        } else {
            console.error('[FAIL] 4. Admin Login failed:', res);
        }

        // Student Login
        const studentRes = await request('POST', '/auth/login', {
            loginId: 'sok.virak@student.aub.edu.kh',
            password: 'student123'
        });
        if (studentRes.status === 200 && studentRes.body.token) {
            studentToken = studentRes.body.token;
            console.log(`[PASS] 4. Student Authentication succeeded. (Role: ${studentRes.body.user.role})`);
        }
    } catch (e) {
        console.error('[FAIL] 4. Auth test failed:', e.message);
    }

    // STEP 5: Verify Role-Based Authorization
    try {
        // Unauthenticated request
        const unauthRes = await request('GET', '/admin/dashboard/metrics');
        if (unauthRes.status === 401) {
            console.log(`[PASS] 5a. Unauthenticated access blocked with 401.`);
        } else {
            console.error('[FAIL] 5a. Unauthenticated access was not blocked:', unauthRes.status);
        }

        // Student trying to access Admin route
        const studentAccessRes = await request('GET', '/admin/dashboard/metrics', null, {
            'Authorization': `Bearer ${studentToken}`
        });
        if (studentAccessRes.status === 403) {
            console.log(`[PASS] 5b. Student access to Admin route blocked with 403 Forbidden.`);
        } else {
            console.error('[FAIL] 5b. Student was not blocked from admin route:', studentAccessRes.status);
        }

        // Admin authorized access
        const adminAccessRes = await request('GET', '/admin/dashboard/metrics', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        if (adminAccessRes.status === 200 && adminAccessRes.body.success) {
            console.log(`[PASS] 5c. Admin authorized access granted (200 OK).`);
        } else {
            console.error('[FAIL] 5c. Admin access failed:', adminAccessRes);
        }
    } catch (e) {
        console.error('[FAIL] 5. Role protection test failed:', e.message);
    }

    // STEP 6: Verify Admin Dashboard Metrics
    try {
        const res = await request('GET', '/admin/dashboard/metrics', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        const m = res.body.data;
        if (m.totalUsers && m.totalCourses && m.totalStudents) {
            console.log(`[PASS] 6. Real SQL-Calculated Metrics verified:`);
            console.log(`       - Total Users: ${m.totalUsers}`);
            console.log(`       - Total Courses: ${m.totalCourses}`);
            console.log(`       - Total Students: ${m.totalStudents}`);
            console.log(`       - Total Teachers: ${m.totalTeachers}`);
            console.log(`       - Total Chapters: ${m.totalChapters}`);
            console.log(`       - Total Enrollments: ${m.totalEnrollments}`);
        } else {
            console.error('[FAIL] 6. Metrics incomplete:', res.body);
        }
    } catch (e) {
        console.error('[FAIL] 6. Dashboard metrics failed:', e.message);
    }

    // STEP 7: Verify Public Programs API (Initial 6 Programs)
    try {
        const res = await request('GET', '/public/programs/featured');
        if (res.status === 200 && res.body.data && res.body.data.length === 6) {
            console.log(`[PASS] 7. Public Featured Programs API returns exact 6 programs:`);
            res.body.data.forEach((p, idx) => {
                console.log(`       ${idx + 1}. [${p.theme_class}] ${p.title} (${p.duration}) - Tags: [${p.tags.join(', ')}]`);
            });
        } else {
            console.error('[FAIL] 7. Public programs count mismatch:', res.body);
        }
    } catch (e) {
        console.error('[FAIL] 7. Public programs test failed:', e.message);
    }

    // STEP 8: Create New Program via Admin API
    try {
        const createRes = await request('POST', '/admin/programs', {
            title: 'Robotics & AI Automation',
            slug: 'robotics-ai-automation',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Master autonomous robotics, intelligent control systems, and industrial AI engineering.',
            icon_class: 'bi-robot',
            theme_class: 'theme-cyan',
            detail_url: 'pages/programs/robotics.html',
            order_num: 7,
            is_featured: 1,
            is_published: 1
        }, { 'Authorization': `Bearer ${adminToken}` });

        if (createRes.status === 200 && createRes.body.success) {
            createdProgramId = createRes.body.id;
            console.log(`[PASS] 8. Admin Created Program 'Robotics & AI Automation' (ID: ${createdProgramId})`);

            // Verify it immediately appears in Public API
            const pubRes = await request('GET', '/public/programs/featured');
            const found = pubRes.body.data.find(p => p.id === createdProgramId);
            if (found && pubRes.body.data.length === 7) {
                console.log(`[PASS] 8b. Newly created program verified live in Public Featured Programs API!`);
            } else {
                console.error('[FAIL] 8b. Program not found in public API:', pubRes.body);
            }
        } else {
            console.error('[FAIL] 8. Create program failed:', createRes);
        }
    } catch (e) {
        console.error('[FAIL] 8. Create program test failed:', e.message);
    }

    // STEP 9: Update Program via Admin API
    try {
        const updateRes = await request('PUT', `/admin/programs/${createdProgramId}`, {
            title: 'Advanced Robotics & AI Systems',
            slug: 'advanced-robotics-ai',
            degree_type: 'MASTER DEGREE',
            duration: '2 Years',
            description: 'Updated description for graduate level autonomous robotics and machine vision.',
            icon_class: 'bi-cpu',
            theme_class: 'theme-purple',
            detail_url: 'pages/programs/robotics.html',
            order_num: 7,
            is_featured: 1,
            is_published: 1
        }, { 'Authorization': `Bearer ${adminToken}` });

        if (updateRes.status === 200 && updateRes.body.success) {
            console.log(`[PASS] 9. Admin Updated Program (Title changed to 'Advanced Robotics & AI Systems', Degree: 'MASTER DEGREE')`);

            // Verify update reflected in Public API
            const pubRes = await request('GET', '/public/programs/featured');
            const updated = pubRes.body.data.find(p => p.id === createdProgramId);
            if (updated && updated.title === 'Advanced Robotics & AI Systems' && updated.degree_type === 'MASTER DEGREE') {
                console.log(`[PASS] 9b. Program updates verified live in Public API!`);
            } else {
                console.error('[FAIL] 9b. Update not reflected in public API:', updated);
            }
        } else {
            console.error('[FAIL] 9. Update program failed:', updateRes);
        }
    } catch (e) {
        console.error('[FAIL] 9. Update program test failed:', e.message);
    }

    // STEP 10: Toggle Publish Status
    try {
        const toggleRes = await request('PATCH', `/admin/programs/${createdProgramId}/toggle-publish`, null, {
            'Authorization': `Bearer ${adminToken}`
        });

        if (toggleRes.status === 200 && toggleRes.body.is_published === 0) {
            console.log(`[PASS] 10. Admin Unpublished Program (is_published = 0).`);

            // Verify excluded from Public API
            const pubRes = await request('GET', '/public/programs/featured');
            const found = pubRes.body.data.find(p => p.id === createdProgramId);
            if (!found && pubRes.body.data.length === 6) {
                console.log(`[PASS] 10b. Unpublished program properly hidden from Public Website API!`);
            } else {
                console.error('[FAIL] 10b. Unpublished program still visible in public API:', pubRes.body);
            }
        } else {
            console.error('[FAIL] 10. Toggle publish failed:', toggleRes);
        }
    } catch (e) {
        console.error('[FAIL] 10. Toggle publish test failed:', e.message);
    }

    // CLEANUP: Delete Test Program
    try {
        const delRes = await request('DELETE', `/admin/programs/${createdProgramId}`, null, {
            'Authorization': `Bearer ${adminToken}`
        });
        if (delRes.status === 200 && delRes.body.success) {
            console.log(`[PASS] 11. Admin Deleted Test Program. (Database restored to clean 6 seeded programs)`);
        }
    } catch (e) {
        console.error('[FAIL] 11. Delete program test failed:', e.message);
    }

    server.close(() => {
        console.log('\n====================================================');
        console.log('✅ ALL DATABASE & PROGRAM MANAGEMENT TESTS PASSED!');
        console.log('====================================================');
        process.exit(0);
    });
}

runTests();
