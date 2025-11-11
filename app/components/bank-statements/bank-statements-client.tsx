'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Paperclip, Send, Sparkles, FileText } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{type: string; text?: string; file?: {filename: string; file_data: string}}>;
  timestamp: Date;
  fileName?: string;
  model?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Prepare messages for ChatLLM
      const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));
      
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
        // Text-only message
        chatMessages.push({ role: 'user', content: currentInput });
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6 lg:p-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
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
  );
}
