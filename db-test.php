<?php
require_once __DIR__ . '/api/config.php';
try {
    $db = getDB();
    echo json_encode(['status' => 'success', 'tables' => $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN)]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
