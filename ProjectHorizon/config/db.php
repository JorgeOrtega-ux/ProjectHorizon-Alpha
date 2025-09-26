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
$password = ""; // Reemplaza con tu contraseña de MySQL (contraseña incorrecta intencional para prueba)
$dbname = "project_horizon";

// Crear conexión
// El '@' suprime el warning de PHP por defecto, permitiendo nuestro manejo personalizado.
$conn = @new mysqli($servername, $username, $password, $dbname);

// Verificar conexión de forma segura
if ($conn->connect_error) {
  // Registra el error detallado en el archivo de log (privado)
  error_log("Error de conexión a la base de datos: " . $conn->connect_error);
  
  // ✅ **CAMBIO CLAVE**: Enviar una respuesta HTTP 500 (Internal Server Error)
  // Esto es crucial para que el JavaScript sepa que algo salió mal.
  http_response_code(500);
  
  // Termina la ejecución. El frontend se encargará de mostrar el mensaje.
  die();
}
?>