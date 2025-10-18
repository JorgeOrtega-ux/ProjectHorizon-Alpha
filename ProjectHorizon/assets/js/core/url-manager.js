// assets/js/url-manager.js
const urlMap = {
    'main-home': '',
    'main-favorites': 'favorites',
    'main-trends': 'trends',
    'auth-login': 'login',
    'auth-register-user-info': 'register',
    'auth-register-password': 'register/password',
    'auth-register-verify-code': 'register/verify-code',
    'auth-forgotPassword': 'forgot-password',
    'auth-forgotPassword-enter-code': 'forgot-password/enter-code',
    'auth-forgotPassword-new-password': 'forgot-password/new-password',
    'settings-yourProfile': 'settings/your-profile',
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
    'admin-editGallery': 'admin/edit-gallery/{uuid}',
    'admin-createGallery': 'admin/create-gallery',
    'admin-manageComments': 'admin/comments',
    'admin-manageFeedback': 'admin/feedback',
    'admin-generalSettings': 'admin/site-settings',
    'admin-backup': 'admin/backup',
    'admin-dashboard': 'admin/dashboard',
    'admin-userProfile': 'admin/user/{uuid}',
    'admin-manageGalleryPhotos': 'admin/edit-gallery/{uuid}/photos',
    'admin-galleryStats': 'admin/gallery/{uuid}/stats',
    'admin-verifyFounder': 'admin/verify-founder',
    'admin-manageProfanity': 'admin/profanity-filter',
    'admin-manageLogs': 'admin/logs',
    'admin-viewLog': 'admin/logs/view/{filename}',
    'main-photoComments': 'gallery/{uuid}/photo/{photoId}/comments',
    'main-404': '404'
};

let BASE_PATH = '';

export function generateUrl(view, section, data = null) {
    let urlKey = `${view}-${section}`;
    if (data && data.step) {
        urlKey += `-${data.step}`;
    }

    const originalPathSegment = urlMap[urlKey] || '';
    let pathSegment = originalPathSegment;

    if (data) {
        for (const key in data) {
            if (key !== 'step') {
                pathSegment = pathSegment.replace(`{${key}}`, data[key]);
            }
        }
    }

    const newPath = pathSegment ? `${BASE_PATH}/${pathSegment}` : BASE_PATH;
    
    const finalUrl = `${window.location.protocol}//${window.location.host}${newPath || '/'}`;

    if (!pathSegment && !finalUrl.endsWith('/')) {
        return finalUrl + '/';
    }

    const queryParams = new URLSearchParams();
    if(data) {
        for(const key in data){
            if(!originalPathSegment.includes(`{${key}}`) && key !== 'step'){
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