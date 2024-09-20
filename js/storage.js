export function getAccessToken() {
    return localStorage.getItem('githubAccessKey') || '';
}

export function saveAccessToken(token) {
    localStorage.setItem('githubAccessKey', token);
}

export function getRepositories() {
    return JSON.parse(localStorage.getItem('githubConfig')) || [];
}

export function saveRepositories(repositories) {
    localStorage.setItem('githubConfig', JSON.stringify(repositories));
}