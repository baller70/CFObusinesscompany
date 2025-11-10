
'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  File, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Download,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Building2,
  CreditCard,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category: string;
  merchant?: string;
}

interface BankStatement {
  id: string;
  fileName: string;
  originalName: string;
  fileType: 'CSV' | 'PDF';
  fileSize: number;
  sourceType?: 'BANK' | 'CREDIT_CARD';
  bankName?: string;
  accountType?: string;
  statementPeriod?: string;
  status: string;
  processingStage: string;
  recordCount: number;
  processedCount: number;
  errorLog?: string;
  aiAnalysis?: any;
  validationResult?: any;
  validationConfidence?: number;
  flaggedIssues?: any[];
  validatedAt?: string;
  createdAt: string;
  transactionCount: number;
  transactions?: Transaction[];
}

export interface UploadHistoryRef {
  refresh: () => void;
}

const UploadHistory = forwardRef<UploadHistoryRef>((props, ref) => {
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<BankStatement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useImperativeHandle(ref, () => ({
    refresh: fetchStatements
  }));

  useEffect(() => {
    fetchStatements();
    
    // Auto-refresh every 5 seconds if there are processing statements
    const interval = setInterval(() => {
      const hasProcessing = statements.some(s => s.status === 'PROCESSING' || s.status === 'PENDING');
      if (hasProcessing) {
        fetchStatements();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [statements]);

  const fetchStatements = async () => {
    try {
      const response = await fetch('/api/bank-statements/status');
      const data = await response.json();
      setStatements(data.statements || []);
    } catch (error) {
      console.error('Error fetching statements:', error);
      setStatements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatementDetails = async (statementId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/bank-statements/status?id=${statementId}`);
      const data = await response.json();
      setSelectedStatement(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching statement details:', error);
      toast.error('Failed to load statement details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteClick = (statement: BankStatement) => {
    setStatementToDelete(statement);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!statementToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/bank-statements/delete?id=${statementToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Bank statement deleted successfully');
        // Refresh the list
        await fetchStatements();
        setDeleteConfirmOpen(false);
        setStatementToDelete(null);
      } else {
        toast.error(data.error || 'Failed to delete statement');
      }
    } catch (error) {
      console.error('Error deleting statement:', error);
      toast.error('Failed to delete statement');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PROCESSING': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'destructive';
      case 'PROCESSING': return 'default';
      case 'PENDING': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <Card className="card-premium-elevated">
        <CardContent className="p-12 text-center">
          <div className="bg-muted/20 rounded-xl p-6 mb-6 inline-block">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-subheading text-foreground mb-3">
            NO STATEMENTS PROCESSED YET
          </h3>
          <p className="text-body text-muted-foreground mb-4">
            Upload your first bank statement to see processing history and AI insights here.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchStatements()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {statements.length} statement{statements.length !== 1 ? 's' : ''} found
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchStatements()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statements.map((statement) => (
          <Card 
            key={statement.id} 
            className="card-premium-elevated hover:scale-[1.02] transition-all duration-200 group"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {statement.fileType === 'PDF' ? (
                    <FileText className="h-5 w-5 text-red-500" />
                  ) : (
                    <File className="h-5 w-5 text-green-500" />
                  )}
                  <Badge variant={getStatusColor(statement.status) as any}>
                    {getStatusIcon(statement.status)}
                    {statement.status}
                  </Badge>
                </div>
                {statement.sourceType && (
                  <Badge variant="outline" className="text-xs">
                    {statement.sourceType === 'CREDIT_CARD' ? (
                      <><CreditCard className="h-3 w-3 mr-1" />Credit Card</>
                    ) : (
                      <><Building2 className="h-3 w-3 mr-1" />Bank</>
                    )}
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {statement.originalName}
              </CardTitle>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatFileSize(statement.fileSize || 0)}</span>
                <span>{formatDistanceToNow(new Date(statement.createdAt), { addSuffix: true })}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Bank Info */}
              {statement.bankName && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium">{statement.bankName}</span>
                  {statement.accountType && (
                    <Badge variant="outline" className="text-xs">
                      {statement.accountType}
                    </Badge>
                  )}
                </div>
              )}

              {/* Statement Period */}
              {statement.statementPeriod && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{statement.statementPeriod}</span>
                </div>
              )}

              {/* Transaction Count */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-success" />
                <span>
                  <span className="font-medium text-foreground">{statement.transactionCount || 0}</span>
                  <span className="text-muted-foreground ml-1">transactions processed</span>
                </span>
              </div>

              {/* Processing Stage Indicator */}
              {(statement.status === 'PROCESSING' || statement.status === 'PENDING') && statement.processingStage && (
                <div className="flex items-center gap-2 text-sm">
                  {statement.processingStage === 'QUEUED' ? (
                    <Clock className="h-4 w-4 text-orange-500" />
                  ) : statement.processingStage === 'VALIDATING' ? (
                    <CheckCircle className="h-4 w-4 text-purple-500 animate-pulse" />
                  ) : (
                    <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
                  )}
                  <span className={`font-medium text-xs ${
                    statement.processingStage === 'QUEUED' ? 'text-orange-600' :
                    statement.processingStage === 'VALIDATING' ? 'text-purple-600' :
                    'text-blue-600'
                  }`}>
                    {statement.processingStage === 'QUEUED' ? 'QUEUED FOR PROCESSING' :
                     statement.processingStage === 'VALIDATING' ? 'VALIDATING ACCURACY' :
                     statement.processingStage.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {/* Validation Confidence Badge */}
              {statement.status === 'COMPLETED' && statement.validationConfidence !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  {statement.validationConfidence >= 0.95 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : statement.validationConfidence >= 0.85 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={`font-medium text-xs ${
                    statement.validationConfidence >= 0.95 ? 'text-green-600' :
                    statement.validationConfidence >= 0.85 ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>
                    {(statement.validationConfidence * 100).toFixed(0)}% Validated
                  </span>
                  {statement.flaggedIssues && statement.flaggedIssues.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {statement.flaggedIssues.length} flagged
                    </Badge>
                  )}
                </div>
              )}

              {/* AI Analysis Indicator */}
              {statement.aiAnalysis && (
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-purple-600 font-medium">AI insights available</span>
                </div>
              )}

              {/* Error Message */}
              {statement.status === 'FAILED' && statement.errorLog && (
                <div className="bg-red-50 text-red-700 text-xs p-2 rounded border border-red-200">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {statement.errorLog.substring(0, 100)}...
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => fetchStatementDetails(statement.id)}
                  disabled={detailsLoading}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                
                {statement.status === 'COMPLETED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      window.open(`/api/bank-statements/download?id=${statement.id}`, '_blank');
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  onClick={() => handleDeleteClick(statement)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statement Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedStatement?.originalName}
            </DialogTitle>
            <DialogDescription>
              Statement details and transaction history
            </DialogDescription>
          </DialogHeader>

          {selectedStatement && (
            <div className="space-y-6">
              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Processing Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusColor(selectedStatement.status) as any}>
                      {getStatusIcon(selectedStatement.status)}
                      {selectedStatement.status}
                    </Badge>
                  </div>
                  
                  {selectedStatement.sourceType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Source Type</span>
                      <Badge variant="outline">
                        {selectedStatement.sourceType === 'CREDIT_CARD' ? (
                          <><CreditCard className="h-3 w-3 mr-1" />Credit Card</>
                        ) : (
                          <><Building2 className="h-3 w-3 mr-1" />Bank Account</>
                        )}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedStatement.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bank</span>
                      <span className="text-sm font-medium">{selectedStatement.bankName}</span>
                    </div>
                  )}
                  
                  {selectedStatement.statementPeriod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Period</span>
                      <span className="text-sm font-medium">{selectedStatement.statementPeriod}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Transactions</span>
                    <span className="text-sm font-medium">{selectedStatement.transactionCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uploaded</span>
                    <span className="text-sm">{formatDistanceToNow(new Date(selectedStatement.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Error Details */}
              {selectedStatement.status === 'FAILED' && selectedStatement.errorLog && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Error Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-600">{selectedStatement.errorLog}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions */}
              {selectedStatement.transactions && selectedStatement.transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Transactions</CardTitle>
                    <CardDescription>
                      Showing {selectedStatement.transactions.length} most recent transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedStatement.transactions.map((transaction) => (
                        <div 
                          key={transaction.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">{transaction.description}</span>
                              {transaction.category && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                              {transaction.merchant && (
                                <span className="truncate">{transaction.merchant}</span>
                              )}
                            </div>
                          </div>
                          <div className={`text-sm font-semibold ${
                            transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Validation Report */}
              {selectedStatement.validationResult && selectedStatement.validationConfidence !== undefined && (
                <Card className={`border-2 ${
                  (selectedStatement.validationConfidence || 0) >= 0.95 ? 'border-green-200 bg-green-50' :
                  (selectedStatement.validationConfidence || 0) >= 0.85 ? 'border-yellow-200 bg-yellow-50' :
                  'border-orange-200 bg-orange-50'
                }`}>
                  <CardHeader>
                    <CardTitle className={`text-sm flex items-center gap-2 ${
                      (selectedStatement.validationConfidence || 0) >= 0.95 ? 'text-green-700' :
                      (selectedStatement.validationConfidence || 0) >= 0.85 ? 'text-yellow-700' :
                      'text-orange-700'
                    }`}>
                      {(selectedStatement.validationConfidence || 0) >= 0.95 ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      Validation Report - {((selectedStatement.validationConfidence || 0) * 100).toFixed(1)}% Confidence
                    </CardTitle>
                    <CardDescription>
                      Double-checked for accuracy and completeness
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-2xl font-bold text-foreground">
                          {selectedStatement.validationResult.summary?.totalTransactions || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStatement.validationResult.summary?.validatedTransactions || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Validated</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedStatement.validationResult.summary?.flaggedTransactions || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Flagged</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedStatement.validationResult.summary?.duplicatesFound || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Duplicates</div>
                      </div>
                    </div>

                    {/* Balance Reconciliation */}
                    {selectedStatement.validationResult.details?.mathematicalCheck && (
                      <div className={`p-3 rounded-lg ${
                        selectedStatement.validationResult.details.mathematicalCheck.passed 
                          ? 'bg-green-100 border border-green-300' 
                          : 'bg-red-100 border border-red-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {selectedStatement.validationResult.details.mathematicalCheck.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-semibold ${
                            selectedStatement.validationResult.details.mathematicalCheck.passed 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            Balance Reconciliation
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>Expected: ${selectedStatement.validationResult.details.mathematicalCheck.expectedBalance?.toFixed(2) || '0.00'}</div>
                          <div>Calculated: ${selectedStatement.validationResult.details.mathematicalCheck.actualBalance?.toFixed(2) || '0.00'}</div>
                          {selectedStatement.validationResult.details.mathematicalCheck.difference > 0 && (
                            <div>Difference: ${selectedStatement.validationResult.details.mathematicalCheck.difference?.toFixed(2) || '0.00'}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Flagged Issues */}
                    {selectedStatement.flaggedIssues && selectedStatement.flaggedIssues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Flagged Issues ({selectedStatement.flaggedIssues.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedStatement.flaggedIssues.slice(0, 10).map((issue: any, index: number) => (
                            <div 
                              key={index}
                              className={`p-2 rounded border text-xs ${
                                issue.severity === 'HIGH' ? 'bg-red-50 border-red-200' :
                                issue.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {issue.type?.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant={
                                  issue.severity === 'HIGH' ? 'destructive' :
                                  issue.severity === 'MEDIUM' ? 'default' :
                                  'secondary'
                                } className="text-xs">
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="mt-1">{issue.description}</p>
                              {issue.suggestedFix && (
                                <p className="mt-1 text-muted-foreground italic">
                                  💡 {issue.suggestedFix}
                                </p>
                              )}
                            </div>
                          ))}
                          {selectedStatement.flaggedIssues.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              + {selectedStatement.flaggedIssues.length - 10} more issues
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* All Clear Message */}
                    {(!selectedStatement.flaggedIssues || selectedStatement.flaggedIssues.length === 0) && 
                     (selectedStatement.validationConfidence || 0) >= 0.95 && (
                      <div className="text-center p-4 bg-green-100 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-green-700">
                          All transactions validated successfully!
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          No issues found. Data is ready for analysis.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Analysis */}
              {selectedStatement.aiAnalysis && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-purple-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedStatement.aiAnalysis, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Statement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{statementToDelete?.originalName}</strong>?
              <br /><br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The uploaded file</li>
                <li>{statementToDelete?.transactionCount || 0} transaction(s)</li>
                <li>All processing history and AI analysis</li>
              </ul>
              <br />
              <span className="text-red-600 font-semibold">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

UploadHistory.displayName = 'UploadHistory';

export default UploadHistory;
