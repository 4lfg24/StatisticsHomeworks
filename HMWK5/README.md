# Homework 5: Welford’s Recurrence Formulas for Online Mean, Sum of Squares, and Variance

## 1. Problem Formulation & Historical Context

Computing the sample mean and variance of a dataset $X = \{x_1, x_2, \dots, x_n\}$ is one of the most fundamental operations in statistics and scientific computing. In conventional two-pass algorithms, one first passes through the entire dataset to compute the mean $\bar{x}$, and then performs a second pass to compute the sum of squared deviations:

$$SS = \sum_{i=1}^n (x_i - \bar{x})^2, \qquad s^2 = \frac{SS}{n - 1}$$

While numerically stable, this requires storing all $n$ data points in memory or streaming through external storage twice, which is infeasible for real-time streaming data, infinite sensor feeds, or massive distributed datasets.

To compute variance in a single pass, textbooks often present the algebraic expansion:

$$SS = \sum_{i=1}^n x_i^2 - \frac{1}{n}\left(\sum_{i=1}^n x_i\right)^2$$

### The Catastrophic Cancellation Vulnerability
Although mathematically equivalent in exact arithmetic, the textbook one-pass formula is **numerically disastrous in finite-precision floating-point arithmetic** (IEEE 754). When data values have a large magnitude but small variation (e.g., $x_i = 10^9 + \epsilon_i$), the two terms $\sum x_i^2$ and $(\sum x_i)^2 / n$ are virtually identical and extremely large. Subtracting them leads to **catastrophic cancellation**, completely erasing all significant digits and often producing zero or even negative variance.

To solve this, **B. P. Welford (1962)** introduced an online, one-pass recurrence algorithm that updates both the mean and the sum of squared differences incrementally. **Donald Knuth** popularized and analyzed this algorithm in *The Art of Computer Programming* (Vol. 2, Section 4.2.2).

---

## 2. Derivation of Knuth’s Recurrence Formula for the Mean

Let $x_1, x_2, \dots, x_k$ denote an incoming sequence of data values.
Let $\bar{x}_k$ denote the arithmetic mean of the first $k$ values:

$$\bar{x}_k = \frac{1}{k} \sum_{i=1}^k x_i$$

### Step-by-Step Derivation:

1. Multiply by $k$ to express the total sum of the first $k$ terms:
   $$k \bar{x}_k = \sum_{i=1}^k x_i$$

2. Partition the sum into the sum of the first $k-1$ terms and the $k$-th term:
   $$\sum_{i=1}^k x_i = \left(\sum_{i=1}^{k-1} x_i\right) + x_k$$

3. Substitute the definition of the previous mean $\sum_{i=1}^{k-1} x_i = (k-1) \bar{x}_{k-1}$:
   $$k \bar{x}_k = (k-1) \bar{x}_{k-1} + x_k$$

4. Rewrite $(k-1) \bar{x}_{k-1}$ as $k \bar{x}_{k-1} - \bar{x}_{k-1}$:
   $$k \bar{x}_k = k \bar{x}_{k-1} - \bar{x}_{k-1} + x_k = k \bar{x}_{k-1} + (x_k - \bar{x}_{k-1})$$

5. Divide both sides by $k$:
   $$\bar{x}_k = \bar{x}_{k-1} + \frac{x_k - \bar{x}_{k-1}}{k}$$

### Key Identities Derived from Mean Recurrence:
Defining the innovation / deviation from the previous mean as $\Delta_k = x_k - \bar{x}_{k-1}$:
$$\bar{x}_k - \bar{x}_{k-1} = \frac{x_k - \bar{x}_{k-1}}{k} = \frac{\Delta_k}{k}$$
$$\bar{x}_{k-1} - \bar{x}_k = -\frac{x_k - \bar{x}_{k-1}}{k} = -\frac{\Delta_k}{k}$$

Furthermore, the deviation of $x_k$ from the **new** mean $\bar{x}_k$ satisfies:
$$x_k - \bar{x}_k = x_k - \left(\bar{x}_{k-1} + \frac{x_k - \bar{x}_{k-1}}{k}\right) = (x_k - \bar{x}_{k-1}) - \frac{x_k - \bar{x}_{k-1}}{k} = \left(1 - \frac{1}{k}\right)(x_k - \bar{x}_{k-1}) = \left(\frac{k-1}{k}\right)(x_k - \bar{x}_{k-1})$$

---

## 3. Derivation of Welford’s Recurrence Formula for Sum of Squares ($SS$)

Let $SS_k$ (commonly denoted $M_{2,k}$) be the sum of squared differences from the sample mean of the first $k$ observations:

$$SS_k = \sum_{i=1}^k (x_i - \bar{x}_k)^2$$

With initial conditions $SS_0 = 0$ and $SS_1 = (x_1 - \bar{x}_1)^2 = 0$.

### Step-by-Step Derivation:

We express the deviation $(x_i - \bar{x}_k)$ by introducing $\bar{x}_{k-1}$:
$$x_i - \bar{x}_k = (x_i - \bar{x}_{k-1}) + (\bar{x}_{k-1} - \bar{x}_k)$$

Now expand the square:
$$(x_i - \bar{x}_k)^2 = \left[ (x_i - \bar{x}_{k-1}) + (\bar{x}_{k-1} - \bar{x}_k) \right]^2 = (x_i - \bar{x}_{k-1})^2 + 2(x_i - \bar{x}_{k-1})(\bar{x}_{k-1} - \bar{x}_k) + (\bar{x}_{k-1} - \bar{x}_k)^2$$

Summing both sides from $i = 1$ to $k$:
$$SS_k = \sum_{i=1}^k (x_i - \bar{x}_k)^2 = \underbrace{\sum_{i=1}^k (x_i - \bar{x}_{k-1})^2}_{\text{Term 1}} + \underbrace{2(\bar{x}_{k-1} - \bar{x}_k) \sum_{i=1}^k (x_i - \bar{x}_{k-1})}_{\text{Term 2}} + \underbrace{\sum_{i=1}^k (\bar{x}_{k-1} - \bar{x}_k)^2}_{\text{Term 3}}$$

We evaluate each of the three terms:

#### 1. Term 1:
Split the summation into the first $k-1$ terms and the $k$-th term:
$$\sum_{i=1}^k (x_i - \bar{x}_{k-1})^2 = \sum_{i=1}^{k-1} (x_i - \bar{x}_{k-1})^2 + (x_k - \bar{x}_{k-1})^2$$
By definition, $\sum_{i=1}^{k-1} (x_i - \bar{x}_{k-1})^2 = SS_{k-1}$. Thus:
$$\text{Term 1} = SS_{k-1} + (x_k - \bar{x}_{k-1})^2$$

#### 2. Term 2:
Inspect the sum of deviations $\sum_{i=1}^k (x_i - \bar{x}_{k-1})$:
$$\sum_{i=1}^k (x_i - \bar{x}_{k-1}) = \left(\sum_{i=1}^{k-1} (x_i - \bar{x}_{k-1})\right) + (x_k - \bar{x}_{k-1})$$
By definition of the arithmetic mean $\bar{x}_{k-1} = \frac{1}{k-1}\sum_{i=1}^{k-1} x_i$, the sum of deviations of the first $k-1$ observations about their own mean is **identically zero**:
$$\sum_{i=1}^{k-1} (x_i - \bar{x}_{k-1}) = 0$$
Hence:
$$\sum_{i=1}^k (x_i - \bar{x}_{k-1}) = 0 + (x_k - \bar{x}_{k-1}) = x_k - \bar{x}_{k-1}$$
Now substituting $\bar{x}_{k-1} - \bar{x}_k = -\frac{x_k - \bar{x}_{k-1}}{k}$ from Knuth's mean recurrence:
$$\text{Term 2} = 2 \left( -\frac{x_k - \bar{x}_{k-1}}{k} \right) (x_k - \bar{x}_{k-1}) = -\frac{2}{k} (x_k - \bar{x}_{k-1})^2$$

#### 3. Term 3:
Because $(\bar{x}_{k-1} - \bar{x}_k)^2$ is independent of index $i$, summing $k$ identical constants yields:
$$\text{Term 3} = \sum_{i=1}^k (\bar{x}_{k-1} - \bar{x}_k)^2 = k (\bar{x}_{k-1} - \bar{x}_k)^2 = k \left( -\frac{x_k - \bar{x}_{k-1}}{k} \right)^2 = k \frac{(x_k - \bar{x}_{k-1})^2}{k^2} = \frac{1}{k} (x_k - \bar{x}_{k-1})^2$$

---

### Combining the Terms:
Adding Terms 1, 2, and 3:
$$SS_k = SS_{k-1} + (x_k - \bar{x}_{k-1})^2 - \frac{2}{k} (x_k - \bar{x}_{k-1})^2 + \frac{1}{k} (x_k - \bar{x}_{k-1})^2$$

Factor out $(x_k - \bar{x}_{k-1})^2$:
$$SS_k = SS_{k-1} + (x_k - \bar{x}_{k-1})^2 \left( 1 - \frac{2}{k} + \frac{1}{k} \right)$$
$$SS_k = SS_{k-1} + (x_k - \bar{x}_{k-1})^2 \left( 1 - \frac{1}{k} \right)$$
$$SS_k = SS_{k-1} + \left(\frac{k-1}{k}\right) (x_k - \bar{x}_{k-1})^2$$

Now recall our earlier identity from Section 2:
$$\left(\frac{k-1}{k}\right) (x_k - \bar{x}_{k-1}) = x_k - \bar{x}_k$$

Rewriting the product:
$$SS_k = SS_{k-1} + (x_k - \bar{x}_{k-1}) \cdot \left[ \left(\frac{k-1}{k}\right) (x_k - \bar{x}_{k-1}) \right] = SS_{k-1} + (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$$

This yields **Welford’s celebrated recurrence formula**:

$$\boxed{SS_k = SS_{k-1} + (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)}$$

---

## 4. Derivation of the Variance Recurrence Formulas

### A. Unbiased Sample Variance ($s_k^2$)
For $k \ge 2$, the sample variance with Bessel’s correction is:
$$s_k^2 = \frac{SS_k}{k - 1} \implies SS_k = (k - 1) s_k^2$$

Substituting this into Welford’s recurrence:
$$(k - 1) s_k^2 = (k - 2) s_{k-1}^2 + (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$$

Dividing both sides by $k - 1$:
$$s_k^2 = \frac{k - 2}{k - 1} s_{k-1}^2 + \frac{1}{k - 1} (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$$

In standard innovation/filter form:
$$\boxed{s_k^2 = s_{k-1}^2 + \frac{1}{k - 1}\left[ (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k) - s_{k-1}^2 \right]}$$

In practical implementations, one typically accumulates $SS_k$ (or $M_2$) and evaluates $s^2 = \frac{SS_k}{k-1}$ on demand in $O(1)$ operations, eliminating division at every intermediate iteration.

### B. Population Variance ($\sigma_k^2$)
The population variance is:
$$\sigma_k^2 = \frac{SS_k}{k} \implies SS_k = k \sigma_k^2$$

Substituting into the recurrence:
$$k \sigma_k^2 = (k - 1) \sigma_{k-1}^2 + (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$$

Dividing by $k$:
$$\sigma_k^2 = \frac{k - 1}{k} \sigma_{k-1}^2 + \frac{1}{k} (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$$

In innovation form:
$$\boxed{\sigma_k^2 = \sigma_{k-1}^2 + \frac{1}{k}\left[ (x_k - \bar{x}_{k-1})(x_k - \bar{x}_k) - \sigma_{k-1}^2 \right]}$$

---

## 5. The 3-Line Core Logic in Python

Inside an accumulator loop over observations $x$, the mathematical recurrence reduces to exactly **3 lines**:

```python
delta = x - mean
mean += delta / count
M2 += delta * (x - mean)
```

### Why this 3-line sequence works:
1. `delta = x - mean`: Computes $\Delta_k = x_k - \bar{x}_{k-1}$ using the mean from the **previous** step.
2. `mean += delta / count`: Updates `mean` in-place to $\bar{x}_k = \bar{x}_{k-1} + \frac{\Delta_k}{k}$.
3. `M2 += delta * (x - mean)`: Since `mean` was updated on the preceding line, the expression `(x - mean)` computes $(x_k - \bar{x}_k)$. Therefore, `delta * (x - mean)` evaluates precisely to $(x_k - \bar{x}_{k-1})(x_k - \bar{x}_k)$, updating $M_2$ to $SS_k$ without requiring an extra temporary variable!

---

## 6. Empirical Verification & Catastrophic Cancellation Benchmark

The script [`welford.py`](welford.py) compares Welford's algorithm against the naive textbook one-pass formula on a dataset shifted by a large constant $C = 10^9$:

$$X = \{10^9 + 1, \, 10^9 + 2, \, 10^9 + 3, \, 10^9 + 4, \, 10^9 + 5\}$$

Since variance is translation-invariant ($\operatorname{Var}(X + C) = \operatorname{Var}(X)$), the exact variance is $2.5000$.

### Execution Benchmark Output:
```text
========================================================================
WELFORD'S RECURRENCE ALGORITHM FOR ONLINE MEAN & VARIANCE
========================================================================

1. STANDARD TEST DATA: [4.0, 7.0, 13.0, 16.0]
  • Mean:                 Welford=10.0000    Python=10.0000   
  • Sample Variance (s²): Welford=30.0000    Python=30.0000   
  • Pop. Variance (σ²):   Welford=22.5000    Python=22.5000   
  • Sum of Squares (SS):  Welford=90.0000    Expected=90.0000
  ✓ Verification against Python `statistics` PASSED!

------------------------------------------------------------------------
2. NUMERICAL STABILITY: CATASTROPHIC CANCELLATION TEST
   Shift data by huge constant C = 10^9: [10^9+1, 10^9+2, 10^9+3, 10^9+4, 10^9+5]
   True variance is translation-invariant: Var(X + C) = Var(X) = 2.5000
------------------------------------------------------------------------
  • True Expected Variance: 2.500000
  • Welford's Variance:     2.500000  (Absolute Error: 0.00e+00)
  • Naive Formula Variance: 0.000000  (Absolute Error: 2.50e+00)
  • Naive Formula SS:       0.000000  (Expected SS: 10.0000)

  [!] CRITICAL NUMERICAL FAILURE OBSERVED IN NAIVE FORMULA:
      The naive formula suffered 100% loss of precision (catastrophic cancellation)
      due to subtracting two massive floating-point numbers: sum(x^2) - (sum(x))^2 / n.
      Welford's recurrence avoided this entirely and achieved exact precision!
```

---

## 7. Parallel / Distributed Generalization (Chan et al., 1979)

When computing variance across distributed nodes or threads, accumulators for two disjoint subsets $A$ and $B$ (with sizes $n_A, n_B$, means $\bar{x}_A, \bar{x}_B$, and sums of squares $SS_A, SS_B$) can be merged in $O(1)$:

$$n_{AB} = n_A + n_B$$
$$\delta = \bar{x}_B - \bar{x}_A$$
$$\bar{x}_{AB} = \bar{x}_A + \delta \left(\frac{n_B}{n_{AB}}\right)$$
$$SS_{AB} = SS_A + SS_B + \delta^2 \left(\frac{n_A n_B}{n_{AB}}\right)$$

This parallel merge rule is also implemented in [`WelfordAccumulator.merge()`](welford.py).
