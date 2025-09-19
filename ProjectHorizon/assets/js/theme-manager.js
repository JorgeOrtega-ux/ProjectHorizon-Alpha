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

// La función ahora es exportada
export function updateThemeSelectorUI(theme) {
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

    // Ya no llamamos a updateThemeSelectorUI aquí porque el HTML puede no existir.
    // Se llamará desde el main-controller cuando sea necesario.

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme();
        }
    });

    console.log("Theme Manager Initialized.");
}