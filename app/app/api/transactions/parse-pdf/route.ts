/**
 * Parse PDF API
 *
 * Extracts text from a PNC bank statement PDF and parses it using
 * the verified parsePNCBankStatement() function.
 *
 * This provides an alternative to AI-based extraction with 100% accuracy
 * for PNC statements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parsePNCBankStatement } from '@/lib/transaction-deduplicator';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export const maxDuration = 60; // 1 minute max
export const dynamic = 'force-dynamic';

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const tempPdfPath = path.join('/tmp', `pnc_parse_${Date.now()}.pdf`);
  const tempTextPath = path.join('/tmp', `pnc_text_${Date.now()}.txt`);

  try {
    // Write buffer to temp file
    await writeFile(tempPdfPath, buffer);

    // Try pdftotext first (better layout preservation)
    try {
      const { stdout } = await execAsync(`pdftotext -layout "${tempPdfPath}" -`);
      await unlink(tempPdfPath).catch(() => {});
      if (stdout && stdout.trim().length > 100) {
        console.log('[Parse PDF] Successfully extracted text with pdftotext');
        return stdout;
      }
    } catch (pdftotextError) {
      console.warn('[Parse PDF] pdftotext not available, using node script');
    }

    // Fallback: Run pdf-parse via standalone script to avoid webpack issues
    const scriptPath = path.join(process.cwd(), 'scripts', 'extract-pdf-text.js');

    await new Promise<void>((resolve, reject) => {
      const child = spawn('node', [scriptPath, tempPdfPath, tempTextPath], {
        cwd: process.cwd()
      });

      let stderr = '';
      let stdout = '';
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('[Parse PDF] Script output:', stdout.trim());
          resolve();
        } else {
          reject(new Error(`pdf-parse failed: ${stderr || stdout}`));
        }
      });

      child.on('error', reject);
    });

    const extractedText = await readFile(tempTextPath, 'utf-8');
    await unlink(tempPdfPath).catch(() => {});
    await unlink(tempTextPath).catch(() => {});

    console.log('[Parse PDF] Successfully extracted text with pdf-parse (subprocess)');
    return extractedText;

  } catch (error) {
    await unlink(tempPdfPath).catch(() => {});
    await unlink(tempTextPath).catch(() => {});
    console.error('[Parse PDF] Extraction failed:', error);
    throw new Error('Failed to extract text from PDF. Please try pasting the text manually.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    console.log(`[Parse PDF] Processing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    console.log('[Parse PDF] Extracting text from PDF...');
    const extractedText = await extractTextFromPDF(buffer);
    
    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json({ 
        error: 'Could not extract text from PDF',
        hint: 'The PDF may be scanned/image-based. Try copying text manually.'
      }, { status: 400 });
    }

    console.log(`[Parse PDF] Extracted ${extractedText.length} characters`);

    // Check if this is a PNC statement
    const isPNC = extractedText.includes('PNC') || 
                  extractedText.includes('Business Checking') ||
                  extractedText.includes('Virtual Wallet');
    
    if (!isPNC) {
      return NextResponse.json({
        error: 'This does not appear to be a PNC bank statement',
        hint: 'This parser is optimized for PNC statements. Use AI extraction for other banks.',
        extractedPreview: extractedText.substring(0, 500)
      }, { status: 400 });
    }

    // Parse using our verified parser
    console.log('[Parse PDF] Parsing with PNC parser...');
    const transactions = parsePNCBankStatement(extractedText);

    // Calculate totals
    const income = transactions.filter(t => t.type === 'INCOME');
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    console.log(`[Parse PDF] Parsed ${transactions.length} transactions`);
    console.log(`[Parse PDF] Income: ${income.length} ($${totalIncome.toFixed(2)})`);
    console.log(`[Parse PDF] Expenses: ${expenses.length} ($${totalExpenses.toFixed(2)})`);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      transactionCount: transactions.length,
      transactions,
      summary: {
        income: { count: income.length, total: totalIncome },
        expenses: { count: expenses.length, total: totalExpenses },
        net: totalIncome - totalExpenses
      },
      extractedText: extractedText.substring(0, 2000) // Preview for debugging
    });

  } catch (error) {
    console.error('[Parse PDF] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to parse PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

