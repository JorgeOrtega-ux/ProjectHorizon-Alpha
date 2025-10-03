// assets/js/main-controller.js

import { generateUrl, navigateToUrl, setupPopStateHandler, setInitialHistoryState } from './url-manager.js';
import { setTheme, updateThemeSelectorUI } from './theme-manager.js';
import { setLanguage, updateLanguageSelectorUI, applyTranslations } from './language-manager.js';
import { initTooltips } from './tooltip-manager.js';
import { showNotification } from './notification-manager.js';
import * as api from './api-handler.js';

function getFavorites() {
    const favorites = localStorage.getItem('favoritePhotos');
    return favorites ? JSON.parse(favorites) : [];
}

function getHistory() {
    const historyString = localStorage.getItem('viewHistory');
    const defaultHistory = { profiles: [], photos: [], searches: [] };
    if (historyString) {
        const savedHistory = JSON.parse(historyString);
        return { ...defaultHistory, ...savedHistory };
    }
    return defaultHistory;
}

function addToHistory(type, data) {
    const isHistoryEnabled = localStorage.getItem('enable-view-history') !== 'false';
    if (!isHistoryEnabled) return;

    let history = getHistory();
    const now = Date.now();

    const existingIndex = history[type].findIndex(item => item.id === data.id);
    if (existingIndex > -1) {
        history[type].splice(existingIndex, 1);
    }

    history[type].unshift({ ...data, visited_at: now });

    const MAX_HISTORY_ITEMS = 50;
    if (history[type].length > MAX_HISTORY_ITEMS) {
        history[type] = history[type].slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem('viewHistory', JSON.stringify(history));
}

function addSearchToHistory(term, section) {
    const isSearchHistoryEnabled = localStorage.getItem('enable-search-history') !== 'false';
    if (!term || !isSearchHistoryEnabled) return;

    let history = getHistory();
    const now = Date.now();

    const existingIndex = history.searches.findIndex(item => item.term.toLowerCase() === term.toLowerCase() && item.section === section);
    if (existingIndex > -1) {
        history.searches.splice(existingIndex, 1);
    }

    history.searches.unshift({ term, section, searched_at: now });

    const MAX_SEARCH_HISTORY = 100;
    if (history.searches.length > MAX_SEARCH_HISTORY) {
        history.searches = history.searches.slice(0, MAX_SEARCH_HISTORY);
    }

    localStorage.setItem('viewHistory', JSON.stringify(history));
}


export function initMainController() {
    console.log("Fotos favoritas guardadas:");
    console.table(getFavorites());
    console.log("Historial de visualización:");
    console.table(getHistory());


    let currentAppView = null;
    let currentAppSection = null;

    let currentSortBy = 'relevant';
    let searchDebounceTimer;
    let currentGalleryForPhotoView = null;
    let currentGalleryNameForPhotoView = null;
    let currentGalleryPhotoList = [];
    let currentTrendingPhotosList = [];
    let currentHistoryPhotosList = [];
    let currentPhotoData = null;
    let lastVisitedView = null;
    let lastVisitedData = null;
    let adCountdownInterval = null;
    let photoAfterAd = null;
    let galleryAfterAd = null;
    let unlockCountdownInterval = null;

    let currentPhotoViewList = [];
    let currentRotation = 0;

    let galleriesCurrentPage = 1;
    let photosCurrentPage = 1;
    let adminUsersCurrentPage = 1;
    let adminGalleriesCurrentPage = 1;
    let isLoadingGalleries = false;
    let isLoadingPhotos = false;
    let isLoadingAdminUsers = false;
    let isLoadingAdminGalleries = false;
    const BATCH_SIZE = 20;
    const ADMIN_USERS_BATCH_SIZE = 25;
    const ADMIN_GALLERIES_BATCH_SIZE = 25;

    const HISTORY_PROFILES_BATCH = 20;
    const HISTORY_PHOTOS_BATCH = 20;
    const HISTORY_SEARCHES_BATCH = 25;
    let historyProfilesShown = HISTORY_PROFILES_BATCH;
    let historyPhotosShown = HISTORY_PHOTOS_BATCH;
    let historySearchesShown = HISTORY_SEARCHES_BATCH;

    let currentFavoritesSortBy = 'user';
    let currentFavoritesList = [];

    let adCooldownActive = false;
    let adContext = 'navigation';
    let adStep = 1; // Variable de estado para los anuncios

    const loaderHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    let activeScrollHandlers = [];

    // --- FUNCIONES DE AUTENTICACIÓN ---

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

    function getInitials(name) {
        if (!name) return '';
        const words = name.split(' ');
        if (words.length > 1) {
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

    function updateUserUI(userData) {
        const loggedOutContainer = document.getElementById('auth-container-logged-out');
        const loggedInContainer = document.getElementById('auth-container-logged-in');
        const helpBtn = document.getElementById('help-btn');
        const settingsBtn = document.getElementById('settings-btn');
        const profileBtn = loggedInContainer ? loggedInContainer.querySelector('.profile-btn') : null;
        const adminPanelLink = document.querySelector('[data-action="toggleAdminPanel"]');

        const authRequiredLinks = document.querySelectorAll('.auth-required');

        if (userData && profileBtn) {
            loggedOutContainer.classList.add('disabled');
            loggedInContainer.classList.remove('disabled');
            helpBtn.classList.add('disabled');
            settingsBtn.classList.add('disabled');

            authRequiredLinks.forEach(link => link.classList.remove('disabled'));

            const initialsSpan = profileBtn.querySelector('.profile-initials');
            initialsSpan.textContent = getInitials(userData.username);

            profileBtn.classList.remove('profile-btn--user', 'profile-btn--moderator', 'profile-btn--administrator');
            profileBtn.classList.add(`profile-btn--${userData.role || 'user'}`);
            profileBtn.dataset.userRole = userData.role || 'user';

            if (adminPanelLink) {
                if (userData.role === 'administrator') {
                    adminPanelLink.style.display = 'flex';
                } else {
                    adminPanelLink.style.display = 'none';
                }
            }

        } else {
            loggedOutContainer.classList.remove('disabled');
            loggedInContainer.classList.add('disabled');
            helpBtn.classList.remove('disabled');
            settingsBtn.classList.remove('disabled');

            authRequiredLinks.forEach(link => link.classList.add('disabled'));

            if (profileBtn) {
                profileBtn.classList.remove('profile-btn--user', 'profile-btn--moderator', 'profile-btn--administrator');
            }
            if (adminPanelLink) {
                adminPanelLink.style.display = 'none';
            }
        }
        applyTranslations(document.querySelector('.header-right'));
    }
    async function checkSessionStatus() {
        const response = await api.checkSession();
        if (response.ok && response.data.loggedin) {
            updateUserUI(response.data.user);
        } else {
            updateUserUI(null);
            if (response.data && response.data.status === 'suspended') {
                showNotification(window.getTranslation('auth.errors.accountSuspended'), 'error');
            } else if (response.data && response.data.status === 'deleted') {
                showNotification(window.getTranslation('auth.errors.accountDeleted'), 'error');
            }
        }
    }

 async function handleLogin(form) {
    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value.trim();
    const csrfToken = form.querySelector('input[name="csrf_token"]').value;
    const button = form.querySelector('[data-action="submit-login"]');

    let errors = [];
    if (!email) {
        errors.push(window.getTranslation('auth.errors.emailRequired'));
    }
    if (!password) {
        errors.push(window.getTranslation('auth.errors.passwordRequired'));
    }

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
        const result = response.data;
        updateUserUI(result.user);
        showNotification(window.getTranslation('auth.loginSuccess'), 'success');
        navigateToUrl('main', 'home');
        handleStateChange('main', 'home');
    } else {
        const errorResult = response.data;
        let errorMessage = errorResult.message;
        
        if (response.status === 429) {
            const minutes = errorMessage.match(/\d+/)[0];
            errorMessage = window.getTranslation('auth.errors.tooManyRequests', { minutes: minutes });
        } else if (errorMessage === 'account_suspended') {
            errorMessage = window.getTranslation('auth.errors.accountSuspended');
        } else if (errorMessage === 'account_deleted') {
            errorMessage = window.getTranslation('auth.errors.accountDeleted');
        }

        displayAuthErrors('login-error-container', 'login-error-list', errorMessage);
        fetchAndSetCsrfToken('login-form');
    }
}

    async function handleRegister(form) {
        const username = form.querySelector('#register-username').value.trim();
        const email = form.querySelector('#register-email').value.trim();
        const password = form.querySelector('#register-password').value.trim();
        const csrfToken = form.querySelector('input[name="csrf_token"]').value;
        const button = form.querySelector('[data-action="submit-register"]');

        let errors = [];
        if (!username) {
            errors.push(window.getTranslation('auth.errors.usernameRequired'));
        }
        if (!email) {
            errors.push(window.getTranslation('auth.errors.emailRequired'));
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            errors.push(window.getTranslation('auth.errors.emailInvalid'));
        }
        if (!password) {
            errors.push(window.getTranslation('auth.errors.passwordRequired'));
        } else if (password.length < 6) {
            errors.push(window.getTranslation('auth.errors.passwordTooShort'));
        }

        if (errors.length > 0) {
            displayAuthErrors('register-error-container', 'register-error-list', errors);
            return;
        }

        displayAuthErrors('register-error-container', 'register-error-list', []);
        button.classList.add('loading');

        const formData = new FormData();
        formData.append('action_type', 'register_user');
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('csrf_token', csrfToken);

        const response = await api.registerUser(formData);
        button.classList.remove('loading');

        if (response.ok) {
            const result = response.data;
            updateUserUI(result.user);
            showNotification(window.getTranslation('auth.registerSuccess'), 'success');
            navigateToUrl('main', 'home');
            handleStateChange('main', 'home');
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
            navigateToUrl('auth', 'forgotPassword', { step: 'enter-code', email: email });
            handleStateChange('auth', 'forgotPassword', true, { step: 'enter-code', email: email });
        } else {
            let errorMessage = response.data?.message || window.getTranslation('general.connectionErrorMessage');
            if (response.status === 429) {
                const minutes = errorMessage.match(/\d+/)[0];
                errorMessage = window.getTranslation('auth.errors.tooManyCodeRequests', { minutes: minutes });
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
            navigateToUrl('auth', 'forgotPassword', { step: 'new-password', email: email, code: code });
            handleStateChange('auth', 'forgotPassword', true, { step: 'new-password', email: email, code: code });
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
            navigateToUrl('auth', 'login');
            handleStateChange('auth', 'login');
        } else {
            let errorMessage = response.data?.message || window.getTranslation('general.connectionErrorMessage');
             if (response.status === 429) {
                const minutes = errorMessage.match(/\d+/)[0];
                errorMessage = window.getTranslation('auth.errors.tooManyRequests', { minutes: minutes });
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
            if (currentAppView === 'settings' || currentAppView === 'help' || currentAppView === 'admin') {
                navigateToUrl('main', 'home');
                handleStateChange('main', 'home');
            }
        } else {
            console.error('Error logging out:', response.data);
        }
    }

    function showCustomConfirm(title, message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-confirm-overlay');
            const titleEl = document.getElementById('custom-confirm-title');
            const messageEl = document.getElementById('custom-confirm-message');
            const cancelBtn = document.getElementById('custom-confirm-cancel');
            const okBtn = document.getElementById('custom-confirm-ok');

            titleEl.textContent = title;
            messageEl.innerHTML = message;

            applyTranslations(overlay);

            overlay.classList.remove('disabled');

            const close = (value) => {
                overlay.classList.add('disabled');
                cancelBtn.onclick = null;
                okBtn.onclick = null;
                resolve(value);
            };

            cancelBtn.onclick = () => close(false);
            okBtn.onclick = () => close(true);
        });
    }

    async function showUpdatePasswordDialog() {
        const overlay = document.getElementById('update-password-overlay');
        const titleEl = document.getElementById('update-password-title');
        const contentEl = document.getElementById('update-password-content');
        const cancelBtn = document.getElementById('update-password-cancel');
        const okBtn = document.getElementById('update-password-ok');

        let currentStep = 'verify';

        const sessionResponse = await api.checkSession();
        if (!sessionResponse.ok || !sessionResponse.data.loggedin) {
            return;
        }
        const user = sessionResponse.data.user;
        const userInitial = getInitials(user.username);

        const closeDialog = () => {
            overlay.classList.add('disabled');
            cancelBtn.onclick = null;
            okBtn.onclick = null;
            overlay.querySelector('.dialog-icon')?.remove();
        };

        const renderStep = async () => {
            const tokenResponse = await api.getCsrfToken();
            if (!tokenResponse.ok) {
                showNotification("No se pudo iniciar la acción. Inténtalo de nuevo.", "error");
                return;
            }
            const csrf_token = tokenResponse.data.csrf_token;

            titleEl.innerHTML = '';

            if (currentStep === 'verify') {
                titleEl.insertAdjacentHTML('beforebegin', `
                    <div class="dialog-icon">
                        <span class="material-symbols-rounded">lock</span>
                    </div>
                `);
                titleEl.textContent = window.getTranslation('dialogs.updatePasswordTitle');
                contentEl.innerHTML = `
                    <div class="dialog-user-chip">
                        <div class="dialog-user-initial">${userInitial}</div>
                        <span class="dialog-user-email">${user.email}</span>
                    </div>
                    <p>${window.getTranslation('dialogs.updatePasswordMessage')}</p>
                    <input type="hidden" name="csrf_token" value="${csrf_token}">
                    <div class="form-field password-wrapper">
                        <input type="password" id="current-password" class="auth-input" placeholder=" " autocomplete="current-password">
                        <label for="current-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                    </div>
                    <div class="auth-error-message-container" id="password-error-container">
                        <ul id="password-error-list"></ul>
                    </div>
                `;
                okBtn.textContent = window.getTranslation('general.confirm');
                cancelBtn.textContent = window.getTranslation('general.cancel');
                okBtn.onclick = handleVerifyPassword;
                cancelBtn.onclick = closeDialog;
            } else if (currentStep === 'update') {
                titleEl.insertAdjacentHTML('beforebegin', `
                    <div class="dialog-icon">
                        <span class="material-symbols-rounded">password</span>
                    </div>
                `);
                titleEl.textContent = window.getTranslation('dialogs.enterNewPasswordTitle');
                contentEl.innerHTML = `
                    <div class="dialog-user-chip">
                        <div class="dialog-user-initial">${userInitial}</div>
                        <span class="dialog-user-email">${user.email}</span>
                    </div>
                    <p>${window.getTranslation('dialogs.enterNewPasswordMessage')}</p>
                    <input type="hidden" name="csrf_token" value="${csrf_token}">
                    <div class="form-field password-wrapper">
                        <input type="password" id="new-password" class="auth-input" placeholder=" " autocomplete="new-password">
                        <label for="new-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                    </div>
                    <div class="form-field password-wrapper">
                        <input type="password" id="confirm-password" class="auth-input" placeholder=" ">
                        <label for="confirm-password" class="auth-label" data-i18n="dialogs.confirmPasswordLabel"></label>
                    </div>
                     <div class="auth-error-message-container" id="password-error-container">
                        <ul id="password-error-list"></ul>
                    </div>
                `;
                okBtn.textContent = window.getTranslation('settings.loginSecurity.updateButton');
                cancelBtn.textContent = window.getTranslation('general.back');
                okBtn.onclick = handleUpdatePassword;
                cancelBtn.onclick = () => {
                    overlay.querySelector('.dialog-icon')?.remove();
                    currentStep = 'verify';
                    renderStep();
                };
            }
            applyTranslations(overlay);
        };

        const handleVerifyPassword = async () => {
            const password = document.getElementById('current-password').value;
            const csrfToken = contentEl.querySelector('input[name="csrf_token"]').value;

            const formData = new FormData();
            formData.append('action_type', 'verify_password');
            formData.append('password', password);
            formData.append('csrf_token', csrfToken);

            const response = await api.verifyPassword(formData);

            if (response.ok && response.data.success) {
                overlay.querySelector('.dialog-icon')?.remove();
                currentStep = 'update';
                renderStep();
            } else {
                displayAuthErrors('password-error-container', 'password-error-list', response.data.message);
            }
        };

        const handleUpdatePassword = async () => {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const csrfToken = contentEl.querySelector('input[name="csrf_token"]').value;

            if (newPassword !== confirmPassword) {
                displayAuthErrors('password-error-container', 'password-error-list', window.getTranslation('notifications.passwordMismatch'));
                return;
            }

            const formData = new FormData();
            formData.append('action_type', 'update_password');
            formData.append('new_password', newPassword);
            formData.append('csrf_token', csrfToken);

            const response = await api.updateUserPassword(formData);

            if (response.ok && response.data.success) {
                showNotification(window.getTranslation('notifications.passwordUpdated'), 'success');
                closeDialog();
            } else {
                displayAuthErrors('password-error-container', 'password-error-list', response.data.message);
            }
        };

        overlay.querySelector('.dialog-icon')?.remove();
        renderStep();
        overlay.classList.remove('disabled');
    }

    async function showDeleteAccountDialog() {
        const overlay = document.getElementById('delete-account-overlay');
        const titleEl = document.getElementById('delete-account-title');
        const contentEl = document.getElementById('delete-account-content');
        const cancelBtn = document.getElementById('delete-account-cancel');
        const okBtn = document.getElementById('delete-account-ok');

        const closeDialog = () => {
            overlay.classList.add('disabled');
            cancelBtn.onclick = null;
            okBtn.onclick = null;
            overlay.querySelector('.dialog-icon')?.remove();
        };

        const sessionResponse = await api.checkSession();
        if (!sessionResponse.ok || !sessionResponse.data.loggedin) {
            return;
        }
        const user = sessionResponse.data.user;
        const userInitial = getInitials(user.username);
        const creationDate = user.created_at;
        const formattedDate = new Date(creationDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const tokenResponse = await api.getCsrfToken();
        if (!tokenResponse.ok) {
            showNotification("No se pudo iniciar la acción. Inténtalo de nuevo.", "error");
            return;
        }
        const csrf_token = tokenResponse.data.csrf_token;

        overlay.querySelector('.dialog-icon')?.remove();
        titleEl.insertAdjacentHTML('beforebegin', `
            <div class="dialog-icon">
                <span class="material-symbols-rounded">warning</span>
            </div>
        `);
        titleEl.setAttribute('data-i18n', 'dialogs.deleteAccountTitle');
        const message = window.getTranslation('dialogs.deleteAccountMessage', { date: formattedDate });
        contentEl.innerHTML = `
        <div class="dialog-user-chip">
            <div class="dialog-user-initial">${userInitial}</div>
            <span class="dialog-user-email">${user.email}</span>
        </div>
        <p>${message}</p>
        <input type="hidden" name="csrf_token" value="${csrf_token}">
        <div class="form-field password-wrapper" style="margin-top: 16px;">
            <input type="password" id="delete-confirm-password" class="auth-input" placeholder=" " autocomplete="current-password">
            <label for="delete-confirm-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
        </div>
        <div class="auth-error-message-container" id="delete-error-container">
            <ul id="delete-error-list"></ul>
        </div>
        `;

        okBtn.setAttribute('data-i18n', 'settings.loginSecurity.deleteAccountButton');
        cancelBtn.setAttribute('data-i18n', 'general.cancel');

        applyTranslations(overlay);

        okBtn.onclick = async () => {
            const password = document.getElementById('delete-confirm-password').value;
            const csrfToken = contentEl.querySelector('input[name="csrf_token"]').value;

            if (!password) {
                displayAuthErrors('delete-error-container', 'delete-error-list', window.getTranslation('auth.errors.passwordRequired'));
                return;
            }

            const formData = new FormData();
            formData.append('action_type', 'delete_account');
            formData.append('password', password);
            formData.append('csrf_token', csrfToken);

            okBtn.classList.add('loading');

            const response = await api.deleteAccount(formData);
            okBtn.classList.remove('loading');

            if (response.ok && response.data.success) {
                showNotification(window.getTranslation('notifications.accountDeleted'), 'success');
                updateUserUI(null);
                closeDialog();
                navigateToUrl('main', 'home');
                handleStateChange('main', 'home');
            } else {
                displayAuthErrors('delete-error-container', 'delete-error-list', response.data.message);
                const newTokenResponse = await api.getCsrfToken();
                if (newTokenResponse.ok) {
                    contentEl.querySelector('input[name="csrf_token"]').value = newTokenResponse.data.csrf_token;
                }
            }
        };

        cancelBtn.onclick = closeDialog;
        overlay.classList.remove('disabled');
    }

    async function showChangeRoleDialog(userUuid, newRole, userName) {
        const overlay = document.getElementById('change-role-overlay');
        const titleEl = document.getElementById('change-role-title');
        const contentEl = document.getElementById('change-role-content');
        const cancelBtn = document.getElementById('change-role-cancel');
        const okBtn = document.getElementById('change-role-ok');

        const closeDialog = () => {
            overlay.classList.add('disabled');
            cancelBtn.onclick = null;
            okBtn.onclick = null;
        };

        titleEl.textContent = `Confirmar cambio de rol`;
        contentEl.innerHTML = `
            <p>Para cambiar el rol de <strong>${userName}</strong> a <strong>${newRole}</strong>, por favor ingresa tu contraseña de administrador.</p>
            <div class="form-field password-wrapper" style="margin-top: 16px;">
                <input type="password" id="admin-confirm-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="admin-confirm-password" class="auth-label">Contraseña de Administrador</label>
            </div>
            <div class="auth-error-message-container" id="change-role-error-container">
                <ul id="change-role-error-list"></ul>
            </div>
        `;
        okBtn.textContent = 'Confirmar';
        cancelBtn.textContent = 'Cancelar';
        
        applyTranslations(overlay);

        okBtn.onclick = async () => {
            const password = document.getElementById('admin-confirm-password').value;
            if (!password) {
                displayAuthErrors('change-role-error-container', 'change-role-error-list', 'La contraseña es obligatoria.');
                return;
            }

            displayAuthErrors('change-role-error-container', 'change-role-error-list', []);
            okBtn.classList.add('loading');

            const passResponse = await api.verifyAdminPassword(password);

            if (passResponse.ok && passResponse.data.success) {
                const roleResponse = await api.changeUserRole(userUuid, newRole);
                if (roleResponse.ok) {
                    showNotification('Rol de usuario actualizado con éxito.', 'success');
                    fetchAndDisplayUsers(document.querySelector('#admin-user-search').value.trim());
                    closeDialog();
                } else {
                    displayAuthErrors('change-role-error-container', 'change-role-error-list', roleResponse.data.message || 'Error al cambiar el rol.');
                }
            } else {
                displayAuthErrors('change-role-error-container', 'change-role-error-list', passResponse.data.message || 'Error de verificación.');
            }
            okBtn.classList.remove('loading');
        };

        cancelBtn.onclick = closeDialog;
        overlay.classList.remove('disabled');
    }


    function initSettingsController() {
        const settingsToggles = {
            'open-links-in-new-tab': {
                element: document.querySelector('[data-setting="open-links-in-new-tab"]'),
                key: 'openLinksInNewTab',
                defaultValue: false
            },
            'longer-message-duration': {
                element: document.querySelector('[data-setting="longer-message-duration"]'),
                key: 'longerMessageDuration',
                defaultValue: false
            }
        };

        function updateToggleUI(setting) {
            const value = localStorage.getItem(setting.key) === 'true';
            if (setting.element) {
                setting.element.classList.toggle('active', value);
            }
        }

        for (const id in settingsToggles) {
            const setting = settingsToggles[id];
            if (setting.element) {
                if (localStorage.getItem(setting.key) === null) {
                    localStorage.setItem(setting.key, setting.defaultValue);
                }
                updateToggleUI(setting);

                setting.element.addEventListener('click', () => {
                    const currentValue = localStorage.getItem(setting.key) === 'true';
                    localStorage.setItem(setting.key, !currentValue);
                    updateToggleUI(setting);
                });
            }
        }
    }

    function initHistoryPrivacySettings() {
        const settingsToggles = {
            'enable-view-history': {
                element: document.querySelector('[data-setting="enable-view-history"]'),
                key: 'enable-view-history',
                defaultValue: true
            },
            'enable-search-history': {
                element: document.querySelector('[data-setting="enable-search-history"]'),
                key: 'enable-search-history',
                defaultValue: true
            }
        };

        function updateToggleUI(setting) {
            const value = localStorage.getItem(setting.key) !== 'false';
            if (setting.element) {
                setting.element.classList.toggle('active', value);
            }
        }

        for (const id in settingsToggles) {
            const setting = settingsToggles[id];
            if (setting.element) {
                if (localStorage.getItem(setting.key) === null) {
                    localStorage.setItem(setting.key, setting.defaultValue);
                }
                updateToggleUI(setting);

                setting.element.addEventListener('click', () => {
                    const currentValue = localStorage.getItem(setting.key) !== 'false';
                    localStorage.setItem(setting.key, !currentValue);
                    updateToggleUI(setting);
                });
            }
        }

        const clearHistoryBtn = document.querySelector('[data-action="clear-history"]');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                const history = getHistory();
                const totalItems = history.profiles.length + history.photos.length + history.searches.length;

                if (totalItems === 0) {
                    showNotification(window.getTranslation('notifications.historyEmpty'));
                    return;
                }

                const message = window.getTranslation('dialogs.clearHistoryMessage');
                const confirmed = await showCustomConfirm(window.getTranslation('dialogs.clearHistoryTitle'), message);

                if (confirmed) {
                    localStorage.removeItem('viewHistory');
                    showNotification(window.getTranslation('notifications.historyCleared'));
                    if (currentAppSection === 'history' || currentAppSection === 'historyPrivacy') {
                        handleStateChange(currentAppView, currentAppSection, null);
                    }
                }
            });
        }
    }

    function isFavorite(photoId) {
        const favorites = getFavorites();
        return favorites.some(photo => photo.id == photoId);
    }

    function toggleFavorite(photoData) {
        let favorites = getFavorites();
        const photoIndex = favorites.findIndex(photo => photo.id == photoData.id);
        const isLiked = photoIndex === -1;

        if (photoIndex > -1) {
            favorites.splice(photoIndex, 1);
        } else {
            const photoToAdd = {
                ...photoData,
                added_at: Date.now()
            };
            favorites.push(photoToAdd);
        }

        localStorage.setItem('favoritePhotos', JSON.stringify(favorites));
        updateFavoriteButtonState(photoData.id);
        updateFavoriteCardState(photoData.id);

        api.toggleFavoriteOnServer(photoData.id, photoData.gallery_uuid, isLiked)
            .then(response => {
                if (!response.ok) {
                    console.error('Error al actualizar el like.');
                }
            });
    }

    function updateFavoriteButtonState(photoId) {
        const favButton = document.querySelector('[data-action="toggle-favorite"]');
        if (favButton) {
            favButton.classList.toggle('active', isFavorite(photoId));
        }
    }

    function updateFavoriteCardState(photoId) {
        const cardFavButton = document.querySelector(`.icon-wrapper[data-photo-id="${photoId}"]`);
        if (cardFavButton) {
            cardFavButton.classList.toggle('active', isFavorite(photoId));
        }
    }

    function displayFavoritePhotos() {
        const section = document.querySelector('[data-section="favorites"]');
        if (!section) return;

        const allPhotosContainer = section.querySelector('#favorites-grid-view');
        const byUserContainer = section.querySelector('#favorites-grid-view-by-user');
        const statusContainer = section.querySelector('.status-message-container');
        const searchInput = document.getElementById('favorites-search-input');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        if (searchTerm) {
            addSearchToHistory(searchTerm, 'favorites');
        }

        allPhotosContainer.innerHTML = '';
        byUserContainer.innerHTML = '';
        statusContainer.innerHTML = '';
        statusContainer.classList.add('disabled');

        let favorites = getFavorites();

        if (searchTerm) {
            favorites = favorites.filter(photo =>
                photo.gallery_name.toLowerCase().includes(searchTerm)
            );
        }

        if (currentFavoritesSortBy === 'oldest') {
            favorites.sort((a, b) => (a.added_at || 0) - (a.added_at || 0));
        } else if (currentFavoritesSortBy === 'newest') {
            favorites.sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
        }

        currentFavoritesList = favorites;

        if (currentFavoritesSortBy === 'user') {
            allPhotosContainer.classList.remove('active');
            allPhotosContainer.classList.add('disabled');
            byUserContainer.classList.add('active');
            byUserContainer.classList.remove('disabled');

            const galleries = favorites.reduce((acc, photo) => {
                if (!acc[photo.gallery_uuid]) {
                    acc[photo.gallery_uuid] = {
                        name: photo.gallery_name,
                        photos: [],
                        profile_picture_url: photo.profile_picture_url
                    };
                }
                acc[photo.gallery_uuid].photos.push(photo);
                return acc;
            }, {});

            if (Object.keys(galleries).length > 0) {
                byUserContainer.classList.remove('disabled');
                statusContainer.classList.add('disabled');
                for (const uuid in galleries) {
                    const gallery = galleries[uuid];
                    const card = document.createElement('div');
                    card.className = 'card user-card';
                    card.dataset.uuid = uuid;
                    card.dataset.name = gallery.name;

                    const background = document.createElement('div');
                    background.className = 'card-background';
                    background.style.backgroundImage = `url('${gallery.photos[0].photo_url}')`;
                    card.appendChild(background);

                    const overlay = document.createElement('div');
                    overlay.className = 'card-content-overlay';

                    const icon = document.createElement('div');
                    icon.className = 'card-icon';
                    if (gallery.profile_picture_url) {
                        icon.style.backgroundImage = `url('${gallery.profile_picture_url}')`;
                    }
                    overlay.appendChild(icon);

                    const textContainer = document.createElement('div');
                    textContainer.className = 'card-text';
                    const photoCountText = gallery.photos.length > 1 ? window.getTranslation('general.photosCount', { count: gallery.photos.length }) : window.getTranslation('general.photoCount', { count: 1 });
                    textContainer.innerHTML = `<span>${gallery.name}</span><span style="font-size: 0.8rem; display: block;">${photoCountText}</span>`;
                    overlay.appendChild(textContainer);

                    card.appendChild(overlay);
                    byUserContainer.appendChild(card);
                }
            } else {
                byUserContainer.classList.add('disabled');
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('favorites.noFavoritesTitle')}</h2><p>${window.getTranslation('favorites.noFavoritesMessage')}</p></div>`;

            }

        } else {
            allPhotosContainer.classList.add('active');
            allPhotosContainer.classList.remove('disabled');
            byUserContainer.classList.remove('active');
            byUserContainer.classList.add('disabled');

            if (favorites.length > 0) {
                allPhotosContainer.classList.remove('disabled');
                statusContainer.classList.add('disabled');
                favorites.forEach(photo => {
                    const card = document.createElement('div');
                    card.className = 'card photo-card';
                    card.dataset.photoUrl = photo.photo_url;
                    card.dataset.photoId = photo.id;
                    card.dataset.galleryUuid = photo.gallery_uuid;

                    const background = document.createElement('div');
                    background.className = 'card-background';
                    background.style.backgroundImage = `url('${photo.photo_url}')`;
                    card.appendChild(background);

                    const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${photo.gallery_uuid}/photo/${photo.id}`;
                    const addedDate = window.getTranslation('general.added', { date: new Date(photo.added_at).toLocaleString() });
                    card.innerHTML += `
                <div class="card-content-overlay">
                    <div class="card-icon" style="background-image: url('${photo.profile_picture_url || ''}')"></div>
                    <div class="card-text">
                        <span>${photo.gallery_name}</span>
                        <span style="font-size: 0.8rem; display: block;">${addedDate}</span>
                    </div>
                </div>
                <div class="card-actions-container">
                    <div class="card-hover-overlay">
                        <div class="card-hover-icons">
                            <div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div>
                            <div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div>
                        </div>
                    </div>
                    <div class="module-content module-select photo-context-menu disabled body-title">
                        <div class="menu-content"><div class="menu-list">
                            <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.openInNewTab')}</span></div></a>
                            <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.copyLink')}</span></div></div>
                            <a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.download')}</span></div></a>
                        </div></div>
                    </div>
                </div>`;
                    allPhotosContainer.appendChild(card);
                });
            } else {
                allPhotosContainer.classList.add('disabled');
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('favorites.noFavoritesTitle')}</h2><p>${window.getTranslation('favorites.noFavoritesMessage')}</p></div>`;
            }
        }
        applyTranslations(section);
    }

    function updateCardPrivacyStatus(uuid, unlockedTimestamp) {
        const card = document.querySelector(`.card[data-uuid="${uuid}"]`);
        if (!card) return;

        if (card.dataset.privacy !== '1') {
            const badge = card.querySelector('.privacy-badge');
            if (badge && !badge.innerHTML.includes(window.getTranslation('general.public'))) {
                badge.innerHTML = `<span class="material-symbols-rounded">public</span> ${window.getTranslation('general.public')}`;
            }
            return;
        }

        const badge = card.querySelector('.privacy-badge');
        if (!badge) return;

        const now = new Date().getTime();
        const sixtyMinutes = 60 * 60 * 1000;
        const remainingTime = unlockedTimestamp + sixtyMinutes - now;

        if (remainingTime > 0) {
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            badge.innerHTML = `<span class="material-symbols-rounded">lock_open</span> ${window.getTranslation('general.unlocked')} (${minutes}:${seconds.toString().padStart(2, '0')})`;
            badge.className = 'privacy-badge';
        } else {
            badge.innerHTML = `<span class="material-symbols-rounded">lock</span> ${window.getTranslation('general.private')}`;
            badge.className = 'privacy-badge';
        }
    }

    function startUnlockCountdownTimer() {
        if (unlockCountdownInterval) {
            clearInterval(unlockCountdownInterval);
        }
        unlockCountdownInterval = setInterval(() => {
            const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
            for (const uuid in unlockedGalleries) {
                updateCardPrivacyStatus(uuid, unlockedGalleries[uuid]);
            }
        }, 1000);
    }

    function displayGalleriesAsGrid(galleries, container, sortBy, append = false) {
        if (!append) {
            container.innerHTML = '';
        }
        galleries.forEach(gallery => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.uuid = gallery.uuid;
            card.dataset.name = gallery.name;
            card.dataset.privacy = gallery.privacy;

            if (gallery.background_photo_url) {
                const background = document.createElement('div');
                background.className = 'card-background';
                background.style.backgroundImage = `url('${gallery.background_photo_url}')`;
                card.appendChild(background);
            }

            const badge = document.createElement('div');
            badge.className = 'privacy-badge';

            if (gallery.privacy == 1) {
                badge.innerHTML = `<span class="material-symbols-rounded">lock</span> ${window.getTranslation('general.private')}`;
            } else {
                badge.innerHTML = `<span class="material-symbols-rounded">public</span> ${window.getTranslation('general.public')}`;
            }
            card.appendChild(badge);

            const overlay = document.createElement('div');
            overlay.className = 'card-content-overlay';

            const icon = document.createElement('div');
            icon.className = 'card-icon';
            if (gallery.profile_picture_url) {
                icon.style.backgroundImage = `url('${gallery.profile_picture_url}')`;
            }

            const textContainer = document.createElement('div');
            textContainer.className = 'card-text';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = gallery.name;
            textContainer.appendChild(nameSpan);

            if (sortBy === 'newest' || sortBy === 'oldest') {
                const editedSpan = document.createElement('span');
                const editedDate = window.getTranslation('general.edited', { date: new Date(gallery.last_edited).toLocaleDateString() });
                editedSpan.textContent = editedDate;
                editedSpan.style.fontSize = '0.8rem';
                editedSpan.style.display = 'block';
                textContainer.appendChild(editedSpan);
            }

            overlay.appendChild(icon);
            overlay.appendChild(textContainer);
            card.appendChild(overlay);
            container.appendChild(card);

            if (gallery.privacy == 1) {
                const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
                if (unlockedGalleries[gallery.uuid]) {
                    updateCardPrivacyStatus(gallery.uuid, unlockedGalleries[gallery.uuid]);
                }
            }
        });
    }

    async function promptToWatchAd(uuid, name) {
        const sessionResponse = await api.checkSession();
        if (sessionResponse.ok && sessionResponse.data.loggedin) {
            const userRole = sessionResponse.data.user.role;
            if (userRole === 'moderator' || userRole === 'administrator') {
                const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
                unlockedGalleries[uuid] = new Date().getTime();
                localStorage.setItem('unlockedGalleries', JSON.stringify(unlockedGalleries));
                navigateToUrl('main', 'galleryPhotos', { uuid });
                handleStateChange('main', 'galleryPhotos', true, { uuid, galleryName: name });
                return;
            }
        }

        adContext = 'unlock';
        adStep = 1;
        galleryAfterAd = { view: 'main', section: 'galleryPhotos', data: { uuid, galleryName: name } };
        await handleStateChange('main', 'accessCodePrompt', true, { uuid });
    }

    function isPrivateGalleryUnlocked(uuid) {
        const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
        if (!unlockedGalleries[uuid]) {
            return false;
        }
        const now = new Date().getTime();
        const sixtyMinutes = 60 * 60 * 1000;
        return (now - unlockedGalleries[uuid]) < sixtyMinutes;
    }

    function displayFetchError(containerSelector, titleKey, messageKey) {
        const section = document.querySelector(containerSelector);
        if (!section) return;

        const statusContainer = section.querySelector('.status-message-container');
        const grid = section.querySelector('.card-grid');

        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2 data-i18n="${titleKey}">${window.getTranslation(titleKey)}</h2><p data-i18n="${messageKey}">${window.getTranslation(messageKey)}</p></div>`;
        }
        if (grid) {
            grid.classList.add('disabled');
            grid.innerHTML = '';
        }
    }

    async function fetchAndDisplayGalleries(sortBy = 'relevant', searchTerm = '', append = false) {
        if (isLoadingGalleries) return;
        isLoadingGalleries = true;

        if (searchTerm) {
            addSearchToHistory(searchTerm, 'home');
        }

        const section = document.querySelector('[data-section="home"]');
        if (!section) {
            isLoadingGalleries = false;
            return;
        }

        const gridContainer = section.querySelector('#grid-view');
        const statusContainer = section.querySelector('.status-message-container');

        if (!append) {
            galleriesCurrentPage = 1;
            if (gridContainer) gridContainer.innerHTML = '';
            if (gridContainer) gridContainer.classList.add('disabled');
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = loaderHTML;
            }
        }

        const response = await api.getGalleries(sortBy, searchTerm, galleriesCurrentPage, BATCH_SIZE);
        isLoadingGalleries = false;

        if (response.ok) {
            const data = response.data;
            if (statusContainer) {
                statusContainer.classList.add('disabled');
                statusContainer.innerHTML = '';
            }

            if (gridContainer) gridContainer.classList.remove('disabled');

            if (data.length > 0) {
                displayGalleriesAsGrid(data, gridContainer, sortBy, append);
            } else if (!append) {
                if (statusContainer) {
                    statusContainer.classList.remove('disabled');
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
                }
                if (gridContainer) gridContainer.classList.add('disabled');
            }

            const loadMoreContainer = document.getElementById('users-load-more-container');
            if (loadMoreContainer) {
                if (data.length < BATCH_SIZE) {
                    loadMoreContainer.classList.add('disabled');
                } else {
                    loadMoreContainer.classList.remove('disabled');
                    galleriesCurrentPage++;
                }
            }
        } else {
            console.error('Error al obtener las galerías:', response.data);
            if (!append) {
                displayFetchError('[data-section="home"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
            } else {
                showNotification(window.getTranslation('general.connectionErrorMessage'), 'error');
            }
        }
    }

    async function fetchAndDisplayGalleryPhotos(uuid, galleryName, append = false) {
        const section = document.querySelector('[data-section="galleryPhotos"]');
        if (!section) return;

        const grid = section.querySelector('#user-photos-grid');
        const statusContainer = section.querySelector('.status-message-container');
        const title = section.querySelector('#user-photos-title');
        const loadMoreContainer = section.querySelector('#photos-load-more-container');

        if (!append) {
            photosCurrentPage = 1;
            currentGalleryPhotoList = [];
            if (title) title.textContent = galleryName || window.getTranslation('general.loading');
            if (grid) grid.innerHTML = '';
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = loaderHTML;
            }
        }

        if (isLoadingPhotos) return;
        isLoadingPhotos = true;

        currentGalleryForPhotoView = uuid;
        currentGalleryNameForPhotoView = galleryName;

        const response = await api.getGalleryPhotos(uuid, photosCurrentPage, BATCH_SIZE);
        isLoadingPhotos = false;

        if (response.ok) {
            const photos = response.data;
            if (statusContainer) {
                statusContainer.classList.add('disabled');
                statusContainer.innerHTML = '';
            }
            if (grid) grid.classList.remove('disabled');

            currentGalleryPhotoList.push(...photos);

            if (photos.length > 0) {
                photos.forEach(photo => {
                    const card = document.createElement('div');
                    card.className = 'card photo-card';
                    card.dataset.photoUrl = photo.photo_url;
                    card.dataset.photoId = photo.id;
                    card.dataset.galleryUuid = photo.gallery_uuid;

                    const background = document.createElement('div');
                    background.className = 'card-background';
                    background.style.backgroundImage = `url('${photo.photo_url}')`;
                    card.appendChild(background);

                    const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${uuid}/photo/${photo.id}`;

                    card.innerHTML += `
                        <div class="card-actions-container">
                            <div class="card-hover-overlay">
                                <div class="card-hover-icons">
                                    <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div>
                                    <div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div>
                                </div>
                            </div>
                            <div class="module-content module-select photo-context-menu disabled body-title">
                                <div class="menu-content"><div class="menu-list">
                                    <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.openInNewTab')}</span></div></a>
                                    <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.copyLink')}</span></div></div>
                                    <a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.download')}</span></div></a>
                                </div></div>
                            </div>
                        </div>
                    `;

                    if (grid) grid.appendChild(card);
                    updateFavoriteCardState(photo.id);
                });
            } else if (!append && statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('userPhotos.emptyGalleryTitle')}</h2><p>${window.getTranslation('userPhotos.emptyGalleryMessage')}</p></div>`;
            }

            if (loadMoreContainer) {
                if (photos.length < BATCH_SIZE) {
                    loadMoreContainer.classList.add('disabled');
                } else {
                    loadMoreContainer.classList.remove('disabled');
                    photosCurrentPage++;
                }
            }
        } else {
            console.error('Error al obtener las fotos:', response.data);
            if (!append) {
                displayFetchError('[data-section="galleryPhotos"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
            } else {
                showNotification(window.getTranslation('general.connectionErrorMessage'), 'error');
            }
        }
    }

    async function fetchAndDisplayTrends(searchTerm = '') {
        const section = document.querySelector('[data-section="trends"]');
        if (!section) return;

        if (searchTerm) {
            addSearchToHistory(searchTerm, 'trends');
        }

        const usersGrid = section.querySelector('#trending-users-grid');
        const photosGrid = section.querySelector('#trending-photos-grid');
        const statusContainer = section.querySelector('.status-message-container');
        const usersSection = usersGrid.closest('.category-section');
        const photosSection = photosGrid.closest('.category-section');

        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
        if (usersGrid) usersGrid.innerHTML = '';
        if (photosGrid) photosGrid.innerHTML = '';

        if (usersSection) usersSection.style.display = 'none';
        if (photosSection) photosSection.style.display = 'none';

        try {
            const [users, photos] = await api.getTrends(searchTerm);

            if (statusContainer) {
                statusContainer.classList.add('disabled');
                statusContainer.innerHTML = '';
            }

            if (users.length > 0) {
                if (usersSection) usersSection.style.display = 'block';
                displayGalleriesAsGrid(users, usersGrid, 'relevant', false);
            } else {
                if (statusContainer) {
                    statusContainer.classList.remove('disabled');
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('trends.noTrendingUsersMessage')}</p></div>`;
                }
            }

            if (searchTerm === '') {
                if (photosSection) photosSection.style.display = 'block';
                currentTrendingPhotosList = photos;
                if (photos.length > 0) {
                    photos.forEach(photo => {
                        const card = document.createElement('div');
                        card.className = 'card photo-card';
                        card.dataset.photoUrl = photo.photo_url;
                        card.dataset.photoId = photo.id;
                        card.dataset.galleryUuid = photo.gallery_uuid;

                        const background = document.createElement('div');
                        background.className = 'card-background';
                        background.style.backgroundImage = `url('${photo.photo_url}')`;
                        card.appendChild(background);

                        const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${photo.gallery_uuid}/photo/${photo.id}`;
                        const likesText = window.getTranslation('general.likesCount', { count: photo.likes });
                        const interactionsText = window.getTranslation('general.interactionsCount', { count: photo.interactions });

                        card.innerHTML += `
                            <div class="card-content-overlay">
                                <div class="card-icon" style="background-image: url('${photo.profile_picture_url || ''}')"></div>
                                <div class="card-text">
                                    <span>${photo.gallery_name}</span>
                                    <span style="font-size: 0.8rem; display: block;">${likesText} - ${interactionsText}</span>
                                </div>
                            </div>
                            <div class="card-actions-container">
                                <div class="card-hover-overlay">
                                    <div class="card-hover-icons">
                                        <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div>
                                        <div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div>
                                    </div>
                                </div>
                                <div class="module-content module-select photo-context-menu disabled body-title">
                                    <div class="menu-content"><div class="menu-list">
                                        <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.openInNewTab')}</span></div></a>
                                        <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.copyLink')}</span></div></div>
                                        <a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.download')}</span></div></a>
                                    </div></div>
                                </div>
                            </div>`;
                        if (photosGrid) photosGrid.appendChild(card);
                        updateFavoriteCardState(photo.id);
                    });
                } else {
                    if (photosGrid) photosGrid.innerHTML = `<p>No hay fotos en tendencia en este momento.</p>`;
                }
            }
        } catch (error) {
            console.error('Error fetching trends:', error);
            displayFetchError('[data-section="trends"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }

    function rotatePhoto(direction) {
        const photoViewerImage = document.getElementById('photo-viewer-image');
        if (photoViewerImage) {
            currentRotation += direction === 'right' ? 90 : -90;
            photoViewerImage.style.transform = `rotate(${currentRotation}deg)`;
        }
    }

    async function renderPhotoView(uuid, photoId, photoList) {
        const photoViewerImage = document.getElementById('photo-viewer-image');
        const photoCounter = document.getElementById('photo-counter');
        const photoViewUserTitle = document.getElementById('photo-view-user-title');
        const prevButton = document.querySelector('[data-action="previous-photo"]');
        const nextButton = document.querySelector('[data-action="next-photo"]');

        if (!photoViewerImage) {
            console.error("Photo viewer elements not found in the DOM.");
            return;
        }

        await api.incrementPhotoInteraction(photoId);
        currentRotation = 0;
        photoViewerImage.style.transform = `rotate(0deg)`;


        const photoIndex = photoList.findIndex(p => p.id == photoId);

        if (photoIndex !== -1) {
            const photo = photoList[photoIndex];

            const updateGalleryName = async () => {
                if (photo.gallery_name) {
                    currentGalleryNameForPhotoView = photo.gallery_name;
                }
                if (photoViewUserTitle && currentGalleryNameForPhotoView) {
                    photoViewUserTitle.textContent = currentGalleryNameForPhotoView;
                } else {
                    const response = await api.getGalleryDetails(uuid);
                    if (response.ok) {
                        const gallery = response.data;
                        if (gallery && gallery.name) {
                            currentGalleryNameForPhotoView = gallery.name;
                            if (photoViewUserTitle) photoViewUserTitle.textContent = gallery.name;
                        }
                    }
                }
            };

            await updateGalleryName();

            currentPhotoData = {
                id: photo.id,
                gallery_uuid: uuid,
                photo_url: photo.photo_url,
                gallery_name: photo.gallery_name || currentGalleryNameForPhotoView,
                profile_picture_url: photo.profile_picture_url
            };

            photoViewerImage.src = photo.photo_url;
            photoCounter.textContent = `${photoIndex + 1} / ${photoList.length}`;
            currentGalleryForPhotoView = uuid;

            addToHistory('photos', {
                id: currentPhotoData.id,
                gallery_uuid: currentPhotoData.gallery_uuid,
                photo_url: currentPhotoData.photo_url,
                gallery_name: currentPhotoData.gallery_name,
                profile_picture_url: currentPhotoData.profile_picture_url
            });

            updateFavoriteButtonState(photo.id);

            if (prevButton) prevButton.classList.toggle('disabled-nav', photoIndex === 0);
            if (nextButton) nextButton.classList.toggle('disabled-nav', photoIndex === photoList.length - 1);
        } else {
            console.error("Photo not found in list, navigating to 404.");
            handleStateChange('main', '404');
        }
    }

    function updateMoreOptionsFilterText(filterText, menuId) {
        const moreOptionsMenu = document.querySelector(menuId);
        if (moreOptionsMenu) {
            const filterLink = moreOptionsMenu.querySelector('[data-action="toggle-select"] .menu-link-text span');
            if (filterLink) {
                filterLink.textContent = `${window.getTranslation('home.filterTooltip')} (${filterText})`;
            }
        }
    }

    function updateSelectActiveState(selectId, value) {
        const selectContainers = document.querySelectorAll(`#${selectId}, #${selectId}-mobile`);

        selectContainers.forEach(selectContainer => {
            if (!selectContainer) return;

            const allLinks = selectContainer.querySelectorAll('.menu-link');
            allLinks.forEach(link => link.classList.remove('active'));

            const wrapper = selectContainer.closest('.select-wrapper');
            const trigger = wrapper ? wrapper.querySelector('[data-action="toggle-select"]') : document.querySelector(`[data-target="${selectId}"]`);
            const triggerTextEl = trigger ? trigger.querySelector('.select-trigger-text') : null;

            if (!triggerTextEl) return;

            const activeLink = selectContainer.querySelector(`.menu-link[data-value="${value}"]`);
            let activeText = '';

            if (activeLink) {
                activeLink.classList.add('active');
                activeText = activeLink.querySelector('.menu-link-text span').textContent;
                triggerTextEl.textContent = activeText;
            } else {
                const placeholderKey = triggerTextEl.dataset.i18n;
                if (placeholderKey) {
                    triggerTextEl.textContent = window.getTranslation(placeholderKey);
                }
            }

            if (selectId.includes('relevance')) {
                updateMoreOptionsFilterText(activeText, '#more-options-menu');
            } else if (selectId.includes('favorites-sort')) {
                updateMoreOptionsFilterText(activeText, '#more-options-menu-fav');
            }
        });
    }

    async function downloadPhoto(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = objectUrl;

            const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0] || 'download.jpg';
            a.download = fileName;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(objectUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading the image:', error);
            showNotification(window.getTranslation('notifications.downloadError'), 'error');
        }
    }

    function copyTextToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((res, rej) => {
                try {
                    const successful = document.execCommand('copy');
                    if (successful) res();
                    else rej(new Error('Copy command was unsuccessful'));
                } catch (err) {
                    rej(err);
                } finally {
                    document.body.removeChild(textArea);
                }
            });
        }
    }

    function removeSearchFromHistory(timestamp) {
        let history = getHistory();
        const indexToRemove = history.searches.findIndex(item => item.searched_at == timestamp);

        if (indexToRemove > -1) {
            history.searches.splice(indexToRemove, 1);
            localStorage.setItem('viewHistory', JSON.stringify(history));
            displayHistory();
        }
    }

    function displayHistory() {
        const history = getHistory();
        const mainContainer = document.querySelector('[data-section="history"]');
        if (!mainContainer) return;

        const historyContainer = mainContainer.querySelector('#history-container');
        const profilesGrid = mainContainer.querySelector('#history-profiles-grid');
        const photosGrid = mainContainer.querySelector('#history-photos-grid');
        const searchesList = mainContainer.querySelector('#history-searches-list');
        const statusContainer = mainContainer.querySelector('.status-message-container');
        const pausedAlert = mainContainer.querySelector('.history-paused-alert');
        const historySelect = mainContainer.querySelector('#history-select');

        const profilesLoadMore = mainContainer.querySelector('#history-profiles-load-more');
        const photosLoadMore = mainContainer.querySelector('#history-photos-load-more');
        const searchesLoadMore = mainContainer.querySelector('#history-searches-load-more');

        const currentView = historySelect ? (historySelect.querySelector('.menu-link.active')?.dataset.value || 'views') : 'views';
        const isViewHistoryPaused = localStorage.getItem('enable-view-history') === 'false';
        const isSearchHistoryPaused = localStorage.getItem('enable-search-history') === 'false';

        historyContainer.style.display = 'none';
        statusContainer.classList.add('disabled');
        pausedAlert.classList.add('disabled');
        profilesGrid.innerHTML = '';
        photosGrid.innerHTML = '';
        searchesList.innerHTML = '';
        profilesLoadMore.innerHTML = '';
        photosLoadMore.innerHTML = '';
        searchesLoadMore.innerHTML = '';
        profilesLoadMore.classList.add('disabled');
        photosLoadMore.classList.add('disabled');
        searchesLoadMore.classList.add('disabled');

        if (currentView === 'views') {
            const hasContent = history.profiles.length > 0 || history.photos.length > 0;

            if (hasContent) {
                historyContainer.style.display = 'block';
                if (isViewHistoryPaused) {
                    pausedAlert.classList.remove('disabled');
                }

                if (history.profiles.length > 0) {
                    const profilesToShow = history.profiles.slice(0, historyProfilesShown);
                    profilesToShow.forEach(profile => {
                        const card = document.createElement('div');
                        card.className = 'card';
                        card.dataset.uuid = profile.id;
                        card.dataset.name = profile.name;
                        card.dataset.privacy = profile.privacy;
                        if (profile.background_photo_url) {
                            const background = document.createElement('div');
                            background.className = 'card-background';
                            background.style.backgroundImage = `url('${profile.background_photo_url}')`;
                            card.appendChild(background);
                        }
                        const overlay = document.createElement('div');
                        overlay.className = 'card-content-overlay';
                        const icon = document.createElement('div');
                        icon.className = 'card-icon';
                        if (profile.profile_picture_url) {
                            icon.style.backgroundImage = `url('${profile.profile_picture_url}')`;
                        }
                        overlay.appendChild(icon);
                        const textContainer = document.createElement('div');
                        textContainer.className = 'card-text';
                        const viewedDate = window.getTranslation('general.viewed', { date: new Date(profile.visited_at).toLocaleString() });
                        textContainer.innerHTML = `<span>${profile.name}</span><span style="font-size: 0.8rem; display: block;">${viewedDate}</span>`;
                        overlay.appendChild(textContainer);
                        card.appendChild(overlay);
                        profilesGrid.appendChild(card);
                    });

                    if (history.profiles.length > historyProfilesShown) {
                        profilesLoadMore.innerHTML = `<button class="load-more-btn" data-action="load-more-history-profiles" data-i18n="settings.history.showMore">${window.getTranslation('settings.history.showMore')}</button>`;
                        profilesLoadMore.classList.remove('disabled');
                    }
                }

                if (history.photos.length > 0) {
                    const photosToShow = history.photos.slice(0, historyPhotosShown);
                    photosToShow.forEach(photo => {
                        const card = document.createElement('div');
                        card.className = 'card photo-card';
                        card.dataset.photoUrl = photo.photo_url;
                        card.dataset.photoId = photo.id;
                        card.dataset.galleryUuid = photo.gallery_uuid;
                        const background = document.createElement('div');
                        background.className = 'card-background';
                        background.style.backgroundImage = `url('${photo.photo_url}')`;
                        card.appendChild(background);
                        const overlay = document.createElement('div');
                        overlay.className = 'card-content-overlay';
                        const icon = document.createElement('div');
                        icon.className = 'card-icon';
                        if (photo.profile_picture_url) {
                            icon.style.backgroundImage = `url('${photo.profile_picture_url}')`;
                        }
                        overlay.appendChild(icon);
                        const textContainer = document.createElement('div');
                        textContainer.className = 'card-text';
                        const viewedDate = window.getTranslation('general.viewed', { date: new Date(photo.visited_at).toLocaleString() });
                        textContainer.innerHTML = `<span>${photo.gallery_name}</span><span style="font-size: 0.8rem; display: block;">${viewedDate}</span>`;
                        overlay.appendChild(textContainer);
                        card.appendChild(overlay);
                        photosGrid.appendChild(card);
                    });

                    if (history.photos.length > historyPhotosShown) {
                        photosLoadMore.innerHTML = `<button class="load-more-btn" data-action="load-more-history-photos" data-i18n="settings.history.showMore">${window.getTranslation('settings.history.showMore')}</button>`;
                        photosLoadMore.classList.remove('disabled');
                    }
                }
            } else {
                if (isViewHistoryPaused) {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.viewsPausedTitle')}</h2><p>${window.getTranslation('settings.history.viewsPausedMessage')}</p></div>`;
                    statusContainer.classList.remove('disabled');
                } else {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.noActivityTitle')}</h2><p>${window.getTranslation('settings.history.noActivityMessage')}</p></div>`;
                    statusContainer.classList.remove('disabled');
                }
            }
        } else if (currentView === 'searches') {
            const hasContent = history.searches.length > 0;

            if (hasContent) {
                historyContainer.style.display = 'block';
                if (isSearchHistoryPaused) {
                    pausedAlert.classList.remove('disabled');
                }

                const searchesToShow = history.searches.slice(0, historySearchesShown);
                searchesToShow.forEach(search => {
                    const item = document.createElement('div');
                    item.className = 'search-history-item';
                    const searchedInText = window.getTranslation('general.searchedIn', { section: search.section });
                    item.innerHTML = `
                        <div class="search-history-text">
                            <span class="search-term">"${search.term}"</span>
                            <span class="search-details">${searchedInText} - ${new Date(search.searched_at).toLocaleString()}</span>
                        </div>
                        <div class="search-history-actions">
                            <button class="search-history-delete-btn" data-action="delete-search-item" data-timestamp="${search.searched_at}" data-tooltip="Eliminar">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                    `;
                    searchesList.appendChild(item);
                });

                if (history.searches.length > historySearchesShown) {
                    searchesLoadMore.innerHTML = `<button class="load-more-btn" data-action="load-more-history-searches" data-i18n="settings.history.showMore">${window.getTranslation('settings.history.showMore')}</button>`;
                    searchesLoadMore.classList.remove('disabled');
                }
            } else {
                if (isSearchHistoryPaused) {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.searchesPausedTitle')}</h2><p>${window.getTranslation('settings.history.searchesPausedMessage')}</p></div>`;
                    statusContainer.classList.remove('disabled');
                } else {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.noSearchesTitle')}</h2><p>${window.getTranslation('settings.history.noSearchesMessage')}</p></div>`;
                    statusContainer.classList.remove('disabled');
                }
            }
        }
        applyTranslations(mainContainer);
    }
    async function fetchAndDisplayUsers(searchTerm = '', append = false) {
    if (isLoadingAdminUsers) return;
    isLoadingAdminUsers = true;

    const section = document.querySelector('[data-section="manageUsers"]');
    if (!section) {
        isLoadingAdminUsers = false;
        return;
    }

    const tableBody = section.querySelector('#users-table tbody');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#users-admin-load-more-container');

    if (!append) {
        adminUsersCurrentPage = 1;
        if (tableBody) tableBody.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getUsers(searchTerm, adminUsersCurrentPage, ADMIN_USERS_BATCH_SIZE);
    isLoadingAdminUsers = false;

    if (statusContainer) {
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';
    }

    if (response.ok) {
        const users = response.data;
        if (users.length > 0) {
            users.forEach(user => {
                const row = document.createElement('tr');
                const createdDate = new Date(user.created_at).toLocaleDateString();
                row.innerHTML = `
                    <td>
                        <div class="user-info">
                            <div class="user-initials-avatar">${getInitials(user.username)}</div>
                            <div class="user-details">
                                <div class="username">${user.username}</div>
                                <div class="email">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.role}</td>
                    <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="item-actions">
                            <button class="header-button" data-action="toggle-user-actions" data-i18n-tooltip="admin.manageUsers.table.actionsTitle">
                                <span class="material-symbols-rounded">more_vert</span>
                            </button>
                            <div class="module-content module-select disabled" id="user-actions-menu-${user.uuid}">
                                <div class="menu-content" data-menu-type="main-actions">
                                    <div class="menu-list">
                                        <div class="menu-link" data-action="show-role-menu">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">manage_accounts</span></div>
                                            <div class="menu-link-text"><span>Gestionar rol</span></div>
                                        </div>
                                        <div class="menu-link" data-action="change-status" data-uuid="${user.uuid}" data-status="suspended">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">pause</span></div>
                                            <div class="menu-link-text"><span>Suspender</span></div>
                                        </div>
                                        <div class="menu-link" data-action="change-status" data-uuid="${user.uuid}" data-status="deleted">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                                            <div class="menu-link-text"><span>Eliminar</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="menu-content" data-menu-type="role-actions" style="display: none;">
                                    <div class="menu-list">
                                        <div class="menu-link" data-action="hide-role-menu">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                                            <div class="menu-link-text"><span>Volver</span></div>
                                        </div>
                                        <div class="menu-link" data-action="change-role" data-uuid="${user.uuid}" data-role="user" data-username="${user.username}">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">person</span></div>
                                            <div class="menu-link-text"><span>Hacer Usuario</span></div>
                                        </div>
                                        <div class="menu-link" data-action="change-role" data-uuid="${user.uuid}" data-role="moderator" data-username="${user.username}">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">shield_person</span></div>
                                            <div class="menu-link-text"><span>Hacer Moderador</span></div>
                                        </div>
                                        <div class="menu-link" data-action="change-role" data-uuid="${user.uuid}" data-role="administrator" data-username="${user.username}">
                                            <div class="menu-link-icon"><span class="material-symbols-rounded">admin_panel_settings</span></div>
                                            <div class="menu-link-text"><span>Hacer Administrador</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                if (tableBody) tableBody.appendChild(row);
            });
        } else if (!append) {
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
            }
        }

        if (loadMoreContainer) {
            if (users.length < ADMIN_USERS_BATCH_SIZE) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                adminUsersCurrentPage++;
            }
        }
    } else {
        console.error('Error fetching users:', response.data);
        if (!append && statusContainer) {
            displayFetchError('[data-section="manageUsers"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }
}
async function fetchAndDisplayGalleriesAdmin(searchTerm = '', append = false) {
    if (isLoadingAdminGalleries) return;
    isLoadingAdminGalleries = true;

    const section = document.querySelector('[data-section="manageContent"]');
    if (!section) {
        isLoadingAdminGalleries = false;
        return;
    }

    const listContainer = section.querySelector('#admin-galleries-list');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#galleries-admin-load-more-container');

    if (!append) {
        adminGalleriesCurrentPage = 1;
        if (listContainer) listContainer.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getGalleries('alpha-asc', searchTerm, adminGalleriesCurrentPage, ADMIN_GALLERIES_BATCH_SIZE);
    isLoadingAdminGalleries = false;

    if (statusContainer) {
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';
    }

    if (response.ok) {
        const galleries = response.data;
        if (galleries.length > 0) {
            galleries.forEach(gallery => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.innerHTML = `
                    <div class="admin-list-item-thumbnail" style="background-image: url('${gallery.profile_picture_url || ''}')"></div>
                    <div class="admin-list-item-details">
                        <div class="admin-list-item-title">${gallery.name}</div>
                        <div class="admin-list-item-meta">UUID: ${gallery.uuid}</div>
                    </div>
                    <div class="admin-list-item-actions">
                         <button class="header-button" data-action="edit-gallery" data-uuid="${gallery.uuid}" data-i18n-tooltip="admin.manageContent.editTooltip">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="header-button" data-action="view-gallery-photos-admin" data-uuid="${gallery.uuid}" data-name="${gallery.name}" data-i18n-tooltip="admin.manageContent.viewPhotosTooltip">
                            <span class="material-symbols-rounded">image</span>
                        </button>
                    </div>
                `;
                if (listContainer) listContainer.appendChild(item);
            });
        } else if (!append) {
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
            }
        }

        if (loadMoreContainer) {
            if (galleries.length < ADMIN_GALLERIES_BATCH_SIZE) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                adminGalleriesCurrentPage++;
            }
        }
    } else {
        console.error('Error fetching galleries for admin:', response.data);
        if (!append && statusContainer) {
            displayFetchError('[data-section="manageContent"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }
}


    function setupEventListeners() {
        document.addEventListener('click', function (event) {
            const actionTarget = event.target.closest('[data-action]');
            const selectTrigger = event.target.closest('[data-action="toggle-select"]');

            const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
            if (moduleSurface && !moduleSurface.classList.contains('disabled')) {
                if (!actionTarget?.matches('[data-action="toggleModuleSurface"]') && !event.target.closest('[data-module="moduleSurface"]')) {
                    moduleSurface.classList.add('disabled');
                }
            }

            if (!selectTrigger) {
                document.querySelectorAll('.module-select:not(.photo-context-menu).active').forEach(menu => {
                    menu.classList.remove('active');
                    menu.classList.add('disabled');
                });
                document.querySelectorAll('.active-trigger').forEach(trigger => trigger.classList.remove('active-trigger'));
            }
            
            if (!event.target.closest('.item-actions')) {
                document.querySelectorAll('.module-select[id^="user-actions-menu-"]').forEach(menu => {
                    menu.classList.add('disabled');
                });
            }

            if (!event.target.closest('.card-actions-container')) {
                document.querySelectorAll('.photo-context-menu.active').forEach(menu => {
                    menu.classList.remove('active');
                    menu.classList.add('disabled');
                    menu.closest('.card-actions-container').classList.remove('force-visible');
                });
            }

            if (actionTarget) {
                const action = actionTarget.dataset.action;

                if (window.matchMedia('(max-width: 468px)').matches && actionTarget.closest('[data-module="moduleSurface"] .menu-link')) {
                    const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
                    if (moduleSurface) {
                        moduleSurface.classList.add('disabled');
                    }
                }

                if (action !== 'download-photo' && !actionTarget.closest('a[target="_blank"]')) {
                    const link = actionTarget.closest('.menu-link');
                    if (link && link.tagName.toLowerCase() === 'a' && !link.getAttribute('href').startsWith('#')) {
                    } else {
                        event.preventDefault();
                    }
                }

                switch (action) {
                    case 'submit-login':
                        const loginForm = document.getElementById('login-form');
                        if (loginForm) handleLogin(loginForm);
                        break;
                    case 'submit-register':
                        const registerForm = document.getElementById('register-form');
                        if (registerForm) handleRegister(registerForm);
                        break;
                    case 'submit-forgot-password':
                        const forgotPasswordForm = document.getElementById('forgot-password-form');
                        if (forgotPasswordForm) {
                            const currentStep = forgotPasswordForm.dataset.step || 'enter-email';
                            if (currentStep === 'enter-email') {
                                handleForgotPassword(forgotPasswordForm);
                            } else if (currentStep === 'enter-code') {
                                handleVerifyResetCode(forgotPasswordForm);
                            } else if (currentStep === 'new-password') {
                                handleUpdatePasswordFromReset(forgotPasswordForm);
                            }
                        }
                        break;
                    case 'logout':
                        handleLogout();
                        break;
                    case 'update-password':
                        showUpdatePasswordDialog();
                        break;
                    case 'delete-account':
                        showDeleteAccountDialog();
                        break;
                    case 'toggleModuleSurface':
                        const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
                        if (moduleSurface) moduleSurface.classList.toggle('disabled');
                        break;
                    case 'toggleAuth':
                        if (currentAppView === 'auth' && currentAppSection === 'login') return;
                        navigateToUrl('auth', 'login');
                        handleStateChange('auth', 'login');
                        break;
                    case 'toggleSettings':
                        if (currentAppView === 'settings' && currentAppSection === 'accessibility') return;
                        navigateToUrl('settings', 'accessibility');
                        handleStateChange('settings', 'accessibility');
                        break;
                    case 'toggleHelp':
                        if (currentAppView === 'help' && currentAppSection === 'privacyPolicy') return;
                        navigateToUrl('help', 'privacyPolicy');
                        handleStateChange('help', 'privacyPolicy');
                        break;
                    case 'toggleMainView':
                        if (currentAppView === 'main' && currentAppSection === 'home') return;
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home');
                        break;
                    case 'toggleAdminPanel':
                        if (currentAppView === 'admin' && currentAppSection === 'manageUsers') return;
                        navigateToUrl('admin', 'manageUsers');
                        handleStateChange('admin', 'manageUsers');
                        break;
                    case 'toggleSectionHome':
                    case 'toggleSectionTrends':
                    case 'toggleSectionFavorites':
                    case 'toggleSectionAccessibility':
                    case 'toggleSectionLoginSecurity':
                    case 'toggleSectionHistoryPrivacy':
                    case 'toggleSectionHistory':
                    case 'toggleSectionPrivacyPolicy':
                    case 'toggleSectionTermsConditions':
                    case 'toggleSectionCookiePolicy':
                    case 'toggleSectionSendFeedback':
                    case 'toggleSectionLogin':
                    case 'toggleSectionRegister':
                    case 'toggleSectionManageUsers':
                    case 'toggleSectionManageContent':
                    case 'toggleSectionForgotPassword':
                        const sectionName = action.substring("toggleSection".length);
                        const targetSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                        const parentMenu = actionTarget.closest('[data-menu]');
                        let targetView = parentMenu ? parentMenu.dataset.menu : currentAppView;
                        if (action === 'toggleSectionLogin' || action === 'toggleSectionRegister' || action === 'toggleSectionForgotPassword') {
                            targetView = 'auth';
                        }
                        if (currentAppView === targetView && currentAppSection === targetSection) return;
                        navigateToUrl(targetView, targetSection);
                        handleStateChange(targetView, targetSection);
                        break;
                    case 'load-more-users':
                        const homeSearch = document.querySelector('.search-input-text input');
                        fetchAndDisplayGalleries(currentSortBy, homeSearch ? homeSearch.value.trim() : '', true);
                        break;
                    case 'load-more-photos':
                        if (currentGalleryForPhotoView && currentGalleryNameForPhotoView) {
                            fetchAndDisplayGalleryPhotos(currentGalleryForPhotoView, currentGalleryNameForPhotoView, true);
                        }
                        break;
                    case 'load-more-admin-users':
                        const adminSearch = document.querySelector('#admin-user-search');
                        fetchAndDisplayUsers(adminSearch ? adminSearch.value.trim() : '', true);
                        break;
                    case 'load-more-admin-galleries':
                        const adminGallerySearch = document.querySelector('#admin-gallery-search');
                        fetchAndDisplayGalleriesAdmin(adminGallerySearch ? adminGallerySearch.value.trim() : '', true);
                        break;
                    case 'load-more-history-profiles':
                        historyProfilesShown += HISTORY_PROFILES_BATCH;
                        displayHistory();
                        break;
                    case 'load-more-history-photos':
                        historyPhotosShown += HISTORY_PHOTOS_BATCH;
                        displayHistory();
                        break;
                    case 'load-more-history-searches':
                        historySearchesShown += HISTORY_SEARCHES_BATCH;
                        displayHistory();
                        break;
                  case 'returnToUserPhotos':
    if (lastVisitedView === 'history') {
        navigateToUrl('settings', 'history');
        handleStateChange('settings', 'history');
    } else if (lastVisitedView === 'favorites') {
        navigateToUrl('main', 'favorites');
        handleStateChange('main', 'favorites');
    } else if (lastVisitedView === 'userSpecificFavorites' && lastVisitedData && lastVisitedData.uuid) {
        navigateToUrl('main', 'userSpecificFavorites', { uuid: lastVisitedData.uuid });
        handleStateChange('main', 'userSpecificFavorites', true, { uuid: lastVisitedData.uuid });
    } else if (currentGalleryForPhotoView) {
        navigateToUrl('main', 'galleryPhotos', { uuid: currentGalleryForPhotoView });
        // ✅ LÍNEA CORREGIDA: Se pasan los argumentos en el orden correcto.
        handleStateChange('main', 'galleryPhotos', true, { uuid: currentGalleryForPhotoView });
    } else {
        navigateToUrl('main', 'home');
        handleStateChange('main', 'home');
    }
    break;
                    case 'returnToHome':
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home');
                        break;
                    case 'returnToFavorites':
                        navigateToUrl('main', 'favorites');
                        handleStateChange('main', 'favorites');
                        break;
                    case 'toggle-favorite':
                        if (currentPhotoData) toggleFavorite(currentPhotoData);
                        break;
                    case 'toggle-favorite-card':
                        const photoIdFav = actionTarget.dataset.photoId;
                        const allPhotos = [...getFavorites(), ...currentGalleryPhotoList, ...currentTrendingPhotosList, ...currentHistoryPhotosList];
                        const photoDataFav = allPhotos.find(p => p.id == photoIdFav);

                        if (photoDataFav) {
                            const fullPhotoData = {
                                id: photoDataFav.id,
                                gallery_uuid: photoDataFav.gallery_uuid || currentGalleryForPhotoView,
                                photo_url: photoDataFav.photo_url,
                                gallery_name: photoDataFav.gallery_name || currentGalleryNameForPhotoView,
                                profile_picture_url: photoDataFav.profile_picture_url
                            };
                            toggleFavorite(fullPhotoData);
                            const activeSection = document.querySelector('.general-content-scrolleable > div')?.dataset.section;

                            if (activeSection === 'userSpecificFavorites') {
                                handleStateChange('main', 'userSpecificFavorites', { uuid: document.querySelector('[data-section="userSpecificFavorites"]').dataset.uuid });
                            } else if (activeSection === 'favorites') {
                                displayFavoritePhotos();
                            }
                        }
                        break;

                    case 'previous-photo':
                    case 'next-photo':
                        if (!actionTarget.classList.contains('disabled-nav')) {
                            const listToUse = currentPhotoViewList;

                            const currentId = currentPhotoData ? currentPhotoData.id : null;
                            if (!currentId || listToUse.length === 0) return;

                            const currentIndex = listToUse.findIndex(p => p.id == currentId);
                            if (currentIndex !== -1) {
                                let nextIndex = (action === 'next-photo') ? currentIndex + 1 : currentIndex - 1;
                                if (nextIndex >= 0 && nextIndex < listToUse.length) {
                                    const nextPhoto = listToUse[nextIndex];
                                    navigateToUrl('main', 'photoView', { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id });

                                    if (!adCooldownActive && Math.random() < 0.15) {
                                        adContext = 'navigation';
                                        photoAfterAd = { view: 'main', section: 'photoView', data: { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id } };
                                        handleStateChange('main', 'adView');
                                        adCooldownActive = true;
                                    } else {
                                        renderPhotoView(nextPhoto.gallery_uuid, nextPhoto.id, listToUse);
                                        adCooldownActive = false;
                                    }
                                }
                            }
                        }
                        break;

                    case 'toggle-photo-menu':
                        const currentContainer = actionTarget.closest('.card-actions-container');
                        const currentMenu = currentContainer.querySelector('.photo-context-menu');
                        const isOpening = currentMenu.classList.contains('disabled');

                        document.querySelectorAll('.photo-context-menu.active').forEach(menu => {
                            if (menu !== currentMenu) {
                                menu.classList.remove('active');
                                menu.classList.add('disabled');
                                menu.closest('.card-actions-container').classList.remove('force-visible');
                            }
                        });

                        currentMenu.classList.toggle('disabled', !isOpening);
                        currentMenu.classList.toggle('active', isOpening);
                        currentContainer.classList.toggle('force-visible', isOpening);
                        break;
                    case 'copy-link':
                        const cardForCopy = actionTarget.closest('.card');
                        const urlToCopy = `${window.location.origin}${window.BASE_PATH}/gallery/${cardForCopy.dataset.galleryUuid}/photo/${cardForCopy.dataset.photoId}`;
                        copyTextToClipboard(urlToCopy).then(() => {
                            showNotification(window.getTranslation('notifications.linkCopied'));
                            actionTarget.closest('.photo-context-menu').classList.add('disabled');
                            actionTarget.closest('.card-actions-container').classList.remove('force-visible');
                        }).catch(err => {
                            showNotification(window.getTranslation('notifications.errorCopyingLink'), 'error');
                            console.error('Failed to copy: ', err);
                        });
                        break;
                    case 'download-photo':
                        const cardForDownload = actionTarget.closest('.card.photo-card');
                        if (cardForDownload && cardForDownload.dataset.photoUrl) {
                            downloadPhoto(cardForDownload.dataset.photoUrl);
                        }
                        break;
                    case 'watch-ad-to-unlock':
                        handleStateChange('main', 'adView');
                        break;
                    case 'delete-search-item':
                        const timestamp = actionTarget.dataset.timestamp;
                        if (timestamp) {
                            removeSearchFromHistory(timestamp);
                        }
                        break;
                    case 'toggle-photo-options-menu':
                        const menu = document.querySelector('.photo-options-menu');
                        if (menu) {
                            menu.classList.toggle('disabled');
                        }
                        break;
                    case 'rotate-photo-left':
                        rotatePhoto('left');
                        break;
                    case 'rotate-photo-right':
                        rotatePhoto('right');
                        break;
                    case 'download-photo-view':
                        if (currentPhotoData && currentPhotoData.photo_url) {
                            downloadPhoto(currentPhotoData.photo_url);
                        }
                        break;
                    case 'toggle-password-visibility':
                        const wrapper = actionTarget.closest('.password-wrapper');
                        const input = wrapper.querySelector('.auth-input');
                        const icon = actionTarget.querySelector('.material-symbols-rounded');
                        if (input.type === 'password') {
                            input.type = 'text';
                            icon.textContent = 'visibility_off';
                        } else {
                            input.type = 'password';
                            icon.textContent = 'visibility';
                        }
                        break;
                    case 'toggle-user-actions': {
                        const row = actionTarget.closest('tr');
                        const menu = row.querySelector('.module-select');
                        menu.classList.toggle('disabled');
                        break;
                    }
                    case 'show-role-menu': {
                        const menuContainer = actionTarget.closest('.module-select');
                        menuContainer.querySelector('[data-menu-type="main-actions"]').style.display = 'none';
                        menuContainer.querySelector('[data-menu-type="role-actions"]').style.display = 'block';
                        break;
                    }
                    case 'hide-role-menu': {
                        const menuContainer = actionTarget.closest('.module-select');
                        menuContainer.querySelector('[data-menu-type="main-actions"]').style.display = 'block';
                        menuContainer.querySelector('[data-menu-type="role-actions"]').style.display = 'none';
                        break;
                    }
                    case 'change-role': {
                        const userUuid = actionTarget.dataset.uuid;
                        const newRole = actionTarget.dataset.role;
                        const userName = actionTarget.dataset.username;
                        showChangeRoleDialog(userUuid, newRole, userName);
                        const menuContainer = actionTarget.closest('.module-select');
                        if (menuContainer) {
                           menuContainer.classList.add('disabled');
                        }
                        break;
                    }
                    case 'change-status': {
                        const userUuid = actionTarget.dataset.uuid;
                        const newStatus = actionTarget.dataset.status;
                        api.changeUserStatus(userUuid, newStatus).then(response => {
                            if (response.ok) {
                                showNotification('Estado de usuario actualizado', 'success');
                                fetchAndDisplayUsers(document.querySelector('#admin-user-search').value.trim());
                            } else {
                                showNotification('Error al cambiar el estado', 'error');
                            }
                        });
                        break;
                    }
                    case 'view-gallery-photos-admin': {
                        const uuid = actionTarget.dataset.uuid;
                        const name = actionTarget.dataset.name;
                        navigateToUrl('main', 'galleryPhotos', { uuid });
                        handleStateChange('main', 'galleryPhotos', true, { uuid, galleryName: name });
                        break;
                    }
                    case 'edit-gallery': {
                        const uuid = actionTarget.dataset.uuid;
                        navigateToUrl('admin', 'editGallery', { uuid });
                        handleStateChange('admin', 'editGallery', true, { uuid });
                        break;
                    }
                     case 'delete-gallery-photo': {
                        const photoId = actionTarget.dataset.photoId;
                        api.deleteGalleryPhoto(photoId).then(response => {
                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                                actionTarget.closest('.photo-item-edit').remove();
                            } else {
                                showNotification(response.data.message || 'Error al eliminar la foto', 'error');
                            }
                        });
                        break;
                    }
                    case 'toggle-privacy-switch':
                        actionTarget.classList.toggle('active');
                        break;
                    case 'save-gallery-changes': {
                        const pathParts = window.location.pathname.split('/');
                        const uuid = pathParts[pathParts.length - 1];

                        const name = document.getElementById('gallery-name-edit').value.trim();
                        const privacyToggle = document.getElementById('gallery-privacy-edit');
                        const privacy = privacyToggle ? privacyToggle.classList.contains('active') : false;

                        const formData = new FormData();
                        formData.append('action_type', 'update_gallery_details');
                        formData.append('uuid', uuid);
                        formData.append('name', name);
                        formData.append('privacy', privacy);

                        api.updateGalleryDetails(formData).then(response => {
                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                            } else {
                                showNotification(response.data.message || 'Error al guardar los detalles.', 'error');
                            }
                        });

                        const profilePicInput = document.getElementById('profile-picture-upload');
                        if (profilePicInput.files.length > 0) {
                            const profilePicFormData = new FormData();
                            profilePicFormData.append('action_type', 'update_profile_picture');
                            profilePicFormData.append('uuid', uuid);
                            profilePicFormData.append('profile_picture', profilePicInput.files[0]);
                            api.updateProfilePicture(profilePicFormData).then(response => {
                                if (response.ok) {
                                    document.querySelector('.profile-picture-preview').style.backgroundImage = `url('${response.data.profile_picture_url}')`;
                                }
                            });
                        }
                        
                        const newPhotosInput = document.getElementById('new-photos-upload');
                        if (newPhotosInput.files.length > 0) {
                            const newPhotosFormData = new FormData();
                            newPhotosFormData.append('action_type', 'upload_gallery_photos');
                            newPhotosFormData.append('uuid', uuid);
                            for (const file of newPhotosInput.files) {
                                newPhotosFormData.append('photos[]', file);
                            }
                            api.uploadGalleryPhotos(newPhotosFormData).then(response => {
                                if (response.ok) {
                                    const grid = document.getElementById('gallery-photos-grid-edit');
                                    response.data.photos.forEach(photo => {
                                        const newPhotoHTML = `
                                            <div class="photo-item-edit">
                                                <img src="${photo.photo_url}" alt="Miniatura">
                                                <button class="delete-photo-btn" data-action="delete-gallery-photo" data-photo-id="${photo.id}">
                                                    <span class="material-symbols-rounded">close</span>
                                                </button>
                                            </div>`;
                                        grid.insertAdjacentHTML('afterbegin', newPhotoHTML);
                                    });
                                    newPhotosInput.value = ''; // Limpiar input
                                }
                            });
                        }
                        break;
                    }
                }
            }

            if (selectTrigger) {
                const targetId = selectTrigger.dataset.target;
                const targetSelect = document.getElementById(targetId);
                const wasActive = selectTrigger.classList.contains('active-trigger');

                document.querySelectorAll('.active-trigger').forEach(t => {
                    if (t !== selectTrigger) t.classList.remove('active-trigger');
                });
                document.querySelectorAll('.module-select').forEach(s => {
                    if (s.id !== targetId) {
                        s.classList.add('disabled');
                        s.classList.remove('active');
                    }
                });

                selectTrigger.classList.toggle('active-trigger');
                if (targetSelect) {
                    targetSelect.classList.toggle('disabled');
                    targetSelect.classList.toggle('active');
                }
            }

            const selectedOption = event.target.closest('.module-select .menu-link');
            if (selectedOption) {
                const value = selectedOption.dataset.value;
                if (value === undefined || value === null) return;

                const selectContainer = selectedOption.closest('.module-select');
                const selectId = selectContainer.id;

                if (selectId.includes('relevance-select')) {
                    if (value !== currentSortBy) {
                        currentSortBy = value;
                        const homeSearch = document.querySelector('.search-input-text input');
                        fetchAndDisplayGalleries(currentSortBy, homeSearch ? homeSearch.value.trim() : '', '');
                        updateSelectActiveState('relevance-select', currentSortBy);
                    }
                }
                else if (selectId.includes('favorites-sort-select')) {
                    if (value !== currentFavoritesSortBy) {
                        currentFavoritesSortBy = value;
                        displayFavoritePhotos();
                        updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);
                    }
                }
                else if (selectId === 'theme-select') {
                    setTheme(value);
                }
                else if (selectId === 'language-select') {
                    setLanguage(value);
                } else if (selectId.includes('history-select')) {
                    historyProfilesShown = HISTORY_PROFILES_BATCH;
                    historyPhotosShown = HISTORY_PHOTOS_BATCH;
                    historySearchesShown = HISTORY_SEARCHES_BATCH;
                    document.querySelectorAll('[data-history-view]').forEach(view => {
                        view.style.display = view.dataset.historyView === value ? '' : 'none';
                    });
                    updateSelectActiveState('history-select', value);
                    displayHistory();
                } else if (selectId === 'feedback-issue-type-select') {
                    updateSelectActiveState('feedback-issue-type-select', value);
                    const otherTitleGroup = document.getElementById('feedback-other-title-group');
                    if (otherTitleGroup) {
                        otherTitleGroup.classList.toggle('disabled', value !== 'other');
                    }
                }

                document.querySelectorAll('.module-select').forEach(menu => {
                    menu.classList.add('disabled');
                    menu.classList.remove('active');
                });
                document.querySelectorAll('.active-trigger').forEach(trigger => trigger.classList.remove('active-trigger'));
            }

            if (!actionTarget) {
                const userCardFavorite = event.target.closest('#favorites-grid-view-by-user .user-card');
                if (userCardFavorite) {
                    const uuid = userCardFavorite.dataset.uuid;
                    navigateToUrl('main', 'userSpecificFavorites', { uuid: uuid });
                    handleStateChange('main', 'userSpecificFavorites', true, { uuid: uuid });
                    return;
                }

                const galleryElement = event.target.closest('.card:not(.photo-card):not(.user-card)');
                if (galleryElement && galleryElement.dataset.uuid) {
                    const uuid = galleryElement.dataset.uuid;
                    const name = galleryElement.dataset.name;
                    const isPrivate = galleryElement.dataset.privacy == '1';

                    api.incrementGalleryInteraction(uuid);

                    if (isPrivate) {
                        navigateToUrl('main', 'privateGalleryProxy', { uuid: uuid });
                        handleStateChange('main', 'privateGalleryProxy', true, { uuid: uuid, galleryName: name });
                    } else {
                        if (!adCooldownActive && Math.random() < 0.10) {
                            adContext = 'navigation';
                            galleryAfterAd = { view: 'main', section: 'galleryPhotos', data: { uuid: uuid, galleryName: name } };
                            handleStateChange('main', 'adView');
                            adCooldownActive = true;
                        } else {
                            navigateToUrl('main', 'galleryPhotos', { uuid: uuid });
                            handleStateChange('main', 'galleryPhotos', true, { uuid: uuid, galleryName: name });
                            adCooldownActive = false;
                        }
                    }
                    return;
                }

                const photoCard = event.target.closest('.card.photo-card');
                if (photoCard) {
                    const galleryUuid = photoCard.dataset.galleryUuid || currentGalleryForPhotoView;
                    const photoId = photoCard.dataset.photoId;
                    api.incrementGalleryInteraction(galleryUuid);

                    if (!adCooldownActive && Math.random() < 0.10) {
                        adContext = 'navigation';
                        photoAfterAd = { view: 'main', section: 'photoView', data: { uuid: galleryUuid, photoId: photoId } };
                        handleStateChange('main', 'adView');
                        adCooldownActive = true;
                    } else {
                        navigateToUrl('main', 'photoView', { uuid: galleryUuid, photoId: photoId });
                        handleStateChange('main', 'photoView', true, { uuid: galleryUuid, photoId: photoId });
                        adCooldownActive = false;
                    }
                    return;
                }
            }

        });

        document.addEventListener('keydown', function (event) {
            const input = event.target;

            if (event.key === 'Enter' && input.tagName.toLowerCase() === 'input' && input.closest('.search-input-wrapper')) {
                event.preventDefault();

                let searchTerm = input.value.trim();
                if (searchTerm.length > 64) {
                    searchTerm = searchTerm.substring(0, 64);
                }
                const section = input.closest('.section-content')?.dataset.section;

                if (section === 'home') {
                    fetchAndDisplayGalleries(currentSortBy, searchTerm);
                } else if (section === 'trends') {
                    fetchAndDisplayTrends(searchTerm);
                } else if (section === 'favorites') {
                    displayFavoritePhotos();
                } else if (section === 'manageUsers') {
                    fetchAndDisplayUsers(searchTerm);
                } else if (section === 'manageContent') {
                    fetchAndDisplayGalleriesAdmin(searchTerm);
                }
            }

            const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
            if (event.key === 'Escape' && moduleSurface && !moduleSurface.classList.contains('disabled')) {
                moduleSurface.classList.add('disabled');
            }
        });
    }

    function setupScrollShadows() {
        activeScrollHandlers.forEach(({ element, listener }) => {
            element.removeEventListener('scroll', listener);
        });
        activeScrollHandlers = [];

        const mainScrolleable = document.querySelector('.general-content-scrolleable');
        const mainHeader = document.querySelector('.general-content-top');

        if (mainScrolleable && mainHeader) {
            const mainListener = () => {
                mainHeader.classList.toggle('shadow', mainScrolleable.scrollTop > 0);
            };
            mainScrolleable.addEventListener('scroll', mainListener);
            activeScrollHandlers.push({ element: mainScrolleable, listener: mainListener });
            mainListener();
        }

        const sectionScrolleable = document.querySelector('.section-content-block.overflow-y');
        const sectionHeader = document.querySelector('.section-content-header');

        if (sectionScrolleable && sectionHeader) {
            const sectionListener = () => {
                sectionHeader.classList.toggle('shadow', sectionScrolleable.scrollTop > 0);
            };
            sectionScrolleable.addEventListener('scroll', sectionListener);
            activeScrollHandlers.push({ element: sectionScrolleable, listener: sectionListener });
            sectionListener();
        }
    }


    function updateHeaderAndMenuStates(view, section) {
        document.querySelectorAll('[data-menu]').forEach(menu => {
            menu.classList.toggle('active', menu.dataset.menu === view);
            menu.classList.toggle('disabled', menu.dataset.menu !== view);
        });

        document.querySelectorAll('[data-module="moduleSurface"] .menu-link').forEach(link => {
            const linkAction = link.dataset.action || '';
            let linkSection = '';
            if (linkAction.startsWith('toggleSection')) {
                const sectionName = linkAction.substring("toggleSection".length);
                linkSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
            }
            link.classList.toggle('active', linkSection === section);
        });
    }

    function setupMoreOptionsMenu() {
        const relevanceSelectMobile = document.getElementById('relevance-select-mobile');
        const relevanceSelect = document.getElementById('relevance-select');
        const favoritesSortSelectMobile = document.getElementById('favorites-sort-select-mobile');
        const favoritesSortSelect = document.getElementById('favorites-sort-select');

        if (relevanceSelectMobile && relevanceSelect) {
            relevanceSelectMobile.innerHTML = relevanceSelect.innerHTML;
        }
        if (favoritesSortSelectMobile && favoritesSortSelect) {
            favoritesSortSelectMobile.innerHTML = favoritesSortSelect.innerHTML;
        }
    }

    async function handleStateChange(view, section, pushState = true, data) {
        const contentContainer = document.querySelector('.general-content-scrolleable');
        if (contentContainer) {
            contentContainer.innerHTML = loaderHTML;
        }

        const protected_sections = [
            'settings-loginSecurity',
            'settings-history',
            'admin-manageUsers',
            'admin-manageContent',
            'admin-editGallery'
        ];
        const section_key = view + '-' + section;

        if (protected_sections.includes(section_key)) {
            const sessionResponse = await api.checkSession();
            if (!sessionResponse.ok || !sessionResponse.data.loggedin) {
                navigateToUrl('auth', 'login');
                handleStateChange('auth', 'login');
                return;
            }
        }


        if (view === 'admin') {
            const sessionResponse = await api.checkSession();
            if (!sessionResponse.ok || !sessionResponse.data.loggedin || sessionResponse.data.user.role !== 'administrator') {
                handleStateChange('main', '404');
                return;
            }
        }

        updateHeaderAndMenuStates(view, section);
        currentAppView = view;
        currentAppSection = section;

        const response = await api.getSectionHTML(view, section);

        if (response.ok) {
            if (contentContainer) {
                contentContainer.innerHTML = response.data;
                window.applyTranslations(contentContainer);
            }
        } else {
            console.error("Failed to fetch section:", response.data);
            if (response.status === 403) {
                navigateToUrl('auth', 'login');
                handleStateChange('auth', 'login');
            } else if (contentContainer) {
                displayFetchError('.general-content-scrolleable', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
            }
            return;
        }

        if (section !== 'photoView') {
            lastVisitedView = section;
            lastVisitedData = data;
        }

        switch (section) {
            case 'home':
                setupMoreOptionsMenu();
                updateSelectActiveState('relevance-select', currentSortBy);
                fetchAndDisplayGalleries(currentSortBy);
                break;
            case 'favorites':
                setupMoreOptionsMenu();
                updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);
                displayFavoritePhotos();
                break;
            case 'trends':
                fetchAndDisplayTrends();
                break;
            case 'manageUsers':
                fetchAndDisplayUsers();
                break;
            case 'manageContent':
                fetchAndDisplayGalleriesAdmin();
                break;
            case 'editGallery':
                if (data && data.uuid) {
                    const response = await api.getGalleryForEdit(data.uuid);
                    if (response.ok) {
                        renderEditGalleryForm(response.data);
                    } else {
                        handleStateChange('main', '404');
                    }
                }
                break;
            case 'accessibility':
                updateThemeSelectorUI(localStorage.getItem('theme') || 'system');
                updateLanguageSelectorUI(localStorage.getItem('language') || 'es-419');
                initSettingsController();
                break;
            case 'loginSecurity':
                {
                    const sessionResponse = await api.checkSession();
                    if (sessionResponse.ok && sessionResponse.data.loggedin && sessionResponse.data.user) {
                        const passwordLastUpdatedEl = document.getElementById('password-last-updated');

                        if (passwordLastUpdatedEl) {
                            if (sessionResponse.data.user.password_last_updated_at) {
                                const date = new Date(sessionResponse.data.user.password_last_updated_at);
                                const formattedDate = date.toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                                passwordLastUpdatedEl.textContent = window.getTranslation('settings.loginSecurity.passwordLastUpdated', {
                                    date: formattedDate
                                });
                            } else {
                                passwordLastUpdatedEl.textContent = window.getTranslation('settings.loginSecurity.passwordLastUpdatedNever');
                            }
                        }

                        const deleteAccountDescriptionEl = document.getElementById('delete-account-description');
                        if (deleteAccountDescriptionEl && sessionResponse.data.user.created_at) {
                            const creationDate = new Date(sessionResponse.data.user.created_at);
                            const formattedCreationDate = creationDate.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });
                            deleteAccountDescriptionEl.textContent = window.getTranslation('settings.loginSecurity.deleteAccountDescription', {
                                date: formattedCreationDate
                            });
                        }
                    }
                }
                break;
            case 'login':
                fetchAndSetCsrfToken('login-form');
                break;
            case 'register':
                fetchAndSetCsrfToken('register-form');
                break;
            case 'forgotPassword':
                const form = document.getElementById('forgot-password-form');
                const step = data?.step || 'enter-email';
                form.dataset.step = step;

                const emailGroup = form.querySelector('#email-group');
                const codeGroup = form.querySelector('#code-group');
                const passwordGroup = form.querySelector('#password-group');
                const button = form.querySelector('[data-action="submit-forgot-password"]');
                const buttonText = button.querySelector('.button-text');
                const title = document.querySelector('.auth-container h2');
                const subtitle = document.querySelector('.auth-container p:not(.auth-switch-prompt)');

                emailGroup.style.display = 'none';
                codeGroup.style.display = 'none';
                passwordGroup.style.display = 'none';

                if (step === 'enter-email') {
                    emailGroup.style.display = 'block';
                    title.setAttribute('data-i18n', 'auth.forgotPasswordTitle');
                    subtitle.setAttribute('data-i18n', 'auth.forgotPasswordSubtitle');
                    buttonText.setAttribute('data-i18n', 'auth.forgotPasswordButton');
                } else if (step === 'enter-code') {
                    codeGroup.style.display = 'block';
                    const emailInput = form.querySelector('#reset-email');
                    if(data && data.email) emailInput.value = data.email;
                    title.setAttribute('data-i18n', 'auth.enterCodeTitle');
                    subtitle.setAttribute('data-i18n', 'auth.enterCodeSubtitle');
                    buttonText.setAttribute('data-i18n', 'auth.verifyCodeButton');
                    
                    const codeInput = form.querySelector('#reset-code');
                    if (codeInput) {
                        codeInput.addEventListener('input', (e) => {
                            let input = e.target;
                            let sanitizedValue = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                            
                            if (sanitizedValue.length > 6) {
                                sanitizedValue = sanitizedValue.substring(0, 6);
                            }

                            if (sanitizedValue.length > 3) {
                                input.value = sanitizedValue.substring(0, 3) + '-' + sanitizedValue.substring(3);
                            } else {
                                input.value = sanitizedValue;
                            }
                        });
                    }

                } else if (step === 'new-password') {
                    passwordGroup.style.display = 'flex';
                    const emailInput = form.querySelector('#reset-email');
                    if(data && data.email) emailInput.value = data.email;
                    const codeInput = form.querySelector('#reset-code');
                    if(data && data.code) codeInput.value = data.code;
                    title.setAttribute('data-i18n', 'auth.newPasswordTitle');
                    subtitle.setAttribute('data-i18n', 'auth.newPasswordSubtitle');
                    buttonText.setAttribute('data-i18n', 'auth.resetPasswordButton');
                }
                
                applyTranslations(form.parentElement);
                fetchAndSetCsrfToken('forgot-password-form');
                break;
            case 'history':
                historyProfilesShown = HISTORY_PROFILES_BATCH;
                historyPhotosShown = HISTORY_PHOTOS_BATCH;
                historySearchesShown = HISTORY_SEARCHES_BATCH;
                displayHistory();
                break;
            case 'historyPrivacy':
                initHistoryPrivacySettings();
                break;
            case 'privateGalleryProxy':
                if (data && data.uuid) {
                    if (isPrivateGalleryUnlocked(data.uuid)) {
                        navigateToUrl('main', 'galleryPhotos', { uuid: data.uuid });
                        handleStateChange('main', 'galleryPhotos', true, { uuid: data.uuid, galleryName: data.galleryName });
                    } else {
                        promptToWatchAd(data.uuid, data.galleryName);
                    }
                }
                break;
            case 'galleryPhotos':
                if (data && data.uuid) {
                    const response = await api.getGalleryDetails(data.uuid);
                    if (response.ok) {
                        const gallery = response.data;
                        if (gallery && gallery.name) {
                            if (gallery.privacy == 1 && !isPrivateGalleryUnlocked(gallery.uuid)) {
                                const privateUrl = generateUrl('main', 'privateGalleryProxy', { uuid: gallery.uuid });
                                history.replaceState({ view: 'main', section: 'privateGalleryProxy', data: { uuid: gallery.uuid, galleryName: gallery.name } }, '', privateUrl);
                                handleStateChange('main', 'privateGalleryProxy', false, { uuid: gallery.uuid, galleryName: gallery.name });
                            } else {
                                addToHistory('profiles', {
                                    id: gallery.uuid,
                                    name: gallery.name,
                                    privacy: gallery.privacy,
                                    profile_picture_url: gallery.profile_picture_url,
                                    background_photo_url: gallery.background_photo_url
                                });
                                fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name);
                            }
                        } else {
                            handleStateChange('main', '404');
                        }
                    } else {
                        console.error("Failed to fetch gallery info:", response.data);
                        handleStateChange('main', '404');
                    }
                }
                break;

            case 'photoView':
                if (data && data.uuid && data.photoId) {
                    let photoListPromise;

                    if (lastVisitedView === 'userSpecificFavorites' && lastVisitedData && lastVisitedData.uuid) {
                        photoListPromise = Promise.resolve(getFavorites().filter(p => p.gallery_uuid === data.uuid));
                    } else if (lastVisitedView === 'favorites') {
                        photoListPromise = Promise.resolve(currentFavoritesList);
                    } else if (lastVisitedView === 'trends') {
                        photoListPromise = Promise.resolve(currentTrendingPhotosList);
                    } else if (lastVisitedView === 'history') {
                        currentHistoryPhotosList = getHistory().photos;
                        photoListPromise = Promise.resolve(currentHistoryPhotosList);
                    } else {
                        if (currentGalleryForPhotoView === data.uuid && currentGalleryPhotoList.length > 0) {
                            photoListPromise = Promise.resolve(currentGalleryPhotoList);
                        } else {
                            photoListPromise = api.getGalleryPhotos(data.uuid, 1, 1000)
                                .then(response => {
                                    if (response.ok) {
                                        currentGalleryPhotoList = response.data;
                                        currentGalleryForPhotoView = data.uuid;
                                        return response.data;
                                    }
                                    return [];
                                });
                        }
                    }

                    photoListPromise.then(photoList => {
                        currentPhotoViewList = photoList;
                        renderPhotoView(data.uuid, data.photoId, currentPhotoViewList);
                    });
                }
                break;

            case 'sendFeedback':
                const uploadBtn = document.getElementById('feedback-upload-btn');
                const fileInput = document.getElementById('feedback-file-input');
                const previewContainer = document.getElementById('feedback-file-preview');
                const otherTitleGroup = document.getElementById('feedback-other-title-group');
                const sendBtn = document.getElementById('send-feedback-btn');
                let uploadedFiles = [];
                const MAX_FILES = 3;

                const updateUploadButtonState = () => {
                    if (uploadedFiles.length >= MAX_FILES) {
                        uploadBtn.disabled = true;
                    } else {
                        uploadBtn.disabled = false;
                    }
                };

                const renderPreviews = () => {
                    previewContainer.innerHTML = '';
                    uploadedFiles.forEach((file, index) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const previewItem = document.createElement('div');
                            previewItem.className = 'file-preview-item';
                            previewItem.innerHTML = `<img src="${e.target.result}" class="file-preview-img"><button class="file-preview-remove-btn" data-index="${index}"><span class="material-symbols-rounded">close</span></button>`;
                            previewContainer.appendChild(previewItem);
                        };
                        reader.readAsDataURL(file);
                    });
                };

                updateSelectActiveState('feedback-issue-type-select', null);
                if (otherTitleGroup) {
                    otherTitleGroup.classList.add('disabled');
                }

                if (uploadBtn && fileInput) {
                    uploadBtn.addEventListener('click', () => fileInput.click());

                    fileInput.addEventListener('change', (event) => {
                        const newFiles = Array.from(event.target.files);
                        if (uploadedFiles.length + newFiles.length > MAX_FILES) {
                            showNotification(`Puedes subir un máximo de ${MAX_FILES} archivos.`, 'error');
                            fileInput.value = "";
                            return;
                        }
                        uploadedFiles.push(...newFiles);
                        renderPreviews();
                        updateUploadButtonState();
                        fileInput.value = "";
                    });
                }

                if (previewContainer) {
                    previewContainer.addEventListener('click', (event) => {
                        const removeBtn = event.target.closest('.file-preview-remove-btn');
                        if (removeBtn) {
                            const indexToRemove = parseInt(removeBtn.dataset.index, 10);
                            uploadedFiles.splice(indexToRemove, 1);
                            renderPreviews();
                            updateUploadButtonState();
                        }
                    });
                }

                if (sendBtn) {
                    sendBtn.addEventListener('click', async () => {
                        const issueType = document.querySelector('#feedback-issue-type-select .menu-link.active')?.dataset.value;
                        const otherTitle = document.getElementById('feedback-other-title').value.trim();
                        const description = document.getElementById('feedback-description').value.trim();

                        if (!issueType) {
                            showNotification(window.getTranslation('notifications.selectIssueType'), 'error');
                            return;
                        }

                        const formData = new FormData();
                        formData.append('action_type', 'submit_feedback');
                        formData.append('issue_type', issueType);
                        formData.append('other_title', otherTitle);
                        formData.append('description', description);

                        uploadedFiles.forEach(file => {
                            formData.append('attachments[]', file, file.name);
                        });

                        sendBtn.disabled = true;
                        sendBtn.classList.add('loading');

                        const response = await api.submitFeedback(formData);
                        sendBtn.disabled = false;
                        sendBtn.classList.remove('loading');

                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            const form = document.querySelector('.feedback-form-container');
                            if (form) {
                                const inputs = form.querySelectorAll('input, textarea');
                                inputs.forEach(input => input.value = '');
                                updateSelectActiveState('feedback-issue-type-select', null);
                                otherTitleGroup.classList.add('disabled');
                            }
                            previewContainer.innerHTML = '';
                            uploadedFiles = [];
                            updateUploadButtonState();
                        } else {
                            showNotification(response.data.message || 'Error al enviar el comentario.', 'error');
                        }
                    });
                }
                break;

            case 'accessCodePrompt':
                if (data && data.uuid) {
                    const titleElement = document.getElementById('access-code-title');
                    const response = await api.getGalleryDetails(data.uuid);
                    if (response.ok) {
                        const gallery = response.data;
                        if (gallery && gallery.name && titleElement) {
                            titleElement.textContent = window.getTranslation('accessCodePrompt.galleryOf', { galleryName: gallery.name });
                        }
                    }
                }
                break;
            case 'adView':
                const adTitle = document.getElementById('ad-title');
                const adContentTitle = document.getElementById('ad-content-title');
                const timerElement = document.getElementById('ad-timer');
                const skipButton = document.getElementById('skip-ad-button');

                if (adCountdownInterval) {
                    clearInterval(adCountdownInterval);
                }

                function startAdCountdown() {
                    let countdown = 5;
                    timerElement.textContent = countdown;
                    skipButton.disabled = true;

                    adCountdownInterval = setInterval(() => {
                        countdown--;
                        timerElement.textContent = countdown;
                        if (countdown <= 0) {
                            clearInterval(adCountdownInterval);
                            timerElement.textContent = '0';
                            skipButton.disabled = false;
                        }
                    }, 1000);
                }

                if (adContext === 'unlock') {
                    adTitle.textContent = window.getTranslation('adView.adOf', { current: adStep, total: 2 });
                    adContentTitle.textContent = window.getTranslation('adView.adContentTitle');
                    skipButton.textContent = (adStep === 1) ? window.getTranslation('adView.nextAd') : window.getTranslation('adView.skipAd');
                    startAdCountdown();

                    skipButton.onclick = () => {
                        if (adStep === 1) {
                            adStep = 2;
                            handleStateChange('main', 'adView');
                        } else {
                            const destination = galleryAfterAd;
                            if (destination) {
                                const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
                                const galleryUuidToUnlock = destination.data.uuid;
                                unlockedGalleries[galleryUuidToUnlock] = new Date().getTime();
                                localStorage.setItem('unlockedGalleries', JSON.stringify(unlockedGalleries));

                                navigateToUrl(destination.view, destination.section, destination.data);
                                handleStateChange(destination.view, destination.section, true, destination.data);
                                galleryAfterAd = null;
                            }
                            adContext = 'navigation';
                        }
                    };
                } else {
                    adTitle.textContent = window.getTranslation('adView.ad');
                    adContentTitle.textContent = window.getTranslation('adView.adContentTitle');
                    skipButton.textContent = window.getTranslation('adView.skipAd');
                    startAdCountdown();

                    skipButton.onclick = () => {
                        const destination = galleryAfterAd || photoAfterAd;
                        if (destination) {
                            navigateToUrl(destination.view, destination.section, destination.data);
                            handleStateChange(destination.view, destination.section, true, destination.data);
                            photoAfterAd = null;
                            galleryAfterAd = null;
                        } else {
                            navigateToUrl('main', 'home');
                            handleStateChange('main', 'home');
                        }
                    };
                }
                break;
            case 'userSpecificFavorites':
                if (data && data.uuid) {
                    const userFavorites = getFavorites().filter(p => p.gallery_uuid === data.uuid);
                    const sectionEl = document.querySelector('[data-section="userSpecificFavorites"]');
                    if (sectionEl) {
                        const grid = sectionEl.querySelector('#user-specific-favorites-grid');
                        const statusContainer = sectionEl.querySelector('.status-message-container');
                        const title = sectionEl.querySelector('#user-specific-favorites-title');
                        sectionEl.dataset.uuid = data.uuid;

                        if (userFavorites.length > 0) {
                            grid.innerHTML = '';
                            grid.classList.remove('disabled');
                            statusContainer.classList.add('disabled');
                            title.textContent = window.getTranslation('userSpecificFavorites.titleFrom', { userName: userFavorites[0].gallery_name });
                            userFavorites.forEach(photo => {
                                const card = document.createElement('div');
                                card.className = 'card photo-card';
                                card.dataset.photoUrl = photo.photo_url;
                                card.dataset.photoId = photo.id;
                                card.dataset.galleryUuid = photo.gallery_uuid;
                                const background = document.createElement('div');
                                background.className = 'card-background';
                                background.style.backgroundImage = `url('${photo.photo_url}')`;
                                card.appendChild(background);
                                const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${photo.gallery_uuid}/photo/${photo.id}`;
                                card.innerHTML += `<div class="card-actions-container"><div class="card-hover-overlay"><div class="card-hover-icons"><div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div><div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div></div></div><div class="module-content module-select photo-context-menu disabled body-title"><div class="menu-content"><div class="menu-list"><a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.openInNewTab')}</span></div></a><div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.copyLink')}</span></div></div><a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.download')}</span></div></a></div></div></div></div>`;
                                grid.appendChild(card);
                            });
                        } else {
                            grid.innerHTML = '';
                            grid.classList.add('disabled');
                            statusContainer.classList.remove('disabled');
                            title.textContent = window.getTranslation('userSpecificFavorites.title');
                            statusContainer.innerHTML = `<div><h2>${window.getTranslation('userSpecificFavorites.noUserFavoritesTitle')}</h2><p>${window.getTranslation('userSpecificFavorites.noUserFavoritesMessage')}</p></div>`;
                        }
                    }
                }
                break;
        }

        setupScrollShadows();
        updateHeaderAndMenuStates(view, section);
        initTooltips();
        applyTranslations(document.body);
    }
    
    function renderEditGalleryForm(gallery) {
        const container = document.getElementById('edit-gallery-form-container');
        const titleEl = document.getElementById('edit-gallery-title');

        if (!container || !titleEl) return;

        titleEl.textContent = window.getTranslation('admin.editGallery.title', { galleryName: gallery.name });

        let photosHTML = '';
        gallery.photos.forEach(photo => {
            photosHTML += `
                <div class="photo-item-edit">
                    <img src="${photo.photo_url}" alt="Miniatura">
                    <button class="delete-photo-btn" data-action="delete-gallery-photo" data-photo-id="${photo.id}">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="edit-section">
                <h4 data-i18n="admin.editGallery.detailsTitle"></h4>
                <div class="form-group">
                    <label class="form-label" for="gallery-name-edit" data-i18n="admin.editGallery.nameLabel"></label>
                    <input type="text" id="gallery-name-edit" class="feedback-input" value="${gallery.name}" maxlength="100">
                </div>
                <div class="form-group">
                    <label class="form-label" data-i18n="admin.editGallery.privacyLabel"></label>
                    <div class="toggle-switch ${gallery.privacy == 1 ? 'active' : ''}" id="gallery-privacy-edit" data-action="toggle-privacy-switch">
                        <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                    </div>
                </div>
            </div>

            <div class="edit-section">
                <h4 data-i18n="admin.editGallery.profilePictureTitle"></h4>
                <div class="profile-picture-edit-container">
                    <div class="profile-picture-preview" style="background-image: url('${gallery.profile_picture_url || ''}')"></div>
                    <input type="file" id="profile-picture-upload" accept="image/*" style="display: none;">
                    <button class="load-more-btn" onclick="document.getElementById('profile-picture-upload').click();" data-i18n="admin.editGallery.changeButton"></button>
                </div>
            </div>

            <div class="edit-section">
                <h4 data-i18n="admin.editGallery.photosTitle"></h4>
                <div class="photo-grid-edit" id="gallery-photos-grid-edit">
                    ${photosHTML}
                </div>
            </div>
            
            <div class="edit-section">
                <h4 data-i18n="admin.editGallery.addPhotosTitle"></h4>
                <div class="upload-new-photos-container">
                    <input type="file" id="new-photos-upload" multiple accept="image/*" style="display:none;">
                    <label for="new-photos-upload" data-i18n="admin.editGallery.uploadLabel"></label>
                </div>
            </div>
        `;

        applyTranslations(container);
    }

    // --- INICIALIZACIÓN ---
    setupEventListeners();
    checkSessionStatus();
    startUnlockCountdownTimer();

    setupPopStateHandler((view, section, pushState, data) => {
        handleStateChange(view, section, pushState, data);
    });

    const path = window.location.pathname.replace(window.BASE_PATH || '', '').slice(1);

    const routes = {
        '': { view: 'main', section: 'home' },
        'trends': { view: 'main', section: 'trends' },
        'favorites': { view: 'main', section: 'favorites' },
        'settings/accessibility': { view: 'settings', section: 'accessibility' },
        'settings/login-security': { view: 'settings', section: 'loginSecurity' },
        'settings/history-privacy': { view: 'settings', section: 'historyPrivacy' },
        'settings/history': { view: 'settings', section: 'history' },
        'help/privacy-policy': { view: 'help', section: 'privacyPolicy' },
        'help/terms-conditions': { view: 'help', section: 'termsConditions' },
        'help/cookie-policy': { view: 'help', section: 'cookiePolicy' },
        'help/send-feedback': { view: 'help', section: 'sendFeedback' },
        'login': { view: 'auth', section: 'login' },
        'register': { view: 'auth', section: 'register' },
        'forgot-password': { view: 'auth', section: 'forgotPassword', data: { step: 'enter-email' } },
        'forgot-password/enter-code': { view: 'auth', section: 'forgotPassword', data: { step: 'enter-code' } },
        'forgot-password/new-password': { view: 'auth', section: 'forgotPassword', data: { step: 'new-password' } },
        'admin/users': { view: 'admin', section: 'manageUsers' },
        'admin/content': { view: 'admin', section: 'manageContent' }
    };
    let initialRoute = routes[path] || null;
    let initialStateData = initialRoute ? initialRoute.data : null;

    const privateGalleryMatch = path.match(/^gallery\/private\/([a-f0-9-]{36})$/);
    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);
    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const userFavoritesMatch = path.match(/^favorites\/([a-f0-9-]{36})$/);
    const editGalleryMatch = path.match(/^admin\/edit-gallery\/([a-f0-9-]{36})$/);

    if (privateGalleryMatch) {
        initialRoute = { view: 'main', section: 'privateGalleryProxy' };
        initialStateData = { uuid: privateGalleryMatch[1] };
    } else if (photoMatch) {
        initialRoute = { view: 'main', section: 'photoView' };
        initialStateData = { uuid: photoMatch[1], photoId: photoMatch[2] };
    } else if (editGalleryMatch) {
        initialRoute = { view: 'admin', section: 'editGallery' };
        initialStateData = { uuid: editGalleryMatch[1] };
    } else if (galleryMatch) {
        initialRoute = { view: 'main', section: 'galleryPhotos' };
        initialStateData = { uuid: galleryMatch[1] };
    } else if (userFavoritesMatch) {
        initialRoute = { view: 'main', section: 'userSpecificFavorites' };
        initialStateData = { uuid: userFavoritesMatch[1] };
    }

    if (!initialRoute) {
        initialRoute = { view: 'main', section: '404' };
    }

    setInitialHistoryState(initialRoute.view, initialRoute.section, initialStateData);
    handleStateChange(initialRoute.view, initialRoute.section, true, initialStateData);

    if (initialRoute.section !== 'photoView') {
        lastVisitedView = initialRoute.section;
        lastVisitedData = initialStateData;
    }
}