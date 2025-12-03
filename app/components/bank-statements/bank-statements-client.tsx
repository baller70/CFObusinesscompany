'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, FileText, Building2, Home, Copy, Trash2, X, Upload, AlertCircle, Clock, CheckCircle, CheckCircle2, DollarSign, AlertTriangle, ClipboardPaste } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ManualTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  profileType?: 'BUSINESS' | 'PERSONAL';
}

interface ManualTransactionCard {
  id: string;
  monthYear: string;
  transactions: ManualTransaction[];
}

export default function BankStatementsClient() {
  // Manual transaction entry state
  const [manualTransactionText, setManualTransactionText] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [manualTransactionCards, setManualTransactionCards] = useState<ManualTransactionCard[]>([]);
  const manualCardsRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState('RouteLLM');
  const [loadingTransactions, setLoadingTransactions] = useState<string | null>(null);

  // Saved statements state
  const [savedStatements, setSavedStatements] = useState<any[]>([]);
  const [loadingSavedStatements, setLoadingSavedStatements] = useState(false);

  // View statement modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingTransactions, setViewingTransactions] = useState<any[]>([]);
  const [viewingStatementInfo, setViewingStatementInfo] = useState<any>(null);

  // PDF Upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF file selection
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setPdfFile(file);
      setUploadStatus('idle');
      setUploadError(null);
      setUploadResult(null);
      toast.success(`Selected: ${file.name}`);
    }
  };

  // Handle PDF upload
  const handlePdfUpload = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsUploadingPdf(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadError(null);
    setUploadResult(null);

    try {
      // Step 1: Upload the file
      setUploadProgress(10);
      const formData = new FormData();
      formData.append('files', pdfFile);
      formData.append('sourceTypes', 'BANK');
      formData.append('model', 'gpt-4o');

      const uploadResponse = await fetch('/api/bank-statements/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(30);
      setUploadStatus('processing');
      toast.success(`File uploaded! Processing...`);

      // Step 2: Poll for processing status
      const statementId = uploadData.id;
      if (statementId) {
        let attempts = 0;
        // Increased timeout: 15 minutes max wait (450 × 2 seconds)
        // Large PDFs with many transactions and AI API retries can take 8-12 minutes
        // AI processing stages: extraction (2-3 min) + categorization (3-5 min) + validation (2-4 min)
        const maxAttempts = 450;
        const POLL_INTERVAL_MS = 2000;

        const pollStatus = async () => {
          attempts++;
          const elapsedMinutes = Math.floor((attempts * POLL_INTERVAL_MS) / 60000);

          try {
            const statusResponse = await fetch(`/api/bank-statements/status?id=${statementId}`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              const statement = statusData.statements?.[0] || statusData;

              // Update progress based on processing stage
              // Backend stages: EXTRACTING_DATA → CATEGORIZING_TRANSACTIONS → ANALYZING_PATTERNS → DISTRIBUTING_DATA → VALIDATING → COMPLETED
              if (statement.processingStage === 'UPLOADED') setUploadProgress(35);
              else if (statement.processingStage === 'QUEUED') setUploadProgress(40);
              else if (statement.processingStage === 'EXTRACTING_DATA') setUploadProgress(50);
              else if (statement.processingStage === 'CATEGORIZING_TRANSACTIONS') setUploadProgress(60);
              else if (statement.processingStage === 'ANALYZING_PATTERNS') setUploadProgress(70);
              else if (statement.processingStage === 'DISTRIBUTING_DATA') setUploadProgress(80);
              else if (statement.processingStage === 'VALIDATING') setUploadProgress(90);
              else if (statement.processingStage === 'COMPLETED') setUploadProgress(100);

              if (statement.status === 'COMPLETED') {
                setUploadProgress(100);
                setUploadStatus('success');
                setUploadResult({
                  statementId: statement.id || statementId,
                  transactionCount: statement.transactionCount || 0,
                  bankName: statement.bankName,
                  accountNumber: statement.accountNumber,
                  statementPeriod: statement.statementPeriod,
                });
                toast.success(`✅ Successfully processed ${statement.transactionCount || 0} transactions!`);
                await fetchSavedStatements();
                setPdfFile(null);
                if (pdfInputRef.current) pdfInputRef.current.value = '';
                setIsUploadingPdf(false);
                return;
              } else if (statement.status === 'FAILED') {
                setUploadStatus('error');
                setUploadError(statement.errorLog || statement.errorMessage || 'Processing failed');
                toast.error(`❌ Processing failed: ${statement.errorLog || 'Unknown error'}`);
                setIsUploadingPdf(false);
                return;
              } else if (attempts < maxAttempts) {
                // Still processing, continue polling
                // Show progress message every 2 minutes with stage info
                if (elapsedMinutes > 0 && elapsedMinutes % 2 === 0 && (attempts * POLL_INTERVAL_MS) % 120000 < POLL_INTERVAL_MS) {
                  const stage = statement.status === 'EXTRACTING_DATA' ? 'Extracting transactions from PDF...' :
                               statement.status === 'CATEGORIZING_TRANSACTIONS' ? 'AI categorizing transactions...' :
                               statement.status === 'ANALYZING_PATTERNS' ? 'Detecting recurring patterns...' :
                               statement.status === 'VALIDATING' ? 'Validating data...' :
                               'Processing...';
                  toast.info(`⏳ ${stage} ${elapsedMinutes} min elapsed. Large statements can take 10-15 minutes.`, { duration: 4000 });
                }
                setTimeout(pollStatus, POLL_INTERVAL_MS);
              } else {
                // Timeout after 15 minutes - processing continues in background
                setUploadStatus('processing'); // Keep showing as processing
                toast.info('⏳ Processing continues in the background. The statement will appear in "Saved Statements" when complete. You can navigate away.', { duration: 8000 });
                await fetchSavedStatements(); // Refresh list anyway
                // Don't clear file or reset - let user know it's still working
                setIsUploadingPdf(false);
                return;
              }
            } else {
              // Status API error, retry
              if (attempts < maxAttempts) {
                setTimeout(pollStatus, POLL_INTERVAL_MS);
              } else {
                setUploadStatus('processing');
                toast.info('⏳ Could not get processing status. Check "Saved Statements" shortly - processing continues in background.', { duration: 6000 });
                setIsUploadingPdf(false);
              }
            }
          } catch (pollError) {
            console.error('Status poll error:', pollError);
            if (attempts < maxAttempts) {
              setTimeout(pollStatus, POLL_INTERVAL_MS);
            } else {
              // Don't throw - gracefully handle timeout
              setUploadStatus('processing');
              toast.info('⏳ Processing continues in the background. Check "Saved Statements" shortly.', { duration: 6000 });
              setIsUploadingPdf(false);
            }
          }
        };

        setTimeout(pollStatus, POLL_INTERVAL_MS);
      } else {
        setUploadProgress(100);
        setUploadStatus('success');
        toast.success('File uploaded successfully!');
        await fetchSavedStatements();
      }

    } catch (error) {
      console.error('PDF upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadStatus('error');
      setUploadError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      if (uploadStatus !== 'processing') {
        setIsUploadingPdf(false);
      }
    }
  };

  // Fetch saved statements
  const fetchSavedStatements = async () => {
    try {
      setLoadingSavedStatements(true);
      const response = await fetch('/api/bank-statements/status');
      if (response.ok) {
        const data = await response.json();
        setSavedStatements(data.statements || []);
      }
    } catch (error) {
      console.error('Error fetching saved statements:', error);
    } finally {
      setLoadingSavedStatements(false);
    }
  };

  // Delete transaction card
  const handleDeleteCard = (cardId: string) => {
    setManualTransactionCards(prev => prev.filter(card => card.id !== cardId));
    toast.success('Transaction card deleted');
  };

  // Delete saved statement
  const handleDeleteStatement = async (statementId: string) => {
    if (!confirm('Are you sure you want to delete this statement? This will remove all associated transactions.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bank-statements/delete?id=${statementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete statement');
      }

      toast.success('Statement deleted successfully');
      await fetchSavedStatements(); // Refresh the list
    } catch (error) {
      console.error('Error deleting statement:', error);
      toast.error('Failed to delete statement');
    }
  };

  // Auto-scroll to transaction cards when a new card is created
  useEffect(() => {
    if (manualTransactionCards.length > 0) {
      manualCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [manualTransactionCards.length]);

  // Load saved statements on mount
  useEffect(() => {
    fetchSavedStatements();
  }, []);

  const handleProcessManualTransactions = () => {
    try {
      setIsProcessingManual(true);

      if (!statementDate.trim()) {
        toast.error('Please enter the statement date (e.g., January 2024)');
        setIsProcessingManual(false);
        return;
      }

      // Parse the manual text into transactions
      const lines = manualTransactionText.trim().split('\n');
      const transactions: ManualTransaction[] = [];
      
      // Section detection - determines if amounts should be positive (income) or negative (expense)
      let currentSectionType: 'income' | 'expense' = 'income';
      let currentSectionName = '';
      
      // Income sections (deposits, additions)
      const incomeSections = [
        'deposits',
        'additions',
        'ach additions',
        'atm deposits',
        'mobile deposit',
        'wire transfer in',
        'incoming wire',
        'credits',
        'interest'
      ];
      
      // Expense sections (purchases, deductions, fees)
      const expenseSections = [
        'purchases',
        'deductions',
        'debit card',
        'pos purchase',
        'ach debit',
        'checks',
        'substitute checks',
        'service charge',
        'fees',
        'atm withdrawal',
        'wire transfer out',
        'outgoing wire',
        'payment',
        'other deductions',
        'atm / misc',
        'atm/misc'
      ];
      
      console.log(`[Manual Parser] ========================================`);
      console.log(`[Manual Parser] RAW INPUT LENGTH: ${manualTransactionText.length} characters`);
      console.log(`[Manual Parser] TOTAL LINES: ${lines.length}`);
      console.log(`[Manual Parser] RULE: Every line with a DATE is a TRANSACTION`);
      console.log(`[Manual Parser] ========================================`);
      
      // Log first 10 lines to debug
      console.log(`[Manual Parser] FIRST 10 LINES:`);
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        console.log(`  [${i}]: "${lines[i]}"`);
      }
      console.log(`[Manual Parser] ========================================`);
      
      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) {
          console.log(`[Manual Parser] Line ${i}: SKIPPED (empty)`);
          continue;
        }
        
        const lowerLine = trimmedLine.toLowerCase();
        
        // CRITICAL FIX: Section headers should NOT have dates!
        // If a line has a date, it's a transaction, NOT a section header
        const hasDate = /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/.test(trimmedLine);
        
        // Check if this line is a section header (this determines income vs expense)
        // ONLY if it doesn't have a date pattern
        if (!hasDate && incomeSections.some(section => lowerLine.includes(section))) {
          currentSectionType = 'income';
          currentSectionName = trimmedLine;
          console.log(`[Manual Parser] 📥 INCOME SECTION: ${currentSectionName}`);
          continue;
        }
        if (!hasDate && expenseSections.some(section => lowerLine.includes(section))) {
          currentSectionType = 'expense';
          currentSectionName = trimmedLine;
          console.log(`[Manual Parser] 📤 EXPENSE SECTION: ${currentSectionName}`);
          continue;
        }
        
        // Skip ONLY column headers (Date Posted | Amount | Description | etc.)
        if ((lowerLine.includes('date') && (lowerLine.includes('amount') || lowerLine.includes('description')))) {
          console.log(`[Manual Parser] ⏭️  Column header: ${trimmedLine.substring(0, 50)}...`);
          continue;
        }
        
        // Skip total lines
        if (lowerLine.match(/total.*\$/)) {
          console.log(`[Manual Parser] ⏭️  Total line: ${trimmedLine.substring(0, 50)}...`);
          continue;
        }
        
        // ============================================
        // CORE RULE: IF IT HAS A DATE, IT'S A TRANSACTION
        // ============================================
        
        // Split by tabs, then by multiple spaces, then single space
        let parts = trimmedLine.split('\t').filter(p => p.trim());
        if (parts.length < 2) parts = trimmedLine.split(/\s{2,}/).filter(p => p.trim());
        if (parts.length < 2) parts = trimmedLine.split(/\s+/).filter(p => p.trim());
        
        // Look for date pattern MM/DD or MM/DD/YYYY in ANY of the first 3 fields
        let date = '';
        let dateIndex = -1;
        for (let j = 0; j < Math.min(3, parts.length); j++) {
          if (parts[j].match(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/)) {
            date = parts[j];
            dateIndex = j;
            break;
          }
        }
        
        // NO DATE? Not a transaction. Move on.
        if (!date) {
          console.log(`[Manual Parser] Line ${i}: SKIPPED (no date) - "${trimmedLine.substring(0, 80)}..."`);
          console.log(`[Manual Parser]   Parts (first 5): [${parts.slice(0, 5).join(' | ')}]`);
          continue;
        }
        
        // ============================================
        // WE FOUND A DATE - THIS IS A TRANSACTION!
        // ============================================
        
        // Now find the amount (look for any numeric value with optional $ and , - supports negative amounts)
        let amount = 0;
        let amountIndex = -1;
        for (let j = dateIndex + 1; j < parts.length; j++) {
          // Remove $ and , but preserve negative sign
          const cleanPart = parts[j].replace(/[\$,]/g, '');
          const parsedAmount = parseFloat(cleanPart);
          // Match positive or negative numbers (e.g., 123.45, -123.45, 123, -123)
          if (!isNaN(parsedAmount) && parsedAmount !== 0 && cleanPart.match(/^-?\d+\.?\d*$/)) {
            amount = parsedAmount;
            amountIndex = j;
            break;
          }
        }

        // If no valid amount found, skip (malformed line)
        if (amountIndex === -1) {
          console.log(`[Manual Parser] ⚠️  Date found but no valid amount: ${trimmedLine.substring(0, 60)}...`);
          continue;
        }
        
        // Extract description (everything between date and amount, or after amount)
        let description = '';
        if (amountIndex > dateIndex + 1) {
          // Description is between date and amount
          description = parts.slice(dateIndex + 1, amountIndex).join(' ').trim();
        } else {
          // Amount is right after date, so description comes after amount
          description = parts.slice(amountIndex + 1).join(' ').trim();
        }
        
        // Special case: Checks section (Date | Check# | Amount)
        if (!description && currentSectionName.toLowerCase().includes('check') && amountIndex === dateIndex + 2) {
          description = `Check #${parts[dateIndex + 1]}`;
        }
        
        // Fallback description
        if (!description) {
          description = 'Transaction';
        }
        
        // Determine if this is an expense based on:
        // 1. Explicit negative amount in input (e.g., -$156.78)
        // 2. Section type being 'expense'
        const isExplicitlyNegative = amount < 0;
        const isExpense = isExplicitlyNegative || currentSectionType === 'expense';

        // Apply sign: negative for expenses, positive for income
        if (isExpense) {
          amount = -Math.abs(amount);
        } else {
          amount = Math.abs(amount);
        }

        // CREATE THE TRANSACTION
        transactions.push({
          date,
          description,
          amount,
          category: isExpense ? 'Expense' : 'Income'
        });
        
        console.log(`[Manual Parser] ✅ #${transactions.length}: ${date} | $${amount.toFixed(2)} | ${description.substring(0, 35)}...`);
      }

      console.log(`[Manual Parser] ========================================`);
      console.log(`[Manual Parser] 🎯 FINAL COUNT: ${transactions.length} transactions`);
      console.log(`[Manual Parser] ========================================`);

      if (transactions.length === 0) {
        toast.error('❌ No valid transactions found. Please check the format and try again.');
        return;
      }

      // Calculate totals
      const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Use the statement date provided by user
      const monthYear = statementDate.trim();

      // Create a new card
      const newCard: ManualTransactionCard = {
        id: Date.now().toString(),
        monthYear: `${monthYear} (${transactions.length} transactions | +$${totalIncome.toFixed(2)} / -$${totalExpenses.toFixed(2)})`,
        transactions,
      };

      setManualTransactionCards(prev => [...prev, newCard]);
      setManualTransactionText(''); // Clear input
      setStatementDate(''); // Clear date
      toast.success(`✅ Created card: ${transactions.length} transactions (${transactions.filter(t => t.amount > 0).length} income, ${transactions.filter(t => t.amount < 0).length} expenses)`);

    } catch (error) {
      console.error('Error processing manual transactions:', error);
      toast.error('Failed to process transactions. Please check the format.');
    } finally {
      setIsProcessingManual(false);
    }
  };

  const handleCopyManualTransactions = (transactions: ManualTransaction[]) => {
    try {
      const jsonString = JSON.stringify(transactions, null, 2);
      navigator.clipboard.writeText(jsonString);
      toast.success(`✅ Copied ${transactions.length} transactions to clipboard!`);
    } catch (error) {
      console.error('Error copying transactions:', error);
      toast.error('Failed to copy transactions. Please try again.');
    }
  };

  const handleLoadManualTransactions = async (cardId: string, transactions: ManualTransaction[]) => {
    setLoadingTransactions(cardId);
    
    try {
      // Get the statement period from the card
      const card = manualTransactionCards.find(c => c.id === cardId);
      const statementPeriod = card?.monthYear.split('(')[0].trim() || '';

      // Step 1: Get AI to classify each transaction as BUSINESS or PERSONAL
      toast.info('🤖 AI is classifying transactions as Business or Personal...');
      
      const classificationPrompt = `Classify each of these transactions as either "BUSINESS" or "PERSONAL".

For BUSINESS transactions, look for:
- Office supplies, software, equipment
- Professional services, contractors, vendors
- Business travel, meals with clients
- Marketing, advertising expenses
- Utilities/rent for business locations
- Payroll, employee expenses

For PERSONAL transactions, look for:
- Groceries, personal shopping
- Personal dining, entertainment
- Personal healthcare, pharmacy
- Personal utilities, rent for home
- Personal vehicle expenses (non-business)
- Personal subscriptions, hobbies

Transactions:
${transactions.map((t, idx) => `${idx + 1}. ${t.date} | ${t.description} | $${t.amount}`).join('\n')}

Respond with a JSON array where each item has: { "index": number, "profileType": "BUSINESS" or "PERSONAL", "confidence": number (0-1) }`;

      const classificationResponse = await fetch('/api/chatllm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: classificationPrompt,
            },
          ],
          model: selectedModel,
          stream: false, // Get full response for classification
        }),
      });

      if (!classificationResponse.ok) {
        throw new Error('Failed to classify transactions');
      }

      const classificationData = await classificationResponse.json();
      let classifications: Array<{ index: number; profileType: 'BUSINESS' | 'PERSONAL'; confidence: number }> = [];

      try {
        // Parse the AI response
        const content = classificationData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          classifications = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse classification response:', parseError);
        toast.error('Failed to parse AI classification. Using fallback logic.');
      }

      // Step 2: Apply classifications to transactions
      const transactionsWithProfile = transactions.map((t, idx) => {
        const classification = classifications.find(c => c.index === idx + 1);
        let profileType: 'BUSINESS' | 'PERSONAL' = 'BUSINESS'; // Fallback

        if (classification) {
          profileType = classification.profileType;
          console.log(`[Classification] ${t.description.substring(0, 40)} → ${profileType} (confidence: ${classification.confidence})`);
        } else {
          // Fallback classification based on keywords
          const desc = t.description.toLowerCase();
          const isPersonal = 
            desc.includes('grocery') || desc.includes('walmart') || desc.includes('target') ||
            desc.includes('restaurant') || desc.includes('dining') || desc.includes('food') ||
            desc.includes('healthcare') || desc.includes('pharmacy') || desc.includes('cvs') ||
            desc.includes('personal') || desc.includes('amazon') || desc.includes('paypal') ||
            desc.includes('netflix') || desc.includes('spotify') || desc.includes('apple.com');
          
          profileType = isPersonal ? 'PERSONAL' : 'BUSINESS';
          console.log(`[Fallback Classification] ${t.description.substring(0, 40)} → ${profileType}`);
        }

        return {
          ...t,
          profileType,
        };
      });

      const businessCount = transactionsWithProfile.filter(t => t.profileType === 'BUSINESS').length;
      const personalCount = transactionsWithProfile.filter(t => t.profileType === 'PERSONAL').length;

      toast.info(`📊 Classified: ${businessCount} Business, ${personalCount} Personal`);

      // Step 3: Save transactions to database with statement period
      const response = await fetch('/api/bank-statements/load-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transactions: transactionsWithProfile,
          statementPeriod: statementPeriod
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transactions');
      }

      const result = await response.json();
      
      toast.success(`✅ Successfully loaded ${result.businessCount} Business + ${result.personalCount} Personal transactions!`);
      
      // Remove the card after loading
      setManualTransactionCards(prev => prev.filter(c => c.id !== cardId));
      
      // Refresh saved statements list
      await fetchSavedStatements();
      
    } catch (error) {
      console.error('Error loading manual transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoadingTransactions(null);
    }
  };

  const handleViewStatement = async (statementId: string) => {
    try {
      // Fetch ALL transactions for this statement (no limit)
      const response = await fetch(`/api/transactions?statementId=${statementId}&limit=10000`);
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      const transactions = data.transactions || [];
      
      // Find statement info
      const statementInfo = savedStatements.find(s => s.id === statementId);
      
      // Set modal state and open
      setViewingTransactions(transactions);
      setViewingStatementInfo(statementInfo);
      setViewModalOpen(true);
      
      toast.success(`Found ${transactions.length} transactions`);
    } catch (error) {
      console.error('Error viewing statement:', error);
      toast.error('Failed to view statement');
    }
  };

  const handleDownloadStatement = async (statementId: string) => {
    try {
      // Fetch ALL transactions for this statement (no limit)
      const response = await fetch(`/api/transactions?statementId=${statementId}&limit=10000`);
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      const transactions = data.transactions || [];
      
      // Convert to CSV format
      const csvHeader = 'Date,Description,Amount,Type,Category,Profile\n';
      const csvRows = transactions.map((t: any) => {
        const date = new Date(t.date).toLocaleDateString();
        const amount = t.type === 'EXPENSE' ? `-${t.amount}` : t.amount;
        return `${date},"${t.description}",${amount},${t.type},"${t.category}",${t.businessProfile?.name || ''}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${statementId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ Downloaded transactions as CSV');
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Bank Statements</h1>
          <Link href="/dashboard/bank-statements/hybrid?skipPdf=true">
            <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
              <ClipboardPaste className="w-4 h-4" />
              Paste Statement Text
            </Button>
          </Link>
        </div>

        {/* PDF Upload Section - Primary */}
        <Card className="bg-card-elevated border-primary/20 p-6 border-2 border-dashed border-primary/40 hover:border-primary/60 transition-colors">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Bank Statement PDF
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upload your bank statement PDF and we'll automatically extract all transactions using AI.
                  Supports PNC Business Checking Plus and other common formats.
                </p>
              </div>
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
            </div>

            {/* File Input Area - With Drag & Drop support */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                pdfFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              } ${isUploadingPdf ? 'pointer-events-none opacity-50' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add('border-primary', 'bg-primary/10');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('border-primary', 'bg-primary/10');

                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  if (file.type === 'application/pdf') {
                    setPdfFile(file);
                    setUploadStatus('idle');
                    setUploadError(null);
                    toast.success(`Selected: ${file.name}`);
                  } else {
                    toast.error('Please drop a PDF file');
                  }
                }
              }}
            >
              {pdfFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{pdfFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploadingPdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPdfFile(null);
                        setUploadStatus('idle');
                        if (pdfInputRef.current) pdfInputRef.current.value = '';
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Upload Bank Statement PDF
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF files only, max 50MB
                    </p>
                  </div>

                  {/* DRAG AND DROP - Primary method */}
                  <div className="w-full max-w-md p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-700 dark:text-blue-300 font-medium">
                      📁 Drag and drop your PDF file here
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                      Or use the file picker below
                    </p>
                  </div>

                  {/* Standard file input */}
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Select PDF from your computer:
                    </label>
                    <input
                      id="pdf-file-input"
                      ref={pdfInputRef}
                      type="file"
                      name="pdfFile"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfSelect}
                      disabled={isUploadingPdf}
                      className="block w-full text-sm text-gray-900 dark:text-gray-100
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-700
                        file:cursor-pointer
                        cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    {uploadStatus === 'uploading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 animate-pulse" />
                        Processing with AI...
                      </>
                    )}
                  </span>
                  <span className="font-medium text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Success Result */}
            {uploadStatus === 'success' && uploadResult && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Successfully Processed!
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-green-700 dark:text-green-300">Transactions:</span>
                        <span className="ml-2 font-semibold text-green-900 dark:text-green-100">
                          {uploadResult.transactionCount}
                        </span>
                      </div>
                      {uploadResult.bankName && (
                        <div>
                          <span className="text-green-700 dark:text-green-300">Bank:</span>
                          <span className="ml-2 font-semibold text-green-900 dark:text-green-100">
                            {uploadResult.bankName}
                          </span>
                        </div>
                      )}
                      {uploadResult.accountNumber && (
                        <div>
                          <span className="text-green-700 dark:text-green-300">Account:</span>
                          <span className="ml-2 font-semibold text-green-900 dark:text-green-100">
                            {uploadResult.accountNumber}
                          </span>
                        </div>
                      )}
                      {uploadResult.statementPeriod && (
                        <div>
                          <span className="text-green-700 dark:text-green-300">Period:</span>
                          <span className="ml-2 font-semibold text-green-900 dark:text-green-100">
                            {uploadResult.statementPeriod}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Add Missing Transactions Button */}
                    <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
                      <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                        Missing some transactions? Add them manually:
                      </p>
                      <Link
                        href={`/dashboard/bank-statements/hybrid?bankStatementId=${uploadResult.statementId}`}
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <ClipboardPaste className="w-4 h-4" />
                          Add Missing Transactions
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadStatus === 'error' && uploadError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      Upload Failed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {uploadError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handlePdfUpload}
              disabled={!pdfFile || isUploadingPdf || uploadStatus === 'processing'}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg"
            >
              {isUploadingPdf || uploadStatus === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadStatus === 'processing' ? 'Processing...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Process PDF
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Manual Transaction Entry Section */}
        <Card className="bg-card-elevated border-primary/20 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Manual Transaction Entry
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste your transactions below. Each batch should be for one month/year.
              </p>
            </div>

            {/* Statement Date Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Statement Date (e.g., January 2024)
              </label>
              <input
                type="text"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                placeholder="January 2024"
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isProcessingManual}
              />
            </div>

            {/* Text Input */}
            <textarea
              value={manualTransactionText}
              onChange={(e) => setManualTransactionText(e.target.value)}
              placeholder="Paste your bank statement transactions here (including all sections like Deposits, Debit Card Purchases, ACH Deductions, etc.)..."
              className="w-full min-h-[200px] p-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono text-sm"
              disabled={isProcessingManual}
            />

            {/* Process Button */}
            <Button
              onClick={handleProcessManualTransactions}
              disabled={!manualTransactionText.trim() || isProcessingManual}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isProcessingManual ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Transaction Card
                </>
              )}
            </Button>
          </div>

          {/* Manual Transaction Cards Display */}
          {manualTransactionCards.length > 0 && (
            <div ref={manualCardsRef} className="mt-6 border-t pt-6 border-primary/20">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Transaction Cards ({manualTransactionCards.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {manualTransactionCards.map((card) => (
                <Card key={card.id} className="bg-card border-primary/30 p-3 h-[240px] flex flex-col">
                  <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-foreground">
                        {card.monthYear}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                          {card.transactions.length} transactions
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyManualTransactions(card.transactions)}
                          className="h-7 px-2 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCard(card.id)}
                          className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Transaction List - Compact Preview */}
                    <div className="flex-1 overflow-y-auto space-y-1">
                      {card.transactions.slice(0, 4).map((transaction, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs"
                        >
                          <div className="flex-1 min-w-0 mr-1">
                            <span className="font-medium text-foreground truncate block">
                              {transaction.description}
                            </span>
                            <span className="text-muted-foreground text-[10px]">{transaction.date}</span>
                          </div>
                          <span className={`font-semibold whitespace-nowrap ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {card.transactions.length > 4 && (
                        <div className="text-[10px] text-muted-foreground text-center py-0.5">
                          +{card.transactions.length - 4} more
                        </div>
                      )}
                    </div>

                    {/* Load Button */}
                    <Button
                      onClick={() => handleLoadManualTransactions(card.id, card.transactions)}
                      disabled={loadingTransactions === card.id}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs mt-auto"
                    >
                      {loadingTransactions === card.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Load ({card.transactions.length})
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
              </div>
            </div>
          )}
        </Card>

        {/* Saved Statements Section */}
        {savedStatements.length > 0 && (
          <Card className="bg-card-elevated border-primary/20 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Saved Statements ({savedStatements.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedStatements.map((statement) => (
                <Card key={statement.id} className="bg-card border-primary/30 p-3 h-[200px] flex flex-col">
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2">
                        {statement.fileName || statement.originalName}
                      </h4>
                      
                      <div className="flex flex-col gap-1.5 text-xs">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium inline-flex items-center w-fit">
                          {statement.transactionCount} transactions
                        </span>
                        {statement.statementPeriod && (
                          <span className="text-muted-foreground text-[11px]">
                            📅 {statement.statementPeriod}
                          </span>
                        )}
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(statement.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 pt-2 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStatement(statement.id)}
                        className="flex-1 h-7 text-[11px] px-2"
                      >
                        <FileText className="w-3 h-3 mr-0.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadStatement(statement.id)}
                        className="flex-1 h-7 text-[11px] px-2"
                      >
                        <Copy className="w-3 h-3 mr-0.5" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteStatement(statement.id)}
                        className="h-7 px-2 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

      </div>

      {/* View Statement Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {viewingStatementInfo?.fileName || viewingStatementInfo?.originalName || 'Statement Transactions'}
            </DialogTitle>
            <DialogDescription>
              {viewingStatementInfo?.statementPeriod && (
                <span className="text-sm">Period: {viewingStatementInfo.statementPeriod}</span>
              )}
              {' • '}
              <span className="text-sm">{viewingTransactions.length} transactions</span>
            </DialogDescription>
          </DialogHeader>

          {/* Balance Summary Card */}
          {(viewingStatementInfo?.beginningBalance !== null || viewingStatementInfo?.endingBalance !== null) && (
            <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Balance Summary</h3>
                {viewingStatementInfo?.validationResult?.balanceReconciliation?.isReconciled !== undefined && (
                  viewingStatementInfo.validationResult.balanceReconciliation.isReconciled ? (
                    <span className="ml-auto text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Reconciled
                    </span>
                  ) : (
                    <span className="ml-auto text-xs bg-amber-500/20 text-amber-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Mismatch
                    </span>
                  )
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Beginning Balance</div>
                  <div className="font-medium text-foreground">
                    ${viewingStatementInfo?.beginningBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Total Credits</div>
                  <div className="font-medium text-green-600">
                    +${viewingStatementInfo?.validationResult?.balanceReconciliation?.totalCredits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Total Debits</div>
                  <div className="font-medium text-red-600">
                    -${viewingStatementInfo?.validationResult?.balanceReconciliation?.totalDebits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Ending Balance</div>
                  <div className="font-medium text-foreground">
                    ${viewingStatementInfo?.endingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Balance Reconciliation Mismatch Warning */}
              {viewingStatementInfo?.validationResult?.balanceReconciliation &&
               !viewingStatementInfo.validationResult.balanceReconciliation.isReconciled && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-semibold text-red-700 mb-1">Balance Reconciliation Mismatch</div>
                      <div className="text-red-600 space-y-1">
                        <p>
                          <span className="font-medium">Calculated:</span> ${viewingStatementInfo?.beginningBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })} +
                          ${viewingStatementInfo.validationResult.balanceReconciliation.totalCredits?.toLocaleString('en-US', { minimumFractionDigits: 2 })} -
                          ${viewingStatementInfo.validationResult.balanceReconciliation.totalDebits?.toLocaleString('en-US', { minimumFractionDigits: 2 })} =
                          <span className="font-bold"> ${viewingStatementInfo.validationResult.balanceReconciliation.calculatedEnding?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </p>
                        <p>
                          <span className="font-medium">Expected:</span>
                          <span className="font-bold"> ${viewingStatementInfo?.endingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </p>
                        <p className="font-semibold text-red-700">
                          Difference: ${Math.abs(viewingStatementInfo.validationResult.balanceReconciliation.difference || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          {(viewingStatementInfo.validationResult.balanceReconciliation.difference || 0) > 0 ? ' (missing credits or extra debits)' : ' (missing debits or extra credits)'}
                        </p>
                      </div>
                      <p className="text-xs text-red-500/80 mt-2">
                        ⚠️ Some transactions may not have been extracted from the PDF. Consider re-uploading or manually reviewing the original statement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sequential Statement Warning */}
              {viewingStatementInfo?.validationResult?.sequentialValidation &&
               !viewingStatementInfo.validationResult.sequentialValidation.isSequential && (
                <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-700">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Gap detected: Previous statement ended at ${viewingStatementInfo.validationResult.sequentialValidation.previousEndingBalance?.toFixed(2)},
                  but this one begins at ${viewingStatementInfo.validationResult.sequentialValidation.currentBeginningBalance?.toFixed(2)}.
                  You may be missing a statement.
                </div>
              )}
            </div>
          )}

          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-2">
              {viewingTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                viewingTransactions.map((transaction: any, idx: number) => (
                  <div
                    key={transaction.id || idx}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    {/* Sequential Transaction Number */}
                    <div className="flex-shrink-0 w-12 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">#{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {transaction.businessProfileId && (
                          transaction.businessProfile?.type === 'BUSINESS' ? (
                            <Building2 className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Home className="w-4 h-4 text-green-500" />
                          )
                        )}
                        <span className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span className="truncate">{transaction.category}</span>
                          </>
                        )}
                        {transaction.type && (
                          <>
                            <span>•</span>
                            <span className="uppercase">{transaction.type}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`text-sm font-semibold whitespace-nowrap ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="flex items-center justify-between pt-4 border-t">
            {/* Transaction Count Verification */}
            <div className="text-sm text-muted-foreground">
              {viewingTransactions.length > 0 && (
                <span className="font-medium">
                  Showing <span className="text-primary font-bold">#1</span> to{' '}
                  <span className="text-primary font-bold">#{viewingTransactions.length}</span>{' '}
                  of {viewingTransactions.length} transactions
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (viewingStatementInfo?.id) {
                    handleDownloadStatement(viewingStatementInfo.id);
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
