/**
 * HMWK 5: Welford's Algorithm & Hacker Penetration Experiment
 * Author: 4lfg24
 */

// Global State for Welford Accumulator
const state = {
  count: 0,
  mean: 0.0,
  M2: 0.0,
  history: [],
};

// Reset State
function resetAccumulator() {
  state.count = 0;
  state.mean = 0.0;
  state.M2 = 0.0;
  state.history = [];
  updateUI();
}

/**
 * Core Welford Step - Exact 3-line recurrence equivalent:
 *   delta = x - mean
 *   mean += delta / count
 *   M2 += delta * (x - mean)
 */
function feedObservation(x) {
  state.count += 1;
  const k = state.count;
  const oldMean = state.mean;

  // Line 1: Innovation relative to previous mean
  const delta = x - oldMean;

  // Line 2: Update mean
  state.mean += delta / k;

  // Line 3: Update M2 using delta and updated mean
  const delta2 = x - state.mean;
  state.M2 += delta * delta2;

  const sampleVar = k > 1 ? state.M2 / (k - 1) : 0.0;
  const popVar = k > 0 ? state.M2 / k : 0.0;

  state.history.unshift({
    k,
    x,
    delta,
    mean: state.mean,
    delta2,
    M2: state.M2,
    sampleVar,
    popVar,
  });

  // Limit history to 100 rows for DOM performance
  if (state.history.length > 100) {
    state.history.pop();
  }

  updateUI();
}

function updateUI() {
  const k = state.count;
  const sVar = k > 1 ? state.M2 / (k - 1) : 0.0;
  const pVar = k > 0 ? state.M2 / k : 0.0;

  document.getElementById('metric-count').textContent = k.toLocaleString();
  document.getElementById('metric-mean').textContent = k > 0 ? state.mean.toFixed(4) : '0.0000';
  document.getElementById('metric-m2').textContent = k > 0 ? state.M2.toFixed(4) : '0.0000';
  document.getElementById('metric-svar').textContent = k > 1 ? sVar.toFixed(4) : (k === 1 ? '0.0000 (n=1)' : '—');
  document.getElementById('metric-pvar').textContent = k > 0 ? pVar.toFixed(4) : '—';

  // Render Table
  const tbody = document.getElementById('history-tbody');
  if (state.history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 2rem;">No data points streamed yet. Add a number or load a preset above!</td></tr>`;
    return;
  }

  tbody.innerHTML = state.history.map(row => `
    <tr>
      <td style="color: var(--text-dim); font-weight: 600;">#${row.k}</td>
      <td style="color: #fff; font-weight: 600;">${row.x >= 1e6 ? row.x.toExponential(4) : row.x.toFixed(4)}</td>
      <td style="color: var(--cyan-light);">${row.delta.toFixed(4)}</td>
      <td style="color: var(--indigo-light); font-weight: 600;">${row.mean.toFixed(4)}</td>
      <td style="color: var(--emerald-light); font-weight: 600;">${row.M2.toFixed(4)}</td>
      <td style="color: var(--amber); font-weight: 600;">${row.k > 1 ? row.sampleVar.toFixed(4) : '—'}</td>
    </tr>
  `).join('');
}

// Catastrophic Cancellation Benchmark
function updateCancellationBenchmark() {
  const exponent = parseFloat(document.getElementById('offset-slider').value);
  const offset = Math.pow(10, exponent);
  document.getElementById('offset-display').textContent = `10^${exponent.toFixed(1)} (≈ ${offset.toExponential(2)})`;

  // Base dataset: [1, 2, 3, 4, 5] -> True mean = 3.0, True sample variance = 2.50000
  const baseData = [1, 2, 3, 4, 5];
  const trueVar = 2.5;
  const shiftedData = baseData.map(v => offset + v);

  // Welford calculation
  let wCount = 0;
  let wMean = 0.0;
  let wM2 = 0.0;
  for (const x of shiftedData) {
    wCount++;
    const delta = x - wMean;
    wMean += delta / wCount;
    wM2 += delta * (x - wMean);
  }
  const welfordVar = wM2 / (wCount - 1);

  // Naive calculation: SS = sum(x^2) - (sum(x)^2) / n
  let sumX = 0.0;
  let sumX2 = 0.0;
  const n = shiftedData.length;
  for (const x of shiftedData) {
    sumX += x;
    sumX2 += x * x;
  }
  const naiveSS = sumX2 - (sumX * sumX) / n;
  const naiveVar = naiveSS / (n - 1);

  // Update UI
  document.getElementById('bench-welford-var').textContent = welfordVar.toFixed(6);
  document.getElementById('bench-welford-err').textContent = Math.abs(welfordVar - trueVar).toExponential(2);

  const naiveValElem = document.getElementById('bench-naive-var');
  naiveValElem.textContent = naiveVar.toFixed(6);

  const absError = Math.abs(naiveVar - trueVar);
  document.getElementById('bench-naive-err').textContent = absError.toExponential(2);

  const relErrorPct = Math.min(100, (absError / trueVar) * 100);
  document.getElementById('naive-error-pct').textContent = `${relErrorPct.toFixed(1)}% Error`;
  document.getElementById('naive-error-fill').style.width = `${relErrorPct}%`;

  const statusNote = document.getElementById('cancellation-note');
  if (relErrorPct > 90) {
    statusNote.innerHTML = `<span style="color: var(--rose); font-weight: 700;">💥 Catastrophic Cancellation Triggered!</span> The naive one-pass formula suffered complete precision loss (${relErrorPct.toFixed(1)}% error) because $\\sum x^2$ and $(\\sum x)^2/n$ cancelled out their lowest significant bits in IEEE 754 float64. Welford's algorithm maintains exact precision!`;
  } else if (relErrorPct > 1) {
    statusNote.innerHTML = `<span style="color: var(--amber); font-weight: 700;">⚠️ Noticeable Precision Degradation:</span> Relative error is ${relErrorPct.toFixed(1)}%. Significant digits are eroding in the naive subtraction.`;
  } else {
    statusNote.innerHTML = `<span style="color: var(--emerald-light); font-weight: 700;">✓ Both Accurate:</span> At this low offset magnitude, IEEE 754 mantissa has enough bits to represent the difference. Increase the offset slider to witness catastrophic cancellation!`;
  }
}

// Preset Handlers for Stream Accumulator
function loadPreset(type) {
  resetAccumulator();
  let values = [];

  if (type === 'standard') {
    values = [4, 7, 13, 16];
  } else if (type === 'random_normal') {
    // Box-Muller transform
    for (let i = 0; i < 50; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1 || 1e-9)) * Math.cos(2.0 * Math.PI * u2);
      values.push(10.0 + z * 3.0); // Mean 10, Stdev 3
    }
  } else if (type === 'huge_offset') {
    const base = 1e9;
    values = [base + 1, base + 2, base + 3, base + 4, base + 5];
  }

  for (const v of values) {
    feedObservation(v);
  }
}

function handleAddCustom() {
  const input = document.getElementById('custom-val-input');
  const val = parseFloat(input.value);
  if (!isNaN(val)) {
    feedObservation(val);
    input.value = '';
    input.focus();
  }
}


// ==============================================================================
// MULTI-HACKER PENETRATION EXPERIMENT ENGINE
// ==============================================================================

function getDistribution(type) {
  if (type === 'binomial') {
    const N = 10;
    const p = 0.4;
    return {
      name: 'Binomial(10, 0.4)',
      mu: N * p,                          // 4.0
      var: N * p * (1 - p),               // 2.4
      sample: () => {
        let count = 0;
        for (let i = 0; i < N; i++) {
          if (Math.random() < p) count++;
        }
        return count;
      }
    };
  } else if (type === 'uniform') {
    const a = 0.0;
    const b = 10.0;
    return {
      name: 'Uniform(0, 10)',
      mu: (a + b) / 2.0,                  // 5.0
      var: Math.pow(b - a, 2) / 12.0,     // 8.3333...
      sample: () => a + Math.random() * (b - a)
    };
  } else {
    // discrete_uniform on {0, 1, ..., 10}
    const K = 10;
    return {
      name: 'Discrete Uniform 0..10',
      mu: K / 2.0,                        // 5.0
      var: (K * (K + 2)) / 12.0,          // 10.0
      sample: () => Math.floor(Math.random() * (K + 1))
    };
  }
}

let lastSimData = null;

function runHackerSimulation() {
  const distType = document.getElementById('hacker-dist-select').value;
  const dist = getDistribution(distType);
  const m = parseInt(document.getElementById('m-slider').value, 10);
  const n = parseInt(document.getElementById('n-slider').value, 10);

  const hackerMeans = [];
  const hackerVars = [];
  const sampleTrajectories = []; // First 30 hackers

  for (let j = 0; j < m; j++) {
    let count = 0;
    let mean = 0.0;
    let M2 = 0.0;
    const path = [];

    for (let i = 1; i <= n; i++) {
      const x = dist.sample();
      count++;
      const delta = x - mean;
      mean += delta / count;
      M2 += delta * (x - mean);

      if (j < 30) {
        path.push(mean);
      }
    }

    if (j < 30) {
      sampleTrajectories.push(path);
    }

    hackerMeans.push(mean);
    hackerVars.append = hackerVars.push(count > 1 ? M2 / (count - 1) : 0.0);
  }

  // Aggregate stats
  const avgMean = hackerMeans.reduce((a, b) => a + b, 0) / m;
  const avgVar = hackerVars.reduce((a, b) => a + b, 0) / m;

  let sumDiffMeanSq = 0;
  for (const x of hackerMeans) sumDiffMeanSq += Math.pow(x - avgMean, 2);
  const varOfMeans = m > 1 ? sumDiffMeanSq / (m - 1) : 0;

  let sumDiffVarSq = 0;
  for (const v of hackerVars) sumDiffVarSq += Math.pow(v - avgVar, 2);
  const varOfVars = m > 1 ? sumDiffVarSq / (m - 1) : 0;

  // Theoretical variance of the mean = sigma^2 / n
  const thVarOfMeans = dist.var / n;

  // Update Metrics
  document.getElementById('hm-th-mu').textContent = dist.mu.toFixed(4);
  document.getElementById('hm-avg-mean').textContent = avgMean.toFixed(4);
  document.getElementById('hm-err-mean').textContent = Math.abs(avgMean - dist.mu).toFixed(4);

  document.getElementById('hm-th-var').textContent = dist.var.toFixed(4);
  document.getElementById('hm-avg-var').textContent = avgVar.toFixed(4);
  document.getElementById('hm-err-var').textContent = Math.abs(avgVar - dist.var).toFixed(4);

  document.getElementById('hm-var-means').textContent = varOfMeans.toFixed(5);
  document.getElementById('hm-th-var-means').textContent = thVarOfMeans.toFixed(5);
  document.getElementById('hm-var-vars').textContent = varOfVars.toFixed(5);

  lastSimData = {
    m, n, dist, sampleTrajectories, hackerMeans, hackerVars, avgMean, avgVar
  };

  // Render Charts
  drawTrajectories(sampleTrajectories, n, dist.mu);
  drawHistogram(hackerMeans, dist.mu, thVarOfMeans);
}

function drawTrajectories(trajectories, n, mu) {
  const canvas = document.getElementById('canvas-trajectories');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Margins
  const padL = 40, padR = 20, padT = 20, padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Y Scale: [0, 10]
  const yMin = 0.0, yMax = 10.0;
  const toY = (val) => padT + plotH * (1.0 - (val - yMin) / (yMax - yMin));
  const toX = (step) => padL + plotW * (step / n);

  // Background Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let val = 0; val <= 10; val += 2) {
    const y = toY(val);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(val.toString(), 15, y + 3);
  }

  // Draw Theoretical Mean Horizontal Line
  const muY = toY(mu);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(padL, muY);
  ctx.lineTo(w - padR, muY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '11px JetBrains Mono';
  ctx.fillText(`μ = ${mu.toFixed(1)}`, w - padR - 55, muY - 6);

  // Draw Trajectories
  ctx.lineWidth = 1.2;
  for (let j = 0; j < trajectories.length; j++) {
    const path = trajectories[j];
    ctx.strokeStyle = j % 2 === 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(129, 140, 248, 0.35)';
    ctx.beginPath();
    for (let k = 0; k < path.length; k++) {
      const x = toX(k + 1);
      const y = toY(path[k]);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // X-axis label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px JetBrains Mono';
  ctx.fillText('System 1', padL, h - 10);
  ctx.fillText(`System ${n}`, w - padR - 60, h - 10);
}

function drawHistogram(means, mu, thVar) {
  const canvas = document.getElementById('canvas-histogram');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padL = 40, padR = 20, padT = 20, padB = 30;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Compute min and max
  let minVal = mu - 4 * Math.sqrt(thVar);
  let maxVal = mu + 4 * Math.sqrt(thVar);
  minVal = Math.max(0, minVal);
  maxVal = Math.min(10, maxVal);

  const numBins = 24;
  const binWidth = (maxVal - minVal) / numBins;
  const bins = new Array(numBins).fill(0);

  for (const mVal of means) {
    if (mVal >= minVal && mVal <= maxVal) {
      const binIdx = Math.min(numBins - 1, Math.floor((mVal - minVal) / binWidth));
      bins[binIdx]++;
    }
  }

  const maxFreq = Math.max(...bins, 1);

  // Draw Bars
  const toX = (val) => padL + plotW * ((val - minVal) / (maxVal - minVal));
  const toY = (freq) => padT + plotH * (1.0 - freq / maxFreq);

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL, padT + plotH);
  ctx.lineTo(w - padR, padT + plotH);
  ctx.stroke();

  const barW = (plotW / numBins) - 2;
  for (let i = 0; i < numBins; i++) {
    const bStart = minVal + i * binWidth;
    const x = toX(bStart) + 1;
    const y = toY(bins[i]);
    const barH = padT + plotH - y;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.fillRect(x, y, barW, barH);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.8)';
    ctx.strokeRect(x, y, barW, barH);
  }

  // Draw Theoretical Mean vertical line
  const muX = toX(mu);
  if (muX >= padL && muX <= w - padR) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(muX, padT);
    ctx.lineTo(muX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`μ = ${mu.toFixed(2)}`, muX + 4, padT + 14);
  }

  // Labels
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px JetBrains Mono';
  ctx.fillText(minVal.toFixed(2), padL, h - 10);
  ctx.fillText(maxVal.toFixed(2), w - padR - 35, h - 10);
}

function runNSweepBenchmark() {
  const distType = document.getElementById('hacker-dist-select').value;
  const dist = getDistribution(distType);
  const m = 500;
  const nList = [10, 25, 50, 100, 250, 500];

  const tbody = document.getElementById('n-sweep-tbody');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--indigo-light); padding: 1.5rem;">Running Monte Carlo benchmark across ${nList.length} system scales (m = ${m})...</td></tr>`;

  setTimeout(() => {
    const rows = [];
    for (const n of nList) {
      const means = [];
      const vars = [];

      for (let j = 0; j < m; j++) {
        let count = 0;
        let mean = 0.0;
        let M2 = 0.0;
        for (let i = 0; i < n; i++) {
          const x = dist.sample();
          count++;
          const delta = x - mean;
          mean += delta / count;
          M2 += delta * (x - mean);
        }
        means.push(mean);
        vars.push(M2 / (count - 1));
      }

      const avgMean = means.reduce((a, b) => a + b, 0) / m;
      const avgVar = vars.reduce((a, b) => a + b, 0) / m;
      const errMean = Math.abs(avgMean - dist.mu);
      const errVar = Math.abs(avgVar - dist.var);

      let sumMeanDiffSq = 0;
      for (const val of means) sumMeanDiffSq += Math.pow(val - avgMean, 2);
      const varMeans = sumMeanDiffSq / (m - 1);

      let sumVarDiffSq = 0;
      for (const val of vars) sumVarDiffSq += Math.pow(val - avgVar, 2);
      const varVars = sumVarDiffSq / (m - 1);

      const thVarMeans = dist.var / n;
      const ratio = (n * varMeans) / dist.var;

      rows.push(`
        <tr>
          <td style="font-weight: 700; color: #fff;">n = ${n}</td>
          <td style="color: var(--emerald-light); font-weight: 600;">${avgMean.toFixed(4)}</td>
          <td style="color: var(--text-dim);">${errMean.toFixed(4)}</td>
          <td style="color: var(--cyan-light); font-weight: 600;">${avgVar.toFixed(4)}</td>
          <td style="color: var(--text-dim);">${errVar.toFixed(4)}</td>
          <td style="color: #fff; font-weight: 600;">${varMeans.toFixed(5)}</td>
          <td style="color: var(--amber); font-weight: 600;">${thVarMeans.toFixed(5)}</td>
          <td style="color: var(--indigo-light);">${varVars.toFixed(5)}</td>
          <td style="color: var(--emerald-light); font-weight: 700;">${ratio.toFixed(3)} ≈ 1.0</td>
        </tr>
      `);
    }

    tbody.innerHTML = rows.join('');
  }, 50);
}


// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Cancellation Benchmark
  const slider = document.getElementById('offset-slider');
  slider.addEventListener('input', updateCancellationBenchmark);
  updateCancellationBenchmark();

  // Load standard preset for stream accumulator
  loadPreset('standard');

  // Input listeners for Stream Accumulator
  document.getElementById('btn-add').addEventListener('click', handleAddCustom);
  document.getElementById('custom-val-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddCustom();
  });

  document.getElementById('btn-reset').addEventListener('click', resetAccumulator);
  document.getElementById('btn-preset-std').addEventListener('click', () => loadPreset('standard'));
  document.getElementById('btn-preset-norm').addEventListener('click', () => loadPreset('random_normal'));
  document.getElementById('btn-preset-offset').addEventListener('click', () => loadPreset('huge_offset'));

  // Hacker Simulation Sliders & Buttons
  const mSlider = document.getElementById('m-slider');
  const nSlider = document.getElementById('n-slider');
  mSlider.addEventListener('input', () => {
    document.getElementById('m-display').textContent = mSlider.value;
  });
  nSlider.addEventListener('input', () => {
    document.getElementById('n-display').textContent = nSlider.value;
  });

  document.getElementById('btn-run-hacker-sim').addEventListener('click', runHackerSimulation);
  document.getElementById('btn-run-n-sweep').addEventListener('click', runNSweepBenchmark);
  document.getElementById('hacker-dist-select').addEventListener('change', runHackerSimulation);

  // Run initial hacker simulation and n-sweep
  runHackerSimulation();
  runNSweepBenchmark();
});
