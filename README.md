# 🏛️ AUB Digital Academy — Full Stack University Web Application

An enterprise-grade, modern digital university portal and administration management system built for the **American University of Phnom Penh (AUB) Digital Academy**.

---

## 📂 Project Architecture & Directory Structure

```text
AUBDigitalAcademyFrontend/
├── 🌐 assets/                           # Static assets & media
│   ├── images/                         # Illustrations, hero images & banners
│   └── logos/                          # University logos & rel icons
│
├── 🎨 css/                             # Modular styling architecture
│   ├── base/                           # Global foundations & design tokens
│   │   ├── animations.css              # Keyframes & smooth UI transitions
│   │   ├── global.css                  # Typography, utilities & resets
│   │   └── variables.css               # Color tokens & theme variables
│   ├── components/                     # Reusable UI component styles
│   │   ├── carousel.css                # Hero & testimonial sliders
│   │   ├── modal.css                   # Custom dialog styles
│   │   └── navbar.css                  # Sticky navigation & dropdowns
│   ├── layouts/                        # Role-specific layout sheets
│   │   ├── admin.css                   # University administration portal styles
│   │   ├── authentication.css          # Auth forms & login layouts
│   │   ├── student.css                 # Student workspace styles
│   │   └── teacher.css                 # Faculty workspace styles
│   └── pages/                          # Landing page & feature styles
│       ├── about.css
│       ├── courses.css
│       └── landing.css
│
├── ⚡ js/                              # Frontend scripts & state management
│   ├── components/                     # Interactive UI components
│   │   ├── animations.js               # Scroll triggers & micro-interactions
│   │   ├── carousel.js                 # Multi-card interactive carousels
│   │   ├── hero-3d.js                  # 3D interactive hero cards
│   │   ├── sidebar.js                  # Responsive portal navigation & state persistence
│   │   └── teacher-sidebar.js          # Faculty navigation controller
│   ├── data/                           # Client storage & mock store
│   │   └── mock-store.js               # Client fallback & LMS curriculum data store
│   └── pages/                          # Page-level controllers
│       ├── academic-management.js      # Faculty & 6-step LMS curriculum builder
│       ├── admin-dashboard.js          # Admin KPI analytics & metrics
│       ├── course-management.js        # Course catalog manager
│       ├── enrollment-management.js    # Student admissions & registration
│       ├── exam-management.js          # Exam & quiz controller
│       ├── login.js                    # Auth & token management
│       ├── payment-management.js       # Payments & invoices manager
│       ├── payroll-management.js       # Faculty payroll controller
│       ├── reports.js                  # Academic & financial reports
│       ├── schedule-management.js      # Timetable & scheduling
│       ├── settings.js                 # System configurations
│       ├── student-assignments.js      # Student submission controller
│       ├── student-course-detail.js    # Student course curriculum viewer
│       ├── student-one-on-one.js       # Student consultation booking
│       ├── student-quiz.js             # Student interactive quiz taker
│       ├── teacher-assignments.js      # Faculty coursework & grading controller
│       ├── teacher-courses.js          # Faculty course manager
│       ├── teacher-dashboard.js        # Faculty stats & schedule
│       ├── teacher-management.js       # Faculty directory & course assignment
│       ├── teacher-one-on-one.js       # Teacher schedule management
│       ├── teacher-quizzes.js          # Faculty quiz manager
│       ├── teacher-students.js         # Faculty student list
│       ├── teacher-submissions.js      # Submission grading controller
│       ├── user-management.js          # Multi-role user & student management
│       └── welcome-dynamic.js          # Landing page dynamic rendering
│
├── 📄 pages/                            # Portal & web views
│   ├── admin/                          # Administration Portal
│   │   ├── academic-management.html    # Academic programs, degrees & LMS curriculum
│   │   ├── course-management.html      # Course directory
│   │   ├── dashboard.html              # University KPI & statistics overview
│   │   ├── enrollment-management.html  # Admissions & enrollments
│   │   ├── exam-management.html        # Exam & quiz management
│   │   ├── payment-management.html     # Student payments & invoices
│   │   ├── payroll-management.html     # Faculty payroll manager
│   │   ├── reports.html                # Academic & financial analytics
│   │   ├── schedule-management.html    # Timetable & calendar
│   │   ├── settings.html               # University portal settings
│   │   ├── teacher-management.html     # Teacher Directory & course assignments
│   │   └── user-management.html        # Comprehensive User & Student Management
│   ├── authentication/                 # Auth & credential workflows
│   │   ├── access-denied.html          # 403 Forbidden screen
│   │   ├── forgot-password.html        # Password recovery
│   │   ├── login.html                  # University SSO & credentials login
│   │   ├── login-success.html          # Auth redirect handler
│   │   └── reset-password.html         # Secure password reset form
│   ├── student/                        # Student Portal Workspace
│   │   ├── assignment.html             # Coursework assignments & submissions
│   │   ├── course-detail.html          # Interactive course curriculum
│   │   ├── dashboard.html              # Student course progress & schedule
│   │   ├── my-courses.html             # Active course modules & lessons
│   │   ├── one-on-one.html             # Faculty consultation booking
│   │   └── quiz.html                   # Online quiz testing interface
│   └── teacher/                        # Faculty & Instructor Workspace
│       ├── assignments.html            # Coursework creation & grading
│       ├── dashboard.html              # Faculty schedule & student stats
│       ├── my-courses.html             # Assigned courses
│       ├── my-students.html            # Enrolled students directory
│       ├── one-on-one.html             # Office hours & consultation requests
│       ├── profile.html                # Teacher profile & qualifications
│       ├── quizzes.html                # Quiz manager
│       └── submissions.html            # Grading & feedback queue
│
├── 🗄️ data/                             # SQLite persistent storage
│   └── aub_academy.sqlite              # Relational SQLite database
│
├── ⚙️ server/                           # Backend REST API Server (Node / Express)
│   ├── controllers/                    # API Controller logic
│   │   ├── adminController.js          # User, Student, System, & Stats APIs
│   │   ├── authController.js           # JWT Authentication & RBAC
│   │   ├── courseController.js         # Courses & Curriculum APIs
│   │   ├── teacherAssignmentController.js # Coursework & grading APIs
│   │   └── teacherController.js        # Faculty & Department APIs
│   ├── db/                             # Relational database setup
│   │   ├── database.js                 # Schema definitions & migrations
│   │   └── seeds.js                    # Comprehensive demo seed data
│   ├── middleware/                     # Express middlewares
│   │   ├── authMiddleware.js           # JWT verification & claims validation
│   │   └── rbacMiddleware.js           # Role-Based Access Control (Admin/Teacher/Student)
│   ├── routes/                         # Express API route declarations
│   │   ├── api.js                      # Root router mounting all domain endpoints
│   │   └── authRoutes.js               # Authentication endpoints
│   ├── server.js                       # Express app bootstrap & port binding
│   └── package.json                    # Backend dependencies & test scripts
│
├── 🌐 index.html                        # Gateway / root redirector
└── 🌟 welcomepage.html                  # Official Public Website & Landing Page
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | HTML5, Modern Vanilla CSS, Bootstrap 5.3, Bootstrap Icons |
| **Typography** | Inter (Google Fonts) |
| **Client Scripts** | Vanilla JavaScript (ES6+), SweetAlert2, Fetch API |
| **Backend API** | Node.js, Express.js |
| **Authentication** | JSON Web Tokens (JWT), BCrypt Password Hashing, RBAC Middleware |
| **Database** | SQLite3 with Foreign Keys & Relational Integrity |

---

## 🚀 Getting Started

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Start the Express API Server
```bash
npm start
```
*The API server will listen on `http://localhost:5000`.*

### 4. Run Test Suites
```bash
# Run 20-Point Comprehensive Integration Tests
npm test

# Run All 4 Suites (Integration, User Management, Student Management, Teacher Suite)
npm run test:all
```

---

## 📊 Core Portal Sections

### 1. Administration Portal (`/pages/admin/`)
- **Dashboard**: High-level university metrics, user breakdown, and recent activity.
- **User & Student Management**: Full 10-column tables, 5-metric KPI cards, 5-section drawer modal, 4-step wizard, role-based filters, and CSV export.
- **Teacher Management**: Complete teacher directory with course assignments, class linkages, and safe deletion.
- **Academic Management**: Faculties, degrees, curriculum paths, and courses.
- **Enrollment Management**: Admissions queue and course registrations.

### 2. Faculty Portal (`/pages/teacher/`)
- **Coursework & Assignments**: Create assignments, set deadlines, and grade student submissions.
- **Office Hours / Consultations**: Manage 1-on-1 student consultation slots.

### 3. Student Portal (`/pages/student/`)
- **My Courses & Lessons**: Interactive syllabus and learning tracking.
- **Assignments**: Upload and submit homework, view feedback and grades.
- **Consultations**: Book 1-on-1 sessions with university professors.

---

## 🔒 Security Principles
- **RBAC Enforcement**: Admin-only mutations guarded by JWT claims.
- **Credential Protection**: Passwords, hashes, and tokens are never returned in public user profiles.
- **Safe Soft Deletion**: Historical student and teacher records are preserved to protect audit trails and grade history.
