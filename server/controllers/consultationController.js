const { dbAsync } = require('../db/database');

// 1. Get all available teachers for 1-on-1 booking
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await dbAsync.all(
            `SELECT u.id, u.full_name, u.email, u.university_id, u.avatar_url,
                    COALESCE(i.title, 'Faculty Instructor') as title,
                    COALESCE(i.expertise, 'Computer Science & Technology') as expertise,
                    COALESCE(i.bio, 'Experienced university faculty mentor') as bio
             FROM users u
             LEFT JOIN instructors i ON LOWER(u.email) = LOWER(i.email) OR LOWER(u.full_name) = LOWER(i.name)
             WHERE u.role_id = 2 AND u.status = 'Active'
             ORDER BY u.full_name ASC`
        );

        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('Error fetching teachers for consultation:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mentors.' });
    }
};

// 2. Get 1-on-1 consultations for the logged-in user (Student / Teacher / Admin)
exports.getMyConsultations = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let sql = `
            SELECT c.*,
                   s.full_name as student_name, s.email as student_email, s.university_id as student_uid, s.avatar_url as student_avatar,
                   t.full_name as teacher_name, t.email as teacher_email, t.university_id as teacher_uid, t.avatar_url as teacher_avatar,
                   cr.title as course_title
            FROM consultations c
            JOIN users s ON c.student_id = s.id
            JOIN users t ON c.teacher_id = t.id
            LEFT JOIN courses cr ON c.course_id = cr.id
        `;
        const params = [];

        if (role === 'STUDENT') {
            sql += ` WHERE c.student_id = ?`;
            params.push(userId);
        } else if (role === 'TEACHER') {
            sql += ` WHERE c.teacher_id = ?`;
            params.push(userId);
        }
        // ADMIN gets all

        sql += ` ORDER BY c.session_date DESC, c.start_time DESC`;

        const sessions = await dbAsync.all(sql, params);

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error fetching consultations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch consultation sessions.' });
    }
};

// 3. Get consultation metrics / stats
exports.getConsultationStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = '';
        const params = [];

        if (role === 'STUDENT') {
            whereClause = 'WHERE student_id = ?';
            params.push(userId);
        } else if (role === 'TEACHER') {
            whereClause = 'WHERE teacher_id = ?';
            params.push(userId);
        }

        const totalRow = await dbAsync.get(`SELECT COUNT(*) as count FROM consultations ${whereClause}`, params);
        const upcomingRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM consultations ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'Confirmed'`,
            params
        );
        const pendingRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM consultations ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'Pending'`,
            params
        );
        const completedRow = await dbAsync.get(
            `SELECT COUNT(*) as count FROM consultations ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'Completed'`,
            params
        );

        res.json({
            success: true,
            data: {
                total: totalRow.count || 0,
                upcoming: upcomingRow.count || 0,
                pending: pendingRow.count || 0,
                completed: completedRow.count || 0
            }
        });
    } catch (error) {
        console.error('Error fetching consultation stats:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate stats.' });
    }
};

// 4. Book a new 1-on-1 Consultation (Student action)
exports.bookConsultation = async (req, res) => {
    try {
        const studentId = req.user.id;
        const {
            teacher_id,
            course_id,
            topic,
            description,
            session_date,
            start_time,
            end_time,
            meeting_type,
            student_notes
        } = req.body;

        if (!teacher_id || !topic || !session_date || !start_time) {
            return res.status(400).json({
                success: false,
                message: 'Teacher, topic, date, and start time are required.'
            });
        }

        const calculatedEndTime = end_time || '45 mins';

        const result = await dbAsync.run(
            `INSERT INTO consultations (
                student_id, teacher_id, course_id, topic, description,
                session_date, start_time, end_time, meeting_type,
                status, student_notes, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
                studentId,
                teacher_id,
                course_id || null,
                topic.trim(),
                description ? description.trim() : '',
                session_date,
                start_time,
                calculatedEndTime,
                meeting_type || 'Online Video',
                student_notes ? student_notes.trim() : ''
            ]
        );

        // Notify teacher
        try {
            await dbAsync.run(
                `INSERT INTO notifications (title, message, type, link_url, is_read)
                 VALUES (?, ?, 'consultation', 'one-on-one.html', 0)`,
                [
                    'New 1-on-1 Consultation Request',
                    `${req.user.full_name} requested a 1-on-1 session on "${topic}" for ${session_date}`
                ]
            );
        } catch (notifErr) {
            console.error('Notification log error:', notifErr);
        }

        res.status(201).json({
            success: true,
            message: '1-on-1 consultation request submitted successfully! Awaiting instructor confirmation.',
            consultationId: result.lastID
        });
    } catch (error) {
        console.error('Error booking consultation:', error);
        res.status(500).json({ success: false, message: 'Internal server error while booking session.' });
    }
};

// 5. Update Consultation Status (Accept / Decline / Cancel / Complete)
exports.updateConsultationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, meeting_link, location_room, teacher_notes } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        const consultation = await dbAsync.get('SELECT * FROM consultations WHERE id = ?', [id]);
        if (!consultation) {
            return res.status(404).json({ success: false, message: 'Consultation session not found.' });
        }

        // Authorization checks
        if (role === 'STUDENT') {
            if (consultation.student_id !== userId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to modify this consultation.' });
            }
            // Students can only cancel their own sessions
            if (status !== 'Cancelled') {
                return res.status(400).json({ success: false, message: 'Students can only cancel sessions.' });
            }
        } else if (role === 'TEACHER') {
            if (consultation.teacher_id !== userId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to manage this consultation.' });
            }
        }

        const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Declined'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const newStatus = status || consultation.status;
        const newMeetingLink = meeting_link !== undefined ? meeting_link : consultation.meeting_link;
        const newLocationRoom = location_room !== undefined ? location_room : consultation.location_room;
        const newTeacherNotes = teacher_notes !== undefined ? teacher_notes : consultation.teacher_notes;

        await dbAsync.run(
            `UPDATE consultations
             SET status = ?, meeting_link = ?, location_room = ?, teacher_notes = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newStatus, newMeetingLink, newLocationRoom, newTeacherNotes, id]
        );

        // Notify student if status changed by teacher
        if (role === 'TEACHER' || role === 'ADMIN') {
            try {
                await dbAsync.run(
                    `INSERT INTO notifications (title, message, type, link_url, is_read)
                     VALUES (?, ?, 'consultation', 'one-on-one.html', 0)`,
                    [
                        `1-on-1 Consultation ${newStatus}`,
                        `Your session on "${consultation.topic}" has been marked as ${newStatus}.`
                    ]
                );
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
            }
        }

        res.json({
            success: true,
            message: `Consultation status updated to ${newStatus}.`
        });
    } catch (error) {
        console.error('Error updating consultation status:', error);
        res.status(500).json({ success: false, message: 'Failed to update consultation.' });
    }
};

// 6. Update Consultation Notes & Feedback
exports.updateConsultationNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacher_notes, meeting_link } = req.body;

        const consultation = await dbAsync.get('SELECT * FROM consultations WHERE id = ?', [id]);
        if (!consultation) {
            return res.status(404).json({ success: false, message: 'Consultation session not found.' });
        }

        await dbAsync.run(
            `UPDATE consultations
             SET teacher_notes = ?, meeting_link = COALESCE(?, meeting_link), updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [teacher_notes || '', meeting_link || null, id]
        );

        res.json({
            success: true,
            message: 'Session notes and feedback updated successfully.'
        });
    } catch (error) {
        console.error('Error updating notes:', error);
        res.status(500).json({ success: false, message: 'Failed to update session notes.' });
    }
};
