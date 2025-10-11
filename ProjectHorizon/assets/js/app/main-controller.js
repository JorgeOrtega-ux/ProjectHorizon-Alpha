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
    showReportCommentDialog,
    showSanctionDialog
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
    fetchAndDisplayUserProfile
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

    const overlay = document.getElementById('age-verification-overlay');
    const confirmBtn = document.getElementById('age-confirm-btn');
    const declineBtn = document.getElementById('age-decline-btn');

    if (overlay && confirmBtn && declineBtn) {
        overlay.classList.remove('disabled');
        
        confirmBtn.addEventListener('click', () => {
            localStorage.setItem('ageVerified', 'true');
            overlay.classList.add('disabled');
        });
        
        // El botón de declinar no hace nada por ahora, como se solicitó.
    }
}

// ✅ **INICIO DE LA CORRECCIÓN: FUNCIÓN MOVIDA Y MEJORADA**
/**
 * Actualiza la visibilidad del grid de fotos y el mensaje de estado (ej. "No hay fotos").
 * Se activa cuando no hay fotos en el contenedor.
 */
function updatePhotoGridVisibility() {
    const grid = document.getElementById('manage-photos-grid');
    if (!grid) return;
    
    // Busca el contenedor de estado relativo al grid actual
    const statusContainer = grid.closest('.edit-gallery-container').querySelector('.status-message-container');
    if (!statusContainer) return;
    
    // Si no hay elementos hijos en el grid (fotos)
    if (grid.children.length === 0) {
        statusContainer.classList.remove('disabled'); // Muestra el mensaje
        grid.classList.add('disabled'); // Oculta el grid
    } else {
        statusContainer.classList.add('disabled'); // Oculta el mensaje
        grid.classList.remove('disabled'); // Muestra el grid
    }
}
// ✅ **FIN DE LA CORRECCIÓN**


export function initMainController() {
    handleAgeVerification();
    const appState = {
        // Objeto para guardar el estado de la galería que se está creando
        newGalleryState: {
            name: '',
            privacy: false,
            profilePictureFile: null,
            pendingPhotos: []
        },
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
            if (['moderator', 'administrator', 'founder'].includes(userRole)) {
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
            
            // ✅ **INICIO DE LA CORRECCIÓN: LÓGICA DE ACTUALIZACIÓN AL SUBIR FOTOS**
            if (fileInput.matches('#add-photos-input')) {
                const gridEl = document.getElementById('manage-photos-grid');
                if (!gridEl) return;

                const currentSection = document.querySelector('[data-section="manageGalleryPhotos"]');
                const isNewGalleryMode = currentSection && currentSection.dataset.mode === 'new';

                const files = event.target.files;
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
                        const newPhotoItem = document.createElement('div');
                        newPhotoItem.className = 'photo-item-edit pending-upload';
                        newPhotoItem.dataset.fileName = file.name;
                        newPhotoItem.innerHTML = `<img src="${e.target.result}" alt="Nueva foto"><button class="delete-photo-btn" data-action="delete-gallery-photo"><span class="material-symbols-rounded">close</span></button>`;
                        gridEl.appendChild(newPhotoItem);
                        // Llama a la función de actualización después de que la imagen se haya agregado al DOM
                        updatePhotoGridVisibility(); 
                    };
                    reader.readAsDataURL(file);
                }
                fileInput.value = ''; // Limpia el input para permitir subir el mismo archivo de nuevo
            }
            // ✅ **FIN DE LA CORRECCIÓN**
        });

        document.addEventListener('click', async function (event) {
            const actionTarget = event.target.closest('[data-action]');
            const selectTrigger = event.target.closest('[data-action="toggle-select"]');
            const submitCommentBtn = event.target.closest('#submit-comment-btn');

            if (appState.currentAppSection === 'createGallery' && event.target.closest('#gallery-privacy-create')) {
                const privacyToggle = event.target.closest('#gallery-privacy-create');
                appState.newGalleryState.privacy = !privacyToggle.classList.contains('active');
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

                switch(action) {
                    case 'add-sanction': {
                        const userProfileSection = document.querySelector('[data-section="userProfile"]');
                        if (userProfileSection) {
                            const userUuid = userProfileSection.dataset.uuid;
                            const userName = userProfileSection.querySelector('.profile-card-name')?.textContent;
                            if (userUuid && userName) {
                                showSanctionDialog(userUuid, userName);
                            }
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
                            fetchAndDisplayUsers('', false, appState.paginationState.adminUsers); // Recargar la lista
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
                                // Reload comments to show the new reply
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
                            repliesContainer.innerHTML = ''; // Limpiar
                            
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
                    // ✅ **INICIO DE LA CORRECCIÓN: LÓGICA DE ACTUALIZACIÓN AL BORRAR FOTOS**
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
                            updatePhotoGridVisibility(); // Llama a la función de actualización
                        } else {
                            api.deleteGalleryPhoto(photoId).then(response => {
                                if (response.ok) {
                                    showNotification(response.data.message, 'success');
                                    photoItem.remove();
                                    updatePhotoGridVisibility(); // Llama a la función de actualización
                                } else {
                                    showNotification(response.data.message || 'Error al eliminar la foto', 'error');
                                }
                            });
                        }
                        break;
                    }
                    // ✅ **FIN DE LA CORRECCIÓN**
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
                        formData.append('privacy', appState.newGalleryState.privacy ? '1' : '0');

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
                            appState.newGalleryState = { name: '', privacy: false, profilePictureFile: null, pendingPhotos: [] };
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
                        
                        const gridEl = document.getElementById('manage-photos-grid');
                        const currentSection = document.querySelector('[data-section="manageGalleryPhotos"]');
                        const galleryUuid = currentSection ? currentSection.dataset.uuid : null;

                        if (!galleryUuid) {
                            showNotification('Error: No se pudo identificar la galería.', 'error');
                            button.classList.remove('loading');
                            return;
                        }
                        
                        if (window.pendingGalleryFiles && window.pendingGalleryFiles.length > 0) {
                            const formData = new FormData();
                            formData.append('action_type', 'upload_gallery_photos');
                            formData.append('uuid', galleryUuid);
                            window.pendingGalleryFiles.forEach(file => {
                                formData.append('photos[]', file);
                            });
                    
                            const uploadResponse = await api.uploadGalleryPhotos(formData);
                            
                            if (uploadResponse.ok) {
                                showNotification(uploadResponse.data.message, 'success');
                                window.pendingGalleryFiles = [];
                                window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'admin', section: 'manageGalleryPhotos', data: { uuid: galleryUuid } } }));
                                return;
                            } else {
                                showNotification(uploadResponse.data.message || 'Error al subir las nuevas fotos.', 'error');
                                button.classList.remove('loading');
                                return;
                            }
                        }
                    
                        const photoOrder = Array.from(gridEl.children).map(item => item.dataset.id).filter(id => id);
                        if (photoOrder.length > 0) {
                            const orderResponse = await api.updatePhotoOrder(photoOrder);
                            if (orderResponse.ok) {
                                showNotification(orderResponse.data.message, 'success');
                            } else {
                                showNotification(orderResponse.data.message || 'Error al guardar el orden de las fotos.', 'error');
                            }
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
        'gallery/{uuid}/photo/{photoId}/comments': { view: 'main', section: 'photoComments' }
    };
    let initialRoute = routes[path] || null;
    let initialStateData = initialRoute ? initialRoute.data : null;

    const privateGalleryMatch = path.match(/^gallery\/private\/([a-f0-9-]{36})$/);
    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);
    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const userFavoritesMatch = path.match(/^favorites\/([a-f0-9-]{36})$/);
    const editGalleryMatch = path.match(/^admin\/edit-gallery\/([a-f0-9-]{36})$/);
    const commentsMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)\/comments$/);
    const userProfileMatch = path.match(/^admin\/user\/([a-f0-9-]{36})$/);
    const managePhotosMatch = path.match(/^admin\/edit-gallery\/([a-f0-9-]{36})\/photos$/);

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