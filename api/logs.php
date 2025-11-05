<?php
include 'config.php';
check_auth(); // Protegido!

try {
    $params = [];
    $sql = "
        SELECT 
            r.id_registro, r.data_hora_entrada, r.data_hora_saida,
            v.identificador AS vaga_identificador,
            e.nome AS estacionamento_nome
        FROM 
            registros r
        JOIN 
            vagas v ON r.id_vaga_fk = v.id_vaga
        JOIN 
            estacionamentos e ON v.id_estacionamento_fk = e.id_estacionamento
    ";

    if (!is_superadmin()) {
        // Se não for superadmin, filtra pelos estacionamentos do gerente
        $sql .= "
            JOIN gerentes_estacionamentos ge ON e.id_estacionamento = ge.id_estacionamento_fk
            WHERE ge.id_usuario_fk = ?
        ";
        $params[] = get_user_id();
    }

    $sql .= " ORDER BY r.data_hora_entrada DESC LIMIT 200";

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