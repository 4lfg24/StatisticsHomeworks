# StatisticsHomeworks

Interactive research suites and computational laboratories for Statistics and Cryptography coursework.

## Directory Structure & Assignments

- **[HMWK1](HMWK1/index.html)**: Elliptic-Curve Scalar Multiplication Lab (secp256k1 over $\mathbb{F}_{17}$ and $\mathbb{R}$, Double-and-Add Algorithm, Statistical Exploration & Avalanche Criterion).
- **[HMWK2](HMWK2/index.html)**: Ethereum Wallet Cryptographic Pipeline (BIP-39 Mnemonic Seed, BIP-32/BIP-44 Hierarchical Key Trees, secp256k1 Public Key Derivation, Keccak-256 Hashing, EIP-55 Checksumming, and Statistical Uniformity).
- **[HMWK3](HMWK3/index.html)**: **Homework (2) — Cryptographic Foundations & Statistical Cryptanalysis**:
  - **[Task 1: Dual Encryption Lab](HMWK3/task1.html)** (`task1.html`, `task1.css`, `task1.js`):
    - Comparative study of the **Caesar Cipher** (symmetric monoalphabetic shift) vs **Toy secp256k1 ECC Scheme** ($y^2 \equiv x^3 + 7 \pmod{17}$, base point $G=(1,5)$, target key $k=6 \to Q=(5,8)$).
    - Point-based EC-ElGamal and ECDH keystream masking paradigms.
    - Real-time unigram letter frequency comparison and Shannon entropy metrics.
    - Rigorous analysis of procedures, key roles, key spaces ($|\mathcal{K}|=26$ vs $2^{256}$), and statistical resistance.
  - **[Task 2: Caesar Cryptanalysis](HMWK3/task2.html)** (`task2.html`, `task2.css`, `task2.js`):
    - Statistical frequency attack exploiting non-uniform letter distributions in natural languages (English, Italian, Spanish, Latin).
    - Multi-algorithm benchmark: **Chi-Squared ($\chi^2$) Goodness-of-Fit Test**, **Frequency Cross-Correlation / Dot-Product**, **Argmax Peak Matching**, and **Index of Coincidence (IoC)**.
    - Automated Monte Carlo empirical experiment testing success rates across sample lengths $N \in [5, 500]$.
    - Analysis of Shannon's Unicity Distance, sample variance, lipograms (*Gadsby*), and cross-language limitations.
  - **[Task 3: Restricted-Keyspace ECC Attack & Security Scaling](HMWK3/task3.html)** (`task3.html`, `task3.css`, `task3.js`):
    - Solving the Elliptic Curve Discrete Logarithm Problem (ECDLP) on restricted key spaces ($k \in [1, 18]$).
    - Implementation of **Linear Exhaustive Brute-Force** ($O(K)$), **Baby-Step Giant-Step (BSGS)** ($O(\sqrt{K})$ time and space), and **Pollard's Rho Algorithm** ($O(\sqrt{K})$ time, $O(1)$ space).
    - Live attack console with candidate verification, operation counter, and instant ciphertext decryption.
    - Security scaling calculator from 4-bit toy curve to 256-bit secp256k1 (proving standard ECC requires $\approx 18.2$ billion years across the entire global Bitcoin network).
    - Analysis of structural vulnerabilities: Pohlig-Hellman attack on composite order ($n=18=2 \times 3^2$), small subgroup confinement, and ciphertext malleability.

## How to Run

Open any of the HTML files directly in your web browser, or serve locally using any standard static file server:

```bash
python3 -m http.server 8000
```

Then visit:
- Home Hub: `http://localhost:8000/HMWK3/index.html`
- Task 1: `http://localhost:8000/HMWK3/task1.html`
- Task 2: `http://localhost:8000/HMWK3/task2.html`
- Task 3: `http://localhost:8000/HMWK3/task3.html`
