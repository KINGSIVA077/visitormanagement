<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$eventId = $_GET['id'] ?? '';

switch ($method) {
    case 'GET':
        if ($eventId) {
            // Get single event by ID or QR token
            $stmt = $db->prepare("SELECT * FROM events WHERE id = ? OR qr_token = ?");
            $stmt->execute([$eventId, $eventId]);
            $event = $stmt->fetch();
            if (!$event) respond(['error' => 'Event not found'], 404);

            // Get registration count
            $countStmt = $db->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN approval_status='APPROVED' THEN 1 ELSE 0 END) as approved FROM event_registrations WHERE event_id = ?");
            $countStmt->execute([$event['id']]);
            $counts = $countStmt->fetch();
            $event['total_registrations'] = (int)$counts['total'];
            $event['approved_count'] = (int)$counts['approved'];

            // Generate QR URL for sharing
            $event['registration_url'] = '/event-register.html?event=' . $event['qr_token'];

            respond($event);
        }

        // List all events
        $stmt = $db->query("SELECT e.*, 
            (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as total_registrations,
            (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND approval_status='APPROVED') as approved_count
            FROM events e ORDER BY e.event_date DESC");
        respond($stmt->fetchAll());
        break;

    case 'POST':
        $data = getInput();
        if (empty($data['name']) || empty($data['event_date'])) {
            respond(['error' => 'Event name and date required'], 400);
        }

        $id = generateId('evt-');
        $qrToken = bin2hex(random_bytes(16)); // 32-char unique token

        $stmt = $db->prepare("INSERT INTO events (id, name, description, event_date, event_time, venue, max_participants, qr_token, status, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,NOW())");
        $stmt->execute([
            $id, $data['name'], $data['description'] ?? '',
            $data['event_date'], $data['event_time'] ?? null,
            $data['venue'] ?? '', $data['max_participants'] ?? 0,
            $qrToken, 'ACTIVE', $data['created_by'] ?? 'admin'
        ]);

        // Generate the registration URL
        $registrationUrl = '/event-register.html?event=' . $qrToken;

        logAction($data['created_by'] ?? 'admin', 'EVENT_CREATED', 'event', $id, ['name' => $data['name']]);

        respond([
            'success' => true,
            'id' => $id,
            'qr_token' => $qrToken,
            'registration_url' => $registrationUrl
        ], 201);
        break;

    case 'PUT':
        if (!$eventId) respond(['error' => 'Event ID required'], 400);
        $data = getInput();
        $stmt = $db->prepare("UPDATE events SET name=?, description=?, event_date=?, event_time=?, venue=?, max_participants=?, status=? WHERE id=?");
        $stmt->execute([
            $data['name'] ?? '', $data['description'] ?? '',
            $data['event_date'] ?? '', $data['event_time'] ?? null,
            $data['venue'] ?? '', $data['max_participants'] ?? 0,
            $data['status'] ?? 'ACTIVE', $eventId
        ]);
        respond(['success' => true]);
        break;

    case 'DELETE':
        if (!$eventId) respond(['error' => 'Event ID required'], 400);
        $db->prepare("DELETE FROM events WHERE id = ?")->execute([$eventId]);
        respond(['success' => true]);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
