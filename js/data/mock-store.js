// ==========================================================================
// AUB Digital Academy - Centralized Admin Mock Data Store & State Manager
// Complete Offline-First & Hybrid API Mock Store with LocalStorage Persistence
// ==========================================================================

(function (global) {
    'use strict';

    const STORAGE_KEY = 'aub_admin_mock_store_v2';

    // Initial Realistic Seed Data
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
                created_at: '2025-11-15T08:30:00.000Z'
            },
            {
                id: 2,
                full_name: 'Sok Virak',
                email: 'sok.virak@student.aub.edu.kh',
                university_id: '0001001',
                role: 'STUDENT',
                role_id: 3,
                major: 'Computer Science',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150',
                created_at: '2026-01-10T10:15:00.000Z'
            },
            {
                id: 3,
                full_name: 'Chanthou Meas',
                email: 'chanthou.meas@student.aub.edu.kh',
                university_id: '0001002',
                role: 'STUDENT',
                role_id: 3,
                major: 'Software Engineering',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
                created_at: '2026-02-01T14:20:00.000Z'
            },
            {
                id: 4,
                full_name: 'Dara Keo',
                email: 'dara.keo@student.aub.edu.kh',
                university_id: '0001003',
                role: 'STUDENT',
                role_id: 3,
                major: 'Cybersecurity',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
                created_at: '2026-02-18T09:45:00.000Z'
            },
            {
                id: 5,
                full_name: 'Kanha Rath',
                email: 'kanha.rath@student.aub.edu.kh',
                university_id: '0001004',
                role: 'STUDENT',
                role_id: 3,
                major: 'Artificial Intelligence',
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150',
                created_at: '2026-03-05T11:00:00.000Z'
            },
            {
                id: 6,
                full_name: 'Vibol Pen',
                email: 'vibol.pen@student.aub.edu.kh',
                university_id: '0001005',
                role: 'STUDENT',
                role_id: 3,
                major: 'Business IT',
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
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150',
                created_at: '2025-10-01T08:00:00.000Z'
            },
            {
                id: 8,
                full_name: 'Prof. Alex Chen',
                email: 'alex.chen@aub.edu.kh',
                university_id: 'T002',
                role: 'TEACHER',
                role_id: 2,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150',
                created_at: '2025-10-15T09:30:00.000Z'
            },
            {
                id: 9,
                full_name: 'Dr. Michael Chang',
                email: 'michael.chang@aub.edu.kh',
                university_id: 'T003',
                role: 'TEACHER',
                role_id: 2,
                status: 'Active',
                avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150',
                created_at: '2025-11-20T10:00:00.000Z'
            },
            {
                id: 10,
                full_name: 'Emily Carter',
                email: 'emily.carter@aub.edu.kh',
                university_id: 'T004',
                role: 'TEACHER',
                role_id: 2,
                status: 'Inactive',
                avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150',
                created_at: '2025-12-05T13:45:00.000Z'
            }
        ],
        categories: [
            { id: 1, name: 'Computer Science', slug: 'computer-science', icon: 'bi-laptop', order_num: 1, color: '#2563EB' },
            { id: 2, name: 'Software Engineering', slug: 'software-engineering', icon: 'bi-code-slash', order_num: 2, color: '#0891B2' },
            { id: 3, name: 'Artificial Intelligence', slug: 'artificial-intelligence', icon: 'bi-cpu', order_num: 3, color: '#7C3AED' },
            { id: 4, name: 'Cybersecurity', slug: 'cybersecurity', icon: 'bi-shield-lock', order_num: 4, color: '#059669' },
            { id: 5, name: 'Data Science & Analytics', slug: 'data-science', icon: 'bi-graph-up-arrow', order_num: 5, color: '#D97706' },
            { id: 6, name: 'Business Information Tech', slug: 'business-it', icon: 'bi-briefcase', order_num: 6, color: '#4F46E5' }
        ],
        instructors: [
            { id: 1, name: 'Dr. Sarah Johnson', title: 'Associate Professor', email: 'sarah.johnson@aub.edu.kh', expertise: 'Algorithms, Data Structures, Web Systems', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150' },
            { id: 2, name: 'Prof. Alex Chen', title: 'Head of Software Engineering', email: 'alex.chen@aub.edu.kh', expertise: 'Full-Stack Web, Cloud Architecture, DevOps', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150' },
            { id: 3, name: 'Dr. Michael Chang', title: 'Lead AI Researcher', email: 'michael.chang@aub.edu.kh', expertise: 'Deep Learning, Neural Networks, Computer Vision', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150' },
            { id: 4, name: 'Emily Carter', title: 'Senior UX Instructor', email: 'emily.carter@aub.edu.kh', expertise: 'User Experience, Design Systems, Figma', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150' },
            { id: 5, name: 'Dr. Sokha Chan', title: 'Cybersecurity Chair', email: 'sokha.chan@aub.edu.kh', expertise: 'Network Defense, Ethical Hacking, Cryptography', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150' }
        ],
        programs: [
            {
                id: 1,
                title: 'Computer Science & Software Engineering',
                slug: 'cs-engineering',
                degree_type: 'BACHELOR DEGREE',
                duration: '4 Years',
                icon_class: 'bi-laptop',
                theme_class: 'theme-blue',
                description: 'Comprehensive 4-year undergraduate curriculum covering modern computing foundations, distributed architecture, and software design principles.',
                detail_url: 'pages/programs/cs.html',
                order_num: 1,
                is_published: 1
            },
            {
                id: 2,
                title: 'Artificial Intelligence & Machine Learning',
                slug: 'ai-machine-learning',
                degree_type: 'BACHELOR DEGREE',
                duration: '4 Years',
                icon_class: 'bi-cpu',
                theme_class: 'theme-purple',
                description: 'Rigorous engineering program focusing on modern generative AI, neural networks, natural language processing, and data robotics.',
                detail_url: 'pages/programs/ai.html',
                order_num: 2,
                is_published: 1
            },
            {
                id: 3,
                title: 'Cybersecurity & Information Defense',
                slug: 'cybersecurity-defense',
                degree_type: 'BACHELOR DEGREE',
                duration: '4 Years',
                icon_class: 'bi-shield-check',
                theme_class: 'theme-green',
                description: 'Hands-on offensive & defensive security curriculum covering cloud vulnerability defense, penetration testing, and digital forensics.',
                detail_url: 'pages/programs/cybersecurity.html',
                order_num: 3,
                is_published: 1
            },
            {
                id: 4,
                title: 'Data Science & Predictive Analytics',
                slug: 'data-science-analytics',
                degree_type: 'MASTER DEGREE',
                duration: '2 Years',
                icon_class: 'bi-graph-up',
                theme_class: 'theme-cyan',
                description: 'Postgraduate curriculum in big data pipelines, statistical modeling, machine learning at scale, and business intelligence solutions.',
                detail_url: 'pages/programs/data-science.html',
                order_num: 4,
                is_published: 1
            },
            {
                id: 5,
                title: 'Digital Business & Enterprise Systems',
                slug: 'digital-business',
                degree_type: 'BACHELOR DEGREE',
                duration: '4 Years',
                icon_class: 'bi-briefcase',
                theme_class: 'theme-gold',
                description: 'Blending technology leadership with financial strategy, enterprise ERP systems, and modern digital commerce solutions.',
                detail_url: 'pages/programs/business-it.html',
                order_num: 5,
                is_published: 1
            }
        ],
        courses: [
            {
                id: 1,
                title: 'Full-Stack Modern Web Architecture',
                slug: 'fullstack-web-architecture',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 2,
                instructor_name: 'Prof. Alex Chen',
                difficulty: 'Intermediate',
                duration: '12 Weeks',
                lesson_count: 16,
                rating: 4.9,
                enrolled_students_count: 38,
                badge: 'Popular',
                description: 'Master frontend engineering with modern component architectures, reactive state management, asynchronous REST APIs, and containerized deployment.',
                thumbnail_url: 'assets/images/course_webdev.jpg',
                is_published: 1
            },
            {
                id: 2,
                title: 'Applied Machine Learning & Deep Neural Nets',
                slug: 'machine-learning-deep-neural-nets',
                category_id: 3,
                category_name: 'Artificial Intelligence',
                instructor_id: 3,
                instructor_name: 'Dr. Michael Chang',
                difficulty: 'Advanced',
                duration: '14 Weeks',
                lesson_count: 18,
                rating: 4.95,
                enrolled_students_count: 29,
                badge: 'Featured',
                description: 'Comprehensive study of supervised and unsupervised learning, convolutional networks, transformers, and deployment with PyTorch and ONNX.',
                thumbnail_url: 'assets/images/course_datascience.jpg',
                is_published: 1
            },
            {
                id: 3,
                title: 'Enterprise Cloud Security & Threat Defense',
                slug: 'cloud-security-threat-defense',
                category_id: 4,
                category_name: 'Cybersecurity',
                instructor_id: 5,
                instructor_name: 'Dr. Sokha Chan',
                difficulty: 'Intermediate',
                duration: '10 Weeks',
                lesson_count: 14,
                rating: 4.85,
                enrolled_students_count: 24,
                badge: 'Recommended',
                description: 'Learn enterprise zero-trust architecture, identity and access management, vulnerability assessments, and automated incident response.',
                thumbnail_url: 'assets/images/course_cybersecurity.jpg',
                is_published: 1
            },
            {
                id: 4,
                title: 'Algorithms & Discrete Optimization',
                slug: 'algorithms-discrete-optimization',
                category_id: 1,
                category_name: 'Computer Science',
                instructor_id: 1,
                instructor_name: 'Dr. Sarah Johnson',
                difficulty: 'Beginner',
                duration: '8 Weeks',
                lesson_count: 12,
                rating: 4.78,
                enrolled_students_count: 45,
                badge: 'Core Subject',
                description: 'Fundamental algorithmic techniques, asymptotic analysis, graph algorithms, dynamic programming, and computational complexity theory.',
                thumbnail_url: 'assets/images/digital_learning_graphic.jpg',
                is_published: 1
            },
            {
                id: 5,
                title: 'User Experience & Interface Design Systems',
                slug: 'ux-ui-design-systems',
                category_id: 2,
                category_name: 'Software Engineering',
                instructor_id: 4,
                instructor_name: 'Emily Carter',
                difficulty: 'Beginner',
                duration: '6 Weeks',
                lesson_count: 10,
                rating: 4.88,
                enrolled_students_count: 22,
                badge: 'New',
                description: 'Design accessible, high-converting digital interfaces using Figma token variables, interactive prototypes, and atomic design systems.',
                thumbnail_url: 'assets/images/course_uiux.jpg',
                is_published: 1
            }
        ],
        chapters: [
            { id: 1, course_id: 1, chapter_num: 1, title: 'Introduction to Modern Web Standards & DOM Architecture', duration: '2 Hours', lesson_count: 4, description: 'Foundations of semantic HTML5, CSS layout trees, and the event-driven JavaScript browser runtime.', quiz_count: 1 },
            { id: 2, course_id: 1, chapter_num: 2, title: 'Component Design & Reactive State Flow', duration: '3 Hours', lesson_count: 4, description: 'Breaking down interfaces into atomic components, handling one-way state transitions, and managing side-effects.', quiz_count: 1 },
            { id: 3, course_id: 1, chapter_num: 3, title: 'RESTful API Client Integration & Error Boundaries', duration: '3.5 Hours', lesson_count: 4, description: 'Asynchronous fetch pipelines, token headers, interceptors, optimistic updates, and resilient error recovery.', quiz_count: 1 },
            { id: 4, course_id: 1, chapter_num: 4, title: 'Production Build Optimization & Containerized Deployment', duration: '2.5 Hours', lesson_count: 4, description: 'Code bundling, static caching headers, Docker containerization, and automated CI/CD pipelines.', quiz_count: 1 },
            { id: 5, course_id: 2, chapter_num: 1, title: 'Mathematical Foundations of Neural Networks', duration: '3 Hours', lesson_count: 5, description: 'Linear algebra, gradient descent calculus, and backpropagation mechanics.', quiz_count: 1 },
            { id: 6, course_id: 2, chapter_num: 2, title: 'Convolutional Architectures & Image Feature Extraction', duration: '4 Hours', lesson_count: 5, description: 'Spatial filtering, pooling, residual connections (ResNet), and object detection pipelines.', quiz_count: 1 },
            { id: 7, course_id: 2, chapter_num: 3, title: 'Attention Mechanisms & Transformer Encoders', duration: '4.5 Hours', lesson_count: 4, description: 'Self-attention, multi-head projections, positional encoding, and large language model architectures.', quiz_count: 1 },
            { id: 8, course_id: 2, chapter_num: 4, title: 'Model Evaluation, Bias Auditing & Production Serving', duration: '2.5 Hours', lesson_count: 4, description: 'Precision-recall trade-offs, inference latency reduction, and REST serving endpoints.', quiz_count: 1 },
            { id: 9, course_id: 3, chapter_num: 1, title: 'Zero-Trust Architecture & Identity Management', duration: '2.5 Hours', lesson_count: 3, description: 'Principles of zero trust, OAuth2, OpenID Connect, and microsegmentation.', quiz_count: 1 },
            { id: 10, course_id: 3, chapter_num: 2, title: 'Cloud Perimeter Defense & Threat Hunting', duration: '3 Hours', lesson_count: 4, description: 'Log telemetry aggregation, SIEM intrusion detection, and automated containment policies.', quiz_count: 1 },
            { id: 11, course_id: 4, chapter_num: 1, title: 'Asymptotic Analysis & Growth of Functions', duration: '2 Hours', lesson_count: 4, description: 'Big-O, Omega, and Theta notation, recurrence relations, and Master Theorem.', quiz_count: 1 },
            { id: 12, course_id: 4, chapter_num: 2, title: 'Graph Traversal & Shortest Path Algorithms', duration: '3 Hours', lesson_count: 4, description: 'BFS, DFS, Dijkstra algorithm, Bellman-Ford, and Minimum Spanning Trees.', quiz_count: 1 }
        ],
        enrollments: [
            { id: 101, student_id: 2, student_name: 'Sok Virak', student_uni_id: '0001001', student_email: 'sok.virak@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150', course_id: 1, course_title: 'Full-Stack Modern Web Architecture', major: 'Computer Science', enrollment_date: '2026-02-10', progress_percentage: 85, status: 'Active' },
            { id: 102, student_id: 3, student_name: 'Chanthou Meas', student_uni_id: '0001002', student_email: 'chanthou.meas@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', course_id: 1, course_title: 'Full-Stack Modern Web Architecture', major: 'Software Engineering', enrollment_date: '2026-02-12', progress_percentage: 60, status: 'Active' },
            { id: 103, student_id: 4, student_name: 'Dara Keo', student_uni_id: '0001003', student_email: 'dara.keo@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150', course_id: 3, course_title: 'Enterprise Cloud Security & Threat Defense', major: 'Cybersecurity', enrollment_date: '2026-02-20', progress_percentage: 100, status: 'Completed' },
            { id: 104, student_id: 5, student_name: 'Kanha Rath', student_uni_id: '0001004', student_email: 'kanha.rath@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150', course_id: 2, course_title: 'Applied Machine Learning & Deep Neural Nets', major: 'Artificial Intelligence', enrollment_date: '2026-03-01', progress_percentage: 42, status: 'Active' },
            { id: 105, student_id: 6, student_name: 'Vibol Pen', student_uni_id: '0001005', student_email: 'vibol.pen@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150', course_id: 4, course_title: 'Algorithms & Discrete Optimization', major: 'Business IT', enrollment_date: '2026-03-10', progress_percentage: 15, status: 'Pending' },
            { id: 106, student_id: 2, student_name: 'Sok Virak', student_uni_id: '0001001', student_email: 'sok.virak@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150', course_id: 4, course_title: 'Algorithms & Discrete Optimization', major: 'Computer Science', enrollment_date: '2026-03-14', progress_percentage: 92, status: 'Active' },
            { id: 107, student_id: 3, student_name: 'Chanthou Meas', student_uni_id: '0001002', student_email: 'chanthou.meas@student.aub.edu.kh', student_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', course_id: 5, course_title: 'User Experience & Interface Design Systems', major: 'Software Engineering', enrollment_date: '2026-03-18', progress_percentage: 100, status: 'Completed' }
        ],
        notifications: [
            { id: 1, title: 'New Student Enrollment', message: 'Chanthou Meas enrolled in "User Experience & Interface Design Systems"', type: 'enrollment', timestamp: '10 minutes ago', read: false, link_url: 'enrollment-management.html' },
            { id: 2, title: 'Course Updated', message: 'Prof. Alex Chen added 2 new chapters to "Full-Stack Web Architecture"', type: 'course', timestamp: '1 hour ago', read: false, link_url: 'academic-management.html' },
            { id: 3, title: 'User Account Created', message: 'New student account created for Kanha Rath (ID: 0001004)', type: 'user', timestamp: '3 hours ago', read: false, link_url: 'user-management.html' },
            { id: 4, title: 'System Security Health Check', message: 'All daily security backups and token rotations completed successfully.', type: 'system', timestamp: '1 day ago', read: true, link_url: 'settings.html' }
        ],
        settings: {
            academy_name: 'AUB Digital Academy',
            portal_title: 'Administration Portal',
            contact_email: 'administration@aub.edu.kh',
            support_phone: '+855 23 999 100',
            semester: 'Spring / Summer 2026',
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
            const totalCourses = this.state.courses.length;
            const totalChapters = this.state.chapters.length;
            const totalEnrollments = this.state.enrollments.length;

            return {
                totalUsers,
                totalCourses,
                totalStudents,
                totalTeachers,
                totalChapters,
                totalEnrollments
            };
        }

        getDashboardStats(enrollmentTimeframe = 'this_month', majorTimeframe = 'this_month') {
            const allEnrollments = this.state.enrollments;
            const categories = this.state.categories;

            // Filter enrollments by timeframe
            let filteredEnrollments = [...allEnrollments];
            if (enrollmentTimeframe === 'this_month') {
                filteredEnrollments = allEnrollments.filter(e => (e.enrollment_date || '').startsWith('2026-03'));
                if (filteredEnrollments.length === 0) filteredEnrollments = allEnrollments.slice(0, 4);
            } else if (enrollmentTimeframe === 'last_month') {
                filteredEnrollments = allEnrollments.filter(e => (e.enrollment_date || '').startsWith('2026-02'));
                if (filteredEnrollments.length === 0) filteredEnrollments = allEnrollments.slice(2, 5);
            } else if (enrollmentTimeframe === 'last_3_months') {
                filteredEnrollments = allEnrollments.filter(e => (e.enrollment_date || '') >= '2026-01-01');
            } else if (enrollmentTimeframe === 'this_year') {
                filteredEnrollments = allEnrollments.filter(e => (e.enrollment_date || '').startsWith('2026'));
            }

            const categoryCounts = {};
            categories.forEach(c => { categoryCounts[c.name] = 0; });

            filteredEnrollments.forEach(e => {
                const course = this.state.courses.find(c => c.id === e.course_id);
                const catName = course ? course.category_name : 'Computer Science';
                categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
            });

            const totalEnr = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || filteredEnrollments.length;

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

            // Calculate student major distribution based on major timeframe
            const studentUsers = this.state.users.filter(u => (u.role || '').toUpperCase() === 'STUDENT');
            const majorCounts = {
                'Computer Science': 0,
                'Software Engineering': 0,
                'Artificial Intelligence': 0,
                'Cybersecurity': 0,
                'Business IT': 0
            };

            studentUsers.forEach(s => {
                const maj = s.major || 'Computer Science';
                if (majorCounts[maj] !== undefined) {
                    majorCounts[maj] = (majorCounts[maj] || 0) + 1;
                } else {
                    majorCounts['Computer Science'] = (majorCounts['Computer Science'] || 0) + 1;
                }
            });

            // Adjust slightly for timeframe variations to give distinct feedback
            let multiplier = 1;
            if (majorTimeframe === 'this_month') multiplier = 1;
            else if (majorTimeframe === 'last_month') multiplier = 0.8;
            else if (majorTimeframe === 'last_3_months') multiplier = 1.6;
            else if (majorTimeframe === 'this_year') multiplier = 2.4;
            else if (majorTimeframe === 'all_time') multiplier = 3.2;

            const totalStudents = Math.round(studentUsers.length * multiplier) || 5;
            const majorsList = [
                { major: 'Computer Science', count: Math.max(1, Math.round((majorCounts['Computer Science'] || 1) * multiplier)), color: '#2563EB' },
                { major: 'Software Engineering', count: Math.max(1, Math.round((majorCounts['Software Engineering'] || 1) * multiplier)), color: '#0891B2' },
                { major: 'Artificial Intelligence', count: Math.max(1, Math.round((majorCounts['Artificial Intelligence'] || 1) * multiplier)), color: '#7C3AED' },
                { major: 'Cybersecurity', count: Math.max(1, Math.round((majorCounts['Cybersecurity'] || 1) * multiplier)), color: '#059669' },
                { major: 'Business IT', count: Math.max(1, Math.round((majorCounts['Business IT'] || 1) * multiplier)), color: '#D97706' }
            ];

            const adjustedTotal = majorsList.reduce((acc, m) => acc + m.count, 0);

            return {
                enrollmentStatistics: {
                    total: totalEnr,
                    categories: categoryStats
                },
                studentsByMajor: {
                    total: adjustedTotal || totalStudents,
                    majors: majorsList
                }
            };
        }

        getRecentEnrollments(limit = 6) {
            return this.state.enrollments.slice(0, limit);
        }

        // 2. User Management CRUD (Strictly: Full Name, Email, University ID, Role, Status, Password)
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

            const newUser = {
                id: nextId,
                full_name: userData.full_name,
                email: userData.email,
                university_id: userData.university_id || `000${nextId + 1000}`,
                role: roleName,
                role_id: roleId,
                status: userData.status || 'Active',
                avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.full_name)}`,
                created_at: new Date().toISOString()
            };

            this.state.users.unshift(newUser);
            this.saveState();
            return newUser;
        }

        updateUser(id, userData) {
            const idx = this.state.users.findIndex(u => u.id === Number(id));
            if (idx === -1) return null;

            const current = this.state.users[idx];
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
            const idx = this.state.users.findIndex(u => u.id === Number(id));
            if (idx === -1) return false;
            this.state.users.splice(idx, 1);
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
                slug: programData.slug || programData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                degree_type: programData.degree_type || 'BACHELOR DEGREE',
                duration: programData.duration || '4 Years',
                icon_class: programData.icon_class || 'bi-laptop',
                theme_class: programData.theme_class || 'theme-blue',
                description: programData.description || '',
                detail_url: programData.detail_url || `pages/programs/prog-${nextId}.html`,
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
                slug: courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                category_id: Number(courseData.category_id) || 1,
                category_name: category ? category.name : 'Computer Science',
                instructor_id: Number(courseData.instructor_id) || 1,
                instructor_name: instructor ? instructor.name : 'Faculty Lead',
                difficulty: courseData.difficulty || 'Beginner',
                duration: courseData.duration || '8 Weeks',
                lesson_count: Number(courseData.lesson_count) || 12,
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
            return this.state.chapters.filter(ch => ch.course_id === Number(courseId));
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
                lesson_count: Number(chapterData.lesson_count) || 3,
                description: chapterData.description || '',
                quiz_count: Number(chapterData.quiz_count) || 1
            };

            this.state.chapters.push(newChapter);

            const course = this.getCourseById(chapterData.course_id);
            if (course) {
                const totalLessons = this.getChaptersByCourseId(course.id).reduce((sum, ch) => sum + (ch.lesson_count || 0), 0);
                course.lesson_count = totalLessons;
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
                const totalLessons = this.getChaptersByCourseId(course.id).reduce((sum, ch) => sum + (ch.lesson_count || 0), 0);
                course.lesson_count = totalLessons;
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
                const totalLessons = this.getChaptersByCourseId(course.id).reduce((sum, ch) => sum + (ch.lesson_count || 0), 0);
                course.lesson_count = totalLessons;
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

            const newCategory = {
                id: nextId,
                name: catData.name,
                slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                icon: catData.icon || 'bi-tags',
                order_num: Number(catData.order_num) || nextId,
                color: catData.color || '#2563EB'
            };

            this.state.categories.push(newCategory);
            this.saveState();
            return newCategory;
        }

        deleteCategory(id) {
            this.state.categories = this.state.categories.filter(c => c.id !== Number(id));
            this.saveState();
            return true;
        }

        getInstructors() {
            return [...this.state.instructors];
        }

        createInstructor(insData) {
            const nextId = this.state.instructors.length > 0 
                ? Math.max(...this.state.instructors.map(i => Number(i.id) || 0)) + 1 
                : 1;

            const newInstructor = {
                id: nextId,
                name: insData.name,
                title: insData.title || 'Faculty Member',
                email: insData.email || `${insData.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@aub.edu.kh`,
                expertise: insData.expertise || 'Computer Science & Technology',
                avatar_url: insData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'
            };

            this.state.instructors.push(newInstructor);
            this.saveState();
            return newInstructor;
        }

        deleteInstructor(id) {
            this.state.instructors = this.state.instructors.filter(i => i.id !== Number(id));
            this.saveState();
            return true;
        }

        // 7. Enrollment Management CRUD
        getEnrollments() {
            return [...this.state.enrollments];
        }

        createEnrollment(enrData) {
            const nextId = this.state.enrollments.length > 0 
                ? Math.max(...this.state.enrollments.map(e => Number(e.id) || 0)) + 1 
                : 101;

            const student = this.getUserById(enrData.student_id);
            const course = this.getCourseById(enrData.course_id);

            const newEnrollment = {
                id: nextId,
                student_id: Number(enrData.student_id),
                student_name: student ? student.full_name : (enrData.student_name || 'Enrolled Student'),
                student_uni_id: student ? student.university_id : '0001000',
                student_email: student ? student.email : 'student@aub.edu.kh',
                student_avatar: student ? student.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                course_id: Number(enrData.course_id),
                course_title: course ? course.title : (enrData.course_title || 'Academic Course'),
                major: 'Computer Science',
                enrollment_date: enrData.enrollment_date || new Date().toISOString().slice(0, 10),
                progress_percentage: Number(enrData.progress_percentage) || 0,
                status: enrData.status || 'Active'
            };

            this.state.enrollments.unshift(newEnrollment);

            if (course) {
                course.enrolled_students_count = (course.enrolled_students_count || 0) + 1;
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
            this.state.enrollments.splice(idx, 1);
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
