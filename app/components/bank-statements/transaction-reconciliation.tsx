'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, CheckCircle2, GitMerge, Loader2, ArrowRight,
  FileText, ClipboardPaste, Eye, Trash2, Check
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ReconciliationProps {
  sessionId: string;
  bankStatementId?: string;
  pdfCount: number;
  manualCount: number;
  onComplete: (committedCount: number) => void;
}

interface ReconcileResult {
  summary: {
    totalPdf: number;
    totalManual: number;
    autoMerged: number;
    needsReview: number;
    pdfOnly: number;
    manualOnly: number;
    duplicatesFound: number;
  };
  autoMerged: any[];
  needsReview: any[];
  pdfOnly: any[];
  manualOnly: any[];
}

export function TransactionReconciliation({
  sessionId,
  bankStatementId,
  pdfCount,
  manualCount,
  onComplete
}: ReconciliationProps) {
  const [step, setStep] = useState<'ready' | 'reconciling' | 'review' | 'committing' | 'done'>('ready');
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Map<string, 'KEEP' | 'DISCARD'>>(new Map());
  const [committedCount, setCommittedCount] = useState(0);

  const handleReconcile = async () => {
    setStep('reconciling');
    setError(null);

    try {
      const response = await fetch('/api/transactions/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, bankStatementId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setResult(data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconciliation failed');
      setStep('ready');
    }
  };

  const handleCommit = async () => {
    setStep('committing');
    setError(null);

    try {
      const response = await fetch('/api/transactions/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          bankStatementId,
          decisions: Array.from(decisions.entries()).map(([id, decision]) => ({ id, decision }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setCommittedCount(data.committedCount);
      setStep('done');
      onComplete(data.committedCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Commit failed');
      setStep('review');
    }
  };

  const setDecision = (id: string, decision: 'KEEP' | 'DISCARD') => {
    setDecisions(new Map(decisions.set(id, decision)));
  };

  // Calculate totals for review
  // autoMerged = pairs that matched (each pair = 1 final transaction)
  // pdfOnly = PDF transactions with no match (unique)
  // manualOnly = Manual transactions with no match (unique)
  // needsReview = pairs that need user review (each pair = 1 final transaction if kept)
  const totalToCommit = result ?
    (result.summary.autoMerged +
     result.summary.pdfOnly +
     result.summary.manualOnly +
     result.summary.needsReview -
     Array.from(decisions.values()).filter(d => d === 'DISCARD').length) : 0;

  // Calculate how many duplicates were removed
  const duplicatesRemoved = result ?
    (result.summary.totalPdf + result.summary.totalManual) - totalToCommit : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          Reconciliation
        </CardTitle>
        <CardDescription>
          Compare and merge transactions from PDF extraction and manual entry
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'ready' && (
          <div className="space-y-4">
            <Alert>
              <GitMerge className="h-4 w-4" />
              <AlertDescription>
                Click "Run Deduplication" to find and remove duplicate transactions between PDF and manual entries.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" /> PDF Extracted
                </div>
                <div className="text-2xl font-bold">{pdfCount}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <ClipboardPaste className="h-4 w-4" /> Manually Added
                </div>
                <div className="text-2xl font-bold">{manualCount}</div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Total before deduplication: <strong>{pdfCount + manualCount}</strong> transactions
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleReconcile} className="w-full" size="lg">
              <GitMerge className="h-4 w-4 mr-2" />
              Run Deduplication
            </Button>
          </div>
        )}

        {step === 'reconciling' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing transactions for duplicates...</p>
          </div>
        )}

        {step === 'review' && result && (
          <div className="space-y-6">
            {/* Deduplication Summary */}
            {duplicatesRemoved > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <span className="font-semibold text-green-800">
                    ✅ Deduplication Complete: {duplicatesRemoved} duplicate transactions removed
                  </span>
                  <div className="text-sm text-green-700 mt-1">
                    {result.summary.totalPdf} PDF + {result.summary.totalManual} Manual → {totalToCommit} unique transactions
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">{result.summary.autoMerged}</div>
                <div className="text-xs text-green-600">Duplicates Merged</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-700">{result.summary.needsReview}</div>
                <div className="text-xs text-yellow-600">Needs Review</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">{result.summary.pdfOnly}</div>
                <div className="text-xs text-blue-600">PDF Only</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-700">{result.summary.manualOnly}</div>
                <div className="text-xs text-purple-600">Manual Only</div>
              </div>
            </div>

            {/* Details Tabs */}
            <Tabs defaultValue="merged">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="merged">Merged ({result.summary.autoMerged})</TabsTrigger>
                <TabsTrigger value="review">Review ({result.summary.needsReview})</TabsTrigger>
                <TabsTrigger value="pdf">PDF Only ({result.summary.pdfOnly})</TabsTrigger>
                <TabsTrigger value="manual">Manual ({result.summary.manualOnly})</TabsTrigger>
              </TabsList>

              <TabsContent value="merged" className="max-h-[250px] overflow-y-auto border rounded mt-2">
                {result.autoMerged.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.autoMerged.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(m.merged.date).toLocaleDateString()}</TableCell>
                          <TableCell className="truncate max-w-[200px]">{m.merged.description}</TableCell>
                          <TableCell className="text-right">${m.merged.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default">{m.matchScore}%</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="p-4 text-sm text-muted-foreground">No auto-merged transactions</p>}
              </TabsContent>

              <TabsContent value="review" className="max-h-[250px] overflow-y-auto border rounded mt-2">
                {result.needsReview.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PDF Transaction</TableHead>
                        <TableHead>Manual Transaction</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.needsReview.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            {new Date(r.pdf.date).toLocaleDateString()}: {r.pdf.description.substring(0,30)}...
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(r.manual.date).toLocaleDateString()}: {r.manual.description.substring(0,30)}...
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{r.matchScore}%</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" variant="ghost" onClick={() => setDecision(r.manual.id, 'DISCARD')}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="p-4 text-sm text-muted-foreground">No transactions need review</p>}
              </TabsContent>

              <TabsContent value="pdf" className="max-h-[250px] overflow-y-auto border rounded mt-2">
                {result.pdfOnly.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.pdfOnly.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                          <TableCell className="truncate max-w-[200px]">{t.description}</TableCell>
                          <TableCell className="text-right">${t.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="p-4 text-sm text-muted-foreground">All PDF transactions matched</p>}
              </TabsContent>

              <TabsContent value="manual" className="max-h-[250px] overflow-y-auto border rounded mt-2">
                {result.manualOnly.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.manualOnly.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                          <TableCell className="truncate max-w-[200px]">{t.description}</TableCell>
                          <TableCell className="text-right">${t.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="p-4 text-sm text-muted-foreground">All manual entries matched</p>}
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total to commit: <strong>{totalToCommit}</strong> transactions
              </div>
              <Button onClick={handleCommit} size="lg">
                <Check className="h-4 w-4 mr-2" />
                Commit Transactions
              </Button>
            </div>
          </div>
        )}

        {step === 'committing' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Saving transactions...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">Success!</h3>
            <p className="text-muted-foreground">
              {committedCount} transactions have been saved.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

