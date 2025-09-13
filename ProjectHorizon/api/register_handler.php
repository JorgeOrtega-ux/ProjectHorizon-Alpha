<?php
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El formato del correo electrónico no es válido.']);
    exit;
}

// Verificar si el correo ya existe
$sql_check = "SELECT id FROM users WHERE email = ?";
$stmt_check = $conn->prepare($sql_check);
$stmt_check->bind_param("s", $email);
$stmt_check->execute();
$stmt_check->store_result();

if ($stmt_check->num_rows > 0) {
    http_response_code(409); // Conflict
    echo json_encode(['success' => false, 'message' => 'El correo electrónico ya está registrado.']);
    $stmt_check->close();
    $conn->close();
    exit;
}
$stmt_check->close();

$uuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex(random_bytes(16)), 4));
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO users (uuid, name, email, password) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $uuid, $name, $email, $hashed_password);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Usuario registrado correctamente.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al registrar el usuario.']);
}

$stmt->close();
$conn->close();
?>