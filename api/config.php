<?php
// ═══ Database Configuration ═══
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DB_HOST = '127.0.0.1';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'visitorgate';

function getDB() {
    global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;
    try {
        $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}

function getInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function logAction($userId, $action, $entityType, $entityId, $details = []) {
    $db = getDB();
    $id = 'log-' . bin2hex(random_bytes(4));
    $stmt = $db->prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at) VALUES (?,?,?,?,?,?, NOW())");
    $stmt->execute([$id, $userId, $action, $entityType, $entityId, json_encode($details)]);
}


function generateId($prefix = '') {
    return $prefix . time() . '-' . bin2hex(random_bytes(4));
}
?>
