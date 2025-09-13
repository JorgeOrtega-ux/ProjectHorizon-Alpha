import { initMainController } from './main-controller.js';
import { initUrlManager } from './url-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    initUrlManager();
    initMainController();
});