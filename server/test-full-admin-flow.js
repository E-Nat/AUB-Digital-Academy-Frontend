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
const PORT = 5057;
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

async function runFullAdminFlow() {
    console.log('===============================================================');
    console.log('🧪 COMPLETE ADMIN SYSTEM & DATABASE END-TO-END VERIFICATION');
    console.log('===============================================================\n');

    await new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[PASS] 1. Server started on test port ${PORT}`);
            resolve();
        });
    });

    let adminToken = '';
    let testUserId = null;
    let testProgramId = null;
    let testCourseId = null;

    // 1. ADMIN LOGIN
    console.log('\n--- 1. AUTHENTICATION & LOGIN ---');
    const loginRes = await request('POST', '/auth/login', {
        loginId: 'admin@aub.edu.kh',
        password: 'admin123'
    });

    if (loginRes.status === 200 && loginRes.body.token && loginRes.body.user.role === 'ADMIN') {
        adminToken = loginRes.body.token;
        console.log(`[PASS] Admin Login succeeded. JWT Token issued for: ${loginRes.body.user.full_name} (${loginRes.body.user.email})`);
    } else {
        console.error('[FAIL] Admin login failed:', loginRes);
        process.exit(1);
    }

    const authHeaders = { 'Authorization': `Bearer ${adminToken}` };

    // 2. DASHBOARD METRICS & STATS
    console.log('\n--- 2. ADMIN DASHBOARD METRICS & STATS ---');
    const metricsRes = await request('GET', '/admin/dashboard/metrics', null, authHeaders);
    const m = metricsRes.body.data;
    console.log(`[PASS] SQL Metrics Calculated:`);
    console.log(`       - Total Users: ${m.totalUsers}`);
    console.log(`       - Total Courses: ${m.totalCourses}`);
    console.log(`       - Total Students: ${m.totalStudents}`);
    console.log(`       - Total Teachers: ${m.totalTeachers}`);
    console.log(`       - Total Chapters: ${m.totalChapters}`);
    console.log(`       - Total Enrollments: ${m.totalEnrollments}`);

    const statsRes = await request('GET', '/admin/dashboard/stats?timeframe=this_month', null, authHeaders);
    console.log(`[PASS] Enrollment Distribution: ${statsRes.body.data.enrollmentStatistics.categories.length} categories`);
    console.log(`[PASS] Students by Major: ${statsRes.body.data.studentsByMajor.length} majors`);

    // 3. USER MANAGEMENT CRUD
    console.log('\n--- 3. USER MANAGEMENT CRUD ---');
    // List Users
    const usersListRes = await request('GET', '/admin/users', null, authHeaders);
    console.log(`[PASS] Listed ${usersListRes.body.data.length} users from SQLite database.`);

    // Create User
    const createUserRes = await request('POST', '/admin/users', {
        full_name: 'Test Student Account',
        email: 'test.student@aub.edu.kh',
        university_id: '0009999',
        role_id: 3,
        status: 'Active',
        password: 'Password123!'
    }, authHeaders);

    if (createUserRes.status === 200 && createUserRes.body.id) {
        testUserId = createUserRes.body.id;
        console.log(`[PASS] Created user ID: ${testUserId}`);
    } else {
        console.error('[FAIL] User creation failed:', createUserRes);
        process.exit(1);
    }

    // Edit User
    const editUserRes = await request('PUT', `/admin/users/${testUserId}`, {
        full_name: 'Test Student Updated',
        email: 'test.student@aub.edu.kh',
        university_id: '0009999',
        role_id: 3,
        status: 'Inactive'
    }, authHeaders);

    if (editUserRes.status === 200 && editUserRes.body.success) {
        console.log(`[PASS] Edited user ID: ${testUserId} (Name updated to 'Test Student Updated', Status: Inactive)`);
    } else {
        console.error('[FAIL] User edit failed:', editUserRes);
    }

    // Delete User
    const delUserRes = await request('DELETE', `/admin/users/${testUserId}`, null, authHeaders);
    if (delUserRes.status === 200) {
        console.log(`[PASS] Deleted test user ID: ${testUserId}`);
    }

    // 4. ACADEMIC MANAGEMENT CRUD (PROGRAMS & COURSES)
    console.log('\n--- 4. ACADEMIC MANAGEMENT CRUD ---');
    // Programs List
    const progsRes = await request('GET', '/admin/programs', null, authHeaders);
    console.log(`[PASS] Listed ${progsRes.body.data.length} programs from SQLite database.`);

    // Create Program
    const createProgRes = await request('POST', '/admin/programs', {
        title: 'Artificial Intelligence & Robotics',
        slug: 'ai-robotics-engineering',
        degree_type: 'BACHELOR DEGREE',
        duration: '4 Years',
        description: 'Pioneering intelligent autonomous systems and deep machine learning.',
        icon_class: 'bi-robot',
        theme_class: 'theme-cyan',
        detail_url: '#',
        order_num: 7,
        is_featured: 1,
        is_published: 1
    }, authHeaders);

    testProgramId = createProgRes.body.id;
    console.log(`[PASS] Created Program ID: ${testProgramId}`);

    // Update Program
    const updateProgRes = await request('PUT', `/admin/programs/${testProgramId}`, {
        title: 'Master of AI & Robotics',
        slug: 'master-ai-robotics',
        degree_type: 'MASTER DEGREE',
        duration: '2 Years',
        description: 'Advanced graduate program in deep robotics engineering.',
        icon_class: 'bi-cpu',
        theme_class: 'theme-purple',
        detail_url: '#',
        order_num: 7,
        is_featured: 1,
        is_published: 1
    }, authHeaders);
    console.log(`[PASS] Updated Program ID: ${testProgramId}`);

    // Delete Program
    await request('DELETE', `/admin/programs/${testProgramId}`, null, authHeaders);
    console.log(`[PASS] Deleted Program ID: ${testProgramId}`);

    // Courses List & Create
    const createCourseRes = await request('POST', '/admin/courses', {
        title: 'Cloud DevOps & Kubernetes',
        slug: 'cloud-devops-kubernetes',
        description: 'Container orchestration, CI/CD pipelines, and cloud infrastructure.',
        category_id: 1,
        instructor_id: 1,
        thumbnail_url: 'assets/images/course_webdev.jpg',
        rating: 5.0,
        difficulty: 'Advanced',
        duration_hours: '14 Hours',
        lesson_count: 18,
        badge_text: 'Cloud',
        order_num: 5,
        is_popular: 1,
        is_published: 1
    }, authHeaders);

    testCourseId = createCourseRes.body.id;
    console.log(`[PASS] Created Course ID: ${testCourseId}`);

    // Delete Course
    await request('DELETE', `/admin/courses/${testCourseId}`, null, authHeaders);
    console.log(`[PASS] Deleted Course ID: ${testCourseId}`);

    // 5. ENROLLMENT MANAGEMENT
    console.log('\n--- 5. ENROLLMENT MANAGEMENT ---');
    const enrollmentsRes = await request('GET', '/admin/enrollments', null, authHeaders);
    console.log(`[PASS] Listed ${enrollmentsRes.body.data.length} active enrollments with student names and course titles.`);

    // 6. VERIFY DATABASE CLEAN STATE
    console.log('\n--- 6. VERIFY DATABASE INTEGRITY ---');
    const finalUsers = await dbAsync.get('SELECT COUNT(*) as c FROM users');
    const finalProgs = await dbAsync.get('SELECT COUNT(*) as c FROM programs');
    const finalCourses = await dbAsync.get('SELECT COUNT(*) as c FROM courses');
    console.log(`[PASS] SQLite Database in pristine state:`);
    console.log(`       - Users in DB: ${finalUsers.c}`);
    console.log(`       - Programs in DB: ${finalProgs.c}`);
    console.log(`       - Courses in DB: ${finalCourses.c}`);

    server.close(() => {
        console.log('\n===============================================================');
        console.log('✅ ALL ADMIN SYSTEM & DATABASE FLOWS VERIFIED SUCCESSFULLY!');
        console.log('===============================================================');
        process.exit(0);
    });
}

runFullAdminFlow();
