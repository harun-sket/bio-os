/**
 * Bio-Kernel: In-Silico Biophysical Validation & Dual Leash Engine
 * ===============================================================
 * Fail-Closed biological verification kernel for synthetic DNA.
 * Implements Crick triplet reading frame arithmetic, GC bounds,
 * Shannon entropy, in-silico translation, and Dual Canonical Leash Hashing.
 *
 * Zero external dependencies: pure Node.js crypto.
 * Designed to run smoothly on Android Termux (ARM64) and E2B MicroVMs.
 *
 * A HYNAWEB component · Dedicated to Harun & young builders.
 */

import crypto from 'crypto';

// Universal Genetic Codon Translation Table
export const CODON_TABLE = {
  'ATA':'I', 'ATC':'I', 'ATT':'I', 'ATG':'M', 'ACA':'T', 'ACC':'T', 'ACG':'T', 'ACT':'T',
  'AAC':'N', 'AAT':'N', 'AAA':'K', 'AAG':'K', 'AGC':'S', 'AGT':'S', 'AGA':'R', 'AGG':'R',
  'CTA':'L', 'CTC':'L', 'CTG':'L', 'CTT':'L', 'CCA':'P', 'CCC':'P', 'CCG':'P', 'CCT':'P',
  'CAC':'H', 'CAT':'H', 'CAA':'Q', 'CAG':'Q', 'CGA':'R', 'CGC':'R', 'CGG':'R', 'CGT':'R',
  'GTA':'V', 'GTC':'V', 'GTG':'V', 'GTT':'V', 'GCA':'A', 'GCC':'A', 'GCG':'A', 'GCT':'A',
  'GAC':'D', 'GAT':'D', 'GAA':'E', 'GAG':'E', 'GGA':'G', 'GGC':'G', 'GGG':'G', 'GGT':'G',
  'TCA':'S', 'TCC':'S', 'TCG':'S', 'TCT':'S', 'TTC':'F', 'TTT':'F', 'TTA':'L', 'TTG':'L',
  'TAC':'Y', 'TAT':'Y', 'TAA':'*', 'TAG':'*', 'TGC':'C', 'TGT':'C', 'TGA':'*', 'TGG':'W'
};

export const STOP_CODONS = ['TAA', 'TAG', 'TGA'];
export const START_CODON = 'ATG';

/**
 * Translates a normalized DNA sequence into an amino acid peptide chain.
 * @param {string} sequence Normalized uppercase DNA string
 * @returns {string} Translated amino acid sequence
 */
export function translateDNA(sequence) {
  let protein = '';
  for (let i = 0; i < sequence.length - 2; i += 3) {
    const codon = sequence.slice(i, i + 3);
    protein += CODON_TABLE[codon] || '?';
  }
  return protein;
}

/**
 * Validates Crick's triplet reading frame (modulo 3 arithmetic).
 * Fails closed if length % 3 !== 0 (orphan nucleotides causing frameshift).
 * @param {string} sequence
 * @returns {{ valid: boolean, remainder: number, error: string|null }}
 */
export function validateReadingFrame(sequence) {
  const remainder = sequence.length % 3;
  if (remainder !== 0) {
    return {
      valid: false,
      remainder,
      error: `Broken reading frame (Frameshift Defect): Sequence length (${sequence.length} bp) is not a multiple of 3. ${remainder} orphan base(s) detected at 3' terminus.`
    };
  }
  return { valid: true, remainder: 0, error: null };
}

/**
 * Computes biophysical complexity metrics (GC Content, Shannon Entropy, Homopolymer Run).
 * Detects repetitive low-complexity hallucinations common in generative tokenizers.
 * @param {string} sequence
 * @returns {{ gcPercent: number, shannonEntropy: number, maxHomopolymer: number, isRepetitive: boolean }}
 */
export function computeBiophysicalMetrics(sequence) {
  const len = sequence.length;
  if (len === 0) {
    return { gcPercent: 0, shannonEntropy: 0, maxHomopolymer: 0, isRepetitive: false };
  }

  // 1. GC Content
  const gcCount = (sequence.match(/[GC]/g) || []).length;
  const gcPercent = (gcCount / len) * 100;

  // 2. Shannon Entropy in bits (max 2.0 bits for 4 equiprobable nucleotides)
  const counts = { A: 0, T: 0, C: 0, G: 0 };
  for (let i = 0; i < len; i++) {
    const base = sequence[i];
    if (counts[base] !== undefined) counts[base]++;
  }

  let entropy = 0.0;
  for (const b of ['A', 'T', 'C', 'G']) {
    if (counts[b] > 0) {
      const p = counts[b] / len;
      entropy -= p * Math.log2(p);
    }
  }

  // 3. Longest Homopolymer Run (e.g. AAAAAAAA)
  let maxHomopolymer = 1;
  let currentRun = 1;
  for (let i = 1; i < len; i++) {
    if (sequence[i] === sequence[i - 1]) {
      currentRun++;
      if (currentRun > maxHomopolymer) maxHomopolymer = currentRun;
    } else {
      currentRun = 1;
    }
  }

  const isRepetitive = entropy < 1.30 || maxHomopolymer >= 8;

  return {
    gcPercent: Number(gcPercent.toFixed(1)),
    shannonEntropy: Number(entropy.toFixed(3)),
    maxHomopolymer,
    isRepetitive
  };
}

/**
 * Generates the Dual Canonical Leash Token.
 * Binds the nucleotide sequence hash to the translated protein peptide hash.
 * Neutralizes synonymous codon bypass attacks.
 * @param {string} sequence Normalized DNA string
 * @param {string} protein Translated peptide string
 * @returns {{ dnaHash: string, proteinHash: string, leashToken: string }}
 */
export function computeDualLeashToken(sequence, protein) {
  const cleanDna = sequence.trim().toUpperCase();
  // Strip trailing stop marker for protein hash normalization
  const cleanProtein = protein.replace(/\*+$/, '').trim();

  const dnaHash = crypto.createHash('sha256').update(cleanDna).digest('hex');
  const proteinHash = crypto.createHash('sha256').update(cleanProtein).digest('hex');

  // Compound invariant hash
  const leashToken = crypto.createHash('sha256')
    .update(`${dnaHash}:${proteinHash}`)
    .digest('hex');

  return {
    dnaHash,
    proteinHash,
    leashToken: `0x${leashToken.slice(0, 16)}`
  };
}

/**
 * Comprehensive Bio-Kernel evaluation pipeline.
 * Evaluates the 6 fail-closed gates and returns a structured verdict.
 * @param {string} rawSequence
 * @param {Object} options
 * @returns {Object} Evaluation report
 */
export function evaluateBioSequence(rawSequence, options = {}) {
  const isStrict = Boolean(options.strict);
  const sequence = String(rawSequence).toUpperCase().replace(/[\s\n\r]/g, '');

  const errors = [];
  const warnings = [];

  // Gate 1: Syntax Check
  if (!sequence || !/^[ATCG]+$/.test(sequence)) {
    return {
      success: false,
      isSafe: false,
      status: 'BLOCKED_INVALID_SYNTAX',
      error: 'CRITICAL ERROR: Invalid DNA syntax. Only A, T, C, G allowed.',
      sequence,
      length: sequence.length
    };
  }

  // Gate 2: Reading Frame (Crick Modulo 3)
  const frameCheck = validateReadingFrame(sequence);
  if (!frameCheck.valid) {
    errors.push(frameCheck.error);
  }

  // Gate 3: Start & Stop Codons
  const hasStartCodon = sequence.startsWith(START_CODON);
  if (!hasStartCodon) {
    errors.push('Missing Start Codon (ATG). Ribosome will not bind.');
  }

  const lastCodon = sequence.length >= 3 ? sequence.slice(-3) : '';
  const hasStopCodon = STOP_CODONS.includes(lastCodon);
  if (!hasStopCodon) {
    if (isStrict) {
      errors.push('Missing canonical Stop Codon (TAA, TAG, TGA). Strict mode rejects incomplete polypeptides.');
    } else {
      warnings.push('Missing Stop Codon. Protein chain may be incomplete.');
    }
  }

  // Gate 4: Biophysical Metrics (GC Content & Shannon Entropy)
  const metrics = computeBiophysicalMetrics(sequence);
  if (metrics.gcPercent < 20.0 || metrics.gcPercent > 80.0) {
    if (isStrict) {
      errors.push(`Extreme GC Content (${metrics.gcPercent}%). Unstable hybridization boundary.`);
    } else {
      warnings.push(`Extreme GC Content (${metrics.gcPercent}%). Thermodynamic assembly may fail.`);
    }
  }

  if (metrics.isRepetitive) {
    if (isStrict) {
      errors.push(`Low-complexity repetitive DNA (Entropy: ${metrics.shannonEntropy} bits, Homopolymer run: ${metrics.maxHomopolymer}). Probable tokenizer hallucination.`);
    } else {
      warnings.push(`Low-complexity repetitive sequence detected (Entropy: ${metrics.shannonEntropy} bits).`);
    }
  }

  // Gate 5: In-Silico Translation & Premature Stop Check
  const protein = translateDNA(sequence);
  const internalStops = protein.slice(0, -1).includes('*');
  if (internalStops) {
    errors.push('Premature stop codon found inside sequence. Truncated peptide.');
  }

  // Fail-Closed Gate Trigger
  const isSafe = errors.length === 0;

  // Gate 6: Dual Canonical Leash Token
  const tokens = computeDualLeashToken(sequence, protein);

  return {
    success: isSafe,
    isSafe,
    status: isSafe ? 'APPROVED_IN_SILICO' : 'BLOCKED_FAIL_CLOSED',
    sequence,
    length: sequence.length,
    protein,
    proteinLength: protein.length,
    metrics,
    hasStartCodon,
    hasStopCodon,
    tokens,
    errors,
    warnings
  };
}
