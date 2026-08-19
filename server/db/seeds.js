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
    console.log('Seeding Degree Programs...');
    const programs = [
        {
            id: 1,
            title: 'Computer Science & Software Engineering',
            slug: 'computer-science-software-engineering',
            degree_type: 'BACHELOR DEGREE',
            faculty: 'Information Technology Faculty',
            duration: '4 Years',
            description: 'Comprehensive 4-year undergraduate curriculum covering modern computing foundations, distributed architecture, and software design.',
            icon_class: 'bi-laptop',
            theme_class: 'theme-blue',
            detail_url: '#',
            order_num: 1,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 2,
            title: 'Artificial Intelligence & Machine Learning',
            slug: 'artificial-intelligence-machine-learning',
            degree_type: 'BACHELOR DEGREE',
            faculty: 'Information Technology Faculty',
            duration: '4 Years',
            description: 'Rigorous engineering program focusing on modern generative AI, neural networks, natural language processing, and computer vision.',
            icon_class: 'bi-cpu',
            theme_class: 'theme-purple',
            detail_url: '#',
            order_num: 2,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 3,
            title: 'Cybersecurity & Information Defense',
            slug: 'cybersecurity-information-defense',
            degree_type: 'BACHELOR DEGREE',
            faculty: 'Information Technology Faculty',
            duration: '4 Years',
            description: 'Hands-on offensive & defensive security curriculum covering cloud vulnerability defense, penetration testing, and digital forensics.',
            icon_class: 'bi-shield-check',
            theme_class: 'theme-green',
            detail_url: '#',
            order_num: 3,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 4,
            title: 'Data Science & Predictive Analytics',
            slug: 'data-science-predictive-analytics',
            degree_type: 'MASTER DEGREE',
            faculty: 'Information Technology Faculty',
            duration: '2 Years',
            description: 'Postgraduate curriculum in big data pipelines, statistical modeling, machine learning at scale, and business intelligence.',
            icon_class: 'bi-graph-up',
            theme_class: 'theme-cyan',
            detail_url: '#',
            order_num: 4,
            is_featured: 1,
            is_published: 1
        },
        {
            id: 5,
            title: 'Business Information Technology',
            slug: 'business-information-technology',
            degree_type: 'BACHELOR DEGREE',
            faculty: 'Business & Management Faculty',
            duration: '4 Years',
            description: 'Blending technology leadership with financial strategy, enterprise ERP systems, and modern digital commerce solutions.',
            icon_class: 'bi-briefcase',
            theme_class: 'theme-gold',
            detail_url: '#',
            order_num: 5,
            is_featured: 1,
            is_published: 1
        }
    ];

    for (const p of programs) {
        await dbAsync.run(
            `INSERT INTO programs (id, title, slug, degree_type, faculty, duration, description, icon_class, theme_class, detail_url, order_num, is_featured, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
                title = excluded.title, slug = excluded.slug, degree_type = excluded.degree_type,
                faculty = excluded.faculty, duration = excluded.duration, description = excluded.description,
                icon_class = excluded.icon_class, theme_class = excluded.theme_class, detail_url = excluded.detail_url,
                order_num = excluded.order_num, is_featured = excluded.is_featured, is_published = excluded.is_published`,
            [p.id, p.title, p.slug, p.degree_type, p.faculty, p.duration, p.description, p.icon_class, p.theme_class, p.detail_url, p.order_num, p.is_featured, p.is_published]
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
            full_name: 'Dr. Johnathan Vance',
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
            university_id: '202401234',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 1, // Computer Science & Software Engineering
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
            gender: 'Male',
            address: 'Khan Toul Kork, Phnom Penh, Cambodia',
            phone: '+855 12 888 101',
            email_verified: 1,
            two_factor_enabled: 0,
            avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
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
            major_id: 1, // Computer Science & Software Engineering
            faculty: 'Information Technology',
            department_name: 'Software Engineering',
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
            major_id: 3, // Cybersecurity & Information Defense
            faculty: 'Information Technology',
            department_name: 'Cybersecurity',
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
            major_id: 2, // Artificial Intelligence & Machine Learning
            faculty: 'Information Technology',
            department_name: 'Artificial Intelligence',
            position: 'Undergraduate Student',
            academic_year: 'Year 1',
            semester: 'Semester 1',
            enrollment_status: 'Active',
            academic_status: 'Currently Enrolled',
            enrollment_date: '2026-08-01',
            expected_graduation_date: '2030-07-15',
            dob: '2006-02-18',
            gender: 'Female',
            address: 'Khan Sen Sok, Phnom Penh, Cambodia',
            phone: '+855 12 888 104',
            email_verified: 1,
            two_factor_enabled: 0,
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
            id: 6,
            full_name: 'Vibol Pen',
            email: 'vibol.pen@student.aub.edu.kh',
            university_id: '202401238',
            password_hash: studentPasswordHash,
            role_id: 3,
            major_id: 5, // Business Information Technology
            faculty: 'Business & Management',
            department_name: 'Business IT',
            position: 'Undergraduate Student',
            academic_year: 'Year 4',
            semester: 'Semester 2',
            enrollment_status: 'Inactive',
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
            faculty: 'Information Technology',
            department_name: 'Computer Science',
            position: 'Associate Professor',
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
            faculty: 'Information Technology',
            department_name: 'Software Engineering',
            position: 'Head of Software Engineering',
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
            id: 9,
            full_name: 'Dr. Michael Chang',
            email: 'michael.chang@aub.edu.kh',
            university_id: 'T003',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            faculty: 'Information Technology',
            department_name: 'Artificial Intelligence',
            position: 'Lead AI Researcher',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
            id: 10,
            full_name: 'Emily Carter',
            email: 'emily.carter@aub.edu.kh',
            university_id: 'T004',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            faculty: 'Information Technology',
            department_name: 'Design & Interaction',
            position: 'Senior UX Instructor',
            avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150',
            status: 'Active',
            created_at: new Date(Date.now() - 60 * 86400000).toISOString()
        },
        {
            id: 11,
            full_name: 'Dr. Sokha Chan',
            email: 'sokha.chan@aub.edu.kh',
            university_id: 'T005',
            password_hash: teacherPasswordHash,
            role_id: 2,
            major_id: null,
            faculty: 'Information Technology',
            department_name: 'Cybersecurity',
            position: 'Cybersecurity Chair',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
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
                u.phone || '+855 12 888 100', u.faculty || 'Information Technology', u.department_name || '', u.position || '', u.academic_year || 'Year 1',
                u.semester || 'Semester 1', u.enrollment_status || 'Active', u.academic_status || 'Currently Enrolled',
                u.enrollment_date || null, u.expected_graduation_date || null, u.dob || null, u.gender || 'Not Specified',
                u.address || 'Phnom Penh, Cambodia', u.email_verified !== undefined ? u.email_verified : 1, u.two_factor_enabled || 0
            ]
        );
    }

    // 4. Seed Categories
    console.log('Seeding Categories...');
    const categories = [
        { id: 1, name: 'Computer Science', slug: 'computer-science', icon: 'bi-laptop', type: 'general', color: '#2563EB', order_num: 1 },
        { id: 2, name: 'Software Engineering', slug: 'software-engineering', icon: 'bi-code-slash', type: 'general', color: '#0891B2', order_num: 2 },
        { id: 3, name: 'Artificial Intelligence', slug: 'artificial-intelligence', icon: 'bi-cpu', type: 'general', color: '#7C3AED', order_num: 3 },
        { id: 4, name: 'Cybersecurity', slug: 'cybersecurity', icon: 'bi-shield-check', type: 'general', color: '#059669', order_num: 4 },
        { id: 5, name: 'Data Science & Analytics', slug: 'data-science-analytics', icon: 'bi-graph-up-arrow', type: 'general', color: '#D97706', order_num: 5 },
        { id: 6, name: 'Business Information Technology', slug: 'business-information-technology', icon: 'bi-briefcase', type: 'general', color: '#4F46E5', order_num: 6 }
    ];

    for (const c of categories) {
        await dbAsync.run(
            `INSERT INTO categories (id, name, slug, icon, type, color, order_num)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, slug = excluded.slug, icon = excluded.icon, type = excluded.type, color = excluded.color, order_num = excluded.order_num`,
            [c.id, c.name, c.slug, c.icon, c.type, c.color, c.order_num]
        );
    }

    // 5. Seed Instructors
    console.log('Seeding Instructors...');
    const instructors = [
        {
            id: 1,
            user_id: 7,
            name: 'Dr. Sarah Johnson',
            title: 'Associate Professor',
            bio: 'Over 12 years of industry experience in software algorithms, web systems, and data structures.',
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300',
            email: 'sarah.johnson@aub.edu.kh',
            expertise: 'Algorithms, Data Structures, Web Systems',
            faculty: 'Information Technology'
        },
        {
            id: 2,
            user_id: 8,
            name: 'Prof. Alex Chen',
            title: 'Head of Software Engineering',
            bio: 'Specialist in full-stack architecture, microservices, cloud deployments, and reactive state systems.',
            avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300',
            email: 'alex.chen@aub.edu.kh',
            expertise: 'Full-Stack Web, Cloud Architecture, DevOps',
            faculty: 'Information Technology'
        },
        {
            id: 3,
            user_id: 9,
            name: 'Dr. Michael Chang',
            title: 'Lead AI Researcher',
            bio: 'Machine learning specialist focusing on deep neural networks, computer vision, and transformer models.',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300',
            email: 'michael.chang@aub.edu.kh',
            expertise: 'Deep Learning, Neural Networks, Computer Vision',
            faculty: 'Information Technology'
        },
        {
            id: 4,
            user_id: 10,
            name: 'Emily Carter',
            title: 'Senior UX Instructor',
            bio: 'Product designer focusing on accessible user interfaces, design systems, and user journey mapping.',
            avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300',
            email: 'emily.carter@aub.edu.kh',
            expertise: 'User Experience, Design Systems, Figma',
            faculty: 'Information Technology'
        },
        {
            id: 5,
            user_id: 11,
            name: 'Dr. Sokha Chan',
            title: 'Cybersecurity Chair',
            bio: 'Cybersecurity veteran specializing in ethical hacking, cryptography, security auditing, and zero-trust defense.',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300',
            email: 'sokha.chan@aub.edu.kh',
            expertise: 'Network Defense, Ethical Hacking, Cryptography',
            faculty: 'Information Technology'
        }
    ];

    for (const inst of instructors) {
        await dbAsync.run(
            `INSERT INTO instructors (id, user_id, name, title, bio, avatar_url, email, expertise, faculty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, name = excluded.name, title = excluded.title, bio = excluded.bio, avatar_url = excluded.avatar_url, email = excluded.email, expertise = excluded.expertise, faculty = excluded.faculty`,
            [inst.id, inst.user_id, inst.name, inst.title, inst.bio, inst.avatar_url, inst.email, inst.expertise, inst.faculty]
        );
    }

    // 6. Seed Courses
    console.log('Seeding Courses...');
    const courses = [
        {
            id: 1,
            title: 'Full-Stack Modern Web Architecture',
            slug: 'full-stack-modern-web-architecture',
            description: 'Master frontend engineering with component architectures, reactive state management, asynchronous REST APIs, and containerized deployment.',
            category_id: 2, // Software Engineering
            instructor_id: 2, // Prof. Alex Chen
            thumbnail_url: 'assets/images/course_webdev.jpg',
            rating: 4.9,
            difficulty: 'Intermediate',
            duration_hours: '12 Weeks',
            lesson_count: 6,
            enrolled_students_count: 2,
            badge_text: 'Popular',
            order_num: 1,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 2,
            title: 'Applied Programming & Algorithms',
            slug: 'applied-programming-algorithms',
            description: 'Fundamental algorithmic techniques, asymptotic analysis, graph algorithms, dynamic programming, and computational complexity.',
            category_id: 1, // Computer Science
            instructor_id: 1, // Dr. Sarah Johnson
            thumbnail_url: 'assets/images/digital_learning_graphic.jpg',
            rating: 4.8,
            difficulty: 'Beginner',
            duration_hours: '8 Weeks',
            lesson_count: 5,
            enrolled_students_count: 2,
            badge_text: 'Core Subject',
            order_num: 2,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 3,
            title: 'Database Systems & Cloud Architecture',
            slug: 'database-systems-cloud-architecture',
            description: 'Relational data modeling, SQL optimization, query indexing, transactions, and distributed cloud database deployments.',
            category_id: 2, // Software Engineering
            instructor_id: 2, // Prof. Alex Chen
            thumbnail_url: 'assets/images/course_datascience.jpg',
            rating: 4.85,
            difficulty: 'Intermediate',
            duration_hours: '10 Weeks',
            lesson_count: 5,
            enrolled_students_count: 0,
            badge_text: 'Essential',
            order_num: 3,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 4,
            title: 'Cybersecurity Fundamentals & Network Defense',
            slug: 'cybersecurity-fundamentals-network-defense',
            description: 'Enterprise zero-trust architecture, identity and access management, cryptography, network firewalls, and incident response.',
            category_id: 4, // Cybersecurity
            instructor_id: 5, // Dr. Sokha Chan
            thumbnail_url: 'assets/images/course_cybersecurity.jpg',
            rating: 4.9,
            difficulty: 'Intermediate',
            duration_hours: '10 Weeks',
            lesson_count: 5,
            enrolled_students_count: 2,
            badge_text: 'Security',
            order_num: 4,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 5,
            title: 'Artificial Intelligence & Machine Learning',
            slug: 'artificial-intelligence-machine-learning',
            description: 'Supervised and unsupervised learning, deep neural networks, convolutional networks, transformers, and deployment pipelines.',
            category_id: 3, // Artificial Intelligence
            instructor_id: 3, // Dr. Michael Chang
            thumbnail_url: 'assets/images/hero_digital_learning.jpg',
            rating: 4.95,
            difficulty: 'Advanced',
            duration_hours: '14 Weeks',
            lesson_count: 5,
            enrolled_students_count: 1,
            badge_text: 'Featured',
            order_num: 5,
            is_popular: 1,
            is_published: 1
        },
        {
            id: 6,
            title: 'Data Science & Analytics',
            slug: 'data-science-analytics',
            description: 'Data wrangling with Python, exploratory data analysis, statistical modeling, and interactive executive dashboards.',
            category_id: 5, // Data Science
            instructor_id: 3, // Dr. Michael Chang
            thumbnail_url: 'assets/images/course_datascience.jpg',
            rating: 4.75,
            difficulty: 'Intermediate',
            duration_hours: '10 Weeks',
            lesson_count: 4,
            enrolled_students_count: 0,
            badge_text: 'Recommended',
            order_num: 6,
            is_popular: 1,
            is_published: 1
        }
    ];

    for (const c of courses) {
        await dbAsync.run(
            `INSERT INTO courses (id, title, slug, description, category_id, instructor_id, thumbnail_url, rating, difficulty, duration_hours, lesson_count, enrolled_students_count, badge_text, order_num, is_popular, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
                title = excluded.title, slug = excluded.slug, description = excluded.description,
                category_id = excluded.category_id, instructor_id = excluded.instructor_id,
                thumbnail_url = excluded.thumbnail_url, rating = excluded.rating, difficulty = excluded.difficulty,
                duration_hours = excluded.duration_hours, lesson_count = excluded.lesson_count,
                enrolled_students_count = excluded.enrolled_students_count, badge_text = excluded.badge_text,
                order_num = excluded.order_num, is_popular = excluded.is_popular, is_published = excluded.is_published`,
            [c.id, c.title, c.slug, c.description, c.category_id, c.instructor_id, c.thumbnail_url, c.rating, c.difficulty, c.duration_hours, c.lesson_count, c.enrolled_students_count, c.badge_text, c.order_num, c.is_popular, c.is_published]
        );
    }

    // 7. Seed Modules / Chapters
    console.log('Seeding Course Modules / Chapters...');
    const modules = [
        // Course 1: Full-Stack Web Architecture
        { id: 1, course_id: 1, title: 'Introduction to Web Standards & Modern JavaScript', description: 'Foundations of semantic HTML5, CSS layout trees, and the event-driven JavaScript browser runtime.', duration: '2 Hours', order_num: 1, lesson_count: 4, quiz_count: 1 },
        { id: 2, course_id: 1, title: 'HTML5 Semantic Layouts & Advanced Responsive CSS', description: 'CSS Grid, Flexbox layouts, responsive design tokens, and CSS variables.', duration: '3 Hours', order_num: 2, lesson_count: 4, quiz_count: 1 },
        { id: 3, course_id: 1, title: 'React Component Architecture & State Management', description: 'Breaking down interfaces into atomic components, handling one-way state transitions, and hooks.', duration: '3.5 Hours', order_num: 3, lesson_count: 4, quiz_count: 1 },
        { id: 4, course_id: 1, title: 'Node.js REST API Design & Express Middleware', description: 'Asynchronous fetch pipelines, token headers, interceptors, optimistic updates, and REST endpoints.', duration: '3 Hours', order_num: 4, lesson_count: 4, quiz_count: 1 },
        { id: 5, course_id: 1, title: 'Database Systems & SQL Modeling with SQLite', description: 'Relational data modeling, indexing, ACID transactions, and foreign key relationships.', duration: '2.5 Hours', order_num: 5, lesson_count: 4, quiz_count: 1 },
        { id: 6, course_id: 1, title: 'Production Deployment, CI/CD & Containerization', description: 'Code bundling, static caching headers, Docker containerization, and automated deployment.', duration: '2.5 Hours', order_num: 6, lesson_count: 4, quiz_count: 1 },

        // Course 2: Applied Programming & Algorithms
        { id: 7, course_id: 2, title: 'Introduction to Algorithmic Complexity (Big-O)', description: 'Asymptotic analysis, time and space complexity, recurrence relations.', duration: '2 Hours', order_num: 1, lesson_count: 4, quiz_count: 1 },
        { id: 8, course_id: 2, title: 'Linear Data Structures: Arrays, Lists, Stacks, Queues', description: 'Implementation and operations on linear data collections.', duration: '3 Hours', order_num: 2, lesson_count: 4, quiz_count: 1 },
        { id: 9, course_id: 2, title: 'Trees, Heaps & Priority Queues', description: 'Binary search trees, AVL balancing, and binary heaps.', duration: '3.5 Hours', order_num: 3, lesson_count: 4, quiz_count: 1 },
        { id: 10, course_id: 2, title: 'Graph Traversal: BFS, DFS & Shortest Path', description: 'Graph representations, breadth-first search, depth-first search, Dijkstra algorithm.', duration: '3 Hours', order_num: 4, lesson_count: 4, quiz_count: 1 },
        { id: 11, course_id: 2, title: 'Dynamic Programming & Greedy Approaches', description: 'Memoization, tabulation, knapsack problems, and optimal substructure.', duration: '3.5 Hours', order_num: 5, lesson_count: 4, quiz_count: 1 },

        // Course 3: Database Systems & Cloud Architecture
        { id: 12, course_id: 3, title: 'Relational Database Concepts & Normalization', description: '1NF, 2NF, 3NF, BCNF, ER diagrams, and relational algebra.', duration: '2.5 Hours', order_num: 1, lesson_count: 4, quiz_count: 1 },
        { id: 13, course_id: 3, title: 'Advanced SQL Queries, Joins & Subqueries', description: 'Complex joins, window functions, CTEs, and aggregation grouping.', duration: '3 Hours', order_num: 2, lesson_count: 4, quiz_count: 1 },
        { id: 14, course_id: 3, title: 'Indexing Strategies & Query Performance', description: 'B-tree indexes, execution query plans, and EXPLAIN ANALYZE optimization.', duration: '2.5 Hours', order_num: 3, lesson_count: 4, quiz_count: 1 },
        { id: 15, course_id: 3, title: 'Transactions, ACID Compliance & Concurrency', description: 'Transaction isolation levels, deadlock handling, write-ahead logging.', duration: '3 Hours', order_num: 4, lesson_count: 4, quiz_count: 1 },
        { id: 16, course_id: 3, title: 'Cloud Database Deployment & Replication', description: 'Managed cloud DBs, read replicas, automated snapshots, and failover.', duration: '2 Hours', order_num: 5, lesson_count: 4, quiz_count: 1 },

        // Course 4: Cybersecurity Fundamentals
        { id: 17, course_id: 4, title: 'Security Principles, Threats & Vulnerability Surfaces', description: 'CIA triad, threat modeling, attack vectors, and security postures.', duration: '2.5 Hours', order_num: 1, lesson_count: 3, quiz_count: 1 },
        { id: 18, course_id: 4, title: 'Cryptography, Hashing & Public Key Infrastructure', description: 'Symmetric/asymmetric encryption, SHA-256, TLS certificates, and PKI.', duration: '3 Hours', order_num: 2, lesson_count: 4, quiz_count: 1 },
        { id: 19, course_id: 4, title: 'Network Defense, Firewalls & Intrusion Detection', description: 'Packet filtering, IDS/IPS configuration, Wireshark packet analysis.', duration: '3 Hours', order_num: 3, lesson_count: 4, quiz_count: 1 },
        { id: 20, course_id: 4, title: 'Web Application Security & OWASP Top 10', description: 'SQL injection, XSS, CSRF, insecure direct object references, mitigation.', duration: '3.5 Hours', order_num: 4, lesson_count: 4, quiz_count: 1 },
        { id: 21, course_id: 4, title: 'Identity Management & Zero-Trust Architecture', description: 'OAuth2, JWT authentication, RBAC, and zero-trust microsegmentation.', duration: '2.5 Hours', order_num: 5, lesson_count: 4, quiz_count: 1 },

        // Course 5: Artificial Intelligence & Machine Learning
        { id: 22, course_id: 5, title: 'Mathematical Foundations of Machine Learning', description: 'Linear algebra, vector calculus, gradient descent optimization.', duration: '3 Hours', order_num: 1, lesson_count: 5, quiz_count: 1 },
        { id: 23, course_id: 5, title: 'Supervised Learning: Regression & Classification', description: 'Linear/logistic regression, decision trees, random forests, SVMs.', duration: '3.5 Hours', order_num: 2, lesson_count: 5, quiz_count: 1 },
        { id: 24, course_id: 5, title: 'Neural Networks & Deep Learning Foundations', description: 'Multilayer perceptrons, activation functions, backpropagation calculus.', duration: '4 Hours', order_num: 3, lesson_count: 5, quiz_count: 1 },
        { id: 25, course_id: 5, title: 'Convolutional & Recurrent Architectures', description: 'Spatial convolutions, pooling, RNNs, LSTMs, and sequence models.', duration: '3.5 Hours', order_num: 4, lesson_count: 5, quiz_count: 1 },
        { id: 26, course_id: 5, title: 'Transformer Models & Generative AI Applications', description: 'Attention mechanisms, BERT, GPT transformer encoders, and fine-tuning.', duration: '4 Hours', order_num: 5, lesson_count: 4, quiz_count: 1 }
    ];

    for (const m of modules) {
        await dbAsync.run(
            `INSERT INTO modules (id, course_id, title, description, duration, order_num, lesson_count, quiz_count, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET 
                course_id = excluded.course_id, title = excluded.title, description = excluded.description,
                duration = excluded.duration, order_num = excluded.order_num, lesson_count = excluded.lesson_count,
                quiz_count = excluded.quiz_count, status = excluded.status`,
            [m.id, m.course_id, m.title, m.description, m.duration, m.order_num, m.lesson_count, m.quiz_count, 'Published']
        );
    }

    // 8. Seed Enrollments (Realistic, Deduplicated, Unique student-course pairs)
    console.log('Seeding Enrollments...');
    const now = Date.now();
    const enrollments = [
        { 
            id: 1, 
            user_id: 2, // Sok Virak
            course_id: 1, // Full-Stack Modern Web Architecture
            enrollment_date: new Date(now - 4 * 86400000).toISOString(),
            status: 'Active', 
            progress_percentage: 85.0 
        },
        { 
            id: 2, 
            user_id: 3, // Chanthou Meas
            course_id: 1, // Full-Stack Modern Web Architecture
            enrollment_date: new Date(now - 6 * 86400000).toISOString(),
            status: 'Active', 
            progress_percentage: 60.0 
        },
        { 
            id: 3, 
            user_id: 4, // Dara Keo
            course_id: 4, // Cybersecurity Fundamentals
            enrollment_date: new Date(now - 10 * 86400000).toISOString(),
            status: 'Completed', 
            progress_percentage: 100.0 
        },
        { 
            id: 4, 
            user_id: 5, // Kanha Rath
            course_id: 5, // Artificial Intelligence & Machine Learning
            enrollment_date: new Date(now - 2 * 86400000).toISOString(),
            status: 'Active', 
            progress_percentage: 40.0 
        },
        { 
            id: 5, 
            user_id: 6, // Vibol Pen
            course_id: 2, // Applied Programming & Algorithms
            enrollment_date: new Date(now - 14 * 86400000).toISOString(),
            status: 'Active', 
            progress_percentage: 95.0 
        },
        { 
            id: 6, 
            user_id: 2, // Sok Virak
            course_id: 2, // Applied Programming & Algorithms
            enrollment_date: new Date(now - 8 * 86400000).toISOString(),
            status: 'Active', 
            progress_percentage: 50.0 
        },
        { 
            id: 7, 
            user_id: 3, // Chanthou Meas
            course_id: 4, // Cybersecurity Fundamentals
            enrollment_date: new Date(now - 5 * 86400000).toISOString(),
            status: 'Active', 
            progress_percentage: 30.0 
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
            message: 'Sok Virak enrolled in Full-Stack Modern Web Architecture',
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

    // 19. Seed Exams & Quizzes
    console.log('Seeding Exams & Quizzes...');
    const exams = [
        {
            id: 1,
            title: 'Midterm Examination: Web Architecture & RESTful APIs',
            courseId: 1,
            chapterId: 1,
            instructorId: 7,
            examType: 'Midterm Exam',
            description: 'Comprehensive evaluation of frontend/backend communication, state management, HTTP protocols, and async JavaScript execution.',
            totalQuestions: 20,
            totalMarks: 100,
            passingScore: 50,
            duration: 60,
            start: '2026-08-15 08:00:00',
            end: '2026-09-25 23:59:59',
            attempts: 2,
            status: 'Open'
        },
        {
            id: 2,
            title: 'Final Examination: Advanced Design Systems & Prototyping',
            courseId: 2,
            chapterId: 2,
            instructorId: 8,
            examType: 'Final Exam',
            description: 'Design token architecture, accessibility compliance, Figma component libraries, and interactive prototyping evaluation.',
            totalQuestions: 25,
            totalMarks: 100,
            passingScore: 60,
            duration: 90,
            start: '2026-09-10 09:00:00',
            end: '2026-09-30 18:00:00',
            attempts: 1,
            status: 'Scheduled'
        },
        {
            id: 3,
            title: 'Practical Assessment: Network Defense & Penetration Testing',
            courseId: 3,
            chapterId: 1,
            instructorId: 9,
            examType: 'Practical Exam',
            description: 'Hands-on lab exam covering vulnerability scanning, Wireshark packet analysis, and OWASP Top 10 mitigation.',
            totalQuestions: 20,
            totalMarks: 100,
            passingScore: 70,
            duration: 120,
            start: '2026-08-01 08:00:00',
            end: '2026-08-20 23:59:59',
            attempts: 2,
            status: 'Completed'
        },
        {
            id: 4,
            title: 'Entrance Evaluation: Python Statistical Modeling & ML',
            courseId: 4,
            chapterId: 1,
            instructorId: 10,
            examType: 'Entrance Test',
            description: 'Probability, NumPy array manipulations, pandas data cleansing, and scikit-learn regression algorithms.',
            totalQuestions: 15,
            totalMarks: 75,
            passingScore: 50,
            duration: 45,
            start: '2026-08-10 08:00:00',
            end: '2026-09-15 23:59:59',
            attempts: 3,
            status: 'Open'
        }
    ];

    for (const ex of exams) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO exams (id, title, course_id, chapter_id, instructor_id, exam_type, description, total_questions, total_marks, passing_score, duration_minutes, start_datetime, end_datetime, attempts_allowed, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ex.id, ex.title, ex.courseId, ex.chapterId, ex.instructorId, ex.examType, ex.description, ex.totalQuestions, ex.totalMarks, ex.passingScore, ex.duration, ex.start, ex.end, ex.attempts, ex.status]
        );
    }

    // 20. Seed Exam Questions
    console.log('Seeding Exam Questions...');
    const examQuestions = [
        {
            id: 1,
            examId: 1,
            type: 'Multiple Choice',
            text: 'Which HTTP status code is returned when a requested resource is created successfully on the server?',
            options: JSON.stringify(['200 OK', '201 Created', '204 No Content', '301 Moved Permanently']),
            correct: '201 Created',
            points: 5,
            explanation: 'HTTP 201 Created indicates that the request has succeeded and has led to the creation of a new resource.',
            order: 1
        },
        {
            id: 2,
            examId: 1,
            type: 'Multiple Choice',
            text: 'What is the primary characteristic of an idempotent HTTP method such as PUT or DELETE?',
            options: JSON.stringify([
                'It executes asynchronously on the client',
                'Multiple identical requests produce the same server state as a single request',
                'It cannot return JSON responses',
                'It bypasses CORS headers'
            ]),
            correct: 'Multiple identical requests produce the same server state as a single request',
            points: 5,
            explanation: 'An idempotent HTTP method can be called multiple times without altering the final server state beyond the initial call.',
            order: 2
        },
        {
            id: 3,
            examId: 1,
            type: 'True/False',
            text: 'In Node.js, the event loop runs on multiple operating system threads simultaneously by default.',
            options: JSON.stringify(['True', 'False']),
            correct: 'False',
            points: 5,
            explanation: 'Node.js event loop runs on a single thread; asynchronous I/O is offloaded to the libuv threadpool.',
            order: 3
        },
        {
            id: 4,
            examId: 1,
            type: 'Multiple Choice',
            text: 'Which database indexing strategy is most optimal for speeding up exact match queries on email addresses?',
            options: JSON.stringify(['Full-text index', 'B-Tree Unique Index', 'R-Tree spatial index', 'Hash Index only']),
            correct: 'B-Tree Unique Index',
            points: 5,
            explanation: 'A unique B-Tree index provides O(log N) lookup speeds and enforces email uniqueness.',
            order: 4
        }
    ];

    for (const eq of examQuestions) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO exam_questions (id, exam_id, question_type, question_text, options_json, correct_answer, points, explanation, order_num)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [eq.id, eq.examId, eq.type, eq.text, eq.options, eq.correct, eq.points, eq.explanation, eq.order]
        );
    }

    // 21. Seed Exam Results / Submissions
    console.log('Seeding Exam Submissions & Results...');
    const examSubmissions = [
        { id: 1, examId: 1, studentId: 2, courseId: 1, score: 85, totalMarks: 100, percentage: 85.0, correct: 17, wrong: 3, attempt: 1, status: 'Passed', submitted: '2026-08-16 14:30:00' },
        { id: 2, examId: 1, studentId: 3, courseId: 1, score: 92, totalMarks: 100, percentage: 92.0, correct: 18, wrong: 2, attempt: 1, status: 'Passed', submitted: '2026-08-16 15:45:00' },
        { id: 3, examId: 3, studentId: 4, courseId: 3, score: 76, totalMarks: 100, percentage: 76.0, correct: 15, wrong: 5, attempt: 1, status: 'Passed', submitted: '2026-08-10 11:20:00' },
        { id: 4, examId: 3, studentId: 5, courseId: 3, score: 45, totalMarks: 100, percentage: 45.0, correct: 9, wrong: 11, attempt: 1, status: 'Failed', submitted: '2026-08-11 16:10:00' },
        { id: 5, examId: 4, studentId: 6, courseId: 4, score: 68, totalMarks: 75, percentage: 90.6, correct: 14, wrong: 1, attempt: 1, status: 'Passed', submitted: '2026-08-12 10:00:00' }
    ];

    for (const es of examSubmissions) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO exam_submissions (id, exam_id, student_id, course_id, score, total_marks, percentage, correct_count, wrong_count, attempt_number, status, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [es.id, es.examId, es.studentId, es.courseId, es.score, es.totalMarks, es.percentage, es.correct, es.wrong, es.attempt, es.status, es.submitted]
        );
    }

    // 21b. Seed Payments
    console.log('Seeding Payments...');
    const payments = [
        { id: 1, transactionId: 'TXN-2026-8801', enrollmentId: 1, userId: 2, courseId: 1, amount: 50.0, method: 'ABA PAY', status: 'Paid', invoiceNumber: 'INV-2026-0001', notes: 'Tuition paid via ABA QR', paymentDate: '2026-08-01 10:15:00', deadline: '2026-08-15' },
        { id: 2, transactionId: 'TXN-2026-8802', enrollmentId: 2, userId: 3, courseId: 1, amount: 65.0, method: 'Credit Card', status: 'Paid', invoiceNumber: 'INV-2026-0002', notes: 'MasterCard processed', paymentDate: '2026-08-02 14:30:00', deadline: '2026-08-16' },
        { id: 3, transactionId: 'TXN-2026-8803', enrollmentId: 3, userId: 4, courseId: 4, amount: 75.0, method: 'Wing Bank', status: 'Paid', invoiceNumber: 'INV-2026-0003', notes: 'Wing Money transfer', paymentDate: '2026-08-03 09:20:00', deadline: '2026-08-17' },
        { id: 4, transactionId: 'TXN-2026-8804', enrollmentId: 4, userId: 5, courseId: 5, amount: 80.0, method: 'Bakong KHQR', status: 'Pending', invoiceNumber: 'INV-2026-0004', notes: 'Awaiting bank confirmation', paymentDate: null, deadline: '2026-08-26' },
        { id: 5, transactionId: 'TXN-2026-8805', enrollmentId: 5, userId: 6, courseId: 2, amount: 50.0, method: 'Bank Transfer', status: 'Failed', invoiceNumber: 'INV-2026-0005', notes: 'Insufficient funds on attempt', paymentDate: null, deadline: '2026-08-05' }
    ];

    for (const p of payments) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO payments (id, transaction_id, enrollment_id, user_id, course_id, amount, payment_method, payment_status, payment_deadline, invoice_number, notes, payment_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.transactionId, p.enrollmentId, p.userId, p.courseId, p.amount, p.method, p.status, p.deadline, p.invoiceNumber, p.notes, p.paymentDate]
        );
    }

    // 22. Seed Invoices
    console.log('Seeding Invoices...');
    const invoices = [
        { id: 1, invNum: 'INV-2026-0001', studentId: 2, courseId: 1, paymentId: 1, amount: 50.0, discount: 0, tax: 0, total: 50.0, issue: '2026-08-01', due: '2026-08-15', status: 'Paid', notes: 'Tuition Fee - Full-Stack Modern Web Architecture' },
        { id: 2, invNum: 'INV-2026-0002', studentId: 3, courseId: 2, paymentId: 2, amount: 65.0, discount: 0, tax: 0, total: 65.0, issue: '2026-08-02', due: '2026-08-16', status: 'Paid', notes: 'Tuition Fee - UI/UX Design Systems' },
        { id: 3, invNum: 'INV-2026-0003', studentId: 4, courseId: 3, paymentId: 3, amount: 75.0, discount: 0, tax: 0, total: 75.0, issue: '2026-08-03', due: '2026-08-17', status: 'Paid', notes: 'Tuition Fee - Cybersecurity Defense' },
        { id: 4, invNum: 'INV-2026-0004', studentId: 5, courseId: 4, paymentId: 4, amount: 80.0, discount: 0, tax: 0, total: 80.0, issue: '2026-08-12', due: '2026-08-26', status: 'Issued', notes: 'Tuition Fee - Data Science & AI' },
        { id: 5, invNum: 'INV-2026-0005', studentId: 6, courseId: 5, paymentId: 5, amount: 55.0, discount: 5.0, tax: 0, total: 50.0, issue: '2026-07-20', due: '2026-08-05', status: 'Overdue', notes: 'Tuition Fee - Cloud Solutions Architecture' }
    ];

    for (const inv of invoices) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO invoices (id, invoice_number, student_id, course_id, payment_id, amount, discount, tax, total_amount, issue_date, due_date, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [inv.id, inv.invNum, inv.studentId, inv.courseId, inv.paymentId, inv.amount, inv.discount, inv.tax, inv.total, inv.issue, inv.due, inv.status, inv.notes]
        );
    }

    // 23. Seed Teacher Payroll
    console.log('Seeding Teacher Payroll...');
    const payrolls = [
        {
            id: 1,
            teacherId: 7,
            departmentId: 1,
            payPeriod: 'August 2026',
            baseSalary: 2500.0,
            courseComp: 600.0,
            examComp: 150.0,
            bonus: 200.0,
            deductions: 150.0,
            netPay: 3300.0,
            paymentDate: '2026-08-25',
            status: 'Paid',
            notes: 'Monthly salary, lecture hours (48h), midterm grading bonus'
        },
        {
            id: 2,
            teacherId: 8,
            departmentId: 2,
            payPeriod: 'August 2026',
            baseSalary: 2200.0,
            courseComp: 500.0,
            examComp: 100.0,
            bonus: 150.0,
            deductions: 120.0,
            netPay: 2830.0,
            paymentDate: '2026-08-25',
            status: 'Paid',
            notes: 'Monthly salary, design lab studio supervision'
        },
        {
            id: 3,
            teacherId: 9,
            departmentId: 1,
            payPeriod: 'August 2026',
            baseSalary: 2700.0,
            courseComp: 700.0,
            examComp: 200.0,
            bonus: 250.0,
            deductions: 180.0,
            netPay: 3670.0,
            paymentDate: '2026-08-28',
            status: 'Processing',
            notes: 'Monthly salary, cyber lab hardware setup & grading'
        },
        {
            id: 4,
            teacherId: 10,
            departmentId: 1,
            payPeriod: 'August 2026',
            baseSalary: 2600.0,
            courseComp: 550.0,
            examComp: 120.0,
            bonus: 180.0,
            deductions: 160.0,
            netPay: 3290.0,
            paymentDate: null,
            status: 'Pending',
            notes: 'Awaiting faculty dean sign-off'
        }
    ];

    for (const pr of payrolls) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO teacher_payroll (id, teacher_id, department_id, pay_period, base_salary, course_compensation, exam_compensation, bonus, deductions, net_pay, payment_date, status, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [pr.id, pr.teacherId, pr.departmentId, pr.payPeriod, pr.baseSalary, pr.courseComp, pr.examComp, pr.bonus, pr.deductions, pr.netPay, pr.paymentDate, pr.status, pr.notes]
        );
    }

    // 24. Seed Calendar Events
    console.log('Seeding Academic Calendar & Schedule...');
    const calendarEvents = [
        { id: 1, title: 'Web Architecture: Fall Semester Starts', type: 'Course Start', courseId: 1, instructorId: 7, start: '2026-09-01 08:30:00', end: '2026-09-01 11:30:00', room: 'Lecture Hall 101', desc: 'Orientation and syllabus review.' },
        { id: 2, title: 'Web Architecture: Enrollment Deadline', type: 'Enrollment Deadline', courseId: 1, instructorId: 7, start: '2026-08-28 23:59:59', end: '2026-08-28 23:59:59', room: 'Online Portal', desc: 'Final cutoff for regular admissions.' },
        { id: 3, title: 'UI/UX Studio: Design Sprint Class', type: 'Class', courseId: 2, instructorId: 8, start: '2026-08-24 14:00:00', end: '2026-08-24 16:30:00', room: 'Studio 105', desc: 'Figma component library hands-on.' },
        { id: 4, title: 'Midterm Examination: Web Architecture', type: 'Exam', courseId: 1, instructorId: 7, start: '2026-09-20 08:00:00', end: '2026-09-20 23:59:59', room: 'Online Exam Center', desc: 'Midterm exam testing frontend & API concepts.' },
        { id: 5, title: 'Cybersecurity: Penetration Testing Lab Exam', type: 'Exam', courseId: 3, instructorId: 9, start: '2026-09-18 09:00:00', end: '2026-09-18 12:00:00', room: 'Cybersecurity Lab 401', desc: 'Live simulated network attack test.' },
        { id: 6, title: 'Tuition Payment Cutoff: Fall Batch', type: 'Payment Deadline', courseId: 1, instructorId: null, start: '2026-08-30 23:59:59', end: '2026-08-30 23:59:59', room: 'Finance Office', desc: 'Deadline to settle student invoices.' }
    ];

    for (const ce of calendarEvents) {
        await dbAsync.run(
            `INSERT OR IGNORE INTO calendar_events (id, title, event_type, course_id, instructor_id, start_time, end_time, location_room, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ce.id, ce.title, ce.type, ce.courseId, ce.instructorId, ce.start, ce.end, ce.room, ce.desc, 'Active']
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
