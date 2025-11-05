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
            credentials: 'include', // Envia o cookie de sessão
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro de login');
        }

        // Sucesso! Redireciona para o dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        feedback.textContent = error.message;
        button.disabled = false;
        button.textContent = 'Entrar';
    }
});