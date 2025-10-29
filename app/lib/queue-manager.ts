
import { prisma } from '@/lib/db';

// Queue manager for processing bank statements
class QueueManager {
  private static instance: QueueManager;
  private processingQueue: Set<string> = new Set();
  private maxConcurrent = 3; // Process 3 statements at a time
  private isProcessing = false;

  private constructor() {}

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  async addToQueue(statementId: string): Promise<void> {
    console.log(`[Queue] Adding statement ${statementId} to queue`);
    
    // Mark as queued
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'QUEUED',
        status: 'PENDING'
      }
    });

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;
    console.log('[Queue] Starting queue processor');

    try {
      while (true) {
        // Get queued statements
        const queuedStatements = await prisma.bankStatement.findMany({
          where: {
            processingStage: 'QUEUED',
            status: 'PENDING'
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: this.maxConcurrent - this.processingQueue.size
        });

        if (queuedStatements.length === 0 && this.processingQueue.size === 0) {
          console.log('[Queue] No more statements to process, stopping');
          break;
        }

        // Process available statements
        for (const statement of queuedStatements) {
          if (this.processingQueue.size >= this.maxConcurrent) {
            break;
          }

          this.processingQueue.add(statement.id);
          console.log(`[Queue] Starting processing for ${statement.fileName} (${this.processingQueue.size}/${this.maxConcurrent} active)`);

          // Process asynchronously
          this.processStatement(statement.id)
            .then(() => {
              this.processingQueue.delete(statement.id);
              console.log(`[Queue] Completed ${statement.fileName} (${this.processingQueue.size}/${this.maxConcurrent} remaining)`);
            })
            .catch((error) => {
              this.processingQueue.delete(statement.id);
              console.error(`[Queue] Failed ${statement.fileName}:`, error);
            });
        }

        // Wait a bit before checking for more work
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } finally {
      this.isProcessing = false;
      console.log('[Queue] Queue processor stopped');
    }
  }

  private async processStatement(statementId: string): Promise<void> {
    try {
      // Import the processor dynamically
      const { processStatementWithValidation } = await import('@/lib/statement-processor');
      await processStatementWithValidation(statementId);
    } catch (error) {
      console.error(`[Queue] Error processing statement ${statementId}:`, error);
      
      // Update status to failed
      await prisma.bankStatement.update({
        where: { id: statementId },
        data: {
          status: 'FAILED',
          processingStage: 'FAILED',
          errorLog: error instanceof Error ? error.message : 'Processing failed'
        }
      }).catch(console.error);
      
      throw error;
    }
  }

  getQueueStatus(): { active: number; max: number } {
    return {
      active: this.processingQueue.size,
      max: this.maxConcurrent
    };
  }
}

export const queueManager = QueueManager.getInstance();
