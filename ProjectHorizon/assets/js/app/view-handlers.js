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
    displayAdminComments,
    displayFeedback,
    renderUserProfile
} from '../ui/ui-controller.js';

const loaderHTML = '<div class="loader-container"><div class="spinner"></div></div>';
let userGrowthChartInstance = null;
let contentActivityChartInstance = null;

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

function getChartColors() {
    const isDarkMode = document.documentElement.classList.contains('dark-theme');
    return {
        gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        textColor: isDarkMode ? '#ffffff' : '#000000',
        
        // Colores para Crecimiento de Usuarios (Verde)
        successBorder: isDarkMode ? '#66bb6a' : '#388e3c',
        successBackground: 'rgba(76, 175, 80, 0.2)',

        // Colores para Actividad de Contenido
        primaryBorder: '#007bff',
        primaryBackground: 'rgba(0, 123, 255, 0.5)', // Azul para Comentarios
        secondaryBorder: '#ffc107',
        secondaryBackground: 'rgba(255, 193, 7, 0.5)' // Amarillo para Favoritos
    };
}

function renderUserGrowthChart(data) {
    const ctx = document.getElementById('user-growth-chart');
    if (!ctx) return;

    const colors = getChartColors();

    if (userGrowthChartInstance) {
        userGrowthChartInstance.destroy();
    }

    const labels = data.map(item => item.date);
    const counts = data.map(item => item.count);

    userGrowthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nuevos Usuarios',
                data: counts,
                borderColor: colors.successBorder,
                backgroundColor: colors.successBackground,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    ticks: { color: colors.textColor },
                    grid: { color: colors.gridColor }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: colors.textColor, precision: 0 },
                    grid: { color: colors.gridColor }
                }
            }
        }
    });
}

function renderContentActivityChart(data) {
    const ctx = document.getElementById('content-activity-chart');
    if (!ctx) return;

    const colors = getChartColors();
    
    if (contentActivityChartInstance) {
        contentActivityChartInstance.destroy();
    }
    
    const allDates = [...new Set([...data.favorites.map(d => d.date), ...data.comments.map(d => d.date)])].sort();

    const favoritesData = allDates.map(date => {
        const item = data.favorites.find(d => d.date === date);
        return item ? item.count : 0;
    });

    const commentsData = allDates.map(date => {
        const item = data.comments.find(d => d.date === date);
        return item ? item.count : 0;
    });

    contentActivityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allDates,
            datasets: [
                {
                    label: 'Nuevos Favoritos',
                    data: favoritesData,
                    backgroundColor: colors.secondaryBackground, // Fondo semitransparente
                    borderColor: colors.secondaryBorder,       // Borde sólido
                    borderWidth: 1.5                           // Ancho del borde
                },
                {
                    label: 'Nuevos Comentarios',
                    data: commentsData,
                    backgroundColor: colors.primaryBackground, // Fondo semitransparente
                    borderColor: colors.primaryBorder,       // Borde sólido
                    borderWidth: 1.5                         // Ancho del borde
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { 
                    labels: {
                        color: colors.textColor
                    }
                } 
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: colors.textColor },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { color: colors.textColor, precision: 0 },
                    grid: { color: colors.gridColor }
                }
            }
        }
    });
}


export async function fetchAndDisplayDashboard() {
    const section = document.querySelector('[data-section="dashboard"]');
    if (!section) return;

    const loader = document.getElementById('dashboard-loader');
    const content = document.getElementById('dashboard-content');

    loader.style.display = 'flex';
    content.style.display = 'none';

    const response = await api.getDashboardStats();

    if (response.ok) {
        const stats = response.data;

        // Rellenar tarjetas de estadísticas
        document.getElementById('total-users-value').textContent = stats.total_users;
        document.getElementById('new-users-value').textContent = stats.new_users_last_30_days;
        document.getElementById('total-galleries-value').textContent = stats.total_galleries;
        document.getElementById('total-photos-value').textContent = stats.total_photos;
        document.getElementById('pending-comments-value').textContent = stats.pending_comments;
        
        // Rellenar listas Top 10
        const topGalleriesList = document.getElementById('top-galleries-list');
        if (stats.top_galleries.length > 0) {
            topGalleriesList.innerHTML = stats.top_galleries.map(g => `<li>${g.name} <span>(${g.total_interactions} vistas)</span></li>`).join('');
        } else {
            topGalleriesList.innerHTML = `<li>No hay datos suficientes.</li>`;
        }

        const topPhotosList = document.getElementById('top-photos-list');
        if (stats.top_photos.length > 0) {
            topPhotosList.innerHTML = stats.top_photos.map(p => `<li>Foto #${p.id} en ${p.gallery_name} <span>(${p.interactions} vistas)</span></li>`).join('');
        } else {
            topPhotosList.innerHTML = `<li>No hay datos suficientes.</li>`;
        }

        loader.style.display = 'none';
        // --- INICIO DE LA CORRECCIÓN ---
        content.style.display = 'flex'; // Cambiado de 'block' a 'flex'
        // --- FIN DE LA CORRECCIÓN ---

        // Renderizar los gráficos después de que el contenido sea visible
        renderUserGrowthChart(stats.charts.user_growth);
        renderContentActivityChart(stats.charts.content_activity);

    } else {
        loader.innerHTML = `<p>${window.getTranslation('general.connectionErrorMessage')}</p>`;
    }
    applyTranslations(section);
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

// -- CORRECCIÓN: Se añade el parámetro 'sessionUser' para recibir la info del usuario logueado. --
export async function fetchAndDisplayUsers(searchTerm = '', append = false, state, sessionUser) {
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
        // -- CORRECCIÓN: Pasamos 'sessionUser' a la función que dibuja la tabla. --
        displayUsers(users, tableBody, statusContainer, append, sessionUser);

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

export async function fetchAndDisplayFeedback(searchTerm = '', append = false, state) {
    if (state.isLoading) return;
    state.isLoading = true;

    const section = document.querySelector('[data-section="manageFeedback"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const tableBody = section.querySelector('#feedback-table tbody');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#feedback-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (tableBody) tableBody.innerHTML = '';
        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
    }

    const response = await api.getAdminFeedback(searchTerm, state.currentPage, state.batchSize);
    state.isLoading = false;

    if (statusContainer) {
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';
    }

    if (response.ok) {
        const feedbackItems = response.data;
        displayFeedback(feedbackItems, tableBody, statusContainer, append);

        if (loadMoreContainer) {
            if (feedbackItems.length < state.batchSize) {
                loadMoreContainer.classList.add('disabled');
            } else {
                loadMoreContainer.classList.remove('disabled');
                state.currentPage++;
            }
        }
        
        applyTranslations(section);

    } else {
        console.error('Error fetching feedback:', response.data);
        if (!append && statusContainer) {
            displayFetchError('[data-section="manageFeedback"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
        }
    }
}

export async function fetchAndDisplayUserProfile(uuid) {
    const section = document.querySelector('[data-section="userProfile"]');
    if (!section) return;

    const response = await api.getUserProfile(uuid);

    if (response.ok) {
        renderUserProfile(response.data);
    } else {
        console.error('Error fetching user profile:', response.data);
        displayFetchError('[data-section="userProfile"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
    }
}