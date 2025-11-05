<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['username']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Usuário e senha são obrigatórios.']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        throw new Exception('Usuário ou senha inválidos.');
    }

    // Senha correta! Iniciar sessão.
    session_regenerate_id(true);

    $_SESSION['user_id'] = $user['id_usuario'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role']; // <- MUITO IMPORTANTE

    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Login bem-sucedido!',
        'username' => $user['username'],
        'role' => $user['role'] // Envia o papel para o JS
    ]);

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>