<?php
// =================================================================
// CONFIGURACIÓN DE ERRORES PARA PRODUCCIÓN
// =================================================================
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// =================================================================
// GESTIÓN DE LOGS DE ERRORES
// =================================================================
$log_path = __DIR__ . '/../logs';
if (!file_exists($log_path)) {
    mkdir($log_path, 0777, true);
}
ini_set('error_log', $log_path . '/db_errors.log');

// =================================================================
// CONEXIÓN A LA BASE DE DATOS
// =================================================================
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "project_horizon";

$conn = @new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  error_log("Error de conexión a la base de datos: " . $conn->connect_error);
  http_response_code(500);
  die();
}

// =================================================================
// CARGAR CONFIGURACIONES DEL SERVIDOR Y DEFINIR CONSTANTES
// =================================================================
$settings = [];
$result = $conn->query("SELECT setting_key, setting_value FROM server_settings");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
}

// Definir constantes con valores por defecto si no se encuentran en la BD
define('MAINTENANCE_MODE', isset($settings['maintenance_mode']) && $settings['maintenance_mode'] === '1');
define('ALLOW_NEW_REGISTRATIONS', isset($settings['allow_new_registrations']) && $settings['allow_new_registrations'] === '1');
define('UNLOCK_DURATION', (int)($settings['unlock_duration'] ?? 60));
// --- INICIO DE LA CORRECCIÓN ---
// Se elimina la conversión a (int) para conservar la cadena completa (ej. "15_cooldown")
define('AD_PROBABILITY', $settings['ad_probability'] ?? '15_cooldown');
// --- FIN DE LA CORRECCIÓN ---

?>