/**
 * main-controller.js
 * Handles all UI logic, event listeners, and state changes for the application.
 */

import { navigateToUrl, setupPopStateHandler, setInitialHistoryState } from './url-manager.js';

/**
 * Main function to initialize the controller.
 */
export function initMainController() {
    // --- DOM Element Selectors ---
    const menuButton = document.querySelector('[data-action="toggleModuleSurface"]');
    const settingsButton = document.querySelector('[data-action="toggleSettings"]'); // <-- AÑADIDO
    const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
    const allMenuLinks = document.querySelectorAll('.menu-link');

    // --- State Variables ---
    let canCloseWithEsc = true; // Permite o no desactivar el módulo presionando ESC

    /**
     * The core function for handling navigation and UI updates.
     * @param {string} view - The target data-view to show.
     * @param {string} section - The target data-section to show.
     * @param {boolean} [pushState=true] - Whether to push a new state to the browser's history.
     */
    function handleNavigation(view, section, pushState = true) {
        // 1. Update the URL if required
        if (pushState) {
            navigateToUrl(view, section);
        }

        // 2. Update visibility of main containers (views)
        document.querySelectorAll('.section-container').forEach(v => {
            v.classList.toggle('active', v.dataset.view === view);
            v.classList.toggle('disabled', v.dataset.view !== view);
        });

        // 3. Update visibility of menus
        document.querySelectorAll('[data-menu]').forEach(menu => {
            menu.classList.toggle('active', menu.dataset.menu === view);
            menu.classList.toggle('disabled', menu.dataset.menu !== view);
        });

        // 4. Update visibility of content sections within the active view
        const activeViewContainer = document.querySelector(`.section-container[data-view="${view}"]`);
        if (activeViewContainer) {
            activeViewContainer.querySelectorAll('.section-content').forEach(s => {
                s.classList.toggle('active', s.dataset.section === section);
                s.classList.toggle('disabled', s.dataset.section !== section);
            });
        }
        
        // 5. Update the 'active' state on all menu links for visual feedback
        allMenuLinks.forEach(link => {
            const linkAction = link.dataset.action;
            let linkSection = '';

            if (linkAction.startsWith('toggleSection')) {
                const sectionName = linkAction.substring("toggleSection".length);
                linkSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
            }
            
            link.classList.toggle('active', linkSection === section);
        });
        
        // Special case: Ensure the "back" button is never highlighted as active.
        const backButton = document.querySelector('[data-action="toggleMainView"]');
        if (backButton) {
            backButton.classList.remove('active');
        }
    }

    // --- Event Listeners Setup ---

    // Toggle for the main side menu
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            moduleSurface.classList.toggle('disabled');
            moduleSurface.classList.toggle('active');
        });
    }

    // --- AÑADIDO: Event Listener para el botón de Settings ---
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            // Navega a la vista de settings y a su primera sección por defecto.
            handleNavigation('settings', 'accessibility');
        });
    }

    // Attach click handlers to all navigation links
    allMenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent full page reload
            const action = this.dataset.action;

            if (action === 'toggleMainView') {
                handleNavigation('main', 'home');
                return;
            }

            if (action.startsWith('toggleSection')) {
                const sectionName = action.substring("toggleSection".length);
                const targetSection = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                
                const parentMenu = this.closest('[data-menu]');
                const targetView = parentMenu ? parentMenu.dataset.menu : 'main';
    
                handleNavigation(targetView, targetSection);
            }
        });
    });

    // --- MODIFICADO: Listeners para cerrar el module surface ---
    
    // Cerrar al hacer clic fuera del módulo
    document.addEventListener('click', function(event) {
        if (moduleSurface.classList.contains('active')) {
            const isClickInsideModule = moduleSurface.contains(event.target);
            const isClickOnMenuButton = menuButton.contains(event.target);

            if (!isClickInsideModule && !isClickOnMenuButton) {
                moduleSurface.classList.add('disabled');
                moduleSurface.classList.remove('active');
            }
        }
    });

    // Cerrar con la tecla ESC
    document.addEventListener('keydown', function(event) {
        if (canCloseWithEsc && event.key === 'Escape' && moduleSurface.classList.contains('active')) {
            moduleSurface.classList.add('disabled');
            moduleSurface.classList.remove('active');
        }
    });


    // --- Initialization ---

    // Set up the handler for browser back/forward buttons
    setupPopStateHandler((view, section) => {
        handleNavigation(view, section, false); // false = don't update URL history again
    });

    // Get the initial state from the classes rendered by PHP
    const initialView = document.querySelector('.section-container.active')?.dataset.view;
    const initialSection = document.querySelector('.section-container.active .section-content.active')?.dataset.section;

    // Set the initial history state so the back button works from the start
    if (initialView && initialSection) {
        setInitialHistoryState(initialView, initialSection);
        console.log(`Main Controller Initialized. Initial state: ${initialView} / ${initialSection}`);
    } else {
        console.error("Could not determine initial state from DOM.");
    }
}