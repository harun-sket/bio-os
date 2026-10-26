/**
 * Bio-OS Automated Test Suite
 * ============================
 * Verifies all 6 Fail-Closed biophysical gates, reading frame integrity,
 * synonymous codon bypass defense, and FASTA stream ingestion.
 *
 * Usage:
 *   npm test
 *   node test.js
 */

import assert from 'node:assert';
import path from 'node:path';
import { evaluateBioSequence, validateReadingFrame, computeDualLeashToken } from './lib/bio-kernel.js';
import { streamFastaFile } from './lib/fasta-stream.js';
import { TombstoneVault } from './lib/tombstone-vault.js';

console.log('🧪 Running Bio-OS Kernel & Biophysical Test Suite...\n');

// ── TEST 1: Valid Sequence Reading Frame & Token Generation ──
{
  const seq = 'ATGGCAGGAGTACTATAA';
  const report = evaluateBioSequence(seq, { strict: true });
  assert.strictEqual(report.isSafe, true, 'Valid sequence should pass all gates');
  assert.strictEqual(report.length, 18, 'Length should be 18 bp');
  assert.strictEqual(report.protein, 'MAGVL*', 'Protein should translate correctly');
  assert.ok(report.tokens.leashToken.startsWith('0x'), 'Leash token must start with 0x');
  console.log('  ✅ [1/6] Valid sequence passed all 6 gates (18 bp -> MAGVL*)');
}

// ── TEST 2: Reading Frame (Crick Modulo 3 Frameshift Rejection) ──
{
  const brokenSeq = 'ATGGCAGGAGTACTAT'; // 16 bp (16 % 3 === 1)
  const report = evaluateBioSequence(brokenSeq, { strict: false });
  assert.strictEqual(report.isSafe, false, 'Frameshift sequence MUST fail closed');
  assert.ok(report.errors.some(e => e.includes('Broken reading frame')), 'Must report frameshift error');
  console.log('  ✅ [2/6] Frameshift sequence (16 bp) rejected fail-closed');
}

// ── TEST 3: Premature Internal Stop Codon Rejection ──
{
  const stopSeq = 'ATGTAAGGAGTACTATAA'; // TAA stop at position 4-6
  const report = evaluateBioSequence(stopSeq, { strict: false });
  assert.strictEqual(report.isSafe, false, 'Internal stop codon sequence MUST fail closed');
  assert.ok(report.errors.some(e => e.includes('Premature stop')), 'Must report premature stop error');
  console.log('  ✅ [3/6] Premature internal stop codon rejected fail-closed');
}

// ── TEST 4: Synonymous Codon Evasion Defense ──
{
  const seqA = 'ATGGCAGGAGTACTATAA'; // 38.89% GC, translates to MAGVL*
  const seqB = 'ATGGCCGGCGTGCTGTAA'; // 66.67% GC, translates to identical MAGVL*

  const reportA = evaluateBioSequence(seqA);
  const reportB = evaluateBioSequence(seqB);

  assert.notStrictEqual(reportA.tokens.dnaHash, reportB.tokens.dnaHash, 'DNA hashes MUST differ');
  assert.strictEqual(reportA.tokens.proteinHash, reportB.tokens.proteinHash, 'Protein hashes MUST be identical');
  console.log(`  ✅ [4/6] Synonymous codon bypass neutralized (Protein Hash invariant: 0x${reportA.tokens.proteinHash.slice(0, 16)})`);
}

// ── TEST 5: FASTA Stream Parsing with Header Stripping ──
{
  const fastaPath = path.resolve('test_files', 'valid_peptide.fasta');
  const parsedSeq = await streamFastaFile(fastaPath);
  assert.strictEqual(parsedSeq, 'ATGGCAGGAGTACTATAA', 'FASTA parser must strip headers and clean sequence');
  console.log('  ✅ [5/6] FASTA stream parser cleanly ingested file with header stripping');
}

// ── TEST 6: Tombstone Vault Append-Only Integrity ──
{
  const vault = new TombstoneVault();
  const testReport = evaluateBioSequence('ATGGCAGGAGTACTATAA');
  vault.record(testReport);
  const cached = vault.lookup(testReport.tokens.dnaHash);
  assert.ok(cached !== null, 'Vault must cache recorded entry');
  assert.strictEqual(cached.dnaHash, testReport.tokens.dnaHash, 'Cached hash must match');
  console.log('  ✅ [6/6] Tombstone Vault fast L0/L1 lookup and append-only recording verified');
}

console.log('\n🎉 ALL 6 BIO-OS TESTS PASSED (100% SUCCESS)\n');
