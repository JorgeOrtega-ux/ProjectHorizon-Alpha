<?php
// =================================================================
// CONFIGURACIÓN DE ERRORES PARA PRODUCCIÓN
// =================================================================
// Oculta los errores a los usuarios finales. ¡Siempre activado en producción!
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL); // Reportar todos los errores para logging

// =================================================================
// GESTIÓN DE LOGS DE ERRORES
// =================================================================
// Define una ruta de log segura y relativa al proyecto.
$log_path = __DIR__ . '/../logs'; 
if (!file_exists($log_path)) {
    // Intenta crear el directorio si no existe.
    mkdir($log_path, 0777, true);
}
ini_set('error_log', $log_path . '/db_errors.log');

// =================================================================
// CONEXIÓN A LA BASE DE DATOS
// =================================================================
$servername = "localhost";
$username = "root"; // Reemplaza con tu nombre de usuario de MySQL
$password = ""; // Reemplaza con tu contraseña de MySQL
$dbname = "project_horizon";

// Crear conexión
$conn = @new mysqli($servername, $username, $password, $dbname);

// Verificar conexión de forma segura
if ($conn->connect_error) {
  error_log("Error de conexión a la base de datos: " . $conn->connect_error);
  http_response_code(500);
  die();
}

// =================================================================
// MODO MANTENIMIENTO
// =================================================================
$maintenance_mode = false;
$result = $conn->query("SELECT setting_value FROM server_settings WHERE setting_key = 'maintenance_mode'");
if ($result && $row = $result->fetch_assoc()) {
    $maintenance_mode = ($row['setting_value'] === '1');
}
define('MAINTENANCE_MODE', $maintenance_mode);

?>