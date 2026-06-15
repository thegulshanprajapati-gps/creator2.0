'use client';

import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/db';
import { Bell, Send, Users, User, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function SupportNotificationBroadcasterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form states
  const [targetType, setTargetType] = useState<'broadcast' | 'student'>('broadcast');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionUrl, setActionUrl] = useState('/');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.from('profiles').select('*');
      if (error) throw new Error(error.message);
      
      const studentProfiles = (data || [])
        .filter((p: any) => p.role === 'student' || !p.role || p.role === '')
        .map((p: any) => ({
          id: p.id,
          name: p.full_name || p.name || 'Anonymous',
          email: p.email || ''
        }));
      
      setStudents(studentProfiles);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Fetch Failed', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Title and body are required.' });
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, any> = {
        title,
        body,
        url: actionUrl
      };

      if (targetType === 'student' && selectedStudentId) {
        payload.studentId = selectedStudentId;
      }

      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch notification');

      toast({
        title: 'Notification Dispatched (Support Console) 🎉',
        description: `Dispatched to: ${targetType === 'broadcast' ? 'All Subscribers' : 'Selected Student'}`
      });

      // Clear fields
      setTitle('');
      setBody('');
      setActionUrl('/');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Dispatch Failed', description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10 pb-20 relative">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-indigo-200/40 dark:border-indigo-500/10">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl text-indigo-900 dark:text-indigo-400">Platform Notifications</h1>
            <p className="text-xs text-muted-foreground">Support Operations: Broadcast messages or send direct push notifications to individual student devices.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStudents} disabled={loading} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Students
          </Button>
        </header>

        <main className="p-6 md:p-8 max-w-2xl mx-auto w-full space-y-6">
          <Card className="rounded-[2rem] border border-border shadow-sm bg-background overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-transparent border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-indigo-900 dark:text-indigo-400">Send Notification</CardTitle>
                  <CardDescription>Dispatch instantly to client browser background service workers.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSendNotification} className="space-y-5">
                
                {/* Target Dropdown */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Audience</Label>
                  <Select value={targetType} onValueChange={(val: any) => setTargetType(val)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Choose target..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broadcast">
                        <span className="flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-indigo-500" /> Broadcast to All</span>
                      </SelectItem>
                      <SelectItem value="student">
                        <span className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-violet-500" /> Specific Student</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Specific Student Select */}
                {targetType === 'student' && (
                  <div className="space-y-2 animate-in fade-in-50 duration-200">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Recipient Student</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select student profile..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notification Title</Label>
                  <Input
                    required
                    placeholder="e.g. System Maintenance Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Body Content */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notification Message / Body</Label>
                  <Textarea
                    required
                    placeholder="Provide description context visible in client device popups..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="min-h-[100px] rounded-xl resize-none"
                  />
                </div>

                {/* Redirect Link */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Action Link / Redirect URL (On click)</Label>
                  <Input
                    placeholder="e.g. /profile or /courses"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="h-11 rounded-xl font-mono text-xs"
                  />
                </div>

                {/* Action button */}
                <Button
                  type="submit"
                  disabled={sending || (targetType === 'student' && !selectedStudentId)}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                >
                  {sending ? 'Dispatching...' : (
                    <>
                      Send Push Notification <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>

              </form>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
