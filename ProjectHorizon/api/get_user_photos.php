<?php
require_once '../config/db.php';

$user_uuid = isset($_GET['uuid']) ? $_GET['uuid'] : '';

if (empty($user_uuid)) {
    http_response_code(400);
    echo json_encode(['error' => 'User UUID is required']);
    exit;
}

$sql = "SELECT photo_url FROM user_photos WHERE user_uuid = ?";
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

header('Content-Type: application/json');
echo json_encode($photos);
?>