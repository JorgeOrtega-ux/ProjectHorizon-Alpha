<?php
require_once '../config/db.php';

header('Content-Type: application/json');

// --- MANEJO DE SOLICITUDES POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action_type = isset($_POST['action_type']) ? $_POST['action_type'] : '';

    if ($action_type === 'verify_code') {
        $uuid = isset($_POST['uuid']) ? $_POST['uuid'] : '';
        $code = isset($_POST['code']) ? $_POST['code'] : '';

        if (empty($uuid) || empty($code)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Faltan el UUID del usuario o el código de acceso.']);
            exit;
        }

        $sql = "SELECT access_code FROM users WHERE uuid = ? AND privacy = 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $uuid);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows > 0) {
            $user = $result->fetch_assoc();
            // --- NOTA: En un proyecto real, las contraseñas y códigos deben estar hasheados. ---
            if ($user['access_code'] === $code) {
                echo json_encode(['success' => true, 'message' => 'Código correcto.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'El código de acceso es incorrecto.']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No se encontró un usuario privado con ese UUID.']);
        }
        $stmt->close();
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid POST action type']);
    }

// --- MANEJO DE SOLICITUDES GET ---
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $request_type = isset($_GET['request_type']) ? $_GET['request_type'] : '';

    if ($request_type === 'users') {
        // Lógica para obtener usuarios (sin cambios)
        if (isset($_GET['uuid'])) {
            $uuid = $_GET['uuid'];
            $sql = "SELECT u.uuid, u.name, u.privacy, um.last_edited, upp.profile_picture_url
                    FROM users u
                    JOIN users_metadata um ON u.uuid = um.user_uuid
                    LEFT JOIN user_profile_pictures upp ON u.uuid = upp.user_uuid
                    WHERE u.uuid = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $uuid);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            echo json_encode($user);
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
            $where_clause = "WHERE u.name LIKE ?";
            $types .= "s";
            $params[] = "%" . $search_term . "%";
        }
        switch ($sort_by) {
            case 'newest': $order_clause = "ORDER BY um.last_edited DESC"; break;
            case 'oldest': $order_clause = "ORDER BY um.last_edited ASC"; break;
            case 'alpha-asc': $order_clause = "ORDER BY u.name ASC"; break;
            case 'alpha-desc': $order_clause = "ORDER BY u.name DESC"; break;
            default: $order_clause = "ORDER BY (um.total_likes * 0.5 + um.total_saves * 0.3 + um.total_interactions * 0.2) DESC"; break;
        }
        $sql = "SELECT u.uuid, u.name, u.privacy, um.last_edited, upp.profile_picture_url,
                       (
                           SELECT up.photo_url
                           FROM user_photos up
                           JOIN user_photos_metadata upm ON up.id = upm.photo_id
                           WHERE up.user_uuid = u.uuid
                           ORDER BY (upm.likes * 0.5 + upm.saves * 0.3 + upm.interactions * 0.2) DESC
                           LIMIT 1
                       ) AS background_photo_url
                FROM users u
                JOIN users_metadata um ON u.uuid = um.user_uuid
                LEFT JOIN user_profile_pictures upp ON u.uuid = upp.user_uuid
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
        $users = array();
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
        }
        $stmt->close();
        echo json_encode($users);

    } elseif ($request_type === 'photos') {
        // Lógica para obtener fotos (sin cambios)
        if (isset($_GET['photo_id'])) {
            $photo_id = $_GET['photo_id'];
            $sql = "SELECT id, user_uuid, photo_url FROM user_photos WHERE id = ?";
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
        $user_uuid = isset($_GET['uuid']) ? $_GET['uuid'] : '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $limit;
        if (empty($user_uuid)) {
            http_response_code(400);
            echo json_encode(['error' => 'User UUID is required']);
            exit;
        }
        $sql = "SELECT id, photo_url, user_uuid FROM user_photos WHERE user_uuid = ? ORDER BY id DESC LIMIT ? OFFSET ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $user_uuid, $limit, $offset);
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

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid GET request type']);
    }

} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Request method not supported']);
}

$conn->close();
?>