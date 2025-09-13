<?php
require_once '../config/db.php';

header('Content-Type: application/json');

// --- LÓGICA PARA UN SOLO USUARIO (sin cambios) ---
if (isset($_GET['uuid'])) {
    // ... (código existente sin cambios)
    $uuid = $_GET['uuid'];
    $sql = "SELECT u.uuid, u.name, u.privacy, um.last_edited 
            FROM users u
            JOIN users_metadata um ON u.uuid = um.user_uuid
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

// --- LÓGICA DE LISTA CON PAGINACIÓN ---
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

// Se modifica la consulta principal para incluir la foto de fondo más relevante
$sql = "SELECT u.uuid, u.name, u.privacy, um.last_edited,
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
        $where_clause
        $order_clause
        LIMIT ? OFFSET ?";

$stmt = $conn->prepare($sql);

// Se añaden los nuevos parámetros de limit y offset al bind_param
$types .= "ii";
$params[] = $limit;
$params[] = $offset;

if (!empty($search_term)) {
    $stmt->bind_param($types, ...$params);
} else {
    // Si no hay búsqueda, solo se bindean limit y offset
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
$conn->close();
echo json_encode($users);
?>