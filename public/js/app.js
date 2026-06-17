const UNITS = ["m²","ml","u","forfait","m³","h","kg","T","m"];

window.lines = [];
window.currentMode = "voice";
window.numDevis = generateNumDevis();

function generateNumDevis() {
  return "DEV-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900) + 100);
}

window.setMode = function(m) {
  window.currentMode = m;
  document.getElementById("zoneVoice").style.display = m === "voice" ? "block" : "none";
  document.getElementById("zoneText").style.display = m === "text" ? "block" : "none";
  document.getElementById("tabVoice").className = "tab" + (m === "voice" ? " active" : "");
  document.getElementById("tabText").className = "tab" + (m === "text" ? " active" : "");
  window.checkCanAnalyze();
};

document.getElementById("manualText").addEventListener("input", () => window.checkCanAnalyze());

window.checkCanAnalyze = function() {
  const src = window.currentMode === "voice" ? window.transcript : document.getElementById("manualText").value;
  const btn = document.getElementById("btnAnalyze");
  const busy = btn.textContent.includes("analyse");
  btn.disabled = !src.trim() || busy;
};

window.toggleParams = function() {
  const box = document.getElementById("paramsBox");
  box.classList.toggle("open");
};

window.updatePDFMeta = function() {
  document.getElementById("pdfClient").textContent = document.getElementById("f_client").value || "—";
  document.getElementById("pdfChantier").textContent = document.getElementById("f_chantier").value || "—";
  const ent = document.getElementById("p_entreprise").value;
  if (ent) document.getElementById("pdfEntreprise").textContent = ent;
  const bce = document.getElementById("p_bce").value;
  const tvaNum = document.getElementById("p_tva_num").value;
  const coords = [document.getElementById("p_adresse_ent").value, document.getElementById("p_tel").value, document.getElementById("p_email").value].filter(Boolean).join(" · ");
  document.getElementById("pdfCoords").textContent = coords;
  document.getElementById("bceDisplay").textContent = [bce ? "BCE " + bce : "", tvaNum].filter(Boolean).join(" · ");
};

window.renderLines = function() {
  const tbody = document.getElementById("linesBody");
  tbody.innerHTML = window.lines.map((l, i) => {
    const total = l.quantite && l.prix_unitaire_ht
      ? Number(l.quantite) * Number(l.prix_unitaire_ht)
      : Number(l.total_ht || 0);
    const uOpts = UNITS.map(u => `<option${u === (l.unite || "u") ? " selected" : ""}>${u}</option>`).join("");
    return `<tr style="border-bottom:0.5px solid #f1efe8;">
      <td><input value="${(l.designation || "").replace(/"/g,"&quot;")}" onchange="updateLine(${i},'designation',this.value)" style="width:100%;"/></td>
      <td><input type="number" value="${l.quantite ?? ""}" onchange="updateLine(${i},'quantite',this.value)" style="width:100%;text-align:right;"/></td>
      <td><select onchange="updateLine(${i},'unite',this.value)" style="width:100%;">${uOpts}</select></td>
      <td><input type="number" value="${l.prix_unitaire_ht ?? ""}" placeholder="—" onchange="updateLine(${i},'prix_unitaire_ht',this.value)" style="width:100%;text-align:right;"/></td>
      <td style="text-align:right;font-weight:500;white-space:nowrap;">${total > 0 ? total.toLocaleString("fr-BE", { minimumFractionDigits: 2 }) + " €" : "—"}</td>
      <td><button class="del-btn" onclick="deleteLine(${i})">✕</button></td>
    </tr>`;
  }).join("");
  window.updateTotals();
};

window.updateLine = function(i, f, v) { 
  const oldValue = window.lines[i][f];
  window.lines[i][f] = v; 
  window.renderLines(); 
  window.trackEvent('line_edited', { field: f, old_value: oldValue, new_value: v });
};

window.deleteLine = function(i) { 
  window.lines.splice(i, 1); 
  window.renderLines(); 
  window.trackEvent('line_deleted');
};

window.addLine = function() {
  window.lines.push({ designation: "", quantite: 1, unite: "u", prix_unitaire_ht: null, total_ht: null, note: "" });
  window.renderLines();
  window.showResults();
  window.trackEvent('line_added_manually');
};

window.updateTotals = function() {
  const tvaRate = parseFloat(document.getElementById("f_tva").value);
  const ht = window.lines.reduce((s, l) => {
    const t = l.quantite && l.prix_unitaire_ht
      ? Number(l.quantite) * Number(l.prix_unitaire_ht)
      : Number(l.total_ht || 0);
    return s + t;
  }, 0);
  const tvaAmt = ht * tvaRate;
  const ttc = ht + tvaAmt;
  const fmt = v => v.toLocaleString("fr-BE", { minimumFractionDigits: 2 }) + " €";

  document.getElementById("totalHT").textContent = fmt(ht);
  document.getElementById("totalTVA").textContent = fmt(tvaAmt);
  document.getElementById("totalTTC").textContent = fmt(ttc);
  document.getElementById("tvaLabel").textContent = "TVA " + (tvaRate * 100).toFixed(0) + "%";
  document.getElementById("tvaNote6").style.display = tvaRate === 0.06 ? "block" : "none";
  document.getElementById("tvaNote0").style.display = tvaRate === 0 ? "block" : "none";
};

window.exportPDF = function() {
  document.getElementById("pdfDate").textContent = new Date().toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
  document.getElementById("numDevisLabel").textContent = window.numDevis;
  document.getElementById("pdfNumDevis").textContent = window.numDevis;
  window.updatePDFMeta();

  document.getElementById("pdfHeader").style.display = "block";
  window.trackEvent('pdf_exported', { number_of_lines: window.lines.length });

  setTimeout(() => {
    window.print();
    document.getElementById("pdfHeader").style.display = "none";
  }, 200);
};

window.showResults = function() {
  document.getElementById("results").style.display = "block";
  document.getElementById("emptyMsg").style.display = "none";
  document.getElementById("numDevisLabel").textContent = window.numDevis;
};

window.showError = function(msg) {
  const e = document.getElementById("errorBox");
  e.textContent = msg;
  e.style.display = "block";
};

window.hideError = function() {
  document.getElementById("errorBox").style.display = "none";
};

window.resetAll = function() {
  window.trackEvent('devis_reset');
  window.lines = [];
  window.transcript = "";
  window.numDevis = generateNumDevis();
  document.getElementById("manualText").value = "";
  document.getElementById("f_client").value = "";
  document.getElementById("f_chantier").value = "";
  document.getElementById("f_adresse").value = "";
  document.getElementById("f_corps").value = "";
  document.getElementById("f_tva").value = "0.21";
  document.getElementById("transcriptBox").style.display = "none";
  document.getElementById("tvaSuggestion").style.display = "none";
  document.getElementById("notesGemini").style.display = "none";
  document.getElementById("errorBox").style.display = "none";
  document.getElementById("results").style.display = "none";
  document.getElementById("emptyMsg").style.display = "block";
  document.getElementById("linesBody").innerHTML = "";
  window.updateMicUI(false);
  window.checkCanAnalyze();
  window.updateTotals();
};

document.addEventListener('DOMContentLoaded', () => {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    document.getElementById("tabVoice").style.display = "none";
    window.setMode("text");
    document.getElementById("micHint").textContent = "Reconnaissance vocale non disponible — utilisez Chrome ou Edge.";
  }

  document.getElementById("pdfDate").textContent = new Date().toLocaleDateString("fr-BE", {
    day: "numeric", month: "long", year: "numeric"
  });

  window.updateTotals();
});
