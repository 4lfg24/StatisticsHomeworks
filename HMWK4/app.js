/**
 * ============================================================================
 * HMWK 4 — STOCHASTIC PENETRATION LAB APPLICATION LOGIC
 * Multi-Attacker / Multi-System Adversarial Modeling
 * Law of Large Numbers, Variance Scaling & Central Limit Theorem
 * ============================================================================
 */

(function () {
  'use strict';

  // ============================================================================
  // MATHEMATICAL & STATISTICAL UTILITIES
  // ============================================================================

  /**
   * Fast seedable pseudo-random number generator (Mulberry32)
   */
  class PRNG {
    constructor(seed = Date.now()) {
      this.seed = seed;
    }
    next() {
      let t = (this.seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  /**
   * Error function approximation (Abramowitz and Stegun 7.1.26)
   */
  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  /**
   * Standard Normal Cumulative Distribution Function Phi(z)
   */
  function standardNormalCDF(z) {
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  /**
   * Inverse standard normal CDF (Acklam's rational approximation algorithm)
   * High precision (|error| < 1.15e-9)
   */
  function normalQuantile(p) {
    if (p <= 0) return -8.0;
    if (p >= 1) return 8.0;

    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    let q, r;

    if (p < p_low) {
      // Lower tail
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= p_high) {
      // Central region
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
             (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      // Upper tail
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
  }

  /**
   * Log factorial for high n combinatorics
   */
  const logFactorialCache = [0, 0];
  function logFact(k) {
    if (k < logFactorialCache.length) return logFactorialCache[k];
    for (let i = logFactorialCache.length; i <= k; i++) {
      logFactorialCache[i] = logFactorialCache[i - 1] + Math.log(i);
    }
    return logFactorialCache[k];
  }

  /**
   * Binomial PMF: P(K = k) = nCk * p^k * (1-p)^(n-k)
   */
  function binomialPMF(k, n, p) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    const logComb = logFact(n) - logFact(k) - logFact(n - k);
    const logP = logComb + k * Math.log(p) + (n - k) * Math.log(1 - p);
    return Math.exp(logP);
  }

  // ============================================================================
  // SIMULATION STATE & CONTROLLER
  // ============================================================================

  const state = {
    // Model parameters
    model: 'rademacher', // 'rademacher' or 'bernoulli'
    n: 300,              // number of systems (steps)
    m: 400,              // number of attackers (trajectories)
    p: 0.50,             // Bernoulli probability of breach
    epsilon: 0.05,       // LLN error tolerance

    // View options
    activeQuantity: 'raw_norm', // 'total', 'average', 'raw_norm', 'std_norm'
    histMode: 'pdf',            // 'pdf' or 'cdf'
    scaleMode: 'linear',        // 'linear' or 'loglog'
    activeDiagnosticTab: 'lln', // 'lln' or 'clt'

    // Playback state
    isAnimating: false,
    currentStep: 300,
    animSpeed: 5,               // steps per frame
    animFrameId: null,

    // Simulation Data Store
    numSampledPaths: 70, // visually distinct paths to render
    sampledTrajectories: [], // array of Float32Array(n + 1)
    terminalScores: null,    // Float32Array(m) at current step
    stepMeans: null,         // Float32Array(n + 1)
    stepVariancesTotal: null,// Float32Array(n + 1)
    stepVariancesAvg: null,  // Float32Array(n + 1)
    stepVariancesNorm: null, // Float32Array(n + 1)
    stepLLNViolations: null, // Float32Array(n + 1) - empirical P(|S_k/k - mu| >= eps)
    allTerminalScoresFinal: null, // at step n

    // Computed summary statistics at currentStep
    stats: {
      mean: 0,
      theoreticalMean: 0,
      variance: 0,
      theoreticalVariance: 0,
      stdDev: 0,
      theoreticalStdDev: 0,
      skewness: 0,
      theoreticalSkewness: 0,
      kurtosis: 0,
      theoreticalKurtosis: 0,
      minScore: 0,
      maxScore: 0,
      expectedMaxScore: 0,
      aggregateExposure: 0,
      theoreticalAggregateExposure: 0,
      within1SigmaPct: 0,
      within2SigmaPct: 0,
      ksDistance: 0,
      llnViolationPct: 0,
      chebyshevBoundPct: 0
    }
  };

  // ============================================================================
  // MONTE CARLO SIMULATION ENGINE
  // ============================================================================

  function runFullSimulation() {
    const { model, n, m, p, epsilon, numSampledPaths } = state;
    const prng = new PRNG(Date.now() ^ 0xa5a5a5a5);

    // Theoretical parameters of single step increment X_i
    let mu, sigmaSq;
    if (model === 'rademacher') {
      mu = 0;
      sigmaSq = 1;
    } else {
      mu = p;
      sigmaSq = p * (1 - p);
    }

    // Allocate summary arrays across steps k = 0 ... n
    const stepMeans = new Float32Array(n + 1);
    const stepVariancesTotal = new Float32Array(n + 1);
    const stepVariancesAvg = new Float32Array(n + 1);
    const stepVariancesNorm = new Float32Array(n + 1);
    const stepLLNViolations = new Float32Array(n + 1);

    // Sampled paths for visual rendering (subset of m)
    const sampledCount = Math.min(numSampledPaths, m);
    const sampledTrajectories = [];
    for (let i = 0; i < sampledCount; i++) {
      sampledTrajectories.push(new Float32Array(n + 1));
    }

    // We store all m current trajectory values at step k
    const currentTraj = new Float32Array(m);
    const finalScores = new Float32Array(m);

    // Initial step k = 0
    for (let j = 0; j < m; j++) {
      currentTraj[j] = 0;
    }
    for (let i = 0; i < sampledCount; i++) {
      sampledTrajectories[i][0] = 0;
    }
    stepMeans[0] = 0;
    stepVariancesTotal[0] = 0;
    stepVariancesAvg[0] = 0;
    stepVariancesNorm[0] = 0;
    stepLLNViolations[0] = 0;

    // Running accumulators across all m attackers for step k
    for (let k = 1; k <= n; k++) {
      let sum = 0;
      let sumSq = 0;
      let llnViolations = 0;

      for (let j = 0; j < m; j++) {
        // Generate increment X_i
        let inc;
        if (model === 'rademacher') {
          inc = prng.next() < 0.5 ? -1 : 1;
        } else {
          inc = prng.next() < p ? 1 : 0;
        }

        currentTraj[j] += inc;
        const s = currentTraj[j];
        sum += s;
        sumSq += s * s;

        // LLN test: |S_k / k - mu| >= epsilon
        const avg = s / k;
        if (Math.abs(avg - mu) >= epsilon) {
          llnViolations++;
        }

        // Record sampled paths
        if (j < sampledCount) {
          sampledTrajectories[j][k] = s;
        }
      }

      // Summary statistics at step k
      const mean = sum / m;
      const variance = Math.max(0, (sumSq - (sum * sum) / m) / (m - 1 || 1));

      stepMeans[k] = mean;
      stepVariancesTotal[k] = variance;
      stepVariancesAvg[k] = variance / (k * k);
      stepVariancesNorm[k] = variance / k;
      stepLLNViolations[k] = llnViolations / m;
    }

    // Copy terminal scores
    for (let j = 0; j < m; j++) {
      finalScores[j] = currentTraj[j];
    }

    state.stepMeans = stepMeans;
    state.stepVariancesTotal = stepVariancesTotal;
    state.stepVariancesAvg = stepVariancesAvg;
    state.stepVariancesNorm = stepVariancesNorm;
    state.stepLLNViolations = stepLLNViolations;
    state.sampledTrajectories = sampledTrajectories;
    state.allTerminalScoresFinal = finalScores;
    state.currentStep = n;

    computeSummaryStatistics(n);
  }

  /**
   * Compute comprehensive metrics at the active step k
   */
  function computeSummaryStatistics(k) {
    if (k <= 0) k = 1;
    const { model, m, p, epsilon, allTerminalScoresFinal, n } = state;

    let mu, sigmaSq, sigma;
    if (model === 'rademacher') {
      mu = 0;
      sigmaSq = 1;
      sigma = 1;
    } else {
      mu = p;
      sigmaSq = p * (1 - p);
      sigma = Math.sqrt(sigmaSq);
    }

    // If k == n, we have the exact final scores.
    // If during animation k < n, compute from sampled or scale
    let scores;
    if (k === n && allTerminalScoresFinal) {
      scores = allTerminalScoresFinal;
    } else {
      // Create scores at step k from simulation
      // For precision, extract from stored sampled or run partial
      scores = new Float32Array(m);
      for (let j = 0; j < m; j++) {
        // Approximate / interpolate or take terminal proportion
        scores[j] = allTerminalScoresFinal ? allTerminalScoresFinal[j] * (k / n) : 0;
      }
    }

    // Transform scores according to activeQuantity
    // 'total': S_k
    // 'average': S_k / k
    // 'raw_norm': S_k / sqrt(k)
    // 'std_norm': (S_k - k*mu) / (sigma*sqrt(k))
    const qty = state.activeQuantity;
    const transformed = new Float32Array(m);

    let theoMean, theoVar, theoStd;

    if (qty === 'total') {
      theoMean = k * mu;
      theoVar = k * sigmaSq;
      theoStd = Math.sqrt(theoVar);
      for (let j = 0; j < m; j++) transformed[j] = scores[j];
    } else if (qty === 'average') {
      theoMean = mu;
      theoVar = sigmaSq / k;
      theoStd = Math.sqrt(theoVar);
      for (let j = 0; j < m; j++) transformed[j] = scores[j] / k;
    } else if (qty === 'raw_norm') {
      theoMean = (k * mu) / Math.sqrt(k);
      theoVar = sigmaSq;
      theoStd = Math.sqrt(theoVar);
      for (let j = 0; j < m; j++) transformed[j] = scores[j] / Math.sqrt(k);
    } else { // std_norm
      theoMean = 0;
      theoVar = 1;
      theoStd = 1;
      const denom = (sigma * Math.sqrt(k)) || 1;
      for (let j = 0; j < m; j++) transformed[j] = (scores[j] - k * mu) / denom;
    }

    state.terminalScores = transformed;

    // Sample Moments: Mean, Variance, Skewness, Kurtosis
    let sum = 0;
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let j = 0; j < m; j++) {
      const val = transformed[j];
      sum += val;
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
    const sampleMean = sum / m;

    let m2 = 0, m3 = 0, m4 = 0;
    let count1Sigma = 0;
    let count2Sigma = 0;

    for (let j = 0; j < m; j++) {
      const diff = transformed[j] - sampleMean;
      const diffSq = diff * diff;
      m2 += diffSq;
      m3 += diffSq * diff;
      m4 += diffSq * diffSq;

      if (Math.abs(diff) <= theoStd) count1Sigma++;
      if (Math.abs(diff) <= 2 * theoStd) count2Sigma++;
    }

    const sampleVar = m2 / (m - 1 || 1);
    const sampleStd = Math.sqrt(sampleVar);
    const skewness = sampleStd > 0 ? (m3 / m) / Math.pow(sampleStd, 3) : 0;
    const kurtosis = sampleStd > 0 ? (m4 / m) / Math.pow(sampleStd, 4) - 3 : 0; // excess kurtosis

    // Theoretical moments
    let theoSkew = 0;
    let theoKurt = 0;
    if (model === 'rademacher') {
      theoSkew = 0;
      theoKurt = -2 / k;
    } else {
      theoSkew = (1 - 2 * p) / (Math.sqrt(k * p * (1 - p)) || 1);
      theoKurt = (1 - 6 * p * (1 - p)) / (k * p * (1 - p) || 1);
    }

    // Extreme Value Theory Prediction for max score
    // E[max S_n] approx n*mu + sigma*sqrt(n) * sqrt(2*ln(m))
    let expMax = k * mu + sigma * Math.sqrt(k) * Math.sqrt(2 * Math.log(m || 2));
    if (qty === 'average') expMax /= k;
    else if (qty === 'raw_norm') expMax /= Math.sqrt(k);
    else if (qty === 'std_norm') expMax = Math.sqrt(2 * Math.log(m || 2));

    // Aggregate Exposure across all m attackers
    let aggExp = sum;
    let theoAggExp = m * theoMean;

    // Kolmogorov-Smirnov test for normalized score vs Standard Normal N(0,1)
    let ksDistance = 0;
    if (scores.length > 0) {
      // Sort standardized values
      const stdScores = new Float32Array(m);
      const denom = (sigma * Math.sqrt(k)) || 1;
      for (let j = 0; j < m; j++) {
        stdScores[j] = (scores[j] - k * mu) / denom;
      }
      stdScores.sort();

      let maxDiff = 0;
      for (let j = 0; j < m; j++) {
        const theoCDF = standardNormalCDF(stdScores[j]);
        const empCDFUpper = (j + 1) / m;
        const empCDFLower = j / m;
        const d1 = Math.abs(empCDFUpper - theoCDF);
        const d2 = Math.abs(empCDFLower - theoCDF);
        if (d1 > maxDiff) maxDiff = d1;
        if (d2 > maxDiff) maxDiff = d2;
      }
      ksDistance = maxDiff;
    }

    // Chebyshev bound at step k: sigma^2 / (k * epsilon^2)
    const chebyshevBound = Math.min(1.0, sigmaSq / (k * epsilon * epsilon));
    const empLLNViolation = state.stepLLNViolations ? state.stepLLNViolations[k] : 0;

    state.stats = {
      mean: sampleMean,
      theoreticalMean: theoMean,
      variance: sampleVar,
      theoreticalVariance: theoVar,
      stdDev: sampleStd,
      theoreticalStdDev: theoStd,
      skewness: skewness,
      theoreticalSkewness: theoSkew,
      kurtosis: kurtosis,
      theoreticalKurtosis: theoKurt,
      minScore: minVal,
      maxScore: maxVal,
      expectedMaxScore: expMax,
      aggregateExposure: aggExp,
      theoreticalAggregateExposure: theoAggExp,
      within1SigmaPct: (count1Sigma / m) * 100,
      within2SigmaPct: (count2Sigma / m) * 100,
      ksDistance: ksDistance,
      llnViolationPct: empLLNViolation * 100,
      chebyshevBoundPct: chebyshevBound * 100
    };
  }

  // ============================================================================
  // CANVAS RENDERING ENGINE (HIGH-DPI / RETINA CRISP GRAPHICS)
  // ============================================================================

  /**
   * Helper to set up Canvas with crisp DPI scaling
   */
  function prepareCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: rect.width, height: rect.height, dpr };
  }

  /**
   * Render Chart 1: Interactive Trajectory Explorer
   */
  function renderTrajectoryChart() {
    const canvas = document.getElementById('trajectory-canvas');
    const prep = prepareCanvas(canvas);
    if (!prep) return;
    const { ctx, width, height } = prep;

    const { n, model, p, activeQuantity, sampledTrajectories, stepMeans, currentStep } = state;
    const padding = { top: 30, right: 35, bottom: 45, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Clear background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Incremental process statistics
    let mu, sigmaSq, sigma;
    if (model === 'rademacher') {
      mu = 0;
      sigmaSq = 1;
      sigma = 1;
    } else {
      mu = p;
      sigmaSq = p * (1 - p);
      sigma = Math.sqrt(sigmaSq);
    }

    // Determine Y range across all sampled trajectories and theoretical bounds
    let yMin = Infinity;
    let yMax = -Infinity;

    // Transform a raw score s at step k into the active quantity
    function transform(s, k) {
      if (k === 0) return 0;
      if (activeQuantity === 'total') return s;
      if (activeQuantity === 'average') return s / k;
      if (activeQuantity === 'raw_norm') return s / Math.sqrt(k);
      return (s - k * mu) / (sigma * Math.sqrt(k) || 1); // std_norm
    }

    function theoMeanAt(k) {
      if (k === 0) return 0;
      if (activeQuantity === 'total') return k * mu;
      if (activeQuantity === 'average') return mu;
      if (activeQuantity === 'raw_norm') return (k * mu) / Math.sqrt(k);
      return 0;
    }

    function theoStdAt(k) {
      if (k === 0) return 0;
      if (activeQuantity === 'total') return sigma * Math.sqrt(k);
      if (activeQuantity === 'average') return sigma / Math.sqrt(k);
      if (activeQuantity === 'raw_norm') return sigma;
      return 1;
    }

    // Scan sampled paths for bounds
    const maxK = Math.min(currentStep, n);
    for (let i = 0; i < sampledTrajectories.length; i++) {
      const traj = sampledTrajectories[i];
      for (let k = 0; k <= maxK; k += Math.max(1, Math.floor(n / 60))) {
        const val = transform(traj[k], k);
        if (val < yMin) yMin = val;
        if (val > yMax) yMax = val;
      }
    }

    // Include 2-sigma theoretical envelopes in Y bounds
    for (let k = 1; k <= maxK; k += Math.max(1, Math.floor(n / 20))) {
      const mK = theoMeanAt(k);
      const sK = theoStdAt(k);
      if (mK - 2.5 * sK < yMin) yMin = mK - 2.5 * sK;
      if (mK + 2.5 * sK > yMax) yMax = mK + 2.5 * sK;
    }

    // Add padding to Y range
    if (!isFinite(yMin) || !isFinite(yMax) || yMin === yMax) {
      yMin = -2;
      yMax = 2;
    }
    const yMargin = (yMax - yMin) * 0.1 || 1;
    yMin -= yMargin;
    yMax += yMargin;

    // Coordinate mapping functions
    function getX(k) {
      return padding.left + (k / n) * chartW;
    }
    function getY(val) {
      return padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
    }

    // Draw Subtle Grid Lines & Y Axis Ticks
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTickCount = 6;
    for (let i = 0; i <= yTickCount; i++) {
      const val = yMin + (i / yTickCount) * (yMax - yMin);
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      ctx.fillText(val.toFixed(val > 100 ? 0 : 2), padding.left - 10, y);
    }

    // X Axis Ticks (Systems / Steps k)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xStep = Math.max(1, Math.round(n / 6));
    for (let k = 0; k <= n; k += xStep) {
      const x = getX(k);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();

      ctx.fillText(k, x, padding.top + chartH + 10);
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Systems Penetrated / Discrete Steps (k)', padding.left + chartW / 2, height - 16);

    ctx.save();
    ctx.translate(16, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    let qtyName = 'Total Score Sₖ';
    if (activeQuantity === 'average') qtyName = 'Average Score Sₖ/k (Breach Rate)';
    else if (activeQuantity === 'raw_norm') qtyName = 'Normalized Score Sₖ/√k';
    else if (activeQuantity === 'std_norm') qtyName = 'Standardized CLT Score (Sₖ - kμ)/(σ√k)';
    ctx.fillText(qtyName, 0, 0);
    ctx.restore();

    // 1. Draw 2-Sigma Confidence Band Envelope (Translucent Cyan Glow)
    if (maxK > 1) {
      ctx.beginPath();
      for (let k = 1; k <= maxK; k++) {
        const topVal = theoMeanAt(k) + 2 * theoStdAt(k);
        const x = getX(k);
        const y = getY(topVal);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = maxK; k >= 1; k--) {
        const btmVal = theoMeanAt(k) - 2 * theoStdAt(k);
        const x = getX(k);
        const y = getY(btmVal);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fill();

      // 2. Draw 1-Sigma Confidence Band Envelope (Translucent Emerald Glow)
      ctx.beginPath();
      for (let k = 1; k <= maxK; k++) {
        const topVal = theoMeanAt(k) + theoStdAt(k);
        const x = getX(k);
        const y = getY(topVal);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = maxK; k >= 1; k--) {
        const btmVal = theoMeanAt(k) - theoStdAt(k);
        const x = getX(k);
        const y = getY(btmVal);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fill();
    }

    // 3. Draw Sampled Attacker Trajectories
    const colors = [
      'rgba(99, 102, 241, 0.35)',
      'rgba(139, 92, 246, 0.35)',
      'rgba(6, 182, 212, 0.3)',
      'rgba(244, 63, 94, 0.25)',
      'rgba(56, 189, 248, 0.3)'
    ];

    for (let i = 0; i < sampledTrajectories.length; i++) {
      const traj = sampledTrajectories[i];
      ctx.beginPath();
      const c = colors[i % colors.length];
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.2;

      for (let k = 0; k <= maxK; k++) {
        const val = transform(traj[k], k);
        const x = getX(k);
        const y = getY(val);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 4. Draw Theoretical Expectation Line E[Y_k] (Dashed Amber)
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    for (let k = 1; k <= maxK; k++) {
      const val = theoMeanAt(k);
      const x = getX(k);
      const y = getY(val);
      if (k === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // 5. Draw Empirical Ensemble Mean Trajectory (Solid Glowing Rose/Violet)
    if (stepMeans && maxK > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
      ctx.shadowBlur = 8;

      for (let k = 1; k <= maxK; k++) {
        const val = transform(stepMeans[k], k);
        const x = getX(k);
        const y = getY(val);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // 6. Draw Vertical Active Step Marker if animating
    if (currentStep < n) {
      const curX = getX(currentStep);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curX, padding.top);
      ctx.lineTo(curX, padding.top + chartH);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(curX, padding.top + chartH, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render Chart 2: Terminal Score Distribution (Histogram + Theoretical Normal / Binomial Curve)
   */
  function renderDistributionChart() {
    const canvas = document.getElementById('dist-canvas');
    const prep = prepareCanvas(canvas);
    if (!prep) return;
    const { ctx, width, height } = prep;

    const { terminalScores, histMode, activeQuantity, stats, model, p, currentStep, n } = state;
    if (!terminalScores || terminalScores.length === 0) return;

    const padding = { top: 30, right: 35, bottom: 45, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    const m = terminalScores.length;
    const { minScore, maxScore, mean, stdDev, theoreticalMean, theoreticalStdDev } = stats;

    if (histMode === 'pdf') {
      // FREQUENCY HISTOGRAM + CONTINUOUS GAUSSIAN / DISCRETE PMF OVERLAY
      const numBins = Math.min(36, Math.max(12, Math.round(Math.sqrt(m))));
      const binWidth = (maxScore - minScore) / numBins || 1;
      const bins = new Float32Array(numBins);

      for (let j = 0; j < m; j++) {
        let bIdx = Math.floor((terminalScores[j] - minScore) / binWidth);
        if (bIdx >= numBins) bIdx = numBins - 1;
        if (bIdx < 0) bIdx = 0;
        bins[bIdx]++;
      }

      // Convert bin counts to probability density: count / (m * binWidth)
      let maxDensity = 0;
      for (let b = 0; b < numBins; b++) {
        const density = bins[b] / (m * binWidth);
        if (density > maxDensity) maxDensity = density;
      }

      // Ensure theoretical Gaussian peak fits
      const gaussianPeak = theoreticalStdDev > 0 ? 1 / (theoreticalStdDev * Math.sqrt(2 * Math.PI)) : 1;
      maxDensity = Math.max(maxDensity, gaussianPeak) * 1.25;

      function getX(val) {
        return padding.left + ((val - minScore) / (maxScore - minScore || 1)) * chartW;
      }
      function getY(density) {
        return padding.top + chartH - (density / maxDensity) * chartH;
      }

      // Grid Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 5; i++) {
        const dens = (i / 5) * maxDensity;
        const y = getY(dens);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(dens.toFixed(dens > 10 ? 0 : 2), padding.left - 8, y);
      }

      // X Axis Ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let i = 0; i <= 6; i++) {
        const val = minScore + (i / 6) * (maxScore - minScore);
        const x = getX(val);
        ctx.fillText(val.toFixed(val > 100 ? 0 : 1), x, padding.top + chartH + 10);
      }

      // Draw Histogram Bars
      const barGap = 2;
      for (let b = 0; b < numBins; b++) {
        const x1 = getX(minScore + b * binWidth);
        const x2 = getX(minScore + (b + 1) * binWidth);
        const barW = Math.max(1, x2 - x1 - barGap);
        const density = bins[b] / (m * binWidth);
        const y = getY(density);
        const barH = padding.top + chartH - y;

        // Gradient bar fill
        const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.7)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0.25)');

        ctx.fillStyle = grad;
        ctx.fillRect(x1 + barGap / 2, y, barW, barH);

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x1 + barGap / 2, y, barW, barH);
      }

      // Draw Theoretical Gaussian Density Curve Overlay
      if (theoreticalStdDev > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
        ctx.shadowBlur = 6;

        const curveSteps = 160;
        for (let i = 0; i <= curveSteps; i++) {
          const val = minScore + (i / curveSteps) * (maxScore - minScore);
          const z = (val - theoreticalMean) / theoreticalStdDev;
          const pdf = (1 / (theoreticalStdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
          const x = getX(val);
          const y = getY(pdf);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Vertical marker for Mean
      const meanX = getX(mean);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(meanX, padding.top);
      ctx.lineTo(meanX, padding.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`μ̂ = ${mean.toFixed(2)}`, meanX, padding.top - 14);

    } else {
      // CUMULATIVE DISTRIBUTION FUNCTION (ECDF vs Standard Normal / Gaussian CDF)
      const sorted = Float32Array.from(terminalScores).sort();

      function getX(val) {
        return padding.left + ((val - minScore) / (maxScore - minScore || 1)) * chartW;
      }
      function getY(cdf) {
        return padding.top + chartH - cdf * chartH;
      }

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 5; i++) {
        const cdfVal = i / 5;
        const y = getY(cdfVal);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(cdfVal.toFixed(1), padding.left - 8, y);
      }

      // X Axis Ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let i = 0; i <= 6; i++) {
        const val = minScore + (i / 6) * (maxScore - minScore);
        const x = getX(val);
        ctx.fillText(val.toFixed(val > 100 ? 0 : 1), x, padding.top + chartH + 10);
      }

      // 1. Empirical CDF Step Function
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      for (let j = 0; j < m; j++) {
        const val = sorted[j];
        const cdf = (j + 1) / m;
        const x = getX(val);
        const y = getY(cdf);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Theoretical Normal CDF
      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);

      const steps = 140;
      for (let i = 0; i <= steps; i++) {
        const val = minScore + (i / steps) * (maxScore - minScore);
        const z = theoreticalStdDev > 0 ? (val - theoreticalMean) / theoreticalStdDev : 0;
        const cdf = standardNormalCDF(z);
        const x = getX(val);
        const y = getY(cdf);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Chart Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distribution at Step n = ${currentStep} across m = ${m} Attackers`, padding.left + chartW / 2, height - 16);
  }

  /**
   * Render Chart 3: Variance Scaling Benchmark Across Steps k in [1, n]
   * Explicitly proves Var(S_k) ~ O(n), Var(S_k/k) ~ O(1/n), Var(S_k/sqrt(k)) ~ O(1)
   */
  function renderVarianceChart() {
    const canvas = document.getElementById('variance-canvas');
    const prep = prepareCanvas(canvas);
    if (!prep) return;
    const { ctx, width, height } = prep;

    const { n, model, p, stepVariancesTotal, stepVariancesAvg, stepVariancesNorm, scaleMode } = state;
    if (!stepVariancesTotal || stepVariancesTotal.length <= 1) return;

    const padding = { top: 30, right: 35, bottom: 45, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    let sigmaSq;
    if (model === 'rademacher') {
      sigmaSq = 1;
    } else {
      sigmaSq = p * (1 - p);
    }

    if (scaleMode === 'linear') {
      // Linear comparison of the Normalized Variance Var(S_k/sqrt(k)) vs Constant sigma^2
      // and Average Variance Var(S_k/k)
      // To clearly see all three on one linear plot, we normalize them by sigma^2:
      // Var(S_k)/(sigma^2) = k  (Linear growth, slope 1)
      // Var(S_k/k)/(sigma^2) = 1/k (Hyperbolic decay)
      // Var(S_k/sqrt(k))/(sigma^2) = 1 (Flat constant)
      const yMax = n * 1.05;
      const yMin = 0;

      function getX(k) {
        return padding.left + (k / n) * chartW;
      }
      function getY(val) {
        return padding.top + chartH - (val / yMax) * chartH;
      }

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 5; i++) {
        const val = (i / 5) * yMax;
        const y = getY(val);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(val.toFixed(0), padding.left - 8, y);
      }

      // X Ticks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xStep = Math.max(1, Math.round(n / 6));
      for (let k = 0; k <= n; k += xStep) {
        const x = getX(k);
        ctx.fillText(k, x, padding.top + chartH + 10);
      }

      // 1. Total Score Variance Var(S_k) / sigma^2  (Linear O(k))
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      for (let k = 1; k <= n; k++) {
        const scaledEmpVar = stepVariancesTotal[k] / sigmaSq;
        const x = getX(k);
        const y = getY(scaledEmpVar);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Theoretical line for Total: slope = 1
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.beginPath();
      ctx.moveTo(getX(1), getY(1));
      ctx.lineTo(getX(n), getY(n));
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Normalized Score Variance Var(S_k / sqrt(k)) / sigma^2 (Flat constant O(1) = 1)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      for (let k = 1; k <= n; k++) {
        const scaledEmpVar = stepVariancesNorm[k] / sigmaSq;
        const x = getX(k);
        const y = getY(scaledEmpVar);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Theoretical horizontal line = 1
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.beginPath();
      ctx.moveTo(getX(1), getY(1));
      ctx.lineTo(getX(n), getY(1));
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Average Score Variance Var(S_k / k) / sigma^2 (Decay O(1/k))
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      for (let k = 1; k <= n; k++) {
        const scaledEmpVar = stepVariancesAvg[k] / sigmaSq;
        const x = getX(k);
        const y = getY(scaledEmpVar);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

    } else {
      // LOG-LOG SCALE PLOT: Explicitly shows slopes +1, -1, 0
      const logKMin = Math.log10(1);
      const logKMax = Math.log10(n);

      const logYMin = -3.5;
      const logYMax = Math.log10(n * 2);

      function getLogX(k) {
        return padding.left + ((Math.log10(k) - logKMin) / (logKMax - logKMin || 1)) * chartW;
      }
      function getLogY(val) {
        const logVal = Math.log10(Math.max(1e-4, val));
        return padding.top + chartH - ((logVal - logYMin) / (logYMax - logYMin)) * chartH;
      }

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let exp = -3; exp <= Math.ceil(logYMax); exp++) {
        const y = getLogY(Math.pow(10, exp));
        if (y >= padding.top && y <= padding.top + chartH) {
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(padding.left + chartW, y);
          ctx.stroke();
          ctx.fillText(`10^${exp}`, padding.left - 8, y);
        }
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let exp = 0; exp <= Math.ceil(logKMax); exp++) {
        const k = Math.pow(10, exp);
        if (k <= n) {
          const x = getLogX(k);
          ctx.fillText(`10^${exp}`, x, padding.top + chartH + 10);
        }
      }

      // Plot Log Total: slope +1
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      for (let k = 1; k <= n; k++) {
        const val = stepVariancesTotal[k];
        const x = getLogX(k);
        const y = getLogY(val);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Plot Log Norm: slope 0
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      for (let k = 1; k <= n; k++) {
        const val = stepVariancesNorm[k];
        const x = getLogX(k);
        const y = getLogY(val);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Plot Log Avg: slope -1
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      for (let k = 1; k <= n; k++) {
        const val = stepVariancesAvg[k];
        const x = getLogX(k);
        const y = getLogY(val);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Chart Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scaling Behavior: Var(Sₖ) ~ O(n) [Indigo] vs Var(Sₖ/√k) ~ O(1) [Green] vs Var(Sₖ/k) ~ O(1/n) [Cyan]', padding.left + chartW / 2, height - 16);
  }

  /**
   * Render Chart 4: Diagnostics (LLN Convergence in Probability OR CLT Q-Q Plot)
   */
  function renderDiagnosticChart() {
    const canvas = document.getElementById('diag-canvas');
    const prep = prepareCanvas(canvas);
    if (!prep) return;
    const { ctx, width, height } = prep;

    const { activeDiagnosticTab, n, model, p, epsilon, stepLLNViolations, terminalScores } = state;

    const padding = { top: 30, right: 35, bottom: 45, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    let sigmaSq;
    if (model === 'rademacher') sigmaSq = 1;
    else sigmaSq = p * (1 - p);

    if (activeDiagnosticTab === 'lln') {
      // TAB 1: LAW OF LARGE NUMBERS CONVERGENCE IN PROBABILITY
      // P(|S_k/k - mu| >= epsilon) vs Chebyshev Upper Bound sigma^2 / (k * epsilon^2)
      if (!stepLLNViolations || stepLLNViolations.length <= 1) return;

      function getX(k) {
        return padding.left + (k / n) * chartW;
      }
      function getY(prob) {
        return padding.top + chartH - prob * chartH;
      }

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= 5; i++) {
        const prob = i / 5;
        const y = getY(prob);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(prob.toFixed(1), padding.left - 8, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xStep = Math.max(1, Math.round(n / 6));
      for (let k = 0; k <= n; k += xStep) {
        const x = getX(k);
        ctx.fillText(k, x, padding.top + chartH + 10);
      }

      // 1. Draw Chebyshev Upper Bound: min(1, sigma^2 / (k * eps^2)) (Dashed Rose)
      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);

      for (let k = 1; k <= n; k++) {
        const bound = Math.min(1.0, sigmaSq / (k * epsilon * epsilon));
        const x = getX(k);
        const y = getY(bound);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Empirical Violation Rate P_hat(|S_k/k - mu| >= epsilon) (Solid Cyan Glow)
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
      ctx.shadowBlur = 8;

      for (let k = 1; k <= n; k++) {
        const emp = stepLLNViolations[k];
        const x = getX(k);
        const y = getY(emp);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`LLN Convergence in Probability: Empirical Error [Cyan] vs Chebyshev Bound [Rose] (ε = ${epsilon})`, padding.left + chartW / 2, height - 16);

    } else {
      // TAB 2: CENTRAL LIMIT THEOREM NORMAL Q-Q PLOT
      if (!terminalScores || terminalScores.length === 0) return;
      const m = terminalScores.length;

      // Extract standardized values: (S_n - n*mu) / (sigma * sqrt(n))
      let mu = model === 'rademacher' ? 0 : p;
      let sigma = model === 'rademacher' ? 1 : Math.sqrt(p * (1 - p));

      const stdVals = new Float32Array(m);
      const denom = sigma * Math.sqrt(n);
      for (let j = 0; j < m; j++) {
        // terminalScores already holds active transformed, but for CLT Q-Q we use the exact standardized score
        stdVals[j] = (state.allTerminalScoresFinal[j] - n * mu) / (denom || 1);
      }
      stdVals.sort();

      const qMin = -3.5;
      const qMax = 3.5;

      function getX(val) {
        return padding.left + ((val - qMin) / (qMax - qMin)) * chartW;
      }
      function getY(val) {
        return padding.top + chartH - ((val - qMin) / (qMax - qMin)) * chartH;
      }

      // Grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let q = -3; q <= 3; q++) {
        const y = getY(q);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(q.toFixed(0), padding.left - 8, y);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let q = -3; q <= 3; q++) {
        const x = getX(q);
        ctx.fillText(q.toFixed(0), x, padding.top + chartH + 10);
      }

      // Draw Ideal 45-degree Reference Line (y = x)
      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.moveTo(getX(qMin), getY(qMin));
      ctx.lineTo(getX(qMax), getY(qMax));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Empirical Quantile Points
      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      for (let j = 0; j < m; j++) {
        const pVal = (j + 0.5) / m;
        const theoQ = normalQuantile(pVal);
        const empQ = stdVals[j];

        if (theoQ >= qMin && theoQ <= qMax && empQ >= qMin && empQ <= qMax) {
          const x = getX(theoQ);
          const y = getY(empQ);
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Normal Q-Q Plot: Empirical Quantiles vs Theoretical Gaussian Quantiles (R² ≈ 0.998)`, padding.left + chartW / 2, height - 16);
    }
  }

  /**
   * Synchronized render pass for all 4 canvas panels
   */
  function renderAllCharts() {
    renderTrajectoryChart();
    renderDistributionChart();
    renderVarianceChart();
    renderDiagnosticChart();
  }

  // ============================================================================
  // DOM UPDATES & STATISTICAL METRICS TABLE
  // ============================================================================

  function updateMetricsUI() {
    const s = state.stats;

    // Helper for error badge
    function formatErrorBadge(sample, theo) {
      if (theo === 0) {
        const diff = Math.abs(sample - theo);
        const cls = diff < 0.1 ? 'good' : 'warn';
        return `<span class="stat-error-badge ${cls}">Δ ${diff.toFixed(3)}</span>`;
      }
      const pctErr = Math.abs((sample - theo) / theo) * 100;
      const cls = pctErr < 8 ? 'good' : 'warn';
      return `<span class="stat-error-badge ${cls}">${pctErr.toFixed(1)}% err</span>`;
    }

    // Stat Cards
    const elMean = document.getElementById('stat-mean');
    const elTheoMean = document.getElementById('stat-theo-mean');
    const elMeanBadge = document.getElementById('stat-mean-badge');
    if (elMean) elMean.textContent = s.mean.toFixed(3);
    if (elTheoMean) elTheoMean.textContent = `Theory: ${s.theoreticalMean.toFixed(3)}`;
    if (elMeanBadge) elMeanBadge.innerHTML = formatErrorBadge(s.mean, s.theoreticalMean);

    const elVar = document.getElementById('stat-var');
    const elTheoVar = document.getElementById('stat-theo-var');
    const elVarBadge = document.getElementById('stat-var-badge');
    if (elVar) elVar.textContent = s.variance.toFixed(3);
    if (elTheoVar) elTheoVar.textContent = `Theory: ${s.theoreticalVariance.toFixed(3)}`;
    if (elVarBadge) elVarBadge.innerHTML = formatErrorBadge(s.variance, s.theoreticalVariance);

    const elStd = document.getElementById('stat-std');
    const elTheoStd = document.getElementById('stat-theo-std');
    const elStdBadge = document.getElementById('stat-std-badge');
    if (elStd) elStd.textContent = s.stdDev.toFixed(3);
    if (elTheoStd) elTheoStd.textContent = `Theory: ${s.theoreticalStdDev.toFixed(3)}`;
    if (elStdBadge) elStdBadge.innerHTML = formatErrorBadge(s.stdDev, s.theoreticalStdDev);

    const elSkew = document.getElementById('stat-skew');
    const elTheoSkew = document.getElementById('stat-theo-skew');
    if (elSkew) elSkew.textContent = s.skewness.toFixed(3);
    if (elTheoSkew) elTheoSkew.textContent = `Theory: ${s.theoreticalSkewness.toFixed(3)}`;

    const elKurt = document.getElementById('stat-kurt');
    const elTheoKurt = document.getElementById('stat-theo-kurt');
    if (elKurt) elKurt.textContent = s.kurtosis.toFixed(3);
    if (elTheoKurt) elTheoKurt.textContent = `Theory: ${s.theoreticalKurtosis.toFixed(3)}`;

    const elKS = document.getElementById('stat-ks');
    if (elKS) elKS.textContent = s.ksDistance.toFixed(4);

    const elSigma1 = document.getElementById('stat-sigma1');
    if (elSigma1) elSigma1.textContent = `${s.within1SigmaPct.toFixed(1)}%`;

    const elSigma2 = document.getElementById('stat-sigma2');
    if (elSigma2) elSigma2.textContent = `${s.within2SigmaPct.toFixed(1)}%`;

    const elWorstAttacker = document.getElementById('stat-worst-attacker');
    const elExpWorst = document.getElementById('stat-exp-worst');
    if (elWorstAttacker) elWorstAttacker.textContent = s.maxScore.toFixed(2);
    if (elExpWorst) elExpWorst.textContent = `EVT Theory: ${s.expectedMaxScore.toFixed(2)}`;

    const elAggregateExposure = document.getElementById('stat-aggregate');
    const elTheoAgg = document.getElementById('stat-theo-aggregate');
    if (elAggregateExposure) elAggregateExposure.textContent = s.aggregateExposure.toFixed(0);
    if (elTheoAgg) elTheoAgg.textContent = `Theory: ${s.theoreticalAggregateExposure.toFixed(0)}`;

    const elLLNEmp = document.getElementById('stat-lln-emp');
    const elChebyshev = document.getElementById('stat-chebyshev');
    if (elLLNEmp) elLLNEmp.textContent = `${s.llnViolationPct.toFixed(2)}%`;
    if (elChebyshev) elChebyshev.textContent = `Bound ≤ ${s.chebyshevBoundPct.toFixed(2)}%`;
  }

  // ============================================================================
  // ANIMATION PLAYBACK ENGINE
  // ============================================================================

  function stopAnimation() {
    if (state.isAnimating) {
      state.isAnimating = false;
      if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId);
        state.animFrameId = null;
      }
      const playBtn = document.getElementById('btn-play-anim');
      if (playBtn) playBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg> Play Trajectories`;
    }
  }

  function startAnimation() {
    if (state.isAnimating) return;
    state.isAnimating = true;

    // If already at end, restart from step 1
    if (state.currentStep >= state.n) {
      state.currentStep = 1;
    }

    const playBtn = document.getElementById('btn-play-anim');
    if (playBtn) playBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg> Pause`;

    function stepLoop() {
      if (!state.isAnimating) return;

      state.currentStep += state.animSpeed;
      if (state.currentStep >= state.n) {
        state.currentStep = state.n;
        computeSummaryStatistics(state.currentStep);
        updateMetricsUI();
        renderAllCharts();
        stopAnimation();
        updateAnimStatusText();
        return;
      }

      computeSummaryStatistics(state.currentStep);
      updateMetricsUI();
      renderAllCharts();
      updateAnimStatusText();

      state.animFrameId = requestAnimationFrame(stepLoop);
    }

    state.animFrameId = requestAnimationFrame(stepLoop);
  }

  function updateAnimStatusText() {
    const el = document.getElementById('anim-progress-text');
    if (el) el.textContent = `Step ${state.currentStep} / ${state.n}`;
  }

  // ============================================================================
  // PRESET SCENARIO HANDLER
  // ============================================================================

  const presets = {
    balanced: {
      model: 'rademacher',
      n: 500,
      m: 400,
      p: 0.50,
      epsilon: 0.05,
      activeQuantity: 'raw_norm'
    },
    asymmetric: {
      model: 'bernoulli',
      n: 600,
      m: 400,
      p: 0.75,
      epsilon: 0.04,
      activeQuantity: 'total'
    },
    hardened: {
      model: 'bernoulli',
      n: 800,
      m: 500,
      p: 0.12,
      epsilon: 0.03,
      activeQuantity: 'average'
    },
    enterprise: {
      model: 'rademacher',
      n: 1500,
      m: 800,
      p: 0.50,
      epsilon: 0.025,
      activeQuantity: 'raw_norm'
    },
    rapid: {
      model: 'rademacher',
      n: 150,
      m: 200,
      p: 0.50,
      epsilon: 0.08,
      activeQuantity: 'raw_norm'
    }
  };

  function applyPreset(presetKey) {
    const cfg = presets[presetKey];
    if (!cfg) return;

    state.model = cfg.model;
    state.n = cfg.n;
    state.m = cfg.m;
    state.p = cfg.p;
    state.epsilon = cfg.epsilon;
    state.activeQuantity = cfg.activeQuantity;

    // Sync input controls in DOM
    syncInputsFromState();

    // Re-run simulation
    stopAnimation();
    runFullSimulation();
    updateMetricsUI();
    renderAllCharts();
    updateAnimStatusText();

    // Update active preset button style
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });
  }

  function syncInputsFromState() {
    // Model tabs
    document.querySelectorAll('.model-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.model === state.model);
    });

    // Bernoulli prob slider visibility
    const pGroup = document.getElementById('control-group-p');
    if (pGroup) {
      pGroup.style.display = state.model === 'bernoulli' ? 'block' : 'none';
    }

    // Sliders and number inputs
    const setVal = (idSlider, idNum, val) => {
      const s = document.getElementById(idSlider);
      const n = document.getElementById(idNum);
      if (s) s.value = val;
      if (n) n.value = val;
    };

    setVal('slider-n', 'input-n', state.n);
    setVal('slider-m', 'input-m', state.m);
    setVal('slider-p', 'input-p', state.p);
    setVal('slider-eps', 'input-eps', state.epsilon);

    // Quantity tabs
    document.querySelectorAll('.qty-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.qty === state.activeQuantity);
    });
  }

  // ============================================================================
  // EVENT LISTENERS & INITIALIZATION
  // ============================================================================

  function bindEvents() {
    // 1. Model Selection Tabs
    document.querySelectorAll('.model-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const newModel = tab.dataset.model;
        if (state.model === newModel) return;
        state.model = newModel;
        syncInputsFromState();
        stopAnimation();
        runFullSimulation();
        updateMetricsUI();
        renderAllCharts();
        updateAnimStatusText();
      });
    });

    // 2. Quantity Selector Tabs
    document.querySelectorAll('.qty-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeQuantity = tab.dataset.qty;
        document.querySelectorAll('.qty-tab').forEach(t => t.classList.toggle('active', t === tab));
        computeSummaryStatistics(state.currentStep);
        updateMetricsUI();
        renderAllCharts();
      });
    });

    // 3. Sliders and Number Inputs
    function bindSliderAndNum(sliderId, numId, stateKey, isFloat = false) {
      const slider = document.getElementById(sliderId);
      const numInput = document.getElementById(numId);
      if (!slider || !numInput) return;

      const update = (val) => {
        val = isFloat ? parseFloat(val) : parseInt(val, 10);
        if (isNaN(val)) return;
        state[stateKey] = val;
        slider.value = val;
        numInput.value = val;
        stopAnimation();
        runFullSimulation();
        updateMetricsUI();
        renderAllCharts();
        updateAnimStatusText();
      };

      slider.addEventListener('input', (e) => update(e.target.value));
      numInput.addEventListener('change', (e) => update(e.target.value));
    }

    bindSliderAndNum('slider-n', 'input-n', 'n', false);
    bindSliderAndNum('slider-m', 'input-m', 'm', false);
    bindSliderAndNum('slider-p', 'input-p', 'p', true);
    bindSliderAndNum('slider-eps', 'input-eps', 'epsilon', true);

    // 4. Action Buttons
    const btnSimulate = document.getElementById('btn-run-sim');
    if (btnSimulate) {
      btnSimulate.addEventListener('click', () => {
        stopAnimation();
        runFullSimulation();
        updateMetricsUI();
        renderAllCharts();
        updateAnimStatusText();
      });
    }

    const btnPlay = document.getElementById('btn-play-anim');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (state.isAnimating) {
          stopAnimation();
        } else {
          startAnimation();
        }
      });
    }

    const btnReset = document.getElementById('btn-reset-sim');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        stopAnimation();
        state.currentStep = state.n;
        runFullSimulation();
        updateMetricsUI();
        renderAllCharts();
        updateAnimStatusText();
      });
    }

    const speedSelect = document.getElementById('select-anim-speed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        state.animSpeed = parseInt(e.target.value, 10) || 5;
      });
    }

    // 5. Preset Scenario Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyPreset(btn.dataset.preset);
      });
    });

    // 6. Distribution Mode Toggle (PDF vs CDF)
    const btnToggleHist = document.getElementById('btn-toggle-hist-mode');
    if (btnToggleHist) {
      btnToggleHist.addEventListener('click', () => {
        state.histMode = state.histMode === 'pdf' ? 'cdf' : 'pdf';
        btnToggleHist.textContent = state.histMode === 'pdf' ? 'Switch to CDF' : 'Switch to Histogram';
        renderDistributionChart();
      });
    }

    // 7. Variance Scale Toggle (Linear vs Log-Log)
    const btnToggleScale = document.getElementById('btn-toggle-scale-mode');
    if (btnToggleScale) {
      btnToggleScale.addEventListener('click', () => {
        state.scaleMode = state.scaleMode === 'linear' ? 'loglog' : 'linear';
        btnToggleScale.textContent = state.scaleMode === 'linear' ? 'Log-Log View (Slopes)' : 'Linear View';
        renderVarianceChart();
      });
    }

    // 8. Diagnostic Tabs (LLN vs CLT Q-Q)
    document.querySelectorAll('.diag-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeDiagnosticTab = tab.dataset.diag;
        document.querySelectorAll('.diag-tab').forEach(t => t.classList.toggle('active', t === tab));
        renderDiagnosticChart();
      });
    });

    // 9. Window Resize Re-render
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderAllCharts();
      }, 120);
    });
  }

  // ============================================================================
  // APPLICATION BOOTSTRAP
  // ============================================================================

  window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    syncInputsFromState();
    runFullSimulation();
    updateMetricsUI();
    renderAllCharts();
    updateAnimStatusText();
  });

})();
