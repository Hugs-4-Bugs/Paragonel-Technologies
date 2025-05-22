
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Mic, X, Loader2, Bot, User } from 'lucide-react';
import { companyQnaFlow, CompanyQnaInput, CompanyQnaOutput } from '@/ai/flows/company-qna-flow';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export function ChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const initialMessage: ChatMessage = {
    id: 'initial-ai-message',
    sender: 'ai',
    text: "Hi! I'm the QuantumFusion Solutions assistant. How can I help you today?",
    timestamp: new Date(),
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, [isOpen]);


  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div > div'); // Target inner div of ScrollArea
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
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
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse: CompanyQnaOutput = await companyQnaFlow({ question: userMessage.text });
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
    if (!isOpen && messages.length === 0) { // If opening for the first time and no messages
        setMessages([initialMessage]);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={toggleChat}
        aria-label="Open chat"
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-full max-w-md h-[70vh] max-h-[600px] shadow-xl z-50 flex flex-col rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-muted/50">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Bot className="h-6 w-6 mr-2 text-primary neon-icon" />
          QuantumFusion Assistant
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={toggleChat} aria-label="Close chat">
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
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
                    "max-w-[75%] rounded-xl px-4 py-2.5 text-sm shadow-sm",
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                      "text-xs mt-1",
                      msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70 text-left'
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
                <div className="bg-muted rounded-xl px-4 py-2.5 text-sm shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted/50">
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
            className="flex-grow bg-background"
            disabled={isLoading}
          />
          <Button type="button" variant="ghost" size="icon" disabled={isLoading} aria-label="Use microphone (visual placeholder)">
            <Mic className="h-5 w-5 text-muted-foreground hover:text-primary" />
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || inputValue.trim() === ''} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
