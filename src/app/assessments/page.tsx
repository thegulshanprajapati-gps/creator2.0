'use client';

import { useEffect, useMemo, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { FolderManager } from '@/components/admin/folder-manager';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, ClipboardList, BarChart3 } from 'lucide-react';

type AssessmentFolder = {
  id: string;
  title: string;
  description: string | null;
  is_paid?: boolean;
};

export default function AssessmentsPage() {
  const [folders, setFolders] = useState<AssessmentFolder[]>([]);
  const [assets, setAssets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssessmentSummary();
  }, []);

  const loadAssessmentSummary = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: folderData, error: folderError } = await db
        .from('course_folders')
        .select('*')
        .eq('course_id', 'assessments')
        .order('sort_order', { ascending: true });

      if (folderError) {
        throw new Error(folderError.message);
      }

      const folderIds = (folderData || []).map((folder: any) => folder.id);
      const { data: contentData, error: contentError } = await db
        .from('course_contents')
        .select('*')
        .in('folder_id', folderIds.length ? folderIds : ['']);

      if (contentError) {
        throw new Error(contentError.message);
      }

      setFolders((folderData || []) as AssessmentFolder[]);
      setAssets((contentData || []).length);
    } catch (err: any) {
      setError(err?.message || 'Unable to load assessment summary.');
      setFolders([]);
      setAssets(0);
    } finally {
      setLoading(false);
    }
  };

  const assessmentCount = folders.length;
  const premiumAssessments = useMemo(() => folders.filter((folder) => folder.is_paid).length, [folders]);
  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    const query = search.toLowerCase();
    return folders.filter((folder) =>
      folder.title.toLowerCase().includes(query) ||
      folder.description?.toLowerCase().includes(query)
    );
  }, [folders, search]);

  const activeFolders = filteredFolders.slice(0, 4);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Assessments</h1>
            <p className="text-xs text-muted-foreground">Manage exams, knowledge checks, and evaluation content in a secure, enterprise dashboard.</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_0.6fr]">
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-[2rem] border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Assessments</CardTitle>
                    <CardDescription>Organized test collections and evaluation workflows.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-4xl font-bold text-foreground">{assessmentCount}</CardContent>
                </Card>
                <Card className="rounded-[2rem] border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Assessment Assets</CardTitle>
                    <CardDescription>Files and resources attached to assessments.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-4xl font-bold text-foreground">{assets}</CardContent>
                </Card>
                <Card className="rounded-[2rem] border border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Secure Tracks</CardTitle>
                    <CardDescription>Evaluations flagged for premium delivery.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-4xl font-bold text-foreground">{premiumAssessments}</CardContent>
                </Card>
              </div>

              <Card className="rounded-[2rem] border border-border shadow-sm overflow-hidden">
                <CardHeader className="p-6 bg-primary/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Assessment Intelligence</CardTitle>
                      <CardDescription>Search and track review-ready assessment assets.</CardDescription>
                    </div>
                    <Button variant="secondary" onClick={loadAssessmentSummary} disabled={loading}>
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-[1fr_180px] items-end">
                    <div className="space-y-2">
                      <label htmlFor="assessment-search" className="text-sm font-semibold">Search assessments</label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="assessment-search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Type an assessment name or summary"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="block text-sm font-semibold text-muted-foreground">Review state</span>
                      <Badge className="rounded-full bg-primary/10 text-primary border-none">{filteredFolders.length} matching assessments</Badge>
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="grid gap-4">
                    {activeFolders.length > 0 ? (
                      activeFolders.map((folder) => (
                        <div key={folder.id} className="rounded-3xl border border-border p-4 bg-background shadow-sm">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold">{folder.title}</p>
                              <p className="text-sm text-muted-foreground">{folder.description || 'No assessment summary available.'}</p>
                            </div>
                            <Badge variant={folder.is_paid ? 'destructive' : 'secondary'}>{folder.is_paid ? 'Premium' : 'Core'}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
                        No assessment modules match your search.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-[2rem] border border-border shadow-sm overflow-hidden">
                <CardHeader className="p-6 bg-secondary/5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-3xl bg-secondary/10 p-3 text-secondary"><ShieldCheck className="h-5 w-5" /></span>
                    <div>
                      <CardTitle className="text-lg">Secure Assessment Operations</CardTitle>
                      <CardDescription>Deliver evaluative content with visibility controls and folder governance.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="rounded-3xl bg-background p-5 border border-border">
                    <p className="font-semibold">Recommended workflow</p>
                    <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                      <li>• Create assessment folders and assign review status.</li>
                      <li>• Upload secure exam assets alongside quizzes and answer keys.</li>
                      <li>• Toggle premium access for certification tracks.</li>
                      <li>• Use folder manager to keep assessments deeply organized.</li>
                    </ul>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-3xl border border-border bg-muted/10 p-4">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Assessment Builder</p>
                        <p className="text-sm text-muted-foreground">Rapidly assemble test materials into reusable folders.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-3xl border border-border bg-muted/10 p-4">
                      <BarChart3 className="h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm font-semibold">Performance insights</p>
                        <p className="text-sm text-muted-foreground">Capture review-ready items and support analytics workflows.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Assessment Library</h2>
                <p className="text-sm text-muted-foreground">Use the enterprise folder manager to build exam suites and manage assessment assets.</p>
              </div>
              <Button onClick={loadAssessmentSummary} disabled={loading}>
                {loading ? 'Refreshing…' : 'Sync assessment summary'}
              </Button>
            </div>

            <div className="mt-8">
              <FolderManager
                courseId="assessments"
                title="Assessment Library"
                description="Organize exams, test assets, and secure assessment materials with folder-level visibility." 
              />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
