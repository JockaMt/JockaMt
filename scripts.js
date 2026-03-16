const projectsSection = document.getElementById('projects-section');
const categoryFilters = document.getElementById('category-filters');
const paginationContainer = document.getElementById('pagination-container');
const skillsSection = document.getElementById('skills-section');

let allProjects = [];
let allCategories = [];
let allSkills = {};
let currentPage = 1;
let projectsPerPage = window.innerWidth < 768 ? 3 : 6;

function getProjectsPerPage() {
    return window.innerWidth < 768 ? 3 : 6;
}

function formatProjectDescription(description = '') {
    const maintenancePrefix = '(Em manutenção)';
    const trimmedDescription = description.trim();

    if (!trimmedDescription.startsWith(maintenancePrefix)) {
        return trimmedDescription;
    }

    const descriptionWithoutPrefix = trimmedDescription
        .slice(maintenancePrefix.length)
        .trim();

    return `<span class="maintenance-tag">Em manutenção</span><br>${descriptionWithoutPrefix}`;
}

function getProjectLinkIndicator(project) {
    if (!project.url) {
        return '';
    }

    return `
        <span class="card-link-indicator" aria-hidden="true" title="Abre em nova aba">
            <svg viewBox="0 0 24 24" focusable="false">
                <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zm5 16H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/>
            </svg>
        </span>
    `;
}

function displayProjects(page) {
    projectsSection.innerHTML = '';
    projectsPerPage = getProjectsPerPage();
    const startIndex = (page - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const paginatedProjects = allProjects.slice(startIndex, endIndex);

    paginatedProjects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.category = (project.categories || []).join(',');
        const technologiesList = (project.technologies || []).map(tech => `<span class="tech-badge">${tech}</span>`).join(' ');
        
        projectCard.innerHTML = `
            ${getProjectLinkIndicator(project)}
            <div class="card-content">
                <h3>${project.name}</h3>
                <p>${formatProjectDescription(project.description)}</p>
            </div>
            <div class="card-footer">
                <div class="technologies">${technologiesList}</div>
                ${project.gh ? `<a href="${project.gh}" class="github-link" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
            </div>
        `;

        if (project.url) {
            projectCard.classList.add('clickable');
            projectCard.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() !== 'a') {
                    window.open(project.url, '_blank');
                }
            });
        }

        projectsSection.appendChild(projectCard);
    });
}

function setupPagination(totalProjects) {
    paginationContainer.innerHTML = '';
    const pageCount = Math.ceil(totalProjects / projectsPerPage);
    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.classList.add('pagination-btn');
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            displayProjects(currentPage);
            document.querySelectorAll('.pagination-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        paginationContainer.appendChild(button);
    }
}

function renderSkills(skillsByCategory = {}) {
    if (!skillsSection) return;
    skillsSection.innerHTML = '';
    
    Object.entries(skillsByCategory).forEach(([category, skills]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skills-category';
        categoryDiv.innerHTML = `<h4>${category}</h4>`;

        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'skills-badges';

        skills.forEach(skill => {
            const badge = document.createElement('div');
            badge.className = 'skill-badge';
            badge.setAttribute('role', 'listitem');
            badge.setAttribute('aria-label', `Habilidade: ${skill.name}`);
            
            const iconHtml = skill.icon
                ? `<img src="${skill.icon}" alt="" class="tech-icon" role="presentation" />`
                : `<div class="tech-icon-badge" role="presentation">${skill.badge || skill.name.substring(0,2).toUpperCase()}</div>`;
            
            badge.innerHTML = `
                ${iconHtml}
                <span class="skill-name">${skill.name}</span>
            `;
            
            badgesContainer.appendChild(badge);
        });

        categoryDiv.appendChild(badgesContainer);
        skillsSection.appendChild(categoryDiv);
    });
}



// Carrega todos os dados uma única vez
fetch('projects.json')
    .then(response => response.json())
    .then(data => {
        allProjects = data.projects || [];
        allCategories = data.cartegories || [];
        allSkills = data.skills || {};

        // Render projetos + paginação
        displayProjects(currentPage);
        setupPagination(allProjects.length);

        // Render filtros de categoria
        if (categoryFilters) {
            const allBtn = document.createElement('button');
            allBtn.className = 'filter-btn active';
            allBtn.dataset.filter = 'all';
            allBtn.textContent = 'All';
            allBtn.addEventListener('click', () => {
                categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                filterProjects('all');
            });
            categoryFilters.appendChild(allBtn);

            allCategories.forEach(category => {
                const button = document.createElement('button');
                button.className = 'filter-btn';
                button.dataset.filter = category;
                button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                button.addEventListener('click', (e) => {
                    categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    filterProjects(category);
                });
                categoryFilters.appendChild(button);
            });
        }

        // Render skills dinâmicas
        renderSkills(allSkills);
        
        // Adicionar dados estruturados para projetos
        addProjectsStructuredData(allProjects);
    })
    .catch(error => console.error('Error loading data:', error));

function filterProjects(category) {
    let filteredProjects = [];
    projectsPerPage = getProjectsPerPage();
    if (category === 'all') {
        filteredProjects = allProjects;
    } else {
        filteredProjects = allProjects.filter(project => {
            const cardCategories = (project.categories || []).map(cat => cat.trim().toLowerCase());
            return cardCategories.includes(category.toLowerCase());
        });
    }
    currentPage = 1;
    displayFilteredProjects(filteredProjects, currentPage);
    setupPaginationForFiltered(filteredProjects);
}

function displayFilteredProjects(projects, page) {
    projectsSection.innerHTML = '';
    projectsPerPage = getProjectsPerPage();
    const startIndex = (page - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const paginatedProjects = projects.slice(startIndex, endIndex);

    paginatedProjects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.category = (project.categories || []).join(',');
        const technologiesList = (project.technologies || []).map(tech => `<span class="tech-badge">${tech}</span>`).join(' ');
        
        projectCard.innerHTML = `
            ${getProjectLinkIndicator(project)}
            <div class="card-content">
                <h3>${project.name}</h3>
                <p>${formatProjectDescription(project.description)}</p>
            </div>
            <div class="card-footer">
                <div class="technologies">${technologiesList}</div>
                ${project.gh ? `<a href="${project.gh}" class="github-link" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
            </div>
        `;

        if (project.url) {
            projectCard.classList.add('clickable');
            projectCard.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() !== 'a') {
                    window.open(project.url, '_blank');
                }
            });
        }
        projectsSection.appendChild(projectCard);
    });
}

function setupPaginationForFiltered(filteredProjects) {
    paginationContainer.innerHTML = '';
    projectsPerPage = getProjectsPerPage();
    const pageCount = Math.ceil(filteredProjects.length / projectsPerPage);
    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.classList.add('pagination-btn');
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentPage = i;
            displayFilteredProjects(filteredProjects, currentPage);
            document.querySelectorAll('.pagination-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        paginationContainer.appendChild(button);
    }
}

window.addEventListener('resize', () => {
    const newProjectsPerPage = getProjectsPerPage();
    if (newProjectsPerPage !== projectsPerPage) {
        projectsPerPage = newProjectsPerPage;
        currentPage = 1;
        // Re-render with the current filter or all projects
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        filterProjects(activeFilter);
    }
});

// Inicializar as estrelas quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    const starsContainers = document.querySelectorAll('.stars');
    starsContainers.forEach(container => {
        const rating = container.getAttribute('data-rating');
        container.style.setProperty('--rating', rating);
    });

    // Fade-in nas seções ao entrar na viewport
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => sec.classList.add('fade-section'));

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Opcional: desobservar para animar apenas uma vez
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    sections.forEach(sec => io.observe(sec));
});

// Adicionar dados estruturados para projetos
function addProjectsStructuredData(projects) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Projetos de JockaMt",
        "description": "Portfolio de projetos desenvolvidos por JockaMt",
        "itemListElement": projects.map((project, index) => ({
            "@type": "CreativeWork",
            "position": index + 1,
            "name": project.name,
            "description": project.description,
            "url": project.url || project.gh,
            "author": {
                "@type": "Person",
                "name": "JockaMt"
            },
            "programmingLanguage": project.technologies || []
        }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}