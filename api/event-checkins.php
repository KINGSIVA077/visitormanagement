<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$checkinId = $_GET['id'] ?? '';
$eventId = $_GET['event_id'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'active' && $eventId) {
            // Get currently checked-in visitors for an event
            $stmt = $db->prepare("SELECT ec.*, er.visitor_name, er.visitor_phone, er.visitor_email, er.organization
                FROM event_checkins ec
                JOIN event_registrations er ON ec.registration_id = er.id
                WHERE ec.event_id = ? AND ec.status = 'INSIDE'
                ORDER BY ec.checkin_time DESC");
            $stmt->execute([$eventId]);
            respond($stmt->fetchAll());

        } elseif ($action === 'active') {
            // Get ALL currently checked-in event visitors
            $stmt = $db->query("SELECT ec.*, er.visitor_name, er.visitor_phone, er.organization, e.name as event_name
                FROM event_checkins ec
                JOIN event_registrations er ON ec.registration_id = er.id
                JOIN events e ON ec.event_id = e.id
                WHERE ec.status = 'INSIDE'
                ORDER BY ec.checkin_time DESC");
            respond($stmt->fetchAll());

        } elseif ($action === 'history' && $eventId) {
            // Get all check-ins/outs for an event
            $stmt = $db->prepare("SELECT ec.*, er.visitor_name, er.visitor_phone
                FROM event_checkins ec
                JOIN event_registrations er ON ec.registration_id = er.id
                WHERE ec.event_id = ?
                ORDER BY ec.created_at DESC");
            $stmt->execute([$eventId]);
            respond($stmt->fetchAll());
        }

        respond(['error' => 'Invalid action'], 400);
        break;

    case 'POST':
        $data = getInput();

        if ($action === 'checkout' && $checkinId) {
            // ═══ Check-out ═══
            $stmt = $db->prepare('SELECT * FROM event_checkins WHERE id = ?');
            $stmt->execute([$checkinId]);
            $checkin = $stmt->fetch();
            if (!$checkin) respond(['error' => 'Check-in record not found'], 404);

            $checkinTime = new DateTime($checkin['checkin_time']);
            $now = new DateTime();
            $duration = round(($now->getTimestamp() - $checkinTime->getTimestamp()) / 60);

            $stmt = $db->prepare("UPDATE event_checkins SET checkout_time = NOW(), duration_minutes = ?, status = 'EXITED' WHERE id = ?");
            $stmt->execute([$duration, $checkinId]);

            logAction($data['security_id'] ?? '', 'EVENT_CHECKOUT', 'event_checkin', $checkinId, [
                'duration_minutes' => $duration
            ]);

            respond(['success' => true, 'checkout_time' => $now->format('c'), 'duration_minutes' => $duration]);

        } else {
            // ═══ Check-in ═══
            if (empty($data['registration_id']) || empty($data['event_id'])) {
                respond(['error' => 'Registration ID and Event ID required'], 400);
            }

            // Verify registration is approved
            $regStmt = $db->prepare("SELECT * FROM event_registrations WHERE id = ? AND approval_status = 'APPROVED'");
            $regStmt->execute([$data['registration_id']]);
            $reg = $regStmt->fetch();
            if (!$reg) respond(['error' => 'Registration not approved or not found'], 403);

            // Check if already inside
            $ciStmt = $db->prepare("SELECT COUNT(*) FROM event_checkins WHERE registration_id = ? AND status = 'INSIDE'");
            $ciStmt->execute([$data['registration_id']]);
            if ($ciStmt->fetchColumn() > 0) {
                respond(['error' => 'Visitor is already checked in'], 400);
            }

            $id = generateId('eci-');
            $stmt = $db->prepare("INSERT INTO event_checkins (id, registration_id, event_id, checkin_time, security_id, gate_location, status, created_at) VALUES (?,?,?,NOW(),?,?,'INSIDE',NOW())");
            $stmt->execute([
                $id, $data['registration_id'], $data['event_id'],
                $data['security_id'] ?? '', $data['gate_location'] ?? 'Main Gate'
            ]);

            logAction($data['security_id'] ?? '', 'EVENT_CHECKIN', 'event_checkin', $id, [
                'visitor' => $reg['visitor_name']
            ]);

            respond(['success' => true, 'checkin_id' => $id]);
        }
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
