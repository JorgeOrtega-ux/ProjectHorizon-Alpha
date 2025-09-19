<?php
class Router {
    private static $routes = [
        '' => ['view' => 'main', 'section' => 'home'],
        'trends' => ['view' => 'main', 'section' => 'trends'],
        'favorites' => ['view' => 'main', 'section' => 'favorites'],
        'settings/accessibility' => ['view' => 'settings', 'section' => 'accessibility'],
        'settings/history-privacy' => ['view' => 'settings', 'section' => 'historyPrivacy'],
        'help/privacy-policy' => ['view' => 'help', 'section' => 'privacyPolicy'],
        'help/terms-conditions' => ['view' => 'help', 'section' => 'termsConditions'],
        'help/cookie-policy' => ['view' => 'help', 'section' => 'cookiePolicy'],
        'help/send-feedback' => ['view' => 'help', 'section' => 'sendFeedback']
    ];

    public static function getRouteConfig($path) {
        if (array_key_exists($path, self::$routes)) {
            return self::$routes[$path];
        }

        if (preg_match('/^gallery\/[a-f0-9-]{36}\/photo\/\d+$/', $path)) {
            return ['view' => 'main', 'section' => 'photoView'];
        }

        if (preg_match('/^gallery\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'main', 'section' => 'galleryPhotos'];
        }

        if (preg_match('/^favorites\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'main', 'section' => 'userSpecificFavorites'];
        }
        
        if (preg_match('/^gallery\/[a-f0-9-]{36}\/access-code$/', $path)) {
            return ['view' => 'main', 'section' => 'accessCodePrompt'];
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
?>