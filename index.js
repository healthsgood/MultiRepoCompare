// GitHub API 请求的基础 URL
const API_BASE_URL = 'https://api.github.com';

// 从 localStorage 获取 Access Key
let ACCESS_TOKEN = localStorage.getItem('githubAccessKey') || '';

// 从 localStorage 获取 config
let repositories = JSON.parse(localStorage.getItem('githubConfig')) || [];

// 模态框相关元素
const accessKeyModal = document.getElementById('accessKeyModal');
const configModal = document.getElementById('configModal');
const accessKeyBtn = document.getElementById('accessKeyBtn');
const configBtn = document.getElementById('configBtn');
const closeButtons = document.getElementsByClassName('close');
const saveAccessKeyBtn = document.getElementById('saveAccessKey');
const saveConfigBtn = document.getElementById('saveConfig');

// 打开模态框
function openModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

// 关闭模态框
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

// 关闭模态框
Array.from(closeButtons).forEach(button => {
    button.onclick = function() {
        closeModal(this.closest('.modal'));
    }
});

// 点击模态框外部关闭
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
}

// 保存 Access Key
saveAccessKeyBtn.onclick = () => {
    const newAccessKey = document.getElementById('accessKeyInput').value;
    ACCESS_TOKEN = newAccessKey;
    localStorage.setItem('githubAccessKey', newAccessKey);
    closeModal(accessKeyModal);
};

// 保存 Config
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
        // 并行请求提交数和贡献者数
        const [commitsResponse, contributorsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/repos/${owner}/${repoName}/commits?since=${since}&per_page=1`, { headers }),
            fetch(`${API_BASE_URL}/repos/${owner}/${repoName}/contributors?per_page=1`, { headers })
        ]);

        const commitsLink = commitsResponse.headers.get('Link');
        const contributorsLink = contributorsResponse.headers.get('Link');

        // 解析 Link header 以获取总数
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
    resultDiv.innerHTML = '';

    let since = new Date();
    if (timeRange !== 'all') {
        since.setDate(since.getDate() - parseInt(timeRange));
    } else {
        since = new Date(0); // 从 1970 年开始
    }

    try {
        if (repositories.length === 0) {
            throw new Error('No repositories found in config');
        }

        const repoDataPromises = repositories.map(repo => fetchRepoData(repo, since.toISOString()));
        let repoData = await Promise.all(repoDataPromises);

        // 按 commit 数排序
        repoData.sort((a, b) => b.commits - a.commits);

        // 找出最大值用于归一化
        const maxCommits = Math.max(...repoData.map(repo => repo.commits));
        const maxContributors = Math.max(...repoData.map(repo => repo.contributors));

        // 创建表格
        let tableHTML = `
            <table>
                <tr>
                    <th>仓库</th>
                    <th>总Commit数</th>
                    <th>贡献者数量</th>
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
        resultDiv.innerHTML = '<p>分析过程中发生错误，请检查控制台以获取详细信息。</p>';
    } finally {
        loadingDiv.style.display = 'none';
    }
}

document.getElementById('analyzeBtn').addEventListener('click', analyzeRepositories);

// 初始化时加载配置
if (repositories.length === 0) {
    openModal(configModal);
}