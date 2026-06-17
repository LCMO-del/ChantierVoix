export default async function handler(req, res) {
  // Gérer uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // La clé API sera stockée dans les variables d'environnement de Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY non configurée sur le serveur Vercel' });
    }

    const { prompt, systemPrompt } = req.body;

    // Appel à l'API Gemini 3.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur provenant de l\'API Gemini');
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error('Structure de réponse inattendue de l\'API Gemini');
    }

    // On renvoie la réponse au frontend
    res.status(200).json({ result: resultText });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
