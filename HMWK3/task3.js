/**
 * ==============================================================================
 * HMWK 3 — TASK 3: TOY SECP256K1 CRYPTANALYSIS & SECURITY SCALING LAB
 * Implementation of Brute Force, Baby-Step Giant-Step, Pollard's Rho & Scaling
 * ==============================================================================
 */

// ==========================================
// 1. ELLIPTIC CURVE ARITHMETIC ENGINE
// ==========================================

const EC = {
  p: 17,
  a: 0,
  b: 7, // y^2 = x^3 + 7 (mod 17)
  G: [1, 5],
  order: 18,

  mod(n, m = this.p) {
    const res = n % m;
    return res >= 0 ? res : res + m;
  },

  extendedGCD(a, b) {
    if (b === 0) return [1, 0, a];
    const [x1, y1, d] = this.extendedGCD(b, a % b);
    return [y1, x1 - Math.floor(a / b) * y1, d];
  },

  modInverse(a, m = this.p) {
    const [x, , d] = this.extendedGCD(this.mod(a, m), m);
    return d === 1 ? this.mod(x, m) : null;
  },

  pointEquals(P, Q) {
    if (!P && !Q) return true;
    if (!P || !Q) return false;
    return P[0] === Q[0] && P[1] === Q[1];
  },

  pointToString(P) {
    if (!P) return 'O (Infinity)';
    return `(${P[0]}, ${P[1]})`;
  },

  add(P, Q, p = this.p) {
    if (!P) return Q;
    if (!Q) return P;

    const [x1, y1] = P;
    const [x2, y2] = Q;

    if (x1 === x2 && this.mod(y1 + y2, p) === 0) return null;

    let m;
    if (x1 === x2 && y1 === y2) {
      if (y1 === 0) return null;
      const num = this.mod(3 * x1 * x1 + this.a, p);
      const den = this.mod(2 * y1, p);
      const denInv = this.modInverse(den, p);
      if (denInv === null) return null;
      m = this.mod(num * denInv, p);
    } else {
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

  negate(P, p = this.p) {
    if (!P) return null;
    return [P[0], this.mod(-P[1], p)];
  },

  subtract(P, Q, p = this.p) {
    return this.add(P, this.negate(Q, p), p);
  },

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
  }
};

// ==========================================
// 2. DISCRETE LOGARITHM ATTACK ENGINES
// ==========================================

const ECDLPAttacks = {
  // 1. Exhaustive Brute-Force Search: O(K)
  async bruteForce(G, Q, maxKey, p, onStep) {
    const t0 = performance.now();
    let currentPoint = null;
    let ops = 0;

    for (let k = 1; k <= maxKey; k++) {
      currentPoint = EC.add(currentPoint, G, p);
      ops++;

      if (onStep && (k % 5 === 0 || k === maxKey || EC.pointEquals(currentPoint, Q))) {
        onStep({
          candidateK: k,
          currentPoint,
          targetQ: Q,
          ops,
          isMatch: EC.pointEquals(currentPoint, Q)
        });
        if (maxKey <= 50) await new Promise(r => setTimeout(r, 20));
      }

      if (EC.pointEquals(currentPoint, Q)) {
        const t1 = performance.now();
        return {
          recoveredKey: k,
          ops,
          timeMs: (t1 - t0),
          success: true
        };
      }
    }

    const t1 = performance.now();
    return { recoveredKey: null, ops, timeMs: (t1 - t0), success: false };
  },

  // 2. Baby-Step Giant-Step (BSGS) Algorithm: O(sqrt(K))
  async bsgs(G, Q, maxKey, p, onStep) {
    const t0 = performance.now();
    let ops = 0;
    const m = Math.ceil(Math.sqrt(maxKey));

    if (onStep) {
      onStep({
        info: `BSGS initialized: m = ⌈√${maxKey}⌉ = ${m}. Building baby-step table (0 to ${m - 1})...`
      });
    }

    // Phase 1: Baby Steps (compute j * G and store in table)
    const babyTable = new Map();
    let babyCur = null;

    for (let j = 0; j < m; j++) {
      const key = babyCur ? `${babyCur[0]},${babyCur[1]}` : 'inf';
      babyTable.set(key, j);
      ops++;

      if (onStep && maxKey <= 50) {
        onStep({
          phase: 'Baby Step',
          j,
          point: babyCur,
          ops
        });
        await new Promise(r => setTimeout(r, 20));
      }
      babyCur = EC.add(babyCur, G, p);
    }

    // Phase 2: Giant Steps
    // Compute m * G and its negation -(mG)
    const mG = EC.multiply(m, G, p);
    const negMG = EC.negate(mG, p);
    ops += Math.floor(Math.log2(m)) + 1; // Double-and-add cost

    let gamma = Q; // Starts at Q - 0*(mG)

    for (let i = 0; i <= m; i++) {
      const key = gamma ? `${gamma[0]},${gamma[1]}` : 'inf';
      ops++;

      if (onStep && maxKey <= 50) {
        onStep({
          phase: 'Giant Step',
          i,
          gamma,
          ops
        });
        await new Promise(r => setTimeout(r, 20));
      }

      if (babyTable.has(key)) {
        const j = babyTable.get(key);
        const k = i * m + j;

        if (k > 0 && k <= maxKey) {
          const t1 = performance.now();
          if (onStep) {
            onStep({
              match: true,
              i,
              j,
              k,
              ops,
              info: `Collision found! Q - ${i}(${m}G) = ${j}G  ==>  k = ${i}·${m} + ${j} = ${k}`
            });
          }
          return {
            recoveredKey: k,
            ops,
            timeMs: (t1 - t0),
            success: true
          };
        }
      }

      gamma = EC.add(gamma, negMG, p);
    }

    const t1 = performance.now();
    return { recoveredKey: null, ops, timeMs: (t1 - t0), success: false };
  },

  // 3. Pollard's Rho Algorithm for ECDLP: O(sqrt(K)) time, O(1) space
  async pollardsRho(G, Q, order, p, onStep) {
    const t0 = performance.now();
    let ops = 0;

    // Partition function: splits finite field x-coordinate into 3 subsets
    const partition = (P) => {
      if (!P) return 0;
      return P[0] % 3;
    };

    // Transition step: R_{i+1} = f(R_i) = a_i*G + b_i*Q
    const step = (R, a, b) => {
      ops++;
      const subset = partition(R);
      if (subset === 0) {
        // R <- R + G, a <- a + 1
        return [EC.add(R, G, p), EC.mod(a + 1, order), b];
      } else if (subset === 1) {
        // R <- 2*R, a <- 2*a, b <- 2*b
        return [EC.add(R, R, p), EC.mod(2 * a, order), EC.mod(2 * b, order)];
      } else {
        // R <- R + Q, b <- b + 1
        return [EC.add(R, Q, p), a, EC.mod(b + 1, order)];
      }
    };

    // Tortoise and Hare initialization
    let [tortoise, aT, bT] = [null, 0, 0];
    let [hare, aH, bH] = [null, 0, 0];

    // Take initial step
    [tortoise, aT, bT] = step(tortoise, aT, bT);
    [hare, aH, bH] = step(hare, aH, bH);
    [hare, aH, bH] = step(hare, aH, bH);

    let maxSteps = order * 4;
    while (!EC.pointEquals(tortoise, hare) && maxSteps > 0) {
      [tortoise, aT, bT] = step(tortoise, aT, bT);
      [hare, aH, bH] = step(hare, aH, bH);
      [hare, aH, bH] = step(hare, aH, bH);
      maxSteps--;

      if (onStep && maxSteps % 2 === 0) {
        onStep({
          phase: 'Pollard Walk',
          tortoise,
          hare,
          ops
        });
        if (order <= 50) await new Promise(r => setTimeout(r, 20));
      }
    }

    if (EC.pointEquals(tortoise, hare)) {
      // Collision! aT*G + bT*Q = aH*G + bH*Q
      // (aT - aH) * G = (bH - bT) * Q = (bH - bT) * k * G
      // k * (bH - bT) ≡ (aT - aH) (mod order)
      const num = EC.mod(aT - aH, order);
      const den = EC.mod(bH - bT, order);
      const denInv = EC.modInverse(den, order);

      if (denInv !== null) {
        const k = EC.mod(num * denInv, order);
        const t1 = performance.now();
        if (onStep) {
          onStep({
            match: true,
            k,
            ops,
            info: `Cycle detected: (${den})·k ≡ ${num} (mod ${order})  ==>  k = ${k}`
          });
        }
        return { recoveredKey: k, ops, timeMs: (t1 - t0), success: true };
      }
    }

    const t1 = performance.now();
    return { recoveredKey: null, ops, timeMs: (t1 - t0), success: false };
  }
};

// ==========================================
// 3. UI CONTROLLER & SCALING CALCULATOR
// ==========================================

class Task3App {
  constructor() {
    this.state = {
      privateKey: 6, // HMWK 1 toy key
      maxKeySpace: 18, // HMWK 1 order
      attackMethod: 'bsgs',
      secretMessage: 'BITCOIN_AND_ETHEREUM_USE_SECP256K1',
      isAttacking: false,
      scalingBits: 256
    };

    this.initDOMElements();
    this.bindEvents();
    this.updateTargetDisplay();
    this.updateScalingEstimates(256);
    this.drawScalingChart();
  }

  initDOMElements() {
    this.dom = {
      keySpaceSelect: document.getElementById('keyspace-select'),
      privateKeySelect: document.getElementById('private-key-select'),
      btnRandomKey: document.getElementById('btn-random-key'),
      attackMethodSelect: document.getElementById('attack-method-select'),
      secretMsgInput: document.getElementById('secret-msg-input'),
      btnLaunchAttack: document.getElementById('btn-launch-attack'),

      // Target displays
      targetPubkey: document.getElementById('target-pubkey'),
      targetCiphertext: document.getElementById('target-ciphertext'),
      targetCurveSpec: document.getElementById('target-curve-spec'),

      // Metrics
      metricOps: document.getElementById('metric-ops'),
      metricTime: document.getElementById('metric-time'),
      metricKey: document.getElementById('metric-recovered-key'),
      metricTheoretical: document.getElementById('metric-theoretical-ops'),

      // Log and Reveal
      logConsole: document.getElementById('attack-log-console'),
      decryptedRevealCard: document.getElementById('decrypted-reveal-card'),
      dispRecoveredPlaintext: document.getElementById('disp-recovered-plaintext'),

      // Scaling calculator
      scalingSlider: document.getElementById('scaling-slider'),
      scalingBitsVal: document.getElementById('scaling-bits-val'),
      scaleKeySpaceVal: document.getElementById('scale-keyspace-val'),
      scaleBruteOpsVal: document.getElementById('scale-brute-ops-val'),
      scaleRhoOpsVal: document.getElementById('scale-rho-ops-val'),
      scaleCpuTimeVal: document.getElementById('scale-cpu-time-val'),
      scaleGpuTimeVal: document.getElementById('scale-gpu-time-val'),
      scaleBtcTimeVal: document.getElementById('scale-btc-time-val'),
      scaleVerdictVal: document.getElementById('scale-verdict-val'),

      // Canvas
      scalingCanvas: document.getElementById('scaling-canvas')
    };

    this.populateKeySelect();
  }

  populateKeySelect() {
    this.dom.privateKeySelect.innerHTML = '';
    const maxK = this.state.maxKeySpace;
    for (let k = 1; k <= maxK; k++) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k === 6 ? `k = ${k} [HMWK1 Spec: Q=(5,8)]` : `k = ${k}`;
      if (k === this.state.privateKey) opt.selected = true;
      this.dom.privateKeySelect.appendChild(opt);
    }
  }

  bindEvents() {
    this.dom.keySpaceSelect.addEventListener('change', (e) => {
      this.state.maxKeySpace = parseInt(e.target.value, 10);
      if (this.state.privateKey > this.state.maxKeySpace) {
        this.state.privateKey = 6;
      }
      this.populateKeySelect();
      this.updateTargetDisplay();
    });

    this.dom.privateKeySelect.addEventListener('change', (e) => {
      this.state.privateKey = parseInt(e.target.value, 10);
      this.updateTargetDisplay();
    });

    this.dom.btnRandomKey.addEventListener('click', () => {
      const randK = Math.floor(Math.random() * this.state.maxKeySpace) + 1;
      this.state.privateKey = randK;
      this.populateKeySelect();
      this.updateTargetDisplay();
    });

    this.dom.attackMethodSelect.addEventListener('change', (e) => {
      this.state.attackMethod = e.target.value;
    });

    this.dom.secretMsgInput.addEventListener('input', (e) => {
      this.state.secretMessage = e.target.value;
      this.updateTargetDisplay();
    });

    this.dom.btnLaunchAttack.addEventListener('click', () => {
      if (!this.state.isAttacking) {
        this.executeAttack();
      }
    });

    this.dom.scalingSlider.addEventListener('input', (e) => {
      const bits = parseInt(e.target.value, 10);
      this.updateScalingEstimates(bits);
    });

    window.addEventListener('resize', () => {
      this.drawScalingChart();
    });
  }

  updateTargetDisplay() {
    const k = this.state.privateKey;
    const Q = EC.multiply(k, EC.G);
    this.targetQ = Q;

    this.dom.targetPubkey.textContent = `Q = ${EC.pointToString(Q)}`;
    this.dom.targetCurveSpec.textContent = `y² ≡ x³ + 7 (mod 17) | Range [1, ${this.state.maxKeySpace}]`;

    // Encrypt secret message with Alice's public key Q using ECDH keystream
    // Bob generates ephemeral nonce r = 4
    const r = 4;
    const R = EC.multiply(r, EC.G);
    const S = EC.multiply(r, Q);
    this.ephemeralR = R;

    const Sx = S ? S[0] : 1;
    const Sy = S ? S[1] : 5;
    let cipher = '';
    const cleanMsg = this.state.secretMessage.toUpperCase();

    for (let i = 0; i < cleanMsg.length; i++) {
      const char = cleanMsg[i];
      if (char >= 'A' && char <= 'Z') {
        const pCode = char.charCodeAt(0) - 65;
        const Ki = EC.mod(Sx * 3 + (i + 1) * Sy + 7, 26);
        const cCode = (pCode + Ki) % 26;
        cipher += String.fromCharCode(65 + cCode);
      } else {
        cipher += char;
      }
    }

    this.currentCiphertext = cipher;
    this.dom.targetCiphertext.textContent = `R=${EC.pointToString(R)} | C="${cipher}"`;
  }

  log(msg, type = 'trial') {
    const el = document.createElement('div');
    el.className = `log-entry ${type}`;
    el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.dom.logConsole.appendChild(el);
    this.dom.logConsole.scrollTop = this.dom.logConsole.scrollHeight;
  }

  async executeAttack() {
    this.state.isAttacking = true;
    this.dom.btnLaunchAttack.disabled = true;
    this.dom.btnLaunchAttack.textContent = '⚡ Cracking ECDLP...';
    this.dom.logConsole.innerHTML = '';
    this.dom.decryptedRevealCard.style.display = 'none';

    const method = this.state.attackMethod;
    const G = EC.G;
    const targetQ = this.targetQ;
    const maxK = this.state.maxKeySpace;

    this.log(`Initiating ${method.toUpperCase()} on restricted keyspace [1, ${maxK}]...`, 'info');
    this.log(`Target Public Key Q = ${EC.pointToString(targetQ)}`, 'info');

    let result = null;

    if (method === 'brute') {
      this.dom.metricTheoretical.textContent = `O(K) ≈ ${maxK} ops`;
      result = await ECDLPAttacks.bruteForce(G, targetQ, maxK, EC.p, (step) => {
        this.dom.metricOps.textContent = step.ops;
        if (step.isMatch) {
          this.log(`MATCH! k = ${step.candidateK} generates point Q = ${EC.pointToString(step.currentPoint)}`, 'match');
        } else {
          this.log(`Trying k = ${step.candidateK}: Point = ${EC.pointToString(step.currentPoint)} (No match)`, 'trial');
        }
      });
    } else if (method === 'bsgs') {
      const m = Math.ceil(Math.sqrt(maxK));
      this.dom.metricTheoretical.textContent = `O(√K) ≈ ${2 * m} ops`;
      result = await ECDLPAttacks.bsgs(G, targetQ, maxK, EC.p, (step) => {
        this.dom.metricOps.textContent = step.ops;
        if (step.info) this.log(step.info, step.match ? 'match' : 'info');
        else if (step.phase === 'Baby Step') {
          this.log(`[Baby Step] j = ${step.j}: ${step.j}G = ${EC.pointToString(step.point)}`, 'trial');
        } else if (step.phase === 'Giant Step') {
          this.log(`[Giant Step] i = ${step.i}: Q - ${step.i}(${m}G) = ${EC.pointToString(step.gamma)}`, 'trial');
        }
      });
    } else if (method === 'rho') {
      this.dom.metricTheoretical.textContent = `O(√K) ≈ ${Math.ceil(Math.sqrt(maxK) * 1.25)} ops`;
      result = await ECDLPAttacks.pollardsRho(G, targetQ, maxK, EC.p, (step) => {
        this.dom.metricOps.textContent = step.ops;
        if (step.info) this.log(step.info, step.match ? 'match' : 'info');
        else if (step.phase === 'Pollard Walk') {
          this.log(`[Pollard Walk] Tortoise=${EC.pointToString(step.tortoise)} | Hare=${EC.pointToString(step.hare)}`, 'trial');
        }
      });
    }

    if (result && result.success) {
      this.dom.metricOps.textContent = result.ops;
      this.dom.metricTime.textContent = `${result.timeMs.toFixed(2)} ms`;
      this.dom.metricKey.textContent = `k = ${result.recoveredKey}`;
      this.dom.metricKey.style.color = '#10b981';

      // Decrypt intercepted ciphertext
      const recoveredK = result.recoveredKey;
      const S_rec = EC.multiply(recoveredK, this.ephemeralR);
      const Sx = S_rec ? S_rec[0] : 1;
      const Sy = S_rec ? S_rec[1] : 5;

      let decrypted = '';
      const cipher = this.currentCiphertext;
      for (let i = 0; i < cipher.length; i++) {
        const c = cipher[i];
        if (c >= 'A' && c <= 'Z') {
          const cCode = c.charCodeAt(0) - 65;
          const Ki = EC.mod(Sx * 3 + (i + 1) * Sy + 7, 26);
          const pCode = (cCode - Ki + 26) % 26;
          decrypted += String.fromCharCode(65 + pCode);
        } else {
          decrypted += c;
        }
      }

      this.dom.dispRecoveredPlaintext.textContent = decrypted;
      this.dom.decryptedRevealCard.style.display = 'flex';
      this.log(`DECRYPTION SUCCESSFUL! Recovered Plaintext: "${decrypted}"`, 'match');
    } else {
      this.dom.metricKey.textContent = 'Failed';
      this.dom.metricKey.style.color = '#f43f5e';
      this.log('Attack finished without finding key in range.', 'trial');
    }

    this.dom.btnLaunchAttack.disabled = false;
    this.dom.btnLaunchAttack.textContent = '🚀 Launch Attack Engine';
    this.state.isAttacking = false;
  }

  // Scaling estimates calculator
  updateScalingEstimates(bits) {
    this.state.scalingBits = bits;
    this.dom.scalingBitsVal.textContent = `${bits} bits`;

    // Key space: 2^bits
    let keySpaceStr = '';
    let bruteOpsStr = '';
    let rhoOpsStr = '';
    let cpuTimeStr = '';
    let gpuTimeStr = '';
    let btcTimeStr = '';
    let verdictStr = '';

    if (bits === 4) {
      keySpaceStr = '16 (2⁴)';
      bruteOpsStr = '16';
      rhoOpsStr = '5';
      cpuTimeStr = '< 0.001 ms';
      gpuTimeStr = '< 0.0001 ms';
      btcTimeStr = 'Instantaneous';
      verdictStr = 'Trivial (Toy field 𝔽₁₇, instantly breakable)';
    } else if (bits === 8) {
      keySpaceStr = '256 (2⁸)';
      bruteOpsStr = '256';
      rhoOpsStr = '20';
      cpuTimeStr = '0.02 ms';
      gpuTimeStr = '< 0.001 ms';
      btcTimeStr = 'Instantaneous';
      verdictStr = 'Trivial academic exercise';
    } else if (bits === 16) {
      keySpaceStr = '65,536 (2¹⁶)';
      bruteOpsStr = '65,536';
      rhoOpsStr = '320';
      cpuTimeStr = '6.5 ms';
      gpuTimeStr = '< 0.01 ms';
      btcTimeStr = 'Instantaneous';
      verdictStr = 'Trivial for modern microcontrollers';
    } else if (bits === 32) {
      keySpaceStr = '4.29 × 10⁹ (2³²)';
      bruteOpsStr = '4.29 × 10⁹';
      rhoOpsStr = '82,000';
      cpuTimeStr = '~7 minutes (brute) / 8 ms (rho)';
      gpuTimeStr = '0.04 seconds';
      btcTimeStr = 'Microseconds';
      verdictStr = 'Vulnerable: solved in seconds on consumer GPU';
    } else if (bits === 64) {
      keySpaceStr = '1.84 × 10¹⁹ (2⁶⁴)';
      bruteOpsStr = '1.84 × 10¹⁹';
      rhoOpsStr = '5.38 × 10⁹ (2³²)';
      cpuTimeStr = '58,000 years (brute) / ~9 minutes (rho)';
      gpuTimeStr = '0.05 seconds (rho)';
      btcTimeStr = '0.009 milliseconds (rho)';
      verdictStr = 'Insecure against Pollard rho with moderate cluster';
    } else if (bits === 128) {
      keySpaceStr = '3.40 × 10³⁸ (2¹²⁸)';
      bruteOpsStr = '3.40 × 10³⁸';
      rhoOpsStr = '2.31 × 10¹⁹ (2⁶⁴)';
      cpuTimeStr = '10²⁴ years (brute) / 73,000 years (rho)';
      gpuTimeStr = '7.3 years (rho on supercomputer)';
      btcTimeStr = '38.5 seconds (entire global Bitcoin network)';
      verdictStr = 'Marginal: vulnerable to nation-state level ASIC power';
    } else if (bits === 256) {
      keySpaceStr = '1.1579 × 10⁷⁷ (2²⁵⁶)';
      bruteOpsStr = '1.1579 × 10⁷⁷';
      rhoOpsStr = '3.40 × 10³⁸ (2¹²⁸)';
      cpuTimeStr = '10⁶³ years (exceeds all cosmological scales)';
      gpuTimeStr = '10²⁰ years';
      btcTimeStr = '18.2 BILLION YEARS (1.3× Age of Universe)';
      verdictStr = 'UNBREAKABLE: Absolute physical and mathematical security';
    }

    this.dom.scaleKeySpaceVal.textContent = keySpaceStr;
    this.dom.scaleBruteOpsVal.textContent = bruteOpsStr;
    this.dom.scaleRhoOpsVal.textContent = rhoOpsStr;
    this.dom.scaleCpuTimeVal.textContent = cpuTimeStr;
    this.dom.scaleGpuTimeVal.textContent = gpuTimeStr;
    this.dom.scaleBtcTimeVal.textContent = btcTimeStr;
    this.dom.scaleVerdictVal.textContent = verdictStr;
  }

  // Draw exponential scaling chart
  drawScalingChart() {
    const canvas = this.dom.scalingCanvas;
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

    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBottom;

    // Y Axis in log2(Operations): 0 to 256
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let logOp = 0; logOp <= 256; logOp += 64) {
      const y = padTop + plotH - (logOp / 256) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`2^${logOp}`, padLeft - 8, y + 3);
    }

    // X Axis bits: 4 to 256
    const bitPoints = [4, 16, 32, 64, 128, 192, 256];
    const getX = (b) => padLeft + ((b - 4) / (256 - 4)) * plotW;
    const getY = (logOp) => padTop + plotH - (logOp / 256) * plotH;

    for (const b of bitPoints) {
      const x = getX(b);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${b}b`, x, H - padBottom + 18);
    }

    // Curve 1: Brute Force (log2(Ops) = b)
    ctx.beginPath();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    for (let b = 4; b <= 256; b += 4) {
      const x = getX(b);
      const y = getY(b);
      if (b === 4) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Curve 2: Pollard's Rho / BSGS (log2(Ops) = b / 2)
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    for (let b = 4; b <= 256; b += 4) {
      const x = getX(b);
      const y = getY(b / 2);
      if (b === 4) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Feasibility Ceiling: Global Computing Limit (~2^100 ops in universe lifetime)
    const limitY = getY(100);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, limitY);
    ctx.lineTo(W - padRight, limitY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Estimated Physical Limit of Computation in Universe (~2^100 ops)', padLeft + 10, limitY - 8);

    // Current selected point marker
    const curB = this.state.scalingBits;
    const curX = getX(curB);
    const curYBrute = getY(curB);
    const curYRho = getY(curB / 2);

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(curX, curYBrute, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(curX, curYRho, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new Task3App();
});
