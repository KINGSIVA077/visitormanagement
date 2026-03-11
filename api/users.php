<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Parse path: /api/users.php or /api/users.php?dept_id=xxx or /api/users.php?action=availability&id=xxx
$action = $_GET['action'] ?? '';
$userId = $_GET['id'] ?? '';
$deptId = $_GET['dept_id'] ?? '';
$role   = $_GET['role'] ?? '';

switch ($method) {
    case 'GET':
        if ($deptId) {
            // Get staff by department
            $stmt = $db->prepare('SELECT id, name, designation, availability_status FROM users WHERE department_id = ? AND role = "staff" AND is_active = 1 ORDER BY name');
            $stmt->execute([$deptId]);
            respond($stmt->fetchAll());
        } elseif ($role) {
            $stmt = $db->prepare('SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.role = ? AND u.is_active = 1');
            $stmt->execute([$role]);
            respond($stmt->fetchAll());
        } else {
            $stmt = $db->query('SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id ORDER BY u.name');
            respond($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = getInput();

        if ($action === 'availability' && $userId) {
            // Update availability
            $stmt = $db->prepare('UPDATE users SET availability_status = ? WHERE id = ?');
            $stmt->execute([$data['status'] ?? 'available', $userId]);
            respond(['success' => true]);
        }

        // Create new user
        if (empty($data['name']) || empty($data['email'])) {
            respond(['error' => 'Name and email required'], 400);
        }
        $id = generateId(($data['role'] ?? 'staff') . '-');
        $stmt = $db->prepare('INSERT INTO users (id, email, phone, name, role, department_id, designation, is_active, availability_status) VALUES (?,?,?,?,?,?,?,1,"available")');
        $stmt->execute([
            $id,
            $data['email'],
            $data['phone'] ?? '',
            $data['name'],
            $data['role'] ?? 'staff',
            $data['department_id'] ?? null,
            $data['designation'] ?? ''
        ]);
        respond(['id' => $id, 'name' => $data['name'], 'email' => $data['email'], 'role' => $data['role'] ?? 'staff'], 201);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
