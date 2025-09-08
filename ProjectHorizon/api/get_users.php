<?php
require_once '../config/db.php';

// Obtener el parámetro de ordenamiento, por defecto será 'relevant'
$sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'relevant';

$order_clause = "";

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
        // Algoritmo de relevancia: 50% likes, 30% guardados, 20% interacciones
        $order_clause = "ORDER BY (um.total_likes * 0.5 + um.total_saves * 0.3 + um.total_interactions * 0.2) DESC";
        break;
}

// **Añadimos u.privacy a la consulta**
$sql = "SELECT u.name, u.privacy, um.last_edited 
        FROM users u
        JOIN users_metadata um ON u.uuid = um.user_uuid
        $order_clause";

$result = $conn->query($sql);
$users = array();

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

$conn->close();

header('Content-Type: application/json');
echo json_encode($users);
?>