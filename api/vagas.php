<?php
include 'config.php';
check_auth();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    if (empty($_GET['id_est'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID do estacionamento é obrigatório.']);
        exit;
    }
    $id_est = $_GET['id_est'];

    // --- LÓGICA DE SUGESTÃO DE VAGA (NOVA) ---
    if (isset($_GET['suggest_next'])) {
        $tipo = $_GET['suggest_next']; // 'carro', 'moto', 'pcd'
        $prefixo = strtoupper(substr($tipo, 0, 1)); // C, M, P

        check_permission_for_estacionamento($pdo, $id_est);

        // Busca a vaga com o maior número para esse prefixo
        $stmt = $pdo->prepare("
            SELECT identificador FROM vagas 
            WHERE id_estacionamento_fk = ? AND identificador LIKE ? 
            ORDER BY CAST(SUBSTRING(identificador, 2) AS UNSIGNED) DESC 
            LIMIT 1
        ");
        $stmt->execute([$id_est, $prefixo . '%']);
        $ultima_vaga = $stmt->fetch();

        $proximo_numero = 1;
        if ($ultima_vaga) {
            $ultimo_numero = (int) substr($ultima_vaga['identificador'], 1);
            $proximo_numero = $ultimo_numero + 1;
        }

        echo json_encode(['sugestao' => $prefixo . $proximo_numero]);
        exit;
    }

    // --- LISTAR VAGAS (para edição) ---
    check_permission_for_estacionamento($pdo, $id_est);
    $stmt = $pdo->prepare("SELECT * FROM vagas WHERE id_estacionamento_fk = ? ORDER BY tipo, identificador");
    $stmt->execute([$id_est]);
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    // --- CRIAR VAGA INDIVIDUAL ---
    // (Sem alterações)
    if (empty($data['id_estacionamento']) || empty($data['identificador']) || empty($data['tipo'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID do estacionamento, identificador e tipo são obrigatórios.']);
        exit;
    }
    check_permission_for_estacionamento($pdo, $data['id_estacionamento']);

    try {
        $stmt = $pdo->prepare("INSERT INTO vagas (id_estacionamento_fk, identificador, tipo) VALUES (?, ?, ?)");
        $stmt->execute([$data['id_estacionamento'], $data['identificador'], $data['tipo']]);
        $id_vaga = $pdo->lastInsertId();

        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Vaga criada com sucesso.', 'id_vaga' => $id_vaga]);
    } catch (Exception $e) {
        http_response_code(500);
        if ($e->getCode() == 23000) {
            echo json_encode(['status' => 'error', 'message' => 'Erro: Já existe uma vaga com este identificador neste estacionamento.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Erro ao criar vaga: ' . $e->getMessage()]);
        }
    }

} elseif ($method === 'PUT') {
    // --- EDITAR VAGA (Nome/Tipo) OU (Status) ---
    if (empty($data['id_vaga'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID da vaga é obrigatório.']);
        exit;
    }

    $id_vaga = $data['id_vaga'];
    check_permission_for_vaga($pdo, $id_vaga);

    try {
        if (isset($data['action']) && $data['action'] == 'toggle_manutencao') {
            // --- AÇÃO: TOGGLE MODO MANUTENÇÃO ---
            $stmt = $pdo->prepare("SELECT status FROM vagas WHERE id_vaga = ?");
            $stmt->execute([$id_vaga]);
            $vaga = $stmt->fetch();

            // LÓGICA DO TOGGLE: manutencao -> livre, livre/ocupada -> manutencao
            $novo_status = ($vaga['status'] === 'manutencao') ? 'livre' : 'manutencao';

            $stmt_update = $pdo->prepare("UPDATE vagas SET status = ? WHERE id_vaga = ?");
            $stmt_update->execute([$novo_status, $id_vaga]);

            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Status da vaga atualizado.', 'novo_status' => $novo_status]);

        } elseif (isset($data['identificador']) && isset($data['tipo'])) {
            // --- AÇÃO: EDITAR IDENTIFICADOR/TIPO ---
            // (Sem alterações)
            $stmt = $pdo->prepare("UPDATE vagas SET identificador = ?, tipo = ? WHERE id_vaga = ?");
            $stmt->execute([$data['identificador'], $data['tipo'], $id_vaga]);

            http_response_code(200);
            echo json_encode(['status' => 'success', 'message' => 'Vaga atualizada com sucesso.']);
        } else {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Ação ou dados inválidos para PUT.']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        if ($e->getCode() == 23000) {
            echo json_encode(['status' => 'error', 'message' => 'Erro: Já existe uma vaga com este identificador.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar vaga: ' . $e->getMessage()]);
        }
    }

} elseif ($method === 'DELETE') {
    // --- EXCLUIR VAGA ---
    // (Sem alterações)
    if (empty($_GET['id_vaga'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID da vaga é obrigatório.']);
        exit;
    }
    $id_vaga = $_GET['id_vaga'];
    check_permission_for_vaga($pdo, $id_vaga);

    try {
        $stmt = $pdo->prepare("DELETE FROM vagas WHERE id_vaga = ?");
        $stmt->execute([$id_vaga]);

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Vaga excluída com sucesso.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao excluir vaga: ' . $e->getMessage()]);
    }
}
?>