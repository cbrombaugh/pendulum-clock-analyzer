(() => {
  const $ = (id) => document.getElementById(id);
  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), resetBtn = $("resetBtn");
  let stream = null, audioContext = null, analyser = null, source = null, raf = 0;
  let listening = false, previousAbove = false, lastEventTime = null;
  let noiseFloor = 0.002, threshold = 0.004, lastAccepted = -Infinity;
  let calibrationUntil = 0, calibrationSamples = [];
  let eventTimes = [], intervals = [], displayEvents = [];
  let audioData = null;
  const MIN_GAP_MS = 140;

  function setStatus(text, help, live=false) {
    $("statusText").textContent = text;
    $("statusHelp").textContent = help;
    $("statusDot").classList.toggle("live", live);
  }
  function fmt(n, digits=3) { return Number.isFinite(n) ? n.toFixed(digits) : "—"; }
  function rmsFromBuffer(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / data.length);
  }
  function acceptEvent(t, level) {
    if (t - lastAccepted < MIN_GAP_MS) return;
    lastAccepted = t;
    eventTimes.push(t);
    if (lastEventTime !== null) {
      const gap = (t - lastEventTime) / 1000;
      if (gap > 0.15 && gap < 10) intervals.push(gap);
      $("lastInterval").textContent = fmt(gap);
    }
    lastEventTime = t;
    $("eventCount").textContent = String(eventTimes.length);
    displayEvents.unshift({time: new Date().toLocaleTimeString(), level, gap: eventTimes.length > 1 ? intervals[intervals.length - 1] : null});
    displayEvents = displayEvents.slice(0, 12);
    renderEvents();
    updateAverages();
  }
  function updateAverages() {
    const a = intervals.filter((_, i) => i % 2 === 0);
    const b = intervals.filter((_, i) => i % 2 === 1);
    const mean = arr => arr.length ? arr.reduce((x,y)=>x+y,0)/arr.length : NaN;
    const avA = mean(a), avB = mean(b);
    $("avgA").textContent = fmt(avA);
    $("avgB").textContent = fmt(avB);
    if (Number.isFinite(avA) && Number.isFinite(avB)) {
      const diff = Math.abs(avA-avB) * 1000;
      $("beatDifference").textContent = fmt(diff, 1);
      $("beatStatus").textContent = diff < 5 ? "Close" : diff < 20 ? "Small difference" : "Uneven";
      $("beatAdvice").textContent = `${diff.toFixed(1)} ms between alternating averages`;
    }
  }
  function renderEvents() {
    const list = $("eventList");
    list.replaceChildren();
    if (!displayEvents.length) {
      const li = document.createElement("li"); li.className = "empty"; li.textContent = "No sounds detected yet."; list.append(li); return;
    }
    displayEvents.forEach((e, i) => {
      const li = document.createElement("li");
      li.textContent = `${e.time} · ${e.gap === null ? "first detection" : `${e.gap.toFixed(3)} s since previous`} · level ${e.level.toFixed(3)}`;
      list.append(li);
    });
  }
  function listenLoop() {
    if (!listening || !analyser) return;
    analyser.getByteTimeDomainData(audioData);
    const level = rmsFromBuffer(audioData);
    const now = performance.now();
    // First measure the room's background level so a steady hum does not hold
    // the detector permanently above its trigger threshold.
    if (now < calibrationUntil) {
      calibrationSamples.push(level);
      const pct = Math.min(100, level * 4000);
      $("levelBar").style.width = `${pct}%`;
      $("levelText").textContent = level.toFixed(3);
      raf = requestAnimationFrame(listenLoop);
      return;
    }
    if (calibrationSamples.length) {
      calibrationSamples.sort((a, b) => a - b);
      noiseFloor = calibrationSamples[Math.floor(calibrationSamples.length * 0.2)];
      threshold = noiseFloor + Math.max(0.0006, noiseFloor * 0.12);
      calibrationSamples = [];
      setStatus("Listening", "Background measured. Keep this screen open while measuring.", true);
    }
    // Slowly follow quieter background changes without following loud ticks.
    if (level < threshold) {
      noiseFloor = noiseFloor * 0.999 + level * 0.001;
      threshold = noiseFloor + Math.max(0.0006, noiseFloor * 0.12);
    }
    const pct = Math.min(100, level * 4000);
    $("levelBar").style.width = `${pct}%`;
    $("levelText").textContent = level.toFixed(3);
    const above = level > threshold;
    if (above && !previousAbove && now - lastAccepted >= MIN_GAP_MS) acceptEvent(now, level);
    previousAbove = above;
    raf = requestAnimationFrame(listenLoop);
  }
  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Microphone unavailable", "Open the published app in Safari over HTTPS. Microphone access is not available in this browser context."); return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation:false, noiseSuppression:false, autoGainControl:false}, video:false});
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") await audioContext.resume();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      audioData = new Uint8Array(analyser.fftSize);
      analyser.smoothingTimeConstant = 0;
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      listening = true; previousAbove = false; lastAccepted = -Infinity;
      calibrationSamples = [];
      calibrationUntil = performance.now() + 1500;
      startBtn.disabled = true; stopBtn.disabled = false;
      setStatus("Calibrating microphone", "Keep the phone still and quiet for 1.5 seconds while the app measures background sound.", true);
      listenLoop();
    } catch (err) {
      setStatus("Could not start microphone", err && err.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access for this site in iPhone Settings, then try again." : `Microphone error: ${err.message || err}`);
    }
  }
  async function stop() {
    listening = false; cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (audioContext) { try { await audioContext.close(); } catch(e) {} }
    stream = audioContext = analyser = source = audioData = null;
    startBtn.disabled = false; stopBtn.disabled = true;
    setStatus("Not listening", "Tap Start listening when you are ready to measure.");
    $("levelBar").style.width = "0%"; $("levelText").textContent = "—";
  }
  function reset() {
    eventTimes = []; intervals = []; displayEvents = []; lastEventTime = null; lastAccepted = -Infinity;
    $("lastInterval").textContent = "—"; $("eventCount").textContent = "0";
    $("avgA").textContent = "—"; $("avgB").textContent = "—";
    $("beatDifference").textContent = "—"; $("beatStatus").textContent = "Waiting";
    $("beatAdvice").textContent = "Need more detected intervals"; renderEvents();
  }
  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
  resetBtn.addEventListener("click", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && listening) stop();
  });
})();
