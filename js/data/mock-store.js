// ==========================================================================
// AUB Digital Academy - Centralized Admin Mock Data Store & State Manager
// Complete Offline-First & Hybrid API Mock Store with LocalStorage Persistence
// ==========================================================================

(function (global) {
    'use strict';

    const STORAGE_KEY = 'aub_admin_mock_store_v3';

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
                full_name: 'Sok Virak',
                email: 'sok.virak@student.aub.edu.kh',
                university_id: '202401234',
                role: 'STUDENT',
                role_id: 3,
                major_id: 1,
                major: 'Computer Science & Software Engineering',
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
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                created_at: '2026-01-10T10:15:00.000Z'
            },
            {
                id: 3,
                full_name: 'Chanthou Meas',
                email: 'chanthou.meas@student.aub.edu.kh',
                university_id: '202401235',
                role: 'STUDENT',
                role_id: 3,
                major_id: 1,
                major: 'Computer Science & Software Engineering',
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
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
                created_at: '2026-02-01T14:20:00.000Z'
            },
            {
                id: 4,
                full_name: 'Dara Keo',
                email: 'dara.keo@student.aub.edu.kh',
                university_id: '202401236',
                role: 'STUDENT',
                role_id: 3,
                major_id: 3,
                major: 'Cybersecurity & Information Defense',
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
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
                created_at: '2026-02-18T09:45:00.000Z'
            },
            {
                id: 5,
                full_name: 'Kanha Rath',
                email: 'kanha.rath@student.aub.edu.kh',
                university_id: '202401237',
                role: 'STUDENT',
                role_id: 3,
                major_id: 2,
                major: 'Artificial Intelligence & Machine Learning',
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
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
                created_at: '2026-03-05T11:00:00.000Z'
            },
            {
                id: 6,
                full_name: 'Vibol Pen',
                email: 'vibol.pen@student.aub.edu.kh',
                university_id: '202401238',
                role: 'STUDENT',
                role_id: 3,
                major_id: 5,
                major: 'Business Information Technology',
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
                status: 'Inactive',
                avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150',
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
                title: 'Computer Science & Software Engineering',
                slug: 'computer-science-software-engineering',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-laptop',
                theme_class: 'theme-blue',
                description: 'Comprehensive 4-year undergraduate curriculum covering modern computing foundations, distributed architecture, and software design principles.',
                detail_url: '#',
                order_num: 1,
                is_published: 1
            },
            {
                id: 2,
                title: 'Artificial Intelligence & Machine Learning',
                slug: 'artificial-intelligence-machine-learning',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-cpu',
                theme_class: 'theme-purple',
                description: 'Rigorous engineering program focusing on modern generative AI, neural networks, natural language processing, and computer vision.',
                detail_url: '#',
                order_num: 2,
                is_published: 1
            },
            {
                id: 3,
                title: 'Cybersecurity & Information Defense',
                slug: 'cybersecurity-information-defense',
                degree_type: 'BACHELOR DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '4 Years',
                icon_class: 'bi-shield-check',
                theme_class: 'theme-green',
                description: 'Hands-on offensive & defensive security curriculum covering cloud vulnerability defense, penetration testing, and digital forensics.',
                detail_url: '#',
                order_num: 3,
                is_published: 1
            },
            {
                id: 4,
                title: 'Data Science & Predictive Analytics',
                slug: 'data-science-predictive-analytics',
                degree_type: 'MASTER DEGREE',
                faculty: 'Information Technology Faculty',
                duration: '2 Years',
                icon_class: 'bi-graph-up',
                theme_class: 'theme-cyan',
                description: 'Postgraduate curriculum in big data pipelines, statistical modeling, machine learning at scale, and business intelligence solutions.',
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
                theme_class: 'theme-gold',
                description: 'Blending technology leadership with financial strategy, enterprise ERP systems, and modern digital commerce solutions.',
                detail_url: '#',
                order_num: 5,
                is_published: 1
            }
        ],
        courses: [
            {
                id: 1,
                title: 'Full-Stack Modern Web Architecture',
                slug: 'full-stack-modern-web-architecture',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 2,
                instructor_name: 'Prof. Alex Chen',
                difficulty: 'Intermediate',
                duration: '12 Weeks',
                lesson_count: 6,
                rating: 4.9,
                enrolled_students_count: 2,
                badge: 'Popular',
                description: 'Master frontend engineering with modern component architectures, reactive state management, asynchronous REST APIs, and containerized deployment.',
                thumbnail_url: 'assets/images/course_webdev.jpg',
                is_published: 1
            },
            {
                id: 2,
                title: 'Applied Programming & Algorithms',
                slug: 'applied-programming-algorithms',
                category_id: 1,
                category_name: 'Computer Science',
                instructor_id: 1,
                instructor_name: 'Dr. Sarah Johnson',
                difficulty: 'Beginner',
                duration: '8 Weeks',
                lesson_count: 5,
                rating: 4.8,
                enrolled_students_count: 2,
                badge: 'Core Subject',
                description: 'Fundamental algorithmic techniques, asymptotic analysis, graph algorithms, dynamic programming, and computational complexity theory.',
                thumbnail_url: 'assets/images/digital_learning_graphic.jpg',
                is_published: 1
            },
            {
                id: 3,
                title: 'Database Systems & Cloud Architecture',
                slug: 'database-systems-cloud-architecture',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 2,
                instructor_name: 'Prof. Alex Chen',
                difficulty: 'Intermediate',
                duration: '10 Weeks',
                lesson_count: 5,
                rating: 4.85,
                enrolled_students_count: 0,
                badge: 'Essential',
                description: 'Relational data modeling, SQL optimization, query indexing, transactions, and distributed cloud database deployments.',
                thumbnail_url: 'assets/images/course_datascience.jpg',
                is_published: 1
            },
            {
                id: 4,
                title: 'Cybersecurity Fundamentals & Network Defense',
                slug: 'cybersecurity-fundamentals-network-defense',
                category_id: 4,
                category_name: 'Cybersecurity',
                instructor_id: 5,
                instructor_name: 'Dr. Sokha Chan',
                difficulty: 'Intermediate',
                duration: '10 Weeks',
                lesson_count: 5,
                rating: 4.9,
                enrolled_students_count: 2,
                badge: 'Security',
                description: 'Enterprise zero-trust architecture, identity and access management, cryptography, network firewalls, and incident response.',
                thumbnail_url: 'assets/images/course_cybersecurity.jpg',
                is_published: 1
            },
            {
                id: 5,
                title: 'Artificial Intelligence & Machine Learning',
                slug: 'artificial-intelligence-machine-learning',
                category_id: 3,
                category_name: 'Artificial Intelligence',
                instructor_id: 3,
                instructor_name: 'Dr. Michael Chang',
                difficulty: 'Advanced',
                duration: '14 Weeks',
                lesson_count: 5,
                rating: 4.95,
                enrolled_students_count: 1,
                badge: 'Featured',
                description: 'Supervised and unsupervised learning, deep neural networks, convolutional networks, transformers, and deployment pipelines.',
                thumbnail_url: 'assets/images/hero_digital_learning.jpg',
                is_published: 1
            },
            {
                id: 6,
                title: 'Data Science & Analytics',
                slug: 'data-science-analytics',
                category_id: 5,
                category_name: 'Data Science & Analytics',
                instructor_id: 3,
                instructor_name: 'Dr. Michael Chang',
                difficulty: 'Intermediate',
                duration: '10 Weeks',
                lesson_count: 4,
                rating: 4.75,
                enrolled_students_count: 0,
                badge: 'Recommended',
                description: 'Data wrangling with Python, exploratory data analysis, statistical modeling, and interactive executive dashboards.',
                thumbnail_url: 'assets/images/course_datascience.jpg',
                is_published: 1
            }
        ],
        chapters: [
            // Course 1
            { id: 1, course_id: 1, chapter_num: 1, title: 'Introduction to Web Standards & Modern JavaScript', duration: '2 Hours', lesson_count: 4, description: 'Foundations of semantic HTML5, CSS layout trees, and the event-driven JavaScript browser runtime.', quiz_count: 1 },
            { id: 2, course_id: 1, chapter_num: 2, title: 'HTML5 Semantic Layouts & Advanced Responsive CSS', duration: '3 Hours', lesson_count: 4, description: 'CSS Grid, Flexbox layouts, responsive design tokens, and CSS variables.', quiz_count: 1 },
            { id: 3, course_id: 1, chapter_num: 3, title: 'React Component Architecture & State Management', duration: '3.5 Hours', lesson_count: 4, description: 'Breaking down interfaces into atomic components, handling one-way state transitions, and hooks.', quiz_count: 1 },
            { id: 4, course_id: 1, chapter_num: 4, title: 'Node.js REST API Design & Express Middleware', duration: '3 Hours', lesson_count: 4, description: 'Asynchronous fetch pipelines, token headers, interceptors, optimistic updates, and REST endpoints.', quiz_count: 1 },
            { id: 5, course_id: 1, chapter_num: 5, title: 'Database Systems & SQL Modeling with SQLite', duration: '2.5 Hours', lesson_count: 4, description: 'Relational data modeling, indexing, ACID transactions, and foreign key relationships.', quiz_count: 1 },
            { id: 6, course_id: 1, chapter_num: 6, title: 'Production Deployment, CI/CD & Containerization', duration: '2.5 Hours', lesson_count: 4, description: 'Code bundling, static caching headers, Docker containerization, and automated deployment.', quiz_count: 1 },

            // Course 2
            { id: 7, course_id: 2, chapter_num: 1, title: 'Introduction to Algorithmic Complexity (Big-O)', duration: '2 Hours', lesson_count: 4, description: 'Asymptotic analysis, time and space complexity, recurrence relations.', quiz_count: 1 },
            { id: 8, course_id: 2, chapter_num: 2, title: 'Linear Data Structures: Arrays, Lists, Stacks, Queues', duration: '3 Hours', lesson_count: 4, description: 'Implementation and operations on linear data collections.', quiz_count: 1 },
            { id: 9, course_id: 2, chapter_num: 3, title: 'Trees, Heaps & Priority Queues', duration: '3.5 Hours', lesson_count: 4, description: 'Binary search trees, AVL balancing, and binary heaps.', quiz_count: 1 },
            { id: 10, course_id: 2, chapter_num: 4, title: 'Graph Traversal: BFS, DFS & Shortest Path', duration: '3 Hours', lesson_count: 4, description: 'Graph representations, breadth-first search, depth-first search, Dijkstra algorithm.', quiz_count: 1 },
            { id: 11, course_id: 2, chapter_num: 5, title: 'Dynamic Programming & Greedy Approaches', duration: '3.5 Hours', lesson_count: 4, description: 'Memoization, tabulation, knapsack problems, and optimal substructure.', quiz_count: 1 },

            // Course 3
            { id: 12, course_id: 3, chapter_num: 1, title: 'Relational Database Concepts & Normalization', duration: '2.5 Hours', lesson_count: 4, description: '1NF, 2NF, 3NF, BCNF, ER diagrams, and relational algebra.', quiz_count: 1 },
            { id: 13, course_id: 3, chapter_num: 2, title: 'Advanced SQL Queries, Joins & Subqueries', duration: '3 Hours', lesson_count: 4, description: 'Complex joins, window functions, CTEs, and aggregation grouping.', quiz_count: 1 },
            { id: 14, course_id: 3, chapter_num: 3, title: 'Indexing Strategies & Query Performance', duration: '2.5 Hours', lesson_count: 4, description: 'B-tree indexes, execution query plans, and EXPLAIN ANALYZE optimization.', quiz_count: 1 },
            { id: 15, course_id: 3, chapter_num: 4, title: 'Transactions, ACID Compliance & Concurrency', duration: '3 Hours', lesson_count: 4, description: 'Transaction isolation levels, deadlock handling, write-ahead logging.', quiz_count: 1 },
            { id: 16, course_id: 3, chapter_num: 5, title: 'Cloud Database Deployment & Replication', duration: '2 Hours', lesson_count: 4, description: 'Managed cloud DBs, read replicas, automated snapshots, and failover.', quiz_count: 1 },

            // Course 4
            { id: 17, course_id: 4, chapter_num: 1, title: 'Security Principles, Threats & Vulnerability Surfaces', duration: '2.5 Hours', lesson_count: 3, description: 'CIA triad, threat modeling, attack vectors, and security postures.', quiz_count: 1 },
            { id: 18, course_id: 4, chapter_num: 2, title: 'Cryptography, Hashing & Public Key Infrastructure', duration: '3 Hours', lesson_count: 4, description: 'Symmetric/asymmetric encryption, SHA-256, TLS certificates, and PKI.', quiz_count: 1 },
            { id: 19, course_id: 4, chapter_num: 3, title: 'Network Defense, Firewalls & Intrusion Detection', duration: '3 Hours', lesson_count: 4, description: 'Packet filtering, IDS/IPS configuration, Wireshark packet analysis.', quiz_count: 1 },
            { id: 20, course_id: 4, chapter_num: 4, title: 'Web Application Security & OWASP Top 10', duration: '3.5 Hours', lesson_count: 4, description: 'SQL injection, XSS, CSRF, insecure direct object references, mitigation.', quiz_count: 1 },
            { id: 21, course_id: 4, chapter_num: 5, title: 'Identity Management & Zero-Trust Architecture', duration: '2.5 Hours', lesson_count: 4, description: 'OAuth2, JWT authentication, RBAC, and zero-trust microsegmentation.', quiz_count: 1 },

            // Course 5
            { id: 22, course_id: 5, chapter_num: 1, title: 'Mathematical Foundations of Machine Learning', duration: '3 Hours', lesson_count: 5, description: 'Linear algebra, vector calculus, gradient descent optimization.', quiz_count: 1 },
            { id: 23, course_id: 5, chapter_num: 2, title: 'Supervised Learning: Regression & Classification', duration: '3.5 Hours', lesson_count: 5, description: 'Linear/logistic regression, decision trees, random forests, SVMs.', quiz_count: 1 },
            { id: 24, course_id: 5, chapter_num: 3, title: 'Neural Networks & Deep Learning Foundations', duration: '4 Hours', lesson_count: 5, description: 'Multilayer perceptrons, activation functions, backpropagation calculus.', quiz_count: 1 },
            { id: 25, course_id: 5, chapter_num: 4, title: 'Convolutional & Recurrent Architectures', duration: '3.5 Hours', lesson_count: 5, description: 'Spatial convolutions, pooling, RNNs, LSTMs, and sequence models.', quiz_count: 1 },
            { id: 26, course_id: 5, chapter_num: 5, title: 'Transformer Models & Generative AI Applications', duration: '4 Hours', lesson_count: 5, description: 'Attention mechanisms, BERT, GPT transformer encoders, and fine-tuning.', quiz_count: 1 }
        ],
        enrollments: [
            { id: 101, student_id: 2, student_name: 'Sok Virak', student_uni_id: '202401234', student_email: 'sok.virak@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150', course_id: 1, course_title: 'Full-Stack Modern Web Architecture', major: 'Computer Science & Software Engineering', enrollment_date: '2026-03-15', progress_percentage: 85, status: 'Active' },
            { id: 102, student_id: 3, student_name: 'Chanthou Meas', student_uni_id: '202401235', student_email: 'chanthou.meas@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', course_id: 1, course_title: 'Full-Stack Modern Web Architecture', major: 'Computer Science & Software Engineering', enrollment_date: '2026-03-13', progress_percentage: 60, status: 'Active' },
            { id: 103, student_id: 4, student_name: 'Dara Keo', student_uni_id: '202401236', student_email: 'dara.keo@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', course_id: 4, course_title: 'Cybersecurity Fundamentals & Network Defense', major: 'Cybersecurity & Information Defense', enrollment_date: '2026-03-09', progress_percentage: 100, status: 'Completed' },
            { id: 104, student_id: 5, student_name: 'Kanha Rath', student_uni_id: '202401237', student_email: 'kanha.rath@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', course_id: 5, course_title: 'Artificial Intelligence & Machine Learning', major: 'Artificial Intelligence & Machine Learning', enrollment_date: '2026-03-17', progress_percentage: 40, status: 'Active' },
            { id: 105, student_id: 6, student_name: 'Vibol Pen', student_uni_id: '202401238', student_email: 'vibol.pen@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150', course_id: 2, course_title: 'Applied Programming & Algorithms', major: 'Business Information Technology', enrollment_date: '2026-03-05', progress_percentage: 95, status: 'Active' },
            { id: 106, student_id: 2, student_name: 'Sok Virak', student_uni_id: '202401234', student_email: 'sok.virak@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150', course_id: 2, course_title: 'Applied Programming & Algorithms', major: 'Computer Science & Software Engineering', enrollment_date: '2026-03-11', progress_percentage: 50, status: 'Active' },
            { id: 107, student_id: 3, student_name: 'Chanthou Meas', student_uni_id: '202401235', student_email: 'chanthou.meas@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', course_id: 4, course_title: 'Cybersecurity Fundamentals & Network Defense', major: 'Computer Science & Software Engineering', enrollment_date: '2026-03-14', progress_percentage: 30, status: 'Active' }
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
        }

        loadState() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    return {
                        ...defaultInitialData,
                        ...parsed,
                        users: parsed.users || defaultInitialData.users,
                        categories: parsed.categories || defaultInitialData.categories,
                        instructors: parsed.instructors || defaultInitialData.instructors,
                        programs: parsed.programs || defaultInitialData.programs,
                        courses: parsed.courses || defaultInitialData.courses,
                        chapters: parsed.chapters || defaultInitialData.chapters,
                        enrollments: parsed.enrollments || defaultInitialData.enrollments,
                        notifications: parsed.notifications || defaultInitialData.notifications,
                        settings: { ...defaultInitialData.settings, ...(parsed.settings || {}) }
                    };
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

        ensureDefaultAdminSession(force = false) {
            const existingUser = localStorage.getItem('aub_user') || sessionStorage.getItem('aub_user');
            if (!existingUser || force) {
                const adminUser = this.state.users.find(u => u.role === 'ADMIN') || this.state.users[0];
                const token = 'aub_mock_admin_jwt_' + btoa(JSON.stringify(adminUser));
                localStorage.setItem('aub_auth_token', token);
                localStorage.setItem('token', token);
                sessionStorage.setItem('aub_auth_token', token);
                sessionStorage.setItem('token', token);
                localStorage.setItem('aub_user', JSON.stringify(adminUser));
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
            const users = this.state.users;
            const totalUsers = users.length;
            const totalStudents = users.filter(u => (u.role || '').toUpperCase() === 'STUDENT' || u.role_id === 3).length;
            const totalTeachers = users.filter(u => (u.role || '').toUpperCase() === 'TEACHER' || u.role_id === 2).length;
            const totalAdmins = users.filter(u => (u.role || '').toUpperCase() === 'ADMIN' || u.role_id === 1).length;
            const activeUsers = users.filter(u => (u.status || 'Active') === 'Active').length;
            const totalCourses = this.state.courses.length;
            const totalChapters = this.state.chapters.length;
            const totalEnrollments = this.state.enrollments.length;

            return {
                totalUsers,
                totalCourses,
                totalStudents,
                totalTeachers,
                totalAdmins,
                activeUsers,
                totalChapters,
                totalEnrollments
            };
        }

        getDashboardStats(enrollmentTimeframe = 'this_month', majorTimeframe = 'this_month') {
            const allEnrollments = this.state.enrollments;
            const categories = this.state.categories;

            // Calculate Category Enrollments
            const categoryCounts = {};
            categories.forEach(c => { categoryCounts[c.name] = 0; });

            allEnrollments.forEach(e => {
                const course = this.state.courses.find(c => c.id === e.course_id);
                if (course) {
                    const cat = categories.find(ct => ct.id === course.category_id);
                    const catName = cat ? cat.name : (course.category_name || 'Computer Science');
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
                }
            });

            const totalEnr = allEnrollments.length;

            const categoryStats = categories.map(cat => {
                const count = categoryCounts[cat.name] || 0;
                const percentage = totalEnr > 0 ? Math.round((count / totalEnr) * 100) : 0;
                return {
                    name: cat.name,
                    count: count,
                    percentage: percentage,
                    color: cat.color || '#2563EB'
                };
            });

            // Calculate Students by Major
            const studentUsers = this.state.users.filter(u => (u.role || '').toUpperCase() === 'STUDENT');
            const programs = this.state.programs;
            const totalStudents = studentUsers.length;

            const majorColors = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#3B82F6'];

            const majorsList = programs.map((prog, idx) => {
                const count = studentUsers.filter(s => s.major_id === prog.id || (s.major && s.major.toLowerCase() === prog.title.toLowerCase())).length;
                const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                return {
                    major: prog.title,
                    count: count,
                    percentage: percentage,
                    color: majorColors[idx % majorColors.length]
                };
            });

            return {
                enrollmentStatistics: {
                    total: totalEnr,
                    categories: categoryStats
                },
                studentsByMajor: {
                    total: totalStudents,
                    majors: majorsList
                }
            };
        }

        getRecentEnrollments(limit = 10) {
            return this.state.enrollments.slice(0, limit);
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

        // 3. Academic Programs CRUD
        getPrograms() {
            return [...this.state.programs];
        }

        createProgram(programData) {
            const nextId = this.state.programs.length > 0 
                ? Math.max(...this.state.programs.map(p => Number(p.id) || 0)) + 1 
                : 1;

            const newProgram = {
                id: nextId,
                title: programData.title,
                slug: programData.slug || programData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                degree_type: programData.degree_type || 'BACHELOR DEGREE',
                faculty: programData.faculty || 'Information Technology Faculty',
                duration: programData.duration || '4 Years',
                icon_class: programData.icon_class || 'bi-laptop',
                theme_class: programData.theme_class || 'theme-blue',
                description: programData.description || '',
                detail_url: programData.detail_url || '#',
                order_num: Number(programData.order_num) || nextId,
                is_published: programData.is_published !== undefined ? Number(programData.is_published) : 1
            };

            this.state.programs.push(newProgram);
            this.saveState();
            return newProgram;
        }

        updateProgram(id, programData) {
            const idx = this.state.programs.findIndex(p => p.id === Number(id));
            if (idx === -1) return null;
            this.state.programs[idx] = { ...this.state.programs[idx], ...programData, id: Number(id) };
            this.saveState();
            return this.state.programs[idx];
        }

        deleteProgram(id) {
            const prog = this.state.programs.find(p => p.id === Number(id));
            if (!prog) return false;
            const assignedStudents = this.state.users.filter(u => u.major_id === Number(id) || (u.major && u.major.toLowerCase() === prog.title.toLowerCase()));
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
            this.saveState();
            return prog;
        }

        // 4. Academic Courses CRUD
        getCourses() {
            return [...this.state.courses];
        }

        getCourseById(id) {
            return this.state.courses.find(c => c.id === Number(id));
        }

        createCourse(courseData) {
            const nextId = this.state.courses.length > 0 
                ? Math.max(...this.state.courses.map(c => Number(c.id) || 0)) + 1 
                : 1;

            const category = this.state.categories.find(cat => cat.id === Number(courseData.category_id));
            const instructor = this.state.instructors.find(ins => ins.id === Number(courseData.instructor_id));

            const newCourse = {
                id: nextId,
                title: courseData.title,
                slug: courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                category_id: Number(courseData.category_id) || 1,
                category_name: category ? category.name : 'Computer Science',
                instructor_id: Number(courseData.instructor_id) || 1,
                instructor_name: instructor ? instructor.name : 'Faculty Lead',
                difficulty: courseData.difficulty || 'Beginner',
                duration: courseData.duration || '8 Weeks',
                lesson_count: 0,
                rating: 4.8,
                enrolled_students_count: 0,
                badge: courseData.badge || 'New Course',
                description: courseData.description || '',
                thumbnail_url: courseData.thumbnail_url || 'assets/images/course_webdev.jpg',
                is_published: courseData.is_published !== undefined ? Number(courseData.is_published) : 1
            };

            this.state.courses.unshift(newCourse);
            this.saveState();
            return newCourse;
        }

        updateCourse(id, courseData) {
            const idx = this.state.courses.findIndex(c => c.id === Number(id));
            if (idx === -1) return null;

            const category = courseData.category_id 
                ? this.state.categories.find(cat => cat.id === Number(courseData.category_id)) 
                : null;
            const instructor = courseData.instructor_id 
                ? this.state.instructors.find(ins => ins.id === Number(courseData.instructor_id)) 
                : null;

            this.state.courses[idx] = {
                ...this.state.courses[idx],
                ...courseData,
                id: Number(id),
                category_name: category ? category.name : this.state.courses[idx].category_name,
                instructor_name: instructor ? instructor.name : this.state.courses[idx].instructor_name
            };

            this.saveState();
            return this.state.courses[idx];
        }

        deleteCourse(id) {
            const activeEnrollments = this.state.enrollments.filter(e => e.course_id === Number(id));
            if (activeEnrollments.length > 0) {
                throw new Error(`Cannot delete course: ${activeEnrollments.length} student(s) are currently enrolled in this course. Please unenroll or complete students before deleting.`);
            }
            const idx = this.state.courses.findIndex(c => c.id === Number(id));
            if (idx === -1) return false;
            this.state.courses.splice(idx, 1);
            this.state.chapters = this.state.chapters.filter(ch => ch.course_id !== Number(id));
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

        // 5. Course Chapters / Modules
        getChaptersByCourseId(courseId) {
            return this.state.chapters.filter(ch => ch.course_id === Number(courseId)).sort((a, b) => (a.chapter_num || 0) - (b.chapter_num || 0));
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
                title: chapterData.title,
                duration: chapterData.duration || '2 Hours',
                lesson_count: Number(chapterData.lesson_count) || 4,
                description: chapterData.description || '',
                quiz_count: Number(chapterData.quiz_count) || 1
            };

            this.state.chapters.push(newChapter);

            const course = this.getCourseById(chapterData.course_id);
            if (course) {
                course.lesson_count = this.getChaptersByCourseId(course.id).length;
            }

            this.saveState();
            return newChapter;
        }

        updateChapter(id, chapterData) {
            const idx = this.state.chapters.findIndex(ch => ch.id === Number(id));
            if (idx === -1) return null;

            this.state.chapters[idx] = {
                ...this.state.chapters[idx],
                ...chapterData,
                id: Number(id)
            };

            const course = this.getCourseById(this.state.chapters[idx].course_id);
            if (course) {
                course.lesson_count = this.getChaptersByCourseId(course.id).length;
            }

            this.saveState();
            return this.state.chapters[idx];
        }

        deleteChapter(id) {
            const chapter = this.state.chapters.find(ch => ch.id === Number(id));
            if (!chapter) return false;
            const courseId = chapter.course_id;

            this.state.chapters = this.state.chapters.filter(ch => ch.id !== Number(id));

            const course = this.getCourseById(courseId);
            if (course) {
                course.lesson_count = this.getChaptersByCourseId(course.id).length;
            }

            this.saveState();
            return true;
        }

        // 6. Categories & Instructors CRUD
        getCategories() {
            return [...this.state.categories];
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
                color: catData.color || '#2563EB'
            };

            this.state.categories.push(newCategory);
            this.saveState();
            return newCategory;
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
                        status: matchedUser.status
                    };
                }
                return ins;
            });

            return list;
        }

        createInstructor(insData) {
            let matchedUser = null;
            if (insData.user_id) {
                matchedUser = this.getUserById(insData.user_id);
            } else if (insData.email) {
                matchedUser = this.state.users.find(u => u.email && u.email.toLowerCase() === insData.email.toLowerCase());
            }

            if (!matchedUser) {
                matchedUser = this.createUser({
                    full_name: insData.name,
                    email: insData.email || `${insData.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@aub.edu.kh`,
                    role: 'TEACHER',
                    role_id: 2,
                    status: 'Active',
                    faculty: insData.faculty || 'Information Technology',
                    avatar_url: insData.avatar_url
                });
            }

            const nextId = this.state.instructors.length > 0 
                ? Math.max(...this.state.instructors.map(i => Number(i.id) || 0)) + 1 
                : 1;

            const newInstructor = {
                id: nextId,
                user_id: matchedUser.id,
                name: matchedUser.full_name,
                title: insData.title || 'Faculty Member',
                email: matchedUser.email,
                expertise: insData.expertise || 'Computer Science & Technology',
                faculty: insData.faculty || 'Information Technology',
                avatar_url: matchedUser.avatar_url || insData.avatar_url
            };

            this.state.instructors.push(newInstructor);
            this.saveState();
            return newInstructor;
        }

        updateInstructor(id, insData) {
            const idx = this.state.instructors.findIndex(i => i.id === Number(id));
            if (idx === -1) return null;

            this.state.instructors[idx] = {
                ...this.state.instructors[idx],
                ...insData,
                id: Number(id)
            };

            if (this.state.instructors[idx].user_id) {
                this.updateUser(this.state.instructors[idx].user_id, {
                    full_name: insData.name || this.state.instructors[idx].name,
                    email: insData.email || this.state.instructors[idx].email
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

        // 7. Enrollment Management CRUD
        getEnrollments() {
            return [...this.state.enrollments];
        }

        createEnrollment(enrData) {
            const studentId = Number(enrData.student_id);
            const courseId = Number(enrData.course_id);

            // Unique student-course check
            const exists = this.state.enrollments.some(e => e.student_id === studentId && e.course_id === courseId);
            if (exists) {
                throw new Error('This student is already enrolled in this course.');
            }

            const nextId = this.state.enrollments.length > 0 
                ? Math.max(...this.state.enrollments.map(e => Number(e.id) || 0)) + 1 
                : 101;

            const student = this.getUserById(studentId);
            const course = this.getCourseById(courseId);

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

            this.state.enrollments[idx] = {
                ...this.state.enrollments[idx],
                ...enrData,
                id: Number(id)
            };

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
    }

    global.AdminStore = new AdminMockStore();
})(window);
