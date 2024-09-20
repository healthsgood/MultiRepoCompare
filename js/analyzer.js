import { fetchRepoData } from './api.js';
import { getAccessToken, getRepositories } from './storage.js';

export async function analyzeRepositories() {
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
        const repositories = getRepositories();
        const ACCESS_TOKEN = getAccessToken();

        if (repositories.length === 0) {
            throw new Error('No repositories found in config');
        }

        const repoDataPromises = repositories.map(repo => fetchRepoData(repo, since.toISOString(), ACCESS_TOKEN));
        let repoData = await Promise.all(repoDataPromises);

        // Sort by commit count
        repoData.sort((a, b) => b.commits - a.commits);

        // Find max values for normalization
        const maxCommits = Math.max(...repoData.map(repo => repo.commits));
        const maxContributors = Math.max(...repoData.map(repo => repo.contributors));

        // Create table
        let tableHTML = createTableHTML(repoData, maxCommits, maxContributors);

        resultDiv.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error during analysis:', error);
        resultDiv.innerHTML = '<p>An error occurred during analysis. Please check the console for details.</p>';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function createTableHTML(repoData, maxCommits, maxContributors) {
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
    return tableHTML;
}