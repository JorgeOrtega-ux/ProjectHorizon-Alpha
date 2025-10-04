// assets/js/ui-controller.js

import { getFavorites, getHistory } from './main-controller.js';
import * as api from './api-handler.js';

function getInitials(name) {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length > 1 && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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

export function displayFavoritePhotos(currentFavoritesList, currentFavoritesSortBy) {
    const section = document.querySelector('[data-section="favorites"]');
    if (!section) return;

    const allPhotosContainer = section.querySelector('#favorites-grid-view');
    const byUserContainer = section.querySelector('#favorites-grid-view-by-user');
    const statusContainer = section.querySelector('.status-message-container');

    allPhotosContainer.innerHTML = '';
    byUserContainer.innerHTML = '';
    statusContainer.innerHTML = '';
    statusContainer.classList.add('disabled');

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
    window.applyTranslations(section);
}

export function displayHistory(historyProfilesShown, historyPhotosShown, historySearchesShown) {
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
        return;
    }

    await api.incrementPhotoInteraction(photoId);
    let currentRotation = 0;
    photoViewerImage.style.transform = `rotate(0deg)`;


    const photoIndex = photoList.findIndex(p => p.id == photoId);

    if (photoIndex !== -1) {
        const photo = photoList[photoIndex];

        const updateGalleryName = async () => {
            if (photo.gallery_name) {
                // currentGalleryNameForPhotoView = photo.gallery_name;
            }
            if (photoViewUserTitle && photo.gallery_name) {
                photoViewUserTitle.textContent = photo.gallery_name;
            } else {
                const response = await api.getGalleryDetails(uuid);
                if (response.ok) {
                    const gallery = response.data;
                    if (gallery && gallery.name) {
                        // currentGalleryNameForPhotoView = gallery.name;
                        if (photoViewUserTitle) photoViewUserTitle.textContent = gallery.name;
                    }
                }
            }
        };

        await updateGalleryName();

        let currentPhotoData = {
            id: photo.id,
            gallery_uuid: uuid,
            photo_url: photo.photo_url,
            gallery_name: photo.gallery_name,
            profile_picture_url: photo.profile_picture_url
        };

        photoViewerImage.src = photo.photo_url;
        photoCounter.textContent = `${photoIndex + 1} / ${photoList.length}`;
        // currentGalleryForPhotoView = uuid;

        window.addToHistory('photos', {
            id: currentPhotoData.id,
            gallery_uuid: currentPhotoData.gallery_uuid,
            photo_url: currentPhotoData.photo_url,
            gallery_name: currentPhotoData.gallery_name,
            profile_picture_url: currentPhotoData.profile_picture_url
        });

        window.updateFavoriteButtonState(photo.id);

        if (prevButton) prevButton.classList.toggle('disabled-nav', photoIndex === 0);
        if (nextButton) nextButton.classList.toggle('disabled-nav', photoIndex === photoList.length - 1);
    } else {
        console.error("Photo not found in list, navigating to 404.");
        window.handleStateChange('main', '404');
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
            <img src="${photo.photo_url}" alt="Miniatura">
            <button class="delete-photo-btn" data-action="delete-gallery-photo" data-photo-id="${photo.id}">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    `;
    });

    container.innerHTML = `
    <div class="edit-section">
        <div class="profile-picture-edit-container">
            <div class="profile-info-wrapper">
                <div class="profile-picture-preview" style="background-image: url('${gallery.profile_picture_url || ''}')"></div>
                <div class="profile-text-wrapper">
                    <div class="profile-main-text">${gallery.name}</div>
                    <div class="profile-sub-text" data-i18n="admin.editGallery.profilePictureTitle"></div>
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

export function displayUsers(users, tableBody, statusContainer, append = false) {
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
}

export function displayGalleriesAdmin(galleries, listContainer, statusContainer, append = false) {
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
}