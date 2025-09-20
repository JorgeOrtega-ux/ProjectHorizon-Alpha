<?php require_once 'config/router.php'; ?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Horizon</title>
    <script>
        window.BASE_PATH = "<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>";
    </script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" type="text/css" href="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>/assets/css/styles.css">
</head>

<body>
    <div class="page-wrapper">
        <div class="main-content">
            <div class="general-content">
                <div class="general-content-top">
                    <?php include 'includes/layouts/header.php'; ?>
                </div>
                <div class="general-content-bottom">
                    <?php include 'includes/modules/module-surface.php'; ?>
                    <div class="general-content-scrolleable overflow-y"></div>
                </div>
            </div>
        </div>
    </div>

    <script type="module" src="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>/assets/js/app-init.js"></script>
</body>

</html>