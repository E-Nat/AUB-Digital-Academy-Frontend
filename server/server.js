const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { initSchema, dbAsync } = require('./db/database');
const { seedDatabase } = require('./db/seeds');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend local development (Live Server, file://, or port 5500/3000)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from parent directory
const frontendRoot = path.join(__dirname, '..');
app.use(express.static(frontendRoot));

// Mount REST API
app.use('/api', apiRoutes);

// Root fallback to welcomepage.html
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'welcomepage.html'));
});

// Start Server and Initialize Database
async function startServer() {
    try {
        await initSchema();

        // Check if database needs initial seeding
        const userCount = await dbAsync.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
            console.log('Database is empty. Populating with initial seed data...');
            await seedDatabase();
        }

        app.listen(PORT, () => {
            console.log(`===================================================`);
            console.log(`🚀 AUB Digital Academy Server is running on port ${PORT}`);
            console.log(`🌐 Public Website:  http://localhost:${PORT}/welcomepage.html`);
            console.log(`🔐 Admin Dashboard: http://localhost:${PORT}/pages/admin/dashboard.html`);
            console.log(`🔑 Login Page:      http://localhost:${PORT}/pages/authentication/login.html`);
            console.log(`📡 REST API Root:   http://localhost:${PORT}/api/`);
            console.log(`===================================================`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
