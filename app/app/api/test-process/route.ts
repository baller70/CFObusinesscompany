import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processStatement } from '@/lib/statement-processor';

export async function GET() {
  try {
    // Get pending statements
    const statements = await prisma.bankStatement.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { fileName: 'Personal Statement_Sep_11_2025.pdf' },
          { fileName: 'Business Statement_Jan_8_2024.pdf' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const results = [];

    for (const statement of statements) {
      console.log(`\n=== Processing ${statement.fileName} ===`);
      try {
        await processStatement(statement.id);
        results.push({
          fileName: statement.fileName,
          status: 'success'
        });
        console.log(`✓ Successfully processed ${statement.fileName}`);
      } catch (error) {
        results.push({
          fileName: statement.fileName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`✗ Failed to process ${statement.fileName}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Test process error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
