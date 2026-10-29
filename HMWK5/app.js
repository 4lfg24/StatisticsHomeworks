/**
 * HMWK 5: Welford's Algorithm Interactive Laboratory
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

// Preset Handlers
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Cancellation Benchmark
  const slider = document.getElementById('offset-slider');
  slider.addEventListener('input', updateCancellationBenchmark);
  updateCancellationBenchmark();

  // Load standard preset
  loadPreset('standard');

  // Input listeners
  document.getElementById('btn-add').addEventListener('click', handleAddCustom);
  document.getElementById('custom-val-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddCustom();
  });

  document.getElementById('btn-reset').addEventListener('click', resetAccumulator);
  document.getElementById('btn-preset-std').addEventListener('click', () => loadPreset('standard'));
  document.getElementById('btn-preset-norm').addEventListener('click', () => loadPreset('random_normal'));
  document.getElementById('btn-preset-offset').addEventListener('click', () => loadPreset('huge_offset'));
});
