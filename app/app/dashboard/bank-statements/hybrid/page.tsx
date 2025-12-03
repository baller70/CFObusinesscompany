'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ManualTransactionEntry } from '@/components/bank-statements/manual-transaction-entry';
import { TransactionReconciliation } from '@/components/bank-statements/transaction-reconciliation';
import {
  FileText, ClipboardPaste, GitMerge, CheckCircle2,
  ArrowRight, Upload, Loader2, AlertCircle, FileUp
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export default function HybridCapturePage() {
  const searchParams = useSearchParams();
  const bankStatementId = searchParams.get('bankStatementId');
  const skipPdf = searchParams.get('skipPdf') === 'true';

  const [sessionId] = useState(() => uuidv4());
  const [step, setStep] = useState<'pdf' | 'manual' | 'reconcile' | 'complete'>(skipPdf ? 'manual' : 'pdf');
  const [pdfCount, setPdfCount] = useState(0);
  const [manualCount, setManualCount] = useState(0);
  const [finalCount, setFinalCount] = useState(0);
  const [bankStatement, setBankStatement] = useState<any>(null);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSummary, setParseSummary] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load bank statement info if ID provided
  useEffect(() => {
    if (bankStatementId) {
      loadBankStatement();
    }
  }, [bankStatementId]);

  const loadBankStatement = async () => {
    try {
      const response = await fetch(`/api/bank-statements/${bankStatementId}`);
      if (response.ok) {
        const data = await response.json();
        setBankStatement(data);
        setPdfCount(data.transactionCount || 0);
        
        // Stage PDF transactions
        await stagePdfTransactions(data.extractedData?.transactions || []);
        
        if (data.transactionCount > 0) {
          setStep('manual');
        }
      }
    } catch (err) {
      console.error('Failed to load bank statement:', err);
    }
  };

  const stagePdfTransactions = async (transactions: any[]) => {
    if (transactions.length === 0) return;

    try {
      await fetch('/api/transactions/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          bankStatementId,
          source: 'PDF',
          transactions: transactions.map(t => ({
            date: t.date,
            amount: Math.abs(parseFloat(t.amount) || 0),
            description: t.description,
            merchant: t.merchant,
            category: t.category,
            type: t.type || (parseFloat(t.amount) < 0 ? 'EXPENSE' : 'INCOME'),
            confidence: t.confidence || 0.8
          }))
        })
      });
    } catch (err) {
      console.error('Failed to stage PDF transactions:', err);
    }
  };

  // Handle PDF file selection
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Common file handler for both input and drag/drop
  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    setPdfFile(file);
    setParseError(null);
    setParseSummary(null);
    toast.success(`Selected: ${file.name}`);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Parse PDF using our verified parser
  const handleParsePdf = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      // Clear any existing staged transactions for this session first
      await fetch(`/api/transactions/stage?sessionId=${sessionId}`, {
        method: 'DELETE'
      });

      const formData = new FormData();
      formData.append('file', pdfFile);

      const response = await fetch('/api/transactions/parse-pdf', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      // Stage the parsed transactions with source='PDF'
      await fetch('/api/transactions/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          source: 'PDF',
          transactions: data.transactions.map((t: any) => ({
            date: t.date,
            amount: t.amount,
            description: t.description,
            type: t.type,
            confidence: 1.0 // 100% confidence from verified parser
          }))
        })
      });

      setParseSummary(data.summary);
      setPdfCount(data.transactionCount);
      setManualCount(0); // Reset manual count since we cleared everything
      toast.success(`Parsed ${data.transactionCount} transactions from PDF`);

      // Stay on PDF step to show results - user can then proceed

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to parse PDF';
      setParseError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualStaged = (count: number) => {
    setManualCount(count);
  };

  const handleReconcileComplete = (count: number) => {
    setFinalCount(count);
    setStep('complete');
  };

  const getStepProgress = () => {
    switch (step) {
      case 'pdf': return 25;
      case 'manual': return 50;
      case 'reconcile': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hybrid Transaction Capture</h1>
        <p className="text-muted-foreground">
          Combine PDF extraction with manual entry to capture all transactions
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between mb-2 text-sm">
            <span className={step === 'pdf' ? 'font-bold text-primary' : ''}>
              1. PDF Upload
            </span>
            <span className={step === 'manual' ? 'font-bold text-primary' : ''}>
              2. Manual Entry
            </span>
            <span className={step === 'reconcile' ? 'font-bold text-primary' : ''}>
              3. Reconcile
            </span>
            <span className={step === 'complete' ? 'font-bold text-primary' : ''}>
              4. Complete
            </span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
          
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-1">
                <FileText className="h-3 w-3 mr-1" /> PDF
              </Badge>
              <div className="text-xl font-bold">{pdfCount}</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-1">
                <ClipboardPaste className="h-3 w-3 mr-1" /> Manual
              </Badge>
              <div className="text-xl font-bold">{manualCount}</div>
            </div>
            {finalCount > 0 && (
              <div className="text-center">
                <Badge className="mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Final
                </Badge>
                <div className="text-xl font-bold text-green-600">{finalCount}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 'pdf' && !bankStatementId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Step 1: Upload PNC Bank Statement PDF
            </CardTitle>
            <CardDescription>
              Upload your PNC bank statement PDF. Our optimized parser will extract all transactions with 100% accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                ${pdfFile ? 'border-green-500 bg-green-50' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !pdfFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfSelect}
                className="hidden"
              />
              {!pdfFile ? (
                <div className="space-y-3">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-lg">
                      {isDragging ? 'Drop your PDF here' : 'Drag & drop your PNC statement PDF'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                  <p className="font-medium text-lg">{pdfFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(pdfFile.size / 1024).toFixed(1)} KB
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button variant="outline" onClick={() => {
                      setPdfFile(null);
                      setParseError(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}>
                      Change File
                    </Button>
                    <Button onClick={handleParsePdf} disabled={isParsing} size="lg">
                      {isParsing ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing...</>
                      ) : (
                        <><FileText className="h-4 w-4 mr-2" /> Parse Transactions</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {/* Show parse results */}
            {pdfCount > 0 && parseSummary && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-800">
                      ✅ Successfully parsed {pdfCount} transactions from PDF
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
                      <div>
                        <span className="font-medium">Income:</span> {parseSummary.incomeCount} transactions (${parseSummary.totalIncome?.toLocaleString() || '0'})
                      </div>
                      <div>
                        <span className="font-medium">Expenses:</span> {parseSummary.expenseCount} transactions (${parseSummary.totalExpense?.toLocaleString() || '0'})
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Continue button after successful parse */}
            {pdfCount > 0 && (
              <div className="flex justify-between items-center border-t pt-4">
                <Button variant="outline" onClick={() => setStep('manual')}>
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Add Manual Entries
                </Button>
                <Button onClick={() => setStep('reconcile')} size="lg">
                  Continue to Reconciliation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Skip to manual entry if no PDF parsed yet */}
            {pdfCount === 0 && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Or paste statement text instead:</strong>
                </p>
                <Button variant="outline" onClick={() => setStep('manual')}>
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Skip to Paste Text
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'manual' && (
        <div className="space-y-4">
          <ManualTransactionEntry
            sessionId={sessionId}
            bankStatementId={bankStatementId || undefined}
            onTransactionsStaged={handleManualStaged}
          />
          
          {manualCount > 0 && (
            <div className="flex justify-end">
              <Button onClick={() => setStep('reconcile')} size="lg">
                Continue to Reconciliation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          {pdfCount > 0 && manualCount === 0 && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setStep('reconcile')}>
                Skip Manual Entry - Commit PDF Only
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 'reconcile' && (
        <TransactionReconciliation
          sessionId={sessionId}
          bankStatementId={bankStatementId || undefined}
          pdfCount={pdfCount}
          manualCount={manualCount}
          onComplete={handleReconcileComplete}
        />
      )}

      {step === 'complete' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">All Done!</h2>
            <p className="text-muted-foreground mb-6">
              {finalCount} transactions have been saved to your account.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <a href="/dashboard/transactions">View Transactions</a>
              </Button>
              <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

