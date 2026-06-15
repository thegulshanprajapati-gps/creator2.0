'use client';

import { useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, Eye, Edit2, Layout, Trash2, Plus, X, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface PageRecord {
  id: string;
  title: string;
  description: string;
  status: string;
}

const DEFAULT_PAGES: PageRecord[] = [
  { id: 'home', title: 'Homepage', description: 'Hero, Features, Testimonials, CTA', status: 'Published' },
  { id: 'about', title: 'About Us', description: 'Mission, Vision, Story, Team', status: 'Published' },
  { id: 'courses', title: 'Curriculum Catalog', description: 'Course categories, lessons, and enrollment', status: 'Published' },
  { id: 'community', title: 'Hub Interactions', description: 'Channels, conversations, and member activity', status: 'Published' },
  { id: 'blog', title: 'Insight Journal', description: 'Articles, news, and expert insights', status: 'Published' },
  { id: 'updates', title: 'Platform Updates', description: 'Announcements, release notes, and changelog', status: 'Published' },
  { id: 'faq', title: 'FAQ', description: 'Learner questions, product support, and help topics', status: 'Published' },
  { id: 'contact', title: 'Contact', description: 'Customer contact form and inquiry submission', status: 'Published' },
  { id: 'privacy', title: 'Privacy Policy', description: 'Data handling and privacy commitment', status: 'Published' },
  { id: 'terms', title: 'Terms & Conditions', description: 'Usage terms, policies, and legal coverage', status: 'Published' },
  { id: 'refund', title: 'Refund Policy', description: 'Payment support and refund process details', status: 'Published' },
];

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'production';
const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || '';
const getPageUrl = (pageId: string) => pageId === 'home' ? mainSiteUrl || '/' : `${mainSiteUrl}/${pageId}`;

export default function PagesManagement() {
  const confirm = useConfirm();
  const [pages, setPages] = useState<PageRecord[]>(DEFAULT_PAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("Published");
  const [saving, setSaving] = useState(false);

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/cms/pages');
      if (!res.ok) {
        throw new Error(`Failed to load pages: ${res.status}`);
      }
      const json = await res.json();
      const data = json?.data || [];
      if (!data || data.length === 0) {
        setPages(DEFAULT_PAGES);
      } else {
        const normalized = data.map((p: any) => ({
          id: p.slug || p.id,
          title: p.title,
          description: p.description || '',
          status: p.status && p.status[0]?.toUpperCase() + p.status.slice(1) || 'Published',
        }));
        setPages(normalized as PageRecord[]);
      }
    } catch (err: any) {
      setError(err.message || String(err));
      setPages(DEFAULT_PAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    setFormSlug(generateSlug(val));
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSlug) {
      toast({ variant: "destructive", title: "Validation Error", description: "Title and Slug are required." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          slug: formSlug,
          description: formDescription,
          status: formStatus.toLowerCase(),
          content: { blocks: [] }
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: "Success", description: "Page created successfully!" });
      setIsModalOpen(false);
      setFormTitle("");
      setFormSlug("");
      setFormDescription("");
      setFormStatus("Published");
      loadPages();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Create failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (page: PageRecord) => {
    const isConfirmed = await confirm({
      title: "Delete Page",
      message: `Are you sure you want to delete "${page.title}"? This will delete all of its custom blocks permanently.`,
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/cms/pages?slug=${page.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: "Success", description: "Page deleted successfully!" });
      loadPages();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete failed", description: err.message });
    }
  };

  // Right-click action listeners
  useEffect(() => {
    const handleDeleteEvent = (e: any) => {
      const { id } = e.detail;
      const matched = pages.find(p => p.id === id);
      if (matched) handleDeletePage(matched);
    };
    const handleEditEvent = (e: any) => {
      const { id } = e.detail;
      window.location.href = `/pages/${id}`;
    };
    const handleOpenLiveEvent = (e: any) => {
      const { id } = e.detail;
      const url = getPageUrl(id);
      window.open(url, '_blank');
    };

    window.addEventListener('page-delete-item', handleDeleteEvent);
    window.addEventListener('page-edit-cms', handleEditEvent);
    window.addEventListener('page-open-live', handleOpenLiveEvent);
    window.addEventListener('page-refresh', loadPages);
    return () => {
      window.removeEventListener('page-delete-item', handleDeleteEvent);
      window.removeEventListener('page-edit-cms', handleEditEvent);
      window.removeEventListener('page-open-live', handleOpenLiveEvent);
      window.removeEventListener('page-refresh', loadPages);
    };
  }, [pages, loadPages]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <h1 className="font-headline font-bold text-xl">Content Orchestration</h1>
        </header>

        <main className="p-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold">Manage Pages</h2>
              <p className="text-muted-foreground">Modify page content and keep your site editable across all page routes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-sm">Env: {environment.toUpperCase()}</Badge>
              <Badge variant="outline" className="text-sm">Total pages: {pages.length}</Badge>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Page
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="w-full border-amber-200 dark:border-amber-900/60 shadow-lg">
                  <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Create New CMS Page</CardTitle>
                      <CardDescription>Configure a custom route and description for the new page.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleCreatePage} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Page Title</label>
                        <Input
                          value={formTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="e.g. Careers"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Route / Slug</label>
                        <Input
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="e.g. careers"
                          required
                        />
                        <p className="text-[10px] text-muted-foreground ml-1">This defines the route slug: /careers</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</label>
                        <Textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Provide a short description of the page's contents."
                          className="h-20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                        <Select value={formStatus} onValueChange={(val: string) => setFormStatus(val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft (Hidden from visitors)</SelectItem>
                            <SelectItem value="Published">Published (Visible on site)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6">
                          {saving ? 'Creating...' : 'Create Page'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500 animate-pulse">Loading pages orchestration...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pages.map((page) => (
                <Card 
                  key={page.id} 
                  data-id={page.id}
                  data-type="page"
                  data-name={page.title}
                  data-url={getPageUrl(page.id)}
                  className="cms-page-card group hover:border-amber-500/50 transition-all shadow-sm border-amber-200/50 dark:border-amber-500/10 cursor-context-menu"
                >
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/5 flex items-center justify-center text-amber-500">
                          <Globe className="h-4 w-4" />
                        </div>
                        <CardTitle className="font-headline text-xl">{page.title}</CardTitle>
                      </div>
                      <CardDescription>{page.description}</CardDescription>
                    </div>
                    <Badge variant={page.status === 'Published' ? 'default' : 'outline'} className={page.status === 'Published' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20' : ''}>
                      {page.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl" asChild>
                        <Link href={getPageUrl(page.id)} target="_blank">
                          <Eye className="mr-2 h-3 w-3" /> View Live
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl" asChild>
                        <Link href={`/pages/${page.id}`}>
                          <Edit2 className="mr-2 h-3 w-3" /> Edit CMS
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeletePage(page)}
                        className="text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
