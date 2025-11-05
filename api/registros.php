<?php
include 'config.php';
check_auth(); // Protegido!

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

// -------------------------------------------------------------------------
// ROTA: POST /api/registros.php (Check-in do Sensor)
// -------------------------------------------------------------------------
if ($method === 'POST') {

    if (empty($data['id_vaga'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'id_vaga é obrigatório.']);
        exit;
    }

    $id_vaga = $data['id_vaga'];

    $pdo->beginTransaction();

    try {
        // 1. Inserir o novo registro (sem placa)
        $sql_insert = "
            INSERT INTO registros 
                (id_vaga_fk, data_hora_entrada) 
            VALUES 
                (?, NOW())
        ";
        $stmt_insert = $pdo->prepare($sql_insert);
        $stmt_insert->execute([$id_vaga]);

        // 2. Atualizar o status da vaga para 'ocupada'
        $sql_update = "UPDATE vagas SET status = 'ocupada' WHERE id_vaga = ?";
        $stmt_update = $pdo->prepare($sql_update);
        $stmt_update->execute([$id_vaga]);

        $pdo->commit();

        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Check-in realizado com sucesso!']);

    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao fazer check-in: ' . $e->getMessage()]);
    }
}

// -------------------------------------------------------------------------
// ROTA: PUT /api/registros.php (Check-out do Sensor)
// -------------------------------------------------------------------------
else if ($method === 'PUT') {

    if (empty($data['id_registro'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'id_registro é obrigatório.']);
        exit;
    }

    $id_registro = $data['id_registro'];
    $pdo->beginTransaction();

    try {
        // 1. Buscar o registro
        $sql_select = "SELECT id_vaga_fk, data_hora_entrada FROM registros WHERE id_registro = ?";
        $stmt_select = $pdo->prepare($sql_select);
        $stmt_select->execute([$id_registro]);
        $registro = $stmt_select->fetch();

        if (!$registro) {
            throw new Exception("Registro $id_registro não encontrado.");
        }

        $id_vaga = $registro['id_vaga_fk'];
        $data_entrada = new DateTime($registro['data_hora_entrada']);
        $data_saida = new DateTime('now');

        // 2. Calcular o valor
        $diferenca_segundos = $data_saida->getTimestamp() - $data_entrada->getTimestamp();
        $horas_cobradas = ceil($diferenca_segundos / 3600);

        if ($horas_cobradas <= 0) {
            $horas_cobradas = 1; // Cobrar no mínimo 1 hora
        }

        $valor_total = $horas_cobradas * PRECO_POR_HORA;

        // 3. Atualizar o registro com a data de saída e o valor
        $sql_update_reg = "
            UPDATE registros 
            SET data_hora_saida = ?, valor_total = ? 
            WHERE id_registro = ?
        ";
        $stmt_update_reg = $pdo->prepare($sql_update_reg);
        $stmt_update_reg->execute([$data_saida->format('Y-m-d H:i:s'), $valor_total, $id_registro]);

        // 4. Atualizar o status da vaga de volta para 'livre'
        $sql_update_vaga = "UPDATE vagas SET status = 'livre' WHERE id_vaga = ?";
        $stmt_update_vaga = $pdo->prepare($sql_update_vaga);
        $stmt_update_vaga->execute([$id_vaga]);

        $pdo->commit();

        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Check-out realizado com sucesso!',
            'valor_cobrado' => $valor_total,
            'horas_cobradas' => $horas_cobradas
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao fazer check-out: ' . $e->getMessage()]);
    }
}
// -------------------------------------------------------------------------
// Se não for POST nem PUT
// -------------------------------------------------------------------------
else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Método não permitido']);
}
?>