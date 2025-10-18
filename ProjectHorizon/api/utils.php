<?php
// /api/utils.php

if (!function_exists('generate_csrf_token')) {
    /**
     * Genera un token CSRF y lo almacena en la sesión.
     * @return string El token generado.
     */
    function generate_csrf_token() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        return $token;
    }
}

if (!function_exists('validate_csrf_token')) {
    /**
     * Valida el token CSRF enviado con el almacenado en la sesión.
     * @param string $token El token enviado por el cliente.
     * @return bool True si el token es válido, false en caso contrario.
     */
    function validate_csrf_token($token) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
}

if (!function_exists('generate_uuid_v4')) {
    /**
     * Genera un UUID v4.
     * @return string El UUID generado.
     */
    function generate_uuid_v4() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}