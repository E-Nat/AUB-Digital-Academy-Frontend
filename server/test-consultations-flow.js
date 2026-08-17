const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, urlPath, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + urlPath);
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runConsultationFlowTests() {
    console.log('================================================================');
    console.log('🚀 TESTING 1-ON-1 MENTORSHIP & CONSULTATION FEATURE');
    console.log('================================================================\n');

    // 1. Student Login
    console.log('[1/7] Testing Student Login (Sok Virak)...');
    const studentLogin = await request('POST', '/auth/login', {
        loginId: 'sok.virak@student.aub.edu.kh',
        password: 'student123'
    });
    if (studentLogin.status !== 200 || !studentLogin.body.token) {
        throw new Error('Student login failed: ' + JSON.stringify(studentLogin.body));
    }
    const studentToken = studentLogin.body.token;
    console.log('  ✅ [PASS] Student authenticated. User ID:', studentLogin.body.user.id);

    // 2. Teacher Login
    console.log('[2/7] Testing Teacher Login (Dr. Sarah Johnson)...');
    const teacherLogin = await request('POST', '/auth/login', {
        loginId: 'sarah.johnson@aub.edu.kh',
        password: 'teacher123'
    });
    if (teacherLogin.status !== 200 || !teacherLogin.body.token) {
        throw new Error('Teacher login failed: ' + JSON.stringify(teacherLogin.body));
    }
    const teacherToken = teacherLogin.body.token;
    console.log('  ✅ [PASS] Teacher authenticated. User ID:', teacherLogin.body.user.id);

    // 3. Fetch Teachers list for student booking
    console.log('[3/7] Student fetching available Faculty Mentors...');
    const mentorsRes = await request('GET', '/consultations/teachers', null, studentToken);
    if (mentorsRes.status === 200 && mentorsRes.body.data && mentorsRes.body.data.length > 0) {
        console.log(`  ✅ [PASS] Found ${mentorsRes.body.data.length} available mentors (e.g. ${mentorsRes.body.data[0].full_name})`);
    } else {
        throw new Error('Failed to fetch teachers: ' + JSON.stringify(mentorsRes.body));
    }

    // 4. Student books a 1-on-1 Consultation
    console.log('[4/7] Student submitting a 1-on-1 Consultation Booking Request...');
    const bookingPayload = {
        teacher_id: 7, // Dr. Sarah Johnson
        course_id: 1,  // Full-Stack Web Dev
        topic: 'AI Agent System Design Consultation',
        description: 'Reviewing automated subagent orchestration and prompt caching architecture.',
        session_date: '2026-08-25',
        start_time: '02:00 PM',
        end_time: '45 mins',
        meeting_type: 'Online Video',
        student_notes: 'Will have architecture diagrams ready.'
    };
    const bookRes = await request('POST', '/consultations/book', bookingPayload, studentToken);
    if (bookRes.status !== 201 || !bookRes.body.consultationId) {
        throw new Error('Booking failed: ' + JSON.stringify(bookRes.body));
    }
    const newSessionId = bookRes.body.consultationId;
    console.log(`  ✅ [PASS] 1-on-1 Session created with ID #${newSessionId}`);

    // 5. Teacher accepts the consultation & sets Google Meet link
    console.log('[5/7] Teacher reviewing & accepting session with Google Meet URL...');
    const acceptRes = await request('PATCH', `/consultations/${newSessionId}/status`, {
        status: 'Confirmed',
        meeting_link: 'https://meet.google.com/aub-ai-consult',
        location_room: 'Virtual Room 1',
        teacher_notes: 'Session confirmed. Please bring system diagram.'
    }, teacherToken);
    if (acceptRes.status === 200 && acceptRes.body.success) {
        console.log('  ✅ [PASS] Consultation confirmed and meeting link attached.');
    } else {
        throw new Error('Teacher accept failed: ' + JSON.stringify(acceptRes.body));
    }

    // 6. Teacher adds session feedback & marks completed
    console.log('[6/7] Teacher recording post-session feedback & marking Completed...');
    const feedbackRes = await request('PATCH', `/consultations/${newSessionId}/notes`, {
        teacher_notes: 'Comprehensive review completed. Student demonstrated strong mastery of agentic workflows.'
    }, teacherToken);
    const completeRes = await request('PATCH', `/consultations/${newSessionId}/status`, {
        status: 'Completed'
    }, teacherToken);
    if (feedbackRes.status === 200 && completeRes.status === 200) {
        console.log('  ✅ [PASS] Session feedback saved & marked Completed.');
    } else {
        throw new Error('Teacher feedback / complete failed.');
    }

    // 7. Check consultation metrics & stats
    console.log('[7/7] Verifying Consultation Stats KPI calculation...');
    const statsRes = await request('GET', '/consultations/stats', null, studentToken);
    if (statsRes.status === 200 && statsRes.body.data) {
        console.log('  ✅ [PASS] Stats calculated successfully:', statsRes.body.data);
    } else {
        throw new Error('Stats calculation failed: ' + JSON.stringify(statsRes.body));
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 1-ON-1 MENTORSHIP & CONSULTATION TESTS PASSED!');
    console.log('================================================================\n');
}

// Start temporary test server if not already running
const { initSchema } = require('./db/database');
const { seedDatabase } = require('./db/seeds');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

async function main() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', apiRoutes);

    await initSchema();
    await seedDatabase();

    const server = app.listen(PORT, async () => {
        try {
            await runConsultationFlowTests();
            server.close(() => process.exit(0));
        } catch (err) {
            console.error('❌ Test failed:', err);
            server.close(() => process.exit(1));
        }
    });
}

main();
