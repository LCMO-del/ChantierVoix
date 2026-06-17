window.recognition = null;
window.listening = false;
window.transcript = "";

window.toggleMic = function() {
  if (window.listening) { window.stopListening(); return; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    window.showError("Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.");
    return;
  }

  window.hideError();
  window.transcript = "";
  document.getElementById("transcriptBox").style.display = "none";
  
  window.trackEvent('dictation_started');

  const r = new SR();
  r.lang = "fr-BE";
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;

  let final = "";

  r.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t + " ";
      else interim = t;
    }
    document.getElementById("micHint").textContent = interim || "...";
    if (final) {
      window.transcript = window.applyCorrections(final);
      const box = document.getElementById("transcriptBox");
      box.textContent = '"' + window.transcript + '"';
      box.style.display = "block";
      window.checkCanAnalyze();
    }
  };

  r.onerror = (e) => {
    window.showError("Erreur micro : " + e.error);
    window.stopListening();
  };

  r.onend = () => { if (window.listening) { window.listening = false; window.updateMicUI(false); } };

  window.recognition = r;
  r.start();
  window.listening = true;
  window.updateMicUI(true);
};

window.stopListening = function() {
  window.recognition?.stop();
  window.listening = false;
  window.updateMicUI(false);
  window.trackEvent('dictation_stopped');
};

window.updateMicUI = function(active) {
  const col = active ? "white" : "#1a1a18";
  document.getElementById("micBtn").className = "mic-btn" + (active ? " active" : "");
  document.getElementById("micRect").setAttribute("fill", col);
  ["micArc","micL1","micL2"].forEach(id => document.getElementById(id).setAttribute("stroke", col));
  document.getElementById("micLabel").className = "mic-label" + (active ? " recording" : "");
  document.getElementById("micLabel").textContent = active ? "Enregistrement en cours..." : (window.transcript ? "Dictée prête — cliquez Analyser" : "Cliquez pour dicter");
  document.getElementById("micHint").textContent = active ? "Parlez maintenant..." : (window.transcript ? "" : "Parlez naturellement — fr-BE ou nl-BE");
  document.getElementById("btnStop").style.display = active ? "inline-block" : "none";
};
