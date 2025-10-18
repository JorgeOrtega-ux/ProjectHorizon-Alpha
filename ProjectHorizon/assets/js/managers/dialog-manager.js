// assets/js/managers/dialog-manager.js

import * as api from '../core/api-handler.js';
import { applyTranslations } from './language-manager.js';
import { showNotification } from './notification-manager.js';

/**
 * Muestra un diálogo modal dinámico con opciones configurables.
 * @param {object} options - Opciones para configurar el diálogo.
 */
function showDialog(options) {
    const existingOverlay = document.getElementById('dialog-overlay');
    if (existingOverlay) {
        existingOverlay.parentNode.removeChild(existingOverlay);
    }

    const overlay = document.createElement('div');
    overlay.id = 'dialog-overlay';
    overlay.className = 'custom-confirm-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.className = 'custom-confirm-box';

    let buttonsHTML = '<div class="custom-confirm-buttons">';
    options.buttons.forEach((btn, index) => {
        buttonsHTML += `<button id="dialog-btn-${index}" class="load-more-btn ${btn.className || ''}" ${btn.disabled ? 'disabled' : ''}><span class="button-text">${btn.text}</span><div class="button-spinner"></div></button>`;
    });
    buttonsHTML += '</div>';

    dialogBox.innerHTML = `
        ${options.iconHTML || ''}
        <h2 id="dialog-title">${options.title}</h2>
        <div id="dialog-content">${options.contentHTML}</div>
        ${buttonsHTML}
    `;

    overlay.appendChild(dialogBox);
    document.body.appendChild(overlay);

    const closeDialog = () => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    };

    options.buttons.forEach((btn, index) => {
        const buttonElement = document.getElementById(`dialog-btn-${index}`);
        if(buttonElement) {
            buttonElement.addEventListener('click', () => {
                if (btn.onClick) {
                    btn.onClick({
                        close: closeDialog,
                        startLoading: () => buttonElement.classList.add('loading'),
                        stopLoading: () => buttonElement.classList.remove('loading'),
                        getDialogElement: () => dialogBox
                    });
                }
            });
        }
    });

    applyTranslations(dialogBox);

    if (options.onOpen) {
        options.onOpen(dialogBox);
    }
}


/**
 * Muestra un diálogo de confirmación simple con botones de Confirmar y Cancelar.
 * @param {string} title - Título del diálogo.
 * @param {string} message - Mensaje del diálogo.
 * @returns {Promise<boolean>} - Promesa que se resuelve a `true` si se confirma, `false` si se cancela.
 */
export async function showCustomConfirm(title, message) {
    return new Promise((resolve) => {
        showDialog({
            title: title,
            contentHTML: `<p>${message}</p>`,
            buttons: [
                {
                    text: window.getTranslation('general.cancel'),
                    onClick: ({ close }) => {
                        close();
                        resolve(false);
                    }
                },
                {
                    text: window.getTranslation('general.confirm'),
                    className: 'btn-danger',
                    onClick: ({ close }) => {
                        close();
                        resolve(true);
                    }
                }
            ]
        });
    });
}

/**
 * Muestra el diálogo para reportar un comentario con un selector de motivos.
 * @param {number} commentId - El ID del comentario a reportar.
 * @returns {Promise<boolean>} - Promesa que se resuelve a `true` si el reporte fue exitoso, `false` en caso contrario.
 */
// assets/js/managers/dialog-manager.js

export async function showReportCommentDialog(commentId) {
    return new Promise((resolve) => {
        // Define las claves y sus iconos correspondientes.
        const reportReasons = {
            'spam': 'campaign',
            'hate_speech': 'record_voice_over',
            'harassment': 'personal_injury',
            'false_info': 'help_outline',
            'inappropriate': 'gavel',
            'other': 'more_horiz'
        };

        // Construye el HTML del menú desplegable usando los iconos definidos.
        const optionsHTML = Object.entries(reportReasons).map(([key, icon]) => `
            <div class="menu-link" data-value="${key}">
                <div class="menu-link-icon"><span class="material-symbols-rounded">${icon}</span></div>
                <div class="menu-link-text">
                    <span data-i18n="dialogs.reportComment.reasons.${key}"></span>
                </div>
            </div>
        `).join('');

        showDialog({
            title: window.getTranslation('dialogs.reportComment.title'),
            contentHTML: `
                <p data-i18n="dialogs.reportComment.description"></p>
                <div class="select-wrapper body-title" style="margin-top: 16px;">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="report-reason-select">
                        <div class="select-trigger-icon">
                            <span class="material-symbols-rounded">flag</span>
                        </div>
                        <span class="select-trigger-text" data-i18n="dialogs.reportComment.selectReason"></span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="report-reason-select">
                        <div class="menu-content"><div class="menu-list">${optionsHTML}</div></div>
                    </div>
                </div>
                <div class="auth-error-message-container" id="report-error-container" style="display: none; margin-top: 12px;">
                    <ul id="report-error-list"></ul>
                </div>
            `,
            buttons: [
                {
                    text: window.getTranslation('general.cancel'),
                    onClick: ({ close }) => {
                        close();
                        resolve(false);
                    }
                },
                {
                    text: window.getTranslation('dialogs.reportComment.reportButton'),
                    className: 'btn-danger',
                    onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                        const selectedReasonElement = getDialogElement().querySelector('#report-reason-select .menu-link.active');
                        const reason = selectedReasonElement ? selectedReasonElement.dataset.value : null;
                        const errorContainer = getDialogElement().querySelector('#report-error-container');
                        const errorList = getDialogElement().querySelector('#report-error-list');

                        if (!reason) {
                            errorList.innerHTML = `<li>${window.getTranslation('dialogs.reportComment.errorNoReason')}</li>`;
                            errorContainer.style.display = 'block';
                            return;
                        }

                        errorContainer.style.display = 'none';
                        startLoading();
                        
                        const response = await api.reportComment(commentId, reason);
                        stopLoading();

                        if (response.ok) {
                            showNotification(window.getTranslation('dialogs.reportComment.success'), 'success');
                            close();
                            resolve(true);
                        } else {
                            errorList.innerHTML = `<li>${response.data.message || 'Error al enviar el reporte.'}</li>`;
                            errorContainer.style.display = 'block';
                            resolve(false);
                        }
                    }
                }
            ],
            onOpen: (dialogBox) => {
                const options = dialogBox.querySelectorAll('#report-reason-select .menu-link');
                const triggerText = dialogBox.querySelector('.select-trigger-text');
                const selectMenu = dialogBox.querySelector('#report-reason-select');

                options.forEach(option => {
                    option.addEventListener('click', () => {
                        options.forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                        // --- INICIO DE LA CORRECCIÓN ---
                        // Se selecciona solo el texto de la razón, ignorando el icono.
                        triggerText.textContent = option.querySelector('.menu-link-text span').textContent.trim();
                        // --- FIN DE LA CORRECCIÓN ---
                        
                        selectMenu.classList.add('disabled');
                        selectMenu.classList.remove('active');
                        const trigger = dialogBox.querySelector('[data-target="report-reason-select"]');
                        if (trigger) trigger.classList.remove('active-trigger');
                    });
                });
            }
        });
    });
}


function getInitials(name) {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length > 1 && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Muestra el flujo de diálogos para actualizar la contraseña del usuario.
 */
export async function showUpdatePasswordDialog() {
    const sessionResponse = await api.checkSession();
    if (!sessionResponse.ok || !sessionResponse.data.loggedin) return;

    const user = sessionResponse.data.user;
    const userInitial = getInitials(user.username);

    const renderUpdateStep = async (closeVerificationDialog) => {
        closeVerificationDialog();
        const tokenResponse = await api.getCsrfToken();
        if (!tokenResponse.ok) return;

        showDialog({
            iconHTML: `<div class="dialog-icon"><span class="material-symbols-rounded">password</span></div>`,
            title: window.getTranslation('dialogs.enterNewPasswordTitle'),
            contentHTML: `
                <div class="dialog-user-chip">
                    <div class="dialog-user-initial">${userInitial}</div>
                    <span class="dialog-user-email">${user.email}</span>
                </div>
                <p>${window.getTranslation('dialogs.enterNewPasswordMessage')}</p>
                <input type="hidden" name="csrf_token" value="${tokenResponse.data.csrf_token}">
                <div class="form-field password-wrapper">
                    <input type="password" id="new-password" class="auth-input" placeholder=" " autocomplete="new-password">
                    <label for="new-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                    <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
                </div>
                <div class="form-field password-wrapper">
                    <input type="password" id="confirm-password" class="auth-input" placeholder=" ">
                    <label for="confirm-password" class="auth-label" data-i18n="dialogs.confirmPasswordLabel"></label>
                </div>
                 <div class="auth-error-message-container" id="password-error-container">
                    <ul id="password-error-list"></ul>
                </div>
            `,
            buttons: [
                { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
                {
                    text: window.getTranslation('settings.loginSecurity.updateButton'),
                    className: 'btn-primary',
                    onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                        const newPassword = getDialogElement().querySelector('#new-password').value;
                        const confirmPassword = getDialogElement().querySelector('#confirm-password').value;
                        const csrfToken = getDialogElement().querySelector('input[name="csrf_token"]').value;

                        if (newPassword !== confirmPassword) {
                            document.getElementById('password-error-list').innerHTML = `<li>${window.getTranslation('notifications.passwordMismatch')}</li>`;
                            document.getElementById('password-error-container').style.display = 'block';
                            return;
                        }

                        const formData = new FormData();
                        formData.append('action_type', 'update_password');
                        formData.append('new_password', newPassword);
                        formData.append('csrf_token', csrfToken);

                        startLoading();
                        const response = await api.updateUserPassword(formData);
                        stopLoading();

                        if (response.ok) {
                            showNotification(window.getTranslation('notifications.passwordUpdated'), 'success');
                            close();
                        } else {
                            document.getElementById('password-error-list').innerHTML = `<li>${response.data.message}</li>`;
                            document.getElementById('password-error-container').style.display = 'block';
                        }
                    }
                }
            ]
        });
    };

    const tokenResponse = await api.getCsrfToken();
    if (!tokenResponse.ok) return;

    showDialog({
        iconHTML: `<div class="dialog-icon"><span class="material-symbols-rounded">lock</span></div>`,
        title: window.getTranslation('dialogs.updatePasswordTitle'),
        contentHTML: `
            <div class="dialog-user-chip">
                <div class="dialog-user-initial">${userInitial}</div>
                <span class="dialog-user-email">${user.email}</span>
            </div>
            <p>${window.getTranslation('dialogs.updatePasswordMessage')}</p>
            <input type="hidden" name="csrf_token" value="${tokenResponse.data.csrf_token}">
            <div class="form-field password-wrapper">
                <input type="password" id="current-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="current-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
            </div>
            <div class="auth-error-message-container" id="password-error-container">
                <ul id="password-error-list"></ul>
            </div>
        `,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('general.next'),
                className: 'btn-primary',
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const password = getDialogElement().querySelector('#current-password').value;
                    const csrfToken = getDialogElement().querySelector('input[name="csrf_token"]').value;

                    if (!password.trim()) {
                        getDialogElement().querySelector('#password-error-list').innerHTML = `<li>${window.getTranslation('auth.errors.passwordRequired')}</li>`;
                        getDialogElement().querySelector('#password-error-container').style.display = 'block';
                        return; 
                    }

                    const formData = new FormData();
                    formData.append('action_type', 'verify_password');
                    formData.append('password', password);
                    formData.append('csrf_token', csrfToken);

                    startLoading();
                    const response = await api.verifyPassword(formData);
                    stopLoading();

                    if (response.ok && response.data.success) {
                        renderUpdateStep(close);
                    } else {
                        getDialogElement().querySelector('#password-error-list').innerHTML = `<li>${response.data.message}</li>`;
                        getDialogElement().querySelector('#password-error-container').style.display = 'block';
                    }
                }
            }
        ]
    });
}

/**
 * Muestra el diálogo de confirmación para eliminar la cuenta del usuario.
 */
export async function showDeleteAccountDialog() {
    const sessionResponse = await api.checkSession();
    if (!sessionResponse.ok || !sessionResponse.data.loggedin) return;

    const user = sessionResponse.data.user;
    const userInitial = getInitials(user.username);
    const formattedDate = new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const message = window.getTranslation('dialogs.deleteAccountMessage', { date: formattedDate });

    const tokenResponse = await api.getCsrfToken();
    if (!tokenResponse.ok) return;

    showDialog({
        iconHTML: `<div class="dialog-icon"><span class="material-symbols-rounded">warning</span></div>`,
        title: window.getTranslation('dialogs.deleteAccountTitle'),
        contentHTML: `
            <div class="dialog-user-chip">
                <div class="dialog-user-initial">${userInitial}</div>
                <span class="dialog-user-email">${user.email}</span>
            </div>
            <p>${message}</p>
            <input type="hidden" name="csrf_token" value="${tokenResponse.data.csrf_token}">
            <div class="form-field password-wrapper" style="margin-top: 16px;">
                <input type="password" id="delete-confirm-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="delete-confirm-password" class="auth-label" data-i18n="auth.passwordPlaceholder"></label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
            </div>
            <div class="auth-error-message-container" id="delete-error-container">
                <ul id="delete-error-list"></ul>
            </div>
        `,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('settings.loginSecurity.deleteAccountButton'),
                className: 'btn-danger',
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const password = getDialogElement().querySelector('#delete-confirm-password').value;
                    const csrfToken = getDialogElement().querySelector('input[name="csrf_token"]').value;
                    const errorContainer = getDialogElement().querySelector('#delete-error-container');
                    const errorList = getDialogElement().querySelector('#delete-error-list');

                    if (!password) {
                        errorList.innerHTML = `<li>${window.getTranslation('auth.errors.passwordRequired')}</li>`;
                        errorContainer.style.display = 'block';
                        return;
                    }
                    
                    errorContainer.style.display = 'none';

                    const formData = new FormData();
                    formData.append('action_type', 'delete_account');
                    formData.append('password', password);
                    formData.append('csrf_token', csrfToken);

                    startLoading();
                    const response = await api.deleteAccount(formData);
                    stopLoading();

                    if (response.ok) {
                        showNotification(window.getTranslation('notifications.accountDeleted'), 'success');
                        window.auth.updateUserUI(null);
                        close();
                        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'main', section: 'home' } }));
                    } else {
                        errorList.innerHTML = `<li>${response.data.message}</li>`;
                        errorContainer.style.display = 'block';
                        const newTokenResponse = await api.getCsrfToken();
                        if (newTokenResponse.ok) {
                            getDialogElement().querySelector('input[name="csrf_token"]').value = newTokenResponse.data.csrf_token;
                        }
                    }
                }
            }
        ]
    });
}

/**
 * Muestra un diálogo para verificar la contraseña del usuario antes de cambiar el email.
 */
export async function showVerifyPasswordForEmailChangeDialog() {
    const tokenResponse = await api.getCsrfToken();
    if (!tokenResponse.ok) return;

    showDialog({
        title: window.getTranslation('dialogs.verifyIdentity.title'),
        contentHTML: `
            <p>${window.getTranslation('dialogs.verifyIdentity.description')}</p>
            <input type="hidden" name="csrf_token" value="${tokenResponse.data.csrf_token}">
            <div class="form-field password-wrapper" style="margin-top: 16px;">
                <input type="password" id="verify-email-change-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="verify-email-change-password" class="auth-label">${window.getTranslation('dialogs.verifyIdentity.passwordLabel')}</label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
            </div>
            <div class="auth-error-message-container" id="verify-email-change-error-container">
                <ul id="verify-email-change-error-list"></ul>
            </div>
        `,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('general.confirm'),
                className: 'btn-primary',
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const password = getDialogElement().querySelector('#verify-email-change-password').value;
                    const csrfToken = getDialogElement().querySelector('input[name="csrf_token"]').value;
                    const errorContainer = getDialogElement().querySelector('#verify-email-change-error-container');
                    const errorList = getDialogElement().querySelector('#verify-email-change-error-list');
                    
                    if (!password) {
                        errorList.innerHTML = `<li>${window.getTranslation('dialogs.verifyIdentity.errorRequired')}</li>`;
                        errorContainer.style.display = 'block';
                        return;
                    }
                    
                    errorContainer.style.display = 'none';

                    const formData = new FormData();
                    formData.append('action_type', 'verify_password');
                    formData.append('password', password);
                    formData.append('csrf_token', csrfToken);

                    startLoading();
                    const response = await api.verifyPassword(formData);
                    stopLoading();

                    if (response.ok && response.data.success) {
                        close();
                        document.getElementById('email-view-mode').style.display = 'none';
                        document.getElementById('email-edit-mode').style.display = 'block';
                    } else {
                        errorList.innerHTML = `<li>${response.data.message || window.getTranslation('dialogs.verifyIdentity.errorIncorrect')}</li>`;
                        errorContainer.style.display = 'block';
                    }
                }
            }
        ]
    });
}

/**
 * Muestra un diálogo para que el administrador confirme el cambio de rol de un usuario.
 * @param {string} userUuid - UUID del usuario a modificar.
 * @param {string} newRole - Nuevo rol a asignar.
 * @param {string} userName - Nombre del usuario.
 */
export async function showChangeRoleDialog(userUuid, newRole, userName) {
    showDialog({
        title: window.getTranslation('dialogs.changeRole.title'),
        contentHTML: `
            <p>${window.getTranslation('dialogs.changeRole.description', { userName: userName, newRole: newRole })}</p>
            <div class="form-field password-wrapper" style="margin-top: 16px;">
                <input type="password" id="admin-confirm-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="admin-confirm-password" class="auth-label">${window.getTranslation('dialogs.changeRole.passwordLabel')}</label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
            </div>
            <div class="auth-error-message-container" id="change-role-error-container">
                <ul id="change-role-error-list"></ul>
            </div>
        `,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('general.confirm'),
                className: 'btn-primary',
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const password = getDialogElement().querySelector('#admin-confirm-password').value;
                    const errorContainer = getDialogElement().querySelector('#change-role-error-container');
                    const errorList = getDialogElement().querySelector('#change-role-error-list');

                    if (!password) {
                        errorList.innerHTML = `<li>${window.getTranslation('dialogs.changeRole.errorRequired')}</li>`;
                        errorContainer.style.display = 'block';
                        return;
                    }

                    errorContainer.style.display = 'none';
                    startLoading();

                    const passResponse = await api.verifyAdminPassword(password);
                    if (passResponse.ok) {
                        const roleResponse = await api.changeUserRole(userUuid, newRole);
                        if (roleResponse.ok) {
                            showNotification(window.getTranslation('dialogs.changeRole.success'), 'success');
                            // Nota: fetchAndDisplayUsers se llamará desde el main-controller
                            window.dispatchEvent(new CustomEvent('userRoleChanged'));
                            close();
                        } else {
                            errorList.innerHTML = `<li>${roleResponse.data.message || window.getTranslation('dialogs.changeRole.errorChangingRole')}</li>`;
                            errorContainer.style.display = 'block';
                        }
                    } else {
                        errorList.innerHTML = `<li>${passResponse.data.message || window.getTranslation('dialogs.changeRole.errorVerification')}</li>`;
                        errorContainer.style.display = 'block';
                    }

                    stopLoading();
                }
            }
        ]
    });
}

export async function showDeleteGalleryDialog(galleryUuid, galleryName) {
    showDialog({
        iconHTML: `<div class="dialog-icon"><span class="material-symbols-rounded">warning</span></div>`,
        title: window.getTranslation('dialogs.deleteGalleryTitle', { galleryName: galleryName }),
        contentHTML: `
            <p>${window.getTranslation('dialogs.deleteGalleryMessage')}</p>
            <div class="form-field password-wrapper" style="margin-top: 16px;">
                <input type="password" id="admin-confirm-password" class="auth-input" placeholder=" " autocomplete="current-password">
                <label for="admin-confirm-password" class="auth-label">${window.getTranslation('dialogs.deleteGallery.passwordLabel')}</label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
            </div>
            <div class="auth-error-message-container" id="delete-gallery-error-container">
                <ul id="delete-gallery-error-list"></ul>
            </div>
        `,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('admin.editGallery.deleteButton'),
                className: 'btn-danger',
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const password = getDialogElement().querySelector('#admin-confirm-password').value;
                    const errorContainer = getDialogElement().querySelector('#delete-gallery-error-container');
                    const errorList = getDialogElement().querySelector('#delete-gallery-error-list');

                    if (!password) {
                        errorList.innerHTML = `<li>${window.getTranslation('dialogs.deleteGallery.errorRequired')}</li>`;
                        errorContainer.style.display = 'block';
                        return;
                    }

                    errorContainer.style.display = 'none';
                    startLoading();
                    
                    const passResponse = await api.verifyAdminPassword(password);
                    if (passResponse.ok) {
                        const deleteResponse = await api.deleteGallery(galleryUuid);
                        if (deleteResponse.ok) {
                            showNotification(window.getTranslation('dialogs.deleteGallery.success'), 'success');
                            window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'admin', section: 'manageContent' } }));
                            close();
                        } else {
                            errorList.innerHTML = `<li>${deleteResponse.data.message || window.getTranslation('dialogs.deleteGallery.errorDelete')}</li>`;
                            errorContainer.style.display = 'block';
                        }
                    } else {
                        errorList.innerHTML = `<li>${passResponse.data.message || window.getTranslation('dialogs.deleteGallery.errorVerification')}</li>`;
                        errorContainer.style.display = 'block';
                    }

                    stopLoading();
                }
            }
        ]
    });
}

export async function showSanctionDialog(userUuid, userName) {
    showDialog({
        title: window.getTranslation('dialogs.sanction.title', { userName }),
        contentHTML: `
            <div class="form-group" style="width: 100%; text-align: left;">
                <label class="form-label" data-i18n="dialogs.sanction.typeLabel"></label>
                <div class="select-wrapper body-title">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="sanction-type-select">
                        <span class="select-trigger-text">${window.getTranslation('dialogs.sanction.types.warning')}</span>
                        <div class="select-trigger-icon select-trigger-arrow">
                            <span class="material-symbols-rounded">expand_more</span>
                        </div>
                    </div>
                    <div class="module-content module-select disabled" id="sanction-type-select">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link active" data-value="warning">
                                    <div class="menu-link-text"><span data-i18n="dialogs.sanction.types.warning"></span></div>
                                </div>
                                <div class="menu-link" data-value="temp_suspension">
                                    <div class="menu-link-text"><span data-i18n="dialogs.sanction.types.temp_suspension"></span></div>
                                </div>
                                <div class="menu-link" data-value="permanent_suspension">
                                    <div class="menu-link-text"><span data-i18n="dialogs.sanction.types.permanent_suspension"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-group" id="duration-field" style="display:none; width: 100%; text-align: left;">
                <label for="sanction-expires-at" class="form-label" data-i18n="dialogs.sanction.expiresAtLabel"></label>
                <input type="datetime-local" id="sanction-expires-at" class="auth-input">
            </div>
            <div class="form-group" style="width: 100%; text-align: left;">
                <label for="sanction-reason" class="form-label" data-i18n="dialogs.sanction.reasonLabel"></label>
                <textarea id="sanction-reason" class="feedback-textarea" rows="3"></textarea>
            </div>
        `,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('dialogs.sanction.applyButton'),
                className: 'btn-danger',
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const sanctionType = getDialogElement().querySelector('#sanction-type-select .menu-link.active').dataset.value;
                    const expiresAt = getDialogElement().querySelector('#sanction-expires-at').value;
                    const reason = getDialogElement().querySelector('#sanction-reason').value;

                    const formData = new FormData();
                    formData.append('action_type', 'add_user_sanction');
                    formData.append('user_uuid', userUuid);
                    formData.append('sanction_type', sanctionType);
                    formData.append('reason', reason);
                    if (sanctionType === 'temp_suspension' && expiresAt) {
                        formData.append('expires_at', expiresAt);
                    }

                    startLoading();
                    const response = await api.addUserSanction(formData);
                    stopLoading();

                    if (response.ok) {
                        showNotification(response.data.message, 'success');
                        window.dispatchEvent(new CustomEvent('userSanctioned'));
                        close();
                    } else {
                        showNotification(response.data.message || 'Error al aplicar la sanción.', 'error');
                    }
                }
            }
        ],
        onOpen: (dialogBox) => {
            const sanctionTypeTrigger = dialogBox.querySelector('[data-target="sanction-type-select"]');
            const sanctionTypeMenu = dialogBox.querySelector('#sanction-type-select');
            const triggerText = sanctionTypeTrigger.querySelector('.select-trigger-text');
            const durationField = dialogBox.querySelector('#duration-field');

            // Dejamos que el manejador de eventos global en main-controller se encargue de abrir/cerrar.

            sanctionTypeMenu.querySelectorAll('.menu-link').forEach(option => {
                option.addEventListener('click', () => {
                    // Actualizar estado activo de la opción
                    sanctionTypeMenu.querySelectorAll('.menu-link').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');

                    // Actualizar texto del trigger
                    triggerText.textContent = option.textContent.trim();
                    
                    // Cerrar el menú correctamente
                    sanctionTypeMenu.classList.add('disabled');
                    sanctionTypeMenu.classList.remove('active');
                    sanctionTypeTrigger.classList.remove('active-trigger');

                    // Lógica para mostrar/ocultar campo de duración
                    const selectedValue = option.dataset.value;
                    durationField.style.display = selectedValue === 'temp_suspension' ? 'block' : 'none';
                });
            });
        }
    });
}

export async function showTruncateDatabaseDialog() {
    const backupResponse = await api.checkRecentBackup();

    let contentHTML = `<p>${window.getTranslation('dialogs.truncateDatabase.description')}</p>`;
    let isActionAllowed = false;

    if (backupResponse.ok && backupResponse.data.recent_backup) {
        const backup = backupResponse.data.backup_details;
        const backupDate = new Date(backup.created_at * 1000).toLocaleString();
        const backupSize = (backup.size / 1024 / 1024).toFixed(2) + ' MB';
        isActionAllowed = true;
        contentHTML += `
            <div class="admin-list-item" style="margin-top: 16px;">
                <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                    <span class="material-symbols-rounded">database</span>
                </div>
                <div class="admin-list-item-details" style="text-align: left;">
                    <div class="admin-list-item-title">${window.getTranslation('dialogs.truncateDatabase.backupFound')}</div>
                    <div class="admin-list-item-meta">${backup.name}</div>
                    <div class="admin-list-item-meta-badges">
                         <span class="info-badge-admin">${backupSize}</span>
                         <span class="info-badge-admin">${backupDate}</span>
                    </div>
                </div>
            </div>
            <div class="form-field password-wrapper" style="margin-top: 16px;">
                <input type="password" id="admin-confirm-password" class="auth-input" placeholder=" ">
                <label for="admin-confirm-password" class="auth-label">${window.getTranslation('dialogs.truncateDatabase.passwordLabel')}</label>
                <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
            </div>
            <div class="auth-error-message-container" id="truncate-db-error-container" style="display: none;">
                <ul id="truncate-db-error-list"></ul>
            </div>
        `;
    } else {
        const message = backupResponse.data.expired 
            ? window.getTranslation('dialogs.truncateDatabase.backupExpired')
            : window.getTranslation('dialogs.truncateDatabase.noBackup');
        contentHTML += `<div class="auth-error-message-container" style="display: block; margin-top: 16px;"><ul><li>${message}</li></ul></div>`;
    }

    showDialog({
        iconHTML: `<div class="dialog-icon"><span class="material-symbols-rounded">dangerous</span></div>`,
        title: window.getTranslation('dialogs.truncateDatabase.title'),
        contentHTML: contentHTML,
        buttons: [
            { text: window.getTranslation('general.cancel'), onClick: ({ close }) => close() },
            {
                text: window.getTranslation('dialogs.truncateDatabase.button'),
                className: 'btn-danger',
                disabled: !isActionAllowed,
                onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                    const password = getDialogElement().querySelector('#admin-confirm-password').value;
                    const errorContainer = getDialogElement().querySelector('#truncate-db-error-container');
                    const errorList = getDialogElement().querySelector('#truncate-db-error-list');

                    if (!password) {
                        errorList.innerHTML = `<li>${window.getTranslation('dialogs.truncateDatabase.errorRequired')}</li>`;
                        errorContainer.style.display = 'block';
                        return;
                    }

                    if(errorContainer) errorContainer.style.display = 'none';
                    startLoading();
                    
                    const passResponse = await api.verifyAdminPassword(password);
                    if (passResponse.ok) {
                        const truncateResponse = await api.truncateDatabase();
                        if (truncateResponse.ok) {
                            showNotification(truncateResponse.data.message, 'success');
                            await api.logoutUser();
                            window.location.reload();
                            close();
                        } else {
                            if(errorList) errorList.innerHTML = `<li>${truncateResponse.data.message || window.getTranslation('dialogs.truncateDatabase.errorDelete')}</li>`;
                            if(errorContainer) errorContainer.style.display = 'block';
                        }
                    } else {
                        if(errorList) errorList.innerHTML = `<li>${passResponse.data.message || window.getTranslation('dialogs.truncateDatabase.errorVerification')}</li>`;
                        if(errorContainer) errorContainer.style.display = 'block';
                    }

                    stopLoading();
                }
            }
        ]
    });
}


export async function showRestoreBackupDialog(filename) {
    return new Promise((resolve) => {
        showDialog({
            iconHTML: `<div class="dialog-icon"><span class="material-symbols-rounded">warning</span></div>`,
            title: window.getTranslation('dialogs.restoreBackup.title'),
            contentHTML: `
                <p>${window.getTranslation('dialogs.restoreBackup.description', { filename: filename })}</p>
                <div class="form-field password-wrapper" style="margin-top: 16px;">
                    <input type="password" id="admin-confirm-password" class="auth-input" placeholder=" " autocomplete="current-password">
                    <label for="admin-confirm-password" class="auth-label">${window.getTranslation('dialogs.deleteGallery.passwordLabel')}</label>
                    <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
                </div>
                <div class="auth-error-message-container" id="restore-backup-error-container">
                    <ul id="restore-backup-error-list"></ul>
                </div>
            `,
            buttons: [
                {
                    text: window.getTranslation('general.cancel'),
                    onClick: ({ close }) => {
                        close();
                        resolve(false);
                    }
                },
                {
                    text: window.getTranslation('admin.backup.restoreButton'),
                    className: 'btn-danger',
                    onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                        const password = getDialogElement().querySelector('#admin-confirm-password').value;
                        const errorContainer = getDialogElement().querySelector('#restore-backup-error-container');
                        const errorList = getDialogElement().querySelector('#restore-backup-error-list');

                        if (!password) {
                            errorList.innerHTML = `<li>${window.getTranslation('dialogs.deleteGallery.errorRequired')}</li>`;
                            errorContainer.style.display = 'block';
                            resolve(false);
                            return;
                        }

                        errorContainer.style.display = 'none';
                        startLoading();

                        const passResponse = await api.verifyAdminPassword(password);
                        if (passResponse.ok) {
                            close();
                            resolve(true);
                        } else {
                            errorList.innerHTML = `<li>${passResponse.data.message || window.getTranslation('dialogs.deleteGallery.errorVerification')}</li>`;
                            errorContainer.style.display = 'block';
                            resolve(false);
                        }

                        stopLoading();
                    }
                }
            ]
        });
    });
}
// --- INICIO DE LA MODIFICACIÓN ---
export function showVerifyPasswordFor2FADialog() {
    return new Promise(async (resolve) => {
        const tokenResponse = await api.getCsrfToken();
        if (!tokenResponse.ok) {
            resolve(false);
            return;
        }

        showDialog({
            title: window.getTranslation('dialogs.verifyIdentity.title'),
            contentHTML: `
                <p>${window.getTranslation('dialogs.verifyIdentity.description')}</p>
                <input type="hidden" name="csrf_token" value="${tokenResponse.data.csrf_token}">
                <div class="form-field password-wrapper" style="margin-top: 16px;">
                    <input type="password" id="verify-2fa-password" class="auth-input" placeholder=" " autocomplete="current-password">
                    <label for="verify-2fa-password" class="auth-label">${window.getTranslation('dialogs.verifyIdentity.passwordLabel')}</label>
                    <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility"><span class="material-symbols-rounded">visibility</span></button>
                </div>
                <div class="auth-error-message-container" id="verify-2fa-error-container" style="display: none;">
                    <ul id="verify-2fa-error-list"></ul>
                </div>
            `,
            buttons: [
                { text: window.getTranslation('general.cancel'), onClick: ({ close }) => { close(); resolve(false); } },
                {
                    text: window.getTranslation('general.confirm'),
                    className: 'btn-primary',
                    onClick: async ({ close, startLoading, stopLoading, getDialogElement }) => {
                        const password = getDialogElement().querySelector('#verify-2fa-password').value;
                        const csrfToken = getDialogElement().querySelector('input[name="csrf_token"]').value;
                        const errorContainer = getDialogElement().querySelector('#verify-2fa-error-container');
                        const errorList = getDialogElement().querySelector('#verify-2fa-error-list');

                        if (!password) {
                            errorList.innerHTML = `<li>${window.getTranslation('dialogs.verifyIdentity.errorRequired')}</li>`;
                            errorContainer.style.display = 'block';
                            return;
                        }

                        errorContainer.style.display = 'none';

                        const formData = new FormData();
                        formData.append('action_type', 'verify_password');
                        formData.append('password', password);
                        formData.append('csrf_token', csrfToken);

                        startLoading();
                        const response = await api.verifyPassword(formData);
                        stopLoading();

                        if (response.ok && response.data.success) {
                            close();
                            resolve(true);
                        } else {
                            errorList.innerHTML = `<li>${response.data.message || window.getTranslation('dialogs.verifyIdentity.errorIncorrect')}</li>`;
                            errorContainer.style.display = 'block';
                            resolve(false);
                        }
                    }
                }
            ]
        });
    });
}
// --- FIN DE LA MODIFICACIÓN ---

export function initDialogManager() {
    console.log("Dialog Manager Initialized.");
}

window.showCustomConfirm = showCustomConfirm;