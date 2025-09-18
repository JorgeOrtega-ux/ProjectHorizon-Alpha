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
            echo json_encode(['success' => false, 'message' => 'Faltan el UUID de la galería o el código de acceso.']);
            exit;
        }

        $sql = "SELECT access_code FROM galleries WHERE uuid = ? AND privacy = 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $uuid);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows > 0) {
            $gallery = $result->fetch_assoc();
            // --- NOTA: En un proyecto real, las contraseñas y códigos deben estar hasheados. ---
            if ($gallery['access_code'] === $code) {
                echo json_encode(['success' => true, 'message' => 'Código correcto.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'El código de acceso es incorrecto.']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'No se encontró una galería privada con ese UUID.']);
        }
        $stmt->close();
    } elseif ($action_type === 'increment_interaction') {
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
    } elseif ($action_type === 'toggle_like') {
        $photo_id = isset($_POST['photo_id']) ? (int)$_POST['photo_id'] : 0;
        $gallery_uuid = isset($_POST['gallery_uuid']) ? $_POST['gallery_uuid'] : '';
        $is_liked = isset($_POST['is_liked']) ? filter_var($_POST['is_liked'], FILTER_VALIDATE_BOOLEAN) : false;

        if ($photo_id > 0 && !empty($gallery_uuid)) {
            $conn->begin_transaction();
            try {
                // Actualizar likes de la foto
                $sql_photo = "UPDATE gallery_photos_metadata SET likes = likes + 1, interactions = interactions + 1 WHERE photo_id = ?";
                $stmt_photo = $conn->prepare($sql_photo);
                $stmt_photo->bind_param("i", $photo_id);
                $stmt_photo->execute();
                $stmt_photo->close();

                // Actualizar total_likes e total_interactions de la galería
                $sql_gallery = "UPDATE galleries_metadata SET total_likes = total_likes + 1, total_interactions = total_interactions + 1 WHERE gallery_uuid = ?";
                $stmt_gallery = $conn->prepare($sql_gallery);
                $stmt_gallery->bind_param("s", $gallery_uuid);
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

// --- MANEJO DE SOLICITUDES GET ---
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $request_type = isset($_GET['request_type']) ? $_GET['request_type'] : '';

    if ($request_type === 'galleries') {
        // Lógica para obtener galerías
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
        // Lógica para obtener fotos (sin cambios)
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

        // --- INICIO DE LA CORRECCIÓN ---
        $sql = "SELECT p.id, p.photo_url, p.gallery_uuid, g.name AS gallery_name, gpp.profile_picture_url
                FROM gallery_photos p
                JOIN galleries g ON p.gallery_uuid = g.uuid
                LEFT JOIN gallery_profile_pictures gpp ON p.gallery_uuid = gpp.gallery_uuid
                WHERE p.gallery_uuid = ?
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?";
        // --- FIN DE LA CORRECCIÓN ---
                
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
        $sql = "SELECT g.uuid, g.name, g.privacy, gpp.profile_picture_url,
                       (SELECT gp.photo_url FROM gallery_photos gp WHERE gp.gallery_uuid = g.uuid ORDER BY RAND() LIMIT 1) AS background_photo_url
                FROM galleries g
                JOIN galleries_metadata gm ON g.uuid = gm.gallery_uuid
                LEFT JOIN gallery_profile_pictures gpp ON g.uuid = gpp.gallery_uuid
                ORDER BY (gm.total_likes * 0.7 + gm.total_interactions * 0.3) DESC
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $limit);
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
        $sql = "SELECT p.id, p.photo_url, p.gallery_uuid, g.name AS gallery_name, gpp.profile_picture_url
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

} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Request method not supported']);
}

$conn->close();
?>