<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$checkinId = $_GET['id'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'active') {
            // Get visitors currently inside
            $stmt = $db->query("SELECT c.*, vr.visitor_name, vr.visitor_phone, d.name as department_name, u.name as staff_name
                FROM checkins c
                JOIN visitor_requests vr ON c.visitor_request_id = vr.id
                LEFT JOIN departments d ON vr.department_id = d.id
                LEFT JOIN users u ON vr.staff_id = u.id
                WHERE c.status = 'INSIDE'
                ORDER BY c.checkin_time DESC");
            respond($stmt->fetchAll());
        }
        respond(['error' => 'Invalid action'], 400);
        break;

    case 'POST':
        $data = getInput();

        if ($action === 'checkout' && $checkinId) {
            // ═══ Check-out ═══
            $stmt = $db->prepare('SELECT * FROM checkins WHERE id = ?');
            $stmt->execute([$checkinId]);
            $checkin = $stmt->fetch();
            if (!$checkin) respond(['error' => 'Check-in not found'], 404);

            $checkinTime = new DateTime($checkin['checkin_time']);
            $now = new DateTime();
            $duration = round(($now->getTimestamp() - $checkinTime->getTimestamp()) / 60);

            $stmt = $db->prepare("UPDATE checkins SET checkout_time = NOW(), duration_minutes = ?, security_checkout_id = ?, status = 'EXITED' WHERE id = ?");
            $stmt->execute([$duration, $data['security_id'] ?? '', $checkinId]);

            // Destroy QR session
            if ($checkin['session_id']) {
                $db->prepare("UPDATE visitor_sessions SET status = 'DESTROYED' WHERE id = ?")->execute([$checkin['session_id']]);
            }

            respond(['success' => true, 'checkout_time' => $now->format('c'), 'duration_minutes' => $duration]);

        } else {
            // ═══ Check-in ═══
            if (empty($data['visitor_request_id']) || empty($data['security_id'])) {
                respond(['error' => 'Missing required fields'], 400);
            }
            $id = generateId('checkin-');
            $stmt = $db->prepare("INSERT INTO checkins (id, visitor_request_id, session_id, checkin_time, security_checkin_id, gate_location, status, created_at) VALUES (?,?,?,NOW(),?,?,'INSIDE',NOW())");
            $stmt->execute([
                $id, $data['visitor_request_id'], $data['session_id'] ?? '',
                $data['security_id'], $data['gate_location'] ?? 'Main Gate'
            ]);
            respond(['success' => true, 'checkin_id' => $id]);
        }
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
