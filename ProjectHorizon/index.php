<?php require_once 'config/router.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
        window.BASE_PATH = "<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>";
    </script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded">
    <link rel="stylesheet" type="text/css" href="/ProjectHorizon/assets/css/styles.css">
    <title>My Dynamic Website</title>
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
                        <div class="menu-content <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-menu="main">
                            <div class="menu-list">
                                <div class="menu-link <?php echo ($CURRENT_SECTION === 'home') ? 'active' : ''; ?>" data-action="toggleSectionHome">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">home</span></div>
                                    <div class="menu-link-text"><span>Pagina principal</span></div>
                                </div>
                                <div class="menu-link <?php echo ($CURRENT_SECTION === 'explore') ? 'active' : ''; ?>" data-action="toggleSectionExplore">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">explore</span></div>
                                    <div class="menu-link-text"><span>Explorar categorias</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="menu-content <?php echo ($CURRENT_VIEW === 'settings') ? 'active' : 'disabled'; ?>" data-menu="settings">
                            <div class="menu-list">
                                <div class="menu-link" data-action="toggleMainView">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">arrow_back</span></div>
                                    <div class="menu-link-text"><span>Volver a inicio</span></div>
                                </div>
                                <div class="menu-link <?php echo ($CURRENT_SECTION === 'accessibility') ? 'active' : ''; ?>" data-action="toggleSectionAccessibility">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">accessibility</span></div>
                                    <div class="menu-link-text"><span>Accesibilidad</span></div>
                                </div>
                                <div class="menu-link <?php echo ($CURRENT_SECTION === 'historyPrivacy') ? 'active' : ''; ?>" data-action="toggleSectionHistoryPrivacy">
                                    <div class="menu-link-icon"><span class="material-symbols-rounded">history</span></div>
                                    <div class="menu-link-text"><span>Historial y Privacidad</span></div>
                                </div>
                                </div>
                        </div>
                    </div>

                    <div class="general-content-scrolleable">
                        <div class="section-container <?php echo ($CURRENT_VIEW === 'main') ? 'active' : 'disabled'; ?>" data-view="main">
                            <div class="section-content <?php echo ($CURRENT_SECTION === 'home') ? 'active' : 'disabled'; ?>" data-section="home">Contenido de Home</div>
                            <div class="section-content <?php echo ($CURRENT_SECTION === 'explore') ? 'active' : 'disabled'; ?>" data-section="explore">Contenido de Explorar</div>
                        </div>

                        <div class="section-container <?php echo ($CURRENT_VIEW === 'settings') ? 'active' : 'disabled'; ?>" data-view="settings">
                            <div class="section-content <?php echo ($CURRENT_SECTION === 'accessibility') ? 'active' : 'disabled'; ?>" data-section="accessibility">Contenido de Accesibilidad</div>
                            <div class="section-content <?php echo ($CURRENT_SECTION === 'historyPrivacy') ? 'active' : 'disabled'; ?>" data-section="historyPrivacy">Contenido de Historial y Privacidad</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script type="module" src="/ProjectHorizon/assets/js/app-init.js"></script>
</body>
</html>