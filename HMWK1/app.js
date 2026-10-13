/**
 * ==============================================================================
 * ELLIPTIC-CURVE SCALAR MULTIPLICATION LAB — APPLICATION LOGIC
 * Homework 1: Public-Key Cryptography in Ethereum (secp256k1)
 *
 * Core functionalities:
 *  1. Elliptic curve arithmetic over finite fields F_p and real field R.
 *  2. Step-by-step point multiplication visualizer (Q = kG) with chord/tangent geometry.
 *  3. Double-and-Add (binary exponentiation) algorithm with complexity comparison.
 *  4. Comprehensive statistical exploration (uniformity, bits, correlation, avalanche).
 * ==============================================================================
 */

// ==========================================
// 1. MATHEMATICAL ENGINE & UTILITIES
// ==========================================

const MathEC = {
  // Always returns positive modulo: a mod m
  mod(n, m) {
    const res = n % m;
    return res >= 0 ? res : res + m;
  },

  // Extended Euclidean Algorithm: returns [x, y, gcd] such that a*x + b*y = gcd
  extendedGCD(a, b) {
    if (b === 0) return [1, 0, a];
    const [x1, y1, d] = this.extendedGCD(b, a % b);
    return [y1, x1 - Math.floor(a / b) * y1, d];
  },

  // Modular multiplicative inverse: a^(-1) mod m
  modInverse(a, m) {
    const [x, , d] = this.extendedGCD(this.mod(a, m), m);
    if (d !== 1) return null; // No inverse if not coprime
    return this.mod(x, m);
  },

  // Elliptic curve y^2 = x^3 + ax + b (mod p)
  // secp256k1 family parameters: a = 0, b = 7
  findAllPoints(p, a = 0, b = 7) {
    const points = [];
    for (let x = 0; x < p; x++) {
      const rhs = this.mod(x * x * x + a * x + b, p);
      for (let y = 0; y < p; y++) {
        if (this.mod(y * y, p) === rhs) {
          points.push([x, y]);
        }
      }
    }
    return points;
  },

  // Point Addition on F_p: returns { R: [x3, y3] or null, slope, isDoubling, explanation }
  addPointsFp(P, Q, p, a = 0) {
    if (!P) return { R: Q, slope: null, isDoubling: false, type: 'identity-P' };
    if (!Q) return { R: P, slope: null, isDoubling: false, type: 'identity-Q' };

    const [x1, y1] = P;
    const [x2, y2] = Q;

    // Check if points are inverses: P + (-P) = Point at Infinity O
    if (x1 === x2 && this.mod(y1 + y2, p) === 0) {
      return { R: null, slope: Infinity, isDoubling: false, type: 'infinity' };
    }

    let m;
    let isDoubling = false;

    if (x1 === x2 && y1 === y2) {
      // Point Doubling: 2P
      isDoubling = true;
      if (y1 === 0) {
        return { R: null, slope: Infinity, isDoubling: true, type: 'infinity' };
      }
      const num = this.mod(3 * x1 * x1 + a, p);
      const den = this.mod(2 * y1, p);
      const denInv = this.modInverse(den, p);
      if (denInv === null) return { R: null, slope: null, isDoubling: true, type: 'infinity' };
      m = this.mod(num * denInv, p);
    } else {
      // Point Addition: P + Q
      const num = this.mod(y2 - y1, p);
      const den = this.mod(x2 - x1, p);
      const denInv = this.modInverse(den, p);
      if (denInv === null) return { R: null, slope: null, isDoubling: false, type: 'infinity' };
      m = this.mod(num * denInv, p);
    }

    const x3 = this.mod(m * m - x1 - x2, p);
    const y3 = this.mod(m * (x1 - x3) - y1, p);

    return {
      R: [x3, y3],
      slope: m,
      isDoubling,
      type: isDoubling ? 'doubling' : 'addition',
      x1, y1, x2, y2, x3, y3
    };
  },

  // Point Addition on Real Numbers R: y^2 = x^3 + 7
  addPointsReal(P, Q) {
    if (!P) return { R: Q, slope: 0, isDoubling: false };
    if (!Q) return { R: P, slope: 0, isDoubling: false };

    const [x1, y1] = P;
    const [x2, y2] = Q;

    const eps = 1e-6;
    if (Math.abs(x1 - x2) < eps && Math.abs(y1 + y2) < eps) {
      return { R: null, slope: Infinity, isDoubling: false };
    }

    let m;
    let isDoubling = false;

    if (Math.abs(x1 - x2) < eps && Math.abs(y1 - y2) < eps) {
      isDoubling = true;
      if (Math.abs(y1) < eps) return { R: null, slope: Infinity, isDoubling: true };
      m = (3 * x1 * x1) / (2 * y1);
    } else {
      m = (y2 - y1) / (x2 - x1);
    }

    const x3 = m * m - x1 - x2;
    const y3 = m * (x1 - x3) - y1;
    const yIntersect = m * (x3 - x1) + y1; // Point on line before reflection: (x3, yIntersect)

    return {
      R: [x3, y3],
      RPrime: [x3, yIntersect],
      slope: m,
      isDoubling,
      intercept: y1 - m * x1
    };
  },

  // Sequential scalar multiplication: returns array of step states [1G, 2G, ..., kG]
  computeScalarSequence(G, k, p) {
    const sequence = [];
    let current = G;
    sequence.push({
      mult: 1,
      point: G,
      op: 'Base Point',
      mathDetails: 'Generator point G'
    });

    for (let step = 2; step <= k; step++) {
      if (current === null) {
        sequence.push({
          mult: step,
          point: null,
          op: 'Point at Infinity',
          mathDetails: 'Point at Infinity O'
        });
        continue;
      }

      const res = this.addPointsFp(current, G, p);
      current = res.R;
      sequence.push({
        mult: step,
        point: current,
        op: res.isDoubling ? 'Doubling (2G)' : `Addition (${step - 1}G + G)`,
        resMeta: res
      });
    }

    return sequence;
  },

  // Compute subgroup order of point G on F_p
  computePointOrder(G, p) {
    let cur = G;
    let order = 1;
    while (cur !== null && order <= p + 50) {
      const res = this.addPointsFp(cur, G, p);
      cur = res.R;
      order++;
    }
    return cur === null ? order : null;
  },

  // Double-and-Add (binary exponentiation) algorithm
  doubleAndAdd(G, k, p) {
    const binaryStr = k.toString(2);
    let R = null;
    const steps = [];
    let totalDoublings = 0;
    let totalAdditions = 0;

    for (let i = 0; i < binaryStr.length; i++) {
      const bit = binaryStr[i];
      const startR = R ? [...R] : null;

      // 1. Double
      let afterDouble = null;
      let doubleMeta = null;
      if (R !== null) {
        doubleMeta = this.addPointsFp(R, R, p);
        afterDouble = doubleMeta.R;
        R = afterDouble;
        totalDoublings++;
      }

      // 2. Add if bit is 1
      let afterAdd = null;
      let addMeta = null;
      let added = false;
      if (bit === '1') {
        addMeta = this.addPointsFp(R, G, p);
        afterAdd = addMeta.R;
        R = afterAdd;
        totalAdditions++;
        added = true;
      }

      steps.push({
        stepIdx: i + 1,
        bitIdx: binaryStr.length - 1 - i,
        bit,
        startR,
        afterDouble,
        doubleMeta,
        added,
        afterAdd,
        addMeta,
        finalR: R ? [...R] : null
      });
    }

    return {
      result: R,
      binaryStr,
      steps,
      totalDoublings,
      totalAdditions,
      totalOps: totalDoublings + totalAdditions
    };
  }
};

// ==========================================
// 2. SECTION 1: POINT MULTIPLICATION CONTROLLER
// ==========================================

const PointMultController = {
  // State
  domainMode: 'finite', // 'finite' or 'real'
  p: 17,
  G: [1, 5],
  k: 6,
  activeStep: 1, // 1 to k
  isPlaying: false,
  animInterval: null,
  animSpeedMs: 900,
  sequence: [],
  allPoints: [],

  // DOM elements
  elements: {},

  init() {
    this.cacheDom();
    this.bindEvents();
    this.setupCurve();
  },

  cacheDom() {
    this.elements = {
      modeSelect: document.getElementById('curve-mode-select'),
      pointSelect: document.getElementById('point-select'),
      kSelect: document.getElementById('scalar-k-select'),
      btnPrev: document.getElementById('btn-step-prev'),
      btnPlay: document.getElementById('btn-play-pause'),
      btnNext: document.getElementById('btn-step-next'),
      btnReset: document.getElementById('btn-reset-mult'),
      iconPlay: document.getElementById('icon-play'),
      labelPlay: document.getElementById('label-play'),
      speedSlider: document.getElementById('anim-speed'),
      speedLabel: document.getElementById('speed-label'),
      statusText: document.getElementById('multiplication-status-text'),
      canvasViewBadge: document.getElementById('canvas-view-badge'),
      canvas: document.getElementById('curve-canvas'),
      tooltip: document.getElementById('canvas-tooltip'),
      displayPrivKey: document.getElementById('display-priv-key'),
      displayPubKey: document.getElementById('display-pub-key'),
      stepBadge: document.getElementById('math-step-badge'),
      mathExp: document.getElementById('math-explanation'),
      seqTbody: document.getElementById('sequence-tbody')
    };
  },

  bindEvents() {
    this.elements.modeSelect.addEventListener('change', (e) => {
      this.domainMode = e.target.value;
      this.setupCurve();
    });

    this.elements.pointSelect.addEventListener('change', (e) => {
      const parts = e.target.value.split(',').map(Number);
      this.G = parts;
      this.updateMultiplication();
    });

    this.elements.kSelect.addEventListener('change', (e) => {
      this.k = parseInt(e.target.value, 10);
      this.updateMultiplication();
    });

    this.elements.btnPrev.addEventListener('click', () => {
      this.pauseAnimation();
      if (this.activeStep > 1) {
        this.activeStep--;
        this.renderStep();
      }
    });

    this.elements.btnNext.addEventListener('click', () => {
      this.pauseAnimation();
      if (this.activeStep < this.k) {
        this.activeStep++;
        this.renderStep();
      }
    });

    this.elements.btnPlay.addEventListener('click', () => {
      this.togglePlay();
    });

    this.elements.btnReset.addEventListener('click', () => {
      this.pauseAnimation();
      this.activeStep = 1;
      this.renderStep();
    });

    this.elements.speedSlider.addEventListener('input', (e) => {
      this.animSpeedMs = parseInt(e.target.value, 10);
      this.elements.speedLabel.textContent = (this.animSpeedMs / 1000).toFixed(1) + 's';
      if (this.isPlaying) {
        this.pauseAnimation();
        this.startAnimation();
      }
    });

    // Canvas resize / DPI setup
    window.addEventListener('resize', () => {
      this.drawCanvas();
    });

    // Tooltip on canvas mouse move
    this.elements.canvas.addEventListener('mousemove', (e) => {
      this.handleCanvasMouseMove(e);
    });

    this.elements.canvas.addEventListener('mouseleave', () => {
      this.elements.tooltip.style.display = 'none';
    });
  },

  setupCurve() {
    this.pauseAnimation();

    if (this.domainMode === 'finite') {
      this.elements.canvasViewBadge.textContent = 'Finite Field 𝔽₁₇ Lattice Plane : y² ≡ x³ + 7 (mod 17)';
      this.allPoints = MathEC.findAllPoints(this.p, 0, 7);

      // Populate Point Select
      this.elements.pointSelect.innerHTML = '';
      this.allPoints.forEach((pt) => {
        const opt = document.createElement('option');
        opt.value = `${pt[0]},${pt[1]}`;
        const isHomeworkG = pt[0] === 1 && pt[1] === 5;
        const ord = MathEC.computePointOrder(pt, this.p);
        opt.textContent = `(${pt[0]}, ${pt[1]}) [Order ${ord}]${isHomeworkG ? ' ★ HMWK 1 Base Point' : ''}`;
        if (isHomeworkG) opt.selected = true;
        this.elements.pointSelect.appendChild(opt);
      });
      this.G = [1, 5];

      // Populate k Select (1 to subgroup order or 18)
      this.populateKSelect(18, 6);
    } else {
      // Real continuous curve
      this.elements.canvasViewBadge.textContent = 'Continuous Real Curve ℝ : y² = x³ + 7 [Chord/Tangent Method]';
      this.elements.pointSelect.innerHTML = `
        <option value="-1,2.4495" selected>G = (-1, √6 ≈ 2.45) [Clean Reflection]</option>
        <option value="1,2.8284">G = (1, √8 ≈ 2.83)</option>
        <option value="2,3.8730">G = (2, √15 ≈ 3.87)</option>
      `;
      this.G = [-1, Math.sqrt(Math.pow(-1, 3) + 7)];
      this.populateKSelect(5, 3);
    }

    this.updateMultiplication();
  },

  populateKSelect(maxK, defaultK) {
    this.elements.kSelect.innerHTML = '';
    for (let i = 1; i <= maxK; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `k = ${i}${i === 6 ? ' (Homework Private Key)' : ''}`;
      if (i === defaultK) opt.selected = true;
      this.elements.kSelect.appendChild(opt);
    }
    this.k = defaultK;
  },

  updateMultiplication() {
    this.pauseAnimation();
    if (this.domainMode === 'finite') {
      this.sequence = MathEC.computeScalarSequence(this.G, this.k, this.p);
    } else {
      // Real curve sequence
      this.sequence = [];
      let cur = this.G;
      this.sequence.push({ mult: 1, point: this.G, op: 'Base Point' });
      for (let step = 2; step <= this.k; step++) {
        if (!cur) {
          this.sequence.push({ mult: step, point: null, op: 'Infinity' });
          continue;
        }
        const res = MathEC.addPointsReal(cur, this.G);
        cur = res.R;
        this.sequence.push({ mult: step, point: cur, op: `Step ${step}`, resMeta: res });
      }
    }

    this.activeStep = this.k; // Start on final step
    this.renderStep();
  },

  renderStep() {
    const curStepData = this.sequence[this.activeStep - 1] || this.sequence[0];
    const finalStepData = this.sequence[this.sequence.length - 1];

    // Key Pair display
    this.elements.displayPrivKey.textContent = `${this.k}`;
    if (finalStepData && finalStepData.point) {
      if (this.domainMode === 'finite') {
        this.elements.displayPubKey.textContent = `(${finalStepData.point[0]}, ${finalStepData.point[1]})`;
      } else {
        this.elements.displayPubKey.textContent = `(${finalStepData.point[0].toFixed(2)}, ${finalStepData.point[1].toFixed(2)})`;
      }
    } else {
      this.elements.displayPubKey.textContent = 'Point at Infinity 𝒪';
    }

    // Step badge
    this.elements.stepBadge.textContent = `Step ${this.activeStep} of ${this.k}`;
    this.elements.statusText.textContent = `Active: ${this.activeStep}G = ${curStepData.point
        ? `(${this.domainMode === 'finite'
          ? curStepData.point.join(', ')
          : `${curStepData.point[0].toFixed(2)}, ${curStepData.point[1].toFixed(2)}`
        })`
        : '𝒪'
      }`;

    // Math Explanation render
    this.renderMathExplanation(curStepData);

    // Sequence Table render
    this.renderSequenceTable();

    // Canvas drawing
    this.drawCanvas();
  },

  renderMathExplanation(stepData) {
    if (this.activeStep === 1) {
      this.elements.mathExp.innerHTML = `
        <div class="math-row"><strong>Multiplication Start:</strong> Multiplier k = 1</div>
        <div class="math-row">1G is simply the initial base point: <span class="math-highlight">G = (${this.domainMode === 'finite'
          ? this.G.join(', ')
          : `${this.G[0].toFixed(2)}, ${this.G[1].toFixed(2)}`
        })</span></div>
        <div class="math-row" style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.4rem;">
          To compute 2G, we will double G: draw the tangent at G, find curve intersection, and reflect across y = 0.
        </div>
      `;
      return;
    }

    if (this.domainMode === 'finite') {
      const meta = stepData.resMeta;
      if (!meta) {
        this.elements.mathExp.innerHTML = `<div class="math-row">Result is Point at Infinity 𝒪</div>`;
        return;
      }

      if (meta.type === 'infinity') {
        this.elements.mathExp.innerHTML = `
          <div class="math-row"><span class="math-accent">Vertical Line Encountered:</span> x₁ = x₂ and y₁ = -y₂ (mod 17)</div>
          <div class="math-row">Sum equals the <strong class="math-highlight">Point at Infinity (𝒪)</strong>.</div>
          <div class="math-row">Subgroup cyclic order reached at this point!</div>
        `;
        return;
      }

      const isDoubling = meta.isDoubling;
      const slopeFormula = isDoubling
        ? `m ≡ (3·x₁²)/(2·y₁) ≡ (3·${meta.x1}²)/(2·${meta.y1}) ≡ ${meta.slope} (mod 17)`
        : `m ≡ (y₂ - y₁)/(x₂ - x₁) ≡ (${meta.y2} - ${meta.y1})/(${meta.x2} - ${meta.x1}) ≡ ${meta.slope} (mod 17)`;

      this.elements.mathExp.innerHTML = `
        <div class="math-row"><strong>Operation:</strong> ${isDoubling ? 'Point Doubling: G + G = 2G' : `Point Addition: ${this.activeStep - 1}G + G = ${this.activeStep}G`}</div>
        <div class="math-row"><strong>Modular Slope:</strong> <span class="math-highlight">${slopeFormula}</span></div>
        <div class="math-row"><strong>New x:</strong> x₃ ≡ m² - x₁ - x₂ ≡ ${meta.slope}² - ${meta.x1} - ${meta.x2} ≡ <span class="math-accent">${meta.x3} (mod 17)</span></div>
        <div class="math-row"><strong>New y:</strong> y₃ ≡ m(x₁ - x₃) - y₁ ≡ ${meta.slope}(${meta.x1} - ${meta.x3}) - ${meta.y1} ≡ <span class="math-accent">${meta.y3} (mod 17)</span></div>
        <div class="math-row" style="margin-top: 0.4rem; font-weight: 600;">Resulting Point: (${meta.x3}, ${meta.y3})</div>
      `;
    } else {
      // Real curve math explanation
      const meta = stepData.resMeta;
      if (!meta || !meta.R) {
        this.elements.mathExp.innerHTML = `<div class="math-row">Result is Point at Infinity 𝒪</div>`;
        return;
      }

      this.elements.mathExp.innerHTML = `
        <div class="math-row"><strong>Operation:</strong> ${meta.isDoubling ? 'Tangent Doubling' : 'Secant Chord Addition'}</div>
        <div class="math-row"><strong>Tangent/Secant Slope m:</strong> <span class="math-highlight">${meta.slope.toFixed(4)}</span></div>
        <div class="math-row"><strong>Intersection Point R':</strong> (${meta.RPrime[0].toFixed(2)}, ${meta.RPrime[1].toFixed(2)})</div>
        <div class="math-row"><strong>Reflection Across x-axis R:</strong> <span class="math-accent">(${meta.R[0].toFixed(2)}, ${meta.R[1].toFixed(2)})</span></div>
      `;
    }
  },

  renderSequenceTable() {
    this.elements.seqTbody.innerHTML = '';
    this.sequence.forEach((stepItem) => {
      const tr = document.createElement('tr');
      if (stepItem.mult === this.activeStep) tr.classList.add('active-step-row');
      if (stepItem.mult === this.k) tr.classList.add('final-pub-row');

      let ptStr = '𝒪 (Infinity)';
      if (stepItem.point) {
        ptStr = this.domainMode === 'finite'
          ? `(${stepItem.point[0]}, ${stepItem.point[1]})`
          : `(${stepItem.point[0].toFixed(2)}, ${stepItem.point[1].toFixed(2)})`;
      }

      tr.innerHTML = `
        <td>${stepItem.mult}G</td>
        <td>${ptStr}</td>
        <td>${stepItem.mult === this.k ? '★ TOY PUBLIC KEY' : stepItem.op}</td>
      `;

      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        this.pauseAnimation();
        this.activeStep = stepItem.mult;
        this.renderStep();
      });

      this.elements.seqTbody.appendChild(tr);
    });
  },

  togglePlay() {
    if (this.isPlaying) {
      this.pauseAnimation();
    } else {
      if (this.activeStep >= this.k) {
        this.activeStep = 1;
        this.renderStep();
      }
      this.startAnimation();
    }
  },

  startAnimation() {
    this.isPlaying = true;
    this.elements.iconPlay.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
    this.elements.labelPlay.textContent = 'Pause';

    this.animInterval = setInterval(() => {
      if (this.activeStep < this.k) {
        this.activeStep++;
        this.renderStep();
      } else {
        this.pauseAnimation();
      }
    }, this.animSpeedMs);
  },

  pauseAnimation() {
    this.isPlaying = false;
    clearInterval(this.animInterval);
    this.animInterval = null;
    this.elements.iconPlay.innerHTML = `<path d="M8 5v14l11-7z"/>`;
    this.elements.labelPlay.textContent = 'Animate';
  },

  // Canvas Rendering
  drawCanvas() {
    const canvas = this.elements.canvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#0a0d17';
    ctx.fillRect(0, 0, width, height);

    if (this.domainMode === 'finite') {
      this.drawFiniteFieldCanvas(ctx, width, height);
    } else {
      this.drawRealCurveCanvas(ctx, width, height);
    }
  },

  drawFiniteFieldCanvas(ctx, width, height) {
    const p = this.p;
    const padding = 45;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;
    const stepX = plotW / (p - 1);
    const stepY = plotH / (p - 1);

    const toCanvasX = (x) => padding + x * stepX;
    const toCanvasY = (y) => height - padding - y * stepY;

    // 1. Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 0; x < p; x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), padding);
      ctx.lineTo(toCanvasX(x), height - padding);
      ctx.stroke();
    }
    for (let y = 0; y < p; y++) {
      ctx.beginPath();
      ctx.moveTo(padding, toCanvasY(y));
      ctx.lineTo(width - padding, toCanvasY(y));
      ctx.stroke();
    }

    // 2. Axes & Tick Labels
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    for (let x = 0; x < p; x += 2) {
      ctx.fillText(`${x}`, toCanvasX(x), height - padding + 18);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y < p; y += 2) {
      ctx.fillText(`${y}`, padding - 10, toCanvasY(y) + 3);
    }

    // Axis titles
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x-coordinate (mod 17)', width / 2, height - 10);
    ctx.save();
    ctx.translate(16, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y-coordinate (mod 17)', 0, 0);
    ctx.restore();

    // 3. Draw all valid points on curve as subtle dots
    this.allPoints.forEach((pt) => {
      const cx = toCanvasX(pt[0]);
      const cy = toCanvasY(pt[1]);

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
    });

    // 4. Draw sequence traversal paths up to activeStep
    if (this.sequence.length > 1 && this.activeStep >= 2) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      for (let s = 1; s < this.activeStep; s++) {
        const p1 = this.sequence[s - 1].point;
        const p2 = this.sequence[s].point;
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(toCanvasX(p1[0]), toCanvasY(p1[1]));
          ctx.lineTo(toCanvasX(p2[0]), toCanvasY(p2[1]));
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    // 5. Highlight visited points in sequence
    for (let s = 0; s < this.activeStep; s++) {
      const item = this.sequence[s];
      if (!item.point) continue;
      const cx = toCanvasX(item.point[0]);
      const cy = toCanvasY(item.point[1]);

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.fill();

      // Multiplier label
      ctx.fillStyle = '#c7d2fe';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.mult}G`, cx, cy - 9);
    }

    // 6. Highlight Base Generator Point G
    const gX = toCanvasX(this.G[0]);
    const gY = toCanvasY(this.G[1]);
    ctx.beginPath();
    ctx.arc(gX, gY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 7. Highlight Active Step Point iG
    const activeData = this.sequence[this.activeStep - 1];
    if (activeData && activeData.point) {
      const actX = toCanvasX(activeData.point[0]);
      const actY = toCanvasY(activeData.point[1]);

      ctx.beginPath();
      ctx.arc(actX, actY, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 8. If on final step (or target k reached), crown with Public Key Gold Ring
    const targetData = this.sequence[this.k - 1];
    if (targetData && targetData.point) {
      const tarX = toCanvasX(targetData.point[0]);
      const tarY = toCanvasY(targetData.point[1]);

      ctx.beginPath();
      ctx.arc(tarX, tarY, 14, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Crown label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PUBLIC KEY Q = ${this.k}G`, tarX, tarY + 24);
    }
  },

  drawRealCurveCanvas(ctx, width, height) {
    // Coordinate mapping for real numbers
    const xMin = -2.5, xMax = 6.0;
    const yMin = -8.0, yMax = 8.0;

    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // 1. Grid & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    // Axes
    const zeroX = toCanvasX(0);
    const zeroY = toCanvasY(0);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, zeroY); ctx.lineTo(width, zeroY); // X axis
    ctx.moveTo(zeroX, 0); ctx.lineTo(zeroX, height); // Y axis
    ctx.stroke();

    // 2. Draw continuous curve y = ±sqrt(x^3 + 7)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#6366f1';
    ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
    ctx.shadowBlur = 8;

    const curveRoot = -Math.cbrt(7); // ~ -1.9129
    const stepDx = (xMax - curveRoot) / 300;

    // Top branch
    ctx.beginPath();
    let started = false;
    for (let x = curveRoot; x <= xMax; x += stepDx) {
      const yVal = Math.sqrt(Math.pow(x, 3) + 7);
      const cx = toCanvasX(x);
      const cy = toCanvasY(yVal);
      if (!started) { ctx.moveTo(cx, cy); started = true; }
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Bottom branch
    ctx.beginPath();
    started = false;
    for (let x = curveRoot; x <= xMax; x += stepDx) {
      const yVal = -Math.sqrt(Math.pow(x, 3) + 7);
      const cx = toCanvasX(x);
      const cy = toCanvasY(yVal);
      if (!started) { ctx.moveTo(cx, cy); started = true; }
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Draw tangent or secant lines for active step
    const stepData = this.sequence[this.activeStep - 1];
    if (stepData && stepData.resMeta) {
      const meta = stepData.resMeta;
      const m = meta.slope;
      const c = meta.intercept;

      // Draw chord/tangent line across visible domain
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      const lineX1 = xMin;
      const lineY1 = m * lineX1 + c;
      const lineX2 = xMax;
      const lineY2 = m * lineX2 + c;
      ctx.moveTo(toCanvasX(lineX1), toCanvasY(lineY1));
      ctx.lineTo(toCanvasX(lineX2), toCanvasY(lineY2));
      ctx.stroke();

      // Draw reflection line (vertical dashed)
      if (meta.RPrime && meta.R) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(meta.RPrime[0]), toCanvasY(meta.RPrime[1]));
        ctx.lineTo(toCanvasX(meta.R[0]), toCanvasY(meta.R[1]));
        ctx.stroke();
        ctx.setLineDash([]);

        // Intersection point R'
        ctx.beginPath();
        ctx.arc(toCanvasX(meta.RPrime[0]), toCanvasY(meta.RPrime[1]), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#f87171';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText("Intersection R'", toCanvasX(meta.RPrime[0]) + 8, toCanvasY(meta.RPrime[1]) - 6);
      }
    }

    // 4. Draw Base Point G
    const gX = toCanvasX(this.G[0]);
    const gY = toCanvasY(this.G[1]);
    ctx.beginPath();
    ctx.arc(gX, gY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.fillText('Base Point G', gX + 10, gY - 6);

    // 5. Draw Active Point
    if (stepData && stepData.point) {
      const actX = toCanvasX(stepData.point[0]);
      const actY = toCanvasY(stepData.point[1]);
      ctx.beginPath();
      ctx.arc(actX, actY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText(`${stepData.mult}G`, actX + 10, actY + 4);
    }
  },

  handleCanvasMouseMove(e) {
    if (this.domainMode !== 'finite') {
      this.elements.tooltip.style.display = 'none';
      return;
    }

    const rect = this.elements.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const p = this.p;
    const padding = 45;
    const plotW = rect.width - padding * 2;
    const plotH = rect.height - padding * 2;
    const stepX = plotW / (p - 1);
    const stepY = plotH / (p - 1);

    const toCanvasX = (x) => padding + x * stepX;
    const toCanvasY = (y) => rect.height - padding - y * stepY;

    // Check collision with any point
    let hovered = null;
    for (const pt of this.allPoints) {
      const cx = toCanvasX(pt[0]);
      const cy = toCanvasY(pt[1]);
      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist < 12) {
        hovered = pt;
        break;
      }
    }

    if (hovered) {
      const tooltip = this.elements.tooltip;
      tooltip.style.display = 'block';
      tooltip.style.left = `${mouseX + 15}px`;
      tooltip.style.top = `${mouseY - 15}px`;

      const ord = MathEC.computePointOrder(hovered, this.p);
      const isG = hovered[0] === this.G[0] && hovered[1] === this.G[1];
      tooltip.innerHTML = `
        <div><strong>Point (${hovered[0]}, ${hovered[1]})</strong></div>
        <div>Order: ${ord}</div>
        ${isG ? '<div style="color: #60a5fa;">★ Generator Base Point G</div>' : ''}
      `;
    } else {
      this.elements.tooltip.style.display = 'none';
    }
  }
};

// ==========================================
// 3. SECTION 2: DOUBLE-AND-ADD CONTROLLER
// ==========================================

const DoubleAndAddController = {
  k: 42,
  p: 17,
  G: [1, 5],
  activeStepIdx: 0,
  algoData: null,

  elements: {},

  init() {
    this.cacheDom();
    this.bindEvents();
    this.runAlgorithm();
  },

  cacheDom() {
    this.elements = {
      presetSelect: document.getElementById('large-k-preset'),
      customWrapper: document.getElementById('custom-k-wrapper'),
      customInput: document.getElementById('custom-k-input'),
      btnReset: document.getElementById('btn-algo-reset'),
      btnStep: document.getElementById('btn-algo-step'),
      btnAutorun: document.getElementById('btn-algo-autorun'),
      binDecLabel: document.getElementById('bin-decimal-k'),
      binLengthTag: document.getElementById('bin-length-tag'),
      bitsStrip: document.getElementById('binary-bits-strip'),
      statNaive: document.getElementById('stat-naive-ops'),
      statFast: document.getElementById('stat-fast-ops'),
      statBreakdown: document.getElementById('stat-fast-breakdown'),
      resultPill: document.getElementById('algo-result-pill'),
      traceTbody: document.getElementById('algo-trace-tbody')
    };
  },

  bindEvents() {
    this.elements.presetSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        this.elements.customWrapper.style.display = 'flex';
      } else {
        this.elements.customWrapper.style.display = 'none';
        this.k = parseInt(e.target.value, 10);
        this.runAlgorithm();
      }
    });

    this.elements.customInput.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0) {
        this.k = val;
        this.runAlgorithm();
      }
    });

    this.elements.btnReset.addEventListener('click', () => {
      this.activeStepIdx = 0;
      this.renderCurrentState();
    });

    this.elements.btnStep.addEventListener('click', () => {
      if (this.activeStepIdx < this.algoData.steps.length) {
        this.activeStepIdx++;
        this.renderCurrentState();
      }
    });

    this.elements.btnAutorun.addEventListener('click', () => {
      this.activeStepIdx = this.algoData.steps.length;
      this.renderCurrentState();
    });
  },

  runAlgorithm() {
    this.algoData = MathEC.doubleAndAdd(this.G, this.k, this.p);
    this.activeStepIdx = this.algoData.steps.length; // Default to finished state

    // Binary info
    this.elements.binDecLabel.textContent = this.k;
    this.elements.binLengthTag.textContent = `${this.algoData.binaryStr.length} bits`;

    // Complexity comparison stats
    const naiveOps = this.k - 1;
    this.elements.statNaive.textContent = `${naiveOps} additions`;
    this.elements.statFast.textContent = `${this.algoData.totalOps} operations`;
    this.elements.statBreakdown.textContent = `${this.algoData.totalDoublings} Doublings + ${this.algoData.totalAdditions} Additions = ${this.algoData.totalOps} total group operations.`;

    // Render binary strip
    this.elements.bitsStrip.innerHTML = '';
    for (let i = 0; i < this.algoData.binaryStr.length; i++) {
      const chip = document.createElement('div');
      chip.className = 'bit-chip';
      chip.id = `bit-chip-${i}`;
      const bitVal = this.algoData.binaryStr[i];
      const bitIdx = this.algoData.binaryStr.length - 1 - i;
      chip.innerHTML = `
        <span class="bit-val">${bitVal}</span>
        <span class="bit-idx">2^${bitIdx}</span>
      `;
      this.elements.bitsStrip.appendChild(chip);
    }

    this.renderCurrentState();
  },

  renderCurrentState() {
    const steps = this.algoData.steps;

    // Update binary strip chip styles
    for (let i = 0; i < steps.length; i++) {
      const chip = document.getElementById(`bit-chip-${i}`);
      if (!chip) continue;
      chip.classList.remove('bit-active', 'bit-done');
      if (i < this.activeStepIdx) {
        chip.classList.add('bit-done');
      }
      if (i === this.activeStepIdx - 1) {
        chip.classList.add('bit-active');
      }
    }

    // Result pill
    const currentStep = this.activeStepIdx > 0 ? steps[this.activeStepIdx - 1] : null;
    const finalPt = currentStep && currentStep.finalR ? `(${currentStep.finalR[0]}, ${currentStep.finalR[1]})` : '𝒪';
    this.elements.resultPill.textContent = `Accumulator R = ${finalPt} | Step ${this.activeStepIdx} of ${steps.length}`;

    // Trace Table
    this.elements.traceTbody.innerHTML = '';
    for (let i = 0; i < this.activeStepIdx; i++) {
      const s = steps[i];
      const tr = document.createElement('tr');
      if (i === this.activeStepIdx - 1) tr.classList.add('active-step-row');

      let opBadge = '';
      let mathAction = '';

      if (s.stepIdx === 1) {
        opBadge = `<span class="operation-badge badge-add">Initial Load</span>`;
        mathAction = `R = 𝒪 + G = (${s.finalR[0]}, ${s.finalR[1]})`;
      } else if (s.added) {
        opBadge = `<span class="operation-badge badge-both">Double & Add</span>`;
        mathAction = `Double: 2R = (${s.afterDouble[0]}, ${s.afterDouble[1]}); Add: + G = (${s.finalR[0]}, ${s.finalR[1]})`;
      } else {
        opBadge = `<span class="operation-badge badge-double">Double Only</span>`;
        mathAction = `Double: R ← 2R = (${s.finalR[0]}, ${s.finalR[1]})`;
      }

      tr.innerHTML = `
        <td>Step ${s.stepIdx}</td>
        <td>Bit ${s.bitIdx}</td>
        <td><strong>${s.bit}</strong></td>
        <td>${opBadge}</td>
        <td>${mathAction}</td>
        <td><strong>${s.finalR ? `(${s.finalR[0]}, ${s.finalR[1]})` : '𝒪'}</strong></td>
      `;
      this.elements.traceTbody.appendChild(tr);
    }
  }
};

// ==========================================
// 4. SECTION 3: STATISTICAL EXPLORATION
// ==========================================

const StatsController = {
  p: 17,
  G: [1, 5],
  sampleN: 9,
  samplePoints: [],

  elements: {},

  init() {
    this.cacheDom();
    this.bindEvents();
    this.setupField();
  },

  cacheDom() {
    this.elements = {
      fieldSelect: document.getElementById('stats-field-select'),
      baseSelect: document.getElementById('stats-base-select'),
      rangeInput: document.getElementById('stats-sample-range'),
      rangeBadge: document.getElementById('stats-sample-count-badge'),
      btnRecompute: document.getElementById('btn-recompute-stats'),

      kpiCount: document.getElementById('kpi-sample-count'),
      kpiSubgroup: document.getElementById('kpi-subgroup-info'),
      kpiEntropy: document.getElementById('kpi-entropy'),
      kpiCorrelation: document.getElementById('kpi-correlation'),
      kpiHamming: document.getElementById('kpi-hamming'),
      kpiChisq: document.getElementById('kpi-chisq'),

      canvasScatter: document.getElementById('chart-scatter-canvas'),
      canvasHist: document.getElementById('chart-hist-canvas'),
      canvasCorr: document.getElementById('chart-corr-canvas'),
      canvasAvalanche: document.getElementById('chart-avalanche-canvas')
    };
  },

  bindEvents() {
    this.elements.fieldSelect.addEventListener('change', (e) => {
      this.p = parseInt(e.target.value, 10);
      this.setupField();
    });

    this.elements.baseSelect.addEventListener('change', (e) => {
      const parts = e.target.value.split(',').map(Number);
      this.G = parts;
      this.recompute();
    });

    this.elements.rangeInput.addEventListener('input', (e) => {
      this.sampleN = parseInt(e.target.value, 10);
      this.elements.rangeBadge.textContent = `N = ${this.sampleN}`;
    });

    this.elements.rangeInput.addEventListener('change', () => {
      this.recompute();
    });

    this.elements.btnRecompute.addEventListener('click', () => {
      this.recompute();
    });

    window.addEventListener('resize', () => {
      this.drawAllCharts();
    });
  },

  setupField() {
    const allPts = MathEC.findAllPoints(this.p, 0, 7);

    // Populate base select
    this.elements.baseSelect.innerHTML = '';
    allPts.slice(0, 15).forEach((pt) => {
      const opt = document.createElement('option');
      opt.value = `${pt[0]},${pt[1]}`;
      const ord = MathEC.computePointOrder(pt, this.p);
      opt.textContent = `G = (${pt[0]}, ${pt[1]}) [Order ${ord}]`;
      if (pt[0] === 1 && (pt[1] === 5 || pt[1] === 28 || pt[1] === 120)) {
        opt.selected = true;
      }
      this.elements.baseSelect.appendChild(opt);
    });

    const selectedParts = this.elements.baseSelect.value.split(',').map(Number);
    this.G = selectedParts;

    const ord = MathEC.computePointOrder(this.G, this.p) || allPts.length;
    this.elements.rangeInput.max = ord;
    this.elements.rangeInput.min = Math.min(5, ord);
    this.sampleN = ord;
    this.elements.rangeInput.value = ord;
    this.elements.rangeBadge.textContent = `N = ${ord}`;

    this.recompute();
  },

  recompute() {
    // Generate sample sequence kG for k in [1, sampleN]
    this.samplePoints = [];
    let cur = this.G;

    for (let k = 1; k <= this.sampleN; k++) {
      if (!cur) break;
      this.samplePoints.push({ k, x: cur[0], y: cur[1] });
      const nextRes = MathEC.addPointsFp(cur, this.G, this.p);
      cur = nextRes.R;
    }

    this.computeStatistics();
    this.drawAllCharts();
  },

  computeStatistics() {
    const pts = this.samplePoints;
    const n = pts.length;
    if (n === 0) return;

    // 1. KPI Count & Subgroup
    const ord = MathEC.computePointOrder(this.G, this.p) || n;
    this.elements.kpiCount.textContent = `${n} points`;
    this.elements.kpiSubgroup.textContent = `Subgroup Order: ${ord}`;

    // 2. Coordinate Entropy
    const xCounts = {};
    pts.forEach((p) => {
      xCounts[p.x] = (xCounts[p.x] || 0) + 1;
    });
    let entropy = 0;
    Object.values(xCounts).forEach((c) => {
      const prob = c / n;
      entropy -= prob * Math.log2(prob);
    });
    this.elements.kpiEntropy.textContent = `${entropy.toFixed(2)} bits`;

    // 3. Pearson Correlation r(k, x)
    const avgK = pts.reduce((sum, p) => sum + p.k, 0) / n;
    const avgX = pts.reduce((sum, p) => sum + p.x, 0) / n;
    let cov = 0, varK = 0, varX = 0;
    pts.forEach((p) => {
      const dk = p.k - avgK;
      const dx = p.x - avgX;
      cov += dk * dx;
      varK += dk * dk;
      varX += dx * dx;
    });
    const r = varK > 0 && varX > 0 ? cov / Math.sqrt(varK * varX) : 0;
    this.elements.kpiCorrelation.textContent = r.toFixed(3);

    // 4. Bit Hamming Weight
    let totalBits = 0;
    let onesBits = 0;
    const bitWidth = Math.ceil(Math.log2(this.p));
    pts.forEach((p) => {
      const xBin = p.x.toString(2).padStart(bitWidth, '0');
      const yBin = p.y.toString(2).padStart(bitWidth, '0');
      for (const b of xBin + yBin) {
        totalBits++;
        if (b === '1') onesBits++;
      }
    });
    const hammingPct = totalBits > 0 ? (onesBits / totalBits) * 100 : 50;
    this.elements.kpiHamming.textContent = `${hammingPct.toFixed(1)}%`;

    // 5. Chi-square test for uniformity of x
    const numBuckets = Math.min(this.p, 10);
    const bucketCounts = new Array(numBuckets).fill(0);
    pts.forEach((p) => {
      const bIdx = Math.floor((p.x / this.p) * numBuckets);
      bucketCounts[Math.min(bIdx, numBuckets - 1)]++;
    });
    const expected = n / numBuckets;
    let chisq = 0;
    bucketCounts.forEach((obs) => {
      chisq += Math.pow(obs - expected, 2) / expected;
    });
    // Heuristic p-value approximation for Chi-sq (df = numBuckets - 1)
    const pVal = Math.max(0.01, Math.min(0.99, Math.exp(-chisq / (2 * (numBuckets - 1)))));
    this.elements.kpiChisq.textContent = `p ≈ ${pVal.toFixed(3)}`;
  },

  drawAllCharts() {
    this.drawScatterChart();
    this.drawHistogramChart();
    this.drawCorrelationChart();
    this.drawAvalancheChart();
  },

  setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0d17';
    ctx.fillRect(0, 0, width, height);
    return { ctx, width, height };
  },

  // Chart 1: 2D Spatial Scatter
  drawScatterChart() {
    const { ctx, width, height } = this.setupCanvas(this.elements.canvasScatter);
    const pad = 35;
    const p = this.p;

    const toX = (x) => pad + (x / (p - 1)) * (width - pad * 2);
    const toY = (y) => height - pad - (y / (p - 1)) * (height - pad * 2);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('0', pad - 12, height - pad + 3);
    ctx.fillText(`${p - 1}`, pad - 18, pad + 10);
    ctx.fillText(`${p - 1}`, width - pad, height - pad + 15);

    // Points
    this.samplePoints.forEach((pt, i) => {
      const cx = toX(pt.x);
      const cy = toY(pt.y);

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#3b82f6' : '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  },

  // Chart 2: Histogram of Coordinates
  drawHistogramChart() {
    const { ctx, width, height } = this.setupCanvas(this.elements.canvasHist);
    const pad = 40;
    const n = this.samplePoints.length;
    if (n === 0) return;

    // Frequencies of x
    const xFreq = {};
    for (let i = 0; i < this.p; i++) xFreq[i] = 0;
    this.samplePoints.forEach((p) => { xFreq[p.x] = (xFreq[p.x] || 0) + 1; });

    const maxFreq = Math.max(...Object.values(xFreq), 2);
    const plotW = width - pad * 2;
    const plotH = height - pad * 2;
    const barW = Math.max(2, plotW / this.p - 2);

    // Baseline axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(pad, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.stroke();

    // Bars
    for (let x = 0; x < this.p; x++) {
      const count = xFreq[x];
      const barH = (count / maxFreq) * plotH;
      const bx = pad + (x / this.p) * plotW;
      const by = height - pad - barH;

      ctx.fillStyle = count > 0 ? '#6366f1' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(bx, by, barW, barH);
    }

    // Uniform expected line
    const avgCount = n / this.p;
    const avgY = height - pad - (avgCount / maxFreq) * plotH;
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad, avgY);
    ctx.lineTo(width - pad, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('Uniform baseline', width - pad - 95, avgY - 5);
  },

  // Chart 3: Correlation k vs x
  drawCorrelationChart() {
    const { ctx, width, height } = this.setupCanvas(this.elements.canvasCorr);
    const pad = 40;
    const n = this.samplePoints.length;
    if (n === 0) return;

    const toX = (k) => pad + ((k - 1) / Math.max(1, n - 1)) * (width - pad * 2);
    const toY = (x) => height - pad - (x / (this.p - 1)) * (height - pad * 2);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

    // Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('k = 1', pad, height - pad + 15);
    ctx.fillText(`k = ${n}`, width - pad - 20, height - pad + 15);
    ctx.fillText('x = 0', pad - 30, height - pad);
    ctx.fillText(`x = ${this.p - 1}`, pad - 35, pad + 10);

    // Scatter points
    this.samplePoints.forEach((p) => {
      const cx = toX(p.k);
      const cy = toY(p.x);

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  },

  // Chart 4: Avalanche / Consecutive Jump
  drawAvalancheChart() {
    const { ctx, width, height } = this.setupCanvas(this.elements.canvasAvalanche);
    const pad = 40;
    const n = this.samplePoints.length;
    if (n < 2) return;

    const deltas = [];
    for (let i = 1; i < n; i++) {
      deltas.push(Math.abs(this.samplePoints[i].x - this.samplePoints[i - 1].x));
    }

    const maxDelta = this.p;
    const plotW = width - pad * 2;
    const plotH = height - pad * 2;
    const toX = (i) => pad + (i / (deltas.length - 1)) * plotW;
    const toY = (d) => height - pad - (d / maxDelta) * plotH;

    // Grid baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(pad, pad, plotW, plotH);

    // Line plot of deltas
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    deltas.forEach((d, i) => {
      const cx = toX(i);
      const cy = toY(d);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // Dots
    deltas.forEach((d, i) => {
      const cx = toX(i);
      const cy = toY(d);
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fb7185';
      ctx.fill();
    });

    // Average delta line
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const avgY = toY(avgDelta);
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad, avgY);
    ctx.lineTo(width - pad, avgY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`Avg Jump: |Δx| = ${avgDelta.toFixed(1)}`, width - pad - 120, avgY - 5);
  }
};

// ==========================================
// 5. APPLICATION INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all controllers
  PointMultController.init();
  DoubleAndAddController.init();
  StatsController.init();
});
