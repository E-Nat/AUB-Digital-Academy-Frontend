const { dbAsync } = require('../db/database');

// GET /api/public/categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await dbAsync.all(
            `SELECT id, name, slug, icon, type, order_num
             FROM categories
             WHERE is_active = 1
             ORDER BY order_num ASC, name ASC`
        );
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching public categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
    }
};

// GET /api/public/programs/featured
exports.getFeaturedPrograms = async (req, res) => {
    try {
        const programs = await dbAsync.all(
            `SELECT id, title, slug, degree_type, duration, description, icon_class, theme_class, detail_url, order_num
             FROM programs
             WHERE is_published = 1 AND is_featured = 1
             ORDER BY order_num ASC, id ASC`
        );

        // Fetch tags/categories for each program
        for (const prog of programs) {
            // Default mapped tags from descriptions or categories
            const tags = await dbAsync.all(
                `SELECT c.name
                 FROM categories c
                 JOIN program_categories pc ON c.id = pc.category_id
                 WHERE pc.program_id = ?
                 ORDER BY c.order_num ASC`,
                [prog.id]
            );

            // Fallback tags if no explicit mapping
            if (tags.length > 0) {
                prog.tags = tags.map(t => t.name);
            } else {
                // Generate clean default tags based on slug
                if (prog.slug.includes('computer-science')) prog.tags = ['Programming', 'AI', 'Systems'];
                else if (prog.slug.includes('it') || prog.slug.includes('information')) prog.tags = ['Development', 'Networks', 'Data'];
                else if (prog.slug.includes('finance')) prog.tags = ['Finance', 'Investment', 'Banking'];
                else if (prog.slug.includes('accounting')) prog.tags = ['Audit', 'Tax', 'Reporting'];
                else if (prog.slug.includes('business')) prog.tags = ['Management', 'Leadership', 'Strategy'];
                else if (prog.slug.includes('marketing')) prog.tags = ['Digital', 'Branding', 'Strategy'];
                else prog.tags = ['Academic', 'Degree', 'Professional'];
            }
        }

        res.json({ success: true, data: programs });
    } catch (error) {
        console.error('Error fetching featured programs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured programs.' });
    }
};

// GET /api/public/courses/popular
exports.getPopularCourses = async (req, res) => {
    try {
        const courses = await dbAsync.all(
            `SELECT c.*, cat.name as category_name, cat.slug as category_slug,
                    inst.name as instructor_name, inst.avatar_url as instructor_avatar
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.id
             LEFT JOIN instructors inst ON c.instructor_id = inst.id
             WHERE c.is_published = 1 AND c.is_popular = 1
             ORDER BY c.order_num ASC, c.id ASC`
        );
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching popular courses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch popular courses.' });
    }
};

// GET /api/public/courses
exports.getAllCourses = async (req, res) => {
    try {
        const { category } = req.query;
        let sql = `
            SELECT c.*, cat.name as category_name, cat.slug as category_slug,
                   inst.name as instructor_name
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN instructors inst ON c.instructor_id = inst.id
            WHERE c.is_published = 1
        `;
        const params = [];

        if (category && category !== 'all') {
            sql += ` AND (cat.slug = ? OR LOWER(cat.name) = LOWER(?))`;
            params.push(category, category);
        }

        sql += ` ORDER BY c.order_num ASC, c.id ASC`;

        const courses = await dbAsync.all(sql, params);
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch courses.' });
    }
};

// GET /api/public/courses/:idOrSlug
exports.getCourseDetails = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const course = await dbAsync.get(
            `SELECT c.*, cat.name as category_name, inst.name as instructor_name, inst.bio as instructor_bio, inst.avatar_url as instructor_avatar
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.id
             LEFT JOIN instructors inst ON c.instructor_id = inst.id
             WHERE c.id = ? OR c.slug = ?`,
            [idOrSlug, idOrSlug]
        );

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        // Fetch modules and lessons
        const modules = await dbAsync.all(
            `SELECT * FROM modules WHERE course_id = ? ORDER BY order_num ASC`,
            [course.id]
        );

        for (const m of modules) {
            m.lessons = await dbAsync.all(
                `SELECT * FROM lessons WHERE module_id = ? ORDER BY order_num ASC`,
                [m.id]
            );
        }

        course.modules = modules;
        res.json({ success: true, data: course });
    } catch (error) {
        console.error('Error fetching course detail:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch course details.' });
    }
};
