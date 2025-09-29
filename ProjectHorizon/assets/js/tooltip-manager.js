// assets/js/tooltip-manager.js

let activeTooltip = null;
let activePopperInstance = null;

function cleanupTooltip() {
    if (activePopperInstance) {
        activePopperInstance.destroy();
        activePopperInstance = null;
    }
    if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
    }
}

function detectBestPlacement(element) {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Estimaciones del tamaño del tooltip y el margen
    const tooltipWidth = 150;
    const tooltipHeight = 40;
    const margin = 12;

    const space = {
        top: rect.top,
        bottom: viewportHeight - rect.bottom,
        left: rect.left,
        right: viewportWidth - rect.right,
    };

    if (space.bottom >= tooltipHeight + margin) return 'bottom';
    if (space.top >= tooltipHeight + margin) return 'top';
    if (space.right >= tooltipWidth + margin) return 'right';
    if (space.left >= tooltipWidth + margin) return 'left';

    // Fallback si no hay espacio ideal
    const maxSpace = Math.max(space.bottom, space.top, space.right, space.left);
    if (maxSpace === space.bottom) return 'bottom';
    if (maxSpace === space.top) return 'top';
    if (maxSpace === space.right) return 'right';
    return 'left';
}


function showTooltip(element) {
    // Desactivar tooltips en dispositivos táctiles
    if (window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    const tooltipText = element.getAttribute('data-tooltip');
    if (!tooltipText) return;

    // Limpiar cualquier tooltip anterior para evitar duplicados
    cleanupTooltip();

    activeTooltip = document.createElement('div');
    activeTooltip.className = 'tooltip';
    activeTooltip.innerHTML = `<div class="tooltip-text">${tooltipText}</div>`;
    document.body.appendChild(activeTooltip);
    activeTooltip.style.display = 'block';

    const placement = detectBestPlacement(element);

    activePopperInstance = Popper.createPopper(element, activeTooltip, {
        placement: placement,
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: [0, 10], // Espacio entre el botón y el tooltip
                },
            },
            {
                name: 'flip', // Cambia de posición si no hay espacio
                options: {
                    fallbackPlacements: ['top', 'bottom', 'right', 'left'],
                    padding: 8,
                },
            },
            {
                name: 'preventOverflow', // Evita que el tooltip se salga de la pantalla
                options: {
                    boundary: 'viewport',
                    padding: 8,
                },
            },
        ],
    });
}

export function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        // Usamos un WeakSet para no volver a añadir listeners al mismo elemento
        const attachedElements = new WeakSet();
        if (attachedElements.has(element)) return;
        attachedElements.add(element);

        const showEvents = ['mouseenter', 'focus'];
        const hideEvents = ['mouseleave', 'blur', 'click']; // Se añade 'click' a los eventos que ocultan

        showEvents.forEach(event => {
            element.addEventListener(event, () => showTooltip(element));
        });

        hideEvents.forEach(event => {
            element.addEventListener(event, cleanupTooltip);
        });
    });
}