// assets/js/app/admin-controller.js

import { navigateToUrl } from '../core/url-manager.js';
import { applyTranslations } from '../managers/language-manager.js';
import { initTooltips } from '../managers/tooltip-manager.js';
import { showNotification } from '../managers/notification-manager.js';
import * as api from '../core/api-handler.js';
import { showChangeRoleDialog, showSanctionDialog, showTruncateDatabaseDialog, showRestoreBackupDialog } from '../managers/dialog-manager.js';
import {
    fetchAndDisplayDashboard,
    fetchAndDisplayUsers,
    fetchAndDisplayGalleriesAdmin,
    fetchAndDisplayAdminComments,
    fetchAndDisplayFeedback,
    fetchAndDisplayUserProfile,
    fetchAndDisplayProfanityWords,
    fetchAndDisplayLogs,
    fetchAndDisplayBackups
} from './view-handlers.js';
import { handleStateChange } from './navigation-handler.js';

export function initAdminController(appState) {
    let selectedGallery = null;
    let selectedLog = null;
    let selectedBackup = null;
    let selectedUser = null;
    let selectedComment = null;
    let selectedFeedback = null;

    function updateManageUsersHeader() {
        const actionButtonsContainer = document.getElementById('user-action-buttons');
        if (!actionButtonsContainer) return;

        let buttonsHTML = '';

        if (selectedUser) {
            const uuid = selectedUser.dataset.uuid;
            const userName = selectedUser.dataset.name;
            const userRole = selectedUser.dataset.role;
            const isProtected = userRole === 'founder';

            buttonsHTML = `
                <button class="header-button" data-action="view-user-profile" data-uuid="${uuid}" data-i18n-tooltip="admin.manageUsers.table.actions.viewProfile">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
                <button class="header-button" data-action="add-sanction" data-uuid="${uuid}" data-username="${userName}" data-i18n-tooltip="admin.userProfile.actions.sanction" ${isProtected ? 'disabled' : ''}>
                    <span class="material-symbols-rounded">gavel</span>
                </button>
                 <div class="header-item">
                    <button class="header-button" data-action="toggle-select" data-target="user-role-menu" data-i18n-tooltip="admin.manageUsers.table.actions.changeRole" ${isProtected ? 'disabled' : ''}>
                        <span class="material-symbols-rounded">manage_accounts</span>
                    </button>
                    <div class="module-content module-select disabled" id="user-role-menu">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link" data-action="change-role-option" data-uuid="${uuid}" data-username="${userName}" data-role="user">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">person</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.roles.user"></span></div>
                                </div>
                                <div class="menu-link" data-action="change-role-option" data-uuid="${uuid}" data-username="${userName}" data-role="moderator">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">shield_person</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.roles.moderator"></span></div>
                                </div>
                                <div class="menu-link" data-action="change-role-option" data-uuid="${uuid}" data-username="${userName}" data-role="administrator">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">shield</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.roles.administrator"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        actionButtonsContainer.innerHTML = buttonsHTML;
        applyTranslations(actionButtonsContainer);
        initTooltips();
    }

    function handleUserSelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedUser === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedUser = null;
            } else {
                if (selectedUser) {
                    selectedUser.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedUser = clickedItem;
            }
        }
        updateManageUsersHeader();
    }

    function deselectUser() {
        if (selectedUser) {
            selectedUser.classList.remove('selected');
            selectedUser = null;
            updateManageUsersHeader();
        }
    }

    function updateManageContentHeader() {
        const headerRight = document.querySelector('[data-section="manageContent"] .content-header-right');
        if (!headerRight) return;

        let buttonsHTML = `
            <button class="load-more-btn btn-primary" data-action="toggleSectionCreateGallery">
                <span class="button-text" data-i18n="admin.manageContent.createButton"></span>
            </button>
        `;

        if (selectedGallery) {
            const uuid = selectedGallery.dataset.uuid;
            const name = selectedGallery.dataset.name;
            buttonsHTML = `
                <button class="header-button" data-action="edit-gallery" data-uuid="${uuid}" data-i18n-tooltip="admin.manageContent.editTooltip">
                    <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="header-button" data-action="view-gallery-stats" data-uuid="${uuid}" data-i18n-tooltip="admin.manageContent.statsTooltip">
                    <span class="material-symbols-rounded">bar_chart</span>
                </button>
                <button class="header-button" data-action="view-gallery-photos-admin" data-uuid="${uuid}" data-name="${name}" data-i18n-tooltip="admin.manageContent.viewPhotosTooltip">
                    <span class="material-symbols-rounded">image</span>
                </button>
            ` + buttonsHTML;
        }

        headerRight.innerHTML = buttonsHTML;
        applyTranslations(headerRight);
        initTooltips();
    }

    function handleGallerySelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedGallery === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedGallery = null;
            } else {
                if (selectedGallery) {
                    selectedGallery.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedGallery = clickedItem;
            }
        }
        updateManageContentHeader();
    }

    function deselectGallery() {
        if (selectedGallery) {
            selectedGallery.classList.remove('selected');
            selectedGallery = null;
            updateManageContentHeader();
        }
    }

    function updateManageLogsHeader() {
        const headerRight = document.querySelector('[data-section="manageLogs"] .content-header-right');
        if (!headerRight) return;

        let buttonsHTML = '';

        if (selectedLog) {
            const filename = selectedLog.dataset.filename;
            buttonsHTML = `
                <button class="header-button" data-action="view-log" data-filename="${filename}" data-i18n-tooltip="admin.manageLogs.viewButtonTooltip">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
            `;
        }

        headerRight.innerHTML = buttonsHTML;
        applyTranslations(headerRight);
        initTooltips();
    }

    function handleLogSelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedLog === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedLog = null;
            } else {
                if (selectedLog) {
                    selectedLog.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedLog = clickedItem;
            }
        }
        updateManageLogsHeader();
    }

    function deselectLog() {
        if (selectedLog) {
            selectedLog.classList.remove('selected');
            selectedLog = null;
            updateManageLogsHeader();
        }
    }

    function updateManageBackupsHeader() {
        const headerRight = document.querySelector('[data-section="backup"] .content-header-right');
        if (!headerRight) return;

        let buttonsHTML = `
            <button class="load-more-btn btn-primary" data-action="create-backup">
                <span class="button-text" data-i18n="admin.backup.createButton"></span>
                <div class="button-spinner"></div>
            </button>
        `;

        if (selectedBackup) {
            const filename = selectedBackup.dataset.filename;
            buttonsHTML = `
                <button class="load-more-btn" data-action="restore-backup" data-filename="${filename}" data-i18n="admin.backup.restoreButton">
                    Restaurar copia de seguridad
                </button>
            ` + buttonsHTML;
        }

        headerRight.innerHTML = buttonsHTML;
        applyTranslations(headerRight);
        initTooltips();
    }

    function handleBackupSelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedBackup === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedBackup = null;
            } else {
                if (selectedBackup) {
                    selectedBackup.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedBackup = clickedItem;
            }
        }
        updateManageBackupsHeader();
    }

    function deselectBackup() {
        if (selectedBackup) {
            selectedBackup.classList.remove('selected');
            selectedBackup = null;
            updateManageBackupsHeader();
        }
    }

    function updateManageCommentsHeader() {
        const actionButtonsContainer = document.getElementById('comment-action-buttons');
        if (!actionButtonsContainer) return;

        let buttonsHTML = '';

        if (selectedComment) {
            buttonsHTML = `
                <button class="header-button" data-action="set-comment-status" data-id="${selectedComment.dataset.id}" data-status="visible" data-i18n-tooltip="admin.manageComments.table.actions.makeVisible">
                    <span class="material-symbols-rounded">check_circle</span>
                </button>
                <button class="header-button" data-action="set-comment-status" data-id="${selectedComment.dataset.id}" data-status="review" data-i18n-tooltip="admin.manageComments.table.actions.review">
                    <span class="material-symbols-rounded">pending</span>
                </button>
                <button class="header-button" data-action="set-comment-status" data-id="${selectedComment.dataset.id}" data-status="deleted" data-i18n-tooltip="admin.manageComments.table.actions.delete">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            `;
        }

        actionButtonsContainer.innerHTML = buttonsHTML;
        applyTranslations(actionButtonsContainer);
        initTooltips();
    }

    function handleCommentSelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedComment === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedComment = null;
            } else {
                if (selectedComment) {
                    selectedComment.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedComment = clickedItem;
            }
        }
        updateManageCommentsHeader();
    }

    function deselectComment() {
        if (selectedComment) {
            selectedComment.classList.remove('selected');
            selectedComment = null;
            updateManageCommentsHeader();
        }
    }

    function updateManageFeedbackHeader() {
        const headerRight = document.querySelector('[data-section="manageFeedback"] .content-header-right');
        if (!headerRight) return;

        let buttonsHTML = '';

        if (selectedFeedback) {
            buttonsHTML = `
                <button class="header-button" data-action="view-feedback" data-uuid="${selectedFeedback.dataset.uuid}" data-i18n-tooltip="admin.manageFeedback.table.actions.view">
                    <span class="material-symbols-rounded">visibility</span>
                </button>
                <button class="header-button" data-action="delete-feedback" data-uuid="${selectedFeedback.dataset.uuid}" data-i18n-tooltip="admin.manageFeedback.table.actions.delete">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            `;
        }

        headerRight.innerHTML = buttonsHTML;
        applyTranslations(headerRight);
        initTooltips();
    }

    function handleFeedbackSelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedFeedback === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedFeedback = null;
            } else {
                if (selectedFeedback) {
                    selectedFeedback.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedFeedback = clickedItem;
            }
        }
        updateManageFeedbackHeader();
    }

    function deselectFeedback() {
        if (selectedFeedback) {
            selectedFeedback.classList.remove('selected');
            selectedFeedback = null;
            updateManageFeedbackHeader();
        }
    }

    document.addEventListener('click', async function (event) {
        const listContainer = document.getElementById('admin-galleries-list');
        if (appState.currentAppSection === 'manageContent' && listContainer) {
            if (listContainer.contains(event.target)) {
                handleGallerySelection(event);
            } else {
                deselectGallery();
            }
        }

        const usersListContainer = document.getElementById('admin-users-list');
        const actionButtonsContainer = document.getElementById('user-action-buttons');

        if (appState.currentAppSection === 'manageUsers' && usersListContainer) {
            if (usersListContainer.contains(event.target)) {
                handleUserSelection(event);
            } else if (!actionButtonsContainer || !actionButtonsContainer.contains(event.target)) {
                deselectUser();
            }
        }

        const logsListContainer = document.getElementById('logs-list');
        if (appState.currentAppSection === 'manageLogs' && logsListContainer) {
            if (logsListContainer.contains(event.target)) {
                handleLogSelection(event);
            } else {
                deselectLog();
            }
        }

        const backupsListContainer = document.getElementById('backups-list');
        if (appState.currentAppSection === 'backup' && backupsListContainer) {
            if (backupsListContainer.contains(event.target)) {
                handleBackupSelection(event);
            } else {
                deselectBackup();
            }
        }

        const commentsListContainer = document.getElementById('admin-comments-list');
        if (appState.currentAppSection === 'manageComments' && commentsListContainer) {
            if (commentsListContainer.contains(event.target)) {
                handleCommentSelection(event);
            } else {
                deselectComment();
            }
        }

        const feedbackListContainer = document.getElementById('admin-feedback-list');
        if (appState.currentAppSection === 'manageFeedback' && feedbackListContainer) {
            if (feedbackListContainer.contains(event.target)) {
                handleFeedbackSelection(event);
            } else {
                deselectFeedback();
            }
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && appState.currentAppSection === 'manageContent') {
            deselectGallery();
        }

        if (event.key === 'Escape' && appState.currentAppSection === 'manageUsers') {
            deselectUser();
        }
    });
}