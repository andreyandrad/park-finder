<?php
include 'config.php'; // Inclui config, que inicia a sessão

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['username']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Usuário e senha são obrigatórios.']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

try {
    // 1. Encontrar o usuário
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        // Resposta genérica para segurança
        throw new Exception('Usuário ou senha inválidos.');
    }

    // 2. Verificar o hash da senha
    if (password_verify($password, $user['password_hash'])) {
        // 3. Senha correta! Iniciar sessão.
        // Regenera o ID da sessão para evitar "session fixation"
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id_usuario'];
        $_SESSION['username'] = $user['username'];

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Login bem-sucedido!',
            'username' => $user['username']
        ]);
    } else {
        throw new Exception('Usuário ou senha inválidos.');
    }

} catch (Exception $e) {
    http_response_code(401); // Não autorizado
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>