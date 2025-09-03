/**
 * url-manager.js
 * Manages all client-side routing, URL generation, and History API interactions.
 */

// A map to associate view/section combinations with their URL paths.
const urlMap = {
    'main-home': '',
    'main-explore': 'explore',
    'settings-accessibility': 'settings/accessibility',
    'settings-controlCenter': 'settings/control-center' // Corrected key to match section name
};

let BASE_PATH = '';

/**
 * Calculates the base path of the application. 
 * This is crucial if the website is hosted in a subfolder.
 * @returns {string} The calculated base path.
 */
function getBasePath() {
    let path = window.location.pathname;
    // If the path includes the main script name, remove it.
    if (path.includes('/index.php')) {
        path = path.substring(0, path.lastIndexOf('/'));
    }
    // Ensure it doesn't end with a slash unless it's the root.
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Generates a full, clean URL for a given view and section.
 * @param {string} view - The data-view identifier (e.g., 'main').
 * @param {string} section - The data-section identifier (e.g., 'home').
 * @returns {string} The absolute URL.
 */
function generateUrl(view, section) {
    const urlKey = `${view}-${section}`;
    const newPath = urlMap[urlKey];
    // Constructs the URL from the protocol, host, base path, and the new route path.
    return `${window.location.protocol}//${window.location.host}${BASE_PATH}/${newPath}`;
}

/**
 * Updates the browser's address bar using the History API.
 * @param {string} view - The target view.
 * @param {string} section - The target section.
 */
export function navigateToUrl(view, section) {
    const url = generateUrl(view, section);
    const title = document.title; // You can also create dynamic titles here.

    // Only push a new state if the URL is actually different.
    if (window.location.href !== url) {
        history.pushState({ view, section }, title, url);
    }
}

/**
 * Sets up the event listener for the browser's back and forward buttons.
 * @param {function} callback - The function to call when a popstate event occurs.
 */
export function setupPopStateHandler(callback) {
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            const { view, section } = event.state;
            // The callback will handle updating the UI without pushing a new history state.
            callback(view, section, false);
        }
    });
}

/**
 * Sets the initial state in the browser's history on first page load.
 * This ensures that the back button works correctly from the very beginning.
 * @param {string} initialView - The view loaded initially by PHP.
 * @param {string} initialSection - The section loaded initially by PHP.
 */
export function setInitialHistoryState(initialView, initialSection) {
    history.replaceState({ view: initialView, section: initialSection }, document.title, window.location.href);
}

/**
 * Initializes the URL manager by calculating the base path.
 */
export function initUrlManager() {
    BASE_PATH = getBasePath();
    console.log("URL Manager Initialized. Base Path:", BASE_PATH);
}
