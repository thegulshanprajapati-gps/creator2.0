
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Sparkles, Loader2, Bot, MapPin } from "lucide-react";
import { assistStudentWithFAQAndNavigation } from "@/ai/flows/ai-assisted-faq-and-navigation";
import { personalizedCoursePathSuggestion } from "@/ai/flows/personalized-course-path-suggestion";
import { cn } from "@/lib/utils";

export function VasantAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'suggest'>('chat');
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([
    { role: 'bot', content: "Namaste! I am Vasant, your learning assistant. How can I help you today?" }
  ]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userQuery = query;
    setQuery("");
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const res = await assistStudentWithFAQAndNavigation({ query: userQuery });
      setMessages(prev => [...prev, { role: 'bot', content: res.answer }]);
    } catch (err: any) {
      const errorMsg = err?.message || "I'm having a slight hitch in my processing. Please try again later!";
      setMessages(prev => [...prev, { role: 'bot', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = async () => {
    setLoading(true);
    try {
      // For demo purposes, we use preset values if fields aren't explicitly gathered
      const res = await personalizedCoursePathSuggestion({
        learningGoals: "Master modern web development with a focus on enterprise scalability",
        interests: "Next.js, AI integration, and minimalist design",
        currentKnowledge: "Intermediate JavaScript and basic React"
      });
      setMessages(prev => [...prev, { role: 'bot', content: res.suggestedCoursePath }]);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to generate your personalized path.";
      setMessages(prev => [...prev, { role: 'bot', content: errorMsg }]);
    } finally {
      setLoading(false);
      setMode('chat');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:scale-105 transition-transform"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 md:w-96 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary-foreground" />
              <CardTitle className="text-sm font-headline text-primary-foreground">Vasant AI Assistant</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-lg p-3 text-sm",
                    m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-2 border-t flex gap-2 overflow-x-auto">
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap rounded-full text-xs h-8"
                onClick={() => {
                  setMessages(prev => [...prev, { role: 'bot', content: "Thinking of a path for you..." }]);
                  handleSuggestion();
                }}
              >
                <MapPin className="h-3 w-3 mr-1" /> Suggest Path
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap rounded-full text-xs h-8"
                onClick={() => setMessages(prev => [...prev, { role: 'bot', content: "Common FAQs: 1. Payment methods 2. Certificate validity 3. Offline access" }])}
              >
                <Sparkles className="h-3 w-3 mr-1" /> FAQs
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-3 bg-muted/30">
            <form onSubmit={handleChat} className="flex w-full gap-2">
              <Input
                placeholder="Ask Vasant anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
