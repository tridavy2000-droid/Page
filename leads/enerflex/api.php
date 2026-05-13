<?php
const URL = 'https://sendmelead.com/api/v3/lead/add';
$body = [
    'offerId' => '9f3ed64c-44f7-4608-ad95-41d805db5ccf',
    'ip' => $_SERVER['REMOTE_ADDR'],
    'name' => trim(htmlspecialchars($_POST['name'])),
    'phone' => trim(htmlspecialchars($_POST['phone'])),
    'clickid' => $_POST['sub1'],
    'utm_medium' => $_POST['sub2'],
    'utm_term' => trim(htmlspecialchars($_POST['name'])),
    'utm_content' => trim(htmlspecialchars($_POST['phone']))
];
$result = file_get_contents(URL, false, stream_context_create(['http' => [
    'method' => 'POST',
    'header' => [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($body)),
        'X-Token: ' .  '3dede3bd8f2c5bb88189d6f9fa440340',
    ],
    'content' => json_encode($body),
    'ignore_errors' => true
]]));

date_default_timezone_set('Etc/GMT-3');
$txt = PHP_EOL . 'LEAD' . PHP_EOL;
$txt .= date("F j, Y,H:i:s") . PHP_EOL;
foreach ($body as $key => $value) {
    $txt .= "$key: $value" . PHP_EOL;
}
$txt .= $result . PHP_EOL;
file_put_contents('lead.txt', $txt, FILE_APPEND);


print_r($result);
