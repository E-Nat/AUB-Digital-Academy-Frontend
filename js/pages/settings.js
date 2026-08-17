// ==========================================
// AUB Digital Academy - Settings & Preferences Controller
// Admin Profile, Password Management, 2FA Security, Platform Preferences & DB Backups
// Integrated with SweetAlert2 & AdminMockStore
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    // 1. Password Visibility Toggles
    document.querySelectorAll('.toggle-pass-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                const isPass = input.getAttribute('type') === 'password';
                input.setAttribute('type', isPass ? 'text' : 'password');
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
                }
            }
        });
    });

    // 2. Avatar live preview on URL input
    const avatarInput = document.getElementById('settingsAvatarUrl');
    const avatarPreview = document.getElementById('settingsAvatarPreview');
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('input', function () {
            const url = this.value.trim();
            if (url) {
                avatarPreview.src = url;
            }
        });
    }

    // 3. Hydrate Admin Profile & Platform Preferences
    function loadAdminProfile() {
        if (!window.AdminStore) return;
        const admin = window.AdminStore.getAdminUser();
        if (admin) {
            const fn = document.getElementById('settingsFullName');
            const em = document.getElementById('settingsEmail');
            const id = document.getElementById('settingsUniId');
            const ph = document.getElementById('settingsPhone');
            const av = document.getElementById('settingsAvatarUrl');
            const bio = document.getElementById('settingsBio');
            const dn = document.getElementById('settingsDisplayName');
            const de = document.getElementById('settingsDisplayEmail');
            const prev = document.getElementById('settingsAvatarPreview');

            if (fn) fn.value = admin.full_name || '';
            if (em) em.value = admin.email || '';
            if (id) id.value = admin.university_id || '10293847';
            if (ph) ph.value = admin.phone || '+855 23 999 101';
            if (av) av.value = admin.avatar_url || '';
            if (bio) bio.value = admin.bio || '';
            if (dn) dn.textContent = admin.full_name || 'Admin';
            if (de) de.textContent = admin.email || 'admin@aub.edu.com';
            if (prev && admin.avatar_url) prev.src = admin.avatar_url;

            // Sync topbar elements
            const topbarName = document.getElementById('topbarAdminName');
            const topbarAvatar = document.getElementById('topbarAvatar');
            if (topbarName) topbarName.textContent = admin.full_name || 'Admin';
            if (topbarAvatar && admin.avatar_url) topbarAvatar.src = admin.avatar_url;
        }

        // Hydrate Preferences
        const settings = window.AdminStore.getSettings();
        if (settings) {
            const an = document.getElementById('prefAcademyName');
            const pt = document.getElementById('prefPortalTitle');
            const ce = document.getElementById('prefContactEmail');
            const sm = document.getElementById('prefSemester');
            const ms = document.getElementById('prefMaintenanceSwitch');
            const es = document.getElementById('prefEmailNotifSwitch');
            const tf = document.getElementById('twoFactorSwitch');

            if (an) an.value = settings.academy_name || 'AUB Digital Academy';
            if (pt) pt.value = settings.portal_title || 'Administration Portal';
            if (ce) ce.value = settings.contact_email || 'administration@aub.edu.kh';
            if (sm) sm.value = settings.semester || 'Spring / Summer 2026';
            if (ms) ms.checked = !!settings.maintenance_mode;
            if (es) es.checked = settings.email_notifications !== false;
            if (tf) tf.checked = !!settings.two_factor_auth;
        }
    }

    loadAdminProfile();

    // 4. Handle Profile Form Submit
    const profileForm = document.getElementById('adminProfileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fullName = document.getElementById('settingsFullName').value.trim();
            const email = document.getElementById('settingsEmail').value.trim();
            const phone = document.getElementById('settingsPhone').value.trim();
            const avatarUrl = document.getElementById('settingsAvatarUrl').value.trim();
            const bio = document.getElementById('settingsBio').value.trim();

            if (!fullName || fullName.length < 2) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Validation Error', 'Please enter a valid full name (at least 2 characters).');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Invalid Email', 'Please provide a valid email address.');
                return;
            }

            if (window.AdminStore) {
                window.AdminStore.updateAdminProfile({
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150',
                    bio: bio
                });

                loadAdminProfile();
                window.AdminStore.constructor.notifySuccess('Profile Saved', `Administrator credentials for ${fullName} updated.`);
            }
        });
    }

    // 5. Handle Password Change Form
    const passForm = document.getElementById('changePasswordForm');
    if (passForm) {
        passForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const cur = document.getElementById('currentPass').value;
            const nw = document.getElementById('newPass').value;
            const cf = document.getElementById('confirmNewPass').value;

            if (!cur) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Current Password Required', 'Please enter your current security password.');
                return;
            }

            if (nw.length < 6) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Password Too Short', 'New password must be at least 6 characters long.');
                return;
            }

            if (nw !== cf) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Password Mismatch', 'New password and confirmation password do not match.');
                return;
            }

            passForm.reset();
            if (window.AdminStore) {
                window.AdminStore.constructor.notifySuccess('Password Updated', 'Your administrative security password has been changed successfully.');
            }
        });
    }

    // 6. Handle 2FA Switch
    const tfSwitch = document.getElementById('twoFactorSwitch');
    if (tfSwitch) {
        tfSwitch.addEventListener('change', function () {
            if (window.AdminStore) {
                window.AdminStore.updateSettings({ two_factor_auth: this.checked });
                window.AdminStore.constructor.toast(
                    `Two-Factor Authentication is now ${this.checked ? 'Enabled' : 'Disabled'}`,
                    this.checked ? 'success' : 'info'
                );
            }
        });
    }

    // 7. Handle Preferences Form Submit
    const prefForm = document.getElementById('preferencesForm');
    if (prefForm) {
        prefForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const academyName = document.getElementById('prefAcademyName').value.trim();
            const portalTitle = document.getElementById('prefPortalTitle').value.trim();
            const contactEmail = document.getElementById('prefContactEmail').value.trim();
            const semester = document.getElementById('prefSemester').value.trim();
            const maintenance = document.getElementById('prefMaintenanceSwitch').checked;
            const emailNotif = document.getElementById('prefEmailNotifSwitch').checked;

            if (!academyName || !portalTitle) {
                if (window.AdminStore) window.AdminStore.constructor.notifyWarning('Required Fields', 'Academy Name and Portal Title are required.');
                return;
            }

            const payload = {
                academy_name: academyName,
                portal_title: portalTitle,
                contact_email: contactEmail,
                semester: semester,
                maintenance_mode: maintenance,
                email_notifications: emailNotif
            };

            if (window.AdminStore) {
                window.AdminStore.updateSettings(payload);
                window.AdminStore.constructor.notifySuccess('Preferences Saved', 'Platform settings and preferences updated successfully.');
            }
        });
    }

    // 8. Revoke Session Handler
    window.revokeSession = async function () {
        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Revoke Session?',
                'Are you sure you want to terminate this active mobile session?',
                'Yes, Revoke',
                '#DC2626'
            );
        } else {
            confirmed = confirm('Are you sure you want to revoke this session?');
        }

        if (confirmed && window.AdminStore) {
            window.AdminStore.constructor.toast('Mobile session revoked', 'info');
        }
    };

    // 9. Export Database JSON
    window.exportDatabaseJSON = function () {
        if (!window.AdminStore) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.AdminStore.state, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', dataStr);
        link.setAttribute('download', `AUB_Academy_Database_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.AdminStore.constructor.toast('Database JSON exported successfully', 'success');
    };

    // 10. Reset Mock Data to Factory Defaults
    window.resetMockDataToDefaults = async function () {
        let confirmed = false;
        if (window.AdminStore) {
            confirmed = await window.AdminStore.constructor.confirmDialog(
                'Reset Demo Data to Defaults?',
                'This will restore all users, courses, chapters, programs, instructors, enrollments, and statistics back to clean factory default mock data.',
                'Yes, Reset All Data',
                '#DC2626'
            );
        } else {
            confirmed = confirm('Reset all data to defaults?');
        }

        if (confirmed && window.AdminStore) {
            window.AdminStore.resetToDefaults();
            await window.AdminStore.constructor.notifySuccess('Data Reset Complete', 'All demo data has been restored to factory defaults.');
            window.location.reload();
        }
    };
});
