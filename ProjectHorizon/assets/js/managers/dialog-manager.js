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
        buttonsHTML += `<button id="dialog-btn-${index}" class="load-more-btn ${btn.className || ''}"><span class="button-text">${btn.text}</span><div class="button-spinner"></div></button>`;
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
        buttonElement.addEventListener('click', () => {
            btn.onClick({
                close: closeDialog,
                startLoading: () => buttonElement.classList.add('loading'),
                stopLoading: () => buttonElement.classList.remove('loading'),
                getDialogElement: () => dialogBox
            });
        });
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
export async function showReportCommentDialog(commentId) {
    return new Promise((resolve) => {
        const reportReasons = window.getTranslation('dialogs.reportComment.reasons');
        let optionsHTML = '';
        for (const key in reportReasons) {
            optionsHTML += `<div class="menu-link" data-value="${key}"><div class="menu-link-text"><span>${reportReasons[key]}</span></div></div>`;
        }

        showDialog({
            title: window.getTranslation('dialogs.reportComment.title'),
            contentHTML: `
                <p>${window.getTranslation('dialogs.reportComment.description')}</p>
                <div class="select-wrapper body-title" style="margin-top: 16px;">
                    <div class="custom-select-trigger" data-action="toggle-select" data-target="report-reason-select">
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
                const options = dialogBox.querySelectorAll('.menu-link');
                const triggerText = dialogBox.querySelector('.select-trigger-text');
                const selectMenu = dialogBox.querySelector('.module-select');

                options.forEach(option => {
                    option.addEventListener('click', () => {
                        options.forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                        triggerText.textContent = option.textContent;
                        selectMenu.classList.add('disabled');
                        selectMenu.classList.remove('active');
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

                    if (!password) {
                        getDialogElement().querySelector('#delete-error-list').innerHTML = `<li>${window.getTranslation('auth.errors.passwordRequired')}</li>`;
                        getDialogElement().querySelector('#delete-error-container').style.display = 'block';
                        return;
                    }

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
                        getDialogElement().querySelector('#delete-error-list').innerHTML = `<li>${response.data.message}</li>`;
                        getDialogElement().querySelector('#delete-error-container').style.display = 'block';
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

                    if (!password) {
                        getDialogElement().querySelector('#verify-email-change-error-list').innerHTML = `<li>${window.getTranslation('dialogs.verifyIdentity.errorRequired')}</li>`;
                        getDialogElement().querySelector('#verify-email-change-error-container').style.display = 'block';
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
                        close();
                        document.getElementById('email-view-mode').style.display = 'none';
                        document.getElementById('email-edit-mode').style.display = 'block';
                    } else {
                        getDialogElement().querySelector('#verify-email-change-error-list').innerHTML = `<li>${response.data.message || window.getTranslation('dialogs.verifyIdentity.errorIncorrect')}</li>`;
                        getDialogElement().querySelector('#verify-email-change-error-container').style.display = 'block';
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

export function initDialogManager() {
    console.log("Dialog Manager Initialized.");
}

window.showCustomConfirm = showCustomConfirm;