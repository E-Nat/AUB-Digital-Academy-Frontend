const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbAsync } = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both Login ID/Email and Password.' });
        }

        // Query by email OR university_id
        const user = await dbAsync.get(
            `SELECT u.*, r.name as role
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE LOWER(u.email) = LOWER(?) OR u.university_id = ?`,
            [loginId.trim(), loginId.trim()]
        );

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ success: false, message: 'Your account is currently inactive. Contact administration.' });
        }

        // Verify password
        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                university_id: user.university_id,
                role: user.role,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
};

exports.getMe = async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};
