'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Users, FileText, BookOpen, Clock, Activity, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function TrafficDashboardPage() {
  const [traffic, setTraffic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTraffic = async () => {
    try {
      const res = await fetch('/api/security/traffic');
      const data = await res.json();
      if (data.success && data.traffic) {
        setTraffic(data.traffic);
      }
    } catch (e) {
      console.error('Failed to load traffic registry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, []);

  const totalViews = traffic.reduce((acc, curr) => acc + curr.views, 0);
  const totalVisitors = traffic.reduce((acc, curr) => acc + curr.visitors, 0);
  const courseTraffic = traffic.filter(t => t.type === 'course');
  const blogTraffic = traffic.filter(t => t.type === 'blog');

  // Format Recharts data model
  const chartData = traffic.slice(0, 8).map(t => ({
    name: t.name.length > 20 ? t.name.substring(0, 18) + '...' : t.name,
    views: t.views,
    visitors: t.visitors
  }));

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">System Traffic Insights</h1>
            <p className="text-xs text-muted-foreground font-medium">Original Page View Tracking & Engagement Metrics</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500 opacity-50" />
            </div>
          ) : (
            <>
              {/* Counters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-2xl bg-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Views</CardTitle>
                    <Eye className="h-5 w-5 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{totalViews}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Accumulated page views</p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-2xl bg-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unique Visitors</CardTitle>
                    <Users className="h-5 w-5 text-sky-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{totalVisitors}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Distinct client IP hashes</p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-2xl bg-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course Views</CardTitle>
                    <BookOpen className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{courseTraffic.reduce((acc, c) => acc + c.views, 0)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Folder curriculum catalog visits</p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-2xl bg-background">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Blog Views</CardTitle>
                    <FileText className="h-5 w-5 text-violet-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{blogTraffic.reduce((acc, b) => acc + b.views, 0)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Insight Journal article visits</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart section */}
              {chartData.length > 0 && (
                <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-[2.5rem] bg-background">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-amber-500" /> Top Content Engagement
                    </CardTitle>
                    <CardDescription>Visual comparison of views vs unique visitors across popular endpoints</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'black',
                            color: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }} />
                        <Bar name="Views Count" dataKey="views" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                        <Bar name="Unique Visitors" dataKey="visitors" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Data Table */}
              <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-[2.5rem] bg-background">
                <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent border-b">
                  <CardTitle className="font-headline text-lg">Detailed Traffic Matrix</CardTitle>
                  <CardDescription>Live telemetry tracking details compiled from database logs</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {traffic.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl font-medium">
                      No traffic logs registered yet. Visit any blog or course details page to record views.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-muted text-muted-foreground uppercase tracking-wider font-bold">
                            <th className="pb-3">Content Node</th>
                            <th className="pb-3">Category</th>
                            <th className="pb-3">Endpoint URL</th>
                            <th className="pb-3 text-center">Views</th>
                            <th className="pb-3 text-center">Visitors</th>
                            <th className="pb-3 text-right">Last Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {traffic.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="py-4 font-bold max-w-xs truncate">{item.name}</td>
                              <td className="py-4">
                                <Badge className={
                                  item.type === 'course' 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-none rounded-xl' 
                                    : 'bg-violet-500/10 text-violet-500 border-none rounded-xl'
                                }>
                                  {item.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="py-4 font-mono text-muted-foreground">{item.route}</td>
                              <td className="py-4 text-center font-black text-amber-600 dark:text-amber-500">{item.views}</td>
                              <td className="py-4 text-center font-bold text-sky-500">{item.visitors}</td>
                              <td className="py-4 text-right text-muted-foreground font-medium">
                                {new Date(item.lastActive).toLocaleDateString()} {new Date(item.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
