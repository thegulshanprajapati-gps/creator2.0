'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Shield, Zap, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/realtime');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = data?.dbStats ? Object.entries(data.dbStats).map(([key, val]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    documents: val
  })) : [];

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Database Analytics</h1>
            <p className="text-xs text-muted-foreground font-medium">Real-time collections distribution & performance</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/10 shadow-lg rounded-2xl bg-background/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Collections</CardTitle>
                    <Database className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{chartData.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Configured MongoDB pools</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-lg rounded-2xl bg-background/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Documents</CardTitle>
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {chartData.reduce((acc, curr) => acc + (curr.documents as number), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Stored content components</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/10 shadow-lg rounded-2xl bg-background/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">System Engine</CardTitle>
                    <Zap className="h-5 w-5 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none shadow-sm rounded-xl font-bold">
                      NOMINAL
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">MongoDB Driver v7.2 Active</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-2xl border-primary/5 rounded-[2rem] overflow-hidden bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Collection Volumes</CardTitle>
                  <CardDescription>Document density across main MongoDB target entities</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="documents" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
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
