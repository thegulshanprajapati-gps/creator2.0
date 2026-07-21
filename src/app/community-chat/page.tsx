'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  channel: string;
}

export default function AdminCommunityChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat?channel=general-discussion');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // 5 sec polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const currentMsg = inputValue;
    setInputValue('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMsg,
          senderName: 'Admin',
          senderRole: 'admin',
          channel: 'general-discussion'
        })
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message', error);
      setInputValue(currentMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Community Chat Admin
          </h1>
          <p className="text-muted-foreground mt-1">Live interaction with students in #general-discussion.</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-black rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No messages yet.
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="flex gap-4 group hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-colors">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                  msg.senderRole === 'admin' ? 'bg-red-500' : 'bg-slate-700'
                )}>
                  {msg.senderName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{msg.senderName}</span>
                    {msg.senderRole === 'admin' && (
                      <span className="text-[10px] bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Admin</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-foreground mt-1">
                    {msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center bg-background rounded-xl overflow-hidden border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <div className="pl-4 pr-2 py-3 bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1 min-h-[48px] flex items-center px-4">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Send a message as Admin..." 
                disabled={isSending}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground h-full py-3 disabled:opacity-50"
              />
            </div>
            <div className="pr-2 flex items-center">
              <Button type="submit" disabled={isSending || !inputValue.trim()} size="icon" className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
