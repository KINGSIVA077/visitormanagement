<?php
require_once __DIR__ . '/config.php';
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$requestId = $_GET['id'] ?? '';
$staffId = $_GET['staff_id'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'pending') {
            // Get pending + approved requests (for security dashboard)
            $stmt = $db->query("SELECT vr.*, d.name as department_name, u.name as staff_name
                FROM visitor_requests vr
                LEFT JOIN departments d ON vr.department_id = d.id
                LEFT JOIN users u ON vr.staff_id = u.id
                WHERE vr.approval_status IN ('PENDING', 'APPROVED')
                ORDER BY vr.created_at DESC");
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $r['form_data'] = json_decode($r['form_data'], true) ?? [];
            }
            respond($rows);

        } elseif ($action === 'my-requests' && $staffId) {
            // Get staff's own requests
            $stmt = $db->prepare("SELECT vr.*, d.name as department_name
                FROM visitor_requests vr
                LEFT JOIN departments d ON vr.department_id = d.id
                WHERE vr.staff_id = ?
                ORDER BY vr.created_at DESC");
            $stmt->execute([$staffId]);
            $rows = $stmt->fetchAll();
            foreach ($rows as &$r) {
                $r['form_data'] = json_decode($r['form_data'], true) ?? [];
            }
            respond($rows);
        }
        respond(['error' => 'Invalid action'], 400);
        break;

    case 'POST':
        $data = getInput();

        if ($action === 'submit') {
            // ═══ Submit visitor request ═══
            if (empty($data['session_id']) || empty($data['visitor_name']) || empty($data['visitor_phone']) || empty($data['staff_id'])) {
                respond(['error' => 'Missing required fields'], 400);
            }

            // CHECK BLACKLIST
            $stmtBlk = $db->prepare("SELECT COUNT(*) FROM blacklist WHERE phone = ?");
            $stmtBlk->execute([$data['visitor_phone']]);
            if ($stmtBlk->fetchColumn() > 0) {
                respond(['error' => 'Your phone number is blacklisted. Entry denied.'], 403);
            }

            $id = generateId('req-');
            $stmt = $db->prepare("INSERT INTO visitor_requests (id, session_id, visitor_name, visitor_phone, visitor_email, form_data, department_id, staff_id, approval_status, created_at) VALUES (?,?,?,?,?,?,?,?,'PENDING',NOW())");
            $stmt->execute([
                $id, $data['session_id'], $data['visitor_name'], $data['visitor_phone'],
                $data['visitor_email'] ?? '', json_encode($data['form_data'] ?? []),
                $data['department_id'] ?? null, $data['staff_id']
            ]);

            logAction($data['staff_id'], 'VISITOR_SUBMISSION', 'visitor_request', $id, ['visitor' => $data['visitor_name']]);

            // Mark session as USED
            $db->prepare("UPDATE visitor_sessions SET status = 'USED' WHERE id = ?")->execute([$data['session_id']]);

            // Create notification
            $notifId = generateId('notif-');
            $stmt = $db->prepare("INSERT INTO notifications (id, user_id, type, title, message, data, created_at) VALUES (?,?,'visitor_request',?,?,?,NOW())");
            $stmt->execute([
                $notifId, $data['staff_id'],
                'New Visitor Request',
                $data['visitor_name'] . ' wants to meet you',
                json_encode(['request_id' => $id, 'visitor_name' => $data['visitor_name']])
            ]);

            respond(['success' => true, 'request_id' => $id, 'message' => 'Request sent to staff', 'status' => 'PENDING'], 201);

        } elseif ($action === 'approve' && $requestId) {
            $stmt = $db->prepare("UPDATE visitor_requests SET approval_status = 'APPROVED', approved_by = ?, approval_time = NOW() WHERE id = ?");
            $stmt->execute([$data['staff_id'] ?? '', $requestId]);
            respond(['success' => true, 'message' => 'Request approved']);

        } elseif ($action === 'reject' && $requestId) {
            $stmt = $db->prepare("UPDATE visitor_requests SET approval_status = 'REJECTED', approved_by = ?, rejection_reason = ?, approval_time = NOW() WHERE id = ?");
            $stmt->execute([$data['staff_id'] ?? '', $data['reason'] ?? '', $requestId]);
            respond(['success' => true, 'message' => 'Request rejected']);
        }

        respond(['error' => 'Invalid action'], 400);
        break;

    default:
        respond(['error' => 'Method not allowed'], 405);
}
?>
