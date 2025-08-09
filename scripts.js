// SPA navigation: show only the selected section
document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('nav a');

    function showSection(id) {
        sections.forEach(section => {
            section.style.display = section.id === id ? 'block' : 'none';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').replace('#', '');
            showSection(targetId);
            history.replaceState(null, '', '#' + targetId);
        });
    });

    // Show section based on URL hash on load
    const initialId = window.location.hash.replace('#', '') || 'about';
    showSection(initialId);

    // --- GitHub Projects Display ---
    async function fetchRepos(username) {
        const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated`);
        if (!res.ok) {
            throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
    }

    function createRepoCard(repo) {
        // Placeholder for image/gif, you can customize per repo
        // Use a default image for all repositories, since repo.homepage is not an image URL
        const imageSrc = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
        return `
            <div class="repo-card">
                <div class="repo-info">
                    <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                    <p>${repo.description || ''}</p>
                    <span>⭐ ${repo.stargazers_count} | ⬆️ ${repo.forks_count}</span>
                    <div class="repo-history">
                        <span>Last updated: ${new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
                    <img src="${imageSrc}" alt="${repo.name}">
                    <img src="${imageSrc}" alt="${repo.name}" style="max-width:120px; border-radius:8px;">
                </div>
            </div>
        `;
    }

    async function showGithubProjects() {
        const container = document.getElementById('github-projects');
        if (!container) return;
        container.innerHTML = '<p>Loading projects...</p>';
        const username = 'rxfce'; // Change to your GitHub username
        try {
            const repos = await fetchRepos(username);
            container.innerHTML = repos.map(createRepoCard).join('');
        } catch (err) {
            container.innerHTML = '<p>Failed to load projects.</p>';
        }
    }

    // Only run when Projects section is shown
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (this.getAttribute('href') === '#projects') {
                showGithubProjects();
            }
        });
    });
    // Also run on initial load if projects is visible
    if (initialId === 'projects') {
        showGithubProjects();
    }
});
