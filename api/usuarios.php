<?php
include 'config.php';
check_auth();

// APENAS SUPER ADMIN PODE GERENCIAR USUÁRIOS
if (!is_superadmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Apenas Super Admins podem gerenciar usuários.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    // --- Listar todos os usuários ---
    $stmt = $pdo->query("SELECT id_usuario, username, role FROM usuarios ORDER BY username");
    $usuarios = $stmt->fetchAll();

    // Para cada gerente, buscar seus estacionamentos
    foreach ($usuarios as $key => $user) {
        if ($user['role'] === 'gerente') {
            $stmt_est = $pdo->prepare("
                SELECT e.id_estacionamento, e.nome 
                FROM estacionamentos e
                JOIN gerentes_estacionamentos ge ON e.id_estacionamento = ge.id_estacionamento_fk
                WHERE ge.id_usuario_fk = ?
            ");
            $stmt_est->execute([$user['id_usuario']]);
            $usuarios[$key]['estacionamentos'] = $stmt_est->fetchAll();
        } else {
            $usuarios[$key]['estacionamentos'] = [];
        }
    }

    echo json_encode($usuarios);

} elseif ($method === 'POST') {
    // --- Criar novo usuário ---
    if (empty($data['username']) || empty($data['password']) || empty($data['role'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Usuário, senha e papel são obrigatórios.']);
        exit;
    }

    $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)");
        $stmt->execute([$data['username'], $password_hash, $data['role']]);
        $id_usuario = $pdo->lastInsertId();

        // Se for gerente, associar estacionamentos
        if ($data['role'] === 'gerente' && !empty($data['estacionamentos'])) {
            $stmt_assoc = $pdo->prepare("INSERT INTO gerentes_estacionamentos (id_usuario_fk, id_estacionamento_fk) VALUES (?, ?)");
            foreach ($data['estacionamentos'] as $id_est) {
                $stmt_assoc->execute([$id_usuario, $id_est]);
            }
        }

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Usuário criado com sucesso.']);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        if ($e->getCode() == 23000) {
            echo json_encode(['status' => 'error', 'message' => 'Erro: Nome de usuário já existe.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Erro ao criar usuário: ' . $e->getMessage()]);
        }
    }

} elseif ($method === 'PUT') {
    // --- Editar usuário ---
    if (empty($data['id_usuario']) || empty($data['username']) || empty($data['role'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID, usuário e papel são obrigatórios.']);
        exit;
    }

    $id_usuario = $data['id_usuario'];

    $pdo->beginTransaction();
    try {
        // Atualiza dados básicos
        if (!empty($data['password'])) {
            // Se uma nova senha foi fornecida, atualiza
            $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE usuarios SET username = ?, role = ?, password_hash = ? WHERE id_usuario = ?");
            $stmt->execute([$data['username'], $data['role'], $password_hash, $id_usuario]);
        } else {
            // Se não, atualiza só o resto
            $stmt = $pdo->prepare("UPDATE usuarios SET username = ?, role = ? WHERE id_usuario = ?");
            $stmt->execute([$data['username'], $data['role'], $id_usuario]);
        }

        // Limpa associações antigas
        $stmt_clear = $pdo->prepare("DELETE FROM gerentes_estacionamentos WHERE id_usuario_fk = ?");
        $stmt_clear->execute([$id_usuario]);

        // Adiciona novas associações (se for gerente)
        if ($data['role'] === 'gerente' && !empty($data['estacionamentos'])) {
            $stmt_assoc = $pdo->prepare("INSERT INTO gerentes_estacionamentos (id_usuario_fk, id_estacionamento_fk) VALUES (?, ?)");
            foreach ($data['estacionamentos'] as $id_est) {
                $stmt_assoc->execute([$id_usuario, $id_est]);
            }
        }

        $pdo->commit();
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Usuário atualizado com sucesso.']);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        if ($e->getCode() == 23000) {
            echo json_encode(['status' => 'error', 'message' => 'Erro: Nome de usuário já existe.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar usuário: ' . $e->getMessage()]);
        }
    }

} elseif ($method === 'DELETE') {
    // --- Excluir usuário ---
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID do usuário é obrigatório.']);
        exit;
    }

    $id_usuario = $_GET['id'];

    if ($id_usuario == get_user_id()) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Você não pode excluir a si mesmo.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id_usuario = ?");
        $stmt->execute([$id_usuario]);

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Usuário excluído com sucesso.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao excluir usuário: ' . $e->getMessage()]);
    }
}
?>