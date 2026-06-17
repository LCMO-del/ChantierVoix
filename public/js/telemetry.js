// Identifiant de session pour lier les actions d'un même utilisateur
const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);

async function trackEvent(eventName, eventData = {}) {
  try {
    const client = document.getElementById("f_client")?.value || "";
    const chantier = document.getElementById("f_chantier")?.value || "";
    const adresse = document.getElementById("f_adresse")?.value || "";
    const corpsMetier = document.getElementById("f_corps")?.value || "";
    const tva = document.getElementById("f_tva")?.value || "";
    const totalHT = document.getElementById("totalHT")?.textContent || "";
    const totalTTC = document.getElementById("totalTTC")?.textContent || "";

    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        event_name: eventName,
        client: client,
        chantier: chantier,
        adresse: adresse,
        corps_metier: corpsMetier,
        tva: tva,
        total_ht: totalHT,
        total_ttc: totalTTC,
        event_data: eventData
      })
    });
  } catch (err) {
    console.error('Erreur tracking:', err);
  }
}

// Global scope attachment
window.trackEvent = trackEvent;

// Log ouverture de l'application
window.trackEvent('app_opened');
