<?php
// api/utils.php

/**
 * Genera un token CSRF si no existe uno en la sesión actual.
 * @return string El token CSRF.
 */
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Valida un token CSRF comparándolo con el almacenado en la sesión.
 * @param string $token El token a validar.
 * @return bool True si el token es válido, false en caso contrario.
 */
function validate_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Genera un identificador único universal (UUID) versión 4.
 * @return string El UUID v4 generado.
 */
function generate_uuid_v4() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * Gestiona eventos de seguridad como intentos de login fallidos y bloqueos temporales.
 * @param mysqli $conn La conexión a la base de datos.
 * @param string $identifier El identificador del usuario (ej. email).
 * @param string $action La acción a realizar ('log_attempt', 'clear_all', 'check_lock', etc.).
 * @param string &$custom_message Mensaje de error personalizado (pasado por referencia).
 * @return bool Dependiendo de la acción, indica si el usuario está bloqueado o en cooldown.
 */
function handle_security_event($conn, $identifier, $action, &$custom_message = '') {
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $lockout_duration = 300; // 5 minutos en segundos
    $max_attempts = 5;

    // Acción para registrar un intento fallido (de login o de reseteo de código)
    if ($action === 'log_attempt' || $action === 'log_reset_fail') {
        $log_action_type = ($action === 'log_attempt') ? 'login_fail' : 'reset_fail';
        
        $stmt = $conn->prepare("INSERT INTO security_logs (user_identifier, action_type, ip_address) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $identifier, $log_action_type, $ip_address);
        $stmt->execute();
        $stmt->close();
        return;
    }

    // Acción para limpiar todos los intentos fallidos de un usuario (tras un éxito)
    if ($action === 'clear_all') {
        $stmt = $conn->prepare("DELETE FROM security_logs WHERE user_identifier = ? AND ip_address = ? AND (action_type = 'login_fail' OR action_type = 'reset_fail')");
        $stmt->bind_param("ss", $identifier, $ip_address);
        $stmt->execute();
        $stmt->close();
        return;
    }

    // Acción para verificar si un usuario está bloqueado por demasiados intentos
    if ($action === 'check_lock') {
        $stmt = $conn->prepare("SELECT COUNT(*) as attempt_count, MAX(created_at) as last_attempt_at FROM security_logs WHERE user_identifier = ? AND ip_address = ? AND (action_type = 'login_fail' OR action_type = 'reset_fail') AND created_at > (NOW() - INTERVAL ? SECOND)");
        $stmt->bind_param("ssi", $identifier, $ip_address, $lockout_duration);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($result && $result['attempt_count'] >= $max_attempts) {
            $db_time_result = $conn->query("SELECT NOW() as now")->fetch_assoc();
            $now_timestamp = strtotime($db_time_result['now']);
            $last_attempt_timestamp = strtotime($result['last_attempt_at']);
            
            $time_since_last_attempt = $now_timestamp - $last_attempt_timestamp;
            $time_left = $lockout_duration - $time_since_last_attempt;

            if ($time_left > 0) {
                $minutes_left = ceil($time_left / 60);
                $custom_message = "Has excedido el número de intentos. Por favor, inténtalo de nuevo en {$minutes_left} minutos.";
                return true; // Bloqueado
            }
        }
        return false; // No bloqueado
    }

    // Acción para verificar si se ha solicitado un reseteo de contraseña recientemente
    if ($action === 'check_reset_request') {
        $cooldown = 60; // 1 minuto en segundos
        $stmt = $conn->prepare("SELECT created_at FROM security_logs WHERE user_identifier = ? AND ip_address = ? AND action_type = 'reset_request' ORDER BY created_at DESC LIMIT 1");
        $stmt->bind_param("ss", $identifier, $ip_address);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
    
        if ($result) {
            $last_request_timestamp = strtotime($result['created_at']);
            $db_time_result = $conn->query("SELECT NOW() as now")->fetch_assoc();
            $now_timestamp = strtotime($db_time_result['now']);
            $time_since_last_request = $now_timestamp - $last_request_timestamp;
    
            if ($time_since_last_request < $cooldown) {
                $seconds_left = $cooldown - $time_since_last_request;
                $custom_message = "Has solicitado un código de recuperación recientemente. Por favor, espera {$seconds_left} segundos antes de volver a intentarlo.";
                return true; // En cooldown
            }
        }
    
        // Registrar la nueva solicitud
        $stmt_log = $conn->prepare("INSERT INTO security_logs (user_identifier, action_type, ip_address) VALUES (?, 'reset_request', ?)");
        $stmt_log->bind_param("ss", $identifier, $ip_address);
        $stmt_log->execute();
        $stmt_log->close();
    
        return false; // No en cooldown, se puede proceder
    }
}
?>