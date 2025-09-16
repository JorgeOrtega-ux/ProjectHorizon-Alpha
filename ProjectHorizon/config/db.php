<?php
// Desactivar la visualización de errores en producción
// ini_set('display_errors', 0);
// error_reporting(0);

$servername = "localhost";
$username = "root"; // Reemplaza con tu nombre de usuario de MySQL
$password = ""; // Reemplaza con tu contraseña de MySQL
$dbname = "project_horizon";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión de forma segura
if ($conn->connect_error) {
  // Registrar el error detallado en un archivo de log (privado)
  error_log("Error de conexión a la base de datos: " . $conn->connect_error, 3, "/path/to/your/private/logs/db_errors.log");
  
  // Mostrar un mensaje genérico al usuario y terminar la ejecución
  http_response_code(500); // Internal Server Error
  die(json_encode(['success' => false, 'message' => 'Ocurrió un error inesperado. Por favor, inténtalo más tarde.']));
}
?>