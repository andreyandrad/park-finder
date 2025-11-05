<?php
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// -------------------------------------------------------------------------
// CONFIGURAÇÕES DO BANCO DE DADOS
// -------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'db_estacionamento_saas'); // <- ATUALIZE AQUI
define('DB_USER', 'root'); // <- ATUALIZE AQUI
define('DB_PASS', ''); // <- ATUALIZE AQUI
define('DB_CHARSET', 'utf8mb4');

// PRECO_POR_HORA FOI REMOVIDO

// -------------------------------------------------------------------------
// CONEXÃO PDO
// -------------------------------------------------------------------------
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Falha na conexão com o banco de dados: ' . $e->getMessage()]);
    exit;
}

// -------------------------------------------------------------------------
// CABEÇALHOS GLOBAIS DA API
// -------------------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -------------------------------------------------------------------------
// FUNÇÕES AUXILIARES DE AUTENTICAÇÃO E PERMISSÃO (NOVAS)
// -------------------------------------------------------------------------

/**
 * Retorna o ID do usuário logado, ou null se não estiver logado.
 */
function get_user_id()
{
    return $_SESSION['user_id'] ?? null;
}

/**
 * Retorna o Papel (role) do usuário logado.
 */
function get_user_role()
{
    return $_SESSION['role'] ?? null;
}

/**
 * Verifica se o usuário é Super Admin.
 */
function is_superadmin()
{
    return get_user_role() === 'superadmin';
}

/**
 * Verifica se o usuário está logado. Se não, encerra a requisição.
 */
function check_auth()
{
    if (!get_user_id()) {
        http_response_code(401); // Não autorizado
        echo json_encode(['status' => 'error', 'message' => 'Acesso não autorizado. Faça login.']);
        exit;
    }
}

/**
 * Verifica se o usuário tem permissão para gerenciar um estacionamento.
 * (Super Admins podem tudo; Gerentes são verificados na tabela pivô).
 */
function check_permission_for_estacionamento($pdo, $id_estacionamento)
{
    check_auth(); // Primeiro, verifica se está logado

    if (is_superadmin()) {
        return true; // Super admin pode
    }

    // Se for gerente, verifica na tabela pivô
    $stmt = $pdo->prepare("
        SELECT 1 FROM gerentes_estacionamentos 
        WHERE id_usuario_fk = ? AND id_estacionamento_fk = ?
    ");
    $stmt->execute([get_user_id(), $id_estacionamento]);

    if ($stmt->fetch()) {
        return true; // É gerente deste estacionamento
    }

    // Se chegou aqui, não tem permissão
    http_response_code(403); // Proibido (Forbidden)
    echo json_encode(['status' => 'error', 'message' => 'Você não tem permissão para acessar este recurso.']);
    exit;
}

/**
 * Verifica permissão para uma Vaga (encontrando o estacionamento dela).
 */
function check_permission_for_vaga($pdo, $id_vaga)
{
    // Descobre a qual estacionamento esta vaga pertence
    $stmt = $pdo->prepare("SELECT id_estacionamento_fk FROM vagas WHERE id_vaga = ?");
    $stmt->execute([$id_vaga]);
    $vaga = $stmt->fetch();

    if (!$vaga) {
        http_response_code(404); // Não Encontrado
        echo json_encode(['status' => 'error', 'message' => 'Vaga não encontrada.']);
        exit;
    }

    // Reutiliza a função de permissão do estacionamento
    return check_permission_for_estacionamento($pdo, $vaga['id_estacionamento_fk']);
}

/**
 * Verifica permissão para um Registro/Log (encontrando o estacionamento dele).
 */
function check_permission_for_registro($pdo, $id_registro)
{
    $stmt = $pdo->prepare("
        SELECT v.id_estacionamento_fk 
        FROM registros r
        JOIN vagas v ON r.id_vaga_fk = v.id_vaga
        WHERE r.id_registro = ?
    ");
    $stmt->execute([$id_registro]);
    $registro = $stmt->fetch();

    if (!$registro) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Registro não encontrado.']);
        exit;
    }

    return check_permission_for_estacionamento($pdo, $registro['id_estacionamento_fk']);
}
?>