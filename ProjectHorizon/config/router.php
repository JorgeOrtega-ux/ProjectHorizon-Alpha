<?php
class Router {
    // Defines the valid URLs and maps them to views and sections
    private static $routes = [
        // URL Path => ['view' => 'data-view', 'section' => 'data-section']
        ''                         => ['view' => 'main', 'section' => 'home'],
        'explore'                  => ['view' => 'main', 'section' => 'explore'],
        'settings/accessibility'   => ['view' => 'settings', 'section' => 'accessibility'],
        // LÍNEA MODIFICADA
        'settings/history-privacy' => ['view' => 'settings', 'section' => 'historyPrivacy']
    ];

    /**
     * Gets the configuration for a given URL path.
     */
    public static function getRouteConfig($path) {
        if (array_key_exists($path, self::$routes)) {
            return self::$routes[$path];
        }
        return null; // Route not found
    }

    /**
     * Determines the current URL path from the server request.
     */
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

// Get the current URL path from the user's request
$currentPath = Router::getCurrentPath();
// Find the matching route configuration
$routeConfig = Router::getRouteConfig($currentPath);

// If the URL doesn't match any route, default to the 404 page
if ($routeConfig === null) {
    $routeConfig = ['view' => 'main', 'section' => '404'];
}

// These variables will be used in index.php to show the correct content
$CURRENT_VIEW = $routeConfig['view'];
$CURRENT_SECTION = $routeConfig['section'];
?>