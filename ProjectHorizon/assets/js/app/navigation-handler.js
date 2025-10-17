// assets/js/app/navigation-handler.js

import { generateUrl, navigateToUrl } from '../core/url-manager.js';
import { applyTranslations } from '../managers/language-manager.js';
import { initTooltips } from '../managers/tooltip-manager.js';
import * as api from '../core/api-handler.js';
import {
    displayFavoritePhotos,
    displayHistory,
    renderPhotoView,
    renderEditGalleryForm,
    renderCreateGalleryForm,
    renderGalleryStats
} from '../ui/ui-controller.js';
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
    fetchAndDisplayLogs,
    fetchAndDisplayBackups
} from './view-handlers.js';
import { showVerifyPasswordForEmailChangeDialog } from '../managers/dialog-manager.js';

const loaderHTML = '<div class="loader-container"><div class="spinner"></div></div>';

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

function getInitials(name) {
    if (!name) return '';
    const words = name.split(/[\s_]+/);
    if (words.length > 1 && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function createCommentElement(comment, isReply = false) {
    const commentElement = document.createElement('div');
    commentElement.className = `comment-item ${isReply ? 'comment-reply' : ''}`;
    commentElement.dataset.commentId = comment.id;

    const initials = getInitials(comment.username);
    const roleClass = `profile-btn--${comment.role || 'user'}`;
    let avatarHTML;

    if (comment.profile_picture_url) {
        avatarHTML = `
            <div class="profile-btn comment-avatar ${roleClass} profile-btn--image" style="background-image: url('${window.BASE_PATH}/${comment.profile_picture_url}')">
                <span class="profile-initials"></span>
            </div>`;
    } else {
        avatarHTML = `
            <div class="profile-btn comment-avatar ${roleClass}">
                <span class="profile-initials">${initials}</span>
            </div>`;
    }

    const date = new Date(comment.created_at).toLocaleString();

    let commentBodyHTML = '';
    if (comment.status === 'review') {
        commentBodyHTML = `
            <div class="comment-in-review">
                <span class="material-symbols-rounded">rate_review</span>
                <span data-i18n="admin.manageComments.table.states.review"></span>
            </div>
        `;
    } else {
        const fullText = comment.comment_text;
        const isLong = fullText.length > 250;
        const shortText = isLong ? fullText.substring(0, 250) + '...' : fullText;

        commentBodyHTML = `
            <p class="comment-text" data-full-text="${fullText}">${shortText}</p>
            ${isLong ? `<button class="show-more-comment-btn" data-action="toggle-comment-length">${window.getTranslation('photoView.comments.showMore')}</button>` : ''}
            <div class="comment-actions">
                <div class="like-dislike-container">
                    <button class="comment-action-btn like-btn ${comment.user_vote === 1 ? 'active' : ''}" data-action="like-comment">
                        <span class="material-symbols-rounded">thumb_up</span>
                    </button>
                    <span class="like-count">${comment.likes}</span>
                    <button class="comment-action-btn dislike-btn ${comment.user_vote === -1 ? 'active' : ''}" data-action="dislike-comment">
                        <span class="material-symbols-rounded">thumb_down</span>
                    </button>
                    <span class="dislike-count">${comment.dislikes}</span>
                </div>
                <div>
                    ${!isReply ? `
                    <button class="comment-action-btn reply-btn" data-action="reply-comment">
                        <span class="material-symbols-rounded">reply</span>
                    </button>
                    ` : ''}
                    <button class="comment-action-btn report-btn" data-action="report-comment">
                        <span class="material-symbols-rounded">flag</span>
                    </button>
                </div>
            </div>
        `;
    }

    let repliesControlHTML = '';
    if (!isReply && comment.replies && comment.replies.length > 0) {
        const replyCount = comment.replies.length;
        const buttonText = `Ver ${replyCount} ${replyCount > 1 ? 'respuestas' : 'respuesta'}`;
        repliesControlHTML = `
            <div class="replies-control-container">
                <button class="toggle-replies-btn" data-action="toggle-replies" data-state="hidden" data-total-replies="${replyCount}">
                    ${buttonText}
                </button>
            </div>
        `;
    }

    commentElement.innerHTML = `
        <div class="comment-avatar-container">
            ${avatarHTML}
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${comment.username}</span>
                <span class="comment-date">${date}</span>
            </div>
            ${commentBodyHTML}
            ${repliesControlHTML}
            <div class="replies-container" style="display: none;"></div>
        </div>
    `;
    return commentElement;
}

export function displayComments(comments) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    commentsList.innerHTML = '';
    if (comments.length === 0) {
        commentsList.innerHTML = `<p data-i18n="photoView.comments.noComments"></p>`;
        applyTranslations(commentsList);
        return;
    }

    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        if (comment.replies && comment.replies.length > 0) {
            commentElement.dataset.replies = JSON.stringify(comment.replies);
        }
        commentsList.appendChild(commentElement);
    });

    applyTranslations(commentsList);
}

async function renderManagePhotosView(gallery, appState) {
    const section = document.querySelector('[data-section="manageGalleryPhotos"]');
    if (!section) return;

    section.dataset.uuid = gallery.uuid;

    const titleEl = section.querySelector('#manage-photos-title');
    if (titleEl) {
        titleEl.textContent = window.getTranslation('admin.manageGalleryPhotos.title', { galleryName: gallery.name });
    }

    const mainStatusContainer = section.querySelector('#manage-content-status-container');
    const photosSection = section.querySelector('#photos-management-section');
    const videosSection = section.querySelector('#videos-management-section');
    const photosGrid = section.querySelector('#manage-photos-grid');
    const videosGrid = section.querySelector('#manage-videos-grid');


    mainStatusContainer.classList.add('disabled');
    photosSection.style.display = 'none';
    videosSection.style.display = 'none';
    photosGrid.innerHTML = '';
    videosGrid.innerHTML = '';

    if (gallery.photos.length === 0) {
        mainStatusContainer.classList.remove('disabled');
        mainStatusContainer.innerHTML = `<div><h2 data-i18n="admin.manageGalleryPhotos.noPhotosTitle">${window.getTranslation('admin.manageGalleryPhotos.noPhotosTitle')}</h2><p data-i18n="admin.manageGalleryPhotos.noPhotosMessage">${window.getTranslation('admin.manageGalleryPhotos.noPhotosMessage')}</p></div>`;
        applyTranslations(mainStatusContainer);
        return;
    }

    const photos = gallery.photos.filter(item => item.type === 'photo');
    const videos = gallery.photos.filter(item => item.type === 'video');

    const renderGrid = (container, items, type) => {
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'photo-item-edit';
            itemEl.dataset.id = item.id;
            
            let thumbnailHTML = `<img src="${window.BASE_PATH}/${item.photo_url}" alt="Miniatura">`;
            if (type === 'video') {
                thumbnailHTML = `
                    <img src="${window.BASE_PATH}/${item.thumbnail_url || 'assets/img/video_placeholder.png'}" alt="Miniatura de video">
                    <div class="play-icon-overlay"><span class="material-symbols-rounded">play_arrow</span></div>
                `;
            }

            itemEl.innerHTML = `
                ${thumbnailHTML}
                <button class="delete-photo-btn" data-action="delete-gallery-photo" data-photo-id="${item.id}">
                    <span class="material-symbols-rounded">close</span>
                </button>
            `;
            container.appendChild(itemEl);
        });
        new Sortable(container, { animation: 150, ghostClass: 'sortable-ghost' });
    };

    if (photos.length > 0) {
        photosSection.style.display = 'block';
        renderGrid(photosGrid, photos, 'photo');
    }

    if (videos.length > 0) {
        videosSection.style.display = 'block';
        renderGrid(videosGrid, videos, 'video');
    }

    applyTranslations(section);
}


export async function handleStateChange(view, section, pushState = true, data, appState) {
    const nonReturnableSections = ['photoView', 'photoComments', 'privateGalleryProxy', 'adView', 'accessCodePrompt', '404'];

  // INICIO DE LA CORRECCIÓN
    if (appState.currentAppSection && !nonReturnableSections.includes(appState.currentAppSection)) {
        // Guardar el historial anterior antes de actualizar
        appState.previousVisitedView = appState.lastVisitedView;
        appState.previousVisitedSection = appState.lastVisitedSection;
        appState.previousVisitedData = appState.lastVisitedData;

        // Actualizar el último visitado
        appState.lastVisitedView = appState.currentAppView;
        appState.lastVisitedSection = appState.currentAppSection;
        appState.lastVisitedData = appState.currentAppSectionData;
    }

    const {
        paginationState,
        currentSortBy,
        currentFavoritesSortBy
    } = appState;

    const contentContainer = document.querySelector('.general-content-scrolleable');
    if (contentContainer) {
        contentContainer.innerHTML = loaderHTML;
    }

    const protected_sections = [
        'settings-yourProfile', 'settings-loginSecurity', 'settings-history', 'main-favorites', 'admin-dashboard',
        'admin-manageUsers', 'admin-manageContent', 'admin-editGallery', 'admin-createGallery', 'settings-historyPrivacy',
        'settings-history', 'admin-manageComments', 'admin-manageFeedback', 'admin-userProfile', 'admin-manageGalleryPhotos',
        'admin-generalSettings', 'admin-galleryStats', 'admin-verifyFounder', 'admin-manageProfanity', 'admin-manageLogs', 'admin-viewLog',
        'admin-backup'
    ];
    const section_key = view + '-' + section;

    const sessionResponse = await api.checkSession();
    const isLoggedIn = sessionResponse.ok && sessionResponse.data.loggedin;

    if (protected_sections.includes(section_key) && !isLoggedIn) {
        navigateToUrl('auth', 'login');
        handleStateChange('auth', 'login', true, null, appState);
        return;
    }

    if (view === 'admin') {
        const userRole = sessionResponse.data?.user?.role;
        const allowedAdminRoles = ['administrator', 'founder', 'moderator'];

        if (!isLoggedIn || !allowedAdminRoles.includes(userRole)) {
            handleStateChange('main', '404', true, null, appState);
            return;
        }

        if (userRole === 'moderator' && section !== 'manageComments') {
            handleStateChange('main', '404', true, null, appState);
            return;
        }
    }

    updateHeaderAndMenuStates(view, section);
    appState.currentAppView = view;
    appState.currentAppSection = section;
    appState.currentAppSectionData = data;

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
            handleStateChange('auth', 'login', true, null, appState);
        } else if (contentContainer) {
            displayFetchError('.general-content-scrolleable', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
        return;
    }
    
    switch (section) {
        case 'home':
            setupMoreOptionsMenu();
            appState.updateSelectActiveState('relevance-select', currentSortBy);
            fetchAndDisplayGalleries(currentSortBy, '', false, paginationState.galleries);
            break;
        case 'favorites':
            setupMoreOptionsMenu();
            appState.updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);

            if (isLoggedIn) {
                await appState.fetchUserFavorites();
                let favorites = appState.currentFavoritesList;
                const searchInput = document.getElementById('favorites-search-input');
                const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

                if (searchTerm) {
                    favorites = favorites.filter(photo =>
                        photo.gallery_name.toLowerCase().includes(searchTerm)
                    );
                }

                if (currentFavoritesSortBy === 'newest') {
                    favorites.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
                } else if (currentFavoritesSortBy === 'oldest') {
                    favorites.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
                }

                displayFavoritePhotos(favorites, currentFavoritesSortBy, true);
            } else {
                displayFavoritePhotos([], currentFavoritesSortBy, false);
            }
            break;
        case 'trends':
            fetchAndDisplayTrends().then(photos => appState.currentTrendingPhotosList = photos);
            break;
        case 'dashboard':
            fetchAndDisplayDashboard();
            break;
        case 'userProfile':
            if (data && data.uuid) {
                fetchAndDisplayUserProfile(data.uuid);
            }
            break;
        case 'manageUsers':
            fetchAndDisplayUsers('', false, paginationState.adminUsers, sessionResponse.data.user);
            break;
        case 'manageContent':
            fetchAndDisplayGalleriesAdmin('', false, paginationState.adminGalleries);
            break;
        case 'galleryStats':
            if (data && data.uuid) {
                const section = document.querySelector('[data-section="galleryStats"]');
                if (section) {
                    section.dataset.uuid = data.uuid;
                }

                const response = await api.getGalleryStats(data.uuid);
                if (response.ok) {
                    renderGalleryStats(response.data);
                } else {
                    handleStateChange('main', '404', true, null, appState);
                }
            }
            break;
        case 'manageComments':
            fetchAndDisplayAdminComments('', 'all', false, paginationState.adminComments);
            break;
        case 'manageFeedback':
            fetchAndDisplayFeedback('', false, paginationState.adminFeedback);
            break;
        case 'manageProfanity':
            fetchAndDisplayProfanityWords();
            break;
        case 'manageLogs':
            fetchAndDisplayLogs();
            break;
        case 'backup':
            fetchAndDisplayBackups();
            break;
        case 'viewLog':
            if (data && data.filename) {
                const response = await api.getLogContent(data.filename);
                if (response.ok) {
                    const logContentEl = document.getElementById('log-content');
                    if (logContentEl) {
                        logContentEl.textContent = response.data.content;
                    }
                } else {
                    handleStateChange('main', '404', true, null, appState);
                }
            }
            break;
        case 'editGallery':
            if (data && data.uuid) {
                const response = await api.getGalleryForEdit(data.uuid);
                if (response.ok) {
                    renderEditGalleryForm(response.data);
                } else {
                    handleStateChange('main', '404', true, null, appState);
                }
            }
            break;
        case 'manageGalleryPhotos':
            if (data && data.uuid) {
                const response = await api.getGalleryForEdit(data.uuid);
                if (response.ok) {
                    await renderManagePhotosView(response.data, appState);
                } else {
                    handleStateChange('main', '404', true, null, appState);
                }
            }
            break;
        case 'generalSettings': {
            const settingsResponse = await api.getGeneralSettings();
            if (settingsResponse.ok) {
                const settings = settingsResponse.data;
        
                appState.serverSettings.unlock_duration = parseInt(settings.unlock_duration, 10) || 60;
                appState.serverSettings.ad_probability = settings.ad_probability || '15_cooldown';
        
                const maintenanceToggle = document.querySelector('[data-setting="maintenance-mode"]');
                if (maintenanceToggle) maintenanceToggle.classList.toggle('active', settings.maintenance_mode === '1');
                
                const registrationToggle = document.querySelector('[data-setting="allow-new-registrations"]');
                if (registrationToggle) registrationToggle.classList.toggle('active', settings.allow_new_registrations === '1');
                
                appState.updateSelectActiveState('unlock-duration-select', settings.unlock_duration || '60');
                appState.updateSelectActiveState('ad-probability-select', settings.ad_probability || '15_cooldown');
            } else {
                showNotification('Error al cargar la configuración del servidor.', 'error');
            }
            break;
        }
        case 'createGallery':
            renderCreateGalleryForm(appState);
            break;
        case 'yourProfile': {
            if (isLoggedIn) {
                const user = sessionResponse.data.user;

                const controlNumberSection = document.getElementById('control-number-section');
                const staffRoles = ['moderator', 'administrator', 'founder'];
                if (controlNumberSection && staffRoles.includes(user.role)) {
                    controlNumberSection.style.display = 'flex';
                    const actionsContainer = document.getElementById('control-number-actions');
                    
                    const renderControlNumberState = (number) => {
                        if (number) {
                            actionsContainer.innerHTML = `
                                <div class="control-number-container">
                                    <span class="control-number-display">${number}</span>
                                </div>
                                <button class="header-button" data-action="copy-control-number" data-number="${number}" data-i18n-tooltip="settings.yourProfile.copyTooltip">
                                    <span class="material-symbols-rounded">content_copy</span>
                                </button>
                            `;
                        } else {
                            actionsContainer.innerHTML = `
                                <button class="load-more-btn" data-action="generate-control-number">
                                    <span class="button-text" data-i18n="settings.yourProfile.generateButton"></span>
                                    <div class="button-spinner"></div>
                                </button>
                            `;
                        }
                        applyTranslations(actionsContainer);
                        initTooltips();
                    };

                    renderControlNumberState(user.control_number);

                    actionsContainer.addEventListener('click', async (event) => {
                        const target = event.target.closest('[data-action]');
                        if (!target) return;

                        if (target.dataset.action === 'generate-control-number') {
                            target.classList.add('loading');
                            
                            const formData = new FormData();
                            formData.append('action_type', 'generate_control_number');
                            const genResponse = await api.postDataWithCsrf(formData);

                            target.classList.remove('loading');
                            if(genResponse.ok) {
                                showNotification(window.getTranslation('notifications.controlNumberGenerated'), 'success');
                                renderControlNumberState(genResponse.data.control_number);
                            } else {
                                showNotification(genResponse.data.message || 'Error al generar el número.', 'error');
                            }
                        }

                        if (target.dataset.action === 'copy-control-number') {
                            const numberToCopy = target.dataset.number;
                            appState.copyTextToClipboard(numberToCopy)
                                .then(() => showNotification(window.getTranslation('notifications.controlNumberCopied')))
                                .catch(() => showNotification('Error al copiar.', 'error'));
                        }
                    });
                }

                const pfpPreview = document.getElementById('profile-picture-preview');
                const pfpInitials = pfpPreview ? pfpPreview.querySelector('.profile-initials') : null;
                const pfpInput = document.getElementById('profile-picture-input');
                const uploadBtn = document.getElementById('upload-picture-btn');
                const deleteBtn = document.getElementById('delete-picture-btn');
                const changeBtn = document.getElementById('change-picture-btn');
                const saveBtn = document.getElementById('save-picture-btn');
                const cancelBtn = document.getElementById('cancel-picture-btn');
                let selectedFile = null;
                let originalImageUrl = user.profile_picture_url ? `${window.BASE_PATH}/${user.profile_picture_url}` : null;

                const updatePfpUI = (imageUrl) => {
                    if (!pfpPreview || !pfpInitials) return;
                
                    pfpPreview.classList.remove('profile-btn--user', 'profile-btn--moderator', 'profile-btn--administrator', 'profile-btn--founder', 'profile-btn--image');
                    pfpPreview.classList.add(`profile-btn--${user.role || 'user'}`);
                
                    if (imageUrl) {
                        pfpPreview.style.backgroundImage = `url('${imageUrl}')`;
                        pfpInitials.textContent = '';
                        pfpPreview.classList.add('profile-btn--image');
                        deleteBtn.style.display = 'flex';
                        changeBtn.style.display = 'flex';
                        uploadBtn.style.display = 'none';
                    } else {
                        pfpPreview.style.backgroundImage = 'none';
                        pfpInitials.textContent = getInitials(user.username);
                        deleteBtn.style.display = 'none';
                        changeBtn.style.display = 'none';
                        uploadBtn.style.display = 'flex';
                    }
                    saveBtn.style.display = 'none';
                    cancelBtn.style.display = 'none';
                    selectedFile = null;
                    pfpInput.value = '';
                };

                updatePfpUI(originalImageUrl);

                uploadBtn.addEventListener('click', () => pfpInput.click());
                changeBtn.addEventListener('click', () => pfpInput.click());

                cancelBtn.addEventListener('click', () => {
                    updatePfpUI(originalImageUrl);
                });

                pfpInput.addEventListener('change', (event) => {
                    if (event.target.files && event.target.files[0]) {
                        selectedFile = event.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            pfpPreview.style.backgroundImage = `url('${e.target.result}')`;
                            if(pfpInitials) pfpInitials.textContent = '';
                        };
                        reader.readAsDataURL(selectedFile);

                        uploadBtn.style.display = 'none';
                        deleteBtn.style.display = 'none';
                        changeBtn.style.display = 'none';
                        saveBtn.style.display = 'flex';
                        cancelBtn.style.display = 'flex';
                    }
                });

                saveBtn.addEventListener('click', async () => {
                    if (!selectedFile) return;

                    saveBtn.classList.add('loading');
                    const formData = new FormData();
                    formData.append('action_type', 'update_profile_picture');
                    formData.append('profile_picture', selectedFile);

                    const tokenResponse = await api.getCsrfToken();
                    if (tokenResponse.ok) {
                        formData.append('csrf_token', tokenResponse.data.csrf_token);
                    }

                    const response = await api.updateUserProfilePicture(formData);
                    saveBtn.classList.remove('loading');

                    if (response.ok) {
                        showNotification(window.getTranslation('notifications.pfpUpdated'), 'success');
                        originalImageUrl = `${window.BASE_PATH}/${response.data.url}`;
                        updatePfpUI(originalImageUrl);
                        await window.auth.checkSessionStatus();
                    } else {
                        showNotification(response.data.message || window.getTranslation('notifications.pfpErrorUpload'), 'error');
                    }
                });

                deleteBtn.addEventListener('click', async () => {
                    const response = await api.deleteUserProfilePicture();
                    if (response.ok) {
                        showNotification(window.getTranslation('notifications.pfpDeleted'), 'success');
                        originalImageUrl = null;
                        updatePfpUI(null);
                        await window.auth.checkSessionStatus();
                    } else {
                        showNotification(response.data.message || window.getTranslation('notifications.pfpErrorDelete'), 'error');
                    }
                });

                const usernameDisplay = document.getElementById('username-display');
                const emailDisplay = document.getElementById('email-display');
                const usernameInput = document.getElementById('username-edit-input');
                const emailInput = document.getElementById('email-edit-input');
                const editUsernameBtn = document.getElementById('edit-username-btn');
                const cancelUsernameBtn = document.getElementById('cancel-username-btn');
                const editEmailBtn = document.getElementById('edit-email-btn');
                const cancelEmailBtn = document.getElementById('cancel-email-btn');
                const usernameView = document.getElementById('username-view-mode');
                const usernameEdit = document.getElementById('username-edit-mode');
                const emailView = document.getElementById('email-view-mode');
                const emailEdit = document.getElementById('email-edit-mode');

                if (usernameDisplay) usernameDisplay.textContent = user.username;
                if (emailDisplay) emailDisplay.textContent = user.email;
                if (usernameInput) usernameInput.value = user.username;
                if (emailInput) emailInput.value = user.email;

                editUsernameBtn.addEventListener('click', () => {
                    usernameView.style.display = 'none';
                    usernameEdit.style.display = 'block';
                    document.getElementById('username-error-container').style.display = 'none';
                });
                cancelUsernameBtn.addEventListener('click', () => {
                    usernameView.style.display = 'flex';
                    usernameEdit.style.display = 'none';
                    usernameInput.value = usernameDisplay.textContent;
                });
                editEmailBtn.addEventListener('click', () => {
                    showVerifyPasswordForEmailChangeDialog();
                });
                cancelEmailBtn.addEventListener('click', () => {
                    emailView.style.display = 'flex';
                    emailEdit.style.display = 'none';
                    emailInput.value = emailDisplay.textContent;
                });
            }
            break;
        }
        case 'accessibility':
            appState.updateThemeSelectorUI(localStorage.getItem('theme') || 'system');
            appState.updateLanguageSelectorUI(localStorage.getItem('language') || 'es-419');
            appState.initSettingsController();
            break;
        case 'loginSecurity':
            {
                if (isLoggedIn && sessionResponse.data.user) {
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
            window.auth.fetchAndSetCsrfToken('login-form');
            break;
        case 'register': {
            const form = document.getElementById('register-form');
            const step = data?.step || 'user-info';
            form.dataset.step = step;

            const userInfoGroup = form.querySelector('#user-info-group');
            const passwordGroup = form.querySelector('#password-group');
            const verifyCodeGroup = form.querySelector('#verify-code-group');
            const button = form.querySelector('[data-action="submit-register"]');
            const buttonText = button.querySelector('.button-text');

            userInfoGroup.style.display = 'none';
            passwordGroup.style.display = 'none';
            verifyCodeGroup.style.display = 'none';

            if (step === 'user-info') {
                userInfoGroup.style.display = 'flex';
                buttonText.setAttribute('data-i18n', 'general.next');
            } else if (step === 'password') {
                passwordGroup.style.display = 'flex';
                buttonText.setAttribute('data-i18n', 'auth.registerButton');
            } else if (step === 'verify-code') {
                verifyCodeGroup.style.display = 'flex';
                buttonText.setAttribute('data-i18n', 'auth.verifyCodeButton');

                const codeInput = form.querySelector('#register-code');
                if (codeInput) {
                    codeInput.addEventListener('input', (e) => {
                        let input = e.target;
                        let sanitizedValue = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                        if (sanitizedValue.length > 6) sanitizedValue = sanitizedValue.substring(0, 6);
                        input.value = sanitizedValue.length > 3 ? `${sanitizedValue.substring(0, 3)}-${sanitizedValue.substring(3)}` : sanitizedValue;
                    });
                }
            }

            applyTranslations(form.parentElement);
            window.auth.fetchAndSetCsrfToken('register-form');
            const usernameInput = document.getElementById('register-username');
            if (usernameInput) {
                usernameInput.addEventListener('input', (e) => {
                    let value = e.target.value;
                    value = value.replace(/\s+/g, '_');
                    value = value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
                    e.target.value = value;
                });
            }
            break;
        }
        case 'forgotPassword': {
            const forgotPasswordForm = document.getElementById('forgot-password-form');
            const forgotStep = data?.step || 'enter-email';
            forgotPasswordForm.dataset.step = forgotStep;

            const emailGroup = forgotPasswordForm.querySelector('#email-group');
            const codeGroup = forgotPasswordForm.querySelector('#code-group');
            const forgotPasswordGroup = forgotPasswordForm.querySelector('#password-group');
            const forgotButton = forgotPasswordForm.querySelector('[data-action="submit-forgot-password"]');
            const forgotButtonText = forgotButton.querySelector('.button-text');
            const title = document.querySelector('.auth-container h2');
            const subtitle = document.querySelector('.auth-container p:not(.auth-switch-prompt)');

            emailGroup.style.display = 'none';
            codeGroup.style.display = 'none';
            forgotPasswordGroup.style.display = 'none';


            if (forgotStep === 'enter-email') {
                emailGroup.style.display = 'block';
                title.setAttribute('data-i18n', 'auth.forgotPasswordTitle');
                subtitle.setAttribute('data-i18n', 'auth.forgotPasswordSubtitle');
                forgotButtonText.setAttribute('data-i18n', 'auth.forgotPasswordButton');
            } else if (forgotStep === 'enter-code') {
                codeGroup.style.display = 'block';
                const emailInput = forgotPasswordForm.querySelector('#reset-email');
                if (data && data.email) emailInput.value = data.email;
                title.setAttribute('data-i18n', 'auth.enterCodeTitle');
                subtitle.setAttribute('data-i18n', 'auth.enterCodeSubtitle');
                forgotButtonText.setAttribute('data-i18n', 'auth.verifyCodeButton');

                const codeInput = forgotPasswordForm.querySelector('#reset-code');
                if (codeInput) {
                    codeInput.addEventListener('input', (e) => {
                        let input = e.target;
                        let sanitizedValue = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                        if (sanitizedValue.length > 6) sanitizedValue = sanitizedValue.substring(0, 6);
                        input.value = sanitizedValue.length > 3 ? `${sanitizedValue.substring(0, 3)}-${sanitizedValue.substring(3)}` : sanitizedValue;
                    });
                }
            } else if (forgotStep === 'new-password') {
                forgotPasswordGroup.style.display = 'flex';
                const emailInput = forgotPasswordForm.querySelector('#reset-email');
                if (data && data.email) emailInput.value = data.email;
                const codeInput = forgotPasswordForm.querySelector('#reset-code');
                if (data && data.code) codeInput.value = data.code;
                title.setAttribute('data-i18n', 'auth.newPasswordTitle');
                subtitle.setAttribute('data-i18n', 'auth.newPasswordSubtitle');
                forgotButtonText.setAttribute('data-i18n', 'auth.resetPasswordButton');
            }

            applyTranslations(forgotPasswordForm.parentElement);
            window.auth.fetchAndSetCsrfToken('forgot-password-form');
            break;
        }
        case 'history':
            paginationState.historyProfiles.shown = appState.HISTORY_PROFILES_BATCH;
            paginationState.historyPhotos.shown = appState.HISTORY_PHOTOS_BATCH;
            paginationState.historySearches.shown = appState.HISTORY_SEARCHES_BATCH;
            displayHistory(paginationState.historyProfiles.shown, paginationState.historyPhotos.shown, paginationState.historySearches.shown);
            break;
        case 'historyPrivacy':
            appState.initHistoryPrivacySettings();
            break;
        case 'privateGalleryProxy':
            if (data && data.uuid) {
                if (appState.isPrivateGalleryUnlocked(data.uuid)) {
                    navigateToUrl('main', 'galleryPhotos', { uuid: data.uuid });
                    handleStateChange('main', 'galleryPhotos', true, { uuid: data.uuid, galleryName: data.galleryName }, appState);
                } else {
                    appState.promptToWatchAd(data.uuid, data.galleryName);
                }
            }
            break;
        case 'galleryPhotos':
            if (data && data.uuid) {
                const response = await api.getGalleryDetails(data.uuid);
                if (response.ok) {
                    const gallery = response.data;
                    if (gallery && gallery.name) {
                        if (gallery.privacy == 1 && !appState.isPrivateGalleryUnlocked(gallery.uuid)) {
                            const privateUrl = generateUrl('main', 'privateGalleryProxy', { uuid: gallery.uuid });
                            history.replaceState({ view: 'main', section: 'privateGalleryProxy', data: { uuid: gallery.uuid, galleryName: gallery.name } }, '', privateUrl);
                            handleStateChange('main', 'privateGalleryProxy', false, { uuid: gallery.uuid, galleryName: gallery.name }, appState);
                        } else {
                            window.addToHistory('profile', {
                                id: gallery.uuid,
                                name: gallery.name,
                                privacy: gallery.privacy,
                                profile_picture_url: gallery.profile_picture_url,
                                background_photo_url: gallery.background_photo_url
                            });
                            appState.currentGalleryForPhotoView = gallery.uuid;
                            appState.currentGalleryNameForPhotoView = gallery.name;
                            fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name, false, paginationState.photos);
                        }
                    } else {
                        handleStateChange('main', '404', true, null, appState);
                    }
                } else {
                    console.error("Failed to fetch gallery info:", response.data);
                    handleStateChange('main', '404', true, null, appState);
                }
            }
            break;

        case 'photoView':
            if (data && data.uuid && data.photoId) {
                let photoListPromise;

                if (appState.lastVisitedSection === 'userSpecificFavorites' && appState.lastVisitedData && appState.lastVisitedData.uuid) {
                    photoListPromise = Promise.resolve(appState.currentFavoritesList.filter(p => p.gallery_uuid === data.uuid));
                } else if (appState.lastVisitedSection === 'favorites') {
                    photoListPromise = Promise.resolve(appState.currentFavoritesList);
                } else if (appState.lastVisitedSection === 'trends') {
                    photoListPromise = Promise.resolve(appState.currentTrendingPhotosList);
                } else if (appState.lastVisitedSection === 'history') {
                    const historyData = await api.getHistory();
                    appState.currentHistoryPhotosList = historyData.photos;
                    photoListPromise = Promise.resolve(appState.currentHistoryPhotosList);
                } else {
                    if (appState.currentGalleryForPhotoView === data.uuid && paginationState.photos.photoList.length > 0) {
                        photoListPromise = Promise.resolve(paginationState.photos.photoList);
                    } else {
                        photoListPromise = api.getGalleryPhotos(data.uuid, 1, 1000)
                            .then(response => {
                                if (response.ok) {
                                    paginationState.photos.photoList = response.data;
                                    appState.currentGalleryForPhotoView = data.uuid;
                                    return response.data;
                                }
                                return [];
                            });
                    }
                }

                photoListPromise.then(async (photoList) => {
                    appState.currentPhotoViewList = photoList;
                    appState.currentPhotoData = await renderPhotoView(data.uuid, data.photoId, appState.currentPhotoViewList);
                    if (appState.currentPhotoData) {
                        window.addToHistory('photo', appState.currentPhotoData);
                    }
                });
            }
            break;
        case 'photoComments':
            if (data && data.photoId) {
                const commentsResponse = await api.getComments(data.photoId);
                if (commentsResponse.ok) {
                    displayComments(commentsResponse.data);
                }
                const photoResponse = await api.getPhotoDetails(data.photoId);
                if (photoResponse.ok) {
                    const photo = photoResponse.data;
                    appState.currentPhotoData = {
                        id: photo.id,
                        gallery_uuid: photo.gallery_uuid,
                        photo_url: photo.photo_url,
                        type: photo.type
                    };

                    const photoPreviewImg = document.getElementById('photo-preview-img');
                    const photoPreviewVideo = document.getElementById('photo-preview-video');

                    if (photo.type === 'video') {
                        if (photoPreviewImg) photoPreviewImg.style.display = 'none';
                        if (photoPreviewVideo) {
                            photoPreviewVideo.style.display = 'block';
                            photoPreviewVideo.src = `${window.BASE_PATH}/${photo.photo_url}`;
                        }
                    } else {
                        if (photoPreviewVideo) photoPreviewVideo.style.display = 'none';
                        if (photoPreviewImg) {
                            photoPreviewImg.style.display = 'block';
                            photoPreviewImg.src = `${window.BASE_PATH}/${photo.photo_url}`;
                        }
                    }

                    const photoTitle = document.getElementById('photo-comment-title');
                    if (photoTitle) {
                        const galleryResponse = await api.getGalleryDetails(photo.gallery_uuid);
                        if (galleryResponse.ok) {
                            photoTitle.textContent = `Comentarios en "${galleryResponse.data.name}"`;
                            appState.currentPhotoData.gallery_name = galleryResponse.data.name;
                            appState.currentPhotoData.profile_picture_url = galleryResponse.data.profile_picture_url;
                        } else {
                            photoTitle.textContent = `Comentarios`;
                        }
                    }
                } else {
                    handleStateChange('main', '404', true, null, appState);
                }
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
                uploadBtn.disabled = uploadedFiles.length >= MAX_FILES;
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

            appState.updateSelectActiveState('feedback-issue-type-select', null);
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
                            appState.updateSelectActiveState('feedback-issue-type-select', null);
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
                const unlockMessageEl = document.querySelector('[data-i18n="accessCodePrompt.unlockMessage"]');
                if (unlockMessageEl) {
                    const unlockDuration = window.UNLOCK_DURATION || 60;
                    unlockMessageEl.textContent = window.getTranslation('accessCodePrompt.unlockMessage', { minutes: unlockDuration });
                    unlockMessageEl.removeAttribute('data-i18n');
                }
            }
            break;
        case 'adView':
            const adTitle = document.getElementById('ad-title');
            const adContentTitle = document.getElementById('ad-content-title');
            const timerElement = document.getElementById('ad-timer');
            const skipButton = document.getElementById('skip-ad-button');

            if (appState.adCountdownInterval) {
                clearInterval(appState.adCountdownInterval);
            }

            function startAdCountdown() {
                let countdown = 5;
                timerElement.textContent = countdown;
                skipButton.disabled = true;

                appState.adCountdownInterval = setInterval(() => {
                    countdown--;
                    timerElement.textContent = countdown;
                    if (countdown <= 0) {
                        clearInterval(appState.adCountdownInterval);
                        timerElement.textContent = '0';
                        skipButton.disabled = false;
                    }
                }, 1000);
            }

            if (appState.adContext === 'unlock') {
                adTitle.textContent = window.getTranslation('adView.adOf', { current: appState.adStep, total: 2 });
                adContentTitle.textContent = window.getTranslation('adView.adContentTitle');
                skipButton.textContent = (appState.adStep === 1) ? window.getTranslation('adView.nextAd') : window.getTranslation('adView.skipAd');
                startAdCountdown();

                skipButton.onclick = () => {
                    if (appState.adStep === 1) {
                        appState.adStep = 2;
                        handleStateChange('main', 'adView', true, null, appState);
                    } else {
                        const destination = appState.galleryAfterAd;
                        if (destination) {
                            const unlockedGalleries = JSON.parse(localStorage.getItem('unlockedGalleries') || '{}');
                            const galleryUuidToUnlock = destination.data.uuid;
                            unlockedGalleries[galleryUuidToUnlock] = new Date().getTime();
                            localStorage.setItem('unlockedGalleries', JSON.stringify(unlockedGalleries));

                            navigateToUrl(destination.view, destination.section, destination.data);
                            handleStateChange(destination.view, destination.section, true, destination.data, appState);
                            appState.galleryAfterAd = null;
                        }
                        appState.adContext = 'navigation';
                    }
                };
            } else {
                adTitle.textContent = window.getTranslation('adView.ad');
                adContentTitle.textContent = window.getTranslation('adView.adContentTitle');
                skipButton.textContent = window.getTranslation('adView.skipAd');
                startAdCountdown();

                skipButton.onclick = () => {
                    const destination = appState.galleryAfterAd || appState.photoAfterAd;
                    if (destination) {
                        navigateToUrl(destination.view, destination.section, destination.data);
                        handleStateChange(destination.view, destination.section, true, destination.data, appState);
                        appState.photoAfterAd = null;
                        appState.galleryAfterAd = null;
                    } else {
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home', true, null, appState);
                    }
                };
            }
            break;
        case 'userSpecificFavorites':
    if (data && data.uuid) {
        
        if (appState.currentFavoritesList.length === 0 && isLoggedIn) {
            await appState.fetchUserFavorites();
        }
        
        const userFavorites = appState.currentFavoritesList.filter(p => p.gallery_uuid === data.uuid);

        const sectionEl = document.querySelector('[data-section="userSpecificFavorites"]');
        if (sectionEl) {
            const photosSection = sectionEl.querySelector('#user-specific-favorites-photos-section');
            const videosSection = sectionEl.querySelector('#user-specific-favorites-videos-section');
            const photosGrid = sectionEl.querySelector('#user-specific-favorites-photos-grid');
            const videosGrid = sectionEl.querySelector('#user-specific-favorites-videos-grid');
            const statusContainer = sectionEl.querySelector('.status-message-container');
            const title = sectionEl.querySelector('#user-specific-favorites-title');
            sectionEl.dataset.uuid = data.uuid;

            photosSection.style.display = 'none';
            videosSection.style.display = 'none';
            photosGrid.innerHTML = '';
            videosGrid.innerHTML = '';
            statusContainer.classList.add('disabled');

            if (userFavorites.length > 0) {
                title.textContent = window.getTranslation('userSpecificFavorites.titleFrom', { userName: userFavorites[0].gallery_name });
                
                const favoritePhotos = userFavorites.filter(item => item.type === 'photo');
                const favoriteVideos = userFavorites.filter(item => item.type === 'video');

                if (favoritePhotos.length > 0) {
                    photosSection.style.display = 'block';
                    favoritePhotos.forEach(photo => {
                        const card = document.createElement('div');
                        card.className = 'card photo-card';
                        card.dataset.photoUrl = photo.photo_url;
                        card.dataset.photoId = photo.id;
                        card.dataset.galleryUuid = photo.gallery_uuid;
                        const background = document.createElement('div');
                        background.className = 'card-background';
                        background.style.backgroundImage = `url('${window.BASE_PATH}/${photo.photo_url}')`;
                        card.appendChild(background);
                        const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${photo.gallery_uuid}/photo/${photo.id}`;
                        card.innerHTML += `<div class="card-actions-container"><div class="card-hover-overlay"><div class="card-hover-icons"><div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div><div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div></div></div><div class="module-content module-select photo-context-menu disabled body-title"><div class="menu-content"><div class="menu-list"><a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.openInNewTab')}</span></div></a><div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.copyLink')}</span></div></div><a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.download')}</span></div></a></div></div></div></div>`;
                        photosGrid.appendChild(card);
                    });
                }

                if (favoriteVideos.length > 0) {
                    videosSection.style.display = 'block';
                    favoriteVideos.forEach(video => {
                        const card = document.createElement('div');
                        card.className = 'card video-card';
                        card.dataset.photoUrl = video.photo_url;
                        card.dataset.photoId = video.id;
                        card.dataset.galleryUuid = video.gallery_uuid;
            
                        const background = document.createElement('div');
                        background.className = 'card-background';
                        if (video.thumbnail_url) {
                            background.style.backgroundImage = `url('${window.BASE_PATH}/${video.thumbnail_url}')`;
                        } else {
                            background.style.backgroundColor = '#000';
                        }
            
                        const playIcon = document.createElement('div');
                        playIcon.className = 'play-icon';
                        playIcon.innerHTML = `<span class="material-symbols-rounded">play_arrow</span>`;
            
                        card.appendChild(background);
                        card.appendChild(playIcon);
                        const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${video.gallery_uuid}/photo/${video.id}`;
                        card.innerHTML += `<div class="card-actions-container"><div class="card-hover-overlay"><div class="card-hover-icons"><div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${video.id}"><span class="material-symbols-rounded">favorite</span></div><div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div></div></div><div class="module-content module-select photo-context-menu disabled body-title"><div class="menu-content"><div class="menu-list"><a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.openInNewTab')}</span></div></a><div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.copyLink')}</span></div></div><a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>${window.getTranslation('photoCard.download')}</span></div></a></div></div></div></div>`;
                        videosGrid.appendChild(card);
                    });
                }

            } else {
                title.textContent = window.getTranslation('userSpecificFavorites.title');
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('userSpecificFavorites.noUserFavoritesTitle')}</h2><p>${window.getTranslation('userSpecificFavorites.noUserFavoritesMessage')}</p></div>`;
            }
        }
    }
    break;
    }

    appState.setupScrollShadows();
    updateHeaderAndMenuStates(view, section);
    initTooltips();
    applyTranslations(document.body);
}