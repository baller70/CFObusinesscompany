
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  category: string;
}

interface ParsedStatement {
  statementType: string;
  accountNumber: string;
  accountName?: string;
  periodStart: string;
  periodEnd: string;
  beginningBalance: number;
  endingBalance: number;
  transactions: ParsedTransaction[];
}

function ReviewPageContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const statementId = searchParams?.get('id');
  
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [statement, setStatement] = useState<any>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && statementId) {
      fetchStatement();
    }
  }, [status, statementId, router]);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/statements/review?id=${statementId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch statement');
      }

      setStatement(data.statement);
      const parsedData = data.statement.parsedData as ParsedStatement;
      setTransactions(parsedData?.transactions || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load statement');
      router.push('/dashboard/statements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!statementId) return;

    setApproving(true);

    try {
      const res = await fetch('/api/statements/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementId,
          transactions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve statement');
      }

      toast.success(`Successfully imported ${data.transactionsCreated} transactions!`);
      router.push('/dashboard/statements');
    } catch (error: any) {
      toast.error(error.message || 'Failed to import transactions');
    } finally {
      setApproving(false);
    }
  };

  const updateTransaction = (index: number, field: string, value: any) => {
    const updated = [...transactions];
    (updated[index] as any)[field] = value;
    setTransactions(updated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading statement...</p>
        </div>
      </div>
    );
  }

  if (!statement) return null;

  const parsedData = statement.parsedData as ParsedStatement;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/statements')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Statements
        </Button>
        <h1 className="text-3xl font-bold mb-2">Review Statement</h1>
        <p className="text-muted-foreground">
          Review and edit transactions before importing into your account
        </p>
      </div>

      {/* Statement Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Statement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-muted-foreground">File Name</Label>
              <p className="font-medium mt-1">{statement.fileName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Type</Label>
              <p className="font-medium mt-1 capitalize">{parsedData?.statementType}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Number</Label>
              <p className="font-medium mt-1">{parsedData?.accountNumber}</p>
            </div>
            {parsedData?.accountName && (
              <div>
                <Label className="text-muted-foreground">Account Name</Label>
                <p className="font-medium mt-1">{parsedData.accountName}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Statement Period</Label>
              <p className="font-medium mt-1">
                {formatDate(parsedData?.periodStart)} - {formatDate(parsedData?.periodEnd)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Transactions Found</Label>
              <p className="font-medium mt-1">{transactions.length}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Beginning Balance</Label>
              <p className="font-medium mt-1">
                {formatCurrency(parsedData?.beginningBalance || 0)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Ending Balance</Label>
              <p className="font-medium mt-1">
                {formatCurrency(parsedData?.endingBalance || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">Amount</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(txn.date)}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={txn.description}
                        onChange={(e) =>
                          updateTransaction(index, 'description', e.target.value)
                        }
                        className="min-w-[250px]"
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          txn.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                        }
                      >
                        {txn.amount >= 0 ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={txn.category}
                        onChange={(e) =>
                          updateTransaction(index, 'category', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.amount >= 0 ? 'default' : 'secondary'}>
                        {txn.amount >= 0 ? 'Income' : 'Expense'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/statements')}
          disabled={approving}
        >
          Cancel
        </Button>
        <Button onClick={handleApprove} disabled={approving}>
          {approving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Importing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Import {transactions.length} Transactions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
