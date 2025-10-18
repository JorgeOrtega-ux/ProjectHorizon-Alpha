// assets/js/app-init.js

import { initMainController } from './app/main-controller.js';
import { initUrlManager } from './core/url-manager.js';
import { initThemeManager } from './managers/theme-manager.js';
import { initTooltips } from './managers/tooltip-manager.js';
import { initNotificationManager } from './managers/notification-manager.js';
import { initDialogManager } from './managers/dialog-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa módulos que no dependen de la sesión del usuario
    initUrlManager();
    initThemeManager();
    initNotificationManager();
    initDialogManager();
    
    // Inicia el controlador principal, que ahora se encarga de la sesión
    initMainController(); 
    
    // Inicializa los tooltips al final para que se apliquen a todo el contenido
    initTooltips();
});