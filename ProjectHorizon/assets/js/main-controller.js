import { navigateToUrl, setupPopStateHandler, setInitialHistoryState } from './url-manager.js';

let currentView = 'grid'; // 'grid' o 'table'
let currentSortBy = 'relevant';
let searchDebounceTimer;

// --- MODIFICADO: Renderiza las tarjetas (ahora acepta sortBy) ---
function displayUsersAsGrid(users, container, sortBy) {
    container.innerHTML = '';
    if (users.length > 0) {
        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const overlay = document.createElement('div');
            overlay.className = 'card-content-overlay';
            
            const icon = document.createElement('div');
            icon.className = 'card-icon';
            
            const textContainer = document.createElement('div');
            textContainer.className = 'card-text';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = user.name;
            textContainer.appendChild(nameSpan);

            // --- LÓGICA CONDICIONAL AÑADIDA ---
            // Solo muestra la fecha de edición si el filtro es el adecuado
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

// --- Renderiza la tabla ---
function displayUsersAsTable(users, container) {
    const tbody = container.querySelector('tbody');
    tbody.innerHTML = '';
    if (users.length > 0) {
        users.forEach(user => {
            const row = document.createElement('tr');

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

// --- MODIFICADO: fetchAndDisplayUsers ahora pasa sortBy a displayUsersAsGrid ---
function fetchAndDisplayUsers(sortBy = 'relevant', searchTerm = '') {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    fetch(`/ProjectHorizon/api/get_users.php?sort=${sortBy}&search=${encodedSearchTerm}`)
        .then(response => response.json())
        .then(data => {
            const gridContainer = document.getElementById('grid-view');
            const tableContainer = document.getElementById('table-view');

            if (gridContainer) displayUsersAsGrid(data, gridContainer, sortBy); // Se pasa sortBy
            if (tableContainer) displayUsersAsTable(data, tableContainer);
        })
        .catch(error => {
            console.error('Error al obtener los usuarios:', error);
            const gridContainer = document.getElementById('grid-view');
            if (gridContainer) gridContainer.innerHTML = '<p>Error al cargar usuarios.</p>';
        });
}


export function initMainController() {
    const toggleViewBtn = document.querySelector('[data-action="toggle-view"]');
    const searchInput = document.querySelector('.search-input-text input');

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

    const menuButton = document.querySelector('[data-action="toggleModuleSurface"]');
    const settingsButton = document.querySelector('[data-action="toggleSettings"]');
    const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
    const allMenuLinks = document.querySelectorAll('.menu-link');
    function handleNavigation(view, section, pushState = true) {
        if (pushState) {
            navigateToUrl(view, section);
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
        
        allMenuLinks.forEach(link => {
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

            if (action && action !== 'toggle-select') {
                 e.preventDefault(); 
            }

            if (action === 'toggleMainView') {
                handleNavigation('main', 'home');
                return;
            }

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
        const trigger = event.target.closest('[data-action="toggle-select"]');
        const allSelects = document.querySelectorAll('.module-select');
        const allTriggers = document.querySelectorAll('[data-action="toggle-select"]');

        if (trigger) {
            const targetId = trigger.dataset.target;
            const targetSelect = document.getElementById(targetId);
            const wasActive = trigger.classList.contains('active-trigger');

            allTriggers.forEach(t => t.classList.remove('active-trigger'));
            allSelects.forEach(s => {
                s.classList.add('disabled');
                s.classList.remove('active');
            });

            if (!wasActive) {
                trigger.classList.add('active-trigger');
                if (targetSelect) {
                    targetSelect.classList.remove('disabled');
                    targetSelect.classList.add('active');
                }
            }
        } else {
            const selectWrapper = event.target.closest('.select-wrapper');

            if (selectWrapper) {
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
                allSelects.forEach(select => {
                    select.classList.add('disabled');
                    select.classList.remove('active');
                });
            }
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

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && moduleSurface && moduleSurface.classList.contains('active')) {
            moduleSurface.classList.add('disabled');
            moduleSurface.classList.remove('active');
        }
    });
    
    const allToggleSwitches = document.querySelectorAll('.toggle-switch');
    allToggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    const sortOptions = document.querySelectorAll('#relevance-select .menu-link');
    sortOptions.forEach(option => {
        option.addEventListener('click', function() {
            currentSortBy = this.dataset.value;
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            fetchAndDisplayUsers(currentSortBy, searchTerm);
        });
    });
    
    // Carga inicial de usuarios
    fetchAndDisplayUsers(currentSortBy);

    setupPopStateHandler((view, section) => {
        handleNavigation(view, section, false);
    });

    const initialView = document.querySelector('.section-container.active')?.dataset.view;
    const initialSection = document.querySelector('.section-container.active .section-content.active')?.dataset.section;

    if (initialView && initialSection) {
        setInitialHistoryState(initialView, initialSection);
        console.log(`Main Controller Initialized. Initial state: ${initialView} / ${initialSection}`);
    } else {
        console.error("Could not determine initial state from DOM.");
    }
}