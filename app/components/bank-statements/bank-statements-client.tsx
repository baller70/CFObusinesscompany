'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Paperclip, Send, Sparkles, FileText, Building2, Home, CheckCircle, Copy } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{type: string; text?: string; file?: {filename: string; file_data: string}}>;
  timestamp: Date;
  fileName?: string;
  model?: string;
  extractedTransactions?: ExtractedTransaction[];
}

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
  profileType: 'BUSINESS' | 'PERSONAL';
}

interface ManualTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

interface ManualTransactionCard {
  id: string;
  monthYear: string;
  transactions: ManualTransaction[];
}

export default function BankStatementsClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to Abacus ChatLLM! Upload a PDF bank statement and I\'ll extract all transactions and classify them as BUSINESS or PERSONAL.',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('Please extract all transactions from this bank statement PDF and classify each as BUSINESS or PERSONAL. For each transaction, include: date, description, amount, and category.');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('RouteLLM');
  const [loadingTransactions, setLoadingTransactions] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Manual transaction entry state
  const [manualTransactionText, setManualTransactionText] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [manualTransactionCards, setManualTransactionCards] = useState<ManualTransactionCard[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText || `Uploaded: ${selectedFile?.name}`,
      timestamp: new Date(),
      fileName: selectedFile?.name,
      model: selectedModel,
    };
    setMessages(prev => [...prev, userMessage]);

    // Clear input
    const currentInput = inputText;
    const currentFile = selectedFile;
    setInputText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsProcessing(true);

    // Add placeholder for assistant response
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: selectedModel,
    }]);

    try {
      // Prepare messages for ChatLLM - only send the current message
      const chatMessages: any[] = [];
      
      // If file is attached, send it as multimodal content
      if (currentFile) {
        const base64 = await fileToBase64(currentFile);
        const userPrompt = currentInput || `Please extract all transactions from this bank statement PDF and classify each as BUSINESS or PERSONAL. For each transaction, include: date, description, amount, and category.`;
        
        // Send PDF as multimodal message with file content
        chatMessages.push({
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: currentFile.name,
                file_data: `data:application/pdf;base64,${base64}`
              }
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        });
      } else {
        // Text-only message - ensure content is always a string
        chatMessages.push({ 
          role: 'user', 
          content: currentInput 
        });
      }

      // Call ChatLLM proxy
      const response = await fetch('/api/chatllm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          model: selectedModel,
          stream: true,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get response from ChatLLM';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  assistantContent += content;
                  
                  // Update the assistant message with streamed content
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, content: assistantContent }
                      : m
                  ));
                }
              } catch (e) {
                // Ignore parsing errors for incomplete JSON
              }
            }
          }
        }
      }

      if (!assistantContent) {
        throw new Error('No response received from ChatLLM');
      }

      // Parse transactions from the response
      const extractedTransactions = parseTransactions(assistantContent);
      if (extractedTransactions.length > 0) {
        // Update the message with extracted transactions
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, extractedTransactions }
            : m
        ));
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      toast.error(errorMessage);
      
      // Update assistant message with detailed error
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: `❌ Error: ${errorMessage}\n\nPlease try again or select a different model.` }
          : m
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const parseTransactions = (content: string): ExtractedTransaction[] => {
    try {
      // Try to find JSON array in the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({
            date: t.date || t.Date || '',
            description: t.description || t.Description || '',
            amount: parseFloat(t.amount || t.Amount || 0),
            category: t.category || t.Category || '',
            profileType: (t.profileType || t.profile || t.type || 'BUSINESS').toUpperCase() as 'BUSINESS' | 'PERSONAL'
          }));
        }
      }

      // Fallback: Try to parse line by line if JSON parsing fails
      const lines = content.split('\n');
      const transactions: ExtractedTransaction[] = [];
      
      for (const line of lines) {
        // Look for transaction patterns
        const match = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([\$\-\+]?[\d,]+\.?\d*)\s+(BUSINESS|PERSONAL)/i);
        if (match) {
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            amount: parseFloat(match[3].replace(/[\$,]/g, '')),
            profileType: match[4].toUpperCase() as 'BUSINESS' | 'PERSONAL'
          });
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error parsing transactions:', error);
      return [];
    }
  };

  const handleCopyTransactions = (transactions: ExtractedTransaction[]) => {
    try {
      // Format transactions as clean JSON
      const jsonString = JSON.stringify(transactions, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString);
      
      toast.success(`✅ Copied ${transactions.length} transactions to clipboard!`);
    } catch (error) {
      console.error('Error copying transactions:', error);
      toast.error('Failed to copy transactions. Please try again.');
    }
  };

  const handleLoadTransactions = async (messageId: string, transactions: ExtractedTransaction[]) => {
    setLoadingTransactions(messageId);
    
    try {
      // Save transactions to database
      const response = await fetch('/api/bank-statements/load-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transactions');
      }

      const result = await response.json();
      
      toast.success(`✅ Successfully loaded ${result.count} transactions!`);
      
      // Update message to show loaded state
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, extractedTransactions: undefined }
          : m
      ));
      
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions. Please try again.');
    } finally {
      setLoadingTransactions(null);
    }
  };

  const handleProcessManualTransactions = () => {
    try {
      setIsProcessingManual(true);

      if (!statementDate.trim()) {
        toast.error('Please enter the statement date (e.g., January 2024)');
        setIsProcessingManual(false);
        return;
      }

      // Parse the manual text into transactions
      const lines = manualTransactionText.trim().split('\n');
      const transactions: ManualTransaction[] = [];
      
      // Section detection - determines if amounts should be positive (income) or negative (expense)
      let currentSectionType: 'income' | 'expense' = 'income';
      let currentSectionName = '';
      
      // Income sections (deposits, additions)
      const incomeSections = [
        'deposits',
        'additions',
        'ach additions',
        'atm deposits',
        'mobile deposit',
        'wire transfer in',
        'incoming wire',
        'credits',
        'interest'
      ];
      
      // Expense sections (purchases, deductions, fees)
      const expenseSections = [
        'purchases',
        'deductions',
        'debit card',
        'pos purchase',
        'ach debit',
        'checks',
        'substitute checks',
        'service charge',
        'fees',
        'atm withdrawal',
        'wire transfer out',
        'outgoing wire',
        'payment',
        'other deductions',
        'atm / misc',
        'atm/misc'
      ];
      
      console.log(`[Manual Parser] ========================================`);
      console.log(`[Manual Parser] Starting to parse ${lines.length} lines...`);
      console.log(`[Manual Parser] ========================================`);
      
      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue;
        
        const lowerLine = trimmedLine.toLowerCase();
        
        // Check if this line is a section header
        if (incomeSections.some(section => lowerLine.includes(section))) {
          currentSectionType = 'income';
          currentSectionName = trimmedLine;
          console.log(`[Manual Parser] ✅ Found INCOME section: ${currentSectionName}`);
          continue;
        }
        if (expenseSections.some(section => lowerLine.includes(section))) {
          currentSectionType = 'expense';
          currentSectionName = trimmedLine;
          console.log(`[Manual Parser] ✅ Found EXPENSE section: ${currentSectionName}`);
          continue;
        }
        
        // Skip ONLY obvious header lines (very strict)
        if ((lowerLine.includes('date posted') || lowerLine.includes('check number')) && 
            (lowerLine.includes('amount') || lowerLine.includes('description') || lowerLine.includes('reference'))) {
          console.log(`[Manual Parser] ⏭️  Skipping header: ${trimmedLine.substring(0, 60)}...`);
          continue;
        }
        
        // Skip totals/summary lines
        if (lowerLine.includes('total') && lowerLine.includes('$')) {
          console.log(`[Manual Parser] ⏭️  Skipping total line: ${trimmedLine.substring(0, 60)}...`);
          continue;
        }
        
        // Try AGGRESSIVE parsing - try multiple strategies
        let date = '';
        let amount = 0;
        let description = '';
        let referenceNumber = '';
        
        // Strategy 1: Tab-separated
        let parts = trimmedLine.split('\t').filter(p => p.trim());
        
        // Strategy 2: Multiple spaces (fallback)
        if (parts.length < 2) {
          parts = trimmedLine.split(/\s{2,}/).filter(p => p.trim());
        }
        
        // Strategy 3: Single space for densely packed lines (fallback)
        if (parts.length < 2) {
          parts = trimmedLine.split(/\s+/).filter(p => p.trim());
        }
        
        if (parts.length < 2) {
          console.log(`[Manual Parser] ⚠️  SKIPPED (too few parts): ${trimmedLine.substring(0, 60)}...`);
          continue;
        }
        
        // Find date (first field that looks like MM/DD or MM/DD/YYYY)
        let dateIndex = -1;
        for (let j = 0; j < Math.min(3, parts.length); j++) {
          if (parts[j].match(/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/)) {
            dateIndex = j;
            date = parts[j];
            break;
          }
        }
        
        if (dateIndex === -1) {
          console.log(`[Manual Parser] ⚠️  SKIPPED (no date): ${trimmedLine.substring(0, 60)}...`);
          continue;
        }
        
        // Find amount (any field that's a number with optional $ and ,)
        let amountIndex = -1;
        for (let j = dateIndex + 1; j < parts.length; j++) {
          const cleanPart = parts[j].replace(/[\$,]/g, '');
          const parsedAmount = parseFloat(cleanPart);
          if (!isNaN(parsedAmount) && parsedAmount > 0 && cleanPart.match(/^\d+\.?\d*$/)) {
            amountIndex = j;
            amount = parsedAmount;
            break;
          }
        }
        
        if (amountIndex === -1 || amount === 0) {
          console.log(`[Manual Parser] ⚠️  SKIPPED (no valid amount): ${trimmedLine.substring(0, 60)}...`);
          continue;
        }
        
        // Everything between date and amount is description
        if (amountIndex > dateIndex + 1) {
          description = parts.slice(dateIndex + 1, amountIndex).join(' ').trim();
        } else {
          // If amount is right after date, description comes after
          description = parts.slice(amountIndex + 1).join(' ').trim();
        }
        
        // If still no description, check if it's a checks section (Date | Check# | Amount)
        if (!description && currentSectionName.toLowerCase().includes('check')) {
          if (amountIndex === dateIndex + 2) {
            description = `Check #${parts[dateIndex + 1]}`;
          }
        }
        
        // Default description if still empty
        if (!description) {
          description = 'Transaction';
        }
        
        // Reference number is usually the last field (if exists)
        if (parts.length > amountIndex + 1) {
          referenceNumber = parts[parts.length - 1].trim();
          if (referenceNumber && !referenceNumber.includes('$')) {
            description += ` (Ref: ${referenceNumber})`;
          }
        }
        
        // Apply sign based on section type
        if (currentSectionType === 'expense') {
          amount = -Math.abs(amount);
        } else {
          amount = Math.abs(amount);
        }
        
        transactions.push({
          date,
          description,
          amount,
          category: currentSectionType === 'income' ? 'Income' : 'Expense'
        });
        
        console.log(`[Manual Parser] ✅ #${transactions.length}: ${date} | $${amount.toFixed(2)} | ${description.substring(0, 40)}...`);
      }

      console.log(`[Manual Parser] ========================================`);
      console.log(`[Manual Parser] 🎯 FINAL COUNT: ${transactions.length} transactions`);
      console.log(`[Manual Parser] ========================================`);

      if (transactions.length === 0) {
        toast.error('❌ No valid transactions found. Please check the format and try again.');
        return;
      }

      // Calculate totals
      const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Use the statement date provided by user
      const monthYear = statementDate.trim();

      // Create a new card
      const newCard: ManualTransactionCard = {
        id: Date.now().toString(),
        monthYear: `${monthYear} (${transactions.length} transactions | +$${totalIncome.toFixed(2)} / -$${totalExpenses.toFixed(2)})`,
        transactions,
      };

      setManualTransactionCards(prev => [...prev, newCard]);
      setManualTransactionText(''); // Clear input
      setStatementDate(''); // Clear date
      toast.success(`✅ Created card: ${transactions.length} transactions (${transactions.filter(t => t.amount > 0).length} income, ${transactions.filter(t => t.amount < 0).length} expenses)`);

    } catch (error) {
      console.error('Error processing manual transactions:', error);
      toast.error('Failed to process transactions. Please check the format.');
    } finally {
      setIsProcessingManual(false);
    }
  };

  const handleCopyManualTransactions = (transactions: ManualTransaction[]) => {
    try {
      const jsonString = JSON.stringify(transactions, null, 2);
      navigator.clipboard.writeText(jsonString);
      toast.success(`✅ Copied ${transactions.length} transactions to clipboard!`);
    } catch (error) {
      console.error('Error copying transactions:', error);
      toast.error('Failed to copy transactions. Please try again.');
    }
  };

  const handleLoadManualTransactions = async (cardId: string, transactions: ManualTransaction[]) => {
    setLoadingTransactions(cardId);
    
    try {
      // Convert to the format expected by the API
      const transactionsWithProfile = transactions.map(t => ({
        ...t,
        profileType: 'BUSINESS' as const, // Default to BUSINESS, user can change later
      }));

      // Save transactions to database
      const response = await fetch('/api/bank-statements/load-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: transactionsWithProfile }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transactions');
      }

      const result = await response.json();
      
      toast.success(`✅ Successfully loaded ${result.count} transactions!`);
      
      // Remove the card after loading
      setManualTransactionCards(prev => prev.filter(c => c.id !== cardId));
      
    } catch (error) {
      console.error('Error loading manual transactions:', error);
      toast.error('Failed to load transactions. Please try again.');
    } finally {
      setLoadingTransactions(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Manual Transaction Entry Section */}
        <Card className="bg-card-elevated border-primary/20 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Manual Transaction Entry
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste your transactions below. Each batch should be for one month/year.
              </p>
            </div>

            {/* Statement Date Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Statement Date (e.g., January 2024)
              </label>
              <input
                type="text"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                placeholder="January 2024"
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isProcessingManual}
              />
            </div>

            {/* Text Input */}
            <textarea
              value={manualTransactionText}
              onChange={(e) => setManualTransactionText(e.target.value)}
              placeholder="Paste your bank statement transactions here (including all sections like Deposits, Debit Card Purchases, ACH Deductions, etc.)..."
              className="w-full min-h-[200px] p-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono text-sm"
              disabled={isProcessingManual}
            />

            {/* Process Button */}
            <Button
              onClick={handleProcessManualTransactions}
              disabled={!manualTransactionText.trim() || isProcessingManual}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isProcessingManual ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Transaction Card
                </>
              )}
            </Button>
          </div>

          {/* Manual Transaction Cards Display */}
          {manualTransactionCards.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Transaction Cards</h3>
              {manualTransactionCards.map((card) => (
                <Card key={card.id} className="bg-card border-primary/30 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-foreground">
                        {card.monthYear}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                          {card.transactions.length} transactions
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyManualTransactions(card.transactions)}
                          className="h-7 px-2 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    {/* Transaction List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {card.transactions.map((transaction, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-foreground">
                                {transaction.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{transaction.date}</span>
                              {transaction.category && (
                                <>
                                  <span>•</span>
                                  <span>{transaction.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Load Button */}
                    <Button
                      onClick={() => handleLoadManualTransactions(card.id, card.transactions)}
                      disabled={loadingTransactions === card.id}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loadingTransactions === card.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading transactions...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Load to Database ({card.transactions.length} transactions)
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Abacus ChatLLM Section */}
        <div className="h-[calc(100vh-32rem)] flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-heading text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              ABACUS CHATLLM
            </h1>
            <p className="text-body text-muted-foreground">
              Powered by RouteLLM - Ask anything or upload documents
            </p>
          </div>

        {/* Messages Area */}
        <Card className="flex-1 bg-card-elevated border-primary/20 mb-4 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                      ? 'bg-muted/50 border border-border'
                      : 'bg-muted'
                  }`}
                >
                  <div className="space-y-2">
                    {message.fileName && (
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">{message.fileName}</span>
                      </div>
                    )}
                    
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm whitespace-pre-wrap">
                        {typeof message.content === 'string' 
                          ? message.content 
                          : message.content.find(c => c.type === 'text')?.text || 'Processing...'}
                      </p>
                    </div>
                    
                    {/* Transaction Card */}
                    {message.extractedTransactions && message.extractedTransactions.length > 0 && (
                      <Card className="mt-4 bg-card border-primary/30">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Extracted Transactions
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                {message.extractedTransactions.length} transactions
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyTransactions(message.extractedTransactions!)}
                                className="h-7 px-2 text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                          
                          {/* Transaction List */}
                          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                            {message.extractedTransactions.map((transaction, idx) => (
                              <div 
                                key={idx}
                                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {transaction.profileType === 'BUSINESS' ? (
                                      <Building2 className="w-3 h-3 text-blue-500" />
                                    ) : (
                                      <Home className="w-3 h-3 text-green-500" />
                                    )}
                                    <span className="text-xs font-medium text-foreground">
                                      {transaction.description}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{transaction.date}</span>
                                    {transaction.category && (
                                      <>
                                        <span>•</span>
                                        <span>{transaction.category}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span className={transaction.profileType === 'BUSINESS' ? 'text-blue-500' : 'text-green-500'}>
                                      {transaction.profileType}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-sm font-semibold ${
                                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Load Results Button */}
                          <Button 
                            onClick={() => handleLoadTransactions(message.id, message.extractedTransactions!)}
                            disabled={loadingTransactions === message.id}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {loadingTransactions === message.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading transactions...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Load Results ({message.extractedTransactions.length} transactions)
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    )}
                    
                    {message.model && message.role === 'user' && (
                      <p className="text-xs opacity-60 mt-2">Model: {message.model}</p>
                    )}
                    
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Input Area */}
        <Card className="bg-card-elevated border-primary/20 p-4">
          {/* Model Selector */}
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Model:</label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isProcessing}>
              <SelectTrigger className="w-[250px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {/* RouteLLM - Auto-selects best model */}
                <SelectItem value="RouteLLM">RouteLLM (Auto-select best model)</SelectItem>
                
                {/* OpenAI Models */}
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gpt-5-pro">GPT-5 Pro</SelectItem>
                <SelectItem value="gpt-5-thinking">GPT-5 Thinking</SelectItem>
                <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                <SelectItem value="gpt-4.5">GPT-4.5</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="o3">o3</SelectItem>
                <SelectItem value="o3-mini">o3-mini</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                
                {/* Anthropic Models */}
                <SelectItem value="claude-opus-4.1">Claude Opus 4.1</SelectItem>
                <SelectItem value="claude-sonnet-4">Claude Sonnet 4</SelectItem>
                <SelectItem value="claude-3.7-sonnet">Claude 3.7 Sonnet</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="claude-3.5-haiku">Claude 3.5 Haiku</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                
                {/* Google Gemini Models */}
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                <SelectItem value="gemini-2.5">Gemini 2.5</SelectItem>
                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                <SelectItem value="gemini-2-flash">Gemini 2 Flash</SelectItem>
                <SelectItem value="gemini-2-flash-thinking">Gemini 2 Flash Thinking</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                
                {/* xAI Grok Models */}
                <SelectItem value="grok-4">Grok-4</SelectItem>
                <SelectItem value="grok-3">Grok-3</SelectItem>
                
                {/* Meta Llama Models */}
                <SelectItem value="llama-4">Llama 4</SelectItem>
                <SelectItem value="llama-3.3-70b">Llama 3.3 70B</SelectItem>
                <SelectItem value="llama-3.1-405b">Llama 3.1 405B</SelectItem>
                <SelectItem value="llama-3.1-70b">Llama 3.1 70B</SelectItem>
                <SelectItem value="llama-3.1-8b">Llama 3.1 8B</SelectItem>
                
                {/* Deepseek Models */}
                <SelectItem value="deepseek-v3">Deepseek V3</SelectItem>
                <SelectItem value="deepseek-r1">Deepseek r1</SelectItem>
                <SelectItem value="deepseek">Deepseek</SelectItem>
                
                {/* Alibaba Qwen Models */}
                <SelectItem value="qwen-3">Qwen 3</SelectItem>
                <SelectItem value="qwen-2.5-72b">Qwen 2.5 72B</SelectItem>
                <SelectItem value="qwen-2.5-32b">Qwen 2.5 32B</SelectItem>
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
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedFile ? `Ask about ${selectedFile.name}...` : "Ask me anything..."}
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
              onClick={handleSendMessage}
              disabled={isProcessing || (!inputText.trim() && !selectedFile)}
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
    </div>
  );
}
