
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get statement ID from query params
    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { success: false, error: 'Statement ID is required' },
        { status: 400 }
      );
    }

    // Get the bank statement
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: {
        transactions: true
      }
    });

    if (!statement) {
      return NextResponse.json(
        { success: false, error: 'Statement not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (statement.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this statement' },
        { status: 403 }
      );
    }

    // Delete from S3 if there's a file
    if (statement.cloudStoragePath) {
      try {
        await deleteFile(statement.cloudStoragePath);
        console.log(`[Delete] Deleted file from S3: ${statement.cloudStoragePath}`);
      } catch (error) {
        console.error('[Delete] Error deleting file from S3:', error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete transactions first (due to foreign key constraints)
    if (statement.transactions && statement.transactions.length > 0) {
      await prisma.transaction.deleteMany({
        where: { bankStatementId: statementId }
      });
      console.log(`[Delete] Deleted ${statement.transactions.length} transactions`);
    }

    // Delete the bank statement
    await prisma.bankStatement.delete({
      where: { id: statementId }
    });

    console.log(`[Delete] Successfully deleted bank statement: ${statement.fileName}`);

    return NextResponse.json({
      success: true,
      message: 'Bank statement deleted successfully',
      deletedStatement: {
        id: statement.id,
        fileName: statement.fileName,
        transactionsDeleted: statement.transactions?.length || 0
      }
    });

  } catch (error) {
    console.error('[Delete] Error deleting bank statement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete bank statement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
