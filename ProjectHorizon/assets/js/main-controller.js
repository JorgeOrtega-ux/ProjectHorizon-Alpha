// assets/js/main-controller.js

import { navigateToUrl, setupPopStateHandler, setInitialHistoryState, generateUrl } from './url-manager.js';
import { setTheme } from './theme-manager.js';
import { setLanguage } from './language-manager.js';

function getFavorites() {
    const favorites = localStorage.getItem('favoritePhotos');
    return favorites ? JSON.parse(favorites) : [];
}

export function initMainController() {
    console.log("Fotos favoritas guardadas:");
    console.table(getFavorites());

    let currentView = 'grid';
    let currentSortBy = 'relevant';
    let searchDebounceTimer;
    let currentGalleryForPhotoView = null;
    let currentGalleryNameForPhotoView = null;
    let currentGalleryPhotoList = [];
    let currentPhotoData = null;
    let lastVisitedView = null;
    let lastVisitedData = null;

    let galleriesCurrentPage = 1;
    let photosCurrentPage = 1;
    let isLoadingGalleries = false;
    let isLoadingPhotos = false;
    const BATCH_SIZE = 20;

    let currentFavoritesSortBy = 'user';
    
    const loaderHTML = '<div class="loader-container"><div class="spinner"></div></div>';


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
            const photoToAdd = { ...photoData, added_at: Date.now() };
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
        const allPhotosContainer = document.getElementById('favorites-grid-view');
        const byUserContainer = document.getElementById('favorites-grid-view-by-user');
        const searchInput = document.getElementById('favorites-search-input');
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        allPhotosContainer.innerHTML = '';
        byUserContainer.innerHTML = '';

        let favorites = getFavorites();

        if (searchTerm) {
            favorites = favorites.filter(photo =>
                photo.gallery_name.toLowerCase().includes(searchTerm)
            );
        }

        if (currentFavoritesSortBy === 'user') {
            allPhotosContainer.classList.remove('active');
            allPhotosContainer.classList.add('disabled');
            byUserContainer.classList.add('active');
            byUserContainer.classList.remove('disabled');

            const galleries = favorites.reduce((acc, photo) => {
                if (!acc[photo.gallery_uuid]) {
                    acc[photo.gallery_uuid] = { name: photo.gallery_name, photos: [] };
                }
                acc[photo.gallery_uuid].photos.push(photo);
                return acc;
            }, {});

            if (Object.keys(galleries).length > 0) {
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
                    const textContainer = document.createElement('div');
                    textContainer.className = 'card-text';
                    textContainer.innerHTML = `<span>${gallery.name}</span><span style="font-size: 0.8rem; display: block;">${gallery.photos.length} ${gallery.photos.length > 1 ? 'fotos' : 'foto'}</span>`;
                    overlay.appendChild(textContainer);
                    card.appendChild(overlay);
                    byUserContainer.appendChild(card);
                }
            } else {
                byUserContainer.innerHTML = '<p>No se encontraron favoritos.</p>';
            }
        } else {
            allPhotosContainer.classList.add('active');
            allPhotosContainer.classList.remove('disabled');
            byUserContainer.classList.remove('active');
            byUserContainer.classList.add('disabled');

            if (currentFavoritesSortBy === 'oldest') {
                favorites.sort((a, b) => (a.added_at || 0) - (b.added_at || 0));
            } else {
                favorites.sort((a, b) => (b.added_at || 0) - (a.added_at || 0));
            }

            if (favorites.length > 0) {
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
                        <div class="module-content module-select photo-context-menu disabled">
                            <div class="menu-content"><div class="menu-list">
                                <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a>
                                <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div>
                                <a class="menu-link disabled-link" href="javascript:void(0);"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a>
                            </div></div>
                        </div>
                    </div>`;
                    allPhotosContainer.appendChild(card);
                });
            } else {
                allPhotosContainer.innerHTML = '<p>No se encontraron favoritos.</p>';
            }
        }
    }

    function handleNavigation(view, section, pushState = true, data = null) {
        if (pushState) {
            navigateToUrl(view, section, data);
        }

        document.querySelectorAll('.section-container').forEach(v => {
            v.classList.toggle('active', v.dataset.view === view);
            v.classList.toggle('disabled', v.dataset.view !== view);
        });

        document.querySelectorAll('[data-menu]').forEach(menu => {
            menu.classList.toggle('active', menu.dataset.menu === view);
            menu.classList.toggle('disabled', menu.dataset.menu !== view);
        });

        const activeViewContainer = document.querySelector(`.section-container[data-view="${view}"]`);
        if (activeViewContainer) {
            activeViewContainer.querySelectorAll('.section-content').forEach(s => {
                s.classList.toggle('active', s.dataset.section === section);
                s.classList.toggle('disabled', s.dataset.section !== section);
            });
        }

        document.querySelectorAll('[data-module="moduleSurface"] .menu-link').forEach(link => {
            const linkAction = link.dataset.action;
            let linkSection = '';
            if (linkAction && linkAction.startsWith('toggleSection')) {
                const sectionName = linkAction.substring("toggleSection".length);
                linkSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
            }
            link.classList.toggle('active', linkSection === section);
        });

        const backButton = document.querySelector('[data-action="toggleMainView"]');
        if (backButton) {
            backButton.classList.remove('active');
        }
        
        if(section !== 'photoView') {
            lastVisitedView = section;
            lastVisitedData = data;
        }
    }

    function displayGalleriesAsGrid(galleries, container, sortBy, append = false) {
        if (!append) {
            container.innerHTML = '';
        }
        if (galleries.length > 0) {
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
        } else if (!append) {
            container.innerHTML = '<p>No se encontraron galerías.</p>';
        }
    }

    function displayGalleriesAsTable(galleries, container, append = false) {
        const tbody = container.querySelector('tbody');
        if (!append) {
            tbody.innerHTML = '';
        }
        if (galleries.length > 0) {
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
        } else if (!append) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No se encontraron galerías.';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tbody.appendChild(row);
        }
    }

    function promptForAccessCode(uuid, name) {
        handleNavigation('main', 'accessCodePrompt', true, { uuid: uuid });

        const title = document.getElementById('access-code-title');
        const promptContainer = document.querySelector('[data-section="accessCodePrompt"]');
        const input = document.getElementById('access-code-input');
        const error = document.getElementById('access-code-error');

        title.textContent = `Galería de ${name}`;
        promptContainer.dataset.galleryUuid = uuid;
        input.value = '';
        error.textContent = '';
    }

    function fetchAndDisplayGalleries(sortBy = 'relevant', searchTerm = '', append = false) {
        if (isLoadingGalleries) return;
        isLoadingGalleries = true;

        const gridContainer = document.getElementById('grid-view');
        const tableContainer = document.getElementById('table-view');

        if (!append) {
            galleriesCurrentPage = 1;
            if(gridContainer) gridContainer.innerHTML = loaderHTML;
            if(tableContainer) tableContainer.querySelector('tbody').innerHTML = `<tr><td colspan="4">${loaderHTML}</td></tr>`;
        }

        const encodedSearchTerm = encodeURIComponent(searchTerm);
        const url = `${window.BASE_PATH}/api/main_handler.php?request_type=galleries&sort=${sortBy}&search=${encodedSearchTerm}&page=${galleriesCurrentPage}&limit=${BATCH_SIZE}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const loadMoreContainer = document.getElementById('users-load-more-container');

                if (gridContainer) displayGalleriesAsGrid(data, gridContainer, sortBy, append);
                if (tableContainer) displayGalleriesAsTable(data, tableContainer, append);

                if (data.length < BATCH_SIZE) {
                    loadMoreContainer.classList.add('disabled');
                } else {
                    loadMoreContainer.classList.remove('disabled');
                    galleriesCurrentPage++;
                }
            })
            .catch(error => {
                console.error('Error al obtener las galerías:', error);
                if (gridContainer && !append) gridContainer.innerHTML = '<p>Error al cargar galerías.</p>';
            })
            .finally(() => {
                isLoadingGalleries = false;
            });
    }

    function fetchAndDisplayGalleryPhotos(uuid, galleryName, append = false) {
         const grid = document.getElementById('user-photos-grid');

        if (!append) {
            photosCurrentPage = 1;
            currentGalleryPhotoList = [];
            
            if (grid) grid.innerHTML = loaderHTML;

            handleNavigation('main', 'galleryPhotos', true, { uuid: uuid });
        }

        if (isLoadingPhotos) return;
        isLoadingPhotos = true;

        currentGalleryForPhotoView = uuid;
        currentGalleryNameForPhotoView = galleryName;

        const title = document.getElementById('user-photos-title');
        const loadMoreContainer = document.getElementById('photos-load-more-container');

        if (!append) {
            title.textContent = galleryName ? galleryName : 'Cargando...';
        }

        fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=photos&uuid=${uuid}&page=${photosCurrentPage}&limit=${BATCH_SIZE}`)
            .then(response => response.json())
            .then(photos => {
                if (!append) grid.innerHTML = '';

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
                                <div class="module-content module-select photo-context-menu disabled">
                                    <div class="menu-content"><div class="menu-list">
                                        <a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a>
                                        <div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div>
                                        <a class="menu-link disabled-link" href="javascript:void(0);"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a>
                                    </div></div>
                                </div>
                            </div>
                        `;

                        grid.appendChild(card);
                        updateFavoriteCardState(photo.id);
                    });
                } else if (!append) {
                    grid.innerHTML = '<p>Esta galería no tiene fotos.</p>';
                }

                if (photos.length < BATCH_SIZE) {
                    loadMoreContainer.classList.add('disabled');
                } else {
                    loadMoreContainer.classList.remove('disabled');
                    photosCurrentPage++;
                }
            })
            .catch(error => {
                console.error('Error al obtener las fotos:', error);
                if (!append) grid.innerHTML = '<p>Error al cargar las fotos.</p>';
            })
            .finally(() => {
                isLoadingPhotos = false;
            });
    }

function displayPhoto(uuid, photoId, photoList = null) {
    handleNavigation('main', 'photoView', true, { uuid: uuid, photoId: photoId });
    const photoViewerImage = document.getElementById('photo-viewer-image');
    const photoCounter = document.getElementById('photo-counter');
    const photoViewUserTitle = document.getElementById('photo-view-user-title');
    const prevButton = document.querySelector('[data-action="previous-photo"]');
    const nextButton = document.querySelector('[data-action="next-photo"]');

    const displayFetchedPhoto = (list) => {
        const photoIndex = list.findIndex(p => p.id == photoId);
        if (photoIndex !== -1) {
            const photo = list[photoIndex];
            
            if (photo.gallery_name) {
                currentGalleryNameForPhotoView = photo.gallery_name;
                photoViewUserTitle.textContent = photo.gallery_name;
            } else if (currentGalleryForPhotoView !== uuid) {
                fetchAndSetGalleryName(uuid);
            } else if (currentGalleryNameForPhotoView) {
                photoViewUserTitle.textContent = currentGalleryNameForPhotoView;
            }

            currentPhotoData = { id: photo.id, gallery_uuid: uuid, photo_url: photo.photo_url, gallery_name: photo.gallery_name || currentGalleryNameForPhotoView };
            
            photoViewerImage.src = photo.photo_url;
            photoCounter.textContent = `${photoIndex + 1} / ${list.length}`;
            currentGalleryForPhotoView = uuid;
            
            updateFavoriteButtonState(photo.id);

            prevButton.classList.toggle('disabled-nav', photoIndex === 0);
            nextButton.classList.toggle('disabled-nav', photoIndex === list.length - 1);
        } else {
            handleNavigation('main', '404');
        }
    };
    
    const fetchAndSetGalleryName = (galleryUuid) => {
         fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${galleryUuid}`)
            .then(res => res.json())
            .then(gallery => {
                if (gallery && gallery.name) {
                    currentGalleryNameForPhotoView = gallery.name;
                    photoViewUserTitle.textContent = gallery.name;
                }
            });
    };

    if (photoList) {
        currentGalleryPhotoList = photoList;
        displayFetchedPhoto(photoList);
    } else if (currentGalleryPhotoList.length === 0 || currentGalleryForPhotoView !== uuid) {
        fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=photos&uuid=${uuid}&limit=1000`)
            .then(res => res.json())
            .then(photos => {
                currentGalleryPhotoList = photos;
                displayFetchedPhoto(photos);
            });
    } else {
        displayFetchedPhoto(currentGalleryPhotoList);
    }
}

    function incrementInteraction(uuid) {
        const formData = new FormData();
        formData.append('action_type', 'increment_interaction');
        formData.append('uuid', uuid);

        fetch(`${window.BASE_PATH}/api/main_handler.php`, { method: 'POST', body: formData });
    }

    function updateSelectActiveState(selectId, value) {
        const selectContainer = document.getElementById(selectId);
        if (selectContainer) {
            const allLinks = selectContainer.querySelectorAll('.menu-link');
            allLinks.forEach(link => {
                link.classList.remove('active');
            });
            const activeLink = selectContainer.querySelector(`.menu-link[data-value="${value}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    function setupEventListeners() {
        const toggleViewBtn = document.querySelector('[data-action="toggle-view"]');
        const searchInput = document.querySelector('.search-input-text input');
        const favoritesSearchInput = document.getElementById('favorites-search-input');
        const menuButton = document.querySelector('[data-action="toggleModuleSurface"]');
        const settingsButton = document.querySelector('[data-action="toggleSettings"]');
        const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
        const allMenuLinks = document.querySelectorAll('.menu-link');
        const accessCodeSubmitBtn = document.getElementById('access-code-submit');

        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', () => {
                const gridView = document.getElementById('grid-view');
                const tableView = document.getElementById('table-view');
                const icon = toggleViewBtn.querySelector('.material-symbols-rounded');
                if (currentView === 'grid') {
                    gridView.classList.remove('active'); gridView.classList.add('disabled');
                    tableView.classList.remove('disabled'); tableView.classList.add('active');
                    icon.textContent = 'grid_view'; currentView = 'table';
                } else {
                    tableView.classList.remove('active'); tableView.classList.add('disabled');
                    gridView.classList.remove('disabled'); gridView.classList.add('active');
                    icon.textContent = 'view_list'; currentView = 'grid';
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    const searchTerm = searchInput.value.trim();
                    fetchAndDisplayGalleries(currentSortBy, searchTerm);
                }, 300);
            });
        }

        if (favoritesSearchInput) {
            favoritesSearchInput.addEventListener('input', () => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    displayFavoritePhotos();
                }, 300);
            });
        }

        if (menuButton) {
            menuButton.addEventListener('click', () => {
                moduleSurface.classList.toggle('disabled');
                moduleSurface.classList.toggle('active');
            });
        }

        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                handleNavigation('settings', 'accessibility');
            });
        }

        allMenuLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                const action = this.dataset.action;
                if (action && action !== 'toggle-select' && !this.closest('.photo-context-menu')) { e.preventDefault(); }
                if (action === 'toggleMainView') { handleNavigation('main', 'home'); return; }
                if (action && action.startsWith('toggleSection')) {
                    const sectionName = action.substring("toggleSection".length);
                    const targetSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                    const parentMenu = this.closest('[data-menu]');
                    const targetView = parentMenu ? parentMenu.dataset.menu : 'main';
                    handleNavigation(targetView, targetSection);
                }
            });
        });

        document.addEventListener('click', function (event) {
            if (moduleSurface && moduleSurface.classList.contains('active')) {
                const isClickInsideModule = moduleSurface.contains(event.target);
                const isClickOnMenuButton = menuButton && menuButton.contains(event.target);
                if (!isClickInsideModule && !isClickOnMenuButton) {
                    moduleSurface.classList.add('disabled');
                    moduleSurface.classList.remove('active');
                }
            }

            const selectedOption = event.target.closest('.module-select .menu-link');
            if (selectedOption && !selectedOption.closest('#view-select') && !selectedOption.closest('#view-select-fav') && !selectedOption.closest('#theme-select') && !selectedOption.closest('#language-select')) {
                const selectContainer = selectedOption.closest('.module-select');
                const wrapper = selectContainer.closest('.select-wrapper');
                if (wrapper) {
                    const currentTrigger = wrapper.querySelector('[data-action="toggle-select"]');
                    const triggerText = currentTrigger.querySelector('.select-trigger-text');
                    const optionText = selectedOption.querySelector('.menu-link-text span');
                    if (triggerText && optionText) triggerText.textContent = optionText.textContent;

                    selectContainer.classList.add('disabled');
                    selectContainer.classList.remove('active');
                    currentTrigger.classList.remove('active-trigger');
                    return;
                }
            }

            const userCardFavorite = event.target.closest('#favorites-grid-view-by-user .user-card');
            if (userCardFavorite) {
                const uuid = userCardFavorite.dataset.uuid;
                // --- CORRECCIÓN ---
                navigateToUrl('main', 'userSpecificFavorites', { uuid: uuid });
                handleStateChange('main', 'userSpecificFavorites', { uuid: uuid }); // Llamar a handleStateChange para cargar el contenido
                return;
            }

            const galleryElement = event.target.closest('.card:not(.photo-card):not(.user-card), tr[data-uuid]');
            if (galleryElement && galleryElement.dataset.uuid && !event.target.closest('.card-actions-container')) {
                const uuid = galleryElement.dataset.uuid;
                const name = galleryElement.dataset.name;
                const isPrivate = galleryElement.dataset.privacy === '1';

                incrementInteraction(uuid);

                if (isPrivate) {
                    promptForAccessCode(uuid, name);
                } else {
                    fetchAndDisplayGalleryPhotos(uuid, name);
                }
                return;
            }

            const photoCard = event.target.closest('.card.photo-card');
            if (photoCard && !event.target.closest('.card-actions-container')) {
                const galleryUuid = photoCard.dataset.galleryUuid || currentGalleryForPhotoView;
                const photoId = photoCard.dataset.photoId;
                incrementInteraction(galleryUuid);

                const activeSection = document.querySelector('.section-content.active')?.dataset.section;
                
                let photoList = (activeSection === 'favorites' || activeSection === 'userSpecificFavorites') 
                    ? getFavorites() 
                    : currentGalleryPhotoList;

                if (activeSection === 'userSpecificFavorites') {
                    photoList = photoList.filter(p => p.gallery_uuid === galleryUuid);
                }

                displayPhoto(galleryUuid, photoId, photoList);
                return;
            }

            const actionTarget = event.target.closest('[data-action]');

            if (!actionTarget || !actionTarget.dataset.action.includes('toggle')) {
                document.querySelectorAll('.module-select:not(.photo-context-menu).active').forEach(menu => {
                    menu.classList.remove('active'); menu.classList.add('disabled');
                });
                document.querySelectorAll('.active-trigger').forEach(trigger => trigger.classList.remove('active-trigger'));
            }

            if (!actionTarget) return;

            const action = actionTarget.dataset.action;

            switch (action) {
                case 'load-more-users':
                    fetchAndDisplayGalleries(currentSortBy, searchInput.value.trim(), true);
                    break;
                case 'load-more-photos':
                    if (currentGalleryForPhotoView && currentGalleryNameForPhotoView) {
                        fetchAndDisplayGalleryPhotos(currentGalleryForPhotoView, currentGalleryNameForPhotoView, true);
                    }
                    break;
                case 'returnToUserPhotos':
                    if (lastVisitedView && lastVisitedView !== 'photoView') {
                        navigateToUrl('main', lastVisitedView, lastVisitedData);
                        handleStateChange('main', lastVisitedView, lastVisitedData);
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
                case 'toggle-favorite': if (currentPhotoData) toggleFavorite(currentPhotoData); break;
                case 'toggle-favorite-card':
                    const photoId = actionTarget.dataset.photoId;
                    const favorites = getFavorites();
                    const photoData = favorites.find(p => p.id == photoId) || currentGalleryPhotoList.find(p => p.id == photoId);

                    if (photoData) {
                        const fullPhotoData = { id: photoData.id, gallery_uuid: photoData.gallery_uuid || currentGalleryForPhotoView, photo_url: photoData.photo_url, gallery_name: photoData.gallery_name || currentGalleryNameForPhotoView };
                        toggleFavorite(fullPhotoData);

                        const activeSection = document.querySelector('.section-content.active')?.dataset.section;
                        if (activeSection === 'userSpecificFavorites') {
                            const uuid = document.querySelector('[data-section="userSpecificFavorites"]').dataset.uuid;
                            handleStateChange('main', 'userSpecificFavorites', { uuid: uuid });
                        } else if (activeSection === 'favorites') {
                            displayFavoritePhotos();
                        }
                    }
                    break;
                case 'previous-photo':
                case 'next-photo':
                    if (!actionTarget.classList.contains('disabled-nav')) {
                        const path = window.location.pathname;
                        const photoMatch = path.match(/^.*\/photo\/(\d+)$/);
                        if (!photoMatch || currentGalleryPhotoList.length === 0) return;
                        const currentId = parseInt(photoMatch[1], 10);
                        const currentIndex = currentGalleryPhotoList.findIndex(p => p.id === currentId);

                        if (currentIndex !== -1) {
                            let nextIndex = (action === 'next-photo') ? currentIndex + 1 : currentIndex - 1;
                            if (nextIndex >= 0 && nextIndex < currentGalleryPhotoList.length) {
                                const nextPhoto = currentGalleryPhotoList[nextIndex];
                                displayPhoto(nextPhoto.gallery_uuid, nextPhoto.id, currentGalleryPhotoList);
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
                            menu.classList.remove('active'); menu.classList.add('disabled');
                            menu.closest('.card-actions-container').classList.remove('force-visible');
                        }
                    });
                    currentMenu.classList.toggle('disabled', !isOpening);
                    currentMenu.classList.toggle('active', isOpening);
                    currentContainer.classList.toggle('force-visible', isOpening);
                    break;
                case 'copy-link':
                    const card = actionTarget.closest('.card');
                    const url = `${window.location.origin}${window.BASE_PATH}/gallery/${card.dataset.galleryUuid}/photo/${card.dataset.photoId}`;
                    navigator.clipboard.writeText(url).then(() => {
                        actionTarget.closest('.photo-context-menu').classList.add('disabled');
                        actionTarget.closest('.card-actions-container').classList.remove('force-visible');
                    });
                    break;
            }

            const trigger = event.target.closest('[data-action="toggle-select"]');
            if (trigger) {
                const targetId = trigger.dataset.target;
                const targetSelect = document.getElementById(targetId);
                const wasActive = trigger.classList.contains('active-trigger');

                document.querySelectorAll('[data-action="toggle-select"]').forEach(t => t.classList.remove('active-trigger'));
                document.querySelectorAll('.module-select').forEach(s => {
                    if (s.id !== targetId) { s.classList.add('disabled'); s.classList.remove('active'); }
                });

                if (!wasActive) {
                    trigger.classList.add('active-trigger');
                    if (targetSelect) { targetSelect.classList.remove('disabled'); targetSelect.classList.add('active'); }
                } else {
                    if (targetSelect) { targetSelect.classList.add('disabled'); targetSelect.classList.remove('active'); }
                }
            }
        });

        if (accessCodeSubmitBtn) {
            accessCodeSubmitBtn.addEventListener('click', () => {
                const promptContainer = document.querySelector('[data-section="accessCodePrompt"]');
                const uuid = promptContainer.dataset.galleryUuid;
                const codeInput = document.getElementById('access-code-input');
                const error = document.getElementById('access-code-error');
                const code = codeInput.value;

                if (!uuid || !code) { error.textContent = 'Por favor, introduce un código.'; return; }

                const formData = new FormData();
                formData.append('action_type', 'verify_code');
                formData.append('uuid', uuid);
                formData.append('code', code);

                fetch(`${window.BASE_PATH}/api/main_handler.php`, { method: 'POST', body: formData })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const galleryTitle = document.getElementById('access-code-title').textContent.replace('Galería de ', '');
                            fetchAndDisplayGalleryPhotos(uuid, galleryTitle);
                        } else {
                            error.textContent = data.message || 'Error al verificar el código.';
                        }
                    });
            });
        }

        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', function () { this.classList.toggle('active'); });
        });

        document.querySelectorAll('#relevance-select .menu-link').forEach(option => {
            option.addEventListener('click', function () {
                currentSortBy = this.dataset.value;
                fetchAndDisplayGalleries(currentSortBy, searchInput.value.trim());
                updateSelectActiveState('relevance-select', currentSortBy);
            });
        });

        document.querySelectorAll('#favorites-sort-select .menu-link').forEach(option => {
            option.addEventListener('click', function () {
                currentFavoritesSortBy = this.dataset.value;
                displayFavoritePhotos();
                updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);
            });
        });

        document.querySelectorAll('#view-select .menu-link, #view-select-fav .menu-link').forEach(option => {
            option.addEventListener('click', function () {
                navigateToUrl('main', this.dataset.value);
                handleStateChange('main', this.dataset.value);
            });
        });
        
        document.querySelectorAll('#theme-select .menu-link').forEach(option => {
            option.addEventListener('click', function (e) {
                 e.stopPropagation();
                const theme = this.dataset.value;
                setTheme(theme);
                const selectContainer = this.closest('.module-select');
                const trigger = document.querySelector(`[data-target="${selectContainer.id}"]`);
                if (selectContainer && trigger) {
                    selectContainer.classList.add('disabled');
                    selectContainer.classList.remove('active');
                    trigger.classList.remove('active-trigger');
                }
            });
        });
        
        document.querySelectorAll('#language-select .menu-link').forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                const lang = this.dataset.value;
                setLanguage(lang);
                const selectContainer = this.closest('.module-select');
                const trigger = document.querySelector(`[data-target="${selectContainer.id}"]`);
                if (selectContainer && trigger) {
                    selectContainer.classList.add('disabled');
                    selectContainer.classList.remove('active');
                    trigger.classList.remove('active-trigger');
                }
            });
        });


        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && moduleSurface && moduleSurface.classList.contains('active')) {
                moduleSurface.classList.add('disabled');
                moduleSurface.classList.remove('active');
            }
        });
    }

    function setupScrollShadows() {
        const mainScrolleable = document.querySelector('.general-content-scrolleable');
        const mainHeader = document.querySelector('.general-content-top');
    
        if (mainScrolleable && mainHeader) {
            mainScrolleable.addEventListener('scroll', () => {
                mainHeader.classList.toggle('shadow', mainScrolleable.scrollTop > 0);
            });
        }
    
        const scrollableBlocks = document.querySelectorAll('.section-content-block.overflow-y');
        scrollableBlocks.forEach(block => {
            const header = block.previousElementSibling;
            if (header && header.classList.contains('section-content-header')) {
                block.addEventListener('scroll', () => {
                    header.classList.toggle('shadow', block.scrollTop > 0);
                });
            }
        });
    }

    function handleStateChange(view, section, data) {
        handleNavigation(view, section, false, data);

        if (section === 'favorites') {
            document.querySelector('[data-target="view-select-fav"] .select-trigger-text').textContent = 'Mostrar favoritos';
            if (document.getElementById('favorites-search-input')) document.getElementById('favorites-search-input').value = '';
            
            updateSelectActiveState('view-select-fav', 'favorites');
            updateSelectActiveState('favorites-sort-select', currentFavoritesSortBy);
            displayFavoritePhotos();
        } else if (section === 'home') {
            document.querySelector('[data-target="view-select"] .select-trigger-text').textContent = 'Página principal';
            updateSelectActiveState('view-select', 'home');
            updateSelectActiveState('relevance-select', currentSortBy);
            fetchAndDisplayGalleries(currentSortBy);
        } else if (section === 'galleryPhotos' && data && data.uuid) {
            fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${data.uuid}`)
                .then(res => res.json())
                .then(gallery => { if (gallery) fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name); });
        } else if (section === 'photoView' && data && data.uuid && data.photoId) {
            let photoList = null;
            if (lastVisitedView === 'favorites' || lastVisitedView === 'userSpecificFavorites') {
                photoList = getFavorites();
                if (lastVisitedView === 'userSpecificFavorites' && lastVisitedData && lastVisitedData.uuid) {
                    photoList = photoList.filter(p => p.gallery_uuid === lastVisitedData.uuid);
                }
            }
            displayPhoto(data.uuid, data.photoId, photoList);
        } else if (section === 'userSpecificFavorites' && data && data.uuid) {
            const userFavorites = getFavorites().filter(p => p.gallery_uuid === data.uuid);
            const grid = document.getElementById('user-specific-favorites-grid');
            const title = document.getElementById('user-specific-favorites-title');
            
            grid.innerHTML = '';
            document.querySelector('[data-section="userSpecificFavorites"]').dataset.uuid = data.uuid;


            if (userFavorites.length > 0) {
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
                    card.innerHTML += `<div class="card-actions-container"><div class="card-hover-overlay"><div class="card-hover-icons"><div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${photo.id}"><span class="material-symbols-rounded">favorite</span></div><div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div></div></div><div class="module-content module-select photo-context-menu disabled"><div class="menu-content"><div class="menu-list"><a class="menu-link" href="${photoPageUrl}" target="_blank"><div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div><div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div></a><div class="menu-link" data-action="copy-link"><div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div><div class="menu-link-text"><span>Copiar el enlace</span></div></div><a class="menu-link disabled-link" href="javascript:void(0);"><div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div><div class="menu-link-text"><span>Descargar</span></div></a></div></div></div></div>`;
                    grid.appendChild(card);
                });
            } else {
                title.textContent = 'Sin favoritos';
                grid.innerHTML = '<p>Este usuario no tiene fotos en tus favoritos.</p>';
            }
        }
    }

    setupEventListeners();
    setupScrollShadows();

    setupPopStateHandler((view, section, pushState, data) => {
        handleStateChange(view, section, data);
    });

    const initialView = document.querySelector('.section-container.active')?.dataset.view;
    const initialSection = document.querySelector('.section-container.active .section-content.active')?.dataset.section;
    const path = window.location.pathname.replace(window.BASE_PATH || '', '').slice(1);

    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);
    const favoritesMatch = path.match(/^favorites\/([a-f0-9-]{36})$/);
    const reedemMatch = path.match(/^reedem\/([a-f0-9-]{36})$/);

    let initialStateData = null;

    if (photoMatch) {
        const [, galleryUuid, photoId] = photoMatch;
        initialStateData = { uuid: galleryUuid, photoId: photoId };
        setInitialHistoryState(initialView, 'photoView', initialStateData);
        handleStateChange(initialView, 'photoView', initialStateData);
    } else if (galleryMatch) {
        const galleryUuid = galleryMatch[1];
        initialStateData = { uuid: galleryUuid };
        setInitialHistoryState(initialView, 'galleryPhotos', initialStateData);
        fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${galleryUuid}`)
            .then(res => res.json())
            .then(gallery => {
                if (gallery && gallery.uuid) {
                    if (gallery.privacy == 1) {
                        promptForAccessCode(gallery.uuid, gallery.name);
                    } else {
                        fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name);
                    }
                } else {
                    handleNavigation('main', '404');
                }
            });
    } else if (favoritesMatch) {
        const galleryUuid = favoritesMatch[1];
        initialStateData = { uuid: galleryUuid };
        setInitialHistoryState(initialView, 'userSpecificFavorites', initialStateData);
        handleStateChange(initialView, 'userSpecificFavorites', initialStateData);
    } else if (reedemMatch) {
        const galleryUuid = reedemMatch[1];
        initialStateData = { uuid: galleryUuid };
        setInitialHistoryState(initialView, 'accessCodePrompt', initialStateData);
        fetch(`${window.BASE_PATH}/api/main_handler.php?request_type=galleries&uuid=${galleryUuid}`)
            .then(res => res.json())
            .then(gallery => {
                if (gallery && gallery.uuid) {
                    if (gallery.privacy == 1) {
                        promptForAccessCode(gallery.uuid, gallery.name);
                    } else {
                        window.location.replace(`${window.BASE_PATH}/gallery/${gallery.uuid}`);
                    }
                } else {
                    handleNavigation('main', '404');
                }
            });
    } else if (initialView && initialSection) {
        setInitialHistoryState(initialView, initialSection);
        handleStateChange(initialView, initialSection);
    } else {
        console.error("Could not determine initial state from DOM.");
    }
    
    if (initialSection !== 'photoView') {
        lastVisitedView = initialSection;
        lastVisitedData = initialStateData;
    }
}