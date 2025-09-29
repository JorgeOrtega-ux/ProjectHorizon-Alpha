// assets/js/theme-manager.js

function applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    const htmlElement = document.documentElement;

    htmlElement.classList.remove('light-theme', 'dark-theme');

    if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark-theme');
    } else {
        htmlElement.classList.add('light-theme');
    }
}

export function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme();
    updateThemeSelectorUI(theme);
}

// ✅ FUNCIÓN CORREGIDA
export function updateThemeSelectorUI(theme) {
    const themeSelector = document.querySelector('[data-target="theme-select"]');
    if (themeSelector) {
        const themeText = themeSelector.querySelector('.select-trigger-text');
        // Mapea los valores del tema a sus claves de traducción
        const translationKeys = {
            'system': 'settings.accessibility.themeOptions.system',
            'dark': 'settings.accessibility.themeOptions.dark',
            'light': 'settings.accessibility.themeOptions.light'
        };
        if (themeText && translationKeys[theme]) {
            // 1. Establece el atributo data-i18n con la clave correcta
            themeText.setAttribute('data-i18n', translationKeys[theme]);
            // 2. Usa la función de traducción para obtener y mostrar el texto
            themeText.textContent = window.getTranslation(translationKeys[theme]);
        }
    }
    const themeOptionsContainer = document.getElementById('theme-select');
    if (themeOptionsContainer) {
        const allThemeLinks = themeOptionsContainer.querySelectorAll('.menu-link');
        allThemeLinks.forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = themeOptionsContainer.querySelector(`.menu-link[data-value="${theme}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}


export function initThemeManager() {
    applyTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme();
        }
    });

    console.log("Theme Manager Initialized.");
}