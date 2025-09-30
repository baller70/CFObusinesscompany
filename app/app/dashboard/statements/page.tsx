
'use client';

import { useState, useEffect } from 'react';
import StatementUploader from '@/components/bank-statements/bank-statement-uploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  CreditCard, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Brain,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { BankStatement } from '@/lib/types';

interface StatementListItem {
  id: string;
  fileName: string;
  sourceType: 'BANK' | 'CREDIT_CARD';
  bankName?: string;
  fileType: 'CSV' | 'PDF';
  fileSize?: number;
  status: string;
  processingStage: string;
  recordCount: number;
  processedCount: number;
  transactionCount: number;
  aiAnalysis?: any;
  createdAt: string;
  updatedAt: string;
}

export default function StatementsPage() {
  const [statements, setStatements] = useState<StatementListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStatement, setSelectedStatement] = useState<StatementListItem | null>(null);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedSourceType !== 'all') {
        params.append('sourceType', selectedSourceType);
      }
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus.toUpperCase());
      }

      const response = await fetch(`/api/statements/list?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setStatements(data.data);
      } else {
        toast.error('FAILED TO LOAD STATEMENTS');
      }
    } catch (error) {
      console.error('FETCH ERROR:', error);
      toast.error('FAILED TO LOAD STATEMENTS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [selectedSourceType, selectedStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING': return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProcessingStageText = (stage: string) => {
    switch (stage) {
      case 'UPLOADED': return 'UPLOADED';
      case 'EXTRACTING_DATA': return 'EXTRACTING DATA';
      case 'CATEGORIZING_TRANSACTIONS': return 'CATEGORIZING';
      case 'ANALYZING_PATTERNS': return 'ANALYZING';
      case 'GENERATING_INSIGHTS': return 'GENERATING INSIGHTS';
      case 'DISTRIBUTING_DATA': return 'DISTRIBUTING';
      case 'COMPLETED': return 'COMPLETED';
      case 'FAILED': return 'FAILED';
      default: return stage;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-display text-foreground">
            FINANCIAL STATEMENT PROCESSOR
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Upload your bank and credit card statements for AI-powered analysis, automatic categorization, and intelligent financial insights.
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/50 border-border">
            <TabsTrigger 
              value="upload" 
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-primary/20"
            >
              <FileText className="h-4 w-4 mr-2" />
              UPLOAD STATEMENTS
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-primary/20"
            >
              <Brain className="h-4 w-4 mr-2" />
              PROCESSING HISTORY
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-8">
            <StatementUploader />
          </TabsContent>

          <TabsContent value="history" className="mt-8">
            <div className="space-y-6">
              {/* Filters */}
              <Card className="card-premium-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>STATEMENT HISTORY</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchStatements}
                      disabled={loading}
                    >
                      REFRESH
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">TYPE</label>
                      <Select value={selectedSourceType} onValueChange={setSelectedSourceType}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="BANK">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Bank Statements
                            </div>
                          </SelectItem>
                          <SelectItem value="CREDIT_CARD">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Credit Cards
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">STATUS</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Statement List */}
                  {loading ? (
                    <div className="text-center py-12">
                      <Brain className="h-8 w-8 text-primary animate-pulse mx-auto mb-4" />
                      <p className="text-muted-foreground">LOADING STATEMENTS...</p>
                    </div>
                  ) : statements.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">NO STATEMENTS FOUND</p>
                      <p className="text-sm text-muted-foreground">Upload your first statement to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {statements.map((statement) => (
                        <Card key={statement.id} className="border-border/50 hover:border-primary/20 transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 rounded-lg bg-muted/50">
                                  {statement.sourceType === 'CREDIT_CARD' ? (
                                    <CreditCard className="h-6 w-6 text-primary" />
                                  ) : (
                                    <Building2 className="h-6 w-6 text-primary" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-sm font-medium text-foreground truncate">
                                      {statement.fileName}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {statement.fileType}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {statement.sourceType === 'CREDIT_CARD' ? 'CREDIT CARD' : 'BANK'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(statement.createdAt), 'MMM d, yyyy')}
                                    </div>
                                    {statement.fileSize && (
                                      <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {(statement.fileSize / 1024 / 1024).toFixed(2)} MB
                                      </div>
                                    )}
                                    {statement.transactionCount > 0 && (
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        {statement.transactionCount} transactions
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(statement.status)}`}>
                                    {getStatusIcon(statement.status)}
                                    {statement.status}
                                  </div>
                                  {statement.status === 'PROCESSING' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {getProcessingStageText(statement.processingStage)}
                                    </p>
                                  )}
                                  {statement.status === 'COMPLETED' && statement.aiAnalysis && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-1 h-6 text-xs"
                                      onClick={() => setSelectedStatement(statement)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      VIEW INSIGHTS
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Insights Modal */}
        {selectedStatement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI INSIGHTS - {selectedStatement.fileName}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStatement(null)}
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedStatement.aiAnalysis?.insights && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      KEY INSIGHTS
                    </h3>
                    <div className="space-y-2">
                      {selectedStatement.aiAnalysis.insights.map((insight: string, index: number) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStatement.aiAnalysis?.recommendations && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      RECOMMENDATIONS
                    </h3>
                    <div className="space-y-2">
                      {selectedStatement.aiAnalysis.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="bg-primary/5 border border-primary/10 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {selectedStatement.aiAnalysis?.totalTransactions || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">TRANSACTIONS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      ${(selectedStatement.aiAnalysis?.totalAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">TOTAL AMOUNT</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {selectedStatement.aiAnalysis?.categoriesCreated || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">CATEGORIES</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
