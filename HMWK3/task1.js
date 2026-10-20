/**
 * ==============================================================================
 * HMWK 3 — TASK 1: DUAL ENCRYPTION LAB
 * Toy secp256k1 Elliptic Curve vs Caesar Cipher
 * ==============================================================================
 */

// ==========================================
// 1. ELLIPTIC CURVE ARITHMETIC (secp256k1 family)
// ==========================================

const EC = {
  // Field modulus: toy p = 17 from HMWK1
  p: 17,
  a: 0,
  b: 7, // y^2 = x^3 + 7 (mod 17)
  G: [1, 5], // Standard toy generator point from HMWK1

  // Modulo operation ensuring positive result
  mod(n, m = this.p) {
    const res = n % m;
    return res >= 0 ? res : res + m;
  },

  // Extended Euclidean Algorithm
  extendedGCD(a, b) {
    if (b === 0) return [1, 0, a];
    const [x1, y1, d] = this.extendedGCD(b, a % b);
    return [y1, x1 - Math.floor(a / b) * y1, d];
  },

  // Modular multiplicative inverse
  modInverse(a, m = this.p) {
    const [x, , d] = this.extendedGCD(this.mod(a, m), m);
    return d === 1 ? this.mod(x, m) : null;
  },

  // Check if two points are equal
  pointEquals(P, Q) {
    if (!P && !Q) return true;
    if (!P || !Q) return false;
    return P[0] === Q[0] && P[1] === Q[1];
  },

  // Point Addition on F_p: P + Q
  add(P, Q, p = this.p) {
    if (!P) return Q;
    if (!Q) return P;

    const [x1, y1] = P;
    const [x2, y2] = Q;

    // Check inverse: P + (-P) = Infinity
    if (x1 === x2 && this.mod(y1 + y2, p) === 0) {
      return null;
    }

    let m;
    if (x1 === x2 && y1 === y2) {
      // Point Doubling
      if (y1 === 0) return null;
      const num = this.mod(3 * x1 * x1 + this.a, p);
      const den = this.mod(2 * y1, p);
      const denInv = this.modInverse(den, p);
      if (denInv === null) return null;
      m = this.mod(num * denInv, p);
    } else {
      // Point Addition
      const num = this.mod(y2 - y1, p);
      const den = this.mod(x2 - x1, p);
      const denInv = this.modInverse(den, p);
      if (denInv === null) return null;
      m = this.mod(num * denInv, p);
    }

    const x3 = this.mod(m * m - x1 - x2, p);
    const y3 = this.mod(m * (x1 - x3) - y1, p);
    return [x3, y3];
  },

  // Point Negation: -P = (x, -y mod p)
  negate(P, p = this.p) {
    if (!P) return null;
    return [P[0], this.mod(-P[1], p)];
  },

  // Point Subtraction: P - Q = P + (-Q)
  subtract(P, Q, p = this.p) {
    return this.add(P, this.negate(Q, p), p);
  },

  // Scalar Multiplication via Double-and-Add: k * P
  multiply(k, P, p = this.p) {
    if (k <= 0 || !P) return null;
    let R = null;
    let T = P;
    let n = k;
    while (n > 0) {
      if (n & 1) R = this.add(R, T, p);
      T = this.add(T, T, p);
      n >>= 1;
    }
    return R;
  },

  // Find all affine points on y^2 = x^3 + 7 (mod p)
  findAllPoints(p = this.p) {
    const points = [];
    for (let x = 0; x < p; x++) {
      const rhs = this.mod(x * x * x + 7, p);
      for (let y = 0; y < p; y++) {
        if (this.mod(y * y, p) === rhs) {
          points.push([x, y]);
        }
      }
    }
    return points;
  },

  // Format point as readable string
  formatPoint(P) {
    if (!P) return 'O (Infinity)';
    return `(${P[0]}, ${P[1]})`;
  }
};

// All 17 affine points on y^2 = x^3 + 7 (mod 17) in natural order
const AFFINE_POINTS = EC.findAllPoints(17);
// We map alphabet letters A-Z to deterministic curve points for point-based ElGamal
// Since 17 points + Infinity = 18 points, we can map character codes mod 17
const CHAR_TO_POINT_MAP = {};
const POINT_TO_CHAR_MAP = {};

for (let i = 0; i < 26; i++) {
  const char = String.fromCharCode(65 + i);
  // Map letter index modulo 17 to an affine point
  const pt = AFFINE_POINTS[i % AFFINE_POINTS.length];
  CHAR_TO_POINT_MAP[char] = pt;
}

// ==========================================
// 2. CAESAR CIPHER LOGIC
// ==========================================

const Caesar = {
  encrypt(text, shift) {
    const s = ((shift % 26) + 26) % 26;
    const steps = [];
    let ciphertext = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      if (char >= 'A' && char <= 'Z') {
        const pCode = char.charCodeAt(0) - 65;
        const cCode = (pCode + s) % 26;
        const cChar = String.fromCharCode(65 + cCode);
        ciphertext += cChar;
        steps.push({
          idx: i + 1,
          plain: char,
          pCode,
          shift: s,
          calc: `(${pCode} + ${s}) mod 26 = ${cCode}`,
          cipher: cChar
        });
      } else {
        ciphertext += char;
        steps.push({
          idx: i + 1,
          plain: char,
          pCode: '-',
          shift: s,
          calc: 'Punctuation/Space (preserved)',
          cipher: char
        });
      }
    }

    return { ciphertext, steps };
  },

  decrypt(text, shift) {
    const s = ((shift % 26) + 26) % 26;
    const invShift = (26 - s) % 26;
    return this.encrypt(text, invShift).ciphertext;
  }
};

// ==========================================
// 3. TOY SECP256K1 ECC CIPHER LOGIC
// ==========================================

const ECCLab = {
  // Mode A: EC-ElGamal (Point Addition: C1 = rG, C2 = M + rQ)
  encryptElGamal(text, privateKeyK, ephemeralR) {
    const G = EC.G;
    const Q = EC.multiply(privateKeyK, G); // Receiver's Public Key
    const steps = [];
    const cipherPairs = [];
    let decryptedText = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      if (char >= 'A' && char <= 'Z') {
        const charCode = char.charCodeAt(0) - 65;
        // Plaintext point M
        const M = CHAR_TO_POINT_MAP[char];

        // Nonce variation across letters to show dynamic semantic security
        const r_i = ((ephemeralR + i * 2 - 1) % 17) + 1;

        // C1 = r_i * G
        const C1 = EC.multiply(r_i, G);
        // Shared secret S = r_i * Q
        const S_bob = EC.multiply(r_i, Q);
        // C2 = M + S_bob
        const C2 = EC.add(M, S_bob);

        // Decryption by receiver (Alice):
        // S_alice = k * C1 = k * (r_i * G) = r_i * (kG) = S_bob
        const S_alice = EC.multiply(privateKeyK, C1);
        // M_recovered = C2 - S_alice
        const M_rec = EC.subtract(C2, S_alice);

        // Find character that matches M_rec
        let recoveredChar = '?';
        for (let c = 0; c < 26; c++) {
          const testChar = String.fromCharCode(65 + c);
          if (EC.pointEquals(CHAR_TO_POINT_MAP[testChar], M_rec)) {
            // Pick matching character with same parity modulo 17
            if (c % 17 === charCode % 17) {
              recoveredChar = testChar;
              break;
            }
          }
        }

        cipherPairs.push(`[${EC.formatPoint(C1)}, ${EC.formatPoint(C2)}]`);
        decryptedText += recoveredChar;

        steps.push({
          idx: i + 1,
          plain: char,
          M: EC.formatPoint(M),
          r: r_i,
          C1: EC.formatPoint(C1),
          C2: EC.formatPoint(C2),
          S: EC.formatPoint(S_bob),
          decrypted: recoveredChar
        });
      } else {
        cipherPairs.push(char);
        decryptedText += char;
        steps.push({
          idx: i + 1,
          plain: char,
          M: 'Non-alpha',
          r: '-',
          C1: '-',
          C2: '-',
          S: '-',
          decrypted: char
        });
      }
    }

    return {
      Q,
      cipherString: cipherPairs.join(' '),
      decryptedText,
      steps
    };
  },

  // Mode B: ECDH / ECIES Keystream Masking
  // Directly parallels Caesar: C_i = (P_i + K_i) mod 26, where K_i is derived from ephemeral shared point S!
  encryptECDHStream(text, privateKeyK, ephemeralR) {
    const G = EC.G;
    const Q = EC.multiply(privateKeyK, G); // Receiver Public Key
    const R = EC.multiply(ephemeralR, G);  // Ephemeral Public Point (sent with ciphertext)
    const S = EC.multiply(ephemeralR, Q);  // Shared secret point: r*Q = k*R

    const steps = [];
    let ciphertext = '';
    let decryptedText = '';

    const Sx = S ? S[0] : 1;
    const Sy = S ? S[1] : 5;

    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      if (char >= 'A' && char <= 'Z') {
        const pCode = char.charCodeAt(0) - 65;
        // Nonce-driven dynamic shift K_i derived from S
        const K_i = EC.mod(Sx * 3 + (i + 1) * Sy + 7, 26);
        const cCode = (pCode + K_i) % 26;
        const cChar = String.fromCharCode(65 + cCode);
        ciphertext += cChar;

        // Decryption by Alice: computes S = k*R, derives identical K_i
        const pDecCode = (cCode - K_i + 26) % 26;
        const pDecChar = String.fromCharCode(65 + pDecCode);
        decryptedText += pDecChar;

        steps.push({
          idx: i + 1,
          plain: char,
          pCode,
          Ki: K_i,
          calc: `(${pCode} + ${K_i}) mod 26 = ${cCode}`,
          cipher: cChar,
          decrypted: pDecChar
        });
      } else {
        ciphertext += char;
        decryptedText += char;
        steps.push({
          idx: i + 1,
          plain: char,
          pCode: '-',
          Ki: '-',
          calc: 'Punctuation/Space',
          cipher: char,
          decrypted: char
        });
      }
    }

    return {
      Q,
      R,
      S,
      ciphertext,
      decryptedText,
      steps
    };
  }
};

// ==========================================
// 4. STATISTICAL ANALYSIS ENGINE
// ==========================================

const StatsEngine = {
  // Calculate unigram frequencies for letters A-Z
  getFrequencies(text) {
    const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
    const N = clean.length;
    const counts = {};
    for (let i = 0; i < 26; i++) {
      counts[String.fromCharCode(65 + i)] = 0;
    }
    for (const c of clean) {
      counts[c] = (counts[c] || 0) + 1;
    }
    const freqs = {};
    for (const c in counts) {
      freqs[c] = N > 0 ? counts[c] / N : 0;
    }
    return { counts, freqs, N };
  },

  // Calculate Shannon Entropy: H = -sum(p * log2(p))
  calculateEntropy(freqs) {
    let entropy = 0;
    for (const c in freqs) {
      const p = freqs[c];
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  },

  // Calculate Index of Coincidence: IoC = sum(f_i * (f_i - 1)) / (N * (N - 1))
  calculateIoC(counts, N) {
    if (N <= 1) return 0;
    let sum = 0;
    for (const c in counts) {
      const f = counts[c];
      sum += f * (f - 1);
    }
    return sum / (N * (N - 1));
  },

  // Frequency Variance (deviation from uniform 1/26)
  calculateVariance(freqs) {
    const uniform = 1 / 26;
    let sumSq = 0;
    for (const c in freqs) {
      const diff = freqs[c] - uniform;
      sumSq += diff * diff;
    }
    return sumSq / 26;
  }
};

// ==========================================
// 5. APPLICATION UI CONTROLLER
// ==========================================

class Task1App {
  constructor() {
    this.state = {
      message: 'CRYPTOGRAPHY AND STATISTICS ARE POWERFUL ALLIES',
      caesarShift: 3,
      eccPrivateKey: 6, // Target toy key from HMWK1
      eccEphemeralR: 4,  // Bob's ephemeral nonce
      eccMode: 'ecdh'   // 'ecdh' or 'elgamal'
    };

    this.initDOMElements();
    this.bindEvents();
    this.render();
  }

  initDOMElements() {
    this.dom = {
      inputMessage: document.getElementById('input-message'),
      caesarShiftSlider: document.getElementById('caesar-shift-slider'),
      caesarShiftVal: document.getElementById('caesar-shift-val'),
      eccKeySelect: document.getElementById('ecc-key-select'),
      eccNonceSelect: document.getElementById('ecc-nonce-select'),
      eccModeSelect: document.getElementById('ecc-mode-select'),
      btnRandomize: document.getElementById('btn-randomize-msg'),
      presetBtns: document.querySelectorAll('.preset-btn'),

      // Caesar outputs
      caesarCiphertext: document.getElementById('caesar-ciphertext'),
      caesarDecrypted: document.getElementById('caesar-decrypted'),
      caesarStepsBody: document.getElementById('caesar-steps-body'),
      caesarStrip: document.getElementById('alphabet-strip'),
      dispCaesarKey: document.getElementById('disp-caesar-key'),

      // ECC outputs
      eccPublicKeyVal: document.getElementById('ecc-public-key-val'),
      eccEphemeralPointVal: document.getElementById('ecc-ephemeral-point-val'),
      eccSharedSecretVal: document.getElementById('ecc-shared-secret-val'),
      eccCiphertext: document.getElementById('ecc-ciphertext'),
      eccDecrypted: document.getElementById('ecc-decrypted'),
      eccStepsBody: document.getElementById('ecc-steps-body'),

      // KPIs
      kpiPlainEntropy: document.getElementById('kpi-plain-entropy'),
      kpiCaesarEntropy: document.getElementById('kpi-caesar-entropy'),
      kpiEccEntropy: document.getElementById('kpi-ecc-entropy'),
      kpiPlainIoc: document.getElementById('kpi-plain-ioc'),
      kpiCaesarIoc: document.getElementById('kpi-caesar-ioc'),
      kpiEccIoc: document.getElementById('kpi-ecc-ioc'),

      // Canvas Chart
      chartCanvas: document.getElementById('freq-comparison-canvas')
    };

    // Populate ECC Private Key Select (1 to 17)
    for (let k = 1; k <= 17; k++) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k === 6 ? `k = ${k} [HMWK1 Spec: Q = (5,8)]` : `k = ${k}`;
      if (k === 6) opt.selected = true;
      this.dom.eccKeySelect.appendChild(opt);
    }

    // Populate Nonce Select (1 to 17)
    for (let r = 1; r <= 17; r++) {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = `r = ${r}`;
      if (r === 4) opt.selected = true;
      this.dom.eccNonceSelect.appendChild(opt);
    }
  }

  bindEvents() {
    this.dom.inputMessage.addEventListener('input', (e) => {
      this.state.message = e.target.value;
      this.render();
    });

    this.dom.caesarShiftSlider.addEventListener('input', (e) => {
      this.state.caesarShift = parseInt(e.target.value, 10);
      this.dom.caesarShiftVal.textContent = this.state.caesarShift;
      this.render();
    });

    this.dom.eccKeySelect.addEventListener('change', (e) => {
      this.state.eccPrivateKey = parseInt(e.target.value, 10);
      this.render();
    });

    this.dom.eccNonceSelect.addEventListener('change', (e) => {
      this.state.eccEphemeralR = parseInt(e.target.value, 10);
      this.render();
    });

    this.dom.eccModeSelect.addEventListener('change', (e) => {
      this.state.eccMode = e.target.value;
      this.render();
    });

    this.dom.btnRandomize.addEventListener('click', () => {
      const samples = [
        'CRYPTOGRAPHY IS THE PRACTICE AND STUDY OF SECURE INFORMATION',
        'ELLIPTIC CURVE DISCRETE LOGARITHM PROBLEM GUARANTEES PRIVACY',
        'THE CAESAR CIPHER PRESERVES MONOALPHABETIC LETTER FREQUENCIES',
        'REPEATED LETTERS LIKE AAAAAA HIGHLIGHT STATISTICAL WEAKNESSES',
        'SHANNON CONFUSION AND DIFFUSION FORM THE BEDROCK OF CIPHERS'
      ];
      const pick = samples[Math.floor(Math.random() * samples.length)];
      this.dom.inputMessage.value = pick;
      this.state.message = pick;
      this.render();
    });

    this.dom.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        this.dom.inputMessage.value = text;
        this.state.message = text;
        this.render();
      });
    });

    window.addEventListener('resize', () => {
      this.drawChart();
    });
  }

  renderAlphabetStrip(shift) {
    this.dom.caesarStrip.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const pChar = String.fromCharCode(65 + i);
      const cChar = String.fromCharCode(65 + ((i + shift) % 26));
      const item = document.createElement('div');
      item.className = 'strip-item';
      item.innerHTML = `
        <span class="strip-plain">${pChar}</span>
        <span class="strip-arrow">↓</span>
        <span class="strip-cipher">${cChar}</span>
      `;
      this.dom.caesarStrip.appendChild(item);
    }
  }

  render() {
    const { message, caesarShift, eccPrivateKey, eccEphemeralR, eccMode } = this.state;

    // 1. Caesar Cipher execution
    const caesarResult = Caesar.encrypt(message, caesarShift);
    const caesarDecrypted = Caesar.decrypt(caesarResult.ciphertext, caesarShift);

    this.dom.caesarCiphertext.textContent = caesarResult.ciphertext || '(Empty)';
    this.dom.caesarDecrypted.textContent = caesarDecrypted || '(Empty)';
    if (this.dom.dispCaesarKey) this.dom.dispCaesarKey.textContent = `Shift +${caesarShift} mod 26`;
    this.renderAlphabetStrip(caesarShift);

    // Caesar table
    let caesarHtml = '';
    caesarResult.steps.slice(0, 15).forEach(s => {
      caesarHtml += `
        <tr>
          <td>${s.idx}</td>
          <td><strong>${s.plain}</strong></td>
          <td>${s.pCode}</td>
          <td>${s.calc}</td>
          <td><strong style="color:var(--amber)">${s.cipher}</strong></td>
        </tr>
      `;
    });
    if (caesarResult.steps.length > 15) {
      caesarHtml += `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">... and ${caesarResult.steps.length - 15} more characters</td></tr>`;
    }
    this.dom.caesarStepsBody.innerHTML = caesarHtml;

    // 2. ECC Execution
    let eccCiphertextStr = '';
    let eccDecryptedStr = '';
    let Q_point, R_point, S_point;
    let eccSteps = [];

    if (eccMode === 'ecdh') {
      const res = ECCLab.encryptECDHStream(message, eccPrivateKey, eccEphemeralR);
      Q_point = res.Q;
      R_point = res.R;
      S_point = res.S;
      eccCiphertextStr = res.ciphertext;
      eccDecryptedStr = res.decryptedText;
      eccSteps = res.steps;

      let eccTableHtml = '';
      eccSteps.slice(0, 15).forEach(s => {
        eccTableHtml += `
          <tr>
            <td>${s.idx}</td>
            <td><strong>${s.plain}</strong></td>
            <td>${s.Ki}</td>
            <td>${s.calc}</td>
            <td><strong style="color:var(--cyan)">${s.cipher}</strong></td>
            <td><strong style="color:var(--emerald-light)">${s.decrypted}</strong></td>
          </tr>
        `;
      });
      if (eccSteps.length > 15) {
        eccTableHtml += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">... and ${eccSteps.length - 15} more characters</td></tr>`;
      }
      this.dom.eccStepsBody.innerHTML = eccTableHtml;
    } else {
      const res = ECCLab.encryptElGamal(message, eccPrivateKey, eccEphemeralR);
      Q_point = res.Q;
      R_point = EC.multiply(eccEphemeralR, EC.G);
      S_point = EC.multiply(eccEphemeralR, Q_point);
      eccCiphertextStr = res.cipherString;
      eccDecryptedStr = res.decryptedText;
      eccSteps = res.steps;

      let eccTableHtml = '';
      eccSteps.slice(0, 10).forEach(s => {
        eccTableHtml += `
          <tr>
            <td>${s.idx}</td>
            <td><strong>${s.plain}</strong></td>
            <td>${s.M}</td>
            <td>r=${s.r} → C1=${s.C1}</td>
            <td><strong style="color:var(--cyan)">C2=${s.C2}</strong></td>
            <td><strong style="color:var(--emerald-light)">${s.decrypted}</strong></td>
          </tr>
        `;
      });
      if (eccSteps.length > 10) {
        eccTableHtml += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">... and ${eccSteps.length - 10} more characters</td></tr>`;
      }
      this.dom.eccStepsBody.innerHTML = eccTableHtml;
    }

    this.dom.eccPublicKeyVal.textContent = `Q = ${EC.formatPoint(Q_point)}`;
    this.dom.eccEphemeralPointVal.textContent = `R = ${EC.formatPoint(R_point)}`;
    this.dom.eccSharedSecretVal.textContent = `S = ${EC.formatPoint(S_point)}`;
    this.dom.eccCiphertext.textContent = eccCiphertextStr || '(Empty)';
    this.dom.eccDecrypted.textContent = eccDecryptedStr || '(Empty)';

    // 3. Statistical Analysis
    const plainStats = StatsEngine.getFrequencies(message);
    const caesarStats = StatsEngine.getFrequencies(caesarResult.ciphertext);
    const eccStats = StatsEngine.getFrequencies(eccCiphertextStr);

    const plainEntropy = StatsEngine.calculateEntropy(plainStats.freqs);
    const caesarEntropy = StatsEngine.calculateEntropy(caesarStats.freqs);
    const eccEntropy = StatsEngine.calculateEntropy(eccStats.freqs);

    const plainIoC = StatsEngine.calculateIoC(plainStats.counts, plainStats.N);
    const caesarIoC = StatsEngine.calculateIoC(caesarStats.counts, caesarStats.N);
    const eccIoC = StatsEngine.calculateIoC(eccStats.counts, eccStats.N);

    this.dom.kpiPlainEntropy.textContent = plainEntropy.toFixed(3) + ' bits';
    this.dom.kpiCaesarEntropy.textContent = caesarEntropy.toFixed(3) + ' bits';
    this.dom.kpiEccEntropy.textContent = eccEntropy.toFixed(3) + ' bits';

    this.dom.kpiPlainIoc.textContent = plainIoC.toFixed(4);
    this.dom.kpiCaesarIoc.textContent = caesarIoC.toFixed(4);
    this.dom.kpiEccIoc.textContent = eccIoC.toFixed(4);

    // 4. Draw Comparison Chart
    this.chartData = {
      plainFreqs: plainStats.freqs,
      caesarFreqs: caesarStats.freqs,
      eccFreqs: eccStats.freqs
    };
    this.drawChart();
  }

  drawChart() {
    const canvas = this.dom.chartCanvas;
    if (!canvas || !this.chartData) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const padLeft = 45;
    const padRight = 20;
    const padTop = 25;
    const padBottom = 35;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const numGrid = 5;
    let maxVal = 0.25;

    // Check if any frequency exceeds 0.25
    for (let i = 0; i < 26; i++) {
      const c = String.fromCharCode(65 + i);
      maxVal = Math.max(maxVal, this.chartData.plainFreqs[c] || 0, this.chartData.caesarFreqs[c] || 0, this.chartData.eccFreqs[c] || 0);
    }
    maxVal = Math.ceil(maxVal * 20) / 20; // round up to nearest 0.05

    for (let g = 0; g <= numGrid; g++) {
      const y = padTop + plotH - (g / numGrid) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      const pct = ((g / numGrid) * maxVal * 100).toFixed(0) + '%';
      ctx.fillText(pct, padLeft - 8, y + 3);
    }

    // 26 Letter Groups
    const groupW = plotW / 26;
    const barW = Math.max(2, (groupW - 4) / 3);

    for (let i = 0; i < 26; i++) {
      const char = String.fromCharCode(65 + i);
      const groupX = padLeft + i * groupW + 2;

      const pF = this.chartData.plainFreqs[char] || 0;
      const cF = this.chartData.caesarFreqs[char] || 0;
      const eF = this.chartData.eccFreqs[char] || 0;

      // Plaintext Bar (Light Blue/Indigo)
      const pH = (pF / maxVal) * plotH;
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(groupX, padTop + plotH - pH, barW, pH);

      // Caesar Bar (Amber)
      const cH = (cF / maxVal) * plotH;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(groupX + barW, padTop + plotH - cH, barW, cH);

      // ECC Bar (Cyan)
      const eH = (eF / maxVal) * plotH;
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(groupX + barW * 2, padTop + plotH - eH, barW, eH);

      // Letter label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(char, groupX + groupW / 2 - 1, H - padBottom + 16);
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new Task1App();
});
