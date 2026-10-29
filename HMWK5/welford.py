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
"""

import math
import statistics
from typing import Iterable, Tuple, Optional


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


def run_tests_and_demonstrations():
    """Run verification tests and numerical stability benchmarks."""
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

    print("\n" + "=" * 72)
    print("ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 72)


if __name__ == "__main__":
    run_tests_and_demonstrations()
