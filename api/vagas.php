<?php
include 'config.php';
check_auth(); // Protegido!

// Validar se o ID do estacionamento foi passado
if (empty($_GET['id_est'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID do estacionamento é obrigatório.']);
    exit;
}
$id_estacionamento = $_GET['id_est'];

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Query modificada para buscar vagas de um estacionamento específico
        $sql = "
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

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id_estacionamento]);
        $vagas = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode($vagas);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Erro ao buscar vagas: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Método não permitido']);
}
?>