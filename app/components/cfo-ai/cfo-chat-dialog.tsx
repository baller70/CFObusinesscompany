
'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Brain, 
  User, 
  Loader2,
  DollarSign,
  TrendingDown,
  Target,
  AlertCircle,
  Zap
} from 'lucide-react'
import { CFOChatMessage } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface CFOChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CFOChatDialog({ open, onOpenChange }: CFOChatDialogProps) {
  const [messages, setMessages] = useState<CFOChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your AI CFO advisor. I've analyzed your financial data and I'm here to help you get out of debt and achieve financial stability.

I can help you with:
• Debt reduction strategies
• Cash flow optimization  
• Expense analysis and cost cutting
• Revenue growth opportunities
• Financial planning and budgeting
• Risk assessment and mitigation

What would you like to discuss first?`,
        timestamp: new Date()
      }])
    }
  }, [open, messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: CFOChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/cfo-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from CFO')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''
      
      const assistantMessageObj: CFOChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessageObj])

      if (reader) {
        let partialRead = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          partialRead += decoder.decode(value, { stream: true })
          let lines = partialRead.split('\n')
          partialRead = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                break
              }
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                assistantMessage += content
                
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessageObj.id 
                      ? { ...m, content: assistantMessage }
                      : m
                  )
                )
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: 'Chat Error',
        description: 'Failed to get response from CFO AI. Please try again.',
        variant: 'destructive'
      })
      
      // Remove the failed message
      setMessages(prev => prev.filter(m => m.id !== `msg_${Date.now() + 1}`))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickActions = [
    {
      label: 'Analyze my debt',
      message: 'Please analyze my current debt situation and provide a strategy to pay it off faster.',
      icon: <TrendingDown className="h-4 w-4" />
    },
    {
      label: 'Cut expenses',
      message: 'What expenses can I cut to improve my cash flow immediately?',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      label: 'Emergency fund',
      message: 'How much should I have in my emergency fund and how can I build it?',
      icon: <Target className="h-4 w-4" />
    },
    {
      label: 'Cash flow risks',
      message: 'What are the biggest risks to my current cash flow?',
      icon: <AlertCircle className="h-4 w-4" />
    }
  ]

  const handleQuickAction = (message: string) => {
    setInputMessage(message)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col bg-gradient-background border-0 shadow-premium-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-subheading text-foreground">CFO AI Advisor</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-success/10 text-success border-success/20 text-small px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-success rounded-full mr-1.5 animate-pulse"></div>
                  Debt Reduction Specialist
                </Badge>
                <Badge variant="outline" className="text-small px-2 py-0.5 border-primary/20 text-primary">
                  Always Available
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 animate-slide-in-up ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-primary to-blue-600 text-white' 
                      : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border border-border/50'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Brain className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-[75%] ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-4 rounded-xl shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-blue-600 text-white'
                        : 'bg-card border border-border/50 text-foreground'
                    }`}>
                      <div className="whitespace-pre-wrap text-body leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    <div className="text-small text-muted-foreground mt-2 px-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-4 animate-fade-in">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border border-border/50 shadow-sm">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-body text-foreground font-medium">CFO is analyzing your question...</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Premium Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-transparent">
              <p className="text-body text-foreground font-medium mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                Quick questions to get started:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => handleQuickAction(action.message)}
                    className="justify-start text-left h-auto p-4 group hover:bg-primary/5 hover:shadow-sm border border-border/30 rounded-xl transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        {action.icon}
                      </div>
                      <span className="text-small font-medium text-foreground group-hover:text-primary transition-colors">{action.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Premium Message Input */}
          <div className="px-6 py-4 border-t border-border/50 bg-card">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your CFO anything about your finances..."
                disabled={isLoading}
                className="flex-1 h-12 focus-premium rounded-xl border-border/50 bg-background/50"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="h-12 px-6 btn-primary shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
