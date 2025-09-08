import { navigateToUrl, setupPopStateHandler, setInitialHistoryState } from './url-manager.js';

export function initMainController() {
    let currentView = 'grid';
    let currentSortBy = 'relevant';
    let searchDebounceTimer;

    // --- MANEJADOR DE NAVEGACIÓN ---
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

    // --- RENDERIZADO DE USUARIOS (GRID) ---
    function displayUsersAsGrid(users, container, sortBy) {
        container.innerHTML = '';
        if (users.length > 0) {
            users.forEach(user => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.uuid = user.uuid;
                card.dataset.name = user.name;
                
                const overlay = document.createElement('div');
                overlay.className = 'card-content-overlay';
                
                const icon = document.createElement('div');
                icon.className = 'card-icon';
                
                const textContainer = document.createElement('div');
                textContainer.className = 'card-text';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = user.name;
                textContainer.appendChild(nameSpan);
                
                if (sortBy === 'newest' || sortBy === 'oldest') {
                    const editedSpan = document.createElement('span');
                    editedSpan.textContent = `Editado: ${new Date(user.last_edited).toLocaleDateString()}`;
                    editedSpan.style.fontSize = '0.8rem';
                    editedSpan.style.display = 'block';
                    textContainer.appendChild(editedSpan);
                }
                
                overlay.appendChild(icon);
                overlay.appendChild(textContainer);
                card.appendChild(overlay);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>No se encontraron usuarios.</p>';
        }
    }

    // --- RENDERIZADO DE USUARIOS (TABLA) ---
    function displayUsersAsTable(users, container) {
        const tbody = container.querySelector('tbody');
        tbody.innerHTML = '';
        if (users.length > 0) {
            users.forEach(user => {
                const row = document.createElement('tr');
                row.dataset.uuid = user.uuid;
                row.dataset.name = user.name;

                const nameCell = document.createElement('td');
                nameCell.innerHTML = `
                    <div class="user-info">
                        <div class="user-avatar"></div>
                        <span>${user.name}</span>
                    </div>
                `;
                const privacyCell = document.createElement('td');
                privacyCell.textContent = user.privacy == "1" ? 'Privado' : 'Público';
                const typeCell = document.createElement('td');
                typeCell.textContent = 'Perfil';
                const editedCell = document.createElement('td');
                editedCell.textContent = new Date(user.last_edited).toLocaleDateString();

                row.appendChild(nameCell);
                row.appendChild(privacyCell);
                row.appendChild(typeCell);
                row.appendChild(editedCell);
                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No se encontraron usuarios.';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            tbody.appendChild(row);
        }
    }

    // --- OBTENCIÓN DE DATOS DE USUARIOS ---
    function fetchAndDisplayUsers(sortBy = 'relevant', searchTerm = '') {
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        fetch(`/ProjectHorizon/api/get_users.php?sort=${sortBy}&search=${encodedSearchTerm}`)
            .then(response => response.json())
            .then(data => {
                const gridContainer = document.getElementById('grid-view');
                const tableContainer = document.getElementById('table-view');
                if (gridContainer) displayUsersAsGrid(data, gridContainer, sortBy);
                if (tableContainer) displayUsersAsTable(data, tableContainer);
            })
            .catch(error => {
                console.error('Error al obtener los usuarios:', error);
                const gridContainer = document.getElementById('grid-view');
                if (gridContainer) gridContainer.innerHTML = '<p>Error al cargar usuarios.</p>';
            });
    }

   // Dentro de la función initMainController...

    // --- OBTENCIÓN DE FOTOS DE USUARIO ---
    function fetchAndDisplayUserPhotos(uuid, userName) {
        handleNavigation('main', 'userPhotos', true, { uuid: uuid });

        const grid = document.getElementById('user-photos-grid');
        const title = document.getElementById('user-photos-title');

        grid.innerHTML = '<p>Cargando fotos...</p>';
        title.textContent = userName ? `Fotos de ${userName}` : 'Cargando...';

        fetch(`/ProjectHorizon/api/get_user_photos.php?uuid=${uuid}`)
            .then(response => response.json())
            .then(photos => {
                grid.innerHTML = '';
                if (photos.length > 0) {
                    photos.forEach(photo => {
                        const card = document.createElement('div');
                        card.className = 'card';
                        card.style.backgroundImage = `url('${photo.photo_url}')`;

                        // --- NUEVO CÓDIGO AÑADIDO ---
                        // Crea el contenedor del hover
                        const hoverOverlay = document.createElement('div');
                        hoverOverlay.className = 'card-hover-overlay';

                        // Crea el botón con los iconos
                        const iconContainer = document.createElement('div');
                        iconContainer.className = 'card-hover-icons';
                        iconContainer.innerHTML = `
                            <div class="icon-wrapper"><span class="material-symbols-rounded">star</span></div>
                            <div class="icon-wrapper"><span class="material-symbols-rounded">more_horiz</span></div>
                        `;
                        
                        hoverOverlay.appendChild(iconContainer);
                        card.appendChild(hoverOverlay);
                        // --- FIN DEL NUEVO CÓDIGO ---

                        grid.appendChild(card);
                    });
                } else {
                    grid.innerHTML = '<p>Este usuario no tiene fotos.</p>';
                }
            })
            .catch(error => {
                console.error('Error al obtener las fotos:', error);
                grid.innerHTML = '<p>Error al cargar las fotos.</p>';
            });
    }

// ... el resto del archivo main-controller.js

    // --- INICIALIZACIÓN DE EVENTOS ---
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
                fetchAndDisplayUsers(currentSortBy, searchTerm);
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
            if (action && action !== 'toggle-select') { e.preventDefault(); }
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
        const userElement = event.target.closest('.card, tr[data-uuid]');
        if (userElement && userElement.dataset.uuid) {
            if (!userElement.closest('[data-section="userPhotos"]')) {
                fetchAndDisplayUserPhotos(userElement.dataset.uuid, userElement.dataset.name);
            }
        }

        const trigger = event.target.closest('[data-action="toggle-select"]');
        const allSelects = document.querySelectorAll('.module-select');
        const allTriggers = document.querySelectorAll('[data-action="toggle-select"]');

        if (trigger) {
            const targetId = trigger.dataset.target;
            const targetSelect = document.getElementById(targetId);
            const wasActive = trigger.classList.contains('active-trigger');
            allTriggers.forEach(t => t.classList.remove('active-trigger'));
            allSelects.forEach(s => { s.classList.add('disabled'); s.classList.remove('active'); });
            if (!wasActive) {
                trigger.classList.add('active-trigger');
                if (targetSelect) {
                    targetSelect.classList.remove('disabled');
                    targetSelect.classList.add('active');
                }
            }
        } else if (event.target.closest('.select-wrapper')) {
            const option = event.target.closest('.module-select .menu-link');
            if (option) {
                 const selectContainer = option.closest('.module-select');
                 const wrapper = selectContainer.closest('.select-wrapper');
                 const currentTrigger = wrapper.querySelector('[data-action="toggle-select"]');
                 const triggerText = currentTrigger.querySelector('.select-trigger-text');
                 const optionText = option.querySelector('.menu-link-text span');
                 if(triggerText && optionText) {
                    triggerText.textContent = optionText.textContent;
                 }
                 selectContainer.classList.add('disabled');
                 selectContainer.classList.remove('active');
                 if (currentTrigger) {
                    currentTrigger.classList.remove('active-trigger');
                 }
            }
        } else {
            allTriggers.forEach(t => t.classList.remove('active-trigger'));
            allSelects.forEach(s => { s.classList.add('disabled'); s.classList.remove('active'); });
        }

        if (moduleSurface && moduleSurface.classList.contains('active')) {
            const isClickInsideModule = moduleSurface.contains(event.target);
            const isClickOnMenuButton = menuButton && menuButton.contains(event.target);
            if (!isClickInsideModule && !isClickOnMenuButton) {
                moduleSurface.classList.add('disabled');
                moduleSurface.classList.remove('active');
            }
        }
    });

    const returnToHomeBtn = document.querySelector('[data-action="returnToHome"]');
    if (returnToHomeBtn) {
        returnToHomeBtn.addEventListener('click', () => {
            handleNavigation('main', 'home');
        });
    }

    document.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', function() { this.classList.toggle('active'); });
    });

    document.querySelectorAll('#relevance-select .menu-link').forEach(option => {
        option.addEventListener('click', function() {
            currentSortBy = this.dataset.value;
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            fetchAndDisplayUsers(currentSortBy, searchTerm);
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && moduleSurface && moduleSurface.classList.contains('active')) {
            moduleSurface.classList.add('disabled');
            moduleSurface.classList.remove('active');
        }
    });

    // --- CARGA INICIAL Y ESTADO DEL HISTORIAL ---
    setupPopStateHandler((view, section, pushState, data) => {
        handleNavigation(view, section, false);
        if (section === 'userPhotos' && data && data.uuid) {
            fetch(`/ProjectHorizon/api/get_users.php?uuid=${data.uuid}`)
             .then(res => res.json())
             .then(user => { if (user) fetchAndDisplayUserPhotos(user.uuid, user.name); });
        }
    });

    const initialView = document.querySelector('.section-container.active')?.dataset.view;
    const initialSection = document.querySelector('.section-container.active .section-content.active')?.dataset.section;
    const path = window.location.pathname.replace(window.BASE_PATH || '', '').slice(1);
    const userMatch = path.match(/^user\/([a-f0-9-]{36})$/);

    if (initialSection === 'userPhotos' && userMatch) {
        const userUuid = userMatch[1];
        setInitialHistoryState(initialView, initialSection, { uuid: userUuid });
        
        fetch(`/ProjectHorizon/api/get_users.php?uuid=${userUuid}`)
            .then(res => res.json())
            .then(user => {
                if (user && user.uuid) {
                    fetchAndDisplayUserPhotos(user.uuid, user.name);
                } else {
                    handleNavigation('main', '404');
                }
            });
    } else if (initialView && initialSection) {
        setInitialHistoryState(initialView, initialSection);
        fetchAndDisplayUsers(currentSortBy);
    } else {
        console.error("Could not determine initial state from DOM.");
    }
}