<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id']) && isset($_SESSION['user_name'])) {
    echo json_encode([
        'loggedIn' => true,
        'user' => [
            'name' => $_SESSION['user_name'],
            'rank' => $_SESSION['user_rank'] ?? 'user'
        ]
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
}
?>