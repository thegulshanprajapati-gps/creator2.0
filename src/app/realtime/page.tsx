'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Cpu, HardDrive, ShieldCheck, Wifi } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function RealtimeLoadPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/dashboard/realtime');
        const json = await res.json();
        setTelemetry(json.telemetry);
        
        // Keep last 10 records for history chart
        setHistory(prev => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sessions: json.telemetry.activeSessions,
            cpu: parseInt(json.telemetry.cpuUsage)
          }];
          if (next.length > 10) next.shift();
          return next;
        });
        
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Realtime Load Telemetry</h1>
            <p className="text-xs text-muted-foreground font-medium">Live processing logs and system heat indexes</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-primary/10 shadow-md rounded-2xl bg-background/85">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CPU Temperature</CardTitle>
                    <Cpu className="h-5 w-5 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{telemetry?.cpuUsage}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Clock load index</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-md rounded-2xl bg-background/85">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">RAM Overhead</CardTitle>
                    <HardDrive className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{telemetry?.ramUsage}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Memory block occupancy</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-md rounded-2xl bg-background/85">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Sessions</CardTitle>
                    <Wifi className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{telemetry?.activeSessions}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Live web sockets</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-md rounded-2xl bg-background/85">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Request Rate</CardTitle>
                    <Activity className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{telemetry?.requestRate}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Throughput load factor</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-2xl border-primary/5 rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-xl">Active Socket Signals</CardTitle>
                    <CardDescription>Live concurrency updates mapped in 3s intervals</CardDescription>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase gap-1.5 flex items-center px-3">
                    <ShieldCheck className="h-3.5 w-3.5" /> SECURE CHANNEL
                  </Badge>
                </CardHeader>
                <CardContent className="h-[300px] p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
