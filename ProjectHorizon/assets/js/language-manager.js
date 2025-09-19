// assets/js/language-manager.js

const availableLanguages = {
    'es-LA': 'Español (Latinoamérica)',
    'en-US': 'English (United States)',
    'fr-FR': 'Français (France)'
};

function getBestLanguageMatch() {
    const browserLang = navigator.language || navigator.userLanguage; // p.ej., "en-US"
    const primaryLang = browserLang.split('-')[0]; // p.ej., "en"

    // 1. Búsqueda exacta (p.ej., "en-US" === "en-US")
    if (availableLanguages[browserLang]) {
        return browserLang;
    }

    // 2. Lógica especial para español (agrupar variantes como es-MX, es-ES en es-LA)
    if (primaryLang === 'es') {
        return 'es-LA';
    }

    // 3. Búsqueda por idioma primario (p.ej., buscar "en-US" si el navegador es "en-GB")
    for (const langCode in availableLanguages) {
        if (langCode.startsWith(primaryLang)) {
            return langCode;
        }
    }

    // 4. Si no hay coincidencias, volver al idioma por defecto (español)
    return 'es-LA';
}

function updateLanguageSelectorUI(langCode) {
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
    // Aquí iría la lógica para cargar las traducciones en el futuro
    console.log(`Idioma establecido en: ${langCode}`);
}

export function initLanguageManager() {
    let currentLang = localStorage.getItem('language');

    if (!currentLang) {
        currentLang = getBestLanguageMatch();
        setLanguage(currentLang);
    } else {
        // Asegura que la UI se actualice con el idioma guardado al cargar la página
        updateLanguageSelectorUI(currentLang);
    }

    console.log("Language Manager Initialized. Current language:", currentLang);
}