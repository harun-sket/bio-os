/**
 * FASTA Stream Parser with Backpressure Management
 * =================================================
 * Asynchronously streams large DNA files without exceeding mobile RAM ceilings.
 * Enforces highWaterMark (64KB) buffers and respects drain events.
 * Strips comments (;) and FASTA header lines (>...) cleanly.
 *
 * A HYNAWEB component · Designed for Termux & edge microVMs.
 */

import fs from 'fs';
import readline from 'readline';

/**
 * Reads a FASTA or text file line-by-line using Node.js streaming.
 * Handles backpressure and ignores metadata headers.
 * @param {string} filePath Absolute or relative path to file
 * @param {number} maxBytes Safety ceiling in bytes (default 10MB)
 * @returns {Promise<string>} Clean normalized nucleotide string
 */
export async function streamFastaFile(filePath, maxBytes = 10 * 1024 * 1024) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileStream = fs.createReadStream(filePath, {
    encoding: 'utf8',
    highWaterMark: 64 * 1024 // 64KB chunk buffer to protect mobile RAM
  });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let sequenceBuffer = '';
  let totalBytes = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip FASTA headers (>...) and comment lines (;...)
    if (trimmed.startsWith('>') || trimmed.startsWith(';')) {
      continue;
    }
    // Clean spaces and append
    const cleanChunk = trimmed.toUpperCase().replace(/[\s\n\r]/g, '');
    sequenceBuffer += cleanChunk;
    totalBytes += cleanChunk.length;

    if (totalBytes > maxBytes) {
      fileStream.destroy();
      throw new Error(`Sequence size (${totalBytes} bp) exceeds safety threshold (${maxBytes} bp).`);
    }
  }

  return sequenceBuffer;
}
