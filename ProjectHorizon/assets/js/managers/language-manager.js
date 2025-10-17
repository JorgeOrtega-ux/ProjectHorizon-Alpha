// assets/js/managers/language-manager.js

import * as api from '../core/api-handler.js';

let translations = {};
const availableLanguages = {
    'es-419': 'Español (Latinoamérica)',
    'en-US': 'English (United States)',
    'fr-FR': 'Français (France)',
    'de-DE': 'Deutsch (Deutschland)',
    'pt-BR': 'Português (Brasil)'
};

async function fetchTranslations(langCode, userRole = 'user') {
    try {
        // 1. Cargar las traducciones principales
        const mainResponse = await fetch(`${window.BASE_PATH}/assets/lang/${langCode}.json`);
        if (!mainResponse.ok) {
            throw new Error(`Could not load main ${langCode}.json`);
        }
        let mainTranslations = await mainResponse.json();

        // 2. Comprobar si el usuario es administrador o fundador
        const adminRoles = ['administrator', 'founder', 'moderator'];
        if (adminRoles.includes(userRole)) {
            try {
                // 3. Si es admin/founder/moderator, cargar y fusionar las traducciones de administrador
                const adminResponse = await fetch(`${window.BASE_PATH}/assets/lang/admin/${langCode}.json`);
                if (adminResponse.ok) {
                    const adminTranslations = await adminResponse.json();
                    // Fusionar traducciones, las de admin tienen prioridad
                    mainTranslations = { ...mainTranslations, ...adminTranslations };
                }
            } catch (adminError) {
                console.warn("Could not load admin translations, continuing with main translations:", adminError);
            }
        }

        translations = mainTranslations;

    } catch (error) {
        console.error("Failed to fetch translations:", error);
        translations = {};
    }
    applyTranslations(document.body);
}

function getTranslation(key, replacements = {}) {
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
        result = result[k];
        if (result === undefined) {
            return key;
        }
    }

    if (typeof result === 'string') {
        for (const placeholder in replacements) {
            result = result.replace(`{${placeholder}}`, replacements[placeholder]);
        }
    }

    return result;
}

export function applyTranslations(element) {
    element.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = getTranslation(key);
    });

    element.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        el.placeholder = getTranslation(key);
    });

    element.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.dataset.i18nTooltip;
        el.setAttribute('data-tooltip', getTranslation(key));
    });
}

function getBestLanguageMatch() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (availableLanguages[browserLang]) {
        return browserLang;
    }
    const primaryLang = browserLang.split('-')[0];
    if (primaryLang === 'es') return 'es-419';
    if (primaryLang === 'en') return 'en-US';

    return 'es-419';
}

export function updateLanguageSelectorUI(langCode) {
    const langSelector = document.querySelector('[data-target="language-select"]');
    if (langSelector) {
        const langText = langSelector.querySelector('.select-trigger-text');
        const translationKeys = {
            'es-419': 'settings.accessibility.languageOptions.es-419',
            'en-US': 'settings.accessibility.languageOptions.en-US',
            'fr-FR': 'settings.accessibility.languageOptions.fr-FR',
            'de-DE': 'settings.accessibility.languageOptions.de-DE',
            'pt-BR': 'settings.accessibility.languageOptions.pt-BR'
        };
        if (langText && translationKeys[langCode]) {
            langText.setAttribute('data-i18n', translationKeys[langCode]);
            langText.textContent = window.getTranslation(translationKeys[langCode]);
        }
    }
    const langOptionsContainer = document.getElementById('language-select');
    if (langOptionsContainer) {
        const allLangLinks = langOptionsContainer.querySelectorAll('.menu-link');
        allLangLinks.forEach(link => link.classList.remove('active'));
        const activeLink = langOptionsContainer.querySelector(`.menu-link[data-value="${langCode}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

export async function setLanguage(langCode, userRole, save = true) {
    if (!availableLanguages[langCode]) return;

    localStorage.setItem('language', langCode);

    await fetchTranslations(langCode, userRole);
    updateLanguageSelectorUI(langCode);
    console.log(`Idioma establecido en: ${langCode}`);
    if (save && window.saveUserPreferences) {
        window.saveUserPreferences();
    }
}


export function initLanguageManager() {
    // La lógica de inicialización ahora está en main-controller.js
    console.log("Language Manager Initialized.");
}


window.getTranslation = getTranslation;
window.applyTranslations = applyTranslations