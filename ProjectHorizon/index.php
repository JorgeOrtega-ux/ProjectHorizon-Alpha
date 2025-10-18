<?php 
require_once 'config/router.php'; 
require_once 'config/db.php';

// --- INICIO DE LA MODIFICACIÓN ---
// Inicia la sesión si aún no se ha hecho.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Define los roles que se consideran "staff"
$staff_roles = ['moderator', 'administrator', 'founder'];

// Verifica si el usuario ha iniciado sesión y si su rol es de staff
$is_staff = isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true && isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], $staff_roles);
// --- FIN DE LA MODIFICACIÓN ---
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Horizon</title>
    <script>
        (function() {
            try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark-theme');
                } else {
                    document.documentElement.classList.add('light-theme');
                }
            } catch (e) {
                document.documentElement.classList.add('light-theme');
            }
        })();
    </script>

    <script>
        window.BASE_PATH = "<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>";
        window.MAINTENANCE_MODE = <?php echo json_encode(MAINTENANCE_MODE); ?>;
        window.UNLOCK_DURATION = <?php echo json_encode(UNLOCK_DURATION); ?>;
        window.AD_PROBABILITY = <?php echo json_encode(AD_PROBABILITY); ?>;
    </script>

    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <link rel="stylesheet" type="text/css" href="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>/assets/css/styles.css">
    
    <?php
    // --- INICIO DE LA MODIFICACIÓN ---
    // Carga los recursos de administrador solo si el usuario es staff
    if ($is_staff) {
        echo '<link rel="stylesheet" type="text/css" href="' . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/assets/css/styles-admin.css">';
    }
    // --- FIN DE LA MODIFICACIÓN ---
    ?>
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

    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <?php
    // --- INICIO DE LA MODIFICACIÓN ---
    // Carga los scripts de administrador solo si el usuario es staff
    if ($is_staff) {
        echo '<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>';
        echo '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
    }
    // --- FIN DE LA MODIFICACIÓN ---
    ?>
    <script type="module" src="<?php echo rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); ?>/assets/js/app-init.js"></script>
</body>

</html>