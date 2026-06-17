// Identifiant de session pour lier les actions d'un même utilisateur
const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);

async function trackEvent(eventName, eventData = {}) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        event_name: eventName,
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
