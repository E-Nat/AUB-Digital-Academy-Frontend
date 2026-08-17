const bcrypt = require('bcryptjs');
const { dbAsync, initSchema } = require('./database');

async function seedDatabase() {
    console.log('Starting SQLite database seeding...');
    await initSchema();

    // 1. Seed Roles
    console.log('Seeding Roles...');
    const roles = [
        { id: 1, name: 'ADMIN', description: 'System Administrator with full access' },
        { id: 2, name: 'TEACHER', description: 'Faculty instructor' },
        { id: 3, name: 'STUDENT', description: 'Enrolled student learner' }
    ];

    for (const r of roles) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
            [r.id, r.name, r.description]
        );
    }

    // 2. Seed Programs
    console.log('Seeding Programs...');
    const programs = [
        {
            id: 1,
            title: 'Computer Science & Engineering',
            slug: 'computer-science-engineering',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Master software engineering, algorithms, AI architectures, and modern cloud systems.',
            icon_class: 'bi-laptop',
            theme_class: 'theme-blue',
            detail_url: '#',
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
            description: 'Network architecture, cybersecurity, and enterprise systems administration.',
            icon_class: 'bi-hdd-network',
            theme_class: 'theme-cyan',
            detail_url: '#',
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
            description: 'Corporate finance, investment analysis, digital fintech, and banking regulations.',
            icon_class: 'bi-bank',
            theme_class: 'theme-emerald',
            detail_url: '#',
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
            description: 'Financial reporting, managerial accounting, auditing standards, and tax frameworks.',
            icon_class: 'bi-calculator',
            theme_class: 'theme-amber',
            detail_url: '#',
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
            description: 'Strategic management, organizational leadership, entrepreneurship, and commerce.',
            icon_class: 'bi-briefcase',
            theme_class: 'theme-purple',
            detail_url: '#',
            order_num: 5,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 6,
            title: 'Marketing & Digital Media',
            slug: 'marketing-digital-media',
            degree_type: 'BACHELOR DEGREE',
            duration: '4 Years',
            description: 'Digital brand strategy, consumer behavior, market analytics, and social campaigns.',
            icon_class: 'bi-megaphone',
            theme_class: 'theme-rose',
            detail_url: '#',
            order_num: 6,
            is_featured: 1,
            is_published: 1
        }
    ];

    for (const p of programs) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO programs (id, title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.title, p.slug, p.degree_type, p.duration, p.description, p.icon_class, p.theme_class, p.detail_url, p.order_num, p.is_featured, p.is_published]
        );
    }

    // 3. Seed Users
    console.log('Seeding Users...');
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const teacherPasswordHash = bcrypt.hashSync('teacher123', 10);
    const studentPasswordHash = bcrypt.hashSync('student123', 10);

    const users = [
        {
            id: 1,
            full_name: 'Admin System',
            email: 'admin@aub.edu.com',
            university_id: '10293847',
            password_hash: adminPasswordHash,
            role_id: 1,
            major_id: null,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
            id: 2,
            full_name: 'Sok Virak',
            email: 'sok.virak@student.aub.edu.kh',
            university_id: '0001001',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science & Engineering
            avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
            id: 3,
            full_name: 'Chanthou Meas',
            email: 'chanthou.meas@student.aub.edu.kh',
            university_id: '0001002',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 2, // Information Technology
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 10 * 86400000).toISOString()
        },
        {
            id: 4,
            full_name: 'Dara Keo',
            email: 'dara.keo@student.aub.edu.kh',
            university_id: '0001003',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 5, // Business Administration
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
            id: 5,
            full_name: 'Kanha Rath',
            email: 'kanha.rath@student.aub.edu.kh',
            university_id: '0001004',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 2, // Information Technology
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 25 * 86400000).toISOString()
        },
        {
            id: 6,
            full_name: 'Vibol Pen',
            email: 'vibol.pen@student.aub.edu.kh',
            university_id: '0001005',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science & Engineering
            avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 35 * 86400000).toISOString()
        },
        {
            id: 7,
            full_name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@aub.edu.kh',
            university_id: 'T001',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
            id: 8,
            full_name: 'Prof. Alex Chen',
            email: 'alex.chen@aub.edu.kh',
            university_id: 'T002',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        }
    ];

    for (const u of users) {
        await dbAsync.run(
            `INSERT INTO users (id, full_name, email, university_id, password_hash, role_id, major_id, avatar_url, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET full_name = excluded.full_name, email = excluded.email, university_id = excluded.university_id, password_hash = excluded.password_hash, role_id = excluded.role_id, major_id = excluded.major_id, status = excluded.status, created_at = excluded.created_at`,
            [u.id, u.full_name, u.email, u.university_id, u.password_hash, u.role_id, u.major_id, u.avatar_url, u.status, u.created_at]
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
            name: 'Michael Chang',
            title: 'Principal Design System Specialist',
            bio: 'Former senior UX designer with a passion for scalable design systems, micro-interactions, and UX strategy.',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300',
            email: 'michael.chang@aub.edu.kh',
            expertise: 'Product Design, UI/UX, Design Systems, Design Sprint'
        },
        {
            id: 3,
            name: 'David Roberts',
            title: 'Chief Information Security Officer',
            bio: 'Cybersecurity veteran specializing in ethical hacking, cryptography, security auditing, and cloud defense.',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300',
            email: 'david.roberts@aub.edu.kh',
            expertise: 'Network Defense, Ethical Hacking, Threat Analysis'
        },
        {
            id: 4,
            name: 'Elena Rostova',
            title: 'Senior Data Scientist & ML Engineer',
            bio: 'Machine learning consultant helping enterprise clients build robust predictive models and data pipelines.',
            avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300',
            email: 'elena.rostova@aub.edu.kh',
            expertise: 'Big Data, Python, Machine Learning, Statistical Modeling'
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
            description: 'Build enterprise web applications with modern HTML5, CSS3, JavaScript, Node.js, and SQL.',
            category_id: 1, // Technology
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
            category_id: 3, // Design
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
            category_id: 4, // Security
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
            category_id: 5, // Data Science
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

    // 8. Seed Enrollments (Realistic active dates)
    console.log('Seeding Enrollments...');
    const now = Date.now();
    const enrollments = [
        { 
            id: 1, 
            user_id: 2, 
            course_id: 1, 
            enrollment_date: new Date(now - 2 * 86400000).toISOString(), // 2 days ago (Technology)
            status: 'Active', 
            progress_percentage: 65.0 
        },
        { 
            id: 2, 
            user_id: 3, 
            course_id: 1, 
            enrollment_date: new Date(now - 4 * 86400000).toISOString(), // 4 days ago (Technology)
            status: 'Active', 
            progress_percentage: 40.0 
        },
        { 
            id: 3, 
            user_id: 4, 
            course_id: 2, 
            enrollment_date: new Date(now - 6 * 86400000).toISOString(), // 6 days ago (Design)
            status: 'Active', 
            progress_percentage: 85.0 
        },
        { 
            id: 4, 
            user_id: 5, 
            course_id: 3, 
            enrollment_date: new Date(now - 8 * 86400000).toISOString(), // 8 days ago (Security)
            status: 'Active', 
            progress_percentage: 20.0 
        },
        { 
            id: 5, 
            user_id: 6, 
            course_id: 1, 
            enrollment_date: new Date(now - 12 * 86400000).toISOString(), // 12 days ago (Technology)
            status: 'Active', 
            progress_percentage: 95.0 
        }
    ];

    for (const e of enrollments) {
        await dbAsync.run(
            `INSERT INTO enrollments (id, user_id, course_id, enrollment_date, status, progress_percentage)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
                user_id = excluded.user_id,
                course_id = excluded.course_id,
                enrollment_date = excluded.enrollment_date,
                status = excluded.status,
                progress_percentage = excluded.progress_percentage`,
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
            link_url: 'dashboard.html',
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

    // 13. Seed 1-on-1 Consultations
    console.log('Seeding 1-on-1 Consultations...');
    const consultations = [
        {
            id: 1,
            student_id: 2, // Sok Virak
            teacher_id: 7, // Dr. Sarah Johnson
            course_id: 1,  // Full-Stack Web Development
            topic: 'Capstone Project Architecture & REST API Review',
            description: 'Discuss database schema normalization and JWT authentication flow for the digital academy portal.',
            session_date: '2026-08-20',
            start_time: '10:00 AM',
            end_time: '10:45 AM',
            meeting_type: 'Online Video',
            meeting_link: 'https://meet.google.com/aub-sok-virak',
            location_room: 'Online Virtual Room A',
            status: 'Confirmed',
            student_notes: 'I have prepared my API endpoints diagram and database ER diagram.',
            teacher_notes: 'Approved. Please bring your Postman test collections.'
        },
        {
            id: 2,
            student_id: 2, // Sok Virak
            teacher_id: 8, // Prof. Alex Chen
            course_id: 2,  // UI/UX Design
            topic: 'Portfolio Design Feedback & Accessibility Audit',
            description: 'Seeking mentorship on contrast ratios, responsive grid systems, and mobile typography.',
            session_date: '2026-08-22',
            start_time: '02:00 PM',
            end_time: '02:30 PM',
            meeting_type: 'In-Person Office',
            meeting_link: '',
            location_room: 'Faculty Building 3, Room 304',
            status: 'Pending',
            student_notes: 'Will bring Figma prototype on laptop.',
            teacher_notes: ''
        },
        {
            id: 3,
            student_id: 3, // Chanthou Meas
            teacher_id: 7, // Dr. Sarah Johnson
            course_id: 3,  // Cyber Security Essentials
            topic: 'Ethical Hacking Lab Setup Assistance',
            description: 'Need guidance setting up virtual environments and penetration testing tools.',
            session_date: '2026-08-18',
            start_time: '03:30 PM',
            end_time: '04:15 PM',
            meeting_type: 'Online Video',
            meeting_link: 'https://meet.google.com/aub-sec-lab',
            location_room: 'Online Virtual Room B',
            status: 'Confirmed',
            student_notes: 'Kali Linux VM is installed.',
            teacher_notes: 'Ensure Docker is running prior to the call.'
        },
        {
            id: 4,
            student_id: 2, // Sok Virak
            teacher_id: 7, // Dr. Sarah Johnson
            course_id: 1,  // Full-Stack Web Development
            topic: 'Midterm Code Review & Performance Optimization',
            description: 'Reviewed indexing on SQL queries and asynchronous event loop performance.',
            session_date: '2026-08-10',
            start_time: '11:00 AM',
            end_time: '11:45 AM',
            meeting_type: 'Online Video',
            meeting_link: 'https://meet.google.com/aub-completed-1',
            location_room: 'Online Virtual Room A',
            status: 'Completed',
            student_notes: 'Understood SQLite query optimization techniques.',
            teacher_notes: 'Great work! Excellent implementation of foreign key constraints and async/await error handling.'
        }
    ];

    for (const c of consultations) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO consultations (id, student_id, teacher_id, course_id, topic, description, session_date, start_time, end_time, meeting_type, meeting_link, location_room, status, student_notes, teacher_notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.student_id, c.teacher_id, c.course_id, c.topic, c.description, c.session_date, c.start_time, c.end_time, c.meeting_type, c.meeting_link, c.location_room, c.status, c.student_notes, c.teacher_notes]
        );
    }

    console.log('✅ SQLite Database seeded successfully with all relationships intact.');
}

if (require.main === module) {
    seedDatabase().then(() => process.exit(0)).catch(err => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
}

module.exports = { seedDatabase };
