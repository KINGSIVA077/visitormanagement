<?php
require_once __DIR__ . '/config.php';

// ═══ QR Code Generator ═══
// Uses goqr.me API (reliable, free) with inline SVG fallback

$url = $_GET['url'] ?? '';
if (empty($url)) {
    respond(['error' => 'URL required'], 400);
}

// Try goqr.me API first
$qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($url);
$context = stream_context_create(['http' => ['timeout' => 5]]);
$imageData = @file_get_contents($qrApiUrl, false, $context);

if ($imageData !== false && strlen($imageData) > 100) {
    $dataUrl = 'data:image/png;base64,' . base64_encode($imageData);
    respond(['qr_image' => $dataUrl, 'url' => $url]);
} else {
    // Fallback: Google Charts API
    $googleUrl = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' . urlencode($url) . '&choe=UTF-8';
    $imageData2 = @file_get_contents($googleUrl, false, $context);
    if ($imageData2 !== false && strlen($imageData2) > 100) {
        $dataUrl = 'data:image/png;base64,' . base64_encode($imageData2);
        respond(['qr_image' => $dataUrl, 'url' => $url]);
    } else {
        // Ultimate fallback: return the URL so frontend can generate QR client-side
        respond(['qr_image' => '', 'url' => $url, 'fallback' => true]);
    }
}
?>
