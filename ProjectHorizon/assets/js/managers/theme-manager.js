// assets/js/managers/theme-manager.js

export function applyTheme() {
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
    if (window.saveUserPreferences) {
        window.saveUserPreferences();
    }
}

export function updateThemeSelectorUI(theme) {
    const themeSelector = document.querySelector('[data-target="theme-select"]');
    if (themeSelector) {
        const themeText = themeSelector.querySelector('.select-trigger-text');
        const translationKeys = {
            'system': 'settings.accessibility.themeOptions.system',
            'dark': 'settings.accessibility.themeOptions.dark',
            'light': 'settings.accessibility.themeOptions.light'
        };
        if (themeText && translationKeys[theme]) {
            themeText.setAttribute('data-i18n', translationKeys[theme]);
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
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme();
        }
    });

    console.log("Theme Manager Initialized.");
}