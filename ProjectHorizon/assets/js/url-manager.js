const urlMap = {
    'main-home': '',
    'main-explore': 'explore',
    'settings-accessibility': 'settings/accessibility',
    'settings-historyPrivacy': 'settings/history-privacy',
    'main-404': '404'
};

let BASE_PATH = '';

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