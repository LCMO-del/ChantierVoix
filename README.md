# ChantierVoix (Prototype Dictée Devis BTP)

Ce prototype permet aux artisans et TPE du bâtiment de dicter des devis par reconnaissance vocale et d'extraire automatiquement les postes et quantités grâce à l'IA Gemini.

---

## 💻 Configuration sur un Nouveau PC

Si vous changez d'ordinateur, voici comment réinstaller le projet :

### 1. Prérequis
Installez **Node.js** (recommandé en version LTS) sur votre machine :  
👉 [Télécharger Node.js](https://nodejs.org/)

### 2. Récupérer le Code
1. Allez sur votre dépôt GitHub : **`https://github.com/LCMO-del/ChantierVoix`**
2. Cliquez sur le bouton vert **`Code`** puis sur **`Download ZIP`** (ou clonez-le si vous préférez).
3. Décompressez le dossier sur votre nouveau PC.

### 3. Créer le Fichier de Configuration (`.env`)
À la racine du dossier décompressé, créez un fichier nommé **`.env`** (ce fichier n'est pas sur GitHub pour des raisons de sécurité). Insérez-y vos clés comme ceci :
```env
GEMINI_API_KEY=votre_cle_gemini
AIRTABLE_PAT=votre_jeton_personnel_airtable
AIRTABLE_BASE_ID=votre_base_id
AIRTABLE_TABLE_NAME=Telemetry
GITHUB_TOKEN=votre_token_personnel_github
```

### 4. Installer et Lancer
Ouvrez votre terminal (PowerShell ou Invite de commandes) dans le dossier du projet, puis exécutez :
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur local
npm start
```
L'application sera accessible localement à l'adresse : **[http://localhost:3001](http://localhost:3001)**.

---

## 🚀 Mettre à Jour le Site en Ligne

Vous n'avez pas besoin d'avoir Git installé pour mettre à jour votre site en ligne sur Vercel. Un script personnalisé est fourni pour faire cela en une seule commande.

Dès que vous faites une modification locale (dans le code, le style CSS ou l'interface HTML) et que vous souhaitez la publier :
1. Ouvrez votre terminal dans le dossier du projet.
2. Exécutez la commande suivante :
```bash
node push.js "Description de ma modification"
```
*(Par exemple : `node push.js "Mise à jour du texte d'accueil"`)*

Le script va envoyer automatiquement vos modifications sur GitHub. Vercel détectera la mise à jour et publiera la nouvelle version de votre site en ligne automatiquement sous quelques secondes !
