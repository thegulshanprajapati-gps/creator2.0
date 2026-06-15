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

  // Detailed Content
  const [bodyContent, setBodyContent] = useState('');

  // SEO Fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [focusKeyphrase, setFocusKeyphrase] = useState('');

  // Load detailed course folder meta fields
  useEffect(() => {
    const fetchDetailedData = async () => {
      const { data, error } = await db
        .from('course_folders')
        .select('*')
        .eq('id', course.id)
        .single();

      if (data && !error) {
        setBodyContent(data.body_content || '');
        setMetaTitle(data.meta_title || '');
        setMetaDescription(data.meta_description || '');
        setKeywords(data.keywords || '');
        setFocusKeyphrase(data.focus_keyphrase || '');
      }
    };

    fetchDetailedData();
  }, [course.id]);

  const handleSave = async () => {
    setSaving(true);

    const generatedSlug = slug.trim()
      ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { error } = await db
      .from('course_folders')
      .update({
        title,
        description,
        instructor,
        duration,
        students,
        price,
        category,
        level,
        visibility,
        slug: generatedSlug,
        thumbnail_url: thumbnailUrl,
        body_content: bodyContent,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords: keywords,
        focus_keyphrase: focusKeyphrase,
      })
      .eq('id', course.id);

    setSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to save course details",
        description: error.message,
      });
    } else {
      toast({
        title: "Course updated successfully 🎉",
        description: `"${title}" has been updated and published.`,
      });
      onSaved();
    }
  };

  const handleAutoSEO = () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a course title first.",
      });
      return;
    }
    setMetaTitle(title.substring(0, 60));
    setMetaDescription((description || '').substring(0, 155) + ((description?.length || 0) > 155 ? '...' : ''));
    toast({
      title: "SEO tags auto-generated ✨",
    });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    body.append('asset_type', 'image');

    try {
      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed.');
      }
      setThumbnailUrl(data.secure_url || data.url || '');
      toast({
        title: "Thumbnail uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const isTitleLengthIdeal = metaTitle.length >= 40 && metaTitle.length <= 60;
  const isDescLengthIdeal = metaDescription.length >= 120 && metaDescription.length <= 160;
  const hasKeyphrase = !!focusKeyphrase.trim();
  const keyphraseInTitle = hasKeyphrase && title.toLowerCase().includes(focusKeyphrase.toLowerCase());
  const keyphraseInDesc = hasKeyphrase && metaDescription.toLowerCase().includes(focusKeyphrase.toLowerCase());

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Editor Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold">
            Course Editor
          </Badge>
          <span className="text-xs text-muted-foreground font-semibold">/{slug || 'course-page'}</span>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs font-bold gap-1 border-primary/20">
              <a href={`/courses/${slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-3 w-3" /> Preview
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="h-7 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            {saving ? 'Saving…' : 'Publish Changes'}
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7 text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Navigation */}
      <div className="flex border-b shrink-0 px-4 bg-background">
        {[
          { id: 'details', label: 'Basic Info', icon: LayoutDashboard },
          { id: 'content', label: 'Detail Content', icon: FileText },
          { id: 'seo', label: 'SEO Settings', icon: Globe },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as EditorTab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all -mb-px ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
        {tab === 'details' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Course Name *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter course heading..."
                className="font-headline font-bold h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <LinkIcon className="h-3 w-3" /> Custom URL Slug
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg font-mono">/courses/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="python-mastery"
                  className="font-mono text-sm h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Programming', 'Architecture', 'Backend', 'Frontend', 'Placement Prep', 'General'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Skill Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instructor Name</Label>
                <Input
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Dr. Sarah"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Duration Estimate</Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 12 Hours"
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Students Count (Display)</Label>
                <Input
                  value={students}
                  onChange={(e) => setStudents(e.target.value)}
                  placeholder="e.g. 1.5k"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price (INR)</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 9900 or 0 for free"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visibility Status</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">🌍 Public — Visible in library catalog</SelectItem>
                  <SelectItem value="Private">🔒 Private — Access only via direct folder link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Short Hero Summary</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give a brief description shown in the header of the course page..."
                className="min-h-[90px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Course Card Thumbnail</Label>
              <div className="flex gap-4 items-start">
                {thumbnailUrl && (
                  <div className="h-20 w-32 rounded-xl border overflow-hidden shrink-0 relative bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailUrl} alt="thumbnail" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Thumbnail Image URL..."
                    className="h-9 text-xs"
                  />
                  <div className="flex gap-2">
                    <ImagePicker
                      onSelect={(url) => {
                        setThumbnailUrl(url);
                        toast({ title: "Image Selected!" });
                      }}
                      trigger={
                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-bold gap-1">
                          <ImageIcon className="h-3 w-3" /> Choose Library
                        </Button>
                      }
                    />
                    <label className="h-8 px-3 border border-dashed border-blue-400/40 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all">
                      {uploading ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
                      ) : (
                        <><ImageIcon className="h-3 w-3" /> Upload</>
                      )}
                      <input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'content' && (
          <div className="space-y-4 h-full min-h-[400px]">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detailed Course Syllabus / Content</Label>
              <p className="text-[11px] text-muted-foreground">This content renders as the main body description below the header on the course curriculum page.</p>
            </div>
            <RichTextEditor
              value={bodyContent}
              onChange={setBodyContent}
              placeholder="Detail syllabus, modules list, what you will learn, requirements..."
              className="border rounded-xl bg-background"
            />
          </div>
        )}

        {tab === 'seo' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-headline font-bold text-sm">SEO Meta Info</h3>
              <Button variant="outline" size="sm" onClick={handleAutoSEO} className="h-7 text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/10 gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Auto-Fill SEO Tags
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Focus Keyphrase</Label>
              <Input
                value={focusKeyphrase}
                onChange={(e) => setFocusKeyphrase(e.target.value)}
                placeholder="e.g. backend systems"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meta Title</Label>
                <span className={`text-[10px] font-bold ${isTitleLengthIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {metaTitle.length}/60 chars
                </span>
              </div>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Custom title tag for browser tabs..."
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keywords</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. node.js, rest apis, systems design"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meta Description</Label>
                <span className={`text-[10px] font-bold ${isDescLengthIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {metaDescription.length}/160 chars
                </span>
              </div>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Search snippet summary shown in Google..."
                className="min-h-[90px] resize-none"
              />
            </div>

            {/* Google Snippet Live Preview */}
            <div className="bg-white dark:bg-neutral-900 border rounded-[1.5rem] p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Google Search Preview</span>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                <span className="h-4.5 w-4.5 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-[9px]">G</span>
                xmartycreator.com › courses › {slug || 'course-url'}
              </div>
              <h3 className="text-lg font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate">
                {metaTitle || title || 'Course Details Title Tag'}
              </h3>
              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                {metaDescription || description || 'Add a meta description to see the Google snippet preview.'}
              </p>
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
    </div>
  );
}

// ────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────
export default function CurriculumCatalogPage() {
  const [editingCourse, setEditingCourse] = useState<ExplorerItem | null>(null);
  const [advancingCourse, setAdvancingCourse] = useState<ExplorerItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDownloadCSV = async () => {
    try {
      const { data, error } = await db
        .from('course_folders')
        .select('*')
        .eq('course_id', 'curriculum-catalog')
        .eq('parent_folder_id', null);

      if (error || !data) {
        toast({ variant: "destructive", title: "Failed to download curriculum structure", description: error?.message });
        return;
      }

      const headers = ["Title", "Description", "Is Paid", "Category", "Level", "Instructor", "Duration", "Students", "Price", "Visibility", "Slug"];
      const rows = data.map((f: any) => [
        f.title || "",
        f.description || "",
        f.is_paid ? "TRUE" : "FALSE",
        f.category || "Programming",
        f.level || "Beginner",
        f.instructor || "",
        f.duration || "",
        f.students || "",
        f.price || "",
        f.visibility || "Private",
        f.slug || ""
      ]);

      const escapeCSV = (val: string) => {
        const clean = val.replace(/"/g, '""');
        return `"${clean}"`;
      };

      const csvContent = [
        headers.join(","),
        ...rows.map((r: string[]) => r.map(escapeCSV).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `curriculum_structure_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Curriculum database exported successfully!" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export failed", description: e.message || String(e) });
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(l => l);
        if (lines.length <= 1) {
          toast({ variant: "destructive", title: "Empty or invalid CSV file" });
          return;
        }

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        let importCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < header.length) continue;

          const record: Record<string, any> = {};
          header.forEach((key, idx) => {
            let fieldName = key;
            if (key === "title") fieldName = "title";
            else if (key === "description") fieldName = "description";
            else if (key === "is paid" || key === "is_paid") fieldName = "is_paid";
            else if (key === "category") fieldName = "category";
            else if (key === "level") fieldName = "level";
            else if (key === "instructor") fieldName = "instructor";
            else if (key === "duration") fieldName = "duration";
            else if (key === "students") fieldName = "students";
            else if (key === "price") fieldName = "price";
            else if (key === "visibility") fieldName = "visibility";
            else if (key === "slug") fieldName = "slug";

            record[fieldName] = values[idx];
          });

          const title = record.title || "Unnamed Course";
          const slug = record.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const isPaid = String(record.is_paid).toUpperCase() === "TRUE";

          const { data: mainFolder, error: mainErr } = await db.from('course_folders').insert({
            course_id: 'curriculum-catalog',
            title,
            slug,
            description: record.description || null,
            parent_folder_id: null,
            sort_order: i,
            is_paid: isPaid,
            category: record.category || "Programming",
            level: record.level || "Beginner",
            instructor: record.instructor || "",
            duration: record.duration || "",
            students: record.students || "",
            price: record.price || "",
            visibility: record.visibility || "Private"
          });

          if (mainErr) {
            console.error("Error importing course:", mainErr);
            continue;
          }

          if (mainFolder?.id) {
            await db.from('course_folders').insert({
              course_id: 'curriculum-catalog',
              title: '.thumbnail',
              description: 'Course thumbnail resources',
              parent_folder_id: mainFolder.id,
              sort_order: 1,
              is_paid: isPaid,
            });

            await db.from('course_folders').insert({
              course_id: 'curriculum-catalog',
              title: 'content',
              description: 'Course lectures and files',
              parent_folder_id: mainFolder.id,
              sort_order: 2,
              is_paid: isPaid,
            });
          }
          importCount++;
        }

        toast({ title: `Curriculum imported successfully! (${importCount} courses added) 🎉` });
        setRefreshKey(k => k + 1);
      } catch (err: any) {
        toast({ variant: "destructive", title: "Import failed", description: err.message || String(err) });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl">Curriculum Catalog</h1>
            <p className="text-xs text-muted-foreground">Manage folders, upload content, and shape learning pathways. <strong>Right-click</strong> a course folder to edit its page.</p>
          </div>
          {!(editingCourse || advancingCourse) && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                onClick={() => document.getElementById('curriculum-csv-import')?.click()}
              >
                📥 Import Curriculum
              </Button>
              <input
                id="curriculum-csv-import"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold border-sky-500/30 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                onClick={handleDownloadCSV}
              >
                📤 Download Curriculum
              </Button>
            </div>
          )}
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
            <div className="flex-1 overflow-auto p-6 md:p-8 transition-all duration-300 w-full">
              <FolderManager
                key={refreshKey}
                courseId="curriculum-catalog"
                title="Curriculum Catalog"
                description="Create and publish learning modules with folder-based content organization."
                onEditCourse={handleEditCourse}
                onAdvanceEdit={handleAdvanceEdit}
              />
            </div>
          )}

          {/* Right: Basic Course Editor Panel */}
          {editingCourse && !advancingCourse && (
            <div className="w-full h-full min-w-0 bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <CourseEditor
                course={editingCourse}
                onClose={handleEditorClose}
                onSaved={handleEditorSaved}
              />
            </div>
          )}

          {/* Right: Advanced Course Editor Panel */}
          {advancingCourse && !editingCourse && (
            <div className="w-full h-full min-w-0 bg-background shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
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
