const bcrypt = require('bcryptjs');
const { db, dbAsync, initSchema } = require('./database');

async function seedDatabase() {
    console.log('--- Starting Database Seeding ---');
    await initSchema();

    // 1. Seed Roles
    console.log('Seeding Roles...');
    const roles = [
        { id: 1, name: 'ADMIN', description: 'System Administrator with full access' },
        { id: 2, name: 'TEACHER', description: 'Instructor managing courses and assignments' },
        { id: 3, name: 'STUDENT', description: 'Enrolled student accessing course materials' }
    ];
    for (const r of roles) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
            [r.id, r.name, r.description]
        );
    }

    // 2. Seed Programs
    console.log('Seeding Featured Programs...');
    const programs = [
        {
            id: 1,
            title: 'Computer Science & Engineering',
            slug: 'computer-science-engineering',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: "Build the foundation of tomorrow's technology with strong skills in software, AI, databases, and computer systems.",
            icon_class: 'bi-laptop',
            theme_class: 'theme-blue',
            detail_url: 'pages/programs/cs.html',
            order_num: 1,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 2,
            title: 'Information Technology',
            slug: 'information-technology',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Explore the world of software development, networks, data management, and emerging technologies.',
            icon_class: 'bi-code-slash',
            theme_class: 'theme-cyan',
            detail_url: 'pages/programs/it.html',
            order_num: 2,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 3,
            title: 'Finance & Banking',
            slug: 'finance-banking',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Gain in-depth knowledge of financial systems, investment analysis, and modern banking operations.',
            icon_class: 'bi-bank',
            theme_class: 'theme-green',
            detail_url: 'pages/programs/finance.html',
            order_num: 3,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 4,
            title: 'Accounting',
            slug: 'accounting',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Master the language of business with comprehensive training in financial reporting and auditing.',
            icon_class: 'bi-calculator',
            theme_class: 'theme-purple',
            detail_url: 'pages/programs/accounting.html',
            order_num: 4,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 5,
            title: 'Business Administration',
            slug: 'business-administration',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: "Develop leadership, management, and entrepreneurial skills to succeed in today's dynamic business world.",
            icon_class: 'bi-briefcase',
            theme_class: 'theme-gold',
            detail_url: 'pages/programs/business.html',
            order_num: 5,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 6,
            title: 'Marketing',
            slug: 'marketing',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Learn to understand consumer behavior, brand management, and digital marketing strategies.',
            icon_class: 'bi-megaphone',
            theme_class: 'theme-orange',
            detail_url: 'pages/programs/marketing.html',
            order_num: 6,
            is_featured: 1,
            is_published: 1
        }
    ];

    for (const prog of programs) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO programs (id, title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [prog.id, prog.title, prog.slug, prog.degree_type, prog.duration, prog.description, prog.icon_class, prog.theme_class, prog.detail_url, prog.order_num, prog.is_featured, prog.is_published]
        );
    }

    // 3. Seed Users with Major Assignment
    console.log('Seeding Users...');
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    const studentPasswordHash = bcrypt.hashSync('student123', 10);
    const teacherPasswordHash = bcrypt.hashSync('teacher123', 10);

    const users = [
        {
            full_name: 'Admin System',
            email: 'admin@aub.edu.kh',
            university_id: '10293847',
            password_hash: defaultPasswordHash,
            role_id: 1,
            major_id: null,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Sok Virak',
            email: 'sok.virak@student.aub.edu.kh',
            university_id: '0001001',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 2, // Information Technology
            avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Meas Sreynich',
            email: 'meas.sreynich@student.aub.edu.kh',
            university_id: '0001002',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science & Engineering
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Chan Dara',
            email: 'chan.dara@student.aub.edu.kh',
            university_id: '0001003',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 5, // Business Administration
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Pich Chhorn',
            email: 'pich.chhorn@student.aub.edu.kh',
            university_id: '0001004',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 2, // Information Technology
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Vibol Pen',
            email: 'vibol.pen@student.aub.edu.kh',
            university_id: '0001005',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science & Engineering
            avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@aub.edu.kh',
            university_id: 'T001',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
            status: 'Active'
        },
        {
            full_name: 'Prof. Alex Chen',
            email: 'alex.chen@aub.edu.kh',
            university_id: 'T002',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
            status: 'Active'
        }
    ];

    for (const u of users) {
        await dbAsync.run(
            `INSERT INTO users (full_name, email, university_id, password_hash, role_id, major_id, avatar_url, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(email) DO UPDATE SET major_id = excluded.major_id`,
            [u.full_name, u.email, u.university_id, u.password_hash, u.role_id, u.major_id, u.avatar_url, u.status]
        );
    }

    // 4. Seed Categories
    console.log('Seeding Categories...');
    const categories = [
        { id: 1, name: 'Technology', slug: 'technology', icon: 'bi-laptop', type: 'general', order_num: 1 },
        { id: 2, name: 'Business Administration', slug: 'business', icon: 'bi-briefcase', type: 'general', order_num: 2 },
        { id: 3, name: 'Design', slug: 'design', icon: 'bi-palette', type: 'general', order_num: 3 },
        { id: 4, name: 'Security', slug: 'security', icon: 'bi-shield-check', type: 'general', order_num: 4 },
        { id: 5, name: 'Data Science', slug: 'data', icon: 'bi-graph-up-arrow', type: 'general', order_num: 5 },
        { id: 6, name: 'Engineering', slug: 'engineering', icon: 'bi-gear', type: 'general', order_num: 6 },
        { id: 7, name: 'Finance & Banking', slug: 'finance', icon: 'bi-bank', type: 'general', order_num: 7 },
        { id: 8, name: 'Accounting', slug: 'accounting', icon: 'bi-calculator', type: 'general', order_num: 8 },
        { id: 9, name: 'Marketing', slug: 'marketing', icon: 'bi-megaphone', type: 'general', order_num: 9 }
    ];

    for (const c of categories) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO categories (id, name, slug, icon, type, order_num)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [c.id, c.name, c.slug, c.icon, c.type, c.order_num]
        );
    }

    // 5. Seed Instructors
    console.log('Seeding Instructors...');
    const instructors = [
        {
            id: 1,
            name: 'Dr. Sarah Johnson',
            title: 'Lead Software Architect & AI Researcher',
            bio: 'Over 12 years of industry experience in full-stack architecture and AI systems at top tech companies.',
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300',
            email: 'sarah.johnson@aub.edu.kh',
            expertise: 'Web Development, Artificial Intelligence, Distributed Systems'
        },
        {
            id: 2,
            name: 'Prof. Alex Chen',
            title: 'Head of Digital Product & UI/UX Design',
            bio: 'Award-winning product designer who has designed design systems for enterprise mobile and web applications.',
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300',
            email: 'alex.chen@aub.edu.kh',
            expertise: 'UI/UX Design, Design Systems, User Research'
        },
        {
            id: 3,
            name: 'Marcus Brody',
            title: 'Principal Cyber Defense Specialist',
            bio: 'Certified ethical hacker and enterprise security consultant specializing in threat modeling and cloud defense.',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300',
            email: 'marcus.brody@aub.edu.kh',
            expertise: 'Cyber Security, Network Infrastructure, Cloud Security'
        },
        {
            id: 4,
            name: 'Elena Rostova',
            title: 'Senior Data Scientist & Analytics Lead',
            bio: 'Former data lead at international fintech firm specializing in predictive analytics and large-scale data modeling.',
            avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300',
            email: 'elena.rostova@aub.edu.kh',
            expertise: 'Data Science, Machine Learning, Python, SQL'
        }
    ];

    for (const inst of instructors) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO instructors (id, name, title, bio, avatar_url, email, expertise)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [inst.id, inst.name, inst.title, inst.bio, inst.avatar_url, inst.email, inst.expertise]
        );
    }

    // 6. Seed Courses
    console.log('Seeding Courses...');
    const courses = [
        {
            id: 1,
            title: 'Full-Stack Web Development',
            slug: 'full-stack-web-development',
            description: 'Build modern, responsive websites and scalable web applications from scratch.',
            category_id: 1,
            instructor_id: 1,
            thumbnail_url: 'assets/images/course_webdev.jpg',
            rating: 4.9,
            difficulty: 'Beginner',
            duration_hours: '8 Hours',
            lesson_count: 12,
            enrolled_students_count: 1250,
            badge_text: 'Technology',
            order_num: 1,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 2,
            title: 'Advanced UI/UX Design',
            slug: 'advanced-ui-ux-design',
            description: 'Master Figma and design user-centered digital experiences for mobile and web.',
            category_id: 3,
            instructor_id: 2,
            thumbnail_url: 'assets/images/course_uiux.jpg',
            rating: 4.8,
            difficulty: 'Intermediate',
            duration_hours: '6 Hours',
            lesson_count: 10,
            enrolled_students_count: 980,
            badge_text: 'Design',
            order_num: 2,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 3,
            title: 'Cyber Security Essentials',
            slug: 'cyber-security-essentials',
            description: 'Protect digital assets and infrastructure against evolving global cyber threats.',
            category_id: 4,
            instructor_id: 3,
            thumbnail_url: 'assets/images/course_cybersecurity.jpg',
            rating: 4.9,
            difficulty: 'Advanced',
            duration_hours: '12 Hours',
            lesson_count: 15,
            enrolled_students_count: 450,
            badge_text: 'Security',
            order_num: 3,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 4,
            title: 'Data Science Fundamentals',
            slug: 'data-science-fundamentals',
            description: 'Analyze complex datasets and generate actionable business insights.',
            category_id: 5,
            instructor_id: 4,
            thumbnail_url: 'assets/images/course_datascience.jpg',
            rating: 4.7,
            difficulty: 'Intermediate',
            duration_hours: '10 Hours',
            lesson_count: 14,
            enrolled_students_count: 620,
            badge_text: 'Recommended',
            order_num: 4,
            is_popular: 1,
            is_published: 1
        }
    ];

    for (const c of courses) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO courses (id, title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, enrolled_students_count, badge_text, order_num, is_popular, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.title, c.slug, c.description, c.category_id, c.instructor_id, c.thumbnail_url, c.rating, c.difficulty, c.duration_hours, c.lesson_count, c.enrolled_students_count, c.badge_text, c.order_num, c.is_popular, c.is_published]
        );
    }

    // 7. Seed Modules & Lessons
    console.log('Seeding Course Modules & Lessons...');
    const modules = [
        { id: 1, course_id: 1, title: 'Module 1: Introduction to Web Architecture & HTML5', order_num: 1 },
        { id: 2, course_id: 1, title: 'Module 2: Advanced CSS & Responsive Layouts', order_num: 2 },
        { id: 3, course_id: 1, title: 'Module 3: JavaScript Programming & DOM Manipulation', order_num: 3 },
        { id: 4, course_id: 2, title: 'Module 1: UI/UX Principles & User Journey Mapping', order_num: 1 },
        { id: 5, course_id: 2, title: 'Module 2: Wireframing and Prototyping in Figma', order_num: 2 },
        { id: 6, course_id: 3, title: 'Module 1: Network Fundamentals & Threat Surfaces', order_num: 1 },
        { id: 7, course_id: 4, title: 'Module 1: Python for Data Analysis & Pandas', order_num: 1 }
    ];
    for (const m of modules) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO modules (id, course_id, title, order_num) VALUES (?, ?, ?, ?)`,
            [m.id, m.course_id, m.title, m.order_num]
        );
    }

    // 8. Seed Enrollments
    console.log('Seeding Enrollments...');
    const enrollments = [
        { id: 1, user_id: 2, course_id: 1, enrollment_date: '2026-05-24 09:30:00', status: 'Active', progress_percentage: 65.0 },
        { id: 2, user_id: 3, course_id: 1, enrollment_date: '2026-05-24 10:15:00', status: 'Active', progress_percentage: 40.0 },
        { id: 3, user_id: 4, course_id: 2, enrollment_date: '2026-05-23 14:20:00', status: 'Active', progress_percentage: 85.0 },
        { id: 4, user_id: 5, course_id: 3, enrollment_date: '2026-05-24 11:05:00', status: 'Active', progress_percentage: 20.0 },
        { id: 5, user_id: 6, course_id: 1, enrollment_date: '2026-05-22 16:45:00', status: 'Active', progress_percentage: 95.0 }
    ];
    for (const e of enrollments) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrollment_date, status, progress_percentage)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [e.id, e.user_id, e.course_id, e.enrollment_date, e.status, e.progress_percentage]
        );
    }

    // 9. Seed System Notifications
    console.log('Seeding Notifications...');
    const notifications = [
        {
            id: 1,
            title: 'New Student Enrollment',
            message: 'Sok Virak enrolled in Full-Stack Web Development',
            type: 'enrollment',
            link_url: 'enrollment-management.html',
            is_read: 0
        },
        {
            id: 2,
            title: 'Course Update Published',
            message: 'Cyber Security Essentials updated with 3 new lessons',
            type: 'course',
            link_url: 'academic-management.html',
            is_read: 0
        },
        {
            id: 3,
            title: 'System Health Check',
            message: 'Database backup and indexing completed successfully',
            type: 'system',
            link_url: 'settings.html',
            is_read: 0
        }
    ];

    for (const n of notifications) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO notifications (id, title, message, type, link_url, is_read)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [n.id, n.title, n.message, n.type, n.link_url, n.is_read]
        );
    }

    console.log('--- Database Seeding Completed Successfully! ---');
}

if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('Seeding finished.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Seeding error:', err);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
