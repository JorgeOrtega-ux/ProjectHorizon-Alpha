<?php
require_once '../config/db.php';

header('Content-Type: application/json');

// --- LÓGICA PARA OBTENER UNA SOLA FOTO (sin cambios) ---
if (isset($_GET['photo_id'])) {
    // ... (código existente sin cambios)
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

// --- LÓGICA DE LISTA DE FOTOS CON PAGINACIÓN ---
$user_uuid = isset($_GET['uuid']) ? $_GET['uuid'] : '';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

if (empty($user_uuid)) {
    http_response_code(400);
    echo json_encode(['error' => 'User UUID is required']);
    exit;
}

// Se añade `id` y la paginación (LIMIT y OFFSET) a la consulta SQL
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
$conn->close();

echo json_encode($photos);
?>