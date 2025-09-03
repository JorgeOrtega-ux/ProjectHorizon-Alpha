/**
 * app-init.js
 * The main entry point for the application's JavaScript.
 * This file imports and initializes all the necessary modules.
 */

import { initMainController } from './main-controller.js';
import { initUrlManager } from './url-manager.js';

// Wait for the DOM to be fully loaded before running any scripts.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the URL manager first to set up routing logic.
    initUrlManager();
    
    // Initialize the main controller to handle UI and events.
    initMainController();
});
