import { openModal, closeModal } from './modal.js';
import { saveAccessToken, saveRepositories } from './storage.js';
import { analyzeRepositories } from './analyzer.js';

export function setupEventListeners() {
    const accessKeyBtn = document.getElementById('accessKeyBtn');
    const configBtn = document.getElementById('configBtn');
    const closeButtons = document.getElementsByClassName('close');
    const saveAccessKeyBtn = document.getElementById('saveAccessKey');
    const saveConfigBtn = document.getElementById('saveConfig');
    const analyzeBtn = document.getElementById('analyzeBtn');

    accessKeyBtn.onclick = () => {
        openModal('accessKeyModal');
        document.getElementById('accessKeyInput').value = localStorage.getItem('githubAccessKey') || '';
    };

    configBtn.onclick = () => {
        openModal('configModal');
        document.getElementById('configInput').value = JSON.parse(localStorage.getItem('githubConfig') || '[]').join('\n');
    };

    Array.from(closeButtons).forEach(button => {
        button.onclick = function() {
            closeModal(this.closest('.modal').id);
        }
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    }

    saveAccessKeyBtn.onclick = () => {
        const newAccessKey = document.getElementById('accessKeyInput').value;
        saveAccessToken(newAccessKey);
        closeModal('accessKeyModal');
    };

    saveConfigBtn.onclick = () => {
        const newConfig = document.getElementById('configInput').value;
        const repositories = newConfig.split('\n').filter(repo => repo.trim() !== '');
        saveRepositories(repositories);
        closeModal('configModal');
    };

    analyzeBtn.addEventListener('click', analyzeRepositories);
}