// --------------------- Utilities & State ---------------------
const state = {
    points: 0,
    badges: new Set(JSON.parse(localStorage.getItem('cybersim_badges') || "[]")),
  };
  
  const saveState = () => {
    localStorage.setItem('cybersim_points', state.points);
    localStorage.setItem('cybersim_badges', JSON.stringify([...state.badges]));
  };
  (function initFromStorage() {
    const pts = parseInt(localStorage.getItem('cybersim_points') || "0", 10);
    state.points = Number.isFinite(pts) ? pts : 0;
  })();
  
  const addPoints = (n, reason) => {
    state.points += n;
    state.badges.add(reason || "completed");
    saveState();
    renderPoints();
  };
  
  const renderPoints = () => {
    document.getElementById('pointsBadge').textContent = `Points: ${state.points}`;
  };
  
  // set year
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // -------------------- Navigation --------------------
  const sections = { overview: '#overview', simulations: '#simulations', quiz: '#quiz' };
  document.getElementById('overviewBtn').addEventListener('click', () => showSection('overview'));
  document.getElementById('simulationsBtn').addEventListener('click', () => showSection('simulations'));
  document.getElementById('quizBtn').addEventListener('click', () => showSection('quiz'));
  function showSection(name) {
    Object.keys(sections).forEach(k => {
      document.getElementById(k).hidden = (k !== name);
    });
    // Jump to top of main for accessibility
    document.getElementById('main').scrollIntoView({behavior:'smooth'});
  }
  
  // start buttons in overview
  document.querySelectorAll('.start-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const target = e.currentTarget.dataset.target;
      showSection('simulations');
      // set simulation tab
      setActiveTab(target);
    });
  });
  
  // -------------------- Tabs --------------------
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(t => t.addEventListener('click', () => setActiveTab(t.dataset.sim)));
  function setActiveTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.sim === name));
    document.getElementById('phishingSim').hidden = (name !== 'phishing');
    document.getElementById('passwordSim').hidden = (name !== 'password');
    document.getElementById('sqlSim').hidden = (name !== 'sql');
  }
  
  // ------------------ PHISHING SIM ------------------
  const phishingCorrect = new Set(['sender','link','urgency']);
  document.getElementById('checkPhishing').addEventListener('click', () => {
    const chosen = [...document.querySelectorAll('#phishingSim .options input:checked')].map(i => i.value);
    const resultEl = document.getElementById('phishingResult');
    if(chosen.length === 0){
      resultEl.innerHTML = `<strong class="danger">Pick at least one item.</strong>`;
      return;
    }
    // evaluate
    const correctPicked = chosen.filter(c => phishingCorrect.has(c)).length;
    const wrongPicked = chosen.filter(c => !phishingCorrect.has(c)).length;
    const missed = [...phishingCorrect].filter(c => !chosen.includes(c)).length;
  
    let score = Math.max(0, correctPicked - wrongPicked - missed);
    if(score < 0) score = 0;
    const earned = score * 10;
    addPoints(earned, 'phishing');
  
    let msg = `<strong>Result:</strong> You identified ${correctPicked} suspicious items and chose ${wrongPicked} incorrect ones. You earned ${earned} points.`;
    msg += `<div class="muted" style="margin-top:8px">Why: Sender spelled like <code>micros0ft-security</code> is counterfeit; the link domain is unusually long and not official; urgency language pressures the user — classic phishing indicators.</div>`;
    resultEl.innerHTML = msg;
  
    // update recommendation
    recommendNext();
  });
  
  document.getElementById('explainPhishing').addEventListener('click', () => {
    const el = document.getElementById('phishingResult');
    el.innerHTML = `<strong>Phishing explainers</strong>
    <ul>
      <li>Check the visible sender and full reply-to address.</li>
      <li>Hover any link (or long-press on mobile) to reveal the real destination.</li>
      <li>Beware urgent threats and unexpected attachments/requests for credentials.</li>
    </ul>`;
  });
  
  // ------------------ PASSWORD SIM ------------------
  const pwdInput = document.getElementById('pwdInput');
  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');
  function evaluatePassword(pw){
    // Simple entropy approximation for demonstration only
    if(!pw || pw.length === 0) return {score:0, label:'Empty', time: 'Instant'};
    let pool = 0;
    if(/[a-z]/.test(pw)) pool += 26;
    if(/[A-Z]/.test(pw)) pool += 26;
    if(/[0-9]/.test(pw)) pool += 10;
    if(/[^A-Za-z0-9]/.test(pw)) pool += 32;
    // estimate bits = log2(pool^len) = len * log2(pool)
    const bits = pw.length * (pool > 0 ? Math.log2(pool) : 0);
    // approximate time to crack with 1e9 guesses/sec (visual sim)
    const guesses = Math.pow(2, bits);
    const seconds = guesses / 1e9;
    // convert to friendly
    function humanTime(s){
      if(!isFinite(s) || s <= 0) return 'Instant';
      const years = s / (60*60*24*365);
      if(years > 1000) return `${Math.round(years)} years`;
      if(years >= 1) return `${years.toFixed(1)} years`;
      const days = s / (60*60*24);
      if(days >= 1) return `${Math.round(days)} days`;
      const hours = s / 3600;
      if(hours >= 1) return `${Math.round(hours)} hours`;
      const minutes = s / 60;
      if(minutes >= 1) return `${Math.round(minutes)} minutes`;
      return `${Math.round(s)} seconds`;
    }
    let score = Math.min(100, Math.round((bits / 60) * 100));
    let label = 'Weak';
    if(score > 75) label = 'Very strong';
    else if(score > 50) label = 'Strong';
    else if(score > 25) label = 'Fair';
    return {score, label, time: humanTime(seconds), bits: Math.round(bits)};
  }
  
  pwdInput.addEventListener('input', () => {
    const res = evaluatePassword(pwdInput.value);
    strengthBar.style.width = Math.max(6, res.score) + '%';
    strengthBar.setAttribute('aria-valuenow', res.score);
    strengthLabel.textContent = `${res.label} (${res.time})`;
    // Ensure proper color updates
    if (res.score > 75) strengthBar.style.background = 'linear-gradient(90deg,#12b886,#0a84ff)';
    else if (res.score > 50) strengthBar.style.background = 'linear-gradient(90deg,#f1c40f,#0a84ff)';
    else strengthBar.style.background = 'linear-gradient(90deg,#ff5252,#f39c12)';
  });
  
  document.getElementById('runCrack').addEventListener('click', () => {
    const pwd = pwdInput.value || '';
    const out = document.getElementById('crackResult');
    const res = evaluatePassword(pwd);
    out.innerHTML = `<strong>Simulation</strong>: Estimated time-to-crack — <em>${res.time}</em> (visual estimate). Entropy: ${res.bits} bits.`;
    const earned = res.score > 70 ? 20 : res.score > 40 ? 10 : 2;
    addPoints(earned, 'password');
    out.innerHTML += `<div class="muted" style="margin-top:8px">Recommendation: Use longer passphrases (3+ words), avoid single common words, and enable multi-factor authentication.</div>`;
    recommendNext();
  });
  
  document.getElementById('suggestPwd').addEventListener('click', () => {
    const words = ["ocean", "paper", "coffee", "mountain", "purple", "atlas", "neon", "cider", "galaxy", "harbor", "tango", "ember"];
    function pick(n) {
      return Array.from({ length: n }, () => words[Math.floor(Math.random() * words.length)]).join('-') + Math.floor(Math.random() * 90 + 10);
    }
    const suggestion = pick(3);
    pwdInput.value = suggestion;
    pwdInput.dispatchEvent(new Event('input'));
    document.getElementById('crackResult').innerHTML = `<strong>Suggested passphrase:</strong> ${suggestion} — safe to copy and customize.`;
  });
  
  // ------------------ SQL SIM ------------------
  // This is a safe simulation engine that demonstrates how unsanitized inputs can change results.
  // It never runs real SQL; it computes textually what would happen in a vulnerable template.
  function simulatedQuery(username, password) {
    // Insecure template (for demonstration): "SELECT * FROM users WHERE user='${username}' AND pass='${password}';"
    const raw = `SELECT * FROM users WHERE user='${username}' AND pass='${password}';`;
    // Simulated behavior: if username contains "' OR '1'='1" then attacker bypass simulated auth
    const normalized = `${username} ${password}`.toLowerCase();
    const injectionPatterns = ["' or '1'='1","' or 1=1 --","\" or \"1\"=\"1","or 1=1"];
    const breached = injectionPatterns.some(p => normalized.includes(p.replace(/\s+/g,' ')));
    return {raw, breached};
  }
  
  document.getElementById('submitSql').addEventListener('click', () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('passwordSql').value.trim();
    const out = document.getElementById('sqlOutput');
    const advice = document.getElementById('sqlAdvice');
    const sim = simulatedQuery(u, p);
    out.innerHTML = `<div><strong>Simulated Query:</strong></div><pre>${escapeHtml(sim.raw)}</pre>`;
    if (sim.breached) {
      out.innerHTML += `<div style="margin-top:8px"><strong style="color: #ffb4b4">Simulation result:</strong> Login bypass possible in this simulated vulnerable app.</div>`;
      advice.innerHTML = `<strong>Advice:</strong> Use parameterized queries / prepared statements and input validation. Never concatenate raw user input into SQL templates.`;
      addPoints(25, 'sql');
    } else {
      advice.innerHTML = `<strong>Simulated result:</strong> No immediate bypass detected for these inputs. However, still use parameterized queries.`;
      addPoints(8, 'sql');
    }
    recommendNext();
  });
  
  document.getElementById('sanitizeSql').addEventListener('click', () => {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('passwordSql').value.trim();
    const out = document.getElementById('sqlOutput');
    out.innerHTML = `<div><strong>Safe parameterized example (pseudocode):</strong></div>
    <pre>db.query("SELECT * FROM users WHERE user = ? AND pass = ?", [${escapeHtml(u)}, ${escapeHtml(p)}])</pre>
    <div class="muted" style="margin-top:8px">Use prepared statements provided by your platform's DB driver. Also hash & salt passwords with a slow algorithm (bcrypt/argon2).</div>`;
  });
  
  // ------------------ QUIZ ------------------
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.textContent.trim();
      const res = document.getElementById('quizResult');
      if(text.startsWith('B')){
        res.innerHTML = `<strong style="color: #a6f3c5">Correct — B.</strong> Hover links and verify senders before clicking. +15 points.`;
        addPoints(15, 'quiz');
      } else {
        res.innerHTML = `<strong style="color: #ffb4b4">Incorrect.</strong> Best practice is to verify sender and hover links before clicking.`;
      }
      recommendNext();
    });
  });
  
  // --------------- RECOMMENDATION ENGINE ---------------
  // Very small heuristic: recommend simulations not completed or next advanced topic.
  function recommendNext(){
    const pts = state.points;
    const recEl = document.getElementById('recText');
    if(pts < 20) recEl.textContent = "Try the Phishing simulation to get started — it's quick and practical.";
    else if(pts < 60) recEl.textContent = "Great! Move to the Password Race to learn about passphrases and MFA.";
    else recEl.textContent = "You're doing well — try the SQL Simulation then read about secure coding practices (prepared statements, password hashing).";
  }
  
  // small escape for display
  function escapeHtml(s){
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }
  
  // Reset progress
  document.getElementById('resetProgress').addEventListener('click', () => {
    if(confirm('Reset points and badges? This will clear your progress.')) {
      state.points = 0;
      state.badges = new Set();
      saveState();
      renderPoints();
      recommendNext();
      alert('Progress reset.');
    }
  });
  
  // helper: set initial UI and restore
  renderPoints();
  recommendNext();
  
  // Initialize default tab
  setActiveTab('phishing');