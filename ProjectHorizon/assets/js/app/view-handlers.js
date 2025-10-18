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
let browserUsageChartInstance = null;


function formatNumberWithCommas(number) {
    if (number === null || number === undefined) {
        return '0';
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

        successBorder: isDarkMode ? '#66bb6a' : '#388e3c',
        successBackground: 'rgba(76, 175, 80, 0.2)',

        primaryBorder: '#007bff',
        primaryBackground: 'rgba(0, 123, 255, 0.5)',
        secondaryBorder: '#ffc107',
        secondaryBackground: 'rgba(255, 193, 7, 0.5)'
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
                    backgroundColor: colors.secondaryBackground,
                    borderColor: colors.secondaryBorder,
                    borderWidth: 1.5
                },
                {
                    label: 'Nuevos Comentarios',
                    data: commentsData,
                    backgroundColor: colors.primaryBackground,
                    borderColor: colors.primaryBorder,
                    borderWidth: 1.5
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

// --- INICIO DE LA MODIFICACIÓN ---
function renderBrowserUsageChart(data) {
    const ctx = document.getElementById('browser-usage-chart');
    if (!ctx) return;

    const colors = getChartColors();

    if (browserUsageChartInstance) {
        browserUsageChartInstance.destroy();
    }

    const labels = Object.keys(data);
    const counts = Object.values(data);

    const backgroundColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
    ];

    browserUsageChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Uso de Navegadores',
                data: counts,
                backgroundColor: backgroundColors,
                borderColor: colors.gridColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.textColor
                    }
                }
            }
        }
    });
}
// --- FIN DE LA MODIFICACIÓN ---

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

        document.getElementById('total-users-value').textContent = stats.total_users;
        document.getElementById('new-users-value').textContent = stats.new_users_last_30_days;
        document.getElementById('total-galleries-value').textContent = stats.total_galleries;
        document.getElementById('total-photos-value').textContent = stats.total_photos;
        document.getElementById('pending-comments-value').textContent = stats.pending_comments;

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
        content.style.display = 'flex';

        renderUserGrowthChart(stats.charts.user_growth);
        renderContentActivityChart(stats.charts.content_activity);
        // --- INICIO DE LA MODIFICACIÓN ---
        renderBrowserUsageChart(stats.charts.browser_usage);
        // --- FIN DE LA MODIFICACIÓN ---

    } else {
        loader.innerHTML = `<p>${window.getTranslation('general.connectionErrorMessage')}</p>`;
    }
    applyTranslations(section);
}

export async function fetchAndDisplayLogs(searchTerm = '') {
    const section = document.querySelector('[data-section="manageLogs"]');
    if (!section) return;

    const listContainer = section.querySelector('#logs-list');
    const statusContainer = section.querySelector('.status-message-container');

    statusContainer.classList.remove('disabled');
    statusContainer.innerHTML = loaderHTML;
    listContainer.innerHTML = '';

    const response = await api.getLogs();

    if (response.ok) {
        const files = response.data;
        const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()));

        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';

        if (filteredFiles.length > 0) {
            filteredFiles.forEach(file => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.dataset.filename = file.name;

                const icon = file.is_log ? 'description' : 'gpp_bad';
                const statusText = file.is_log ? '' : `<span class="info-badge-admin" data-i18n="admin.manageLogs.corruptedFile"></span>`;
                const fileSize = (file.size / 1024).toFixed(2) + ' KB';

                item.innerHTML = `
                    <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                        <span class="material-symbols-rounded">${icon}</span>
                    </div>
                    <div class="admin-list-item-details">
                        <div class="admin-list-item-title">${file.name}</div>
                        <div class="admin-list-item-meta-badges">
                            <span class="info-badge-admin">${fileSize}</span>
                            ${statusText}
                        </div>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        } else {
            statusContainer.classList.remove('disabled');
            if (searchTerm) {
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div>`;
            } else {
                statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.manageLogs.noLogsTitle')}</h2><p>${window.getTranslation('admin.manageLogs.noLogsMessage')}</p></div>`;
            }
        }
    } else {
        displayFetchError('[data-section="manageLogs"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
    }
    applyTranslations(section);
}

export async function fetchAndDisplayBackups() {
    const section = document.querySelector('[data-section="backup"]');
    if (!section) return;

    const listContainer = section.querySelector('#backups-list');
    const statusContainer = section.querySelector('.status-message-container');

    statusContainer.classList.remove('disabled');
    statusContainer.innerHTML = loaderHTML;
    listContainer.innerHTML = '';

    const response = await api.getBackups();

    if (response.ok) {
        const files = response.data;
        statusContainer.classList.add('disabled');
        statusContainer.innerHTML = '';

        if (files.length > 0) {
            files.forEach(file => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.dataset.filename = file.name;

                const createdDate = new Date(file.created_at * 1000).toLocaleString();
                const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';

                item.innerHTML = `
                    <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                        <span class="material-symbols-rounded">database</span>
                    </div>
                    <div class="admin-list-item-details">
                        <div class="admin-list-item-title">${file.name}</div>
                        <div class="admin-list-item-meta-badges">
                             <span class="info-badge-admin">${fileSize}</span>
                             <span class="info-badge-admin">${createdDate}</span>
                        </div>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        } else {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('admin.backup.noBackupsTitle')}</h2><p>${window.getTranslation('admin.backup.noBackupsMessage')}</p></div>`;
        }
    } else {
        displayFetchError('[data-section="backup"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
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
    const videosContainer = section.querySelector('#user-videos-container');
    const photosSection = section.querySelector('#photos-section');
    const videosSection = section.querySelector('#videos-section');
    const separator = section.querySelector('.photo-video-separator');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#photos-load-more-container');
    const headerInfo = section.querySelector('.gallery-header-info');
    const followButton = section.querySelector('#follow-gallery-btn');
    const socialLinksBtn = document.getElementById('gallery-social-links-btn');
    const socialLinksMenu = document.getElementById('gallery-social-links-menu');

    if (!append) {
        state.currentPage = 1;
        state.photoList = [];

        if (grid) grid.innerHTML = '';
        if (videosContainer) videosContainer.innerHTML = '';
        if (photosSection) photosSection.style.display = 'none';
        if (videosSection) videosSection.style.display = 'none';
        if (separator) separator.style.display = 'none';

        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }

        if (headerInfo) {
            const headerName = headerInfo.querySelector('.gallery-header-name');
            const headerAvatar = headerInfo.querySelector('.gallery-header-avatar');
            const totalLikes = headerInfo.querySelector('#gallery-total-likes');
            const totalInteractions = headerInfo.querySelector('#gallery-total-interactions');

            const galleryDetailsResponse = await api.getGalleryDetails(uuid);
            if (galleryDetailsResponse.ok) {
                const gallery = galleryDetailsResponse.data;
                if (headerName) headerName.textContent = gallery.name;
                if (totalLikes) totalLikes.textContent = formatNumberWithCommas(gallery.total_likes || 0);
                if (totalInteractions) totalInteractions.textContent = formatNumberWithCommas(gallery.total_interactions || 0);

                if (headerAvatar) {
                    if (gallery.profile_picture_url) {
                        headerAvatar.style.backgroundImage = `url('${window.BASE_PATH}/${gallery.profile_picture_url}')`;
                    } else {
                        headerAvatar.style.backgroundImage = 'none';
                    }
                }

                if (followButton) {
                    followButton.dataset.uuid = gallery.uuid;
                    const buttonText = followButton.querySelector('.button-text');
                    if (gallery.is_following) {
                        followButton.classList.remove('btn-primary');
                        followButton.classList.add('following');
                        buttonText.textContent = window.getTranslation('userPhotos.unfollowButton');
                    } else {
                        followButton.classList.add('btn-primary');
                        followButton.classList.remove('following');
                        buttonText.textContent = window.getTranslation('userPhotos.followButton');
                    }
                }
                if (socialLinksBtn && socialLinksMenu) {
                    if (gallery.social_links && Object.keys(gallery.social_links).length > 0) {
                        socialLinksBtn.style.display = 'flex';
                        const menuContent = `
                            <div class="menu-content">
                                <div class="menu-list">
                                    ${Object.entries(gallery.social_links).map(([platform, url]) => `
                                        <a href="${url.startsWith('http') ? url : 'http://' + url}" target="_blank" class="menu-link">
                                            <div class="menu-link-icon"><span class="fab fa-${platform}"></span></div>
                                            <div class="menu-link-text"><span>${platform.charAt(0).toUpperCase() + platform.slice(1)}</span></div>
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                        socialLinksMenu.innerHTML = menuContent;
                    } else {
                        socialLinksBtn.style.display = 'none';
                    }
                }
            }
        }
    }

    if (state.isLoading) return;
    state.isLoading = true;

    const response = await api.getGalleryPhotos(uuid, state.currentPage, state.batchSize);
    state.isLoading = false;

    if (response.ok) {
        const contentItems = response.data;
        if (statusContainer) {
            statusContainer.classList.add('disabled');
            statusContainer.innerHTML = '';
        }

        state.photoList.push(...contentItems);

        if (contentItems.length > 0) {
            const photos = contentItems.filter(item => item.type === 'photo');
            const videos = contentItems.filter(item => item.type === 'video');

            if (videos.length > 0 && videosContainer && videosSection) {
                videosSection.style.display = 'block';
                videos.forEach(video => {
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

                    const photoPageUrl = `${window.location.origin}${window.BASE_PATH}/gallery/${uuid}/photo/${video.id}`;
                    const menuHTML = `
                        <div class="card-actions-container">
                            <div class="card-hover-overlay">
                                <div class="card-hover-icons">
                                    <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${video.id}"><span class="material-symbols-rounded">favorite</span></div>
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

                    card.appendChild(background);
                    card.appendChild(playIcon);
                    card.insertAdjacentHTML('beforeend', menuHTML);

                    videosContainer.appendChild(card);
                    window.updateFavoriteCardState(video.id);
                });
            }

            if (photos.length > 0 && grid && photosSection) {
                photosSection.style.display = 'block';
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
                    const menuHTML = `
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
                    card.insertAdjacentHTML('beforeend', menuHTML);
                    grid.appendChild(card);
                    window.updateFavoriteCardState(photo.id);
                });
            }

            if (videos.length > 0 && photos.length > 0 && separator) {
                separator.style.display = 'block';
            }

        } else if (!append && statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = `<div><h2>${window.getTranslation('userPhotos.emptyGalleryTitle')}</h2><p>${window.getTranslation('userPhotos.emptyGalleryMessage')}</p></div>`;
        }

        if (loadMoreContainer) {
            if (contentItems.length < state.batchSize) {
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
    const videosGrid = section.querySelector('#trending-videos-grid');
    const statusContainer = section.querySelector('.status-message-container');
    const usersSection = usersGrid.closest('.category-section');
    const photosSection = section.querySelector('#trending-photos-section');
    const videosSection = section.querySelector('#trending-videos-section');

    if (statusContainer) {
        statusContainer.classList.remove('disabled');
        statusContainer.innerHTML = loaderHTML;
    }
    if (usersGrid) usersGrid.innerHTML = '';
    if (photosGrid) photosGrid.innerHTML = '';
    if (videosGrid) videosGrid.innerHTML = '';

    if (usersSection) usersSection.style.display = 'none';
    if (photosSection) photosSection.style.display = 'none';
    if (videosSection) videosSection.style.display = 'none';

    try {
        const [users, trendingContent] = await api.getTrends(searchTerm);

        if (statusContainer) {
            statusContainer.classList.add('disabled');
            statusContainer.innerHTML = '';
        }

        const trendingPhotos = trendingContent.filter(item => item.type === 'photo');
        const trendingVideos = trendingContent.filter(item => item.type === 'video');

        const hasUsers = users.length > 0;
        const hasPhotos = trendingPhotos.length > 0;
        const hasVideos = trendingVideos.length > 0;

        if (!hasUsers && !hasPhotos && !hasVideos) {
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                if (searchTerm) {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('trends.noTrendingUsersMessage')}</p></div>`;
                } else {
                    statusContainer.innerHTML = `<div><h2>${window.getTranslation('home.noGalleriesTitle')}</h2><p>${window.getTranslation('trends.noTrendingContent')}</p></div>`;
                }
            }
        } else {
            if (hasUsers) {
                if (usersSection) usersSection.style.display = 'block';
                displayGalleriesAsGrid(users, usersGrid, 'relevant', false);
            }

            if (searchTerm === '') {
                if (hasPhotos) {
                    if (photosSection) photosSection.style.display = 'block';
                    trendingPhotos.forEach(photo => {
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
                        const likesText = window.getTranslation('general.likesCount', { count: formatNumberWithCommas(photo.likes) });
                        const interactionsText = window.getTranslation('general.interactionsCount', { count: formatNumberWithCommas(photo.interactions) });
                        const profilePicUrl = photo.profile_picture_url ? `${window.BASE_PATH}/${photo.profile_picture_url}` : '';

                        const contentHTML = `
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

                        card.insertAdjacentHTML('beforeend', contentHTML);
                        if (photosGrid) photosGrid.appendChild(card);
                        window.updateFavoriteCardState(photo.id);
                    });
                }

                if (hasVideos) {
                    if (videosSection) videosSection.style.display = 'block';
                    trendingVideos.forEach(video => {
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
                        const likesText = window.getTranslation('general.likesCount', { count: formatNumberWithCommas(video.likes) });
                        const interactionsText = window.getTranslation('general.interactionsCount', { count: formatNumberWithCommas(video.interactions) });
                        const profilePicUrl = video.profile_picture_url ? `${window.BASE_PATH}/${video.profile_picture_url}` : '';

                        const contentHTML = `
                            <div class="card-content-overlay">
                                <div class="card-icon" style="background-image: url('${profilePicUrl}')"></div>
                                <div class="card-text">
                                    <span>${video.gallery_name}</span>
                                    <span style="font-size: 0.8rem; display: block;">${likesText} - ${interactionsText}</span>
                                </div>
                            </div>
                            <div class="card-actions-container">
                                <div class="card-hover-overlay">
                                    <div class="card-hover-icons">
                                        <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${video.id}"><span class="material-symbols-rounded">favorite</span></div>
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

                        card.insertAdjacentHTML('beforeend', contentHTML);
                        if (videosGrid) videosGrid.appendChild(card);
                        window.updateFavoriteCardState(video.id);
                    });
                }

                if (!hasPhotos && photosSection) {
                    photosSection.style.display = 'block';
                    if (photosGrid) photosGrid.innerHTML = `<p>${window.getTranslation('trends.noTrendingPhotosMessage')}</p>`;
                }

            }
        }
        return trendingContent;
    } catch (error) {
        console.error('Error fetching trends:', error);
        displayFetchError('[data-section="trends"]', 'general.connectionErrorTitle', 'general.connectionErrorMessage');
    }
    return [];
}


export async function fetchAndDisplayUsers(searchTerm = '', append = false, state, sessionUser) {
    if (state.isLoading) return;
    state.isLoading = true;

    const section = document.querySelector('[data-section="manageUsers"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const listContainer = section.querySelector('#admin-users-list');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#users-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (listContainer) listContainer.innerHTML = '';
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
        displayUsers(users, listContainer, statusContainer, append, searchTerm);

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
        displayGalleriesAdmin(galleries, listContainer, statusContainer, append, searchTerm);


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

    const listContainer = section.querySelector('#admin-comments-list');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#comments-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (listContainer) listContainer.innerHTML = '';
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
        displayAdminComments(comments, listContainer, statusContainer, append, searchTerm);

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

export async function fetchAndDisplayProfanityWords(languageCode = 'all', searchTerm = '') {
    const listContainer = document.getElementById('profanity-words-list');
    if (!listContainer) return;

    listContainer.innerHTML = loaderHTML;

    const response = await api.getProfanityWords(languageCode);
    if (response.ok) {
        listContainer.innerHTML = '';
        let words = response.data;

        if (searchTerm) {
            words = words.filter(word => word.word.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (words.length > 0) {
            words.forEach(word => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.dataset.id = word.id;
                item.innerHTML = `
                    <div class="admin-list-item-thumbnail admin-list-item-thumbnail--initials">
                        <span class="material-symbols-rounded">match_word</span>
                    </div>
                    <div class="admin-list-item-details">
                        <div class="admin-list-item-title">${word.word}</div>
                        <div class="admin-list-item-meta-badges">
                            <span class="info-badge-admin">${word.language_code}</span>
                        </div>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        } else {
            listContainer.innerHTML = `<div class="status-message-container active"><div><h2>${window.getTranslation('general.noResultsTitle')}</h2><p>${window.getTranslation('general.noResultsMessage')}</p></div></div>`;
        }

    } else {
        showNotification('Error al cargar la lista de palabras.', 'error');
        listContainer.innerHTML = `<div class="status-message-container active"><div><h2>${window.getTranslation('general.connectionErrorTitle')}</h2><p>${window.getTranslation('general.connectionErrorMessage')}</p></div></div>`;
    }
    applyTranslations(listContainer);
}

function getInitials(name) {
    if (!name) return '';
    const words = name.split(/[\s_]+/);
    if (words.length > 1 && words[1]) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export async function fetchAndDisplayFeedback(searchTerm = '', append = false, state) {
    if (state.isLoading) return;
    state.isLoading = true;

    const section = document.querySelector('[data-section="manageFeedback"]');
    if (!section) {
        state.isLoading = false;
        return;
    }

    const listContainer = section.querySelector('#admin-feedback-list');
    const statusContainer = section.querySelector('.status-message-container');
    const loadMoreContainer = section.querySelector('#feedback-admin-load-more-container');

    if (!append) {
        state.currentPage = 1;
        if (listContainer) listContainer.innerHTML = '';
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

        displayFeedback(feedbackItems, listContainer, statusContainer, append, searchTerm);

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