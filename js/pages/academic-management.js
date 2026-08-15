// Academic Management JavaScript (Vanilla JS)
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    function getAuthToken() {
        return localStorage.getItem('aub_auth_token') || 
               localStorage.getItem('token') || 
               sessionStorage.getItem('aub_auth_token') || 
               sessionStorage.getItem('token') || '';
    }

    function getHeaders() {
        const token = getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    loadPrograms();
    loadCourses();
    loadCategories();
    loadInstructors();

    // 1. PROGRAMS
    async function loadPrograms() {
        try {
            const res = await fetch(`${API_BASE}/admin/programs`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success && data.data) {
                renderProgramsTable(data.data);
            }
        } catch (e) {
            console.error('Error loading programs:', e);
        }
    }

    function renderProgramsTable(programs) {
        const tbody = document.getElementById('programsTableBody');
        if (!tbody) return;

        tbody.innerHTML = programs.map(p => `
            <tr>
                <td class="text-muted fw-bold">#${p.order_num || 1}</td>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="rounded-3 p-2 d-flex align-items-center justify-content-center bg-light" style="width: 38px; height: 38px;">
                            <i class="bi ${escapeHtml(p.icon_class || 'bi-laptop')} text-primary"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark">${escapeHtml(p.title)}</div>
                            <div class="text-xs text-muted">${escapeHtml(p.slug)}</div>
                        </div>
                    </div>
                </td>
                <td class="text-muted fw-semibold text-xs">${escapeHtml(p.degree_type)}</td>
                <td class="text-muted">${escapeHtml(p.duration)}</td>
                <td><span class="badge ${escapeHtml(p.theme_class)} px-2 py-1 rounded-pill" style="background:#e2e8f0; color:#334155;">${escapeHtml(p.theme_class)}</span></td>
                <td>
                    <button class="btn btn-sm ${p.is_published ? 'btn-success' : 'btn-secondary'} rounded-pill text-xs fw-bold px-3 py-1" onclick="toggleProgramStatus(${p.id})">
                        ${p.is_published ? 'Published' : 'Draft'}
                    </button>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="action-btn" title="Edit" onclick="editProgram(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" title="Delete" onclick="deleteProgram(${p.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Program Form Submit
    const programForm = document.getElementById('programForm');
    if (programForm) {
        programForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const token = getAuthToken();
            if (!token) {
                alert('Authentication required. Please log in as an administrator.');
                window.location.href = '../authentication/login.html';
                return;
            }

            const id = document.getElementById('programId').value;
            const payload = {
                title: document.getElementById('programTitle').value,
                degree_type: document.getElementById('programDegree').value,
                duration: document.getElementById('programDuration').value,
                icon_class: document.getElementById('programIcon').value,
                theme_class: document.getElementById('programTheme').value,
                description: document.getElementById('programDesc').value,
                detail_url: document.getElementById('programUrl').value,
                order_num: parseInt(document.getElementById('programOrder').value) || 1,
                is_published: document.getElementById('programPublished').checked ? 1 : 0
            };

            const url = id ? `${API_BASE}/admin/programs/${id}` : `${API_BASE}/admin/programs`;
            const method = id ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();
                if (result.success) {
                    bootstrap.Modal.getInstance(document.getElementById('createProgramModal')).hide();
                    programForm.reset();
                    document.getElementById('programId').value = '';
                    loadPrograms();
                } else {
                    alert(result.message || 'Failed to save program.');
                }
            } catch (err) {
                alert('Error saving program: ' + err.message);
            }
        });
    }

    window.toggleProgramStatus = async function (id) {
        const token = getAuthToken();
        if (!token) {
            alert('Please log in first.');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/admin/programs/${id}/toggle-publish`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) loadPrograms();
        } catch (e) {
            console.error(e);
        }
    };

    window.deleteProgram = async function (id) {
        const token = getAuthToken();
        if (!token) {
            alert('Please log in first.');
            return;
        }
        if (!confirm('Are you sure you want to delete this program?')) return;
        try {
            const res = await fetch(`${API_BASE}/admin/programs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) loadPrograms();
        } catch (e) {
            console.error(e);
        }
    };

    window.editProgram = function (p) {
        document.getElementById('programId').value = p.id;
        document.getElementById('programTitle').value = p.title;
        document.getElementById('programDegree').value = p.degree_type;
        document.getElementById('programDuration').value = p.duration;
        document.getElementById('programIcon').value = p.icon_class;
        document.getElementById('programTheme').value = p.theme_class;
        document.getElementById('programDesc').value = p.description;
        document.getElementById('programUrl').value = p.detail_url || '';
        document.getElementById('programOrder').value = p.order_num || 1;
        document.getElementById('programPublished').checked = p.is_published === 1;
        document.getElementById('programModalTitle').textContent = 'Edit Featured Program';

        new bootstrap.Modal(document.getElementById('createProgramModal')).show();
    };

    // 2. COURSES
    async function loadCourses() {
        try {
            const res = await fetch(`${API_BASE}/admin/courses`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success && data.data) {
                renderCoursesTable(data.data);
            }
        } catch (e) {
            console.error('Error loading courses:', e);
        }
    }

    function renderCoursesTable(courses) {
        const tbody = document.getElementById('coursesTableBody');
        if (!tbody) return;

        tbody.innerHTML = courses.map(c => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="../../${escapeHtml(c.thumbnail_url)}" class="rounded-3 object-fit-cover" style="width: 48px; height: 36px;" onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=100'">
                        <div>
                            <div class="fw-bold text-dark">${escapeHtml(c.title)}</div>
                            <div class="text-xs text-muted"><i class="bi bi-star-fill text-warning me-1"></i>${c.rating || '4.8'} (${c.enrolled_students_count || 0} students)</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill">${escapeHtml(c.category_name || 'General')}</span></td>
                <td class="text-muted">${escapeHtml(c.instructor_name || 'Faculty Staff')}</td>
                <td class="text-muted">${c.lesson_count || 12} Lessons</td>
                <td><span class="badge bg-light text-dark border px-2 py-1">${escapeHtml(c.difficulty || 'Beginner')}</span></td>
                <td>
                    <button class="btn btn-sm ${c.is_published ? 'btn-success' : 'btn-secondary'} rounded-pill text-xs fw-bold px-3 py-1" onclick="toggleCourseStatus(${c.id})">
                        ${c.is_published ? 'Published' : 'Draft'}
                    </button>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="action-btn delete" onclick="deleteCourse(${c.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.toggleCourseStatus = async function (id) {
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/admin/courses/${id}/toggle-publish`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) loadCourses();
        } catch (e) {
            console.error(e);
        }
    };

    window.deleteCourse = async function (id) {
        const token = getAuthToken();
        if (!token) return;
        if (!confirm('Delete this course?')) return;
        try {
            const res = await fetch(`${API_BASE}/admin/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) loadCourses();
        } catch (e) {
            console.error(e);
        }
    };

    // 3. CATEGORIES & INSTRUCTORS
    async function loadCategories() {
        try {
            const res = await fetch(`${API_BASE}/admin/categories`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success && data.data) {
                const tbody = document.getElementById('categoriesTableBody');
                if (tbody) {
                    tbody.innerHTML = data.data.map(c => `
                        <tr>
                            <td class="text-muted fw-bold">#${c.id}</td>
                            <td class="fw-bold">${escapeHtml(c.name)}</td>
                            <td class="text-muted">${escapeHtml(c.slug)}</td>
                            <td><i class="bi ${escapeHtml(c.icon)} text-primary fs-5"></i></td>
                            <td>${c.order_num}</td>
                            <td>
                                <button class="action-btn delete" onclick="deleteCategory(${c.id})"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');
                }
                const select = document.getElementById('courseCategorySelect');
                if (select) {
                    select.innerHTML = data.data.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function loadInstructors() {
        try {
            const res = await fetch(`${API_BASE}/admin/instructors`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success && data.data) {
                const tbody = document.getElementById('instructorsTableBody');
                if (tbody) {
                    tbody.innerHTML = data.data.map(i => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${escapeHtml(i.avatar_url)}" class="rounded-circle object-fit-cover" style="width: 40px; height: 40px;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'">
                                    <div class="fw-bold text-dark">${escapeHtml(i.name)}</div>
                                </div>
                            </td>
                            <td class="text-muted text-sm">${escapeHtml(i.title || '')}</td>
                            <td class="text-muted text-sm">${escapeHtml(i.email || '')}</td>
                            <td><span class="badge bg-light text-secondary border px-2 py-1 text-xs">${escapeHtml(i.expertise || '')}</span></td>
                            <td>
                                <button class="action-btn delete" onclick="deleteInstructor(${i.id})"><i class="bi bi-trash"></i></button>
                            </td>
                        </tr>
                    `).join('');
                }
                const select = document.getElementById('courseInstructorSelect');
                if (select) {
                    select.innerHTML = data.data.map(i => `<option value="${i.id}">${escapeHtml(i.name)}</option>`).join('');
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
