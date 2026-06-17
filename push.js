import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_NAME = 'ChantierVoix';
const filesToPush = [
  'package.json',
  'package-lock.json',
  'server.js',
  'api/analyze.js',
  'api/log.js',
  'vercel.json',
  'public/index.html',
  'public/css/style.css',
  'public/js/app.js',
  'public/js/api.js',
  'public/js/speech.js',
  'public/js/telemetry.js',
  '.gitignore',
  'README.md',
  'telemetry.json',
  'push.js'
];

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.github.com${endpoint}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ChantierVoix-Push-Script'
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub API Error (${response.status}): ${errText}`);
  }
  return response.json();
}

async function run() {
  if (!GITHUB_TOKEN) {
    console.error('❌ Erreur : La variable GITHUB_TOKEN est manquante dans votre fichier .env');
    process.exit(1);
  }

  try {
    console.log('Récupération des infos utilisateur GitHub...');
    const user = await apiRequest('/user');
    const owner = user.login;
    console.log(`Connecté en tant que : ${owner}`);

    console.log('Obtention du dernier commit sur la branche main...');
    const refData = await apiRequest(`/repos/${owner}/${REPO_NAME}/git/ref/heads/main`);
    const latestCommitSha = refData.object.sha;

    const commitData = await apiRequest(`/repos/${owner}/${REPO_NAME}/git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;

    console.log('Création des blobs pour les fichiers...');
    const treeItems = [];
    for (const filePath of filesToPush) {
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(`Blob -> ${filePath}...`);
        const blobData = await apiRequest(`/repos/${owner}/${REPO_NAME}/git/blobs`, 'POST', {
          content,
          encoding: 'utf-8'
        });
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        });
      }
    }

    console.log("Création de l'arborescence (Tree)...");
    const newTreeData = await apiRequest(`/repos/${owner}/${REPO_NAME}/git/trees`, 'POST', {
      base_tree: baseTreeSha,
      tree: treeItems
    });

    console.log('Création du commit...');
    const commitMsg = process.argv[2] || 'Mise à jour du site ChantierVoix';
    const newCommitData = await apiRequest(`/repos/${owner}/${REPO_NAME}/git/commits`, 'POST', {
      message: commitMsg,
      tree: newTreeData.sha,
      parents: [latestCommitSha]
    });

    console.log('Mise à jour de la branche main...');
    await apiRequest(`/repos/${owner}/${REPO_NAME}/git/refs/heads/main`, 'PATCH', {
      sha: newCommitData.sha,
      force: true
    });

    console.log(`\n🎉 Succès ! Le site a été mis à jour.`);
    console.log(`Dépôt : https://github.com/${owner}/${REPO_NAME}`);
    console.log(`Vercel va reconstruire et publier la mise à jour automatiquement d'ici quelques secondes !`);
  } catch (err) {
    console.error('\n❌ Erreur de synchronisation :', err.message);
  }
}

run();
