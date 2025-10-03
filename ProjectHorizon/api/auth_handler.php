<?php
session_start();

require_once '../config/db.php';

// --- FUNCIONES DE UTILIDAD Y SEGURIDAD ---

function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validate_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function generate_uuid_v4() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function handle_security_event($conn, $identifier, $action, &$custom_message = '') {
    $lockout_duration = 300; // 5 minutos
    $max_attempts = 5;

    if ($action === 'log_attempt' || $action === 'log_reset_fail') {
        $log_action_type = ($action === 'log_attempt') ? 'login_fail' : 'reset_fail';
        $stmt = $conn->prepare("INSERT INTO security_logs (user_identifier, action_type, ip_address) VALUES (?, ?, ?)");
        $ip = $_SERVER['REMOTE_ADDR'];
        $stmt->bind_param("sss", $identifier, $log_action_type, $ip);
        $stmt->execute();
        $stmt->close();
        return;
    }

    if ($action === 'clear_all') {
        $stmt = $conn->prepare("DELETE FROM security_logs WHERE user_identifier = ? AND (action_type = 'login_fail' OR action_type = 'reset_fail')");
        $stmt->bind_param("s", $identifier);
        $stmt->execute();
        $stmt->close();
        return;
    }
    
    if ($action === 'check_lock') {
        $stmt = $conn->prepare("SELECT COUNT(*) as attempt_count, MAX(created_at) as last_attempt_at FROM security_logs WHERE user_identifier = ? AND (action_type = 'login_fail' OR action_type = 'reset_fail') AND created_at > (NOW() - INTERVAL ? SECOND)");
        $stmt->bind_param("si", $identifier, $lockout_duration);
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
                return true;
            }
        }
        return false;
    }

    if ($action === 'check_reset_request') {
        $cooldown = 60; // 1 minuto
        $stmt = $conn->prepare("SELECT created_at FROM security_logs WHERE user_identifier = ? AND action_type = 'reset_request' ORDER BY created_at DESC LIMIT 1");
        $stmt->bind_param("s", $identifier);
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
                return true;
            }
        }
    
        $stmt_log = $conn->prepare("INSERT INTO security_logs (user_identifier, action_type, ip_address) VALUES (?, 'reset_request', ?)");
        $ip = $_SERVER['REMOTE_ADDR'];
        $stmt_log->bind_param("ss", $identifier, $ip);
        $stmt_log->execute();
        $stmt_log->close();
    
        return false;
    }
}


// --- MANEJO DE SOLICITUDES POST DE AUTENTICACIÓN ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $action_type = $_POST['action_type'] ?? '';

    if (!in_array($action_type, ['register_user', 'login_user', 'logout_user', 'forgot_password', 'verify_reset_code', 'reset_password', 'verify_password', 'update_password', 'delete_account'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
        exit;
    }

    if ($action_type !== 'logout_user' && (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token']))) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
        exit;
    }
    
    switch ($action_type) {
        case 'register_user':
            $username = trim($_POST['username'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';

            if (empty($username) || empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
                exit;
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico no es válido.']);
                exit;
            }
            if (strlen($password) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
                exit;
            }

            $stmt_check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $stmt_check->bind_param("ss", $username, $email);
            $stmt_check->execute();
            $stmt_check->store_result();
            if ($stmt_check->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario o el correo electrónico ya existen.']);
                $stmt_check->close();
                exit;
            }
            $stmt_check->close();

            $uuid = generate_uuid_v4();
            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $stmt_insert = $conn->prepare("INSERT INTO users (uuid, username, email, password_hash) VALUES (?, ?, ?, ?)");
            $stmt_insert->bind_param("ssss", $uuid, $username, $email, $password_hash);

            if ($stmt_insert->execute()) {
                $_SESSION['loggedin'] = true;
                $_SESSION['user_uuid'] = $uuid;
                $_SESSION['username'] = $username;
                $_SESSION['email'] = $email;
                $_SESSION['user_role'] = 'user';

                echo json_encode([
                    'success' => true,
                    'message' => 'Registro exitoso.',
                    'user' => ['uuid' => $uuid, 'username' => $username, 'email' => $email, 'role' => 'user']
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error en el servidor al registrar el usuario.']);
            }
            $stmt_insert->close();
            break;

        case 'login_user':
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
        
            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Correo y contraseña son obligatorios.']);
                exit;
            }
            
            $lock_message = '';
            if (handle_security_event($conn, $email, 'check_lock', $lock_message)) {
                http_response_code(429);
                echo json_encode(['success' => false, 'message' => $lock_message]);
                exit;
            }
    
            $stmt = $conn->prepare("SELECT uuid, username, email, password_hash, role, status FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
        
            if ($user = $result->fetch_assoc()) {
                if (password_verify($password, $user['password_hash'])) {
                    if ($user['status'] !== 'active') {
                        http_response_code(403);
                        $message_key = 'account_' . $user['status'];
                        echo json_encode(['success' => false, 'message' => $message_key]);
                        exit;
                    }
        
                    handle_security_event($conn, $email, 'clear_all');
        
                    $_SESSION['loggedin'] = true;
                    $_SESSION['user_uuid'] = $user['uuid'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['user_role'] = $user['role'];
        
                    echo json_encode([
                        'success' => true,
                        'message' => 'Inicio de sesión exitoso.',
                        'user' => ['uuid' => $user['uuid'], 'username' => $user['username'], 'email' => $user['email'], 'role' => $user['role']]
                    ]);
        
                } else {
                    handle_security_event($conn, $email, 'log_attempt');
                    $lock_message = '';
                    if (handle_security_event($conn, $email, 'check_lock', $lock_message)) {
                        http_response_code(429);
                        echo json_encode(['success' => false, 'message' => $lock_message]);
                    } else {
                        http_response_code(401);
                        echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
                    }
                }
            } else {
                handle_security_event($conn, $email, 'log_attempt');
                $lock_message = '';
                if (handle_security_event($conn, $email, 'check_lock', $lock_message)) {
                    http_response_code(429);
                    echo json_encode(['success' => false, 'message' => $lock_message]);
                } else {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
                }
            }
            $stmt->close();
            break;

        case 'logout_user':
            session_unset();
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente.']);
            break;
            
        case 'forgot_password':
            $email = trim($_POST['email'] ?? '');
        
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Por favor, introduce un correo electrónico válido.']);
                exit;
            }
        
            $cooldown_message = '';
            if (handle_security_event($conn, $email, 'check_reset_request', $cooldown_message)) {
                http_response_code(429);
                echo json_encode(['success' => false, 'message' => $cooldown_message]);
                exit;
            }
        
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND status = 'active'");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $stmt->store_result();
        
            if ($stmt->num_rows > 0) {
                $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
                $stmt_insert = $conn->prepare("INSERT INTO password_resets (email, code) VALUES (?, ?)");
                $stmt_insert->bind_param("ss", $email, $code);
                $stmt_insert->execute();
                $stmt_insert->close();
                
                echo json_encode(['success' => true, 'message' => 'Se ha enviado un código de recuperación a tu correo.']);
        
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'No se encontró una cuenta con ese correo electrónico.']);
            }
            $stmt->close();
            break;

        case 'verify_reset_code':
            $email = trim($_POST['email'] ?? '');
            $code = str_replace('-', '', trim($_POST['code'] ?? ''));
        
            if (empty($email) || empty($code)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El correo y el código son obligatorios.']);
                exit;
            }
            
            $lock_message = '';
            if (handle_security_event($conn, $email, 'check_lock', $lock_message)) {
                http_response_code(429);
                echo json_encode(['success' => false, 'message' => $lock_message]);
                exit;
            }
    
            $stmt_check = $conn->prepare("SELECT id FROM password_resets WHERE email = ? AND code = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)");
            $stmt_check->bind_param("ss", $email, $code);
            $stmt_check->execute();
            $stmt_check->store_result();
        
            if ($stmt_check->num_rows > 0) {
                handle_security_event($conn, $email, 'clear_all');
                echo json_encode(['success' => true, 'message' => 'Código verificado correctamente.']);
            } else {
                handle_security_event($conn, $email, 'log_reset_fail');
                $lock_message = '';
                if (handle_security_event($conn, $email, 'check_lock', $lock_message)) {
                    http_response_code(429);
                    echo json_encode(['success' => false, 'message' => $lock_message]);
                } else {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'El código es inválido o ha expirado.']);
                }
            }
            $stmt_check->close();
            break;

        case 'reset_password':
            $email = trim($_POST['email'] ?? '');
            $code = str_replace('-', '', trim($_POST['code'] ?? ''));
            $new_password = $_POST['new_password'] ?? '';
        
            if (empty($email) || empty($code) || empty($new_password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
                exit;
            }
        
            if (strlen($new_password) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres.']);
                exit;
            }
        
            $stmt_check = $conn->prepare("SELECT id FROM password_resets WHERE email = ? AND code = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)");
            $stmt_check->bind_param("ss", $email, $code);
            $stmt_check->execute();
            $stmt_check->store_result();
        
            if ($stmt_check->num_rows > 0) {
                $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
                $stmt_update = $conn->prepare("UPDATE users SET password_hash = ?, password_last_updated_at = NOW() WHERE email = ?");
                $stmt_update->bind_param("ss", $password_hash, $email);
                
                if ($stmt_update->execute()) {
                    handle_security_event($conn, $email, 'clear_all');
                    
                    $stmt_delete = $conn->prepare("DELETE FROM password_resets WHERE email = ?");
                    $stmt_delete->bind_param("s", $email);
                    $stmt_delete->execute();
                    $stmt_delete->close();
        
                    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña.']);
                }
                $stmt_update->close();
            } else {
                handle_security_event($conn, $email, 'log_reset_fail');
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El código es inválido o ha expirado (15 minutos).']);
            }
            $stmt_check->close();
            break;
            
        case 'verify_password':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }
    
            $password = $_POST['password'] ?? '';
            $user_uuid = $_SESSION['user_uuid'];
    
            $stmt = $conn->prepare("SELECT password_hash FROM users WHERE uuid = ?");
            $stmt->bind_param("s", $user_uuid);
            $stmt->execute();
            $result = $stmt->get_result();
    
            if ($user = $result->fetch_assoc()) {
                if (password_verify($password, $user['password_hash'])) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
            }
            $stmt->close();
            break;

        case 'update_password':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }
    
            $new_password = $_POST['new_password'] ?? '';
            $user_uuid = $_SESSION['user_uuid'];
    
            if (strlen($new_password) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres.']);
                exit;
            }
    
            $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
            $stmt = $conn->prepare("UPDATE users SET password_hash = ?, password_last_updated_at = NOW() WHERE uuid = ?");
            $stmt->bind_param("ss", $password_hash, $user_uuid);
    
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña.']);
            }
            $stmt->close();
            break;
            
        case 'delete_account':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }
        
            $password = $_POST['password'] ?? '';
            $user_uuid = $_SESSION['user_uuid'];
        
            $stmt = $conn->prepare("SELECT password_hash FROM users WHERE uuid = ?");
            $stmt->bind_param("s", $user_uuid);
            $stmt->execute();
            $result = $stmt->get_result();
        
            if ($user = $result->fetch_assoc()) {
                if (password_verify($password, $user['password_hash'])) {
                    $stmt_delete = $conn->prepare("UPDATE users SET status = 'deleted' WHERE uuid = ?");
                    $stmt_delete->bind_param("s", $user_uuid);
                    if ($stmt_delete->execute()) {
                        session_unset();
                        session_destroy();
                        echo json_encode(['success' => true, 'message' => 'Cuenta eliminada.']);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Error al eliminar la cuenta.']);
                    }
                    $stmt_delete->close();
                } else {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'La contraseña es incorrecta.']);
                }
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
            }
            $stmt->close();
            break;
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Request method not supported']);
}

if (isset($conn) && $conn) {
    $conn->close();
}

?>