// assets/js/main-controller.js

import { navigateToUrl, setupPopStateHandler, setInitialHistoryState } from './url-manager.js';
import { setTheme, updateThemeSelectorUI } from './theme-manager.js';
import { setLanguage, updateLanguageSelectorUI } from './language-manager.js';

function getFavorites() {
    const favorites = localStorage.getItem('favoritePhotos');
    return favorites ? JSON.parse(favorites) : [];
}

function getHistory() {
    const historyString = localStorage.getItem('viewHistory');
    const defaultHistory = { profiles: [], photos: [], searches: [] };
    if (historyString) {
        const savedHistory = JSON.parse(historyString);
        return { ...defaultHistory, ...savedHistory };
    }
    return defaultHistory;
}

function addToHistory(type, data) {
    const isHistoryEnabled = localStorage.getItem('enable-view-history') !== 'false';
    if (!isHistoryEnabled) return;

    let history = getHistory();
    const now = Date.now();

    const existingIndex = history[type].findIndex(item => item.id === data.id);
    if (existingIndex > -1) {
        history[type].splice(existingIndex, 1);
    }

    history[type].unshift({ ...data, visited_at: now });

    const MAX_HISTORY_ITEMS = 50;
    if (history[type].length > MAX_HISTORY_ITEMS) {
        history[type] = history[type].slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem('viewHistory', JSON.stringify(history));
}

function addSearchToHistory(term, section) {
    const isSearchHistoryEnabled = localStorage.getItem('enable-search-history') !== 'false';
    if (!term || !isSearchHistoryEnabled) return;

    let history = getHistory();
    const now = Date.now();

    const existingIndex = history.searches.findIndex(item => item.term.toLowerCase() === term.toLowerCase() && item.section === section);
    if (existingIndex > -1) {
        history.searches.splice(existingIndex, 1);
    }

    history.searches.unshift({ term, section, searched_at: now });

    const MAX_SEARCH_HISTORY = 100;
    if (history.searches.length > MAX_SEARCH_HISTORY) {
        history.searches = history.searches.slice(0, MAX_SEARCH_HISTORY);
    }

    localStorage.setItem('viewHistory', JSON.stringify(history));
}


export function initMainController() {
    console.log("Fotos favoritas guardadas:");
    console.table(getFavorites());
    console.log("Historial de visualización:");
    console.table(getHistory());


    let currentAppView = null;
    let currentAppSection = null;

    let currentView = 'grid';
    let currentSortBy = 'relevant';
    let searchDebounceTimer;
    let currentGalleryForPhotoView = null;
    let currentGalleryNameForPhotoView = null;
    let currentGalleryPhotoList = [];
    let currentTrendingPhotosList = [];
    let currentPhotoData = null;
    let lastVisitedView = null;
    let lastVisitedData = null;

    let galleriesCurrentPage = 1;
    let photosCurrentPage = 1;
    let isLoadingGalleries = false;
    let isLoadingPhotos = false;
    const BATCH_SIZE = 20;

    let currentFavoritesSortBy = 'user';
    let currentFavoritesList = [];

    const loaderHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    let activeScrollHandlers = [];

    function initSettingsController() {
        const settingsToggles = {
            'open-links-in-new-tab': {
                element: document.querySelector('[data-setting="open-links-in-new-tab"]'),
                key: 'openLinksInNewTab',
                defaultValue: false
            },
            'require-modifier-for-shortcuts': {
                element: document.querySelector('[data-setting="require-modifier-for-shortcuts"]'),
                key: 'requireModifierForShortcuts',
                defaultValue: false
            }
        };

        function updateToggleUI(setting) {
            const value = localStorage.getItem(setting.key) === 'true';
            if (setting.element) {
                setting.element.classList.toggle('active', value);
            }
        }

        for (const id in settingsToggles) {
            const setting = settingsToggles[id];
            if (setting.element) {
                if (localStorage.getItem(setting.key) === null) {
                    localStorage.setItem(setting.key, setting.defaultValue);
                }
                updateToggleUI(setting);

                setting.element.addEventListener('click', () => {
                    const currentValue = localStorage.getItem(setting.key) === 'true';
                    localStorage.setItem(setting.key, !currentValue);
                    updateToggleUI(setting);
                });
            }
        }

        console.log("Accessibility Settings Initialized:");
        console.log(`- Theme: ${localStorage.getItem('theme') || 'system'}`);
        console.log(`- Language: ${localStorage.getItem('language') || 'es-LA'}`);
        console.log(`- Open links in new tab: ${localStorage.getItem(settingsToggles['open-links-in-new-tab'].key)}`);
        console.log(`- Require modifier for shortcuts: ${localStorage.getItem(settingsToggles['require-modifier-for-shortcuts'].key)}`);
    }

    function initHistoryPrivacySettings() {
        const settingsToggles = {
            'enable-view-history': {
                element: document.querySelector('[data-setting="enable-view-history"]'),
                key: 'enable-view-history',
                defaultValue: true
            },
            'enable-search-history': {
                element: document.querySelector('[data-setting="enable-search-history"]'),
                key: 'enable-search-history',
                defaultValue: true
            }
        };

        function updateToggleUI(setting) {
            const value = localStorage.getItem(setting.key) !== 'false';
            if (setting.element) {
                setting.element.classList.toggle('active', value);
            }
        }

        for (const id in settingsToggles) {
            const setting = settingsToggles[id];
            if (setting.element) {
                if (localStorage.getItem(setting.key) === null) {
                    localStorage.setItem(setting.key, setting.defaultValue);
                }
                updateToggleUI(setting);

                setting.element.addEventListener('click', () => {
                    const currentValue = localStorage.getItem(setting.key) !== 'false';
                    localStorage.setItem(setting.key, !currentValue);
                    updateToggleUI(setting);
                });
            }
        }

        const clearHistoryBtn = document.querySelector('[data-action="clear-history"]');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres borrar todo tu historial? Esta acción no se puede deshacer.')) {
                    localStorage.removeItem('viewHistory');
                    alert('Historial borrado con éxito.');
                    if(currentAppSection === 'history') {
                        displayHistory();
                    }
                }
            });
        }
    }


    function isFavorite(photoId) {
        const favorites = getFavorites();
        return favorites.some(photo => photo.id == photoId);
    }

    function toggleFavorite(photoData) {
        let favorites = getFavorites();
        const photoIndex = favorites.findIndex(photo => photo.id == photoData.id);
        const isLiked = photoIndex === -1;

        if (photoIndex > -1) {
            favorites.splice(photoIndex, 1);
        } else {
            const photoToAdd = {
                ...photoData,
                added_at: Date.now()
            };
            favorites.push(photoToAdd);
        }

        localStorage.setItem('favoritePhotos', JSON.stringify(favorites));
        updateFavoriteButtonState(photoData.id);
        updateFavoriteCardState(photoData.id);

        const formData = new FormData();
        formData.append('action_type', 'toggle_like');
        formData.append('photo_id', photoData.id);
        formData.append('gallery_uuid', photoData.gallery_uuid);
        formData.append('is_liked', isLiked);

        fetch(`${window.BASE_PATH}/api/main_handler.php`, {
            method: 'POST',
            body: formData
        }).then(res => res.json()).then(data => {
            if (!data.success) {
                console.error('Error al actualizar el like.');
            }
        });
    }

    function updateFavoriteButtonState(photoId) {
        const favButton = document.querySelector('[data-action="toggle-favorite"]');
        if (favButton) {
            favButton.classList.toggle('active', isFavorite(photoId));
        }
    }

    function updateFavoriteCardState(photoId) {
        const cardFavButton = document.querySelector(`.icon-wrapper[data-photo-id="${photoId}"]`);
        if (cardFavButton) {
            cardFavButton.classList.toggle('active', isFavorite(photoId));
        }
    }

    function displayFavoritePhotos() {
        const section = document.querySelector('[data-section="favorites"]');
        if (!section) return;

        const allPhotosContainer = section.querySelector('#favorites-grid-view');
        const byUserContainer = section.querySelector('#favorites-grid-view-by-user');
        const statusContainer = section.querySelector('.status-message-container');
        const searchInput = document.getElementById('favorites-search-input');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        
        if (searchTerm) {
            addSearchToHistory(searchTerm, 'favorites');
        }

        allPhotosContainer.innerHTML = '';
        byUserContainer.innerHTML = '';
        statusContainer.innerHTML = '';
        statusContainer.classList.add('disabled');

        let favorites = getFavorites();

        if (searchTerm) {
            favorites = favorites.filter(photo =>
                photo.gallery_name.toLowerCase().includes(searchTerm)
            );
        }

        if (currentFavoritesSortBy === 'oldest') {
            favorites.sort((a, b) => (a.added_at || 0) - (b.added_at || 0));
        } else if (currentFavoritesSortBy === 'newest') {
            favorites.sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
        }

        currentFavoritesList = favorites;

        if (currentFavoritesSortBy === 'user') {
            allPhotosContainer.classList.remove('active');
            allPhotosContainer.classList.add('disabled');
            byUserContainer.classList.add('active');
            byUserContainer.classList.remove('disabled');

            const galleries = favorites.reduce((acc, photo) => {
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
                    textContainer.innerHTML = `<span>${gallery.name}</span><span style="font-size: 0.8rem; display: block;">${gallery.photos.length} ${gallery.photos.length > 1 ? 'fotos' : 'foto'}</span>`;
                    overlay.appendChild(textContainer);

                    card.appendChild(overlay);
                    byUserContainer.appendChild(card);
                }
            } else {
                byUserContainer.classList.add('disabled');
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = '<div><h2>No se encontraron favoritos</h2><p>Prueba a buscar en otra sección o añade nuevas fotos a tu colección.</p></div>';
            }

        } else {
            allPhotosContainer.classList.add('active');
            allPhotosContainer.classList.remove('disabled');
            byUserContainer.classList.remove('active');
            byUserContainer.classList.add('disabled');

            if (favorites.length > 0) {
                allPhotosContainer.classList.remove('disabled');
                statusContainer.classList.add('disabled');
                favorites.forEach(photo => {
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
                    card.innerHTML += `
                <div class="card-content-overlay">
                    <div class="card-icon" style="background-image: url('${photo.profile_picture_url || ''}')"></div>
                    <div class="card-text">
                        <span>${photo.gallery_name}</span>
                        <span style="font-size: 0.8rem; display: block;">${new Date(photo.added_at).toLocaleString()}</span>
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
                            <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a>
                            <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div>
                            <a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a>
                        </div></div>
                    </div>
                </div>`;
                    allPhotosContainer.appendChild(card);
                });
            } else {
                allPhotosContainer.classList.add('disabled');
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = '<div><h2>No se encontraron favoritos</h2><p>Prueba a buscar en otra sección o añade nuevas fotos a tu colección.</p></div>';
            }
        }
    }

    function displayGalleriesAsGrid(galleries, container, sortBy, append = false) {
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
                editedSpan.textContent = `Editado: ${new Date(gallery.last_edited).toLocaleDateString()}`;
                editedSpan.style.fontSize = '0.8rem';
                editedSpan.style.display = 'block';
                textContainer.appendChild(editedSpan);
            }

            overlay.appendChild(icon);
            overlay.appendChild(textContainer);
            card.appendChild(overlay);
            container.appendChild(card);
        });
    }

    function displayGalleriesAsTable(galleries, container, append = false) {
        const tbody = container.querySelector('tbody');
        if (!append) {
            tbody.innerHTML = '';
        }
        galleries.forEach(gallery => {
            const row = document.createElement('tr');
            row.dataset.uuid = gallery.uuid;
            row.dataset.name = gallery.name;
            row.dataset.privacy = gallery.privacy;

            const nameCell = document.createElement('td');
            nameCell.innerHTML = `<div class="user-info"><div class="user-avatar" style="background-image: url('${gallery.profile_picture_url || ''}')"></div><span>${gallery.name}</span></div>`;
            const privacyCell = document.createElement('td');
            privacyCell.textContent = gallery.privacy == 1 ? 'Privado' : 'Público';
            const typeCell = document.createElement('td');
            typeCell.textContent = 'Galería';
            const editedCell = document.createElement('td');
            editedCell.textContent = new Date(gallery.last_edited).toLocaleDateString();

            row.appendChild(nameCell);
            row.appendChild(privacyCell);
            row.appendChild(typeCell);
            row.appendChild(editedCell);
            tbody.appendChild(row);
        });
    }

    async function promptForAccessCode(uuid, name) {
        navigateToUrl('main', 'accessCodePrompt', { uuid: uuid });
        await handleStateChange('main', 'accessCodePrompt', { uuid: uuid });

        const title = document.getElementById('access-code-title');
        const promptContainer = document.querySelector('[data-section="accessCodePrompt"]');
        const input = document.getElementById('access-code-input');
        const error = document.getElementById('access-code-error');

        if (title) title.textContent = `Galería de ${name}`;
        if (promptContainer) promptContainer.dataset.galleryUuid = uuid;
        if (input) input.value = '';
        if (error) error.textContent = '';
    }

    function fetchAndDisplayGalleries(sortBy = 'relevant', searchTerm = '', append = false) {
        if (isLoadingGalleries) return;
        isLoadingGalleries = true;
        
        if (searchTerm) {
            addSearchToHistory(searchTerm, 'home');
        }

        const section = document.querySelector('[data-section="home"]');
        if (!section) {
            isLoadingGalleries = false;
            return;
        }

        const gridContainer = section.querySelector('#grid-view');
        const tableContainer = section.querySelector('#table-view');
        const statusContainer = section.querySelector('.status-message-container');

        if (!append) {
            galleriesCurrentPage = 1;
            if (gridContainer) gridContainer.innerHTML = '';
            if (tableContainer) tableContainer.querySelector('tbody').innerHTML = '';
            if (gridContainer) gridContainer.classList.add('disabled');
            if (tableContainer) tableContainer.classList.add('disabled');
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = loaderHTML;
            }
        }

        const encodedSearchTerm = encodeURIComponent(searchTerm);
        const url = `${window.BASE_PATH}/api/main_handler.php?request_type=galleries&sort=${sortBy}&search=${encodedSearchTerm}&page=${galleriesCurrentPage}&limit=${BATCH_SIZE}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (statusContainer) {
                    statusContainer.classList.add('disabled');
                    statusContainer.innerHTML = '';
                }

                if (currentView === 'grid') {
                    if (gridContainer) gridContainer.classList.remove('disabled');
                } else {
                    if (tableContainer) tableContainer.classList.remove('disabled');
                }

                if (data.length > 0) {
                    displayGalleriesAsGrid(data, gridContainer, sortBy, append);
                    displayGalleriesAsTable(data, tableContainer, append);
                } else if (!append) {
                    if (statusContainer) statusContainer.classList.remove('disabled');
                    if (statusContainer) statusContainer.innerHTML = '<div><h2>No se encontraron resultados</h2><p>Prueba con una búsqueda diferente para encontrar lo que buscas.</p></div>';
                    if (gridContainer) gridContainer.classList.add('disabled');
                    if (tableContainer) tableContainer.classList.add('disabled');
                }

                const loadMoreContainer = document.getElementById('users-load-more-container');
                if (loadMoreContainer) {
                    if (data.length < BATCH_SIZE) {
                        loadMoreContainer.classList.add('disabled');
                    } else {
                        loadMoreContainer.classList.remove('disabled');
                        galleriesCurrentPage++;
                    }
                }
            })
            .catch(error => {
                console.error('Error al obtener las galerías:', error);
                if (!append && statusContainer) {
                    statusContainer.classList.remove('disabled');
                    statusContainer.innerHTML = '<div><h2>Error al cargar</h2><p>Hubo un problema al intentar cargar el contenido. Por favor, inténtalo de nuevo más tarde.</p></div>';
                }
            })
            .finally(() => {
                isLoadingGalleries = false;
            });
    }

    function fetchAndDisplayGalleryPhotos(uuid, galleryName, append = false) {
        const section = document.querySelector('[data-section="galleryPhotos"]');
        if (!section) return;

        const grid = section.querySelector('#user-photos-grid');
        const statusContainer = section.querySelector('.status-message-container');
        const title = section.querySelector('#user-photos-title');
        const loadMoreContainer = section.querySelector('#photos-load-more-container');

        if (!append) {
            photosCurrentPage = 1;
            currentGalleryPhotoList = [];
            if (title) title.textContent = galleryName || 'Cargando...';
            if (grid) grid.innerHTML = '';
            if (statusContainer) {
                statusContainer.classList.remove('disabled');
                statusContainer.innerHTML = loaderHTML;
            }
        }

        if (isLoadingPhotos) return;
        isLoadingPhotos = true;

        currentGalleryForPhotoView = uuid;
        currentGalleryNameForPhotoView = galleryName;

        fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=photos&uuid=${uuid}&page=${photosCurrentPage}&limit=${BATCH_SIZE}`)
            .then(response => response.json())
            .then(photos => {
                if (statusContainer) {
                    statusContainer.classList.add('disabled');
                    statusContainer.innerHTML = '';
                }
                if (grid) grid.classList.remove('disabled');

                currentGalleryPhotoList.push(...photos);

                if (photos.length > 0) {
                    photos.forEach(photo => {
                        const card = document.createElement('div');
                        card.className = 'card photo-card';
                        card.dataset.photoUrl = photo.photo_url;
                        card.dataset.photoId = photo.id;
                        card.dataset.galleryUuid = photo.gallery_uuid;

                        const background = document.createElement('div');
                        background.className = 'card-background';
                        background.style.backgroundImage = `url('${photo.photo_url}')`;
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
                                        <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a>
                                        <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div>
                                        <a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a>
                                    </div></div>
                                </div>
                            </div>
                        `;

                        if (grid) grid.appendChild(card);
                        updateFavoriteCardState(photo.id);
                    });
                } else if (!append && statusContainer) {
                    statusContainer.classList.remove('disabled');
                    statusContainer.innerHTML = '<div><h2>Galería vacía</h2><p>Este usuario aún no ha subido ninguna foto a esta galería.</p></div>';
                }

                if (loadMoreContainer) {
                    if (photos.length < BATCH_SIZE) {
                        loadMoreContainer.classList.add('disabled');
                    } else {
                        loadMoreContainer.classList.remove('disabled');
                        photosCurrentPage++;
                    }
                }
            })
            .catch(error => {
                console.error('Error al obtener las fotos:', error);
                if (!append && statusContainer) {
                    statusContainer.classList.remove('disabled');
                    statusContainer.innerHTML = '<div><h2>Error al cargar</h2><p>Hubo un problema al intentar cargar las fotos. Por favor, inténtalo de nuevo más tarde.</p></div>';
                }
            })
            .finally(() => {
                isLoadingPhotos = false;
            });
    }

    function fetchAndDisplayTrends(searchTerm = '') {
        const section = document.querySelector('[data-section="trends"]');
        if (!section) return;

        if (searchTerm) {
            addSearchToHistory(searchTerm, 'trends');
        }

        const usersGrid = section.querySelector('#trending-users-grid');
        const photosGrid = section.querySelector('#trending-photos-grid');
        const statusContainer = section.querySelector('.status-message-container');
        const usersSection = usersGrid.closest('.category-section');
        const photosSection = photosGrid.closest('.category-section');
        const encodedSearchTerm = encodeURIComponent(searchTerm);

        if (statusContainer) {
            statusContainer.classList.remove('disabled');
            statusContainer.innerHTML = loaderHTML;
        }
        if (usersGrid) usersGrid.innerHTML = '';
        if (photosGrid) photosGrid.innerHTML = '';

        if (usersSection) usersSection.style.display = 'none';
        if (photosSection) photosSection.style.display = 'none';

        const fetchUsers = fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=trending_users&search=${encodedSearchTerm}&limit=8`).then(res => res.json());
        const fetchPhotos = searchTerm === '' ? fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=trending_photos&limit=12`).then(res => res.json()) : Promise.resolve([]);

        Promise.all([fetchUsers, fetchPhotos])
            .then(([users, photos]) => {
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
                        statusContainer.innerHTML = '<div><h2>No se encontraron resultados</h2><p>No hay usuarios en tendencia que coincidan con tu búsqueda.</p></div>';
                    }
                }

                if (searchTerm === '') {
                    if (photosSection) photosSection.style.display = 'block';
                    currentTrendingPhotosList = photos;
                    if (photos.length > 0) {
                        photos.forEach(photo => {
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

                            card.innerHTML += `
                                <div class="card-content-overlay">
                                    <div class="card-icon" style="background-image: url('${photo.profile_picture_url || ''}')"></div>
                                    <div class="card-text">
                                        <span>${photo.gallery_name}</span>
                                        <span style="font-size: 0.8rem; display: block;">${photo.likes} Me gusta - ${photo.interactions} Vistas</span>
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
                                            <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a>
                                            <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div>
                                            <a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a>
                                        </div></div>
                                    </div>
                                </div>`;
                            if (photosGrid) photosGrid.appendChild(card);
                            updateFavoriteCardState(photo.id);
                        });
                    } else {
                        if (photosGrid) photosGrid.innerHTML = '<p>No hay fotos en tendencia en este momento.</p>';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching trends:', error);
                if (statusContainer) statusContainer.innerHTML = '<div><h2>Error al cargar</h2><p>Hubo un problema al intentar cargar las tendencias. Por favor, inténtalo de nuevo más tarde.</p></div>';
            });
    }

    function incrementPhotoInteraction(photoId) {
        const formData = new FormData();
        formData.append('action_type', 'increment_photo_interaction');
        formData.append('photo_id', photoId);

        fetch(`${window.BASE_PATH}/api/main_handler.php`, {
            method: 'POST',
            body: formData
        });
    }

    function renderPhotoView(uuid, photoId, photoList) {
        const photoViewerImage = document.getElementById('photo-viewer-image');
        const photoCounter = document.getElementById('photo-counter');
        const photoViewUserTitle = document.getElementById('photo-view-user-title');
        const prevButton = document.querySelector('[data-action="previous-photo"]');
        const nextButton = document.querySelector('[data-action="next-photo"]');

        if (!photoViewerImage) {
            console.error("Photo viewer elements not found in the DOM.");
            return;
        }

        incrementPhotoInteraction(photoId);

        const photoIndex = photoList.findIndex(p => p.id == photoId);

        if (photoIndex !== -1) {
            const photo = photoList[photoIndex];

            const updateGalleryName = () => {
                if (photo.gallery_name) {
                    currentGalleryNameForPhotoView = photo.gallery_name;
                }
                if (photoViewUserTitle && currentGalleryNameForPhotoView) {
                    photoViewUserTitle.textContent = currentGalleryNameForPhotoView;
                } else {
                    fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${uuid}`)
                        .then(res => res.json())
                        .then(gallery => {
                            if (gallery && gallery.name) {
                                currentGalleryNameForPhotoView = gallery.name;
                                if (photoViewUserTitle) photoViewUserTitle.textContent = gallery.name;
                            }
                        });
                }
            };

            updateGalleryName();

            currentPhotoData = {
                id: photo.id,
                gallery_uuid: uuid,
                photo_url: photo.photo_url,
                gallery_name: photo.gallery_name || currentGalleryNameForPhotoView,
                profile_picture_url: photo.profile_picture_url
            };

            photoViewerImage.src = photo.photo_url;
            photoCounter.textContent = `${photoIndex + 1} / ${photoList.length}`;
            currentGalleryForPhotoView = uuid;
            
            addToHistory('photos', {
                id: currentPhotoData.id,
                gallery_uuid: currentPhotoData.gallery_uuid,
                photo_url: currentPhotoData.photo_url,
                gallery_name: currentPhotoData.gallery_name,
                profile_picture_url: currentPhotoData.profile_picture_url
            });

            updateFavoriteButtonState(photo.id);

            if (prevButton) prevButton.classList.toggle('disabled-nav', photoIndex === 0);
            if (nextButton) nextButton.classList.toggle('disabled-nav', photoIndex === photoList.length - 1);
        } else {
            console.error("Photo not found in list, navigating to 404.");
            handleStateChange('main', '404');
        }
    }

    function incrementInteraction(uuid) {
        const formData = new FormData();
        formData.append('action_type', 'increment_interaction');
        formData.append('uuid', uuid);

        fetch(`${window.BASE_PATH}/api/main_handler.php`, {
            method: 'POST',
            body: formData
        });
    }

    function updateMoreOptionsFilterText(filterText, menuId) {
        const moreOptionsMenu = document.querySelector(menuId);
        if (moreOptionsMenu) {
            const filterLink = moreOptionsMenu.querySelector('[data-action="toggle-select"] .menu-link-text span');
            if (filterLink) {
                filterLink.textContent = `Filtros (${filterText})`;
            }
        }
    }

    function updateSelectActiveState(selectId, value) {
        let activeText = '';
        const selectContainers = document.querySelectorAll(`#${selectId}, #${selectId}-mobile`);

        selectContainers.forEach(selectContainer => {
            if (selectContainer) {
                const allLinks = selectContainer.querySelectorAll('.menu-link');
                allLinks.forEach(link => {
                    link.classList.remove('active');
                });
                const activeLink = selectContainer.querySelector(`.menu-link[data-value="${value}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    activeText = activeLink.querySelector('.menu-link-text span').textContent;

                    const wrapper = selectContainer.closest('.select-wrapper');
                    if (wrapper) {
                        const trigger = wrapper.querySelector('[data-action="toggle-select"]');
                        const triggerText = trigger.querySelector('.select-trigger-text');
                        if (triggerText) {
                            triggerText.textContent = activeText;
                        }
                    }
                }
            }
        });

        if (selectId.includes('relevance')) {
            updateMoreOptionsFilterText(activeText, '#more-options-menu');
        } else if (selectId.includes('favorites-sort')) {
            updateMoreOptionsFilterText(activeText, '#more-options-menu-fav');
        }
    }


    function applyViewPreference() {
        const savedView = localStorage.getItem('galleryView') || 'grid';
        currentView = savedView;

        const section = document.querySelector('.general-content-scrolleable > div');
        if (!section) return;

        const gridView = section.querySelector('#grid-view');
        const tableView = section.querySelector('#table-view');
        const toggleViewBtn = document.querySelector('[data-action="toggle-view"]');
        const icon = toggleViewBtn ? toggleViewBtn.querySelector('.material-symbols-rounded') : null;

        if (gridView && tableView && icon) {
            if (savedView === 'table') {
                gridView.classList.remove('active');
                gridView.classList.add('disabled');
                tableView.classList.remove('disabled');
                tableView.classList.add('active');
                icon.textContent = 'grid_view';
            } else {
                tableView.classList.remove('active');
                tableView.classList.add('disabled');
                gridView.classList.remove('disabled');
                gridView.classList.add('active');
                icon.textContent = 'view_list';
            }
        }
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

    function setupEventListeners() {
        document.addEventListener('click', function (event) {
            const actionTarget = event.target.closest('[data-action]');
            const selectTrigger = event.target.closest('[data-action="toggle-select"]');

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

            if (!event.target.closest('.card-actions-container')) {
                document.querySelectorAll('.photo-context-menu.active').forEach(menu => {
                    menu.classList.remove('active');
                    menu.classList.add('disabled');
                    menu.closest('.card-actions-container').classList.remove('force-visible');
                });
            }

            if (actionTarget) {
                const action = actionTarget.dataset.action;

                if (action !== 'download-photo' && !actionTarget.closest('a[target="_blank"]')) {
                    const link = actionTarget.closest('.menu-link');
                    if (link && link.tagName.toLowerCase() === 'a' && !link.getAttribute('href').startsWith('#')) {
                    } else {
                        event.preventDefault();
                    }
                }

                switch (action) {
                    case 'toggleModuleSurface':
                        const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
                        if (moduleSurface) moduleSurface.classList.toggle('disabled');
                        break;
                    case 'toggleSettings':
                        if (currentAppView === 'settings' && currentAppSection === 'accessibility') return;
                        navigateToUrl('settings', 'accessibility');
                        handleStateChange('settings', 'accessibility');
                        break;
                    case 'toggleHelp':
                        if (currentAppView === 'help' && currentAppSection === 'privacyPolicy') return;
                        navigateToUrl('help', 'privacyPolicy');
                        handleStateChange('help', 'privacyPolicy');
                        break;
                    case 'toggleMainView':
                        if (currentAppView === 'main' && currentAppSection === 'home') return;
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home');
                        break;
                    case 'toggleSectionHome':
                    case 'toggleSectionTrends':
                    case 'toggleSectionFavorites':
                    case 'toggleSectionAccessibility':
                    case 'toggleSectionHistoryPrivacy':
                    case 'toggleSectionHistory':
                    case 'toggleSectionPrivacyPolicy':
                    case 'toggleSectionTermsConditions':
                    case 'toggleSectionCookiePolicy':
                    case 'toggleSectionSendFeedback':
                        const sectionName = action.substring("toggleSection".length);
                        const targetSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                        const parentMenu = actionTarget.closest('[data-menu]');
                        const targetView = parentMenu ? parentMenu.dataset.menu : currentAppView;
                        if (currentAppView === targetView && currentAppSection === targetSection) return;
                        navigateToUrl(targetView, targetSection);
                        handleStateChange(targetView, targetSection);
                        break;
                    case 'toggle-view':
                        currentView = (currentView === 'grid') ? 'table' : 'grid';
                        localStorage.setItem('galleryView', currentView);
                        applyViewPreference();
                        break;
                    case 'load-more-users':
                        const homeSearch = document.querySelector('.search-input-text input');
                        fetchAndDisplayGalleries(currentSortBy, homeSearch ? homeSearch.value.trim() : '', true);
                        break;
                    case 'load-more-photos':
                        if (currentGalleryForPhotoView && currentGalleryNameForPhotoView) {
                            fetchAndDisplayGalleryPhotos(currentGalleryForPhotoView, currentGalleryNameForPhotoView, true);
                        }
                        break;
                    case 'returnToUserPhotos':
                        if (lastVisitedView === 'favorites') {
                            navigateToUrl('main', 'favorites');
                            handleStateChange('main', 'favorites');
                        } else if (lastVisitedView === 'userSpecificFavorites' && lastVisitedData && lastVisitedData.uuid) {
                            navigateToUrl('main', 'userSpecificFavorites', { uuid: lastVisitedData.uuid });
                            handleStateChange('main', 'userSpecificFavorites', { uuid: lastVisitedData.uuid });
                        } else if (currentGalleryForPhotoView) {
                            navigateToUrl('main', 'galleryPhotos', { uuid: currentGalleryForPhotoView });
                            handleStateChange('main', 'galleryPhotos', { uuid: currentGalleryForPhotoView });
                        } else {
                            navigateToUrl('main', 'home');
                            handleStateChange('main', 'home');
                        }
                        break;
                    case 'returnToHome':
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home');
                        break;
                    case 'returnToFavorites':
                        navigateToUrl('main', 'favorites');
                        handleStateChange('main', 'favorites');
                        break;
                    case 'toggle-favorite':
                        if (currentPhotoData) toggleFavorite(currentPhotoData);
                        break;
                    case 'toggle-favorite-card':
                        const photoIdFav = actionTarget.dataset.photoId;
                        const allPhotos = [...getFavorites(), ...currentGalleryPhotoList, ...currentTrendingPhotosList];
                        const photoDataFav = allPhotos.find(p => p.id == photoIdFav);

                        if (photoDataFav) {
                            const fullPhotoData = {
                                id: photoDataFav.id,
                                gallery_uuid: photoDataFav.gallery_uuid || currentGalleryForPhotoView,
                                photo_url: photoDataFav.photo_url,
                                gallery_name: photoDataFav.gallery_name || currentGalleryNameForPhotoView,
                                profile_picture_url: photoDataFav.profile_picture_url
                            };
                            toggleFavorite(fullPhotoData);
                            const activeSection = document.querySelector('.general-content-scrolleable > div')?.dataset.section;

                            if (activeSection === 'userSpecificFavorites') {
                                handleStateChange('main', 'userSpecificFavorites', { uuid: document.querySelector('[data-section="userSpecificFavorites"]').dataset.uuid });
                            } else if (activeSection === 'favorites') {
                                displayFavoritePhotos();
                            }
                        }
                        break;
                    case 'previous-photo':
                    case 'next-photo':
                        if (!actionTarget.classList.contains('disabled-nav')) {
                            let listToUse = [];
                            if (lastVisitedView === 'favorites' || lastVisitedView === 'userSpecificFavorites') {
                                listToUse = currentFavoritesList;
                            } else if (lastVisitedView === 'trends') {
                                listToUse = currentTrendingPhotosList;
                            } else {
                                listToUse = currentGalleryPhotoList;
                            }

                            const currentId = currentPhotoData ? currentPhotoData.id : null;
                            if (!currentId || listToUse.length === 0) return;

                            const currentIndex = listToUse.findIndex(p => p.id == currentId);
                            if (currentIndex !== -1) {
                                let nextIndex = (action === 'next-photo') ? currentIndex + 1 : currentIndex - 1;
                                if (nextIndex >= 0 && nextIndex < listToUse.length) {
                                    const nextPhoto = listToUse[nextIndex];
                                    navigateToUrl('main', 'photoView', { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id });
                                    handleStateChange('main', 'photoView', { uuid: nextPhoto.gallery_uuid, photoId: nextPhoto.id });
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
                            actionTarget.closest('.photo-context-menu').classList.add('disabled');
                            actionTarget.closest('.card-actions-container').classList.remove('force-visible');
                        }).catch(err => console.error('Failed to copy: ', err));
                        break;
                    case 'download-photo':
                        const cardForDownload = actionTarget.closest('.card.photo-card');
                        if (cardForDownload && cardForDownload.dataset.photoUrl) {
                            downloadPhoto(cardForDownload.dataset.photoUrl);
                        }
                        break;
                    case 'access-code-submit':
                        const promptContainer = document.querySelector('[data-section="accessCodePrompt"]');
                        const uuid = promptContainer.dataset.galleryUuid;
                        const codeInput = document.getElementById('access-code-input');
                        const error = document.getElementById('access-code-error');
                        const code = codeInput.value;

                        if (!uuid || !code) {
                            error.textContent = 'Por favor, introduce un código.';
                            return;
                        }

                        const formData = new FormData();
                        formData.append('action_type', 'verify_code');
                        formData.append('uuid', uuid);
                        formData.append('code', code);

                        fetch(`${window.BASE_PATH}/api/main_handler.php`, {
                            method: 'POST',
                            body: formData
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    const galleryTitle = document.getElementById('access-code-title').textContent.replace('Galería de ', '');
                                    navigateToUrl('main', 'galleryPhotos', { uuid: uuid });
                                    handleStateChange('main', 'galleryPhotos', { uuid: uuid, galleryName: galleryTitle });
                                } else {
                                    error.textContent = data.message || 'Error al verificar el código.';
                                }
                            });
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
                if (!value) return;

                const selectContainer = selectedOption.closest('.module-select');
                const selectId = selectContainer.id;

                if (selectId.includes('relevance-select')) {
                    if (value !== currentSortBy) {
                        currentSortBy = value;
                        const homeSearch = document.querySelector('.search-input-text input');
                        fetchAndDisplayGalleries(currentSortBy, homeSearch ? homeSearch.value.trim() : '');
                        updateSelectActiveState('relevance-select', currentSortBy);
                    }
                }
                else if (selectId.includes('favorites-sort-select')) {
                    if (value !== currentFavoritesSortBy) {
                        currentFavoritesSortBy = value;
                        displayFavoritePhotos();
                        updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);
                    }
                }
                else if (selectId === 'theme-select') {
                    setTheme(value);
                }
                else if (selectId === 'language-select') {
                    setLanguage(value);
                } else if (selectId.includes('history-select')) {
                    document.querySelectorAll('[data-history-view]').forEach(view => {
                        view.style.display = view.dataset.historyView === value ? '' : 'none';
                    });
                    updateSelectActiveState('history-select', value);
                    displayHistory();
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
                    handleStateChange('main', 'userSpecificFavorites', { uuid: uuid });
                    return;
                }

                const galleryElement = event.target.closest('.card:not(.photo-card):not(.user-card), tr[data-uuid]');
                if (galleryElement && galleryElement.dataset.uuid) {
                    const uuid = galleryElement.dataset.uuid;
                    const name = galleryElement.dataset.name;
                    const isPrivate = galleryElement.dataset.privacy === '1';

                    incrementInteraction(uuid);

                    if (isPrivate) {
                        promptForAccessCode(uuid, name);
                    } else {
                        navigateToUrl('main', 'galleryPhotos', { uuid: uuid, galleryName: name });
                        handleStateChange('main', 'galleryPhotos', { uuid: uuid, galleryName: name });
                    }
                    return;
                }

                const photoCard = event.target.closest('.card.photo-card');
                if (photoCard) {
                    const galleryUuid = photoCard.dataset.galleryUuid || currentGalleryForPhotoView;
                    const photoId = photoCard.dataset.photoId;
                    incrementInteraction(galleryUuid);

                    navigateToUrl('main', 'photoView', { uuid: galleryUuid, photoId: photoId });
                    handleStateChange('main', 'photoView', { uuid: galleryUuid, photoId: photoId });
                    return;
                }
            }

        });

        document.addEventListener('keydown', function (event) {
            const input = event.target;

            if (event.key === 'Enter' && input.tagName.toLowerCase() === 'input' && input.closest('.search-input-wrapper')) {
                event.preventDefault();
                
                const searchTerm = input.value.trim();
                const section = input.closest('.section-content')?.dataset.section;

                if (section === 'home') {
                    fetchAndDisplayGalleries(currentSortBy, searchTerm);
                } else if (section === 'trends') {
                    fetchAndDisplayTrends(searchTerm);
                } else if (section === 'favorites') {
                    displayFavoritePhotos();
                }
            }

            const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
            if (event.key === 'Escape' && moduleSurface && !moduleSurface.classList.contains('disabled')) {
                moduleSurface.classList.add('disabled');
            }
        });
    }

    function setupScrollShadows() {
        activeScrollHandlers.forEach(({ element, listener }) => {
            element.removeEventListener('scroll', listener);
        });
        activeScrollHandlers = [];

        const mainScrolleable = document.querySelector('.general-content-scrolleable');
        const mainHeader = document.querySelector('.general-content-top');

        if (mainScrolleable && mainHeader) {
            const mainListener = () => {
                mainHeader.classList.toggle('shadow', mainScrolleable.scrollTop > 0);
            };
            mainScrolleable.addEventListener('scroll', mainListener);
            activeScrollHandlers.push({ element: mainScrolleable, listener: mainListener });
            mainListener();
        }

        const sectionScrolleable = document.querySelector('.section-content-block.overflow-y');
        const sectionHeader = document.querySelector('.section-content-header');

        if (sectionScrolleable && sectionHeader) {
            const sectionListener = () => {
                sectionHeader.classList.toggle('shadow', sectionScrolleable.scrollTop > 0);
            };
            sectionScrolleable.addEventListener('scroll', sectionListener);
            activeScrollHandlers.push({ element: sectionScrolleable, listener: sectionListener });
            sectionListener();
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

    // *** FUNCIÓN displayHistory FINAL Y CORREGIDA ***
    function displayHistory() {
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
        
        const currentView = historySelect ? (historySelect.querySelector('.menu-link.active')?.dataset.value || 'views') : 'views';
        const isViewHistoryPaused = localStorage.getItem('enable-view-history') === 'false';
        const isSearchHistoryPaused = localStorage.getItem('enable-search-history') === 'false';

        // Resetear estado visual
        historyContainer.style.display = 'none';
        statusContainer.classList.add('disabled');
        pausedAlert.classList.add('disabled');
        profilesGrid.innerHTML = '';
        photosGrid.innerHTML = '';
        searchesList.innerHTML = '';

        if (currentView === 'views') {
            const hasContent = history.profiles.length > 0 || history.photos.length > 0;

            if (hasContent) {
                historyContainer.style.display = 'block';
                if (isViewHistoryPaused) {
                    pausedAlert.classList.remove('disabled');
                }
                
                if (history.profiles.length > 0) {
                     history.profiles.forEach(profile => {
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
                        textContainer.innerHTML = `<span>${profile.name}</span><span style="font-size: 0.8rem; display: block;">Visto: ${new Date(profile.visited_at).toLocaleString()}</span>`;
                        overlay.appendChild(textContainer);
                        card.appendChild(overlay);
                        profilesGrid.appendChild(card);
                    });
                }
                
                if (history.photos.length > 0) {
                     history.photos.forEach(photo => {
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
                        textContainer.innerHTML = `<span>${photo.gallery_name}</span><span style="font-size: 0.8rem; display: block;">Visto: ${new Date(photo.visited_at).toLocaleString()}</span>`;
                        overlay.appendChild(textContainer);
                        card.appendChild(overlay);
                        photosGrid.appendChild(card);
                    });
                }
            } else { // No hay contenido
                if (isViewHistoryPaused) {
                    statusContainer.innerHTML = '<div><h2>El historial de perfiles y fotos está pausado</h2><p>Tu actividad de visualización no se guardará mientras esta opción esté desactivada.</p></div>';
                    statusContainer.classList.remove('disabled');
                } else {
                    statusContainer.innerHTML = '<div><h2>No hay actividad para mostrar</h2><p>Los perfiles y fotos que hayas visto recientemente aparecerán aquí.</p></div>';
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
                history.searches.forEach(search => {
                    const item = document.createElement('div');
                    item.className = 'search-history-item';
                    item.innerHTML = `
                        <div class="search-history-text">
                            <span class="search-term">"${search.term}"</span>
                            <span class="search-details">en ${search.section} - ${new Date(search.searched_at).toLocaleString()}</span>
                        </div>
                    `;
                    searchesList.appendChild(item);
                });
            } else { // No hay contenido
                if (isSearchHistoryPaused) {
                    statusContainer.innerHTML = '<div><h2>El historial de búsqueda está pausado</h2><p>Tus búsquedas no se guardarán mientras esta opción esté desactivada.</p></div>';
                    statusContainer.classList.remove('disabled');
                } else {
                    statusContainer.innerHTML = '<div><h2>No tienes búsquedas recientes</h2><p>Los términos que busques en la aplicación aparecerán aquí.</p></div>';
                    statusContainer.classList.remove('disabled');
                }
            }
        }
    }


    async function handleStateChange(view, section, data) {
        const contentContainer = document.querySelector('.general-content-scrolleable');
        if (contentContainer) {
            contentContainer.innerHTML = loaderHTML;
        }

        updateHeaderAndMenuStates(view, section);
        currentAppView = view;
        currentAppSection = section;

        try {
            const response = await fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=section&view=${view}&section=${section}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const html = await response.text();
            if (contentContainer) {
                contentContainer.innerHTML = html;
            }
        } catch (error) {
            console.error("Failed to fetch section:", error);
            if (contentContainer) {
                const errorHtml = await fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=section&view=main&section=404`).then(res => res.text());
                contentContainer.innerHTML = errorHtml;
            }
            return;
        }

        if (section !== 'photoView') {
            lastVisitedView = section;
            lastVisitedData = data;
        }

        switch (section) {
            case 'home':
                applyViewPreference();
                setupMoreOptionsMenu();
                updateSelectActiveState('relevance-select', currentSortBy);
                fetchAndDisplayGalleries(currentSortBy);
                break;
            case 'favorites':
                setupMoreOptionsMenu();
                updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);
                displayFavoritePhotos();
                break;
            case 'trends':
                fetchAndDisplayTrends();
                break;
            case 'accessibility':
                updateThemeSelectorUI(localStorage.getItem('theme') || 'system');
                updateLanguageSelectorUI(localStorage.getItem('language') || 'es-LA');
                initSettingsController();
                break;
            case 'history':
                displayHistory();
                break;
            case 'historyPrivacy':
                initHistoryPrivacySettings();
                break;
            case 'galleryPhotos':
                if (data && data.uuid) {
                    if (data.galleryName) {
                        fetchAndDisplayGalleryPhotos(data.uuid, data.galleryName);
                    } else {
                        fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${data.uuid}`)
                            .then(res => res.json())
                            .then(gallery => {
                                if (gallery && gallery.name) {
                                    addToHistory('profiles', { 
                                        id: gallery.uuid, 
                                        name: gallery.name, 
                                        privacy: gallery.privacy,
                                        profile_picture_url: gallery.profile_picture_url,
                                        background_photo_url: gallery.background_photo_url 
                                    });
                                    fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name);
                                } else {
                                    handleStateChange('main', '404');
                                }
                            });
                    }
                }
                break;
            case 'photoView':
                if (data && data.uuid && data.photoId) {
                    let photoList;

                    if (lastVisitedView === 'userSpecificFavorites' && lastVisitedData && lastVisitedData.uuid) {
                        photoList = getFavorites().filter(p => p.gallery_uuid === data.uuid);
                        renderPhotoView(data.uuid, data.photoId, photoList);
                    } else if (lastVisitedView === 'favorites') {
                        photoList = currentFavoritesList;
                        renderPhotoView(data.uuid, data.photoId, photoList);
                    } else if (lastVisitedView === 'trends') {
                        photoList = currentTrendingPhotosList;
                        renderPhotoView(data.uuid, data.photoId, photoList);
                    } else {
                        if (currentGalleryForPhotoView === data.uuid && currentGalleryPhotoList.length > 0) {
                            renderPhotoView(data.uuid, data.photoId, currentGalleryPhotoList);
                        } else {
                            fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=photos&uuid=${data.uuid}&limit=1000`)
                                .then(res => res.json())
                                .then(photos => {
                                    currentGalleryPhotoList = photos;
                                    currentGalleryForPhotoView = data.uuid;
                                    renderPhotoView(data.uuid, data.photoId, photos);
                                });
                        }
                    }
                }
                break;
            case 'accessCodePrompt':
                if (data && data.uuid) {
                    const promptContainer = document.querySelector('[data-section="accessCodePrompt"]');
                    if (promptContainer) {
                        promptContainer.dataset.galleryUuid = data.uuid;
                    }

                    const titleElement = document.getElementById('access-code-title');
                    fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${data.uuid}`)
                        .then(res => res.json())
                        .then(gallery => {
                            if (gallery && gallery.name && titleElement) {
                                titleElement.textContent = `Galería de ${gallery.name}`;
                            }
                        });

                    const codeInput = document.getElementById('access-code-input');
                    if (codeInput) {
                        codeInput.addEventListener('input', (e) => {
                            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

                            if (value.length > 4) {
                                value = value.slice(0, 4) + '-' + value.slice(4);
                            }

                            e.target.value = value;
                        });
                    }
                }
                break;
            case 'userSpecificFavorites':
                if (data && data.uuid) {
                    const userFavorites = getFavorites().filter(p => p.gallery_uuid === data.uuid);
                    const sectionEl = document.querySelector('[data-section="userSpecificFavorites"]');
                    if (sectionEl) {
                        const grid = sectionEl.querySelector('#user-specific-favorites-grid');
                        const statusContainer = sectionEl.querySelector('.status-message-container');
                        const title = sectionEl.querySelector('#user-specific-favorites-title');
                        sectionEl.dataset.uuid = data.uuid;

                        if (userFavorites.length > 0) {
                            grid.classList.remove('disabled');
                            statusContainer.classList.add('disabled');
                            title.textContent = `Favoritos de ${userFavorites[0].gallery_name}`;
                            userFavorites.forEach(photo => {
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
                                card.innerHTML += `<div class="card-actions-container"><div class="card-hover-overlay"><div class="card-hover-icons"><div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div><div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div></div></div><div class="module-content module-select photo-context-menu disabled body-title"><div class="menu-content"><div class="menu-list"><a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a><div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div><a class="menu-link" href="#" data-action="download-photo"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a></div></div></div></div>`;
                                grid.appendChild(card);
                            });
                        } else {
                            grid.classList.add('disabled');
                            statusContainer.classList.remove('disabled');
                            title.textContent = 'Sin favoritos';
                            statusContainer.innerHTML = '<div><h2>No tienes favoritos de este usuario</h2><p>Las fotos que marques como favoritas de este usuario aparecerán aquí.</p></div>';
                        }
                    }
                }
                break;
        }

        setupScrollShadows();
        updateHeaderAndMenuStates(view, section);
    }

    // --- INICIALIZACIÓN ---
    setupEventListeners();

    setupPopStateHandler((view, section, pushState, data) => {
        handleStateChange(view, section, data);
    });

    const path = window.location.pathname.replace(window.BASE_PATH || '', '').slice(1);

    const routes = {
        '': { view: 'main', section: 'home' },
        'trends': { view: 'main', section: 'trends' },
        'favorites': { view: 'main', section: 'favorites' },
        'settings/accessibility': { view: 'settings', section: 'accessibility' },
        'settings/history-privacy': { view: 'settings', section: 'historyPrivacy' },
        'settings/history': { view: 'settings', section: 'history' },
        'help/privacy-policy': { view: 'help', section: 'privacyPolicy' },
        'help/terms-conditions': { view: 'help', section: 'termsConditions' },
        'help/cookie-policy': { view: 'help', section: 'cookiePolicy' },
        'help/send-feedback': { view: 'help', section: 'sendFeedback' }
    };

    let initialRoute = routes[path] || null;
    let initialStateData = null;

    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);
    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const accessCodeMatch = path.match(/^gallery\/([a-f0-9-]{36})\/access-code$/);
    const userFavoritesMatch = path.match(/^favorites\/([a-f0-9-]{36})$/);

    if (galleryMatch) {
        initialRoute = { view: 'main', section: 'galleryPhotos' };
        initialStateData = { uuid: galleryMatch[1] };
    } else if (photoMatch) {
        initialRoute = { view: 'main', section: 'photoView' };
        initialStateData = { uuid: photoMatch[1], photoId: photoMatch[2] };
    } else if (accessCodeMatch) {
        initialRoute = { view: 'main', section: 'accessCodePrompt' };
        initialStateData = { uuid: accessCodeMatch[1] };
    } else if (userFavoritesMatch) {
        initialRoute = { view: 'main', section: 'userSpecificFavorites' };
        initialStateData = { uuid: userFavoritesMatch[1] };
    }

    if (!initialRoute) {
        initialRoute = { view: 'main', section: '404' };
    }

    setInitialHistoryState(initialRoute.view, initialRoute.section, initialStateData);
    handleStateChange(initialRoute.view, initialRoute.section, initialStateData);

    if (initialRoute.section !== 'photoView') {
        lastVisitedView = initialRoute.section;
        lastVisitedData = initialStateData;
    }
}