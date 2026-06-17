import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import analyzeHandler from './api/analyze.js';
import logHandler from './api/log.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Distribuer les fichiers statiques (le frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Redirection de la route API vers la fonction de Vercel
app.post('/api/analyze', async (req, res) => {
  await analyzeHandler(req, res);
});

// Nouvelle route pour la télémétrie locale
const telemetryFile = path.join(__dirname, 'telemetry.json');
app.post('/api/log', async (req, res) => {
  // 1. Sauvegarder localement dans telemetry.json pour le développement local
  try {
    const newEvent = {
      timestamp: new Date().toISOString(),
      ...req.body
    };

    let logs = [];
    if (fs.existsSync(telemetryFile)) {
      const fileData = fs.readFileSync(telemetryFile, 'utf-8');
      if (fileData) {
        logs = JSON.parse(fileData);
      }
    }
    logs.push(newEvent);
    fs.writeFileSync(telemetryFile, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Erreur écriture log locale:', error);
  }

  // 2. Déléguer au handler de base (qui gère l'envoi Airtable)
  await logHandler(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('===================================================');
  console.log(`🚀 Serveur local démarré sur : http://localhost:${PORT}`);
  console.log('===================================================');
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ ATTENTION : La variable GEMINI_API_KEY est manquante dans le fichier .env');
  }
});
