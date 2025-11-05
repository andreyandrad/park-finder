import { initializeAuthUI } from './auth.js';

// Inicializa a verificação de auth (para redirecionar se já estiver logado)
document.addEventListener('DOMContentLoaded', initializeAuthUI);

// Lógica do Formulário
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const feedback = document.getElementById('login-feedback');
    const button = e.target.querySelector('button');
    feedback.textContent = '';
    button.disabled = true;
    button.textContent = 'Entrando...';

    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            credentials: 'include', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('role', data.role);
        
        window.location.href = 'dashboard.html';

    } catch (error) {
        feedback.textContent = error.message || 'Erro de login';
        button.disabled = false;
        button.textContent = 'Entrar';
    }
});

// Lógica do "Olho" (Toggle de Senha)
const toggleButton = document.getElementById('password-toggle');
const passwordInput = document.getElementById('password');

toggleButton.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // Alterna o ícone
    toggleButton.classList.toggle('fa-eye');
    toggleButton.classList.toggle('fa-eye-slash');
});