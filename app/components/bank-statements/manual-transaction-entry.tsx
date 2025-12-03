'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ClipboardPaste, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManualTransactionEntryProps {
  sessionId: string;
  bankStatementId?: string;
  onTransactionsStaged: (count: number) => void;
}

interface ParsedPreview {
  date: string;
  description: string;
  amount: number;
  type: string;
}

export function ManualTransactionEntry({ 
  sessionId, 
  bankStatementId,
  onTransactionsStaged 
}: ManualTransactionEntryProps) {
  const [inputMethod, setInputMethod] = useState<'paste' | 'form'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPreview[]>([]);
  const [staged, setStaged] = useState(false);

  const handleParse = async () => {
    if (!pasteContent.trim()) {
      setError('Please paste some transaction data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transactions/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          bankStatementId,
          source: 'MANUAL',
          rawText: pasteContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse transactions');
      }

      if (data.stagedCount === 0) {
        setError('Could not parse any transactions. Check the format and try again.');
        return;
      }

      // Show preview
      setPreview(data.transactions.map((t: any) => ({
        date: new Date(t.date).toLocaleDateString(),
        description: t.description,
        amount: t.amount,
        type: t.type
      })));

      setStaged(true);
      onTransactionsStaged(data.stagedCount);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setPasteContent('');
    setPreview([]);
    setStaged(false);
    setError(null);

    // Clear staged transactions
    await fetch(`/api/transactions/stage?sessionId=${sessionId}`, {
      method: 'DELETE'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardPaste className="h-5 w-5" />
          Add Missing Transactions
        </CardTitle>
        <CardDescription>
          Copy transactions from your bank statement PDF and paste them here.
          The system will merge them with the extracted transactions and remove duplicates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'paste' | 'form')}>
          <TabsList className="mb-4">
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
            <TabsTrigger value="form" disabled>Manual Form (Coming Soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            {!staged ? (
              <>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Supported formats:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Tab-separated (copy from Excel/Google Sheets)</li>
                    <li>CSV format (Date, Description, Amount)</li>
                    <li>Space-separated (copy from PDF)</li>
                  </ul>
                  <p className="text-xs mt-2">
                    Example: <code className="bg-muted px-1 rounded">01/15/2024  AMAZON PURCHASE  -45.99</code>
                  </p>
                </div>

                <Textarea
                  placeholder="Paste your transactions here...&#10;&#10;Example:&#10;01/15/2024    AMAZON PURCHASE    -45.99&#10;01/16/2024    DIRECT DEPOSIT    2500.00"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleParse} disabled={isLoading || !pasteContent.trim()}>
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing...</>
                  ) : (
                    <><FileText className="h-4 w-4 mr-2" /> Parse Transactions</>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Successfully parsed {preview.length} transactions. Ready for reconciliation.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-sm font-medium">
                    Parsed Transactions Preview
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2">Date</th>
                          <th className="text-left px-4 py-2">Description</th>
                          <th className="text-right px-4 py-2">Amount</th>
                          <th className="text-center px-4 py-2">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((txn, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-4 py-2">{txn.date}</td>
                            <td className="px-4 py-2 truncate max-w-[200px]">{txn.description}</td>
                            <td className="px-4 py-2 text-right font-mono">
                              ${txn.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant={txn.type === 'INCOME' ? 'default' : 'secondary'}>
                                {txn.type}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button variant="outline" onClick={handleClear}>
                  Clear & Start Over
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

