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
    const schemaSql = `
    -- 1. Roles
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
    );

    -- 2. Users
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        university_id TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL,
        avatar_url TEXT DEFAULT '',
        status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
    );

    -- 3. Categories
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT DEFAULT 'bi-tag',
        type TEXT DEFAULT 'general', -- 'program', 'course', 'general'
        order_num INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Instructors / Teachers
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

    -- 5. Programs (Bachelor Degrees, etc. matching public website)
    CREATE TABLE IF NOT EXISTS programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        degree_type TEXT DEFAULT 'BACHELOR DEGREE',
        duration TEXT DEFAULT '4 Years',
        description TEXT NOT NULL,
        icon_class TEXT DEFAULT 'bi-laptop',
        theme_class TEXT DEFAULT 'theme-blue', -- 'theme-blue', 'theme-cyan', 'theme-green', 'theme-purple', 'theme-gold', 'theme-orange'
        detail_url TEXT,
        order_num INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 1,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Program Categories (Many-to-Many Tags)
    CREATE TABLE IF NOT EXISTS program_categories (
        program_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (program_id, category_id),
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- 7. Courses (Popular Specialized Courses matching public website)
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER,
        instructor_id INTEGER,
        thumbnail_url TEXT,
        rating REAL DEFAULT 4.8,
        difficulty TEXT DEFAULT 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced'
        duration_hours TEXT DEFAULT '8 Hours',
        lesson_count INTEGER DEFAULT 12,
        enrolled_students_count INTEGER DEFAULT 0,
        badge_text TEXT, -- e.g. 'Recommended', 'Popular'
        order_num INTEGER DEFAULT 0,
        is_popular INTEGER DEFAULT 1,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL
    );

    -- 8. Course Modules / Chapters
    CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        order_num INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- 9. Lessons / Videos
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

    -- 10. Quizzes
    CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id INTEGER,
        course_id INTEGER,
        title TEXT NOT NULL,
        questions_json TEXT, -- JSON array of questions, options, answers
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    -- 11. Enrollments
    CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER,
        program_id INTEGER,
        enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Active', -- 'Active', 'Completed', 'Dropped'
        progress_percentage REAL DEFAULT 0.0,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
    CREATE INDEX IF NOT EXISTS idx_programs_published ON programs(is_published, order_num);
    CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, is_popular, order_num);
    CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
    CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
    `;

    await dbAsync.exec(schemaSql);
    console.log('Database schema verified & tables initialized successfully.');
}

module.exports = {
    db,
    dbAsync,
    initSchema
};
