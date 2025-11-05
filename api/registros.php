<?php
include 'config.php';
check_auth(); // Protegido!

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    // --- Check-in do Sensor ---
    if (empty($data['id_vaga'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'id_vaga é obrigatório.']);
        exit;
    }

    $id_vaga = $data['id_vaga'];
    check_permission_for_vaga($pdo, $id_vaga); // Verifica se o usuário pode operar esta vaga

    $pdo->beginTransaction();
    try {
        $sql_insert = "INSERT INTO registros (id_vaga_fk, data_hora_entrada) VALUES (?, NOW())";
        $stmt_insert = $pdo->prepare($sql_insert);
        $stmt_insert->execute([$id_vaga]);

        $sql_update = "UPDATE vagas SET status = 'ocupada' WHERE id_vaga = ?";
        $stmt_update = $pdo->prepare($sql_update);
        $stmt_update->execute([$id_vaga]);

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['status' => 'success', 'message' => 'Check-in realizado!']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao fazer check-in: ' . $e->getMessage()]);
    }

} elseif ($method === 'PUT') {
    // --- Check-out do Sensor ---
    if (empty($data['id_registro'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'id_registro é obrigatório.']);
        exit;
    }

    $id_registro = $data['id_registro'];
    check_permission_for_registro($pdo, $id_registro); // Verifica permissão

    $pdo->beginTransaction();
    try {
        // Lógica de cálculo de valor FOI REMOVIDA

        // 1. Apenas atualiza o registro com a data de saída
        $sql_update_reg = "UPDATE registros SET data_hora_saida = NOW() WHERE id_registro = ?";
        $stmt_update_reg = $pdo->prepare($sql_update_reg);
        $stmt_update_reg->execute([$id_registro]);

        // 2. Descobre qual vaga liberar
        $stmt_get_vaga = $pdo->prepare("SELECT id_vaga_fk FROM registros WHERE id_registro = ?");
        $stmt_get_vaga->execute([$id_registro]);
        $vaga = $stmt_get_vaga->fetch();

        if ($vaga) {
            $id_vaga = $vaga['id_vaga_fk'];
            // 3. Atualiza o status da vaga para 'livre'
            $sql_update_vaga = "UPDATE vagas SET status = 'livre' WHERE id_vaga = ?";
            $stmt_update_vaga = $pdo->prepare($sql_update_vaga);
            $stmt_update_vaga->execute([$id_vaga]);
        }

        $pdo->commit();
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Check-out realizado!']);

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao fazer check-out: ' . $e->getMessage()]);
    }
}
?>