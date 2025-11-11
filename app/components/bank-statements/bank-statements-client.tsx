
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Paperclip, Send, CheckCircle2, AlertCircle, FileText, TrendingUp, TrendingDown, Calendar, DollarSign, Building2, Home } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category?: string;
  merchant?: string;
  metadata?: any;
  businessProfileId?: string;
}

interface Message {
  id: string;
  type: 'user' | 'system' | 'result';
  content: string;
  timestamp: Date;
  fileName?: string;
  transactionCount?: number;
  businessCount?: number;
  personalCount?: number;
  status?: 'processing' | 'success' | 'error';
  model?: string;
  transactions?: Transaction[];
  statementMonth?: string;
}

// Default prompt for transaction extraction
const DEFAULT_PROMPT = `Extract all transactions from this bank statement PDF. For each transaction, classify it as either BUSINESS or PERSONAL based on the merchant/description.`;

export default function BankStatementsClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Welcome! Attach a PDF bank statement and I\'ll extract all transactions for you.',
      timestamp: new Date(),
    }
  ]);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT); // Pre-load default prompt
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o'); // Default model
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected: ${file.name}`);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile && !prompt.trim()) {
      toast.error('Please attach a PDF file or enter a prompt');
      return;
    }

    if (!selectedFile) {
      toast.error('Please attach a PDF file');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt || DEFAULT_PROMPT,
      timestamp: new Date(),
      fileName: selectedFile.name,
      model: selectedModel,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add processing message
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      content: `Processing with ${selectedModel}...`,
      timestamp: new Date(),
      status: 'processing',
    };
    setMessages(prev => [...prev, processingMessage]);

    setIsProcessing(true);
    setPrompt(DEFAULT_PROMPT); // Reset to default prompt

    try {
      // Upload PDF - NOTE: API expects 'files' (plural)
      const formData = new FormData();
      formData.append('files', selectedFile); // Changed from 'file' to 'files'
      formData.append('model', selectedModel); // Pass selected model

      const uploadResponse = await fetch('/api/bank-statements/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const statementId = uploadData.id;

      // Poll for processing completion
      let attempts = 0;
      const maxAttempts = 60; // 3 minutes (60 * 3 seconds)
      
      const pollStatus = async (): Promise<any> => {
        const statusResponse = await fetch(`/api/bank-statements/status?userId=${uploadData.userId}`);
        const statusData = await statusResponse.json();
        
        const statement = statusData.statements?.find((s: any) => s.id === statementId);
        
        if (statement?.status === 'COMPLETED') {
          return statement;
        } else if (statement?.status === 'FAILED') {
          throw new Error(statement.error || 'Processing failed');
        } else if (attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 3000));
          return pollStatus();
        } else {
          throw new Error('Processing timeout');
        }
      };

      const result = await pollStatus();

      // Fetch the actual transactions for this statement
      let transactions: Transaction[] = [];
      let statementMonth = '';
      
      try {
        const transactionsResponse = await fetch(`/api/transactions?statementId=${statementId}&limit=500`);
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          transactions = transactionsData.transactions || [];
          
          // Extract the month from the first transaction or file name
          if (transactions.length > 0) {
            const firstDate = new Date(transactions[0].date);
            statementMonth = firstDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          } else if (selectedFile.name) {
            // Try to extract month from filename
            const monthMatch = selectedFile.name.match(/(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).*(\d{4})/i);
            if (monthMatch) {
              statementMonth = `${monthMatch[1]} ${monthMatch[2]}`;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }

      // Remove processing message and add result
      setMessages(prev => prev.filter(m => m.id !== processingMessage.id));

      const resultMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'result',
        content: `✅ Successfully extracted transactions from ${selectedFile.name}`,
        timestamp: new Date(),
        fileName: selectedFile.name,
        transactionCount: result.transactionCount || 0,
        businessCount: result.businessCount,
        personalCount: result.personalCount,
        status: 'success',
        transactions,
        statementMonth,
      };
      setMessages(prev => [...prev, resultMessage]);

      toast.success(`Extracted ${result.transactionCount || 0} transactions!`);
      
      // Clear file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error processing:', error);
      
      // Remove processing message and add error
      setMessages(prev => prev.filter(m => m.id !== processingMessage.id));
      
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to process statement'}`,
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error(error instanceof Error ? error.message : 'Failed to process statement');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-heading text-foreground mb-2">
            BANK STATEMENT PROCESSOR
          </h1>
          <p className="text-body text-muted-foreground">
            Attach a PDF and I'll extract all transactions instantly
          </p>
        </div>

        {/* Messages Area */}
        <Card className="flex-1 bg-card-elevated border-primary/20 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'result'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-muted'
                  }`}
                >
                  {message.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  )}
                  
                  {message.status === 'success' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{message.content}</p>
                          {message.fileName && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {message.fileName}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {message.transactionCount !== undefined && (
                        <div className="mt-3 pt-3 border-t border-green-500/20">
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                            📊 Extraction Summary
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Total Transactions:</span>
                              <span className="font-medium">{message.transactionCount}</span>
                            </div>
                            {message.businessCount !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Business:
                                </span>
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {message.businessCount}
                                </span>
                              </div>
                            )}
                            {message.personalCount !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  Personal:
                                </span>
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  {message.personalCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Transactions Card */}
                      {message.transactions && message.transactions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-green-500/20">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {message.statementMonth || 'All Transactions'}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              {message.transactions.length} transactions
                            </span>
                          </div>
                          
                          <div className="bg-muted/30 rounded-lg p-3 max-h-[400px] overflow-y-auto space-y-2">
                            {message.transactions.map((transaction, index) => {
                              const isIncome = transaction.type === 'INCOME';
                              const amount = Math.abs(transaction.amount);
                              const transactionDate = new Date(transaction.date);
                              
                              return (
                                <div
                                  key={transaction.id || index}
                                  className="bg-background/60 rounded-md p-3 border border-border/50 hover:border-primary/30 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        {transaction.metadata?.profileType === 'BUSINESS' ? (
                                          <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                        ) : (
                                          <Home className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                        )}
                                        <p className="text-sm font-medium truncate">
                                          {transaction.description}
                                        </p>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {transactionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        {transaction.category && (
                                          <span className="px-2 py-0.5 bg-muted rounded-full">
                                            {transaction.category}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-shrink-0 text-right">
                                      <p className={`text-sm font-semibold ${
                                        isIncome 
                                          ? 'text-green-600 dark:text-green-400' 
                                          : 'text-red-600 dark:text-red-400'
                                      }`}>
                                        {isIncome ? '+' : '-'}${amount.toFixed(2)}
                                      </p>
                                      {transaction.merchant && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {transaction.merchant}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {message.status === 'error' && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  
                  {!message.status && (
                    <div>
                      <p className="text-sm">{message.content}</p>
                      {message.fileName && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {message.fileName}
                          </p>
                          {message.model && (
                            <p className="text-xs text-muted-foreground">
                              Model: {message.model}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Input Area */}
        <Card className="bg-card-elevated border-primary/20 p-4">
          {/* Model Selector */}
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Model:</label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isProcessing}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Default)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="llama-3.3-70b">Llama 3.3 70B</SelectItem>
                <SelectItem value="mistral-large">Mistral Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-3">
            {/* File Attachment Button */}
            <div className="flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="h-10 w-10"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </div>

            {/* Text Input */}
            <div className="flex-1 relative">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedFile ? `Processing ${selectedFile.name}...` : "Edit the prompt below or attach a PDF to begin"}
                disabled={isProcessing}
                className="pr-4 h-10"
              />
              {selectedFile && (
                <div className="absolute -top-8 left-0 right-0 bg-muted/50 backdrop-blur-sm rounded-t-lg px-3 py-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                    disabled={isProcessing}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleProcess}
              disabled={isProcessing || (!selectedFile && !prompt.trim())}
              className="h-10"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
