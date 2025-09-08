<?php
require_once '../config/db.php';

// Obtener parámetros de la URL
$sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'relevant';
$search_term = isset($_GET['search']) ? $_GET['search'] : '';

$order_clause = "";
$where_clause = "";
$params = [];
$types = "";

// Cláusula WHERE para la búsqueda
if (!empty($search_term)) {
    $where_clause = "WHERE u.name LIKE ?";
    $types .= "s";
    $params[] = "%" . $search_term . "%";
}

// Cláusula ORDER BY para el ordenamiento
switch ($sort_by) {
    case 'newest':
        $order_clause = "ORDER BY um.last_edited DESC";
        break;
    case 'oldest':
        $order_clause = "ORDER BY um.last_edited ASC";
        break;
    case 'alpha-asc':
        $order_clause = "ORDER BY u.name ASC";
        break;
    case 'alpha-desc':
        $order_clause = "ORDER BY u.name DESC";
        break;
    case 'relevant':
    default:
        $order_clause = "ORDER BY (um.total_likes * 0.5 + um.total_saves * 0.3 + um.total_interactions * 0.2) DESC";
        break;
}

// Construir la consulta SQL
$sql = "SELECT u.name, u.privacy, um.last_edited 
        FROM users u
        JOIN users_metadata um ON u.uuid = um.user_uuid
        $where_clause
        $order_clause";

// Preparar y ejecutar la consulta
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

header('Content-Type: application/json');
echo json_encode($users);
?>