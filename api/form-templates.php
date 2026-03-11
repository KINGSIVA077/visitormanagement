<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

$templateId = $_GET['id'] ?? '';
$category = $_GET['category'] ?? '';

switch ($method) {
    case 'GET':
        if ($templateId) {
            // Get single template
            $stmt = $db->prepare('SELECT * FROM form_templates WHERE id = ?');
            $stmt->execute([$templateId]);
            $row = $stmt->fetch();
            if (!$row) respond(['error' => 'Template not found'], 404);
            $row['fields'] = json_decode($row['fields'], true);
            respond($row);
        } else {
            // Get all templates
            $sql = 'SELECT * FROM form_templates';
            $params = [];
            if ($category) { $sql .= ' WHERE category = ?'; $params[] = $category; }
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $r['fields'] = json_decode($r['fields'], true);
            }
            respond($rows);
        }
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['name']) || empty($data['category']) || empty($data['fields'])) {
            respond(['error' => 'Missing required fields'], 400);
        }
        $id = generateId('tmpl-');
        $stmt = $db->prepare('INSERT INTO form_templates (id, name, category, description, fields, is_default) VALUES (?, ?, ?, ?, ?, 0)');
        // Ensure fields is valid JSON string
        $fieldsJson = is_string($data['fields']) ? $data['fields'] : json_encode($data['fields']);
        $stmt->execute([$id, $data['name'], $data['category'], $data['description'] ?? '', $fieldsJson]);
        respond(['id' => $id, 'name' => $data['name']], 201);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
