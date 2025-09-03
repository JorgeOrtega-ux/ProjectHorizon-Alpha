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
                    <div class="module-content module-surface">
                        <div class="menu-content">
                            <div class="menu-list">
                                <div class="menu-link active" data-action="toggleSectionHome">
                                    <div class="menu-link-icon">
                                        <span class="material-symbols-rounded">home</span>
                                    </div>
                                    <div class="menu-link-text">
                                        <span>Pagina principal</span>
                                    </div>
                                </div>
                                <div class="menu-link" data-action="toggleSectionExplore">
                                    <div class="menu-link-icon">
                                        <span class="material-symbols-rounded">action_key</span>
                                    </div>
                                    <div class="menu-link-text">
                                        <span>Explorar categorias</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="general-content-scrolleable">
                        <div class="section-container">
                            <div class="section-content active" data-section="sectionHome">1</div>
                            <div class="section-content disabled" data-section="sectionExplore">2</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>

</html>