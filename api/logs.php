<?php
include 'config.php';
check_auth(); // Protegido!

try {
    // Pega o ID do estacionamento (opcional, para filtrar)
    $id_est = $_GET['id_est'] ?? null;
    $params = [];

    $sql = "
        SELECT 
            r.id_registro, r.data_hora_entrada, r.data_hora_saida, r.valor_total,
            v.identificador AS vaga_identificador,
            e.nome AS estacionamento_nome
        FROM 
            registros r
        JOIN 
            vagas v ON r.id_vaga_fk = v.id_vaga
        JOIN 
            estacionamentos e ON v.id_estacionamento_fk = e.id_estacionamento
    ";

    if ($id_est) {
        $sql .= " WHERE e.id_estacionamento = ? ";
        $params[] = $id_est;
    }

    $sql .= " ORDER BY r.data_hora_entrada DESC LIMIT 200"; // Limita aos últimos 200 logs

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode($logs);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar logs: ' . $e->getMessage()]);
}
?>