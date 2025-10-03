<?php
session_start();

function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $request_type = isset($_GET['request_type']) ? $_GET['request_type'] : '';

    if ($request_type === 'get_csrf_token') {
        header('Content-Type: application/json');
        echo json_encode(['csrf_token' => generate_csrf_token()]);
        exit;
    }

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

    if ($request_type === 'section') {
        header('Content-Type: text/html');
        
        $view = isset($_GET['view']) ? $_GET['view'] : 'main';
        $section = isset($_GET['section']) ? $_GET['section'] : 'home';
    
        $protected_sections = [
            'settings-loginSecurity',
            'settings-history',
            'admin-manageUsers',
            'admin-manageContent',
            'admin-editGallery'
        ];
        $section_key = $view . '-' . $section;
    
        if (in_array($section_key, $protected_sections) && (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true)) {
            http_response_code(403);
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
            'help-sendFeedback' => '../includes/sections/help/send-feedback.php',
            'auth-login' => '../includes/sections/auth/login.php',
            'auth-register' => '../includes/sections/auth/register.php',
            'auth-forgotPassword' => '../includes/sections/auth/forgot-password.php',
            'admin-manageUsers' => '../includes/sections/admin/manage-users.php',
            'admin-manageContent' => '../includes/sections/admin/manage-content.php',
            'admin-editGallery' => '../includes/sections/admin/edit-gallery.php'
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

    header('Content-Type: application/json');
    require_once '../config/db.php';

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

        $sort_by = $_GET['sort'] ?? 'relevant';
        $search_term = $_GET['search'] ?? '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;

        $where_clause = "";
        $params = [];
        $types = "";
        if (!empty($search_term)) {
            $where_clause = "WHERE g.name LIKE ?";
            $types .= "s";
            $params[] = "%" . $search_term . "%";
        }
        
        $order_clause = "ORDER BY (gm.total_likes * 0.5 + gm.total_interactions * 0.2) DESC";
        if ($sort_by === 'newest') $order_clause = "ORDER BY gm.last_edited DESC";
        if ($sort_by === 'oldest') $order_clause = "ORDER BY gm.last_edited ASC";
        if ($sort_by === 'alpha-asc') $order_clause = "ORDER BY g.name ASC";
        if ($sort_by === 'alpha-desc') $order_clause = "ORDER BY g.name DESC";

        $sql = "SELECT g.uuid, g.name, g.privacy, gm.last_edited, gpp.profile_picture_url,
                       (SELECT gp.photo_url FROM gallery_photos gp JOIN gallery_photos_metadata gpm ON gp.id = gpm.photo_id WHERE gp.gallery_uuid = g.uuid ORDER BY (gpm.likes * 0.5 + gpm.interactions * 0.2) DESC LIMIT 1) AS background_photo_url
                FROM galleries g
                JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                $where_clause $order_clause LIMIT ? OFFSET ?";

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
        $galleries = $result->fetch_all(MYSQLI_ASSOC);
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
        $gallery_uuid = $_GET['uuid'] ?? '';
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
                WHERE p.gallery_uuid = ? ORDER BY p.display_order ASC, p.id DESC LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $gallery_uuid, $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        $photos = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        echo json_encode($photos);
    } elseif ($request_type === 'trending_users') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $search_term = $_GET['search'] ?? '';
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
                ORDER BY (gm.total_likes * 0.7 + gm.total_interactions * 0.3) DESC LIMIT ?";
        
        $types .= "i";
        $params[] = $limit;

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $users = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        echo json_encode($users);
    } elseif ($request_type === 'trending_photos') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $sql = "SELECT p.id, p.photo_url, p.gallery_uuid, g.name AS gallery_name, gpp.profile_picture_url, pm.likes, pm.interactions
                FROM gallery_photos p
                JOIN gallery_photos_metadata pm ON p.id = pm.photo_id
                JOIN galleries g ON p.gallery_uuid = g.uuid
                LEFT JOIN gallery_profile_pictures gpp ON p.gallery_uuid = gpp.gallery_uuid
                ORDER BY (pm.likes * 0.6 + pm.interactions * 0.4) DESC LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $photos = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        echo json_encode($photos);
    } elseif ($request_type === 'users') {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;
        $search_term = $_GET['search'] ?? '';

        $where_clause = "";
        $params = [];
        $types = "";

        if (!empty($search_term)) {
            $where_clause = "WHERE username LIKE ? OR email LIKE ?";
            $types .= "ss";
            $params[] = "%" . $search_term . "%";
            $params[] = "%" . $search_term . "%";
        }

        $sql = "SELECT uuid, username, email, role, status, created_at FROM users $where_clause ORDER BY created_at DESC LIMIT ? OFFSET ?";
        
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $users = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        echo json_encode($users);

    } elseif ($request_type === 'gallery_for_edit') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['error' => 'Acción no autorizada.']);
            exit;
        }
        $uuid = $_GET['uuid'] ?? '';
        if (empty($uuid)) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el UUID de la galería.']);
            exit;
        }

        $stmt_gallery = $conn->prepare("SELECT g.uuid, g.name, g.privacy, gpp.profile_picture_url FROM galleries g LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid WHERE g.uuid = ?");
        $stmt_gallery->bind_param("s", $uuid);
        $stmt_gallery->execute();
        $gallery_result = $stmt_gallery->get_result();
        $gallery = $gallery_result->fetch_assoc();
        $stmt_gallery->close();

        $stmt_photos = $conn->prepare("SELECT id, photo_url FROM gallery_photos WHERE gallery_uuid = ? ORDER BY display_order ASC, id DESC");
        $stmt_photos->bind_param("s", $uuid);
        $stmt_photos->execute();
        $photos_result = $stmt_photos->get_result();
        $photos = $photos_result->fetch_all(MYSQLI_ASSOC);
        $stmt_photos->close();

        if ($gallery) {
            $gallery['photos'] = $photos;
            echo json_encode($gallery);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Galería no encontrada.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid GET request type']);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    require_once '../config/db.php';

    $action_type = $_POST['action_type'] ?? '';

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
                    if ($_FILES['attachments']['error'][$i] === UPLOAD_ERR_OK) {
                        $file_name = $_FILES['attachments']['name'][$i];
                        $file_tmp = $_FILES['attachments']['tmp_name'][$i];
                        $file_size = $_FILES['attachments']['size'][$i];
    
                        if (getimagesize($file_tmp) === false || !in_array(mime_content_type($file_tmp), $allowed_mime_types)) {
                            $errors[] = "El archivo {$file_name} no es una imagen válida o tiene un formato no permitido.";
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
                        if (move_uploaded_file($file_tmp, $upload_dir . $new_file_name)) {
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
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno del servidor.']);
        }
    } elseif ($action_type === 'increment_interaction') {
        $uuid = $_POST['uuid'] ?? '';
        if (!empty($uuid)) {
            $stmt = $conn->prepare("UPDATE galleries_metadata SET total_interactions = total_interactions + 1 WHERE gallery_uuid = ?");
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
            $stmt = $conn->prepare("UPDATE gallery_photos_metadata SET interactions = interactions + 1 WHERE photo_id = ?");
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
        $gallery_uuid = $_POST['gallery_uuid'] ?? '';
        $is_liked = filter_var($_POST['is_liked'], FILTER_VALIDATE_BOOLEAN);

        if ($photo_id > 0 && !empty($gallery_uuid)) {
            $like_change = $is_liked ? 1 : -1;

            $conn->begin_transaction();
            try {
                $stmt_photo = $conn->prepare("UPDATE gallery_photos_metadata SET likes = likes + ? WHERE photo_id = ?");
                $stmt_photo->bind_param("ii", $like_change, $photo_id);
                $stmt_photo->execute();
                $stmt_photo->close();

                $stmt_gallery = $conn->prepare("UPDATE galleries_metadata SET total_likes = total_likes + ? WHERE gallery_uuid = ?");
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
    } elseif ($action_type === 'change_user_role' || $action_type === 'change_user_status') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para realizar esta acción.']);
            exit;
        }

        $user_uuid = $_POST['uuid'] ?? '';
        
        if (empty($user_uuid)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Falta el UUID del usuario.']);
            exit;
        }
        
        if ($action_type === 'change_user_role') {
            $new_role = $_POST['role'] ?? '';
            $allowed_roles = ['user', 'moderator', 'administrator'];
            if (!in_array($new_role, $allowed_roles)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Rol no válido.']);
                exit;
            }
            $stmt = $conn->prepare("UPDATE users SET role = ? WHERE uuid = ?");
            $stmt->bind_param("ss", $new_role, $user_uuid);
        } else { // change_user_status
            $new_status = $_POST['status'] ?? '';
            $allowed_statuses = ['active', 'suspended', 'deleted'];
            if (!in_array($new_status, $allowed_statuses)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Estado no válido.']);
                exit;
            }
            $stmt = $conn->prepare("UPDATE users SET status = ? WHERE uuid = ?");
            $stmt->bind_param("ss", $new_status, $user_uuid);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el usuario.']);
        }
        $stmt->close();
    } elseif ($action_type === 'verify_admin_password') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        
        require_once '../config/admin_credentials.php';
        $password = $_POST['password'] ?? '';
        
        if (defined('ADMIN_ACTION_PASSWORD') && $password === ADMIN_ACTION_PASSWORD) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'La contraseña es incorrecta.']);
        }
    } elseif ($action_type === 'change_gallery_privacy') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para realizar esta acción.']);
            exit;
        }
    
        $gallery_uuid = $_POST['uuid'] ?? '';
        $is_private = filter_var($_POST['is_private'], FILTER_VALIDATE_BOOLEAN);
    
        if (empty($gallery_uuid)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Falta el UUID de la galería.']);
            exit;
        }
    
        $stmt = $conn->prepare("UPDATE galleries SET privacy = ? WHERE uuid = ?");
        $stmt->bind_param("is", $is_private, $gallery_uuid);
    
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Privacidad de la galería actualizada.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la galería.']);
        }
        $stmt->close();
    } elseif ($action_type === 'update_gallery_details') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $uuid = $_POST['uuid'] ?? '';
        $name = trim($_POST['name'] ?? '');
        $privacy = isset($_POST['privacy']) ? (int)filter_var($_POST['privacy'], FILTER_VALIDATE_BOOLEAN) : 0;

        if (empty($uuid) || empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos.']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE galleries SET name = ?, privacy = ? WHERE uuid = ?");
        $stmt->bind_param("sis", $name, $privacy, $uuid);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Galería actualizada con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la galería.']);
        }
        $stmt->close();

    } elseif ($action_type === 'update_profile_picture') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $uuid = $_POST['uuid'] ?? '';
        if (empty($uuid) || !isset($_FILES['profile_picture'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos.']);
            exit;
        }

        // Lógica de subida de archivos...
        $upload_dir = '../uploads/profile_pictures/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $file = $_FILES['profile_picture'];
        $new_file_name = uniqid('', true) . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
        if (move_uploaded_file($file['tmp_name'], $upload_dir . $new_file_name)) {
            $profile_picture_url = 'uploads/profile_pictures/' . $new_file_name;
            
            // Actualizar en la base de datos
            $stmt = $conn->prepare("INSERT INTO gallery_profile_pictures (gallery_uuid, profile_picture_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE profile_picture_url = ?");
            $stmt->bind_param("sss", $uuid, $profile_picture_url, $profile_picture_url);
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Foto de perfil actualizada.', 'profile_picture_url' => $profile_picture_url]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al guardar en la base de datos.']);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al subir el archivo.']);
        }
        
    } elseif ($action_type === 'upload_gallery_photos') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $uuid = $_POST['uuid'] ?? '';
        if (empty($uuid) || !isset($_FILES['photos'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan datos.']);
            exit;
        }
    
        $upload_dir = '../uploads/gallery_photos/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
    
        $files = $_FILES['photos'];
        $uploaded_photos = [];
        foreach ($files['name'] as $i => $name) {
            $new_file_name = uniqid('', true) . '.' . pathinfo($name, PATHINFO_EXTENSION);
            if (move_uploaded_file($files['tmp_name'][$i], $upload_dir . $new_file_name)) {
                $photo_url = 'uploads/gallery_photos/' . $new_file_name;
                
                $stmt = $conn->prepare("INSERT INTO gallery_photos (gallery_uuid, photo_url) VALUES (?, ?)");
                $stmt->bind_param("ss", $uuid, $photo_url);
                $stmt->execute();
                $photo_id = $conn->insert_id;
                $stmt->close();
                
                // También es necesario insertar en `gallery_photos_metadata`
                $stmt_meta = $conn->prepare("INSERT INTO gallery_photos_metadata (photo_id) VALUES (?)");
                $stmt_meta->bind_param("i", $photo_id);
                $stmt_meta->execute();
                $stmt_meta->close();

                $uploaded_photos[] = ['id' => $photo_id, 'photo_url' => $photo_url];
            }
        }
    
        if (count($uploaded_photos) > 0) {
            echo json_encode(['success' => true, 'message' => 'Fotos subidas correctamente.', 'photos' => $uploaded_photos]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No se pudieron subir las fotos.']);
        }
        
    } elseif ($action_type === 'delete_gallery_photo') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $photo_id = $_POST['photo_id'] ?? 0;
        if (empty($photo_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de foto no válido.']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM gallery_photos WHERE id = ?");
        $stmt->bind_param("i", $photo_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Foto eliminada.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al eliminar la foto.']);
        }
        $stmt->close();
    } elseif ($action_type === 'update_photo_order') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $photo_order = json_decode($_POST['photo_order'] ?? '[]');

        if (empty($photo_order)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No se proporcionó un orden de fotos.']);
            exit;
        }
        
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("UPDATE gallery_photos SET display_order = ? WHERE id = ?");
            foreach ($photo_order as $index => $photo_id) {
                $order = $index + 1;
                $stmt->bind_param("ii", $order, $photo_id);
                $stmt->execute();
            }
            $stmt->close();
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Orden de las fotos actualizado.']);
        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el orden de las fotos.']);
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