/**
 * AUB Digital Academy - Authentication & Login Controller
 * Handles credentials verification, JWT sessions, role tabs, and direct redirection.
 */

document.addEventListener('DOMContentLoaded', function () {
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    const API_BASE = (isLocal && window.location.port !== '5000') 
        ? 'http://localhost:5000/api' 
        : '/api';

    // 1. Password Visibility Toggle
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
            }
        });
    }

    // 2. Role Tabs Switching
    const roleTabs = document.getElementById('roleTabs');
    const loginIdLabel = document.getElementById('loginIdLabel');
    const loginIdInput = document.getElementById('loginId');

    if (roleTabs && loginIdLabel && loginIdInput) {
        roleTabs.addEventListener('click', function (e) {
            const tabBtn = e.target.closest('.auth-role-tab');
            if (!tabBtn) return;

            roleTabs.querySelectorAll('.auth-role-tab').forEach(b => b.classList.remove('active'));
            tabBtn.classList.add('active');

            const role = tabBtn.getAttribute('data-role');
            if (role === 'STUDENT') {
                loginIdLabel.textContent = 'Student ID or University Email';
                loginIdInput.setAttribute('placeholder', 'e.g. 202401234 or sreyneang@aub.edu.kh');
            } else if (role === 'TEACHER') {
                loginIdLabel.textContent = 'Faculty ID or University Email';
                loginIdInput.setAttribute('placeholder', 'e.g. T001 or sarah.johnson@aub.edu.kh');
            } else if (role === 'ADMIN') {
                loginIdLabel.textContent = 'Administrator Email or Staff ID';
                loginIdInput.setAttribute('placeholder', 'e.g. admin@aub.edu.com');
            }
        });
    }

    // 3. Google SSO Simulation
    const googleSsoBtn = document.getElementById('googleSsoBtn');
    if (googleSsoBtn) {
        googleSsoBtn.addEventListener('click', function () {
            // Immediately fill student credentials and authenticate directly
            fillCredentials('sreyneang@aub.edu.kh', 'student123', true);
        });
    }

    // 4. Quick Demo Account Autofill
    window.fillCredentials = function (loginId, password, autoSubmit = true) {
        const idInput = document.getElementById('loginId');
        const passInput = document.getElementById('password');
        if (idInput) idInput.value = loginId;
        if (passInput) passInput.value = password;

        hideError();

        if (autoSubmit) {
            const form = document.getElementById('loginForm');
            if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        }
    };

    // 5. Fallback Demo Accounts Store
    const fallbackAccounts = [
        {
            loginIds: ['admin@aub.edu.com', 'admin@aub.edu.kh', '10293847', 'admin', '0001000'],
            password: 'admin123',
            user: {
                id: 1,
                full_name: 'Dr. Johnathan Vance',
                email: 'admin@aub.edu.com',
                university_id: '10293847',
                role: 'ADMIN',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'
            },
            redirect: '../admin/dashboard.html'
        },
        {
            loginIds: ['sarah.johnson@aub.edu.kh', 't001', 'teacher123', 'teacher'],
            password: 'teacher123',
            user: {
                id: 7,
                full_name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@aub.edu.kh',
                university_id: 'T001',
                role: 'TEACHER',
                avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150'
            },
            redirect: '../teacher/dashboard.html'
        },
        {
            loginIds: ['sreyneang@aub.edu.kh', '202401234', 'student123', 'sok.virak@student.aub.edu.kh', '0001001', 'student'],
            password: 'student123',
            user: {
                id: 2,
                full_name: 'Sreyneang Sok',
                email: 'sreyneang@aub.edu.kh',
                university_id: '202401234',
                role: 'STUDENT',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'
            },
            redirect: '../student/dashboard.html'
        }
    ];

    function authenticateFallback(inputLoginId, inputPassword) {
        const cleanId = (inputLoginId || '').toLowerCase().trim();
        const matched = fallbackAccounts.find(acc => 
            acc.loginIds.some(id => id.toLowerCase() === cleanId) && acc.password === inputPassword
        );
        return matched || null;
    }

    // Role-based dashboard URL resolution
    function getDashboardUrl(role) {
        const r = (role || '').toUpperCase();
        if (r === 'ADMIN') {
            return '../admin/dashboard.html';
        } else if (r === 'TEACHER' || r === 'FACULTY') {
            return '../teacher/dashboard.html';
        } else {
            return '../student/dashboard.html';
        }
    }

    // Direct immediate redirect with zero post-login modal/delay
    function redirectToDashboard(user) {
        const redirectUrl = getDashboardUrl(user?.role);
        window.location.href = redirectUrl;
    }

    // Inline error helper
    function showError(message) {
        const alertEl = document.getElementById('loginAlert');
        const alertText = document.getElementById('loginAlertText');
        const msg = message || 'Invalid email or password.';

        if (alertEl && alertText) {
            alertText.textContent = msg;
            alertEl.classList.remove('d-none');
            alertEl.classList.add('d-flex');
        }
    }

    function hideError() {
        const alertEl = document.getElementById('loginAlert');
        if (alertEl) {
            alertEl.classList.add('d-none');
            alertEl.classList.remove('d-flex');
        }
    }

    // Clear inline error when the user edits fields
    if (loginIdInput) loginIdInput.addEventListener('input', hideError);
    if (passwordInput) passwordInput.addEventListener('input', hideError);

    // 6. Form Submission Handler
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    if (loginForm && loginIdInput && passwordInput) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            hideError();

            const loginId = loginIdInput.value.trim();
            const password = passwordInput.value;

            if (!loginId || !password) {
                showError('Invalid email or password.');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> <span>Signing in...</span>`;
            }

            let serverSuccess = false;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);

                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId, password }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await res.json();

                if (res.ok && data.success && data.token) {
                    serverSuccess = true;
                    const rememberMe = document.getElementById('rememberMe');
                    const storage = (rememberMe && !rememberMe.checked) ? sessionStorage : localStorage;

                    storage.setItem('aub_auth_token', data.token);
                    storage.setItem('token', data.token);
                    sessionStorage.setItem('aub_auth_token', data.token);
                    sessionStorage.setItem('token', data.token);
                    localStorage.setItem('aub_auth_token', data.token);
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('aub_user', JSON.stringify(data.user));
                    sessionStorage.setItem('aub_user', JSON.stringify(data.user));

                    // Immediately navigate to role dashboard
                    redirectToDashboard(data.user);
                    return;
                } else {
                    const fallback = authenticateFallback(loginId, password);
                    if (fallback) {
                        serverSuccess = true;
                        applyFallbackSession(fallback);
                        return;
                    }
                    showError(data.message || 'Invalid email or password.');
                }
            } catch (err) {
                const fallback = authenticateFallback(loginId, password);
                if (fallback) {
                    serverSuccess = true;
                    applyFallbackSession(fallback);
                    return;
                }
                showError('Invalid email or password.');
            } finally {
                if (!serverSuccess && submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>Sign In to Workspace</span> <i class="bi bi-arrow-right"></i>`;
                }
            }
        });
    }

    function applyFallbackSession(fallback) {
        const dummyToken = 'aub_session_token_' + btoa(JSON.stringify(fallback.user));
        localStorage.setItem('aub_auth_token', dummyToken);
        localStorage.setItem('token', dummyToken);
        sessionStorage.setItem('aub_auth_token', dummyToken);
        sessionStorage.setItem('token', dummyToken);
        localStorage.setItem('aub_user', JSON.stringify(fallback.user));
        sessionStorage.setItem('aub_user', JSON.stringify(fallback.user));

        // Immediately navigate to role dashboard
        redirectToDashboard(fallback.user);
    }
});
