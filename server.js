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

    // Envoyer à Airtable si configuré
    const airtablePat = process.env.AIRTABLE_PAT;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableName = process.env.AIRTABLE_TABLE_NAME || 'Telemetry';

    if (airtablePat && airtableBaseId) {
      fetch(`https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtablePat}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                'Timestamp': newEvent.timestamp,
                'Session ID': newEvent.session_id || '',
                'Event Name': newEvent.event_name || '',
                'Event Data': JSON.stringify(newEvent.event_data || {})
              }
            }
          ]
        })
      })
      .then(async (response) => {
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Airtable Error] Status ${response.status}: ${errText}`);
        } else {
          console.log('[Airtable] Log enregistré avec succès.');
        }
      })
      .catch((err) => {
        console.error('[Airtable Connection Error]:', err);
      });
    }

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
