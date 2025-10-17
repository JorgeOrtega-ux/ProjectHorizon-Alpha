// assets/js/managers/notification-manager.js

let notificationContainer = null;
const maxNotifications = 3;
const activeNotifications = [];

function createNotificationContainer() {
    // Si no existe el contenedor, lo crea y lo añade al body.
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
}

function removeNotification(toastElement) {
    toastElement.classList.remove('show');
    toastElement.classList.add('hide');

    const removeHandler = () => {
        // Elimina la notificación del DOM
        if (toastElement.parentNode === notificationContainer) {
            notificationContainer.removeChild(toastElement);
        }
        
        // Elimina la notificación del array de seguimiento
        const index = activeNotifications.indexOf(toastElement);
        if (index > -1) {
            activeNotifications.splice(index, 1);
        }

        // Si no quedan notificaciones, elimina el contenedor principal
        if (activeNotifications.length === 0 && notificationContainer) {
            notificationContainer.parentNode.removeChild(notificationContainer);
            notificationContainer = null;
        }

        toastElement.removeEventListener('animationend', removeHandler);
    };

    toastElement.addEventListener('animationend', removeHandler);
}


export function showNotification(message, type = '') {
    const isLongerDuration = localStorage.getItem('longerMessageDuration') === 'true';
    const duration = isLongerDuration ? 5000 : 2000;

    // Solo crea el contenedor si no existe (es decir, con la primera notificación)
    createNotificationContainer();

    if (activeNotifications.length >= maxNotifications) {
        const oldestToast = activeNotifications.shift();
        if (oldestToast) {
            // Limpia el temporizador de la notificación más antigua antes de eliminarla
            clearTimeout(oldestToast.timer);
            removeNotification(oldestToast);
        }
    }

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    if (type) {
        toast.classList.add(type);
    }
    toast.textContent = message;

    notificationContainer.appendChild(toast);
    activeNotifications.push(toast); 

    const timer = setTimeout(() => {
        removeNotification(toast);
    }, duration);
    
    toast.timer = timer;

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
}

export function initNotificationManager() {
    // Ya no se crea el contenedor al iniciar, se hará bajo demanda.
    console.log("Notification Manager Initialized.");
}

window.showNotification = showNotification;