<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $db->query('SELECT * FROM departments WHERE is_active = 1 ORDER BY name');
        respond($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['name']) || empty($data['code'])) {
            respond(['error' => 'Name and code required'], 400);
        }
        $id = generateId('dept-');
        $stmt = $db->prepare('INSERT INTO departments (id, name, code, description, is_active) VALUES (?, ?, ?, ?, 1)');
        $stmt->execute([$id, $data['name'], strtoupper($data['code']), $data['description'] ?? '']);
        respond(['id' => $id, 'name' => $data['name'], 'code' => strtoupper($data['code'])], 201);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
