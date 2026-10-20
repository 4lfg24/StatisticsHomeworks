/**
 * ==============================================================================
 * HMWK 3 — TASK 2: STATISTICAL CRYPTANALYSIS OF THE CAESAR CIPHER
 * Complete Mathematical Engine, Multi-Language Corpora & Monte Carlo Lab
 * ==============================================================================
 */

// ==========================================
// 1. LINGUISTIC REFERENCE CORPORA & FREQUENCIES
// ==========================================

const LANGUAGE_DATA = {
  english: {
    name: 'English',
    topLetter: 'E',
    iocExpected: 0.0667,
    freqs: {
      A: 0.08167, B: 0.01492, C: 0.02782, D: 0.04253, E: 0.12702,
      F: 0.02228, G: 0.02015, H: 0.06094, I: 0.06966, J: 0.00153,
      K: 0.00772, L: 0.04025, M: 0.02406, N: 0.06749, O: 0.07507,
      P: 0.01929, Q: 0.00095, R: 0.05987, S: 0.06327, T: 0.09056,
      U: 0.02758, V: 0.00978, W: 0.02360, X: 0.00150, Y: 0.01974,
      Z: 0.00074
    },
    sampleCorpus: `The Sherlock Holmes stories by Arthur Conan Doyle present an enduring exploration of deductive reasoning, statistical observation, and meticulous forensic analysis. It is a capital mistake to theorize before one has data. Insensibly one begins to twist facts to suit theories, instead of theories to suit facts. As a rule, the more bizarre a thing is the less mysterious it proves to be. It is your commonplace, featureless crimes which are really puzzling, just as a commonplace face is the most difficult to identify. You know my method. It is founded upon the observation of trifles. What one man can invent another can discover. The game is afoot, and the curious incident of the dog in the nighttime was that the dog did nothing in the nighttime, which was the curious incident. When you have eliminated the impossible, whatever remains, however improbable, must be the truth.`
  },

  italian: {
    name: 'Italian',
    topLetter: 'E',
    iocExpected: 0.0738,
    freqs: {
      A: 0.1174, B: 0.0092, C: 0.0450, D: 0.0373, E: 0.1179,
      F: 0.0095, G: 0.0164, H: 0.0154, I: 0.1128, J: 0.0001,
      K: 0.0001, L: 0.0651, M: 0.0251, N: 0.0688, O: 0.0983,
      P: 0.0305, Q: 0.0051, R: 0.0637, S: 0.0498, T: 0.0562,
      U: 0.0301, V: 0.0210, W: 0.0001, X: 0.0001, Y: 0.0001,
      Z: 0.0049
    },
    sampleCorpus: `Quel ramo del lago di Como che volge a mezzogiorno tra due catene non interrotte di monti tutto a seni e a golfi a seconda dello sporgere e del rientrare di quelli vien quasi a un tratto a ristringersi e a prender corso e figura di fiume tra un promontorio a destra e un ampia costiera dall altra parte e il ponte che ivi congiunge le due rive par che renda ancor piu sensibile all occhio questa trasformazione e segni il punto in cui il lago cessa e l Adda rincomincia per ripigliar poi nome di lago dove le rive allontanandosi di nuovo lascian l acqua distendersi e rallentarsi in nuovi golfi e in nuovi seni.`
  },

  spanish: {
    name: 'Spanish',
    topLetter: 'E',
    iocExpected: 0.0770,
    freqs: {
      A: 0.1253, B: 0.0142, C: 0.0468, D: 0.0586, E: 0.1368,
      F: 0.0069, G: 0.0101, H: 0.0070, I: 0.0625, J: 0.0044,
      K: 0.0002, L: 0.0497, M: 0.0315, N: 0.0671, O: 0.0868,
      P: 0.0251, Q: 0.0088, R: 0.0687, S: 0.0798, T: 0.0463,
      U: 0.0393, V: 0.0090, W: 0.0001, X: 0.0022, Y: 0.0090,
      Z: 0.0052
    },
    sampleCorpus: `En un lugar de la Mancha de cuyo nombre no quiero acordarme no ha mucho tiempo que vivia un hidalgo de los de lanza en astillero adarga antigua rocin flaco y galgo corredor. Una olla de algo mas vaca que carnero salpicon las mas noches duelos y quebrantos los sabados lantejas los viernes algun palomino de anadidura los domingos consumian las tres partes de su hacienda. El resto della concluian sayo de velarte calzas de velludo para las fiestas con sus pantuflos de lo mesmo y los dias de entresemana se honraba con su vellori de lo mas fino.`
  },

  latin: {
    name: 'Latin',
    topLetter: 'I',
    iocExpected: 0.0740,
    freqs: {
      A: 0.084, B: 0.015, C: 0.035, D: 0.028, E: 0.108,
      F: 0.009, G: 0.012, H: 0.007, I: 0.112, J: 0.001,
      K: 0.001, L: 0.038, M: 0.049, N: 0.061, O: 0.054,
      P: 0.029, Q: 0.014, R: 0.068, S: 0.075, T: 0.082,
      U: 0.078, V: 0.019, W: 0.001, X: 0.006, Y: 0.001,
      Z: 0.001
    },
    sampleCorpus: `Gallia est omnis divisa in partes tres quarum unam incolunt Belgae aliam Aquitani tertiam qui ipsorum lingua Celtae nostra Galli appellantur. Hi omnes lingua institutis legibus inter se differunt. Gallos ab Aquitanis Garumna flumen a Belgis Matrona et Sequana dividit. Horum omnium fortissimi sunt Belgae propterea quod a cultu atque humanitate provinciae longissime absunt minimeque ad eos mercatores saepe commeant atque ea quae ad effeminandos animos pertinent important proximique sunt Germanis qui trans Rhenum incolunt.`
  }
};

// ==========================================
// 2. CRYPTANALYSIS ENGINES
// ==========================================

const CaesarCracker = {
  // Encrypt text with shift k
  encrypt(text, k) {
    const shift = ((k % 26) + 26) % 26;
    return text.toUpperCase().replace(/[A-Z]/g, c => {
      return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
    });
  },

  // Decrypt ciphertext with shift k
  decrypt(ciphertext, k) {
    const shift = ((k % 26) + 26) % 26;
    return this.encrypt(ciphertext, 26 - shift);
  },

  // Extract only uppercase letters A-Z
  cleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
  },

  // Unigram counts and length
  getLetterCounts(cleanText) {
    const counts = {};
    for (let i = 0; i < 26; i++) {
      counts[String.fromCharCode(65 + i)] = 0;
    }
    for (const c of cleanText) {
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  },

  // Index of Coincidence: IoC = sum(f_i * (f_i - 1)) / (N * (N - 1))
  computeIoC(cleanText) {
    const N = cleanText.length;
    if (N <= 1) return 0;
    const counts = this.getLetterCounts(cleanText);
    let sum = 0;
    for (const c in counts) {
      const f = counts[c];
      sum += f * (f - 1);
    }
    return sum / (N * (N - 1));
  },

  // 1. Chi-Squared (χ²) Goodness-of-Fit Test
  // For each candidate shift s ∈ [0..25]:
  // Decrypt ciphertext with shift s. Count observed frequencies O_c.
  // Expected count E_c = N * p_c.
  // χ²(s) = sum_{c} (O_c - E_c)² / E_c.
  // Best shift is argmin χ²(s).
  chiSquaredAttack(ciphertext, langKey = 'english') {
    const clean = this.cleanText(ciphertext);
    const N = clean.length;
    if (N === 0) return { bestShift: 0, minChi: Infinity, scores: [] };

    const refFreqs = LANGUAGE_DATA[langKey].freqs;
    const scores = [];
    let bestShift = 0;
    let minChi = Infinity;

    for (let s = 0; s < 26; s++) {
      const decrypted = this.decrypt(clean, s);
      const counts = this.getLetterCounts(decrypted);

      let chi = 0;
      for (let i = 0; i < 26; i++) {
        const c = String.fromCharCode(65 + i);
        const O_c = counts[c];
        const E_c = N * (refFreqs[c] || 0.0001);
        const diff = O_c - E_c;
        chi += (diff * diff) / E_c;
      }

      scores.push({ shift: s, score: chi });

      if (chi < minChi) {
        minChi = chi;
        bestShift = s;
      }
    }

    return { bestShift, minChi, scores };
  },

  // 2. Frequency Cross-Correlation / Dot Product
  // Dot product of observed frequencies vector and expected frequencies vector.
  // Best shift is argmax Correlation(s).
  correlationAttack(ciphertext, langKey = 'english') {
    const clean = this.cleanText(ciphertext);
    const N = clean.length;
    if (N === 0) return { bestShift: 0, maxDot: -Infinity, scores: [] };

    const refFreqs = LANGUAGE_DATA[langKey].freqs;
    const scores = [];
    let bestShift = 0;
    let maxDot = -Infinity;

    for (let s = 0; s < 26; s++) {
      const decrypted = this.decrypt(clean, s);
      const counts = this.getLetterCounts(decrypted);

      let dotProduct = 0;
      for (let i = 0; i < 26; i++) {
        const c = String.fromCharCode(65 + i);
        const observedProb = counts[c] / N;
        const expectedProb = refFreqs[c] || 0;
        dotProduct += observedProb * expectedProb;
      }

      scores.push({ shift: s, score: dotProduct });

      if (dotProduct > maxDot) {
        maxDot = dotProduct;
        bestShift = s;
      }
    }

    return { bestShift, maxDot, scores };
  },

  // 3. Single-Letter Peak Frequency Analysis (Argmax Matching)
  // Maps ciphertext most frequent character to target top letter ('E' or 'I').
  argmaxAttack(ciphertext, langKey = 'english') {
    const clean = this.cleanText(ciphertext);
    if (clean.length === 0) return { bestShift: 0, topChar: 'E', peakCount: 0 };

    const counts = this.getLetterCounts(clean);
    let topChar = 'A';
    let maxCount = -1;

    for (let i = 0; i < 26; i++) {
      const c = String.fromCharCode(65 + i);
      if (counts[c] > maxCount) {
        maxCount = counts[c];
        topChar = c;
      }
    }

    const expectedTop = LANGUAGE_DATA[langKey].topLetter;
    const topCharCode = topChar.charCodeAt(0) - 65;
    const expectedTopCode = expectedTop.charCodeAt(0) - 65;

    // Shift k such that: cleanChar = expectedTop + k (mod 26)
    // => k = (topCharCode - expectedTopCode + 26) mod 26
    const bestShift = (topCharCode - expectedTopCode + 26) % 26;

    return { bestShift, topChar, peakCount: maxCount };
  }
};

// ==========================================
// 3. UI CONTROLLER & MONTE CARLO EXPERIMENTER
// ==========================================

class Task2App {
  constructor() {
    this.state = {
      language: 'english',
      trueKey: 7,
      textLength: 75,
      rawCorpus: LANGUAGE_DATA.english.sampleCorpus,
      isBenchmarking: false
    };

    this.initDOMElements();
    this.bindEvents();
    this.runSingleAnalysis();
  }

  initDOMElements() {
    this.dom = {
      langSelect: document.getElementById('lang-select'),
      trueKeySlider: document.getElementById('true-key-slider'),
      trueKeyVal: document.getElementById('true-key-val'),
      lengthSlider: document.getElementById('length-slider'),
      lengthVal: document.getElementById('length-val'),
      corpusTextarea: document.getElementById('corpus-textarea'),
      btnRandomSnippet: document.getElementById('btn-random-snippet'),
      btnRandomKey: document.getElementById('btn-random-key'),

      // Intercepted Display
      dispCiphertext: document.getElementById('disp-ciphertext'),
      dispCipherLength: document.getElementById('disp-cipher-length'),
      dispCipherIoc: document.getElementById('disp-cipher-ioc'),

      // Algorithm Cards
      cardChi: document.getElementById('card-algo-chi'),
      cardDot: document.getElementById('card-algo-dot'),
      cardArgmax: document.getElementById('card-algo-argmax'),

      valChiKey: document.getElementById('val-chi-key'),
      valChiScore: document.getElementById('val-chi-score'),
      valDotKey: document.getElementById('val-dot-key'),
      valDotScore: document.getElementById('val-dot-score'),
      valArgmaxKey: document.getElementById('val-argmax-key'),
      valArgmaxDetail: document.getElementById('val-argmax-detail'),

      // Decrypted Plaintext Reveal
      dispDecryptedText: document.getElementById('disp-decrypted-text'),

      // Charts
      shiftScoreCanvas: document.getElementById('shift-score-canvas'),
      mcCanvas: document.getElementById('mc-results-canvas'),

      // Monte Carlo UI
      btnRunMC: document.getElementById('btn-run-mc'),
      mcProgressBar: document.getElementById('mc-progress-bar'),
      mcTrialsSelect: document.getElementById('mc-trials-select'),
      mcStatusText: document.getElementById('mc-status-text')
    };
  }

  bindEvents() {
    this.dom.langSelect.addEventListener('change', (e) => {
      this.state.language = e.target.value;
      this.state.rawCorpus = LANGUAGE_DATA[this.state.language].sampleCorpus;
      this.dom.corpusTextarea.value = this.state.rawCorpus;
      this.runSingleAnalysis();
    });

    this.dom.trueKeySlider.addEventListener('input', (e) => {
      this.state.trueKey = parseInt(e.target.value, 10);
      this.dom.trueKeyVal.textContent = this.state.trueKey;
      this.runSingleAnalysis();
    });

    this.dom.lengthSlider.addEventListener('input', (e) => {
      this.state.textLength = parseInt(e.target.value, 10);
      this.dom.lengthVal.textContent = this.state.textLength;
      this.runSingleAnalysis();
    });

    this.dom.corpusTextarea.addEventListener('input', (e) => {
      this.state.rawCorpus = e.target.value;
      this.runSingleAnalysis();
    });

    this.dom.btnRandomSnippet.addEventListener('click', () => {
      const clean = CaesarCracker.cleanText(this.state.rawCorpus);
      const maxStart = Math.max(0, clean.length - this.state.textLength);
      const randStart = Math.floor(Math.random() * maxStart);
      this.snippetStart = randStart;
      this.runSingleAnalysis();
    });

    this.dom.btnRandomKey.addEventListener('click', () => {
      const randKey = Math.floor(Math.random() * 25) + 1;
      this.state.trueKey = randKey;
      this.dom.trueKeySlider.value = randKey;
      this.dom.trueKeyVal.textContent = randKey;
      this.runSingleAnalysis();
    });

    this.dom.btnRunMC.addEventListener('click', () => {
      if (!this.state.isBenchmarking) {
        this.runMonteCarloBenchmark();
      }
    });

    window.addEventListener('resize', () => {
      this.drawShiftScoresChart();
      if (this.lastMCResults) this.drawMCResultsChart(this.lastMCResults);
    });
  }

  getCurrentSnippet() {
    const clean = CaesarCracker.cleanText(this.state.rawCorpus);
    if (clean.length === 0) return 'NOVALIDLETTERSINCORPUS';
    const len = Math.min(this.state.textLength, clean.length);
    const start = this.snippetStart || 0;
    const safeStart = Math.min(start, Math.max(0, clean.length - len));
    return clean.substring(safeStart, safeStart + len);
  }

  runSingleAnalysis() {
    const snippet = this.getCurrentSnippet();
    const trueKey = this.state.trueKey;
    const lang = this.state.language;

    // Encrypt with true secret shift
    const ciphertext = CaesarCracker.encrypt(snippet, trueKey);
    const ioc = CaesarCracker.computeIoC(ciphertext);

    this.dom.dispCiphertext.textContent = ciphertext;
    this.dom.dispCipherLength.textContent = `${ciphertext.length} letters`;
    this.dom.dispCipherIoc.textContent = `IoC: ${ioc.toFixed(4)}`;

    // Run the 3 attacks
    const chiResult = CaesarCracker.chiSquaredAttack(ciphertext, lang);
    const dotResult = CaesarCracker.correlationAttack(ciphertext, lang);
    const argResult = CaesarCracker.argmaxAttack(ciphertext, lang);

    // Update Chi-squared card
    const chiSuccess = chiResult.bestShift === trueKey;
    this.dom.valChiKey.textContent = `Shift: ${chiResult.bestShift}`;
    this.dom.valChiKey.className = `algo-recovered-key ${chiSuccess ? 'success' : 'fail'}`;
    this.dom.valChiScore.textContent = `Min χ²: ${chiResult.minChi.toFixed(2)}`;
    this.dom.cardChi.className = `algo-card ${chiSuccess ? 'winner' : ''}`;

    // Update Dot-product card
    const dotSuccess = dotResult.bestShift === trueKey;
    this.dom.valDotKey.textContent = `Shift: ${dotResult.bestShift}`;
    this.dom.valDotKey.className = `algo-recovered-key ${dotSuccess ? 'success' : 'fail'}`;
    this.dom.valDotScore.textContent = `Dot Prod: ${dotResult.maxDot.toFixed(4)}`;
    this.dom.cardDot.className = `algo-card ${dotSuccess ? 'winner' : ''}`;

    // Update Argmax card
    const argSuccess = argResult.bestShift === trueKey;
    this.dom.valArgmaxKey.textContent = `Shift: ${argResult.bestShift}`;
    this.dom.valArgmaxKey.className = `algo-recovered-key ${argSuccess ? 'success' : 'fail'}`;
    this.dom.valArgmaxDetail.textContent = `Peak '${argResult.topChar}' (${argResult.peakCount}x)`;
    this.dom.cardArgmax.className = `algo-card ${argSuccess ? 'winner' : ''}`;

    // Plaintext Reveal using Chi-squared (or ground truth)
    const decryptedSample = CaesarCracker.decrypt(ciphertext, chiResult.bestShift);
    this.dom.dispDecryptedText.textContent = decryptedSample;

    // Store scores and draw shift chart
    this.currentChiScores = chiResult.scores;
    this.currentDotScores = dotResult.scores;
    this.drawShiftScoresChart();
  }

  // Draw 26-shift score comparison bar chart
  drawShiftScoresChart() {
    const canvas = this.dom.shiftScoreCanvas;
    if (!canvas || !this.currentChiScores) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const padLeft = 50;
    const padRight = 20;
    const padTop = 30;
    const padBottom = 35;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    // Find max score for scaling
    let maxChi = 0;
    this.currentChiScores.forEach(s => {
      if (s.score > maxChi && isFinite(s.score)) maxChi = s.score;
    });
    maxChi = Math.max(50, Math.ceil(maxChi * 1.1));

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const numGrid = 5;

    for (let g = 0; g <= numGrid; g++) {
      const y = padTop + plotH - (g / numGrid) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      const val = ((g / numGrid) * maxChi).toFixed(0);
      ctx.fillText(val, padLeft - 8, y + 3);
    }

    const barW = (plotW / 26) - 4;

    for (let i = 0; i < 26; i++) {
      const s = this.currentChiScores[i];
      const x = padLeft + i * (plotW / 26) + 2;
      const h = Math.min(plotH, (s.score / maxChi) * plotH);
      const y = padTop + plotH - h;

      const isTrueKey = s.shift === this.state.trueKey;

      if (isTrueKey) {
        // True shift (Emerald highlight)
        ctx.fillStyle = '#10b981';
      } else {
        // Other candidates
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
      }

      ctx.fillRect(x, y, barW, h);

      // Label below bar
      ctx.fillStyle = isTrueKey ? '#10b981' : '#94a3b8';
      ctx.font = isTrueKey ? 'bold 10px "JetBrains Mono"' : '9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(s.shift, x + barW / 2, H - padBottom + 16);
    }
  }

  // Run automated Monte Carlo experiment across ciphertext lengths
  async runMonteCarloBenchmark() {
    this.state.isBenchmarking = true;
    this.dom.btnRunMC.disabled = true;
    this.dom.btnRunMC.textContent = '⏳ Testing...';

    const trialsPerLen = parseInt(this.dom.mcTrialsSelect.value, 10) || 50;
    const lengths = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500];
    const results = {
      lengths,
      chiAcc: [],
      dotAcc: [],
      argmaxAcc: []
    };

    const corpus = CaesarCracker.cleanText(this.state.rawCorpus);
    const lang = this.state.language;
    const totalSteps = lengths.length * trialsPerLen;
    let stepCount = 0;

    for (let l = 0; l < lengths.length; l++) {
      const len = lengths[l];
      let chiHits = 0;
      let dotHits = 0;
      let argHits = 0;

      for (let t = 0; t < trialsPerLen; t++) {
        // Random shift 1-25
        const randShift = Math.floor(Math.random() * 25) + 1;
        // Random snippet
        const maxStart = Math.max(0, corpus.length - len);
        const start = Math.floor(Math.random() * (maxStart + 1));
        const snippet = corpus.substring(start, start + len);

        const ciphertext = CaesarCracker.encrypt(snippet, randShift);

        // Attacks
        const chiRes = CaesarCracker.chiSquaredAttack(ciphertext, lang);
        const dotRes = CaesarCracker.correlationAttack(ciphertext, lang);
        const argRes = CaesarCracker.argmaxAttack(ciphertext, lang);

        if (chiRes.bestShift === randShift) chiHits++;
        if (dotRes.bestShift === randShift) dotHits++;
        if (argRes.bestShift === randShift) argHits++;

        stepCount++;
        if (stepCount % 10 === 0) {
          const pct = Math.round((stepCount / totalSteps) * 100);
          this.dom.mcProgressBar.style.width = `${pct}%`;
          this.dom.mcStatusText.textContent = `Testing Length N = ${len} (${pct}%)...`;
          await new Promise(r => setTimeout(r, 0));
        }
      }

      results.chiAcc.push((chiHits / trialsPerLen) * 100);
      results.dotAcc.push((dotHits / trialsPerLen) * 100);
      results.argmaxAcc.push((argHits / trialsPerLen) * 100);
    }

    this.lastMCResults = results;
    this.drawMCResultsChart(results);

    this.dom.mcProgressBar.style.width = '100%';
    this.dom.mcStatusText.textContent = `Completed ${totalSteps} simulations! Full accuracy curve rendered below.`;
    this.dom.btnRunMC.disabled = false;
    this.dom.btnRunMC.textContent = '🚀 Run Monte Carlo Benchmark';
    this.state.isBenchmarking = false;
  }

  // Draw Monte Carlo accuracy curve
  drawMCResultsChart(res) {
    const canvas = this.dom.mcCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const padLeft = 50;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    // Y Axis Grid (0% to 100%)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let p = 0; p <= 100; p += 20) {
      const y = padTop + plotH - (p / 100) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${p}%`, padLeft - 8, y + 3);
    }

    // X Axis coordinates
    const N_count = res.lengths.length;
    const getX = (idx) => padLeft + (idx / (N_count - 1)) * plotW;
    const getY = (pct) => padTop + plotH - (pct / 100) * plotH;

    // X Axis Labels
    for (let i = 0; i < N_count; i++) {
      const x = getX(i);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(res.lengths[i], x, H - padBottom + 18);
    }

    // Plot a line
    const plotLine = (data, color, lineW = 2.5) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;

      for (let i = 0; i < N_count; i++) {
        const x = getX(i);
        const y = getY(data[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Plot Points
      ctx.fillStyle = color;
      for (let i = 0; i < N_count; i++) {
        const x = getX(i);
        const y = getY(data[i]);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Plot all 3 curves
    plotLine(res.chiAcc, '#10b981', 3);     // Chi-squared (Emerald)
    plotLine(res.dotAcc, '#06b6d4', 2.5);   // Dot Product (Cyan)
    plotLine(res.argmaxAcc, '#f59e0b', 2);  // Argmax (Amber)

    // Unicity Distance marker line (N ~ 25)
    const uX = getX(4); // length 25
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(uX, padTop);
    ctx.lineTo(uX, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Unicity Threshold (N≈25-30)', uX, padTop - 8);
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new Task2App();
});
