'use client';

import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash2, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';

type UpdateItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  status: 'draft' | 'published';
  author: string;
  date: string;
  document_link?: string;
  read_more_link?: string;
  is_urgent?: boolean;
  extra_info?: string;
};

export default function PlatformUpdatesAdminPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UpdateItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formTags, setFormTags] = useState('Platform');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('published');
  const [formAuthor, setFormAuthor] = useState('Admin');
  const [formDocumentLink, setFormDocumentLink] = useState('');
  const [formReadMoreLink, setFormReadMoreLink] = useState('');
  const [formIsUrgent, setFormIsUrgent] = useState(false);
  const [formExtraInfo, setFormExtraInfo] = useState('');
  const [sendPush, setSendPush] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mongodb-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'find',
          collection: 'updates',
          filter: {}
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = Array.isArray(json?.data) ? json.data : [];
      const normalized = data.map((u: any) => ({
        id: u._id || u.id,
        title: u.title || '',
        slug: u.slug || '',
        excerpt: u.excerpt || '',
        tags: Array.isArray(u.tags) ? u.tags : [],
        status: u.status || 'published',
        author: u.author || 'Admin',
        date: u.created_at || u.updated_at || new Date().toISOString(),
        document_link: u.document_link || '',
        read_more_link: u.read_more_link || '',
        is_urgent: !!u.is_urgent,
        extra_info: u.extra_info || '',
      }));
      setItems(normalized);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormTags('Platform');
    setFormStatus('published');
    setFormAuthor('Admin');
    setFormDocumentLink('');
    setFormReadMoreLink('');
    setFormIsUrgent(false);
    setFormExtraInfo('');
    setSendPush(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: UpdateItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormExcerpt(item.excerpt);
    setFormTags(item.tags[0] || 'Platform');
    setFormStatus(item.status);
    setFormAuthor(item.author);
    setFormDocumentLink(item.document_link || '');
    setFormReadMoreLink(item.read_more_link || '');
    setFormIsUrgent(!!item.is_urgent);
    setFormExtraInfo(item.extra_info || '');
    setSendPush(false);
    setIsModalOpen(true);
  };

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
    if (!editingItem) {
      setFormSlug(generateSlug(val));
    }
  };

  const handleDelete = async (item: UpdateItem) => {
    const isConfirmed = await confirm({
      title: 'Delete Update',
      message: `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!isConfirmed) return;

    try {
      let csrfToken = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.trim().startsWith('xmarty_csrf='))?.split('=')[1] : null;
      if (!csrfToken) {
        try {
          const csrfRes = await fetch('/api/auth/csrf');
          const csrfJson = await csrfRes.json();
          csrfToken = csrfJson.csrfToken;
        } catch (e) {
          console.error('Failed to initialize CSRF token:', e);
        }
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch('/api/mongodb-gateway', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'deleteOne',
          collection: 'updates',
          filter: { slug: item.slug }
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      setItems(prev => prev.filter(i => i.slug !== item.slug));
      toast({ title: 'Success', description: 'Update deleted successfully!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: err.message });
    }
  };

  // Right-click action listeners for updates list
  useEffect(() => {
    const handleEditEvent = (e: any) => {
      const { id } = e.detail;
      const matched = items.find(i => i.id === id);
      if (matched) handleEdit(matched);
    };
    const handleDeleteEvent = (e: any) => {
      const { id } = e.detail;
      const matched = items.find(i => i.id === id);
      if (matched) handleDelete(matched);
    };

    window.addEventListener('update-edit-item', handleEditEvent);
    window.addEventListener('update-delete-item', handleDeleteEvent);
    return () => {
      window.removeEventListener('update-edit-item', handleEditEvent);
      window.removeEventListener('update-delete-item', handleDeleteEvent);
    };
  }, [items]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSlug) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Title and Slug are required.' });
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        slug: formSlug,
        excerpt: formExcerpt,
        tags: [formTags],
        status: formStatus,
        author: formAuthor,
        document_link: formDocumentLink,
        read_more_link: formReadMoreLink,
        is_urgent: formIsUrgent,
        extra_info: formExtraInfo,
        updated_at: new Date().toISOString(),
        created_at: editingItem ? editingItem.date : new Date().toISOString()
      };

      let csrfToken = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.trim().startsWith('xmarty_csrf='))?.split('=')[1] : null;
      if (!csrfToken) {
        try {
          const csrfRes = await fetch('/api/auth/csrf');
          const csrfJson = await csrfRes.json();
          csrfToken = csrfJson.csrfToken;
        } catch (e) {
          console.error('Failed to initialize CSRF token:', e);
        }
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      const res = await fetch('/api/mongodb-gateway', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'upsert',
          collection: 'updates',
          filter: { slug: formSlug },
          data: payload
        })
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Trigger push notification if requested and status is published
      if (sendPush && formStatus === 'published') {
        try {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formTitle,
              body: formExcerpt || 'A new update is available on XmartyCreator.',
              url: '/updates'
            })
          });
        } catch (pushErr) {
          console.error('Failed to broadcast push notification:', pushErr);
        }
      }

      toast({ title: 'Success', description: editingItem ? 'Update updated successfully!' : 'Update created successfully!' });
      setIsModalOpen(false);
      fetchUpdates();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i => 
    i.title.toLowerCase().includes(query.toLowerCase()) || 
    i.excerpt.toLowerCase().includes(query.toLowerCase()) || 
    i.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="font-headline font-bold text-xl text-slate-900 dark:text-white">Updates Manager</h1>
              <p className="text-xs text-muted-foreground">Manage public notices, releases, and announcements.</p>
            </div>
          </div>
          <Button onClick={handleCreateNew} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Create Update
          </Button>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          )}

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
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle>{editingItem ? 'Edit Update' : 'Create New Update'}</CardTitle>
                    <CardDescription>Fill out the fields to publish a platform notice or announcement.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Title</label>
                        <Input
                          value={formTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="E.g. XmartyCreator V2.4 Launch"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Slug</label>
                        <Input
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="e.g. xmartycreator-v24-launch"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Excerpt / Short Description</label>
                        <Textarea
                          value={formExcerpt}
                          onChange={(e) => setFormExcerpt(e.target.value)}
                          placeholder="Provide a short excerpt explaining what this update contains."
                          className="h-20"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Tag / Category</label>
                          <Select value={formTags} onValueChange={(val: any) => setFormTags(val)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Exam">Exam</SelectItem>
                              <SelectItem value="Result">Result</SelectItem>
                              <SelectItem value="Datesheet">Datesheet</SelectItem>
                              <SelectItem value="Syllabus">Syllabus</SelectItem>
                              <SelectItem value="Notice">Notice</SelectItem>
                              <SelectItem value="Admission">Admission</SelectItem>
                              <SelectItem value="Scholarship">Scholarship</SelectItem>
                              <SelectItem value="Event">Event</SelectItem>
                              <SelectItem value="Placement">Placement</SelectItem>
                              <SelectItem value="Platform">Platform</SelectItem>
                              <SelectItem value="Course">Course</SelectItem>
                              <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block ml-1">Author Name</label>
                          <Input
                            value={formAuthor}
                            onChange={(e) => setFormAuthor(e.target.value)}
                            placeholder="e.g. Admin"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Extra Info (Subheading/Dates)</label>
                        <Input
                          value={formExtraInfo}
                          onChange={(e) => setFormExtraInfo(e.target.value)}
                          placeholder="e.g. Practical: 10-12 Feb 2026 | Theory: 13-24 Feb 2026"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Document Link</label>
                        <Input
                          value={formDocumentLink}
                          onChange={(e) => setFormDocumentLink(e.target.value)}
                          placeholder="https://drive.google.com/..."
                        />
                        <p className="text-[10px] text-muted-foreground">Optional: Link to a document or resource</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Read More Link</label>
                        <Input
                          value={formReadMoreLink}
                          onChange={(e) => setFormReadMoreLink(e.target.value)}
                          placeholder="https://example.com/article"
                        />
                        <p className="text-[10px] text-muted-foreground">Optional: External link for more information</p>
                      </div>

                      <div className="flex items-center space-x-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/5">
                        <input
                          id="mark-as-urgent"
                          type="checkbox"
                          checked={formIsUrgent}
                          onChange={(e) => setFormIsUrgent(e.target.checked)}
                          className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="mark-as-urgent" className="text-sm font-semibold text-amber-800 dark:text-amber-200 cursor-pointer select-none">
                          Mark as Urgent ⚠️
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/5">
                        <input
                          id="send-push-notification"
                          type="checkbox"
                          checked={sendPush}
                          disabled={formStatus !== 'published'}
                          onChange={(e) => setSendPush(e.target.checked)}
                          className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                        />
                        <label htmlFor="send-push-notification" className="text-sm font-semibold text-amber-800 dark:text-amber-200 cursor-pointer select-none disabled:opacity-50">
                          Send Push Notification to Subscribers 🔔 {formStatus !== 'published' && '(Requires Status to be Published)'}
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                        <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft (Hidden from public)</SelectItem>
                            <SelectItem value="published">Published (Visible on main site)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6">
                          {saving ? 'Saving...' : 'Save Update'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar */}
          <div className="flex items-center gap-3 max-w-sm">
            <div className="relative w-full">
              <Input
                className="pl-10 h-10 rounded-xl bg-background border-slate-200 dark:border-slate-800"
                placeholder="Search updates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
            </div>
          </div>

          <Card className="border-amber-200/50 dark:border-amber-500/10">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">Loading updates feed...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No updates found. Create a new one!</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item) => (
                        <TableRow 
                          key={item.id}
                          data-id={item.id}
                          data-type="update"
                          data-name={item.title}
                          className="platform-update-row cursor-context-menu"
                        >
                          <TableCell className="font-bold max-w-xs truncate">{item.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.slug}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.status === 'published' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                <CheckCircle2 className="h-3 w-3" /> Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                                <FileText className="h-3 w-3" /> Draft
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">{item.author}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleEdit(item)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="destructive" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleDelete(item)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
