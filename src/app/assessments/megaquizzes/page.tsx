'use client';

import { useEffect, useMemo, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, CheckCircle2, XCircle, Users, RefreshCw, Trophy, 
  Clock, Plus, Trash2, Save, FileText, Settings2, Sparkles,
  Link as LinkIcon, Copy
} from 'lucide-react';

type QuizRegistration = {
  id: string;
  name: string;
  email: string;
  number: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  testAttempted?: boolean;
  finalScore?: number;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
};

export default function MegaQuizzesAdminPage() {
  const [activeTab, setActiveTab] = useState('moderation');
  
  // Moderation registry state
  const [registrations, setRegistrations] = useState<QuizRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Quiz Builder state
  const [quizTitle, setQuizTitle] = useState('Xmarty Mega Live Quiz');
  const [quizDescription, setQuizDescription] = useState('Register for the upcoming premium live assessment tracks, track your enrollment verification, and start your test sessions securely.');
  const [bannerUrl, setBannerUrl] = useState('');
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      question: 'Which of the following is correct about React Server Components (RSC)?',
      options: [
        'They are executed on the client side during render hooks',
        'They render exclusively on the server and reduce client bundle size',
        'They replace client-side state managers like Redux or Zustand',
        'They require the "use client" directive at the top of the file'
      ],
      answerIndex: 1
    }
  ]);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchErr } = await db
        .from('mega_quiz_registrations')
        .select('*')
        .order('registeredAt', { ascending: false });

      if (fetchErr) throw new Error(fetchErr.message);
      setRegistrations((data || []) as QuizRegistration[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuizConfig = async () => {
    try {
      const { data, error: fetchErr } = await db
        .from('mega_quizzes')
        .eq('id', 'active_mega_quiz')
        .maybeSingle();

      if (data) {
        setQuizTitle(data.title || 'Xmarty Mega Live Quiz');
        setQuizDescription(data.description || 'Register for the upcoming premium live assessment tracks, track your enrollment verification, and start your test sessions securely.');
        setBannerUrl(data.bannerUrl || '');
        setTimeLimit(Number(data.timeLimit) || 10);
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        }
      }
    } catch (err) {
      console.warn('Could not load quiz configuration, using default skeleton.', err);
    }
  };

  useEffect(() => {
    loadRegistrations();
    loadQuizConfig();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error: updateErr } = await db
        .from('mega_quiz_registrations')
        .eq('id', id)
        .update({ status: newStatus });

      if (updateErr) throw new Error(updateErr.message);
      
      setRegistrations(prev =>
        prev.map(reg => reg.id === id ? { ...reg, status: newStatus } : reg)
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update registration status.');
    }
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      question: '',
      options: ['', '', '', ''],
      answerIndex: 0
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleUpdateQuestionText = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question: text } : q));
  };

  const handleUpdateOptionText = (qId: string, optIdx: number, val: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleUpdateAnswerIndex = (qId: string, val: number) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, answerIndex: val } : q));
  };

  const handleSaveQuizConfig = async () => {
    setSavingConfig(true);
    try {
      // Basic validation
      for (const q of questions) {
        if (!q.question.trim()) {
          alert('All questions must have question text.');
          setSavingConfig(false);
          return;
        }
        if (q.options.some(opt => !opt.trim())) {
          alert('All options must be filled out for each question.');
          setSavingConfig(false);
          return;
        }
      }

      const { error: saveErr } = await db
        .from('mega_quizzes')
        .upsert({
          id: 'active_mega_quiz',
          title: quizTitle,
          description: quizDescription,
          bannerUrl: bannerUrl,
          timeLimit: Number(timeLimit),
          questions
        });

      if (saveErr) throw new Error(saveErr.message);
      alert('Mega Quiz configuration saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save quiz configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const copyRegistrationLink = () => {
    const currentHost = window.location.host;
    let targetUrl = '';
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
      targetUrl = 'http://localhost:3000/megaquizzes';
    } else {
      const protocol = window.location.protocol;
      const cleanHost = currentHost.replace('support.', '').replace('supportdomain.', '');
      targetUrl = `${protocol}//${cleanHost}/megaquizzes`;
    }
    navigator.clipboard.writeText(targetUrl);
    alert(`Registration link copied to clipboard:\n${targetUrl}`);
  };

  const filteredRegistrations = useMemo(() => {
    if (!search.trim()) return registrations;
    const query = search.toLowerCase();
    return registrations.filter(reg =>
      reg.name.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.number.toLowerCase().includes(query)
    );
  }, [registrations, search]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const pending = registrations.filter(r => r.status === 'pending').length;
    const approved = registrations.filter(r => r.status === 'approved').length;
    const attempted = registrations.filter(r => r.testAttempted).length;
    return { total, pending, approved, attempted };
  }, [registrations]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="font-headline font-bold text-xl">Mega Quizzes Moderation</h1>
              <p className="text-xs text-muted-foreground">Approve, reject or monitor registrations and edit the active exam questions configuration.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-80">
              <TabsList className="grid grid-cols-2 rounded-xl">
                <TabsTrigger value="moderation" className="font-bold text-xs uppercase tracking-wider">Moderation</TabsTrigger>
                <TabsTrigger value="builder" className="font-bold text-xs uppercase tracking-wider">Quiz Builder</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          <Tabs value={activeTab} className="space-y-6">
            
            {/* TAB CONTENT 1: MODERATION REGISTRY */}
            <TabsContent value="moderation" className="space-y-6 m-0">
              {/* Stats Row */}
              <div className="grid gap-6 sm:grid-cols-4">
                <Card className="rounded-[1.5rem] border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Registrations</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-black text-foreground flex items-center justify-between">
                    <span>{stats.total}</span>
                    <Users className="h-6 w-6 text-indigo-500 opacity-60" />
                  </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Review</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-black text-amber-500 flex items-center justify-between">
                    <span>{stats.pending}</span>
                    <Clock className="h-6 w-6 text-amber-500 opacity-60 animate-pulse" />
                  </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Approved Students</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-black text-emerald-600 flex items-center justify-between">
                    <span>{stats.approved}</span>
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-60" />
                  </CardContent>
                </Card>

                <Card className="rounded-[1.5rem] border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exam Attempted</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-black text-violet-500 flex items-center justify-between">
                    <span>{stats.attempted}</span>
                    <Trophy className="h-6 w-6 text-violet-500 opacity-60" />
                  </CardContent>
                </Card>
              </div>

              {/* List Table Card */}
              <Card className="rounded-[2rem] border shadow-sm overflow-hidden bg-background">
                <CardHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Student Registration Registry</CardTitle>
                    <CardDescription>Authorize entry to exam, check live score metrics and evaluate student applications.</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-1.5 h-10 px-4 animate-pulse" onClick={copyRegistrationLink}>
                      <LinkIcon className="h-3.5 w-3.5" /> Get Registration Link
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs gap-1.5 h-10 px-4" onClick={loadRegistrations} disabled={loading}>
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  
                  {/* Search filter */}
                  <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email or number..."
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  {/* Table */}
                  <div className="border rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Phone Number</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Registration Date</th>
                          <th className="p-4">Exam Score</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {filteredRegistrations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              {loading ? 'Fetching records...' : 'No registrations found.'}
                            </td>
                          </tr>
                        ) : (
                          filteredRegistrations.map((reg) => (
                            <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                              <td className="p-4 font-bold text-foreground">{reg.name}</td>
                              <td className="p-4 text-muted-foreground">{reg.email}</td>
                              <td className="p-4 text-muted-foreground font-mono">{reg.number}</td>
                              <td className="p-4">
                                {reg.status === 'pending' && (
                                  <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-full px-2.5 font-bold uppercase tracking-wider">Pending</Badge>
                                )}
                                {reg.status === 'approved' && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-full px-2.5 font-bold uppercase tracking-wider">Approved</Badge>
                                )}
                                {reg.status === 'rejected' && (
                                  <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-full px-2.5 font-bold uppercase tracking-wider">Rejected</Badge>
                                )}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {new Date(reg.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="p-4 font-bold text-center">
                                {reg.testAttempted ? (
                                  <span className="text-violet-600 dark:text-violet-400 font-mono text-sm">{reg.finalScore}%</span>
                                ) : (
                                  <span className="text-slate-400 font-medium">Awaiting Test</span>
                                )}
                              </td>
                              <td className="p-4 text-right space-x-2">
                                {reg.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateStatus(reg.id, 'approved')}
                                      className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                                      className="h-8 rounded-lg font-bold"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {reg.status !== 'pending' && (
                                  <span className="text-slate-400 italic text-[11px]">Decided</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT 2: QUIZ BUILDER/CREATOR */}
            <TabsContent value="builder" className="space-y-6 m-0">
              <Card className="rounded-[2rem] border shadow-sm overflow-hidden bg-background">
                <CardHeader className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-1.5 text-indigo-900 dark:text-indigo-400">
                      <Sparkles className="h-5 w-5 text-indigo-500" /> Mega Quiz Configuration
                    </CardTitle>
                    <CardDescription>Configure the live test title, duration timers, set dynamic headers, and construct live interactive quiz questions.</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={copyRegistrationLink}
                      variant="outline"
                      className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5"
                    >
                      <Copy className="h-4 w-4" /> Copy Student URL
                    </Button>
                    <Button 
                      onClick={handleSaveQuizConfig} 
                      disabled={savingConfig}
                      className="rounded-xl font-bold text-xs h-10 px-5 gap-1.5 shadow"
                    >
                      <Save className="h-4 w-4" /> {savingConfig ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Basic settings */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quiz Title</label>
                      <Input 
                        value={quizTitle} 
                        onChange={(e) => setQuizTitle(e.target.value)} 
                        placeholder="e.g. Mega Live Assessment 2026"
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time Limit (Minutes)</label>
                      <Input 
                        type="number"
                        value={timeLimit} 
                        onChange={(e) => setTimeLimit(Number(e.target.value))} 
                        placeholder="e.g. 10"
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Banner Image URL</label>
                      <Input 
                        value={bannerUrl} 
                        onChange={(e) => setBannerUrl(e.target.value)} 
                        placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                        className="rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Intro Description & Instructions</label>
                      <Textarea 
                        value={quizDescription} 
                        onChange={(e) => setQuizDescription(e.target.value)} 
                        placeholder="Write student instructions here..."
                        className="rounded-xl min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-white/5 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline font-bold text-sm text-foreground">Quiz Questions ({questions.length})</h3>
                      <Button 
                        onClick={handleAddQuestion}
                        variant="outline" 
                        className="rounded-xl text-xs font-bold h-9 px-3 gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add Question
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {questions.map((q, qIndex) => (
                        <div 
                          key={q.id} 
                          className="p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4 relative"
                        >
                          <button 
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-rose-500/[0.04] text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <div className="space-y-1.5 pr-10">
                            <span className="text-[9px] font-black uppercase text-indigo-500 font-mono">Question {qIndex + 1}</span>
                            <Input 
                              value={q.question}
                              onChange={(e) => handleUpdateQuestionText(q.id, e.target.value)}
                              placeholder="Type question content here..."
                              className="rounded-xl h-11 bg-background"
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Option {String.fromCharCode(65 + oIdx)}</label>
                                <Input 
                                  value={opt}
                                  onChange={(e) => handleUpdateOptionText(q.id, oIdx, e.target.value)}
                                  placeholder={`Enter option ${String.fromCharCode(65 + oIdx)} text`}
                                  className="rounded-xl h-10 bg-background"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="w-48 space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Correct Option Answer</label>
                            <select
                              value={q.answerIndex}
                              onChange={(e) => handleUpdateAnswerIndex(q.id, Number(e.target.value))}
                              className="w-full h-10 rounded-xl border border-slate-200 bg-background px-3 text-xs outline-none focus:border-primary/60 dark:border-white/5"
                            >
                              <option value={0}>Option A</option>
                              <option value={1}>Option B</option>
                              <option value={2}>Option C</option>
                              <option value={3}>Option D</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
