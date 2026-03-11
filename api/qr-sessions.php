<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$data = getInput();

if ($action === 'validate') {
    // ═══ Validate QR Token ═══
    if (empty($data['session_code']) || empty($data['token'])) {
        respond(['valid' => false, 'error' => 'Missing session_code or token'], 400);
    }

    $tokenHash = hash('sha256', $data['token']);
    $stmt = $db->prepare("SELECT * FROM visitor_sessions WHERE session_code = ? AND qr_token_hash = ? AND status != 'DESTROYED'");
    $stmt->execute([$data['session_code'], $tokenHash]);
    $row = $stmt->fetch();

    if (!$row) {
        respond(['valid' => false, 'error' => 'Invalid or expired QR code'], 400);
    }
    if ($row['status'] === 'EXPIRED') {
        respond(['valid' => false, 'error' => 'QR code has expired'], 400);
    }
    if ($row['status'] === 'USED') {
        respond(['valid' => false, 'error' => 'QR code already used'], 400);
    }

    respond([
        'valid' => true,
        'session_id' => $row['id'],
        'template_id' => $row['template_id'],
        'category' => $row['category']
    ]);

} else {
    // ═══ Generate QR Session ═══
    if (empty($data['template_id']) || empty($data['category']) || empty($data['security_id'])) {
        respond(['error' => 'Missing required fields'], 400);
    }

    $sessionId = generateId('session-');
    $sessionCode = 'VMS-' . time() . '-' . strtoupper(bin2hex(random_bytes(4)));
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', time() + 6 * 3600); // 6 hours

    // Build visitor URL using LAN IP for phone accessibility
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];

    // Detect LAN IP so phones on same WiFi can access
    $serverIp = '';
    if (function_exists('gethostname')) {
        $hn = gethostname();
        $ip = @gethostbyname($hn);
        if ($ip && $ip !== $hn && $ip !== '127.0.0.1') $serverIp = $ip;
    }
    if (empty($serverIp) && !empty($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '127.0.0.1' && $_SERVER['SERVER_ADDR'] !== '::1') {
        $serverIp = $_SERVER['SERVER_ADDR'];
    }
    if (empty($serverIp)) {
        $out = @shell_exec('ipconfig 2>&1');
        if ($out && preg_match('/IPv4 Address[\. ]*:\s*(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)/i', $out, $m)) {
            $serverIp = $m[1];
        }
    }

    $port = $_SERVER['SERVER_PORT'] ?? '3001';
    if ($serverIp) {
        $host = $serverIp . ':' . $port;
    }

    $visitorUrl = "$protocol://$host/visitor.html?session=$sessionCode&token=$token";

    $stmt = $db->prepare('INSERT INTO visitor_sessions (id, session_code, template_id, category, qr_code_url, qr_token, qr_token_hash, status, expires_at, generated_by) VALUES (?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$sessionId, $sessionCode, $data['template_id'], $data['category'], $visitorUrl, $token, $tokenHash, 'ACTIVE', $expiresAt, $data['security_id']]);

    respond([
        'session_id' => $sessionId,
        'session_code' => $sessionCode,
        'visitor_url' => $visitorUrl,
        'expires_at' => $expiresAt
    ]);
}
?>
