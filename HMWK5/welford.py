"""
Welford's Algorithm for Computing Online Mean, Sum of Squares (SS), and Variance
Coursework: Statistics & Cryptography (HMWK 5)
Author: 4lfg24

Core Mathematical Principle:
---------------------------
Knuth's Recurrence for the Mean (TAOCP Vol. 2):
    mean_k = mean_{k-1} + (x_k - mean_{k-1}) / k

Welford's Recurrence for the Sum of Squares (SS = M2):
    M2_k = M2_{k-1} + (x_k - mean_{k-1}) * (x_k - mean_k)
    where:
        delta  = x_k - mean_{k-1}      (error relative to old mean)
        delta2 = x_k - mean_k          (error relative to new mean)

The core update logic requires only about 3 lines:
    delta = x - mean
    mean += delta / count
    M2 += delta * (x - mean)

Hacker Penetration Experiment:
-----------------------------
Simulates m hackers penetrating n systems. Each penetration attempt receives a score
in [0, 10] drawn from a fixed probability distribution with theoretical mean mu and
variance sigma^2.
Tracks per-hacker sample mean and sample variance via Welford's algorithm, compares
averages across hackers to mu and sigma^2, and evaluates the O(1/n) variability decay.
"""

import math
import random
import statistics
from typing import Iterable, Tuple, List, Dict, Optional


def welford_core_example(data: Iterable[float]) -> Tuple[float, float, float, float]:
    """
    Demonstrates the exact 3-line core logic of Welford's algorithm.

    Parameters:
        data: Iterable of numerical values.

    Returns:
        (mean, sample_variance, population_variance, sum_of_squares)
    """
    count = 0
    mean = 0.0
    M2 = 0.0  # Sum of squared deviations: SS_k = sum((x_i - mean_k)^2)

    for x in data:
        count += 1
        # ========================================================
        # THE 3-LINE CORE RECURRENCE LOGIC
        # ========================================================
        delta = x - mean
        mean += delta / count
        M2 += delta * (x - mean)
        # ========================================================

    sample_var = M2 / (count - 1) if count > 1 else 0.0
    pop_var = M2 / count if count > 0 else 0.0
    return mean, sample_var, pop_var, M2


class WelfordAccumulator:
    """
    Production-ready streaming accumulator for one-pass online statistics.
    Maintains count, mean, sum of squares (M2), sample/population variance,
    and supports merging multiple accumulators (Chan et al., 1979).
    """

    def __init__(self) -> None:
        self.count: int = 0
        self.mean: float = 0.0
        self.M2: float = 0.0  # Sum of squared differences from the mean (SS)

    def update(self, x: float) -> None:
        """
        Incrementally absorb a single observation into the running statistics.
        Executes Welford's 3-line core update.
        """
        self.count += 1
        delta = x - self.mean
        self.mean += delta / self.count
        self.M2 += delta * (x - self.mean)

    def update_batch(self, values: Iterable[float]) -> None:
        """Absorb an iterable of observations."""
        for val in values:
            self.update(val)

    @property
    def sum_of_squares(self) -> float:
        """Sum of squared deviations SS = sum_{i=1}^n (x_i - mean)^2."""
        return self.M2

    @property
    def variance(self) -> float:
        """Unbiased sample variance: s^2 = M2 / (n - 1) for n > 1."""
        return self.M2 / (self.count - 1) if self.count > 1 else 0.0

    @property
    def population_variance(self) -> float:
        """Population variance: sigma^2 = M2 / n for n > 0."""
        return self.M2 / self.count if self.count > 0 else 0.0

    @property
    def stdev(self) -> float:
        """Sample standard deviation: s = sqrt(s^2)."""
        return math.sqrt(self.variance)

    @property
    def pstdev(self) -> float:
        """Population standard deviation: sigma = sqrt(sigma^2)."""
        return math.sqrt(self.population_variance)

    def merge(self, other: "WelfordAccumulator") -> "WelfordAccumulator":
        """
        Merge another Welford accumulator into this one using Chan et al.'s parallel formula.
        Enables parallel / distributed map-reduce computation of variance.
        """
        if other.count == 0:
            return self
        if self.count == 0:
            self.count = other.count
            self.mean = other.mean
            self.M2 = other.M2
            return self

        new_count = self.count + other.count
        delta = other.mean - self.mean
        new_mean = self.mean + delta * (other.count / new_count)
        new_M2 = self.M2 + other.M2 + (delta ** 2) * (self.count * other.count / new_count)

        self.count = new_count
        self.mean = new_mean
        self.M2 = new_M2
        return self

    def __repr__(self) -> str:
        return (
            f"WelfordAccumulator(count={self.count}, mean={self.mean:.6f}, "
            f"var={self.variance:.6f}, pop_var={self.population_variance:.6f})"
        )


def naive_one_pass_variance(data: Iterable[float]) -> Tuple[float, float, float]:
    """
    Naive textbook one-pass algorithm:
        SS = sum(x^2) - (sum(x)^2) / n
    Susceptible to catastrophic cancellation when mean >> stdev!
    """
    n = 0
    sum_x = 0.0
    sum_x2 = 0.0
    for x in data:
        n += 1
        sum_x += x
        sum_x2 += x * x

    if n < 1:
        return 0.0, 0.0, 0.0

    mean = sum_x / n
    # Catastrophic cancellation occurs here:
    ss = sum_x2 - (sum_x ** 2) / n
    sample_var = ss / (n - 1) if n > 1 else 0.0
    return mean, sample_var, ss


# ==============================================================================
# HACKER PENETRATION DYNAMICS & SAMPLING DISTRIBUTION EXPERIMENT
# ==============================================================================

class PenetrationDistribution:
    """
    Represents a probability distribution generating scores in [0, 10].
    Provides exact theoretical mean mu, variance sigma^2, and 4th moment mu_4.
    """
    def __init__(self, name: str, **kwargs):
        self.name = name
        self.params = kwargs

        if name == "binomial":
            # X ~ Binomial(N=10, p)
            self.N = kwargs.get("N", 10)
            self.p = kwargs.get("p", 0.4)
            self.mu = self.N * self.p
            self.var = self.N * self.p * (1.0 - self.p)
            # 4th central moment of Binomial: N*p*(1-p)*(1 + (3N-6)*p*(1-p))
            pq = self.p * (1.0 - self.p)
            self.mu4 = self.N * pq * (1.0 + (3 * self.N - 6) * pq)
            self.desc = f"Discrete Binomial(N={self.N}, p={self.p})"

        elif name == "uniform":
            # X ~ Continuous Uniform(a=0, b=10)
            self.a = kwargs.get("a", 0.0)
            self.b = kwargs.get("b", 10.0)
            self.mu = (self.a + self.b) / 2.0
            self.var = ((self.b - self.a) ** 2) / 12.0
            # 4th central moment of Uniform: (b-a)^4 / 80
            self.mu4 = ((self.b - self.a) ** 4) / 80.0
            self.desc = f"Continuous Uniform({self.a}, {self.b})"

        elif name == "discrete_uniform":
            # X in {0, 1, ..., 10}
            self.k_max = kwargs.get("k_max", 10)
            self.mu = self.k_max / 2.0
            # Var of discrete uniform on {0..K}: K*(K+2)/12
            self.var = (self.k_max * (self.k_max + 2)) / 12.0
            # Approx 4th moment
            self.mu4 = sum(((x - self.mu) ** 4) / (self.k_max + 1) for x in range(self.k_max + 1))
            self.desc = f"Discrete Uniform 0..{self.k_max}"

        else:
            raise ValueError(f"Unknown distribution: {name}")

    def sample(self) -> float:
        """Sample a single score in [0, 10]."""
        if self.name == "binomial":
            return float(sum(1 for _ in range(self.N) if random.random() < self.p))
        elif self.name == "uniform":
            return random.uniform(self.a, self.b)
        elif self.name == "discrete_uniform":
            return float(random.randint(0, self.k_max))
        return 0.0


def simulate_hacker_penetration(
    m_hackers: int = 1000,
    n_systems_list: Optional[List[int]] = None,
    dist_name: str = "binomial",
    dist_kwargs: Optional[dict] = None,
    seed: int = 42,
) -> Dict[str, any]:
    """
    Simulates m hackers attempting to penetrate n systems.
    Each hacker generates a trajectory of n scores in [0, 10].
    Welford's recurrence formulas track sampling mean and sampling variance online.

    Returns summary metrics across varying n.
    """
    if n_systems_list is None:
        n_systems_list = [10, 25, 50, 100, 250, 500, 1000]

    random.seed(seed)
    dist = PenetrationDistribution(dist_name, **(dist_kwargs or {}))

    results_by_n = []

    for n in n_systems_list:
        hacker_means = []
        hacker_vars = []
        hacker_pop_vars = []  # Biased estimator: M2 / n

        for _ in range(m_hackers):
            # For each hacker, run Welford's 3-line recurrence online
            count = 0
            mean = 0.0
            M2 = 0.0

            for _ in range(n):
                x = dist.sample()
                count += 1
                # --- Welford 3-line recurrence ---
                delta = x - mean
                mean += delta / count
                M2 += delta * (x - mean)
                # ---------------------------------

            hacker_means.append(mean)
            hacker_vars.append(M2 / (count - 1))      # Unbiased s^2
            hacker_pop_vars.append(M2 / count)        # Uncorrected biased sigma^2

        # Aggregate across all m hackers:
        avg_mean = statistics.mean(hacker_means)
        avg_var = statistics.mean(hacker_vars)
        avg_pop_var = statistics.mean(hacker_pop_vars)

        # Variances across the m hackers (variability of the estimators):
        var_of_means = statistics.variance(hacker_means)
        var_of_vars = statistics.variance(hacker_vars)

        # Theoretical predicted variability:
        # Var(x_bar) = sigma^2 / n
        th_var_of_means = dist.var / n
        # Var(s^2) = (1/n) * (mu_4 - (n-3)/(n-1) * sigma^4)
        th_var_of_vars = (1.0 / n) * (dist.mu4 - ((n - 3) / (n - 1)) * (dist.var ** 2)) if n > 1 else 0.0

        results_by_n.append({
            "n": n,
            "avg_mean": avg_mean,
            "err_mean": abs(avg_mean - dist.mu),
            "avg_var": avg_var,
            "err_var": abs(avg_var - dist.var),
            "avg_pop_var": avg_pop_var,
            "biased_factor": avg_pop_var / dist.var,  # Expected (n-1)/n
            "var_of_means": var_of_means,
            "th_var_of_means": th_var_of_means,
            "var_of_vars": var_of_vars,
            "th_var_of_vars": th_var_of_vars,
            "scaling_ratio_mean": var_of_means / (dist.var / n),
        })

    return {
        "m_hackers": m_hackers,
        "distribution": dist,
        "results": results_by_n,
    }


def print_penetration_experiment_report(sim_data: Dict[str, any]):
    """Prints a clear, publication-quality report of the penetration experiment."""
    dist = sim_data["distribution"]
    m = sim_data["m_hackers"]
    results = sim_data["results"]

    print("\n" + "=" * 90)
    print(f"HACKER PENETRATION STATISTICAL EXPERIMENT (m = {m} Hackers)")
    print(f"Distribution: {dist.desc} | Domain: [0, 10]")
    print(f"Theoretical Parameters: μ = {dist.mu:.4f} | σ² = {dist.var:.4f}")
    print("=" * 90)

    # 1. Unbiasedness Table
    print("\n[PART 1] EMPIRICAL CONVERGENCE TO THEORETICAL PARAMETERS (Unbiasedness)")
    print(f"{'n (Systems)':<12} | {'Avg Mean x̄':<14} | {'|x̄ - μ|':<10} | {'Avg Var s²':<14} | {'|s² - σ²|':<10} | {'Bessel Bias ((n-1)/n)':<22}")
    print("-" * 90)
    for r in results:
        bessel_expected = (r['n'] - 1) / r['n']
        print(
            f"{r['n']:<12d} | "
            f"{r['avg_mean']:<14.5f} | "
            f"{r['err_mean']:<10.5f} | "
            f"{r['avg_var']:<14.5f} | "
            f"{r['err_var']:<10.5f} | "
            f"pop_var/σ²={r['avg_pop_var']/dist.var:.4f} (th={bessel_expected:.4f})"
        )

    # 2. Variability Scaling Table
    print("\n[PART 2] VARIABILITY OF ESTIMATORS ACROSS HACKERS VS SYSTEM SIZE n")
    print(f"{'n':<6} | {'Var(x̄) Empirical':<18} | {'Var(x̄) Theoretical (σ²/n)':<26} | {'Var(s²) Empirical':<18} | {'Var(s²) Theory':<16}")
    print("-" * 90)
    for r in results:
        print(
            f"{r['n']:<6d} | "
            f"{r['var_of_means']:<18.6f} | "
            f"{r['th_var_of_means']:<26.6f} | "
            f"{r['var_of_vars']:<18.6f} | "
            f"{r['th_var_of_vars']:<16.6f}"
        )

    print("\n" + "=" * 90)
    print("THEORETICAL SYNTHESIS & INFERENTIAL CONCLUSIONS:")
    print("=" * 90)
    print("1. UNBIASEDNESS (Law of Large Numbers across m hackers):")
    print(f"   • As m -> ∞, average sampling mean converges exactly to μ = {dist.mu:.4f}.")
    print(f"   • Average sample variance s² (with n-1 divisor) converges exactly to σ² = {dist.var:.4f}.")
    print("   • Without Bessel's correction (using n divisor), variance is underestimated by (n-1)/n.")
    print("\n2. INFERENTIAL UTILITY (Single-Sample Reality):")
    print("   • In real-world security audits, we only observe ONE hacker's trajectory (one sample of size n).")
    print("   • Unbiasedness guarantees our estimates of target system difficulty (mean) and vulnerability")
    print("     dispersion (variance) have zero systematic skew.")
    print("   • By the Central Limit Theorem, x̄ ~ N(μ, s²/n), allowing rigorous confidence intervals and hypothesis tests.")
    print("\n3. ASYMPTOTIC VARIABILITY SCALING WITH n:")
    print("   • Var(x̄) = σ² / n  ==> Sampling mean variability shrinks strictly at rate O(1/n).")
    print("   • Var(s²) ≈ (μ₄ - σ⁴) / n ==> Sampling variance variability also shrinks at rate O(1/n).")
    print("   • Doubling the number of tested systems n halves the variance of both estimators,")
    print("     yielding substantially sharper, tighter inference about system resilience.")
    print("=" * 90)


def run_tests_and_demonstrations():
    """Run verification tests, numerical stability benchmarks, and hacker experiment."""
    print("=" * 72)
    print("WELFORD'S RECURRENCE ALGORITHM FOR ONLINE MEAN & VARIANCE")
    print("=" * 72)

    # 1. Standard Dataset Verification
    test_data = [4.0, 7.0, 13.0, 16.0]
    print(f"\n1. STANDARD TEST DATA: {test_data}")

    w_mean, w_var, w_pvar, w_ss = welford_core_example(test_data)
    py_mean = statistics.mean(test_data)
    py_var = statistics.variance(test_data)
    py_pvar = statistics.pvariance(test_data)

    print(f"  • Mean:                 Welford={w_mean:<10.4f} Python={py_mean:<10.4f}")
    print(f"  • Sample Variance (s²): Welford={w_var:<10.4f} Python={py_var:<10.4f}")
    print(f"  • Pop. Variance (σ²):   Welford={w_pvar:<10.4f} Python={py_pvar:<10.4f}")
    print(f"  • Sum of Squares (SS):  Welford={w_ss:<10.4f} Expected=90.0000")

    assert math.isclose(w_mean, py_mean), "Mean mismatch!"
    assert math.isclose(w_var, py_var), "Sample variance mismatch!"
    assert math.isclose(w_pvar, py_pvar), "Population variance mismatch!"
    print("  ✓ Verification against Python `statistics` PASSED!")

    # 2. Catastrophic Cancellation Demonstration
    print("\n" + "-" * 72)
    print("2. NUMERICAL STABILITY: CATASTROPHIC CANCELLATION TEST")
    print("   Shift data by huge constant C = 10^9: [10^9+1, 10^9+2, 10^9+3, 10^9+4, 10^9+5]")
    print("   True variance is translation-invariant: Var(X + C) = Var(X) = 2.5000")
    print("-" * 72)

    offset = 1e9
    shifted_data = [offset + 1.0, offset + 2.0, offset + 3.0, offset + 4.0, offset + 5.0]

    _, naive_var, naive_ss = naive_one_pass_variance(shifted_data)
    _, welford_var, _, welford_ss = welford_core_example(shifted_data)
    true_var = statistics.variance(shifted_data)

    print(f"  • True Expected Variance: {true_var:.6f}")
    print(f"  • Welford's Variance:     {welford_var:.6f}  (Absolute Error: {abs(welford_var - true_var):.2e})")
    print(f"  • Naive Formula Variance: {naive_var:.6f}  (Absolute Error: {abs(naive_var - true_var):.2e})")
    print(f"  • Naive Formula SS:       {naive_ss:.6f}  (Expected SS: 10.0000)")

    if abs(naive_var - true_var) > 1.0:
        print("\n  [!] CRITICAL NUMERICAL FAILURE OBSERVED IN NAIVE FORMULA:")
        print("      The naive formula suffered 100% loss of precision (catastrophic cancellation)")
        print("      due to subtracting two massive floating-point numbers: sum(x^2) - (sum(x))^2 / n.")
        print("      Welford's recurrence avoided this entirely and achieved exact precision!")

    # 3. Object-Oriented Streaming Accumulator & Map-Reduce Merge
    print("\n" + "-" * 72)
    print("3. PARALLEL / DISTRIBUTED ACCUMULATOR MERGE TEST (Chan et al., 1979)")
    print("-" * 72)

    chunk1 = [1.0, 2.0, 3.0, 4.0, 5.0]
    chunk2 = [6.0, 7.0, 8.0, 9.0, 10.0]
    combined = chunk1 + chunk2

    acc1 = WelfordAccumulator()
    acc1.update_batch(chunk1)

    acc2 = WelfordAccumulator()
    acc2.update_batch(chunk2)

    acc1.merge(acc2)

    expected_combined_var = statistics.variance(combined)
    print(f"  • Combined stream mean:     {acc1.mean:.4f} (Expected: {statistics.mean(combined):.4f})")
    print(f"  • Combined stream variance: {acc1.variance:.4f} (Expected: {expected_combined_var:.4f})")
    assert math.isclose(acc1.variance, expected_combined_var), "Merge variance mismatch!"
    print("  ✓ Parallel accumulator merge PASSED!")

    # 4. Hacker Penetration Experiment
    sim_data = simulate_hacker_penetration(
        m_hackers=1000,
        n_systems_list=[10, 25, 50, 100, 250, 500, 1000],
        dist_name="binomial",
        seed=42
    )
    print_penetration_experiment_report(sim_data)


if __name__ == "__main__":
    run_tests_and_demonstrations()
