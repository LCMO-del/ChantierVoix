// ══════════════════════════════════════════
// CONFIGURATION IA
// ══════════════════════════════════════════
const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans les devis du secteur de la construction belge (BTP) pour artisans et TPE en Belgique (Wallonie, Bruxelles, Flandre).
Tu reçois une transcription vocale ou textuelle brute d'un artisan dictant un devis sur chantier.

Ta mission : extraire une liste structurée de lignes de devis au format JSON.

RÈGLES :
- Identifie chaque prestation distincte (pose, fourniture, démolition, dépose, etc.)
- Extrait : designation, quantite, unite, prix_unitaire_ht, total_ht, note
- Si prix total sans quantité → quantite=1, unite="forfait"
- Si quantité sans prix → prix_unitaire_ht: null
- Normalise : "mètre carré"→"m²", "mètre linéaire"→"ml", "pièce/unité"→"u", "heure"→"h"
- Corrige les termes mal transcrits selon le contexte BTP belge
- Si client, chantier, adresse ou taux TVA mentionnés → extrait-les
- Détecte le corps de métier principal

VOCABULAIRE BTP BELGE :
Structure: IPN, HEA, parpaing, bloc béton, hourdis, linteau, chaînage, dalle, semelle
Finitions: enduit, gobetis, ragréage, chape, chape fluide, carrelage, faïence, plinthe, MDF
Couverture: chevron, liteau, volige, tuile, ardoise, EPDM, bac acier, noue, faîtage, solin, zinguerie
Électricité: tableau, armoire, disjoncteur, différentiel, AGCP, prise, interrupteur, va-et-vient, gaine ICTA, câble, RGIE
Plomberie: sanitaire, robinetterie, chauffe-eau, boiler, chaudière, PAC, multicouche, PER, PVC, collecteur
Isolation: laine de verre, laine de roche, PIR, PUR, pare-vapeur, ITI, ITE, soufflage, frein vapeur
Menuiserie: châssis, double vitrage, triple vitrage, PVC, aluminium, volet, store, porte
Spécifique BE: bloc Ytong, brique de parement, hourdis céramique, égouttage, permis urbanisme

FORMAT JSON STRICT (aucun texte autour) :
{
  "lignes": [
    {
      "designation": "Pose carrelage grès cérame",
      "quantite": 20,
      "unite": "m²",
      "prix_unitaire_ht": 50,
      "total_ht": 1000,
      "note": ""
    }
  ],
  "client": "",
  "chantier": "",
  "adresse_chantier": "",
  "corps_metier": "",
  "tva_suggere": "",
  "remarques": ""
}`;

const CORRECTIONS = [
  ["i p n","IPN"],["i pé n","IPN"],["h e a","HEA"],["a g c p","AGCP"],
  ["p v c","PVC"],["p a c","PAC"],["p e r","PER"],["p i r","PIR"],["p u r","PUR"],
  ["mètre carré","m²"],["mètres carrés","m²"],["mètre linéaire","ml"],["mètres linéaires","ml"],
  ["i t e","ITE"],["i t i","ITI"],["e p d m","EPDM"],["r g i e","RGIE"],
  ["hors taxe","HT"],["toutes taxes","TTC"],["pompe à chaleur","PAC"],
  ["chauffe eau","chauffe-eau"],["va et vient","va-et-vient"],
];

window.applyCorrections = function(t) {
  CORRECTIONS.forEach(([f, r]) => { t = t.replace(new RegExp(f, "gi"), r); });
  return t;
};

window.analyzeWithGemini = async function() {
  const src = window.currentMode === "voice" ? window.transcript : document.getElementById("manualText").value;
  if (!src.trim()) { window.showError("Rien à analyser."); return; }

  // Log du prompt pour les statistiques
  window.trackEvent('prompt_analyzed', { prompt_text: src, mode: window.currentMode });

  const btn = document.getElementById("btnAnalyze");
  btn.innerHTML = '<span class="spinner"></span>Gemini analyse...';
  btn.disabled = true;
  window.hideError();

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: window.applyCorrections(src),
        systemPrompt: SYSTEM_PROMPT
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const parsed = JSON.parse(data.result);

    // Ajout des lignes extraites
    if (parsed.lignes) window.lines = [...window.lines, ...parsed.lignes];

    // Remplissage automatique des champs
    if (parsed.client) document.getElementById("f_client").value = parsed.client;
    if (parsed.chantier) document.getElementById("f_chantier").value = parsed.chantier;
    if (parsed.adresse_chantier) document.getElementById("f_adresse").value = parsed.adresse_chantier;
    if (parsed.corps_metier) {
      const sel = document.getElementById("f_corps");
      for (let o of sel.options) {
        if (o.value.toLowerCase().includes(parsed.corps_metier.toLowerCase())) { sel.value = o.value; break; }
      }
    }
    if (parsed.tva_suggere) {
      const d = document.getElementById("tvaSuggestion");
      d.textContent = "Suggestion Gemini : " + parsed.tva_suggere;
      d.style.display = "block";
    }
    if (parsed.remarques) {
      const r = document.getElementById("notesGemini");
      r.textContent = "Note Gemini : " + parsed.remarques;
      r.style.display = "block";
    }

    window.updatePDFMeta();
    window.renderLines();
    window.showResults();

    window.trackEvent('ai_success', { lines_extracted: parsed.lignes ? parsed.lignes.length : 0 });

  } catch (e) {
    window.showError("Erreur extraction : " + e.message);
    window.trackEvent('ai_error', { error: e.message });
  }

  btn.textContent = "Analyser avec Gemini";
  window.checkCanAnalyze();
};
