import fs from 'node:fs/promises';
import path from 'node:path';

const OWNER = process.env.GITHUB_OWNER || 'JockaMT';
const REPO_ROOT = process.cwd();
const PROJECTS_PATH = path.join(REPO_ROOT, 'projects.json');
const TOKEN = process.env.GITHUB_TOKEN || '';

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'projects-sync-script'
};

if (TOKEN) {
  headers.Authorization = `Bearer ${TOKEN}`;
}

const categoryAllowList = new Set(['frontend', 'backend', 'fullstack', 'other']);

function inferCategories(topics = []) {
  const matched = topics
    .map((topic) => topic.toLowerCase())
    .filter((topic) => categoryAllowList.has(topic));

  if (matched.length) {
    return [...new Set(matched)];
  }

  return ['other'];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${url}`);
  }
  return response.json();
}

async function fetchLanguages(languagesUrl) {
  try {
    const languages = await fetchJson(languagesUrl);
    return Object.keys(languages || {});
  } catch {
    return [];
  }
}

async function main() {
  const existingRaw = await fs.readFile(PROJECTS_PATH, 'utf8');
  const existingData = JSON.parse(existingRaw);

  const repos = await fetchJson(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=updated`);

  const projects = await Promise.all(
    repos.map(async (repo) => {
      const repoLanguages = await fetchLanguages(repo.languages_url);
      const baseLanguage = repo.language ? [repo.language] : [];
      const technologies = unique([...baseLanguage, ...repoLanguages]);

      return {
        name: repo.name.replace(/-/g, ' ').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
        description: repo.description || 'Sem descricao disponivel.',
        url: repo.homepage || '',
        gh: repo.html_url,
        categories: inferCategories(repo.topics || []),
        technologies
      };
    })
  );

  const allCategories = unique(projects.flatMap((project) => project.categories)).sort();
  const allTechnologies = unique(projects.flatMap((project) => project.technologies)).sort();

  const nextData = {
    projects,
    cartegories: allCategories,
    technologies: allTechnologies,
    skills: existingData.skills || {}
  };

  await fs.writeFile(PROJECTS_PATH, `${JSON.stringify(nextData, null, 4)}\n`, 'utf8');
  console.log(`projects.json atualizado com ${projects.length} projetos.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
