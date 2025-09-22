// assets/js/language-manager.js

const availableLanguages = {
    'es-LA': 'Español (Latinoamérica)',
    'en-US': 'English (United States)',
    'fr-FR': 'Français (France)'
};

function getBestLanguageMatch() {
    const browserLang = navigator.language || navigator.userLanguage;
    const primaryLang = browserLang.split('-')[0];

    if (availableLanguages[browserLang]) {
        return browserLang;
    }
    if (primaryLang === 'es') {
        return 'es-LA';
    }
    for (const langCode in availableLanguages) {
        if (langCode.startsWith(primaryLang)) {
            return langCode;
        }
    }
    return 'es-LA';
}

// La función ahora es exportada
export function updateLanguageSelectorUI(langCode) {
    const langSelector = document.querySelector('[data-target="language-select"]');
    if (langSelector) {
        const langText = langSelector.querySelector('.select-trigger-text');
        if (langText && availableLanguages[langCode]) {
            langText.textContent = availableLanguages[langCode];
        }
    }
    const langOptionsContainer = document.getElementById('language-select');
    if (langOptionsContainer) {
        const allLangLinks = langOptionsContainer.querySelectorAll('.menu-link');
        allLangLinks.forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = langOptionsContainer.querySelector(`.menu-link[data-value="${langCode}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

export function setLanguage(langCode) {
    if (!availableLanguages[langCode]) return;
    localStorage.setItem('language', langCode);
    updateLanguageSelectorUI(langCode);
    console.log(`Idioma establecido en: ${langCode}`);
}

export function initLanguageManager() {
    let currentLang = localStorage.getItem('language');

    if (!currentLang) {
        currentLang = getBestLanguageMatch();
        // Solo guardamos la preferencia, la UI se actualiza al cargar la sección
        localStorage.setItem('language', currentLang);
    }
    
    // Ya no llamamos a updateLanguageSelectorUI aquí
    console.log("Language Manager Initialized. Current language:", currentLang);
}