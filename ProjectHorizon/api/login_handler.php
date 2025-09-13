<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Correo y contraseña son obligatorios.']);
    exit;
}

$sql = "SELECT id, uuid, name, password, rank FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_uuid'] = $user['uuid'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_rank'] = $user['rank'];
        echo json_encode(['success' => true, 'message' => 'Inicio de sesión exitoso.', 'user' => ['name' => $user['name'], 'rank' => $user['rank']]]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
    }
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
}

$stmt->close();
$conn->close();
?>