
'use client';

import { useRef, useState } from 'react';
import BankStatementUploader from '@/components/bank-statements/bank-statement-uploader';
import UploadHistory, { UploadHistoryRef } from '@/components/bank-statements/upload-history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, FileText } from 'lucide-react';

export default function BankStatementsClient() {
  const historyRef = useRef<UploadHistoryRef>(null);
  const [statementDate, setStatementDate] = useState('');
  const [statementText, setStatementText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadComplete = () => {
    // Trigger refresh of the history component
    historyRef.current?.refresh();
  };

  const handleProcessText = async () => {
    if (!statementDate || !statementText.trim()) {
      toast.error('Please enter both statement date and statement text');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/bank-statements/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statementDate,
          statementText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process statement text');
      }

      toast.success(`Processing started! ${data.transactionCount || 0} transactions extracted.`);
      
      // Clear form
      setStatementDate('');
      setStatementText('');
      
      // Refresh history
      handleUploadComplete();
    } catch (error) {
      console.error('Error processing text:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process statement text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-heading text-foreground mb-3">
            BANK STATEMENT PROCESSING
          </h1>
          <p className="text-body text-muted-foreground max-w-3xl">
            Upload your bank statements (CSV or PDF) and let our AI CFO automatically extract, categorize, and analyze your financial data. 
            The system will distribute transactions to appropriate categories and provide strategic insights.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-subheading text-foreground mb-6">
            UPLOAD STATEMENTS
          </h2>
          <BankStatementUploader onUploadComplete={handleUploadComplete} />
        </div>

        {/* Manual Text Entry Section */}
        <div className="mb-12">
          <h2 className="text-subheading text-foreground mb-6">
            OR PASTE STATEMENT TEXT
          </h2>
          <Card className="p-6 bg-card-elevated border-primary/20">
            <div className="space-y-4">
              <div>
                <label htmlFor="statementDate" className="block text-sm font-medium text-foreground mb-2">
                  Statement Date
                </label>
                <Input
                  id="statementDate"
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="max-w-xs"
                  placeholder="Select statement date"
                />
              </div>
              
              <div>
                <label htmlFor="statementText" className="block text-sm font-medium text-foreground mb-2">
                  Statement Text
                </label>
                <Textarea
                  id="statementText"
                  value={statementText}
                  onChange={(e) => setStatementText(e.target.value)}
                  placeholder="Paste your bank statement text here..."
                  className="min-h-[400px] font-mono text-sm"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Copy and paste the text content from your PDF statement
                </p>
              </div>

              <Button
                onClick={handleProcessText}
                disabled={isProcessing || !statementDate || !statementText.trim()}
                className="w-full sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Process Statement Text
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* History Section */}
        <div>
          <h2 className="text-subheading text-foreground mb-6">
            PROCESSING HISTORY
          </h2>
          <UploadHistory ref={historyRef} />
        </div>
      </div>
    </div>
  );
}
