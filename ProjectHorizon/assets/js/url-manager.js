// assets/js/url-manager.js
const urlMap = {
    'main-home': '',
    'main-favorites': 'favorites',
    'main-trends': 'trends',
    'auth-login': 'login',
    'auth-register': 'register',
    'auth-forgotPassword': 'forgot-password',
    'auth-forgotPassword-enter-code': 'forgot-password/enter-code',
    'auth-forgotPassword-new-password': 'forgot-password/new-password',
    'settings-accessibility': 'settings/accessibility',
    'settings-loginSecurity': 'settings/login-security',
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
    'admin-manageUsers': 'admin/users',
    'admin-manageContent': 'admin/content',
    'main-404': '404'
};

let BASE_PATH = '';

export function generateUrl(view, section, data = null) {
    let urlKey = `${view}-${section}`;
    if (data && data.step) {
        urlKey += `-${data.step}`;
    }
    
    let pathSegment = urlMap[urlKey] || '';

    if (data) {
        for (const key in data) {
            if (key !== 'step') { // No reemplazamos 'step' en la URL
                pathSegment = pathSegment.replace(`{${key}}`, data[key]);
            }
        }
    }

    const newPath = pathSegment ? `${BASE_PATH}/${pathSegment}` : BASE_PATH;
    
    const finalUrl = `${window.location.protocol}//${window.location.host}${newPath || '/'}`;

    if (!pathSegment && !finalUrl.endsWith('/')) {
        return finalUrl + '/';
    }

    // Añade los parámetros que no están en la URL como query string
    const queryParams = new URLSearchParams();
    if(data) {
        for(const key in data){
            if(!pathSegment.includes(`{${key}}`) && key !== 'step'){
                queryParams.append(key, data[key]);
            }
        }
    }
    const queryString = queryParams.toString();
    return queryString ? `${finalUrl}?${queryString}` : finalUrl;
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