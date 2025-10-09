<?php
session_start();

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
            $stmt = $conn->prepare("
                SELECT u.role, u.status, u.created_at, um.password_last_updated_at, um.username_last_updated_at, um.email_last_updated_at
                FROM users u
                LEFT JOIN user_metadata um ON u.uuid = um.user_uuid
                WHERE u.uuid = ?
            ");
            $stmt->bind_param("s", $_SESSION['user_uuid']);
            $stmt->execute();
            $result = $stmt->get_result();
            
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

                echo json_encode([
                    'loggedin' => true,
                    'user' => [
                        'uuid' => $_SESSION['user_uuid'],
                        'username' => $_SESSION['username'],
                        'email' => $_SESSION['email'],
                        'role' => $_SESSION['user_role'],
                        'created_at' => $user['created_at'],
                        'password_last_updated_at' => $user['password_last_updated_at'],
                        'username_last_updated_at' => $user['username_last_updated_at'],
                        'email_last_updated_at' => $user['email_last_updated_at']
                    ]
                ]);
            } else {
                // Si no se encuentra el usuario, destruye la sesión
                session_unset();
                session_destroy();
                echo json_encode(['loggedin' => false]);
            }
            $stmt->close();
            $conn->close();
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
            'settings-yourProfile',
            'settings-loginSecurity',
            'settings-history',
            'main-favorites',
            'admin-dashboard',
            'admin-manageUsers',
            'admin-manageContent',
            'admin-editGallery',
            'admin-createGallery',
            'settings-historyPrivacy', 
            'settings-history',
            'admin-manageComments',
            'admin-manageFeedback'
        ];
        $section_key = $view . '-' . $section;
    
        if (in_array($section_key, $protected_sections) && (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true)) {
            http_response_code(403);
            // Redirigir a 404 para no revelar la existencia de la sección
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
            'main-photoComments' => '../includes/sections/main/photo-comments.php',
            'settings-yourProfile' => '../includes/sections/settings/your-profile.php',
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
            'admin-dashboard' => '../includes/sections/admin/dashboard.php',
            'admin-manageUsers' => '../includes/sections/admin/manage-users.php',
            'admin-manageContent' => '../includes/sections/admin/manage-content.php',
            'admin-editGallery' => '../includes/sections/admin/edit-gallery.php',
            'admin-createGallery' => '../includes/sections/admin/create-gallery.php',
            'admin-manageComments' => '../includes/sections/admin/manage-comments.php',
            'admin-manageFeedback' => '../includes/sections/admin/manage-feedback.php'
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

    if ($request_type === 'dashboard_stats') {
        if (!isset($_SESSION['loggedin']) || !in_array($_SESSION['user_role'], ['administrator'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Acción no autorizada.']);
            exit;
        }
    
        $stats = [];
    
        // Estadísticas clave
        $stats['total_users'] = $conn->query("SELECT COUNT(*) as count FROM users WHERE status = 'active'")->fetch_assoc()['count'];
        $stats['new_users_last_30_days'] = $conn->query("SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL 30 DAY")->fetch_assoc()['count'];
        $stats['total_galleries'] = $conn->query("SELECT COUNT(*) as count FROM galleries")->fetch_assoc()['count'];
        $stats['total_photos'] = $conn->query("SELECT COUNT(*) as count FROM gallery_photos")->fetch_assoc()['count'];
        $stats['pending_comments'] = $conn->query("SELECT COUNT(*) as count FROM photo_comments WHERE status = 'review'")->fetch_assoc()['count'];
    
        // Gráficos de actividad (últimos 30 días)
        $user_growth = $conn->query("SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL 30 DAY GROUP BY DATE(created_at) ORDER BY date ASC")->fetch_all(MYSQLI_ASSOC);
        
        $favorites_activity = $conn->query("SELECT DATE(added_at) as date, COUNT(*) as count FROM user_favorites WHERE added_at >= NOW() - INTERVAL 30 DAY GROUP BY DATE(added_at) ORDER BY date ASC")->fetch_all(MYSQLI_ASSOC);
        $comments_activity = $conn->query("SELECT DATE(created_at) as date, COUNT(*) as count FROM photo_comments WHERE created_at >= NOW() - INTERVAL 30 DAY GROUP BY DATE(created_at) ORDER BY date ASC")->fetch_all(MYSQLI_ASSOC);

        $stats['charts']['user_growth'] = $user_growth;
        $stats['charts']['content_activity'] = [
            'favorites' => $favorites_activity,
            'comments' => $comments_activity
        ];
    
        // Contenido popular (Top 10)
        $stats['top_galleries'] = $conn->query("SELECT g.name, gm.total_interactions FROM galleries g JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid ORDER BY gm.total_interactions DESC LIMIT 10")->fetch_all(MYSQLI_ASSOC);
        $stats['top_photos'] = $conn->query("SELECT p.id, p.photo_url, g.name as gallery_name, pm.interactions FROM gallery_photos p JOIN gallery_photos_metadata pm ON p.id = pm.photo_id JOIN galleries g ON p.gallery_uuid = g.uuid ORDER BY pm.interactions DESC LIMIT 10")->fetch_all(MYSQLI_ASSOC);
    
        echo json_encode($stats);
        exit;
    }

    if ($request_type === 'admin_feedback') {
        if (!isset($_SESSION['loggedin']) || !in_array($_SESSION['user_role'], ['administrator'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Acción no autorizada.']);
            exit;
        }
    
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;
    
        $stmt_feedback = $conn->prepare("
            SELECT f.uuid, f.issue_type, f.title, f.description, f.created_at
            FROM feedback f
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt_feedback->bind_param("ii", $limit, $offset);
        $stmt_feedback->execute();
        $feedback_result = $stmt_feedback->get_result();
        $feedback_items = $feedback_result->fetch_all(MYSQLI_ASSOC);
        $stmt_feedback->close();
    
        $feedback_uuids = array_column($feedback_items, 'uuid');
        if (!empty($feedback_uuids)) {
            $in_clause = implode(',', array_fill(0, count($feedback_uuids), '?'));
            $stmt_attachments = $conn->prepare("
                SELECT feedback_uuid, attachment_url 
                FROM feedback_attachments 
                WHERE feedback_uuid IN ($in_clause)
            ");
            $stmt_attachments->bind_param(str_repeat('s', count($feedback_uuids)), ...$feedback_uuids);
            $stmt_attachments->execute();
            $attachments_result = $stmt_attachments->get_result();
            $attachments = [];
            while ($row = $attachments_result->fetch_assoc()) {
                $attachments[$row['feedback_uuid']][] = $row['attachment_url'];
            }
            $stmt_attachments->close();
    
            foreach ($feedback_items as &$item) {
                $item['attachments'] = $attachments[$item['uuid']] ?? [];
            }
        }
    
        echo json_encode($feedback_items);
        exit;
    }

    if ($request_type === 'admin_comments') {
        if (!isset($_SESSION['loggedin']) || !in_array($_SESSION['user_role'], ['administrator', 'moderator'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Acción no autorizada.']);
            exit;
        }

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;
        $search_term = $_GET['search'] ?? '';
        $filter = $_GET['filter'] ?? 'all';

        $params = [];
        $types = "";
        
        $base_query = "
            FROM photo_comments c
            JOIN users u ON c.user_uuid = u.uuid
            JOIN gallery_photos p ON c.photo_id = p.id
            LEFT JOIN (
                SELECT comment_id, COUNT(*) as report_count, 
                       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports
                FROM comment_reports
                GROUP BY comment_id
            ) cr ON c.id = cr.comment_id
        ";
        
        $where_conditions = [];
        if (!empty($search_term)) {
            $where_conditions[] = "(c.comment_text LIKE ? OR u.username LIKE ?)";
            $types .= "ss";
            $params[] = "%" . $search_term . "%";
            $params[] = "%" . $search_term . "%";
        }

        if ($filter === 'reported') {
            $where_conditions[] = "cr.report_count > 0";
        } elseif ($filter === 'pending') {
            $where_conditions[] = "cr.pending_reports > 0";
        }
        
        $where_clause = count($where_conditions) > 0 ? "WHERE " . implode(' AND ', $where_conditions) : "";
        
        $sql = "SELECT 
                    c.id, c.comment_text, c.created_at, c.status,
                    u.username,
                    p.id as photo_id, p.photo_url,
                    p.gallery_uuid,
                    IFNULL(cr.report_count, 0) as report_count,
                    IFNULL(cr.pending_reports, 0) as pending_reports
                " . $base_query . " " . $where_clause . "
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?";
        
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $conn->prepare($sql);
        if (!empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $comments = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        echo json_encode($comments);
        exit;
    }

    if ($request_type === 'comments') {
        $photo_id = isset($_GET['photo_id']) ? (int)$_GET['photo_id'] : 0;
        if ($photo_id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de foto no válido.']);
            exit;
        }

        $user_uuid = $_SESSION['user_uuid'] ?? null;

        $stmt = $conn->prepare("
            SELECT 
                c.id, 
                c.comment_text, 
                c.created_at, 
                c.status,
                u.username, 
                u.role,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND vote_type = 1) as likes,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND vote_type = -1) as dislikes,
                (SELECT vote_type FROM comment_likes WHERE comment_id = c.id AND user_uuid = ?) as user_vote
            FROM photo_comments c
            JOIN users u ON c.user_uuid = u.uuid
            WHERE c.photo_id = ? AND c.status IN ('visible', 'review')
            ORDER BY c.created_at DESC
        ");
        $stmt->bind_param("si", $user_uuid, $photo_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $comments = [];
        while($row = $result->fetch_assoc()){
            if ($row['status'] === 'review') {
                $row['comment_text'] = ''; // Vacía el texto si está en revisión
            }
            $row['user_vote'] = $row['user_vote'] ? (int)$row['user_vote'] : 0;
            $comments[] = $row;
        }
        $stmt->close();
        echo json_encode($comments);
        exit;
    }

    if ($request_type === 'history') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuario no autenticado.']);
            exit;
        }
    
        $user_uuid = $_SESSION['user_uuid'];
        $stmt = $conn->prepare("SELECT history_type, item_id, metadata, visited_at FROM user_history WHERE user_uuid = ? ORDER BY visited_at DESC");
        $stmt->bind_param("s", $user_uuid);
        $stmt->execute();
        $result = $stmt->get_result();
        $history_items = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    
        $history = [
            'profiles' => [],
            'photos' => [],
            'searches' => []
        ];
    
        foreach ($history_items as $item) {
            $metadata = json_decode($item['metadata'], true);
            $entry = array_merge(['id' => $item['item_id'], 'visited_at' => $item['visited_at']], $metadata);
            
            if ($item['history_type'] === 'profile') {
                $history['profiles'][] = $entry;
            } elseif ($item['history_type'] === 'photo') {
                $history['photos'][] = $entry;
            } elseif ($item['history_type'] === 'search') {
                // Para búsquedas, el 'id' es el término de búsqueda
                $entry['term'] = $item['item_id'];
                unset($entry['id']);
                $history['searches'][] = $entry;
            }
        }
    
        echo json_encode($history);
        exit;
    }

    if ($request_type === 'favorites') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuario no autenticado.']);
            exit;
        }
    
        $user_uuid = $_SESSION['user_uuid'];
        $is_favorite_check = isset($_GET['is_favorite_check']) ? explode(',', $_GET['is_favorite_check']) : [];
    
        $sql = "SELECT p.id, p.photo_url, p.gallery_uuid, g.name AS gallery_name, gpp.profile_picture_url, uf.added_at
                FROM user_favorites uf
                JOIN gallery_photos p ON uf.photo_id = p.id
                JOIN galleries g ON p.gallery_uuid = g.uuid
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                WHERE uf.user_uuid = ? AND g.visibility = 'visible'";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $user_uuid);
        $stmt->execute();
        $result = $stmt->get_result();
        $favorites = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        $favorite_status = [];
        if (!empty($is_favorite_check)) {
            $in_clause = implode(',', array_fill(0, count($is_favorite_check), '?'));
            $stmt_check = $conn->prepare("SELECT photo_id FROM user_favorites WHERE user_uuid = ? AND photo_id IN ($in_clause)");
            $params = array_merge([$user_uuid], $is_favorite_check);
            $types = 's' . str_repeat('i', count($is_favorite_check));
            $stmt_check->bind_param($types, ...$params);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            while ($row = $result_check->fetch_assoc()) {
                $favorite_status[$row['photo_id']] = true;
            }
            $stmt_check->close();
        }
    
        echo json_encode(['favorites' => $favorites, 'favorite_status' => $favorite_status]);
        exit;
    }

    if ($request_type === 'galleries') {
        $is_admin_context = isset($_GET['context']) && $_GET['context'] === 'admin' && isset($_SESSION['loggedin']) && $_SESSION['user_role'] === 'administrator';

        if (isset($_GET['uuid'])) {
            $uuid = $_GET['uuid'];
            $sql = "SELECT g.uuid, g.name, g.privacy, g.visibility, g.created_at, gpp.profile_picture_url, gm.last_edited
                    FROM galleries g
                    JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                    LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                    WHERE g.uuid = ?";
            
            if (!$is_admin_context) {
                $sql .= " AND g.visibility = 'visible'";
            }

            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $uuid);
            $stmt->execute();
            $result = $stmt->get_result();
            $gallery = $result->fetch_assoc();
            
            if (!$gallery) {
                http_response_code(404);
                echo json_encode(['error' => 'Galería no encontrada o no disponible.']);
                exit;
            }
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
    
        $where_conditions = [];
        $params = [];
        $types = "";

        if (!$is_admin_context) {
            $where_conditions[] = "g.visibility = 'visible'";
        }

        if (!empty($search_term)) {
            $where_conditions[] = "g.name LIKE ?";
            $types .= "s";
            $params[] = "%" . $search_term . "%";
        }
        
        $where_clause = count($where_conditions) > 0 ? "WHERE " . implode(' AND ', $where_conditions) : "";
        
        $order_clause = "ORDER BY (gm.total_likes * 0.5 + gm.total_interactions * 0.2) DESC";
        if ($sort_by === 'newest') $order_clause = "ORDER BY gm.last_edited DESC";
        if ($sort_by === 'oldest') $order_clause = "ORDER BY gm.last_edited ASC";
        if ($sort_by === 'alpha-asc') $order_clause = "ORDER BY g.name ASC";
        if ($sort_by === 'alpha-desc') $order_clause = "ORDER BY g.name DESC";
    
        $sql = "SELECT g.uuid, g.name, g.privacy, g.visibility, g.created_at, gpp.profile_picture_url, gm.last_edited,
                       (SELECT gp.photo_url FROM gallery_photos gp JOIN gallery_photos_metadata gpm ON gp.id = gpm.photo_id WHERE gp.gallery_uuid = g.uuid ORDER BY (gpm.likes * 0.5 + gpm.interactions * 0.2) DESC LIMIT 1) AS background_photo_url
                FROM galleries g
                JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                $where_clause $order_clause LIMIT ? OFFSET ?";
    
        $stmt = $conn->prepare($sql);
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;

        if (!empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $galleries = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        echo json_encode($galleries);
    } elseif ($request_type === 'photos') {
         if (isset($_GET['photo_id'])) {
            $photo_id = $_GET['photo_id'];
            $sql = "SELECT p.id, p.gallery_uuid, p.photo_url 
                    FROM gallery_photos p
                    JOIN galleries g ON p.gallery_uuid = g.uuid
                    WHERE p.id = ? AND g.visibility = 'visible'";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $photo_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $photo = $result->fetch_assoc();
             if (!$photo) {
                http_response_code(404);
                echo json_encode(['error' => 'Foto no encontrada o no disponible.']);
                exit;
            }
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
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                WHERE p.gallery_uuid = ? AND g.visibility = 'visible' 
                ORDER BY p.display_order ASC, p.id DESC LIMIT ? OFFSET ?";
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
        $where_clause = "WHERE g.visibility = 'visible'";
        $params = [];
        $types = "";
    
        if (!empty($search_term)) {
            $where_clause .= " AND g.name LIKE ?";
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
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                WHERE g.visibility = 'visible'
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

        $where_conditions = [];
        $params = [];
        $types = "";

        if (!empty($search_term)) {
            $where_conditions[] = "(username LIKE ? OR email LIKE ?)";
            $types .= "ss";
            $params[] = "%" . $search_term . "%";
            $params[] = "%" . $search_term . "%";
        }
        
        $where_clause = count($where_conditions) > 0 ? "WHERE " . implode(' AND ', $where_conditions) : "";
        
        $order_clause = "ORDER BY created_at DESC";

        $sql = "SELECT uuid, username, email, role, status, created_at FROM users $where_clause $order_clause LIMIT ? OFFSET ?";
        
        $types .= "ii";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $conn->prepare($sql);
        if (!empty($types)) {
            $stmt->bind_param($types, ...$params);
        }
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
    
        $stmt_gallery = $conn->prepare("
            SELECT g.uuid, g.name, g.privacy, g.visibility, g.created_at, gpp.profile_picture_url 
            FROM galleries g
            LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
            WHERE g.uuid = ?
        ");
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

    if (!isset($_POST['csrf_token']) || !validate_csrf_token($_POST['csrf_token'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Error de validación CSRF.']);
        exit;
    }
    
    require_once '../config/db.php';

    $action_type = $_POST['action_type'] ?? '';

    if ($action_type === 'update_comment_status') {
        if (!isset($_SESSION['loggedin']) || !in_array($_SESSION['user_role'], ['administrator', 'moderator'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $comment_id = $_POST['comment_id'] ?? 0;
        $status = $_POST['status'] ?? '';
        $allowed_statuses = ['visible', 'review', 'deleted'];

        if (empty($comment_id) || !in_array($status, $allowed_statuses)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos no válidos.']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE photo_comments SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $status, $comment_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Estado del comentario actualizado.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar el comentario.']);
        }
        $stmt->close();
        exit;
    }

    if ($action_type === 'update_report_status') {
        if (!isset($_SESSION['loggedin']) || !in_array($_SESSION['user_role'], ['administrator', 'moderator'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $comment_id = $_POST['comment_id'] ?? 0;
        $status = $_POST['status'] ?? '';
        if (empty($comment_id) || !in_array($status, ['reviewed', 'dismissed'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos no válidos.']);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE comment_reports SET status = ? WHERE comment_id = ? AND status = 'pending'");
        $stmt->bind_param("si", $status, $comment_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Reportes actualizados.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar los reportes.']);
        }
        $stmt->close();
        exit;
    }


    if ($action_type === 'like_comment') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión para votar.']);
            exit;
        }
    
        $comment_id = isset($_POST['comment_id']) ? (int)$_POST['comment_id'] : 0;
        $vote_type = isset($_POST['vote_type']) ? (int)$_POST['vote_type'] : 0;
        $user_uuid = $_SESSION['user_uuid'];
    
        if ($comment_id <= 0 || !in_array($vote_type, [1, -1, 0])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos de votación no válidos.']);
            exit;
        }
    
        if ($vote_type === 0) { // Eliminar voto
            $stmt = $conn->prepare("DELETE FROM comment_likes WHERE comment_id = ? AND user_uuid = ?");
            $stmt->bind_param("is", $comment_id, $user_uuid);
        } else { // Insertar o actualizar voto
            $stmt = $conn->prepare("INSERT INTO comment_likes (comment_id, user_uuid, vote_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE vote_type = ?");
            $stmt->bind_param("isis", $comment_id, $user_uuid, $vote_type, $vote_type);
        }
    
        if ($stmt->execute()) {
            // Obtener nuevos recuentos de likes/dislikes
            $stmt_counts = $conn->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ? AND vote_type = 1) as likes,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ? AND vote_type = -1) as dislikes
            ");
            $stmt_counts->bind_param("ii", $comment_id, $comment_id);
            $stmt_counts->execute();
            $result = $stmt_counts->get_result();
            $counts = $result->fetch_assoc();
            $stmt_counts->close();
            
            echo json_encode(['success' => true, 'likes' => $counts['likes'], 'dislikes' => $counts['dislikes']]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al procesar el voto.']);
        }
        $stmt->close();
        exit;
    }
    
    if ($action_type === 'report_comment') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión para reportar.']);
            exit;
        }
    
        $comment_id = isset($_POST['comment_id']) ? (int)$_POST['comment_id'] : 0;
        $reason = trim($_POST['reason'] ?? '');
        $reporter_uuid = $_SESSION['user_uuid'];
    
        $allowed_reasons = ['spam', 'hate_speech', 'harassment', 'false_info', 'inappropriate', 'other'];
        if ($comment_id <= 0 || empty($reason) || !in_array($reason, $allowed_reasons)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos de reporte no válidos.']);
            exit;
        }
    
        $stmt_check = $conn->prepare("SELECT id FROM comment_reports WHERE comment_id = ? AND reporter_uuid = ?");
        $stmt_check->bind_param("is", $comment_id, $reporter_uuid);
        $stmt_check->execute();
        $stmt_check->store_result();
    
        if ($stmt_check->num_rows > 0) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Ya has reportado este comentario.']);
            $stmt_check->close();
            exit;
        }
        $stmt_check->close();
    
        $stmt = $conn->prepare("INSERT INTO comment_reports (comment_id, reporter_uuid, reason) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $comment_id, $reporter_uuid, $reason);
    
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al enviar el reporte.']);
        }
        $stmt->close();
        exit;
    }
    
    if ($action_type === 'add_comment') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión para comentar.']);
            exit;
        }

        $photo_id = isset($_POST['photo_id']) ? (int)$_POST['photo_id'] : 0;
        $comment_text = trim($_POST['comment_text'] ?? '');

        if ($photo_id <= 0 || empty($comment_text)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos de comentario no válidos.']);
            exit;
        }

        $user_uuid = $_SESSION['user_uuid'];

        $stmt = $conn->prepare("INSERT INTO photo_comments (photo_id, user_uuid, comment_text) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $photo_id, $user_uuid, $comment_text);
        
        if ($stmt->execute()) {
            $new_comment_id = $conn->insert_id;
            
            $stmt_get = $conn->prepare("
                SELECT 
                    c.id, 
                    c.comment_text, 
                    c.created_at, 
                    u.username, 
                    u.role,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND vote_type = 1) as likes,
                    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND vote_type = -1) as dislikes,
                    (SELECT vote_type FROM comment_likes WHERE comment_id = c.id AND user_uuid = ?) as user_vote
                FROM photo_comments c
                JOIN users u ON c.user_uuid = u.uuid
                WHERE c.id = ?
            ");
            $stmt_get->bind_param("si", $user_uuid, $new_comment_id);
            $stmt_get->execute();
            $result = $stmt_get->get_result();
            $comment = $result->fetch_assoc();
            $comment['user_vote'] = $comment['user_vote'] ? (int)$comment['user_vote'] : 0;
            $stmt_get->close();

            echo json_encode(['success' => true, 'comment' => $comment]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al guardar el comentario.']);
        }
        $stmt->close();
        exit;
    }

    if ($action_type === 'add_history') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario no autenticado.']);
            exit;
        }
    
        $user_uuid = $_SESSION['user_uuid'];
        $history_type = $_POST['type'] ?? '';
        $item_id = $_POST['id'] ?? '';
        $metadata = $_POST['metadata'] ?? '{}';
    
        if (!in_array($history_type, ['profile', 'photo', 'search']) || empty($item_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos de historial no válidos.']);
            exit;
        }
    
        // Eliminar entradas duplicadas para mantener el historial limpio y ordenado
        $stmt_delete = $conn->prepare("DELETE FROM user_history WHERE user_uuid = ? AND history_type = ? AND item_id = ?");
        $stmt_delete->bind_param("sss", $user_uuid, $history_type, $item_id);
        $stmt_delete->execute();
        $stmt_delete->close();
    
        // Insertar el nuevo registro de historial
        $stmt_insert = $conn->prepare("INSERT INTO user_history (user_uuid, history_type, item_id, metadata) VALUES (?, ?, ?, ?)");
        $stmt_insert->bind_param("ssss", $user_uuid, $history_type, $item_id, $metadata);
        
        if ($stmt_insert->execute()) {
            // Limitar el historial a un número máximo de entradas por tipo
            $max_items = ($history_type === 'search') ? 100 : 50;
            $stmt_limit = $conn->prepare("DELETE FROM user_history WHERE user_uuid = ? AND history_type = ? AND id NOT IN (SELECT id FROM (SELECT id FROM user_history WHERE user_uuid = ? AND history_type = ? ORDER BY visited_at DESC LIMIT ?) as sub)");
            $stmt_limit->bind_param("ssssi", $user_uuid, $history_type, $user_uuid, $history_type, $max_items);
            $stmt_limit->execute();
            $stmt_limit->close();
            
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al guardar el historial.']);
        }
        $stmt_insert->close();
        exit;
    }

    if ($action_type === 'clear_history') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario no autenticado.']);
            exit;
        }

        $user_uuid = $_SESSION['user_uuid'];
        $stmt = $conn->prepare("DELETE FROM user_history WHERE user_uuid = ?");
        $stmt->bind_param("s", $user_uuid);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Historial eliminado correctamente.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'No se pudo eliminar el historial.']);
        }
        $stmt->close();
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
    } elseif ($action_type === 'toggle_favorite') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión para guardar favoritos.']);
            exit;
        }

        $user_uuid = $_SESSION['user_uuid'];
        $photo_id = isset($_POST['photo_id']) ? (int)$_POST['photo_id'] : 0;
        $is_favorite = filter_var($_POST['is_favorite'], FILTER_VALIDATE_BOOLEAN);

        if ($photo_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de foto no válido.']);
            exit;
        }

        $conn->begin_transaction();
        try {
            if ($is_favorite) {
                // Añadir a favoritos
                $stmt = $conn->prepare("INSERT INTO user_favorites (user_uuid, photo_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_uuid=user_uuid");
                $stmt->bind_param("si", $user_uuid, $photo_id);
                $stmt->execute();
            } else {
                // Eliminar de favoritos
                $stmt = $conn->prepare("DELETE FROM user_favorites WHERE user_uuid = ? AND photo_id = ?");
                $stmt->bind_param("si", $user_uuid, $photo_id);
                $stmt->execute();
            }
            $stmt->close();

            // Actualizar metadatos de la foto y galería
            $operator = $is_favorite ? '+' : '-';
            
            // Actualizar contador de likes de la foto
            $stmt_photo_likes = $conn->prepare("UPDATE gallery_photos_metadata SET likes = GREATEST(0, likes {$operator} 1) WHERE photo_id = ?");
            $stmt_photo_likes->bind_param("i", $photo_id);
            $stmt_photo_likes->execute();
            $stmt_photo_likes->close();
            
            // Obtener el gallery_uuid de la foto
            $stmt_get_gallery = $conn->prepare("SELECT gallery_uuid FROM gallery_photos WHERE id = ?");
            $stmt_get_gallery->bind_param("i", $photo_id);
            $stmt_get_gallery->execute();
            $result = $stmt_get_gallery->get_result();
            if($gallery = $result->fetch_assoc()) {
                $gallery_uuid = $gallery['gallery_uuid'];

                // Actualizar contador de likes total de la galería
                $stmt_gallery_likes = $conn->prepare("UPDATE galleries_metadata SET total_likes = GREATEST(0, total_likes {$operator} 1) WHERE gallery_uuid = ?");
                $stmt_gallery_likes->bind_param("s", $gallery_uuid);
                $stmt_gallery_likes->execute();
                $stmt_gallery_likes->close();
            }
            $stmt_get_gallery->close();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Favorito actualizado.']);

        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            error_log("Error al actualizar favorito y contadores: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar favoritos.']);
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
    } elseif ($action_type === 'change_gallery_visibility') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para realizar esta acción.']);
            exit;
        }
    
        $gallery_uuid = $_POST['uuid'] ?? '';
        $visibility = $_POST['visibility'] ?? '';
    
        if (empty($gallery_uuid) || !in_array($visibility, ['visible', 'hidden'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos no válidos.']);
            exit;
        }
    
        $stmt = $conn->prepare("UPDATE galleries SET visibility = ? WHERE uuid = ?");
        $stmt->bind_param("ss", $visibility, $gallery_uuid);
    
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Visibilidad de la galería actualizada.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la visibilidad.']);
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

    } elseif ($action_type === 'create_gallery') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $name = trim($_POST['name'] ?? '');
        $privacy = isset($_POST['privacy']) ? (int)filter_var($_POST['privacy'], FILTER_VALIDATE_BOOLEAN) : 0;

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El nombre de la galería es obligatorio.']);
            exit;
        }
        
        $uuid = generate_uuid_v4();
        
        $conn->begin_transaction();
        try {
            $stmt_gallery = $conn->prepare("INSERT INTO galleries (uuid, name, privacy, created_at) VALUES (?, ?, ?, NOW())");
            $stmt_gallery->bind_param("ssi", $uuid, $name, $privacy);
            $stmt_gallery->execute();
            $stmt_gallery->close();

            $stmt_meta = $conn->prepare("INSERT INTO galleries_metadata (gallery_uuid) VALUES (?)");
            $stmt_meta->bind_param("s", $uuid);
            $stmt_meta->execute();
            $stmt_meta->close();

            if (isset($_FILES['profile_picture'])) {
                $upload_dir = '../uploads/profile_pictures/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }
                $file = $_FILES['profile_picture'];
                $new_file_name = uniqid('', true) . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
                if (move_uploaded_file($file['tmp_name'], $upload_dir . $new_file_name)) {
                    $profile_picture_url = 'uploads/profile_pictures/' . $new_file_name;
                    $stmt_pfp = $conn->prepare("INSERT INTO gallery_profile_pictures (gallery_uuid, profile_picture_url) VALUES (?, ?)");
                    $stmt_pfp->bind_param("ss", $uuid, $profile_picture_url);
                    $stmt_pfp->execute();
                    $stmt_pfp->close();
                }
            }

            if (isset($_FILES['photos']) && isset($_POST['photo_order'])) {
                $upload_dir = '../uploads/gallery_photos/';
                if (!file_exists($upload_dir)) mkdir($upload_dir, 0777, true);

                $uploaded_files = [];
                foreach ($_FILES['photos']['name'] as $i => $name) {
                    $tmp_name = $_FILES['photos']['tmp_name'][$i];
                    $new_photo_name = uniqid('', true) . '.' . pathinfo($name, PATHINFO_EXTENSION);
                    if (move_uploaded_file($tmp_name, $upload_dir . $new_photo_name)) {
                        $uploaded_files[$name] = 'uploads/gallery_photos/' . $new_photo_name;
                    }
                }

                $stmt_photo = $conn->prepare("INSERT INTO gallery_photos (gallery_uuid, photo_url, display_order) VALUES (?, ?, ?)");
                $stmt_photo_meta = $conn->prepare("INSERT INTO gallery_photos_metadata (photo_id) VALUES (?)");
                
                foreach ($_POST['photo_order'] as $order_index => $original_name) {
                    if (isset($uploaded_files[$original_name])) {
                        $photo_url = $uploaded_files[$original_name];
                        $display_order = $order_index + 1;

                        $stmt_photo->bind_param("ssi", $uuid, $photo_url, $display_order);
                        $stmt_photo->execute();
                        
                        $photo_id = $conn->insert_id;
                        $stmt_photo_meta->bind_param("i", $photo_id);
                        $stmt_photo_meta->execute();
                    }
                }
                $stmt_photo->close();
                $stmt_photo_meta->close();
            }

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Galería creada con éxito.', 'uuid' => $uuid]);

        } catch (mysqli_sql_exception $exception) {
            $conn->rollback();
            error_log("Error al crear la galería: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error interno al crear la galería.']);
        }
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
    
        $upload_dir = '../uploads/profile_pictures/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $file = $_FILES['profile_picture'];
        $new_file_name = uniqid('', true) . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
        if (move_uploaded_file($file['tmp_name'], $upload_dir . $new_file_name)) {
            $profile_picture_url = 'uploads/profile_pictures/' . $new_file_name;
            
            $stmt = $conn->prepare("INSERT INTO gallery_profile_pictures (gallery_uuid, profile_picture_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE profile_picture_url = VALUES(profile_picture_url)");
            $stmt->bind_param("ss", $uuid, $profile_picture_url);
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
    } elseif ($action_type === 'delete_gallery') {
        if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'administrator') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Acción no autorizada.']);
            exit;
        }
        $uuid = $_POST['uuid'] ?? '';
        if (empty($uuid)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Falta el UUID de la galería.']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM galleries WHERE uuid = ?");
        $stmt->bind_param("s", $uuid);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Galería eliminada con éxito.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al eliminar la galería.']);
        }
        $stmt->close();
    } else {
        http_response_code(response_code: 400);
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