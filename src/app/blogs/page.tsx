'use client';

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, Plus, Save, RotateCcw, Calendar, Clock, BookOpen, AlertCircle, ArrowLeft, Image as ImageIcon, Upload, Globe, Sparkles, Check, X, Search, Loader2, Recycle, ArrowUp, ArrowDown } from "lucide-react";
import RichTextEditor from "@/components/rich-text-editor";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePicker } from "@/components/admin/image-picker";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { FontColorPicker } from "@/components/admin/font-color-picker";
import Link from "next/link";

const PREDEFINED_CATEGORIES = ["Technology", "Guide", "AI", "General", "Programming"];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
];

interface ContentBlock {
  type: string;
  content?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4';
  quote_style?: string;
  enable_icon?: boolean;
  alignment?: 'left' | 'center' | 'right';
  accent_color?: string;
  url?: string;
  caption?: string;
  items?: any[];
  headers?: string[];
  rows?: string[][];
}

export default function BlogsAdminPage() {
  const confirm = useConfirm();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [trashCount, setTrashCount] = useState(0);

  // Form fields
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('General');
  const [author, setAuthor] = useState('');
  const [readTime, setReadTime] = useState('1 min');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);

  // Dynamic Content Block List
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Font Configuration State
  const [fontConfig, setFontConfig] = useState({
    heading_font: 'Poppins',
    body_font: 'Inter',
    hindi_font: 'Noto Sans Devanagari',
    quote_font: 'Playfair Display'
  });

  // Sidebar Configuration State
  const [sidebarConfig, setSidebarConfig] = useState([
    { type: 'share', enabled: true },
    { type: 'author', enabled: true },
    { type: 'toc', enabled: true },
    { type: 'related', enabled: true },
    { type: 'trending', enabled: true }
  ]);

  // SEO & URL Slug fields
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [focusKeyphrase, setFocusKeyphrase] = useState('');

  // Font & Color fields
  const [titleFont, setTitleFont] = useState('');
  const [titleColor, setTitleColor] = useState('');
  const [excerptFont, setExcerptFont] = useState('');
  const [excerptColor, setExcerptColor] = useState('');
  const [authorFont, setAuthorFont] = useState('');
  const [authorColor, setAuthorColor] = useState('');

  const fetchBlogs = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (e) {
      console.error('Failed to load blogs:', e);
    }
  };

  const fetchTrashCount = async () => {
    try {
      const res = await fetch('/api/blogs/trash');
      if (res.ok) {
        const data = await res.json();
        setTrashCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (e) {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchTrashCount();

    const handleCreateNewEvent = () => {
      handleCreateNew();
    };
    window.addEventListener('blog-create-new', handleCreateNewEvent);
    return () => {
      window.removeEventListener('blog-create-new', handleCreateNewEvent);
    };
  }, []);

  // Update Page Title / Tab Name dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = isEditing
        ? (currentId ? "Edit Post | Xmarty Journal Editor" : "New Post | Xmarty Journal Editor")
        : "Xmarty Journal Admin";
    }
  }, [isEditing, currentId]);

  // Calculate read time automatically based on word count
  useEffect(() => {
    const textContent = blocks.map(b => b.content || '').join(' ');
    const words = textContent.trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    setReadTime(`${mins} min`);
  }, [blocks]);

  const handleEdit = (blog: any) => {
    setIsEditing(true);
    setCurrentId(blog.id);
    setTitle(blog.title || '');
    setExcerpt(blog.excerpt || '');
    setCategory(blog.category || 'General');
    setAuthor(blog.author || '');
    setReadTime(blog.readTime || '1 min');
    setImage(blog.image || '');
    setFeatured(!!blog.featured);
    setMetaTitle(blog.metaTitle || '');
    setMetaDescription(blog.metaDescription || '');
    setKeywords(blog.keywords || '');
    setCustomSlug(blog.slug || '');
    setFocusKeyphrase(blog.focusKeyphrase || '');
    // Font & Color
    setTitleFont(blog.titleFont || '');
    setTitleColor(blog.titleColor || '');
    setExcerptFont(blog.excerptFont || '');
    setExcerptColor(blog.excerptColor || '');
    setAuthorFont(blog.authorFont || '');
    setAuthorColor(blog.authorColor || '');

    // Set Dynamic blocks
    setBlocks(blog.blocks || [
      { type: 'paragraph', content: blog.content || '' }
    ]);
    setFontConfig(blog.fontConfig || {
      heading_font: 'Poppins',
      body_font: 'Inter',
      hindi_font: 'Noto Sans Devanagari',
      quote_font: 'Playfair Display'
    });
    setSidebarConfig(blog.sidebarConfig || [
      { type: 'share', enabled: true },
      { type: 'author', enabled: true },
      { type: 'toc', enabled: true },
      { type: 'related', enabled: true },
      { type: 'trending', enabled: true }
    ]);
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setCurrentId(null);
    setTitle('');
    setExcerpt('');
    setCategory('General');
    setAuthor('Admin');
    setReadTime('1 min');
    setImage(PRESET_IMAGES[0]);
    setFeatured(false);
    setMetaTitle('');
    setMetaDescription('');
    setKeywords('');
    setCustomSlug('');
    setFocusKeyphrase('');
    setTitleFont('');
    setTitleColor('');
    setExcerptFont('');
    setExcerptColor('');
    setAuthorFont('');
    setAuthorColor('');

    // Default template blocks
    setBlocks([
      { type: 'heading', level: 'h2', content: 'परिचय' },
      { type: 'paragraph', content: 'यहाँ अपनी पहली पैराग्राफ लिखें...' },
      { type: 'quote', content: 'सफलता का रहस्य निरंतर प्रयास है।', quote_style: 'left-border', enable_icon: true, alignment: 'left', accent_color: '#ef4444' }
    ]);
    setFontConfig({
      heading_font: 'Poppins',
      body_font: 'Inter',
      hindi_font: 'Noto Sans Devanagari',
      quote_font: 'Playfair Display'
    });
    setSidebarConfig([
      { type: 'share', enabled: true },
      { type: 'author', enabled: true },
      { type: 'toc', enabled: true },
      { type: 'related', enabled: true },
      { type: 'trending', enabled: true }
    ]);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Move to Recycle Bin',
      message: 'This blog post will be moved to the Recycle Bin and permanently deleted after 10 days.',
      confirmText: 'Move to Bin',
      cancelText: 'Cancel'
    });
    if (isConfirmed) {
      try {
        const res = await fetch(`/api/blogs?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast({ title: "Moved to Recycle Bin", description: "Blog post moved to Recycle Bin. Auto-expires in 10 days." });
          fetchBlogs();
          fetchTrashCount();
          if (currentId === id) {
            setIsEditing(false);
            setCurrentId(null);
          }
        } else {
          throw new Error('Failed to delete');
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete blog post." });
      }
    }
  };

  // Upload local file directly to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }
      setImage(data.secure_url || data.url || '');
      toast({ title: "Image Uploaded", description: "Successfully uploaded cover image to Cloudinary." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Upload Failed", description: err.message || String(err) });
    } finally {
      setUploading(false);
    }
  };

  // Save functionality mapping all block structures
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !excerpt || !category) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in title, excerpt, and category." });
      return;
    }

    const cleanTitleText = title.replace(/<[^>]*>/g, '').trim();
    const finalSlug = customSlug.trim()
      ? customSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : cleanTitleText.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Compile blocks back to raw HTML for backwards compatibility fallback
    let compiledHtml = '';
    blocks.forEach(b => {
      if (b.type === 'heading') {
        compiledHtml += `<${b.level || 'h2'}>${b.content || ''}</${b.level || 'h2'}>`;
      } else if (b.type === 'paragraph') {
        compiledHtml += `<p>${b.content || ''}</p>`;
      } else if (b.type === 'quote') {
        compiledHtml += `<blockquote>${b.content || ''}</blockquote>`;
      } else if (b.type === 'image' || b.type === 'image-caption') {
        compiledHtml += `<figure><img src="${b.url || ''}" alt="" /><figcaption>${b.caption || ''}</figcaption></figure>`;
      } else if (b.type === 'bullet-list') {
        compiledHtml += `<ul>${b.items?.map(it => `<li>${it}</li>`).join('')}</ul>`;
      } else if (b.type === 'numbered-list') {
        compiledHtml += `<ol>${b.items?.map(it => `<li>${it}</li>`).join('')}</ol>`;
      } else if (b.type === 'faq') {
        compiledHtml += `<div>${b.items?.map(it => `<p><strong>${it.question}</strong></p><p>${it.answer}</p>`).join('')}</div>`;
      }
    });

    const blogDoc = {
      id: currentId,
      title,
      slug: finalSlug,
      excerpt,
      category,
      author,
      readTime,
      image,
      featured,
      content: compiledHtml,
      metaTitle,
      metaDescription,
      keywords,
      focusKeyphrase,
      // Font & Color
      titleFont,
      titleColor,
      excerptFont,
      excerptColor,
      authorFont,
      authorColor,
      // Blocks payload
      blocks,
      fontConfig,
      sidebarConfig
    };

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blogDoc)
      });
      if (res.ok) {
        toast({ title: currentId ? "Saved" : "Created", description: currentId ? "Blog post updated successfully." : "New blog post published successfully." });
        fetchBlogs();
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save blog post." });
    }

    setIsEditing(false);
    setCurrentId(null);
  };

  const resetDefaults = async () => {
    const isConfirmed = await confirm({
      title: 'Reset Blogs',
      message: 'Reset blogs to sample layout data? This will hard-delete all current blogs (bypassing Recycle Bin).',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });
    if (isConfirmed) {
      try {
        const res = await fetch('/api/blogs?all=true', { method: 'DELETE' });
        if (res.ok) {
          toast({ title: "Reset complete", description: "All blogs removed." });
          fetchBlogs();
        } else {
          throw new Error('Failed to reset');
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset blogs." });
      }
      setIsEditing(false);
      setCurrentId(null);
    }
  };

  const handleAutoGenerateSEO = () => {
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
    const cleanExcerpt = excerpt.replace(/<[^>]*>/g, '').trim();

    if (!cleanTitle) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a blog title first before generating SEO." });
      return;
    }

    setMetaTitle(cleanTitle.slice(0, 60));
    setMetaDescription(cleanExcerpt.slice(0, 155));

    if (focusKeyphrase && !keywords.includes(focusKeyphrase)) {
      setKeywords(prev => prev ? `${focusKeyphrase}, ${prev}` : focusKeyphrase);
    }
    toast({ title: "SEO Auto-Generated", description: "Meta Title and Description filled with optimized defaults." });
  };

  // Block handlers
  const addBlock = (type: string) => {
    let newBlock: ContentBlock = { type };
    if (type === 'heading') {
      newBlock = { type, level: 'h2', content: '' };
    } else if (type === 'paragraph') {
      newBlock = { type, content: '' };
    } else if (type === 'quote') {
      newBlock = { type, content: '', quote_style: 'left-border', enable_icon: true, alignment: 'left', accent_color: '#ef4444' };
    } else if (type === 'image' || type === 'image-caption') {
      newBlock = { type, url: '', caption: '' };
    } else if (type === 'bullet-list' || type === 'numbered-list') {
      newBlock = { type, items: [''] };
    } else if (type === 'highlight' || type === 'callout' || type === 'code' || type === 'conclusion') {
      newBlock = { type, content: '' };
    } else if (type === 'key-points') {
      newBlock = { type, items: [''] };
    } else if (type === 'table') {
      newBlock = { type, headers: ['Column 1', 'Column 2'], rows: [['Cell A1', 'Cell A2']] };
    } else if (type === 'faq') {
      newBlock = { type, items: [{ question: '', answer: '' }] };
    } else if (type === 'video') {
      newBlock = { type, url: '' };
    }
    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    const nextIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= blocks.length) return;
    setBlocks(prev => {
      const list = [...prev];
      const temp = list[idx];
      list[idx] = list[nextIdx];
      list[nextIdx] = temp;
      return list;
    });
  };

  const updateBlockContent = (idx: number, val: string) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, content: val } : b));
  };

  const updateBlockProps = (idx: number, props: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, ...props } : b));
  };

  const updateListItem = (blockIdx: number, itemIdx: number, val: string) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i === blockIdx) {
        const items = [...(b.items || [])];
        items[itemIdx] = val;
        return { ...b, items };
      }
      return b;
    }));
  };

  const addListItem = (blockIdx: number) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i === blockIdx) {
        return { ...b, items: [...(b.items || []), ''] };
      }
      return b;
    }));
  };

  const removeListItem = (blockIdx: number, itemIdx: number) => {
    setBlocks(prev => prev.map((b, i) => {
      if (i === blockIdx) {
        return { ...b, items: (b.items || []).filter((_, k) => k !== itemIdx) };
      }
      return b;
    }));
  };

  // Reorder sidebar items helper
  const moveSidebarWidget = (idx: number, dir: 'up' | 'down') => {
    const nextIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= sidebarConfig.length) return;
    const list = [...sidebarConfig];
    const temp = list[idx];
    list[idx] = list[nextIdx];
    list[nextIdx] = temp;
    setSidebarConfig(list);
  };

  const toggleSidebarWidget = (idx: number) => {
    const list = [...sidebarConfig];
    list[idx].enabled = !list[idx].enabled;
    setSidebarConfig(list);
  };

  const cleanTitleText = title.replace(/<[^>]*>/g, '').trim();
  const cleanExcerptText = excerpt.replace(/<[^>]*>/g, '').trim();

  const hasKeyphrase = !!focusKeyphrase.trim();
  const keyphraseInTitle = hasKeyphrase && cleanTitleText.toLowerCase().includes(focusKeyphrase.toLowerCase());
  const keyphraseInDesc = hasKeyphrase && metaDescription.toLowerCase().includes(focusKeyphrase.toLowerCase());
  const keyphraseInExcerpt = hasKeyphrase && cleanExcerptText.toLowerCase().includes(focusKeyphrase.toLowerCase());

  const isTitleLengthIdeal = metaTitle.length >= 40 && metaTitle.length <= 60;
  const isDescLengthIdeal = metaDescription.length >= 120 && metaDescription.length <= 160;

  const premiumInputStyle = "h-11 border border-slate-200 dark:border-slate-800 rounded-xl bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500 outline-none w-full shadow-sm font-semibold transition-all";

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="font-headline font-bold text-xl text-amber-900 dark:text-yellow-400">Insight Journal Editor</h1>
              <p className="text-xs text-muted-foreground font-medium">Write, format, and organize public insights articles.</p>
            </div>
          </div>
          {!isEditing && (
            <div className="flex gap-2 items-center">
              <Link href="/recycle-bin">
                <Button size="sm" variant="outline" className="border-rose-200/60 hover:bg-rose-500/10 font-bold relative">
                  <Recycle className="h-4 w-4 mr-1 text-rose-500" /> Recycle Bin
                  {trashCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                      {trashCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="border-amber-200/50 hover:bg-amber-500/10 font-bold" onClick={resetDefaults}>
                <RotateCcw className="h-4 w-4 mr-1 text-amber-600 dark:text-yellow-500" /> Reset Samples
              </Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-1" /> New Post
              </Button>
            </div>
          )}
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List panel - collapses when editing */}
          {!isEditing && (
            <div className="lg:col-span-12 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-amber-500" /> Active Articles ({blogs.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blogs.map((blog) => (
                  <Card key={blog.id} className="border border-amber-100 dark:border-amber-900/40 hover:border-amber-300 transition-all duration-300">
                    <CardHeader className="p-4 flex flex-row items-start justify-between gap-4 space-y-0">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <Badge className="bg-amber-500/10 text-amber-800 dark:text-yellow-400 border-none font-bold text-[9px] py-0.5 px-2">
                            {blog.category}
                          </Badge>
                          {blog.featured && (
                            <Badge className="bg-amber-500 text-slate-950 border-none font-extrabold text-[9px] py-0.5 px-2">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {blog.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                          <Calendar className="h-3 w-3" /> {blog.date} • <Clock className="h-3 w-3" /> {blog.readTime}
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleEdit(blog)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(blog.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}

                {blogs.length === 0 && (
                  <Card className="col-span-full border-dashed border-2 py-10 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-8 w-8 text-amber-500 mb-2 animate-bounce" />
                    <p className="text-sm font-bold">No articles present</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "New Post" to publish your first content.</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Form Editor panel - Spans full width when editing */}
          {isEditing && (
            <div className="lg:col-span-12">
              <Card className="border-amber-200 dark:border-amber-900/60 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-100 dark:border-amber-900/40 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline font-bold text-lg text-amber-900 dark:text-yellow-400">
                      {currentId ? 'Edit Article' : 'Draft New Article'}
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold">
                      Changes will be displayed on the client-facing Creator Journal instantly.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back to List
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSave} className="space-y-6">

                    {/* Basic Form Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <Label htmlFor="category" className="text-xs font-bold text-slate-600 dark:text-slate-300">Category</Label>
                        <Select value={category} onValueChange={(val) => setCategory(val)}>
                          <SelectTrigger className="h-11 text-xs focus-visible:ring-amber-500 w-full bg-background border rounded-xl font-bold">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {PREDEFINED_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 col-span-1">
                        <Label htmlFor="author" className="text-xs font-bold text-slate-600 dark:text-slate-300">Author</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="author"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="e.g. Admin Sarah"
                            className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500 outline-none w-full shadow-sm font-semibold transition-all"
                            style={{
                              fontFamily: authorFont || undefined,
                              color: authorColor || undefined,
                            }}
                          />
                          <FontColorPicker
                            font={authorFont}
                            color={authorColor}
                            onChange={(f, c) => { setAuthorFont(f); setAuthorColor(c); }}
                            previewText={author || 'Author Name'}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Read Time</Label>
                        <div className="flex items-center gap-1.5 h-11 px-3.5 border border-amber-200/50 bg-amber-500/[0.03] rounded-xl select-none text-amber-800 dark:text-yellow-400">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-bold">{readTime} (Calculated Automatically)</span>
                        </div>
                      </div>
                    </div>

                    {/* Cover Image Picker & File Uploader Block */}
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                      <div className="flex items-center gap-1.5 border-b pb-2 border-slate-200 dark:border-slate-800">
                        <ImageIcon className="h-4.5 w-4.5 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cover Image Selection</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        {/* Live Image Preview */}
                        <div className="md:col-span-3 flex flex-col items-center">
                          <Label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 text-center">Live Preview</Label>
                          <div className="relative h-28 w-full border rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-muted-foreground shadow-sm">
                            {image ? (
                              <img src={image} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-semibold">No Image</span>
                            )}
                          </div>
                        </div>

                        {/* File Upload & Library Select */}
                        <div className="md:col-span-9 space-y-4">
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-grow space-y-1 w-full">
                              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Selected Cover Image URL</Label>
                              <input
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                placeholder="Cloudinary URL or image address..."
                                className={premiumInputStyle}
                              />
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <ImagePicker
                                onSelect={(url) => {
                                  setImage(url);
                                  toast({ title: "Image Selected", description: "Successfully selected image from Cloudinary library." });
                                }}
                                trigger={
                                  <Button type="button" variant="outline" className="h-11 px-4 border border-slate-300 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                                    <Search className="h-4 w-4" /> Pick from Library
                                  </Button>
                                }
                              />

                              <label className="h-11 px-4 border border-dashed border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-yellow-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                                {uploading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4" /> Upload to Cloudinary
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  disabled={uploading}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Select an image from your Cloudinary asset library or upload a local file directly to Cloudinary.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label htmlFor="customSlug" className="text-xs font-bold text-slate-600 dark:text-slate-300">URL Slug (e.g. future-of-web)</Label>
                        <input
                          id="customSlug"
                          value={customSlug}
                          onChange={(e) => setCustomSlug(e.target.value)}
                          className={premiumInputStyle}
                          placeholder="Leave blank to generate slug from title automatically"
                        />
                      </div>
                    </div>

                    {/* Font Configuration Settings */}
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                        <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Font Family Typography Config</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold">Heading Font</Label>
                          <Input value={fontConfig.heading_font} onChange={e => setFontConfig(prev => ({ ...prev, heading_font: e.target.value }))} className="h-10 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold">Body Font</Label>
                          <Input value={fontConfig.body_font} onChange={e => setFontConfig(prev => ({ ...prev, body_font: e.target.value }))} className="h-10 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold">Hindi Font</Label>
                          <Input value={fontConfig.hindi_font} onChange={e => setFontConfig(prev => ({ ...prev, hindi_font: e.target.value }))} className="h-10 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold">Quote Font</Label>
                          <Input value={fontConfig.quote_font} onChange={e => setFontConfig(prev => ({ ...prev, quote_font: e.target.value }))} className="h-10 text-xs" />
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Configuration Configurator */}
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                      <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                        <BookOpen className="h-4.5 w-4.5 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Customizable Sidebar widgets Config</h4>
                      </div>
                      <div className="space-y-3">
                        {sidebarConfig.map((wid, idx) => (
                          <div key={wid.type} className="flex items-center justify-between p-3 border rounded-xl bg-background shadow-sm text-xs font-bold">
                            <span className="capitalize">{wid.type} Widget</span>
                            <div className="flex gap-2 items-center">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={wid.enabled} onChange={() => toggleSidebarWidget(idx)} className="rounded text-amber-500 h-4 w-4" />
                                <span>Active</span>
                              </label>
                              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveSidebarWidget(idx, 'up')}><ArrowUp className="h-3.5 w-3.5" /></Button>
                              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={idx === sidebarConfig.length - 1} onClick={() => moveSidebarWidget(idx, 'down')}><ArrowDown className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Block dynamic builder */}
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-6">
                      <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Article Content Blocks CMS Builder</h4>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {['heading', 'paragraph', 'quote', 'image', 'bullet-list', 'numbered-list', 'callout', 'key-points', 'code', 'table', 'faq', 'conclusion', 'video', 'divider'].map((type) => (
                            <Button key={type} type="button" size="sm" variant="outline" className="text-[10px] h-7 font-black capitalize border-amber-500/20" onClick={() => addBlock(type)}>
                              + {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Blocks listing */}
                      <div className="space-y-4">
                        {blocks.map((block, idx) => (
                          <div key={idx} className="border border-amber-200/50 rounded-xl p-4 bg-background shadow-sm space-y-3 relative">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground border-b pb-1">
                              <span>Block {idx + 1}: {block.type}</span>
                              <div className="flex gap-1 items-center">
                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => moveBlock(idx, 'up')}><ArrowUp className="h-3.5 w-3.5" /></Button>
                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === blocks.length - 1} onClick={() => moveBlock(idx, 'down')}><ArrowDown className="h-3.5 w-3.5" /></Button>
                                <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => removeBlock(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </div>

                            {/* Render block fields */}
                            {block.type === 'heading' && (
                              <div className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-3">
                                  <Select value={block.level} onValueChange={(val: any) => updateBlockProps(idx, { level: val })}>
                                    <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="h1">H1 Main</SelectItem>
                                      <SelectItem value="h2">H2 Section</SelectItem>
                                      <SelectItem value="h3">H3 Sub</SelectItem>
                                      <SelectItem value="h4">H4 Small</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="col-span-9">
                                  <Input value={block.content} onChange={e => updateBlockContent(idx, e.target.value)} placeholder="Heading text..." className="h-10 text-xs" />
                                </div>
                              </div>
                            )}

                            {block.type === 'paragraph' && (
                              <Textarea value={block.content} onChange={e => updateBlockContent(idx, e.target.value)} placeholder="Enter paragraph content..." className="min-h-[80px] text-xs resize-none" />
                            )}

                            {block.type === 'quote' && (
                              <div className="space-y-3 text-xs font-semibold">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground uppercase">Style Type</Label>
                                    <Select value={block.quote_style} onValueChange={(val: any) => updateBlockProps(idx, { quote_style: val })}>
                                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="left-border">Modern Left Border</SelectItem>
                                        <SelectItem value="glass">Premium Glass</SelectItem>
                                        <SelectItem value="elegant">Minimal Elegant</SelectItem>
                                        <SelectItem value="motivational">Highlighted Motivational</SelectItem>
                                        <SelectItem value="centered">Centered Big</SelectItem>
                                        <SelectItem value="colored">Colored Background</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground uppercase">Alignment</Label>
                                    <Select value={block.alignment} onValueChange={(val: any) => updateBlockProps(idx, { alignment: val })}>
                                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="right">Right</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground uppercase">Accent Color</Label>
                                    <Input value={block.accent_color} onChange={e => updateBlockProps(idx, { accent_color: e.target.value })} placeholder="#ef4444" className="h-9 text-xs font-mono" />
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-4">
                                    <input type="checkbox" id={`icon-${idx}`} checked={block.enable_icon} onChange={e => updateBlockProps(idx, { enable_icon: e.target.checked })} className="rounded text-amber-500 h-4 w-4" />
                                    <Label htmlFor={`icon-${idx}`} className="cursor-pointer">Enable Icon</Label>
                                  </div>
                                </div>
                                <Textarea value={block.content} onChange={e => updateBlockContent(idx, e.target.value)} placeholder="Quote text..." className="min-h-[70px] text-xs resize-none" />
                              </div>
                            )}

                            {(block.type === 'bullet-list' || block.type === 'numbered-list' || block.type === 'key-points') && (
                              <div className="space-y-2">
                                {block.items?.map((it, itemIdx) => (
                                  <div key={itemIdx} className="flex gap-2 items-center">
                                    <Input value={it} onChange={e => updateListItem(idx, itemIdx, e.target.value)} placeholder={`List item ${itemIdx + 1}`} className="h-9 text-xs" />
                                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeListItem(idx, itemIdx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                ))}
                                <Button type="button" size="sm" variant="ghost" className="text-[10px] h-7 font-black text-amber-600" onClick={() => addListItem(idx)}>+ Add List Item</Button>
                              </div>
                            )}

                            {(block.type === 'image' || block.type === 'image-caption') && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground uppercase">Image Address / URL</Label>
                                  <Input value={block.url} onChange={e => updateBlockProps(idx, { url: e.target.value })} placeholder="https://..." className="h-9 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-muted-foreground uppercase">Caption Text</Label>
                                  <Input value={block.caption} onChange={e => updateBlockProps(idx, { caption: e.target.value })} placeholder="Image summary description..." className="h-9 text-xs" />
                                </div>
                              </div>
                            )}

                            {block.type === 'code' && (
                              <Textarea value={block.content} onChange={e => updateBlockContent(idx, e.target.value)} placeholder="Paste code snippet here..." className="min-h-[100px] text-xs font-mono" />
                            )}

                            {block.type === 'conclusion' && (
                              <Textarea value={block.content} onChange={e => updateBlockContent(idx, e.target.value)} placeholder="Final conclusion summary..." className="min-h-[70px] text-xs resize-none" />
                            )}

                            {block.type === 'callout' && (
                              <Textarea value={block.content} onChange={e => updateBlockContent(idx, e.target.value)} placeholder="Highlighted callout message..." className="min-h-[70px] text-xs resize-none" />
                            )}

                            {block.type === 'video' && (
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Video Embed Source URL (e.g. YouTube embed)</Label>
                                <Input value={block.url} onChange={e => updateBlockProps(idx, { url: e.target.value })} placeholder="https://www.youtube.com/embed/..." className="h-9 text-xs" />
                              </div>
                            )}

                            {block.type === 'divider' && (
                              <div className="text-center py-2 text-xs text-muted-foreground font-semibold italic">Horizontal Rule Line Divider</div>
                            )}

                          </div>
                        ))}
                        {blocks.length === 0 && (
                          <div className="text-center py-6 text-xs text-muted-foreground italic">No content blocks added yet. Click one of the buttons above to build the article.</div>
                        )}
                      </div>
                    </div>

                    {/* SEO Fields */}
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800 gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4.5 w-4.5 text-amber-500" />
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">SEO Meta & Search Optimization</h4>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAutoGenerateSEO}
                          className="h-8 text-[11px] font-bold border-amber-200/50 text-amber-800 dark:text-yellow-400 hover:bg-amber-500/10 gap-1 rounded-lg"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Auto-Fill SEO Meta
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* SEO Inputs */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="space-y-1">
                            <Label htmlFor="focusKeyphrase" className="text-xs font-bold text-slate-600 dark:text-slate-300">Focus Keyphrase</Label>
                            <input
                              id="focusKeyphrase"
                              value={focusKeyphrase}
                              onChange={(e) => setFocusKeyphrase(e.target.value)}
                              className={premiumInputStyle}
                              placeholder="e.g. web architecture"
                            />
                            <p className="text-[10px] text-muted-foreground">The main keyword phrase you want this article to rank for.</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="metaTitle" className="text-xs font-bold text-slate-600 dark:text-slate-300">Meta Title</Label>
                              <span className={`text-[10px] font-bold ${isTitleLengthIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {metaTitle.length} / 60 chars
                              </span>
                            </div>
                            <input
                              id="metaTitle"
                              value={metaTitle}
                              onChange={(e) => setMetaTitle(e.target.value)}
                              className={premiumInputStyle}
                              placeholder="SEO Browser Title tag"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="keywords" className="text-xs font-bold text-slate-600 dark:text-slate-300">Keywords (comma separated)</Label>
                            <input
                              id="keywords"
                              value={keywords}
                              onChange={(e) => setKeywords(e.target.value)}
                              className={premiumInputStyle}
                              placeholder="e.g. web architecture, SSR, React"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="metaDescription" className="text-xs font-bold text-slate-600 dark:text-slate-300">Meta Description</Label>
                              <span className={`text-[10px] font-bold ${isDescLengthIdeal ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {metaDescription.length} / 160 chars
                              </span>
                            </div>
                            <textarea
                              id="metaDescription"
                              value={metaDescription}
                              onChange={(e) => setMetaDescription(e.target.value)}
                              className="w-full h-20 border border-slate-200 dark:border-slate-800 rounded-xl bg-background p-3 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500 outline-none shadow-sm font-semibold transition-all resize-none"
                              placeholder="SEO Google snippet summary..."
                            />
                          </div>
                        </div>

                        {/* Preview and Analysis */}
                        <div className="lg:col-span-5 space-y-4">
                          {/* Google Snippet Card */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2.5">Google Search Preview</span>
                            <div className="font-sans text-left space-y-1 select-none">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <span className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500">G</span>
                                <span className="truncate">xmartycreator.com › blogs › {customSlug || 'slug'}</span>
                              </div>
                              <h3 className="text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate">
                                {metaTitle || cleanTitleText || 'Article Headline'}
                              </h3>
                              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                                {metaDescription || cleanExcerptText || 'Start writing your post content to see the live Google snippet preview.'}
                              </p>
                            </div>
                          </div>

                          {/* SEO Checklist */}
                          <div className="bg-slate-100/50 dark:bg-slate-900/30 border rounded-xl p-4 space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">SEO Analysis Checklist</span>

                            <div className="space-y-2 text-xs font-semibold">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Keyphrase configured</span>
                                {hasKeyphrase ? (
                                  <Check className="h-4 w-4 text-emerald-500 font-bold" />
                                ) : (
                                  <X className="h-4 w-4 text-rose-500" />
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Keyphrase in Title</span>
                                {keyphraseInTitle ? (
                                  <Check className="h-4 w-4 text-emerald-500 font-bold" />
                                ) : (
                                  <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Keyphrase in Meta Desc</span>
                                {keyphraseInDesc ? (
                                  <Check className="h-4 w-4 text-emerald-500 font-bold" />
                                ) : (
                                  <X className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Title length (40-60 chars)</span>
                                {isTitleLengthIdeal ? (
                                  <Check className="h-4 w-4 text-emerald-500 font-bold" />
                                ) : (
                                  <X className="h-4 w-4 text-amber-500" />
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Description length (120-160)</span>
                                {isDescLengthIdeal ? (
                                  <Check className="h-4 w-4 text-emerald-500 font-bold" />
                                ) : (
                                  <X className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title field with FontColorPicker */}
                    <div className="space-y-1">
                      <Label htmlFor="title" className="text-xs font-bold text-slate-600 dark:text-slate-300">Title / Heading</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Article Headline"
                          className="h-11 border border-slate-200 dark:border-slate-800 rounded-xl bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500 outline-none w-full shadow-sm font-semibold transition-all"
                          style={{
                            fontFamily: titleFont || undefined,
                            color: titleColor || undefined,
                          }}
                        />
                        <FontColorPicker
                          font={titleFont}
                          color={titleColor}
                          onChange={(f, c) => { setTitleFont(f); setTitleColor(c); }}
                          previewText={title || 'Article Headline'}
                        />
                      </div>
                    </div>

                    {/* Excerpt field with FontColorPicker */}
                    <div className="space-y-1">
                      <Label htmlFor="excerpt" className="text-xs font-bold text-slate-600 dark:text-slate-300">Excerpt / Short Description</Label>
                      <div className="flex gap-2 items-start">
                        <Textarea
                          id="excerpt"
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Brief summary of the post..."
                          className="w-full h-20 border border-slate-200 dark:border-slate-800 rounded-xl bg-background p-3 text-sm focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500 outline-none shadow-sm font-semibold transition-all resize-none"
                          style={{
                            fontFamily: excerptFont || undefined,
                            color: excerptColor || undefined,
                          }}
                        />
                        <FontColorPicker
                          font={excerptFont}
                          color={excerptColor}
                          onChange={(f, c) => { setExcerptFont(f); setExcerptColor(c); }}
                          previewText={excerpt || 'Brief summary...'}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                      />
                      <Label htmlFor="featured" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                        Promote to Featured Article (highlighted preview tag)
                      </Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button type="button" variant="ghost" size="sm" className="font-bold text-xs" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4">
                        <Save className="h-3.5 w-3.5 mr-1" /> Publish Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
