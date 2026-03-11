<?php
require_once __DIR__ . '/config.php';

// ═══ Server Info API ═══
// Returns the server's LAN IP so QR codes can be accessed from phones

$serverIp = '';

// Try to detect LAN IP
if (function_exists('gethostname')) {
    $hostname = gethostname();
    $ip = @gethostbyname($hostname);
    if ($ip && $ip !== $hostname && $ip !== '127.0.0.1') {
        $serverIp = $ip;
    }
}

// Fallback: check SERVER_ADDR
if (empty($serverIp) && !empty($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '127.0.0.1' && $_SERVER['SERVER_ADDR'] !== '::1') {
    $serverIp = $_SERVER['SERVER_ADDR'];
}

// Fallback: try to find LAN IP via network interfaces (Windows)
if (empty($serverIp)) {
    $output = @shell_exec('ipconfig 2>&1');
    if ($output && preg_match('/IPv4 Address[\. ]*:\s*(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)/i', $output, $matches)) {
        $serverIp = $matches[1];
    }
}

$port = $_SERVER['SERVER_PORT'] ?? '3001';
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';

if ($serverIp) {
    $baseUrl = $protocol . '://' . $serverIp . ':' . $port;
} else {
    $baseUrl = $protocol . '://localhost:' . $port;
}

respond([
    'server_ip' => $serverIp ?: 'localhost',
    'port' => $port,
    'base_url' => $baseUrl
]);
?>
