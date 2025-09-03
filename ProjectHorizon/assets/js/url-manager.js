/**
 * url-manager.js
 * Manages all client-side routing, URL generation, and History API interactions.
 */

// A map to associate view/section combinations with their URL paths.
const urlMap = {
    'main-home': '',
    'main-explore': 'explore',
    'settings-accessibility': 'settings/accessibility',
    // LÍNEA MODIFICADA
    'settings-historyPrivacy': 'settings/history-privacy',
    'main-404': '404'
};

let BASE_PATH = '';

// ... (El resto del archivo no necesita cambios)
// Puedes dejar el resto del código como está.
// La función initUrlManager leerá el BASE_PATH de la variable global que configuramos.

function generateUrl(view, section) {
    const urlKey = `${view}-${section}`;
    const pathSegment = urlMap[urlKey];
    const newPath = pathSegment ? `${BASE_PATH}/${pathSegment}` : BASE_PATH;
    
    return `${window.location.protocol}//${window.location.host}${newPath || '/'}`;
}

export function navigateToUrl(view, section) {
    const url = generateUrl(view, section);
    const title = document.title; 

    if (window.location.href !== url) {
        history.pushState({ view, section }, title, url);
    }
}

export function setupPopStateHandler(callback) {
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const { view, section } = event.state;
            callback(view, section, false);
        }
    });
}

export function setInitialHistoryState(initialView, initialSection) {
    history.replaceState({ view: initialView, section: initialSection }, document.title, window.location.href);
}

export function initUrlManager() {
    BASE_PATH = window.BASE_PATH || '';
    console.log("URL Manager Initialized. Base Path:", BASE_PATH);
}