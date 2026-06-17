import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import analyzeHandler from './api/analyze.js';

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
app.post('/api/log', (req, res) => {
  try {
    const newEvent = {
      timestamp: new Date().toISOString(),
      ...req.body
    };

    let logs = [];
    // Lire le fichier existant
    if (fs.existsSync(telemetryFile)) {
      const fileData = fs.readFileSync(telemetryFile, 'utf-8');
      if (fileData) {
        logs = JSON.parse(fileData);
      }
    }

    // Ajouter le nouvel événement
    logs.push(newEvent);

    // Sauvegarder dans le fichier
    fs.writeFileSync(telemetryFile, JSON.stringify(logs, null, 2));

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur écriture log:', error);
    res.status(500).json({ error: 'Erreur interne' });
  }
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
