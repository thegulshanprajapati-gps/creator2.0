'use client';

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowUpRight, TrendingUp, RefreshCw, Layers, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPaymentsPage() {
  const [stats, setStats] = useState<any>({
    mrr: 15400,
    arr: 184800,
    totalRev: 245900,
    pending: 1200,
    failed: 450,
    refunds: 800
  });
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentLogs = async () => {
    try {
      const res = await fetch('/api/admin/payments-data');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentLogs();
  }, []);

  const chartData = [
    { name: "Jan", Revenue: 12000 },
    { name: "Feb", Revenue: 19000 },
    { name: "Mar", Revenue: 32000 },
    { name: "Apr", Revenue: 45000 },
    { name: "May", Revenue: 61000 },
    { name: "Jun", Revenue: 78000 }
  ];

  return (
    <div className="p-6 space-y-8 bg-[#FAFCFF] dark:bg-[#030712] min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">Payments & Revenue Console</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Global SaaS MRR/ARR analytics and transactions verification</p>
        </div>
        <Button onClick={fetchPaymentLogs} size="sm" variant="outline" className="gap-1 rounded-xl">
          <RefreshCw className="h-3.5 w-3.5" /> Reload logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[24px] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-450 uppercase tracking-widest">Monthly Recurring Revenue (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.mrr} INR</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% growth this month
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-455 uppercase tracking-widest">Annual Recurring Revenue (ARR)</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.arr} INR</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Projected yearly contract values</p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-slate-200/80 dark:border-white/5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-450 uppercase tracking-widest">Lifetime Total Revenue</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalRev} INR</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Net captured funds across all channels</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 rounded-[24px] border border-slate-200/80 dark:border-white/5 p-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-450 mb-4">Monthly Growth Curve</CardTitle>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-white/5" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dynamic status list */}
        <Card className="rounded-[24px] border border-slate-200/80 dark:border-white/5 p-6 space-y-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-450">Capture Gateway Stats</CardTitle>
          <div className="space-y-4 pt-2">
            {[
              { label: "Pending Payments", value: stats.pending, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Failed Capture Errors", value: stats.failed, color: "text-red-500", bg: "bg-red-500/10" },
              { label: "Refund Requests Approval", value: stats.refunds, color: "text-indigo-500", bg: "bg-indigo-500/10" }
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${stat.color} ${stat.bg}`}>{stat.value} INR</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Logs Table */}
      <div className="p-6 rounded-[24px] bg-white dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-450 flex items-center gap-2">
          Recent Transaction Audit Logs
        </h3>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">No transactions captured yet.</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs font-medium border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 text-slate-450 uppercase tracking-wider text-[9px] font-black">
                  <th className="py-3 px-2">Order No</th>
                  <th className="py-3 px-2">User ID</th>
                  <th className="py-3 px-2">Gateway</th>
                  <th className="py-3 px-2">Total Amount</th>
                  <th className="py-3 px-2">Payment Status</th>
                  <th className="py-3 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {orders.map((o) => (
                  <tr key={o._id || o.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <td className="py-3.5 px-2 font-bold">{o.orderNumber}</td>
                    <td className="py-3.5 px-2 font-mono text-[10px] text-slate-450">{o.studentId}</td>
                    <td className="py-3.5 px-2 font-semibold">{o.gateway || "Razorpay"}</td>
                    <td className="py-3.5 px-2 font-bold">{o.total} INR</td>
                    <td className="py-3.5 px-2">
                      <Badge className={o.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-2 text-slate-400">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
