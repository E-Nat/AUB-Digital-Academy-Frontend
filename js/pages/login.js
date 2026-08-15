document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';

    // 1. Toggle Password Visibility
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    }

    // 2. Real API Authentication Form Handler
    const loginForm = document.querySelector('form');
    const loginIdInput = document.getElementById('loginId');

    if (loginForm && loginIdInput && passwordInput) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const loginId = loginIdInput.value.trim();
            const password = passwordInput.value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';
            }

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ loginId, password })
                });

                const data = await res.json();

                if (res.ok && data.success && data.token) {
                    // Store session token and user profile
                    localStorage.setItem('aub_auth_token', data.token);
                    localStorage.setItem('token', data.token);
                    sessionStorage.setItem('aub_auth_token', data.token);
                    sessionStorage.setItem('token', data.token);
                    localStorage.setItem('aub_user', JSON.stringify(data.user));

                    // Role-Based Redirection
                    if (data.user.role === 'ADMIN') {
                        window.location.href = '../admin/dashboard.html';
                    } else if (data.user.role === 'TEACHER') {
                        window.location.href = '../teacher/dashboard.html';
                    } else {
                        window.location.href = '../../welcomepage.html';
                    }
                } else {
                    alert(data.message || 'Invalid credentials. Please verify your ID/Email and password.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Sign In';
                    }
                }
            } catch (err) {
                console.error('API connection error:', err);
                alert('Could not connect to backend server at ' + API_BASE + '.\nPlease ensure "node server.js" is running in the server/ directory.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
            }
        });
    }
});
