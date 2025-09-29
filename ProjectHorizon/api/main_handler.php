<?php
// Iniciar la sesión al principio de cualquier script que necesite acceso a variables de sesión
session_start();

// --- FUNCIÓN PARA GENERAR Y VALIDAR TOKEN CSRF ---
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validate_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// --- NUEVA FUNCIÓN DE SEGURIDAD ---
function handle_security_event($conn, $identifier, $action, &$custom_message = '') {
    $ip_address = $_SERVER['REMOTE_ADDR'];
    $lockout_duration = 300; // 5 minutos en segundos
    $max_attempts = 5;

    if ($action === 'log_attempt' || $action === 'log_reset_fail') {
        $log_action_type = ($action === 'log_attempt') ? 'login_fail' : 'reset_fail';
        
        $stmt = $conn->prepare("INSERT INTO security_logs (user_identifier, action_type, ip_address, attempt_count) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE attempt_count = attempt_count + 1, ip_address = VALUES(ip_address)");
        $stmt->bind_param("sss", $identifier, $log_action_type, $ip_address);
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
        $stmt = $conn->prepare("SELECT attempt_count, last_attempt_at FROM security_logs WHERE user_identifier = ? AND (action_type = 'login_fail' OR action_type = 'reset_fail')");
        $stmt->bind_param("s", $identifier);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($result && $result['attempt_count'] >= $max_attempts) {
            $last_attempt_timestamp = strtotime($result['last_attempt_at']);
            $time_since_last_attempt = time() - $last_attempt_timestamp;

            if ($time_since_last_attempt < $lockout_duration) {
                $minutes_left = ceil(($lockout_duration - $time_since_last_attempt) / 60);
                $custom_message = "Has excedido el número de intentos. Por favor, inténtalo de nuevo en {$minutes_left} minutos.";
                return true; // Bloqueado
            } else {
                // Si ya pasó el tiempo de bloqueo, limpiamos los registros para que pueda volver a intentar.
                handle_security_event($conn, $identifier, 'clear_all');
            }
        }
        return false; // No bloqueado
    }
    
    // ... (el resto de la función para 'check_reset_request' permanece igual)
}
// --- FUNCIÓN PARA GENERAR UUID v4 ---
function generate_uuid_v4() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// --- MANEJO DE SOLICITUDES GET ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $request_type = isset($_GET['request_type']) ? $_GET['request_type'] : '';

    // --- ENDPOINT PARA OBTENER EL TOKEN CSRF ---
    if ($request_type === 'get_csrf_token') {
        header('Content-Type: application/json');
        echo json_encode(['csrf_token' => generate_csrf_token()]);
        exit;
    }

// --- ENDPOINT PARA VERIFICAR EL ESTADO DE LA SESIÓN ---
    if ($request_type === 'check_session') {
        header('Content-Type: application/json');
        if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true && isset($_SESSION['user_uuid'])) {
            require_once '../config/db.php';
            $stmt = $conn->prepare("SELECT role, password_last_updated_at, status, created_at FROM users WHERE uuid = ?");
            $stmt->bind_param("s", $_SESSION['user_uuid']);
            $stmt->execute();
            $result = $stmt->get_result();
            $password_last_updated_at = null;
            $created_at = null;
            if ($user = $result->fetch_assoc()) {
                if ($user['status'] !== 'active') {
                    session_unset();
                    session_destroy();
                    echo json_encode(['loggedin' => false, 'status' => $user['status']]);
                    $stmt->close();
                    $conn->close();
                    exit;
                }
                
                $_SESSION['user_role'] = $user['role'];
                $password_last_updated_at = $user['password_last_updated_at'];
                $created_at = $user['created_at'];
            }
            $stmt->close();
            $conn->close();

            echo json_encode([
                'loggedin' => true,
                'user' => [
                    'uuid' => $_SESSION['user_uuid'],
                    'username' => $_SESSION['username'],
                    'email' => $_SESSION['email'],
                    'role' => $_SESSION['user_role'],
                    'password_last_updated_at' => $password_last_updated_at,
                    'created_at' => $created_at
                ]
            ]);
        } else {
            echo json_encode(['loggedin' => false]);
        }
        exit;
    }

    // --- ENDPOINT PARA CARGA DINÁMICA DE SECCIONES HTML ---
if ($request_type === 'section') {
    header('Content-Type: text/html');
    
    $view = isset($_GET['view']) ? $_GET['view'] : 'main';
    $section = isset($_GET['section']) ? $_GET['section'] : 'home';

    // ✅ **NUEVO: Array de secciones que requieren inicio de sesión**
    $protected_sections = [
        'settings-loginSecurity',
        'settings-history',
        'admin-manageUsers',
        'admin-manageContent'
    ];
    $section_key = $view . '-' . $section;

    // ✅ **NUEVO: Verificación de sesión para secciones protegidas**
    if (in_array($section_key, $protected_sections) && (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true)) {
        http_response_code(403); // Forbidden
        // Opcionalmente, podrías mostrar una página de error específica
        include '../includes/sections/main/404.php';
        exit;
    }

$allowed_sections = [
        'main-home' => '../includes/sections/main/home.php',
        'main-favorites' => '../includes/sections/main/favorites.php',
        'main-trends' => '../includes/sections/main/trends.php',
        'main-404' => '../includes/sections/main/404.php',
        'main-galleryPhotos' => '../includes/sections/main/user-photos.php',
        'main-photoView' => '../includes/sections/main/photo-view.php',
        'main-accessCodePrompt' => '../includes/sections/main/access-code-prompt.php',
        'main-userSpecificFavorites' => '../includes/sections/main/user-specific-favorites.php',
        'main-adView' => '../includes/sections/main/ad-view.php',
        'main-privateGalleryProxy' => '../includes/sections/main/private-gallery-proxy.php',
        'settings-accessibility' => '../includes/sections/settings/accessibility.php',
        'settings-loginSecurity' => '../includes/sections/settings/loginSecurity.php',
        'settings-historyPrivacy' => '../includes/sections/settings/historyPrivacy.php',
        'settings-history' => '../includes/sections/settings/history.php',
        'settings-historySearches' => '../includes/sections/settings/historySearches.php',
        'help-privacyPolicy' => '../includes/sections/help/privacy-policy.php',
        'help-termsConditions' => '../includes/sections/help/terms-conditions.php',
        'help-cookiePolicy' => '../includes/sections/help/cookie-policy.php',
                'auth-resetPassword' => '../includes/sections/auth/reset-password.php', // <-- AÑADIR ESTA LÍNEA

        'help-sendFeedback' => '../includes/sections/help/send-feedback.php',
        'auth-login' => '../includes/sections/auth/login.php',
        'auth-register' => '../includes/sections/auth/register.php',
        'auth-forgotPassword' => '../includes/sections/auth/forgot-password.php', // <-- AÑADIR ESTA LÍNEA
        'admin-manageUsers' => '../includes/sections/admin/manage-users.php',
        'admin-manageContent' => '../includes/sections/admin/manage-content.php'
    ];


    if (array_key_exists($section_key, $allowed_sections)) {
        $file_path = $allowed_sections[$section_key];
        
        $CURRENT_VIEW = $view;
        $CURRENT_SECTION = $section;

        ob_start();
        include $file_path;
        $html_content = ob_get_clean();
        
        echo $html_content;
    } else {
        http_response_code(404);
        include '../includes/sections/main/404.php';
    }
    exit;
}

    // --- LÓGICA PARA DATOS JSON ---
    header('Content-Type: application/json');
    require_once '../config/db.php';
    // (Todo el código GET para 'galleries', 'photos', etc., permanece igual...)
    if ($request_type === 'galleries') {
        if (isset($_GET['uuid'])) {
            $uuid = $_GET['uuid'];
            $sql = "SELECT g.uuid, g.name, g.privacy, gm.last_edited, gpp.profile_picture_url
                    FROM galleries g
                    JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                    LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                    WHERE g.uuid = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $uuid);
            $stmt->execute();
            $result = $stmt->get_result();
            $gallery = $result->fetch_assoc();
            echo json_encode($gallery);
            $stmt->close();
            $conn->close();
            exit;
        }
        $sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'relevant';
        $search_term = isset($_GET['search']) ? $_GET['search'] : '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;
        $order_clause = "";
        $where_clause = "";
        $params = [];
        $types = "";
        if (!empty($search_term)) {
            $where_clause = "WHERE g.name LIKE ?";
            $types .= "s";
            $params[] = "%" . $search_term . "%";
        }
        switch ($sort_by) {
            case 'newest': $order_clause = "ORDER BY gm.last_edited DESC"; break;
            case 'oldest': $order_clause = "ORDER BY gm.last_edited ASC"; break;
            case 'alpha-asc': $order_clause = "ORDER BY g.name ASC"; break;
            case 'alpha-desc': $order_clause = "ORDER BY g.name DESC"; break;
            default: $order_clause = "ORDER BY (gm.total_likes * 0.5 + gm.total_interactions * 0.2) DESC"; break;
        }
        $sql = "SELECT g.uuid, g.name, g.privacy, gm.last_edited, gpp.profile_picture_url,
                       (
                           SELECT gp.photo_url
                           FROM gallery_photos gp
                           JOIN gallery_photos_metadata gpm ON gp.id = gpm.photo_id
                           WHERE gp.gallery_uuid = g.uuid
                           ORDER BY (gpm.likes * 0.5 + gpm.interactions * 0.2) DESC
                           LIMIT 1
                       ) AS background_photo_url
                FROM galleries g
                JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                $where_clause
                $order_clause
                LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($sql);
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;
        if (!empty($search_term)) {
            $stmt->bind_param($types, ...$params);
        } else {
            $stmt->bind_param("ii", $limit, $offset);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $galleries = array();
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $galleries[] = $row;
            }
        }
        $stmt->close();
        echo json_encode($galleries);

    } elseif ($request_type === 'photos') {
        if (isset($_GET['photo_id'])) {
            $photo_id = $_GET['photo_id'];
            $sql = "SELECT id, gallery_uuid, photo_url FROM gallery_photos WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $photo_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $photo = $result->fetch_assoc();
            echo json_encode($photo);
            $stmt->close();
            $conn->close();
            exit;
        }
        $gallery_uuid = isset($_GET['uuid']) ? $_GET['uuid'] : '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;
        if (empty($gallery_uuid)) {
            http_response_code(400);
            echo json_encode(['error' => 'Gallery UUID is required']);
            exit;
        }

        $sql = "SELECT p.id, p.photo_url, p.gallery_uuid, g.name AS gallery_name, gpp.profile_picture_url
                FROM gallery_photos p
                JOIN galleries g ON p.gallery_uuid = g.uuid
                LEFT JOIN gallery_profile_pictures gpp ON p.gallery_uuid = gpp.gallery_uuid
                WHERE p.gallery_uuid = ?
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?";
                
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $gallery_uuid, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        $photos = array();
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $photos[] = $row;
            }
        }
        $stmt->close();
        echo json_encode($photos);

    } elseif ($request_type === 'trending_users') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search_term = isset($_GET['search']) ? $_GET['search'] : '';
        $where_clause = "";
        $params = [];
        $types = "";

        if (!empty($search_term)) {
            $where_clause = "WHERE g.name LIKE ?";
            $types .= "s";
            $params[] = "%" . $search_term . "%";
        }
        
        $sql = "SELECT g.uuid, g.name, g.privacy, gpp.profile_picture_url,
                       (SELECT gp.photo_url FROM gallery_photos gp WHERE gp.gallery_uuid = g.uuid ORDER BY RAND() LIMIT 1) AS background_photo_url
                FROM galleries g
                JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                $where_clause
                ORDER BY (gm.total_likes * 0.7 + gm.total_interactions * 0.3) DESC
                LIMIT ?";
        
        $types .= "i";
        $params[] = $limit;

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $users = array();
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        $stmt->close();
        echo json_encode($users);

    } elseif ($request_type === 'trending_photos') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $sql = "SELECT p.id, p.photo_url, p.gallery_uuid, g.name AS gallery_name, gpp.profile_picture_url, pm.likes, pm.interactions
                FROM gallery_photos p
                JOIN gallery_photos_metadata pm ON p.id = pm.photo_id
                JOIN galleries g ON p.gallery_uuid = g.uuid
                LEFT JOIN gallery_profile_pictures gpp ON p.gallery_uuid = gpp.gallery_uuid
                ORDER BY (pm.likes * 0.6 + pm.interactions * 0.4) DESC
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $photos = array();
        while($row = $result->fetch_assoc()) {
            $photos[] = $row;
        }
        $stmt->close();
        echo json_encode($photos);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid GET request type']);
    }

// --- MANEJO DE SOLICITUDES POST ---
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    require_once '../config/db.php';

    $action_type = isset($_POST['action_type']) ? $_POST['action_type'] : '';
    
    if ($action_type === 'register_user') {
        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
            exit;
        }

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
        exit;
    }

   if ($action_type === 'login_user') {
        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
            exit;
        }
    
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
    
        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Correo y contraseña son obligatorios.']);
            exit;
        }
    
        // Comprobar si el usuario está bloqueado
        $lock_message = '';
        if (handle_security_event($conn, $email, 'check_lock', $lock_message)) {
            http_response_code(429);
            echo json_encode(['success' => false, 'message' => $lock_message]);
            exit;
        }
    
        $stmt = $conn->prepare("SELECT uuid, username, email, password_hash, role, status FROM users WHERE email = ?");
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error del servidor: No se pudo preparar la consulta.']);
            error_log("MySQLi prepare() failed: " . $conn->error);
            exit;
        }
    
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
    
                // Limpiar registros de seguridad en caso de éxito
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
                // Registrar intento fallido
                handle_security_event($conn, $email, 'log_attempt');
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
            }
        } else {
            // Registrar intento fallido para un correo que no existe
            handle_security_event($conn, $email, 'log_attempt');
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
        }
        $stmt->close();
        exit;
    }
    
    if ($action_type === 'logout_user') {
        session_unset();
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Sesión cerrada correctamente.']);
        exit;
    }
    
    if ($action_type === 'submit_feedback') {
        $issue_type = filter_input(INPUT_POST, 'issue_type', FILTER_SANITIZE_STRING);
        $other_title = filter_input(INPUT_POST, 'other_title', FILTER_SANITIZE_STRING);
        $description = filter_input(INPUT_POST, 'description', FILTER_SANITIZE_STRING);
    
        $errors = [];
    
        if (empty($issue_type) || !in_array($issue_type, ['suggestion', 'problem', 'other'])) {
            $errors[] = 'El tipo de comentario no es válido.';
        }
    
        if ($issue_type === 'other' && empty($other_title)) {
            $errors[] = 'El título es obligatorio para el tipo "Otro".';
        }
    
        if (empty($description)) {
            $errors[] = 'La descripción no puede estar vacía.';
        }
    
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
            exit;
        }
    
        $allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif'];
        $max_file_size = 4 * 1024 * 1024;
        $max_total_size = 12 * 1024 * 1024;
        $upload_dir = '../uploads/feedback_attachments/';
    
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
    
        $uploaded_files_urls = [];
        $total_size = 0;
    
        if (isset($_FILES['attachments'])) {
            if (count($_FILES['attachments']['name']) > 3) {
                $errors[] = 'No se pueden subir más de 3 archivos.';
            } else {
                for ($i = 0; $i < count($_FILES['attachments']['name']); $i++) {
                    $file_name = $_FILES['attachments']['name'][$i];
                    $file_tmp = $_FILES['attachments']['tmp_name'][$i];
                    $file_size = $_FILES['attachments']['size'][$i];
                    $file_error = $_FILES['attachments']['error'][$i];
    
                    if ($file_error === UPLOAD_ERR_OK) {
                        if (getimagesize($file_tmp) === false) {
                            $errors[] = "El archivo {$file_name} no es una imagen válida.";
                            continue;
                        }

                        $file_mime_type = mime_content_type($file_tmp);
                        if (!in_array($file_mime_type, $allowed_mime_types)) {
                            $errors[] = "El archivo {$file_name} tiene un formato no permitido.";
                            continue;
                        }

                        if ($file_size > $max_file_size) {
                            $errors[] = "El archivo {$file_name} supera el tamaño máximo de 4MB.";
                            continue;
                        }
    
                        $total_size += $file_size;
                        if ($total_size > $max_total_size) {
                            $errors[] = 'El tamaño total de los archivos supera los 12MB.';
                            break;
                        }
    
                        $new_file_name = uniqid('', true) . '.' . pathinfo($file_name, PATHINFO_EXTENSION);
                        $destination = $upload_dir . $new_file_name;
    
                        if (move_uploaded_file($file_tmp, $destination)) {
                            $uploaded_files_urls[] = 'uploads/feedback_attachments/' . $new_file_name;
                        } else {
                            $errors[] = "Error al mover el archivo {$file_name}.";
                        }
                    }
                }
            }
        }
    
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
            exit;
        }
    
        $feedback_uuid = generate_uuid_v4();
        $title_to_insert = ($issue_type === 'other') ? $other_title : null;
    
        $conn->begin_transaction();
        try {
            $stmt_feedback = $conn->prepare("INSERT INTO feedback (uuid, issue_type, title, description) VALUES (?, ?, ?, ?)");
            $stmt_feedback->bind_param("ssss", $feedback_uuid, $issue_type, $title_to_insert, $description);
            $stmt_feedback->execute();
            $stmt_feedback->close();
    
            if (!empty($uploaded_files_urls)) {
                $stmt_attachments = $conn->prepare("INSERT INTO feedback_attachments (feedback_uuid, attachment_url) VALUES (?, ?)");
                foreach ($uploaded_files_urls as $url) {
                    $stmt_attachments->bind_param("ss", $feedback_uuid, $url);
                    $stmt_attachments->execute();
                }
                $stmt_attachments->close();
            }
    
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Comentario enviado con éxito.']);
        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            error_log("Error en la base de datos: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor.']);
        }
        exit;
    }
    if ($action_type === 'verify_password') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado.']);
            exit;
        }

        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
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
        exit;
    }

   if ($action_type === 'update_password') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado.']);
            exit;
        }

        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
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
        exit;
    }
    
    if ($action_type === 'delete_account') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado.']);
            exit;
        }
    
        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
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
        exit;
    }

    if ($action_type === 'forgot_password') {
        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
            exit;
        }
    
        $email = trim($_POST['email'] ?? '');
    
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Por favor, introduce un correo electrónico válido.']);
            exit;
        }
    
        // Comprobar si hay demasiadas solicitudes de reseteo
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
    
            // Aquí iría la lógica para enviar el correo con el código.
            // Por ahora, solo confirmamos que se ha "enviado".
            
            echo json_encode(['success' => true, 'message' => 'Se ha enviado un código de recuperación a tu correo.']);
    
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No se encontró una cuenta con ese correo electrónico.']);
        }
        $stmt->close();
        exit;
    }
if ($action_type === 'reset_password') {
        if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
            exit;
        }
    
        $email = trim($_POST['email'] ?? '');
        $code = trim($_POST['code'] ?? '');
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
    
        // Comprobar si el usuario está bloqueado por intentos de reseteo fallidos
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
            $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt_update = $conn->prepare("UPDATE users SET password_hash = ?, password_last_updated_at = NOW() WHERE email = ?");
            $stmt_update->bind_param("ss", $password_hash, $email);
            
            if ($stmt_update->execute()) {
                // Limpiar registros de seguridad en caso de éxito
                handle_security_event($conn, $email, 'clear_all');
                
                // Borrar el código de la tabla de reseteos
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
            // Registrar intento de reseteo fallido
            handle_security_event($conn, $email, 'log_reset_fail');
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El código es inválido o ha expirado (15 minutos).']);
        }
        $stmt_check->close();
        exit;
    }
    if ($action_type === 'increment_interaction') {
        $uuid = isset($_POST['uuid']) ? $_POST['uuid'] : '';
        if (!empty($uuid)) {
            $sql = "UPDATE galleries_metadata SET total_interactions = total_interactions + 1 WHERE gallery_uuid = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $uuid);
            $stmt->execute();
            $stmt->close();
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Falta el UUID de la galería.']);
        }
    } elseif ($action_type === 'increment_photo_interaction') {
        $photo_id = isset($_POST['photo_id']) ? (int)$_POST['photo_id'] : 0;
        if ($photo_id > 0) {
            $sql = "UPDATE gallery_photos_metadata SET interactions = interactions + 1 WHERE photo_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $photo_id);
            $stmt->execute();
            $stmt->close();
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Falta el ID de la foto.']);
        }
    } elseif ($action_type === 'toggle_like') {
        $photo_id = isset($_POST['photo_id']) ? (int)$_POST['photo_id'] : 0;
        $gallery_uuid = isset($_POST['gallery_uuid']) ? $_POST['gallery_uuid'] : '';
        $is_liked = isset($_POST['is_liked']) ? filter_var($_POST['is_liked'], FILTER_VALIDATE_BOOLEAN) : false;

        if ($photo_id > 0 && !empty($gallery_uuid)) {
            $like_change = $is_liked ? 1 : -1;

            $conn->begin_transaction();
            try {
                $sql_photo = "UPDATE gallery_photos_metadata SET likes = likes + ? WHERE photo_id = ?";
                $stmt_photo = $conn->prepare($sql_photo);
                $stmt_photo->bind_param("ii", $like_change, $photo_id);
                $stmt_photo->execute();
                $stmt_photo->close();

                $sql_gallery = "UPDATE galleries_metadata SET total_likes = total_likes + ? WHERE gallery_uuid = ?";
                $stmt_gallery = $conn->prepare($sql_gallery);
                $stmt_gallery->bind_param("is", $like_change, $gallery_uuid);
                $stmt_gallery->execute();
                $stmt_gallery->close();

                $conn->commit();
                echo json_encode(['success' => true]);
            } catch (mysqli_sql_exception $exception) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error en la base de datos.']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos de la foto o galería.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid POST action type']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Request method not supported']);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>