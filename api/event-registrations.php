<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$regId = $_GET['id'] ?? '';
$eventId = $_GET['event_id'] ?? '';
$token = $_GET['token'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'verify' && $token) {
            // ═══ Verify pass token (security scans this) ═══
            $stmt = $db->prepare("SELECT er.*, e.name as event_name, e.event_date, e.event_time, e.venue
                FROM event_registrations er
                JOIN events e ON er.event_id = e.id
                WHERE er.pass_token = ?");
            $stmt->execute([$token]);
            $reg = $stmt->fetch();
            if (!$reg) respond(['error' => 'Invalid pass token'], 404);

            // Check if already checked in
            $ciStmt = $db->prepare("SELECT * FROM event_checkins WHERE registration_id = ? AND status = 'INSIDE'");
            $ciStmt->execute([$reg['id']]);
            $reg['is_inside'] = (bool)$ciStmt->fetch();

            respond($reg);

        } elseif ($eventId) {
            // ═══ List registrations for an event ═══
            $stmt = $db->prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY created_at DESC");
            $stmt->execute([$eventId]);
            respond($stmt->fetchAll());

        } elseif ($action === 'pending') {
            // ═══ All pending registrations across all events (for admin) ═══
            $stmt = $db->query("SELECT er.*, e.name as event_name, e.event_date
                FROM event_registrations er
                JOIN events e ON er.event_id = e.id
                WHERE er.approval_status = 'PENDING'
                ORDER BY er.created_at DESC");
            respond($stmt->fetchAll());
        }

        respond(['error' => 'Invalid request'], 400);
        break;

    case 'POST':
        $data = getInput();

        if ($action === 'register') {
            // ═══ Submit event registration (visitor form) ═══
            if (empty($data['event_id']) || empty($data['visitor_name']) || empty($data['visitor_email']) || empty($data['visitor_phone'])) {
                respond(['error' => 'Name, email, and phone are required'], 400);
            }

            // Check event exists and is active
            $evtStmt = $db->prepare("SELECT * FROM events WHERE id = ? AND status = 'ACTIVE'");
            $evtStmt->execute([$data['event_id']]);
            $event = $evtStmt->fetch();
            if (!$event) respond(['error' => 'Event not found or not active'], 404);

            // Check max participants
            if ($event['max_participants'] > 0) {
                $countStmt = $db->prepare("SELECT COUNT(*) FROM event_registrations WHERE event_id = ?");
                $countStmt->execute([$event['id']]);
                if ($countStmt->fetchColumn() >= $event['max_participants']) {
                    respond(['error' => 'Event is full. Registration closed.'], 400);
                }
            }

            // Check duplicate registration
            $dupStmt = $db->prepare("SELECT COUNT(*) FROM event_registrations WHERE event_id = ? AND (visitor_email = ? OR visitor_phone = ?)");
            $dupStmt->execute([$event['id'], $data['visitor_email'], $data['visitor_phone']]);
            if ($dupStmt->fetchColumn() > 0) {
                respond(['error' => 'You have already registered for this event.'], 400);
            }

            // CHECK BLACKLIST
            $blkStmt = $db->prepare("SELECT COUNT(*) FROM blacklist WHERE phone = ?");
            $blkStmt->execute([$data['visitor_phone']]);
            if ($blkStmt->fetchColumn() > 0) {
                respond(['error' => 'Registration denied.'], 403);
            }

            $id = generateId('ereg-');
            $stmt = $db->prepare("INSERT INTO event_registrations (id, event_id, visitor_name, visitor_email, visitor_phone, organization, designation, approval_status, created_at) VALUES (?,?,?,?,?,?,?,'PENDING',NOW())");
            $stmt->execute([
                $id, $event['id'], $data['visitor_name'], $data['visitor_email'],
                $data['visitor_phone'], $data['organization'] ?? '', $data['designation'] ?? ''
            ]);

            logAction('visitor', 'EVENT_REGISTRATION', 'event_registration', $id, [
                'event' => $event['name'], 'visitor' => $data['visitor_name']
            ]);

            // Notify admin
            $notifId = generateId('notif-');
            $notifStmt = $db->prepare("INSERT INTO notifications (id, user_id, type, title, message, data, created_at) VALUES (?,?,'event_registration',?,?,?,NOW())");
            $notifStmt->execute([
                $notifId, $event['created_by'] ?? 'admin',
                'New Event Registration',
                $data['visitor_name'] . ' registered for ' . $event['name'],
                json_encode(['registration_id' => $id, 'event_id' => $event['id']])
            ]);

            respond(['success' => true, 'registration_id' => $id, 'message' => 'Registration submitted! You will receive an email once approved.'], 201);

        } elseif ($action === 'approve' && $regId) {
            // ═══ Approve registration → generate pass token ═══
            $passToken = bin2hex(random_bytes(16));

            $stmt = $db->prepare("UPDATE event_registrations SET approval_status='APPROVED', pass_token=?, approved_by=?, approval_time=NOW() WHERE id=?");
            $stmt->execute([$passToken, $data['approved_by'] ?? 'admin', $regId]);

            // Get registration details for email
            $regStmt = $db->prepare("SELECT er.*, e.name as event_name, e.event_date, e.event_time, e.venue
                FROM event_registrations er
                JOIN events e ON er.event_id = e.id
                WHERE er.id = ?");
            $regStmt->execute([$regId]);
            $reg = $regStmt->fetch();

            $passUrl = '/event-pass.html?token=' . $passToken;

            // Simulate email by logging (in production, use PHPMailer/SMTP)
            logAction($data['approved_by'] ?? 'admin', 'EVENT_APPROVAL', 'event_registration', $regId, [
                'visitor' => $reg['visitor_name'] ?? '', 'pass_token' => $passToken,
                'email_to' => $reg['visitor_email'] ?? '', 'pass_url' => $passUrl
            ]);

            respond([
                'success' => true,
                'pass_token' => $passToken,
                'pass_url' => $passUrl,
                'message' => 'Registration approved. Virtual ID Pass generated.',
                'visitor_email' => $reg['visitor_email'] ?? ''
            ]);

        } elseif ($action === 'reject' && $regId) {
            // ═══ Reject registration ═══
            $stmt = $db->prepare("UPDATE event_registrations SET approval_status='REJECTED', approved_by=?, rejection_reason=?, approval_time=NOW() WHERE id=?");
            $stmt->execute([$data['approved_by'] ?? 'admin', $data['reason'] ?? '', $regId]);
            respond(['success' => true, 'message' => 'Registration rejected']);
        }

        respond(['error' => 'Invalid action'], 400);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
