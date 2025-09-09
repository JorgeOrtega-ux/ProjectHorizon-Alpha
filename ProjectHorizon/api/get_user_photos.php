<?php
require_once '../config/db.php';

header('Content-Type: application/json');

// --- LÓGICA PARA OBTENER UNA SOLA FOTO POR SU ID ---
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

// --- LÓGICA EXISTENTE PARA OBTENER TODAS LAS FOTOS DE UN USUARIO ---
$user_uuid = isset($_GET['uuid']) ? $_GET['uuid'] : '';

if (empty($user_uuid)) {
    http_response_code(400);
    echo json_encode(['error' => 'User UUID is required']);
    exit;
}

// Se añade `id` a la consulta SQL
$sql = "SELECT id, photo_url FROM user_photos WHERE user_uuid = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $user_uuid);
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