<?php
include 'config.php';
check_auth(); // Protegido!

if (empty($_GET['id_est'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID do estacionamento é obrigatório.']);
    exit;
}
$id_estacionamento = $_GET['id_est'];

// Verifica se o usuário tem permissão para VER este monitor
check_permission_for_estacionamento($pdo, $id_estacionamento);

try {
    // 1. Buscar as Vagas
    $sql_vagas = "
        SELECT 
            v.*, 
            r.id_registro, 
            r.data_hora_entrada 
        FROM 
            vagas v
        LEFT JOIN 
            registros r ON v.id_vaga = r.id_vaga_fk AND r.data_hora_saida IS NULL
        WHERE
            v.id_estacionamento_fk = ?
        ORDER BY 
            v.tipo, v.identificador ASC
    ";
    $stmt_vagas = $pdo->prepare($sql_vagas);
    $stmt_vagas->execute([$id_estacionamento]);
    $vagas = $stmt_vagas->fetchAll();

    // 2. Buscar os KPIs (NOVO)
    $sql_kpis = "
        SELECT 
            COUNT(id_vaga) AS total,
            SUM(CASE WHEN status = 'livre' THEN 1 ELSE 0 END) AS livre,
            SUM(CASE WHEN status = 'ocupada' THEN 1 ELSE 0 END) AS ocupada,
            SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) AS manutencao
        FROM vagas
        WHERE id_estacionamento_fk = ?
    ";
    $stmt_kpis = $pdo->prepare($sql_kpis);
    $stmt_kpis->execute([$id_estacionamento]);
    $kpis = $stmt_kpis->fetch();

    // 3. Montar a resposta
    $resposta = [
        'kpis' => [
            'total' => (int) $kpis['total'],
            'livre' => (int) $kpis['livre'],
            'ocupada' => (int) $kpis['ocupada'],
            'manutencao' => (int) $kpis['manutencao']
        ],
        'vagas' => $vagas
    ];

    http_response_code(200);
    echo json_encode($resposta); // Retorna o objeto combinado

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar dados do monitor: ' . $e->getMessage()]);
}
?>