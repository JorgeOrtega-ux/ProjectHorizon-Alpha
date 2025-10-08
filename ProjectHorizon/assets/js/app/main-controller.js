// assets/js/app/main-controller.js

import { navigateToUrl, setupPopStateHandler, setInitialHistoryState, generateUrl } from '../core/url-manager.js';
import { setTheme, updateThemeSelectorUI } from '../managers/theme-manager.js';
import { setLanguage, updateLanguageSelectorUI, applyTranslations } from '../managers/language-manager.js';
import { initTooltips } from '../managers/tooltip-manager.js';
import { showNotification } from '../managers/notification-manager.js';
import * as api from '../core/api-handler.js';
import { displayFavoritePhotos, updateCardPrivacyStatus, renderPhotoView } from '../ui/ui-controller.js';
import {
    showCustomConfirm,
    showUpdatePasswordDialog,
    showDeleteAccountDialog,
    showChangeRoleDialog,
    showDeleteGalleryDialog,
    showReportCommentDialog
} from '../managers/dialog-manager.js';
import {
    fetchAndDisplayGalleries,
    fetchAndDisplayGalleryPhotos,
    fetchAndDisplayTrends,
    fetchAndDisplayUsers,
    fetchAndDisplayGalleriesAdmin,
    fetchAndDisplayAdminComments
} from './view-handlers.js';
import { handleStateChange } from './navigation-handler.js';


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


export function initMainController() {
    const appState = {
        currentAppView: null,
        currentAppSection: null,
        currentSortBy: 'relevant',
        currentGalleryForPhotoView: null,
        currentGalleryNameForPhotoView: null,
        currentTrendingPhotosList: [],
        currentHistoryPhotosList: [],
        currentPhotoData: null,
        lastVisitedView: null,
        lastVisitedData: null,
        adCountdownInterval: null,
        photoAfterAd: null,
        galleryAfterAd: null,
        unlockCountdownInterval: null,
        currentPhotoViewList: [],
        currentRotation: 0,
        BATCH_SIZE: 20,
        ADMIN_USERS_BATCH_SIZE: 25,
        ADMIN_GALLERIES_BATCH_SIZE: 25,
        ADMIN_COMMENTS_BATCH_SIZE: 25, // <-- AÑADIDO
        HISTORY_PROFILES_BATCH: 20,
        HISTORY_PHOTOS_BATCH: 20,
        HISTORY_SEARCHES_BATCH: 25,
        paginationState: {
            galleries: { currentPage: 1, isLoading: false, batchSize: 20 },
            photos: { currentPage: 1, isLoading: false, photoList: [], batchSize: 20 },
            adminUsers: { currentPage: 1, isLoading: false, batchSize: 25 },
            adminGalleries: { currentPage: 1, isLoading: false, batchSize: 25 },
            adminComments: { currentPage: 1, isLoading: false, batchSize: 25 }, // <-- AÑADIDO
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

    async function shouldShowAd() {
        const sessionResponse = await api.checkSession();
        if (sessionResponse.ok && sessionResponse.data.loggedin) {
            const userRole = sessionResponse.data.user.role;
            if (userRole === 'moderator' || userRole === 'administrator') {
                return false;
            }
        }
        return true;
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
            if (userRole === 'moderator' || userRole === 'administrator') {
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
        const sixtyMinutes = 60 * 60 * 1000;
        return (now - unlockedGalleries[uuid]) < sixtyMinutes;
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

    function setupEventListeners() {
        document.addEventListener('click', async function (event) {
            const actionTarget = event.target.closest('[data-action]');
            const selectTrigger = event.target.closest('[data-action="toggle-select"]');
            const submitCommentBtn = event.target.closest('#submit-comment-btn');

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
                        // ✅ **INICIO DE LA CORRECCIÓN**
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
                                    <button class="comment-action-btn report-btn" data-action="report-comment">
                                        <span class="material-symbols-rounded">flag</span>
                                    </button>
                                </div>
                            </div>
                        `;
                        // ✅ **FIN DE LA CORRECCIÓN**
                        commentsList.prepend(commentElement);
                        commentInput.value = '';
                    } else {
                        showNotification(response.data.message || 'Error al publicar el comentario.', 'error');
                    }
                }
            }

            if (actionTarget) {
                const action = actionTarget.dataset.action;

                switch(action) {
                    case 'like-comment':
                    case 'dislike-comment': {
                        const commentItem = actionTarget.closest('.comment-item');
                        const commentId = commentItem.dataset.commentId;
                        const isLike = action === 'like-comment';
                        
                        // Determina el nuevo vote_type
                        // Si se hace clic en el mismo botón activo, se anula el voto (vote_type = 0)
                        // Si no, se establece el nuevo voto (1 para like, -1 para dislike)
                        const currentVoteIsActive = actionTarget.classList.contains('active');
                        const voteType = currentVoteIsActive ? 0 : (isLike ? 1 : -1);
            
                        const response = await api.likeComment(commentId, voteType);
            
                        if (response.ok) {
                            // Actualiza los contadores
                            commentItem.querySelector('.like-count').textContent = response.data.likes;
                            commentItem.querySelector('.dislike-count').textContent = response.data.dislikes;
            
                            // Actualiza los estados de los botones
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
                    case 'toggleAdminPanel':
                        if (appState.currentAppView === 'admin' && appState.currentAppSection === 'manageUsers') return;
                        navigateToUrl('admin', 'manageUsers');
                        handleStateChange('admin', 'manageUsers', true, null, appState);
                        break;
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
                    case 'toggleSectionManageUsers':
                    case 'toggleSectionManageContent':
                    case 'toggleSectionManageComments': // <-- AÑADIDO
                    case 'toggleSectionCreateGallery':
                        const sectionName = action.substring("toggleSection".length);
                        const targetSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                        const parentMenu = actionTarget.closest('[data-menu]');
                        let targetView = parentMenu ? parentMenu.dataset.menu : appState.currentAppView;
                        if (action === 'toggleSectionLogin' || action === 'toggleSectionForgotPassword') {
                            targetView = 'auth';
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
                    case 'load-more-admin-comments': // <-- AÑADIDO
                        const adminCommentSearch = document.querySelector('#admin-comment-search');
                        const adminCommentFilter = document.querySelector('#comments-filter-select .menu-link.active')?.dataset.value || 'all';
                        fetchAndDisplayAdminComments(adminCommentSearch ? adminCommentSearch.value.trim() : '', adminCommentFilter, true, appState.paginationState.adminComments);
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
                    case 'returnToUserPhotos':
                        if (appState.lastVisitedView === 'history') {
                            navigateToUrl('settings', 'history');
                            handleStateChange('settings', 'history', true, null, appState);
                        } else if (appState.lastVisitedView === 'favorites') {
                            navigateToUrl('main', 'favorites');
                            handleStateChange('main', 'favorites', true, null, appState);
                        } else if (appState.lastVisitedView === 'userSpecificFavorites' && appState.lastVisitedData && appState.lastVisitedData.uuid) {
                            navigateToUrl('main', 'userSpecificFavorites', { uuid: appState.lastVisitedData.uuid });
                            handleStateChange('main', 'userSpecificFavorites', true, { uuid: appState.lastVisitedData.uuid }, appState);
                        } else if (appState.lastVisitedView === 'trends') {
                            navigateToUrl('main', 'trends');
                            handleStateChange('main', 'trends', true, null, appState);
                        } else if (appState.currentGalleryForPhotoView) {
                            navigateToUrl('main', 'galleryPhotos', { uuid: appState.currentGalleryForPhotoView });
                            handleStateChange('main', 'galleryPhotos', true, { uuid: appState.currentGalleryForPhotoView }, appState);
                        } else {
                            navigateToUrl('main', 'home');
                            handleStateChange('main', 'home', true, null, appState);
                        }
                        break;
                    case 'returnToPhotoView':
                         if (appState.currentPhotoData) {
                            const { gallery_uuid, id } = appState.currentPhotoData;
                            navigateToUrl('main', 'photoView', { uuid: gallery_uuid, photoId: id });
                            handleStateChange('main', 'photoView', true, { uuid: gallery_uuid, photoId: id }, appState);
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
                                    
                                    const showAd = await shouldShowAd();
                                    if (showAd && !appState.adCooldownActive && Math.random() < 0.15) {
                                        appState.adContext = 'navigation';
                                        appState.photoAfterAd = { view: 'main', section: 'photoView', data: { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id } };
                                        handleStateChange('main', 'adView', true, null, appState);
                                        appState.adCooldownActive = true;
                                    } else {
                                        const url = generateUrl('main', 'photoView', { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id });
                                        history.pushState({ view: 'main', section: 'photoView', data: { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id } }, document.title, url);

                                        appState.currentPhotoData = await renderPhotoView(nextPhoto.gallery_uuid, nextPhoto.id, listToUse);
                                        if (appState.currentPhotoData) {
                                            window.addToHistory('photo', appState.currentPhotoData);
                                        }
                                        appState.adCooldownActive = false;
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
                    case 'toggle-comment-actions': { // <-- AÑADIDO
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
                    case 'delete-comment': { // <-- AÑADIDO
                        const commentId = actionTarget.dataset.id;
                        const confirmed = await showCustomConfirm('Eliminar Comentario', '¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.');
                        if (confirmed) {
                            const response = await api.deleteComment(commentId);
                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                                const row = actionTarget.closest('tr');
                                if (row) row.remove();
                            } else {
                                showNotification(response.data.message || 'Error al eliminar el comentario.', 'error');
                            }
                        }
                        break;
                    }
                    case 'review-reports': { // <-- AÑADIDO
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
                    case 'save-gallery-changes':
                        {
                            const pathParts = window.location.pathname.split('/');
                            const uuid = pathParts[pathParts.length - 1];

                            const name = document.getElementById('gallery-name-edit').value.trim();
                            const privacyToggle = document.getElementById('gallery-privacy-edit');
                            const privacy = privacyToggle ? privacyToggle.classList.contains('active') : false;

                            const detailsFormData = new FormData();
                            detailsFormData.append('action_type', 'update_gallery_details');
                            detailsFormData.append('uuid', uuid);
                            detailsFormData.append('name', name);
                            detailsFormData.append('privacy', privacy);

                            api.updateGalleryDetails(detailsFormData).then(response => {
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
                                        profilePicInput.value = '';
                                    }
                                });
                            }

                            const pendingFiles = window.pendingGalleryFiles || [];
                            if (pendingFiles.length > 0) {
                                const newPhotosFormData = new FormData();
                                newPhotosFormData.append('action_type', 'upload_gallery_photos');
                                newPhotosFormData.append('uuid', uuid);
                                for (const file of pendingFiles) {
                                    newPhotosFormData.append('photos[]', file);
                                }
                                api.uploadGalleryPhotos(newPhotosFormData).then(response => {
                                    if (response.ok) {
                                        document.querySelectorAll('.photo-item-edit.pending-upload').forEach(item => {
                                            item.classList.remove('pending-upload');
                                        });
                                        window.pendingGalleryFiles = [];
                                    }
                                });
                            }

                            const photoGrid = document.getElementById('gallery-photos-grid-edit');
                            const photoOrder = Array.from(photoGrid.children).map(item => item.dataset.id).filter(id => id);
                            if (photoOrder.length > 0) {
                                api.updatePhotoOrder(photoOrder).then(response => {
                                    if (response.ok) {
                                        showNotification(response.data.message, 'success');
                                    } else {
                                        showNotification(response.data.message || 'Error al guardar el orden.', 'error');
                                    }
                                });
                            }
                        }
                        break;
                    case 'create-gallery-submit':
                        {
                            const button = actionTarget;
                            const name = document.getElementById('gallery-name-create').value.trim();
                            const privacyToggle = document.getElementById('gallery-privacy-create');
                            const privacy = privacyToggle ? privacyToggle.classList.contains('active') : false;
                            const profilePicInput = document.getElementById('profile-picture-upload-create');
                            const newPhotosInput = document.getElementById('new-photos-upload-create');

                            if (!name) {
                                showNotification('El nombre de la galería es obligatorio.', 'error');
                                return;
                            }

                            button.classList.add('loading');

                            const formData = new FormData();
                            formData.append('action_type', 'create_gallery');
                            formData.append('name', name);
                            formData.append('privacy', privacy);

                            if (profilePicInput.files.length > 0) {
                                formData.append('profile_picture', profilePicInput.files[0]);
                            }

                            if (window.pendingGalleryFiles && window.pendingGalleryFiles.length > 0) {
                                const photoGrid = document.getElementById('gallery-photos-grid-create');
                                const orderedFileNames = Array.from(photoGrid.children).map(item => item.dataset.fileName);

                                const orderedFiles = orderedFileNames.map(name => window.pendingGalleryFiles.find(file => file.name === name));

                                orderedFiles.forEach(file => {
                                    if (file) {
                                        formData.append('photos[]', file, file.name);
                                        formData.append('photo_order[]', file.name);
                                    }
                                });
                            }

                            const response = await api.createGallery(formData);
                            button.classList.remove('loading');

                            if (response.ok) {
                                showNotification(response.data.message, 'success');
                                navigateToUrl('admin', 'manageContent');
                                handleStateChange('admin', 'manageContent', true, null, appState);
                            } else {
                                showNotification(response.data.message || 'Error al crear la galería.', 'error');
                            }
                        }
                        break;
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
                else if (selectId.includes('comments-filter-select')) { // <-- AÑADIDO
                    const adminCommentSearch = document.querySelector('#admin-comment-search');
                    fetchAndDisplayAdminComments(adminCommentSearch ? adminCommentSearch.value.trim() : '', value, false, appState.paginationState.adminComments);
                    updateSelectActiveState('comments-filter-select', value);
                }
                else if (selectId === 'theme-select') {
                    setTheme(value);
                }
                else if (selectId === 'language-select') {
                    setLanguage(value);
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
                        const showAd = await shouldShowAd();
                        if (showAd && !appState.adCooldownActive && Math.random() < 0.10) {
                            appState.adContext = 'navigation';
                            appState.galleryAfterAd = { view: 'main', section: 'galleryPhotos', data: { uuid: uuid, galleryName: name } };
                            handleStateChange('main', 'adView', true, null, appState);
                            appState.adCooldownActive = true;
                        } else {
                            navigateToUrl('main', 'galleryPhotos', { uuid: uuid });
                            handleStateChange('main', 'galleryPhotos', true, { uuid: uuid, galleryName: name }, appState);
                            appState.adCooldownActive = false;
                        }
                    }
                    return;
                }

                const photoCard = event.target.closest('.card.photo-card');
                if (photoCard) {
                    const galleryUuid = photoCard.dataset.galleryUuid || appState.currentGalleryForPhotoView;
                    const photoId = photoCard.dataset.photoId;
                    api.incrementGalleryInteraction(galleryUuid);

                    const showAd = await shouldShowAd();
                    if (showAd && !appState.adCooldownActive && Math.random() < 0.10) {
                        appState.adContext = 'navigation';
                        appState.photoAfterAd = { view: 'main', section: 'photoView', data: { uuid: galleryUuid, photoId: photoId } };
                        handleStateChange('main', 'adView', true, null, appState);
                        appState.adCooldownActive = true;
                    } else {
                        navigateToUrl('main', 'photoView', { uuid: galleryUuid, photoId: photoId });
                        handleStateChange('main', 'photoView', true, { uuid: galleryUuid, photoId: photoId }, appState);
                        appState.adCooldownActive = false;
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
                } else if (section === 'manageComments') { // <-- AÑADIDO
                    const adminCommentFilter = document.querySelector('#comments-filter-select .menu-link.active')?.dataset.value || 'all';
                    fetchAndDisplayAdminComments(searchTerm, adminCommentFilter, false, appState.paginationState.adminComments);
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

    // --- INICIALIZACIÓN ---
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

    const routes = {
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
        'register': { view: 'auth', section: 'register', data: { step: 'user-info' } },
        'register/password': { view: 'auth', section: 'register', data: { step: 'password' } },
        'register/verify-code': { view: 'auth', section: 'register', data: { step: 'verify-code' } },
        'forgot-password': { view: 'auth', section: 'forgotPassword', data: { step: 'enter-email' } },
        'forgot-password/enter-code': { view: 'auth', section: 'forgotPassword', data: { step: 'enter-code' } },
        'forgot-password/new-password': { view: 'auth', section: 'forgotPassword', data: { step: 'new-password' } },
        'admin/users': { view: 'admin', section: 'manageUsers' },
        'admin/content': { view: 'admin', section: 'manageContent' },
        'admin/comments': { view: 'admin', section: 'manageComments' }, // <-- AÑADIDO
        'admin/create-gallery': { view: 'admin', section: 'createGallery' }
    };
    let initialRoute = routes[path] || null;
    let initialStateData = initialRoute ? initialRoute.data : null;

    const privateGalleryMatch = path.match(/^gallery\/private\/([a-f0-9-]{36})$/);
    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);
    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const userFavoritesMatch = path.match(/^favorites\/([a-f0-9-]{36})$/);
    const editGalleryMatch = path.match(/^admin\/edit-gallery\/([a-f0-9-]{36})$/);
    const commentsMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)\/comments$/);

    if (commentsMatch) {
        initialRoute = { view: 'main', section: 'photoComments' };
        initialStateData = { uuid: commentsMatch[1], photoId: commentsMatch[2] };
    } else if (privateGalleryMatch) {
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
    handleStateChange(initialRoute.view, initialRoute.section, true, initialStateData, appState);

    if (initialRoute.section !== 'photoView') {
        appState.lastVisitedView = initialRoute.section;
        appState.lastVisitedData = initialStateData;
    }
    window.addToHistory = addToHistory;
    window.updateFavoriteButtonState = updateFavoriteButtonState;
    window.updateFavoriteCardState = updateFavoriteCardState;
    window.fetchUserFavorites = fetchUserFavorites;
}