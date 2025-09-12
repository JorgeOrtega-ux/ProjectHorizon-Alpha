<?php
require_once '../config/db.php';

header('Content-Type: application/json');

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
$conn->close();
?>