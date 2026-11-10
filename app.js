(() => {
  const $ = (id) => document.getElementById(id);
  const startBtn = $("startBtn"), stopBtn = $("stopBtn"), resetBtn = $("resetBtn");
  let stream = null, audioContext = null, analyser = null, source = null, raf = 0;
  let listening = false, previousAbove = false, lastEventTime = null;
  let noiseFloor = 0.002, threshold = 0.012, lastAccepted = -Infinity;
  let eventTimes = [], intervals = [], displayEvents = [];
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
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    const level = rmsFromBuffer(data);
    // Track a slowly changing ambient level, but do not let a tick immediately raise it.
    if (level < threshold) noiseFloor = noiseFloor * 0.995 + level * 0.005;
    threshold = Math.max(0.009, noiseFloor * 3.5, 0.012);
    const pct = Math.min(100, level * 1600);
    $("levelBar").style.width = `${pct}%`;
    $("levelText").textContent = level.toFixed(3);
    const now = performance.now();
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
      analyser.smoothingTimeConstant = 0;
      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      listening = true; previousAbove = false; lastAccepted = -Infinity;
      startBtn.disabled = true; stopBtn.disabled = false;
      setStatus("Listening", "Listening in the foreground. Keep this screen open while measuring.", true);
      listenLoop();
    } catch (err) {
      setStatus("Could not start microphone", err && err.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access for this site in iPhone Settings, then try again." : `Microphone error: ${err.message || err}`);
    }
  }
  async function stop() {
    listening = false; cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (audioContext) { try { await audioContext.close(); } catch(e) {} }
    stream = audioContext = analyser = source = null;
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
