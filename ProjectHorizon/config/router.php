<?php
class Router {
    private static $routes = [
        '' => ['view' => 'main', 'section' => 'home', 'requires_admin' => false],
        'explore' => ['view' => 'main', 'section' => 'explore', 'requires_admin' => false],
        'favorites' => ['view' => 'main', 'section' => 'favorites', 'requires_admin' => false],
        'login' => ['view' => 'main', 'section' => 'login', 'requires_admin' => false],
        'register' => ['view' => 'main', 'section' => 'register', 'requires_admin' => false],
        'settings/accessibility' => ['view' => 'settings', 'section' => 'accessibility', 'requires_admin' => false],
        'settings/history-privacy' => ['view' => 'settings', 'section' => 'historyPrivacy', 'requires_admin' => false],
        'admin/users' => ['view' => 'admin', 'section' => 'manageUsers', 'requires_admin' => true],
        'admin/galleries' => ['view' => 'admin', 'section' => 'manageGalleries', 'requires_admin' => true]
    ];

    public static function getRouteConfig($path) {
        if (array_key_exists($path, self::$routes)) {
            return self::$routes[$path];
        }

        if (preg_match('/^user\/[a-f0-9-]{36}\/photo\/\d+$/', $path)) {
            return ['view' => 'main', 'section' => 'photoView', 'requires_admin' => false];
        }

        if (preg_match('/^user\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'main', 'section' => 'userPhotos', 'requires_admin' => false];
        }

        return null;
    }

    public static function getCurrentPath() {
        $basePath = dirname($_SERVER['SCRIPT_NAME']);
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        if ($basePath !== '/' && strpos($requestUri, $basePath) === 0) {
            $path = substr($requestUri, strlen($basePath));
        } else {
            $path = $requestUri;
        }
        
        return trim($path, '/');
    }
}

$currentPath = Router::getCurrentPath();
$routeConfig = Router::getRouteConfig($currentPath);

if ($routeConfig === null || ($routeConfig['requires_admin'] && (!isset($_SESSION['user_rank']) || $_SESSION['user_rank'] !== 'admin'))) {
    $routeConfig = ['view' => 'main', 'section' => '404', 'requires_admin' => false];
}

$CURRENT_VIEW = $routeConfig['view'];
$CURRENT_SECTION = $routeConfig['section'];
?>