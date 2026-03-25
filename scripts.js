import { getProjects } from './get-projects.js';
import { createProjectRenderer } from './project-renderer.js';

const projectsSection = document.getElementById('projects-section');
const categoryFilters = document.getElementById('category-filters');
const paginationContainer = document.getElementById('pagination-container');
const skillsSection = document.getElementById('skills-section');
const heroTechnologies = document.getElementById('hero-technologies');
const projectsHeading = document.getElementById('projects');

let allProjects = [];
let allCategories = [];
let allSkills = {};
let currentPage = 1;
let projectsPerPage = window.innerWidth < 768 ? 3 : 6;
let currentFilteredProjects = [];
let currentFilterType = 'all'; // 'all', 'category', 'technology'
let currentFilterValue = 'all';

function getProjectsPerPage() {
    return window.innerWidth < 768 ? 3 : 6;
}

function shuffleArray(items = []) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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


async function fetchHistoryTimeline() {
    const response = await fetch('./history.json');

    if (!response.ok) {
        throw new Error(`Falha ao carregar history.json: ${response.status}`);
    }

    return response.json();
}

function renderHistoryTimeline(historyItems = []) {
    const timelineContainer = document.getElementById('about-timeline');
    if (!timelineContainer) {
        return;
    }

    timelineContainer.innerHTML = '';

    historyItems.forEach((item) => {
        const timelineItem = document.createElement('article');
        timelineItem.className = 'timeline-item';
        timelineItem.setAttribute('role', 'listitem');

        const tags = (item.tags || [])
            .map((tag) => `<span class="timeline-tag">${tag}</span>`)
            .join('');

        timelineItem.innerHTML = `
            <p class="timeline-date">${item.date || ''}</p>
            <h4 class="timeline-title">${item.title || 'Sem título'}</h4>
            <p class="timeline-description">${item.description || ''}</p>
            <div class="timeline-tags" aria-label="Tecnologias e temas">${tags}</div>
        `;

        timelineContainer.appendChild(timelineItem);
    });
}

function getTechnologiesMarquee(technologies = []) {
    if (!technologies.length) {
        return '';
    }

    const badges = technologies
        .map(tech => `<span class="tech-badge tech-badge-clickable" data-technology="${tech}" data-origin="hero" role="button" tabindex="0" aria-label="Filtrar projetos com ${tech}">${tech}</span>`)
        .join('');

    return `
        <div class="technologies-marquee" aria-label="Tecnologias utilizadas: ${technologies.join(', ')}">
            <div class="technologies-marquee-content">
                <div class="technologies-group">${badges}</div>
                <div class="technologies-group" aria-hidden="true">${badges}</div>
            </div>
        </div>
    `;
}

function getTechnologiesBadges(technologies = []) {
    if (!technologies.length) {
        return '';
    }

    const shuffledTechnologies = shuffleArray(technologies);
    const maxVisibleBadges = 3;
    const visibleTechnologies = shuffledTechnologies.slice(0, maxVisibleBadges);
    const hiddenTechnologies = shuffledTechnologies.slice(maxVisibleBadges);

    const badges = visibleTechnologies
        .map(tech => `<span class="tech-badge tech-badge-clickable" data-technology="${tech}" data-origin="card" role="button" tabindex="0" aria-label="Filtrar projetos com ${tech}">${tech}</span>`)
        .join('');

    const hiddenBadges = hiddenTechnologies
        .map(tech => `<span class="tech-badge tech-badge-clickable tech-badge-overflow-item" data-technology="${tech}" data-origin="card" role="button" tabindex="0" aria-label="Filtrar projetos com ${tech}">${tech}</span>`)
        .join('');

    const overflowBadge = hiddenTechnologies.length
        ? `
            <div class="tech-badge-overflow" aria-label="Tecnologias ocultas">
                <span class="tech-badge tech-badge-overflow-trigger" tabindex="0" aria-label="Mostrar ${hiddenTechnologies.length} tecnologias ocultas">+${hiddenTechnologies.length}</span>
                <div class="tech-badge-overflow-stack" role="list" aria-label="Tecnologias ocultas">
                    ${hiddenBadges}
                </div>
            </div>
        `
        : '';


    fetchHistoryTimeline()
        .then((historyItems) => {
            renderHistoryTimeline(Array.isArray(historyItems) ? historyItems : []);
        })
        .catch((error) => {
            console.error('Error loading history timeline:', error);
        });
    return `
        <div class="technologies" aria-label="Tecnologias utilizadas: ${shuffledTechnologies.join(', ')}">
            ${badges}
            ${overflowBadge}
        </div>
    `;
}

function renderHeroTechnologies(projects = []) {
    if (!heroTechnologies) {
        return;
    }

    const uniqueTechnologies = [];
    projects.forEach(project => {
        (project.technologies || []).forEach(tech => {
            if (!uniqueTechnologies.includes(tech)) {
                uniqueTechnologies.push(tech);
            }
        });
    });

    heroTechnologies.innerHTML = getTechnologiesMarquee(uniqueTechnologies);
}

const projectRenderer = createProjectRenderer({
    projectsSection,
    getProjectsPerPage,
    formatProjectDescription,
    getProjectLinkIndicator,
    getTechnologiesBadges
});

function displayProjects(page) {
    projectsPerPage = getProjectsPerPage();
    projectRenderer.renderProjects(allProjects, page);
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
getProjects()
    .then(data => {
        allProjects = shuffleArray(data.projects || []);
        allCategories = data.cartegories || data.categories || [];
        allSkills = data.skills || {};
        currentFilteredProjects = allProjects;

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

        // Render tecnologias em destaque no header
        renderHeroTechnologies(allProjects);
        
        // Adicionar dados estruturados para projetos
        addProjectsStructuredData(allProjects);
    })
    .catch(error => console.error('Error loading projects:', error));

// Delegação de eventos para cliques em badges de tecnologia
document.addEventListener('click', (e) => {
    const techBadge = e.target.closest('.tech-badge-clickable');
    if (techBadge) {
        const technology = techBadge.getAttribute('data-technology');
        const badgeOrigin = techBadge.getAttribute('data-origin');
        if (technology) {
            filterProjectsByTechnology(technology, badgeOrigin === 'hero');
        }
    }
});

// Suportar tecla Enter em badges de tecnologia
document.addEventListener('keydown', (e) => {
    const techBadge = e.target.closest('.tech-badge-clickable');
    if (e.key === 'Enter' && techBadge) {
        const technology = techBadge.getAttribute('data-technology');
        const badgeOrigin = techBadge.getAttribute('data-origin');
        if (technology) {
            filterProjectsByTechnology(technology, badgeOrigin === 'hero');
        }
    }
});

function filterProjects(category) {
    let filteredProjects = [];
    projectsPerPage = getProjectsPerPage();
    if (category === 'all') {
        filteredProjects = allProjects;
        currentFilterType = 'all';
    } else {
        filteredProjects = allProjects.filter(project => {
            const cardCategories = (project.categories || []).map(cat => cat.trim().toLowerCase());
            return cardCategories.includes(category.toLowerCase());
        });
        currentFilterType = 'category';
    }
    currentFilterValue = category;
    currentFilteredProjects = filteredProjects;
    currentPage = 1;
    displayFilteredProjects(filteredProjects, currentPage);
    setupPaginationForFiltered(filteredProjects);
}

function filterProjectsByTechnology(technology, shouldScroll = false) {
    let filteredProjects = [];
    projectsPerPage = getProjectsPerPage();
    
    filteredProjects = allProjects.filter(project => {
        const projectTechs = (project.technologies || []).map(tech => tech.trim().toLowerCase());
        return projectTechs.includes(technology.toLowerCase());
    });
    
    currentFilterType = 'technology';
    currentFilterValue = technology;
    currentFilteredProjects = filteredProjects;
    currentPage = 1;
    
    // Remover o filtro de categoria ativo
    if (categoryFilters) {
        categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    }
    
    displayFilteredProjects(filteredProjects, currentPage);
    setupPaginationForFiltered(filteredProjects);

    if (shouldScroll && projectsHeading) {
        projectsHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function displayFilteredProjects(projects, page) {
    projectsPerPage = getProjectsPerPage();
    projectRenderer.renderProjects(projects, page);
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

function setupHeroMeshHoverEffect() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) {
        return;
    }

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (coarsePointer) {
        return;
    }

    let frameId = null;
    let pointerX = '50%';
    let pointerY = '50%';

    const applyPointerPosition = () => {
        heroSection.style.setProperty('--mesh-x', pointerX);
        heroSection.style.setProperty('--mesh-y', pointerY);
        frameId = null;
    };

    heroSection.addEventListener('pointerenter', () => {
        heroSection.classList.add('hero-mesh-active');
    });

    heroSection.addEventListener('pointerleave', () => {
        heroSection.classList.remove('hero-mesh-active');
    });

    heroSection.addEventListener('pointermove', (event) => {
        const heroRect = heroSection.getBoundingClientRect();
        const x = ((event.clientX - heroRect.left) / heroRect.width) * 100;
        const y = ((event.clientY - heroRect.top) / heroRect.height) * 100;

        const clampedX = Math.min(100, Math.max(0, x));
        const clampedY = Math.min(100, Math.max(0, y));

        pointerX = `${clampedX.toFixed(2)}%`;
        pointerY = `${clampedY.toFixed(2)}%`;

        if (frameId === null) {
            frameId = requestAnimationFrame(applyPointerPosition);
        }
    });
}

function setupMobileHeaderAutoHide() {
    const headerElement = document.querySelector('header');
    if (!headerElement) {
        return;
    }

    const mobileQuery = window.matchMedia('(max-width: 768px)');
    let lastScrollY = window.scrollY;
    let ticking = false;
    const minDelta = 8;

    const updateHeaderState = () => {
        const currentScrollY = window.scrollY;
        const isAtTop = currentScrollY <= 12;

        if (!mobileQuery.matches) {
            headerElement.classList.remove('header-hidden-mobile');
            headerElement.classList.remove('header-at-top-mobile');
            lastScrollY = currentScrollY;
            ticking = false;
            return;
        }

        headerElement.classList.toggle('header-at-top-mobile', isAtTop);

        if (isAtTop) {
            headerElement.classList.remove('header-hidden-mobile');
            lastScrollY = currentScrollY;
            ticking = false;
            return;
        }

        const delta = currentScrollY - lastScrollY;
        if (Math.abs(delta) >= minDelta) {
            if (delta > 0) {
                headerElement.classList.add('header-hidden-mobile');
            } else {
                headerElement.classList.remove('header-hidden-mobile');
            }
            lastScrollY = currentScrollY;
        }

        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(updateHeaderState);
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        if (!mobileQuery.matches) {
            headerElement.classList.remove('header-hidden-mobile');
            headerElement.classList.remove('header-at-top-mobile');
        }
    });

    updateHeaderState();
}

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

    setupHeroMeshHoverEffect();
    setupMobileHeaderAutoHide();
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