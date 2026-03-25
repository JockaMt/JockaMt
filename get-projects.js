const PROJECTS_CACHE_KEY = 'portfolio_data_cache_v1';
const PROJECTS_CACHE_TTL_MS = 1000 * 60 * 30;

function normalizeProjects(data = []) {
    return data.map((project) => ({
        name: project.name || 'Sem nome',
        description: project.description || 'Sem descricao disponivel.',
        gh: project.gh || '',
        url: project.url || '',
        categories: project.categories || [],
        technologies: project.technologies || []
    }));
}

function normalizePortfolioData(rawData = {}) {
    return {
        projects: normalizeProjects(rawData.projects || []),
        cartegories: rawData.cartegories || rawData.categories || [],
        skills: rawData.skills || {}
    };
}

function getCachedProjects() {
    const cachedRaw = localStorage.getItem(PROJECTS_CACHE_KEY);
    if (!cachedRaw) {
        return null;
    }

    try {
        const parsed = JSON.parse(cachedRaw);
        if (!parsed || !Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') {
            return null;
        }

        const isExpired = Date.now() - parsed.timestamp > PROJECTS_CACHE_TTL_MS;
        if (isExpired) {
            return null;
        }

        return parsed.data;
    } catch (error) {
        return null;
    }
}

function saveProjectsCache(portfolioData) {
    const payload = {
        timestamp: Date.now(),
        data: portfolioData
    };
    localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(payload));
}

async function fetchGithubProjects() {
    const response = await fetch('./projects.json');

    if (!response.ok) {
        throw new Error(`Falha ao carregar projects.json: ${response.status}`);
    }

    const data = await response.json();
    return normalizePortfolioData(data);
}

export async function getProjects(params = {}) {
    const { forceRefresh = false } = params;

    if (!forceRefresh) {
        const cachedProjects = getCachedProjects();
        if (cachedProjects) {
            return cachedProjects;
        }
    }

    try {
        const portfolioData = await fetchGithubProjects();
        saveProjectsCache(portfolioData);
        return portfolioData;
    } catch (error) {
        const staleCacheRaw = localStorage.getItem(PROJECTS_CACHE_KEY);
        if (staleCacheRaw) {
            try {
                const staleParsed = JSON.parse(staleCacheRaw);
                if (staleParsed && staleParsed.data && Array.isArray(staleParsed.data.projects)) {
                    return staleParsed.data;
                }
            } catch (cacheError) {
                // Ignora fallback inválido
            }
        }
        throw error;
    }
}