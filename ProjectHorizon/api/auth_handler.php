<?php

// Duración de la cookie de sesión en segundos (1 día)
$lifetime = 60 * 60 * 24;

session_set_cookie_params($lifetime);
session_start();

require_once '../config/db.php';

// --- FUNCIONES DE UTILIDAD Y SEGURIDAD ---

function generate_csrf_token()
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validate_csrf_token($token)
{
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function generate_uuid_v4()
{
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff)
    );
}

function handle_security_event($conn, $identifier, $action, &$custom_message = '')
{
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

    if (!in_array($action_type, ['register_user_step1', 'register_user_step2', 'verify_registration_code', 'login_user', 'logout_user', 'forgot_password', 'verify_reset_code', 'reset_password', 'verify_password', 'update_password', 'delete_account', 'update_username', 'update_email', 'update_profile_picture', 'delete_profile_picture'])) {
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
        case 'register_user_step1':
            if (!ALLOW_NEW_REGISTRATIONS) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'El registro de nuevos usuarios está desactivado temporalmente.']);
                exit;
            }

            $username = trim($_POST['username'] ?? '');
            $email = trim($_POST['email'] ?? '');

            $username = preg_replace('/\s+/', '_', $username);
            $username = implode('_', array_map('ucfirst', explode('_', $username)));

            if (empty($username) || empty($email)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
                exit;
            }
            if (strlen($username) > 24) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario no puede tener más de 24 caracteres.']);
                exit;
            }
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario solo puede contener letras, números y guiones bajos (_).']);
                exit;
            }

            $allowed_domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
            $email_domain = substr(strrchr($email, "@"), 1);
            if (!in_array($email_domain, $allowed_domains)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Solo se permiten correos de los dominios permitidos.']);
                exit;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico no es válido.']);
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

            $_SESSION['registration_data'] = [
                'username' => $username,
                'email' => $email
            ];

            echo json_encode(['success' => true, 'message' => 'Paso 1 completado.']);
            break;

        case 'register_user_step2':
            if (!isset($_SESSION['registration_data'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No se encontraron datos de registro. Por favor, vuelve al primer paso.']);
                exit;
            }

            $password = $_POST['password'] ?? '';
            $confirm_password = $_POST['confirm_password'] ?? '';

            if (empty($password) || empty($confirm_password)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Ambos campos de contraseña son obligatorios.']);
                exit;
            }
            if ($password !== $confirm_password) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden.']);
                exit;
            }
            if (strlen($password) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
                exit;
            }

            $email = $_SESSION['registration_data']['email'];
            $_SESSION['registration_data']['password_hash'] = password_hash($password, PASSWORD_DEFAULT);

            $stmt_delete = $conn->prepare("DELETE FROM verification_codes WHERE email = ? AND type = 'registration'");
            $stmt_delete->bind_param("s", $email);
            $stmt_delete->execute();
            $stmt_delete->close();

            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $stmt_insert = $conn->prepare("INSERT INTO verification_codes (email, code, type) VALUES (?, ?, 'registration')");
            $stmt_insert->bind_param("ss", $email, $code);
            $stmt_insert->execute();
            $stmt_insert->close();

            echo json_encode(['success' => true, 'message' => 'Se ha enviado un código de verificación a tu correo.']);
            break;

        case 'verify_registration_code':
            if (!isset($_SESSION['registration_data'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No se encontraron datos de registro.']);
                exit;
            }

            $email = $_SESSION['registration_data']['email'];
            $code = str_replace('-', '', trim($_POST['code'] ?? ''));

            $stmt_check = $conn->prepare("SELECT id FROM verification_codes WHERE email = ? AND code = ? AND type = 'registration' AND created_at > (NOW() - INTERVAL 15 MINUTE)");
            $stmt_check->bind_param("ss", $email, $code);
            $stmt_check->execute();
            $stmt_check->store_result();

            if ($stmt_check->num_rows > 0) {
                $conn->begin_transaction();
                try {
                    $username = $_SESSION['registration_data']['username'];
                    $password_hash = $_SESSION['registration_data']['password_hash'];
                    $uuid = generate_uuid_v4();
                    $ip_address = $_SERVER['REMOTE_ADDR'];
                    $user_agent = $_SERVER['HTTP_USER_AGENT'];

                    $stmt_insert_user = $conn->prepare("INSERT INTO users (uuid, username, email, password_hash, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt_insert_user->bind_param("ssssss", $uuid, $username, $email, $password_hash, $ip_address, $user_agent);
                    $stmt_insert_user->execute();
                    $stmt_insert_user->close();

                    $stmt_insert_meta = $conn->prepare("INSERT INTO user_metadata (user_uuid) VALUES (?)");
                    $stmt_insert_meta->bind_param("s", $uuid);
                    $stmt_insert_meta->execute();
                    $stmt_insert_meta->close();

                    $stmt_insert_prefs = $conn->prepare("INSERT INTO user_preferences (user_uuid) VALUES (?)");
                    $stmt_insert_prefs->bind_param("s", $uuid);
                    $stmt_insert_prefs->execute();
                    $stmt_insert_prefs->close();

                    $stmt_delete = $conn->prepare("DELETE FROM verification_codes WHERE email = ? AND type = 'registration'");
                    $stmt_delete->bind_param("s", $email);
                    $stmt_delete->execute();
                    $stmt_delete->close();

                    $conn->commit();

                    unset($_SESSION['registration_data']);
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
                } catch (mysqli_sql_exception $exception) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error en el servidor al registrar el usuario.']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El código es inválido o ha expirado.']);
            }
            $stmt_check->close();
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

            $stmt = $conn->prepare("SELECT uuid, username, email, password_hash, role, status, control_number FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($user = $result->fetch_assoc()) {
                if (password_verify($password, $user['password_hash'])) {

                    if ($user['status'] !== 'active') {
                        http_response_code(403);

                        $status_key = ucfirst($user['status']);
                        $message_key = 'account' . $status_key;

                        echo json_encode(['success' => false, 'message' => $message_key]);
                        exit;
                    }

                    handle_security_event($conn, $email, 'clear_all');

                    $_SESSION['loggedin'] = true;
                    $_SESSION['user_uuid'] = $user['uuid'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['user_role'] = $user['role'];
                    $_SESSION['user_control_number'] = $user['control_number'];

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
                $stmt_delete = $conn->prepare("DELETE FROM verification_codes WHERE email = ? AND type = 'password_reset'");
                $stmt_delete->bind_param("s", $email);
                $stmt_delete->execute();
                $stmt_delete->close();

                $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                $stmt_insert = $conn->prepare("INSERT INTO verification_codes (email, code, type) VALUES (?, ?, 'password_reset')");
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

            $stmt_check = $conn->prepare("SELECT id FROM verification_codes WHERE email = ? AND code = ? AND type = 'password_reset' AND created_at > (NOW() - INTERVAL 15 MINUTE)");
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

            $stmt_check = $conn->prepare("SELECT id FROM verification_codes WHERE email = ? AND code = ? AND type = 'password_reset' AND created_at > (NOW() - INTERVAL 15 MINUTE)");
            $stmt_check->bind_param("ss", $email, $code);
            $stmt_check->execute();
            $stmt_check->store_result();

            if ($stmt_check->num_rows > 0) {
                $conn->begin_transaction();
                try {
                    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
                    $stmt_update_user = $conn->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
                    $stmt_update_user->bind_param("ss", $password_hash, $email);
                    $stmt_update_user->execute();
                    $stmt_update_user->close();

                    $stmt_update_meta = $conn->prepare("UPDATE user_metadata um JOIN users u ON um.user_uuid = u.uuid SET um.password_last_updated_at = NOW() WHERE u.email = ?");
                    $stmt_update_meta->bind_param("s", $email);
                    $stmt_update_meta->execute();
                    $stmt_update_meta->close();

                    handle_security_event($conn, $email, 'clear_all');

                    $stmt_delete = $conn->prepare("DELETE FROM verification_codes WHERE email = ? AND type = 'password_reset'");
                    $stmt_delete->bind_param("s", $email);
                    $stmt_delete->execute();
                    $stmt_delete->close();

                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
                } catch (mysqli_sql_exception $exception) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña.']);
                }
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
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta.']);
                }
            } else {
                http_response_code(404);
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

            $conn->begin_transaction();
            try {
                $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
                $stmt_update_user = $conn->prepare("UPDATE users SET password_hash = ? WHERE uuid = ?");
                $stmt_update_user->bind_param("ss", $password_hash, $user_uuid);
                $stmt_update_user->execute();
                $stmt_update_user->close();

                $stmt_update_meta = $conn->prepare("UPDATE user_metadata SET password_last_updated_at = NOW() WHERE user_uuid = ?");
                $stmt_update_meta->bind_param("s", $user_uuid);
                $stmt_update_meta->execute();
                $stmt_update_meta->close();

                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
            } catch (mysqli_sql_exception $exception) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña.']);
            }
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

        case 'update_username':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }

            $new_username = trim($_POST['username'] ?? '');
            $user_uuid = $_SESSION['user_uuid'];

            if (empty($new_username)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario no puede estar vacío.']);
                exit;
            }
            if (strlen($new_username) > 24) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario no puede tener más de 24 caracteres.']);
                exit;
            }
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $new_username)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre de usuario solo puede contener letras, números y guiones bajos (_).']);
                exit;
            }

            $stmt_current = $conn->prepare("SELECT username FROM users WHERE uuid = ?");
            $stmt_current->bind_param("s", $user_uuid);
            $stmt_current->execute();
            $result_current = $stmt_current->get_result()->fetch_assoc();
            $stmt_current->close();

            if ($result_current && $result_current['username'] === $new_username) {
                echo json_encode(['success' => true, 'message' => 'El nombre de usuario no ha cambiado.', 'no_change' => true]);
                exit;
            }

            $stmt_check = $conn->prepare("SELECT id FROM users WHERE username = ? AND uuid != ?");
            $stmt_check->bind_param("ss", $new_username, $user_uuid);
            $stmt_check->execute();
            $stmt_check->store_result();
            if ($stmt_check->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'username_taken']);
                $stmt_check->close();
                exit;
            }
            $stmt_check->close();

            $stmt_time_check = $conn->prepare("SELECT username_last_updated_at FROM user_metadata WHERE user_uuid = ?");
            $stmt_time_check->bind_param("s", $user_uuid);
            $stmt_time_check->execute();
            $result_time = $stmt_time_check->get_result()->fetch_assoc();
            $stmt_time_check->close();

            if ($result_time['username_last_updated_at'] !== null) {
                $last_updated = new DateTime($result_time['username_last_updated_at']);
                $now = new DateTime();
                $interval = $last_updated->diff($now);
                if ($interval->days < 30) {
                    http_response_code(429);
                    echo json_encode(['success' => false, 'message' => "Debes esperar 30 días para volver a cambiar tu nombre de usuario."]);
                    exit;
                }
            }

            $conn->begin_transaction();
            try {
                $stmt_update_user = $conn->prepare("UPDATE users SET username = ? WHERE uuid = ?");
                $stmt_update_user->bind_param("ss", $new_username, $user_uuid);
                $stmt_update_user->execute();
                $stmt_update_user->close();

                $stmt_update_meta = $conn->prepare("UPDATE user_metadata SET username_last_updated_at = NOW() WHERE user_uuid = ?");
                $stmt_update_meta->bind_param("s", $user_uuid);
                $stmt_update_meta->execute();
                $stmt_update_meta->close();

                $conn->commit();
                $_SESSION['username'] = $new_username;
                echo json_encode(['success' => true, 'message' => 'Nombre de usuario actualizado.', 'new_username' => $new_username]);
            } catch (mysqli_sql_exception $exception) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar el nombre de usuario.']);
            }
            break;

        case 'update_email':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }

            $new_email = trim($_POST['email'] ?? '');
            $user_uuid = $_SESSION['user_uuid'];

            if (empty($new_email) || !filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico no es válido.']);
                exit;
            }
            $allowed_domains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
            $email_domain = substr(strrchr($new_email, "@"), 1);
            if (!in_array($email_domain, $allowed_domains)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Solo se permiten correos de los dominios permitidos.']);
                exit;
            }

            $stmt_current = $conn->prepare("SELECT email FROM users WHERE uuid = ?");
            $stmt_current->bind_param("s", $user_uuid);
            $stmt_current->execute();
            $result_current = $stmt_current->get_result()->fetch_assoc();
            $stmt_current->close();

            if ($result_current && $result_current['email'] === $new_email) {
                echo json_encode(['success' => true, 'message' => 'El correo electrónico no ha cambiado.', 'no_change' => true]);
                exit;
            }

            $stmt_check = $conn->prepare("SELECT id FROM users WHERE email = ? AND uuid != ?");
            $stmt_check->bind_param("ss", $new_email, $user_uuid);
            $stmt_check->execute();
            $stmt_check->store_result();
            if ($stmt_check->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'email_taken']);
                $stmt_check->close();
                exit;
            }
            $stmt_check->close();

            $stmt_time_check = $conn->prepare("SELECT email_last_updated_at FROM user_metadata WHERE user_uuid = ?");
            $stmt_time_check->bind_param("s", $user_uuid);
            $stmt_time_check->execute();
            $result_time = $stmt_time_check->get_result()->fetch_assoc();
            $stmt_time_check->close();

            if ($result_time['email_last_updated_at'] !== null) {
                $last_updated = new DateTime($result_time['email_last_updated_at']);
                $now = new DateTime();
                $interval = $last_updated->diff($now);
                if ($interval->days < 30) {
                    http_response_code(429);
                    echo json_encode(['success' => false, 'message' => "Debes esperar 30 días para volver a cambiar tu correo electrónico."]);
                    exit;
                }
            }

            $conn->begin_transaction();
            try {
                $stmt_update_user = $conn->prepare("UPDATE users SET email = ? WHERE uuid = ?");
                $stmt_update_user->bind_param("ss", $new_email, $user_uuid);
                $stmt_update_user->execute();
                $stmt_update_user->close();

                $stmt_update_meta = $conn->prepare("UPDATE user_metadata SET email_last_updated_at = NOW() WHERE user_uuid = ?");
                $stmt_update_meta->bind_param("s", $user_uuid);
                $stmt_update_meta->execute();
                $stmt_update_meta->close();

                $conn->commit();
                $_SESSION['email'] = $new_email;
                echo json_encode(['success' => true, 'message' => 'Correo electrónico actualizado.', 'new_email' => $new_email]);
            } catch (mysqli_sql_exception $exception) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al actualizar el correo electrónico.']);
            }
            break;

        case 'update_profile_picture':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }

            if (isset($_FILES['profile_picture'])) {
                $file = $_FILES['profile_picture'];
                $user_uuid = $_SESSION['user_uuid'];

                $allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif'];
                $max_file_size = 2 * 1024 * 1024;

                if (!in_array($file['type'], $allowed_mime_types)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Formato de archivo no válido. Solo se permiten JPG, PNG y GIF.']);
                    exit;
                }
                if ($file['size'] > $max_file_size) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'El archivo es demasiado grande. El tamaño máximo es 2MB.']);
                    exit;
                }

                $stmt_get_old = $conn->prepare("SELECT profile_picture_url FROM users WHERE uuid = ?");
                $stmt_get_old->bind_param("s", $user_uuid);
                $stmt_get_old->execute();
                $result_old = $stmt_get_old->get_result()->fetch_assoc();
                if ($result_old && !empty($result_old['profile_picture_url'])) {
                    $old_file_path = '../' . $result_old['profile_picture_url'];
                    if (file_exists($old_file_path)) {
                        unlink($old_file_path);
                    }
                }
                $stmt_get_old->close();

                $upload_dir = '../uploads/user_profile_pictures/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
                $new_file_name = $user_uuid . '_' . time() . '.' . $extension;
                $destination = $upload_dir . $new_file_name;

                if (move_uploaded_file($file['tmp_name'], $destination)) {
                    $db_path = 'uploads/user_profile_pictures/' . $new_file_name;
                    $stmt_update = $conn->prepare("UPDATE users SET profile_picture_url = ? WHERE uuid = ?");
                    $stmt_update->bind_param("ss", $db_path, $user_uuid);
                    if ($stmt_update->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Foto de perfil actualizada.', 'url' => $db_path]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Error al actualizar la base de datos.']);
                    }
                    $stmt_update->close();
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Error al guardar la imagen.']);
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No se ha subido ninguna imagen.']);
            }
            break;

        case 'delete_profile_picture':
            if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'No autorizado.']);
                exit;
            }

            $user_uuid = $_SESSION['user_uuid'];

            $stmt_get = $conn->prepare("SELECT profile_picture_url FROM users WHERE uuid = ?");
            $stmt_get->bind_param("s", $user_uuid);
            $stmt_get->execute();
            $result = $stmt_get->get_result()->fetch_assoc();

            if ($result && !empty($result['profile_picture_url'])) {
                $file_path = '../' . $result['profile_picture_url'];
                if (file_exists($file_path)) {
                    unlink($file_path);
                }
            }
            $stmt_get->close();

            $stmt_update = $conn->prepare("UPDATE users SET profile_picture_url = NULL WHERE uuid = ?");
            $stmt_update->bind_param("s", $user_uuid);
            if ($stmt_update->execute()) {
                echo json_encode(['success' => true, 'message' => 'Foto de perfil eliminada.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar la foto de perfil.']);
            }
            $stmt_update->close();
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Request method not supported']);
}

if (isset($conn) && $conn) {
    $conn->close();
}
