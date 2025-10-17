// assets/js/app-init.js

import { initMainController } from './app/main-controller.js';
import { initAuthController } from './app/auth-controller.js';
import { initUrlManager } from './core/url-manager.js';
import { initThemeManager } from './managers/theme-manager.js';
import { initLanguageManager } from './managers/language-manager.js';
import { initTooltips } from './managers/tooltip-manager.js';
import { initNotificationManager } from './managers/notification-manager.js';
import { initDialogManager } from './managers/dialog-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    initUrlManager();
    initThemeManager();
    initLanguageManager();
    initNotificationManager();
    initDialogManager();
    initAuthController();
    initMainController();
    initTooltips();
});