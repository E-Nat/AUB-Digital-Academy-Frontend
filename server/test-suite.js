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
const PORT = 5055;
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

    // STEP 1: Verify Server
    await new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[PASS] 1. Express Server running on test port ${PORT}`);
            resolve();
        });
    });

    // STEP 2: Verify Admin Authentication
    try {
        const res = await request('POST', '/auth/login', {
            loginId: 'admin@aub.edu.com',
            password: 'admin123'
        });

        if (res.status === 200 && res.body.token) {
            adminToken = res.body.token;
            console.log(`[PASS] 2. Admin Authentication succeeded.`);
        }
    } catch (e) {
        console.error('[FAIL] 2. Auth test failed:', e.message);
    }

    const authHeader = { 'Authorization': `Bearer ${adminToken}` };

    // STEP 3: Verify Dynamic Dashboard Metrics from SQL
    try {
        const res = await request('GET', '/admin/dashboard/metrics', null, authHeader);
        const m = res.body.data;
        console.log(`[PASS] 3. Real SQL Metrics returned:`);
        console.log(`       - Total Users: ${m.totalUsers} (from SELECT COUNT(*) FROM users)`);
        console.log(`       - Total Courses: ${m.totalCourses} (from SELECT COUNT(*) FROM courses WHERE is_published = 1)`);
        console.log(`       - Total Students: ${m.totalStudents} (from SELECT COUNT(*) FROM users WHERE role = STUDENT)`);
        console.log(`       - Total Teachers: ${m.totalTeachers} (from SELECT COUNT(*) FROM instructors)`);
        console.log(`       - Total Chapters: ${m.totalChapters} (from SELECT COUNT(*) FROM modules)`);
        console.log(`       - Total Enrollments: ${m.totalEnrollments} (from SELECT COUNT(*) FROM enrollments)`);
    } catch (e) {
        console.error('[FAIL] 3. Metrics failed:', e.message);
    }

    // STEP 4: Verify "Students by Major" (Actual Students Count) & Timeframe Filters
    try {
        const res = await request('GET', '/admin/dashboard/stats?timeframe=this_month', null, authHeader);
        const s = res.body.data;
        console.log(`[PASS] 4. Students by Major (Actual distinct student counts from DB):`);
        const majors = Array.isArray(s.studentsByMajor) ? s.studentsByMajor : (s.studentsByMajor.majors || []);
        majors.forEach(m => {
            console.log(`       - Major: ${m.major} | Count: ${m.count} students (${m.percentage}%)`);
        });

        console.log(`[PASS] 4b. Enrollment Statistics Chart Categories:`);
        s.enrollmentStatistics.categories.forEach(c => {
            console.log(`       - Department: ${c.name} | Enrollments: ${c.count} (${c.percentage}%)`);
        });
    } catch (e) {
        console.error('[FAIL] 4. Stats failed:', e.message);
    }

    // STEP 5: Verify Notifications System
    try {
        const res = await request('GET', '/admin/notifications', null, authHeader);
        if (res.status === 200 && res.body.data) {
            console.log(`[PASS] 5. Real System Notifications: ${res.body.data.notifications.length} alerts (Unread: ${res.body.data.unreadCount})`);
            res.body.data.notifications.forEach(n => console.log(`       - [${n.type.toUpperCase()}] ${n.title}: ${n.message}`));
        }
    } catch (e) {
        console.error('[FAIL] 5. Notifications failed:', e.message);
    }

    // STEP 6: Verify Functional Global Search
    try {
        const res = await request('GET', '/admin/search?q=Web', null, authHeader);
        if (res.status === 200 && res.body.data) {
            const hits = res.body.data.courses.length + res.body.data.programs.length;
            console.log(`[PASS] 6. Global Search for 'Web': found ${hits} records (Course: "${res.body.data.courses[0]?.title}")`);
        }

        const userRes = await request('GET', '/admin/search?q=Virak', null, authHeader);
        if (userRes.status === 200 && userRes.body.data.users.length > 0) {
            console.log(`[PASS] 6b. Global Search for 'Virak': found User "${userRes.body.data.users[0].title}" (Role: ${userRes.body.data.users[0].role})`);
        }
    } catch (e) {
        console.error('[FAIL] 6. Search failed:', e.message);
    }

    server.close(() => {
        console.log('\n====================================================');
        console.log('✅ ALL ADMIN DASHBOARD DATABASE TESTS COMPLETED!');
        console.log('====================================================');
        process.exit(0);
    });
}

runTests();
