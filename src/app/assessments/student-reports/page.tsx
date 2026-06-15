'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Users, BarChart3, Download, Search, ChevronRight,
  TrendingUp, TrendingDown, Award, Clock, CheckCircle2,
  XCircle, Loader2, RefreshCw, BookOpen, FileText, Filter
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface StudentSubmission {
  id: string;
  student_name: string;
  student_email: string;
  test_id: string;
  test_title: string;
  score: number;
  total_marks: number;
  pass_marks: number;
  time_taken: number;
  submitted_at: string;
  status: 'passed' | 'failed';
  answers: any[];
}

interface TestSummary {
  test_id: string;
  test_title: string;
  total_attempts: number;
  pass_count: number;
  fail_count: number;
  avg_score: number;
  avg_percentage: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-headline font-bold">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = 'bg-indigo-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentReportsPage() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, testRes] = await Promise.all([
        db.from('test_submissions').select('*').order('submitted_at', { ascending: false }),
        db.from('tests').select('id, title').order('title'),
      ]);

      if (subRes.data) setSubmissions(subRes.data as StudentSubmission[]);
      if (testRes.data) setTests(testRes.data as { id: string; title: string }[]);
    } catch (e) {
      // graceful fail — table may not exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Filter ──
  const filtered = submissions.filter(s => {
    const matchTest = selectedTestId === 'all' || s.test_id === selectedTestId;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || s.student_name?.toLowerCase().includes(q) || s.student_email?.toLowerCase().includes(q);
    return matchTest && matchStatus && matchSearch;
  });

  // ── Stats ──
  const totalAttempts = filtered.length;
  const passCount = filtered.filter(s => s.status === 'passed').length;
  const failCount = filtered.filter(s => s.status === 'failed').length;
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;
  const avgScore = totalAttempts > 0
    ? Math.round(filtered.reduce((s, r) => s + (r.score / r.total_marks * 100), 0) / totalAttempts)
    : 0;

  // ── Test summaries ──
  const testSummaries: TestSummary[] = tests.map(t => {
    const subs = submissions.filter(s => s.test_id === t.id);
    const pass = subs.filter(s => s.status === 'passed').length;
    const avgPct = subs.length > 0
      ? Math.round(subs.reduce((acc, s) => acc + (s.score / s.total_marks * 100), 0) / subs.length)
      : 0;
    return {
      test_id: t.id,
      test_title: t.title,
      total_attempts: subs.length,
      pass_count: pass,
      fail_count: subs.length - pass,
      avg_score: 0,
      avg_percentage: avgPct,
    };
  }).filter(s => s.total_attempts > 0);

  // ── Export CSV ──
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Email', 'Test', 'Score', 'Total Marks', 'Percentage', 'Status', 'Time Taken (mins)', 'Submitted At'];
    const rows = filtered.map(s => [
      s.student_name || 'N/A',
      s.student_email || 'N/A',
      s.test_title || 'N/A',
      s.score,
      s.total_marks,
      `${Math.round((s.score / s.total_marks) * 100)}%`,
      s.status?.toUpperCase() || 'N/A',
      s.time_taken || 0,
      new Date(s.submitted_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report Exported', description: `${filtered.length} records exported as CSV.` });
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl">Student Reports</h1>
            <p className="text-xs text-muted-foreground">Analyze student performance, scores, and test completion data.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9 text-xs font-bold gap-1.5">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
            <Button size="sm" onClick={handleExportCSV} disabled={filtered.length === 0} className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8 space-y-6">

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Attempts" value={totalAttempts} color="bg-indigo-500/10 text-indigo-500" />
            <StatCard icon={CheckCircle2} label="Passed" value={passCount} sub={`${passRate}% pass rate`} color="bg-emerald-500/10 text-emerald-500" />
            <StatCard icon={XCircle} label="Failed" value={failCount} color="bg-rose-500/10 text-rose-500" />
            <StatCard icon={TrendingUp} label="Avg. Score" value={`${avgScore}%`} color="bg-amber-500/10 text-amber-500" />
          </div>

          {/* Test-wise Summary */}
          {testSummaries.length > 0 && (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <h2 className="font-bold text-sm">Test Overview</h2>
              </div>
              <div className="divide-y">
                {testSummaries.map(ts => (
                  <div key={ts.test_id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{ts.test_title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <ProgressBar
                          pct={ts.avg_percentage}
                          color={ts.avg_percentage >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      <div className="text-center">
                        <p className="font-bold">{ts.total_attempts}</p>
                        <p className="text-muted-foreground">attempts</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-500">{ts.pass_count}</p>
                        <p className="text-muted-foreground">passed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-rose-500">{ts.fail_count}</p>
                        <p className="text-muted-foreground">failed</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-bold ${ts.avg_percentage >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{ts.avg_percentage}%</p>
                        <p className="text-muted-foreground">avg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by student name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
            <Select value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger className="h-9 text-xs w-48">
                <SelectValue placeholder="Filter by test..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                {tests.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
              <SelectTrigger className="h-9 text-xs w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">✅ Passed</SelectItem>
                <SelectItem value="failed">❌ Failed</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedTestId !== 'all' || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSelectedTestId('all'); setStatusFilter('all'); }} className="h-9 text-xs font-bold">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Student Results Table */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <h2 className="font-bold text-sm">Student Results</h2>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">{filtered.length} records</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading reports...</span>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 p-6">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <Users className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">No student submissions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {submissions.length === 0
                      ? 'Students have not taken any tests yet. Make sure you publish a test first.'
                      : 'No results match your current filters.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-5 py-3 font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Test</th>
                      <th className="text-center px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Score</th>
                      <th className="text-center px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">%</th>
                      <th className="text-center px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                      <th className="text-left px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(s => {
                      const pct = Math.round((s.score / s.total_marks) * 100);
                      const passed = s.status === 'passed';
                      return (
                        <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-semibold">{s.student_name || 'Anonymous'}</p>
                            <p className="text-muted-foreground text-[10px]">{s.student_email || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium truncate max-w-[180px]">{s.test_title || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-bold">
                            {s.score} / {s.total_marks}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${pct >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{pct}%</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`text-[10px] px-2 py-0.5 border ${
                              passed
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}>
                              {passed ? '✅ PASS' : '❌ FAIL'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {s.time_taken ? `${s.time_taken}m` : '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {s.submitted_at
                              ? new Date(s.submitted_at).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
