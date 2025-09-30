
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BankStatement {
  id: string;
  fileName: string;
  originalName: string;
  fileType: 'CSV' | 'PDF';
  fileSize: number;
  bankName?: string;
  accountType?: string;
  statementPeriod?: string;
  status: string;
  processingStage: string;
  recordCount: number;
  processedCount: number;
  errorLog?: string;
  aiAnalysis?: any;
  createdAt: string;
  transactionCount: number;
}

export default function UploadHistory() {
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      const response = await fetch('/api/bank-statements/status');
      const data = await response.json();
      setStatements(data);
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PROCESSING': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'destructive';
      case 'PROCESSING': return 'default';
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
          <p className="text-body text-muted-foreground">
            Upload your first bank statement to see processing history and AI insights here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                <span className="font-medium text-foreground">{statement.transactionCount}</span>
                <span className="text-muted-foreground ml-1">transactions processed</span>
              </span>
            </div>

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
                {statement.errorLog}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setSelectedStatement(statement)}
                disabled={statement.status !== 'COMPLETED'}
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
                    // Handle download - could download original file or generated report
                    window.open(`/api/bank-statements/download?id=${statement.id}`, '_blank');
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
