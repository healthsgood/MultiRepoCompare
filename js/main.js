import { initializeApp } from './app.js';
import { setupEventListeners } from './eventListeners.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});