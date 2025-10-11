// assets/js/ui/ui-controller.js

import { getHistory } from '../core/api-handler.js';
import * as api from '../core/api-handler.js';
import { initTooltips } from '../managers/tooltip-manager.js';

function getInitials(name) {
    if (!name) return '';
    const words = name.split(/[\s_]+/); // Maneja espacios y guiones bajos
    if (words.length > 1 && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export function updateCardPrivacyStatus(uuid, unlockedTimestamp) {
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

export function displayGalleriesAsGrid(galleries, container, sortBy, append = false) {
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
            background.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.background_photo_url}')`;
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
            icon.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.profile_picture_url}')`;
        } else {
            icon.textContent = getInitials(gallery.name);
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.fontSize = '1.2rem';
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

export function displayFavoritePhotos(currentFavoritesList, currentFavoritesSortBy, isLoggedIn) {
    const section = document.querySelector('[data-section="favorites"]');
    if (!section) return;

    const allPhotosContainer = section.querySelector('#favorites-grid-view');
    const byUserContainer = section.querySelector('#favorites-grid-view-by-user');
    const statusContainer = section.querySelector('.status-message-container');

    allPhotosContainer.innerHTML = '';
    byUserContainer.innerHTML = '';
    statusContainer.innerHTML = '';
    statusContainer.classList.add('disabled');
    
    if (!isLoggedIn) {
        allPhotosContainer.classList.add('disabled');
        byUserContainer.classList.add('disabled');
        statusContainer.classList.remove('disabled');
        statusContainer.innerHTML = `<div><h2>${window.getTranslation('favorites.noFavoritesTitle')}</h2><p>${window.getTranslation('favorites.noFavoritesMessage')}</p></div>`;
        return;
    }


    if (currentFavoritesSortBy === 'user') {
        allPhotosContainer.classList.remove('active');
        allPhotosContainer.classList.add('disabled');
        byUserContainer.classList.add('active');
        byUserContainer.classList.remove('disabled');

        const galleries = currentFavoritesList.reduce((acc, photo) => {
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
                background.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.photos[0].photo_url}')`;
                card.appendChild(background);

                const overlay = document.createElement('div');
                overlay.className = 'card-content-overlay';

                const icon = document.createElement('div');
                icon.className = 'card-icon';
                if (gallery.profile_picture_url) {
                    icon.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.profile_picture_url}')`;
                } else {
                    icon.textContent = getInitials(gallery.name);
                    icon.style.display = 'flex';
                    icon.style.alignItems = 'center';
                    icon.style.justifyContent = 'center';
                    icon.style.fontSize = '1.2rem';
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

        if (currentFavoritesList.length > 0) {
            allPhotosContainer.classList.remove('disabled');
            statusContainer.classList.add('disabled');
            currentFavoritesList.forEach(photo => {
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
                const addedDate = window.getTranslation('general.added', { date: new Date(photo.added_at).toLocaleString() });
                const profilePicUrl = photo.profile_picture_url ? `${window.BASE_PATH}/${photo.profile_picture_url}` : '';
                card.innerHTML += `
            <div class="card-content-overlay">
                <div class="card-icon" style="background-image: url('${profilePicUrl}')"></div>
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
    window.applyTranslations(section);
}

export async function displayHistory(historyProfilesShown, historyPhotosShown, historySearchesShown) {
    const history = await getHistory();
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

    historyContainer.classList.add('disabled');
    historyContainer.classList.remove('active');
    statusContainer.classList.add('disabled');
    statusContainer.classList.remove('active');
    pausedAlert.classList.add('disabled');
    pausedAlert.classList.remove('active');
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
            historyContainer.classList.remove('disabled');
            historyContainer.classList.add('active');
            if (isViewHistoryPaused) {
                pausedAlert.classList.remove('disabled');
                pausedAlert.classList.add('active');
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
                        background.style.backgroundImage = `url('${window.BASE_PATH}/${profile.background_photo_url}')`;
                        card.appendChild(background);
                    }
                    const overlay = document.createElement('div');
                    overlay.className = 'card-content-overlay';
                    const icon = document.createElement('div');
                    icon.className = 'card-icon';
                    if (profile.profile_picture_url) {
                        icon.style.backgroundImage = `url('${window.BASE_PATH}/${profile.profile_picture_url}')`;
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
                    background.style.backgroundImage = `url('${window.BASE_PATH}/${photo.photo_url}')`;
                    card.appendChild(background);
                    const overlay = document.createElement('div');
                    overlay.className = 'card-content-overlay';
                    const icon = document.createElement('div');
                    icon.className = 'card-icon';
                    if (photo.profile_picture_url) {
                        icon.style.backgroundImage = `url('${window.BASE_PATH}/${photo.profile_picture_url}')`;
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
                statusContainer.classList.add('active');
            } else {
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.noActivityTitle')}</h2><p>${window.getTranslation('settings.history.noActivityMessage')}</p></div>`;
                statusContainer.classList.remove('disabled');
                statusContainer.classList.add('active');
            }
        }
    } else if (currentView === 'searches') {
        const hasContent = history.searches.length > 0;

        if (hasContent) {
            historyContainer.classList.remove('disabled');
            historyContainer.classList.add('active');
            if (isSearchHistoryPaused) {
                pausedAlert.classList.remove('disabled');
                pausedAlert.classList.add('active');
            }

            const searchesToShow = history.searches.slice(0, historySearchesShown);
            searchesToShow.forEach(search => {
                const item = document.createElement('div');
                item.className = 'search-history-item';
                const searchedInText = window.getTranslation('general.searchedIn', { section: search.section });
                item.innerHTML = `
                    <div class="search-history-text">
                        <span class="search-term">"${search.term}"</span>
                        <span class="search-details">${searchedInText} - ${new Date(search.visited_at).toLocaleString()}</span>
                    </div>
                    <div class="search-history-actions">
                        <button class="search-history-delete-btn" data-action="delete-search-item" data-timestamp="${search.visited_at}" data-tooltip="Eliminar">
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
                statusContainer.classList.add('active');
            } else {
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.noSearchesTitle')}</h2><p>${window.getTranslation('settings.history.noSearchesMessage')}</p></div>`;
                statusContainer.classList.remove('disabled');
                statusContainer.classList.add('active');
            }
        }
    }
    window.applyTranslations(mainContainer);
}

export async function renderPhotoView(uuid, photoId, photoList) {
    const photoViewerImage = document.getElementById('photo-viewer-image');
    const photoCounter = document.getElementById('photo-counter');
    const photoViewUserTitle = document.getElementById('photo-view-user-title');
    const prevButton = document.querySelector('[data-action="previous-photo"]');
    const nextButton = document.querySelector('[data-action="next-photo"]');

    if (!photoViewerImage) {
        console.error("Photo viewer elements not found in the DOM.");
        return null; 
    }

    await api.incrementPhotoInteraction(photoId);
    let currentRotation = 0;
    photoViewerImage.style.transform = `rotate(0deg)`;

    const photoIndex = photoList.findIndex(p => p.id == photoId);

    if (photoIndex !== -1) {
        const photo = photoList[photoIndex];

        const updateGalleryName = async () => {
            if (photo.gallery_name) {
                if (photoViewUserTitle) photoViewUserTitle.textContent = photo.gallery_name;
            } else {
                const response = await api.getGalleryDetails(uuid);
                if (response.ok && response.data && response.data.name) {
                    if (photoViewUserTitle) photoViewUserTitle.textContent = response.data.name;
                }
            }
        };

        await updateGalleryName(); 

        photoViewerImage.src = `${window.BASE_PATH}/${photo.photo_url}`;
        photoCounter.textContent = `${photoIndex + 1} / ${photoList.length}`;

        const currentPhotoDataForExport = {
            id: photo.id,
            gallery_uuid: uuid,
            photo_url: photo.photo_url,
            gallery_name: photoViewUserTitle.textContent,
            profile_picture_url: photo.profile_picture_url
        };

        window.updateFavoriteButtonState(photo.id);

        if (prevButton) prevButton.classList.toggle('disabled-nav', photoIndex === 0);
        if (nextButton) nextButton.classList.toggle('disabled-nav', photoIndex === photoList.length - 1);
        
        return currentPhotoDataForExport; 
    } else {
        console.error("Photo not found in list, navigating to 404.");
        window.dispatchEvent(new CustomEvent('navigateTo', { detail: { view: 'main', section: '404' } }));
        return null;
    }
}


export function renderEditGalleryForm(gallery) {
    window.pendingGalleryFiles = [];
    const container = document.getElementById('edit-gallery-form-container');
    const titleEl = document.getElementById('edit-gallery-title');
    const pathParts = window.location.pathname.split('/');
    const uuid = pathParts[pathParts.length - 1];

    if (!container || !titleEl) return;

    titleEl.textContent = window.getTranslation('admin.editGallery.title', { galleryName: gallery.name });
    titleEl.removeAttribute('data-i18n');

    let photosHTML = '';
    gallery.photos.forEach(photo => {
        photosHTML += `
        <div class="photo-item-edit" data-id="${photo.id}">
            <img src="${window.BASE_PATH}/${photo.photo_url}" alt="Miniatura">
            <button class="delete-photo-btn" data-action="delete-gallery-photo" data-photo-id="${photo.id}">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    `;
    });
    
    let profilePicHTML;
    if (gallery.profile_picture_url) {
        const profilePicUrl = `${window.BASE_PATH}/${gallery.profile_picture_url}`;
        profilePicHTML = `<div class="profile-picture-preview" style="background-image: url('${profilePicUrl}')"></div>`;
    } else {
        profilePicHTML = `<div class="profile-picture-preview profile-picture-preview--initials">${getInitials(gallery.name)}</div>`;
    }

    const createdDate = new Date(gallery.created_at).toLocaleString();

    container.innerHTML = `
    <div class="edit-section">
        <div class="profile-picture-edit-container">
            <div class="profile-info-wrapper">
                ${profilePicHTML}
                <div class="profile-text-wrapper">
                    <div class="profile-main-text">${gallery.name}</div>
                    <div class="profile-sub-text" data-i18n="admin.editGallery.profilePictureTitle"></div>
                     <div class="profile-sub-text">${window.getTranslation('general.created')}: ${createdDate}</div>
                </div>
            </div>
            <input type="file" id="profile-picture-upload" accept="image/*" style="display: none;">
            <button class="load-more-btn" onclick="document.getElementById('profile-picture-upload').click();" data-i18n="admin.editGallery.changeButton"></button>
        </div>
    </div>

    <div class="edit-section">
        <div id="name-view-mode" class="form-group-inline">
            <div class="form-group-text">
                <label class="form-label" data-i18n="admin.editGallery.nameLabel"></label>
                <span id="gallery-name-display">${gallery.name}</span>
            </div>
            <button type="button" class="load-more-btn" id="edit-name-btn" data-i18n="general.edit"></button>
        </div>
        <div id="name-edit-mode" class="form-group-inline" style="display: none;">
            <label class="form-label standalone" data-i18n="admin.editGallery.nameLabel"></label>
            <div class="input-with-buttons">
                <input type="text" id="gallery-name-edit" class="feedback-input" value="${gallery.name}" maxlength="100">
                <div class="form-group-buttons">
                    <button type="button" class="load-more-btn" id="cancel-name-btn" data-i18n="general.cancel"></button>
                    <button type="button" class="load-more-btn btn-primary" id="save-name-btn" data-i18n="general.save"></button>
                </div>
            </div>
        </div>
    </div>

    <div class="edit-section">
        <div class="edit-section-header">
            <h4 data-i18n="admin.editGallery.photosTitle"></h4>
            <div class="upload-new-photos-container">
                <input type="file" id="new-photos-upload" multiple accept="image/*" style="display:none;">
                <button class="load-more-btn" onclick="document.getElementById('new-photos-upload').click();" data-i18n="admin.editGallery.addPhotosButton"></button>
            </div>
        </div>
        <div class="photo-grid-edit" id="gallery-photos-grid-edit">
            ${photosHTML}
        </div>
    </div>
    
    <div class="edit-section">
        <div class="data-item">
             <div class="view-container active">
                <div class="item-details">
                    <h4 data-i18n="admin.editGallery.privacyLabel"></h4>
                    <p data-i18n="admin.editGallery.privacyDescription"></p>
                </div>
                <div class="item-actions">
                    <div class="toggle-switch btn-primary ${gallery.privacy == 1 ? 'active' : ''}" id="gallery-privacy-edit">
                        <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="edit-section">
        <div class="data-item">
             <div class="view-container active">
                <div class="item-details">
                    <h4 data-i18n="admin.editGallery.visibilityLabel"></h4>
                    <p data-i18n="admin.editGallery.visibilityDescription"></p>
                </div>
                <div class="item-actions">
                    <div class="toggle-switch btn-primary ${gallery.visibility === 'visible' ? 'active' : ''}" id="gallery-visibility-edit">
                        <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="edit-section delete-section">
        <div class="item-details">
            <h4 data-i18n="admin.editGallery.deleteGalleryTitle"></h4>
            <p data-i18n="admin.editGallery.deleteGalleryDescription"></p>
        </div>
        <div class="item-actions">
            <button class="load-more-btn btn-danger" data-action="delete-gallery">
                <span class="button-text" data-i18n="admin.editGallery.deleteButton"></span>
            </button>
        </div>
    </div>
`;

    window.applyTranslations(container);

    const nameViewMode = container.querySelector('#name-view-mode');
    const nameEditMode = container.querySelector('#name-edit-mode');
    const nameDisplay = container.querySelector('#gallery-name-display');
    const nameInput = container.querySelector('#gallery-name-edit');
    const profileNameText = container.querySelector('.profile-main-text');

    const editBtn = container.querySelector('#edit-name-btn');
    const cancelBtn = container.querySelector('#cancel-name-btn');
    const saveBtn = container.querySelector('#save-name-btn');
    const privacyToggle = container.querySelector('#gallery-privacy-edit');
    const visibilityToggle = container.querySelector('#gallery-visibility-edit');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            nameViewMode.style.display = 'none';
            nameEditMode.style.display = 'block';
            nameInput.focus();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            nameInput.value = nameDisplay.textContent;
            nameEditMode.style.display = 'none';
            nameViewMode.style.display = 'flex';
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const newName = nameInput.value.trim();
            if (newName) {
                const formData = new FormData();
                formData.append('action_type', 'update_gallery_details');
                formData.append('uuid', uuid);
                formData.append('name', newName);
                formData.append('privacy', privacyToggle.classList.contains('active'));

                api.updateGalleryDetails(formData).then(response => {
                    if (response.ok) {
                        window.showNotification(response.data.message, 'success');
                        nameDisplay.textContent = newName;
                        if (profileNameText) profileNameText.textContent = newName;
                        titleEl.textContent = window.getTranslation('admin.editGallery.title', { galleryName: newName });
                    } else {
                        window.showNotification(response.data.message || 'Error al guardar el nombre.', 'error');
                        nameInput.value = nameDisplay.textContent; // Revert input on error
                    }
                });
            }
            nameEditMode.style.display = 'none';
            nameViewMode.style.display = 'flex';
        });
    }

    if (privacyToggle) {
        privacyToggle.addEventListener('click', () => {
            privacyToggle.classList.toggle('active');
            const isPrivate = privacyToggle.classList.contains('active');

            api.changeGalleryPrivacy(uuid, isPrivate).then(response => {
                if (response.ok) {
                    window.showNotification(response.data.message, 'success');
                } else {
                    window.showNotification(response.data.message || 'Error al cambiar la privacidad.', 'error');
                    privacyToggle.classList.toggle('active'); // Revert on error
                }
            });
        });
    }

    if (visibilityToggle) {
        visibilityToggle.addEventListener('click', () => {
            visibilityToggle.classList.toggle('active');
            const newVisibility = visibilityToggle.classList.contains('active') ? 'visible' : 'hidden';

            api.changeGalleryVisibility(uuid, newVisibility).then(response => {
                if (response.ok) {
                    window.showNotification(response.data.message, 'success');
                } else {
                    window.showNotification(response.data.message || 'Error al cambiar la visibilidad.', 'error');
                    visibilityToggle.classList.toggle('active'); // Revert on error
                }
            });
        });
    }

    const photoGrid = document.getElementById('gallery-photos-grid-edit');
    if (photoGrid) {
        new Sortable(photoGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
        });
    }

    const newPhotosInput = document.getElementById('new-photos-upload');
    newPhotosInput.addEventListener('change', (event) => {
        const files = event.target.files;
        for (const file of files) {
            window.pendingGalleryFiles.push(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const newPhotoHTML = `
                <div class="photo-item-edit pending-upload" data-id="">
                    <img src="${e.target.result}" alt="Nueva foto">
                    <button class="delete-photo-btn" data-action="delete-gallery-photo" data-photo-id="">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>`;
                photoGrid.insertAdjacentHTML('beforeend', newPhotoHTML);
            };
            reader.readAsDataURL(file);
        }
        newPhotosInput.value = '';
    });
}

export function renderCreateGalleryForm() {
    window.pendingGalleryFiles = [];
    const container = document.getElementById('create-gallery-form-container');
    if (!container) return;

    container.innerHTML = `
    <div class="edit-section">
        <div class="profile-picture-edit-container">
            <div class="profile-info-wrapper">
                <div class="profile-picture-preview" id="profile-picture-preview-create"></div>
                <div class="profile-text-wrapper">
                    <div class="profile-main-text" data-i18n="admin.editGallery.profilePictureTitle"></div>
                </div>
            </div>
            <input type="file" id="profile-picture-upload-create" accept="image/*" style="display: none;">
            <button class="load-more-btn" onclick="document.getElementById('profile-picture-upload-create').click();" data-i18n="admin.editGallery.changeButton"></button>
        </div>
    </div>

    <div class="edit-section">
        <div class="form-group-inline">
            <label class="form-label standalone" data-i18n="admin.editGallery.nameLabel"></label>
            <input type="text" id="gallery-name-create" class="feedback-input" placeholder="Nombre de la galería" maxlength="100">
        </div>
    </div>

    <div class="edit-section">
        <div class="edit-section-header">
            <h4 data-i18n="admin.editGallery.photosTitle"></h4>
            <div class="upload-new-photos-container">
                <input type="file" id="new-photos-upload-create" multiple accept="image/*" style="display:none;">
                <button class="load-more-btn" onclick="document.getElementById('new-photos-upload-create').click();" data-i18n="admin.editGallery.addPhotosButton"></button>
            </div>
        </div>
        <div class="photo-grid-edit" id="gallery-photos-grid-create"></div>
    </div>
    
    <div class="edit-section">
        <div class="data-item">
             <div class="view-container active">
                <div class="item-details">
                    <h4 data-i18n="admin.editGallery.privacyLabel"></h4>
                    <p data-i18n="admin.editGallery.privacyDescription"></p>
                </div>
                <div class="item-actions">
                    <div class="toggle-switch btn-primary" id="gallery-privacy-create">
                        <div class="toggle-handle"><span class="material-symbols-rounded">check</span></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
    window.applyTranslations(container);

    const privacyToggle = container.querySelector('#gallery-privacy-create');
    if (privacyToggle) {
        privacyToggle.addEventListener('click', () => privacyToggle.classList.toggle('active'));
    }
    
    const profilePicInput = document.getElementById('profile-picture-upload-create');
    const profilePicPreview = document.getElementById('profile-picture-preview-create');
    if (profilePicInput && profilePicPreview) {
        profilePicInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePicPreview.style.backgroundImage = `url('${e.target.result}')`;
                };
                reader.readAsDataURL(event.target.files[0]);
            }
        });
    }

    const newPhotosInput = document.getElementById('new-photos-upload-create');
    const photoGrid = document.getElementById('gallery-photos-grid-create');
    if (newPhotosInput && photoGrid) {
        
        new Sortable(photoGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
        });

        newPhotosInput.addEventListener('change', (event) => {
            const files = event.target.files;
            for (const file of files) {
                window.pendingGalleryFiles.push(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newPhotoHTML = `
                    <div class="photo-item-edit pending-upload" data-file-name="${file.name}">
                        <img src="${e.target.result}" alt="Nueva foto">
                    </div>`;
                    photoGrid.insertAdjacentHTML('beforeend', newPhotoHTML);
                };
                reader.readAsDataURL(file);
            }
            newPhotosInput.value = ''; 
        });
    }
}

// -- CORRECCIÓN: Se añade 'sessionUser' para recibir la info del usuario logueado. --
export function displayUsers(users, tableBody, statusContainer, append = false, sessionUser) {
    const tableContainer = tableBody ? tableBody.closest('.admin-table-container') : null;

    if (users.length > 0) {
        if (tableContainer) tableContainer.classList.remove('disabled');
        if (statusContainer) statusContainer.classList.add('disabled');

        users.forEach(user => {
            const row = document.createElement('tr');
            const createdDate = new Date(user.created_at).toLocaleDateString();

            const isProtected = user.role === 'founder';
            const isAdmin = user.role === 'administrator';

            // -- CORRECCIÓN FINAL: La lógica ahora es correcta. --
            // Se deshabilita si:
            // 1. El usuario objetivo (user.role) es un fundador.
            // 2. El usuario objetivo (user.role) es un administrador Y el usuario actual (sessionUser) NO es un fundador.
            const disableActions = isProtected || (isAdmin && sessionUser?.role !== 'founder');
            const translatedRole = window.getTranslation(`admin.manageUsers.roles.${user.role}`) || user.role;

            row.innerHTML = `
            <td><input type="checkbox" class="user-select" data-uuid="${user.uuid}" ${isProtected ? 'disabled' : ''}></td>
            <td>
                <div class="user-info">
                    <div class="user-initials-avatar">${getInitials(user.username)}</div>
                    <div class="user-details">
                        <div class="username">${user.username}</div>
                        <div class="email">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>${translatedRole}</td>
            <td><span class="status-badge status-${user.status}">${user.status}</span></td>
            <td>${createdDate}</td>
            <td>
                <div class="item-actions">
                    <button class="header-button" data-action="view-user-profile" data-uuid="${user.uuid}" data-i18n-tooltip="admin.manageUsers.table.actions.viewProfile">
                        <span class="material-symbols-rounded">visibility</span>
                    </button>
                    <button class="header-button" data-action="toggle-user-actions" data-i18n-tooltip="admin.manageUsers.table.actionsTitle" ${disableActions ? 'disabled' : ''}>
                        <span class="material-symbols-rounded">more_vert</span>
                    </button>
                    <div class="module-content module-select disabled" id="user-actions-menu-${user.uuid}">
                        <div class="menu-content" data-menu-type="main-actions">
                            <div class="menu-list">
                                <div class="menu-link" data-action="show-role-menu">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">manage_accounts</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.changeRole"></span></div>
                                </div>
                                <div class="menu-link" data-action="show-status-menu">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">verified_user</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.manageStatus"></span></div>
                                </div>
                            </div>
                        </div>
                        <div class="menu-content" data-menu-type="role-actions" style="display: none;">
                            <div class="menu-list">
                                <div class="menu-link" data-action="hide-role-menu">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                                    <div class="menu-link-text"><span data-i18n="general.back"></span></div>
                                </div>
                                <div class="menu-link ${user.role === 'user' ? 'active' : ''}" data-action="change-role" data-uuid="${user.uuid}" data-role="user" data-username="${user.username}">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">person</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.makeUser"></span></div>
                                </div>
                                <div class="menu-link ${user.role === 'moderator' ? 'active' : ''}" data-action="change-role" data-uuid="${user.uuid}" data-role="moderator" data-username="${user.username}">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">shield_person</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.makeModerator"></span></div>
                                </div>
                                <div class="menu-link ${user.role === 'administrator' ? 'active' : ''}" data-action="change-role" data-uuid="${user.uuid}" data-role="administrator" data-username="${user.username}">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">admin_panel_settings</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.makeAdmin"></span></div>
                                </div>
                            </div>
                        </div>
                        <div class="menu-content" data-menu-type="status-actions" style="display: none;">
                            <div class="menu-list">
                                <div class="menu-link" data-action="hide-status-menu">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                                    <div class="menu-link-text"><span data-i18n="general.back"></span></div>
                                </div>
                                <div class="menu-link ${user.status === 'active' ? 'active' : ''}" data-action="change-status" data-uuid="${user.uuid}" data-status="active">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">check_circle</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.makeActive"></span></div>
                                </div>
                                <div class="menu-link ${user.status === 'suspended' ? 'active' : ''}" data-action="change-status" data-uuid="${user.uuid}" data-status="suspended">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">pause</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.makeSuspended"></span></div>
                                </div>
                                <div class="menu-link ${user.status === 'deleted' ? 'active' : ''}" data-action="change-status" data-uuid="${user.uuid}" data-status="deleted">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                                    <div class="menu-link-text"><span data-i18n="admin.manageUsers.table.actions.makeDeleted"></span></div>
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
        if (tableContainer) tableContainer.classList.add('disabled');
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
        }
    }
}

export function displayGalleriesAdmin(galleries, listContainer, statusContainer, append = false) {
    if (galleries.length > 0) {
        if(listContainer) listContainer.classList.remove('disabled');
        if(statusContainer) statusContainer.classList.add('disabled');
        
        galleries.forEach(gallery => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';

            const thumbnail = document.createElement('div');
            thumbnail.className = 'admin-list-item-thumbnail';

            if (gallery.profile_picture_url) {
                thumbnail.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.profile_picture_url}')`;
            } else {
                thumbnail.textContent = getInitials(gallery.name);
                thumbnail.classList.add('admin-list-item-thumbnail--initials');
            }
            
            const createdDate = new Date(gallery.created_at).toLocaleDateString();
            const detailsAndActions = `
                <div class="admin-list-item-details">
                    <div class="admin-list-item-title">${gallery.name}</div>
                    <div class="admin-list-item-meta">UUID: ${gallery.uuid} - ${window.getTranslation('general.created')}: ${createdDate}</div>
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

            item.appendChild(thumbnail);
            item.innerHTML += detailsAndActions;

            if (listContainer) listContainer.appendChild(item);
        });
    } else if (!append) {
        if(listContainer) listContainer.classList.add('disabled');
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
        }
    }
}

export function displayAdminComments(comments, tableBody, statusContainer, append = false) {
    const tableContainer = tableBody ? tableBody.closest('.admin-table-container') : null;

    if (comments.length > 0) {
        if (tableContainer) tableContainer.classList.remove('disabled');
        if (statusContainer) statusContainer.classList.add('disabled');
        
        comments.forEach(comment => {
            const row = document.createElement('tr');
            row.dataset.commentId = comment.id;
            const createdDate = new Date(comment.created_at).toLocaleString();
            const truncatedComment = comment.comment_text.length > 100 ? comment.comment_text.substring(0, 100) + '...' : comment.comment_text;

            const reportStatus = comment.pending_reports > 0 ? 'pending' : (comment.report_count > 0 ? 'reviewed' : 'active');
            const reportText = `${comment.report_count} (${comment.pending_reports} ${window.getTranslation('admin.manageComments.filter.pending')})`;

            let actionsMenu = '';
            if (comment.status === 'visible') {
                actionsMenu = `
                    <div class="menu-link" data-action="set-comment-status" data-id="${comment.id}" data-status="review">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">rate_review</span></div>
                        <div class="menu-link-text"><span data-i18n="admin.manageComments.table.actions.review"></span></div>
                    </div>
                    <div class="menu-link" data-action="set-comment-status" data-id="${comment.id}" data-status="deleted">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                        <div class="menu-link-text"><span data-i18n="admin.manageComments.table.actions.delete"></span></div>
                    </div>
                `;
            } else if (comment.status === 'review') {
                actionsMenu = `
                    <div class="menu-link" data-action="set-comment-status" data-id="${comment.id}" data-status="visible">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">visibility</span></div>
                        <div class="menu-link-text"><span data-i18n="admin.manageComments.table.actions.makeVisible"></span></div>
                    </div>
                    <div class="menu-link" data-action="set-comment-status" data-id="${comment.id}" data-status="deleted">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">delete</span></div>
                        <div class="menu-link-text"><span data-i18n="admin.manageComments.table.actions.delete"></span></div>
                    </div>
                `;
            } else if (comment.status === 'deleted') {
                actionsMenu = `
                    <div class="menu-link" data-action="set-comment-status" data-id="${comment.id}" data-status="visible">
                        <div class="menu-link-icon"><span class="material-symbols-rounded">restore</span></div>
                        <div class="menu-link-text"><span data-i18n="admin.manageComments.table.actions.restore"></span></div>
                    </div>
                `;
            }

            row.innerHTML = `
                <td title="${comment.comment_text}">${truncatedComment}</td>
                <td>
                    <div class="user-info">
                        <div class="user-initials-avatar">${getInitials(comment.username)}</div>
                        <div class="user-details">
                            <div class="username">${comment.username}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <a href="${window.BASE_PATH}/gallery/${comment.gallery_uuid}/photo/${comment.photo_id}" target="_blank" class="admin-comment-thumbnail-link">
                        <img src="${window.BASE_PATH}/${comment.photo_url}" class="admin-comment-thumbnail">
                    </a>
                </td>
                <td>
                    <span class="status-badge status-report-${reportStatus}">${reportText}</span>
                </td>
                <td><span class="status-badge status-comment-${comment.status}">${comment.status}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="item-actions">
                        <button class="header-button" data-action="toggle-comment-actions">
                            <span class="material-symbols-rounded">more_vert</span>
                        </button>
                        <div class="module-content module-select disabled">
                            <div class="menu-content">
                                <div class="menu-list">
                                    ${actionsMenu}
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            if (tableBody) tableBody.appendChild(row);
        });
    } else if (!append) {
        if(tableContainer) tableContainer.classList.add('disabled');
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageComments.noResultsTitle')}</h2><p>${window.getTranslation('admin.manageComments.noResultsMessage')}</p></div>`;
        }
    }
}

export function displayFeedback(feedbackItems, tableBody, statusContainer, append = false) {
    const tableContainer = tableBody ? tableBody.closest('.admin-table-container') : null;

    if (feedbackItems.length > 0) {
        if (tableContainer) tableContainer.classList.remove('disabled');
        if (statusContainer) statusContainer.classList.add('disabled');

        feedbackItems.forEach(item => {
            const row = document.createElement('tr');
            const createdDate = new Date(item.created_at).toLocaleString();
            const translatedType = window.getTranslation(`admin.manageFeedback.types.${item.issue_type}`) || item.issue_type;

            let attachmentsHTML = '';
            if (item.attachments && item.attachments.length > 0) {
                item.attachments.forEach(url => {
                    attachmentsHTML += `<a href="${window.BASE_PATH}/${url}" target="_blank"><img src="${window.BASE_PATH}/${url}" class="admin-comment-thumbnail"></a>`;
                });
            }

            row.innerHTML = `
                <td>${translatedType}</td>
                <td>${item.title || 'N/A'}</td>
                <td title="${item.description}">${item.description.substring(0, 150)}...</td>
                <td>${item.username || 'Anónimo'}</td>
                <td><div class="attachment-gallery">${attachmentsHTML}</div></td>
                <td>${createdDate}</td>
            `;
            if (tableBody) tableBody.appendChild(row);
        });
    } else if (!append) {
        if(tableContainer) tableContainer.classList.add('disabled');
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageFeedback.noResultsTitle')}</h2><p>${window.getTranslation('admin.manageFeedback.noResultsMessage')}</p></div>`;
        }
    }
}

export function renderUserProfile(data) {
    const section = document.querySelector('[data-section="userProfile"]');
    const container = document.getElementById('user-profile-container');
    if (!container || !section) return;

    // ✅ **INICIO DE LA CORRECCIÓN**
    const { user, comments, favorites, reports, sanctions, private: isPrivate } = data;
    section.dataset.uuid = user.uuid; 
    
    const actionsButton = section.querySelector('[data-action="toggle-select"][data-target="user-profile-actions-menu"]');
    if (actionsButton) {
        if (user.role === 'founder') {
            actionsButton.style.display = 'none';
        } else {
            actionsButton.style.display = 'flex';
        }
    }

    const createdDate = new Date(user.created_at).toLocaleDateString();
    const translatedRole = window.getTranslation(`admin.manageUsers.roles.${user.role}`) || user.role;
    
    // Generación condicional del HTML para sanciones y actividad
    const sanctionsHTML = isPrivate 
        ? `<p data-i18n="admin.userProfile.privateActivity"></p>`
        : (sanctions.length > 0 ? sanctions.map(s => `
            <div class="activity-item">
                <div class="activity-item-icon"><span class="material-symbols-rounded">gavel</span></div>
                <div class="activity-item-content">
                    <p><strong>${s.sanction_type}</strong> por ${s.admin_username}</p>
                    <p>${s.reason || '<i>Sin motivo especificado.</i>'}</p>
                    <div class="activity-item-meta">${new Date(s.created_at).toLocaleString()}</div>
                </div>
                <button class="header-button" data-action="delete-sanction" data-sanction-id="${s.id}" data-i18n-tooltip="admin.userProfile.sanctions.deleteTooltip">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        `).join('') : `<p data-i18n="admin.userProfile.sanctions.noSanctions"></p>`);

    let activityContentHTML = '';
    if (isPrivate) {
        activityContentHTML = `<div class="activity-list"><p data-i18n="admin.userProfile.privateActivity"></p></div>`;
    } else {
        const commentsHTML = comments.length > 0 ? comments.map(c => `
            <div class="activity-item">
                <div class="activity-item-icon"><span class="material-symbols-rounded">comment</span></div>
                <div class="activity-item-content">
                    <p>${c.comment_text}</p>
                    <div class="activity-item-meta">
                        Comentado en <a href="${window.BASE_PATH}/gallery/${c.gallery_uuid}/photo/${c.photo_id}/comments" target="_blank">${c.gallery_name}</a>
                        - ${new Date(c.created_at).toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('') : `<p data-i18n="admin.userProfile.activity.noComments"></p>`;
        
        const favoritesHTML = favorites.length > 0 ? favorites.map(f => `
            <div class="activity-item">
                <div class="activity-item-icon"><span class="material-symbols-rounded">favorite</span></div>
                <div class="activity-item-content">
                    <p>Marcó una <a href="${window.BASE_PATH}/gallery/${f.gallery_uuid}/photo/${f.photo_id}" target="_blank">foto</a> en <strong>${f.gallery_name}</strong> como favorita.</p>
                </div>
            </div>
        `).join('') : `<p data-i18n="admin.userProfile.activity.noFavorites"></p>`;

        const reportsHTML = reports.length > 0 ? reports.map(r => `
            <div class="activity-item">
                <div class="activity-item-icon"><span class="material-symbols-rounded">flag</span></div>
                <div class="activity-item-content">
                    <p>Reportó un <a href="${window.BASE_PATH}/gallery/${r.gallery_uuid}/photo/${r.photo_id}/comments" target="_blank">comentario</a> por: <strong>${r.reason}</strong></p>
                    <div class="activity-item-meta">Reportado el ${new Date(r.created_at).toLocaleString()}</div>
                </div>
            </div>
        `).join('') : `<p data-i18n="admin.userProfile.activity.noReports"></p>`;
        
        activityContentHTML = `
            <h4 data-i18n="admin.userProfile.activity.commentsTitle"></h4>
            <div class="activity-list">${commentsHTML}</div>
            <hr class="form-divider">
            <h4 data-i18n="admin.userProfile.activity.favoritesTitle"></h4>
            <div class="activity-list">${favoritesHTML}</div>
            <hr class="form-divider">
            <h4 data-i18n="admin.userProfile.activity.reportsTitle"></h4>
            <div class="activity-list">${reportsHTML}</div>
        `;
    }

    container.innerHTML = `
        <div class="profile-grid">
            <div class="profile-sidebar">
                <div class="profile-card">
                    <div class="profile-card-header">
                        <div class="profile-card-avatar">${getInitials(user.username)}</div>
                        <h2 class="profile-card-name">${user.username}</h2>
                        <span class="status-badge status-${user.status}">${user.status}</span>
                    </div>
                    <ul class="profile-card-info-list">
                        <li><span class="material-symbols-rounded">mail</span> ${user.email}</li>
                        <li><span class="material-symbols-rounded">shield</span> ${translatedRole}</li>
                        <li><span class="material-symbols-rounded">calendar_today</span> Se unió el ${createdDate}</li>
                    </ul>
                </div>
                <div class="profile-card">
                    <h3 class="profile-section-title" data-i18n="admin.userProfile.sanctions.title"></h3>
                    <div class="activity-list">${sanctionsHTML}</div>
                </div>
            </div>
            <div class="profile-main-content">
                <div class="profile-card">
                    <h3 class="profile-section-title" data-i18n="admin.userProfile.activity.title"></h3>
                    ${activityContentHTML}
                </div>
            </div>
        </div>
    `;
    // ✅ **FIN DE LA CORRECCIÓN**

    const titleEl = document.getElementById('user-profile-title');
    if (titleEl) {
        titleEl.textContent = `Perfil de ${user.username}`;
    }

    applyTranslations(container);
    initTooltips();
}