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
    const settingsButton = document.querySelector('[data-action="toggleSettings"]');
    const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
    const allMenuLinks = document.querySelectorAll('.menu-link');

    // --- State Variables ---
    let canCloseWithEsc = true;

    /**
     * The core function for handling navigation and UI updates.
     * @param {string} view - The target data-view to show.
     * @param {string} section - The target data-section to show.
     * @param {boolean} [pushState=true] - Whether to push a new state to the browser's history.
     */
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

    // --- Event Listeners Setup ---

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

    // --- Custom Select Dropdown Logic ---
    document.addEventListener('click', function(event) {
        const trigger = event.target.closest('[data-action="toggle-select"]');
        const allSelects = document.querySelectorAll('.module-select');
        const allTriggers = document.querySelectorAll('[data-action="toggle-select"]');

        // If a trigger was clicked
        if (trigger) {
            const targetId = trigger.dataset.target;
            const targetSelect = document.getElementById(targetId);
            const wasActive = trigger.classList.contains('active-trigger');

            // First, close everything
            allTriggers.forEach(t => t.classList.remove('active-trigger'));
            allSelects.forEach(s => {
                s.classList.add('disabled');
                s.classList.remove('active');
            });

            // If it wasn't already active, open it
            if (!wasActive) {
                trigger.classList.add('active-trigger');
                if (targetSelect) {
                    targetSelect.classList.remove('disabled');
                    targetSelect.classList.add('active');
                }
            }
        } else {
            // If the click was not on a trigger, check if it's inside a select component at all
            const selectWrapper = event.target.closest('.select-wrapper');

            // If the click is inside a select wrapper (likely on an option)
            if (selectWrapper) {
                const option = event.target.closest('.module-select .menu-link');
                if (option) {
                    const selectContainer = option.closest('.module-select');
                    const wrapper = selectContainer.closest('.select-wrapper');
                    const currentTrigger = wrapper.querySelector('[data-action="toggle-select"]');
                    const triggerText = currentTrigger.querySelector('.select-trigger-text');
                    
                    // Update the trigger text with the selected option's text
                    const optionText = option.querySelector('.menu-link-text span');
                    if(triggerText && optionText) {
                        triggerText.textContent = optionText.textContent;
                    }
                    
                    // Close the dropdown and deactivate the trigger
                    selectContainer.classList.add('disabled');
                    selectContainer.classList.remove('active');
                    if (currentTrigger) {
                        currentTrigger.classList.remove('active-trigger');
                    }
                }
            } else {
                 // If the click was completely outside any select component, close all
                allTriggers.forEach(t => t.classList.remove('active-trigger'));
                allSelects.forEach(select => {
                    select.classList.add('disabled');
                    select.classList.remove('active');
                });
            }
        }

        // Logic to close the main module surface
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
        if (canCloseWithEsc && event.key === 'Escape' && moduleSurface && moduleSurface.classList.contains('active')) {
            moduleSurface.classList.add('disabled');
            moduleSurface.classList.remove('active');
        }
    });
    
    // --- Toggle Switch Logic ---
    const allToggleSwitches = document.querySelectorAll('.toggle-switch');
    allToggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });


    // --- Initialization ---
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