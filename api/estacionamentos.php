<?php
include 'config.php';
check_auth(); // Protegido!

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    // --- LISTAR ESTACIONAMENTOS ---
    try {
        $sql = "
            SELECT 
                e.id_estacionamento, e.nome, e.endereco,
                COUNT(v.id_vaga) AS total_vagas,
                SUM(CASE WHEN v.status = 'ocupada' THEN 1 ELSE 0 END) AS vagas_ocupadas
            FROM 
                estacionamentos e
            LEFT JOIN 
                vagas v ON e.id_estacionamento = v.id_estacionamento_fk
        ";
        $params = [];

        if (!is_superadmin()) {
            // Se não for superadmin, filtra pelos estacionamentos do gerente
            $sql .= "
                JOIN gerentes_estacionamentos ge ON e.id_estacionamento = ge.id_estacionamento_fk
                WHERE ge.id_usuario_fk = ?
            ";
            $params[] = get_user_id();
        }

        $sql .= " GROUP BY e.id_estacionamento, e.nome, e.endereco ORDER BY e.nome ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $estacionamentos = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode($estacionamentos);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar estacionamentos: ' . $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // --- CRIAR NOVO ESTACIONAMENTO ---
    if (!is_superadmin()) { // Apenas Super Admin pode criar
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Apenas Super Admins podem criar estacionamentos.']);
        exit;
    }

    // (Lógica de criação idêntica à V1... o resto está no arquivo antigo)
    if (empty($data['nome']) || !isset($data['qtd_carro']) || !isset($data['qtd_moto']) || !isset($data['qtd_pcd'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Nome e quantidades de vagas são obrigatórios.']);
        exit;
    }
    // ... (O resto da lógica POST é igual)
    $nome = $data['nome'];
    $endereco = $data['endereco'] ?? null;
    $qtd_carro = (int) $data['qtd_carro'];
    $qtd_moto = (int) $data['qtd_moto'];
    $qtd_pcd = (int) $data['qtd_pcd'];
    $pdo->beginTransaction();
    try {
        $stmt_est = $pdo->prepare("INSERT INTO estacionamentos (nome, endereco) VALUES (?, ?)");
        $stmt_est->execute([$nome, $endereco]);
        $id_estacionamento = $pdo->lastInsertId();
        $stmt_vaga = $pdo->prepare("INSERT INTO vagas (id_estacionamento_fk, identificador, tipo) VALUES (?, ?, ?)");
        for ($i = 1; $i <= $qtd_carro; $i++)
            $stmt_vaga->execute([$id_estacionamento, 'C' . $i, 'carro']);
        for ($i = 1; $i <= $qtd_moto; $i++)
            $stmt_vaga->execute([$id_estacionamento, 'M' . $i, 'moto']);
        for ($i = 1; $i <= $qtd_pcd; $i++)
            $stmt_vaga->execute([$id_estacionamento, 'P' . $i, 'pcd']);
        $pdo->commit();
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Estacionamento e vagas criados com sucesso!', 'id_estacionamento' => $id_estacionamento]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao criar estacionamento: ' . $e->getMessage()]);
    }

} elseif ($method === 'PUT') {
    // --- EDITAR ESTACIONAMENTO (NOVO) ---
    if (empty($data['id_estacionamento']) || empty($data['nome'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID do estacionamento e nome são obrigatórios.']);
        exit;
    }

    $id_estacionamento = $data['id_estacionamento'];
    check_permission_for_estacionamento($pdo, $id_estacionamento); // Verifica permissão

    try {
        $stmt = $pdo->prepare("UPDATE estacionamentos SET nome = ?, endereco = ? WHERE id_estacionamento = ?");
        $stmt->execute([$data['nome'], $data['endereco'] ?? null, $id_estacionamento]);

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Estacionamento atualizado com sucesso.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar estacionamento: ' . $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    // --- EXCLUIR ESTACIONAMENTO (NOVO) ---
    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID do estacionamento é obrigatório.']);
        exit;
    }

    // Apenas Super Admin pode deletar
    if (!is_superadmin()) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Apenas Super Admins podem excluir estacionamentos.']);
        exit;
    }

    $id_estacionamento = $_GET['id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM estacionamentos WHERE id_estacionamento = ?");
        $stmt->execute([$id_estacionamento]);

        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Estacionamento excluído com sucesso.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao excluir estacionamento: ' . $e->getMessage()]);
    }
}
?>