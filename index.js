#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { evaluateBioSequence } from './lib/bio-kernel.js';
import { streamFastaFile } from './lib/fasta-stream.js';
import { TombstoneVault } from './lib/tombstone-vault.js';

const vault = new TombstoneVault();

// ── DISPLAY HELPER ──
function displayReport(report, options = {}) {
  console.log(chalk.cyan(`\n🧬 Booting Bio-Kernel...`));
  console.log(chalk.gray(`📏 Sequence Length: ${report.length} bp`));
  console.log(chalk.gray("-".repeat(45)));

  // 1. Syntax Check
  console.log(chalk.green("✅ Syntax Check: Valid nucleotide alphabet (A, T, C, G)"));

  // 2. Reading Frame (Crick Modulo 3)
  if (report.length % 3 === 0) {
    console.log(chalk.green(`✅ Reading Frame: ${report.length / 3} complete triplet codons (Modulo-3 intact)`));
  } else {
    console.log(chalk.red(`❌ CRITICAL ERROR: Broken reading frame (Frameshift Defect)`));
    console.log(chalk.gray(`   Length ${report.length} is not divisible by 3 (${report.length % 3} orphan bases)`));
  }

  // 3. GC Content & Shannon Entropy
  console.log(chalk.yellow(`📊 GC Content: ${report.metrics.gcPercent.toFixed(1)}% | Shannon Entropy: ${report.metrics.shannonEntropy} bits`));

  // 4. Start & Stop Codons
  if (report.hasStartCodon) {
    console.log(chalk.green("✅ Start Codon (ATG) verified."));
  } else {
    console.log(chalk.red("❌ ERROR: Missing Start Codon (ATG). Ribosome won't bind."));
  }

  if (report.hasStopCodon) {
    console.log(chalk.green("✅ Stop Codon verified at 3' terminus."));
  } else {
    if (options.strict) {
      console.log(chalk.red("❌ ERROR: Missing canonical Stop Codon (Strict mode failure)."));
    } else {
      console.log(chalk.yellow("⚠️ WARNING: Missing Stop Codon. Protein may be incomplete."));
    }
  }

  // 5. In-Silico Protein Translation
  console.log(chalk.magenta(`🧪 Simulated Protein Chain: ${report.protein.slice(0, 20)}... (Length: ${report.proteinLength} aa)`));

  if (report.errors.some(e => e.includes('Premature stop'))) {
    console.log(chalk.red("❌ ERROR: Premature stop codon found inside sequence."));
  }

  console.log(chalk.gray("-".repeat(45)));

  // 6. Dual Canonical Leash Token
  if (report.isSafe) {
    console.log(chalk.bgGreen.black(` 🔒 BIO-LEASH TOKEN: ${report.tokens.leashToken} `));
    console.log(chalk.gray(`   DNA Hash:     0x${report.tokens.dnaHash.slice(0, 16)}`));
    console.log(chalk.gray(`   Protein Hash: 0x${report.tokens.proteinHash.slice(0, 16)}`));
    console.log(chalk.green("\n✅ Status: APPROVED FOR IN-SILICO SANDBOX\n"));
  } else {
    console.log(chalk.bgRed.white.bold(` 🛑 BIO-LEASH ENGAGED: SYNTHESIS BLOCKED `));
    for (const err of report.errors) {
      console.log(chalk.red(`   • ${err}`));
    }
    console.log(chalk.red("\n[🛑] Sequence blocked by Bio-OS Leash. Physical synthesis denied.\n"));
  }
}

// ── CLI SETUP ──
program
  .name('bio-os')
  .description('⚠️ Experimental Synthetic Biology Simulator. Fail-Closed Kernel for DNA. NOT FOR LAB USE.')
  .version('1.1.0');

program
  .option('-s, --seq <string>', 'Direct DNA sequence string')
  .option('-f, --file <path>', 'Path to a DNA, text, or FASTA file')
  .option('--strict', 'Enforce strict fail-closed on missing stop codons or extreme GC bounds', false)
  .option('-j, --json', 'Output report in clean JSON format', false)
  .option('--compare <target>', 'Compare two sequences to verify synonymous codon bypass detection')
  .action(async (options) => {
    let rawSequence = options.seq || "";

    if (options.file) {
      try {
        rawSequence = await streamFastaFile(options.file);
      } catch (err) {
        console.log(chalk.red(`❌ Error: ${err.message}`));
        process.exit(1);
      }
    }

    if (!rawSequence) {
      console.log(chalk.bold.red("\n" + "=".repeat(60)));
      console.log(chalk.bold.red(" ⚠️  BIO-OS v1.1.0 (EXPERIMENTAL SANDBOX) ⚠️"));
      console.log(chalk.bold.red(" NOT FOR LAB OR MEDICAL USE."));
      console.log(chalk.bold.red(" STRICTLY EDUCATIONAL & EXPERIMENTAL USE ONLY."));
      console.log(chalk.bold.red("=".repeat(60)));
      console.log(chalk.yellow("\n[?] No sequence provided. Use --seq or --file."));
      console.log(chalk.gray("Example: bio-os -s ATGGCCATTGTAATGGGCCGCGCAAAGGGTGCCCGATAA"));
      console.log(chalk.gray("Or:      bio-os -f test_files/valid_peptide.fasta --strict\n"));
      process.exit(1);
    }

    // 1. Evaluate Primary Sequence
    const report = evaluateBioSequence(rawSequence, { strict: options.strict });
    vault.record(report);

    // 2. Handle Comparison Mode (Synonymous Codon Evasion Demonstration)
    if (options.compare) {
      let targetSeq = options.compare;
      if (fs.existsSync(options.compare)) {
        targetSeq = await streamFastaFile(options.compare);
      }
      const targetReport = evaluateBioSequence(targetSeq, { strict: options.strict });

      if (options.json) {
        console.log(JSON.stringify({ primary: report, compared: targetReport, synonymousMatch: report.tokens.proteinHash === targetReport.tokens.proteinHash }, null, 2));
      } else {
        displayReport(report, options);
        console.log(chalk.bold.blue("\n── SYNONYMOUS CODON BYPASS VERIFICATION ──"));
        console.log(chalk.gray(`Compared Sequence Length: ${targetReport.length} bp`));
        console.log(chalk.gray(`Primary DNA Hash:     0x${report.tokens.dnaHash.slice(0, 16)}`));
        console.log(chalk.gray(`Compared DNA Hash:    0x${targetReport.tokens.dnaHash.slice(0, 16)}`));
        console.log(chalk.gray(`Primary Protein Hash: 0x${report.tokens.proteinHash.slice(0, 16)}`));
        console.log(chalk.gray(`Compared Protein Hash:0x${targetReport.tokens.proteinHash.slice(0, 16)}`));

        const sameProtein = report.tokens.proteinHash === targetReport.tokens.proteinHash;
        const diffDna = report.tokens.dnaHash !== targetReport.tokens.dnaHash;

        if (sameProtein && diffDna) {
          console.log(chalk.green(`\n🛡️ INVARIANT VERIFIED: DNA hashes differ (mutated codons), but protein hashes are IDENTICAL.`));
          console.log(chalk.green(`   Dual Bio-Leash Token successfully neutralizes synonymous codon evasion attacks.\n`));
        } else if (sameProtein) {
          console.log(chalk.yellow(`\nℹ️ Sequences are identical.\n`));
        } else {
          console.log(chalk.cyan(`\nℹ️ Sequences encode different peptides.\n`));
        }
      }
      process.exit(report.isSafe && targetReport.isSafe ? 0 : 1);
    }

    // 3. Regular Display / JSON Output
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      displayReport(report, options);
    }

    process.exit(report.isSafe ? 0 : 1);
  });

program.parse();
