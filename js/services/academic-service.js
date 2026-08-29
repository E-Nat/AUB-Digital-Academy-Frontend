// ==========================================
// AUB Digital Academy - Academic Management Service
// Clean service layer connecting UI controllers to REST API & Database
// ==========================================

(function (global) {
    'use strict';

    class AcademicService {
        constructor(client = global.apiClient) {
            this.client = client;
        }

        // ==========================================
        // 1. ACADEMIC PROGRAMS CRUD
        // ==========================================

        /**
         * Fetch all academic programs from real backend API with fallback cache
         */
        async getPrograms(forceRefresh = false) {
            if (this.client) {
                try {
                    const res = await this.client.get('/admin/programs');
                    if (res && res.success && Array.isArray(res.data)) {
                        // Synchronize real database data into local store
                        if (global.AdminStore && typeof global.AdminStore.savePrograms === 'function') {
                            try { global.AdminStore.savePrograms(res.data); } catch (e) {}
                        }
                        return res.data;
                    }
                } catch (err) {
                    console.warn('[AcademicService] API getPrograms note:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.getPrograms === 'function') {
                return global.AdminStore.getPrograms();
            }
            return [];
        }

        /**
         * Get a single program by ID
         */
        async getProgram(id) {
            if (this.client) {
                try {
                    const res = await this.client.get(`/admin/programs/${id}`);
                    if (res && res.success && res.data) {
                        return res.data;
                    }
                } catch (err) {
                    console.warn('[AcademicService] API getProgram note:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.getPrograms === 'function') {
                const progs = global.AdminStore.getPrograms();
                return progs.find(p => Number(p.id) === Number(id)) || null;
            }
            return null;
        }

        /**
         * Create a new academic program in SQLite database via REST API or local AdminStore fallback
         */
        async createProgram(programData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.post('/admin/programs', programData);
                    if (result && result.success) {
                        // Update local store with real persisted database entity
                        if (global.AdminStore) {
                            try {
                                const newProg = result.data || { ...programData, id: result.id };
                                if (typeof global.AdminStore.createProgram === 'function') {
                                    const existing = global.AdminStore.getPrograms().find(p => Number(p.id) === Number(newProg.id) || (newProg.code && p.code && p.code.toLowerCase() === newProg.code.toLowerCase()));
                                    if (existing) {
                                        global.AdminStore.updateProgram(existing.id, newProg);
                                    } else {
                                        global.AdminStore.createProgram(newProg);
                                    }
                                }
                            } catch (storeErr) {
                                console.warn('[AcademicService] Store sync note:', storeErr);
                            }
                        }
                        return result;
                    }
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API createProgram offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.createProgram === 'function') {
                const created = global.AdminStore.createProgram(programData);
                return { success: true, message: 'Program created successfully.', data: created, id: created.id, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to create academic program. Service client unavailable.');
        }

        /**
         * Update an existing academic program in SQLite database via REST API or local AdminStore fallback
         */
        async updateProgram(id, programData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.put(`/admin/programs/${id}`, programData);
                    if (result && result.success) {
                        if (global.AdminStore && typeof global.AdminStore.updateProgram === 'function') {
                            try { global.AdminStore.updateProgram(id, programData); } catch (e) {}
                        }
                        return result;
                    }
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API updateProgram offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.updateProgram === 'function') {
                const updated = global.AdminStore.updateProgram(id, programData);
                return { success: true, message: 'Program updated successfully.', data: updated, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to update academic program. Service client unavailable.');
        }

        /**
         * Delete an academic program from SQLite database via REST API or local AdminStore fallback
         */
        async deleteProgram(id) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.delete(`/admin/programs/${id}`);
                    if (result && result.success) {
                        if (global.AdminStore && typeof global.AdminStore.deleteProgram === 'function') {
                            try { global.AdminStore.deleteProgram(id); } catch (e) {}
                        }
                        return result;
                    }
                } catch (err) {
                    apiError = err;
                    console.warn('[AcademicService] API deleteProgram offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.deleteProgram === 'function') {
                global.AdminStore.deleteProgram(id);
                return { success: true, message: 'Program deleted successfully.', isLocalFallback: true };
            }

            throw apiError || new Error('Unable to delete academic program. Service client unavailable.');
        }

        /**
         * Toggle publish status of a program in SQLite database via REST API or local AdminStore fallback
         */
        async toggleProgramPublish(id) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.patch(`/admin/programs/${id}/toggle-publish`, {});
                    if (result && result.success) {
                        if (global.AdminStore && typeof global.AdminStore.toggleProgramPublish === 'function') {
                            try { global.AdminStore.toggleProgramPublish(id); } catch (e) {}
                        }
                        return result;
                    }
                } catch (err) {
                    apiError = err;
                    console.warn('[AcademicService] API toggleProgramPublish offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.toggleProgramPublish === 'function') {
                const prog = global.AdminStore.toggleProgramPublish(id);
                return { success: true, message: 'Program status updated.', is_published: prog ? prog.is_published : 1, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to toggle program status. Service client unavailable.');
        }

        // ==========================================
        // 2. SPECIALIZED COURSES CRUD
        // ==========================================

        /**
         * Fetch all specialized courses
         */
        async getCourses(forceRefresh = false) {
            if (this.client) {
                try {
                    const res = await this.client.get('/admin/courses');
                    if (res && res.success && Array.isArray(res.data)) {
                        return res.data;
                    }
                } catch (err) {
                    console.warn('[AcademicService] API getCourses note:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.getCourses === 'function') {
                return global.AdminStore.getCourses();
            }
            return [];
        }

        /**
         * Get a single course by ID
         */
        async getCourse(id) {
            if (this.client) {
                try {
                    const res = await this.client.get(`/admin/courses/${id}/details`);
                    if (res && res.success && res.data) {
                        return res.data;
                    }
                } catch (err) {
                    console.warn('[AcademicService] API getCourse note:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.getCourses === 'function') {
                const courses = global.AdminStore.getCourses();
                return courses.find(c => Number(c.id) === Number(id)) || null;
            }
            return null;
        }

        /**
         * Create a new course
         */
        async createCourse(courseData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.post('/admin/courses', courseData);
                    if (global.AdminStore && typeof global.AdminStore.createCourse === 'function') {
                        try {
                            const newCourse = (result && result.data) ? result.data : { ...courseData, id: (result && result.id) ? result.id : Date.now() };
                            const stored = global.AdminStore.createCourse(newCourse);
                            if (result) result.data = stored || newCourse;
                        } catch (e) {
                            console.warn('[AcademicService] Store sync note:', e);
                        }
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API createCourse offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.createCourse === 'function') {
                const created = global.AdminStore.createCourse(courseData);
                return { success: true, message: 'Course created successfully.', data: created, id: created.id, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to create course. Service client unavailable.');
        }

        /**
         * Update an existing course
         */
        async updateCourse(id, courseData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.put(`/admin/courses/${id}`, courseData);
                    if (global.AdminStore) {
                        try { global.AdminStore.updateCourse(id, courseData); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API updateCourse offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.updateCourse === 'function') {
                const updated = global.AdminStore.updateCourse(id, courseData);
                return { success: true, message: 'Course updated successfully.', data: updated, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to update course. Service client unavailable.');
        }

        /**
         * Delete a course
         */
        async deleteCourse(id) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.delete(`/admin/courses/${id}`);
                    if (global.AdminStore) {
                        try { global.AdminStore.deleteCourse(id); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    console.warn('[AcademicService] API deleteCourse offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.deleteCourse === 'function') {
                global.AdminStore.deleteCourse(id);
                return { success: true, message: 'Course deleted successfully.', isLocalFallback: true };
            }

            throw apiError || new Error('Unable to delete course. Service client unavailable.');
        }

        /**
         * Toggle publish/active status of a course
         */
        async toggleCoursePublish(id) {
            if (this.client) {
                try {
                    const result = await this.client.patch(`/admin/courses/${id}/toggle-publish`);
                    if (global.AdminStore) {
                        try { global.AdminStore.toggleCoursePublish(id); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    console.warn('[AcademicService] API toggleCoursePublish offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.toggleCoursePublish === 'function') {
                const c = global.AdminStore.toggleCoursePublish(id);
                return { success: true, message: 'Course status updated.', is_published: c ? c.is_published : 1, isLocalFallback: true };
            }

            return { success: true, is_published: 1 };
        }

        // ==========================================
        // 3. CATEGORIES CRUD
        // ==========================================

        /**
         * Fetch all categories
         */
        async getCategories(forceRefresh = false) {
            if (this.client) {
                try {
                    const res = await this.client.get('/admin/categories');
                    if (res && res.success && Array.isArray(res.data)) {
                        return res.data;
                    }
                } catch (err) {
                    console.warn('[AcademicService] API getCategories note:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.getCategories === 'function') {
                return global.AdminStore.getCategories();
            }
            return [];
        }

        /**
         * Create a new category
         */
        async createCategory(categoryData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.post('/admin/categories', categoryData);
                    if (global.AdminStore) {
                        try {
                            const newCat = (result && result.data) ? result.data : { ...categoryData, id: (result && result.id) ? result.id : Date.now() };
                            global.AdminStore.createCategory(newCat);
                        } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API createCategory offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.createCategory === 'function') {
                const created = global.AdminStore.createCategory(categoryData);
                return { success: true, message: 'Category created successfully.', data: created, id: created.id, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to create category. Service client unavailable.');
        }

        /**
         * Update an existing category
         */
        async updateCategory(id, categoryData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.put(`/admin/categories/${id}`, categoryData);
                    if (global.AdminStore) {
                        try { global.AdminStore.updateCategory(id, categoryData); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API updateCategory offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.updateCategory === 'function') {
                const updated = global.AdminStore.updateCategory(id, categoryData);
                return { success: true, message: 'Category updated successfully.', data: updated, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to update category. Service client unavailable.');
        }

        /**
         * Delete a category
         */
        async deleteCategory(id) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.delete(`/admin/categories/${id}`);
                    if (global.AdminStore) {
                        try { global.AdminStore.deleteCategory(id); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    console.warn('[AcademicService] API deleteCategory offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.deleteCategory === 'function') {
                global.AdminStore.deleteCategory(id);
                return { success: true, message: 'Category deleted successfully.', isLocalFallback: true };
            }

            throw apiError || new Error('Unable to delete category. Service client unavailable.');
        }

        // ==========================================
        // 4. INSTRUCTORS CRUD
        // ==========================================

        /**
         * Fetch all instructors
         */
        async getInstructors(forceRefresh = false) {
            if (this.client) {
                try {
                    const res = await this.client.get('/admin/instructors');
                    if (res && res.success && Array.isArray(res.data)) {
                        return res.data;
                    }
                } catch (err) {
                    console.warn('[AcademicService] API getInstructors note:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.getInstructors === 'function') {
                return global.AdminStore.getInstructors();
            }
            return [];
        }

        /**
         * Create a new instructor
         */
        async createInstructor(instructorData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.post('/admin/instructors', instructorData);
                    if (global.AdminStore) {
                        try {
                            const newInst = (result && result.data) ? result.data : { ...instructorData, id: (result && result.id) ? result.id : Date.now() };
                            global.AdminStore.createInstructor(newInst);
                        } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API createInstructor offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.createInstructor === 'function') {
                const created = global.AdminStore.createInstructor(instructorData);
                return { success: true, message: 'Instructor created successfully.', data: created, id: created.id, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to create instructor. Service client unavailable.');
        }

        /**
         * Update an existing instructor
         */
        async updateInstructor(id, instructorData) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.put(`/admin/instructors/${id}`, instructorData);
                    if (global.AdminStore) {
                        try { global.AdminStore.updateInstructor(id, instructorData); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    if (err.status === 409 || err.status === 400 || err.isDuplicate) throw err;
                    console.warn('[AcademicService] API updateInstructor offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.updateInstructor === 'function') {
                const updated = global.AdminStore.updateInstructor(id, instructorData);
                return { success: true, message: 'Instructor updated successfully.', data: updated, isLocalFallback: true };
            }

            throw apiError || new Error('Unable to update instructor. Service client unavailable.');
        }

        /**
         * Delete an instructor
         */
        async deleteInstructor(id) {
            let apiError = null;

            if (this.client) {
                try {
                    const result = await this.client.delete(`/admin/instructors/${id}`);
                    if (global.AdminStore) {
                        try { global.AdminStore.deleteInstructor(id); } catch (e) {}
                    }
                    return result;
                } catch (err) {
                    apiError = err;
                    console.warn('[AcademicService] API deleteInstructor offline, falling back to local store:', err.message);
                }
            }

            if (global.AdminStore && typeof global.AdminStore.deleteInstructor === 'function') {
                global.AdminStore.deleteInstructor(id);
                return { success: true, message: 'Instructor deleted successfully.', isLocalFallback: true };
            }

            throw apiError || new Error('Unable to delete instructor. Service client unavailable.');
        }

        // ==========================================
        // 5. GLOBAL SEARCH
        // ==========================================

        /**
         * Search across all academic entities
         */
        async searchAcademic(query) {
            if (!query || !query.trim()) return null;
            if (this.client) {
                try {
                    const res = await this.client.get(`/admin/search?q=${encodeURIComponent(query.trim())}`);
                    if (res && res.success && res.data) {
                        return res.data;
                    }
                } catch (e) {}
            }
            return null;
        }
    }

    const academicService = new AcademicService();
    global.AcademicService = AcademicService;
    global.academicService = academicService;

})(typeof window !== 'undefined' ? window : this);
