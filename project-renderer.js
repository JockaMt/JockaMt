export function createProjectRenderer(options = {}) {
    const {
        projectsSection,
        getProjectsPerPage,
        formatProjectDescription,
        getProjectLinkIndicator,
        getTechnologiesBadges
    } = options;

    function createProjectCard(project) {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.category = (project.categories || []).join(',');

        const technologiesBadges = getTechnologiesBadges(project.technologies || []);

        projectCard.innerHTML = `
            ${getProjectLinkIndicator(project)}
            <div class="card-content">
                <h3 class="card-title">${project.name}</h3>
                <p>${formatProjectDescription(project.description)}</p>
            </div>
            <div class="card-footer">
                ${technologiesBadges}
                ${project.gh ? `<a href="${project.gh}" class="github-link" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
            </div>
        `;

        if (project.url) {
            projectCard.classList.add('clickable');
            projectCard.addEventListener('click', (event) => {
                const clickedLink = event.target.closest('a');
                const clickedTechBadge = event.target.closest('.tech-badge-clickable');
                const clickedOverflowBadge = event.target.closest('.tech-badge-overflow');

                if (!clickedLink && !clickedTechBadge && !clickedOverflowBadge) {
                    window.open(project.url, '_blank');
                }
            });
        }

        return projectCard;
    }

    function renderProjects(projects = [], page = 1) {
        if (!projectsSection) {
            return;
        }

        projectsSection.innerHTML = '';
        const projectsPerPage = getProjectsPerPage();
        const startIndex = (page - 1) * projectsPerPage;
        const endIndex = startIndex + projectsPerPage;
        const paginatedProjects = projects.slice(startIndex, endIndex);

        paginatedProjects.forEach((project) => {
            projectsSection.appendChild(createProjectCard(project));
        });
    }

    return {
        renderProjects
    };
}
