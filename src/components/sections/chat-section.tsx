
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Mic, X, Loader2, Bot, User } from 'lucide-react';
import { companyQnaFlow, type CompanyQnaInput, type CompanyQnaOutput } from '@/ai/flows/company-qna-flow';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export function ChatSection() {
  const [isOpen, setIsOpen] = useState(true); // Auto-open chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const initialMessage: ChatMessage = {
    id: 'initial-ai-message',
    sender: 'ai',
    text: "Hi! I'm the QuantumFusion Solutions assistant. How can I help you today about our company, services, or careers?",
    timestamp: new Date(),
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, [isOpen, messages.length]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse: CompanyQnaOutput = await companyQnaFlow({ question: currentInput });
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling companyQnaFlow:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
        setMessages([initialMessage]);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-16 w-16 rounded-full shadow-2xl z-50 bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity p-0 flex items-center justify-center"
        onClick={toggleChat}
        aria-label="Open chat"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[calc(100%-2rem)] sm:w-full max-w-sm sm:max-w-md h-[calc(100svh-5rem)] sm:h-[70vh] max-h-[500px] sm:max-h-[600px] shadow-2xl z-50 flex flex-col rounded-xl overflow-hidden border-none bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Bot className="h-6 w-6 mr-2" />
          QuantumFusion Assistant
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={toggleChat} aria-label="Close chat" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden bg-background dark:bg-muted/10">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2",
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0 self-start mt-1" />}
                <div
                  className={cn(
                    "max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm",
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-primary to-blue-500 dark:from-primary dark:to-blue-600 text-primary-foreground rounded-br-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-md'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                      "text-xs mt-1.5 opacity-80",
                      msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-slate-500 dark:text-slate-400 text-left'
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0 self-start mt-1" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-sm shadow-md">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t bg-background dark:bg-muted/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            type="text"
            placeholder="Ask about QuantumFusion..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow bg-white dark:bg-background rounded-md border-slate-300 dark:border-slate-600 focus:border-primary focus:ring-primary"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
            aria-label="Use microphone"
            className="text-muted-foreground hover:text-primary"
            onClick={() => {
              toast({
                title: "Voice Input",
                description: "This feature is coming soon!",
                variant: "default",
              });
            }}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || inputValue.trim() === ''} aria-label="Send message" className="bg-primary hover:bg-primary/90">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
