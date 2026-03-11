<?php
require_once __DIR__ . '/config.php';
$db = getDB();

try {
    // 1. Total Visitors (Today)
    $stmt = $db->query("SELECT COUNT(*) as count FROM checkins WHERE DATE(checkin_time) = CURDATE()");
    $today = $stmt->fetch()['count'];

    // 2. Inside Now
    $stmt = $db->query("SELECT COUNT(*) as count FROM checkins WHERE status = 'INSIDE'");
    $inside = $stmt->fetch()['count'];

    // 3. Dept-wise breakdown
    $stmt = $db->query("SELECT d.name, COUNT(vr.id) as count 
        FROM visitor_requests vr 
        JOIN departments d ON vr.department_id = d.id 
        GROUP BY d.id");
    $deptStats = $stmt->fetchAll();

    // 4. Purpose breakdown
    // We need to parse json_decode(form_data)->purpose
    $stmt = $db->query("SELECT form_data FROM visitor_requests");
    $rows = $stmt->fetchAll();
    $purposes = [];
    foreach ($rows as $row) {
        $data = json_decode($row['form_data'], true);
        $p = $data['purpose'] ?? 'Other';
        $purposes[$p] = ($purposes[$p] ?? 0) + 1;
    }
    $purposeStats = [];
    foreach ($purposes as $name => $count) {
        $purposeStats[] = ['name' => $name, 'count' => $count];
    }

    // 5. Recent Activity
    $stmt = $db->query("SELECT vr.visitor_name, vr.created_at, vr.approval_status 
        FROM visitor_requests vr 
        ORDER BY vr.created_at DESC LIMIT 10");
    $recent = $stmt->fetchAll();

    respond([
        'stats' => [
            'today' => $today,
            'inside' => $inside,
            'departments' => count($deptStats),
            'staff' => (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'staff'")->fetchColumn()
        ],
        'deptBreakdown' => $deptStats,
        'purposeBreakdown' => $purposeStats,
        'recentActivity' => $recent
    ]);

} catch (PDOException $e) {
    respond(['error' => $e->getMessage()], 500);
}
