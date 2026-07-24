'use client';

import { useState, useEffect } from 'react';
import { ExplorerItem } from '@/components/admin/windows-explorer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { ImagePicker } from '@/components/admin/image-picker';
import {
  X, Save, Globe, Sparkles, Check, BookOpen, Tag, Clock, Users, DollarSign,
  Link as LinkIcon, Eye, FileText, Image as ImageIcon, LayoutDashboard,
  Loader2, Plus, Trash2, GripVertical, Package, ChevronDown, ChevronUp,
  FolderPlus, Edit3, RotateCcw
} from 'lucide-react';
import { db } from '@/lib/db';

// ── Types ──────────────────────────────────────────────────────────────
interface Module {
  id: string;
  title: string;
  description: string;
  isPaid: boolean;
  isNew?: boolean;
  isEditing?: boolean;
}

type Tab = 'details' | 'content' | 'seo' | 'modules';

// ── Main Component ──────────────────────────────────────────────────────
export function AdvancedCourseEditor({
  course,
  onClose,
  onSaved,
}: {
  course: ExplorerItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<Tab>('details');
  const [saving, setSaving] = useState(false);

  // ── Details Fields ──
  const [title, setTitle] = useState(course.name || '');
  const [description, setDescription] = useState(course.description || '');
  const [instructor, setInstructor] = useState(course.instructor || '');
  const [duration, setDuration] = useState(course.duration || '');
  const [students, setStudents] = useState(course.students || '');
  const [price, setPrice] = useState(course.price || '');
  const [category, setCategory] = useState(course.category || 'Programming');
  const [level, setLevel] = useState(course.level || 'Beginner');
  const [visibility, setVisibility] = useState(course.visibility || 'Private');
  const [slug, setSlug] = useState(course.slug || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl || '');
  const [uploading, setUploading] = useState(false);

  // ── Content & SEO Fields ──
  const [bodyContent, setBodyContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [focusKeyphrase, setFocusKeyphrase] = useState('');

  // ── Modules ──
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newModulePaid, setNewModulePaid] = useState(false);
  const [addingModule, setAddingModule] = useState(false);

  // ── Load existing data ──
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await db.from('course_folders').select('*').eq('id', course.id).single();
        if (data) {
          setTitle(data.title || data.name || '');
          setDescription(data.description || '');
          setInstructor(data.instructor || '');
          setDuration(data.duration || '');
          setStudents(data.students || '');
          setPrice(data.price || '');
          setCategory(data.category || 'Programming');
          setLevel(data.level || 'Beginner');
          setVisibility(data.visibility || 'Private');
          setSlug(data.slug || '');
          setThumbnailUrl(data.thumbnail_url || '');
          
          setBodyContent(data.body_content || '');
          setMetaTitle(data.meta_title || '');
          setMetaDescription(data.meta_description || '');
          setKeywords(data.keywords || '');
          setFocusKeyphrase(data.focus_keyphrase || '');
        }
      } catch {}
    };
    load();
  }, [course.id]);

  // ── Load modules (subfolders) ──
  useEffect(() => {
    const loadModules = async () => {
      setLoadingModules(true);
      try {
        const { data } = await db.from('course_folders').select('*').eq('parent_folder_id', course.id);
        if (Array.isArray(data)) {
          setModules(data.map((f: any) => ({
            id: f.id || f._id?.toString() || '',
            title: f.title || f.name || '',
            description: f.description || '',
            isPaid: !!f.is_paid,
          })));
        }
      } catch {} finally {
        setLoadingModules(false);
      }
    };
    loadModules();
  }, [course.id]);

  // ── Save all ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const finalSlug = slug.trim()
        ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      await db.from('course_folders').update({
        title, description, instructor, duration, students, price,
        category, level, visibility, slug: finalSlug,
        thumbnail_url: thumbnailUrl,
        body_content: bodyContent,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords, focus_keyphrase: focusKeyphrase,
      }).eq('id', course.id);

      toast({ title: 'Course Saved ✅', description: 'All course details updated successfully.' });
      onSaved();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Add new module (subfolder) ──
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      toast({ variant: 'destructive', title: 'Module title required' });
      return;
    }
    setAddingModule(true);
    try {
      const moduleSlug = newModuleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const { data, error } = await db.from('course_folders').insert({
        title: newModuleTitle.trim(),
        name: newModuleTitle.trim(),
        description: newModuleDesc.trim(),
        parent_folder_id: course.id,
        is_paid: newModulePaid,
        slug: moduleSlug,
        visibility: 'Public',
      });
      if (error) throw new Error(error.message);
      const newMod: Module = {
        id: (data as any)?.id || String(Date.now()),
        title: newModuleTitle.trim(),
        description: newModuleDesc.trim(),
        isPaid: newModulePaid,
      };
      setModules(prev => [...prev, newMod]);
      setNewModuleTitle('');
      setNewModuleDesc('');
      setNewModulePaid(false);
      toast({ title: 'Module Added', description: `"${newMod.title}" added to course.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to add module', description: err.message });
    } finally {
      setAddingModule(false);
    }
  };

  // ── Delete module ──
  const handleDeleteModule = async (mod: Module) => {
    if (!confirm(`Delete module "${mod.title}"? This cannot be undone.`)) return;
    try {
      await db.from('course_folders').delete().eq('id', mod.id);
      setModules(prev => prev.filter(m => m.id !== mod.id));
      toast({ title: 'Module Deleted', description: `"${mod.title}" removed.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: err.message });
    }
  };

  // ── Thumbnail upload ──
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch('/api/cloudinary-upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setThumbnailUrl(data.secure_url || data.url || '');
      toast({ title: 'Thumbnail Uploaded' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // ── SEO auto-generate ──
  const handleAutoSEO = () => {
    if (!title) return toast({ variant: 'destructive', title: 'Enter course title first' });
    setMetaTitle(title.slice(0, 60));
    setMetaDescription((description || '').slice(0, 155) + ((description?.length || 0) > 155 ? '...' : ''));
    toast({ title: 'SEO Auto-Generated' });
  };

  // ── SEO analysis ──
  const isTitleIdeal = metaTitle.length >= 40 && metaTitle.length <= 60;
  const isDescIdeal = metaDescription.length >= 120 && metaDescription.length <= 160;
  const hasKeyphrase = !!focusKeyphrase.trim();
  const keyphraseInTitle = hasKeyphrase && title.toLowerCase().includes(focusKeyphrase.toLowerCase());
  const keyphraseInDesc = hasKeyphrase && metaDescription.toLowerCase().includes(focusKeyphrase.toLowerCase());

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'details', label: 'Details', icon: LayoutDashboard },
    { id: 'modules', label: `Modules (${modules.length})`, icon: Package },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'seo', label: 'SEO', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gradient-to-r from-violet-500/10 via-transparent to-transparent shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h2 className="font-headline font-bold text-sm truncate max-w-[220px] flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 shrink-0">Advance Edit</span>
              {course.name}
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold">Full course page editor · modules · SEO</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {slug && (
            <a href={`/courses/${slug}`} target="_blank" rel="noreferrer"
              className="h-7 px-2.5 rounded-lg border border-primary/20 text-[10px] font-bold text-primary flex items-center gap-1 hover:bg-primary/10 transition-colors">
              <Eye className="h-3 w-3" /> Preview
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-[11px] font-bold">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
            className="h-7 text-[11px] font-bold bg-violet-600 hover:bg-violet-700 text-white px-3">
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            {saving ? 'Saving…' : 'Publish Changes'}
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-0.5 px-4 pt-2.5 border-b shrink-0 bg-background overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-t-lg border-b-2 whitespace-nowrap transition-all -mb-px ${
                active
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="h-3.5 w-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">

        {/* ══ DETAILS TAB ══ */}
        {tab === 'details' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Course Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Python Mastery Course" className="h-9 font-semibold" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><LinkIcon className="h-3 w-3" /> URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">/courses/</span>
                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="python-mastery-course" className="h-9 font-mono text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3" /> Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Programming','Architecture','Backend','Frontend','Placement Prep','General'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Beginner','Intermediate','Advanced'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" /> Instructor</Label>
                <Input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="e.g. Dr. Rahul" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> Duration</Label>
                <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 12 Hours" className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Student Count</Label>
                <Input value={students} onChange={e => setStudents(e.target.value)} placeholder="e.g. 1.2k" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Price (INR)</Label>
                <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 9900 or 0" className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Eye className="h-3 w-3" /> Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">🌍 Public — Visible on Course Library</SelectItem>
                  <SelectItem value="Private">🔒 Private — Hidden from course list</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Short Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief course summary for hero section..." className="resize-none text-sm min-h-[80px]" />
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ImageIcon className="h-3 w-3" /> Thumbnail</Label>
              <div className="flex gap-3 items-start">
                {thumbnailUrl && (
                  <div className="h-16 w-24 rounded-lg border overflow-hidden shrink-0">
                    <img src={thumbnailUrl} alt="thumb" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="Thumbnail URL..." className="h-9 text-xs" />
                  <div className="flex gap-2">
                    <ImagePicker onSelect={url => { setThumbnailUrl(url); toast({ title: 'Image Selected' }); }}
                      trigger={<Button type="button" variant="outline" size="sm" className="h-7 text-[11px] font-bold gap-1">Pick from Library</Button>} />
                    <label className="h-7 px-3 border border-dashed border-violet-400/40 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-all">
                      {uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</> : <><ImageIcon className="h-3 w-3" /> Upload</>}
                      <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODULES TAB ══ */}
        {tab === 'modules' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <Package className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold">Course Modules / Sections</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">Shown on the course page as clickable sections</span>
            </div>

            {/* Existing modules list */}
            {loadingModules ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading modules…
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No modules yet. Add your first module below.
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((mod, i) => (
                  <div key={mod.id} className="flex items-start gap-3 p-3.5 rounded-xl border bg-muted/20 hover:border-violet-200 dark:hover:border-violet-900 group transition-colors">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-muted-foreground">#{i + 1}</span>
                        <p className="text-sm font-bold text-foreground truncate">{mod.title}</p>
                        <Badge className={`shrink-0 text-[8px] font-black border-none py-0 ${mod.isPaid ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {mod.isPaid ? 'Paid' : 'Free'}
                        </Badge>
                      </div>
                      {mod.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{mod.description}</p>
                      )}
                    </div>
                    <button onClick={() => handleDeleteModule(mod)}
                      className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new module form */}
            <div className="border rounded-xl p-4 space-y-3 bg-violet-500/5 border-violet-500/20">
              <div className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400">
                <FolderPlus className="h-4 w-4" /> Add New Module
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Module Title *</Label>
                <Input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
                  placeholder="e.g. Introduction to Python" className="h-9 text-sm"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddModule(); }} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description (optional)</Label>
                <Input value={newModuleDesc} onChange={e => setNewModuleDesc(e.target.value)}
                  placeholder="Brief module overview..." className="h-9 text-sm" />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input type="checkbox" checked={newModulePaid} onChange={e => setNewModulePaid(e.target.checked)}
                    className="h-4 w-4 rounded accent-violet-500" />
                  <span>Paid Access</span>
                </label>
                <Button size="sm" onClick={handleAddModule} disabled={addingModule || !newModuleTitle.trim()}
                  className="h-8 text-[11px] font-bold bg-violet-600 hover:bg-violet-700 text-white gap-1">
                  {addingModule ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Add Module
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ CONTENT TAB ══ */}
        {tab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <FileText className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold">Course Body Content</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">Rendered on /courses/{slug || '[slug]'}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Write extended course information, what you'll learn, prerequisites, and syllabus.
            </p>
            <RichTextEditor value={bodyContent} onChange={setBodyContent}
              placeholder="Write detailed course overview, prerequisites, learning outcomes..."
              className="border rounded-xl bg-background min-h-[380px]" />
          </div>
        )}

        {/* ══ SEO TAB ══ */}
        {tab === 'seo' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-bold">SEO &amp; Search Optimization</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAutoSEO}
                className="h-7 text-[11px] font-bold border-violet-200/50 text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 gap-1">
                <Sparkles className="h-3 w-3" /> Auto-Fill
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Focus Keyphrase</Label>
              <Input value={focusKeyphrase} onChange={e => setFocusKeyphrase(e.target.value)} placeholder="e.g. python programming course" className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meta Title</Label>
                <span className={`text-[10px] font-bold ${isTitleIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>{metaTitle.length}/60</span>
              </div>
              <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO Browser title" className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Keywords</Label>
              <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="python, backend, programming" className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meta Description</Label>
                <span className={`text-[10px] font-bold ${isDescIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>{metaDescription.length}/160</span>
              </div>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)}
                className="w-full h-20 border rounded-xl bg-background p-3 text-sm focus:ring-1 focus:ring-violet-500 outline-none resize-none font-medium transition-all"
                placeholder="Google search snippet..." />
            </div>

            {/* Google Preview */}
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Google Preview</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold">G</span>
                Xmarty Creator.com › courses › {slug || 'course-slug'}
              </div>
              <h3 className="text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8] truncate">{metaTitle || title || 'Course Title'}</h3>
              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2">{metaDescription || description || 'Add a meta description...'}</p>
            </div>

            {/* SEO Checklist */}
            <div className="border rounded-xl p-4 bg-muted/30 space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">SEO Checklist</span>
              {[
                { label: 'Focus keyphrase set', pass: hasKeyphrase },
                { label: 'Keyphrase in title', pass: keyphraseInTitle },
                { label: 'Keyphrase in meta desc', pass: keyphraseInDesc },
                { label: 'Meta title (40-60 chars)', pass: isTitleIdeal },
                { label: 'Meta description (120-160 chars)', pass: isDescIdeal },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">{item.label}</span>
                  {item.pass ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-rose-400" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
