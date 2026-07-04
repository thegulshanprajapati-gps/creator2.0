'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  Zap,
  Activity,
  Globe,
  Loader2,
  Settings2,
  Bell,
  Shield,
  Search,
  Lock,
  Eye,
  Server,
  Download,
  Plus,
  X,
  FileSpreadsheet
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { formatINR } from "@/lib/format";

export default function SupportDashboard() {
  const [usersCount, setUsersCount] = useState<number | string>('...');
  const [coursesCount, setCoursesCount] = useState<number | string>('...');
  const [revenue, setRevenue] = useState<number>(45231);
  const [latency, setLatency] = useState<string>('1.2ms');
  const [chartData, setChartData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // New features state
  const [isUpdatingSitemap, setIsUpdatingSitemap] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('Tech');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [isPostingBlog, setIsPostingBlog] = useState(false);

  const handleInitializeUpdate = async () => {
    setIsUpdatingSitemap(true);
    try {
      const res = await fetch('/api/sitemap-generator', { method: 'POST' });
      if (res.ok) {
        alert('Sitemaps initialized and updated successfully for both Main and Support site!');
      } else {
        alert('Failed to update sitemaps.');
      }
    } catch (err) {
      alert('Error updating sitemaps: ' + err);
    } finally {
      setIsUpdatingSitemap(false);
    }
  };

  const handlePostBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) {
      alert('Title and Content are required.');
      return;
    }
    setIsPostingBlog(true);
    try {
      const res = await fetch('/api/blogs/instant-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: blogTitle,
          content: blogContent,
          category: blogCategory,
          excerpt: blogExcerpt
        })
      });
      if (res.ok) {
        alert('Blog posted successfully!');
        setIsBlogModalOpen(false);
        setBlogTitle('');
        setBlogContent('');
        setBlogCategory('Tech');
        setBlogExcerpt('');
      } else {
        const errData = await res.json();
        alert('Failed to post blog: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error posting blog: ' + err);
    } finally {
      setIsPostingBlog(false);
    }
  };

  const fetchSecurityLogs = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/security/track', { signal });
      if (res.ok) {
        const json = await res.json();
        setSecurityLogs(json.logs || []);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Error fetching security logs:', e);
      }
    }
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats', { signal });
        if (res.ok && active) {
          const data = await res.json();
          setUsersCount(data.usersCount);
          setCoursesCount(data.coursesCount);
          setRevenue(data.revenueValue);
          setLatency(data.latencyValue);
          if (data.chartData) setChartData(data.chartData);
          if (data.logs) setLogs(data.logs);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError' && active) {
          console.warn('Error fetching stats:', e);
        }
      }
    }

    fetchStats();
    fetchSecurityLogs(signal);
    const interval = setInterval(() => {
      fetchStats();
      fetchSecurityLogs(signal);
    }, 3000);
    const timer = setTimeout(() => setIsInitializing(false), 1500);

    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isInitializing && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[999] bg-background flex flex-col items-center justify-center space-y-8"
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.1, 1] }}
              transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity } }}
              className="relative h-24 w-24"
            >
              <div className="absolute inset-0 rounded-full border-4 border-muted/20" />
              <div className="absolute inset-0 rounded-full border-t-4 border-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings2 className="h-10 w-10 text-foreground" />
              </div>
            </motion.div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-headline font-bold tracking-tight animate-pulse text-foreground">Initializing Orchestration Engine</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em]">Admin Console v2.0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="bg-muted/10 relative">
          {/* Background blur decorative elements */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-20 -left-32 w-[400px] h-[400px] bg-primary/[0.04] rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-0 w-[350px] h-[350px] bg-accent/[0.06] rounded-full blur-[120px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[150px]" />
          </div>
          <header className="flex h-16 shrink-0 items-center gap-2 md:gap-4 border-b bg-background/60 backdrop-blur-xl px-3 md:px-6 sticky top-0 z-50">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-headline font-bold text-base md:text-xl tracking-tight text-foreground">Admin Console v2.0</h1>
                <Badge variant="outline" className="text-[10px] h-5 bg-muted/5 text-foreground border-muted/20 font-bold uppercase hidden sm:inline-flex">System: Nominal</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button 
                  size="sm" 
                  onClick={handleInitializeUpdate} 
                  disabled={isUpdatingSitemap}
                  className="bg-muted text-foreground shadow-lg shadow-muted/20 font-bold text-xs md:text-sm"
                >
                  {isUpdatingSitemap ? (
                    <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  )}
                  <span className="hidden sm:inline">{isUpdatingSitemap ? 'Updating...' : 'Initialize Update'}</span>
                </Button>
              </div>
            </div>
          </header>
          
          <main className="flex flex-1 flex-col gap-4 md:gap-6 p-3 md:p-6 lg:p-8 relative z-10">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-muted/40 p-1 rounded-2xl border border-primary/5 flex w-fit gap-2">
                <TabsTrigger value="overview" className="rounded-xl font-bold py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="seo" className="rounded-xl font-bold py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                  Master SEO
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-xl font-bold py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                  Security Hub
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW CONTENT */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="dashboard-overview-widget">
                    <StatCard 
                      title="Identity Entities" 
                      value={String(usersCount)} 
                      icon={Users} 
                      trend="+12.5%" 
                      description="Authenticated students"
                    />
                  </div>
                  <div className="dashboard-overview-widget">
                    <StatCard 
                      title="Curriculum Units" 
                      value={String(coursesCount)} 
                      icon={FileText} 
                      trend="+8 new" 
                      description="Course modules active"
                    />
                  </div>
                  <div className="dashboard-overview-widget">
                    <StatCard 
                      title="Revenue Stream" 
                      value={formatINR(revenue)}
                      icon={BarChart3} 
                      trend="+8.4%" 
                      description="Monthly recurring"
                      color="text-green-600"
                    />
                  </div>
                  <div className="dashboard-performance-widget">
                    <StatCard 
                      title="Engine Latency" 
                      value={latency} 
                      icon={Zap} 
                      trend="Optimal" 
                      description="Core processing speed"
                      color="text-blue-600"
                    />
                  </div>
                </div>

                {/* Quick Actions Console */}
                <Card className="shadow-2xl border-primary/5 rounded-2xl md:rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="font-headline font-bold text-xl text-foreground">Data & Content Orchestrator</h2>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Export platform metrics or instantly publish articles</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button asChild className="rounded-xl font-bold bg-primary text-white hover:bg-primary/95 flex items-center gap-2">
                        <a href="/api/download/courses" download>
                          <Download className="h-4 w-4" /> Download Courses (ZIP)
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="rounded-xl font-bold border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-background/50 hover:bg-background/80 flex items-center gap-2">
                        <a href="/api/download/users" download>
                          <FileSpreadsheet className="h-4 w-4" /> Download User Data (Excel)
                        </a>
                      </Button>
                      <Button asChild className="rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2">
                        <Link href="/blogs">
                          <Plus className="h-4 w-4" /> Post Instant Blog
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
                  <div className="lg:col-span-2 dashboard-realtime-widget">
                    <Card className="shadow-2xl border-primary/5 rounded-2xl md:rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm h-full">
                      <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
                        <div>
                          <CardTitle className="font-headline text-xl">Student Engagement Cycle</CardTitle>
                          <CardDescription className="text-xs uppercase tracking-widest font-bold">Real-time platform activity</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold">7-DAY METRIC</Badge>
                      </CardHeader>
                      <CardContent className="h-[250px] md:h-[350px] mt-4 p-4 md:p-8">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="dashboard-realtime-widget">
                    <Card className="shadow-2xl border-primary/5 rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col bg-background/80 backdrop-blur-sm h-full">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="font-headline text-xl">Traffic Orchestration</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest font-bold">User acquisition channels</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 p-4 md:p-8 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip />
                            <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="shadow-2xl border-primary/5 rounded-2xl md:rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-headline text-xl">Administrative Orchestration Logs</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest font-bold">Recent system-level modifications</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-widest">Full History</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-8">
                    <div className="space-y-4">
                      {logs.map((log: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-5 rounded-2xl bg-background border-2 border-transparent hover:border-muted/20 transition-all group shadow-sm gap-2 sm:gap-0">
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-muted/5 flex items-center justify-center text-foreground group-hover:bg-muted group-hover:text-white transition-all shrink-0">
                              <Globe className="h-4 w-4 md:h-6 md:w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs md:text-sm group-hover:text-foreground transition-colors truncate">{log.action}</p>
                              <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{log.details}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right pl-10 sm:pl-0 shrink-0">
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-foreground">{log.user}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground sm:justify-end font-bold">
                              <Clock className="h-3 w-3" />
                              {log.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MASTER SEO CONTENT */}
              <TabsContent value="seo" className="mt-0">
                <Card className="shadow-2xl border-primary/5 rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                      <Search className="h-6 w-6 text-primary" /> Master SEO Diagnostics
                    </CardTitle>
                    <CardDescription className="text-xs uppercase tracking-widest font-bold">Universal Search Engine visibility & keyword analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 bg-slate-50 dark:bg-slate-900/30">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Ranking Factor</span>
                        <div className="text-3xl font-headline font-bold text-emerald-500">89% Index Score</div>
                        <p className="text-xs text-muted-foreground">High domain authority configurations synced.</p>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 bg-slate-50 dark:bg-slate-900/30">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Crawlability Index</span>
                        <div className="text-3xl font-headline font-bold text-primary">A+ Status</div>
                        <p className="text-xs text-muted-foreground">Sitemap, robot index, and tags are fully crawlabale.</p>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-2 bg-slate-50 dark:bg-slate-900/30">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Organic Keywords Tracked</span>
                        <div className="text-3xl font-headline font-bold text-blue-500">14 Active</div>
                        <p className="text-xs text-muted-foreground">Primary focus keywords logged in database.</p>
                      </div>
                    </div>

                    <div className="border border-primary/10 rounded-2xl p-6 space-y-4 bg-muted/10">
                      <h3 className="font-headline text-lg font-bold">SEO Architecture Summary</h3>
                      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                          Our system utilizes next-generation dynamic meta management. Whenever you publish pages, course structures, or updates, the platform automatically generates optimized <strong>Meta Title</strong> tags and <strong>Meta Descriptions</strong> using structured AI pipelines.
                        </p>
                        <p>
                          <strong>Automatic Schema Markup:</strong> The system automatically structures course curriculum schemas as JSON-LD, exposing rich snippets directly to Google web spiders. This increases Click-Through Rate (CTR) by exposing course durations, ratings, and authors directly on Google search results.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECURITY AUDIT CONTENT */}
              <TabsContent value="security" className="mt-0">
                <Card className="shadow-2xl border-primary/5 rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                      <Lock className="h-6 w-6 text-amber-500" /> Security Audits & Client Telemetry
                    </CardTitle>
                    <CardDescription className="text-xs uppercase tracking-widest font-bold">Live visitor logs, Client IPs, and page rendering duration times</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {securityLogs.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-3 opacity-20 animate-pulse" />
                        <p className="font-bold">Waiting for telemetry data...</p>
                        <p className="text-xs mt-1">IP records are captured instantly upon user page loads.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-background/50">
                        <table className="w-full text-left border-collapse text-xs md:text-sm">
                          <thead>
                            <tr className="border-b bg-muted/20">
                              <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Client IP Address</th>
                              <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Active Route</th>
                              <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Total Render Session Duration</th>
                              <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Agent Signature</th>
                              <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {securityLogs.map((log) => (
                              <tr key={log.id} className="border-b hover:bg-muted/5 transition-colors">
                                <td className="p-4 font-mono font-bold text-amber-600 dark:text-yellow-400">{log.ip}</td>
                                <td className="p-4 font-semibold text-foreground">{log.route}</td>
                                <td className="p-4 font-bold text-emerald-500">
                                  {log.renderTime >= 60 ? `${Math.floor(log.renderTime / 60)}m ${log.renderTime % 60}s` : `${log.renderTime} seconds`}
                                </td>
                                <td className="p-4 max-w-[200px] truncate text-muted-foreground" title={log.userAgent}>{log.userAgent}</td>
                                <td className="p-4 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </SidebarProvider>
      {/* Instant Blog Post Modal */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-background border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsBlogModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h3 className="font-headline font-bold text-2xl text-foreground">Post Instant Blog</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Publish an article directly to the live feed</p>
            </div>
            
            <form onSubmit={handlePostBlog} className="space-y-4 font-sans text-sm">
              <div className="space-y-2">
                <label className="block font-bold text-xs uppercase tracking-wider text-muted-foreground">Blog Title</label>
                <input 
                  type="text" 
                  value={blogTitle} 
                  onChange={(e) => setBlogTitle(e.target.value)} 
                  placeholder="e.g. Mastering Next.js Server Components"
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-bold text-xs uppercase tracking-wider text-muted-foreground">Category</label>
                  <select 
                    value={blogCategory} 
                    onChange={(e) => setBlogCategory(e.target.value)} 
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary transition-all"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Career">Career</option>
                    <option value="Design">Design</option>
                    <option value="AI">AI</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-bold text-xs uppercase tracking-wider text-muted-foreground">Short Excerpt</label>
                  <input 
                    type="text" 
                    value={blogExcerpt} 
                    onChange={(e) => setBlogExcerpt(e.target.value)} 
                    placeholder="Short description..."
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-xs uppercase tracking-wider text-muted-foreground">Article Content</label>
                <textarea 
                  value={blogContent} 
                  onChange={(e) => setBlogContent(e.target.value)} 
                  placeholder="Write your article here..."
                  rows={8}
                  className="w-full p-4 rounded-2xl border border-border bg-background text-foreground outline-none focus:border-primary transition-all resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsBlogModalOpen(false)}
                  className="rounded-xl font-bold border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPostingBlog}
                  className="rounded-xl font-bold bg-primary text-white hover:bg-primary/95 flex items-center gap-2"
                >
                  {isPostingBlog ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    'Publish Instantly'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ title, value, icon: Icon, trend, description }: any) {
  const t = title.toLowerCase();
  let iconBg = "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20";
  let borderHover = "hover:border-amber-500/30";
  let badgeBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  let bulletColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
  let shadowHover = "hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.12)]";

  if (t.includes("curriculum")) {
    iconBg = "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20";
    borderHover = "hover:border-purple-500/30";
    badgeBg = "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    bulletColor = "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]";
    shadowHover = "hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.12)]";
  } else if (t.includes("revenue")) {
    iconBg = "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20";
    borderHover = "hover:border-emerald-500/30";
    badgeBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    bulletColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
    shadowHover = "hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.12)]";
  } else if (t.includes("latency")) {
    iconBg = "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20";
    borderHover = "hover:border-blue-500/30";
    badgeBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    bulletColor = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
    shadowHover = "hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.12)]";
  }

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.015 }} 
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <Card className={cn(
        "overflow-hidden border border-slate-200/50 dark:border-slate-800/50 group shadow-md transition-all duration-300 rounded-[1.5rem] md:rounded-[2rem] bg-background/80 backdrop-blur-md relative",
        borderHover,
        shadowHover
      )}>
        <CardContent className="pt-5 p-5 md:pt-8 md:p-8">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 md:space-y-2 flex-1">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground leading-tight whitespace-normal" title={title}>
                {title}
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-headline font-black tracking-tight text-foreground mt-1 whitespace-normal break-words">
                {value}
              </h3>
              <div className="flex items-center gap-1.5 pt-1">
                <Badge variant="secondary" className={cn("h-5 border-none font-bold uppercase px-2 py-0 text-[9px] md:text-[10px] rounded-full flex items-center gap-1", badgeBg)}>
                  <TrendingUp className="h-3 w-3" /> {trend}
                </Badge>
              </div>
            </div>
            
            <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 ml-1 shadow-sm", iconBg)}>
              <Icon className="h-5 w-5 md:h-7 md:w-7" />
            </div>
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-800/40 my-4 md:my-6" />
          
          <p className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-2 font-bold uppercase tracking-wider">
            <span className={cn("flex h-2 w-2 rounded-full", bulletColor)} />
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
