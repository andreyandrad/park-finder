import { showToast } from './ui.js';
import { initializeAuthUI } from './auth.js';
import * as api from './api.js';
import { showConfirm } from './modal.js';

const urlParams = new URLSearchParams(window.location.search);
const ID_ESTACIONAMENTO = urlParams.get('id');
const NOME_ESTACIONAMENTO = urlParams.get('nome');

const formEditar = document.getElementById('form-editar-estacionamento');
const formVaga = document.getElementById('form-adicionar-vaga');
const tbodyVagas = document.getElementById('vagas-table-body');
const feedbackForm = document.getElementById('form-feedback');
const feedbackVaga = document.getElementById('vaga-form-feedback');

async function carregarPagina() {
    if (!ID_ESTACIONAMENTO) {
        alert("ID do estacionamento não fornecido.");
        window.location.href = 'dashboard.html';
        return;
    }
    
    document.getElementById('main-title').textContent = `Gerenciar: ${NOME_ESTACIONAMENTO}`;
    document.getElementById('nome').value = NOME_ESTACIONAMENTO;
    
    await carregarVagas();
}

async function carregarVagas() {
    try {
        const vagas = await api.vagas.getVagasGerenciamento(ID_ESTACIONAMENTO);
        tbodyVagas.innerHTML = '';
        if (vagas.length === 0) {
            tbodyVagas.innerHTML = '<tr><td colspan="3">Nenhuma vaga cadastrada.</td></tr>';
        }
        vagas.forEach(vaga => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${vaga.identificador}</td>
                <td>${vaga.tipo}</td>
                <td class="actions-cell">
                    <button class="btn-table-edit" data-id="${vaga.id_vaga}" data-ident="${vaga.identificador}" data-tipo="${vaga.tipo}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-table-delete" data-id="${vaga.id_vaga}" data-ident="${vaga.identificador}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbodyVagas.appendChild(tr);
        });
        
        tbodyVagas.querySelectorAll('.btn-table-edit').forEach(btn => 
            btn.addEventListener('click', handleEditarVaga)
        );
        tbodyVagas.querySelectorAll('.btn-table-delete').forEach(btn => 
            btn.addEventListener('click', handleExcluirVaga)
        );
        
    } catch (error) {
        showToast(`Erro ao carregar vagas: ${error.message}`, 'error');
    }
}

async function handleSalvarEstacionamento(e) {
    e.preventDefault();
    feedbackForm.textContent = '';
    const nome = document.getElementById('nome').value;
    const endereco = document.getElementById('endereco').value;
    
    try {
        await api.estacionamentos.update({
            id_estacionamento: ID_ESTACIONAMENTO,
            nome: nome,
            endereco: endereco
        });
        showToast('Nome atualizado com sucesso!', 'success');
        document.getElementById('main-title').textContent = `Gerenciar: ${nome}`;
    } catch (error) {
        feedbackForm.textContent = error.message;
        showToast(error.message, 'error');
    }
}

async function handleAdicionarVaga(e) {
    e.preventDefault();
    feedbackVaga.textContent = '';
    const identificador = document.getElementById('vaga-identificador').value;
    const tipo = document.getElementById('vaga-tipo').value;
    
    try {
        await api.vagas.create({
            id_estacionamento: ID_ESTACIONAMENTO,
            identificador: identificador,
            tipo: tipo
        });
        showToast('Vaga adicionada!', 'success');
        formVaga.reset();
        carregarVagas();
    } catch (error) {
        feedbackVaga.textContent = error.message;
        showToast(error.message, 'error');
    }
}

async function handleEditarVaga(e) {
    const btn = e.currentTarget;
    const id_vaga = btn.dataset.id;
    const identAtual = btn.dataset.ident;
    const tipoAtual = btn.dataset.tipo;

    const novoIdent = prompt("Novo identificador da vaga:", identAtual);
    if (novoIdent === null || novoIdent.trim() === "") return;

    const novoTipo = prompt("Novo tipo da vaga (carro, moto, pcd):", tipoAtual);
    if (novoTipo === null || !['carro', 'moto', 'pcd'].includes(novoTipo.toLowerCase())) {
        alert("Tipo inválido. Use 'carro', 'moto' ou 'pcd'.");
        return;
    }
    
    try {
        await api.vagas.update({
            id_vaga: id_vaga,
            identificador: novoIdent,
            tipo: novoTipo
        });
        showToast('Vaga atualizada!', 'success');
        carregarVagas();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleExcluirVaga(e) {
    const id_vaga = e.currentTarget.dataset.id;
    const ident = e.currentTarget.dataset.ident;
    
    const confirmado = await showConfirm({
        title: "Confirmar Exclusão",
        message: `Tem certeza que deseja excluir a vaga "${ident}"?`,
        isDanger: true
    });
    if (!confirmado) return;
    
    try {
        await api.vagas.delete(id_vaga);
        showToast('Vaga excluída!', 'success');
        carregarVagas();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSugerirVagaId() {
    const tipo = document.getElementById('vaga-tipo').value;
    try {
        const data = await api.vagas.suggestNext(ID_ESTACIONAMENTO, tipo);
        document.getElementById('vaga-identificador').value = data.sugestao;
    } catch (error) {
        showToast(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    carregarPagina();
    formEditar.addEventListener('submit', handleSalvarEstacionamento);
    formVaga.addEventListener('submit', handleAdicionarVaga);
    document.getElementById('suggest-spot-id').addEventListener('click', handleSugerirVagaId);
});