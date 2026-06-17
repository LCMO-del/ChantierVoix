export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newEvent = {
      timestamp: new Date().toISOString(),
      ...req.body
    };

    const airtablePat = process.env.AIRTABLE_PAT;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableName = process.env.AIRTABLE_TABLE_NAME || 'Telemetry';

    if (airtablePat && airtableBaseId) {
      const allFields = {
        'Timestamp': newEvent.timestamp,
        'Session ID': newEvent.session_id || '',
        'Event Name': newEvent.event_name || '',
        'Client': newEvent.client || '',
        'Chantier': newEvent.chantier || '',
        'Adresse': newEvent.adresse || '',
        'Corps de métier': newEvent.corps_metier || '',
        'Total HT': newEvent.total_ht || '',
        'Total TTC': newEvent.total_ttc || '',
        'Event Data': JSON.stringify(newEvent.event_data || {})
      };

      const basicFields = {
        'Timestamp': newEvent.timestamp,
        'Session ID': newEvent.session_id || '',
        'Event Name': newEvent.event_name || '',
        'Event Data': JSON.stringify({
          client: newEvent.client,
          chantier: newEvent.chantier,
          adresse: newEvent.adresse,
          corps_metier: newEvent.corps_metier,
          total_ht: newEvent.total_ht,
          total_ttc: newEvent.total_ttc,
          ...newEvent.event_data
        })
      };

      const sendToAirtable = async (fields, isFallback = false) => {
        const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(airtableTableName)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtablePat}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ records: [{ fields }] })
        });

        if (!response.ok) {
          const errText = await response.text();
          if (!isFallback && (response.status === 422 || errText.includes('UNKNOWN_FIELD_NAME') || errText.includes('invalid_field'))) {
            console.warn('[Airtable] Fallback mode triggered on serverless function.');
            return await sendToAirtable(basicFields, true);
          }
          throw new Error(`Airtable API error (${response.status}): ${errText}`);
        }
      };

      await sendToAirtable(allFields);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Serverless Log Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
