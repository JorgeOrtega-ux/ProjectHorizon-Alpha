<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded">
    <link rel="stylesheet" type="text/css" href="assets/css/styles.css">
    <title>Document</title>
</head>

<body>
    <div class="page-wrapper">
        <div class="main-content">
            <div class="general-content">
                <div class="general-content-top">
                    <?php include 'includes/layouts/header.php'; ?>
                </div>
                <div class="general-content-bottom">

                    <div class="module-content module-surface disabled" data-module="moduleSurface">
                        <div class="menu-content active" data-menu="main">
                            <div class="menu-list">
                                <div class="menu-link active" data-action="toggleSectionHome">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">home</span></div>
                                    <div class="menu-link-text"><span>Pagina principal</span></div>
                                </div>
                                <div class="menu-link" data-action="toggleSectionExplore">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">action_key</span></div>
                                    <div class="menu-link-text"><span>Explorar categorias</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="menu-content disabled" data-menu="settings">
                            <div class="menu-list">
                                <div class="menu-link" data-action="toggleMainView">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                                    <div class="menu-link-text"><span>Volver a inicio</span></div>
                                </div>
                                <div class="menu-link active" data-action="toggleSectionAccessibility">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">accessibility</span></div>
                                    <div class="menu-link-text"><span>Accesibilidad</span></div>
                                </div>
                                <div class="menu-link" data-action="toggleSectionControlCenter">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">developer_dashboard</span></div>
                                    <div class="menu-link-text"><span>Centro de control</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="general-content-scrolleable">
                        <div class="section-container active" data-view="main">
                            <div class="section-content active" data-section="sectionHome">Contenido de Home</div>
                            <div class="section-content disabled" data-section="sectionExplore">Contenido de Explorar</div>
                        </div>

                        <div class="section-container disabled" data-view="settings">
                            <div class="section-content active" data-section="sectionAccessibility">Contenido de Accesibilidad</div>
                            <div class="section-content disabled" data-section="sectionControlCenter">Contenido de Centro de Control</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // --- Selectores ---
            const menuButton = document.querySelector('[data-action="toggleModuleSurface"]');
            const moduleSurface = document.querySelector('[data-module="moduleSurface"]');
            
            const settingsButton = document.querySelector('[data-action="toggleSettings"]');
            const backToHomeButton = document.querySelector('[data-action="toggleMainView"]');
            
            const mainMenu = document.querySelector('[data-menu="main"]');
            const settingsMenu = document.querySelector('[data-menu="settings"]');
            
            const mainView = document.querySelector('.section-container[data-view="main"]');
            const settingsView = document.querySelector('.section-container[data-view="settings"]');

            const linkHome = document.querySelector('[data-action="toggleSectionHome"]');
            const linkExplore = document.querySelector('[data-action="toggleSectionExplore"]');
            const sectionHome = document.querySelector('[data-section="sectionHome"]');
            const sectionExplore = document.querySelector('[data-section="sectionExplore"]');

            const linkAccessibility = document.querySelector('[data-action="toggleSectionAccessibility"]');
            const linkControlCenter = document.querySelector('[data-action="toggleSectionControlCenter"]');
            const sectionAccessibility = document.querySelector('[data-section="sectionAccessibility"]');
            const sectionControlCenter = document.querySelector('[data-section="sectionControlCenter"]');
            
            // --- Lógica para mostrar/ocultar el menú lateral ---
            menuButton.addEventListener('click', () => {
                // Alterna entre los estados 'disabled' (oculto) y 'active' (visible)
                moduleSurface.classList.toggle('disabled');
                moduleSurface.classList.toggle('active');
            });

            // --- Lógica principal de cambio de vistas ---
            function switchView(viewToShow) {
                if (viewToShow === 'settings') {
                    mainMenu.classList.remove('active');
                    mainMenu.classList.add('disabled');
                    settingsMenu.classList.add('active');
                    settingsMenu.classList.remove('disabled');

                    mainView.classList.remove('active');
                    mainView.classList.add('disabled');
                    settingsView.classList.add('active');
                    settingsView.classList.remove('disabled');

                    linkAccessibility.classList.add('active');
                    linkControlCenter.classList.remove('active');
                    sectionAccessibility.classList.add('active');
                    sectionAccessibility.classList.remove('disabled');
                    sectionControlCenter.classList.add('disabled');
                    sectionControlCenter.classList.remove('active');

                } else { 
                    settingsMenu.classList.remove('active');
                    settingsMenu.classList.add('disabled');
                    mainMenu.classList.add('active');
                    mainMenu.classList.remove('disabled');
                    
                    settingsView.classList.remove('active');
                    settingsView.classList.add('disabled');
                    mainView.classList.add('active');
                    mainView.classList.remove('disabled');

                    linkHome.classList.add('active');
                    linkExplore.classList.remove('active');
                    sectionHome.classList.add('active');
                    sectionHome.classList.remove('disabled');
                    sectionExplore.classList.add('disabled');
                    sectionExplore.classList.remove('active');
                }
            }

            // Eventos para los botones principales
            settingsButton.addEventListener('click', () => switchView('settings'));
            backToHomeButton.addEventListener('click', () => switchView('main'));

            // --- Lógica para cambiar de SECCIÓN dentro de una vista ---
            const allMenuLinks = document.querySelectorAll('.menu-link');
            allMenuLinks.forEach(link => {
                if (link.dataset.action === 'toggleSettings' || link.dataset.action === 'toggleMainView') return;

                link.addEventListener('click', function() {
                    const action = this.dataset.action;
                    const sectionName = action.substring("toggle".length);
                    const targetSectionId = sectionName.charAt(0).toLowerCase() + sectionName.slice(1);
                    
                    const currentMenuList = this.closest('.menu-list');
                    currentMenuList.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
                    this.classList.add('active');

                    const currentView = document.querySelector('.section-container.active');
                    currentView.querySelectorAll('.section-content').forEach(section => {
                        if (section.dataset.section === targetSectionId) {
                            section.classList.add('active');
                            section.classList.remove('disabled');
                        } else {
                            section.classList.add('disabled');
                            section.classList.remove('active');
                        }
                    });
                });
            });
        });
    </script>
</body>

</html>