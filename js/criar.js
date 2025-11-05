// Importa apenas a função que precisa
import { showToast } from './ui.js';

document.getElementById('form-criar-estacionamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedback = document.getElementById('form-feedback');
    const button = e.target.querySelector('button');
    feedback.textContent = '';
    button.disabled = true;

    const payload = {
        nome: document.getElementById('nome').value,
        endereco: document.getElementById('endereco').value,
        qtd_carro: parseInt(document.getElementById('qtd_carro').value),
        qtd_moto: parseInt(document.getElementById('qtd_moto').value),
        qtd_pcd: parseInt(document.getElementById('qtd_pcd').value),
    };
    
    if(payload.qtd_carro + payload.qtd_moto + payload.qtd_pcd <= 0) {
        feedback.textContent = 'O estacionamento deve ter pelo menos 1 vaga.';
        button.disabled = false;
        return;
    }

    try {
        const response = await fetch('api/estacionamentos.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }

        showToast('Estacionamento criado com sucesso!', 'success');
        feedback.textContent = 'Sucesso! Redirecionando...';
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        feedback.textContent = error.message;
        showToast(error.message, 'error');
        button.disabled = false;
    }
});