<?php
include 'config.php';
check_auth(); // Protegido!

$method = $_SERVER['REQUEST_METHOD'];

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
            GROUP BY 
                e.id_estacionamento, e.nome, e.endereco
            ORDER BY 
                e.nome ASC
        ";
        $stmt = $pdo->query($sql);
        $estacionamentos = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode($estacionamentos);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar estacionamentos: ' . $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // --- CRIAR NOVO ESTACIONAMENTO E SUAS VAGAS ---
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['nome']) || !isset($data['qtd_carro']) || !isset($data['qtd_moto']) || !isset($data['qtd_pcd'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Nome e quantidades de vagas (carro, moto, pcd) são obrigatórios.']);
        exit;
    }

    $nome = $data['nome'];
    $endereco = $data['endereco'] ?? null;
    $qtd_carro = (int) $data['qtd_carro'];
    $qtd_moto = (int) $data['qtd_moto'];
    $qtd_pcd = (int) $data['qtd_pcd'];

    $pdo->beginTransaction();
    try {
        // 1. Inserir o estacionamento
        $stmt_est = $pdo->prepare("INSERT INTO estacionamentos (nome, endereco) VALUES (?, ?)");
        $stmt_est->execute([$nome, $endereco]);
        $id_estacionamento = $pdo->lastInsertId();

        // 2. Preparar a query para inserir vagas
        $stmt_vaga = $pdo->prepare("
            INSERT INTO vagas (id_estacionamento_fk, identificador, tipo) 
            VALUES (?, ?, ?)
        ");

        // 3. Loop para criar vagas de Carro
        for ($i = 1; $i <= $qtd_carro; $i++) {
            $stmt_vaga->execute([$id_estacionamento, 'C' . $i, 'carro']);
        }
        // 4. Loop para criar vagas de Moto
        for ($i = 1; $i <= $qtd_moto; $i++) {
            $stmt_vaga->execute([$id_estacionamento, 'M' . $i, 'moto']);
        }
        // 5. Loop para criar vagas de PCD
        for ($i = 1; $i <= $qtd_pcd; $i++) {
            $stmt_vaga->execute([$id_estacionamento, 'P' . $i, 'pcd']);
        }

        $pdo->commit();
        http_response_code(201); // Created
        echo json_encode(['status' => 'success', 'message' => 'Estacionamento e vagas criados com sucesso!', 'id_estacionamento' => $id_estacionamento]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao criar estacionamento: ' . $e->getMessage()]);
    }
}
?>