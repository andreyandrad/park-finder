<?php
include 'config.php'; // Apenas para iniciar a sessão

// Destruir todas as variáveis de sessão.
$_SESSION = array();

// Apaga o cookie de sessão.
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Finalmente, destruir a sessão.
session_destroy();

http_response_code(200);
echo json_encode(['status' => 'success', 'message' => 'Logout realizado com sucesso.']);
?>