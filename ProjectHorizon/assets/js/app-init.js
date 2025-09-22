// assets/js/app-init.js

import { initMainController } from './main-controller.js';
import { initUrlManager } from './url-manager.js';
import { initThemeManager } from './theme-manager.js';
import { initLanguageManager } from './language-manager.js';
import { initTooltips } from './tooltip-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    initUrlManager();
    initThemeManager();
    initLanguageManager();
    initMainController();
    initTooltips();
});