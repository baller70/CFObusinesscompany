
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
  AlertCircle
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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            CFO AI Advisor
            <Badge variant="secondary" className="text-xs">
              Debt Reduction Specialist
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">CFO is thinking...</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Quick questions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.message)}
                    className="justify-start text-left h-auto p-2"
                  >
                    <div className="flex items-center gap-2">
                      {action.icon}
                      <span className="text-xs">{action.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your CFO anything about your finances..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
