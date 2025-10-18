// assets/js/app/auth-controller.js

import { navigateToUrl } from '../core/url-manager.js';
import { showNotification } from '../managers/notification-manager.js';
import { applyTranslations } from '../managers/language-manager.js';
import * as api from '../core/api-handler.js';

function getInitials(name) {
    if (!name) return '';
    const words = name.split(/[\s_]+/);
    if (words.length > 1 && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function displayAuthErrors(containerId, listId, messages) {
    const container = document.getElementById(containerId);
    const list = document.getElementById(listId);

    if (!container || !list) return;

    list.innerHTML = '';

    if (!messages || messages.length === 0) {
        container.style.display = 'none';
        return;
    }

    const errorMessages = Array.isArray(messages) ? messages : [messages];

    errorMessages.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        list.appendChild(li);
    });

    container.style.display = 'block';
}

async function fetchAndSetCsrfToken(formId) {
    const response = await api.getCsrfToken();
    if (response.ok) {
        const form = document.getElementById(formId);
        if (form) {
            const tokenInput = form.querySelector('input[name="csrf_token"]');
            if (tokenInput) {
                tokenInput.value = response.data.csrf_token;
            }
        }
    } else {
        console.error('Error fetching CSRF token:', response.data);
    }
}

function updateUserUI(userData) {
    const loggedOutContainer = document.getElementById('auth-container-logged-out');
    const loggedInContainer = document.getElementById('auth-container-logged-in');
    const helpBtn = document.getElementById('help-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const profileBtn = loggedInContainer ? loggedInContainer.querySelector('.profile-btn') : null;
    const adminPanelLink = document.querySelector('[data-action="toggleAdminPanel"]');
    const authRequiredLinks = document.querySelectorAll('.auth-required');
    const isLoggedIn = !!userData;

    const adminOnlyLinks = document.querySelectorAll('.admin-only');
    const moderatorOnlyLinks = document.querySelectorAll('.moderator-only');

    if (userData && profileBtn) {
        loggedOutContainer.classList.add('disabled');
        loggedInContainer.classList.remove('disabled');
        helpBtn.classList.add('disabled');
        settingsBtn.classList.add('disabled');
        authRequiredLinks.forEach(link => link.classList.remove('disabled'));

        const initialsSpan = profileBtn.querySelector('.profile-initials');

        profileBtn.classList.remove('profile-btn--user', 'profile-btn--moderator', 'profile-btn--administrator', 'profile-btn--founder');
        profileBtn.classList.add(`profile-btn--${userData.role || 'user'}`);
        
        if (userData.profile_picture_url) {
            initialsSpan.textContent = '';
            profileBtn.style.backgroundImage = `url('${window.BASE_PATH}/${userData.profile_picture_url}')`;
            profileBtn.classList.add('profile-btn--image');
        } else {
            initialsSpan.textContent = getInitials(userData.username);
            profileBtn.style.backgroundImage = 'none';
            profileBtn.classList.remove('profile-btn--image');
        }

        profileBtn.dataset.userRole = userData.role || 'user';

        const hasAdminAccess = ['administrator', 'founder'].includes(userData.role);
        const hasModeratorAccess = ['administrator', 'founder', 'moderator'].includes(userData.role);

        if (adminPanelLink) {
            adminPanelLink.style.display = hasModeratorAccess ? 'flex' : 'none';
        }
        
        adminOnlyLinks.forEach(link => {
            link.classList.toggle('disabled', !hasAdminAccess);
        });
        
        moderatorOnlyLinks.forEach(link => {
            link.classList.toggle('disabled', !hasModeratorAccess);
        });

    } else {
        loggedOutContainer.classList.remove('disabled');
        loggedInContainer.classList.add('disabled');
        helpBtn.classList.remove('disabled');
        settingsBtn.classList.remove('disabled');
        authRequiredLinks.forEach(link => link.classList.add('disabled'));

        if (profileBtn) {
            profileBtn.className = 'header-button profile-btn';
            profileBtn.style.backgroundImage = 'none';
            profileBtn.classList.remove('profile-btn--image');
            const initialsSpan = profileBtn.querySelector('.profile-initials');
            if(initialsSpan) initialsSpan.textContent = '';
        }

        if (adminPanelLink) {
            adminPanelLink.style.display = 'none';
        }
        adminOnlyLinks.forEach(link => link.classList.add('disabled'));
        moderatorOnlyLinks.forEach(link => link.classList.add('disabled'));
    }
    
    window.dispatchEvent(new CustomEvent('authChange', { detail: { isLoggedIn } }));
    applyTranslations(document.querySelector('.header-right'));
    applyTranslations(document.querySelector('[data-module="moduleSurface"]'));
}

async function handleLogin(form) {
    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value.trim();
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-login"]');

    let errors = [];
    if (!email) errors.push(window.getTranslation('auth.errors.emailRequired'));
    if (!password) errors.push(window.getTranslation('auth.errors.passwordRequired'));

    if (errors.length > 0) {
        displayAuthErrors('login-error-container', 'login-error-list', errors);
        return;
    }

    displayAuthErrors('login-error-container', 'login-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'login_user');
    formData.append('email', email);
    formData.append('password', password);
    formData.append('csrf_token', csrfToken);

    const response = await api.loginUser(formData);
    button.classList.remove('loading');

    if (response.ok) {
        updateUserUI(response.data.user);
        showNotification(window.getTranslation('auth.loginSuccess'), 'success');
        
        window.dispatchEvent(new CustomEvent('authSuccess'));

        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'main', section: 'home' } }));
    } else {
        const errorResult = response.data;
        let errorMessage = errorResult.message;
        if (response.status === 429) {
            const minutes = errorMessage.match(/\d+/)?.[0] || 'unos';
            errorMessage = window.getTranslation('auth.errors.tooManyRequests', { minutes });
        } else {
            const translationKey = `auth.errors.${errorMessage}`;
            const translated = window.getTranslation(translationKey);
            errorMessage = (translated !== translationKey) ? translated : 'Credenciales incorrectas.';
        }
        displayAuthErrors('login-error-container', 'login-error-list', errorMessage);
        fetchAndSetCsrfToken('login-form');
    }
}

async function handleRegisterStep1(form) {
    let username = form.querySelector('#register-username').value.trim();
    const email = form.querySelector('#register-email').value.trim();
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-register"]');

    username = username.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
    form.querySelector('#register-username').value = username;

    let errors = [];
    const allowedDomains = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'];

    if (!username) errors.push(window.getTranslation('auth.errors.usernameRequired'));
    else if (username.length > 24) errors.push('El nombre de usuario no puede tener más de 24 caracteres.');
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push('El nombre de usuario solo puede contener letras, números y guiones bajos (_).');

    if (!email) errors.push(window.getTranslation('auth.errors.emailRequired'));
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.push(window.getTranslation('auth.errors.emailInvalid'));
    else if (!allowedDomains.some(domain => email.endsWith(domain))) errors.push('Solo se permiten correos de Gmail, Outlook, Hotmail o Yahoo.');

    if (errors.length > 0) {
        displayAuthErrors('register-error-container', 'register-error-list', errors);
        return;
    }

    displayAuthErrors('register-error-container', 'register-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'register_user_step1');
    formData.append('username', username);
    formData.append('email', email);
    formData.append('csrf_token', csrfToken);

    const response = await api.registerUser(formData);
    button.classList.remove('loading');

    if (response.ok) {
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'register', data: { step: 'password' } } }));
    } else {
        displayAuthErrors('register-error-container', 'register-error-list', response.data.message);
        fetchAndSetCsrfToken('register-form');
    }
}

async function handleRegisterStep2(form) {
    const password = form.querySelector('#register-password').value;
    const confirmPassword = form.querySelector('#register-confirm-password').value;
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-register"]');

    let errors = [];
    if (!password) errors.push(window.getTranslation('auth.errors.passwordRequired'));
    else if (password.length < 6) errors.push(window.getTranslation('auth.errors.passwordTooShort'));
    if (password !== confirmPassword) errors.push(window.getTranslation('notifications.passwordMismatch'));

    if (errors.length > 0) {
        displayAuthErrors('register-error-container', 'register-error-list', errors);
        return;
    }

    displayAuthErrors('register-error-container', 'register-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'register_user_step2');
    formData.append('password', password);
    formData.append('confirm_password', confirmPassword);
    formData.append('csrf_token', csrfToken);

    const response = await api.registerUser(formData);
    button.classList.remove('loading');

    if (response.ok) {
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'register', data: { step: 'verify-code' } } }));
    } else {
        displayAuthErrors('register-error-container', 'register-error-list', response.data.message);
        fetchAndSetCsrfToken('register-form');
    }
}

async function handleVerifyRegistrationCode(form) {
    const code = form.querySelector('#register-code').value.replace('-', '').trim();
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-register"]');

    if (!code) {
        displayAuthErrors('register-error-container', 'register-error-list', [window.getTranslation('auth.errors.codeRequired')]);
        return;
    }

    displayAuthErrors('register-error-container', 'register-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'verify_registration_code');
    formData.append('code', code);
    formData.append('csrf_token', csrfToken);

    const response = await api.verifyRegistrationCode(formData);
    button.classList.remove('loading');

    if (response.ok) {
        updateUserUI(response.data.user);
        showNotification(window.getTranslation('auth.registerSuccess'), 'success');

        window.dispatchEvent(new CustomEvent('authSuccess'));

        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'main', section: 'home' } }));
    } else {
        displayAuthErrors('register-error-container', 'register-error-list', response.data.message);
        fetchAndSetCsrfToken('register-form');
    }
}

async function handleForgotPassword(form) {
    const email = form.querySelector('#forgot-email').value.trim();
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-forgot-password"]');

    if (!email) {
        displayAuthErrors('forgot-error-container', 'forgot-error-list', [window.getTranslation('auth.errors.emailRequired')]);
        return;
    }

    displayAuthErrors('forgot-error-container', 'forgot-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'forgot_password');
    formData.append('email', email);
    formData.append('csrf_token', csrfToken);

    const response = await api.forgotPassword(formData);
    button.classList.remove('loading');

    if (response.ok) {
        showNotification(response.data.message, 'success');
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'forgotPassword', data: { step: 'enter-code', email: email } } }));
    } else {
        let errorMessage = response.data?.message || window.getTranslation('general.connectionErrorMessage');
        if (response.status === 429) {
            const minutes = errorMessage.match(/\d+/)?.[0] || 'unos';
            errorMessage = window.getTranslation('auth.errors.tooManyCodeRequests', { minutes });
        }
        displayAuthErrors('forgot-error-container', 'forgot-error-list', errorMessage);
        fetchAndSetCsrfToken('forgot-password-form');
    }
}

async function handleVerifyResetCode(form) {
    const email = form.querySelector('#reset-email').value.trim();
    const code = form.querySelector('#reset-code').value.trim();
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-forgot-password"]');

    if (!code) {
        displayAuthErrors('forgot-error-container', 'forgot-error-list', [window.getTranslation('auth.errors.codeRequired')]);
        return;
    }

    displayAuthErrors('forgot-error-container', 'forgot-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'verify_reset_code');
    formData.append('email', email);
    formData.append('code', code);
    formData.append('csrf_token', csrfToken);

    const response = await api.verifyResetCode(formData);
    button.classList.remove('loading');

    if (response.ok) {
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'forgotPassword', data: { step: 'new-password', email: email, code: code } } }));
    } else {
        displayAuthErrors('forgot-error-container', 'forgot-error-list', response.data.message);
        fetchAndSetCsrfToken('forgot-password-form');
    }
}

async function handleUpdatePasswordFromReset(form) {
    const email = form.querySelector('#reset-email').value.trim();
    const code = form.querySelector('#reset-code').value.trim();
    const newPassword = form.querySelector('#reset-password').value;
    const confirmPassword = form.querySelector('#reset-confirm-password').value;
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-forgot-password"]');

    let errors = [];
    if (!newPassword) errors.push(window.getTranslation('auth.errors.passwordRequired'));
    if (newPassword.length < 6) errors.push(window.getTranslation('auth.errors.passwordTooShort'));
    if (newPassword !== confirmPassword) errors.push(window.getTranslation('notifications.passwordMismatch'));

    if (errors.length > 0) {
        displayAuthErrors('forgot-error-container', 'forgot-error-list', errors);
        return;
    }

    displayAuthErrors('forgot-error-container', 'forgot-error-list', []);
    button.classList.add('loading');

    const formData = new FormData();
    formData.append('action_type', 'reset_password');
    formData.append('email', email);
    formData.append('code', code);
    formData.append('new_password', newPassword);
    formData.append('csrf_token', csrfToken);

    const response = await api.resetPassword(formData);
    button.classList.remove('loading');

    if (response.ok) {
        showNotification(response.data.message, 'success');
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'login' } }));
    } else {
        let errorMessage = response.data?.message || window.getTranslation('general.connectionErrorMessage');
        if (response.status === 429) {
            const minutes = errorMessage.match(/\d+/)?.[0] || 'unos';
            errorMessage = window.getTranslation('auth.errors.tooManyRequests', { minutes });
        }
        displayAuthErrors('forgot-error-container', 'forgot-error-list', errorMessage);
        fetchAndSetCsrfToken('forgot-password-form');
    }
}

async function handleLogout() {
    const response = await api.logoutUser();
    if (response.ok && response.data.success) {
        updateUserUI(null);
        showNotification(window.getTranslation('auth.logoutSuccess'));

        const protectedPaths = [
            'settings',
            'favorites',
            'admin'
        ];

        const currentPath = window.location.pathname.replace(window.BASE_PATH || '', '').replace(/^\//, '');

        const isProtected = protectedPaths.some(path => currentPath.startsWith(path));

        if (isProtected) {
            window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'main', section: 'home' } }));
        }

    } else {
        console.error('Error logging out:', response.data);
    }
}

export function initAuthController(sessionData) {
    if (sessionData && sessionData.loggedin) {
        updateUserUI(sessionData.user);
    } else {
        updateUserUI(null);
        if (sessionData) {
            if (sessionData.status === 'suspended') {
                showNotification(window.getTranslation('auth.errors.accountSuspended'), 'error');
            } else if (sessionData.status === 'deleted') {
                showNotification(window.getTranslation('auth.errors.accountDeleted'), 'error');
            }
        }
    }

    document.addEventListener('click', (event) => {
        const actionTarget = event.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;

        switch (action) {
            case 'submit-login': {
                const loginForm = document.getElementById('login-form');
                if (loginForm) handleLogin(loginForm);
                break;
            }
            case 'submit-register': {
                const registerForm = document.getElementById('register-form');
                if (registerForm) {
                    const currentStep = registerForm.dataset.step || 'user-info';
                    if (currentStep === 'user-info') handleRegisterStep1(registerForm);
                    else if (currentStep === 'password') handleRegisterStep2(registerForm);
                    else if (currentStep === 'verify-code') handleVerifyRegistrationCode(registerForm);
                }
                break;
            }
            case 'submit-forgot-password': {
                const forgotPasswordForm = document.getElementById('forgot-password-form');
                if (forgotPasswordForm) {
                    const currentStep = forgotPasswordForm.dataset.step || 'enter-email';
                    if (currentStep === 'enter-email') handleForgotPassword(forgotPasswordForm);
                    else if (currentStep === 'enter-code') handleVerifyResetCode(forgotPasswordForm);
                    else if (currentStep === 'new-password') handleUpdatePasswordFromReset(forgotPasswordForm);
                }
                break;
            }
            case 'logout':
                handleLogout();
                break;
        }
    });

    window.auth = {
        fetchAndSetCsrfToken,
        updateUserUI
    };
}