<?php
class Router {
    private static $routes = [
        '' => ['view' => 'main', 'section' => 'home'],
        'trends' => ['view' => 'main', 'section' => 'trends'],
        'favorites' => ['view' => 'main', 'section' => 'favorites'],
        'settings/accessibility' => ['view' => 'settings', 'section' => 'accessibility'],
        'settings/login-security' => ['view' => 'settings', 'section' => 'loginSecurity'],
        'settings/history-privacy' => ['view' => 'settings', 'section' => 'historyPrivacy'],
        'settings/history' => ['view' => 'settings', 'section' => 'history'],
        'help/privacy-policy' => ['view' => 'help', 'section' => 'privacyPolicy'],
        'help/terms-conditions' => ['view' => 'help', 'section' => 'termsConditions'],
        'help/cookie-policy' => ['view' => 'help', 'section' => 'cookiePolicy'],
        'help/send-feedback' => ['view' => 'help', 'section' => 'sendFeedback'],
        'login' => ['view' => 'auth', 'section' => 'login'],
        'register' => ['view' => 'auth', 'section' => 'register', 'data' => ['step' => 'user-info']],
        'register/password' => ['view' => 'auth', 'section' => 'register', 'data' => ['step' => 'password']],
        'forgot-password' => ['view' => 'auth', 'section' => 'forgotPassword', 'data' => ['step' => 'enter-email']],
        'forgot-password/enter-code' => ['view' => 'auth', 'section' => 'forgotPassword', 'data' => ['step' => 'enter-code']],
        'forgot-password/new-password' => ['view' => 'auth', 'section' => 'forgotPassword', 'data' => ['step' => 'new-password']],
        'admin/users' => ['view' => 'admin', 'section' => 'manageUsers'],
        'admin/content' => ['view' => 'admin', 'section' => 'manageContent']
    ];

    public static function getRouteConfig($path) {
        if (array_key_exists($path, self::$routes)) {
            return self::$routes[$path];
        }

        if (preg_match('/^gallery\/private\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'main', 'section' => 'privateGalleryProxy'];
        }

        if (preg_match('/^gallery\/[a-f0-9-]{36}\/photo\/\d+$/', $path)) {
            return ['view' => 'main', 'section' => 'photoView'];
        }

        if (preg_match('/^gallery\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'main', 'section' => 'galleryPhotos'];
        }
        
        if (preg_match('/^admin\/edit-gallery\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'admin', 'section' => 'editGallery'];
        }

        if (preg_match('/^favorites\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'main', 'section' => 'userSpecificFavorites'];
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

if ($routeConfig === null) {
    $routeConfig = ['view' => 'main', 'section' => '404'];
}

$CURRENT_VIEW = $routeConfig['view'];
$CURRENT_SECTION = $routeConfig['section'];
// También pasamos los datos (como el 'step') si existen en la configuración de la ruta
$ROUTE_DATA = isset($routeConfig['data']) ? json_encode($routeConfig['data']) : 'null';
?>