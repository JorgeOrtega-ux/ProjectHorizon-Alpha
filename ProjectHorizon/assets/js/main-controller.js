import { navigateToUrl, setupPopStateHandler, setInitialHistoryState, generateUrl } from './url-manager.js';

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

    let galleriesCurrentPage = 1;
    let photosCurrentPage = 1;
    let isLoadingGalleries = false;
    let isLoadingPhotos = false;
    const BATCH_SIZE = 20;

    function isFavorite(photoId) {
        const favorites = getFavorites();
        return favorites.some(photo => photo.id == photoId);
    }

    function toggleFavorite(photoData) {
        let favorites = getFavorites();
        const photoIndex = favorites.findIndex(photo => photo.id == photoData.id);

        if (photoIndex > -1) {
            favorites.splice(photoIndex, 1);
        } else {
            favorites.push(photoData);
        }

        localStorage.setItem('favoritePhotos', JSON.stringify(favorites));
        updateFavoriteButtonState(photoData.id);
        updateFavoriteCardState(photoData.id);
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
    
    function displayFavoritePhotos(container) {
        container.innerHTML = '';
        const favorites = getFavorites();
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
    
                const cardContent = `
                    <div class="card-actions-container">
                        <div class="card-hover-overlay">
                            <div class="card-hover-icons">
                                <div class="icon-wrapper active" data-action="toggle-favorite-card" data-photo-id="${photo.id}">
                                    <span class="material-symbols-rounded">favorite</span>
                                </div>
                                <div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div>
                            </div>
                        </div>
                        <div class="module-content module-select photo-context-menu disabled">
                            <div class="menu-content">
                                <div class="menu-list">
                                    <a class="menu-link" href="${photoPageUrl}" target="_blank">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div>
                                        <div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div>
                                    </a>
                                    <div class="menu-link" data-action="copy-link">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div>
                                        <div class="menu-link-text"><span>Copiar el enlace</span></div>
                                    </div>
                                    <a class="menu-link disabled-link" href="javascript:void(0);">
                                        <div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div>
                                        <div class="menu-link-text"><span>Descargar</span></div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                card.innerHTML += cardContent;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>No tienes fotos favoritas.</p>';
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
        
        document.querySelectorAll('.menu-link').forEach(link => {
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

                const nameCell = document.createElement('td');
                const avatar = document.createElement('div');
                avatar.className = 'user-avatar';
                if (gallery.profile_picture_url) {
                    avatar.style.backgroundImage = `url('${gallery.profile_picture_url}')`;
                }

                nameCell.innerHTML = `
                    <div class="user-info">
                        <div class="user-avatar" style="background-image: url('${gallery.profile_picture_url || ''}')"></div>
                        <span>${gallery.name}</span>
                    </div>
                `;
                const privacyCell = document.createElement('td');
                privacyCell.textContent = 'Público';
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

    function fetchAndDisplayGalleries(sortBy = 'relevant', searchTerm = '', append = false) {
        if (isLoadingGalleries) return;
        isLoadingGalleries = true;

        if (!append) {
            galleriesCurrentPage = 1;
        }

        const encodedSearchTerm = encodeURIComponent(searchTerm);
        const url = `/ProjectHorizon/api/main_handler.php?request_type=galleries&sort=${sortBy}&search=${encodedSearchTerm}&page=${galleriesCurrentPage}&limit=${BATCH_SIZE}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const gridContainer = document.getElementById('grid-view');
                const tableContainer = document.getElementById('table-view');
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
                const gridContainer = document.getElementById('grid-view');
                if (gridContainer && !append) gridContainer.innerHTML = '<p>Error al cargar galerías.</p>';
            })
            .finally(() => {
                isLoadingGalleries = false;
            });
    }

    function fetchAndDisplayGalleryPhotos(uuid, galleryName, append = false) {
        if (!append) {
            photosCurrentPage = 1;
            currentGalleryPhotoList = [];
            const grid = document.getElementById('user-photos-grid');
            if (grid) grid.innerHTML = '';
            
            handleNavigation('main', 'galleryPhotos', true, { uuid: uuid });
        }
        
        if (isLoadingPhotos) return;
        isLoadingPhotos = true;
        
        currentGalleryForPhotoView = uuid;
        currentGalleryNameForPhotoView = galleryName;

        const grid = document.getElementById('user-photos-grid');
        const title = document.getElementById('user-photos-title');
        const loadMoreContainer = document.getElementById('photos-load-more-container');

        if (!append) {
            grid.innerHTML = '<p>Cargando fotos...</p>';
            title.textContent = galleryName ? galleryName : 'Cargando...';
        }

        fetch(`/ProjectHorizon/api/main_handler.php?request_type=photos&uuid=${uuid}&page=${photosCurrentPage}&limit=${BATCH_SIZE}`)
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

                        const cardContent = `
                            <div class="card-actions-container">
                                <div class="card-hover-overlay">
                                    <div class="card-hover-icons">
                                        <div class="icon-wrapper" data-action="toggle-favorite-card" data-photo-id="${photo.id}">
                                            <span class="material-symbols-rounded">favorite</span>
                                        </div>
                                        <div class="icon-wrapper" data-action="toggle-photo-menu"><span class="material-symbols-rounded">more_horiz</span></div>
                                    </div>
                                </div>
                                <div class="module-content module-select photo-context-menu disabled">
                                    <div class="menu-content">
                                        <div class="menu-list">
                                            <a class="menu-link" href="${photoPageUrl}" target="_blank">
                                                <div class="menu-link-icon"><span class="material-symbols-rounded">open_in_new</span></div>
                                                <div class="menu-link-text"><span>Abrir en una pestaña nueva</span></div>
                                            </a>
                                            <div class="menu-link" data-action="copy-link">
                                                <div class="menu-link-icon"><span class="material-symbols-rounded">link</span></div>
                                                <div class="menu-link-text"><span>Copiar el enlace</span></div>
                                            </div>
                                            <a class="menu-link disabled-link" href="javascript:void(0);">
                                                <div class="menu-link-icon"><span class="material-symbols-rounded">download</span></div>
                                                <div class="menu-link-text"><span>Descargar</span></div>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        card.innerHTML += cardContent;
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

    function displayPhoto(uuid, photoId) {
        const activeSection = document.querySelector('.section-content.active')?.dataset.section || 'home';
        lastVisitedView = activeSection;
        
        handleNavigation('main', 'photoView', true, { uuid: uuid, photoId: photoId });
        const photoViewerImage = document.getElementById('photo-viewer-image');
        const photoCounter = document.getElementById('photo-counter');
        const photoViewUserTitle = document.getElementById('photo-view-user-title');
        const prevButton = document.querySelector('[data-action="previous-photo"]');
        const nextButton = document.querySelector('[data-action="next-photo"]');

        const displayFetchedPhoto = () => {
            const photoIndex = currentGalleryPhotoList.findIndex(p => p.id == photoId);
            if (photoIndex !== -1) {
                const photo = currentGalleryPhotoList[photoIndex];
                
                currentPhotoData = {
                    id: photo.id,
                    gallery_uuid: uuid,
                    photo_url: photo.photo_url,
                    gallery_name: currentGalleryNameForPhotoView
                };
                
                photoViewerImage.src = photo.photo_url;
                photoCounter.textContent = `${photoIndex + 1} / ${currentGalleryPhotoList.length}`;
                currentGalleryForPhotoView = uuid;
                
                updateFavoriteButtonState(photo.id);

                prevButton.classList.toggle('disabled-nav', photoIndex === 0);
                nextButton.classList.toggle('disabled-nav', photoIndex === currentGalleryPhotoList.length - 1);
            } else {
                handleNavigation('main', '404');
            }
        };
        
        const fetchAndSetGalleryName = (uuid) => {
             fetch(`/ProjectHorizon/api/main_handler.php?request_type=galleries&uuid=${uuid}`)
                .then(res => res.json())
                .then(gallery => {
                    if (gallery && gallery.name) {
                        currentGalleryNameForPhotoView = gallery.name;
                        photoViewUserTitle.textContent = gallery.name;
                    }
                });
        };
        
        if (currentGalleryNameForPhotoView) {
            photoViewUserTitle.textContent = currentGalleryNameForPhotoView;
        } else {
            fetchAndSetGalleryName(uuid);
        }

        if (currentGalleryPhotoList.length === 0 || currentGalleryForPhotoView !== uuid) {
            fetch(`/ProjectHorizon/api/main_handler.php?request_type=photos&uuid=${uuid}&limit=1000`)
                .then(res => res.json())
                .then(photos => {
                    currentGalleryPhotoList = photos;
                    displayFetchedPhoto();
                });
        } else {
            displayFetchedPhoto();
        }
    }
    
    function setupEventListeners() {
        const toggleViewBtn = document.querySelector('[data-action="toggle-view"]');
        const searchInput = document.querySelector('.search-input-text input');
        const menuButton = document.querySelector('[data-action="toggleModuleSurface"]');
        const settingsButton = document.querySelector('[data-action="toggleSettings"]');
        const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
        const allMenuLinks = document.querySelectorAll('.menu-link');

        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', () => {
                const gridView = document.getElementById('grid-view');
                const tableView = document.getElementById('table-view');
                const icon = toggleViewBtn.querySelector('.material-symbols-rounded');
                if (currentView === 'grid') {
                    gridView.classList.remove('active');
                    gridView.classList.add('disabled');
                    tableView.classList.remove('disabled');
                    tableView.classList.add('active');
                    icon.textContent = 'grid_view';
                    currentView = 'table';
                } else {
                    tableView.classList.remove('active');
                    tableView.classList.add('disabled');
                    gridView.classList.remove('disabled');
                    gridView.classList.add('active');
                    icon.textContent = 'view_list';
                    currentView = 'grid';
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
            link.addEventListener('click', function(e) {
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

        document.addEventListener('click', function(event) {
            if (moduleSurface && moduleSurface.classList.contains('active')) {
                const isClickInsideModule = moduleSurface.contains(event.target);
                const isClickOnMenuButton = menuButton && menuButton.contains(event.target);
                if (!isClickInsideModule && !isClickOnMenuButton) {
                    moduleSurface.classList.add('disabled');
                    moduleSurface.classList.remove('active');
                }
            }
            
            const selectedOption = event.target.closest('.module-select .menu-link');
            if (selectedOption) {
                if(!selectedOption.closest('#view-select') && !selectedOption.closest('#view-select-fav')) {
                    const selectContainer = selectedOption.closest('.module-select');
                    const wrapper = selectContainer.closest('.select-wrapper');
                    if (wrapper) {
                        const currentTrigger = wrapper.querySelector('[data-action="toggle-select"]');
                        const triggerText = currentTrigger.querySelector('.select-trigger-text');
                        const triggerIcon = currentTrigger.querySelector('.select-trigger-icon:not(.select-trigger-arrow) .material-symbols-rounded');
                        const optionText = selectedOption.querySelector('.menu-link-text span');
                        const optionIcon = selectedOption.querySelector('.menu-link-icon .material-symbols-rounded');
            
                        if (triggerText && optionText) {
                            triggerText.textContent = optionText.textContent;
                        }
            
                        if (triggerIcon && optionIcon && currentTrigger.dataset.target !== 'relevance-select') {
                            triggerIcon.textContent = optionIcon.textContent;
                        }
            
                        selectContainer.classList.add('disabled');
                        selectContainer.classList.remove('active');
                        currentTrigger.classList.remove('active-trigger');
                        
                        return; 
                    }
                }
            }
        
            const galleryElement = event.target.closest('.card:not(.photo-card), tr[data-uuid]');
            if (galleryElement && galleryElement.dataset.uuid && !event.target.closest('.card-actions-container')) {
                const uuid = galleryElement.dataset.uuid;
                const name = galleryElement.dataset.name;
                fetchAndDisplayGalleryPhotos(uuid, name);
                return;
            }

            const photoCard = event.target.closest('.card.photo-card');
            if (photoCard && !event.target.closest('.card-actions-container')) {
                const galleryUuid = photoCard.dataset.galleryUuid || currentGalleryForPhotoView;
                displayPhoto(galleryUuid, photoCard.dataset.photoId);
                return;
            }
        
            const actionTarget = event.target.closest('[data-action]');
            
            if (!actionTarget || !actionTarget.dataset.action.includes('toggle')) {
                 document.querySelectorAll('.module-select:not(.photo-context-menu).active').forEach(menu => {
                     menu.classList.remove('active');
                     menu.classList.add('disabled');
                });
                document.querySelectorAll('.active-trigger').forEach(trigger => {
                    trigger.classList.remove('active-trigger');
                });
            }

            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            
            switch (action) {
                case 'load-more-users':
                    const searchTerm = searchInput ? searchInput.value.trim() : '';
                    fetchAndDisplayGalleries(currentSortBy, searchTerm, true);
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
                    } else if (currentGalleryForPhotoView && currentGalleryNameForPhotoView) {
                        fetchAndDisplayGalleryPhotos(currentGalleryForPhotoView, currentGalleryNameForPhotoView);
                    } else {
                        navigateToUrl('main', 'home');
                        handleStateChange('main', 'home');
                    }
                    break;
                
                 case 'returnToHome':
                    handleNavigation('main', 'home');
                    break;

                case 'toggle-favorite':
                    if (currentPhotoData) {
                        toggleFavorite(currentPhotoData);
                    }
                    break;
                
                case 'toggle-favorite-card':
                    const photoId = actionTarget.dataset.photoId;
                    let photoData;
                    
                    const currentSection = document.querySelector('.section-content.active')?.dataset.section;
                    if (currentSection === 'favorites') {
                        const favorites = getFavorites();
                        photoData = favorites.find(p => p.id == photoId);
                    } else {
                        photoData = currentGalleryPhotoList.find(p => p.id == photoId);
                    }
                    
                    if (photoData) {
                        const fullPhotoData = {
                            id: photoData.id,
                            gallery_uuid: photoData.gallery_uuid || currentGalleryForPhotoView,
                            photo_url: photoData.photo_url,
                            gallery_name: photoData.gallery_name || currentGalleryNameForPhotoView
                        };
                        toggleFavorite(fullPhotoData);

                        if (currentSection === 'favorites') {
                            const favoritesContainer = document.getElementById('favorites-grid-view');
                            if (favoritesContainer) displayFavoritePhotos(favoritesContainer);
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
                            let nextIndex = currentIndex;
                            if (action === 'next-photo' && currentIndex < currentGalleryPhotoList.length - 1) {
                                nextIndex = currentIndex + 1;
                            } else if (action === 'previous-photo' && currentIndex > 0) {
                                nextIndex = currentIndex - 1;
                            }
                            const nextPhoto = currentGalleryPhotoList[nextIndex];
                            displayPhoto(currentGalleryForPhotoView, nextPhoto.id);
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
                    const card = actionTarget.closest('.card');
                    const url = window.location.origin + window.BASE_PATH + `/gallery/${currentGalleryForPhotoView}/photo/${card.dataset.photoId}`;
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(url).then(() => {
                            console.log('Enlace copiado!', url);
                            actionTarget.closest('.photo-context-menu').classList.add('disabled');
                            actionTarget.closest('.photo-context-menu').classList.remove('active');
                            actionTarget.closest('.card-actions-container').classList.remove('force-visible');
                        }).catch(err => {
                            console.error('Error al copiar el enlace: ', err);
                        });
                    }
                    break;
            }

            const trigger = event.target.closest('[data-action="toggle-select"]');
            if (trigger) {
                const targetId = trigger.dataset.target;
                const targetSelect = document.getElementById(targetId);
                const wasActive = trigger.classList.contains('active-trigger');
                
                document.querySelectorAll('[data-action="toggle-select"]').forEach(t => t.classList.remove('active-trigger'));
                document.querySelectorAll('.module-select').forEach(s => {
                    if(s.id !== targetId) {
                        s.classList.add('disabled');
                        s.classList.remove('active');
                    }
                });

                if (!wasActive) {
                    trigger.classList.add('active-trigger');
                    if (targetSelect) {
                        targetSelect.classList.remove('disabled');
                        targetSelect.classList.add('active');
                    }
                } else {
                     if (targetSelect) {
                        targetSelect.classList.add('disabled');
                        targetSelect.classList.remove('active');
                    }
                }
            }
        });

        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', function() { this.classList.toggle('active'); });
        });

        document.querySelectorAll('#relevance-select .menu-link').forEach(option => {
            option.addEventListener('click', function() {
                currentSortBy = this.dataset.value;
                const searchTerm = searchInput ? searchInput.value.trim() : '';
                fetchAndDisplayGalleries(currentSortBy, searchTerm);
            });
        });
        
        document.querySelectorAll('#view-select .menu-link, #view-select-fav .menu-link').forEach(option => {
            option.addEventListener('click', function() {
                const section = this.dataset.value;
                const view = 'main';
                navigateToUrl(view, section);
                handleStateChange(view, section);
            });
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && moduleSurface && moduleSurface.classList.contains('active')) {
                moduleSurface.classList.add('disabled');
                moduleSurface.classList.remove('active');
            }
        });
    }

    function handleStateChange(view, section, data) {
        handleNavigation(view, section, false, data);

        const homeTriggerText = document.querySelector('[data-target="view-select"] .select-trigger-text');
        const favTriggerText = document.querySelector('[data-target="view-select-fav"] .select-trigger-text');
        const homeTriggerIcon = document.querySelector('[data-target="view-select"] .select-trigger-icon:not(.select-trigger-arrow) .material-symbols-rounded');
        const favTriggerIcon = document.querySelector('[data-target="view-select-fav"] .select-trigger-icon:not(.select-trigger-arrow) .material-symbols-rounded');

        if (section === 'favorites') {
            if (favTriggerText) favTriggerText.textContent = 'Mostrar favoritos';
            if (favTriggerIcon) favTriggerIcon.textContent = 'favorite';
            const favoritesContainer = document.getElementById('favorites-grid-view');
            if(favoritesContainer) displayFavoritePhotos(favoritesContainer);
        } else if (section === 'home') {
            if (homeTriggerText) homeTriggerText.textContent = 'Página principal';
            if (homeTriggerIcon) homeTriggerIcon.textContent = 'home';
            fetchAndDisplayGalleries(currentSortBy);
        } else if (section === 'galleryPhotos' && data && data.uuid) {
            fetch(`/ProjectHorizon/api/main_handler.php?request_type=galleries&uuid=${data.uuid}`)
             .then(res => res.json())
             .then(gallery => { if (gallery) fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name); });
        } else if (section === 'photoView' && data && data.uuid && data.photoId) {
            displayPhoto(data.uuid, data.photoId);
        }
    }
    
    setupEventListeners();

    setupPopStateHandler((view, section, pushState, data) => {
        handleStateChange(view, section, data);
    });
    
    const initialView = document.querySelector('.section-container.active')?.dataset.view;
    const initialSection = document.querySelector('.section-container.active .section-content.active')?.dataset.section;
    const path = window.location.pathname.replace(window.BASE_PATH || '', '').slice(1);
    
    const photoMatch = path.match(/^gallery\/([a-f0-9-]{36})\/photo\/(\d+)$/);
    const galleryMatch = path.match(/^gallery\/([a-f0-9-]{36})$/);

    if (photoMatch) {
        const [, galleryUuid, photoId] = photoMatch;
        setInitialHistoryState(initialView, 'photoView', { uuid: galleryUuid, photoId: photoId });
        displayPhoto(galleryUuid, photoId);
    } else if (galleryMatch) {
        const galleryUuid = galleryMatch[1];
        setInitialHistoryState(initialView, 'galleryPhotos', { uuid: galleryUuid });
        fetch(`/ProjectHorizon/api/main_handler.php?request_type=galleries&uuid=${galleryUuid}`)
            .then(res => res.json())
            .then(gallery => {
                if (gallery && gallery.uuid) {
                    fetchAndDisplayGalleryPhotos(gallery.uuid, gallery.name);
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
}