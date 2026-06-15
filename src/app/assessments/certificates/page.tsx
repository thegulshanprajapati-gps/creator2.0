'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Award, Search, Loader2, RefreshCw, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Certificate {
  id: string;
  certificateId: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  generatedAt: string;
  type?: 'completion' | 'participation';
  verificationUrl: string;
}

export default function CertificatesPanel() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await db.from('certificates').select('*').order('generatedAt', { ascending: false });
      if (res.data) {
        setCertificates(res.data as Certificate[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateType = async (certId: string, newType: 'completion' | 'participation') => {
    try {
      const res = await fetch('/api/certificates/update-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: certId, type: newType })
      });

      if (res.ok) {
        toast({ title: "Type Updated", description: `Certificate is now a Certificate of ${newType === 'participation' ? 'Participation' : 'Completion'}.` });
        setCertificates(prev => prev.map(c => c.id === certId || c.certificateId === certId ? { ...c, type: newType } : c));
      } else {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    }
  };

  const filtered = certificates.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      c.studentName?.toLowerCase().includes(q) || 
      c.examTitle?.toLowerCase().includes(q) || 
      c.certificateId?.toLowerCase().includes(q);
    
    const actualType = c.type || 'completion';
    const matchesType = typeFilter === 'all' || actualType === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl">Allotted Certificates</h1>
            <p className="text-xs text-muted-foreground">Manage and allot Completion vs Participation certificates for students.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9 text-xs font-bold gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8 space-y-6">
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by student, assessment, or certificate ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs w-56">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certificate Types</SelectItem>
                <SelectItem value="completion">Completion Certificate</SelectItem>
                <SelectItem value="participation">Participation Certificate</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || typeFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setTypeFilter('all'); }} className="h-9 text-xs font-bold">
                Clear Filters
              </Button>
            )}
          </div>

          {/* List Card Table */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-500" />
                <h2 className="font-bold text-sm">Issued Student Credentials</h2>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">{filtered.length} credentials</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading credentials list...</span>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 p-6">
                <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <Award className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">No credentials allotted yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Once students complete assessments with passing grades, certificates appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground">
                      <th className="px-5 py-3 font-bold uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Assessment</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Certificate ID</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Type Selector</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Date Issued</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(c => {
                      const currentType = c.type || 'completion';
                      return (
                        <tr key={c.id || c.certificateId} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-900 dark:text-white">{c.studentName || 'Student'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold truncate max-w-[200px]">{c.examTitle || '—'}</p>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-500">
                            {c.certificateId}
                          </td>
                          <td className="px-4 py-3">
                            <Select 
                              value={currentType} 
                              onValueChange={(val: any) => handleUpdateType(c.id || c.certificateId, val)}
                            >
                              <SelectTrigger className="h-8 text-xs w-48 font-bold border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completion">🎓 Certificate of Completion</SelectItem>
                                <SelectItem value="participation">🤝 Certificate of Participation</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {new Date(c.generatedAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <a 
                              href={`${process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'}/verify-certificate/${c.certificateId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-7 text-xs font-bold gap-1 text-indigo-500 hover:bg-indigo-500/10">
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
