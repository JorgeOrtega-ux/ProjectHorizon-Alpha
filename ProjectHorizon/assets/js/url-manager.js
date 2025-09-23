const urlMap = {
    'main-home': '',
    'main-favorites': 'favorites',
    'main-trends': 'trends',
    'main-login': 'login',
    'main-register': 'register',
    'settings-accessibility': 'settings/accessibility',
    'settings-historyPrivacy': 'settings/history-privacy',
    'settings-history': 'settings/history',
    'help-privacyPolicy': 'help/privacy-policy',
    'help-termsConditions': 'help/terms-conditions',
    'help-cookiePolicy': 'help/cookie-policy',
    'help-sendFeedback': 'help/send-feedback',
    'main-galleryPhotos': 'gallery/{uuid}',
    'main-privateGalleryProxy': 'gallery/private/{uuid}',
    'main-photoView': 'gallery/{uuid}/photo/{photoId}',
    'main-userSpecificFavorites': 'favorites/{uuid}',
    'main-404': '404'
};

let BASE_PATH = '';

export function generateUrl(view, section, data = null) {
    const urlKey = `${view}-${section}`;
    let pathSegment = urlMap[urlKey] || '';

    if (data) {
        for (const key in data) {
            pathSegment = pathSegment.replace(`{${key}}`, data[key]);
        }
    }

    const newPath = pathSegment ? `${BASE_PATH}/${pathSegment}` : BASE_PATH;
    
    const finalUrl = `${window.location.protocol}//${window.location.host}${newPath || '/'}`;

    if (!pathSegment && !finalUrl.endsWith('/')) {
        return finalUrl + '/';
    }

    return finalUrl;
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
            callback(view, section, false, data);
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