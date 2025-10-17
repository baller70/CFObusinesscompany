
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MoveRight,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: Date | string;
  amount: number;
  description: string;
  merchant?: string | null;
  category: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface BusinessProfile {
  id: string;
  name: string;
  type: 'PERSONAL' | 'BUSINESS';
  icon?: string | null;
  color?: string | null;
}

interface BulkOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currentProfileId?: string;
  onSuccess?: () => void;
}

export default function BulkOperationsDialog({
  open,
  onClose,
  transaction,
  currentProfileId,
  onSuccess
}: BulkOperationsDialogProps) {
  const [operation, setOperation] = useState<'move' | 'delete' | 'recategorize'>('move');
  const [targetProfileId, setTargetProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [similarTransactions, setSimilarTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      fetchProfiles();
      previewSimilar();
    }
  }, [open, transaction]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/business-profiles');
      const data = await response.json();
      if (data.success) {
        setProfiles(data.profiles);
        // Auto-select the opposite profile type
        const currentProfile = data.profiles.find((p: BusinessProfile) => p.id === currentProfileId);
        const targetProfile = data.profiles.find((p: BusinessProfile) => 
          p.type !== currentProfile?.type
        );
        if (targetProfile) {
          setTargetProfileId(targetProfile.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const previewSimilar = async () => {
    if (!transaction) return;
    
    setPreviewing(true);
    try {
      const response = await fetch('/api/transactions/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'preview_similar',
          transactionId: transaction.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSimilarTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to preview:', error);
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecute = async () => {
    if (!transaction) return;

    if (operation === 'move' && !targetProfileId) {
      toast.error('Please select a target business profile');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/transactions/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operation === 'move' ? 'move_similar' : 
                    operation === 'delete' ? 'delete_similar' : 
                    'recategorize_similar',
          transactionId: transaction.id,
          targetProfileId: operation === 'move' ? targetProfileId : undefined
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('Failed to perform bulk operation');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  const getOperationIcon = () => {
    switch (operation) {
      case 'move': return <MoveRight className="h-5 w-5" />;
      case 'delete': return <Trash2 className="h-5 w-5" />;
      case 'recategorize': return <RefreshCw className="h-5 w-5" />;
    }
  };

  const getOperationColor = () => {
    switch (operation) {
      case 'move': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      case 'recategorize': return 'text-purple-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOperationIcon()}
            BULK OPERATIONS
          </DialogTitle>
          <DialogDescription>
            Perform actions on all similar transactions at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Selected Transaction Info */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">REFERENCE TRANSACTION</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {transaction.merchant || transaction.description}
                </span>
                <span className={`text-sm font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{transaction.category}</Badge>
                <Badge variant="outline">{format(new Date(transaction.date), 'MMM d, yyyy')}</Badge>
              </div>
            </div>
          </div>

          {/* Found Similar */}
          {!previewing && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Found <strong>{similarTransactions.length}</strong> similar transaction{similarTransactions.length !== 1 ? 's' : ''} 
                {similarTransactions.length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 h-auto p-0"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview List */}
          {showPreview && similarTransactions.length > 0 && (
            <ScrollArea className="h-48 border border-border rounded-lg">
              <div className="p-4 space-y-2">
                {similarTransactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-foreground">
                        {t.merchant || t.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(t.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {t.amount < 0 ? '-' : ''}${Math.abs(t.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
                {similarTransactions.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    + {similarTransactions.length - 10} more transactions
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Operation Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">SELECT OPERATION</h4>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as any)}>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="move" id="move" />
                <Label htmlFor="move" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MoveRight className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">MOVE TO DIFFERENT PROFILE</div>
                      <div className="text-xs text-muted-foreground">
                        Transfer all similar transactions to another business or personal/household profile
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium">DELETE ALL SIMILAR</div>
                      <div className="text-xs text-muted-foreground">
                        Permanently remove all similar transactions
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Target Profile Selection */}
          {operation === 'move' && profiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">SELECT TARGET PROFILE</h4>
              <RadioGroup value={targetProfileId} onValueChange={setTargetProfileId}>
                {profiles.filter(p => p.id !== currentProfileId).map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <RadioGroupItem value={profile.id} id={profile.id} />
                    <Label htmlFor={profile.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: profile.color || '#3B82F6' }}
                        >
                          {profile.icon || profile.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {profile.type === 'PERSONAL' ? 'Personal/Household' : 'Business'}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Warning */}
          {operation === 'delete' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone. All {similarTransactions.length} similar transactions will be permanently deleted.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            CANCEL
          </Button>
          <Button
            onClick={handleExecute}
            disabled={loading || (operation === 'move' && !targetProfileId) || similarTransactions.length === 0}
            className={getOperationColor()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                PROCESSING...
              </>
            ) : (
              <>
                {getOperationIcon()}
                <span className="ml-2">
                  {operation === 'move' && `MOVE ${similarTransactions.length} TRANSACTIONS`}
                  {operation === 'delete' && `DELETE ${similarTransactions.length} TRANSACTIONS`}
                  {operation === 'recategorize' && `RECATEGORIZE ${similarTransactions.length} TRANSACTIONS`}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
