const urlMap = {
    'main-home': '',
    'main-favorites': 'favorites',
    'main-explore': 'explore',
    'settings-accessibility': 'settings/accessibility',
    'settings-historyPrivacy': 'settings/history-privacy',
    'main-userPhotos': 'user/{uuid}', // Plantilla para galería de usuario
    'main-photoView': 'user/{uuid}/photo/{photoId}', // Plantilla para foto individual
    'main-404': '404'
};

let BASE_PATH = '';

export function generateUrl(view, section, data = null) {
    const urlKey = `${view}-${section}`;
    let pathSegment = urlMap[urlKey] || '';

    // Si hay datos, reemplaza los placeholders en la URL
    if (data) {
        for (const key in data) {
            pathSegment = pathSegment.replace(`{${key}}`, data[key]);
        }
    }

    const newPath = pathSegment ? `${BASE_PATH}/${pathSegment}` : BASE_PATH;
    return `${window.location.protocol}//${window.location.host}${newPath || '/'}`;
}

export function navigateToUrl(view, section, data = null) {
    const url = generateUrl(view, section, data);
    const title = document.title; 

    if (window.location.href !== url) {
        history.pushState({ view, section, data }, title, url);
    }
}

export function setupPopStateHandler(callback) {
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const { view, section, data } = event.state;
            callback(view, section, false, data); // Pasamos los datos extra
        }
    });
}

export function setInitialHistoryState(initialView, initialSection, data = null) {
    history.replaceState({ view: initialView, section: initialSection, data }, document.title, window.location.href);
}

export function initUrlManager() {
    BASE_PATH = window.BASE_PATH || '';
    console.log("URL Manager Initialized. Base Path:", BASE_PATH);
}