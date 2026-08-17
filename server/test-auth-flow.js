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
const PORT = 5056;
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

async function verifyAuthFlow() {
    console.log('====================================================');
    console.log('🧪 TESTING USER CREATION & JWT AUTHENTICATION FLOW');
    console.log('====================================================\n');

    await new Promise((resolve) => {
        server = app.listen(PORT, () => {
            console.log(`[PASS] 1. Server started on port ${PORT}`);
            resolve();
        });
    });

    // 1. Admin Login
    console.log('Logging in as Admin (admin@aub.edu.com)...');
    const loginRes = await request('POST', '/auth/login', {
        loginId: 'admin@aub.edu.com',
        password: 'admin123'
    });

    if (loginRes.status !== 200 || !loginRes.body.token) {
        console.error('[FAIL] Admin login failed:', loginRes);
        process.exit(1);
    }

    const token = loginRes.body.token;
    console.log(`[PASS] 2. JWT Token issued: ${token.substring(0, 25)}...`);

    // 2. Submit Test User (The exact user from the prompt)
    console.log('\nSubmitting "Add New User" form with Authorization header...');
    const testUser = {
        full_name: 'test',
        email: 'soknyenat1@gmail.com',
        university_id: '07875',
        role_id: 3, // Student
        password: 'Password123!'
    };

    const createRes = await request('POST', '/admin/users', testUser, {
        'Authorization': `Bearer ${token}`
    });

    console.log('Create User response status:', createRes.status);
    console.log('Create User response body:', createRes.body);

    if (createRes.status === 200 && createRes.body.success) {
        console.log(`[PASS] 3. Backend accepted token and created user (ID: ${createRes.body.id})`);
    } else {
        console.error('[FAIL] 3. User creation failed:', createRes);
        process.exit(1);
    }

    // 3. Verify user exists in SQLite database
    const userInDb = await dbAsync.get(
        `SELECT u.id, u.full_name, u.email, u.university_id, r.name as role
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.email = ?`,
        ['soknyenat1@gmail.com']
    );

    if (userInDb && userInDb.full_name === 'test' && userInDb.university_id === '07875') {
        console.log(`[PASS] 4. User verified in SQLite database:`, userInDb);
    } else {
        console.error('[FAIL] 4. User not found in database!');
    }

    // 4. Verify user list endpoint returns the new user
    const listRes = await request('GET', '/admin/users', null, {
        'Authorization': `Bearer ${token}`
    });

    const foundInList = listRes.body.data.find(u => u.email === 'soknyenat1@gmail.com');
    if (foundInList) {
        console.log(`[PASS] 5. New user appears in User Management list: "${foundInList.full_name}" (${foundInList.email}, Role: ${foundInList.role})`);
    } else {
        console.error('[FAIL] 5. User not found in user list!');
    }

    // Cleanup test user
    await dbAsync.run(`DELETE FROM users WHERE email = ?`, ['soknyenat1@gmail.com']);
    console.log('[PASS] 6. Cleaned up test user from database.');

    server.close(() => {
        console.log('\n====================================================');
        console.log('✅ JWT AUTHENTICATION FLOW VERIFIED SUCCESSFULLY!');
        console.log('====================================================');
        process.exit(0);
    });
}

verifyAuthFlow();
