import { openModal } from './modal.js';
import { getAccessToken, getRepositories } from './storage.js';

export function initializeApp() {
    const ACCESS_TOKEN = getAccessToken();
    const repositories = getRepositories();

    if (ACCESS_TOKEN.length === 0) {
        openModal('accessKeyModal');
    }

    if (repositories.length === 0) {
        openModal('configModal');
    }
}