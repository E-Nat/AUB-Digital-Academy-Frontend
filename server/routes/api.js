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
// 2. PUBLIC FRONTEND ROUTES (Consumed by welcomepage.html)
// ==========================================
router.get('/public/categories', publicController.getCategories);
router.get('/public/programs/featured', publicController.getFeaturedPrograms);
router.get('/public/courses/popular', publicController.getPopularCourses);
router.get('/public/courses', publicController.getAllCourses);
router.get('/public/courses/:idOrSlug', publicController.getCourseDetails);

// ==========================================
// 3. ADMIN DASHBOARD & MANAGEMENT ROUTES (Protected by RBAC)
// ==========================================
// Dashboard Metrics & Stats
router.get('/admin/dashboard/metrics', authenticateToken, requireAdmin, adminController.getDashboardMetrics);
router.get('/admin/dashboard/stats', authenticateToken, requireAdmin, adminController.getDashboardStats);
router.get('/admin/dashboard/recent-enrollments', authenticateToken, requireAdmin, adminController.getRecentEnrollments);

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

// Courses CRUD
router.get('/admin/courses', authenticateToken, requireAdmin, adminController.getAllCourses);
router.post('/admin/courses', authenticateToken, requireAdmin, adminController.createCourse);
router.put('/admin/courses/:id', authenticateToken, requireAdmin, adminController.updateCourse);
router.delete('/admin/courses/:id', authenticateToken, requireAdmin, adminController.deleteCourse);
router.patch('/admin/courses/:id/toggle-publish', authenticateToken, requireAdmin, adminController.toggleCoursePublish);

// Categories CRUD
router.get('/admin/categories', authenticateToken, requireAdmin, adminController.getAllCategories);
router.post('/admin/categories', authenticateToken, requireAdmin, adminController.createCategory);
router.delete('/admin/categories/:id', authenticateToken, requireAdmin, adminController.deleteCategory);

// Instructors CRUD
router.get('/admin/instructors', authenticateToken, requireAdmin, adminController.getAllInstructors);
router.post('/admin/instructors', authenticateToken, requireAdmin, adminController.createInstructor);
router.delete('/admin/instructors/:id', authenticateToken, requireAdmin, adminController.deleteInstructor);

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
router.put('/admin/enrollments/:id', authenticateToken, requireAdmin, adminController.updateEnrollmentStatus);
router.delete('/admin/enrollments/:id', authenticateToken, requireAdmin, adminController.deleteEnrollment);

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
