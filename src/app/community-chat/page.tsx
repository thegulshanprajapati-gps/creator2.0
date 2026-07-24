'use client';

import { useState, useEffect, useRef } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ShieldAlert, Hash, Users, Sparkles, AlertCircle } from 'lucide-react';
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

const CHANNELS = [
  { id: "general-discussion", name: "General Discussion", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "announcements", name: "Announcements", icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "help-and-support", name: "Help & Support", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" }
];

export default function AdminCommunityChat() {
  const [activeChannel, setActiveChannel] = useState('general-discussion');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?channel=${activeChannel}`);
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
  }, [activeChannel]);

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
          channel: activeChannel
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

  const currentChannelInfo = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0];

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-border" />
            <div>
              <h1 className="font-headline font-bold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Live Community Chat
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Live Server Connected
            </Badge>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          
          {/* Channel Selector Sidebar (Inside admin page context) */}
          <div className="w-64 border-r bg-background hidden md:flex flex-col shrink-0">
            <div className="p-4 border-b">
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground animate-fade-in">Select Channel</h2>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isActive = ch.id === activeChannel;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-lg shrink-0", isActive ? "bg-primary/20 text-primary" : ch.bg, ch.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background/50 relative h-full">
            
            {/* Header info */}
            <div className="p-4 border-b bg-background flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", currentChannelInfo.bg, currentChannelInfo.color)}>
                  <Hash className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-foreground capitalize">{currentChannelInfo.name}</span>
              </div>
              <div className="md:hidden">
                {/* Mobile Channel switcher */}
                <select 
                  value={activeChannel} 
                  onChange={(e) => setActiveChannel(e.target.value)}
                  className="bg-muted text-xs font-bold border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CHANNELS.map(ch => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-6 space-y-3">
                  <div className="p-4 bg-muted/40 rounded-full">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">No messages yet</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Start the conversation by sending a broadcast as Admin.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg._id} 
                    className={cn(
                      "flex gap-3 max-w-[85%] rounded-2xl p-3 border text-sm transition-all",
                      msg.senderRole === 'admin' 
                        ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/20 ml-auto flex-row-reverse" 
                        : "bg-background border-border"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-sm",
                      msg.senderRole === 'admin' ? 'bg-red-500' : 'bg-slate-700'
                    )}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className={cn("flex items-center gap-1.5", msg.senderRole === 'admin' && "justify-end")}>
                        <span className="font-bold text-xs text-foreground truncate">{msg.senderName}</span>
                        {msg.senderRole === 'admin' && (
                          <Badge className="text-[8px] bg-red-500 text-white border-none py-0 px-1 rounded-sm tracking-wider uppercase">Admin</Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={cn("text-foreground break-words leading-relaxed text-sm", msg.senderRole === 'admin' && "text-right")}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Box */}
            <div className="p-4 border-t bg-background shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center bg-muted/30 dark:bg-muted/10 rounded-2xl overflow-hidden border border-border shadow-inner focus-within:ring-1 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all duration-300">
                <div className="pl-4 pr-2 py-3.5 bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                </div>
                <div className="flex-1 min-h-[50px] flex items-center px-4">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Reply to #${currentChannelInfo.name} as Admin...`} 
                    disabled={isSending}
                    className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground h-full py-3.5 disabled:opacity-50"
                  />
                </div>
                <div className="pr-3 flex items-center shrink-0">
                  <Button 
                    type="submit" 
                    disabled={isSending || !inputValue.trim()} 
                    size="icon" 
                    className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-transform active:scale-95"
                  >
                    <Send className="h-4.5 w-4.5 ml-0.5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
