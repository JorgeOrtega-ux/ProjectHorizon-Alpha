// assets/js/notification-manager.js

let notificationContainer = null;
const maxNotifications = 3; // ✅ **LÍNEA AÑADIDA: Número máximo de notificaciones**
const activeNotifications = []; // ✅ **LÍNEA AÑADIDA: Rastreador de notificaciones activas**

function createNotificationContainer() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
}

// ✅ **FUNCIÓN ACTUALIZADA: Elimina una notificación específica**
function removeNotification(toastElement) {
    toastElement.classList.remove('show');
    toastElement.classList.add('hide');

    const removeHandler = () => {
        if (toastElement.parentNode === notificationContainer) {
            notificationContainer.removeChild(toastElement);
        }
        // Elimina la notificación del array de seguimiento
        const index = activeNotifications.indexOf(toastElement);
        if (index > -1) {
            activeNotifications.splice(index, 1);
        }
        toastElement.removeEventListener('animationend', removeHandler);
    };

    toastElement.addEventListener('animationend', removeHandler);
}


export function showNotification(message, type = '') {
    const isLongerDuration = localStorage.getItem('longerMessageDuration') === 'true';
    const duration = isLongerDuration ? 5000 : 2000;

    if (!notificationContainer) {
        createNotificationContainer();
    }

    // ✅ **LÓGICA AÑADIDA: Gestiona el límite de notificaciones**
    if (activeNotifications.length >= maxNotifications) {
        // Si se alcanza el límite, elimina la notificación más antigua (la primera del array)
        const oldestToast = activeNotifications.shift();
        if (oldestToast) {
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
    activeNotifications.push(toast); // Añade la nueva notificación al array

    // Guarda el temporizador para poder cancelarlo si es necesario
    const timer = setTimeout(() => {
        removeNotification(toast);
    }, duration);

    // Asocia el temporizador con el elemento toast para referencia futura
    toast.timer = timer;

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
}

export function initNotificationManager() {
    createNotificationContainer();
    console.log("Notification Manager Initialized.");
}