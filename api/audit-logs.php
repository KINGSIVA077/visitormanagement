<?php
require_once __DIR__ . '/config.php';
$db = getDB();

try {
    $stmt = $db->query("SELECT al.*, u.name as user_name 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ORDER BY al.created_at DESC LIMIT 50");
    respond($stmt->fetchAll());
} catch (PDOException $e) { respond(['error' => $e->getMessage()], 500); }
