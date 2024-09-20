// Base URL for GitHub API requests
const API_BASE_URL = 'https://api.github.com';

// Get Access Key from localStorage
let ACCESS_TOKEN = localStorage.getItem('githubAccessKey') || '';

// Get config from localStorage
let repositories = JSON.parse(localStorage.getItem('githubConfig')) || [];

// Modal related elements
const accessKeyModal = document.getElementById('accessKeyModal');
const configModal = document.getElementById('configModal');
const accessKeyBtn = document.getElementById('accessKeyBtn');
const configBtn = document.getElementById('configBtn');
const closeButtons = document.getElementsByClassName('close');
const saveAccessKeyBtn = document.getElementById('saveAccessKey');
const saveConfigBtn = document.getElementById('saveConfig');

// Open modal
function openModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

// Close modal
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

accessKeyBtn.onclick = () => {
    openModal(accessKeyModal);
    document.getElementById('accessKeyInput').value = ACCESS_TOKEN;
};

configBtn.onclick = () => {
    openModal(configModal);
    document.getElementById('configInput').value = repositories.join('\n');
};

// Close modal
Array.from(closeButtons).forEach(button => {
    button.onclick = function() {
        closeModal(this.closest('.modal'));
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
}

// Save Access Key
saveAccessKeyBtn.onclick = () => {
    const newAccessKey = document.getElementById('accessKeyInput').value;
    ACCESS_TOKEN = newAccessKey;
    localStorage.setItem('githubAccessKey', newAccessKey);
    closeModal(accessKeyModal);
};

// Save Config
saveConfigBtn.onclick = () => {
    const newConfig = document.getElementById('configInput').value;
    repositories = newConfig.split('\n').filter(repo => repo.trim() !== '');
    localStorage.setItem('githubConfig', JSON.stringify(repositories));
    closeModal(configModal);
};

async function fetchRepoData(repo, since) {
    const [owner, repoName] = repo.split('/');
    const headers = {
        'Authorization': `token ${ACCESS_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    try {
        // Parallel requests for commits and contributors count
        const [commitsResponse, contributorsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/repos/${owner}/${repoName}/commits?since=${since}&per_page=1`, { headers }),
            fetch(`${API_BASE_URL}/repos/${owner}/${repoName}/contributors?per_page=1`, { headers })
        ]);

        const commitsLink = commitsResponse.headers.get('Link');
        const contributorsLink = contributorsResponse.headers.get('Link');

        // Parse Link header to get total count
        const commitsCount = parseLinkHeader(commitsLink);
        const contributorsCount = parseLinkHeader(contributorsLink);

        return {
            name: repo,
            commits: commitsCount,
            contributors: contributorsCount
        };
    } catch (error) {
        console.error(`Error fetching data for ${repo}:`, error);
        return { name: repo, commits: 'Error', contributors: 'Error' };
    }
}

function parseLinkHeader(linkHeader) {
    if (!linkHeader) return 0;
    const matches = linkHeader.match(/&page=(\d+)>; rel="last"/);
    return matches ? parseInt(matches[1]) : 1;
}

async function analyzeRepositories() {
    const timeRange = document.getElementById('timeRange').value;
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');

    loadingDiv.style.display = 'block';

    let since = new Date();
    if (timeRange !== 'all') {
        since.setDate(since.getDate() - parseInt(timeRange));
    } else {
        since = new Date(0); // Start from 1970
    }

    try {
        if (repositories.length === 0) {
            throw new Error('No repositories found in config');
        }

        const repoDataPromises = repositories.map(repo => fetchRepoData(repo, since.toISOString()));
        let repoData = await Promise.all(repoDataPromises);

        // Sort by commit count
        repoData.sort((a, b) => b.commits - a.commits);

        // Find max values for normalization
        const maxCommits = Math.max(...repoData.map(repo => repo.commits));
        const maxContributors = Math.max(...repoData.map(repo => repo.contributors));

        // Create table
        let tableHTML = `
            <table>
                <tr>
                    <th>Repo Name</th>
                    <th>Latest Commits</th>
                    <th>Authors</th>
                </tr>
        `;

        repoData.forEach(repo => {
            const commitBarWidth = (repo.commits / maxCommits) * 100;
            const contributorsBarWidth = (repo.contributors / maxContributors) * 100;

            tableHTML += `
                <tr>
                    <td>
                        <a href="https://github.com/${repo.name}/graphs/commit-activity" target="_blank" rel="noopener noreferrer" title="${repo.name}">
                            ${repo.name.split("/").pop()}
                        </a>
                    </td>
                    <td>
                        <div class="bar-container">
                            <div class="bar commits-bar" style="width: ${commitBarWidth}%"></div>
                            <span class="bar-text">${repo.commits}</span>
                        </div>
                    </td>
                    <td>
                        <div class="bar-container">
                            <div class="bar contributors-bar" style="width: ${contributorsBarWidth}%"></div>
                            <span class="bar-text">${repo.contributors}</span>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHTML += '</table>';
        resultDiv.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error during analysis:', error);
        resultDiv.innerHTML = '<p>An error occurred during analysis. Please check the console for details.</p>';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

document.getElementById('analyzeBtn').addEventListener('click', analyzeRepositories);

if (ACCESS_TOKEN.length === 0) {
    openModal(accessKeyModal);
}

// Load configuration on initialization
if (repositories.length === 0) {
    openModal(configModal);
}