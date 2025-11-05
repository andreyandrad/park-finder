/**
 * js/auth.js - Módulo de Autenticação e UI de Cabeçalho
 */

export function getUsername() {
    return sessionStorage.getItem('username');
}

export function getUserRole() {
    return sessionStorage.getItem('role');
}

function checkLoginStatus() {
    const username = getUsername();
    // Se não estiver na página de login e não tiver username, redireciona
    if (!username && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
        return null;
    }
    // Se ESTIVER na página de login e JÁ TIVER username, redireciona para o dashboard
    if (username && window.location.pathname.endsWith('login.html')) {
        window.location.href = 'dashboard.html';
        return null;
    }
    return username;
}

async function handleLogout() {
    try {
        await fetch('api/logout.php', { credentials: 'include' });
    } catch (error) {
        console.error('Erro no logout:', error);
    } finally {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

/**
 * Inicializa a UI de autenticação em todas as páginas.
 */
export function initializeAuthUI() {
    const username = checkLoginStatus();
    
    // Se for a página de login, não há mais nada a fazer
    if (window.location.pathname.endsWith('login.html')) {
        return;
    }

    if (!username) return; // Redirecionamento já foi acionado

    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('btn-logout');

    if (usernameDisplay) {
        usernameDisplay.textContent = `Olá, ${username}`;
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Mostra/Esconde links de navegação baseado no Papel
    if (getUserRole() === 'superadmin') {
        const navGerenciar = document.getElementById('nav-gerenciar-usuarios');
        if(navGerenciar) navGerenciar.style.display = 'block';
    }
}