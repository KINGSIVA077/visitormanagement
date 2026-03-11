<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM blacklist ORDER BY created_at DESC");
        respond($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['phone'])) respond(['error' => 'Phone number required'], 400);
        
        $id = generateId('blk-');
        $stmt = $db->prepare("INSERT INTO blacklist (id, phone, name, reason, created_at) VALUES (?,?,?,?, NOW())");
        $stmt->execute([$id, $data['phone'], $data['name'] ?? '', $data['reason'] ?? '']);
        respond(['success' => true, 'id' => $id]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if (!$id) respond(['error' => 'ID required'], 400);
        $db->prepare("DELETE FROM blacklist WHERE id = ?")->execute([$id]);
        respond(['success' => true]);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
