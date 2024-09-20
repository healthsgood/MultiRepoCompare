const API_BASE_URL = 'https://api.github.com';

export async function fetchRepoData(repo, since, ACCESS_TOKEN) {
    const [owner, repoName] = repo.split('/');
    const headers = {
        'Authorization': `token ${ACCESS_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    };

    try {
        const [commitsResponse, contributorsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/repos/${owner}/${repoName}/commits?since=${since}&per_page=1`, { headers }),
            fetch(`${API_BASE_URL}/repos/${owner}/${repoName}/contributors?per_page=1`, { headers })
        ]);

        const commitsLink = commitsResponse.headers.get('Link');
        const contributorsLink = contributorsResponse.headers.get('Link');

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