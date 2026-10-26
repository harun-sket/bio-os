# ⚠️ Bio-OS: Experimental Synthetic Biology Simulator

> Fail-closed in-silico sandbox and cryptographic leash for AI-generated DNA. A HYNAWEB product.

**DISCLAIMER: NOT FOR LAB OR MEDICAL USE.**  
This is a strictly educational and experimental software project. It is a computer science thought experiment demonstrating how a Fail-Closed architecture could be applied to biological code.

---

## 🥖 The Thesis

If an AI hallucinates writing JavaScript, a website crashes.  
If an AI hallucinates writing DNA, the consequences are catastrophic.

Bio-OS acts as an in-silico sandbox and cryptographic leash for AI-generated DNA sequences. If a sequence violates physical, modular, or translational rules, physical synthesis is denied immediately. Safety first. Always.

---

## ⚡ Quick Start

### 1. Install globally via NPM
```bash
npm install -g @hynaweb/bio-os
bio-os -s ATGGCCATTGTAATGGGCCGCGCAAAGGGTGCCCGATAA
```

### 2. Or run locally from source
```bash
git clone https://github.com/harun-sket/bio-os.git
cd bio-os
npm install
npm test
```

---

## 🧪 Test It

### Test 1: Valid In-Silico Synthesis
```bash
node index.js -f test_files/valid_peptide.fasta --strict
```
**Expected Output:**
```text
🧬 Booting Bio-Kernel...
📏 Sequence Length: 18 bp
---------------------------------------------
✅ Syntax Check: Valid nucleotide alphabet (A, T, C, G)
✅ Reading Frame: 6 complete triplet codons (Modulo-3 intact)
📊 GC Content: 38.9% | Shannon Entropy: 1.878 bits
✅ Start Codon (ATG) verified.
✅ Stop Codon verified at 3' terminus.
🧪 Simulated Protein Chain: MAGVL*... (Length: 6 aa)
---------------------------------------------
 🔒 BIO-LEASH TOKEN: 0x1fb2d715708e4c49 
   DNA Hash:     0xb8030dff6d7c6bcc
   Protein Hash: 0xd7244a0e97b6c8c9

✅ Status: APPROVED FOR IN-SILICO SANDBOX
```

### Test 2: Frameshift Defect (16 bp — Not a multiple of 3)
```bash
node index.js -f test_files/broken_frame.fasta
```
**Expected Output:**
```text
❌ CRITICAL ERROR: Broken reading frame (Frameshift Defect)
   Length 16 is not divisible by 3 (1 orphan bases)
🛑 BIO-LEASH ENGAGED: SYNTHESIS BLOCKED
[🛑] Sequence blocked by Bio-OS Leash. Physical synthesis denied.
```

### Test 3: Synonymous Codon Bypass Verification
```bash
node index.js -f test_files/valid_peptide.fasta --compare test_files/synonymous_variant.fasta
```
**Expected Output:**
```text
── SYNONYMOUS CODON BYPASS VERIFICATION ──
Primary DNA Hash:     0xb8030dff6d7c6bcc
Compared DNA Hash:    0x1530f75cc6061f02
Primary Protein Hash: 0xd7244a0e97b6c8c9
Compared Protein Hash:0xd7244a0e97b6c8c9

🛡️ INVARIANT VERIFIED: DNA hashes differ (mutated codons), but protein hashes are IDENTICAL.
   Dual Bio-Leash Token successfully neutralizes synonymous codon evasion attacks.
```

---

## 🧬 Bio-Kernel Architecture

```text
       RAW DNA / MULTI-LINE FASTA
                  │
                  ▼
     ┌────────────────────────┐
     │  1. SYNTAX & SANITIZE  │  --> Checks [ATCG], strips >FASTA headers
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ 2. READING FRAME MOD 3 │  --> Crick Triplet Check: Length % 3 === 0
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │  3. BIOPHYSICAL GATES  │  --> Start (ATG), Stop, GC% & Shannon Entropy
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ 4. TRANSLATION ENGINE  │  --> Ribosome map, blocks premature stops
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ 5. DUAL CANONICAL HASH │  --> SHA256(DNA) + SHA256(Protein)
     └───────────┬────────────┘
                 ▼
      🔒 BIO-LEASH TOKEN (0x...)
```

---

## 🛠️ Commands & Options

| Option | Flag | Description |
|---|---|---|
| Direct Sequence | `-s, --seq <string>` | Verify raw DNA string in terminal |
| File / FASTA | `-f, --file <path>` | Stream `.fasta` or `.dna` file with 64KB backpressure |
| Strict Mode | `--strict` | Fails closed on missing stop codon or extreme GC boundaries |
| JSON Output | `-j, --json` | Output machine-readable JSON for agents, CI/CD and LLMs |
| Compare Invariance | `--compare <target>` | Compare two sequences for synonymous codon evasion detection |

---

## 🛡️ Security: Why Dual Hashing Matters

In molecular biology, the genetic code is redundant: multiple codons translate to the exact same amino acid (for example, `GGA`, `GGC`, `GGG`, and `GGT` all encode Glycine).

An AI model or an adversary can mutate codons across a toxic gene to change its DNA hash and bypass naive blocklists, while expressing the exact same dangerous peptide.

Bio-OS computes a **Dual Canonical Leash Token**:
$$\text{Leash Token} = \text{SHA256}(\text{SHA256}(\text{DNA}) \mathbin{\Vert} \text{SHA256}(\text{Protein}))$$

If two sequences have completely different nucleotide sequences but produce the identical protein, their `Protein Hash` matches 100%, neutralizing the bypass attempt.

---

## ⚡ Edge & MicroVM Sandboxes

- **Android Termux (POCO C55 / ARM64):** Runs 100% offline with zero cloud API keys and uses stream backpressure (`highWaterMark: 64KB`) to prevent Out-Of-Memory (OOM) kills.
- **E2B Firecracker MicroVMs:** Includes `e2b/e2b.Dockerfile` to spin up isolated cloud sandboxes in 5 seconds on [HynaStage](https://hackerstage.netlify.app/).
- **Cloud Notebooks:** Runnable benchmarks available in `notebooks/` for Kaggle CPU and Google Colab Pro.

---

## 📜 License

This is proprietary software owned by HYNAWEB. All rights reserved.  
See [LICENSE](./LICENSE) for full educational terms.

---

## 👨‍💻 Author

Harun · HYNAWEB · built on a POCO C55  
Research & Verification Partner: Jean-Sébastien Beaulieu (SecuredMe Suite)
