<?php
class Router {
    private static $routes = [
        '' => ['view' => 'main', 'section' => 'home'],
        'favorites' => ['view' => 'main', 'section' => 'favorites'],
        'settings/your-profile' => ['view' => 'settings', 'section' => 'yourProfile'],
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
        'register/verify-code' => ['view' => 'auth', 'section' => 'register', 'data' => ['step' => 'verify-code']],
        'forgot-password' => ['view' => 'auth', 'section' => 'forgotPassword', 'data' => ['step' => 'enter-email']],
        'forgot-password/enter-code' => ['view' => 'auth', 'section' => 'forgotPassword', 'data' => ['step' => 'enter-code']],
        'forgot-password/new-password' => ['view' => 'auth', 'section' => 'forgotPassword', 'data' => ['step' => 'new-password']],
        'admin/dashboard' => ['view' => 'admin', 'section' => 'dashboard'],
        'admin/users' => ['view' => 'admin', 'section' => 'manageUsers'],
        'admin/content' => ['view' => 'admin', 'section' => 'manageContent'],
        'admin/create-gallery' => ['view' => 'admin', 'section' => 'createGallery'],
        'admin/comments' => ['view' => 'admin', 'section' => 'manageComments'],
        'admin/feedback' => ['view' => 'admin', 'section' => 'manageFeedback'],
        'admin/site-settings' => ['view' => 'admin', 'section' => 'generalSettings'],
        'admin/gallery-stats' => ['view' => 'admin', 'section' => 'galleryStats'],
        'admin/logs' => ['view' => 'admin', 'section' => 'manageLogs'],
        'admin/backup' => ['view' => 'admin', 'section' => 'backup'],
        'gallery/{uuid}/photo/{photoId}/comments' => ['view' => 'main', 'section' => 'photoComments']
    ];
    public static function getRouteConfig($path) {
        if (array_key_exists($path, self::$routes)) {
            return self::$routes[$path];
        }

        if (preg_match('/^admin\/logs\/view\/(.+)$/', $path, $matches)) {
            return ['view' => 'admin', 'section' => 'viewLog', 'data' => ['filename' => $matches[1]]];
        }

        if (preg_match('/^admin\/gallery\/[a-f0-9-]{36}\/stats$/', $path)) {
            return ['view' => 'admin', 'section' => 'galleryStats'];
        }

        if (preg_match('/^admin\/user\/[a-f0-9-]{36}$/', $path)) {
            return ['view' => 'admin', 'section' => 'userProfile'];
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
$ROUTE_DATA = isset($routeConfig['data']) ? json_encode($routeConfig['data']) : 'null';
?>