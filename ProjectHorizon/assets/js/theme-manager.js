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

function updateThemeSelectorUI(theme) {
    const themeSelector = document.querySelector('[data-target="theme-select"]');
    if (themeSelector) {
        const themeText = themeSelector.querySelector('.select-trigger-text');
        const options = {
            'system': 'Sincronizar con el sistema',
            'dark': 'Tema oscuro',
            'light': 'Tema claro'
        };
        if (themeText && options[theme]) {
            themeText.textContent = options[theme];
        }
    }
}


export function initThemeManager() {
    applyTheme();

    const savedTheme = localStorage.getItem('theme') || 'system';
    updateThemeSelectorUI(savedTheme);


    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme();
        }
    });

    console.log("Theme Manager Initialized.");
}