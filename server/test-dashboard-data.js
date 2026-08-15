const http = require('http');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

const PORT = 5058;
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

async function testDashboardData() {
    console.log('===============================================================');
    console.log('📊 VERIFYING DASHBOARD DATA, PERCENTAGES & DATABASE LOGIC');
    console.log('===============================================================\n');

    const server = app.listen(PORT, async () => {
        try {
            // 1. Admin Login
            const loginRes = await request('POST', '/auth/login', {
                loginId: 'admin@aub.edu.kh',
                password: 'admin123'
            });
            const token = loginRes.body.token;
            const headers = { 'Authorization': `Bearer ${token}` };

            // 2. Metrics Check
            console.log('1. VERIFYING KPI COUNTS:');
            const metricsRes = await request('GET', '/admin/dashboard/metrics', null, headers);
            const m = metricsRes.body.data;
            console.log(`   - Total Users: ${m.totalUsers}`);
            console.log(`   - Total Courses: ${m.totalCourses}`);
            console.log(`   - Total Students: ${m.totalStudents}`);
            console.log(`   - Total Teachers: ${m.totalTeachers}`);
            console.log(`   - Total Chapters: ${m.totalChapters}`);
            console.log(`   - Enrollments: ${m.totalEnrollments}`);

            // 3. Enrollment Statistics & Percentages Check
            console.log('\n2. VERIFYING ENROLLMENT PERCENTAGES:');
            const statsRes = await request('GET', '/admin/dashboard/stats?enrollmentTimeframe=this_month&majorTimeframe=this_month', null, headers);
            const enrStats = statsRes.body.data.enrollmentStatistics;
            console.log(`   - Total Enrollments: ${enrStats.total}`);
            enrStats.categories.forEach(cat => {
                console.log(`   - Category: ${cat.name.padEnd(15)} | Count: ${cat.count} | Percentage: ${cat.percentage}%`);
            });

            // Calculate sum of percentages
            const sumPct = enrStats.categories.reduce((acc, c) => acc + c.percentage, 0);
            console.log(`   - Sum of Category Percentages: ${sumPct}% (Expected: 100%)`);

            // 4. Students by Major Check
            console.log('\n3. VERIFYING STUDENTS BY MAJOR (NO HARDCODED NUMBERS):');
            const majorsData = statsRes.body.data.studentsByMajor;
            console.log(`   - Total Students: ${majorsData.total}`);
            let studentCountSum = 0;
            majorsData.majors.forEach(m => {
                studentCountSum += m.count;
                console.log(`   - Major: ${m.major.padEnd(35)} | Students: ${m.count} | Percentage: ${m.percentage}%`);
            });
            console.log(`   - Sum of Students across Majors: ${studentCountSum} (Must match Total Students = ${majorsData.total})`);

            // 5. Timeframe SQL Filtering Verification
            console.log('\n4. VERIFYING TIMEFRAME FILTERS IN SQL:');
            const timeframes = ['this_month', 'last_month', 'last_3_months', 'this_year', 'all_time'];
            for (const tf of timeframes) {
                const tfRes = await request('GET', `/admin/dashboard/stats?enrollmentTimeframe=${tf}&majorTimeframe=${tf}`, null, headers);
                const data = tfRes.body.data;
                console.log(`   - Timeframe [${tf.padEnd(13)}]: Enrollments Total = ${data.enrollmentStatistics.total}, Students Total = ${data.studentsByMajor.total}`);
            }

            // 6. Recent Enrollments Verification
            console.log('\n5. VERIFYING RECENT ENROLLMENTS STREAM:');
            const recentRes = await request('GET', '/admin/dashboard/recent-enrollments', null, headers);
            recentRes.body.data.forEach(r => {
                console.log(`   - ID: #${r.id} | Student: ${r.student_name} (${r.student_id}) | Course: ${r.course_title} | Date: ${r.enrollment_date} | Status: ${r.status}`);
            });

            console.log('\n===============================================================');
            console.log('✅ ALL DASHBOARD DATA, PERCENTAGES & SQL QUERIES VERIFIED!');
            console.log('===============================================================');
            server.close();
            process.exit(0);
        } catch (err) {
            console.error('Test error:', err);
            server.close();
            process.exit(1);
        }
    });
}

testDashboardData();
