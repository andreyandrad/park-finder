<?php
// Inicia a sessão em TODAS as páginas da API
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// -------------------------------------------------------------------------
// CONFIGURAÇÕES DO BANCO DE DADOS
// -------------------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'db_estacionamento_pro'); // ATUALIZE AQUI
define('DB_USER', 'root'); // ATUALIZE AQUI
define('DB_PASS', ''); // ATUALIZE AQUI
define('DB_CHARSET', 'utf8mb4');

// -------------------------------------------------------------------------
// CONFIGURAÇÃO DA TARIFAÇÃO
// -------------------------------------------------------------------------
define('PRECO_POR_HORA', 10.00); // R$ 10,00 por hora

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
// ATENÇÃO: Em produção, mude '*' para o seu domínio real (ex: 'http://meusite.com')
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true'); // Necessário para sessões

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -------------------------------------------------------------------------
// FUNÇÃO AUXILIAR DE AUTENTICAÇÃO
// -------------------------------------------------------------------------
/**
 * Verifica se o usuário está logado.
 * Deve ser chamada no início de todos os endpoints protegidos.
 */
function check_auth()
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401); // Não autorizado
        echo json_encode(['status' => 'error', 'message' => 'Acesso não autorizado. Faça login.']);
        exit;
    }
}
?>