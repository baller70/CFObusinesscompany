import { prisma } from '@/lib/db';
import { downloadFile } from '@/lib/s3';
import { AIBankStatementProcessor } from '@/lib/ai-processor';
import { 
  performRuleBasedValidation, 
  generateValidationSummary,
  ValidationIssue 
} from '@/lib/validation';

// Original function kept for backward compatibility
export async function processStatement(statementId: string) {
  return processStatementWithValidation(statementId);
}

// New function with validation
export async function processStatementWithValidation(statementId: string) {
  let aiProcessor: AIBankStatementProcessor;
  
  try {
    console.log(`[Processing] Initializing AI processor for statement ${statementId}`);
    aiProcessor = new AIBankStatementProcessor();
  } catch (error) {
    console.error('[Processing] Failed to initialize AI processor:', error);
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        processingStage: 'FAILED',
        errorLog: `Failed to initialize AI processor: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }).catch(console.error);
    
    throw error;
  }
  
  try {
    // Get statement from database
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { 
        user: true,
        businessProfile: true
      }
    });

    if (!statement) {
      throw new Error('Statement not found');
    }

    console.log(`[Processing] Starting processing for ${statement.fileName} (Business Profile: ${statement.businessProfile?.name || 'None'})`);

    // Update status to processing
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'PROCESSING',
        processingStage: 'EXTRACTING_DATA'
      }
    });

    // Get file from S3
    if (!statement.cloudStoragePath) {
      throw new Error('No cloud storage path found');
    }

    console.log(`[Processing] Downloading file from storage: ${statement.cloudStoragePath}`);
    
    let arrayBuffer: ArrayBuffer;
    let csvContent: string | undefined;
    
    // Check if this is a local file (for testing)
    if (statement.cloudStoragePath.startsWith('local://')) {
      const fs = await import('fs');
      const localPath = statement.cloudStoragePath.replace('local://', '');
      console.log(`[Processing] Reading local file: ${localPath}`);
      const fileBuffer = fs.readFileSync(localPath);
      arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      if (statement.fileType === 'CSV') {
        csvContent = fileBuffer.toString('utf-8');
      }
    } else {
      const signedUrl = await downloadFile(statement.cloudStoragePath);
      const fileResponse = await fetch(signedUrl);
      
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from storage: ${fileResponse.statusText}`);
      }
      
      arrayBuffer = await fileResponse.arrayBuffer();
      if (statement.fileType === 'CSV') {
        csvContent = await fileResponse.text();
      }
    }

    let extractedData: any;

    if (statement.fileType === 'PDF') {
      // Process PDF (text-based extraction via pdftotext)
      console.log(`[Processing] Extracting data from PDF using text-based method`);
      const pdfBuffer = Buffer.from(arrayBuffer);
      extractedData = await aiProcessor.extractDataFromPDF(pdfBuffer, statement.fileName || 'statement.pdf');
    } else {
      // Process CSV
      console.log(`[Processing] Processing CSV data`);
      extractedData = await aiProcessor.processCSVData(csvContent!);
    }

    if (!extractedData || !extractedData.transactions) {
      throw new Error('No transactions extracted from file');
    }

    console.log(`[Processing] Extracted ${extractedData.transactions.length} transactions`);

    // Update with extracted data
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'CATEGORIZING_TRANSACTIONS',
        extractedData: extractedData,
        bankName: extractedData.bankInfo?.bankName,
        accountType: extractedData.bankInfo?.accountType,
        accountNumber: extractedData.bankInfo?.accountNumber,
        statementPeriod: extractedData.bankInfo?.statementPeriod,
        recordCount: extractedData.transactions?.length || 0
      }
    });

    // Categorize transactions with user context for industry-aware processing
    console.log(`[Processing] Categorizing transactions with enhanced accuracy system`);
    const userContext = {
      industry: statement.user.industry,
      businessType: statement.user.businessType,
      companyName: statement.user.companyName
    };
    const categorizedTransactions = await aiProcessor.categorizeTransactions(extractedData.transactions || [], userContext);

    // Update processing stage
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'ANALYZING_PATTERNS'
      }
    });

    // Generate insights
    console.log(`[Processing] Generating financial insights`);
    const insights = await aiProcessor.generateFinancialInsights(categorizedTransactions, {
      firstName: statement.user.firstName,
      businessType: statement.user.businessType,
      companyName: statement.user.companyName
    });

    // Update processing stage
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'DISTRIBUTING_DATA',
        aiAnalysis: insights
      }
    });

    // Get all business profiles for routing
    const businessProfiles = await prisma.businessProfile.findMany({
      where: { userId: statement.userId }
    });
    
    const businessProfile = businessProfiles.find(bp => bp.type === 'BUSINESS');
    const personalProfile = businessProfiles.find(bp => bp.type === 'PERSONAL');
    
    console.log(`[Processing] Found profiles - Business: ${businessProfile?.name || 'None'}, Personal: ${personalProfile?.name || 'None'}`);

    // ========================================
    // ENHANCED ACCURACY SYSTEM - MULTI-PASS PROCESSING
    // ========================================
    
    // Import accuracy enhancement functions
    const {
      applyMerchantRules,
      detectRecurringPattern,
      analyzeHistoricalPatterns,
      calculateEnhancedConfidence,
      queueForReview
    } = await import('@/lib/accuracy-enhancer');
    
    // Create transactions in database with 100% accuracy system
    console.log(`[Processing] Creating ${categorizedTransactions.length} transactions with enhanced accuracy (merchant rules + patterns + learning)`);
    const createdTransactions = [];
    const businessTransactions = [];
    const personalTransactions = [];
    const reviewQueue = [];
    
    for (const catTxn of categorizedTransactions) {
      const originalTxn = catTxn.originalTransaction;
      const merchantName = catTxn.merchant || originalTxn.description?.substring(0, 50) || 'Unknown';
      
      // Determine transaction type based on debit/credit from AI
      // Debit = money leaving account = EXPENSE
      // Credit = money entering account = INCOME
      let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE';
      let amount = Math.abs(originalTxn.amount || 0);
      
      // Check AI's type field first - this is the most reliable indicator
      if (originalTxn.type) {
        const txnType = originalTxn.type.toLowerCase();
        if (txnType === 'credit' || txnType === 'deposit') {
          type = 'INCOME';
        } else if (txnType === 'debit' || txnType === 'withdrawal') {
          type = 'EXPENSE';
        }
      }
      
      // Alternatively, check if amount is negative (debit) or positive (credit)
      if (originalTxn.amount !== undefined) {
        if (originalTxn.amount > 0) {
          type = 'INCOME';  // Positive = money coming in
        } else if (originalTxn.amount < 0) {
          type = 'EXPENSE'; // Negative = money going out
        }
      }
      
      // Check category hints (but don't override credit/debit determination)
      const categoryLower = catTxn.suggestedCategory?.toLowerCase() || '';
      if (categoryLower.includes('income') || categoryLower.includes('salary') || 
          categoryLower.includes('freelance') || categoryLower.includes('dividend')) {
        type = 'INCOME';
      }
      
      // Only mark as TRANSFER if it's an internal transfer (like between own accounts)
      // Don't override INCOME/EXPENSE based on just having "transfer" in description
      // Payment processor transfers (Stripe, PayPal, etc.) are actually INCOME
      const descLower = originalTxn.description?.toLowerCase() || '';
      if (descLower.includes('transfer to') || descLower.includes('transfer from')) {
        // Only if it looks like an internal transfer between own accounts
        if (!descLower.includes('stripe') && !descLower.includes('paypal') && 
            !descLower.includes('venmo') && !descLower.includes('zelle') &&
            !descLower.includes('payout') && !descLower.includes('payment')) {
          type = 'TRANSFER';
        }
      }

      // ========================================
      // PHASE 1: APPLY MERCHANT RULES (Highest Priority)
      // ========================================
      const merchantRule = await applyMerchantRules(
        statement.userId,
        merchantName,
        statement.businessProfileId
      );

      let finalCategory = catTxn.suggestedCategory;
      let finalProfileType = catTxn.profileType?.toUpperCase();
      let finalConfidence = catTxn.confidence || 0.7;
      let usedMerchantRule = false;

      if (merchantRule.matched && merchantRule.rule?.autoApply) {
        // Merchant rule overrides AI suggestion
        finalCategory = merchantRule.category!;
        finalProfileType = merchantRule.profileType!;
        finalConfidence = 0.95; // High confidence for user-defined rules
        usedMerchantRule = true;
        console.log(`[Processing] ✅ Applied merchant rule: ${merchantName} → ${finalCategory} (${finalProfileType})`);
      }

      // ========================================
      // PHASE 2: CHECK HISTORICAL PATTERNS
      // ========================================
      const historicalPattern = await analyzeHistoricalPatterns(
        statement.userId,
        merchantName
      );

      if (!usedMerchantRule && historicalPattern.confidence > 0.7 && historicalPattern.confidence > finalConfidence) {
        // Historical pattern suggests different classification with high confidence
        if (historicalPattern.suggestedCategory && historicalPattern.suggestedProfile) {
          console.log(`[Processing] 📊 Applying historical pattern: ${merchantName} → ${historicalPattern.suggestedCategory} (confidence: ${(historicalPattern.confidence * 100).toFixed(0)}%)`);
          finalCategory = historicalPattern.suggestedCategory;
          finalProfileType = historicalPattern.suggestedProfile;
          finalConfidence = historicalPattern.confidence;
        }
      }

      // ========================================
      // PHASE 3: DETECT RECURRING PATTERNS
      // ========================================
      const recurringInfo = await detectRecurringPattern(
        statement.userId,
        merchantName,
        amount,
        new Date(originalTxn.date),
        statement.businessProfileId
      );

      const isRecurring = recurringInfo.isRecurring || catTxn.isRecurring || false;

      // ========================================
      // PHASE 4: CALCULATE ENHANCED CONFIDENCE
      // ========================================
      finalConfidence = calculateEnhancedConfidence(
        catTxn.confidence || 0.7,
        historicalPattern.confidence > 0,
        historicalPattern.confidence,
        usedMerchantRule,
        isRecurring
      );

      // ========================================
      // INTELLIGENT PROFILE ROUTING
      // ========================================
      let targetProfileId: string | null = null;
      
      if (finalProfileType === 'BUSINESS' && businessProfile) {
        targetProfileId = businessProfile.id;
        console.log(`[Processing] 🏢 Routing to BUSINESS profile: ${originalTxn.description}`);
      } else if (finalProfileType === 'PERSONAL' && personalProfile) {
        targetProfileId = personalProfile.id;
        console.log(`[Processing] 🏠 Routing to PERSONAL profile: ${originalTxn.description}`);
      } else {
        // Fallback to original statement profile if AI didn't classify or profile not found
        targetProfileId = statement.businessProfileId;
        console.log(`[Processing] ⚠️ Using original profile (no AI classification): ${originalTxn.description}`);
      }

      // Find or create category using final category
      let category = await prisma.category.findFirst({
        where: {
          userId: statement.userId,
          name: finalCategory
        }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: statement.userId,
            name: finalCategory,
            type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            color: getCategoryColor(finalCategory),
            icon: getCategoryIcon(finalCategory)
          }
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: statement.userId,
          businessProfileId: targetProfileId, // Use enhanced routing
          bankStatementId: statementId,
          date: new Date(originalTxn.date),
          amount: amount,
          description: originalTxn.description || 'Unknown transaction',
          merchant: merchantName,
          category: category.name,
          categoryId: category.id,
          type: type,
          aiCategorized: true,
          confidence: finalConfidence, // Use enhanced confidence
          isRecurring: isRecurring
        }
      });
      
      // ========================================
      // PHASE 5: QUEUE LOW-CONFIDENCE FOR REVIEW
      // ========================================
      if (finalConfidence < 0.85 && !usedMerchantRule) {
        // Queue for manual review if confidence is below threshold
        let issueType = 'LOW_CONFIDENCE';
        let issueSeverity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        let issueDescription = `AI confidence is ${(finalConfidence * 100).toFixed(0)}% for this transaction`;
        let suggestedFix = `Please review and confirm the category "${finalCategory}" and profile "${finalProfileType}"`;
        
        if (finalConfidence < 0.70) {
          issueSeverity = 'HIGH';
          issueDescription = `Low confidence (${(finalConfidence * 100).toFixed(0)}%). Transaction may be miscategorized.`;
          suggestedFix = 'Please verify the category and profile assignment';
        } else if (finalConfidence < 0.50) {
          issueSeverity = 'HIGH';
          issueDescription = `Very low confidence (${(finalConfidence * 100).toFixed(0)}%). Likely miscategorization.`;
          suggestedFix = 'Manual categorization recommended';
        }
        
        await queueForReview(
          statement.userId,
          transaction.id,
          finalConfidence,
          {
            category: finalCategory,
            profileType: finalProfileType,
            merchant: merchantName,
            reasoning: catTxn.reasoning || 'No reasoning provided'
          },
          issueType,
          issueSeverity,
          issueDescription,
          suggestedFix
        );
        
        reviewQueue.push(transaction);
        console.log(`[Processing] ⚠️ Queued for review: ${originalTxn.description} (confidence: ${(finalConfidence * 100).toFixed(0)}%)`);
      } else {
        console.log(`[Processing] ✅ High confidence: ${originalTxn.description} (${(finalConfidence * 100).toFixed(0)}%)`);
      }
      
      createdTransactions.push({ transaction, catTxn });
      
      // Track transactions by profile
      if (targetProfileId === businessProfile?.id) {
        businessTransactions.push({ transaction, catTxn });
      } else if (targetProfileId === personalProfile?.id) {
        personalTransactions.push({ transaction, catTxn });
      }
    }
    
    console.log(`[Processing] ✅ Created ${createdTransactions.length} transactions total`);
    console.log(`[Processing] 🏢 Business transactions: ${businessTransactions.length}`);
    console.log(`[Processing] 🏠 Personal transactions: ${personalTransactions.length}`);
    console.log(`[Processing] ⚠️ Queued for review: ${reviewQueue.length} low-confidence transactions`);
    console.log(`[Processing] ✅ High-confidence: ${createdTransactions.length - reviewQueue.length} transactions (${((createdTransactions.length - reviewQueue.length) / createdTransactions.length * 100).toFixed(1)}%)`);
    
    if (reviewQueue.length > 0) {
      console.log(`[Processing] 📋 Review queue created - user can review and correct these transactions to improve future accuracy`);
    }
    
    // Create recurring charges for recurring transactions in each profile
    if (businessTransactions.length > 0 && businessProfile) {
      await createRecurringCharges(statement.userId, businessProfile.id, businessTransactions);
    }
    if (personalTransactions.length > 0 && personalProfile) {
      await createRecurringCharges(statement.userId, personalProfile.id, personalTransactions);
    }

    // ========================================
    // VALIDATION STAGE - Double-check everything
    // ========================================
    console.log(`[Processing] 🔍 Starting validation stage for ${statement.fileName}`);
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processingStage: 'VALIDATING'
      }
    });

    // Run rule-based validation
    console.log(`[Processing] Running rule-based validation...`);
    const ruleBasedResult = await performRuleBasedValidation(
      statementId,
      extractedData,
      createdTransactions.map(ct => ct.transaction)
    );

    // Run AI re-validation
    console.log(`[Processing] Running AI re-validation...`);
    const aiValidationResult = await aiProcessor.reValidateTransactions(
      createdTransactions.map(ct => ({
        id: ct.transaction.id,
        description: ct.transaction.description,
        amount: ct.transaction.amount,
        category: ct.transaction.category,
        type: ct.transaction.type,
        profileType: ct.catTxn.profileType,
        merchant: ct.transaction.merchant,
        confidence: ct.transaction.confidence
      }))
    );

    // Generate comprehensive validation report
    console.log(`[Processing] Generating validation report...`);
    const validationResult = generateValidationSummary(
      ruleBasedResult,
      aiValidationResult,
      createdTransactions.map(ct => ct.transaction)
    );

    console.log(`[Processing] ✅ Validation complete: Confidence ${(validationResult.confidence * 100).toFixed(1)}%, ${validationResult.issues.length} issues found`);

    // Apply corrections if AI validation suggests changes with high confidence
    let correctionsMade = 0;
    if (aiValidationResult.validatedTransactions) {
      for (const validation of aiValidationResult.validatedTransactions) {
        if (validation.hasIssue && validation.confidence > 0.85) {
          // Auto-correct high-confidence issues
          const transaction = createdTransactions.find(ct => ct.transaction.id === validation.transactionId);
          if (transaction && validation.validatedCategory !== validation.originalCategory) {
            console.log(`[Processing] Auto-correcting transaction ${transaction.transaction.id}: ${validation.originalCategory} → ${validation.validatedCategory}`);
            
            // Find or create the corrected category
            let correctedCategory = await prisma.category.findFirst({
              where: {
                userId: statement.userId,
                name: validation.validatedCategory
              }
            });

            if (!correctedCategory) {
              correctedCategory = await prisma.category.create({
                data: {
                  userId: statement.userId,
                  name: validation.validatedCategory,
                  type: transaction.transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
                  color: getCategoryColor(validation.validatedCategory),
                  icon: getCategoryIcon(validation.validatedCategory)
                }
              });
            }

            await prisma.transaction.update({
              where: { id: transaction.transaction.id },
              data: {
                category: validation.validatedCategory,
                categoryId: correctedCategory.id
              }
            });
            
            correctionsMade++;
          }
        }
      }
    }

    if (correctionsMade > 0) {
      console.log(`[Processing] ✨ Applied ${correctionsMade} auto-corrections based on validation`);
    }

    // Update processed count and transaction count with validation results
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        processedCount: categorizedTransactions.length,
        transactionCount: categorizedTransactions.length,
        processingStage: 'COMPLETED',
        status: 'COMPLETED',
        validationResult: validationResult as any,
        validationConfidence: validationResult.confidence,
        flaggedIssues: validationResult.issues as any,
        validatedAt: new Date(),
        processedAt: new Date()
      }
    });

    console.log(`[Processing] Successfully completed processing for ${statement.fileName} - ${categorizedTransactions.length} transactions, ${correctionsMade} corrections applied`);

    // Update budgets with actual spending for each profile that has transactions
    if (businessTransactions.length > 0 && businessProfile) {
      console.log(`[Processing] Updating budgets for business profile`);
      await updateBudgetsFromTransactions(statement.userId, businessProfile.id);
    }
    if (personalTransactions.length > 0 && personalProfile) {
      console.log(`[Processing] Updating budgets for personal profile`);
      await updateBudgetsFromTransactions(statement.userId, personalProfile.id);
    }

    // Update user's financial metrics
    await updateFinancialMetrics(statement.userId);

    // Create success notification
    await prisma.notification.create({
      data: {
        userId: statement.userId,
        type: 'CSV_PROCESSED',
        title: 'Bank Statement Processed',
        message: `Successfully processed ${categorizedTransactions.length} transactions from ${statement.fileName}`,
        isActive: true
      }
    });

  } catch (error) {
    console.error('[Processing] Statement processing error:', error);
    
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'FAILED',
        processingStage: 'FAILED',
        errorLog: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}

async function updateBudgetsFromTransactions(userId: string, businessProfileId?: string | null) {
  try {
    console.log(`[Processing] Updating budgets from transactions (Business Profile: ${businessProfileId || 'All'})`);
    
    // Get all transactions for this business profile (or all if no profile specified)
    const whereClause: any = {
      userId
    };
    
    // Filter by business profile if provided
    if (businessProfileId) {
      whereClause.businessProfileId = businessProfileId;
    }
    
    const allTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        categoryRelation: true
      }
    });
    
    console.log(`[Processing] Found ${allTransactions.length} total transactions`);
    
    // Group transactions by month/year
    const transactionsByMonth = new Map<string, typeof allTransactions>();
    
    for (const txn of allTransactions) {
      const month = txn.date.getMonth() + 1;
      const year = txn.date.getFullYear();
      const key = `${month}-${year}`;
      
      if (!transactionsByMonth.has(key)) {
        transactionsByMonth.set(key, []);
      }
      transactionsByMonth.get(key)!.push(txn);
    }
    
    console.log(`[Processing] Processing budgets for ${transactionsByMonth.size} different months`);
    
    // Process each month
    for (const [monthYear, monthlyTransactions] of transactionsByMonth.entries()) {
      const [month, year] = monthYear.split('-').map(Number);
      console.log(`[Processing] Processing ${monthlyTransactions.length} transactions for ${month}/${year}`);
    
      // Group transactions by category and calculate spending
      const categorySpending = new Map<string, { amount: number; type: 'INCOME' | 'EXPENSE' }>();
      
      for (const txn of monthlyTransactions) {
        const category = txn.category;
        const type = txn.type;
        
        if (!categorySpending.has(category)) {
          categorySpending.set(category, { amount: 0, type: type as 'INCOME' | 'EXPENSE' });
        }
        
        const current = categorySpending.get(category)!;
        current.amount += txn.amount;
      }
      
      console.log(`[Processing] Updating budgets for ${categorySpending.size} categories in ${month}/${year}`);
      
      // Create or update budgets for each category
      for (const [category, data] of categorySpending.entries()) {
        const spent = data.amount;
        
        // Calculate a suggested budget amount (20% more than spent, or minimum $100)
        const suggestedBudget = Math.max(spent * 1.2, 100);
        
        // Check if budget exists
        const budgetWhereClause: any = {
          userId,
          category,
          month: month,
          year: year
        };
        
        if (businessProfileId) {
          budgetWhereClause.businessProfileId = businessProfileId;
        }
        
        const existingBudget = await prisma.budget.findFirst({
          where: budgetWhereClause
        });
        
        if (existingBudget) {
          // Update existing budget with actual spending
          await prisma.budget.update({
            where: { id: existingBudget.id },
            data: {
              spent: spent
            }
          });
          console.log(`[Processing] Updated budget for ${category} (${month}/${year}): $${spent.toFixed(2)} spent`);
        } else {
          // Create new budget with suggested amount and actual spending
          await prisma.budget.create({
            data: {
              userId,
              businessProfileId,
              category,
              month: month,
              year: year,
              amount: suggestedBudget,
              spent: spent,
              type: 'MONTHLY',
              name: `${category} - ${month}/${year}`
            }
          });
          console.log(`[Processing] Created budget for ${category} (${month}/${year}): $${suggestedBudget.toFixed(2)} budget, $${spent.toFixed(2)} spent`);
        }
      }
    }
    
    console.log('[Processing] Budget update completed for all months');
  } catch (error) {
    console.error('[Processing] Error updating budgets:', error);
    // Don't throw - this is not critical
  }
}

async function createRecurringCharges(
  userId: string, 
  businessProfileId: string | null | undefined, 
  transactionsData: Array<{ transaction: any; catTxn: any }>
) {
  try {
    console.log(`[Processing] Detecting recurring charges from ${transactionsData.length} transactions`);
    
    // Filter to only recurring expenses
    const recurringExpenses = transactionsData.filter(
      ({ transaction, catTxn }) => 
        catTxn.isRecurring && 
        transaction.type === 'EXPENSE'
    );
    
    console.log(`[Processing] Found ${recurringExpenses.length} recurring expense transactions`);
    
    for (const { transaction, catTxn } of recurringExpenses) {
      // Check if this recurring charge already exists
      const existingCharge = await prisma.recurringCharge.findFirst({
        where: {
          userId,
          name: {
            contains: catTxn.merchant || transaction.description.substring(0, 30),
            mode: 'insensitive'
          }
        }
      });
      
      if (!existingCharge) {
        // Determine frequency based on category or description
        let frequency: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY' | 'ANNUALLY' = 'MONTHLY';
        const desc = transaction.description.toLowerCase();
        
        if (desc.includes('monthly') || desc.includes('subscription')) {
          frequency = 'MONTHLY';
        } else if (desc.includes('weekly')) {
          frequency = 'WEEKLY';
        } else if (desc.includes('quarterly')) {
          frequency = 'QUARTERLY';
        } else if (desc.includes('annual') || desc.includes('yearly')) {
          frequency = 'ANNUALLY';
        }
        
        // Create the recurring charge
        const nextDue = new Date(transaction.date);
        // Set next due date based on frequency
        if (frequency === 'WEEKLY') {
          nextDue.setDate(nextDue.getDate() + 7);
        } else if (frequency === 'MONTHLY') {
          nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (frequency === 'QUARTERLY') {
          nextDue.setMonth(nextDue.getMonth() + 3);
        } else if (frequency === 'ANNUALLY') {
          nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
        
        await prisma.recurringCharge.create({
          data: {
            userId,
            businessProfileId,
            name: catTxn.merchant || transaction.description,
            amount: transaction.amount,
            frequency,
            category: transaction.category,
            nextDueDate: nextDue,
            annualAmount: frequency === 'ANNUALLY' ? transaction.amount : 
                         frequency === 'MONTHLY' ? transaction.amount * 12 :
                         frequency === 'QUARTERLY' ? transaction.amount * 4 :
                         transaction.amount * 52,
            isActive: true
          }
        });
        
        console.log(`[Processing] Created recurring charge: ${catTxn.merchant || transaction.description} - $${transaction.amount} ${frequency}`);
      }
    }
    
    console.log('[Processing] Recurring charges creation completed');
  } catch (error) {
    console.error('[Processing] Error creating recurring charges:', error);
    // Don't throw - this is not critical
  }
}

async function updateFinancialMetrics(userId: string) {
  try {
    // Recalculate financial metrics based on all transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo }
      }
    });

    const income = recentTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = recentTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = income / 30 * 30; // Normalize to monthly
    const monthlyExpenses = expenses / 30 * 30;

    //@ts-ignore
    await prisma.financialMetrics.upsert({
      //@ts-ignore
      where: { userId },
      create: {
        userId,
        monthlyIncome,
        monthlyExpenses,
        monthlyBurnRate: monthlyExpenses - monthlyIncome,
        lastCalculated: new Date()
      },
      update: {
        monthlyIncome,
        monthlyExpenses,
        monthlyBurnRate: monthlyExpenses - monthlyIncome,
        lastCalculated: new Date()
      }
    });
  } catch (error) {
    console.error('[Processing] Error updating financial metrics:', error);
    // Don't throw - this is not critical
  }
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Food & Dining': '#FF6B6B',
    'Transportation': '#4ECDC4',
    'Shopping': '#45B7D1',
    'Entertainment': '#96CEB4',
    'Bills & Utilities': '#FFEAA7',
    'Healthcare': '#DDA0DD',
    'Education': '#98D8C8',
    'Travel': '#F7DC6F',
    'Income': '#2ECC71',
    'Salary': '#27AE60',
    'Fees & Charges': '#E74C3C',
    'Groceries': '#F39C12'
  };
  return colorMap[category] || '#3B82F6';
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Food & Dining': 'utensils',
    'Transportation': 'car',
    'Shopping': 'shopping-bag',
    'Entertainment': 'film',
    'Bills & Utilities': 'zap',
    'Healthcare': 'heart',
    'Education': 'book',
    'Travel': 'plane',
    'Income': 'trending-up',
    'Salary': 'dollar-sign',
    'Fees & Charges': 'alert-circle',
    'Groceries': 'shopping-cart'
  };
  return iconMap[category] || 'folder';
}
