import { showToast } from './ui.js';
import { initializeAuthUI, getUserRole } from './auth.js';
import * as api from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    // Proteção de Rota: Apenas Super Admins podem ver esta página
    if (getUserRole() !== 'superadmin') {
        alert('Acesso negado. Apenas Super Admins podem criar estacionamentos.');
        window.location.href = 'dashboard.html';
        return;
    }
});

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
        await api.estacionamentos.create(payload);
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