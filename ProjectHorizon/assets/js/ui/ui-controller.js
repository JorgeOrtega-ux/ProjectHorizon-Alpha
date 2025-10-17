// assets/js/ui/ui-controller.js

import { getHistory } from '../core/api-handler.js';
import * as api from '../core/api-handler.js';
import { initTooltips } from '../managers/tooltip-manager.js';

function formatNumberWithCommas(number) {
    if (number === null || number === undefined) {
        return '0';
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function setupFormattedInput(inputElement) {
    inputElement.addEventListener('blur', () => {
        const numericValue = parseInt(inputElement.value.replace(/,/g, ''), 10);
        if (!isNaN(numericValue)) {
            inputElement.value = formatNumberWithCommas(numericValue);
        }
    });

    inputElement.addEventListener('focus', () => {
        inputElement.value = inputElement.value.replace(/,/g, '');
    });
}

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
    const unlockDurationMinutes = window.UNLOCK_DURATION || 60;
    const unlockDurationMilliseconds = unlockDurationMinutes * 60 * 1000;
    const remainingTime = unlockedTimestamp + unlockDurationMilliseconds - now;

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

    const byDateContainer = section.querySelector('#favorites-by-date-view');
    const photosSection = section.querySelector('#favorites-photos-section');
    const videosSection = section.querySelector('#favorites-videos-section');
    const photosGrid = section.querySelector('#favorites-photos-grid');
    const videosGrid = section.querySelector('#favorites-videos-grid');
    const byUserContainer = section.querySelector('#favorites-grid-view-by-user');
    const statusContainer = section.querySelector('.status-message-container');

    // Reset all views
    byDateContainer.style.display = 'none';
    photosSection.style.display = 'none';
    videosSection.style.display = 'none';
    photosGrid.innerHTML = '';
    videosGrid.innerHTML = '';
    byUserContainer.style.display = 'none';
    byUserContainer.innerHTML = '';
    statusContainer.innerHTML = '';
    statusContainer.classList.add('disabled');
    
    if (!isLoggedIn) {
        statusContainer.classList.remove('disabled');
        statusContainer.innerHTML = `<div><h2>${window.getTranslation('favorites.noFavoritesTitle')}</h2><p>${window.getTranslation('favorites.noFavoritesMessage')}</p></div>`;
        return;
    }

    if (currentFavoritesList.length === 0) {
        statusContainer.classList.remove('disabled');
        statusContainer.innerHTML = `<div><h2>${window.getTranslation('favorites.noFavoritesTitle')}</h2><p>${window.getTranslation('favorites.noFavoritesMessage')}</p></div>`;
        return;
    }

    if (currentFavoritesSortBy === 'user') {
        byUserContainer.style.display = 'grid';

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

    } else { // 'newest' or 'oldest'
        byDateContainer.style.display = 'block';
        const favoritePhotos = currentFavoritesList.filter(item => item.type === 'photo');
        const favoriteVideos = currentFavoritesList.filter(item => item.type === 'video');

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
                const addedDate = window.getTranslation('general.added', { date: new Date(video.added_at).toLocaleString() });
                const profilePicUrl = video.profile_picture_url ? `${window.BASE_PATH}/${video.profile_picture_url}` : '';
                card.innerHTML += `
                    <div class="card-content-overlay">
                        <div class="card-icon" style="background-image: url('${profilePicUrl}')"></div>
                        <div class="card-text">
                            <span>${video.gallery_name}</span>
                            <span style="font-size: 0.8rem; display: block;">${addedDate}</span>
                        </div>
                    </div>
                    <div class="card-actions-container">
                        <div class="card-hover-overlay">
                            <div class="card-hover-icons">
                                <div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${video.id}"><span class="material-symbols-rounded">favorite</span></div>
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
                videosGrid.appendChild(card);
            });
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
                item.className = 'admin-list-item'; // Cambio de clase
                const searchedInText = window.getTranslation('general.searchedIn', { section: search.section });
                const visitedDate = new Date(search.visited_at).toLocaleString();

                item.innerHTML = `
                    <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                        <span class="material-symbols-rounded">search</span>
                    </div>
                    <div class="admin-list-item-details">
                        <div class="admin-list-item-title">"${search.term}"</div>
                        <div class="admin-list-item-meta-badges">
                            <span class="info-badge-admin">${searchedInText}</span>
                            <span class="info-badge-admin">${visitedDate}</span>
                        </div>
                    </div>
                    <div class="admin-list-item-actions">
                        <button class="header-button" data-action="delete-search-item" data-timestamp="${search.visited_at}" data-tooltip="Eliminar">
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
            const searchStatusContainer = document.querySelector('[data-history-view="searches"] .settings-page-container .status-message-container');
            if(searchStatusContainer) {
                 if (isSearchHistoryPaused) {
                    searchStatusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.searchesPausedTitle')}</h2><p>${window.getTranslation('settings.history.searchesPausedMessage')}</p></div>`;
                } else {
                    searchStatusContainer.innerHTML = `<div><h2>${window.getTranslation('settings.history.noSearchesTitle')}</h2><p>${window.getTranslation('settings.history.noSearchesMessage')}</p></div>`;
                }
                searchStatusContainer.classList.remove('disabled');
            }
        }
    }
    window.applyTranslations(mainContainer);
}

export async function renderPhotoView(uuid, photoId, photoList) {
    const photoViewerImage = document.getElementById('photo-viewer-image');
    const photoViewerVideo = document.getElementById('photo-viewer-video');
    const photoCounter = document.getElementById('photo-counter');
    const photoViewUserTitle = document.getElementById('photo-view-user-title');
    const prevButton = document.querySelector('[data-action="previous-photo"]');
    const nextButton = document.querySelector('[data-action="next-photo"]');
    const playPauseBtn = document.querySelector('[data-action="toggle-play-pause"]');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('.material-symbols-rounded') : null;

    if (!photoViewerImage || !photoViewerVideo) {
        console.error("Photo/video viewer elements not found in the DOM.");
        return null; 
    }

    await api.incrementPhotoInteraction(photoId);
    await api.incrementGalleryInteraction(uuid);
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

        if (photo.type === 'video') {
            photoViewerImage.style.display = 'none';
            photoViewerVideo.style.display = 'block';
            photoViewerVideo.src = `${window.BASE_PATH}/${photo.photo_url}`;
            playPauseBtn.style.display = 'flex';

            photoViewerVideo.play().catch(error => {
                console.warn("La reproducción automática fue bloqueada:", error);
                if (playPauseIcon) playPauseIcon.textContent = 'play_arrow';
            });
            if (playPauseIcon) playPauseIcon.textContent = 'pause';

        } else {
            photoViewerVideo.style.display = 'none';
            photoViewerImage.style.display = 'block';
            photoViewerImage.src = `${window.BASE_PATH}/${photo.photo_url}`;
            playPauseBtn.style.display = 'none';
        }

        photoCounter.textContent = `${photoIndex + 1} / ${photoList.length}`;

        const currentPhotoDataForExport = {
            id: photo.id,
            gallery_uuid: uuid,
            photo_url: photo.photo_url,
            type: photo.type,
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
    const container = document.getElementById('edit-gallery-form-container');
    const titleEl = document.getElementById('edit-gallery-title');
    const pathParts = window.location.pathname.split('/');
    const uuid = pathParts[pathParts.length - 1];

    if (!container || !titleEl) return;

    titleEl.textContent = window.getTranslation('admin.editGallery.title', { galleryName: gallery.name });
    titleEl.removeAttribute('data-i18n');

    let profilePicHTML;
    if (gallery.profile_picture_url) {
        const profilePicUrl = `${window.BASE_PATH}/${gallery.profile_picture_url}`;
        profilePicHTML = `<div class="profile-picture-preview" style="background-image: url('${profilePicUrl}')"></div>`;
    } else {
        profilePicHTML = `<div class="profile-picture-preview profile-picture-preview--initials">${getInitials(gallery.name)}</div>`;
    }

    const createdDate = new Date(gallery.created_at).toLocaleString();
    const photoCount = gallery.photos ? gallery.photos.length : 0;
    const photoCountText = photoCount === 1 ? '1 foto' : `${photoCount} fotos`;

    container.innerHTML = `
    <div class="edit-section">
        <div class="profile-picture-edit-container">
            <div class="profile-info-wrapper">
                ${profilePicHTML}
                <div class="profile-text-wrapper">
                    <div class="profile-main-text" data-i18n="admin.editGallery.profilePictureTitle"></div>
                    <div class="profile-sub-text" data-i18n="admin.editGallery.profilePictureDescription"></div>
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

    <div class="edit-section content-section-stacked" id="social-links-view-section">
        <div class="item-details">
            <h4 data-i18n="admin.editGallery.socialsSectionTitle"></h4>
            <p data-i18n="admin.editGallery.socialsSectionDescription"></p>
        </div>
        <div class="item-actions">
            <button type="button" class="load-more-btn btn-primary" id="manage-social-links-btn" data-i18n="admin.editGallery.manageSocialsButton"></button>
        </div>
    </div>

    <div class="edit-section" id="social-links-edit-section" style="display: none;">
        <div class="form-group-inline" style="flex-direction: column; align-items: stretch; gap: 16px;">
            <label class="form-label standalone" data-i18n="admin.editGallery.socialsSectionTitle"></label>
            <div id="social-links-container" class="social-links-container"></div>
            <div class="form-group-buttons" style="justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
                <button type="button" class="load-more-btn" id="cancel-socials-btn" data-i18n="general.cancel"></button>
                <button type="button" class="load-more-btn btn-primary" id="save-socials-btn" data-i18n="general.save"></button>
            </div>
        </div>
    </div>

    <div class="edit-section content-section-stacked">
        <div class="item-details">
            <div class="title-with-badge">
                <h4 data-i18n="admin.editGallery.photosSectionTitle"></h4>
                <span class="photo-count-badge">${photoCountText}</span>
            </div>
            <p data-i18n="admin.editGallery.photosSectionDescription"></p>
        </div>
        <div class="item-actions">
            <button class="load-more-btn btn-primary" data-action="manage-gallery-photos" data-uuid="${uuid}">
                <span class="button-text" data-i18n="admin.editGallery.managePhotosButton"></span>
            </button>
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
    const saveSocialsBtn = container.querySelector('#save-socials-btn');
    const privacyToggle = container.querySelector('#gallery-privacy-edit');
    const visibilityToggle = container.querySelector('#gallery-visibility-edit');
    const manageSocialsBtn = container.querySelector('#manage-social-links-btn');
    const socialLinksViewSection = container.querySelector('#social-links-view-section');
    const socialLinksEditSection = container.querySelector('#social-links-edit-section');
    const socialLinksContainer = container.querySelector('#social-links-container');
    const cancelSocialsBtn = container.querySelector('#cancel-socials-btn');

    const socialPlatforms = ['facebook', 'instagram', 'x', 'youtube', 'twitch', 'onlyfans'];

    function renderSocialLinks() {
        socialLinksContainer.innerHTML = '';
        socialPlatforms.forEach(platform => {
            const value = gallery.social_links && gallery.social_links[platform] ? gallery.social_links[platform] : '';
            const socialLinkHTML = `
                <div class="form-group-inline">
                    <label class="form-label standalone">${platform.charAt(0).toUpperCase() + platform.slice(1)} URL</label>
                    <input type="url" class="feedback-input social-link-input" data-platform="${platform}" value="${value}" placeholder="https://...">
                </div>
            `;
            socialLinksContainer.innerHTML += socialLinkHTML;
        });
    }

    if (manageSocialsBtn) {
        manageSocialsBtn.addEventListener('click', () => {
            renderSocialLinks();
            socialLinksViewSection.style.display = 'none';
            socialLinksEditSection.style.display = 'block';
        });
    }

    if (cancelSocialsBtn) {
        cancelSocialsBtn.addEventListener('click', () => {
            socialLinksViewSection.style.display = 'flex';
            socialLinksEditSection.style.display = 'none';
        });
    }

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
    
    if (saveSocialsBtn) {
        saveSocialsBtn.addEventListener('click', () => {
            const socialInputs = container.querySelectorAll('.social-link-input');
            const socials = Array.from(socialInputs).map(input => {
                const platform = input.dataset.platform;
                return {
                    platform: platform,
                    url: input.value.trim()
                }
            }).filter(s => s.url && s.platform);

            const formData = new FormData();
            formData.append('action_type', 'update_gallery_socials');
            formData.append('uuid', uuid);
            formData.append('socials', JSON.stringify(socials));

            api.postDataWithCsrf(formData).then(response => {
                if(response.ok) {
                    window.showNotification(response.data.message, 'success');
                    socialLinksViewSection.style.display = 'flex';
                    socialLinksEditSection.style.display = 'none';
                } else {
                    window.showNotification(response.data.message || 'Error al guardar las redes sociales.', 'error');
                }
            });
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
}

export function renderCreateGalleryForm(appState) {
    const container = document.getElementById('create-gallery-form-container');
    if (!container) return;

    if (!appState.newGalleryState.socials) {
        appState.newGalleryState.socials = {};
    }

    container.innerHTML = `
    <div class="edit-section">
        <div class="profile-picture-edit-container">
            <div class="profile-info-wrapper">
                <div class="profile-picture-preview" id="profile-picture-preview-create"></div>
                <div class="profile-text-wrapper">
                    <div class="profile-main-text" data-i18n="admin.editGallery.profilePictureTitle"></div>
                    <div class="profile-sub-text" data-i18n="admin.editGallery.profilePictureDescription"></div>
                </div>
            </div>
            <input type="file" id="profile-picture-upload-create" accept="image/*" style="display: none;">
            <button class="load-more-btn" onclick="document.getElementById('profile-picture-upload-create').click();" data-i18n="admin.editGallery.changeButton"></button>
        </div>
    </div>

    <div class="edit-section">
        <div class="form-group-inline">
            <label class="form-label standalone" data-i18n="admin.editGallery.nameLabel"></label>
            <input type="text" id="gallery-name-create" class="feedback-input" placeholder="Nombre de la galería" maxlength="100" value="${appState.newGalleryState.name || ''}">
        </div>
    </div>
    
    <div class="edit-section content-section-stacked" id="social-links-view-section-create">
        <div class="item-details">
            <h4 data-i18n="admin.createGallery.socialsSectionTitle"></h4>
            <p data-i18n="admin.createGallery.socialsSectionDescription"></p>
        </div>
        <div class="item-actions">
            <button type="button" class="load-more-btn btn-primary" id="manage-social-links-btn-create" data-i18n="admin.editGallery.manageSocialsButton"></button>
        </div>
    </div>

    <div class="edit-section" id="social-links-edit-section-create" style="display: none;">
        <div class="form-group-inline" style="flex-direction: column; align-items: stretch; gap: 16px;">
            <label class="form-label standalone" data-i18n="admin.editGallery.socialsSectionTitle"></label>
            <div id="social-links-container-create" class="social-links-container"></div>
            <div class="form-group-buttons" style="justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
                 <button type="button" class="load-more-btn" id="cancel-socials-btn-create" data-i18n="general.cancel"></button>
                 <button type="button" class="load-more-btn btn-primary" id="save-socials-btn-create" data-i18n="general.save"></button>
            </div>
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
                    <div class="toggle-switch btn-primary ${appState.newGalleryState.privacy ? 'active' : ''}" id="gallery-privacy-create">
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
                    <div class="toggle-switch btn-primary ${appState.newGalleryState.visibility ? 'active' : ''}" id="gallery-visibility-create">
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
    
    const visibilityToggle = container.querySelector('#gallery-visibility-create');
    if (visibilityToggle) {
        visibilityToggle.addEventListener('click', () => visibilityToggle.classList.toggle('active'));
    }

    const profilePicInput = document.getElementById('profile-picture-upload-create');
    const profilePicPreview = document.getElementById('profile-picture-preview-create');
    if (profilePicInput && profilePicPreview) {
        profilePicInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                appState.newGalleryState.profilePictureFile = event.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('profile-picture-preview-create');
                    if(preview) preview.style.backgroundImage = `url('${e.target.result}')`;
                };
                reader.readAsDataURL(event.target.files[0]);
            }
        });
    }
    
    const manageSocialsBtnCreate = container.querySelector('#manage-social-links-btn-create');
    const socialLinksViewSectionCreate = container.querySelector('#social-links-view-section-create');
    const socialLinksEditSectionCreate = container.querySelector('#social-links-edit-section-create');
    const socialLinksContainerCreate = container.querySelector('#social-links-container-create');
    const cancelSocialsBtnCreate = container.querySelector('#cancel-socials-btn-create');
    const saveSocialsBtnCreate = container.querySelector('#save-socials-btn-create');

    const socialPlatforms = ['facebook', 'instagram', 'x', 'youtube', 'twitch', 'onlyfans'];

    if (manageSocialsBtnCreate) {
        manageSocialsBtnCreate.addEventListener('click', () => {
            socialLinksContainerCreate.innerHTML = socialPlatforms.map(platform => {
                const savedUrl = appState.newGalleryState.socials[platform] || '';
                return `
                <div class="form-group-inline">
                    <label class="form-label standalone">${platform.charAt(0).toUpperCase() + platform.slice(1)} URL</label>
                    <input type="url" class="feedback-input social-link-input" data-platform="${platform}" placeholder="https://..." value="${savedUrl}">
                </div>
            `}).join('');
            socialLinksViewSectionCreate.style.display = 'none';
            socialLinksEditSectionCreate.style.display = 'block';
        });
    }

    const closeSocialsEditor = () => {
        socialLinksViewSectionCreate.style.display = 'flex';
        socialLinksEditSectionCreate.style.display = 'none';
    };

    if (cancelSocialsBtnCreate) {
        cancelSocialsBtnCreate.addEventListener('click', closeSocialsEditor);
    }
    
    if (saveSocialsBtnCreate) {
        saveSocialsBtnCreate.addEventListener('click', () => {
            appState.newGalleryState.socials = {}; // Limpiar antes de guardar
            socialLinksContainerCreate.querySelectorAll('.social-link-input').forEach(input => {
                const platform = input.dataset.platform;
                const url = input.value.trim();
                if (platform && url) {
                    appState.newGalleryState.socials[platform] = url;
                }
            });
            showNotification('Redes sociales guardadas temporalmente.', 'success');
            closeSocialsEditor();
        });
    }

    initTooltips();
}

export function displayUsers(users, listContainer, statusContainer, append = false, searchTerm = '') {
    const section = document.querySelector('[data-section="manageUsers"]');
    if (!section || !listContainer || !statusContainer) return;

    if (users.length > 0) {
        listContainer.classList.remove('disabled');
        statusContainer.classList.add('disabled');

        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.dataset.uuid = user.uuid;
            item.dataset.name = user.username;
            item.dataset.role = user.role;

            const createdDate = new Date(user.created_at).toLocaleDateString();
            const translatedRole = window.getTranslation(`admin.manageUsers.roles.${user.role}`) || user.role;

            item.innerHTML = `
                <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                    ${getInitials(user.username)}
                </div>
                <div class="admin-list-item-details">
                    <div class="admin-list-item-title">${user.username}</div>
                    <div class="admin-list-item-meta">${user.email}</div>
                    <div class="admin-list-item-meta-badges">
                        <span class="role-badge role-${user.role}">${translatedRole}</span>
                        <span class="status-badge status-${user.status}">${user.status}</span>
                        <span class="info-badge-admin">${window.getTranslation('general.created')}: ${createdDate}</span>
                    </div>
                </div>
            `;
            listContainer.appendChild(item);
        });
    } else if (!append) {
        listContainer.classList.add('disabled');
        statusContainer.classList.remove('disabled');
        if (searchTerm) {
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
        } else {
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageUsers.noUsersTitle')}</h2><p>${window.getTranslation('admin.manageUsers.noUsersMessage')}</p></div>`;
        }
    }
}


export function displayGalleriesAdmin(galleries, listContainer, statusContainer, append = false, searchTerm = '') {
    if (galleries.length > 0) {
        if(listContainer) listContainer.classList.remove('disabled');
        if(statusContainer) statusContainer.classList.add('disabled');
        
        galleries.forEach(gallery => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.dataset.uuid = gallery.uuid;
            item.dataset.name = gallery.name;

            const thumbnail = document.createElement('div');
            thumbnail.className = 'admin-list-item-thumbnail';

            if (gallery.profile_picture_url) {
                thumbnail.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.profile_picture_url}')`;
            } else {
                thumbnail.textContent = getInitials(gallery.name);
                thumbnail.classList.add('admin-list-item-thumbnail--initials');
            }
            
            const createdDate = new Date(gallery.created_at).toLocaleDateString();
            
            // --- INICIO DE LA MODIFICACIÓN ---
            const detailsAndActions = `
                <div class="admin-list-item-details">
                    <div class="admin-list-item-title">${gallery.name}</div>
                    <div class="admin-list-item-meta-badges">
                        <span class="info-badge-admin">UUID: ${gallery.uuid}</span>
                        <span class="info-badge-admin">${window.getTranslation('general.created')}: ${createdDate}</span>
                    </div>
                </div>
            `;
            // --- FIN DE LA MODIFICACIÓN ---

            item.appendChild(thumbnail);
            item.innerHTML += detailsAndActions;

            if (listContainer) listContainer.appendChild(item);
        });
    } else if (!append) {
        if(listContainer) listContainer.classList.add('disabled');
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            if (searchTerm) {
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
            } else {
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageContent.noGalleriesTitle')}</h2><p>${window.getTranslation('admin.manageContent.noGalleriesMessage')}</p></div>`;
            }
        }
    }
}

export function displayAdminComments(comments, listContainer, statusContainer, append = false, searchTerm = '') {
    if (comments.length > 0) {
        listContainer.classList.remove('disabled');
        statusContainer.classList.add('disabled');
        
        comments.forEach(comment => {
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.dataset.id = comment.id;

            const createdDate = new Date(comment.created_at).toLocaleString();
            const truncatedComment = comment.comment_text.length > 100 ? comment.comment_text.substring(0, 100) + '...' : comment.comment_text;

            const reportStatus = comment.pending_reports > 0 ? 'pending' : (comment.report_count > 0 ? 'reviewed' : 'active');
            const reportText = `${comment.report_count} (${comment.pending_reports} ${window.getTranslation('admin.manageComments.filter.pending')})`;

            item.innerHTML = `
                <div class="admin-list-item-thumbnail">
                    <img src="${window.BASE_PATH}/${comment.photo_url}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div class="admin-list-item-details">
                    <div class="admin-list-item-title" title="${comment.comment_text}">${truncatedComment}</div>
                    <div class="admin-list-item-meta">Por: ${comment.username}</div>
                    <div class="admin-list-item-meta-badges">
                        <span class="status-badge status-report-${reportStatus}">${reportText}</span>
                        <span class="status-badge status-comment-${comment.status}">${comment.status}</span>
                        <span class="info-badge-admin">${createdDate}</span>
                    </div>
                </div>
            `;
            listContainer.appendChild(item);
        });
    } else if (!append) {
        listContainer.classList.add('disabled');
        statusContainer.classList.remove('disabled');
        if (searchTerm) {
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
        } else {
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageComments.noCommentsTitle')}</h2><p>${window.getTranslation('admin.manageComments.noCommentsMessage')}</p></div>`;
        }
    }
}

export function displayFeedback(feedbackItems, listContainer, statusContainer, append = false, searchTerm = '') {
    if (feedbackItems.length > 0) {
        listContainer.classList.remove('disabled');
        statusContainer.classList.add('disabled');

        feedbackItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'admin-list-item';
            itemEl.dataset.uuid = item.uuid;
            
            const createdDate = new Date(item.created_at).toLocaleString();
            const translatedType = window.getTranslation(`admin.manageFeedback.types.${item.issue_type}`) || item.issue_type;
            const title = item.title || item.description.substring(0, 50) + '...';

            let attachmentsHTML = '';
            if (item.attachments && item.attachments.length > 0) {
                attachmentsHTML = `<span class="info-badge-admin">${item.attachments.length} adjuntos</span>`;
            }

            itemEl.innerHTML = `
                <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                    <span class="material-symbols-rounded">rate_review</span>
                </div>
                <div class="admin-list-item-details">
                    <div class="admin-list-item-title">${title}</div>
                    <div class="admin-list-item-meta">Por: ${item.username || 'Anónimo'}</div>
                    <div class="admin-list-item-meta-badges">
                        <span class="info-badge-admin">${translatedType}</span>
                        ${attachmentsHTML}
                        <span class="info-badge-admin">${createdDate}</span>
                    </div>
                </div>
            `;
            listContainer.appendChild(itemEl);
        });
    } else if (!append) {
        listContainer.classList.add('disabled');
        statusContainer.classList.remove('disabled');
        if (searchTerm) {
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
        } else {
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageFeedback.noFeedbackTitle')}</h2><p>${window.getTranslation('admin.manageFeedback.noFeedbackMessage')}</p></div>`;
        }
    }
}


export function renderUserProfile(data) {
    const section = document.querySelector('[data-section="userProfile"]');
    const container = document.getElementById('user-profile-container');
    if (!container || !section) return;

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
            <div class="profile-card profile-card--header">
                <div class="profile-card-header">
                    <div class="profile-card-avatar">${getInitials(user.username)}</div>
                    <div class="profile-card-main-info">
                        <h2 class="profile-card-name">${user.username}</h2>
                        <span class="status-badge status-${user.status}">${user.status}</span>
                    </div>
                </div>
                <div class="profile-card-info-badges">
                    <div class="info-badge">
                        <span class="material-symbols-rounded">mail</span>
                        <span>${user.email}</span>
                    </div>
                    <div class="info-badge">
                        <span class="material-symbols-rounded">shield</span>
                        <span>${translatedRole}</span>
                    </div>
                    <div class="info-badge">
                        <span class="material-symbols-rounded">calendar_today</span>
                        <span>Se unió el ${createdDate}</span>
                    </div>
                </div>
            </div>
            <div class="profile-card">
                <h3 class="profile-section-title" data-i18n="admin.userProfile.sanctions.title"></h3>
                <div class="activity-list">${sanctionsHTML}</div>
            </div>
            <div class="profile-card">
                <h3 class="profile-section-title" data-i18n="admin.userProfile.activity.title"></h3>
                ${activityContentHTML}
            </div>
        </div>
    `;


    const titleEl = document.getElementById('user-profile-title');
    if (titleEl) {
        titleEl.textContent = `Perfil de ${user.username}`;
    }

    applyTranslations(container);
    initTooltips();
}

export function renderGalleryStats(data) {
    const container = document.getElementById('gallery-stats-container');
    const titleEl = document.getElementById('gallery-stats-title');

    if (!container || !titleEl) return;

    titleEl.textContent = window.getTranslation('admin.galleryStats.title', { galleryName: data.name });
    
    let photosHTML = data.photos.map(photo => `
        <tr>
            <td>
                <div class="photo-stats-info">
                    <img src="${window.BASE_PATH}/${photo.photo_url}" class="photo-stats-thumbnail">
                    <span>ID: ${photo.id}</span>
                </div>
            </td>
            <td><input type="text" inputmode="numeric" class="feedback-input stat-input" data-photoid="${photo.id}" data-stat="likes" value="${formatNumberWithCommas(photo.likes)}"></td>
            <td><input type="text" inputmode="numeric" class="feedback-input stat-input" data-photoid="${photo.id}" data-stat="interactions" value="${formatNumberWithCommas(photo.interactions)}"></td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="dashboard-row">
            <div class="stat-card">
                <div class="stat-card-icon"><span class="material-symbols-rounded">favorite</span></div>
                <div class="stat-card-info">
                    <span class="stat-card-title" data-i18n="admin.galleryStats.totalLikes"></span>
                    <input type="text" inputmode="numeric" id="total-likes-input" class="stat-card-value-input" value="${formatNumberWithCommas(data.total_likes)}">
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon"><span class="material-symbols-rounded">visibility</span></div>
                <div class="stat-card-info">
                    <span class="stat-card-title" data-i18n="admin.galleryStats.totalInteractions"></span>
                    <input type="text" inputmode="numeric" id="total-interactions-input" class="stat-card-value-input" value="${formatNumberWithCommas(data.total_interactions)}">
                </div>
            </div>
        </div>
        <div class="dashboard-row">
            <div class="dashboard-list-container" style="grid-column: 1 / -1;">
                <h4 data-i18n="admin.galleryStats.individualStats"></h4>
                <div class="admin-table-container">
                    <table id="photo-stats-table" class="body-title">
                        <thead>
                            <tr>
                                <th data-i18n="admin.galleryStats.photo"></th>
                                <th data-i18n="admin.galleryStats.likes"></th>
                                <th data-i18n="admin.galleryStats.interactions"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${photosHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    window.applyTranslations(container);

    container.querySelectorAll('.stat-input, .stat-card-value-input').forEach(input => {
        setupFormattedInput(input);
    });
}