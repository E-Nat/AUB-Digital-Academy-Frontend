const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'aub_academy.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Helper Promise wrappers for cleaner async/await
const dbAsync = {
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    }),
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    }),
    exec: (sql) => new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    })
};

// Initialize All Database Tables
async function initSchema() {
    // 1. Roles
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT
        );
    `);

    // 2. Programs
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS programs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            degree_type TEXT DEFAULT 'BACHELOR DEGREE',
            duration TEXT DEFAULT '4 Years',
            description TEXT NOT NULL,
            icon_class TEXT DEFAULT 'bi-laptop',
            theme_class TEXT DEFAULT 'theme-blue',
            detail_url TEXT,
            order_num INTEGER DEFAULT 0,
            is_featured INTEGER DEFAULT 1,
            is_published INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 3. Users
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            university_id TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role_id INTEGER NOT NULL,
            major_id INTEGER,
            avatar_url TEXT DEFAULT '',
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
            FOREIGN KEY (major_id) REFERENCES programs(id) ON DELETE SET NULL
        );
    `);

    // Add extra user profile fields safely if not already present
    const userColumnsToAdd = [
        'major_id INTEGER REFERENCES programs(id)',
        'phone TEXT DEFAULT ""',
        'faculty TEXT DEFAULT ""',
        'department_name TEXT DEFAULT ""',
        'position TEXT DEFAULT ""',
        'academic_year TEXT DEFAULT "Year 1"',
        'semester TEXT DEFAULT "Semester 1"',
        'enrollment_status TEXT DEFAULT "Full-Time"',
        'two_factor_enabled INTEGER DEFAULT 0',
        'email_verified INTEGER DEFAULT 1',
        'last_login_at DATETIME'
    ];
    for (const col of userColumnsToAdd) {
        try {
            await dbAsync.run(`ALTER TABLE users ADD COLUMN ${col};`);
        } catch (e) {
            // Column already exists
        }
    }

    // 3b. User Audit / Activity Logs
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS user_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            performed_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 4. Categories
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            icon TEXT DEFAULT 'bi-tag',
            type TEXT DEFAULT 'general',
            order_num INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 5. Instructors
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS instructors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            title TEXT,
            bio TEXT,
            avatar_url TEXT,
            email TEXT,
            expertise TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 6. Program Categories
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS program_categories (
            program_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            PRIMARY KEY (program_id, category_id),
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
    `);

    // 7. Courses
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            category_id INTEGER,
            instructor_id INTEGER,
            thumbnail_url TEXT,
            rating REAL DEFAULT 4.8,
            difficulty TEXT DEFAULT 'Beginner',
            duration_hours TEXT DEFAULT '8 Hours',
            lesson_count INTEGER DEFAULT 12,
            enrolled_students_count INTEGER DEFAULT 0,
            badge_text TEXT,
            order_num INTEGER DEFAULT 0,
            is_popular INTEGER DEFAULT 1,
            is_published INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
        );
    `);

    // 8. Modules
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            order_num INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );
    `);

    // 9. Lessons
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            video_url TEXT,
            description TEXT,
            duration TEXT,
            order_num INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        );
    `);

    // 10. Quizzes
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id INTEGER,
            course_id INTEGER,
            title TEXT NOT NULL,
            questions_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );
    `);

    // 11. Enrollments
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            course_id INTEGER,
            program_id INTEGER,
            enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Active',
            progress_percentage REAL DEFAULT 0.0,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
        );
    `);

    // 12. Notifications
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            link_url TEXT DEFAULT '',
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 13. 1-on-1 Mentorship & Consultations
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS consultations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            course_id INTEGER,
            topic TEXT NOT NULL,
            description TEXT DEFAULT '',
            session_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            meeting_type TEXT DEFAULT 'Online Video',
            meeting_link TEXT DEFAULT '',
            location_room TEXT DEFAULT '',
            status TEXT DEFAULT 'Pending',
            student_notes TEXT DEFAULT '',
            teacher_notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
        );
    `);

    // 14. Assignments
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            start_date DATETIME,
            due_date DATETIME NOT NULL,
            end_date DATETIME,
            total_points INTEGER DEFAULT 100,
            submission_type TEXT DEFAULT 'File Upload',
            attachment_url TEXT DEFAULT '',
            status TEXT DEFAULT 'Published',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 15. Assignment Submissions
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS assignment_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assignment_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            submission_text TEXT DEFAULT '',
            file_url TEXT DEFAULT '',
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            grade REAL,
            feedback TEXT DEFAULT '',
            graded_by INTEGER,
            graded_at DATETIME,
            status TEXT DEFAULT 'Submitted',
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
        );
    `);

    // 16. Departments
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            code TEXT UNIQUE NOT NULL,
            description TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 17. Teachers Profile & Academic Records
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            teacher_code TEXT UNIQUE NOT NULL,
            department_id INTEGER,
            specialization TEXT DEFAULT '',
            employment_type TEXT DEFAULT 'Full-Time',
            experience_years INTEGER DEFAULT 0,
            bio TEXT DEFAULT '',
            office_room TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            status TEXT DEFAULT 'Active',
            deleted_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
        );
    `);

    // 18. Teacher <-> Course Many-to-Many Relationship
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS teacher_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(teacher_id, course_id),
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        );
    `);

    // 19. Classes
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            teacher_id INTEGER NOT NULL,
            class_name TEXT NOT NULL,
            room TEXT DEFAULT 'Room 101',
            schedule TEXT DEFAULT 'Mon/Wed 09:00 - 11:00',
            start_date DATE,
            end_date DATE,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 20. Class Enrollments (Teacher -> Class -> Enrollment -> Student)
    await dbAsync.run(`
        CREATE TABLE IF NOT EXISTS class_enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Active',
            UNIQUE(class_id, student_id),
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // Indexes for fast searching and performance
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_teachers_code ON teachers(teacher_code);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_teachers_dept ON teachers(department_id);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_users_name ON users(full_name);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_teacher_courses ON teacher_courses(teacher_id, course_id);`);
    await dbAsync.run(`CREATE INDEX IF NOT EXISTS idx_class_enrollments ON class_enrollments(class_id, student_id);`);

    console.log('Database schema verified & tables initialized successfully.');
}

module.exports = {
    db,
    dbAsync,
    initSchema
};
