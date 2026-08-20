const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const publicController = require('../controllers/publicController');
const adminController = require('../controllers/adminController');
const consultationController = require('../controllers/consultationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// ==========================================
// 2. PUBLIC FRONTEND ROUTES (Consumed by welcomepage.html & student course pages)
// ==========================================
router.get('/public/categories', publicController.getCategories);
router.get('/public/programs/featured', publicController.getFeaturedPrograms);
router.get('/public/courses/popular', publicController.getPopularCourses);
router.get('/public/courses', publicController.getAllCourses);
router.get('/public/courses/:idOrSlug', publicController.getCourseDetails);
router.post('/public/courses/:id/enroll', publicController.enrollInCourse);

// Student Exam & Quiz Endpoints (Enforcing Rules 14 & 15)
router.get('/student/exams/:id', authenticateToken, publicController.getExamDetails);
router.post('/student/exams/:id/start', authenticateToken, publicController.startExam);
router.post('/student/exams/:id/submit', authenticateToken, publicController.submitExam);

// ==========================================
// 3. ADMIN DASHBOARD & MANAGEMENT ROUTES (Protected by RBAC)
// ==========================================
// Dashboard Metrics & Stats
router.get('/admin/dashboard/metrics', authenticateToken, requireAdmin, adminController.getDashboardMetrics);
router.get('/admin/dashboard/stats', authenticateToken, requireAdmin, adminController.getDashboardStats);
router.get('/admin/dashboard/recent-enrollments', authenticateToken, requireAdmin, adminController.getRecentEnrollments);
router.get('/admin/dashboard/upcoming-exams', authenticateToken, requireAdmin, adminController.getUpcomingExams);

// Global Search & Notifications
router.get('/admin/search', authenticateToken, requireAdmin, adminController.globalSearch);
router.get('/admin/notifications', authenticateToken, requireAdmin, adminController.getNotifications);
router.patch('/admin/notifications/:id/read', authenticateToken, requireAdmin, adminController.markNotificationRead);

// Programs CRUD
router.get('/admin/programs', authenticateToken, requireAdmin, adminController.getAllPrograms);
router.post('/admin/programs', authenticateToken, requireAdmin, adminController.createProgram);
router.put('/admin/programs/:id', authenticateToken, requireAdmin, adminController.updateProgram);
router.delete('/admin/programs/:id', authenticateToken, requireAdmin, adminController.deleteProgram);
router.patch('/admin/programs/:id/toggle-publish', authenticateToken, requireAdmin, adminController.toggleProgramPublish);

// Courses CRUD & Advanced Operations
router.get('/admin/courses', authenticateToken, requireAdmin, adminController.getAllCourses);
router.get('/admin/courses/:id/details', authenticateToken, requireAdmin, adminController.getCourseDetails);
router.post('/admin/courses', authenticateToken, requireAdmin, adminController.createCourse);
router.put('/admin/courses/:id', authenticateToken, requireAdmin, adminController.updateCourse);
router.delete('/admin/courses/:id', authenticateToken, requireAdmin, adminController.deleteCourse);
router.post('/admin/courses/:id/duplicate', authenticateToken, requireAdmin, adminController.duplicateCourse);
router.patch('/admin/courses/:id/archive', authenticateToken, requireAdmin, adminController.archiveCourse);
router.patch('/admin/courses/:id/toggle-publish', authenticateToken, requireAdmin, adminController.toggleCoursePublish);

// Course Chapters CRUD
router.get('/admin/courses/:courseId/chapters', authenticateToken, requireAdmin, adminController.getCourseChapters);
router.post('/admin/chapters', authenticateToken, requireAdmin, adminController.createChapter);
router.put('/admin/chapters/:id', authenticateToken, requireAdmin, adminController.updateChapter);
router.delete('/admin/chapters/:id', authenticateToken, requireAdmin, adminController.deleteChapter);

// Categories CRUD
router.get('/admin/categories', authenticateToken, requireAdmin, adminController.getAllCategories);
router.post('/admin/categories', authenticateToken, requireAdmin, adminController.createCategory);
router.put('/admin/categories/:id', authenticateToken, requireAdmin, adminController.updateCategory);
router.delete('/admin/categories/:id', authenticateToken, requireAdmin, adminController.deleteCategory);

// Instructors CRUD
router.get('/admin/instructors', authenticateToken, requireAdmin, adminController.getAllInstructors);
router.post('/admin/instructors', authenticateToken, requireAdmin, adminController.createInstructor);
router.put('/admin/instructors/:id', authenticateToken, requireAdmin, adminController.updateInstructor);
router.delete('/admin/instructors/:id', authenticateToken, requireAdmin, adminController.deleteInstructor);

// Payments Management CRUD
router.get('/admin/payments', authenticateToken, requireAdmin, adminController.getAllPayments);
router.get('/admin/payments/stats', authenticateToken, requireAdmin, adminController.getPaymentStats);
router.post('/admin/payments', authenticateToken, requireAdmin, adminController.createPayment);
router.post('/admin/payments/:id/refund', authenticateToken, requireAdmin, adminController.refundPayment);

// Users CRUD & Profile Management
router.get('/admin/users', authenticateToken, requireAdmin, adminController.getAllUsers);
router.get('/admin/users/:id', authenticateToken, requireAdmin, adminController.getUserById);
router.post('/admin/users', authenticateToken, requireAdmin, adminController.createUser);
router.put('/admin/users/:id', authenticateToken, requireAdmin, adminController.updateUser);
router.delete('/admin/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);
router.post('/admin/users/:id/reset-password', authenticateToken, requireAdmin, adminController.resetUserPassword);
router.patch('/admin/users/:id/status', authenticateToken, requireAdmin, adminController.toggleUserStatus);
router.get('/admin/users/:id/activity', authenticateToken, requireAdmin, adminController.getUserActivity);

// Enrollments CRUD
router.get('/admin/enrollments', authenticateToken, requireAdmin, adminController.getAllEnrollments);
router.post('/admin/enrollments', authenticateToken, requireAdmin, adminController.createEnrollment);
router.put('/admin/enrollments/:id', authenticateToken, requireAdmin, adminController.updateEnrollmentStatus);
router.delete('/admin/enrollments/:id', authenticateToken, requireAdmin, adminController.deleteEnrollment);

// Exams & Quizzes CRUD & Results
router.get('/admin/exams', authenticateToken, requireAdmin, adminController.getAllExams);
router.post('/admin/exams', authenticateToken, requireAdmin, adminController.createExam);
router.put('/admin/exams/:id', authenticateToken, requireAdmin, adminController.updateExam);
router.delete('/admin/exams/:id', authenticateToken, requireAdmin, adminController.deleteExam);
router.get('/admin/exam-results', authenticateToken, requireAdmin, adminController.getExamResults);

// Invoices CRUD
router.get('/admin/invoices', authenticateToken, requireAdmin, adminController.getAllInvoices);
router.post('/admin/invoices', authenticateToken, requireAdmin, adminController.createInvoice);

// Teacher Payroll CRUD
router.get('/admin/payroll', authenticateToken, requireAdmin, adminController.getTeacherPayroll);
router.patch('/admin/payroll/:id/status', authenticateToken, requireAdmin, adminController.updatePayrollStatus);

// Schedule / Calendar Events
router.get('/admin/calendar/events', authenticateToken, requireAdmin, adminController.getCalendarEvents);
router.post('/admin/calendar/events', authenticateToken, requireAdmin, adminController.createCalendarEvent);

// Reports
router.get('/admin/reports', authenticateToken, requireAdmin, adminController.getReportsData);

const teacherAssignmentController = require('../controllers/teacherAssignmentController');
const teacherController = require('../controllers/teacherController');

// ==========================================
// 4. 1-ON-1 MENTORSHIP & CONSULTATIONS ROUTES
// ==========================================
router.get('/consultations/teachers', authenticateToken, consultationController.getTeachers);
router.get('/consultations/my-sessions', authenticateToken, consultationController.getMyConsultations);
router.get('/consultations/stats', authenticateToken, consultationController.getConsultationStats);
router.post('/consultations/book', authenticateToken, consultationController.bookConsultation);
router.patch('/consultations/:id/status', authenticateToken, consultationController.updateConsultationStatus);
router.patch('/consultations/:id/notes', authenticateToken, consultationController.updateConsultationNotes);

// ==========================================
// 5. TEACHER ASSIGNMENTS ROUTES
// ==========================================
router.get('/teacher/courses', authenticateToken, teacherAssignmentController.getTeacherCourses);
router.get('/teacher/assignments', authenticateToken, teacherAssignmentController.getAssignments);
router.post('/teacher/assignments', authenticateToken, teacherAssignmentController.createAssignment);
router.put('/teacher/assignments/:id', authenticateToken, teacherAssignmentController.updateAssignment);
router.delete('/teacher/assignments/:id', authenticateToken, teacherAssignmentController.deleteAssignment);
router.get('/teacher/assignments/:id/submissions', authenticateToken, teacherAssignmentController.getSubmissions);
router.put('/teacher/submissions/:id/grade', authenticateToken, teacherAssignmentController.gradeSubmission);

// ==========================================
// 6. TEACHER MANAGEMENT & ACADEMIC RELATIONSHIPS (Admin & Protected)
// ==========================================
router.get('/departments', teacherController.getDepartments);
router.get('/teachers/statistics', authenticateToken, teacherController.getTeacherStatistics);
router.get('/teachers', authenticateToken, teacherController.getTeachers);
router.get('/teachers/:id', authenticateToken, teacherController.getTeacherById);
router.post('/teachers', authenticateToken, requireAdmin, teacherController.createTeacher);
router.put('/teachers/:id', authenticateToken, requireAdmin, teacherController.updateTeacher);
router.delete('/teachers/:id', authenticateToken, requireAdmin, teacherController.deleteTeacher);
router.get('/teachers/:id/courses', authenticateToken, teacherController.getTeacherCourses);
router.get('/teachers/:id/students', authenticateToken, teacherController.getTeacherStudents);
router.get('/teachers/:id/classes', authenticateToken, teacherController.getTeacherClasses);
router.get('/teachers/:id/assignments', authenticateToken, teacherController.getTeacherAssignments);
router.post('/teachers/:id/assign-course', authenticateToken, requireAdmin, teacherController.assignCourse);

module.exports = router;
