<?php
// Router for PHP built-in server
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Serve API requests
if (preg_match('#^/api/#', $path)) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
        include $file;
        return true;
    }
    http_response_code(404);
    echo json_encode(['error' => 'API endpoint not found']);
    return true;
}

// Serve static files from /public
$file = __DIR__ . '/public' . $path;
if (is_file($file)) {
    // Let PHP serve known static types
    $ext = pathinfo($file, PATHINFO_EXTENSION);
    $types = ['html'=>'text/html','css'=>'text/css','js'=>'application/javascript','svg'=>'image/svg+xml','png'=>'image/png','jpg'=>'image/jpeg','json'=>'application/json','ico'=>'image/x-icon'];
    if (isset($types[$ext])) {
        header('Content-Type: ' . $types[$ext]);
        readfile($file);
        return true;
    }
    return false; // Let built-in server handle
}

// Default to index.html
if ($path === '/') {
    include __DIR__ . '/public/index.html';
    return true;
}

return false;
?>
