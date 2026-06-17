# ChantierVoix BE (Gemini Prototype)
Prototype d'aide à la dictée de devis BTP par reconnaissance vocale et extraction IA (Gemini).

## Architecture
- `public/` : Code source frontend statique (HTML, CSS, JS).
- `api/` : Code backend Serverless pour exécuter les appels API de manière sécurisée.

## Stack Technique
- Frontend : Vanilla JS (Hébergé statiquement via Vercel)
- Backend : API Serverless Node.js (Vercel)
- IA : Gemini 1.5 Flash API
- Base de données (Télémétrie) : Supabase

## Déploiement Vercel
1. Poussez ce dépôt sur GitHub.
2. Créez un nouveau projet sur Vercel et connectez le dépôt.
3. Allez dans les paramètres d'environnement (Environment Variables) de Vercel et ajoutez :
   - Clé : `GEMINI_API_KEY`
   - Valeur : `votre_clé_google_ai_studio`
4. Déployez.
