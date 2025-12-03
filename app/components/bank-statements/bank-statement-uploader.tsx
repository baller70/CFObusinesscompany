
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileText, 
  File, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Brain,
  Zap,
  CreditCard,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: any;
  sourceType?: 'BANK' | 'CREDIT_CARD';
  transactionCount?: number;
}

interface StatementUploaderProps {
  onUploadComplete?: () => void;
}

export default function StatementUploader({ onUploadComplete }: StatementUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultSourceType, setDefaultSourceType] = useState<'BANK' | 'CREDIT_CARD'>('BANK');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0,
      sourceType: defaultSourceType
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, [defaultSourceType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const uploadAllFiles = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      uploadFiles.forEach(({ file, sourceType }) => {
        formData.append('files', file);
        formData.append('sourceTypes', sourceType || 'BANK');
      });

      // Update all files to uploading status
      setUploadFiles(prev => 
        prev.map(file => ({ ...file, status: 'uploading', progress: 0 }))
      );

      const response = await fetch('/api/bank-statements/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update files with upload results
        setUploadFiles(prev => 
          prev.map(file => {
            const uploadResult = result.uploads.find((u: any) => u.fileName === file.file.name);
            if (uploadResult && !uploadResult.error) {
              return { 
                ...file, 
                status: 'processing', 
                progress: 25,
                result: uploadResult 
              };
            } else {
              return { 
                ...file, 
                status: 'error', 
                error: uploadResult?.error || 'Upload failed' 
              };
            }
          })
        );

        toast.success(result.message);
        
        // Notify parent component that upload is complete
        onUploadComplete?.();
        
        // Start polling for processing status
        pollProcessingStatus();
        
      } else {
        setUploadFiles(prev => 
          prev.map(file => ({ ...file, status: 'error', error: 'Upload failed' }))
        );
        toast.error('Upload failed');
      }
    } catch (error) {
      setUploadFiles(prev => 
        prev.map(file => ({ ...file, status: 'error', error: 'Upload failed' }))
      );
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const pollProcessingStatus = async () => {
    const processingFiles = uploadFiles.filter(f => f.status === 'processing' && f.result?.id);
    
    if (processingFiles.length === 0) return;

    const statusPromises = processingFiles.map(async (file) => {
      try {
        const response = await fetch(`/api/bank-statements/status?id=${file.result.id}`);
        const status = await response.json();
        return { fileId: file.id, status };
      } catch {
        return { fileId: file.id, status: null };
      }
    });

    const statuses = await Promise.all(statusPromises);

    setUploadFiles(prev => 
      prev.map(file => {
        const statusUpdate = statuses.find(s => s.fileId === file.id);
        if (statusUpdate?.status) {
          const { processingStage, status, recordCount, processedCount } = statusUpdate.status;
          
          let progress = 10;
          if (processingStage === 'UPLOADED') progress = 10;
          else if (processingStage === 'PROCESSING') progress = 20;
          else if (processingStage === 'EXTRACTING_DATA') progress = 40;
          else if (processingStage === 'CATEGORIZING_TRANSACTIONS') progress = 60;
          else if (processingStage === 'ANALYZING_PATTERNS') progress = 70;
          else if (processingStage === 'DISTRIBUTING_DATA') progress = 80;
          else if (processingStage === 'VALIDATING') progress = 90;
          else if (processingStage === 'COMPLETED') progress = 100;
          else if (processingStage === 'FAILED') progress = 0;

          const newStatus = status === 'COMPLETED' ? 'completed' : 
                           status === 'FAILED' ? 'error' : 'processing';

          return {
            ...file,
            status: newStatus,
            progress,
            transactionCount: processedCount || recordCount || 0,
            error: status === 'FAILED' ? statusUpdate.status.errorLog : undefined
          };
        }
        return file;
      })
    );

    // Continue polling if there are still processing files
    const stillProcessing = uploadFiles.some(f => f.status === 'processing');
    if (stillProcessing) {
      setTimeout(pollProcessingStatus, 3000); // Poll every 3 seconds
    } else {
      // All processing complete, refresh the upload history
      if (onUploadComplete) {
        onUploadComplete();
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(file => file.status !== 'completed'));
  };

  const updateFileSourceType = (id: string, sourceType: 'BANK' | 'CREDIT_CARD') => {
    setUploadFiles(prev => 
      prev.map(file => 
        file.id === id ? { ...file, sourceType } : file
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'uploading': return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing': return <Brain className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'uploading': return 'default';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      case 'error': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Drop Zone */}
      <Card className="card-premium-elevated">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              AI-POWERED STATEMENT PROCESSOR
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">DEFAULT TYPE:</span>
              <Select value={defaultSourceType} onValueChange={(value: 'BANK' | 'CREDIT_CARD') => setDefaultSourceType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Bank Statement
                    </div>
                  </SelectItem>
                  <SelectItem value="CREDIT_CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-border hover:border-primary/50 hover:bg-muted/20'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="mx-auto max-w-md">
              <div className="bg-gradient-to-br from-primary/10 to-blue-100 rounded-xl p-6 mb-6 inline-block">
                {isDragActive ? (
                  <Upload className="h-12 w-12 text-primary animate-bounce" />
                ) : (
                  <FileText className="h-12 w-12 text-primary" />
                )}
              </div>
              
              <h3 className="text-subheading text-foreground mb-3">
                {isDragActive 
                  ? 'DROP FILES TO UPLOAD' 
                  : 'DRAG & DROP FINANCIAL STATEMENTS'
                }
              </h3>
              
              <p className="text-body text-muted-foreground mb-4">
                Bank & Credit Card Statements • CSV and PDF files • Individual or bulk upload • Max 50MB per file
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Extraction
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Auto-Categorization
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  CFO Insights
                </Badge>
              </div>

              <Button 
                variant="outline" 
                className="bg-background hover:bg-muted"
                onClick={() => {
                  // This will be handled by the dropzone getRootProps
                  toast.info('Click anywhere in the upload area to select files or drag and drop files here')
                }}
              >
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <Card className="card-premium-elevated">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>UPLOAD QUEUE ({uploadFiles.length} files)</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompleted}
                disabled={!uploadFiles.some(f => f.status === 'completed')}
              >
                Clear Completed
              </Button>
              <Button
                onClick={uploadAllFiles}
                disabled={isUploading || uploadFiles.every(f => f.status !== 'pending')}
                className="btn-primary"
              >
                {isUploading ? 'Uploading...' : 'Process All Files'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex-shrink-0">
                    {uploadFile.file.type === 'application/pdf' ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : (
                      <File className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {uploadFile.file.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {uploadFile.status === 'pending' && (
                          <Select 
                            value={uploadFile.sourceType || 'BANK'} 
                            onValueChange={(value: 'BANK' | 'CREDIT_CARD') => updateFileSourceType(uploadFile.id, value)}
                          >
                            <SelectTrigger className="w-32 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BANK">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Bank
                                </div>
                              </SelectItem>
                              <SelectItem value="CREDIT_CARD">
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  Credit Card
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {uploadFile.status !== 'pending' && (
                          <Badge variant="outline" className="text-xs">
                            {uploadFile.sourceType === 'CREDIT_CARD' ? (
                              <><CreditCard className="h-3 w-3 mr-1" />Credit Card</>
                            ) : (
                              <><Building2 className="h-3 w-3 mr-1" />Bank</>
                            )}
                          </Badge>
                        )}
                        <Badge variant={getStatusColor(uploadFile.status) as any}>
                          {getStatusIcon(uploadFile.status)}
                          {uploadFile.status.toUpperCase()}
                        </Badge>
                        {uploadFile.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <div className="flex items-center gap-2">
                        {uploadFile.transactionCount !== undefined && uploadFile.transactionCount > 0 && (
                          <span className="font-medium text-primary">{uploadFile.transactionCount} transactions</span>
                        )}
                        {uploadFile.progress > 0 && (
                          <span>{uploadFile.progress}%</span>
                        )}
                      </div>
                    </div>
                    
                    {uploadFile.progress > 0 && (
                      <Progress value={uploadFile.progress} className="h-2" />
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
