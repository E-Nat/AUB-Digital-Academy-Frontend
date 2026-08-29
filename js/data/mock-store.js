// ==========================================================================
// AUB Digital Academy - Centralized Admin Mock Data Store & State Manager
// Complete Offline-First & Hybrid API Mock Store with LocalStorage Persistence
// ==========================================================================

(function (global) {
    'use strict';

    const STORAGE_KEY = 'aub_admin_mock_store_v4';

    // Initial Realistic Academic Seed Data
    const defaultInitialData = {
        users: [
            {
                id: 1,
                full_name: 'Dr. Johnathan Vance',
                email: 'admin@aub.edu.com',
                university_id: '10293847',
                role: 'ADMIN',
                role_id: 1,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                phone: '+855 23 999 100',
                faculty: 'Information Technology',
                department_name: 'IT Directorate',
                position: 'System Administrator',
                email_verified: 1,
                created_at: '2025-11-15T08:30:00.000Z'
            },
            {
                id: 2,
                full_name: 'Dara Sok',
                email: 'dara.sok@example.com',
                university_id: 'STU-2026-001',
                role: 'STUDENT',
                role_id: 3,
                major_id: 1,
                major: 'Computer Science',
                faculty: 'Information Technology',
                department_name: 'Computer Science & IT',
                position: 'Undergraduate Student',
                academic_year: 'Year 2',
                semester: 'Semester 1',
                enrollment_status: 'Active',
                academic_status: 'Currently Enrolled',
                enrollment_date: '2026-08-01',
                expected_graduation_date: '2030-07-15',
                dob: '2004-05-14',
                gender: 'Male',
                address: 'Khan Toul Kork, Phnom Penh, Cambodia',
                phone: '+855 12 888 101',
                email_verified: 1,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                created_at: '2026-01-10T10:15:00.000Z'
            },
            {
                id: 3,
                full_name: 'Sreyneang Kim',
                email: 'sreyneang.kim@example.com',
                university_id: 'STU-2026-002',
                role: 'STUDENT',
                role_id: 3,
                major_id: 2,
                major: 'Software Engineering',
                faculty: 'Information Technology',
                department_name: 'Software Engineering',
                position: 'Undergraduate Student',
                academic_year: 'Year 2',
                semester: 'Semester 2',
                enrollment_status: 'Active',
                academic_status: 'Currently Enrolled',
                enrollment_date: '2026-08-01',
                expected_graduation_date: '2030-07-15',
                dob: '2004-11-20',
                gender: 'Female',
                address: 'Khan Daun Penh, Phnom Penh, Cambodia',
                phone: '+855 12 888 102',
                email_verified: 1,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
                created_at: '2026-02-01T14:20:00.000Z'
            },
            {
                id: 4,
                full_name: 'Vannak Chea',
                email: 'vannak.chea@example.com',
                university_id: 'STU-2026-003',
                role: 'STUDENT',
                role_id: 3,
                major_id: 4,
                major: 'Data Science',
                faculty: 'Information Technology',
                department_name: 'Data Science & Analytics',
                position: 'Undergraduate Student',
                academic_year: 'Year 3',
                semester: 'Semester 1',
                enrollment_status: 'Active',
                academic_status: 'Currently Enrolled',
                enrollment_date: '2026-08-01',
                expected_graduation_date: '2030-07-15',
                dob: '2003-08-12',
                gender: 'Male',
                address: 'Khan Chamkarmon, Phnom Penh, Cambodia',
                phone: '+855 12 888 103',
                email_verified: 1,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
                created_at: '2026-02-18T09:45:00.000Z'
            },
            {
                id: 5,
                full_name: 'Lina Chan',
                email: 'lina.chan@example.com',
                university_id: 'STU-2026-004',
                role: 'STUDENT',
                role_id: 3,
                major_id: 3,
                major: 'Cybersecurity',
                faculty: 'Information Technology',
                department_name: 'Cybersecurity',
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
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                created_at: '2026-03-05T11:00:00.000Z'
            },
            {
                id: 6,
                full_name: 'Rithy Sok',
                email: 'rithy.sok@example.com',
                university_id: 'STU-2026-005',
                role: 'STUDENT',
                role_id: 3,
                major_id: 1,
                major: 'Computer Science',
                faculty: 'Information Technology',
                department_name: 'Computer Science & IT',
                position: 'Undergraduate Student',
                academic_year: 'Year 2',
                semester: 'Semester 1',
                enrollment_status: 'Active',
                academic_status: 'Currently Enrolled',
                enrollment_date: '2026-08-01',
                expected_graduation_date: '2030-07-15',
                dob: '2004-09-30',
                gender: 'Male',
                address: 'Khan Chbar Ampov, Phnom Penh, Cambodia',
                phone: '+855 12 888 105',
                email_verified: 1,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
                created_at: '2026-03-12T16:30:00.000Z'
            },
            {
                id: 7,
                full_name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@aub.edu.kh',
                university_id: 'T001',
                role: 'TEACHER',
                role_id: 2,
                faculty: 'Information Technology',
                department_name: 'Computer Science',
                position: 'Associate Professor',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
                phone: '+855 23 999 101',
                created_at: '2025-10-01T08:00:00.000Z'
            },
            {
                id: 8,
                full_name: 'Prof. Alex Chen',
                email: 'alex.chen@aub.edu.kh',
                university_id: 'T002',
                role: 'TEACHER',
                role_id: 2,
                faculty: 'Information Technology',
                department_name: 'Software Engineering',
                position: 'Head of Software Engineering',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
                phone: '+855 23 999 102',
                created_at: '2025-10-15T09:30:00.000Z'
            },
            {
                id: 9,
                full_name: 'Dr. Michael Chang',
                email: 'michael.chang@aub.edu.kh',
                university_id: 'T003',
                role: 'TEACHER',
                role_id: 2,
                faculty: 'Information Technology',
                department_name: 'Artificial Intelligence',
                position: 'Lead AI Researcher',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
                phone: '+855 23 999 103',
                created_at: '2025-11-20T10:00:00.000Z'
            },
            {
                id: 10,
                full_name: 'Emily Carter',
                email: 'emily.carter@aub.edu.kh',
                university_id: 'T004',
                role: 'TEACHER',
                role_id: 2,
                faculty: 'Information Technology',
                department_name: 'Design & Interaction',
                position: 'Senior UX Instructor',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150',
                phone: '+855 23 999 104',
                created_at: '2025-12-05T13:45:00.000Z'
            },
            {
                id: 11,
                full_name: 'Dr. Sokha Chan',
                email: 'sokha.chan@aub.edu.kh',
                university_id: 'T005',
                role: 'TEACHER',
                role_id: 2,
                faculty: 'Information Technology',
                department_name: 'Cybersecurity',
                position: 'Cybersecurity Chair',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                phone: '+855 23 999 105',
                created_at: '2025-12-10T11:00:00.000Z'
            }
        ],
        categories: [
            { id: 1, name: 'Computer Science', slug: 'computer-science', icon: 'bi-laptop', order_num: 1, color: '#2563EB' },
            { id: 2, name: 'Software Engineering', slug: 'software-engineering', icon: 'bi-code-slash', order_num: 2, color: '#0891B2' },
            { id: 3, name: 'Artificial Intelligence', slug: 'artificial-intelligence', icon: 'bi-cpu', order_num: 3, color: '#7C3AED' },
            { id: 4, name: 'Cybersecurity', slug: 'cybersecurity', icon: 'bi-shield-check', order_num: 4, color: '#059669' },
            { id: 5, name: 'Data Science & Analytics', slug: 'data-science-analytics', icon: 'bi-graph-up-arrow', order_num: 5, color: '#D97706' },
            { id: 6, name: 'Business Information Technology', slug: 'business-information-technology', icon: 'bi-briefcase', order_num: 6, color: '#4F46E5' }
        ],
        instructors: [
            { id: 1, user_id: 7, name: 'Dr. Sarah Johnson', title: 'Associate Professor', email: 'sarah.johnson@aub.edu.kh', expertise: 'Algorithms, Data Structures, Web Systems', faculty: 'Information Technology', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150' },
            { id: 2, user_id: 8, name: 'Prof. Alex Chen', title: 'Head of Software Engineering', email: 'alex.chen@aub.edu.kh', expertise: 'Full-Stack Web, Cloud Architecture, DevOps', faculty: 'Information Technology', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150' },
            { id: 3, user_id: 9, name: 'Dr. Michael Chang', title: 'Lead AI Researcher', email: 'michael.chang@aub.edu.kh', expertise: 'Deep Learning, Neural Networks, Computer Vision', faculty: 'Information Technology', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150' },
            { id: 4, user_id: 10, name: 'Emily Carter', title: 'Senior UX Instructor', email: 'emily.carter@aub.edu.kh', expertise: 'User Experience, Design Systems, Figma', faculty: 'Information Technology', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150' },
            { id: 5, user_id: 11, name: 'Dr. Sokha Chan', title: 'Cybersecurity Chair', email: 'sokha.chan@aub.edu.kh', expertise: 'Network Defense, Ethical Hacking, Cryptography', faculty: 'Information Technology', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150' }
        ],
        programs: [
            {
                id: 1,
                title: 'Computer Science',
                slug: 'computer-science',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-laptop',
                theme_class: 'theme-blue',
                description: 'Comprehensive 4-year undergraduate curriculum covering modern computing foundations, algorithms, and systems.',
                detail_url: '#',
                order_num: 1,
                is_published: 1
            },
            {
                id: 2,
                title: 'Software Engineering',
                slug: 'software-engineering',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-code-slash',
                theme_class: 'theme-cyan',
                description: 'Rigorous engineering program focusing on full-stack development, modern web architecture, and cloud infrastructure.',
                detail_url: '#',
                order_num: 2,
                is_published: 1
            },
            {
                id: 3,
                title: 'Cybersecurity',
                slug: 'cybersecurity',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-shield-check',
                theme_class: 'theme-green',
                description: 'Hands-on security curriculum covering network defense, zero-trust architecture, and digital forensics.',
                detail_url: '#',
                order_num: 3,
                is_published: 1
            },
            {
                id: 4,
                title: 'Data Science',
                slug: 'data-science',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-graph-up',
                theme_class: 'theme-gold',
                description: 'Curriculum covering big data pipelines, statistical modeling, machine learning, and predictive analytics.',
                detail_url: '#',
                order_num: 4,
                is_published: 1
            },
            {
                id: 5,
                title: 'Business Information Technology',
                slug: 'business-information-technology',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Business & Management Faculty',
                duration: '4 Years',
                icon_class: 'bi-briefcase',
                theme_class: 'theme-purple',
                description: 'Blending technology leadership with financial strategy and modern digital commerce solutions.',
                detail_url: '#',
                order_num: 5,
                is_published: 1
            }
        ],
        courses: [
            {
                id: 1,
                title: 'Web Development',
                code: 'CS-WD101',
                slug: 'web-development',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 2,
                instructor_name: 'Prof. Alex Chen',
                instructor_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
                difficulty: 'Intermediate',
                duration: '12 Weeks',
                duration_hours: '12 Weeks',
                lesson_count: 6,
                rating: 4.9,
                enrolled_students_count: 1,
                badge: 'Popular',
                badge_text: 'Popular',
                is_featured: 1,
                price: 50.00,
                enrollment_start_date: '2026-08-01',
                enrollment_deadline: '2026-09-05',
                start_date: '2026-09-10',
                end_date: '2026-11-20',
                is_archived: 0,
                order_num: 1,
                short_description: 'Master frontend engineering with modern component architectures and responsive layouts.',
                description: 'Master frontend engineering with modern component architectures, reactive state management, and containerized deployment.',
                thumbnail_url: 'assets/images/course_webdev.jpg',
                is_published: 1
            },
            {
                id: 2,
                title: 'React & Next.js',
                code: 'CS-RN201',
                slug: 'react-nextjs',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 2,
                instructor_name: 'Prof. Alex Chen',
                instructor_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
                difficulty: 'Intermediate',
                duration: '10 Weeks',
                duration_hours: '10 Weeks',
                lesson_count: 5,
                rating: 4.85,
                enrolled_students_count: 1,
                badge: 'Popular',
                badge_text: 'Popular',
                is_featured: 1,
                price: 65.00,
                enrollment_start_date: '2026-08-01',
                enrollment_deadline: '2026-09-15',
                start_date: '2026-09-20',
                end_date: '2026-11-30',
                is_archived: 0,
                order_num: 2,
                short_description: 'Build enterprise Next.js React applications with server components and modern state architectures.',
                description: 'Build enterprise Next.js React applications with server components, hydration optimization, and modern state architectures.',
                thumbnail_url: 'assets/images/digital_learning_graphic.jpg',
                is_published: 1
            },
            {
                id: 3,
                title: 'Database Management',
                code: 'CS-DB301',
                slug: 'database-management',
                category_id: 1,
                category_name: 'Computer Science',
                instructor_id: 1,
                instructor_name: 'Dr. Sarah Johnson',
                instructor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
                difficulty: 'Beginner',
                duration: '8 Weeks',
                duration_hours: '8 Weeks',
                lesson_count: 5,
                rating: 4.8,
                enrolled_students_count: 1,
                badge: 'Core Subject',
                badge_text: 'Core Subject',
                is_featured: 0,
                price: 45.00,
                enrollment_start_date: '2026-07-01',
                enrollment_deadline: '2026-08-30',
                start_date: '2026-09-01',
                end_date: '2026-11-01',
                is_archived: 0,
                order_num: 3,
                short_description: 'Relational data modeling, SQL optimization, query indexing, transactions, and distributed databases.',
                description: 'Relational data modeling, SQL optimization, query indexing, transactions, and distributed database deployments.',
                thumbnail_url: 'assets/images/course_datascience.jpg',
                is_published: 1
            },
            {
                id: 4,
                title: 'Computer Networks',
                code: 'CS-NW401',
                slug: 'computer-networks',
                category_id: 4,
                category_name: 'Cybersecurity',
                instructor_id: 5,
                instructor_name: 'Dr. Sokha Chan',
                instructor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                difficulty: 'Intermediate',
                duration: '10 Weeks',
                duration_hours: '10 Weeks',
                lesson_count: 5,
                rating: 4.9,
                enrolled_students_count: 1,
                badge: 'Security',
                badge_text: 'Security',
                is_featured: 0,
                price: 75.00,
                enrollment_start_date: '2026-08-10',
                enrollment_deadline: '2026-09-15',
                start_date: '2026-09-20',
                end_date: '2026-11-30',
                is_archived: 0,
                order_num: 4,
                short_description: 'Network architectures, TCP/IP protocols, socket programming, packet filtering, and defense.',
                description: 'Network architectures, TCP/IP protocols, socket programming, packet filtering, and infrastructure defense.',
                thumbnail_url: 'assets/images/course_cybersecurity.jpg',
                is_published: 1
            },
            {
                id: 5,
                title: 'Software Engineering',
                code: 'CS-SE501',
                slug: 'software-engineering',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 2,
                instructor_name: 'Prof. Alex Chen',
                instructor_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
                difficulty: 'Advanced',
                duration: '14 Weeks',
                duration_hours: '14 Weeks',
                lesson_count: 6,
                rating: 4.95,
                enrolled_students_count: 1,
                badge: 'Core Subject',
                badge_text: 'Core Subject',
                is_featured: 1,
                price: 99.00,
                enrollment_start_date: '2026-08-15',
                enrollment_deadline: '2026-09-30',
                start_date: '2026-10-05',
                end_date: '2027-01-15',
                is_archived: 0,
                order_num: 5,
                short_description: 'Large-scale software development processes, system design patterns, unit testing, and agile methodologies.',
                description: 'Large-scale software development processes, system design patterns, unit testing, and agile methodologies.',
                thumbnail_url: 'assets/images/hero_digital_learning.jpg',
                is_published: 1
            }
        ],
        chapters: [
            // Course 1: Web Development (Modules 1..5)
            { id: 1, course_id: 1, chapter_num: 1, title: 'HTML & CSS Fundamentals', duration: '2 Weeks', lesson_count: 3, description: 'Core foundations of semantic HTML5, modern CSS styling, and the box model.', status: 'Published', quiz_count: 1 },
            { id: 2, course_id: 1, chapter_num: 2, title: 'JavaScript Fundamentals', duration: '3 Weeks', lesson_count: 3, description: 'Modern ES6+ syntax, functions, DOM manipulation, and asynchronous programming.', status: 'Published', quiz_count: 1 },
            { id: 3, course_id: 1, chapter_num: 3, title: 'Responsive Web Design', duration: '2 Weeks', lesson_count: 3, description: 'Mobile-first design principles, CSS Flexbox, and CSS Grid layout systems.', status: 'Published', quiz_count: 0 },
            { id: 4, course_id: 1, chapter_num: 4, title: 'Git & GitHub', duration: '2 Weeks', lesson_count: 3, description: 'Version control workflows, branching, pull requests, and collaborative code reviews.', status: 'Published', quiz_count: 0 },
            { id: 5, course_id: 1, chapter_num: 5, title: 'Frontend Project', duration: '3 Weeks', lesson_count: 3, description: 'End-to-end frontend capstone project integrating APIs and responsive design.', status: 'Published', quiz_count: 0 },

            // Course 2: React & Next.js (Modules 6..10)
            { id: 6, course_id: 2, chapter_num: 1, title: 'React Fundamentals', duration: '2 Weeks', lesson_count: 2, description: 'React ecosystem, JSX syntax, Virtual DOM, and component lifecycles.', status: 'Published', quiz_count: 0 },
            { id: 7, course_id: 2, chapter_num: 2, title: 'Components & Props', duration: '2 Weeks', lesson_count: 2, description: 'Reusable component architecture, prop types, composition, and event handling.', status: 'Published', quiz_count: 0 },
            { id: 8, course_id: 2, chapter_num: 3, title: 'State Management', duration: '3 Weeks', lesson_count: 2, description: 'useState, useReducer, custom hooks, and Context API state management.', status: 'Published', quiz_count: 0 },
            { id: 9, course_id: 2, chapter_num: 4, title: 'Next.js Routing', duration: '2 Weeks', lesson_count: 2, description: 'Next.js App Router, layout hierarchies, dynamic routes, and route groups.', status: 'Published', quiz_count: 0 },
            { id: 10, course_id: 2, chapter_num: 5, title: 'Full Stack Next.js', duration: '3 Weeks', lesson_count: 2, description: 'Server actions, streaming SSR, API routes, and full-stack authentication.', status: 'Published', quiz_count: 0 },

            // Course 3: Database Management (Modules 11..15)
            { id: 11, course_id: 3, chapter_num: 1, title: 'Database Fundamentals', duration: '2 Weeks', lesson_count: 2, description: 'Relational data models, ACID properties, schema design, and keys.', status: 'Published', quiz_count: 0 },
            { id: 12, course_id: 3, chapter_num: 2, title: 'SQL', duration: '3 Weeks', lesson_count: 3, description: 'DDL, DML, complex multi-table joins, subqueries, and window functions.', status: 'Published', quiz_count: 0 },
            { id: 13, course_id: 3, chapter_num: 3, title: 'Relational Design', duration: '2 Weeks', lesson_count: 2, description: 'Entity-relationship diagrams, cardinality, and normalization from 1NF to 3NF.', status: 'Published', quiz_count: 0 },
            { id: 14, course_id: 3, chapter_num: 4, title: 'PostgreSQL', duration: '2 Weeks', lesson_count: 2, description: 'PostgreSQL datatypes, indexing, query execution plans, and transactions.', status: 'Published', quiz_count: 0 },
            { id: 15, course_id: 3, chapter_num: 5, title: 'Database Project', duration: '3 Weeks', lesson_count: 2, description: 'Production database design, schema migration, indexing, and backup strategies.', status: 'Published', quiz_count: 0 },

            // Course 4: Computer Networks (Modules 16..20)
            { id: 16, course_id: 4, chapter_num: 1, title: 'Networking Fundamentals', duration: '2 Weeks', lesson_count: 2, description: 'Network architectures, topology models, physical transmission, and Ethernet framing.', status: 'Published', quiz_count: 0 },
            { id: 17, course_id: 4, chapter_num: 2, title: 'OSI & TCP/IP', duration: '2 Weeks', lesson_count: 2, description: 'OSI 7-layer model, TCP/IP stack, three-way handshake, and reliable delivery.', status: 'Published', quiz_count: 0 },
            { id: 18, course_id: 4, chapter_num: 3, title: 'IP Addressing', duration: '2 Weeks', lesson_count: 2, description: 'IPv4 subnetting (CIDR), IPv6 transitions, and DHCP address allocation.', status: 'Published', quiz_count: 0 },
            { id: 19, course_id: 4, chapter_num: 4, title: 'Routing', duration: '3 Weeks', lesson_count: 2, description: 'Static and dynamic routing protocols (OSPF, BGP), packet forwarding, and NAT.', status: 'Published', quiz_count: 0 },
            { id: 20, course_id: 4, chapter_num: 5, title: 'Network Security', duration: '3 Weeks', lesson_count: 2, description: 'Firewalls, intrusion detection, packet inspection, TLS encryption, and secure VPNs.', status: 'Published', quiz_count: 0 },

            // Course 5: Software Engineering (Modules 21..25)
            { id: 21, course_id: 5, chapter_num: 1, title: 'Software Development Lifecycle', duration: '2 Weeks', lesson_count: 2, description: 'Agile methodologies, sprint cycles, Kanban, and product roadmap planning.', status: 'Published', quiz_count: 0 },
            { id: 22, course_id: 5, chapter_num: 2, title: 'Requirements Engineering', duration: '2 Weeks', lesson_count: 2, description: 'User stories, acceptance criteria, INVEST guidelines, and functional specifications.', status: 'Published', quiz_count: 0 },
            { id: 23, course_id: 5, chapter_num: 3, title: 'System Design', duration: '3 Weeks', lesson_count: 2, description: 'Design patterns, SOLID principles, monoliths vs microservices, and Clean Architecture.', status: 'Published', quiz_count: 0 },
            { id: 24, course_id: 5, chapter_num: 4, title: 'Testing', duration: '3 Weeks', lesson_count: 2, description: 'Unit testing, mocking, test-driven development (TDD), and integration testing.', status: 'Published', quiz_count: 0 },
            { id: 25, course_id: 5, chapter_num: 5, title: 'Software Project', duration: '3 Weeks', lesson_count: 2, description: 'CI/CD pipeline configuration, code review gates, release engineering, and monitoring.', status: 'Published', quiz_count: 0 }
        ],
        lessons: [
            // Course 1: Web Development (Modules 1..5)
            { id: 1, module_id: 1, course_id: 1, title: 'Introduction to HTML', duration: '20 minutes', description: 'Semantic markup, accessibility landmarks, and search indexing structures.', order_num: 1, type: 'Video', status: 'Published', video_url: 'intro-lecture.mp4', video_size: '18.4 MB', pdf_url: 'syllabus-guide.pdf', pdf_size: '1.2 MB' },
            { id: 2, module_id: 1, course_id: 1, title: 'HTML Elements', duration: '30 minutes', description: 'Deep dive into structural containers, forms, validation, and metadata.', order_num: 2, type: 'Video', status: 'Published', video_url: 'architecture.mp4', video_size: '24.1 MB', pdf_url: 'lecture-slides.pdf', pdf_size: '2.5 MB' },
            { id: 3, module_id: 1, course_id: 1, title: 'CSS Basics', duration: '25 minutes', description: 'Margins, paddings, borders, cascade specificity, and box-sizing.', order_num: 3, type: 'Lab', status: 'Published', video_url: '', video_size: '', pdf_url: 'exercise-worksheet.pdf', pdf_size: '850 KB' },

            { id: 4, module_id: 2, course_id: 1, title: 'Variables', duration: '20 minutes', description: 'let, const, primitive types, destructuring, and scope hoisting.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 5, module_id: 2, course_id: 1, title: 'Functions', duration: '30 minutes', description: 'Arrow functions, parameters, return values, and closures.', order_num: 2, type: 'Video', status: 'Published' },
            { id: 6, module_id: 2, course_id: 1, title: 'DOM Manipulation', duration: '35 minutes', description: 'Query selectors, event delegation, bubbling, and dynamic DOM mutation.', order_num: 3, type: 'Lab', status: 'Published' },

            { id: 7, module_id: 3, course_id: 1, title: 'Mobile-First Design', duration: '25 minutes', description: 'Viewport configuration, responsive typography, and breakpoint strategies.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 8, module_id: 3, course_id: 1, title: 'Flexbox Layouts', duration: '30 minutes', description: 'Flex containers, alignment axes, wrapping, and responsive navigation bars.', order_num: 2, type: 'Video', status: 'Published' },
            { id: 9, module_id: 3, course_id: 1, title: 'CSS Grid Systems', duration: '35 minutes', description: 'Grid template areas, minmax, auto-fit, auto-fill, and multi-column magazine grids.', order_num: 3, type: 'Lab', status: 'Published' },

            { id: 10, module_id: 4, course_id: 1, title: 'Git Basics & Init', duration: '20 minutes', description: 'Repository initialization, staging area, commits, and log history.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 11, module_id: 4, course_id: 1, title: 'Branching & Merging', duration: '30 minutes', description: 'Feature branches, fast-forward merges, and conflict resolution.', order_num: 2, type: 'Video', status: 'Published' },
            { id: 12, module_id: 4, course_id: 1, title: 'GitHub Collaboration', duration: '35 minutes', description: 'Remote repositories, pull requests, code reviews, and releases.', order_num: 3, type: 'Lab', status: 'Published' },

            { id: 13, module_id: 5, course_id: 1, title: 'Project Setup & Wireframes', duration: '25 minutes', description: 'Project scaffolding, semantic layouts, and asset management.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 14, module_id: 5, course_id: 1, title: 'Interactive Frontend Logic', duration: '45 minutes', description: 'Implementing asynchronous API integration and dynamic state rendering.', order_num: 2, type: 'Lab', status: 'Published' },
            { id: 15, module_id: 5, course_id: 1, title: 'Deployment & Lighthouse Optimization', duration: '30 minutes', description: 'Production bundling, performance optimization, and web hosting.', order_num: 3, type: 'Lab', status: 'Published' },

            // Course 2: React & Next.js (Modules 6..10)
            { id: 16, module_id: 6, course_id: 2, title: 'React Ecosystem & JSX', duration: '25 minutes', description: 'JSX compilation, React tree diffing, and functional component paradigms.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 17, module_id: 6, course_id: 2, title: 'Virtual DOM & Lifecycle', duration: '30 minutes', description: 'Component lifecycles, re-rendering mechanisms, and key optimization.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 18, module_id: 7, course_id: 2, title: 'Component Architecture', duration: '30 minutes', description: 'Single responsibility design, atomic components, and container patterns.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 19, module_id: 7, course_id: 2, title: 'Props & Children Composition', duration: '35 minutes', description: 'Passing data, callback props, compound components, and render props.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 20, module_id: 8, course_id: 2, title: 'useState & useReducer Hooks', duration: '35 minutes', description: 'State immutability, complex action reducers, and predictable state transitions.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 21, module_id: 8, course_id: 2, title: 'Context API & Global State', duration: '40 minutes', description: 'Avoiding prop drilling with Context providers and custom consumer hooks.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 22, module_id: 9, course_id: 2, title: 'App Router & Nested Layouts', duration: '30 minutes', description: 'File-system based routing, layout.tsx, template.tsx, and loading.tsx.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 23, module_id: 9, course_id: 2, title: 'Dynamic Routes & Route Groups', duration: '35 minutes', description: 'Dynamic segments [id], catch-all routes, and route group organization.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 24, module_id: 10, course_id: 2, title: 'Server Actions & Mutations', duration: '45 minutes', description: 'Secure server-side mutations, revalidatePath, and form status hooks.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 25, module_id: 10, course_id: 2, title: 'Authentication & Middleware', duration: '50 minutes', description: 'Edge middleware guards, JWT validation, and session cookies.', order_num: 2, type: 'Lab', status: 'Published' },

            // Course 3: Database Management (Modules 11..15)
            { id: 26, module_id: 11, course_id: 3, title: 'Relational Concepts & ACID', duration: '30 minutes', description: 'Atomicity, consistency, isolation, and durability in DBMS.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 27, module_id: 11, course_id: 3, title: 'Data Modeling & Constraints', duration: '35 minutes', description: 'Primary keys, foreign keys, unique constraints, and check constraints.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 28, module_id: 12, course_id: 3, title: 'Data Query Language (DQL)', duration: '35 minutes', description: 'SELECT, WHERE, ORDER BY, DISTINCT, and pattern filtering.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 29, module_id: 12, course_id: 3, title: 'Joins & Aggregations', duration: '40 minutes', description: 'INNER, LEFT, RIGHT, FULL OUTER joins and GROUP BY/HAVING.', order_num: 2, type: 'Lab', status: 'Published' },
            { id: 30, module_id: 12, course_id: 3, title: 'Subqueries & CTEs', duration: '45 minutes', description: 'Correlated subqueries, Common Table Expressions, and window functions.', order_num: 3, type: 'Lab', status: 'Published' },

            { id: 31, module_id: 13, course_id: 3, title: 'Normalization (1NF, 2NF, 3NF)', duration: '40 minutes', description: 'Functional dependencies and eliminating data redundancy anomalies.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 32, module_id: 13, course_id: 3, title: 'ER Diagrams & Schemas', duration: '35 minutes', description: 'Crow foot notation and mapping conceptual models to physical tables.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 33, module_id: 14, course_id: 3, title: 'PostgreSQL Architecture', duration: '30 minutes', description: 'Process model, memory buffers, WAL logs, and JSONB document support.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 34, module_id: 14, course_id: 3, title: 'Indexing & EXPLAIN Plans', duration: '45 minutes', description: 'B-Tree, GIN, GiST indexes, and optimizing query execution costs.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 35, module_id: 15, course_id: 3, title: 'Schema Migration & Seeding', duration: '40 minutes', description: 'Versioned database migrations, transactional schema updates, and seeders.', order_num: 1, type: 'Lab', status: 'Published' },
            { id: 36, module_id: 15, course_id: 3, title: 'Transactions & Backup Strategy', duration: '45 minutes', description: 'Transaction isolation levels, deadlock handling, pg_dump, and replication.', order_num: 2, type: 'Lab', status: 'Published' },

            // Course 4: Computer Networks (Modules 16..20)
            { id: 37, module_id: 16, course_id: 4, title: 'Network Topologies & Standards', duration: '30 minutes', description: 'Bus, star, mesh topologies, network media, and IEEE 802.3 standards.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 38, module_id: 16, course_id: 4, title: 'Ethernet & Data Link Layer', duration: '35 minutes', description: 'MAC addresses, CSMA/CD, framing, switches, and VLAN segmentation.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 39, module_id: 17, course_id: 4, title: 'OSI 7-Layer Model Deep Dive', duration: '35 minutes', description: 'Data encapsulation and protocols across each abstraction layer.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 40, module_id: 17, course_id: 4, title: 'TCP vs UDP Protocols', duration: '40 minutes', description: 'Connection establishment, sliding window flow control, and UDP streaming.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 41, module_id: 18, course_id: 4, title: 'IPv4 Addressing & Subnetting', duration: '45 minutes', description: 'CIDR notation, subnet masks, network vs host IDs, and VLSM.', order_num: 1, type: 'Lab', status: 'Published' },
            { id: 42, module_id: 18, course_id: 4, title: 'IPv6 & Auto-Configuration', duration: '35 minutes', description: 'IPv6 128-bit hex format, SLAAC auto-configuration, and dual-stacking.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 43, module_id: 19, course_id: 4, title: 'Routing Protocols & Algorithms', duration: '45 minutes', description: 'Link-state vs distance-vector, OSPF, BGP, and routing tables.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 44, module_id: 19, course_id: 4, title: 'Packet Forwarding & NAT', duration: '40 minutes', description: 'Hop-by-hop forwarding, default gateways, and Network Address Translation.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 45, module_id: 20, course_id: 4, title: 'Firewalls & ACL Security', duration: '40 minutes', description: 'Stateful packet inspection, ingress/egress filtering, and ACL rules.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 46, module_id: 20, course_id: 4, title: 'TLS/SSL & Secure VPN Tunnels', duration: '50 minutes', description: 'Cryptographic handshakes, certificates, IPSec, and WireGuard VPNs.', order_num: 2, type: 'Lab', status: 'Published' },

            // Course 5: Software Engineering (Modules 21..25)
            { id: 47, module_id: 21, course_id: 5, title: 'SDLC Phases & Agile Frameworks', duration: '35 minutes', description: 'Sprint planning, daily stand-ups, backlog refinement, and retrospectives.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 48, module_id: 21, course_id: 5, title: 'Scrum Roles & Metrics', duration: '40 minutes', description: 'Product Owner, Scrum Master, sprint velocity, and burndown charts.', order_num: 2, type: 'Video', status: 'Published' },

            { id: 49, module_id: 22, course_id: 5, title: 'User Stories & Acceptance Criteria', duration: '35 minutes', description: 'Writing user stories with Gherkin syntax (Given-When-Then).', order_num: 1, type: 'Video', status: 'Published' },
            { id: 50, module_id: 22, course_id: 5, title: 'Functional Specifications', duration: '40 minutes', description: 'Requirements traceability, domain modeling, and boundary analysis.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 51, module_id: 23, course_id: 5, title: 'Design Patterns & SOLID', duration: '45 minutes', description: 'Factory, Singleton, Observer, Strategy, and SOLID principles.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 52, module_id: 23, course_id: 5, title: 'Clean Architecture & Modular Design', duration: '45 minutes', description: 'Dependency inversion, ports and adapters, and domain-driven design.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 53, module_id: 24, course_id: 5, title: 'Unit Testing & Test Doubles', duration: '40 minutes', description: 'Writing unit tests with mocks, stubs, spies, and coverage reporting.', order_num: 1, type: 'Video', status: 'Published' },
            { id: 54, module_id: 24, course_id: 5, title: 'Integration & End-to-End Tests', duration: '45 minutes', description: 'API contract testing, test databases, and automated UI validation.', order_num: 2, type: 'Lab', status: 'Published' },

            { id: 55, module_id: 25, course_id: 5, title: 'CI/CD Pipelines & Automation', duration: '45 minutes', description: 'Automating build, lint, test, and container push on every pull request.', order_num: 1, type: 'Lab', status: 'Published' },
            { id: 56, module_id: 25, course_id: 5, title: 'Release Engineering & Telemetry', duration: '40 minutes', description: 'Semantic versioning, blue-green deployments, logging, and health metrics.', order_num: 2, type: 'Lab', status: 'Published' }
        ],
        enrollments: [
            { id: 101, student_id: 2, student_name: 'Dara Sok', student_uni_id: 'STU-2026-001', student_email: 'dara.sok@example.com', student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150', course_id: 1, course_title: 'Web Development', major: 'Computer Science', enrollment_date: '2026-08-25', progress_percentage: 85, status: 'Active', payment_status: 'Paid' },
            { id: 102, student_id: 3, student_name: 'Sreyneang Kim', student_uni_id: 'STU-2026-002', student_email: 'sreyneang.kim@example.com', student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', course_id: 2, course_title: 'React & Next.js', major: 'Software Engineering', enrollment_date: '2026-08-24', progress_percentage: 72, status: 'Active', payment_status: 'Paid' },
            { id: 103, student_id: 4, student_name: 'Vannak Chea', student_uni_id: 'STU-2026-003', student_email: 'vannak.chea@example.com', student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', course_id: 3, course_title: 'Database Management', major: 'Data Science', enrollment_date: '2026-08-23', progress_percentage: 64, status: 'Active', payment_status: 'Paid' },
            { id: 104, student_id: 5, student_name: 'Lina Chan', student_uni_id: 'STU-2026-004', student_email: 'lina.chan@example.com', student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150', course_id: 4, course_title: 'Computer Networks', major: 'Cybersecurity', enrollment_date: '2026-08-22', progress_percentage: 91, status: 'Completed', payment_status: 'Paid' },
            { id: 105, student_id: 6, student_name: 'Rithy Sok', student_uni_id: 'STU-2026-005', student_email: 'rithy.sok@example.com', student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', course_id: 5, course_title: 'Software Engineering', major: 'Computer Science', enrollment_date: '2026-08-21', progress_percentage: 48, status: 'Active', payment_status: 'Paid' }
        ],
        exams: [
            { id: 1, course_id: 1, course_title: 'Web Development', title: 'Web Development', exam_date: '2026-08-28', date: 'Aug 28, 2026', time: '09:00 AM', duration: '60 mins', students_count: 5, students: 5, status: 'Scheduled' },
            { id: 2, course_id: 3, course_title: 'Database Management', title: 'Database Management', exam_date: '2026-08-30', date: 'Aug 30, 2026', time: '10:00 AM', duration: '90 mins', students_count: 4, students: 4, status: 'Scheduled' },
            { id: 3, course_id: 5, course_title: 'Software Engineering', title: 'Software Engineering', exam_date: '2026-09-02', date: 'Sep 2, 2026', time: '01:30 PM', duration: '120 mins', students_count: 5, students: 5, status: 'Scheduled' }
        ],
        payments: [
            { id: 1, transaction_id: 'TXN-2026-8801', enrollment_id: 101, user_id: 2, student_name: 'Dara Sok', student_uni_id: 'STU-2026-001', student_email: 'dara.sok@example.com', student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150', course_id: 1, course_title: 'Web Development', amount: 350.00, payment_method: 'ABA PAY', payment_status: 'Paid', invoice_number: 'INV-2026-00412', payment_date: '2026-08-25 14:32:00' },
            { id: 2, transaction_id: 'TXN-2026-8802', enrollment_id: 102, user_id: 3, student_name: 'Sreyneang Kim', student_uni_id: 'STU-2026-002', student_email: 'sreyneang.kim@example.com', student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', course_id: 2, course_title: 'React & Next.js', amount: 350.00, payment_method: 'Credit Card', payment_status: 'Paid', invoice_number: 'INV-2026-00413', payment_date: '2026-08-24 10:15:00' },
            { id: 3, transaction_id: 'TXN-2026-8803', enrollment_id: 103, user_id: 4, student_name: 'Vannak Chea', student_uni_id: 'STU-2026-003', student_email: 'vannak.chea@example.com', student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', course_id: 3, course_title: 'Database Management', amount: 300.00, payment_method: 'ABA PAY', payment_status: 'Paid', invoice_number: 'INV-2026-00414', payment_date: '2026-08-23 16:45:00' },
            { id: 4, transaction_id: 'TXN-2026-8804', enrollment_id: 104, user_id: 5, student_name: 'Lina Chan', student_uni_id: 'STU-2026-004', student_email: 'lina.chan@example.com', student_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150', course_id: 4, course_title: 'Computer Networks', amount: 450.00, payment_method: 'Bank Transfer', payment_status: 'Paid', invoice_number: 'INV-2026-00415', payment_date: '2026-08-22 09:20:00' },
            { id: 5, transaction_id: 'TXN-2026-8805', enrollment_id: 105, user_id: 6, student_name: 'Rithy Sok', student_uni_id: 'STU-2026-005', student_email: 'rithy.sok@example.com', student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', course_id: 5, course_title: 'Software Engineering', amount: 120.00, payment_method: 'ABA PAY', payment_status: 'Pending', invoice_number: 'INV-2026-00416', payment_date: '2026-08-21 11:30:00' }
        ],
        materials: [
            { id: 1, lesson_id: 1, course_id: 1, title: 'Course Syllabus & Web Standards Guide.pdf', type: 'PDF', file_name: 'Web_Standards_Guide_2026.pdf', file_url: 'https://aub.edu.kh/materials/web_standards_guide.pdf', file_size: '2.4 MB' },
            { id: 2, lesson_id: 1, course_id: 1, title: 'HTML5 Semantic Tree Reference.pdf', type: 'PDF', file_name: 'HTML5_Semantic_Reference.pdf', file_url: 'https://aub.edu.kh/materials/html5_semantic.pdf', file_size: '1.1 MB' },
            { id: 3, lesson_id: 2, course_id: 1, title: 'CSS Grid & Flexbox Cheat Sheet.pdf', type: 'PDF', file_name: 'CSS_Grid_Flexbox_Cheatsheet.pdf', file_url: 'https://aub.edu.kh/materials/css_grid.pdf', file_size: '1.8 MB' },
            { id: 4, lesson_id: 3, course_id: 1, title: 'React Hooks & State Flow Diagram.pdf', type: 'PDF', file_name: 'React_State_Flow_Diagram.pdf', file_url: 'https://aub.edu.kh/materials/react_state_flow.pdf', file_size: '3.2 MB' },
            { id: 5, lesson_id: 4, course_id: 1, title: 'REST API Design Best Practices.pdf', type: 'PDF', file_name: 'REST_API_Best_Practices.pdf', file_url: 'https://aub.edu.kh/materials/rest_api_guide.pdf', file_size: '1.9 MB' }
        ],
        quizzes: [
            {
                id: 1,
                module_id: 1,
                course_id: 1,
                title: 'Quiz 1 — HTML5 Standards & Semantic Elements',
                description: 'Assesses understanding of semantic HTML tags, document structure, and accessibility.',
                duration_mins: 20,
                passing_score: 70,
                questions: [
                    {
                        question: 'Which HTML5 tag is used to specify a section of navigation links?',
                        option_a: '<navigation>',
                        option_b: '<nav>',
                        option_c: '<navigate>',
                        option_d: '<links>',
                        correct_answer: 'B',
                        points: 10
                    },
                    {
                        question: 'What is the primary benefit of semantic HTML tags?',
                        option_a: 'Faster rendering engine execution only',
                        option_b: 'Improved accessibility, SEO, and document structure',
                        option_c: 'Automatic responsive layout styling',
                        option_d: 'Built-in database connectivity',
                        correct_answer: 'B',
                        points: 10
                    }
                ]
            },
            {
                id: 2,
                module_id: 2,
                course_id: 1,
                title: 'Quiz 2 — CSS Flexbox & Grid Layouts',
                description: 'Evaluates layout mechanics, responsive design tokens, and alignment axes.',
                duration_mins: 25,
                passing_score: 75,
                questions: [
                    {
                        question: 'Which CSS property controls the alignment of flex items along the cross axis?',
                        option_a: 'justify-content',
                        option_b: 'align-items',
                        option_c: 'flex-direction',
                        option_d: 'align-content',
                        correct_answer: 'B',
                        points: 10
                    }
                ]
            }
        ],
        assignments: [
            {
                id: 1,
                module_id: 2,
                course_id: 1,
                title: 'Assignment 1 — Responsive Dashboard UI',
                instructions: 'Design and build a responsive multi-card dashboard layout using CSS Grid and Flexbox with mobile-first breakpoints.',
                due_date: '2026-09-30',
                max_score: 100,
                attachment_name: 'starter-ui-assets.zip',
                attachment_size: '2.8 MB'
            },
            {
                id: 2,
                module_id: 4,
                course_id: 1,
                title: 'Capstone Project — Full-Stack Web Application',
                instructions: 'Develop a complete full-stack web application with REST API endpoints, token authentication, and interactive UI.',
                due_date: '2026-11-15',
                max_score: 100,
                attachment_name: 'capstone-spec.pdf',
                attachment_size: '1.4 MB'
            }
        ],
        announcements: [
            { id: 1, course_id: 1, title: 'Welcome to Full-Stack Modern Web Architecture!', message: 'Classes begin promptly on September 1, 2026. Please download the course syllabus from Lesson 1 materials.', priority: 'Normal', author_name: 'Dr. Sarah Johnson', published_at: '2026-08-15 09:00:00' },
            { id: 2, course_id: 1, title: 'Midterm Examination Schedule Released', message: 'The Midterm Exam window is confirmed for September 20, 2026 from 08:00 to 23:59. Total duration is 60 minutes with 2 attempts permitted.', priority: 'Important', author_name: 'Dr. Sarah Johnson', published_at: '2026-08-18 14:30:00' }
        ],
        certificates: [
            { id: 1, certificate_number: 'AUB-CERT-2026-0801', student_id: 4, student_name: 'Dara Keo', course_id: 4, course_title: 'Cybersecurity Fundamentals & Network Defense', issue_date: '2026-08-14', completion_date: '2026-08-14', grade_achieved: 'A+ (High Distinction)', status: 'Issued', pdf_url: 'https://aub.edu.kh/certificates/AUB-CERT-2026-0801.pdf' },
            { id: 2, certificate_number: 'AUB-CERT-2026-0802', student_id: 2, student_name: 'Sok Virak', course_id: 2, course_title: 'Applied Programming & Algorithms', issue_date: '2026-08-10', completion_date: '2026-08-10', grade_achieved: 'A (Distinction)', status: 'Issued', pdf_url: 'https://aub.edu.kh/certificates/AUB-CERT-2026-0802.pdf' }
        ],
        audit_logs: [
            { id: 1, user_name: 'Dr. Johnathan Vance', user_role: 'ADMIN', action: 'CREATE_COURSE', entity_type: 'Course', entity_id: 1, details: 'Created course: Full-Stack Modern Web Architecture ($50.00)', created_at: '2026-08-15 09:00:00' },
            { id: 2, user_name: 'Dr. Sarah Johnson', user_role: 'TEACHER', action: 'UPLOAD_MATERIAL', entity_type: 'LessonMaterial', entity_id: 1, details: 'Uploaded syllabus PDF for Lesson 1', created_at: '2026-08-16 10:30:00' },
            { id: 3, user_name: 'Dr. Johnathan Vance', user_role: 'ADMIN', action: 'ISSUE_CERTIFICATE', entity_type: 'Certificate', entity_id: 1, details: 'Issued certificate AUB-CERT-2026-0801 for Dara Keo', created_at: '2026-08-18 16:00:00' }
        ],
        notifications: [
            { id: 1, title: 'New Student Enrollment', message: 'Sok Virak enrolled in Full-Stack Modern Web Architecture', type: 'enrollment', timestamp: '10 minutes ago', read: false, link_url: 'enrollment-management.html' },
            { id: 2, title: 'Course Updated', message: 'Prof. Alex Chen updated syllabus for Full-Stack Modern Web Architecture', type: 'course', timestamp: '1 hour ago', read: false, link_url: 'academic-management.html' },
            { id: 3, title: 'User Account Created', message: 'New student account created for Kanha Rath (ID: 202401237)', type: 'user', timestamp: '3 hours ago', read: false, link_url: 'user-management.html' },
            { id: 4, title: 'System Relational Integrity Check', message: 'All database relationships and unique enrollment indexes verified.', type: 'system', timestamp: '1 day ago', read: true, link_url: 'dashboard.html' }
        ],
        settings: {
            academy_name: 'AUB Digital Academy',
            portal_title: 'Administration Portal',
            contact_email: 'administration@aub.edu.kh',
            support_phone: '+855 23 999 100',
            semester: 'Academic Year 2025-2026',
            maintenance_mode: false,
            email_notifications: true,
            two_factor_auth: false,
            theme_color: 'AUB Navy & Gold'
        }
    };

    // Store Initialization & Retrieval
    class AdminMockStore {
        constructor() {
            this.state = this.loadState();
            this.ensureDefaultAdminSession();
            if (this.state.courses && Array.isArray(this.state.courses)) {
                this.state.courses.forEach(c => this.syncCourseCounts(c.id));
            }
        }

        loadState() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const result = {
                        ...defaultInitialData,
                        ...parsed,
                        users: (parsed.users && parsed.users.length > 0) ? parsed.users : defaultInitialData.users,
                        categories: parsed.categories || defaultInitialData.categories,
                        instructors: parsed.instructors || defaultInitialData.instructors,
                        programs: parsed.programs || defaultInitialData.programs,
                        courses: (parsed.courses && parsed.courses.length > 0) ? parsed.courses : defaultInitialData.courses,
                        chapters: (parsed.chapters && parsed.chapters.length > 0) ? parsed.chapters : defaultInitialData.chapters,
                        lessons: (parsed.lessons && Array.isArray(parsed.lessons) && parsed.lessons.length > 0) ? parsed.lessons : defaultInitialData.lessons,
                        quizzes: (parsed.quizzes && Array.isArray(parsed.quizzes) && parsed.quizzes.length > 0) ? parsed.quizzes : defaultInitialData.quizzes,
                        assignments: (parsed.assignments && Array.isArray(parsed.assignments) && parsed.assignments.length > 0) ? parsed.assignments : defaultInitialData.assignments,
                        enrollments: (parsed.enrollments && parsed.enrollments.length > 0) ? parsed.enrollments : defaultInitialData.enrollments,
                        exams: (parsed.exams && parsed.exams.length > 0) ? parsed.exams : defaultInitialData.exams,
                        payments: (parsed.payments && parsed.payments.length > 0) ? parsed.payments : defaultInitialData.payments,
                        notifications: parsed.notifications || defaultInitialData.notifications,
                        settings: { ...defaultInitialData.settings, ...(parsed.settings || {}) }
                    };

                    // Upgrade migration check: ensure demo courses have the realistic 2.13 curriculum
                    const hasObsoleteDemoChapters = result.chapters && result.chapters.some(ch => ch.title && (ch.title.includes('Algorithmic Complexity') || ch.title.includes('Machine Learning')));
                    if (hasObsoleteDemoChapters) {
                        result.chapters = defaultInitialData.chapters;
                        result.lessons = defaultInitialData.lessons;
                        result.assignments = defaultInitialData.assignments;
                        result.quizzes = defaultInitialData.quizzes;
                    }

                    // Ensure all 5 demo courses exist in state
                    defaultInitialData.courses.forEach(defC => {
                        if (!result.courses.some(c => Number(c.id) === Number(defC.id))) {
                            result.courses.push({ ...defC });
                        }
                    });

                    // Ensure modules exist for all demo courses
                    [1, 2, 3, 4, 5].forEach(courseId => {
                        const hasModules = result.chapters && result.chapters.some(ch => Number(ch.course_id) === courseId);
                        if (!hasModules) {
                            const defModules = defaultInitialData.chapters.filter(ch => Number(ch.course_id) === courseId);
                            result.chapters = (result.chapters || []).concat(defModules);
                            const defLessons = defaultInitialData.lessons.filter(l => Number(l.course_id) === courseId);
                            result.lessons = (result.lessons || []).concat(defLessons);
                        }
                    });

                    return result;
                }
            } catch (err) {
                console.warn('Failed to parse admin store from localStorage, using initial mock data.', err);
            }
            this.saveState(defaultInitialData);
            return JSON.parse(JSON.stringify(defaultInitialData));
        }

        saveState(newState) {
            this.state = newState || this.state;
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
            } catch (err) {
                console.error('Error saving admin mock state:', err);
            }
        }

        resetToDefaults() {
            this.state = JSON.parse(JSON.stringify(defaultInitialData));
            this.saveState(this.state);
            this.ensureDefaultAdminSession(true);
            return this.state;
        }

        resetDemoData() {
            return this.resetToDefaults();
        }

        resetToFactoryDefaults() {
            return this.resetToDefaults();
        }

        ensureDefaultAdminSession(force = false) {
            const hasLocal = typeof localStorage !== 'undefined';
            const hasSession = typeof sessionStorage !== 'undefined';
            const existingToken = (hasLocal ? (localStorage.getItem('aub_auth_token') || localStorage.getItem('token')) : '') || 
                                  (hasSession ? (sessionStorage.getItem('aub_auth_token') || sessionStorage.getItem('token')) : '');
            const existingUser = (hasLocal ? localStorage.getItem('aub_user') : '') || 
                                 (hasSession ? sessionStorage.getItem('aub_user') : '');
            if (!existingToken || !existingUser || force) {
                const adminUser = (this.state && this.state.users) 
                    ? (this.state.users.find(u => u.role === 'ADMIN') || this.state.users[0]) 
                    : { id: 1, full_name: 'Dr. Johnathan Vance', email: 'admin@aub.edu.com', role: 'ADMIN' };
                const token = 'aub_mock_admin_jwt_' + (typeof btoa !== 'undefined' ? btoa(JSON.stringify(adminUser)) : Buffer.from(JSON.stringify(adminUser)).toString('base64'));
                if (hasLocal) {
                    localStorage.setItem('aub_auth_token', token);
                    localStorage.setItem('token', token);
                    localStorage.setItem('aub_user', JSON.stringify(adminUser));
                }
                if (hasSession) {
                    sessionStorage.setItem('aub_auth_token', token);
                    sessionStorage.setItem('token', token);
                }
            }
        }

        // SweetAlert2 Helper Wrappers
        static notifySuccess(title, message = '') {
            if (window.Swal) {
                return window.Swal.fire({
                    icon: 'success',
                    title: title,
                    text: message,
                    confirmButtonColor: '#2563EB',
                    timer: 2500,
                    timerProgressBar: true
                });
            }
            console.log('SUCCESS:', title, message);
        }

        static notifyError(title, message = '') {
            if (window.Swal) {
                return window.Swal.fire({
                    icon: 'error',
                    title: title,
                    text: message,
                    confirmButtonColor: '#2563EB'
                });
            }
            console.error('ERROR:', title, message);
        }

        static notifyWarning(title, message = '') {
            if (window.Swal) {
                return window.Swal.fire({
                    icon: 'warning',
                    title: title,
                    text: message,
                    confirmButtonColor: '#2563EB'
                });
            }
            console.warn('WARNING:', title, message);
        }

        static async confirmDialog(title, text, confirmBtnText = 'Yes, continue', confirmColor = '#2563EB') {
            if (window.Swal) {
                const result = await window.Swal.fire({
                    title: title,
                    text: text,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: confirmColor,
                    cancelButtonColor: '#64748B',
                    confirmButtonText: confirmBtnText,
                    cancelButtonText: 'Cancel',
                    reverseButtons: true
                });
                return result.isConfirmed;
            }
            return window.confirm(`${title}\n${text}`);
        }

        static toast(title, icon = 'success') {
            if (window.Swal) {
                const Toast = window.Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', window.Swal.stopTimer);
                        toast.addEventListener('mouseleave', window.Swal.resumeTimer);
                    }
                });
                Toast.fire({
                    icon: icon,
                    title: title
                });
            }
        }

        // 1. Dashboard Metrics & Dynamic Calculations
        getDashboardMetrics() {
            const users = this.state.users || [];
            const studentUsers = users.filter(u => (u.role || '').toUpperCase() === 'STUDENT' || u.role_id === 3);
            const teacherUsers = users.filter(u => (u.role || '').toUpperCase() === 'TEACHER' || u.role_id === 2);
            const adminUsers = users.filter(u => (u.role || '').toUpperCase() === 'ADMIN' || u.role_id === 1);
            const activeUsers = users.filter(u => (u.status || 'Active') === 'Active').length;
            const courses = this.state.courses || [];
            const chapters = this.state.chapters || [];
            const enrollments = this.state.enrollments || [];
            const exams = this.state.exams || [];
            const payments = this.state.payments || [];

            const totalUsers = users.length;
            const totalStudents = studentUsers.length;
            const totalTeachers = teacherUsers.length;
            const totalAdmins = adminUsers.length;
            const totalCourses = courses.length;
            const activeCourses = courses.filter(c => c.is_published !== 0).length;
            const completedCourses = enrollments.filter(e => (e.status || '').toLowerCase() === 'completed').length;
            const pendingEnrollments = enrollments.filter(e => (e.status || '').toLowerCase() === 'pending').length;
            
            const pendingPaymentsList = payments.filter(p => (p.payment_status || '').toLowerCase() === 'pending');
            const paidPaymentsList = payments.filter(p => (p.payment_status || '').toLowerCase() === 'paid');
            const pendingPayments = pendingPaymentsList.length;
            const paidInvoiceCount = paidPaymentsList.length;
            
            const totalPaidRevenue = paidPaymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const pendingPaymentsAmount = pendingPaymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const outstandingInvoices = pendingPayments;
            const totalGrossVolume = totalPaidRevenue + pendingPaymentsAmount;

            const upcomingExams = exams.length;
            const pendingResults = 1;

            return {
                totalUsers,
                totalCourses,
                totalStudents,
                totalTeachers,
                totalAdmins,
                activeUsers,
                totalChapters: chapters.length,
                totalEnrollments: enrollments.length,
                pendingEnrollments,
                pendingPayments,
                activeCourses: activeCourses > 0 ? activeCourses : totalCourses,
                completedCourses,
                upcomingExams: upcomingExams > 0 ? upcomingExams : 3,
                pendingResults,
                totalPaidRevenue,
                pendingPaymentsAmount,
                outstandingInvoices,
                totalGrossVolume,
                paidInvoiceCount
            };
        }

        getDashboardStats(enrollmentTimeframe = 'all_time', majorTimeframe = 'all_time') {
            const studentUsers = (this.state.users || []).filter(u => (u.role || '').toUpperCase() === 'STUDENT');
            const totalStudents = studentUsers.length;

            // Calculate Students by Major directly from student dataset
            const majorCountMap = {};
            studentUsers.forEach(s => {
                const m = s.major || 'Computer Science';
                majorCountMap[m] = (majorCountMap[m] || 0) + 1;
            });

            const majorColors = {
                'Computer Science': '#2563EB',
                'Software Engineering': '#0891B2',
                'Data Science': '#D97706',
                'Cybersecurity': '#059669',
                'Artificial Intelligence': '#7C3AED',
                'Business Information Technology': '#4F46E5'
            };

            const defaultColors = ['#2563EB', '#0891B2', '#D97706', '#059669', '#7C3AED', '#4F46E5'];

            const majorsList = Object.keys(majorCountMap).map((mName, idx) => {
                const count = majorCountMap[mName];
                const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                return {
                    major: mName,
                    count: count,
                    percentage: pct,
                    color: majorColors[mName] || defaultColors[idx % defaultColors.length]
                };
            });

            // Category breakdown for donut chart
            const categoryStats = majorsList.map(m => ({
                name: m.major,
                count: m.count,
                percentage: m.percentage,
                color: m.color
            }));

            // Monthly Trends 2026 (March to August)
            const enrollmentTrends = {
                months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                enrollments: [3, 5, 7, 8, 10, 12],
                examResults: [2, 3, 5, 6, 8, 10]
            };

            return {
                enrollmentStatistics: {
                    total: totalStudents,
                    categories: categoryStats
                },
                studentsByMajor: {
                    total: totalStudents,
                    majors: majorsList
                },
                enrollmentTrends
            };
        }

        getUpcomingExams() {
            if (this.state.exams && this.state.exams.length > 0) {
                return [...this.state.exams];
            }
            return [
                { id: 1, course_title: 'Web Development', title: 'Web Development', exam_date: '2026-08-28', date: 'Aug 28, 2026', time: '09:00 AM', duration: '60 mins', students_count: 5, students: 5 },
                { id: 2, course_title: 'Database Management', title: 'Database Management', exam_date: '2026-08-30', date: 'Aug 30, 2026', time: '10:00 AM', duration: '90 mins', students_count: 4, students: 4 },
                { id: 3, course_title: 'Software Engineering', title: 'Software Engineering', exam_date: '2026-09-02', date: 'Sep 2, 2026', time: '01:30 PM', duration: '120 mins', students_count: 5, students: 5 }
            ];
        }

        getRecentEnrollments(limit = 10) {
            return (this.state.enrollments || []).slice(0, limit);
        }

        getEnrollments() {
            return [...(this.state.enrollments || [])];
        }

        // 2. User Management CRUD
        getUsers() {
            return [...this.state.users];
        }

        getUserById(id) {
            return this.state.users.find(u => u.id === Number(id));
        }

        createUser(userData) {
            const nextId = this.state.users.length > 0 
                ? Math.max(...this.state.users.map(u => Number(u.id) || 0)) + 1 
                : 1;

            const roleId = Number(userData.role_id) || (userData.role === 'ADMIN' ? 1 : userData.role === 'TEACHER' ? 2 : 3);
            const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'TEACHER' : 'STUDENT';

            // Check email uniqueness
            if (this.state.users.some(u => u.email && u.email.toLowerCase() === (userData.email || '').toLowerCase())) {
                throw new Error('Email address already exists.');
            }

            // Check uni ID uniqueness
            if (userData.university_id && this.state.users.some(u => u.university_id === userData.university_id)) {
                throw new Error('Student / University ID is already assigned.');
            }

            const newUser = {
                id: nextId,
                full_name: userData.full_name,
                email: userData.email,
                university_id: userData.university_id || `2024${String(nextId).padStart(5, '0')}`,
                role: roleName,
                role_id: roleId,
                status: userData.status || 'Active',
                major_id: userData.major_id || null,
                major: userData.major || '',
                faculty: userData.faculty || 'Information Technology',
                department_name: userData.department_name || '',
                position: userData.position || '',
                academic_year: userData.academic_year || 'Year 1',
                semester: userData.semester || 'Semester 1',
                enrollment_status: userData.enrollment_status || 'Active',
                academic_status: userData.academic_status || 'Currently Enrolled',
                enrollment_date: userData.enrollment_date || new Date().toISOString().slice(0, 10),
                expected_graduation_date: userData.expected_graduation_date || '',
                dob: userData.dob || '',
                gender: userData.gender || 'Not Specified',
                address: userData.address || '',
                phone: userData.phone || '',
                email_verified: 1,
                avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.full_name)}`,
                created_at: new Date().toISOString()
            };

            this.state.users.unshift(newUser);

            // If initial course enrollment selected for student
            if (roleId === 3 && userData.initial_course_id) {
                try {
                    this.createEnrollment({
                        student_id: nextId,
                        course_id: userData.initial_course_id,
                        enrollment_date: new Date().toISOString().slice(0, 10),
                        status: 'Active',
                        progress_percentage: 0
                    });
                } catch (e) {
                    console.warn('Initial course enrollment:', e.message);
                }
            }

            this.saveState();
            return newUser;
        }

        updateUser(id, userData) {
            const idx = this.state.users.findIndex(u => u.id === Number(id));
            if (idx === -1) return null;

            const current = this.state.users[idx];

            if (userData.email && userData.email !== current.email) {
                if (this.state.users.some(u => u.id !== Number(id) && u.email.toLowerCase() === userData.email.toLowerCase())) {
                    throw new Error('Another user already has this email address.');
                }
            }

            if (userData.university_id && userData.university_id !== current.university_id) {
                if (this.state.users.some(u => u.id !== Number(id) && u.university_id === userData.university_id)) {
                    throw new Error('Student / University ID is already assigned to another user.');
                }
            }

            const roleId = userData.role_id ? Number(userData.role_id) : current.role_id;
            const roleName = roleId === 1 ? 'ADMIN' : roleId === 2 ? 'TEACHER' : 'STUDENT';

            this.state.users[idx] = {
                ...current,
                ...userData,
                id: current.id,
                role_id: roleId,
                role: roleName
            };

            this.saveState();
            return this.state.users[idx];
        }

        deleteUser(id) {
            const adminUser = this.getAdminUser();
            if (adminUser && adminUser.id === Number(id)) {
                throw new Error('You cannot delete your own admin account.');
            }
            const teacherCourses = this.state.courses.filter(c => c.instructor_id === Number(id));
            if (teacherCourses.length > 0) {
                throw new Error(`Cannot delete user: This teacher is assigned to ${teacherCourses.length} course(s). Please reassign courses before deleting.`);
            }
            const idx = this.state.users.findIndex(u => u.id === Number(id));
            if (idx === -1) return false;
            this.state.users.splice(idx, 1);
            this.state.enrollments = this.state.enrollments.filter(e => e.student_id !== Number(id));
            this.saveState();
            return true;
        }

        toggleUserStatus(id) {
            const user = this.getUserById(id);
            if (!user) return null;
            user.status = (user.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
            this.saveState();
            return user;
        }

        // 3. Academic Programs CRUD (Featured Programs)
        getPrograms() {
            return [...this.state.programs];
        }

        savePrograms(programs) {
            if (Array.isArray(programs)) {
                this.state.programs = [...programs];
                this.saveState();
            }
        }

        createProgram(programData) {
            if (!programData || typeof programData !== 'object') {
                throw new Error('Invalid program data.');
            }
            const title = (programData.title || '').trim();
            const degree = (programData.degree_type || '').trim();
            const duration = (programData.duration || '').trim();
            const rawDesc = (programData.description || programData.full_description || programData.short_description || '').trim();
            const desc = rawDesc.length >= 10 ? rawDesc : `${title} academic program curriculum and overview at AUB Digital Academy.`;

            if (!title || title.length < 3) {
                throw new Error('Program Title is required (minimum 3 characters).');
            }
            if (!degree) {
                throw new Error('Degree Type is required.');
            }
            if (!duration || duration.length < 2) {
                throw new Error('Duration is required (e.g. 4 Years).');
            }

            // Duplicate code protection
            if (programData.code && String(programData.code).trim()) {
                const checkCode = String(programData.code).trim().toLowerCase();
                const existingCode = this.state.programs.find(p => p.code && p.code.trim().toLowerCase() === checkCode);
                if (existingCode) {
                    const err = new Error('An academic program with this code already exists.');
                    err.isDuplicate = true;
                    err.field = 'programCode';
                    err.status = 409;
                    throw err;
                }
            }

            // Duplicate title protection
            const existingTitle = this.state.programs.find(p => p.title && p.title.trim().toLowerCase() === title.toLowerCase());
            if (existingTitle) {
                const err = new Error('An academic program with this title already exists.');
                err.isDuplicate = true;
                err.field = 'programTitle';
                err.status = 409;
                throw err;
            }

            const nextId = this.state.programs.length > 0 
                ? Math.max(...this.state.programs.map(p => Number(p.id) || 0)) + 1 
                : 1;

            const isPub = programData.is_published !== undefined 
                ? (Number(programData.is_published) ? 1 : 0) 
                : (programData.status === 'Draft' ? 0 : 1);
            const statusVal = programData.status || (isPub ? 'Published' : 'Draft');

            const newProgram = {
                id: nextId,
                title: title,
                code: programData.code ? String(programData.code).trim() : '',
                slug: programData.slug || (programData.code ? String(programData.code).trim().toLowerCase() : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
                degree_type: degree,
                category_id: programData.category_id ? Number(programData.category_id) : null,
                faculty: programData.faculty || 'Information Technology Faculty',
                duration: duration,
                credits: programData.credits !== undefined ? Number(programData.credits) : 120,
                short_description: programData.short_description ? String(programData.short_description).trim() : '',
                image_url: programData.image_url ? String(programData.image_url).trim() : '',
                logo_url: programData.logo_url ? String(programData.logo_url).trim() : '',
                learning_outcomes: Array.isArray(programData.learning_outcomes) ? programData.learning_outcomes : [],
                instructor_ids: Array.isArray(programData.instructor_ids) ? programData.instructor_ids : [],
                icon_class: (programData.icon_class || 'bi-laptop').trim(),
                theme_class: (programData.theme_class || 'theme-blue').trim(),
                description: desc,
                full_description: programData.full_description ? String(programData.full_description).trim() : desc,
                detail_url: (programData.detail_url || '#').trim(),
                order_num: !isNaN(Number(programData.order_num)) ? Math.max(0, Number(programData.order_num)) : nextId,
                status: statusVal,
                is_featured: programData.is_featured !== undefined ? (Number(programData.is_featured) ? 1 : 0) : 1,
                is_published: isPub
            };

            this.state.programs.push(newProgram);
            this.saveState();
            return newProgram;
        }

        updateProgram(id, programData) {
            const idx = this.state.programs.findIndex(p => p.id === Number(id));
            if (idx === -1) return null;

            const existing = this.state.programs[idx];
            const title = programData.title !== undefined ? String(programData.title).trim() : existing.title;
            const degree = programData.degree_type !== undefined ? String(programData.degree_type).trim() : existing.degree_type;
            const duration = programData.duration !== undefined ? String(programData.duration).trim() : existing.duration;
            const rawDesc = programData.description !== undefined 
                ? String(programData.description).trim() 
                : (programData.full_description !== undefined ? String(programData.full_description).trim() : (existing.description || ''));
            const desc = rawDesc.length >= 10 ? rawDesc : (existing.description && existing.description.length >= 10 ? existing.description : `${title} academic program curriculum and overview at AUB Digital Academy.`);

            if (!title || title.length < 3) {
                throw new Error('Program Title is required (minimum 3 characters).');
            }
            if (!degree) {
                throw new Error('Degree Type is required.');
            }
            if (!duration || duration.length < 2) {
                throw new Error('Duration is required (e.g. 4 Years).');
            }

            // Duplicate code protection
            if (programData.code && String(programData.code).trim()) {
                const checkCode = String(programData.code).trim().toLowerCase();
                const existingCode = this.state.programs.find(p => p.id !== Number(id) && p.code && p.code.trim().toLowerCase() === checkCode);
                if (existingCode) {
                    const err = new Error('An academic program with this code already exists.');
                    err.isDuplicate = true;
                    err.field = 'programCode';
                    err.status = 409;
                    throw err;
                }
            }

            // Duplicate title protection
            const existingTitle = this.state.programs.find(p => p.id !== Number(id) && p.title && p.title.trim().toLowerCase() === title.toLowerCase());
            if (existingTitle) {
                const err = new Error('An academic program with this title already exists.');
                err.isDuplicate = true;
                err.field = 'programTitle';
                err.status = 409;
                throw err;
            }

            const isPub = programData.is_published !== undefined 
                ? (Number(programData.is_published) ? 1 : 0) 
                : (programData.status !== undefined ? (programData.status === 'Draft' ? 0 : 1) : existing.is_published);
            const statusVal = programData.status || existing.status || (isPub ? 'Published' : 'Draft');

            this.state.programs[idx] = {
                ...existing,
                ...programData,
                id: Number(id),
                title: title,
                code: programData.code !== undefined ? String(programData.code).trim() : (existing.code || ''),
                degree_type: degree,
                category_id: programData.category_id !== undefined ? Number(programData.category_id) : existing.category_id,
                duration: duration,
                credits: programData.credits !== undefined ? Number(programData.credits) : existing.credits,
                short_description: programData.short_description !== undefined ? String(programData.short_description).trim() : (existing.short_description || ''),
                image_url: programData.image_url !== undefined ? String(programData.image_url).trim() : (existing.image_url || ''),
                logo_url: programData.logo_url !== undefined ? String(programData.logo_url).trim() : (existing.logo_url || ''),
                learning_outcomes: programData.learning_outcomes !== undefined ? programData.learning_outcomes : (existing.learning_outcomes || []),
                instructor_ids: programData.instructor_ids !== undefined ? programData.instructor_ids : (existing.instructor_ids || []),
                description: desc,
                full_description: programData.full_description !== undefined ? String(programData.full_description).trim() : (existing.full_description || desc),
                icon_class: programData.icon_class !== undefined ? String(programData.icon_class).trim() : existing.icon_class,
                theme_class: programData.theme_class !== undefined ? String(programData.theme_class).trim() : existing.theme_class,
                detail_url: programData.detail_url !== undefined ? String(programData.detail_url).trim() : existing.detail_url,
                order_num: programData.order_num !== undefined && !isNaN(Number(programData.order_num)) ? Math.max(0, Number(programData.order_num)) : existing.order_num,
                status: statusVal,
                is_featured: programData.is_featured !== undefined ? (Number(programData.is_featured) ? 1 : 0) : existing.is_featured,
                is_published: isPub
            };
            this.saveState();
            return this.state.programs[idx];
        }

        deleteProgram(id) {
            const prog = this.state.programs.find(p => p.id === Number(id));
            if (!prog) return false;
            const users = this.state.users || [];
            const assignedStudents = users.filter(u => u.major_id === Number(id) || (u.major && u.major.toLowerCase() === prog.title.toLowerCase()));
            if (assignedStudents.length > 0) {
                throw new Error(`Cannot delete program: ${assignedStudents.length} registered student(s) are in this degree program. Please reassign students before deleting.`);
            }
            const idx = this.state.programs.findIndex(p => p.id === Number(id));
            if (idx === -1) return false;
            this.state.programs.splice(idx, 1);
            this.saveState();
            return true;
        }

        toggleProgramPublish(id) {
            const prog = this.state.programs.find(p => p.id === Number(id));
            if (!prog) return null;
            prog.is_published = prog.is_published === 1 ? 0 : 1;
            prog.status = prog.is_published === 1 ? 'Published' : 'Draft';
            this.saveState();
            return prog;
        }

        // 4. Academic Courses CRUD
        calculateCourseStatus(course) {
            if (!course.is_published || course.is_published === 0) {
                return 'Draft';
            }
            const today = new Date().toISOString().split('T')[0];
            const enrStart = course.enrollment_start_date ? String(course.enrollment_start_date).split('T')[0] : null;
            const enrDeadline = course.enrollment_deadline ? String(course.enrollment_deadline).split('T')[0] : null;
            const courseStart = course.start_date ? String(course.start_date).split('T')[0] : null;
            const courseEnd = course.end_date ? String(course.end_date).split('T')[0] : null;

            if (courseEnd && today > courseEnd) {
                return 'Completed';
            }
            if (courseStart && today >= courseStart && (!courseEnd || today <= courseEnd)) {
                return 'In Progress';
            }
            if (enrDeadline && today > enrDeadline) {
                return 'Enrollment Closed';
            }
            if (enrStart && today < enrStart) {
                return 'Upcoming';
            }
            if (enrDeadline) {
                const diffMs = new Date(enrDeadline) - new Date(today);
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 3) {
                    return 'Deadline Approaching';
                }
            }
            return 'Enrollment Open';
        }

        getCourses() {
            return this.state.courses.map(c => {
                const computedStatus = this.calculateCourseStatus(c);
                let deadlineWarning = null;
                if (c.enrollment_deadline) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const deadlineDate = new Date(c.enrollment_deadline);
                    deadlineDate.setHours(0,0,0,0);
                    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0 && diffDays <= 3) {
                        deadlineWarning = `⚠ Enrollment closes in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
                    } else if (diffDays === 0) {
                        deadlineWarning = `⚠ Enrollment closes today!`;
                    } else if (diffDays < 0) {
                        deadlineWarning = `🔴 Enrollment Closed`;
                    }
                }
                const enrolledCount = this.state.enrollments.filter(e => e.course_id === Number(c.id)).length;
                const chapters = this.getChaptersByCourseId(c.id);
                let calculatedLessons = 0;
                let calculatedQuizzes = 0;
                let calculatedAssignments = 0;

                chapters.forEach(ch => {
                    const chLessons = this.state.lessons ? this.state.lessons.filter(l => l.module_id === Number(ch.id)) : [];
                    const chQuizzes = this.state.quizzes ? this.state.quizzes.filter(q => q.module_id === Number(ch.id)) : [];
                    const chAssignments = this.state.assignments ? this.state.assignments.filter(a => a.module_id === Number(ch.id)) : [];
                    calculatedLessons += chLessons.length > 0 ? chLessons.length : (Number(ch.lesson_count) || 0);
                    calculatedQuizzes += chQuizzes.length;
                    calculatedAssignments += chAssignments.length;
                });

                return {
                    ...c,
                    code: c.code || (`CS-${String(c.id).padStart(3, '0')}`),
                    short_description: c.short_description || '',
                    is_featured: c.is_featured !== undefined ? Number(c.is_featured) : 0,
                    order_num: c.order_num !== undefined ? Number(c.order_num) : 1,
                    computed_status: computedStatus,
                    deadline_warning: deadlineWarning,
                    enrolled_students_count: enrolledCount,
                    module_count: chapters.length,
                    lesson_count: calculatedLessons > 0 ? calculatedLessons : (Number(c.lesson_count) || 0),
                    quiz_count: calculatedQuizzes,
                    assignment_count: calculatedAssignments,
                    price: c.price !== undefined ? c.price : 0.0
                };
            });
        }

        getCourseById(id) {
            const c = this.state.courses.find(course => course.id === Number(id));
            if (!c) return null;
            const chapters = this.getChaptersByCourseId(id);
            let calculatedLessons = 0;
            let calculatedQuizzes = 0;
            let calculatedAssignments = 0;

            chapters.forEach(ch => {
                const chLessons = this.state.lessons ? this.state.lessons.filter(l => l.module_id === Number(ch.id)) : [];
                const chQuizzes = this.state.quizzes ? this.state.quizzes.filter(q => q.module_id === Number(ch.id)) : [];
                const chAssignments = this.state.assignments ? this.state.assignments.filter(a => a.module_id === Number(ch.id)) : [];
                calculatedLessons += chLessons.length > 0 ? chLessons.length : (Number(ch.lesson_count) || 0);
                calculatedQuizzes += chQuizzes.length;
                calculatedAssignments += chAssignments.length;
            });

            return {
                ...c,
                code: c.code || (`CS-${String(c.id).padStart(3, '0')}`),
                short_description: c.short_description || '',
                is_featured: c.is_featured !== undefined ? Number(c.is_featured) : 0,
                order_num: c.order_num !== undefined ? Number(c.order_num) : 1,
                computed_status: this.calculateCourseStatus(c),
                enrolled_students_count: this.state.enrollments.filter(e => e.course_id === Number(c.id)).length,
                module_count: chapters.length,
                lesson_count: calculatedLessons > 0 ? calculatedLessons : (Number(c.lesson_count) || 0),
                quiz_count: calculatedQuizzes,
                assignment_count: calculatedAssignments
            };
        }

        getCourseDetails(id) {
            const course = this.getCourseById(id);
            if (!course) return null;

            // 1. Chapters with embedded lessons, quizzes, and assignments
            const chapters = this.getChaptersByCourseId(id).map(ch => {
                const lessons = this.getLessonsByModuleId(ch.id);
                const quizzes = this.getQuizzesByModuleId(ch.id);
                const assignments = this.getAssignmentsByModuleId(ch.id);
                return {
                    ...ch,
                    lesson_count: lessons.length > 0 ? lessons.length : (ch.lesson_count || 3),
                    quiz_count: quizzes.length,
                    assignment_count: assignments.length,
                    lessons: lessons,
                    quizzes: quizzes,
                    assignments: assignments
                };
            });

            // 2. Students
            const students = this.state.enrollments.filter(e => e.course_id === Number(id));

            // 3. Exams
            const exams = [
                { id: 1, title: 'Midterm Examination', format: 'Online Proctoring', duration: '90 Mins', passing_score: 70, weight: '30%', status: 'Scheduled', exam_date: course.start_date || '2026-10-01' },
                { id: 2, title: 'Final Capstone Assessment', format: 'Project Submission + Oral Defense', duration: '120 Mins', passing_score: 75, weight: '40%', status: 'Upcoming', exam_date: course.end_date || '2026-11-10' }
            ];

            // 4. Quizzes
            const quizzes = this.getAllQuizzesByCourseId(id);

            // 5. Assignments
            const assignments = this.getAllAssignmentsByCourseId(id);

            // 6. Schedule
            const schedule = {
                enrollment_opens: course.enrollment_start_date || '2026-08-20',
                enrollment_deadline: course.enrollment_deadline || '2026-09-05',
                course_starts: course.start_date || '2026-09-10',
                course_ends: course.end_date || '2026-11-10',
                weekly_sessions: 'Tuesdays & Thursdays, 18:00 - 20:00 (GMT+7)',
                room: 'Virtual Lab 102 & Zoom Auditorium'
            };

            // 7. Payments
            const payments = (this.state.payments || []).filter(p => p.course_id === Number(id));
            const totalRevenue = payments
                .filter(p => p.payment_status === 'Paid')
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            // 8. Reports
            const completedCount = students.filter(s => s.progress_percentage >= 100 || s.status === 'Completed').length;
            const avgProgress = students.length > 0
                ? Math.round(students.reduce((sum, s) => sum + (Number(s.progress_percentage) || 0), 0) / students.length)
                : 0;

            return {
                overview: course,
                chapters,
                students,
                exams,
                quizzes,
                assignments,
                schedule,
                payments: {
                    transactions: payments,
                    total_revenue: totalRevenue
                },
                reports: {
                    total_enrolled: students.length,
                    completed_count: completedCount,
                    completion_rate: students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0,
                    average_progress: avgProgress,
                    total_revenue: totalRevenue
                }
            };
        }

        createCourse(courseData) {
            const title = typeof courseData.title === 'string' ? courseData.title.trim() : '';
            const desc = typeof courseData.description === 'string' ? courseData.description.trim() : '';

            // Validation 1: Required Fields
            if (!title || title.length < 3) {
                throw new Error('Course Title is required (minimum 3 characters).');
            }
            if (!courseData.category_id) {
                throw new Error('Category is required.');
            }
            if (!courseData.instructor_id) {
                throw new Error('Instructor is required.');
            }
            if (!courseData.difficulty) {
                throw new Error('Difficulty level is required.');
            }
            if (!desc || desc.length < 10) {
                throw new Error('Course Description is required (minimum 10 characters).');
            }

            // Validation 2: Clear Date Validations
            if (courseData.enrollment_start_date && courseData.enrollment_deadline) {
                if (new Date(courseData.enrollment_deadline) < new Date(courseData.enrollment_start_date)) {
                    throw new Error('Date Error: Enrollment Deadline cannot be before Enrollment Start Date.');
                }
            }
            if (courseData.enrollment_deadline && courseData.start_date) {
                if (new Date(courseData.start_date) < new Date(courseData.enrollment_deadline)) {
                    throw new Error('Date Error: Course Start Date cannot be before Enrollment Deadline.');
                }
            }
            if (courseData.start_date && courseData.end_date) {
                if (new Date(courseData.end_date) < new Date(courseData.start_date)) {
                    throw new Error('Date Error: Course End Date cannot be before Course Start Date.');
                }
            }

            const nextId = this.state.courses.length > 0 
                ? Math.max(...this.state.courses.map(c => Number(c.id) || 0)) + 1 
                : 1;

            const category = this.state.categories.find(cat => cat.id === Number(courseData.category_id));
            const instructor = this.state.instructors.find(ins => ins.id === Number(courseData.instructor_id));

            const newCourse = {
                id: nextId,
                title: title,
                code: courseData.code || (`CS-${String(nextId).padStart(3, '0')}`),
                short_description: courseData.short_description || '',
                slug: courseData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                category_id: Number(courseData.category_id) || 1,
                category_name: category ? category.name : 'Computer Science',
                instructor_id: Number(courseData.instructor_id) || 1,
                instructor_name: instructor ? instructor.name : 'Faculty Lead',
                instructor_avatar: instructor ? (instructor.avatar_url || '') : '',
                difficulty: courseData.difficulty || 'Beginner',
                duration: courseData.duration || courseData.duration_hours || '8 Weeks',
                duration_hours: courseData.duration_hours || courseData.duration || '8 Weeks',
                module_count: 0,
                lesson_count: 0,
                rating: 4.8,
                enrolled_students_count: 0,
                badge: courseData.badge || (courseData.is_featured ? 'Popular' : ''),
                badge_text: courseData.badge_text || courseData.badge || (courseData.is_featured ? 'Popular' : ''),
                is_featured: courseData.is_featured !== undefined ? Number(courseData.is_featured) : 0,
                price: !isNaN(Number(courseData.price)) ? Math.max(0, Number(courseData.price)) : 0.0,
                enrollment_start_date: courseData.enrollment_start_date || null,
                enrollment_deadline: courseData.enrollment_deadline || null,
                start_date: courseData.start_date || null,
                end_date: courseData.end_date || null,
                is_archived: 0,
                order_num: Number(courseData.order_num) || 1,
                description: desc,
                thumbnail_url: courseData.thumbnail_url || 'assets/images/course_webdev.jpg',
                is_published: courseData.is_published !== undefined ? Number(courseData.is_published) : 1
            };

            this.state.courses.unshift(newCourse);

            // If modules array was passed from the 6-step creation wizard
            if (Array.isArray(courseData.modules) && courseData.modules.length > 0) {
                this.setCourseModulesAndLessons(nextId, courseData.modules);
            }

            this.syncCourseCounts(nextId);
            this.saveState();
            return this.getCourseById(nextId);
        }

        updateCourse(id, courseData) {
            const idx = this.state.courses.findIndex(c => c.id === Number(id));
            if (idx === -1) return null;

            const existing = this.state.courses[idx];
            const title = courseData.title !== undefined ? String(courseData.title).trim() : existing.title;
            const desc = courseData.description !== undefined ? String(courseData.description).trim() : existing.description;

            if (!title || title.length < 3) {
                throw new Error('Course Title is required (minimum 3 characters).');
            }
            if (courseData.category_id !== undefined && !courseData.category_id) {
                throw new Error('Category is required.');
            }
            if (courseData.instructor_id !== undefined && !courseData.instructor_id) {
                throw new Error('Instructor is required.');
            }
            if (!desc || desc.length < 10) {
                throw new Error('Course Description is required (minimum 10 characters).');
            }

            const effEnrStart = courseData.enrollment_start_date !== undefined ? courseData.enrollment_start_date : existing.enrollment_start_date;
            const effEnrDeadline = courseData.enrollment_deadline !== undefined ? courseData.enrollment_deadline : existing.enrollment_deadline;
            const effCourseStart = courseData.start_date !== undefined ? courseData.start_date : existing.start_date;
            const effCourseEnd = courseData.end_date !== undefined ? courseData.end_date : existing.end_date;

            // Date validations
            if (effEnrStart && effEnrDeadline) {
                if (new Date(effEnrDeadline) < new Date(effEnrStart)) {
                    throw new Error('Date Error: Enrollment Deadline cannot be before Enrollment Start Date.');
                }
            }
            if (effEnrDeadline && effCourseStart) {
                if (new Date(effCourseStart) < new Date(effEnrDeadline)) {
                    throw new Error('Date Error: Course Start Date cannot be before Enrollment Deadline.');
                }
            }
            if (effCourseStart && effCourseEnd) {
                if (new Date(effCourseEnd) < new Date(effCourseStart)) {
                    throw new Error('Date Error: Course End Date cannot be before Course Start Date.');
                }
            }

            const category = courseData.category_id 
                ? this.state.categories.find(cat => cat.id === Number(courseData.category_id)) 
                : null;
            const instructor = courseData.instructor_id 
                ? this.state.instructors.find(ins => ins.id === Number(courseData.instructor_id)) 
                : null;

            this.state.courses[idx] = {
                ...existing,
                ...courseData,
                id: Number(id),
                title: title,
                code: courseData.code !== undefined ? courseData.code : (existing.code || `CS-${String(id).padStart(3, '0')}`),
                short_description: courseData.short_description !== undefined ? courseData.short_description : (existing.short_description || ''),
                is_featured: courseData.is_featured !== undefined ? Number(courseData.is_featured) : (existing.is_featured || 0),
                order_num: courseData.order_num !== undefined ? Number(courseData.order_num) : (existing.order_num || 1),
                badge: courseData.badge !== undefined ? courseData.badge : (courseData.is_featured ? 'Popular' : existing.badge),
                description: desc,
                category_name: category ? category.name : existing.category_name,
                instructor_name: instructor ? instructor.name : existing.instructor_name,
                instructor_avatar: instructor ? (instructor.avatar_url || '') : existing.instructor_avatar,
                price: courseData.price !== undefined ? (!isNaN(Number(courseData.price)) ? Math.max(0, Number(courseData.price)) : 0.0) : existing.price,
                enrollment_start_date: effEnrStart,
                enrollment_deadline: effEnrDeadline,
                start_date: effCourseStart,
                end_date: effCourseEnd,
                is_published: courseData.is_published !== undefined ? Number(courseData.is_published) : existing.is_published
            };

            // If modules array was passed from the 6-step edit wizard
            if (Array.isArray(courseData.modules)) {
                this.setCourseModulesAndLessons(Number(id), courseData.modules);
            }

            this.syncCourseCounts(Number(id));
            this.saveState();
            return this.getCourseById(id);
        }

        duplicateCourse(id) {
            const original = this.getCourseById(id);
            if (!original) throw new Error('Course not found.');

            const nextId = this.state.courses.length > 0 
                ? Math.max(...this.state.courses.map(c => Number(c.id) || 0)) + 1 
                : 1;

            const cloned = {
                ...original,
                id: nextId,
                title: `${original.title} (Copy)`,
                slug: `${original.slug}-copy-${Date.now().toString().slice(-4)}`,
                is_published: 0, // starts as draft
                enrolled_students_count: 0
            };

            this.state.courses.unshift(cloned);

            // Duplicate chapters, lessons, quizzes, and assignments
            const origChapters = this.getChaptersByCourseId(id);
            for (const ch of origChapters) {
                const nextChId = this.state.chapters.length > 0 
                    ? Math.max(...this.state.chapters.map(c => Number(c.id) || 0)) + 1 
                    : 1;
                this.state.chapters.push({
                    ...ch,
                    id: nextChId,
                    course_id: nextId
                });

                const origLessons = this.getLessonsByModuleId(ch.id);
                for (const les of origLessons) {
                    const nextLesId = this.state.lessons.length > 0 
                        ? Math.max(...this.state.lessons.map(l => Number(l.id) || 0)) + 1 
                        : 1;
                    this.state.lessons.push({
                        ...les,
                        id: nextLesId,
                        module_id: nextChId,
                        course_id: nextId
                    });
                }

                const origQuizzes = this.getQuizzesByModuleId(ch.id);
                for (const q of origQuizzes) {
                    const nextQId = this.state.quizzes.length > 0
                        ? Math.max(...this.state.quizzes.map(item => Number(item.id) || 0)) + 1
                        : 1;
                    this.state.quizzes.push({
                        ...q,
                        id: nextQId,
                        module_id: nextChId,
                        course_id: nextId
                    });
                }

                const origAssignments = this.getAssignmentsByModuleId(ch.id);
                for (const a of origAssignments) {
                    const nextAId = this.state.assignments.length > 0
                        ? Math.max(...this.state.assignments.map(item => Number(item.id) || 0)) + 1
                        : 1;
                    this.state.assignments.push({
                        ...a,
                        id: nextAId,
                        module_id: nextChId,
                        course_id: nextId
                    });
                }
            }

            this.syncCourseCounts(nextId);
            this.saveState();
            return this.getCourseById(nextId);
        }

        archiveCourse(id) {
            const course = this.getCourseById(id);
            if (!course) throw new Error('Course not found.');
            course.is_archived = course.is_archived === 1 ? 0 : 1;
            this.saveState();
            return course;
        }

        deleteCourse(id) {
            const idx = this.state.courses.findIndex(c => c.id === Number(id));
            if (idx === -1) return false;
            this.state.courses.splice(idx, 1);
            
            // Remove associated enrollments, chapters, lessons, quizzes, and assignments
            this.state.enrollments = this.state.enrollments.filter(e => e.course_id !== Number(id));
            this.state.chapters = this.state.chapters.filter(ch => ch.course_id !== Number(id));
            if (this.state.lessons) {
                this.state.lessons = this.state.lessons.filter(l => l.course_id !== Number(id));
            }
            if (this.state.quizzes) {
                this.state.quizzes = this.state.quizzes.filter(q => q.course_id !== Number(id));
            }
            if (this.state.assignments) {
                this.state.assignments = this.state.assignments.filter(a => a.course_id !== Number(id));
            }

            this.saveState();
            return true;
        }

        toggleCoursePublish(id) {
            const course = this.getCourseById(id);
            if (!course) return null;
            course.is_published = course.is_published === 1 ? 0 : 1;
            this.saveState();
            return course;
        }

        // 5. Course Chapters / Modules & Lessons Management
        getChaptersByCourseId(courseId) {
            return this.state.chapters
                .filter(ch => ch.course_id === Number(courseId))
                .sort((a, b) => (Number(a.chapter_num) || 0) - (Number(b.chapter_num) || 0));
        }

        createChapter(chapterData) {
            const nextId = this.state.chapters.length > 0 
                ? Math.max(...this.state.chapters.map(ch => Number(ch.id) || 0)) + 1 
                : 1;

            const courseChapters = this.getChaptersByCourseId(chapterData.course_id);
            const chapterNum = Number(chapterData.chapter_num) || (courseChapters.length + 1);

            const newChapter = {
                id: nextId,
                course_id: Number(chapterData.course_id),
                chapter_num: chapterNum,
                title: (chapterData.title || `Module ${chapterNum}`).trim(),
                duration: (chapterData.duration || '2 Weeks').trim(),
                lesson_count: 0,
                description: (chapterData.description || '').trim(),
                status: chapterData.status || 'Published',
                quiz_count: Number(chapterData.quiz_count) || 0
            };

            this.state.chapters.push(newChapter);
            this.syncCourseCounts(chapterData.course_id);
            this.saveState();
            return newChapter;
        }

        createModule(moduleData) {
            return this.createChapter(moduleData);
        }

        updateChapter(id, chapterData) {
            const idx = this.state.chapters.findIndex(ch => ch.id === Number(id));
            if (idx === -1) return null;

            this.state.chapters[idx] = {
                ...this.state.chapters[idx],
                ...chapterData,
                id: Number(id),
                title: chapterData.title !== undefined ? String(chapterData.title).trim() : this.state.chapters[idx].title,
                duration: chapterData.duration !== undefined ? String(chapterData.duration).trim() : this.state.chapters[idx].duration,
                description: chapterData.description !== undefined ? String(chapterData.description).trim() : this.state.chapters[idx].description,
                status: chapterData.status !== undefined ? String(chapterData.status).trim() : (this.state.chapters[idx].status || 'Published'),
                chapter_num: chapterData.chapter_num !== undefined ? Number(chapterData.chapter_num) : this.state.chapters[idx].chapter_num
            };

            const courseId = this.state.chapters[idx].course_id;
            this.syncCourseCounts(courseId);
            this.saveState();
            return this.state.chapters[idx];
        }

        updateModule(id, moduleData) {
            return this.updateChapter(id, moduleData);
        }

        deleteChapter(id) {
            const chapter = this.state.chapters.find(ch => ch.id === Number(id));
            if (!chapter) return false;
            const courseId = chapter.course_id;

            this.state.chapters = this.state.chapters.filter(ch => ch.id !== Number(id));
            if (this.state.lessons) {
                this.state.lessons = this.state.lessons.filter(l => l.module_id !== Number(id));
            }

            this.syncCourseCounts(courseId);
            this.saveState();
            return true;
        }

        deleteModule(id) {
            return this.deleteChapter(id);
        }

        getModulesByCourseId(courseId) {
            return this.getChaptersByCourseId(courseId);
        }

        moveChapter(chapterId, direction) {
            const ch = this.state.chapters.find(c => c.id === Number(chapterId));
            if (!ch) return false;
            const courseChapters = this.getChaptersByCourseId(ch.course_id);
            const currentIndex = courseChapters.findIndex(c => c.id === Number(chapterId));
            if (currentIndex === -1) return false;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= courseChapters.length) return false;

            const targetChapter = courseChapters[targetIndex];
            const tempNum = ch.chapter_num || (currentIndex + 1);
            ch.chapter_num = targetChapter.chapter_num || (targetIndex + 1);
            targetChapter.chapter_num = tempNum;

            this.saveState();
            return true;
        }

        moveModule(moduleId, direction) {
            return this.moveChapter(moduleId, direction);
        }

        // 5b. Lesson CRUD & Hierarchy Management
        getLessonsByModuleId(moduleId) {
            if (!this.state.lessons) this.state.lessons = [];
            const lessons = this.state.lessons.filter(l => l.module_id === Number(moduleId));
            return lessons.sort((a, b) => (Number(a.order_num) || 0) - (Number(b.order_num) || 0));
        }

        getAllLessonsByCourseId(courseId) {
            const chapters = this.getChaptersByCourseId(courseId);
            const chapterIds = new Set(chapters.map(c => c.id));
            if (!this.state.lessons) this.state.lessons = [];
            return this.state.lessons.filter(l => chapterIds.has(Number(l.module_id)) || l.course_id === Number(courseId));
        }

        createLesson(lessonData) {
            if (!this.state.lessons) this.state.lessons = [];
            const nextId = this.state.lessons.length > 0 
                ? Math.max(...this.state.lessons.map(l => Number(l.id) || 0)) + 1 
                : 1;

            const moduleId = Number(lessonData.module_id);
            const ch = this.state.chapters.find(c => c.id === moduleId);
            const courseId = ch ? Number(ch.course_id) : (Number(lessonData.course_id) || 1);
            const existingLessons = this.state.lessons.filter(l => l.module_id === moduleId);
            const orderNum = Number(lessonData.order_num) || (existingLessons.length + 1);

            const newLesson = {
                id: nextId,
                module_id: moduleId,
                course_id: courseId,
                title: (lessonData.title || `Lesson ${orderNum}`).trim(),
                duration: (lessonData.duration || '45 Mins').trim(),
                description: (lessonData.description || lessonData.desc || '').trim(),
                order_num: orderNum,
                type: lessonData.type || 'Video',
                status: lessonData.status || 'Published',
                video_url: lessonData.video_url || '',
                video_size: lessonData.video_size || '',
                pdf_url: lessonData.pdf_url || '',
                pdf_size: lessonData.pdf_size || ''
            };

            this.state.lessons.push(newLesson);
            this.syncCourseCounts(courseId);
            this.saveState();
            return newLesson;
        }

        updateLesson(id, lessonData) {
            if (!this.state.lessons) this.state.lessons = [];
            const idx = this.state.lessons.findIndex(l => l.id === Number(id));
            if (idx === -1) return null;

            const existing = this.state.lessons[idx];
            this.state.lessons[idx] = {
                ...existing,
                ...lessonData,
                id: Number(id),
                title: lessonData.title !== undefined ? String(lessonData.title).trim() : existing.title,
                duration: lessonData.duration !== undefined ? String(lessonData.duration).trim() : existing.duration,
                description: lessonData.description !== undefined ? String(lessonData.description).trim() : (lessonData.desc !== undefined ? String(lessonData.desc).trim() : existing.description),
                order_num: lessonData.order_num !== undefined ? Number(lessonData.order_num) : existing.order_num,
                type: lessonData.type !== undefined ? lessonData.type : (existing.type || 'Video'),
                status: lessonData.status !== undefined ? lessonData.status : (existing.status || 'Published'),
                video_url: lessonData.video_url !== undefined ? lessonData.video_url : existing.video_url,
                pdf_url: lessonData.pdf_url !== undefined ? lessonData.pdf_url : existing.pdf_url
            };

            const courseId = existing.course_id;
            if (courseId) this.syncCourseCounts(courseId);
            this.saveState();
            return this.state.lessons[idx];
        }

        deleteLesson(id) {
            if (!this.state.lessons) return false;
            const lesson = this.state.lessons.find(l => l.id === Number(id));
            if (!lesson) return false;
            const courseId = lesson.course_id;

            this.state.lessons = this.state.lessons.filter(l => l.id !== Number(id));
            if (courseId) this.syncCourseCounts(courseId);
            this.saveState();
            return true;
        }

        moveLesson(lessonId, direction) {
            if (!this.state.lessons) return false;
            const lesson = this.state.lessons.find(l => l.id === Number(lessonId));
            if (!lesson) return false;
            const moduleLessons = this.getLessonsByModuleId(lesson.module_id);
            const currentIndex = moduleLessons.findIndex(l => l.id === Number(lessonId));
            if (currentIndex === -1) return false;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= moduleLessons.length) return false;

            const targetLesson = moduleLessons[targetIndex];
            const tempOrder = lesson.order_num || (currentIndex + 1);
            lesson.order_num = targetLesson.order_num || (targetIndex + 1);
            targetLesson.order_num = tempOrder;

            this.saveState();
            return true;
        }

        // Quiz CRUD within Modules & Courses
        getQuizzesByModuleId(moduleId) {
            if (!this.state.quizzes) this.state.quizzes = [];
            return this.state.quizzes.filter(q => q.module_id === Number(moduleId));
        }

        getAllQuizzesByCourseId(courseId) {
            const chapters = this.getChaptersByCourseId(courseId);
            const chapterIds = new Set(chapters.map(c => c.id));
            if (!this.state.quizzes) this.state.quizzes = [];
            return this.state.quizzes.filter(q => chapterIds.has(Number(q.module_id)) || q.course_id === Number(courseId));
        }

        createQuiz(quizData) {
            if (!this.state.quizzes) this.state.quizzes = [];
            const nextId = this.state.quizzes.length > 0 
                ? Math.max(...this.state.quizzes.map(q => Number(q.id) || 0)) + 1 
                : 1;

            const moduleId = Number(quizData.module_id);
            const ch = this.state.chapters.find(c => c.id === moduleId);
            const courseId = ch ? Number(ch.course_id) : (Number(quizData.course_id) || 1);

            const newQuiz = {
                id: nextId,
                module_id: moduleId,
                course_id: courseId,
                title: (quizData.title || `Quiz ${nextId}`).trim(),
                description: (quizData.description || '').trim(),
                duration_mins: Number(quizData.duration_mins) || Number(quizData.duration) || 20,
                passing_score: Number(quizData.passing_score) || 70,
                questions: Array.isArray(quizData.questions) ? quizData.questions : []
            };

            this.state.quizzes.push(newQuiz);
            this.syncCourseCounts(courseId);
            this.saveState();
            return newQuiz;
        }

        updateQuiz(id, quizData) {
            if (!this.state.quizzes) this.state.quizzes = [];
            const idx = this.state.quizzes.findIndex(q => q.id === Number(id));
            if (idx === -1) return null;

            const existing = this.state.quizzes[idx];
            this.state.quizzes[idx] = {
                ...existing,
                ...quizData,
                id: Number(id),
                title: quizData.title !== undefined ? String(quizData.title).trim() : existing.title,
                description: quizData.description !== undefined ? String(quizData.description).trim() : existing.description,
                duration_mins: quizData.duration_mins !== undefined ? Number(quizData.duration_mins) : (quizData.duration !== undefined ? Number(quizData.duration) : existing.duration_mins),
                passing_score: quizData.passing_score !== undefined ? Number(quizData.passing_score) : existing.passing_score,
                questions: Array.isArray(quizData.questions) ? quizData.questions : existing.questions
            };

            const courseId = existing.course_id;
            if (courseId) this.syncCourseCounts(courseId);
            this.saveState();
            return this.state.quizzes[idx];
        }

        deleteQuiz(id) {
            if (!this.state.quizzes) return false;
            const quiz = this.state.quizzes.find(q => q.id === Number(id));
            if (!quiz) return false;
            const courseId = quiz.course_id;
            this.state.quizzes = this.state.quizzes.filter(q => q.id !== Number(id));
            if (courseId) this.syncCourseCounts(courseId);
            this.saveState();
            return true;
        }

        // Assignment CRUD within Modules & Courses
        getAssignmentsByModuleId(moduleId) {
            if (!this.state.assignments) this.state.assignments = [];
            return this.state.assignments.filter(a => a.module_id === Number(moduleId));
        }

        getAllAssignmentsByCourseId(courseId) {
            const chapters = this.getChaptersByCourseId(courseId);
            const chapterIds = new Set(chapters.map(c => c.id));
            if (!this.state.assignments) this.state.assignments = [];
            return this.state.assignments.filter(a => chapterIds.has(Number(a.module_id)) || a.course_id === Number(courseId));
        }

        createAssignment(assignmentData) {
            if (!this.state.assignments) this.state.assignments = [];
            const nextId = this.state.assignments.length > 0 
                ? Math.max(...this.state.assignments.map(a => Number(a.id) || 0)) + 1 
                : 1;

            const moduleId = Number(assignmentData.module_id);
            const ch = this.state.chapters.find(c => c.id === moduleId);
            const courseId = ch ? Number(ch.course_id) : (Number(assignmentData.course_id) || 1);

            const newAssignment = {
                id: nextId,
                module_id: moduleId,
                course_id: courseId,
                title: (assignmentData.title || `Assignment ${nextId}`).trim(),
                instructions: (assignmentData.instructions || assignmentData.description || '').trim(),
                due_date: assignmentData.due_date || '',
                max_score: Number(assignmentData.max_score) || Number(assignmentData.points) || 100,
                attachment_name: assignmentData.attachment_name || assignmentData.attachment || '',
                attachment_size: assignmentData.attachment_size || ''
            };

            this.state.assignments.push(newAssignment);
            this.syncCourseCounts(courseId);
            this.saveState();
            return newAssignment;
        }

        updateAssignment(id, assignmentData) {
            if (!this.state.assignments) this.state.assignments = [];
            const idx = this.state.assignments.findIndex(a => a.id === Number(id));
            if (idx === -1) return null;

            const existing = this.state.assignments[idx];
            this.state.assignments[idx] = {
                ...existing,
                ...assignmentData,
                id: Number(id),
                title: assignmentData.title !== undefined ? String(assignmentData.title).trim() : existing.title,
                instructions: assignmentData.instructions !== undefined ? String(assignmentData.instructions).trim() : existing.instructions,
                due_date: assignmentData.due_date !== undefined ? assignmentData.due_date : existing.due_date,
                max_score: assignmentData.max_score !== undefined ? Number(assignmentData.max_score) : existing.max_score,
                attachment_name: assignmentData.attachment_name !== undefined ? assignmentData.attachment_name : existing.attachment_name,
                attachment_size: assignmentData.attachment_size !== undefined ? assignmentData.attachment_size : existing.attachment_size
            };

            const courseId = existing.course_id;
            if (courseId) this.syncCourseCounts(courseId);
            this.saveState();
            return this.state.assignments[idx];
        }

        deleteAssignment(id) {
            if (!this.state.assignments) return false;
            const assignment = this.state.assignments.find(a => a.id === Number(id));
            if (!assignment) return false;
            const courseId = assignment.course_id;
            this.state.assignments = this.state.assignments.filter(a => a.id !== Number(id));
            if (courseId) this.syncCourseCounts(courseId);
            this.saveState();
            return true;
        }

        reorderLessons(moduleId, lessonIds) {
            if (!this.state.lessons || !Array.isArray(lessonIds)) return;
            lessonIds.forEach((id, index) => {
                const lesson = this.state.lessons.find(l => l.id === Number(id));
                if (lesson && lesson.module_id === Number(moduleId)) {
                    lesson.order_num = index + 1;
                }
            });
            this.saveState();
        }

        reorderChapters(courseId, chapterIds) {
            if (!Array.isArray(chapterIds)) return;
            chapterIds.forEach((id, index) => {
                const ch = this.state.chapters.find(c => c.id === Number(id));
                if (ch && ch.course_id === Number(courseId)) {
                    ch.chapter_num = index + 1;
                }
            });
            this.saveState();
        }

        setCourseModulesAndLessons(courseId, modulesData) {
            if (!Array.isArray(modulesData)) return;
            const cId = Number(courseId);

            // Clean existing chapters, lessons, quizzes, and assignments for this course
            const oldChapters = this.getChaptersByCourseId(cId);
            const oldChapterIds = new Set(oldChapters.map(c => c.id));
            this.state.chapters = this.state.chapters.filter(ch => ch.course_id !== cId);
            if (!this.state.lessons) this.state.lessons = [];
            this.state.lessons = this.state.lessons.filter(l => !oldChapterIds.has(Number(l.module_id)) && l.course_id !== cId);
            if (!this.state.quizzes) this.state.quizzes = [];
            this.state.quizzes = this.state.quizzes.filter(q => !oldChapterIds.has(Number(q.module_id)) && q.course_id !== cId);
            if (!this.state.assignments) this.state.assignments = [];
            this.state.assignments = this.state.assignments.filter(a => !oldChapterIds.has(Number(a.module_id)) && a.course_id !== cId);

            // Insert new modules and their contents
            modulesData.forEach((mod, mIdx) => {
                const nextChId = this.state.chapters.length > 0 
                    ? Math.max(...this.state.chapters.map(c => Number(c.id) || 0)) + 1 
                    : (mIdx + 1);

                const newChapter = {
                    id: nextChId,
                    course_id: cId,
                    chapter_num: mIdx + 1,
                    title: (mod.title || `Module ${mIdx + 1}`).trim(),
                    duration: (mod.duration || '2 Weeks').trim(),
                    description: (mod.description || '').trim(),
                    lesson_count: Array.isArray(mod.lessons) ? mod.lessons.length : 0,
                    quiz_count: Array.isArray(mod.quizzes) ? mod.quizzes.length : 0,
                    assignment_count: Array.isArray(mod.assignments) ? mod.assignments.length : 0
                };
                this.state.chapters.push(newChapter);

                if (Array.isArray(mod.lessons)) {
                    mod.lessons.forEach((les, lIdx) => {
                        const nextLesId = this.state.lessons.length > 0 
                            ? Math.max(...this.state.lessons.map(l => Number(l.id) || 0)) + 1 
                            : (lIdx + 1);

                        const newLesson = {
                            id: nextLesId,
                            module_id: nextChId,
                            course_id: cId,
                            title: (les.title || `Lesson ${mIdx + 1}.${lIdx + 1}`).trim(),
                            duration: (les.duration || '45 Mins').trim(),
                            description: (les.description || les.desc || '').trim(),
                            order_num: lIdx + 1,
                            content_type: les.content_type || les.contentType || (les.video_url ? 'Video' : les.pdf_url ? 'Document' : 'Text'),
                            video_url: les.video_url || les.video || '',
                            video_size: les.video_size || les.videoSize || '',
                            pdf_url: les.pdf_url || les.pdf || '',
                            pdf_size: les.pdf_size || les.pdfSize || '',
                            text_content: les.text_content || les.content || ''
                        };
                        this.state.lessons.push(newLesson);
                    });
                }

                if (Array.isArray(mod.quizzes)) {
                    mod.quizzes.forEach((quiz, qIdx) => {
                        const nextQuizId = this.state.quizzes.length > 0 
                            ? Math.max(...this.state.quizzes.map(q => Number(q.id) || 0)) + 1 
                            : (qIdx + 1);

                        const newQuiz = {
                            id: nextQuizId,
                            module_id: nextChId,
                            course_id: cId,
                            title: (quiz.title || `Quiz ${mIdx + 1}.${qIdx + 1}`).trim(),
                            description: (quiz.description || '').trim(),
                            duration_mins: Number(quiz.duration_mins) || Number(quiz.duration) || 20,
                            passing_score: Number(quiz.passing_score) || 70,
                            questions: Array.isArray(quiz.questions) ? quiz.questions : []
                        };
                        this.state.quizzes.push(newQuiz);
                    });
                }

                if (Array.isArray(mod.assignments)) {
                    mod.assignments.forEach((assign, aIdx) => {
                        const nextAssignId = this.state.assignments.length > 0 
                            ? Math.max(...this.state.assignments.map(a => Number(a.id) || 0)) + 1 
                            : (aIdx + 1);

                        const newAssignment = {
                            id: nextAssignId,
                            module_id: nextChId,
                            course_id: cId,
                            title: (assign.title || `Assignment ${mIdx + 1}.${aIdx + 1}`).trim(),
                            instructions: (assign.instructions || assign.description || '').trim(),
                            due_date: assign.due_date || '',
                            max_score: Number(assign.max_score) || Number(assign.points) || 100,
                            attachment_name: assign.attachment_name || assign.attachment || '',
                            attachment_size: assign.attachment_size || ''
                        };
                        this.state.assignments.push(newAssignment);
                    });
                }
            });

            this.syncCourseCounts(cId);
            this.saveState();
        }

        syncCourseCounts(courseId) {
            const cId = Number(courseId);
            const chapters = this.getChaptersByCourseId(cId);
            let totalLessons = 0;
            let totalQuizzes = 0;
            let totalAssignments = 0;

            chapters.forEach(ch => {
                const chLessons = this.state.lessons ? this.state.lessons.filter(l => l.module_id === Number(ch.id)) : [];
                const chQuizzes = this.state.quizzes ? this.state.quizzes.filter(q => q.module_id === Number(ch.id)) : [];
                const chAssignments = this.state.assignments ? this.state.assignments.filter(a => a.module_id === Number(ch.id)) : [];
                ch.lesson_count = chLessons.length;
                ch.quiz_count = chQuizzes.length;
                ch.assignment_count = chAssignments.length;
                totalLessons += chLessons.length;
                totalQuizzes += chQuizzes.length;
                totalAssignments += chAssignments.length;
            });

            const course = this.state.courses.find(c => c.id === cId);
            if (course) {
                course.module_count = chapters.length;
                course.lesson_count = totalLessons;
                course.quiz_count = totalQuizzes;
                course.assignment_count = totalAssignments;
            }
            return { totalModules: chapters.length, totalLessons, totalQuizzes, totalAssignments };
        }

        // 6. Categories & Instructors CRUD
        getCategories() {
            return [...this.state.categories];
        }

        getCategoryById(id) {
            return this.state.categories.find(c => c.id === Number(id));
        }

        createCategory(catData) {
            const nextId = this.state.categories.length > 0 
                ? Math.max(...this.state.categories.map(c => Number(c.id) || 0)) + 1 
                : 1;

            const name = (catData.name || '').trim();
            if (!name) throw new Error('Category name is required.');

            const slug = catData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            if (this.state.categories.some(c => c.name.toLowerCase() === name.toLowerCase() || c.slug === slug)) {
                throw new Error('A category with this name or slug already exists.');
            }

            const newCategory = {
                id: nextId,
                name: name,
                slug: slug,
                icon: catData.icon || 'bi-tags',
                order_num: Number(catData.order_num) || nextId,
                color: catData.color || '#2563EB',
                status: catData.status || 'Active'
            };

            this.state.categories.push(newCategory);
            this.saveState();
            return newCategory;
        }

        updateCategory(id, catData) {
            const idx = this.state.categories.findIndex(c => c.id === Number(id));
            if (idx === -1) return null;

            const name = (catData.name || this.state.categories[idx].name || '').trim();
            if (!name) throw new Error('Category name is required.');

            const slug = catData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            if (this.state.categories.some(c => c.id !== Number(id) && (c.name.toLowerCase() === name.toLowerCase() || c.slug === slug))) {
                throw new Error('Another category with this name or slug already exists.');
            }

            this.state.categories[idx] = {
                ...this.state.categories[idx],
                ...catData,
                name,
                slug,
                id: Number(id)
            };

            this.saveState();
            return this.state.categories[idx];
        }

        deleteCategory(id) {
            const assignedCourses = this.state.courses.filter(c => c.category_id === Number(id));
            if (assignedCourses.length > 0) {
                throw new Error(`Cannot delete category: assigned to ${assignedCourses.length} course(s). Please reassign courses to another category first.`);
            }
            this.state.categories = this.state.categories.filter(c => c.id !== Number(id));
            this.saveState();
            return true;
        }

        getInstructors() {
            const teacherUsers = (this.state.users || []).filter(u => u.role === 'TEACHER');
            
            const list = this.state.instructors.map(ins => {
                const matchedUser = teacherUsers.find(u => 
                    (ins.user_id && u.id === ins.user_id) || 
                    (u.email && ins.email && u.email.toLowerCase() === ins.email.toLowerCase()) ||
                    (u.full_name && ins.name && u.full_name.toLowerCase() === ins.name.toLowerCase())
                );
                if (matchedUser) {
                    return {
                        ...ins,
                        user_id: matchedUser.id,
                        name: matchedUser.full_name,
                        email: matchedUser.email,
                        avatar_url: matchedUser.avatar_url || ins.avatar_url,
                        university_id: matchedUser.university_id,
                        status: matchedUser.status || ins.status || 'Active'
                    };
                }
                return ins;
            });

            return list;
        }

        getInstructorById(id) {
            return this.getInstructors().find(i => i.id === Number(id));
        }

        createInstructor(insData) {
            const name = (insData.name || '').trim();
            if (!name || name.length < 2) throw new Error('Instructor Name is required (minimum 2 characters).');

            if (insData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(insData.email)) {
                    throw new Error('Please provide a valid email address.');
                }
            }

            let matchedUser = null;
            if (insData.user_id) {
                matchedUser = this.getUserById(insData.user_id);
            } else if (insData.email) {
                matchedUser = this.state.users.find(u => u.email && u.email.toLowerCase() === insData.email.toLowerCase());
            }

            if (!matchedUser) {
                matchedUser = this.createUser({
                    full_name: name,
                    email: insData.email || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@aub.edu.kh`,
                    role: 'TEACHER',
                    role_id: 2,
                    status: insData.status || 'Active',
                    faculty: insData.faculty || insData.department || 'Information Technology',
                    avatar_url: insData.avatar_url,
                    phone: insData.phone || ''
                });
            }

            const nextId = this.state.instructors.length > 0 
                ? Math.max(...this.state.instructors.map(i => Number(i.id) || 0)) + 1 
                : 1;

            const newInstructor = {
                id: nextId,
                user_id: matchedUser.id,
                name: matchedUser.full_name,
                title: insData.title || 'Lecturer',
                email: matchedUser.email,
                phone: insData.phone || '',
                expertise: insData.expertise || 'Computer Science & Technology',
                department: insData.department || insData.faculty || 'Information Technology',
                faculty: insData.faculty || insData.department || 'Information Technology',
                bio: insData.bio || '',
                avatar_url: matchedUser.avatar_url || insData.avatar_url,
                status: insData.status || 'Active'
            };

            this.state.instructors.push(newInstructor);
            this.saveState();
            return newInstructor;
        }

        updateInstructor(id, insData) {
            const idx = this.state.instructors.findIndex(i => i.id === Number(id));
            if (idx === -1) return null;

            if (insData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(insData.email)) {
                    throw new Error('Please provide a valid email address.');
                }
            }

            this.state.instructors[idx] = {
                ...this.state.instructors[idx],
                ...insData,
                id: Number(id)
            };

            if (this.state.instructors[idx].user_id) {
                this.updateUser(this.state.instructors[idx].user_id, {
                    full_name: insData.name || this.state.instructors[idx].name,
                    email: insData.email || this.state.instructors[idx].email,
                    phone: insData.phone !== undefined ? insData.phone : this.state.instructors[idx].phone,
                    status: insData.status || this.state.instructors[idx].status
                });
            }

            this.saveState();
            return this.state.instructors[idx];
        }

        deleteInstructor(id) {
            const assignedCourses = this.state.courses.filter(c => c.instructor_id === Number(id));
            if (assignedCourses.length > 0) {
                throw new Error(`This instructor is assigned to ${assignedCourses.length} course(s). Please reassign these courses before deleting.`);
            }
            this.state.instructors = this.state.instructors.filter(i => i.id !== Number(id));
            this.saveState();
            return true;
        }

        // 7. Enrollment & Payment Management CRUD
        getEnrollments() {
            return [...this.state.enrollments];
        }

        getPayments(filters = {}) {
            let list = [...(this.state.payments || [])];
            if (filters.status && filters.status !== 'all') {
                list = list.filter(p => p.payment_status === filters.status);
            }
            return list.sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0));
        }

        getPaymentStats() {
            const list = this.state.payments || [];
            const paidItems = list.filter(p => p.payment_status === 'Paid');
            const pendingItems = list.filter(p => p.payment_status === 'Pending');
            const refundedItems = list.filter(p => p.payment_status === 'Refunded');

            const totalRevenue = paidItems.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const refundedTotal = refundedItems.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            return {
                totalRevenue,
                paidCount: paidItems.length,
                pendingCount: pendingItems.length,
                refundedTotal,
                refundedCount: refundedItems.length
            };
        }

        createPayment(paymentData) {
            const nextId = (this.state.payments && this.state.payments.length > 0)
                ? Math.max(...this.state.payments.map(p => Number(p.id) || 0)) + 1
                : 1;

            const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const invNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

            const student = this.getUserById(paymentData.user_id);
            const course = this.getCourseById(paymentData.course_id);

            const newPayment = {
                id: nextId,
                transaction_id: txnId,
                enrollment_id: paymentData.enrollment_id || null,
                user_id: Number(paymentData.user_id),
                student_name: student ? student.full_name : (paymentData.student_name || 'Student'),
                student_uni_id: student ? student.university_id : '0001000',
                student_email: student ? student.email : 'student@aub.edu.kh',
                student_avatar: student ? student.avatar_url : '',
                course_id: Number(paymentData.course_id),
                course_title: course ? course.title : 'Academic Course',
                amount: Number(paymentData.amount) || 0.0,
                payment_method: paymentData.payment_method || 'ABA PAY',
                payment_status: paymentData.payment_status || 'Paid',
                invoice_number: invNum,
                payment_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
                notes: paymentData.notes || ''
            };

            if (!this.state.payments) this.state.payments = [];
            this.state.payments.unshift(newPayment);

            if (paymentData.enrollment_id) {
                const enr = this.state.enrollments.find(e => e.id === Number(paymentData.enrollment_id));
                if (enr) {
                    enr.payment_status = newPayment.payment_status;
                }
            }

            this.saveState();
            return newPayment;
        }

        refundPayment(id) {
            const payment = (this.state.payments || []).find(p => p.id === Number(id));
            if (!payment) throw new Error('Payment not found.');

            payment.payment_status = 'Refunded';

            if (payment.enrollment_id) {
                const enr = this.state.enrollments.find(e => e.id === Number(payment.enrollment_id));
                if (enr) {
                    enr.payment_status = 'Refunded';
                    enr.status = 'Cancelled';
                }
            }

            this.saveState();
            return payment;
        }

        enrollInCourse(courseId, userId, paymentMethod = 'ABA PAY') {
            const course = this.getCourseById(courseId);
            if (!course) throw new Error('Course not found.');

            // Deadline check: do NOT allow enrollment after enrollment deadline!
            const today = new Date().toISOString().split('T')[0];
            if (course.enrollment_deadline && today > course.enrollment_deadline) {
                throw new Error(`Enrollment is closed for this course. The deadline was ${course.enrollment_deadline}.`);
            }

            const exists = this.state.enrollments.some(e => e.student_id === Number(userId) && e.course_id === Number(courseId));
            if (exists) {
                throw new Error('You are already enrolled in this course.');
            }

            const student = this.getUserById(userId);
            const nextEnrId = this.state.enrollments.length > 0 
                ? Math.max(...this.state.enrollments.map(e => Number(e.id) || 0)) + 1 
                : 101;

            const isFree = !course.price || Number(course.price) === 0;

            const newEnrollment = {
                id: nextEnrId,
                student_id: Number(userId),
                student_name: student ? student.full_name : 'Student',
                student_uni_id: student ? student.university_id : '202401234',
                student_email: student ? student.email : 'student@aub.edu.kh',
                student_avatar: student ? student.avatar_url : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                course_id: Number(courseId),
                course_title: course.title,
                major: student ? (student.major || 'Computer Science & Software Engineering') : 'Computer Science & Software Engineering',
                enrollment_date: today,
                progress_percentage: 0,
                status: 'Active',
                payment_status: 'Paid'
            };

            this.state.enrollments.unshift(newEnrollment);

            // Record transaction
            const nextPayId = (this.state.payments && this.state.payments.length > 0)
                ? Math.max(...this.state.payments.map(p => Number(p.id) || 0)) + 1
                : 1;

            const txnId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const invNum = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

            const newPayment = {
                id: nextPayId,
                transaction_id: txnId,
                enrollment_id: nextEnrId,
                user_id: Number(userId),
                student_name: newEnrollment.student_name,
                student_uni_id: newEnrollment.student_uni_id,
                student_email: newEnrollment.student_email,
                student_avatar: newEnrollment.student_avatar,
                course_id: Number(courseId),
                course_title: course.title,
                amount: Number(course.price) || 0.0,
                payment_method: isFree ? 'Free Enrollment' : paymentMethod,
                payment_status: 'Paid',
                invoice_number: invNum,
                payment_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
                notes: isFree ? 'Complimentary Academic Course' : 'Standard Course Enrollment Fee'
            };

            if (!this.state.payments) this.state.payments = [];
            this.state.payments.unshift(newPayment);

            course.enrolled_students_count = this.state.enrollments.filter(e => e.course_id === course.id).length;

            this.saveState();
            return {
                enrollment: newEnrollment,
                payment: newPayment
            };
        }

        createEnrollment(enrData) {
            const studentId = Number(enrData.student_id);
            const courseId = Number(enrData.course_id);

            const course = this.getCourseById(courseId);
            if (course && course.enrollment_deadline) {
                const today = new Date().toISOString().split('T')[0];
                const deadline = String(course.enrollment_deadline).split('T')[0];
                if (today > deadline) {
                    throw new Error(`Cannot enroll student: The enrollment deadline for "${course.title}" expired on ${deadline}.`);
                }
            }

            // Unique student-course check
            const exists = this.state.enrollments.some(e => e.student_id === studentId && e.course_id === courseId);
            if (exists) {
                throw new Error('This student is already enrolled in this course.');
            }

            const nextId = this.state.enrollments.length > 0 
                ? Math.max(...this.state.enrollments.map(e => Number(e.id) || 0)) + 1 
                : 101;

            const student = this.getUserById(studentId);

            const newEnrollment = {
                id: nextId,
                student_id: studentId,
                student_name: student ? student.full_name : (enrData.student_name || 'Enrolled Student'),
                student_uni_id: student ? student.university_id : '0001000',
                student_email: student ? student.email : 'student@aub.edu.kh',
                student_avatar: student ? student.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                course_id: courseId,
                course_title: course ? course.title : (enrData.course_title || 'Academic Course'),
                major: student ? (student.major || 'Computer Science & Software Engineering') : 'Computer Science & Software Engineering',
                enrollment_date: enrData.enrollment_date || new Date().toISOString().slice(0, 10),
                progress_percentage: Number(enrData.progress_percentage) || 0,
                status: enrData.status || 'Active'
            };

            this.state.enrollments.unshift(newEnrollment);

            if (course) {
                course.enrolled_students_count = this.state.enrollments.filter(e => e.course_id === course.id).length;
            }

            this.saveState();
            return newEnrollment;
        }

        updateEnrollment(id, enrData) {
            const idx = this.state.enrollments.findIndex(e => e.id === Number(id));
            if (idx === -1) return null;

            const oldCourseId = this.state.enrollments[idx].course_id;

            if (enrData.course_id && Number(enrData.course_id) !== Number(oldCourseId)) {
                const newCourse = this.getCourseById(enrData.course_id);
                if (newCourse) {
                    enrData.course_title = newCourse.title;
                }
            }

            this.state.enrollments[idx] = {
                ...this.state.enrollments[idx],
                ...enrData,
                id: Number(id)
            };

            // Sync counts for old & new courses
            if (oldCourseId) {
                const oldCourse = this.getCourseById(oldCourseId);
                if (oldCourse) oldCourse.enrolled_students_count = this.state.enrollments.filter(e => Number(e.course_id) === Number(oldCourseId)).length;
            }
            if (enrData.course_id && Number(enrData.course_id) !== Number(oldCourseId)) {
                const newCourse = this.getCourseById(enrData.course_id);
                if (newCourse) newCourse.enrolled_students_count = this.state.enrollments.filter(e => Number(e.course_id) === Number(enrData.course_id)).length;
            }

            this.saveState();
            return this.state.enrollments[idx];
        }

        deleteEnrollment(id) {
            const idx = this.state.enrollments.findIndex(e => e.id === Number(id));
            if (idx === -1) return false;
            const courseId = this.state.enrollments[idx].course_id;
            this.state.enrollments.splice(idx, 1);

            const course = this.getCourseById(courseId);
            if (course) {
                course.enrolled_students_count = this.state.enrollments.filter(e => e.course_id === course.id).length;
            }

            this.saveState();
            return true;
        }

        // 8. Notifications & Global Search
        getNotifications() {
            return [...this.state.notifications];
        }

        markAllNotificationsRead() {
            this.state.notifications.forEach(n => { n.read = true; });
            this.saveState();
            return this.state.notifications;
        }

        searchGlobal(query) {
            if (!query || query.trim().length < 2) {
                return { programs: [], courses: [], users: [], categories: [] };
            }

            const q = query.toLowerCase().trim();

            const matchedPrograms = this.state.programs.filter(p => 
                p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
            ).map(p => ({
                id: p.id,
                title: p.title,
                degree_type: p.degree_type,
                link: 'academic-management.html'
            }));

            const matchedCourses = this.state.courses.filter(c => 
                c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || (c.category_name && c.category_name.toLowerCase().includes(q))
            ).map(c => ({
                id: c.id,
                title: c.title,
                rating: c.rating,
                link: 'academic-management.html'
            }));

            const matchedUsers = this.state.users.filter(u => 
                u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.university_id && u.university_id.toLowerCase().includes(q))
            ).map(u => ({
                id: u.id,
                title: u.full_name,
                role: u.role,
                link: 'user-management.html'
            }));

            return {
                programs: matchedPrograms,
                courses: matchedCourses,
                users: matchedUsers,
                categories: []
            };
        }

        // 9. Settings & Admin Profile
        getSettings() {
            return { ...this.state.settings };
        }

        updateSettings(newSettings) {
            this.state.settings = { ...this.state.settings, ...newSettings };
            this.saveState();
            return this.state.settings;
        }

        getAdminUser() {
            return this.state.users.find(u => u.role === 'ADMIN') || this.state.users[0];
        }

        updateAdminProfile(adminData) {
            const admin = this.getAdminUser();
            if (admin) {
                Object.assign(admin, adminData);
                this.saveState();
                localStorage.setItem('aub_user', JSON.stringify(admin));
            }
            return admin;
        }

        // 10. Dashboard Dynamic Calculations & Statistics
        getDashboardMetrics() {
            const students = (this.state.users || []).filter(u => (u.role || '').toUpperCase() === 'STUDENT');
            const teachers = (this.state.users || []).filter(u => (u.role || '').toUpperCase() === 'TEACHER');
            const admins = (this.state.users || []).filter(u => ['ADMIN', 'SUPER_ADMIN'].includes((u.role || '').toUpperCase()));
            const courses = this.state.courses || [];
            const activeCourses = courses.filter(c => c.is_published === 1 && !c.is_archived);
            const enrollments = this.state.enrollments || [];
            const payments = this.state.payments || [];
            const exams = this.state.exams || [];

            const paidPayments = payments.filter(p => p.payment_status === 'Paid');
            const pendingPayments = payments.filter(p => p.payment_status === 'Pending');
            const totalPaidRevenue = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 1450.00;
            const pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 120.00;

            return {
                totalUsers: (this.state.users || []).length,
                totalStudents: students.length || 5,
                totalTeachers: teachers.length || 5,
                totalAdmins: admins.length || 1,
                totalCourses: courses.length || 5,
                activeCourses: activeCourses.length || 5,
                totalEnrollments: enrollments.length || 5,
                pendingEnrollments: enrollments.filter(e => (e.status || '').toLowerCase() === 'pending').length || 0,
                pendingPayments: pendingPayments.length || 1,
                upcomingExams: exams.length || 3,
                completedCourses: courses.filter(c => c.is_published === 1).length,
                pendingResults: 1,
                totalPaidRevenue,
                paidInvoiceCount: paidPayments.length || 4,
                pendingPaymentsAmount,
                outstandingInvoices: pendingPayments.length || 1,
                totalGrossVolume: totalPaidRevenue + pendingPaymentsAmount
            };
        }

        getDashboardStats(enrollmentTf = 'all_time', majorTf = 'all_time') {
            const students = (this.state.users || []).filter(u => (u.role || '').toUpperCase() === 'STUDENT');
            const totalStudents = students.length || 5;

            // Compute Major Distribution dynamically
            const majorCounts = {};
            const defaultColors = {
                'Computer Science': '#2563EB',
                'Software Engineering': '#0891B2',
                'Data Science': '#D97706',
                'Cybersecurity': '#16A34A',
                'Artificial Intelligence': '#7C3AED',
                'Business Information Technology': '#4F46E5'
            };
            const fallbackColors = ['#2563EB', '#0891B2', '#D97706', '#16A34A', '#7C3AED', '#4F46E5'];

            students.forEach(s => {
                const major = s.major || 'Computer Science';
                majorCounts[major] = (majorCounts[major] || 0) + 1;
            });

            const majors = Object.keys(majorCounts).map((major, idx) => {
                const count = majorCounts[major];
                const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                return {
                    major,
                    count,
                    percentage,
                    color: defaultColors[major] || fallbackColors[idx % fallbackColors.length]
                };
            }).sort((a, b) => b.count - a.count);

            // Compute Categories Breakdown dynamically
            const enrollments = this.state.enrollments || [];
            const catCounts = {};
            enrollments.forEach(e => {
                const cat = e.major || 'Computer Science';
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            });

            const totalEnrollments = enrollments.length || 5;
            const categories = Object.keys(catCounts).map((name, idx) => ({
                name,
                count: catCounts[name],
                percentage: totalEnrollments > 0 ? Math.round((catCounts[name] / totalEnrollments) * 100) : 0,
                color: defaultColors[name] || fallbackColors[idx % fallbackColors.length]
            }));

            // Monthly Trends
            const enrollmentTrends = {
                months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                enrollments: [3, 5, 7, 8, 10, 12],
                examResults: [2, 3, 5, 6, 8, 10]
            };

            return {
                enrollmentTimeframe: enrollmentTf,
                majorTimeframe: majorTf,
                enrollmentStatistics: {
                    total: totalEnrollments,
                    categories
                },
                studentsByMajor: {
                    total: totalStudents,
                    majors
                },
                enrollmentTrends
            };
        }

        getRecentEnrollments(limit = 5) {
            const list = (this.state.enrollments || []).slice(0, limit);
            return list.map(e => {
                const student = this.getUserById(e.student_id);
                return {
                    ...e,
                    student_name: e.student_name || (student ? student.full_name : 'Student'),
                    student_id: e.student_uni_id || (student ? student.university_id : 'STU-2026-001'),
                    student_email: e.student_email || (student ? student.email : 'student@example.com'),
                    student_avatar: e.student_avatar || (student ? student.avatar_url : ''),
                    course_title: e.course_title || 'Academic Course',
                    progress_percentage: Number(e.progress_percentage || 0),
                    status: e.status || 'Active'
                };
            });
        }

        getUpcomingExams(limit = 5) {
            if (this.state.exams && this.state.exams.length > 0) {
                return this.state.exams.slice(0, limit);
            }
            return [
                { id: 1, course_id: 1, course_title: 'Web Development', title: 'Web Development', exam_date: '2026-08-28', date: 'Aug 28, 2026', time: '09:00 AM', duration: '60 mins', students_count: 5, students: 5, status: 'Scheduled' },
                { id: 2, course_id: 3, course_title: 'Database Management', title: 'Database Management', exam_date: '2026-08-30', date: 'Aug 30, 2026', time: '10:00 AM', duration: '90 mins', students_count: 4, students: 4, status: 'Scheduled' },
                { id: 3, course_id: 5, course_title: 'Software Engineering', title: 'Software Engineering', exam_date: '2026-09-02', date: 'Sep 2, 2026', time: '01:30 PM', duration: '120 mins', students_count: 5, students: 5, status: 'Scheduled' }
            ].slice(0, limit);
        }

        getRecentActivity(limit = 5) {
            return (this.state.audit_logs || []).slice(0, limit);
        }
    }

    const storeInstance = new AdminMockStore();
    global.AdminStore = storeInstance;
    if (typeof window !== 'undefined') window.AdminStore = storeInstance;
})(typeof window !== 'undefined' ? window : global);
