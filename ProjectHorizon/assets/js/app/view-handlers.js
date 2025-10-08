// assets/js/app/view-handlers.js

import * as api from '../core/api-handler.js';
import { showNotification } from '../managers/notification-manager.js';
import {
    displayGalleriesAsGrid,
    displayFavoritePhotos,
    displayHistory,
    renderPhotoView,
    renderEditGalleryForm,
    displayUsers,
    displayGalleriesAdmin,
    displayAdminComments
} from '../ui/ui-controller.js';

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

export async function fetchAndDisplayGalleries(sortBy = 'relevant', searchTerm = '', append = false, state) {
    if (state.isLoading) return;
    state.isLoading = true;

    if (searchTerm) {
        window.addToHistory('search', { term: searchTerm, section: 'home' });
    }

    const section = document.querySelector('[data-section="home"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const gridContainer = section.querySelector('#grid-view');
    const statusContainer = section.querySelector('.status-message-container');

    if (!append) {
        state.currentPage = 1;
        if (gridContainer) gridContainer.innerHTML = '';
        if (gridContainer) gridContainer.classList.add('disabled');
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getGalleries(sortBy, searchTerm, state.currentPage, state.batchSize);
    state.isLoading = false;

    if (response.ok) {
        const data = response.data;
        if (statusContainer) {
            statusContainer.classList.add('disabled');
            statusContainer.innerHTML = '';
        }

        if (gridContainer) gridContainer.classList.remove('disabled');

        if (data.length > 0) {
            displayGalleriesAsGrid(data, gridContainer, sortBy, append);
        } else if (!append) {
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                if (searchTerm) {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
                } else {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('home.noGalleriesTitle')}</h2><p>${window.getTranslation('home.noGalleriesMessage')}</p></div>`;
                }
            }
            if (gridContainer) gridContainer.classList.add('disabled');
        }

        const loadMoreContainer = document.getElementById('users-load-more-container');
        if (loadMoreContainer) {
            if (data.length < state.batchSize) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                state.currentPage++;
            }
        }
    } else {
        console.error('Error al obtener las galerías:', response.data);
        if (!append) {
            displayFetchError('[data-section="home"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        } else {
            showNotification(window.getTranslation('general.connectionErrorMessage'), 'error');
        }
    }
}

export async function fetchAndDisplayGalleryPhotos(uuid, galleryName, append = false, state) {
    const section = document.querySelector('[data-section="galleryPhotos"]');
    if (!section) return;

    const grid = section.querySelector('#user-photos-grid');
    const statusContainer = section.querySelector('.status-message-container');
    const title = section.querySelector('#user-photos-title');
    const loadMoreContainer = section.querySelector('#photos-load-more-container');

    if (!append) {
        state.currentPage = 1;
        state.photoList = [];
        if (title) title.textContent = galleryName || window.getTranslation('general.loading');
        if (grid) grid.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    if (state.isLoading) return;
    state.isLoading = true;

    const response = await api.getGalleryPhotos(uuid, state.currentPage, state.batchSize);
    state.isLoading = false;

    if (response.ok) {
        const photos = response.data;
        if (statusContainer) {
            statusContainer.classList.add('disabled');
            statusContainer.innerHTML = '';
        }
        if (grid) grid.classList.remove('disabled');

        state.photoList.push(...photos);

        if (photos.length > 0) {
            photos.forEach(photo => {
                const card = document.createElement('div');
                card.className = 'card photo-card';
                card.dataset.photoUrl = photo.photo_url;
                card.dataset.photoId = photo.id;
                card.dataset.galleryUuid = photo.gallery_uuid;

                const background = document.createElement('div');
                background.className = 'card-background';
                background.style.backgroundImage = `url('${window.BASE_PATH}/${photo.photo_url}')`;
                card.appendChild(background);

                const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${uuid}/photo/${photo.id}`;

                card.innerHTML += `
                    <div class="card-actions-container">
                        <div class="card-hover-overlay">
                            <div class="card-hover-icons">
                                <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div>
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
                    </div>
                `;

                if (grid) grid.appendChild(card);
                window.updateFavoriteCardState(photo.id);
            });
        } else if (!append && statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('userPhotos.emptyGalleryTitle')}</h2><p>${window.getTranslation('userPhotos.emptyGalleryMessage')}</p></div>`;
        }

        if (loadMoreContainer) {
            if (photos.length < state.batchSize) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                state.currentPage++;
            }
        }
    } else {
        console.error('Error al obtener las fotos:', response.data);
        if (!append) {
            displayFetchError('[data-section="galleryPhotos"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        } else {
            showNotification(window.getTranslation('general.connectionErrorMessage'), 'error');
        }
    }
}

export async function fetchAndDisplayTrends(searchTerm = '') {
    const section = document.querySelector('[data-section="trends"]');
    if (!section) return [];

    if (searchTerm) {
        window.addToHistory('search', { term: searchTerm, section: 'trends' });
    }

    const usersGrid = section.querySelector('#trending-users-grid');
    const photosGrid = section.querySelector('#trending-photos-grid');
    const statusContainer = section.querySelector('.status-message-container');
    const usersSection = usersGrid.closest('.category-section');
    const photosSection = photosGrid.closest('.category-section');

    if (statusContainer) {
        statusContainer.classList.remove('disabled');
        statusContainer.innerHTML = loaderHTML;
    }
    if (usersGrid) usersGrid.innerHTML = '';
    if (photosGrid) photosGrid.innerHTML = '';

    if (usersSection) usersSection.style.display = 'none';
    if (photosSection) photosSection.style.display = 'none';

    try {
        const [users, photos] = await api.getTrends(searchTerm);

        if (statusContainer) {
            statusContainer.classList.add('disabled');
            statusContainer.innerHTML = '';
        }

        if (users.length > 0) {
            if (usersSection) usersSection.style.display = 'block';
            displayGalleriesAsGrid(users, usersGrid, 'relevant', false);
        } else {
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('trends.noTrendingUsersMessage')}</p></div>`;
            }
        }

        if (searchTerm === '') {
            if (photosSection) photosSection.style.display = 'block';
            if (photos.length > 0) {
                photos.forEach(photo => {
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
                    const likesText = window.getTranslation('general.likesCount', { count: photo.likes });
                    const interactionsText = window.getTranslation('general.interactionsCount', { count: photo.interactions });
                    const profilePicUrl = photo.profile_picture_url ? `${window.BASE_PATH}/${photo.profile_picture_url}` : '';

                    card.innerHTML += `
                        <div class="card-content-overlay">
                            <div class="card-icon" style="background-image: url('${profilePicUrl}')"></div>
                            <div class="card-text">
                                <span>${photo.gallery_name}</span>
                                <span style="font-size: 0.8rem; display: block;">${likesText} - ${interactionsText}</span>
                            </div>
                        </div>
                        <div class="card-actions-container">
                            <div class="card-hover-overlay">
                                <div class="card-hover-icons">
                                    <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div>
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
                    if (photosGrid) photosGrid.appendChild(card);
                    window.updateFavoriteCardState(photo.id);
                });
            } else {
                if (photosGrid) photosGrid.innerHTML = `<p>No hay fotos en tendencia en este momento.</p>`;
            }
            return photos;
        }
    } catch (error) {
        console.error('Error fetching trends:', error);
        displayFetchError('[data-section="trends"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
    }
    return [];
}

export async function fetchAndDisplayUsers(searchTerm = '', append = false, state) {
    if (state.isLoading) return;
    state.isLoading = true;

    const section = document.querySelector('[data-section="manageUsers"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const tableBody = section.querySelector('#users-table tbody');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#users-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (tableBody) tableBody.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getUsers(searchTerm, state.currentPage, state.batchSize);
    state.isLoading = false;

    if (statusContainer) {
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';
    }

    if (response.ok) {
        const users = response.data;
        displayUsers(users, tableBody, statusContainer, append);

        if (loadMoreContainer) {
            if (users.length < state.batchSize) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                state.currentPage++;
            }
        }
        
        applyTranslations(section);

    } else {
        console.error('Error fetching users:', response.data);
        if (!append && statusContainer) {
            displayFetchError('[data-section="manageUsers"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }
}

export async function fetchAndDisplayGalleriesAdmin(searchTerm = '', append = false, state) {
    if (state.isLoading) return;
    state.isLoading = true;

    const section = document.querySelector('[data-section="manageContent"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const listContainer = section.querySelector('#admin-galleries-list');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#galleries-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (listContainer) listContainer.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getGalleries('alpha-asc', searchTerm, state.currentPage, state.batchSize, 'admin');
    state.isLoading = false;

    if (statusContainer) {
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';
    }

    if (response.ok) {
        const galleries = response.data;
        displayGalleriesAdmin(galleries, listContainer, statusContainer, append);


        if (loadMoreContainer) {
            if (galleries.length < state.batchSize) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                state.currentPage++;
            }
        }
    } else {
        console.error('Error fetching galleries for admin:', response.data);
        if (!append && statusContainer) {
            displayFetchError('[data-section="manageContent"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }
}

export async function fetchAndDisplayAdminComments(searchTerm = '', filter = 'all', append = false, state) {
    if (state.isLoading) return;
    state.isLoading = true;

    const section = document.querySelector('[data-section="manageComments"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const tableBody = section.querySelector('#comments-table tbody');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#comments-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (tableBody) tableBody.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getAdminComments(searchTerm, filter, state.currentPage, state.batchSize);
    state.isLoading = false;

    if (statusContainer) {
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';
    }

    if (response.ok) {
        const comments = response.data;
        displayAdminComments(comments, tableBody, statusContainer, append);

        if (loadMoreContainer) {
            if (comments.length < state.batchSize) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                state.currentPage++;
            }
        }
        
        applyTranslations(section);

    } else {
        console.error('Error fetching comments:', response.data);
        if (!append && statusContainer) {
            displayFetchError('[data-section="manageComments"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }
}