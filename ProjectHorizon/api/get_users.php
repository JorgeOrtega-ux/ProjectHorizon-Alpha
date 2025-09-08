<?php
require_once '../config/db.php';

header('Content-Type: application/json');

// --- NUEVA LÓGICA: Obtener un solo usuario por UUID ---
if (isset($_GET['uuid'])) {
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

// --- Lógica existente para obtener la lista de usuarios ---
$sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'relevant';
$search_term = isset($_GET['search']) ? $_GET['search'] : '';

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

$sql = "SELECT u.uuid, u.name, u.privacy, um.last_edited 
        FROM users u
        JOIN users_metadata um ON u.uuid = um.user_uuid
        $where_clause
        $order_clause";

$stmt = $conn->prepare($sql);
if (!empty($search_term)) {
    $stmt->bind_param($types, ...$params);
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