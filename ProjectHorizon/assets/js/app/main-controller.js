// assets/js/app/main-controller.js

import { navigateToUrl, setupPopStateHandler, setInitialHistoryState, generateUrl } from '../core/url-manager.js';
import { setTheme, applyTheme, updateThemeSelectorUI } from '../managers/theme-manager.js';
import { setLanguage, applyTranslations, updateLanguageSelectorUI } from '../managers/language-manager.js';
import { initTooltips } from '../managers/tooltip-manager.js';
import { showNotification } from '../managers/notification-manager.js';
import * as api from '../core/api-handler.js';
import { initAuthController } from './auth-controller.js';
import { displayFavoritePhotos, updateCardPrivacyStatus, renderPhotoView, displayHistory } from '../ui/ui-controller.js';
import {
    showCustomConfirm,
    showUpdatePasswordDialog,
    showDeleteAccountDialog,
    showChangeRoleDialog,
    showDeleteGalleryDialog,
    showReportCommentDialog,
    showSanctionDialog,
    showTruncateDatabaseDialog,
    showRestoreBackupDialog,
    showVerifyPasswordFor2FADialog
} from '../managers/dialog-manager.js';
import {
    fetchAndDisplayDashboard,
    fetchAndDisplayGalleries,
    fetchAndDisplayGalleryPhotos,
    fetchAndDisplayTrends,
    fetchAndDisplayUsers,
    fetchAndDisplayGalleriesAdmin,
    fetchAndDisplayAdminComments,
    fetchAndDisplayFeedback,
    fetchAndDisplayUserProfile,
    fetchAndDisplayProfanityWords,
    fetchAndDisplayBackups
} from './view-handlers.js';
import { handleStateChange, displayComments, createCommentElement } from './navigation-handler.js';


// --- FUNCIONES DE LA APLICACIÓN PRINCIPAL ---

async function addToHistory(type, data) {
    const sessionResponse = await api.checkSession();
    if (!sessionResponse.ok || !sessionResponse.data.loggedin) {
        return;
    }

    const enable_search_history = localStorage.getItem('enable_search_history') !== 'false';
    const enable_view_history = localStorage.getItem('enable_view_history') !== 'false';

    if (type === 'search') {
        if (!enable_search_history) return;
    } else {
        if (!enable_view_history) return;
    }

    const metadata = {
        name: data.name,
        privacy: data.privacy,
        profile_picture_url: data.profile_picture_url,
        background_photo_url: data.background_photo_url,
        gallery_name: data.gallery_name,
        photo_url: data.photo_url,
        gallery_uuid: data.gallery_uuid,
        section: data.section
    };

    await api.addHistory(type, data.id || data.term, metadata);
}

function handleAgeVerification() {
    if (localStorage.getItem('ageVerified') === 'true') {
        return;
    }

    // Crear el overlay dinámicamente
    const overlay = document.createElement('div');
    overlay.id = 'age-verification-overlay';
    overlay.className = 'age-verification-overlay';
    overlay.innerHTML = `
        <div class="age-verification-content">
            <h2 data-i18n="ageVerification.title"></h2>
            <p><strong data-i18n="ageVerification.noticeTitle"></strong></p>
            <p data-i18n="ageVerification.noticeContent"></p>
            <p data-i18n="ageVerification.termsNotice"></p>
            <div class="age-verification-buttons">
                <button id="age-decline-btn" class="load-more-btn" data-i18n="ageVerification.declineButton"></button>
                <button id="age-confirm-btn" class="load-more-btn btn-primary" data-i18n="ageVerification.confirmButton"></button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    applyTranslations(overlay); // Aplicar traducciones al nuevo elemento

    const confirmBtn = document.getElementById('age-confirm-btn');
    const declineBtn = document.getElementById('age-decline-btn');

    if (confirmBtn && declineBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.setItem('ageVerified', 'true');
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        declineBtn.addEventListener('click', () => {
            // Podrías redirigir a otra página o simplemente no hacer nada.
        });
    }
}

function updatePhotoGridVisibility() {
    const photosGrid = document.getElementById('manage-photos-grid');
    const videosGrid = document.getElementById('manage-videos-grid');
    const photosSection = document.getElementById('photos-management-section');
    const videosSection = document.getElementById('videos-management-section');
    const mainStatusContainer = document.getElementById('manage-content-status-container');

    const hasPhotos = photosGrid && photosGrid.children.length > 0;
    const hasVideos = videosGrid && videosGrid.children.length > 0;

    if (photosSection) {
        photosSection.style.display = hasPhotos ? 'block' : 'none';
    }
    if (videosSection) {
        videosSection.style.display = hasVideos ? 'block' : 'none';
    }

    if (mainStatusContainer) {
        if (hasPhotos || hasVideos) {
            mainStatusContainer.classList.add('disabled');
        } else {
            mainStatusContainer.classList.remove('disabled');
        }
    }
}

async function saveUserPreferences() {
    const session = await api.checkSession();
    if (session.ok && session.data.loggedin) {
        const preferences = {
            theme: localStorage.getItem('theme') || 'system',
            language: localStorage.getItem('language') || 'es-419',
            open_links_in_new_tab: localStorage.getItem('open_links_in_new_tab') === 'true',
            longer_message_duration: localStorage.getItem('longer_message_duration') === 'true',
            enable_view_history: localStorage.getItem('enable_view_history') !== 'false',
            enable_search_history: localStorage.getItem('enable_search_history') !== 'false',
        };
        await api.saveUserPreferences(preferences);
    }
}

export async function initMainController() {
    // Realiza la única llamada a checkSession
    const sessionDataResponse = await api.checkSession();
    const sessionData = sessionDataResponse.ok ? sessionDataResponse.data : null;

    // --- LÓGICA DE MODO MANTENIMIENTO ---
    if (window.MAINTENANCE_MODE) {
        const userRole = sessionData && sessionData.loggedin ? sessionData.user.role : 'user';
        const allowedRoles = ['moderator', 'administrator', 'founder'];

        if (!allowedRoles.includes(userRole)) {
            const contentContainer = document.querySelector('.general-content-scrolleable');
            if (contentContainer) {
                contentContainer.innerHTML = `
                    <div class="status-message-container active">
                        <div>
                            <h2>Estamos en mantenimiento</h2>
                            <p>El sitio volverá a estar disponible en breve. Disculpa las molestias.</p>
                        </div>
                    </div>
                `;
            }
            return;
        }
    }
    
    // Configura las preferencias del usuario y el idioma
    if (sessionData && sessionData.loggedin && sessionData.preferences) {
        const prefs = sessionData.preferences;
        localStorage.setItem('theme', prefs.theme);
        localStorage.setItem('language', prefs.language);
        localStorage.setItem('open_links_in_new_tab', prefs.open_links_in_new_tab);
        localStorage.setItem('longer_message_duration', prefs.longer_message_duration);
        localStorage.setItem('enable_view_history', prefs.enable_view_history);
        localStorage.setItem('enable_search_history', prefs.enable_search_history);
    }
    
    applyTheme();

    let currentLang = localStorage.getItem('language');
    if (!currentLang) {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('es')) currentLang = 'es-419';
        else if (browserLang.startsWith('en')) currentLang = 'en-US';
        else currentLang = 'es-419';
    }
    
    // Pasa el rol del usuario al gestor de idioma
    const userRoleForLang = sessionData && sessionData.loggedin ? sessionData.user.role : 'user';
    await setLanguage(currentLang, userRoleForLang, false);

    handleAgeVerification();
    
    // Inicializa el controlador de autenticación con los datos de la sesión
    initAuthController(sessionData);

    const appState = {
        serverSettings: {
            unlock_duration: window.UNLOCK_DURATION || 60,
            ad_probability: window.AD_PROBABILITY || '15_cooldown'
        },
        newGalleryState: {
            name: '',
            privacy: false,
            visibility: true,
            profilePictureFile: null,
            pendingPhotos: []
        },
        currentAppView: null,
        currentAppSection: null,
        currentAppSectionData: null,
        lastVisitedView: null,
        lastVisitedSection: null,
        lastVisitedData: null,
        previousVisitedView: null,
        previousVisitedSection: null,
        previousVisitedData: null,
        currentSortBy: 'relevant',
        currentGalleryForPhotoView: null,
        currentGalleryNameForPhotoView: null,
        currentTrendingPhotosList: [],
        currentHistoryPhotosList: [],
        currentPhotoData: null,
        adCountdownInterval: null,
        photoAfterAd: null,
        galleryAfterAd: null,
        unlockCountdownInterval: null,
        currentPhotoViewList: [],
        currentRotation: 0,
        BATCH_SIZE: 20,
        ADMIN_USERS_BATCH_SIZE: 25,
        ADMIN_GALLERIES_BATCH_SIZE: 25,
        ADMIN_COMMENTS_BATCH_SIZE: 25,
        ADMIN_FEEDBACK_BATCH_SIZE: 25,
        HISTORY_PROFILES_BATCH: 20,
        HISTORY_PHOTOS_BATCH: 20,
        HISTORY_SEARCHES_BATCH: 25,

        paginationState: {
            galleries: { currentPage: 1, isLoading: false, batchSize: 20 },
            photos: { currentPage: 1, isLoading: false, photoList: [], batchSize: 20 },
            adminUsers: { currentPage: 1, isLoading: false, batchSize: 25 },
            adminGalleries: { currentPage: 1, isLoading: false, batchSize: 25 },
            adminComments: { currentPage: 1, isLoading: false, batchSize: 25 },
            adminFeedback: { currentPage: 1, isLoading: false, batchSize: 25 },
            historyProfiles: { shown: 20 },
            historyPhotos: { shown: 20 },
            historySearches: { shown: 25 }
        },
        currentFavoritesSortBy: 'user',
        currentFavoritesList: [],
        userFavoriteIds: new Set(),
        adCooldownActive: false,
        adContext: 'navigation',
        adStep: 1,
        activeScrollHandlers: [],
        initSettingsController,
        initHistoryPrivacySettings,
        initLoginSecuritySettings,
        fetchUserFavorites,
        isFavorite,
        toggleFavorite,
        updateFavoriteButtonState,
        updateFavoriteCardState,
        startUnlockCountdownTimer,
        promptToWatchAd,
        isPrivateGalleryUnlocked,
        rotatePhoto,
        updateMoreOptionsFilterText,
        updateSelectActiveState,
        downloadPhoto,
        copyTextToClipboard,
        removeSearchFromHistory,
        setupScrollShadows,
        updateThemeSelectorUI,
        updateLanguageSelectorUI
    };

    let selectedGallery = null;
    let selectedLog = null;
    let selectedBackup = null;
    let selectedUser = null;
    let selectedComment = null;
    let selectedFeedback = null;
    let selectedProfanityWord = null;
    let selectedHistoryItems = new Set();

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

    function updateHistoryHeader() {
        const actionButtonsContainer = document.getElementById('history-action-buttons');
        if (!actionButtonsContainer) return;

        if (selectedHistoryItems.size > 0) {
            actionButtonsContainer.innerHTML = `
                <button class="header-button" data-action="delete-history-items" data-i18n-tooltip="settings.history.deleteTooltip">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            `;
        } else {
            actionButtonsContainer.innerHTML = '';
        }
        applyTranslations(actionButtonsContainer);
        initTooltips();
    }

    function handleHistorySelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');
        if (!clickedItem) return;

        const itemId = clickedItem.dataset.id;
        if (!itemId) return;

        if (clickedItem.classList.contains('selected')) {
            selectedHistoryItems.delete(itemId);
            clickedItem.classList.remove('selected');
        } else {
            selectedHistoryItems.add(itemId);
            clickedItem.classList.add('selected');
        }

        updateHistoryHeader();
    }

    function deselectAllHistoryItems() {
        document.querySelectorAll('#history-container .admin-list-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        selectedHistoryItems.clear();
        updateHistoryHeader();
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
    
    function updateManageProfanityHeader() {
        const actionButtonsContainer = document.getElementById('profanity-action-buttons');
        if (!actionButtonsContainer) return;

        let buttonsHTML = '';

        if (selectedProfanityWord) {
            buttonsHTML = `
                <button class="header-button" data-action="delete-profanity-word" data-id="${selectedProfanityWord.dataset.id}" data-i18n-tooltip="admin.generalSettings.profanityFilter.deleteTooltip">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            `;
        }

        actionButtonsContainer.innerHTML = buttonsHTML;
        applyTranslations(actionButtonsContainer);
        initTooltips();
    }

    function handleProfanityWordSelection(event) {
        const clickedItem = event.target.closest('.admin-list-item');

        if (clickedItem) {
            if (selectedProfanityWord === clickedItem) {
                clickedItem.classList.remove('selected');
                selectedProfanityWord = null;
            } else {
                if (selectedProfanityWord) {
                    selectedProfanityWord.classList.remove('selected');
                }
                clickedItem.classList.add('selected');
                selectedProfanityWord = clickedItem;
            }
        }
        updateManageProfanityHeader();
    }

    function deselectProfanityWord() {
        if (selectedProfanityWord) {
            selectedProfanityWord.classList.remove('selected');
            selectedProfanityWord = null;
            updateManageProfanityHeader();
        }
    }

    async function shouldShowAd() {
        const sessionResponse = await api.checkSession();
        if (sessionResponse.ok && sessionResponse.data.loggedin) {
            const userRole = sessionResponse.data.user.role;
            if (['moderator', 'administrator', 'founder'].includes(userRole)) {
                return false;
            }
        }

        if (appState.adCooldownActive) {
            return false;
        }

        const adSetting = appState.serverSettings.ad_probability;
        const [probStr] = adSetting.split('_');
        const probability = parseInt(probStr, 10);

        if (isNaN(probability) || probability === 0) {
            return false;
        }

        const randomChance = Math.random() * 100;
        return randomChance < probability;
    }

    function initSettingsController() {
        const settingsToggles = {
            'open-links-in-new-tab': {
                element: document.querySelector('[data-setting="open-links-in-new-tab"]'),
                key: 'open_links_in_new_tab'
            },
            'longer-message-duration': {
                element: document.querySelector('[data-setting="longer-message-duration"]'),
                key: 'longer_message_duration'
            }
        };

        function updateToggleUI(setting) {
            if (setting.element) {
                const isActive = localStorage.getItem(setting.key) === 'true';
                setting.element.classList.toggle('active', isActive);
            }
        }

        for (const id in settingsToggles) {
            const setting = settingsToggles[id];
            if (setting.element) {
                updateToggleUI(setting);

                setting.element.addEventListener('click', () => {
                    const currentValue = localStorage.getItem(setting.key) === 'true';
                    const newValue = !currentValue;
                    localStorage.setItem(setting.key, newValue);
                    updateToggleUI(setting);
                    saveUserPreferences();
                });
            }
        }
    }

    function initHistoryPrivacySettings() {
        const settingsToggles = {
            'enable-view-history': {
                element: document.querySelector('[data-setting="enable-view-history"]'),
                key: 'enable_view_history'
            },
            'enable-search-history': {
                element: document.querySelector('[data-setting="enable-search-history"]'),
                key: 'enable_search_history'
            }
        };

        function updateToggleUI(setting) {
            if (setting.element) {
                const isActive = localStorage.getItem(setting.key) !== 'false';
                setting.element.classList.toggle('active', isActive);
            }
        }

        for (const id in settingsToggles) {
            const setting = settingsToggles[id];
            if (setting.element) {
                updateToggleUI(setting);

                setting.element.addEventListener('click', () => {
                    const currentValue = localStorage.getItem(setting.key) !== 'false';
                    const newValue = !currentValue;
                    localStorage.setItem(setting.key, newValue);
                    updateToggleUI(setting);
                    saveUserPreferences();
                });
            }
        }

        const clearHistoryBtn = document.querySelector('[data-action="clear-history"]');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                const history = await api.getHistory();
                const totalItems = history.profiles.length + history.photos.length + history.searches.length;

                if (totalItems === 0) {
                    showNotification(window.getTranslation('notifications.historyEmpty'));
                    return;
                }

                const message = window.getTranslation('dialogs.clearHistoryMessage');
                const confirmed = await showCustomConfirm(window.getTranslation('dialogs.clearHistoryTitle'), message);

                if (confirmed) {
                    const response = await api.clearHistory();
                    if (response.ok) {
                        showNotification(window.getTranslation('notifications.historyCleared'));
                        if (appState.currentAppSection === 'history' || appState.currentAppSection === 'historyPrivacy') {
                            handleStateChange(appState.currentAppView, appState.currentAppSection, true, null, appState);
                        }
                    } else {
                        showNotification('Error al eliminar el historial.', 'error');
                    }
                }
            });
        }
    }

    function initLoginSecuritySettings() {
        const twoFactorToggle = document.querySelector('[data-setting="two-factor-auth"]');
        if (twoFactorToggle) {
            api.checkSession().then(response => {
                if (response.ok && response.data.loggedin) {
                    twoFactorToggle.classList.toggle('active', response.data.user.two_factor_enabled);
                }
            });
    
            twoFactorToggle.addEventListener('click', async () => {
                const isActive = twoFactorToggle.classList.contains('active');
                const enable = !isActive;
    
                const passwordVerified = await showVerifyPasswordFor2FADialog();
                if (passwordVerified) {
                    const response = await api.toggleTwoFactorAuth(enable);
                    if (response.ok) {
                        twoFactorToggle.classList.toggle('active', enable);
                        showNotification('Configuración de 2FA actualizada', 'success');
                    } else {
                        showNotification(response.data.message || 'Error al actualizar la configuración de 2FA', 'error');
                    }
                }
            });
        }
    }

    async function fetchUserFavorites() {
        const response = await api.getFavorites();
        if (response.ok) {
            appState.currentFavoritesList = response.data.favorites || [];
            appState.userFavoriteIds = new Set(appState.currentFavoritesList.map(p => p.id));
        } else {
            appState.currentFavoritesList = [];
            appState.userFavoriteIds.clear();
        }
    }

    function isFavorite(photoId) {
        return appState.userFavoriteIds.has(parseInt(photoId, 10));
    }

    async function toggleFavorite(photoData) {
        const sessionResponse = await api.checkSession();
        if (!sessionResponse.ok || !sessionResponse.data.loggedin) {
            window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'login' } }));
            return;
        }

        const photoId = parseInt(photoData.id, 10);
        const wasFavorite = isFavorite(photoId);

        if (wasFavorite) {
            appState.userFavoriteIds.delete(photoId);
            appState.currentFavoritesList = appState.currentFavoritesList.filter(p => p.id !== photoId);
        } else {
            appState.userFavoriteIds.add(photoId);
            appState.currentFavoritesList.push({ ...photoData, id: photoId, added_at: Date.now() });
        }
        updateFavoriteButtonState(photoId);
        updateFavoriteCardState(photoId);

        const response = await api.toggleFavorite(photoId, !wasFavorite);
        if (!response.ok) {
            if (wasFavorite) {
                appState.userFavoriteIds.add(photoId);
            } else {
                appState.userFavoriteIds.delete(photoId);
            }
            showNotification(window.getTranslation('general.connectionErrorMessage'), 'error');
            updateFavoriteButtonState(photoId);
            updateFavoriteCardState(photoId);
        }
    }

    function updateFavoriteButtonState(photoId) {
        const favButton = document.querySelector('[data-action="toggle-favorite"]');
        if (favButton) {
            favButton.classList.toggle('active', isFavorite(photoId));
        }
    }

    function updateFavoriteCardState(photoId) {
        document.querySelectorAll(`.icon-wrapper[data-photo-id="${photoId}"]`).forEach(button => {
            button.classList.toggle('active', isFavorite(photoId));
        });
    }

    function startUnlockCountdownTimer() {
        if (appState.unlockCountdownInterval) {
            clearInterval(appState.unlockCountdownInterval);
        }
        appState.unlockCountdownInterval = setInterval(() => {
            const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
            for (const uuid in unlockedGalleries) {
                updateCardPrivacyStatus(uuid, unlockedGalleries[uuid]);
            }
        }, 1000);
    }

    async function promptToWatchAd(uuid, name) {
        const sessionResponse = await api.checkSession();
        if (sessionResponse.ok && sessionResponse.data.loggedin) {
            const userRole = sessionResponse.data.user.role;
            if (['moderator', 'administrator', 'founder'].includes(userRole)) {
                const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
                unlockedGalleries[uuid] = new Date().getTime();
                localStorage.setItem('unlockedGalleries', JSON.stringify(unlockedGalleries));
                navigateToUrl('main', 'galleryPhotos', { uuid });
                handleStateChange('main', 'galleryPhotos', true, { uuid, galleryName: name }, appState);
                return;
            }
        }

        appState.adContext = 'unlock';
        appState.adStep = 1;
        appState.galleryAfterAd = { view: 'main', section: 'galleryPhotos', data: { uuid, galleryName: name } };
        await handleStateChange('main', 'accessCodePrompt', true, { uuid }, appState);
    }

    function isPrivateGalleryUnlocked(uuid) {
        const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
        if (!unlockedGalleries[uuid]) {
            return false;
        }
        const now = new Date().getTime();
        const unlockDurationMinutes = appState.serverSettings.unlock_duration * 60 * 1000;
        return (now - unlockedGalleries[uuid]) < unlockDurationMinutes;
    }

    function rotatePhoto(direction) {
        const photoViewerImage = document.getElementById('photo-viewer-image');
        if (photoViewerImage) {
            appState.currentRotation += direction === 'right' ? 90 : -90;
            photoViewerImage.style.transform = `rotate(${appState.currentRotation}deg)`;
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

    async function removeSearchFromHistory(timestamp) {
        const history = await api.getHistory();
        const itemToDelete = history.searches.find(item => item.visited_at == timestamp);

        if (itemToDelete) {
            displayHistory(appState.paginationState.historyProfiles.shown, appState.paginationState.historyPhotos.shown, appState.paginationState.historySearches.shown);
        }
    }

    function setupScrollShadows() {
        appState.activeScrollHandlers.forEach(({ element, listener }) => {
            element.removeEventListener('scroll', listener);
        });
        appState.activeScrollHandlers = [];

        const mainScrolleable = document.querySelector('.general-content-scrolleable');
        const mainHeader = document.querySelector('.general-content-top');

        if (mainScrolleable && mainHeader) {
            const mainListener = () => {
                mainHeader.classList.toggle('shadow', mainScrolleable.scrollTop > 0);
            };
            mainScrolleable.addEventListener('scroll', mainListener);
            appState.activeScrollHandlers.push({ element: mainScrolleable, listener: mainListener });
            mainListener();
        }

        const sectionScrolleable = document.querySelector('.section-content-block.overflow-y');
        const sectionHeader = document.querySelector('.section-content-header');

        if (sectionScrolleable && sectionHeader) {
            const sectionListener = () => {
                sectionHeader.classList.toggle('shadow', sectionScrolleable.scrollTop > 0);
            };
            sectionScrolleable.addEventListener('scroll', sectionListener);
            appState.activeScrollHandlers.push({ element: sectionScrolleable, listener: sectionListener });
            sectionListener();
        }
    }

    function setupEventListeners() {
        document.addEventListener('input', (event) => {
            if (appState.currentAppSection === 'createGallery') {
                const nameInput = event.target.closest('#gallery-name-create');
                if (nameInput) {
                    appState.newGalleryState.name = nameInput.value;
                }
            }
        });

        document.addEventListener('change', (event) => {
            const fileInput = event.target;

            if (fileInput.matches('#profile-picture-upload-create')) {
                if (fileInput.files && fileInput.files[0]) {
                    appState.newGalleryState.profilePictureFile = fileInput.files[0];
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('profile-picture-preview-create');
                        if(preview) preview.style.backgroundImage = `url('${e.target.result}')`;
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                }
            }

            if (fileInput.matches('#add-photos-input')) {
                const photosGridEl = document.getElementById('manage-photos-grid');
                const videosGridEl = document.getElementById('manage-videos-grid');
                const mainStatusContainer = document.getElementById('manage-content-status-container');

                if (!photosGridEl || !videosGridEl) return;

                if (mainStatusContainer) {
                    mainStatusContainer.classList.add('disabled');
                }

                const currentSection = document.querySelector('[data-section="manageGalleryPhotos"]');
                const isNewGalleryMode = currentSection && currentSection.dataset.mode === 'new';

                const files = Array.from(event.target.files);

                for (const file of files) {
                    if (isNewGalleryMode) {
                        if (!appState.newGalleryState.pendingPhotos.some(f => f.name === file.name)) {
                            appState.newGalleryState.pendingPhotos.push(file);
                        }
                    } else {
                        if (!window.pendingGalleryFiles) window.pendingGalleryFiles = [];
                        if (!window.pendingGalleryFiles.some(f => f.name === file.name)) {
                            window.pendingGalleryFiles.push(file);
                        }
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const newContentItem = document.createElement('div');
                        newContentItem.className = 'photo-item-edit pending-upload';
                        newContentItem.dataset.fileName = file.name;

                        const isVideo = file.type.startsWith('video/');

                        let thumbnailHTML = `<img src="${e.target.result}" alt="Nueva previsualización">`;
                        if (isVideo) {
                            thumbnailHTML = `
                            <img src="${e.target.result}" alt="Nueva previsualización de video">
                            <div class="play-icon-overlay"><span class="material-symbols-rounded">play_arrow</span></div>
                        `;
                        }

                        newContentItem.innerHTML = `
                        ${thumbnailHTML}
                        <button class="delete-photo-btn" data-action="delete-gallery-photo">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    `;

                        if (isVideo) {
                            videosGridEl.appendChild(newContentItem);
                            document.getElementById('videos-management-section').style.display = 'block';
                        } else {
                            photosGridEl.appendChild(newContentItem);
                            document.getElementById('photos-management-section').style.display = 'block';
                        }

                        if (photosGridEl.children.length > 0 && videosGridEl.children.length > 0) {
                            const separator = document.querySelector('.photo-video-separator');
                            if (separator) separator.style.display = 'block';
                        }
                    };

                    reader.readAsDataURL(file);
                }
                fileInput.value = '';
            }
        });

        document.addEventListener('click', async function (event) {
            const historyListContainer = document.getElementById('history-container');
            const historyActionButtons = document.getElementById('history-action-buttons');
            if (appState.currentAppSection === 'history' && historyListContainer) {
                if (historyListContainer.contains(event.target)) {
                    handleHistorySelection(event);
                } else if (!historyActionButtons || !historyActionButtons.contains(event.target)) {
                    deselectAllHistoryItems();
                }
            }
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
            
            const profanityListContainer = document.getElementById('profanity-words-list');
            if (appState.currentAppSection === 'manageProfanity' && profanityListContainer) {
                if (profanityListContainer.contains(event.target)) {
                    handleProfanityWordSelection(event);
                } else {
                    deselectProfanityWord();
                }
            }

            const actionTarget = event.target.closest('[data-action]');
            const selectTrigger = event.target.closest('[data-action="toggle-select"]');
            const submitCommentBtn = event.target.closest('#submit-comment-btn');

            const generalSettingsToggle = event.target.closest('[data-section="generalSettings"] .toggle-switch');
            if (generalSettingsToggle) {
                generalSettingsToggle.classList.toggle('active');
            }

            if (appState.currentAppSection === 'createGallery' && event.target.closest('#gallery-privacy-create')) {
                const privacyToggle = event.target.closest('#gallery-privacy-create');
                appState.newGalleryState.privacy = !privacyToggle.classList.contains('active');
            }

            if (appState.currentAppSection === 'createGallery' && event.target.closest('#gallery-visibility-create')) {
                const visibilityToggle = event.target.closest('#gallery-visibility-create');
                appState.newGalleryState.visibility = !visibilityToggle.classList.contains('active');
            }

            if (actionTarget && actionTarget.dataset.action === 'submit-founder-verification') {
                const button = actionTarget;
                const passwordInput = document.getElementById('founder-password');
                const password = passwordInput.value;
                const errorContainer = document.getElementById('verify-founder-error-container');
                const errorList = document.getElementById('verify-founder-error-list');

                if (!password) {
                    errorList.innerHTML = `<li>${window.getTranslation('auth.errors.passwordRequired')}</li>`;
                    errorContainer.style.display = 'block';
                    return;
                }

                errorContainer.style.display = 'none';
                button.classList.add('loading');

                const formData = new FormData();
                formData.append('action_type', 'verify_founder_password');
                formData.append('password', password);

                const response = await api.verifyFounderPassword(formData);

                button.classList.remove('loading');

                if (response.ok) {
                    navigateToUrl('admin', 'generalSettings');
                    handleStateChange('admin', 'generalSettings', true, null, appState);
                } else {
                    errorList.innerHTML = `<li>${response.data.message || 'Error de verificación'}</li>`;
                    errorContainer.style.display = 'block';
                }
            }
            if (actionTarget && actionTarget.dataset.action === 'delete-history-items') {
                const confirmed = await showCustomConfirm(
                    'Eliminar elementos del historial',
                    `¿Estás seguro de que quieres eliminar los ${selectedHistoryItems.size} elementos seleccionados? Esta acción es permanente.`
                );

                if (confirmed) {
                    const response = await api.deleteHistoryItems(Array.from(selectedHistoryItems));
                    if (response.ok) {
                        showNotification('Elementos del historial eliminados.', 'success');
                        deselectAllHistoryItems();
                        displayHistory(appState.paginationState.historyProfiles.shown, appState.paginationState.historyPhotos.shown, appState.paginationState.historySearches.shown);
                    } else {
                        showNotification('Error al eliminar los elementos.', 'error');
                    }
                }
            }
            if (submitCommentBtn) {
                const commentInput = document.getElementById('comment-input');
                const commentText = commentInput.value.trim();
                const photoId = appState.currentPhotoData.id;

                if (commentText && photoId) {
                    submitCommentBtn.classList.add('loading');
                    const response = await api.addComment(photoId, commentText);
                    submitCommentBtn.classList.remove('loading');

                    if (response.ok) {
                        const commentsList = document.getElementById('comments-list');
                        const noCommentsMsg = commentsList.querySelector('p');
                        if (noCommentsMsg) {
                            noCommentsMsg.remove();
                        }

                        const newComment = response.data.comment;
                        const commentElement = document.createElement('div');
                        commentElement.className = 'comment-item';
                        commentElement.dataset.commentId = newComment.id;
                        const initials = newComment.username.substring(0, 2).toUpperCase();
                        const date = new Date(newComment.created_at).toLocaleString();

                        const fullText = newComment.comment_text;
                        const isLong = fullText.length > 250;
                        const shortText = isLong ? fullText.substring(0, 250) + '...' : fullText;

                        commentElement.innerHTML = `
                        <div class="comment-avatar-container">
                            <div class="comment-avatar profile-btn--${newComment.role}">${initials}</div>
                        </div>
                        <div class="comment-content">
                            <div class="comment-header">
                                <span class="comment-author">${newComment.username}</span>
                                <span class="comment-date">${date}</span>
                            </div>
                            <p class="comment-text" data-full-text="${fullText}">${shortText}</p>
                            ${isLong ? `<button class="show-more-comment-btn" data-action="toggle-comment-length">${window.getTranslation('photoView.comments.showMore')}</button>` : ''}
                            <div class="comment-actions">
                                <div class="like-dislike-container">
                                    <button class="comment-action-btn like-btn" data-action="like-comment">
                                        <span class="material-symbols-rounded">thumb_up</span>
                                    </button>
                                    <span class="like-count">${newComment.likes || 0}</span>
                                    <button class="comment-action-btn dislike-btn" data-action="dislike-comment">
                                        <span class="material-symbols-rounded">thumb_down</span>
                                    </button>
                                    <span class="dislike-count">${newComment.dislikes || 0}</span>
                                </div>
                                <div>
                                    <button class="comment-action-btn reply-btn" data-action="reply-comment">
                                        <span class="material-symbols-rounded">reply</span>
                                    </button>
                                    <button class="comment-action-btn report-btn" data-action="report-comment">
                                        <span class="material-symbols-rounded">flag</span>
                                    </button>
                                </div>
                            </div>
                            <div class="replies-container"></div>
                        </div>
                    `;
                        commentsList.prepend(commentElement);
                        commentInput.value = '';
                    } else {
                        showNotification(response.data.message || 'Error al publicar el comentario.', 'error');
                    }
                }
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
                    case 'create-backup': {
                        const button = actionTarget;
                        button.classList.add('loading');
                        const response = await api.createBackup();
                        button.classList.remove('loading');

                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            fetchAndDisplayBackups();
                        } else {
                            showNotification(response.data.message || 'Error al crear la copia de seguridad.', 'error');
                        }
                        break;
                    }
                    case 'restore-backup': {
                        const filename = actionTarget.dataset.filename;
                        const confirmed = await showRestoreBackupDialog(filename);
                        if (confirmed) {
                            const button = actionTarget;
                            button.classList.add('loading');
                            const response = await api.restoreBackup(filename);
                            button.classList.remove('loading');

                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                                // Opcional: Recargar la página o redirigir
                                setTimeout(() => window.location.reload(), 2000);
                            } else {
                                showNotification(response.data.message || 'Error al restaurar la copia de seguridad.', 'error');
                            }
                        }
                        break;
                    }
                    case 'change-role-option': {
                        const userUuid = actionTarget.dataset.uuid;
                        const newRole = actionTarget.dataset.role;
                        const userName = actionTarget.dataset.username;
                        const menuContainer = actionTarget.closest('.module-select');

                        if (menuContainer) {
                            menuContainer.classList.add('disabled');
                            menuContainer.classList.remove('active');
                            const trigger = document.querySelector(`[data-target="${menuContainer.id}"]`);
                            if (trigger) trigger.classList.remove('active-trigger');
                        }

                        showChangeRoleDialog(userUuid, newRole, userName);
                        break;
                    }
                    case 'view-log': {
                        const filename = actionTarget.dataset.filename;
                        if (filename) {
                            navigateToUrl('admin', 'viewLog', {
                                filename
                            });
                            handleStateChange('admin', 'viewLog', true, {
                                filename
                            }, appState);
                        }
                        break;
                    }
                    case 'add-profanity-word': {
                        const button = actionTarget;
                        const wordInput = document.getElementById('profanity-word-input');
                        const langSelect = document.querySelector('#profanity-language-select .menu-link.active');

                        const word = wordInput.value.trim();
                        const lang = langSelect ? langSelect.dataset.value : null;

                        if (!word || !lang) {
                            showNotification('Por favor, ingresa una palabra y selecciona un idioma.', 'error');
                            return;
                        }

                        button.classList.add('loading');
                        const response = await api.addProfanityWord(word, lang);
                        button.classList.remove('loading');

                        if (response.ok) {
                            showNotification(response.data.message, response.data.no_change ? '' : 'success');
                            wordInput.value = '';
                            // Recargar la lista para mostrar la nueva palabra
                            fetchAndDisplayProfanityWords();
                        } else {
                            showNotification(response.data.message || 'Error al añadir la palabra.', 'error');
                        }
                        break;
                    }
                    case 'delete-profanity-word': {
                        const button = actionTarget;
                        const id = button.dataset.id;
                        const confirmed = await showCustomConfirm('¿Eliminar Palabra?', '¿Estás seguro de que quieres eliminar esta palabra del filtro?');

                        if (confirmed) {
                            const response = await api.deleteProfanityWord(id);
                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                                fetchAndDisplayProfanityWords(); // Refresh the list
                                deselectProfanityWord(); // Deselect after deletion
                            } else {
                                showNotification(response.data.message || 'Error al eliminar la palabra.', 'error');
                            }
                        }
                        break;
                    }
                    case 'truncate-database':
                        showTruncateDatabaseDialog();
                        break;
                    case 'toggle-play-pause': {
                        const video = document.getElementById('photo-viewer-video');
                        const icon = actionTarget.querySelector('.material-symbols-rounded');
                        if (video && icon) {
                            if (video.paused) {
                                video.play();
                                icon.textContent = 'pause';
                                actionTarget.setAttribute('data-i18n-tooltip', 'photoView.pauseButtonTooltip');
                            } else {
                                video.pause();
                                icon.textContent = 'play_arrow';
                                actionTarget.setAttribute('data-i18n-tooltip', 'photoView.playButtonTooltip');
                            }
                            window.applyTranslations(actionTarget.parentElement);
                        }
                        break;
                    }
                    case 'toggle-follow': {
                        const sessionResponse = await api.checkSession();
                        if (!sessionResponse.ok || !sessionResponse.data.loggedin) {
                            window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'auth', section: 'login' } }));
                            return;
                        }
                        const button = actionTarget;
                        const buttonText = button.querySelector('.button-text');
                        const uuid = button.dataset.uuid;
                        const isFollowing = !button.classList.contains('btn-primary');

                        button.classList.add('loading');

                        const response = await api.toggleFollow(uuid, isFollowing);

                        button.classList.remove('loading');

                        if (response.ok) {
                            button.classList.toggle('btn-primary');
                            if (isFollowing) {
                                buttonText.textContent = window.getTranslation('userPhotos.followButton');
                            } else {
                                buttonText.textContent = window.getTranslation('userPhotos.unfollowButton');
                            }
                        } else {
                            showNotification('Error al procesar la solicitud.', 'error');
                        }
                        break;
                    }
                    case 'view-gallery-stats': {
                        const uuid = actionTarget.dataset.uuid;
                        navigateToUrl('admin', 'galleryStats', { uuid });
                        handleStateChange('admin', 'galleryStats', true, { uuid }, appState);
                        break;
                    }
                    case 'save-gallery-stats': {
                        const button = actionTarget;
                        const container = document.getElementById('gallery-stats-container');
                        const uuid = document.querySelector('[data-section="galleryStats"]').dataset.uuid;
                        if (!container || !uuid) return;

                        button.classList.add('loading');

                        const statsData = {
                            total_likes: parseInt(container.querySelector('#total-likes-input').value.replace(/,/g, ''), 10),
                            total_interactions: parseInt(container.querySelector('#total-interactions-input').value.replace(/,/g, ''), 10),
                            photos: []
                        };

                        container.querySelectorAll('#photo-stats-table tbody tr').forEach(row => {
                            statsData.photos.push({
                                id: parseInt(row.querySelector('[data-stat="likes"]').dataset.photoid, 10),
                                likes: parseInt(row.querySelector('[data-stat="likes"]').value.replace(/,/g, ''), 10),
                                interactions: parseInt(row.querySelector('[data-stat="interactions"]').value.replace(/,/g, ''), 10)
                            });
                        });

                        const response = await api.updateGalleryStats(uuid, statsData);
                        button.classList.remove('loading');

                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                        } else {
                            showNotification(response.data.message || 'Error al guardar las estadísticas.', 'error');
                        }
                        break;
                    }
                    case 'add-sanction': {
                        const userUuid = actionTarget.dataset.uuid;
                        const userName = actionTarget.dataset.username;
                        if (userUuid && userName) {
                            showSanctionDialog(userUuid, userName);
                        }
                        break;
                    }
                    case 'delete-sanction': {
                        const sanctionId = actionTarget.dataset.sanctionId;
                        const confirmed = await showCustomConfirm('¿Eliminar Sanción?', 'Esta acción eliminará permanentemente el registro de esta sanción. ¿Estás seguro?');
                        if (confirmed) {
                            const response = await api.deleteUserSanction(sanctionId);
                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                                const userProfileSection = document.querySelector('[data-section="userProfile"]');
                                const userUuid = userProfileSection?.dataset.uuid;
                                if (userUuid) {
                                    fetchAndDisplayUserProfile(userUuid);
                                }
                            } else {
                                showNotification(response.data.message || 'Error al eliminar la sanción.', 'error');
                            }
                        }
                        break;
                    }
                    case 'view-user-profile': {
                        const userUuid = actionTarget.dataset.uuid;
                        navigateToUrl('admin', 'userProfile', { uuid: userUuid });
                        handleStateChange('admin', 'userProfile', true, { uuid: userUuid }, appState);
                        break;
                    }
                    case 'batch-action': {
                        const selectedCheckboxes = document.querySelectorAll('#users-table tbody .user-select:checked');
                        const selectedUuids = Array.from(selectedCheckboxes).map(cb => cb.dataset.uuid);

                        if (selectedUuids.length === 0) {
                            showNotification('Por favor, selecciona al menos un usuario.', 'error');
                            return;
                        }

                        const batchAction = document.getElementById('batch-action-select').value;

                        const formData = new FormData();
                        formData.append('action_type', 'batch_update_users');
                        formData.append('uuids', JSON.stringify(selectedUuids));
                        formData.append('batch_action', batchAction);

                        const response = await api.batchUpdateUsers(formData);
                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            fetchAndDisplayUsers('', false, appState.paginationState.adminUsers);
                        } else {
                            showNotification(response.data.message || 'Error al realizar la acción en lote.', 'error');
                        }
                        break;
                    }
                    case 'like-comment':
                    case 'dislike-comment': {
                        const commentItem = actionTarget.closest('.comment-item');
                        const commentId = commentItem.dataset.commentId;
                        const isLike = action === 'like-comment';

                        const currentVoteIsActive = actionTarget.classList.contains('active');
                        const voteType = currentVoteIsActive ? 0 : (isLike ? 1 : -1);

                        const response = await api.likeComment(commentId, voteType);

                        if (response.ok) {
                            commentItem.querySelector('.like-count').textContent = response.data.likes;
                            commentItem.querySelector('.dislike-count').textContent = response.data.dislikes;

                            const likeBtn = commentItem.querySelector('.like-btn');
                            const dislikeBtn = commentItem.querySelector('.dislike-btn');

                            likeBtn.classList.remove('active');
                            dislikeBtn.classList.remove('active');

                            if (voteType === 1) {
                                likeBtn.classList.add('active');
                            } else if (voteType === -1) {
                                dislikeBtn.classList.add('active');
                            }
                        } else {
                            showNotification(response.data.message || 'Error al procesar el voto.', 'error');
                        }
                        break;
                    }
                    case 'report-comment': {
                        const commentItem = actionTarget.closest('.comment-item');
                        const commentId = commentItem.dataset.commentId;
                        const reported = await showReportCommentDialog(commentId);
                        if (reported) {
                            actionTarget.disabled = true;
                            actionTarget.style.opacity = '0.5';
                        }
                        break;
                    }
                    case 'reply-comment': {
                        const commentItem = actionTarget.closest('.comment-item');
                        const commentId = commentItem.dataset.commentId;
                        const repliesContainer = commentItem.querySelector('.replies-container');
                        let replyForm = repliesContainer.querySelector('.comment-form-container');

                        if (!replyForm) {
                            replyForm = document.createElement('div');
                            replyForm.className = 'comment-form-container reply-form-container';
                            replyForm.innerHTML = `
                            <textarea class="feedback-textarea" rows="2" maxlength="500" placeholder="Escribe una respuesta..."></textarea>
                            <button class="load-more-btn" data-action="submit-reply" data-parent-id="${commentId}">
                                <span class="button-text">Responder</span>
                                <div class="button-spinner"></div>
                            </button>
                        `;
                            repliesContainer.prepend(replyForm);
                            replyForm.querySelector('textarea').focus();
                        } else {
                            replyForm.remove();
                        }
                        break;
                    }

                    case 'submit-reply': {
                        const parentId = actionTarget.dataset.parentId;
                        const replyForm = actionTarget.closest('.reply-form-container');
                        const textarea = replyForm.querySelector('textarea');
                        const replyText = textarea.value.trim();
                        const photoId = appState.currentPhotoData.id;

                        if (replyText) {
                            actionTarget.classList.add('loading');
                            const response = await api.addComment(photoId, replyText, parentId);
                            actionTarget.classList.remove('loading');

                            if (response.ok) {
                                const commentsResponse = await api.getComments(photoId);
                                if (commentsResponse.ok) {
                                    displayComments(commentsResponse.data);
                                }
                            } else {
                                showNotification(response.data.message || 'Error al publicar la respuesta.', 'error');
                            }
                        }
                        break;
                    }

                    case 'toggle-replies': {
                        const commentItem = actionTarget.closest('.comment-item');
                        const repliesContainer = commentItem.querySelector('.replies-container');
                        const repliesData = JSON.parse(commentItem.dataset.replies || '[]');
                        const totalReplies = parseInt(actionTarget.dataset.totalReplies, 10);
                        const state = actionTarget.dataset.state;

                        if (state === 'hidden') {
                            repliesContainer.style.display = 'flex';
                            actionTarget.dataset.state = 'shown';

                            const repliesToShow = repliesData.slice(0, 10);
                            repliesContainer.innerHTML = '';

                            repliesToShow.forEach(reply => {
                                const replyElement = createCommentElement(reply, true);
                                repliesContainer.appendChild(replyElement);
                            });

                            if (totalReplies > 10) {
                                actionTarget.textContent = 'Mostrar más respuestas';
                                actionTarget.dataset.shownCount = 10;
                            } else {
                                actionTarget.textContent = 'Ocultar respuestas';
                            }

                        } else if (state === 'shown') {
                            const shownCount = parseInt(actionTarget.dataset.shownCount || '10', 10);

                            if (shownCount < totalReplies) {
                                const newCount = Math.min(shownCount + 10, totalReplies);
                                const newReplies = repliesData.slice(shownCount, newCount);

                                newReplies.forEach(reply => {
                                    const replyElement = createCommentElement(reply, true);
                                    repliesContainer.appendChild(replyElement);
                                });

                                actionTarget.dataset.shownCount = newCount;

                                if (newCount === totalReplies) {
                                    actionTarget.textContent = 'Ocultar respuestas';
                                }

                            } else {
                                repliesContainer.style.display = 'none';
                                repliesContainer.innerHTML = '';
                                actionTarget.dataset.state = 'hidden';
                                actionTarget.textContent = `Ver ${totalReplies} ${totalReplies > 1 ? 'respuestas' : 'respuesta'}`;
                            }
                        }
                        break;
                    }
                }
            }

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

            const filterTarget = event.target.closest('[data-filter]');
            if (filterTarget && filterTarget.closest('#gallery-filter-menu')) {
                const filterValue = filterTarget.dataset.filter;
                const section = document.querySelector('[data-section="galleryPhotos"]');
                if (!section) return;

                const photosSection = section.querySelector('#photos-section');
                const videosSection = section.querySelector('#videos-section');
                const photosGrid = section.querySelector('#user-photos-grid');
                const videosGrid = section.querySelector('#user-videos-container');
                const photosTitle = photosSection.querySelector('.category-section-title');
                const videosTitle = videosSection.querySelector('.category-section-title');
                const statusContainer = section.querySelector('.status-message-container');

                const hasPhotos = photosGrid && photosGrid.children.length > 0;
                const hasVideos = videosGrid && videosGrid.children.length > 0;

                document.querySelectorAll('#gallery-filter-menu .menu-link').forEach(link => {
                    link.classList.remove('active');
                });
                filterTarget.classList.add('active');

                // Restablecer el estado de la vista
                statusContainer.classList.add('disabled');
                photosSection.style.display = 'none';
                videosSection.style.display = 'none';
                photosTitle.style.display = 'flex';
                videosTitle.style.display = 'flex';

                if (filterValue === 'all') {
                    if (hasPhotos) photosSection.style.display = 'block';
                    if (hasVideos) videosSection.style.display = 'block';
                    // El caso en que ambos están vacíos es manejado por la función que carga las fotos.
                } else if (filterValue === 'photos') {
                    photosSection.style.display = 'block';
                    if (!hasPhotos) {
                        photosTitle.style.display = 'none';
                        photosGrid.style.display = 'none';
                        statusContainer.innerHTML = `<div><h2 data-i18n="userPhotos.noPhotosTitle"></h2><p data-i18n="userPhotos.noPhotosMessage"></p></div>`;
                        statusContainer.classList.remove('disabled');
                        window.applyTranslations(statusContainer);
                    }
                } else if (filterValue === 'videos') {
                    videosSection.style.display = 'block';
                    if (!hasVideos) {
                        videosTitle.style.display = 'none';
                        videosGrid.style.display = 'none';
                        statusContainer.innerHTML = `<div><h2 data-i18n="userPhotos.noVideosTitle"></h2><p data-i18n="userPhotos.noVideosMessage"></p></div>`;
                        statusContainer.classList.remove('disabled');
                        window.applyTranslations(statusContainer);
                    }
                }

                const menu = filterTarget.closest('.module-select');
                const trigger = document.querySelector('[data-target="gallery-filter-menu"]');
                if (menu) {
                    menu.classList.add('disabled');
                    menu.classList.remove('active');
                }
                if (trigger) {
                    trigger.classList.remove('active-trigger');
                }
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
                    case 'save-general-settings': {
                        const button = actionTarget;
                        button.classList.add('loading');

                        const maintenanceToggle = document.querySelector('[data-setting="maintenance-mode"]');
                        const registrationToggle = document.querySelector('[data-setting="allow-new-registrations"]');
                        const unlockDurationSelect = document.querySelector('#unlock-duration-select .menu-link.active');
                        const adProbabilitySelect = document.querySelector('#ad-probability-select .menu-link.active');

                        if (maintenanceToggle.classList.contains('active')) {
                            registrationToggle.classList.remove('active');
                        }

                        const settings = {
                            'maintenance_mode': maintenanceToggle.classList.contains('active') ? '1' : '0',
                            'allow_new_registrations': registrationToggle.classList.contains('active') ? '1' : '0',
                            'unlock_duration': unlockDurationSelect ? unlockDurationSelect.dataset.value : '60',
                            'ad_probability': adProbabilitySelect ? adProbabilitySelect.dataset.value : '15_cooldown'
                        };



                        const formData = new FormData();
                        formData.append('action_type', 'save_general_settings');
                        formData.append('settings', JSON.stringify(settings));

                        const response = await api.postDataWithCsrf(formData);
                        button.classList.remove('loading');

                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            window.MAINTENANCE_MODE = settings.maintenance_mode === '1';
                            appState.serverSettings.unlock_duration = parseInt(settings.unlock_duration, 10);
                            const [prob, cooldown] = settings.ad_probability.split('_');
                            appState.serverSettings.ad_probability = parseInt(prob, 10);
                            appState.serverSettings.ad_cooldown = cooldown === 'cooldown';
                        } else {
                            showNotification(response.data.message || 'Error al guardar la configuración.', 'error');
                        }
                        break;
                    }
                    case 'return-to-edit-gallery': {
                        const section = actionTarget.closest('.section-content');
                        const uuid = section ? section.dataset.uuid : null;

                        if (uuid) {
                            navigateToUrl('admin', 'editGallery', { uuid });
                            handleStateChange('admin', 'editGallery', true, { uuid }, appState);
                        } else {
                            navigateToUrl('admin', 'manageContent');
                            handleStateChange('admin', 'manageContent', true, null, appState);
                        }
                        break;
                    }
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
                        if (appState.currentAppView === 'auth' && appState.currentAppSection === 'login') return;
                        navigateToUrl('auth', 'login');
                        handleStateChange('auth', 'login', true, null, appState);
                        break;
                    case 'toggleSettings':
                        {
                            const sessionResponse = await api.checkSession();
                            if (sessionResponse.ok && sessionResponse.data.loggedin) {
                                if (appState.currentAppView === 'settings' && appState.currentAppSection === 'yourProfile') return;
                                navigateToUrl('settings', 'yourProfile');
                                handleStateChange('settings', 'yourProfile', true, null, appState);
                            } else {
                                if (appState.currentAppView === 'settings' && appState.currentAppSection === 'accessibility') return;
                                navigateToUrl('settings', 'accessibility');
                                handleStateChange('settings', 'accessibility', true, null, appState);
                            }
                        }
                        break;
                    case 'toggleHelp':
                        if (appState.currentAppView === 'help' && appState.currentAppSection === 'privacyPolicy') return;
                        navigateToUrl('help', 'privacyPolicy');
                        handleStateChange('help', 'privacyPolicy', true, null, appState);
                        break;
                    case 'toggleMainView':
                        if (appState.currentAppView === 'main' && appState.currentAppSection === 'home') return;
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home', true, null, appState);
                        break;
                    case 'toggleAdminPanel': {
                        const profileBtn = document.querySelector('.profile-btn');
                        const userRole = profileBtn ? profileBtn.dataset.userRole : 'user';

                        if (userRole === 'moderator') {
                            if (appState.currentAppView === 'admin' && appState.currentAppSection === 'manageComments') return;
                            navigateToUrl('admin', 'manageComments');
                            handleStateChange('admin', 'manageComments', true, null, appState);
                        } else {
                            if (appState.currentAppView === 'admin' && appState.currentAppSection === 'dashboard') return;
                            navigateToUrl('admin', 'dashboard');
                            handleStateChange('admin', 'dashboard', true, null, appState);
                        }
                        break;
                    }
                    case 'toggleSectionRegister':
                        if (appState.currentAppView === 'auth' && appState.currentAppSection === 'register') return;
                        navigateToUrl('auth', 'register', { step: 'user-info' });
                        handleStateChange('auth', 'register', true, { step: 'user-info' }, appState);
                        break;
                    case 'toggleSectionHome':
                    case 'toggleSectionTrends':
                    case 'toggleSectionFavorites':
                    case 'toggleSectionYourProfile':
                    case 'toggleSectionAccessibility':
                    case 'toggleSectionLoginSecurity':
                    case 'toggleSectionHistoryPrivacy':
                    case 'toggleSectionHistory':
                    case 'toggleSectionPrivacyPolicy':
                    case 'toggleSectionTermsConditions':
                    case 'toggleSectionCookiePolicy':
                    case 'toggleSectionSendFeedback':
                    case 'toggleSectionLogin':
                    case 'toggleSectionForgotPassword':
                    case 'toggleSectionDashboard':
                    case 'toggleSectionManageUsers':
                    case 'toggleSectionManageContent':
                    case 'toggleSectionManageComments':
                    case 'toggleSectionManageFeedback':
                    case 'toggleSectionCreateGallery':
                    case 'toggleSectionGeneralSettings':
                    case 'toggleSectionManageProfanity':
                    case 'toggleSectionGalleryStats':
                    case 'toggleSectionManageLogs':
                    case 'toggleSectionBackup':
                        const sectionName = action.substring("toggleSection".length);
                        const targetSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                        const parentMenu = actionTarget.closest('[data-menu]');
                        let targetView = parentMenu ? parentMenu.dataset.menu : appState.currentAppView;
                        if (action === 'toggleSectionLogin' || action === 'toggleSectionForgotPassword') {
                            targetView = 'auth';
                        }
                        if (action === 'toggleSectionGeneralSettings' || action === 'toggleSectionManageProfanity' || action === 'toggleSectionManageLogs' || action === 'toggleSectionBackup') {
                            targetView = 'admin';
                        }
                        if (appState.currentAppView === targetView && appState.currentAppSection === targetSection) return;
                        navigateToUrl(targetView, targetSection);
                        handleStateChange(targetView, targetSection, true, null, appState);
                        break;
                    case 'load-more-users':
                        const homeSearch = document.querySelector('.search-input-text input');
                        fetchAndDisplayGalleries(appState.currentSortBy, homeSearch ? homeSearch.value.trim() : '', true, appState.paginationState.galleries);
                        break;
                    case 'load-more-photos':
                        if (appState.currentGalleryForPhotoView && appState.currentGalleryNameForPhotoView) {
                            fetchAndDisplayGalleryPhotos(appState.currentGalleryForPhotoView, appState.currentGalleryNameForPhotoView, true, appState.paginationState.photos);
                        }
                        break;
                    case 'load-more-admin-users':
                        const adminSearch = document.querySelector('#admin-user-search');
                        fetchAndDisplayUsers(adminSearch ? adminSearch.value.trim() : '', true, appState.paginationState.adminUsers);
                        break;
                    case 'load-more-admin-galleries':
                        const adminGallerySearch = document.querySelector('#admin-gallery-search');
                        fetchAndDisplayGalleriesAdmin(adminGallerySearch ? adminGallerySearch.value.trim() : '', true, appState.paginationState.adminGalleries);
                        break;
                    case 'load-more-admin-comments':
                        const adminCommentSearch = document.querySelector('#admin-comment-search');
                        const adminCommentFilter = document.querySelector('#comments-filter-select .menu-link.active')?.dataset.value || 'all';
                        fetchAndDisplayAdminComments(adminCommentSearch ? adminCommentSearch.value.trim() : '', adminCommentFilter, true, appState.paginationState.adminComments);
                        break;
                    case 'load-more-admin-feedback':
                        const adminFeedbackSearch = document.querySelector('#admin-feedback-search');
                        fetchAndDisplayFeedback(adminFeedbackSearch ? adminFeedbackSearch.value.trim() : '', true, appState.paginationState.adminFeedback);
                        break;
                    case 'load-more-history-profiles':
                        appState.paginationState.historyProfiles.shown += appState.HISTORY_PROFILES_BATCH;
                        displayHistory(appState.paginationState.historyProfiles.shown, appState.paginationState.historyPhotos.shown, appState.paginationState.historySearches.shown);
                        break;
                    case 'load-more-history-photos':
                        appState.paginationState.historyPhotos.shown += appState.HISTORY_PHOTOS_BATCH;
                        displayHistory(appState.paginationState.historyProfiles.shown, appState.paginationState.historyPhotos.shown, appState.paginationState.historySearches.shown);
                        break;
                    case 'load-more-history-searches':
                        appState.paginationState.historySearches.shown += appState.HISTORY_SEARCHES_BATCH;
                        displayHistory(appState.paginationState.historyProfiles.shown, appState.paginationState.historyPhotos.shown, appState.paginationState.historySearches.shown);
                        break;
                    case 'returnToPreviousView':
                        if (appState.lastVisitedView && appState.lastVisitedSection) {
                            navigateToUrl(appState.lastVisitedView, appState.lastVisitedSection, appState.lastVisitedData);
                            handleStateChange(appState.lastVisitedView, appState.lastVisitedSection, true, appState.lastVisitedData, appState);
                        } else {
                            // Fallback por si no hay historial
                            navigateToUrl('main', 'home');
                            handleStateChange('main', 'home', true, null, appState);
                        }
                        break;
                    case 'returnToHome':
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home', true, null, appState);
                        break;
                    case 'returnToFavorites':
                        navigateToUrl('main', 'favorites');
                        handleStateChange('main', 'favorites', true, null, appState);
                        break;
                    case 'toggle-favorite':
                        if (appState.currentPhotoData) toggleFavorite(appState.currentPhotoData);
                        break;
                    case 'toggle-photo-comments':
                        if (appState.currentPhotoData) {
                            const { gallery_uuid, id } = appState.currentPhotoData;
                            navigateToUrl('main', 'photoComments', { uuid: gallery_uuid, photoId: id });
                            handleStateChange('main', 'photoComments', true, { uuid: gallery_uuid, photoId: id }, appState);
                        }
                        break;
                    case 'toggle-favorite-card':
                        const photoIdFav = actionTarget.dataset.photoId;
                        const allPhotos = [...appState.currentFavoritesList, ...appState.paginationState.photos.photoList, ...appState.currentTrendingPhotosList, ...appState.currentHistoryPhotosList];
                        const photoDataFav = allPhotos.find(p => p.id == photoIdFav);

                        if (photoDataFav) {
                            const fullPhotoData = {
                                id: photoDataFav.id,
                                gallery_uuid: photoDataFav.gallery_uuid || appState.currentGalleryForPhotoView,
                                photo_url: photoDataFav.photo_url,
                                gallery_name: photoDataFav.gallery_name || appState.currentGalleryNameForPhotoView,
                                profile_picture_url: photoDataFav.profile_picture_url
                            };
                            await toggleFavorite(fullPhotoData);
                            const activeSection = document.querySelector('.general-content-scrolleable > div')?.dataset.section;

                            if (activeSection === 'userSpecificFavorites') {
                                handleStateChange('main', 'userSpecificFavorites', true, { uuid: document.querySelector('[data-section="userSpecificFavorites"]').dataset.uuid }, appState);
                            } else if (activeSection === 'favorites') {
                                const session = await api.checkSession();
                                if (session.ok && session.data.loggedin) {
                                    await fetchUserFavorites();

                                    const searchInput = document.getElementById('favorites-search-input');
                                    let searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
                                    let favoritesToDisplay = appState.currentFavoritesList;

                                    if (searchTerm) {
                                        favoritesToDisplay = favoritesToDisplay.filter(photo =>
                                            photo.gallery_name.toLowerCase().includes(searchTerm)
                                        );
                                    }
                                    displayFavoritePhotos(favoritesToDisplay, appState.currentFavoritesSortBy, true);
                                }
                            }
                        }
                        break;
                    case 'toggle-comment-length':
                        const commentTextElement = actionTarget.previousElementSibling;
                        const isExpanded = commentTextElement.classList.toggle('expanded');

                        if (isExpanded) {
                            commentTextElement.textContent = commentTextElement.dataset.fullText;
                            actionTarget.textContent = window.getTranslation('photoView.comments.showLess');
                        } else {
                            commentTextElement.textContent = commentTextElement.dataset.fullText.substring(0, 250) + '...';
                            actionTarget.textContent = window.getTranslation('photoView.comments.showMore');
                        }
                        break;
                    case 'previous-photo':
                    case 'next-photo':
                        if (!actionTarget.classList.contains('disabled-nav')) {
                            const listToUse = appState.currentPhotoViewList;
                            const currentId = appState.currentPhotoData ? appState.currentPhotoData.id : null;
                            if (!currentId || listToUse.length === 0) return;

                            const currentIndex = listToUse.findIndex(p => p.id == currentId);
                            if (currentIndex !== -1) {
                                let nextIndex = (action === 'next-photo') ? currentIndex + 1 : currentIndex - 1;
                                if (nextIndex >= 0 && nextIndex < listToUse.length) {
                                    const nextPhoto = listToUse[nextIndex];

                                    const showAdFlag = await shouldShowAd();
                                    const adSetting = appState.serverSettings.ad_probability;
                                    const usesCooldown = adSetting.includes('_cooldown');

                                    if (showAdFlag) {
                                        appState.adContext = 'navigation';
                                        appState.photoAfterAd = { view: 'main', section: 'photoView', data: { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id } };
                                        handleStateChange('main', 'adView', true, null, appState);
                                        if (usesCooldown) {
                                            appState.adCooldownActive = true;
                                        }
                                    } else {
                                        appState.adCooldownActive = false;

                                        const url = generateUrl('main', 'photoView', { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id });
                                        history.pushState({ view: 'main', section: 'photoView', data: { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id } }, document.title, url);

                                        appState.currentPhotoData = await renderPhotoView(nextPhoto.gallery_uuid, nextPhoto.id, listToUse);
                                        if (appState.currentPhotoData) {
                                            window.addToHistory('photo', appState.currentPhotoData);
                                        }
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
                        handleStateChange('main', 'adView', true, null, appState);
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
                        if (appState.currentPhotoData && appState.currentPhotoData.photo_url) {
                            downloadPhoto(appState.currentPhotoData.photo_url);
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
                    case 'toggle-comment-actions': {
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
                    case 'show-status-menu': {
                        const menuContainer = actionTarget.closest('.module-select');
                        menuContainer.querySelector('[data-menu-type="main-actions"]').style.display = 'none';
                        menuContainer.querySelector('[data-menu-type="status-actions"]').style.display = 'block';
                        break;
                    }
                    case 'hide-status-menu': {
                        const menuContainer = actionTarget.closest('.module-select');
                        menuContainer.querySelector('[data-menu-type="main-actions"]').style.display = 'block';
                        menuContainer.querySelector('[data-menu-type="role-actions"]').style.display = 'none';
                        break;
                    }
                    case 'change-status': {
                        const userUuid = actionTarget.dataset.uuid;
                        const newStatus = actionTarget.dataset.status;
                        const menuContainer = actionTarget.closest('.module-select');

                        if (menuContainer) {
                            menuContainer.classList.add('disabled');
                        }

                        api.changeUserStatus(userUuid, newStatus).then(response => {
                            if (response.ok) {
                                showNotification('Estado de usuario actualizado', 'success');
                                const adminSearch = document.querySelector('#admin-user-search');
                                fetchAndDisplayUsers(adminSearch ? adminSearch.value.trim() : '', false, appState.paginationState.adminUsers);
                            } else {
                                showNotification('Error al cambiar el estado', 'error');
                            }
                        });
                        break;
                    }
                    case 'set-comment-status': {
                        const commentId = actionTarget.dataset.id;
                        const status = actionTarget.dataset.status;
                        const response = await api.updateCommentStatus(commentId, status);
                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            const adminCommentSearch = document.querySelector('#admin-comment-search');
                            const adminCommentFilter = document.querySelector('#comments-filter-select .menu-link.active')?.dataset.value || 'all';
                            fetchAndDisplayAdminComments(adminCommentSearch ? adminCommentSearch.value.trim() : '', adminCommentFilter, false, appState.paginationState.adminComments);
                        } else {
                            showNotification(response.data.message || 'Error al actualizar el estado.', 'error');
                        }
                        break;
                    }
                    case 'review-reports': {
                        const commentId = actionTarget.dataset.id;
                        const response = await api.updateReportStatus(commentId, 'reviewed');
                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            const adminCommentSearch = document.querySelector('#admin-comment-search');
                            const adminCommentFilter = document.querySelector('#comments-filter-select .menu-link.active')?.dataset.value || 'all';
                            fetchAndDisplayAdminComments(adminCommentSearch ? adminCommentSearch.value.trim() : '', adminCommentFilter, false, appState.paginationState.adminComments);
                        } else {
                            showNotification(response.data.message || 'Error al actualizar los reportes.', 'error');
                        }
                        break;
                    }
                    case 'view-gallery-photos-admin': {
                        const uuid = actionTarget.dataset.uuid;
                        const name = actionTarget.dataset.name;
                        navigateToUrl('main', 'galleryPhotos', { uuid });
                        handleStateChange('main', 'galleryPhotos', true, { uuid, galleryName: name }, appState);
                        break;
                    }
                    case 'edit-gallery': {
                        const uuid = actionTarget.dataset.uuid;
                        navigateToUrl('admin', 'editGallery', { uuid });
                        handleStateChange('admin', 'editGallery', true, { uuid }, appState);
                        break;
                    }
                    case 'delete-gallery-photo': {
                        const photoItem = actionTarget.closest('.photo-item-edit');
                        const photoId = actionTarget.dataset.photoId;
                        const currentSection = document.querySelector('[data-section="manageGalleryPhotos"]');
                        const isNewGalleryMode = currentSection && currentSection.dataset.mode === 'new';

                        if (isNewGalleryMode) {
                            const fileName = photoItem.dataset.fileName;
                            appState.newGalleryState.pendingPhotos = appState.newGalleryState.pendingPhotos.filter(
                                file => file.name !== fileName
                            );
                            photoItem.remove();
                            showNotification('Foto pendiente eliminada.', 'success');
                            updatePhotoGridVisibility();
                        } else {
                            api.deleteGalleryPhoto(photoId).then(response => {
                                if (response.ok) {
                                    showNotification(response.data.message, 'success');
                                    photoItem.remove();
                                    updatePhotoGridVisibility();
                                } else {
                                    showNotification(response.data.message || 'Error al eliminar la foto', 'error');
                                }
                            });
                        }
                        break;
                    }
                    case 'save-username': {
                        const button = actionTarget.closest('button');
                        const input = document.getElementById('username-edit-input');
                        const newUsername = input.value.trim();

                        button.classList.add('loading');
                        const formData = new FormData();
                        formData.append('action_type', 'update_username');
                        formData.append('username', newUsername);
                        const tokenResponse = await api.getCsrfToken();
                        if (tokenResponse.ok) {
                            formData.append('csrf_token', tokenResponse.data.csrf_token);
                        }

                        const response = await api.updateUsername(formData);
                        button.classList.remove('loading');

                        if (response.ok) {
                            if (!response.data.no_change) {
                                showNotification(window.getTranslation('notifications.usernameUpdated'), 'success');
                            }
                            document.getElementById('username-display').textContent = newUsername;
                            document.getElementById('username-edit-mode').style.display = 'none';
                            document.getElementById('username-view-mode').style.display = 'flex';
                            await window.auth.checkSessionStatus();
                        } else {
                            let message = response.data.message;
                            if (message === 'username_taken') {
                                message = window.getTranslation('notifications.usernameTaken');
                            }
                            document.getElementById('username-error-list').innerHTML = `<li>${message}</li>`;
                            document.getElementById('username-error-container').style.display = 'block';
                        }
                        break;
                    }
                    case 'save-email': {
                        const button = actionTarget.closest('button');
                        const input = document.getElementById('email-edit-input');
                        const newEmail = input.value.trim();

                        button.classList.add('loading');
                        const formData = new FormData();
                        formData.append('action_type', 'update_email');
                        formData.append('email', newEmail);
                        const tokenResponse = await api.getCsrfToken();
                        if (tokenResponse.ok) {
                            formData.append('csrf_token', tokenResponse.data.csrf_token);
                        }

                        const response = await api.updateEmail(formData);
                        button.classList.remove('loading');

                        if (response.ok) {
                            if (!response.data.no_change) {
                                showNotification(window.getTranslation('notifications.emailUpdated'), 'success');
                            }
                            document.getElementById('email-display').textContent = newEmail;
                            document.getElementById('email-edit-mode').style.display = 'none';
                            document.getElementById('email-view-mode').style.display = 'flex';
                            await window.auth.checkSessionStatus();
                        } else {
                            let message = response.data.message;
                            if (message === 'email_taken') {
                                message = window.getTranslation('notifications.emailTaken');
                            }
                            document.getElementById('email-error-list').innerHTML = `<li>${message}</li>`;
                            document.getElementById('email-error-container').style.display = 'block';
                        }
                        break;
                    }

                    case 'manage-gallery-photos': {
                        const uuid = actionTarget.dataset.uuid;
                        if (uuid) {
                            navigateToUrl('admin', 'manageGalleryPhotos', { uuid });
                            handleStateChange('admin', 'manageGalleryPhotos', true, { uuid }, appState);
                        }
                        break;
                    }
                    case 'manage-new-gallery-photos': {
                        const nameInput = document.getElementById('gallery-name-create');
                        if (nameInput) appState.newGalleryState.name = nameInput.value;
                        const privacyToggle = document.getElementById('gallery-privacy-create');
                        if (privacyToggle) appState.newGalleryState.privacy = privacyToggle.classList.contains('active');

                        navigateToUrl('admin', 'manageGalleryPhotos', { mode: 'new' });
                        handleStateChange('admin', 'manageGalleryPhotos', true, { mode: 'new' }, appState);
                        break;
                    }
                    case 'return-to-create-gallery': {
                        navigateToUrl('admin', 'createGallery');
                        handleStateChange('admin', 'createGallery', true, null, appState);
                        break;
                    }
                    case 'save-pending-photos': {
                        navigateToUrl('admin', 'createGallery');
                        handleStateChange('admin', 'createGallery', true, null, appState);
                        break;
                    }
                    case 'create-gallery-submit': {
                        const button = actionTarget;
                        const name = appState.newGalleryState.name;

                        if (!name) {
                            showNotification('El nombre de la galería es obligatorio.', 'error');
                            return;
                        }

                        button.classList.add('loading');

                        const formData = new FormData();
                        formData.append('action_type', 'create_gallery');
                        formData.append('name', name);

                        const privacyToggle = document.getElementById('gallery-privacy-create');
                        appState.newGalleryState.privacy = privacyToggle ? privacyToggle.classList.contains('active') : false;
                        formData.append('privacy', appState.newGalleryState.privacy ? '1' : '0');

                        const visibilityToggle = document.getElementById('gallery-visibility-create');
                        appState.newGalleryState.visibility = visibilityToggle ? visibilityToggle.classList.contains('active') : true;
                        formData.append('visibility', appState.newGalleryState.visibility ? 'visible' : 'hidden');

                        const socialInputs = document.querySelectorAll('#social-links-container-create .social-link-input');
                        const socials = Array.from(socialInputs).map(input => {
                            const platform = input.dataset.platform || input.previousElementSibling.value.trim().toLowerCase();
                            return {
                                platform: platform,
                                url: input.value.trim()
                            }
                        }).filter(s => s.url && s.platform);
                        formData.append('socials', JSON.stringify(socials));

                        if (appState.newGalleryState.profilePictureFile) {
                            formData.append('profile_picture', appState.newGalleryState.profilePictureFile);
                        }

                        if (appState.newGalleryState.pendingPhotos.length > 0) {
                            appState.newGalleryState.pendingPhotos.forEach(file => {
                                formData.append('photos[]', file, file.name);
                            });
                            const photoOrder = appState.newGalleryState.pendingPhotos.map(file => file.name);
                            photoOrder.forEach(name => {
                                formData.append('photo_order[]', name);
                            });
                        }

                        const response = await api.createGallery(formData);
                        button.classList.remove('loading');

                        if (response.ok) {
                            showNotification(response.data.message, 'success');
                            appState.newGalleryState = { name: '', privacy: false, visibility: true, profilePictureFile: null, pendingPhotos: [] };
                            navigateToUrl('admin', 'manageContent');
                            handleStateChange('admin', 'manageContent', true, null, appState);
                        } else {
                            showNotification(response.data.message || 'Error al crear la galería.', 'error');
                        }
                        break;
                    }
                    case 'add-gallery-photos': {
                        const addPhotosInput = document.getElementById('add-photos-input');
                        if (addPhotosInput) {
                            addPhotosInput.click();
                        }
                        break;
                    }
                    case 'save-gallery-photo-changes': {
                        const button = actionTarget;
                        button.classList.add('loading');

                        const photosGridEl = document.getElementById('manage-photos-grid');
                        const videosGridEl = document.getElementById('manage-videos-grid');
                        const currentSection = document.querySelector('[data-section="manageGalleryPhotos"]');
                        const galleryUuid = currentSection ? currentSection.dataset.uuid : null;

                        if (!galleryUuid) {
                            showNotification('Error: No se pudo identificar la galería.', 'error');
                            button.classList.remove('loading');
                            return;
                        }

                        if (window.pendingGalleryFiles && window.pendingGalleryFiles.length > 0) {
                            const uploadFormData = new FormData();
                            uploadFormData.append('action_type', 'upload_gallery_photos');
                            uploadFormData.append('uuid', galleryUuid);
                            window.pendingGalleryFiles.forEach(file => {
                                uploadFormData.append('photos[]', file);
                            });

                            const uploadResponse = await api.uploadGalleryPhotos(uploadFormData);

                            if (!uploadResponse.ok) {
                                showNotification(uploadResponse.data.message || 'Error al subir los nuevos archivos.', 'error');
                                button.classList.remove('loading');
                                return;
                            }

                            window.pendingGalleryFiles = [];
                            showNotification(uploadResponse.data.message, 'success');
                            await handleStateChange('admin', 'manageGalleryPhotos', false, { uuid: galleryUuid }, appState);
                            button.classList.remove('loading');
                            return;
                        }

                        const photoOrder = Array.from(photosGridEl.children).map(item => item.dataset.id).filter(id => id);
                        const videoOrder = Array.from(videosGridEl.children).map(item => item.dataset.id).filter(id => id);

                        const orderFormData = new FormData();
                        orderFormData.append('action_type', 'update_photo_order');
                        orderFormData.append('photo_order', JSON.stringify(photoOrder));
                        orderFormData.append('video_order', JSON.stringify(videoOrder));

                        const orderResponse = await api.postDataWithCsrf(orderFormData);

                        if (orderResponse.ok) {
                            showNotification(orderResponse.data.message, 'success');
                        } else {
                            showNotification(orderResponse.data.message || 'Error al guardar el orden del contenido.', 'error');
                        }

                        button.classList.remove('loading');
                        break;
                    }
                    case 'delete-gallery':
                        {
                            const pathParts = window.location.pathname.split('/');
                            const uuid = pathParts[pathParts.length - 1];
                            const galleryName = document.getElementById('gallery-name-display').textContent;
                            showDeleteGalleryDialog(uuid, galleryName);
                        }
                        break;
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
                    if (value !== appState.currentSortBy) {
                        appState.currentSortBy = value;
                        const homeSearch = document.querySelector('.search-input-text input');
                        fetchAndDisplayGalleries(appState.currentSortBy, homeSearch ? homeSearch.value.trim() : '', false, appState.paginationState.galleries);
                        updateSelectActiveState('relevance-select', appState.currentSortBy);
                    }
                }
                else if (selectId.includes('favorites-sort-select')) {
                    if (value !== appState.currentFavoritesSortBy) {
                        appState.currentFavoritesSortBy = value;
                        let favorites = appState.currentFavoritesList;
                        const searchInput = document.getElementById('favorites-search-input');
                        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

                        if (searchTerm) {
                            favorites = favorites.filter(photo =>
                                photo.gallery_name.toLowerCase().includes(searchTerm)
                            );
                        }

                        if (value === 'newest') {
                            favorites.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
                        } else if (value === 'oldest') {
                            favorites.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
                        }

                        displayFavoritePhotos(favorites, appState.currentFavoritesSortBy, true);
                        updateSelectActiveState('favorites-sort-select', appState.currentFavoritesSortBy);
                    }
                }
                else if (selectId.includes('comments-filter-select')) {
                    const adminCommentSearch = document.querySelector('#admin-comment-search');
                    fetchAndDisplayAdminComments(adminCommentSearch ? adminCommentSearch.value.trim() : '', value, false, appState.paginationState.adminComments);
                    updateSelectActiveState('comments-filter-select', value);
                }
                else if (selectId === 'theme-select') {
                    setTheme(value);
                }
                else if (selectId === 'language-select') {
                    setLanguage(value, sessionData?.user?.role || 'user');
                } else if (selectId.includes('history-select')) {
                    appState.paginationState.historyProfiles.shown = appState.HISTORY_PROFILES_BATCH;
                    appState.paginationState.historyPhotos.shown = appState.HISTORY_PHOTOS_BATCH;
                    appState.paginationState.historySearches.shown = appState.HISTORY_SEARCHES_BATCH;
                    document.querySelectorAll('[data-history-view]').forEach(view => {
                        view.style.display = view.dataset.historyView === value ? '' : 'none';
                    });
                    updateSelectActiveState('history-select', value);
                    displayHistory(appState.paginationState.historyProfiles.shown, appState.paginationState.historyPhotos.shown, appState.paginationState.historySearches.shown);
                } else if (selectId === 'feedback-issue-type-select') {
                    updateSelectActiveState('feedback-issue-type-select', value);
                    const otherTitleGroup = document.getElementById('feedback-other-title-group');
                    if (otherTitleGroup) {
                        otherTitleGroup.classList.toggle('disabled', value !== 'other');
                    }
                }
                else if (selectId === 'profanity-language-select') {
                    updateSelectActiveState('profanity-language-select', value);
                } else if (selectId === 'profanity-filter-select') {
                    fetchAndDisplayProfanityWords(value);
                    updateSelectActiveState('profanity-filter-select', value);
                }
                else if (selectId === 'unlock-duration-select' || selectId === 'ad-probability-select') {
                    const triggerText = selectedOption.closest('.select-wrapper').querySelector('.select-trigger-text');
                    const selectedText = selectedOption.querySelector('.menu-link-text span').textContent;
                    triggerText.textContent = selectedText;

                    selectContainer.querySelectorAll('.menu-link').forEach(link => link.classList.remove('active'));
                    selectedOption.classList.add('active');
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
                    handleStateChange('main', 'userSpecificFavorites', true, { uuid: uuid }, appState);
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
                        handleStateChange('main', 'privateGalleryProxy', true, { uuid: uuid, galleryName: name }, appState);
                    } else {
                        const showAdFlag = await shouldShowAd();
                        const adSetting = appState.serverSettings.ad_probability;
                        const usesCooldown = adSetting.includes('_cooldown');

                        if (showAdFlag) {
                            appState.adContext = 'navigation';
                            appState.galleryAfterAd = { view: 'main', section: 'galleryPhotos', data: { uuid: uuid, galleryName: name } };
                            handleStateChange('main', 'adView', true, null, appState);
                            if (usesCooldown) {
                                appState.adCooldownActive = true;
                            }
                        } else {
                            appState.adCooldownActive = false;
                            navigateToUrl('main', 'galleryPhotos', { uuid: uuid });
                            handleStateChange('main', 'galleryPhotos', true, { uuid: uuid, galleryName: name }, appState);
                        }
                    }
                    return;
                }

                const photoCard = event.target.closest('.card.photo-card, .card.video-card');
                if (photoCard) {
                    const galleryUuid = photoCard.dataset.galleryUuid || appState.currentGalleryForPhotoView;
                    const photoId = photoCard.dataset.photoId;

                    const showAdFlag = await shouldShowAd();
                    const adSetting = appState.serverSettings.ad_probability;
                    const usesCooldown = adSetting.includes('_cooldown');

                    if (showAdFlag) {
                        appState.adContext = 'navigation';
                        appState.photoAfterAd = { view: 'main', section: 'photoView', data: { uuid: galleryUuid, photoId: photoId } };
                        handleStateChange('main', 'adView', true, null, appState);
                        if (usesCooldown) {
                            appState.adCooldownActive = true;
                        }
                    } else {
                        appState.adCooldownActive = false;
                        navigateToUrl('main', 'photoView', { uuid: galleryUuid, photoId: photoId });
                        handleStateChange('main', 'photoView', true, { uuid: galleryUuid, photoId: photoId }, appState);
                    }
                    return;
                }
            }

        });

        document.addEventListener('keydown', function (event) {
            const input = event.target;

            if (event.key === 'Escape' && appState.currentAppSection === 'manageContent') {
                deselectGallery();
            }

            if (event.key === 'Escape' && appState.currentAppSection === 'manageUsers') {
                deselectUser();
            }
            if (event.key === 'Escape' && appState.currentAppSection === 'history') {
                deselectAllHistoryItems();
            }
            if (event.key === 'Enter' && input.tagName.toLowerCase() === 'input' && input.closest('.search-input-wrapper')) {
                event.preventDefault();

                let searchTerm = input.value.trim();
                if (searchTerm.length > 64) {
                    searchTerm = searchTerm.substring(0, 64);
                }
                const section = input.closest('.section-content')?.dataset.section;

                if (section === 'home') {
                    fetchAndDisplayGalleries(appState.currentSortBy, searchTerm, false, appState.paginationState.galleries);
                } else if (section === 'trends') {
                    fetchAndDisplayTrends(searchTerm).then(photos => appState.currentTrendingPhotosList = photos);
                } else if (section === 'favorites') {
                    let favorites = appState.currentFavoritesList;
                    if (searchTerm) {
                        favorites = favorites.filter(photo =>
                            photo.gallery_name.toLowerCase().includes(searchTerm)
                        );
                    }
                    displayFavoritePhotos(favorites, appState.currentFavoritesSortBy, true);
                } else if (section === 'manageUsers') {
                    fetchAndDisplayUsers(searchTerm, false, appState.paginationState.adminUsers);
                } else if (section === 'manageContent') {
                    fetchAndDisplayGalleriesAdmin(searchTerm, false, appState.paginationState.adminGalleries);
                } else if (section === 'manageComments') {
                    const adminCommentFilter = document.querySelector('#comments-filter-select .menu-link.active')?.dataset.value || 'all';
                    fetchAndDisplayAdminComments(searchTerm, adminCommentFilter, false, appState.paginationState.adminComments);
                } else if (section === 'manageFeedback') {
                    fetchAndDisplayFeedback(searchTerm, false, appState.paginationState.adminFeedback);
                }
            }

            const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
            if (event.key === 'Escape' && moduleSurface && !moduleSurface.classList.contains('disabled')) {
                moduleSurface.classList.add('disabled');
            }
        });

        window.addEventListener('authSuccess', () => {
            fetchUserFavorites();
            api.getHistory().then(history => {
                console.log("Historial cargado tras login:", history);
            });
        });
    }

    function setupScrollShadows() {
        appState.activeScrollHandlers.forEach(({ element, listener }) => {
            element.removeEventListener('scroll', listener);
        });
        appState.activeScrollHandlers = [];

        const mainScrolleable = document.querySelector('.general-content-scrolleable');
        const mainHeader = document.querySelector('.general-content-top');

        if (mainScrolleable && mainHeader) {
            const mainListener = () => {
                mainHeader.classList.toggle('shadow', mainScrolleable.scrollTop > 0);
            };
            mainScrolleable.addEventListener('scroll', mainListener);
            appState.activeScrollHandlers.push({ element: mainScrolleable, listener: mainListener });
            mainListener();
        }

        const sectionScrolleable = document.querySelector('.section-content-block.overflow-y');
        const sectionHeader = document.querySelector('.section-content-header');

        if (sectionScrolleable && sectionHeader) {
            const sectionListener = () => {
                sectionHeader.classList.toggle('shadow', sectionScrolleable.scrollTop > 0);
            };
            sectionScrolleable.addEventListener('scroll', sectionListener);
            appState.activeScrollHandlers.push({ element: sectionScrolleable, listener: sectionListener });
            sectionListener();
        }
    }

    setupEventListeners();
    startUnlockCountdownTimer();

    window.addEventListener('navigateTo', (e) => {
        const { view, section, data } = e.detail;
        navigateToUrl(view, section, data);
        handleStateChange(view, section, true, data, appState);
    });

    window.addEventListener('authChange', (e) => {
        if (e.detail.isLoggedIn) {
            fetchUserFavorites();
        } else {
            appState.currentFavoritesList = [];
            appState.userFavoriteIds.clear();
        }
    });

    setupPopStateHandler((view, section, pushState, data) => {
        handleStateChange(view, section, pushState, data, appState);
    });

    const path = window.location.pathname.replace(window.BASE_PATH || '', '').slice(1);

    // --- INICIO DE LA CORRECCIÓN ---
    // Se elimina el objeto `routes` y se deja solo la lógica de `preg_match`
    // que ya estaba presente para manejar las rutas dinámicas.
    
    let initialRoute = null;
    let initialStateData = null;

    // Se mantiene la lógica de coincidencias para determinar la ruta inicial
    const staticRoutes = {
        '': { view: 'main', section: 'home' },
        'trends': { view: 'main', section: 'trends' },
        'favorites': { view: 'main', section: 'favorites' },
        'settings/your-profile': { view: 'settings', section: 'yourProfile' },
        'settings/accessibility': { view: 'settings', section: 'accessibility' },
        'settings/login-security': { view: 'settings', section: 'loginSecurity' },
        'settings/history-privacy': { view: 'settings', section: 'historyPrivacy' },
        'settings/history': { view: 'settings', section: 'history' },
        'help/privacy-policy': { view: 'help', section: 'privacyPolicy' },
        'help/terms-conditions': { view: 'help', section: 'termsConditions' },
        'help/cookie-policy': { view: 'help', section: 'cookiePolicy' },
        'help/send-feedback': { view: 'help', section: 'sendFeedback' },
        'login': { view: 'auth', section: 'login' },
        'register': { view: 'auth', section: 'register', 'data': { step: 'user-info' } },
        'register/password': { view: 'auth', section: 'register', 'data': { step: 'password' } },
        'register/verify-code': { view: 'auth', section: 'register', 'data': { step: 'verify-code' } },
        'forgot-password': { view: 'auth', section: 'forgotPassword', 'data': { step: 'enter-email' } },
        'forgot-password/enter-code': { view: 'auth', section: 'forgotPassword', 'data': { step: 'enter-code' } },
        'forgot-password/new-password': { view: 'auth', section: 'forgotPassword', 'data': { step: 'new-password' } },
        'admin/dashboard': { view: 'admin', section: 'dashboard' },
        'admin/users': { view: 'admin', section: 'manageUsers' },
        'admin/content': { view: 'admin', section: 'manageContent' },
        'admin/create-gallery': { view: 'admin', section: 'createGallery' },
        'admin/comments': { view: 'admin', section: 'manageComments' },
        'admin/feedback': { view: 'admin', section: 'manageFeedback' },
        'admin/site-settings': { view: 'admin', section: 'generalSettings' },
        'admin/backup': { view: 'admin', section: 'backup' },
        'admin/logs': { view: 'admin', section: 'manageLogs' },
        'admin/profanity-filter': { view: 'admin', section: 'manageProfanity'},
        'admin/verify-founder': { view: 'admin', section: 'verifyFounder'}
    };

    if (staticRoutes[path]) {
        initialRoute = staticRoutes[path];
        initialStateData = initialRoute.data || null;
    }
    // --- FIN DE LA CORRECCIÓN ---

    const privateGalleryMatch = path.match(/^gallery\/private\/([a-f0-9-]{36})$/);
    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);
    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const userFavoritesMatch = path.match(/^favorites\/([a-f0-9-]{36})$/);
    const editGalleryMatch = path.match(/^admin\/edit-gallery\/([a-f0-9-]{36})$/);
    const commentsMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)\/comments$/);
    const userProfileMatch = path.match(/^admin\/user\/([a-f0-9-]{36})$/);
    const managePhotosMatch = path.match(/^admin\/edit-gallery\/([a-f0-9-]{36})\/photos$/);
    const galleryStatsMatch = path.match(/^admin\/gallery\/([a-f0-9-]{36})\/stats$/);
    const viewLogMatch = path.match(/^admin\/logs\/view\/(.+)$/);


    if (userProfileMatch) {
        initialRoute = { view: 'admin', section: 'userProfile' };
        initialStateData = { uuid: userProfileMatch[1] };
    } else if (commentsMatch) {
        initialRoute = { view: 'main', section: 'photoComments' };
        initialStateData = { uuid: commentsMatch[1], photoId: commentsMatch[2] };
    } else if (privateGalleryMatch) {
        initialRoute = { view: 'main', section: 'privateGalleryProxy' };
        initialStateData = { uuid: privateGalleryMatch[1] };
    } else if (photoMatch) {
        initialRoute = { view: 'main', section: 'photoView' };
        initialStateData = { uuid: photoMatch[1], photoId: photoMatch[2] };
    } else if (managePhotosMatch) {
        initialRoute = { view: 'admin', section: 'manageGalleryPhotos' };
        initialStateData = { uuid: managePhotosMatch[1] };
    } else if (editGalleryMatch) {
        initialRoute = { view: 'admin', section: 'editGallery' };
        initialStateData = { uuid: editGalleryMatch[1] };
    } else if (galleryStatsMatch) {
        initialRoute = { view: 'admin', section: 'galleryStats' };
        initialStateData = { uuid: galleryStatsMatch[1] };
    } else if (viewLogMatch) {
        initialRoute = { view: 'admin', section: 'viewLog' };
        initialStateData = { filename: viewLogMatch[1] };
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
    handleStateChange(initialRoute.view, initialRoute.section, true, initialStateData, appState);

    window.addToHistory = addToHistory;
    window.updateFavoriteButtonState = updateFavoriteButtonState;
    window.updateFavoriteCardState = updateFavoriteCardState;
    window.fetchUserFavorites = fetchUserFavorites;
    window.saveUserPreferences = saveUserPreferences;
}