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
            full_name: 'Sreyneang Sok',
            email: 'sreyneang@aub.edu.kh',
            university_id: '202401234',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science
            faculty: 'Information Technology',
            department_name: 'Computer Science & IT',
            position: 'Undergraduate Student',
            academic_year: 'Year 2',
            semester: 'Semester 1',
            enrollment_status: 'Active',
            academic_status: 'Currently Enrolled',
            enrollment_date: '2024-09-01',
            expected_graduation_date: '2028-07-15',
            dob: '2004-05-14',
            gender: 'Female',
            address: 'Khan Toul Kork, Phnom Penh, Cambodia',
            phone: '+855 12 888 101',
            email_verified: 1,
            two_factor_enabled: 0,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
            id: 3,
            full_name: 'Chanthou Meas',
            email: 'chanthou.meas@student.aub.edu.kh',
            university_id: '202401235',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 2, // Information Technology
            faculty: 'Information Technology',
            department_name: 'Information Technology',
            position: 'Undergraduate Student',
            academic_year: 'Year 2',
            semester: 'Semester 2',
            enrollment_status: 'Active',
            academic_status: 'Currently Enrolled',
            enrollment_date: '2024-09-01',
            expected_graduation_date: '2028-07-15',
            dob: '2004-11-20',
            gender: 'Female',
            address: 'Khan Daun Penh, Phnom Penh, Cambodia',
            phone: '+855 12 888 102',
            email_verified: 1,
            two_factor_enabled: 1,
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 50 * 86400000).toISOString()
        },
        {
            id: 4,
            full_name: 'Dara Keo',
            email: 'dara.keo@student.aub.edu.kh',
            university_id: '202401236',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 5, // Business Administration
            faculty: 'Business & Management',
            department_name: 'Business Administration',
            position: 'Undergraduate Student',
            academic_year: 'Year 3',
            semester: 'Semester 1',
            enrollment_status: 'Active',
            academic_status: 'Currently Enrolled',
            enrollment_date: '2023-09-01',
            expected_graduation_date: '2027-07-15',
            dob: '2003-08-12',
            gender: 'Male',
            address: 'Khan Chamkarmon, Phnom Penh, Cambodia',
            phone: '+855 12 888 103',
            email_verified: 1,
            two_factor_enabled: 0,
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 40 * 86400000).toISOString()
        },
        {
            id: 5,
            full_name: 'Kanha Rath',
            email: 'kanha.rath@student.aub.edu.kh',
            university_id: '202401237',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 2, // Information Technology
            faculty: 'Information Technology',
            department_name: 'Information Technology',
            position: 'Undergraduate Student',
            academic_year: 'Year 1',
            semester: 'Semester 1',
            enrollment_status: 'Pending',
            academic_status: 'Registration Pending',
            enrollment_date: '2026-08-01',
            expected_graduation_date: '2030-07-15',
            dob: '2006-02-18',
            gender: 'Female',
            address: 'Khan Sen Sok, Phnom Penh, Cambodia',
            phone: '+855 12 888 104',
            email_verified: 0,
            two_factor_enabled: 0,
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            status: 'Pending',
            created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
            id: 6,
            full_name: 'Vibol Pen',
            email: 'vibol.pen@student.aub.edu.kh',
            university_id: '202401238',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science & Engineering
            faculty: 'Information Technology',
            department_name: 'Computer Science',
            position: 'Undergraduate Student',
            academic_year: 'Year 4',
            semester: 'Semester 2',
            enrollment_status: 'Graduated',
            academic_status: 'Alumni / Graduated',
            enrollment_date: '2022-09-01',
            expected_graduation_date: '2026-07-15',
            dob: '2002-09-30',
            gender: 'Male',
            address: 'Khan Chbar Ampov, Phnom Penh, Cambodia',
            phone: '+855 12 888 105',
            email_verified: 1,
            two_factor_enabled: 0,
            avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
            status: 'Inactive',
            created_at: new Date(Date.now() - 70 * 86400000).toISOString()
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
            `INSERT INTO users (
                id, full_name, email, university_id, password_hash, role_id, major_id, avatar_url, status, created_at,
                phone, faculty, department_name, position, academic_year, semester, enrollment_status, academic_status,
                enrollment_date, expected_graduation_date, dob, gender, address, email_verified, two_factor_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                full_name = excluded.full_name, 
                email = excluded.email, 
                university_id = excluded.university_id, 
                password_hash = excluded.password_hash, 
                role_id = excluded.role_id, 
                major_id = excluded.major_id, 
                status = excluded.status, 
                created_at = excluded.created_at,
                phone = excluded.phone,
                faculty = excluded.faculty,
                department_name = excluded.department_name,
                position = excluded.position,
                academic_year = excluded.academic_year,
                semester = excluded.semester,
                enrollment_status = excluded.enrollment_status,
                academic_status = excluded.academic_status,
                enrollment_date = excluded.enrollment_date,
                expected_graduation_date = excluded.expected_graduation_date,
                dob = excluded.dob,
                gender = excluded.gender,
                address = excluded.address,
                email_verified = excluded.email_verified,
                two_factor_enabled = excluded.two_factor_enabled`,
            [
                u.id, u.full_name, u.email, u.university_id, u.password_hash, u.role_id, u.major_id, u.avatar_url, u.status, u.created_at,
                u.phone || '', u.faculty || '', u.department_name || '', u.position || '', u.academic_year || 'Year 1',
                u.semester || 'Semester 1', u.enrollment_status || 'Active', u.academic_status || 'Currently Enrolled',
                u.enrollment_date || null, u.expected_graduation_date || null, u.dob || null, u.gender || 'Not Specified',
                u.address || '', u.email_verified !== undefined ? u.email_verified : 1, u.two_factor_enabled || 0
            ]
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

    // 14. Seed Departments
    console.log('Seeding Departments...');
    const departments = [
        { id: 1, name: 'Computer Science', code: 'CS', description: 'Algorithms, Software Engineering, AI & Systems' },
        { id: 2, name: 'Information Technology', code: 'IT', description: 'Network Infrastructure, Cloud, & Security' },
        { id: 3, name: 'Business Administration', code: 'BA', description: 'Management, Leadership, & Global Commerce' },
        { id: 4, name: 'Finance & Banking', code: 'FIN', description: 'Corporate Finance, Investment, & Fintech' },
        { id: 5, name: 'Accounting', code: 'ACC', description: 'Auditing, Financial Reporting, & Taxation' },
        { id: 6, name: 'Marketing', code: 'MKT', description: 'Digital Marketing, Brand Strategy, & Consumer Behavior' },
        { id: 7, name: 'Economics', code: 'ECON', description: 'Macroeconomics, Microeconomics, & Quantitative Methods' },
        { id: 8, name: 'Engineering', code: 'ENG', description: 'Robotics, Hardware Architecture, & Embedded Systems' },
        { id: 9, name: 'Languages', code: 'LANG', description: 'Academic English, Business Communication, & Linguistics' },
        { id: 10, name: 'Law', code: 'LAW', description: 'Digital Law, Cyber Governance, & Commercial Regulations' }
    ];

    for (const d of departments) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)`,
            [d.id, d.name, d.code, d.description]
        );
    }

    // 15. Seed Teachers (16+ Faculty Members)
    console.log('Seeding Teachers & Faculty Records...');
    const facultyList = [
        {
            userId: 7,
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@aub.edu.kh',
            uniId: 'TCH-001',
            deptId: 1, // CS
            spec: 'Full-Stack Web Architectures & Cloud Computing',
            empType: 'Full-Time',
            exp: 12,
            bio: 'Senior Lecturer with 12+ years of research and production software engineering experience.',
            room: 'Faculty Bldg A, 402',
            phone: '+855 23 999 101',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'
        },
        {
            userId: 8,
            name: 'Prof. Alex Chen',
            email: 'alex.chen@aub.edu.kh',
            uniId: 'TCH-002',
            deptId: 1, // CS
            spec: 'Human-Computer Interaction & Design Systems',
            empType: 'Full-Time',
            exp: 10,
            bio: 'Specialist in interaction design, micro-interactions, and accessibility standards.',
            room: 'Faculty Bldg A, 405',
            phone: '+855 23 999 102',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150'
        },
        {
            userId: 9,
            name: 'Dr. Michael Roberts',
            email: 'michael.roberts@aub.edu.kh',
            uniId: 'TCH-003',
            deptId: 2, // IT
            spec: 'Cybersecurity, Cryptography & Network Defense',
            empType: 'Full-Time',
            exp: 15,
            bio: 'Certified ethical hacker and enterprise infrastructure security architect.',
            room: 'Faculty Bldg B, 201',
            phone: '+855 23 999 103',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'
        },
        {
            userId: 10,
            name: 'Dr. Emily Watson',
            email: 'emily.watson@aub.edu.kh',
            uniId: 'TCH-004',
            deptId: 1, // CS
            spec: 'Machine Learning, Deep Neural Networks & Python',
            empType: 'Full-Time',
            exp: 8,
            bio: 'Researcher in natural language processing and computer vision algorithms.',
            room: 'Faculty Bldg B, 204',
            phone: '+855 23 999 104',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150'
        },
        {
            userId: 11,
            name: 'Dr. Sokhom Srun',
            email: 'sokhom.srun@aub.edu.kh',
            uniId: 'TCH-005',
            deptId: 4, // Finance
            spec: 'Fintech, Digital Assets & Financial Risk Analysis',
            empType: 'Full-Time',
            exp: 14,
            bio: 'Former financial consultant advising national banking digitalization programs.',
            room: 'Faculty Bldg C, 301',
            phone: '+855 23 999 105',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150'
        },
        {
            userId: 12,
            name: 'Prof. Sophea Chea',
            email: 'sophea.chea@aub.edu.kh',
            uniId: 'TCH-006',
            deptId: 5, // Accounting
            spec: 'Auditing Standards, Taxation & Enterprise ERP',
            empType: 'Full-Time',
            exp: 11,
            bio: 'Certified public accountant with extensive corporate governance expertise.',
            room: 'Faculty Bldg C, 305',
            phone: '+855 23 999 106',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150'
        },
        {
            userId: 13,
            name: 'Dr. Rithy Kong',
            email: 'rithy.kong@aub.edu.kh',
            uniId: 'TCH-007',
            deptId: 3, // BA
            spec: 'Strategic Management & Startup Incubation',
            empType: 'Full-Time',
            exp: 9,
            bio: 'Director of entrepreneurial leadership initiatives and business incubator.',
            room: 'Faculty Bldg D, 102',
            phone: '+855 23 999 107',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150'
        },
        {
            userId: 14,
            name: 'Prof. David Miller',
            email: 'david.miller@aub.edu.kh',
            uniId: 'TCH-008',
            deptId: 6, // Marketing
            spec: 'Growth Marketing, SEO & Brand Communications',
            empType: 'Part-Time',
            exp: 7,
            bio: 'Digital marketing strategist managing multi-channel branding campaigns.',
            room: 'Faculty Bldg D, 108',
            phone: '+855 23 999 108',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150'
        },
        {
            userId: 15,
            name: 'Dr. Elena Rostova',
            email: 'elena.rostova@aub.edu.kh',
            uniId: 'TCH-009',
            deptId: 7, // Economics
            spec: 'Macroeconomic Modeling & Econometrics',
            empType: 'Full-Time',
            exp: 13,
            bio: 'Specialist in quantitative economics and regional developmental trade policies.',
            room: 'Faculty Bldg C, 204',
            phone: '+855 23 999 109',
            status: 'On Leave',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'
        },
        {
            userId: 16,
            name: 'Prof. James Wilson',
            email: 'james.wilson@aub.edu.kh',
            uniId: 'TCH-010',
            deptId: 8, // Engineering
            spec: 'Embedded Systems, IoT & Robotics Control',
            empType: 'Full-Time',
            exp: 16,
            bio: 'Hardware engineer with experience in automotive embedded computing.',
            room: 'Lab Bldg E, 101',
            phone: '+855 23 999 110',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150'
        },
        {
            userId: 17,
            name: 'Dr. Kimberly Adams',
            email: 'kimberly.adams@aub.edu.kh',
            uniId: 'TCH-011',
            deptId: 9, // Languages
            spec: 'Academic English & Technical Communication',
            empType: 'Full-Time',
            exp: 6,
            bio: 'Lead coordinator for English for Academic Purposes and thesis writing.',
            room: 'Faculty Bldg A, 202',
            phone: '+855 23 999 111',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150'
        },
        {
            userId: 18,
            name: 'Prof. Chantha Noun',
            email: 'chantha.noun@aub.edu.kh',
            uniId: 'TCH-012',
            deptId: 10, // Law
            spec: 'Cyber Law, IP Governance & Digital Rights',
            empType: 'Adjunct',
            exp: 10,
            bio: 'Legal practitioner specializing in international copyright and digital data privacy.',
            room: 'Faculty Bldg D, 301',
            phone: '+855 23 999 112',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150'
        },
        {
            userId: 19,
            name: 'Dr. Marcus Vance',
            email: 'marcus.vance@aub.edu.kh',
            uniId: 'TCH-013',
            deptId: 1, // CS
            spec: 'Distributed Systems & Database Engine Architecture',
            empType: 'Full-Time',
            exp: 9,
            bio: 'Researches distributed consensus algorithms and high-throughput query optimization.',
            room: 'Faculty Bldg A, 408',
            phone: '+855 23 999 113',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150'
        },
        {
            userId: 20,
            name: 'Prof. Socheata Lim',
            email: 'socheata.lim@aub.edu.kh',
            uniId: 'TCH-014',
            deptId: 2, // IT
            spec: 'DevOps, CI/CD Pipelines & Kubernetes Orchestration',
            empType: 'Part-Time',
            exp: 8,
            bio: 'Cloud operations architect specializing in containerized enterprise workloads.',
            room: 'Faculty Bldg B, 210',
            phone: '+855 23 999 114',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=150'
        },
        {
            userId: 21,
            name: 'Dr. Robert Hansen',
            email: 'robert.hansen@aub.edu.kh',
            uniId: 'TCH-015',
            deptId: 4, // Finance
            spec: 'Quantitative Investment & Portfolio Management',
            empType: 'Adjunct',
            exp: 15,
            bio: 'Portfolio risk analyst with experience in capital market structuring.',
            room: 'Faculty Bldg C, 308',
            phone: '+855 23 999 115',
            status: 'Inactive',
            avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150'
        },
        {
            userId: 22,
            name: 'Prof. Linda Thorne',
            email: 'linda.thorne@aub.edu.kh',
            uniId: 'TCH-016',
            deptId: 3, // BA
            spec: 'Organizational Behavior & Corporate Communications',
            empType: 'Full-Time',
            exp: 12,
            bio: 'Advises corporate boards on team leadership, retention, and workplace culture.',
            room: 'Faculty Bldg D, 112',
            phone: '+855 23 999 116',
            status: 'Active',
            avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150'
        }
    ];

    for (const f of facultyList) {
        // Ensure user account exists
        await dbAsync.run(
            `INSERT OR IGNORE INTO users (id, full_name, email, university_id, password_hash, role_id, avatar_url, status)
             VALUES (?, ?, ?, ?, ?, 2, ?, ?)`,
            [f.userId, f.name, f.email, f.uniId, teacherPasswordHash, f.avatar, f.status]
        );

        // Ensure teacher profile exists
        await dbAsync.run(
            `INSERT OR IGNORE INTO teachers (user_id, teacher_code, department_id, specialization, employment_type, experience_years, bio, office_room, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [f.userId, f.uniId, f.deptId, f.spec, f.empType, f.exp, f.bio, f.room, f.phone, f.status]
        );
    }

    // 16. Seed Teacher <-> Course Many-to-Many Relationships
    console.log('Seeding Teacher Course Assignments...');
    const teacherCourses = [
        { teacherId: 7, courseId: 1 }, // Dr. Sarah Johnson -> Web Dev
        { teacherId: 8, courseId: 2 }, // Prof. Alex Chen -> UI/UX
        { teacherId: 9, courseId: 3 }, // Dr. Michael Roberts -> Cyber Security
        { teacherId: 10, courseId: 4 }, // Dr. Emily Watson -> Data Science
        { teacherId: 19, courseId: 1 }, // Dr. Marcus Vance -> Web Dev (multiple teachers per course)
        { teacherId: 20, courseId: 3 }  // Prof. Socheata Lim -> Cyber Security
    ];

    for (const tc of teacherCourses) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO teacher_courses (teacher_id, course_id) VALUES (?, ?)`,
            [tc.teacherId, tc.courseId]
        );
    }

    // 17. Seed Classes
    console.log('Seeding Classes...');
    const classes = [
        { id: 1, courseId: 1, teacherId: 7, name: 'CS-101: Web Dev Alpha', room: 'Lab 301', schedule: 'Mon/Wed 08:30 - 10:30', start: '2026-08-01', end: '2026-11-30', status: 'Active' },
        { id: 2, courseId: 1, teacherId: 7, name: 'CS-102: Web Dev Beta', room: 'Lab 302', schedule: 'Tue/Thu 13:30 - 15:30', start: '2026-08-01', end: '2026-11-30', status: 'Active' },
        { id: 3, courseId: 2, teacherId: 8, name: 'DS-201: UI/UX Studio', room: 'Studio 105', schedule: 'Mon/Wed 14:00 - 16:00', start: '2026-08-01', end: '2026-11-30', status: 'Active' },
        { id: 4, courseId: 3, teacherId: 9, name: 'SEC-301: Network Security Lab', room: 'Security Lab 401', schedule: 'Fri 09:00 - 12:00', start: '2026-08-01', end: '2026-11-30', status: 'Active' },
        { id: 5, courseId: 4, teacherId: 10, name: 'DATA-401: Applied Python Analytics', room: 'Lab 304', schedule: 'Tue/Thu 09:00 - 11:00', start: '2026-08-01', end: '2026-11-30', status: 'Active' }
    ];

    for (const cl of classes) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO classes (id, course_id, teacher_id, class_name, room, schedule, start_date, end_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [cl.id, cl.courseId, cl.teacherId, cl.name, cl.room, cl.schedule, cl.start, cl.end, cl.status]
        );
    }

    // 18. Seed Class Enrollments (Teacher -> Class -> Enrollment -> Student)
    console.log('Seeding Class Enrollments...');
    const classEnrollments = [
        { classId: 1, studentId: 2 }, // Sok Virak in Web Dev Alpha
        { classId: 1, studentId: 3 }, // Chanthou Meas in Web Dev Alpha
        { classId: 1, studentId: 6 }, // Vibol Pen in Web Dev Alpha
        { classId: 2, studentId: 4 }, // Dara Keo in Web Dev Beta
        { classId: 2, studentId: 5 }, // Kanha Rath in Web Dev Beta
        { classId: 3, studentId: 2 }, // Sok Virak in UI/UX Studio
        { classId: 4, studentId: 3 }  // Chanthou Meas in Security Lab
    ];

    for (const ce of classEnrollments) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO class_enrollments (class_id, student_id) VALUES (?, ?)`,
            [ce.classId, ce.studentId]
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
