'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { FolderManager } from "@/components/admin/folder-manager";
import { ExplorerItem } from "@/components/admin/windows-explorer";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  X, Save, Globe, Sparkles, Check, BookOpen, Tag, Clock,
  Users, DollarSign, Link as LinkIcon, Eye, FileText, Image as ImageIcon,
  LayoutDashboard, ChevronRight, Loader2
} from "lucide-react";
import RichTextEditor from "@/components/rich-text-editor";
import { ImagePicker } from "@/components/admin/image-picker";
import { AdvancedCourseEditor } from "@/components/admin/advanced-course-editor";

// ────────────────────────────────────────────
// Course Editor Panel
// ────────────────────────────────────────────
interface CourseEditorProps {
  course: ExplorerItem;
  onClose: () => void;
  onSaved: () => void;
}

type EditorTab = 'details' | 'content' | 'seo';

function CourseEditor({ course, onClose, onSaved }: CourseEditorProps) {
  const [tab, setTab] = useState<EditorTab>('details');
  const [saving, setSaving] = useState(false);

  // Basic Details
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

  // Rich Content (long description / body)
  const [bodyContent, setBodyContent] = useState('');

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [focusKeyphrase, setFocusKeyphrase] = useState('');

  // Load existing course page content from DB (body, seo)
  useEffect(() => {
    const loadCourseContent = async () => {
      try {
        const { data } = await db.from('course_folders').select('*').eq('id', course.id).single();
        if (data) {
          setBodyContent(data.body_content || '');
          setMetaTitle(data.meta_title || '');
          setMetaDescription(data.meta_description || '');
          setKeywords(data.keywords || '');
          setFocusKeyphrase(data.focus_keyphrase || '');
        }
      } catch (e) {
        // silently fail – fields will be blank
      }
    };
    loadCourseContent();
  }, [course.id]);

  const handleAutoGenerateSEO = () => {
    if (!title) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a course title first.' });
      return;
    }
    setMetaTitle(title.slice(0, 60));
    const descSource = description || '';
    setMetaDescription(descSource.slice(0, 155) + (descSource.length > 155 ? '...' : ''));
    if (focusKeyphrase && !keywords.includes(focusKeyphrase)) {
      setKeywords(prev => prev ? `${focusKeyphrase}, ${prev}` : focusKeyphrase);
    }
    toast({ title: 'SEO Auto-Generated', description: 'Meta Title and Description populated.' });
  };

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
      toast({ title: 'Thumbnail Uploaded', description: 'Successfully uploaded to Cloudinary.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalSlug = slug.trim()
        ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const { error } = await db.from('course_folders').update({
        title,
        description,
        instructor,
        duration,
        students,
        price,
        category,
        level,
        visibility,
        slug: finalSlug,
        thumbnail_url: thumbnailUrl,
        body_content: bodyContent,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords,
        focus_keyphrase: focusKeyphrase,
      }).eq('id', course.id);

      if (error) throw new Error(error.message);
      toast({ title: 'Course Saved', description: 'All course page details updated successfully.' });
      onSaved();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message || 'Unknown error.' });
    } finally {
      setSaving(false);
    }
  };

  // SEO Analysis
  const isTitleLengthIdeal = metaTitle.length >= 40 && metaTitle.length <= 60;
  const isDescLengthIdeal = metaDescription.length >= 120 && metaDescription.length <= 160;
  const hasKeyphrase = !!focusKeyphrase.trim();
  const keyphraseInTitle = hasKeyphrase && title.toLowerCase().includes(focusKeyphrase.toLowerCase());
  const keyphraseInDesc = hasKeyphrase && metaDescription.toLowerCase().includes(focusKeyphrase.toLowerCase());

  const tabs: { id: EditorTab; label: string; icon: any }[] = [
    { id: 'details', label: 'Details', icon: LayoutDashboard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'seo', label: 'SEO', icon: Globe },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-500/10 via-transparent to-transparent shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h2 className="font-headline font-bold text-sm text-foreground truncate max-w-[200px]">
              {course.name}
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold">Course Page Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {slug && (
            <a
              href={`/courses/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="h-7 px-2.5 rounded-lg border border-primary/20 text-[10px] font-bold text-primary flex items-center gap-1 hover:bg-primary/10 transition-colors"
            >
              <Eye className="h-3 w-3" /> Preview
            </a>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b shrink-0 bg-background">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all -mb-px ${
                active
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* ── DETAILS TAB ── */}
        {tab === 'details' && (
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Course Title</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Python Mastery Course"
                className="h-9 text-sm font-semibold"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <LinkIcon className="h-3 w-3" /> URL Slug
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">/courses/</span>
                <Input
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="python-mastery-course"
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Category & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Programming', 'Architecture', 'Backend', 'Frontend', 'Placement Prep', 'General'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Instructor & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> Instructor
                </Label>
                <Input value={instructor} onChange={e => setInstructor(e.target.value)} placeholder="e.g. Dr. Rahul" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Duration
                </Label>
                <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 12 Hours" className="h-9 text-sm" />
              </div>
            </div>

            {/* Students & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Student Count</Label>
                <Input value={students} onChange={e => setStudents(e.target.value)} placeholder="e.g. 1.2k" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Price (INR)
                </Label>
                <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 9900 or 0 for free" className="h-9 text-sm" />
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Visibility
              </Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">🌍 Public — Visible on Course Library</SelectItem>
                  <SelectItem value="Private">🔒 Private — Hidden from course list</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Short Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A brief summary shown on the course hero section..."
                className="resize-none text-sm min-h-[80px]"
              />
            </div>

            {/* Thumbnail */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" /> Thumbnail
              </Label>
              <div className="flex gap-3 items-start">
                {thumbnailUrl && (
                  <div className="h-16 w-24 rounded-lg border overflow-hidden shrink-0">
                    <img src={thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    value={thumbnailUrl}
                    onChange={e => setThumbnailUrl(e.target.value)}
                    placeholder="Thumbnail URL or upload below..."
                    className="h-9 text-xs"
                  />
                  <div className="flex gap-2">
                    <ImagePicker
                      onSelect={url => {
                        setThumbnailUrl(url);
                        toast({ title: 'Image Selected', description: 'Thumbnail set from library.' });
                      }}
                      trigger={
                        <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] font-bold gap-1">
                          Pick from Library
                        </Button>
                      }
                    />
                    <label className="h-7 px-3 border border-dashed border-blue-400/40 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-all">
                      {uploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</> : <><ImageIcon className="h-3 w-3" /> Upload</>}
                      <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT TAB ── */}
        {tab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <FileText className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-bold">Course Body Content</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">Shown on the course detail page</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Write extended course information, what you&apos;ll learn, prerequisites, and structured content for the <code className="bg-muted px-1 rounded text-[10px]">/courses/{slug || '[slug]'}</code> page.
            </p>
            <RichTextEditor
              value={bodyContent}
              onChange={setBodyContent}
              placeholder="Write detailed course overview, what students will learn, prerequisites, syllabus breakdown..."
              className="border rounded-xl bg-background text-foreground min-h-[350px]"
            />
          </div>
        )}

        {/* ── SEO TAB ── */}
        {tab === 'seo' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold">SEO &amp; Search Optimization</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoGenerateSEO}
                className="h-7 text-[11px] font-bold border-blue-200/50 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 gap-1"
              >
                <Sparkles className="h-3 w-3" /> Auto-Fill SEO
              </Button>
            </div>

            {/* Focus Keyphrase */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Focus Keyphrase</Label>
              <Input
                value={focusKeyphrase}
                onChange={e => setFocusKeyphrase(e.target.value)}
                placeholder="e.g. python programming course"
                className="h-9 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">The main keyword phrase you want this course to rank for.</p>
            </div>

            {/* Meta Title */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meta Title</Label>
                <span className={`text-[10px] font-bold ${isTitleLengthIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {metaTitle.length} / 60 chars
                </span>
              </div>
              <Input
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                placeholder="SEO Browser title tag"
                className="h-9 text-sm"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Keywords (comma separated)</Label>
              <Input
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. python, programming, backend, django"
                className="h-9 text-sm"
              />
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Meta Description</Label>
                <span className={`text-[10px] font-bold ${isDescLengthIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {metaDescription.length} / 160 chars
                </span>
              </div>
              <textarea
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                className="w-full h-20 border rounded-xl bg-background p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm font-medium transition-all resize-none"
                placeholder="Google search snippet summary..."
              />
            </div>

            {/* Google Snippet Preview */}
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Google Search Preview</span>
              <div className="font-sans text-left space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold">G</span>
                  <span>Xmarty Creator.com › courses › {slug || 'course-slug'}</span>
                </div>
                <h3 className="text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8] truncate">
                  {metaTitle || title || 'Course Title'}
                </h3>
                <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                  {metaDescription || description || 'Add a meta description to see the Google snippet preview.'}
                </p>
              </div>
            </div>

            {/* SEO Checklist */}
            <div className="border rounded-xl p-4 bg-muted/30 space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">SEO Analysis</span>
              <div className="space-y-2">
                {[
                  { label: 'Focus keyphrase set', pass: hasKeyphrase },
                  { label: 'Keyphrase in title', pass: keyphraseInTitle },
                  { label: 'Keyphrase in meta description', pass: keyphraseInDesc },
                  { label: 'Meta title length (40-60 chars)', pass: isTitleLengthIdeal },
                  { label: 'Meta description length (120-160 chars)', pass: isDescLengthIdeal },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.pass
                      ? <Check className="h-4 w-4 text-emerald-500" />
                      : <X className="h-4 w-4 text-rose-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="px-5 py-3 border-t bg-background/80 backdrop-blur-sm shrink-0 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs font-bold">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          {saving ? 'Saving…' : 'Publish Changes'}
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────
export default function CoursesAdminPage() {
  const [editingCourse, setEditingCourse] = useState<ExplorerItem | null>(null);
  const [advancingCourse, setAdvancingCourse] = useState<ExplorerItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEditCourse = (item: ExplorerItem) => {
    setAdvancingCourse(null);
    setEditingCourse(item);
  };

  const handleAdvanceEdit = (item: ExplorerItem) => {
    setEditingCourse(null);
    setAdvancingCourse(item);
  };

  const handleEditorClose = () => {
    setEditingCourse(null);
    setAdvancingCourse(null);
  };

  const handleEditorSaved = () => {
    setRefreshKey(k => k + 1);
    // Keep the panel open after saving so admin can continue editing
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl">Curriculum Catalog</h1>
            <p className="text-xs text-muted-foreground">Manage courses, folders, and learning assets. <strong>Right-click</strong> a course folder to edit its page.</p>
          </div>
          {(editingCourse || advancingCourse) && (
            <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-1.5 shrink-0 ${
              advancingCourse
                ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10'
                : 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
            }`}>
              <BookOpen className="h-3.5 w-3.5" />
              {advancingCourse ? '🚀 Advance Edit:' : 'Editing:'} {(advancingCourse || editingCourse)?.name}
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </div>
          )}
        </header>

        {/* Split Layout: FolderManager + Editor Panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Left: Folder Manager */}
          {!(editingCourse || advancingCourse) && (
            <div className="flex-1 overflow-auto p-6 md:p-8 w-full">
              <FolderManager
                key={refreshKey}
                courseId="default"
                title="Course Curriculum"
                description="Organize course content into folders, modules, and media bundles."
                onEditCourse={handleEditCourse}
                onAdvanceEdit={handleAdvanceEdit}
              />
            </div>
          )}

          {/* Right: Basic Course Editor Panel */}
          {editingCourse && !advancingCourse && (
            <div className="w-full min-w-0 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <CourseEditor
                course={editingCourse}
                onClose={handleEditorClose}
                onSaved={handleEditorSaved}
              />
            </div>
          )}

          {/* Right: Advanced Course Editor Panel */}
          {advancingCourse && !editingCourse && (
            <div className="w-full min-w-0 bg-background flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <AdvancedCourseEditor
                course={advancingCourse}
                onClose={handleEditorClose}
                onSaved={handleEditorSaved}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
