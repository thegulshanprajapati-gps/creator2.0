'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Loader2, Image as ImageIcon, Upload, MonitorPlay, CheckCircle2, AlertTriangle, Library, LayoutTemplate, Plus, Trash2, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePicker } from "@/components/admin/image-picker";
import { PAGE_SCHEMAS, SectionSchema, FieldSchema } from "@/lib/cms-schema";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavingOverlay } from "@/components/saving-overlay";

export default function PageEditor() {
  const { pageId } = useParams();
  const router = useRouter();
  const pageSlug = String(pageId).toLowerCase();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'active' | 'error'>('checking');
  
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [isDragging, setIsDragging] = useState<Record<string, boolean>>({});
  const [imageUploading, setImageUploading] = useState<Record<string, boolean>>({});
  const [previewWidth, setPreviewWidth] = useState('100%');
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [heroViewType, setHeroViewType] = useState<'desktop' | 'mobile'>('desktop');
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  const handleGenerateSeo = async () => {
    setGeneratingSeo(true);
    toast({ title: 'AI SEO Assistant', description: 'Generating optimized meta title, description and keywords...' });
    
    try {
      let pageContext = '';
      if (content) {
        Object.keys(content).forEach(sKey => {
          if (sKey !== 'seo') {
            Object.keys(content[sKey]).forEach(fKey => {
              const val = content[sKey][fKey];
              if (val && typeof val === 'string' && !val.trim().startsWith('{') && !val.trim().startsWith('[')) {
                const cleanVal = val.replace(/<\/?[^>]+(>|$)/g, "");
                if (cleanVal.length > 5) pageContext += `${sKey} ${fKey}: ${cleanVal}\n`;
              }
            });
          }
        });
      }

      const { generateSeoAction } = await import('@/ai/flows/generate-seo');
      const result = await generateSeoAction(pageSlug, pageContext);
      
      setContent(prev => ({
        ...prev,
        seo: {
          ...(prev.seo || {}),
          title: result.title,
          description: result.description,
          keywords: result.keywords
        }
      }));

      toast({ title: 'Success', description: 'SEO Metadata successfully generated with AI! Click "Publish Changes" to save.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Generation failed', description: err.message || String(err) });
    } finally {
      setGeneratingSeo(false);
    }
  };

  const schemas: SectionSchema[] = PAGE_SCHEMAS[pageSlug] || [];
  const defaultTab = schemas.length > 0 ? schemas[0].key : 'preview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (!pageSlug) return;
    fetchContent();
  }, [pageSlug]);

  const fetchContent = async () => {
    setLoading(true);
    setDbStatus('checking');
    try {
      const res = await fetch('/api/mongodb-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'find',
          collection: 'content_blocks',
          filter: { page_slug: pageSlug } 
        })
      });
      
      const { data, error } = await res.json();
      if (error) throw new Error(error);

      setDbStatus('active');

      const loadedContent: Record<string, Record<string, string>> = {};
      
      schemas.forEach(section => {
        loadedContent[section.key] = {};
        section.fields.forEach(field => {
          if (field.type === 'list') {
            loadedContent[section.key][field.key] = '[]';
          } else {
            loadedContent[section.key][field.key] = '';
          }
        });
      });

      if (data && Array.isArray(data)) {
        data.forEach((block: any) => {
          if (!loadedContent[block.section_key]) {
            loadedContent[block.section_key] = {};
          }
          const rawVal = (block.type === 'json' || block.type === 'list')
            ? (block.json_value !== undefined && block.json_value !== null ? block.json_value : block.value)
            : block.value;

          loadedContent[block.section_key][block.content_key] = (block.type === 'json' || block.type === 'list')
            ? (typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal || '[]'))
            : String(rawVal || '');
        });
      }
      
      setContent(loadedContent);
    } catch (err: any) {
      setDbStatus('error');
      toast({ variant: 'destructive', title: 'DB Connection Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    if (!pageSlug) return;
    setSaving(true);
    setSaveStatus('saving');
    setSaveProgress(0);
    setSaveErrorMessage('');
    
    try {
      const blocksToSave: any[] = [];
      
      Object.keys(content).forEach(sectionKey => {
        Object.keys(content[sectionKey]).forEach(fieldKey => {
          const val = content[sectionKey][fieldKey];
          if (val === undefined || val === null) return;
          
          let fieldType = 'text';
          const sectionSchema = schemas.find(s => s.key === sectionKey);
          if (sectionSchema) {
            const fieldSchema = sectionSchema.fields.find(f => f.key === fieldKey);
            if (fieldSchema) fieldType = fieldSchema.type;
          }

          let finalValue: any = val;
          if (fieldType === 'json' || fieldType === 'list') {
            try {
              finalValue = val ? JSON.parse(val) : null;
            } catch (e) {
              throw new Error(`Invalid JSON in section [${sectionKey}], field [${fieldKey}]`);
            }
          }

          blocksToSave.push({
            section_key: sectionKey,
            content_key: fieldKey,
            type: fieldType,
            value: finalValue
          });
        });
      });

      if (blocksToSave.length === 0) {
        setSaveProgress(100);
        setSaveStatus('success');
        setTimeout(() => {
          setSaveStatus('idle');
          setSaving(false);
        }, 1000);
        return;
      }

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

      for (let i = 0; i < blocksToSave.length; i++) {
        const block = blocksToSave[i];
        if (block.value === null || block.value === '') {
          const progress = Math.round(((i + 1) / blocksToSave.length) * 100);
          setSaveProgress(progress);
          continue; 
        }
        
        const res = await fetch('/api/mongodb-gateway', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            action: 'upsert',
            collection: 'content_blocks',
            filter: { page_slug: pageSlug, section_key: block.section_key, content_key: block.content_key },
            data: { 
              page_slug: pageSlug, 
              section_key: block.section_key, 
              content_key: block.content_key, 
              type: block.type, 
              value: block.type === 'json' || block.type === 'list' ? null : block.value,
              json_value: block.type === 'json' || block.type === 'list' ? block.value : null,
              updated_at: new Date()
            }
          })
        });
        const { error } = await res.json();
        if (error) throw new Error(`Failed to save ${block.content_key}: ${error}`);

        const progress = Math.round(((i + 1) / blocksToSave.length) * 100);
        setSaveProgress(progress);
        // Small delay to make progress visually smooth and premium
        await new Promise(r => setTimeout(r, 80));
      }

      setSaveStatus('success');
      toast({ title: 'Success', description: 'Page content saved successfully!', variant: 'default' });
      setTimeout(() => {
        setSaveStatus('idle');
        setSaving(false);
      }, 1500);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveErrorMessage(err.message || String(err));
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
      // Revert state by fetching original saved values from DB
      await fetchContent();
    }
  };

  const handleImageUpload = async (file: File, sectionKey: string, fieldKey: string, listIndex?: number, listSubKey?: string) => {
    if (!file) return;
    
    const uploadKey = listIndex !== undefined ? `${sectionKey}-${fieldKey}-${listIndex}-${listSubKey}` : `${sectionKey}-${fieldKey}`;
    setImageUploading(prev => ({ ...prev, [uploadKey]: true }));
    toast({ title: 'Uploading', description: 'Uploading image to Cloudinary...' });
    
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('asset_type', 'image');

      const response = await fetch('/api/cloudinary-upload', {
        method: 'POST',
        body: uploadForm,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cloudinary upload failed.');

      const fileUrl = data.secure_url || data.url || '';
      
      if (listIndex !== undefined && listSubKey) {
        handleListChange(sectionKey, fieldKey, listIndex, listSubKey, fileUrl);
      } else {
        handleContentChange(sectionKey, fieldKey, fileUrl);
      }
      
      toast({ title: 'Success', description: 'Image uploaded successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setImageUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleContentChange = (sectionKey: string, fieldKey: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldKey]: value
      }
    }));
  };

  const parseList = (val: any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string') return [];
    try {
      const parsed = JSON.parse(val);
      const res = Array.isArray(parsed) ? parsed : [];
      return res;
    } catch (e) {
      return [];
    }
  };

  const handleListChange = (sectionKey: string, fieldKey: string, index: number, subFieldKey: string, value: string) => {
    const listStr = content[sectionKey]?.[fieldKey] || '[]';
    const listData = parseList(listStr);
    listData[index] = { ...listData[index], [subFieldKey]: value };
    handleContentChange(sectionKey, fieldKey, JSON.stringify(listData));
  };

  const handleAddListItem = (sectionKey: string, fieldKey: string, itemFields: FieldSchema[]) => {
    const listStr = content[sectionKey]?.[fieldKey] || '[]';
    const listData = parseList(listStr);
    const newItem: any = {};
    itemFields.forEach(f => { newItem[f.key] = ''; });
    listData.push(newItem);
    handleContentChange(sectionKey, fieldKey, JSON.stringify(listData));
  };

  const handleRemoveListItem = (sectionKey: string, fieldKey: string, index: number) => {
    const listStr = content[sectionKey]?.[fieldKey] || '[]';
    const listData = parseList(listStr);
    listData.splice(index, 1);
    handleContentChange(sectionKey, fieldKey, JSON.stringify(listData));
  };

  const handleMoveListItem = (sectionKey: string, fieldKey: string, index: number, direction: -1 | 1) => {
    const listStr = content[sectionKey]?.[fieldKey] || '[]';
    const listData = parseList(listStr);
    if (index + direction < 0 || index + direction >= listData.length) return;
    const temp = listData[index];
    listData[index] = listData[index + direction];
    listData[index + direction] = temp;
    handleContentChange(sectionKey, fieldKey, JSON.stringify(listData));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="h-12 w-12 text-primary opacity-50" />
        </motion.div>
      </div>
    );
  }

  const renderField = (field: FieldSchema, sectionKey: string, val: string, listIndex?: number, listSubFieldKey?: string, parentListFieldKey?: string) => {
    const isListMode = listIndex !== undefined && listSubFieldKey !== undefined;
    const effectiveVal = val;
    
    const handleChange = (e: any) => {
      const v = typeof e === 'string' ? e : e.target.value;
      if (isListMode && parentListFieldKey) {
        handleListChange(sectionKey, parentListFieldKey, listIndex, listSubFieldKey, v);
      } else {
        handleContentChange(sectionKey, field.key, v);
      }
    };

    if (field.type === 'text') {
      const isColorField = field.key.toLowerCase().endsWith('color') || 
                           field.key.toLowerCase().endsWith('bg') || 
                           field.key.toLowerCase().includes('colour');
                           
      if (isColorField) {
        return (
          <div className="flex gap-2 items-center w-full">
            <div className="relative flex-1">
              <Input
                value={effectiveVal}
                onChange={handleChange}
                placeholder={field.placeholder || "e.g. #FF0000, hsl(var(--primary)) or transparent"}
                className="h-10 rounded-xl text-sm pl-11 pr-10 border-primary/10 bg-background shadow-sm"
              />
              <div 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full border border-primary/10 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800"
                style={{ backgroundColor: effectiveVal && effectiveVal !== 'transparent' ? effectiveVal : 'transparent' }}
              >
                {!effectiveVal || effectiveVal === 'transparent' ? (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[7px] font-bold text-muted-foreground">None</div>
                ) : null}
                <input 
                  type="color" 
                  value={effectiveVal && effectiveVal.startsWith('#') && (effectiveVal.length === 7 || effectiveVal.length === 4) ? effectiveVal : '#3b82f6'} 
                  onChange={(e) => handleChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              {effectiveVal && (
                <button 
                  type="button"
                  onClick={() => handleChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                  title="Clear color"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      }

      return (
        <Input
          value={effectiveVal}
          onChange={handleChange}
          placeholder={field.placeholder}
          className="h-10 rounded-xl text-sm px-4 border-primary/10 bg-background shadow-sm"
        />
      );
    }
    
    if (field.type === 'textarea') {
      return (
        <Textarea
          value={effectiveVal}
          onChange={handleChange}
          placeholder={field.placeholder}
          className="min-h-[90px] rounded-xl text-sm px-4 py-3 border-primary/10 bg-background shadow-sm resize-y"
        />
      );
    }

    if (field.type === 'richtext') {
      return (
        <RichTextEditor
          value={effectiveVal}
          onChange={handleChange}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === 'json') {
      return (
        <Textarea
          value={effectiveVal}
          onChange={handleChange}
          placeholder={field.placeholder || '{\n  // Valid JSON expected\n}'}
          className="font-mono min-h-[160px] rounded-xl px-4 py-3 border-primary/10 bg-background shadow-sm resize-y text-xs"
        />
      );
    }

    if (field.type === 'select') {
      const options = field.options || [];
      const isCustomValue = effectiveVal && !options.includes(effectiveVal);
      
      return (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full">
          <div className="relative flex-1">
            <Select
              value={isCustomValue ? 'custom' : (effectiveVal || undefined)}
              onValueChange={(val) => {
                if (val === 'custom') {
                  handleChange('custom');
                } else {
                  handleChange(val);
                }
              }}
            >
              <SelectTrigger className="w-full h-10 rounded-xl text-sm px-4 border border-primary/10 bg-background shadow-sm">
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-primary/10">
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </SelectItem>
                ))}
                {field.allowCustom && (
                  <SelectItem value="custom">Custom Role...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {(isCustomValue || effectiveVal === 'custom') && (
            <Input
              value={effectiveVal === 'custom' ? '' : effectiveVal}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter custom role"
              className="h-10 rounded-xl text-sm px-4 border-primary/10 bg-background shadow-sm flex-1 min-w-[150px] animate-in fade-in duration-300"
            />
          )}
          
          {field.allowCustom && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (isCustomValue || effectiveVal === 'custom') {
                  handleChange('');
                } else {
                  handleChange('custom');
                }
              }}
              className="h-10 w-full sm:w-10 rounded-xl border-primary/10 bg-background text-sm flex items-center justify-center font-bold text-primary shadow-sm hover:bg-primary/10 transition-colors shrink-0"
              title={(isCustomValue || effectiveVal === 'custom') ? "Cancel Custom Role" : "Add Custom Role"}
            >
              {(isCustomValue || effectiveVal === 'custom') ? '✖' : '+'}
            </Button>
          )}
        </div>
      );
    }

    if (field.type === 'image') {
      const uploadKey = isListMode ? `${sectionKey}-${field.key}-${listIndex}-${listSubFieldKey}` : `${sectionKey}-${field.key}`;
      const isDrag = isDragging[uploadKey];
      const isUploading = imageUploading[uploadKey];

      let imgData = { url: '', alt: '', width: '', height: '' };
      try {
        if (effectiveVal && effectiveVal.trim().startsWith('{')) {
          imgData = { ...imgData, ...JSON.parse(effectiveVal) };
        } else {
          imgData.url = effectiveVal || '';
        }
      } catch (e) {
        imgData.url = effectiveVal || '';
      }

      const updateImgData = (key: string, v: string) => {
        const nextData = { ...imgData, [key]: v };
        // If alt, width, and height are empty, we can just save the plain URL to keep it simple, 
        // but saving the stringified JSON is more robust.
        const serialized = JSON.stringify(nextData);
        if (isListMode && parentListFieldKey) {
          handleListChange(sectionKey, parentListFieldKey, listIndex, listSubFieldKey, serialized);
        } else {
          handleContentChange(sectionKey, field.key, serialized);
        }
      };

      return (
        <div className="space-y-4 border border-primary/5 rounded-3xl p-6 bg-muted/10">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(prev => ({...prev, [uploadKey]: true})); }}
            onDragLeave={() => setIsDragging(prev => ({...prev, [uploadKey]: false}))}
            onDrop={(e) => { 
              e.preventDefault(); 
              setIsDragging(prev => ({...prev, [uploadKey]: false})); 
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageUpload(e.dataTransfer.files[0], sectionKey, isListMode ? parentListFieldKey! : field.key, listIndex, listSubFieldKey);
              }
            }}
            className={`relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 ${isDrag ? 'border-primary shadow-xl scale-[1.02]' : 'border-border shadow-sm'}`}
          >
            <div className="aspect-[4/3] max-h-64 bg-muted relative">
              {imgData.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgData.url} alt={imgData.alt || field.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-primary/5">
                  <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                  <span>No image selected</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <input
                  id={`upload-${uploadKey}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], sectionKey, isListMode ? parentListFieldKey! : field.key, listIndex, listSubFieldKey)}
                  className="hidden"
                />
                <label htmlFor={`upload-${uploadKey}`} className="cursor-pointer text-white flex flex-col items-center p-6 rounded-3xl hover:bg-white/10 transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 animate-spin mb-2" />
                  ) : (
                    <Upload className="h-10 w-10 mb-2" />
                  )}
                  <span className="font-bold text-lg">{isUploading ? 'Uploading...' : 'Replace Image'}</span>
                  <span className="text-sm text-white/70">Drag & Drop or Click</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={imgData.url}
              onChange={(e) => updateImgData('url', e.target.value)}
              placeholder="Image URL"
              className="flex-1 h-10 rounded-xl text-sm px-4"
            />
            <ImagePicker 
              onSelect={(url) => updateImgData('url', url)} 
              trigger={
                <Button variant="outline" className="h-10 px-4 rounded-xl border-border bg-muted/20 hover:bg-muted/50 font-bold shrink-0">
                  <Library className="h-4.5 w-4.5 mr-1.5 text-primary" />
                  Library
                </Button>
              }
            />
            {imgData.url && (
              <Button 
                variant="destructive" 
                onClick={() => updateImgData('url', '')} 
                className="h-10 px-4 rounded-xl font-bold shrink-0"
                title="Clear selected image"
              >
                <Trash2 className="h-4.5 w-4.5 mr-1.5" />
                Clear
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Alt Text</Label>
              <Input
                value={imgData.alt}
                onChange={(e) => updateImgData('alt', e.target.value)}
                placeholder="Image description"
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Width (px/%)</Label>
              <Input
                value={imgData.width}
                onChange={(e) => updateImgData('width', e.target.value)}
                placeholder="e.g. 600 or 100%"
                className="h-10 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Height (px/auto)</Label>
              <Input
                value={imgData.height}
                onChange={(e) => updateImgData('height', e.target.value)}
                placeholder="e.g. 400 or auto"
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-background/95 relative">
        {/* Background blur decorative elements */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-32 -right-20 w-[300px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px]" />
          <div className="absolute bottom-32 -left-20 w-[250px] h-[250px] bg-accent/[0.05] rounded-full blur-[100px]" />
        </div>
        <header className="flex min-h-16 h-auto py-3 md:py-0 md:h-16 shrink-0 items-center gap-2 border-b border-primary/10 bg-background/50 backdrop-blur-xl px-3 md:px-6 sticky top-0 z-50 transition-all duration-300">
          <div className="flex items-center gap-1.5 shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-xl hover:bg-primary/10 shrink-0">
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          </div>
          <div className="flex-1 flex flex-row items-center justify-between gap-2.5 min-w-0">
            <div className="flex flex-row items-center gap-2 min-w-0">
              <h1 className="font-headline font-bold text-xs md:text-lg tracking-tight text-foreground truncate">
                Editing <span className="text-primary capitalize">{pageSlug}</span>
              </h1>
              <div className="hidden sm:flex gap-1.5 items-center flex-wrap shrink-0">
                {dbStatus === 'checking' && <Badge variant="outline" className="text-muted-foreground text-[9px] md:text-[10px] h-5"><Loader2 className="h-3 w-3 mr-1 animate-spin"/> Connecting</Badge>}
                {dbStatus === 'active' && <Badge className="bg-emerald-500/10 text-emerald-500 border-none shadow-sm rounded-lg px-2 py-0.5 font-bold text-[9px] md:text-[10px] h-5"><CheckCircle2 className="h-3 w-3 mr-1"/> MongoDB Active</Badge>}
                {dbStatus === 'error' && <Badge className="bg-destructive/10 text-destructive border-none shadow-sm rounded-lg px-2 py-0.5 font-bold text-[9px] md:text-[10px] h-5"><AlertTriangle className="h-3 w-3 mr-1"/> DB Offline</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end shrink-0">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
                <Button size="icon" onClick={saveContent} disabled={saving || dbStatus === 'error' || schemas.length === 0} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center w-10 h-10 shrink-0 transition-all" title="Save Changes">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="p-3 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-10 relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="sm:hidden w-full">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-11 rounded-xl border border-primary/10 bg-background shadow-sm font-bold">
                  <SelectValue placeholder="Select section..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-primary/10">
                  {schemas.map(section => (
                    <SelectItem key={section.key} value={section.key} className="font-bold">
                      {section.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="preview" className="font-bold">Live Preview</SelectItem>
                  <SelectItem value="assets" className="font-bold">Global Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <TabsList className="hidden sm:flex bg-muted/40 p-1 md:p-1.5 !h-auto rounded-xl md:rounded-2xl flex-nowrap w-full items-center justify-start gap-1 md:gap-1.5 border border-primary/5 shadow-inner overflow-x-auto scrollbar-none py-1.5">
              {schemas.map(section => (
                <TabsTrigger key={section.key} value={section.key} className="font-sans flex-shrink-0 rounded-lg md:rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all py-1.5 md:py-2 px-3 md:px-4 whitespace-nowrap h-8 md:h-10 flex items-center justify-center text-xs md:text-sm">
                  {section.label}
                </TabsTrigger>
              ))}
              <TabsTrigger value="preview" className="font-sans flex-shrink-0 rounded-lg md:rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all py-1.5 md:py-2 px-3 md:px-4 whitespace-nowrap h-8 md:h-10 flex items-center justify-center text-xs md:text-sm">
                Live Preview
              </TabsTrigger>
              <TabsTrigger value="assets" className="font-sans flex-shrink-0 rounded-lg md:rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all py-1.5 md:py-2 px-3 md:px-4 whitespace-nowrap h-8 md:h-10 flex items-center justify-center text-xs md:text-sm">
                Global Assets
              </TabsTrigger>
            </TabsList>

            {schemas.length === 0 && (
              <div className="rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 p-12 text-center text-primary font-medium mt-10">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No schema defined for this page yet.
              </div>
            )}

            {schemas.map(section => (
              <TabsContent key={section.key} value={section.key} className="space-y-8 mt-0 outline-none">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Card className="border-primary/10 shadow-2xl shadow-primary/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-background to-muted/20 backdrop-blur-sm">
                    <CardHeader className="border-b border-primary/5 bg-primary/5 pb-4 md:pb-8 pt-6 md:pt-10 px-4 md:px-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
                          <LayoutTemplate className="h-7 w-7" />
                        </div>
                        <div>
                          <CardTitle className="font-headline text-xl md:text-3xl">{section.label}</CardTitle>
                          {section.description && <CardDescription className="text-base mt-1">{section.description}</CardDescription>}
                        </div>
                      </div>
                      {section.key === 'seo' && (
                        <Button 
                           onClick={handleGenerateSeo} 
                           disabled={generatingSeo} 
                           className="bg-primary/95 text-primary-foreground font-bold shadow-md hover:bg-primary rounded-xl flex items-center gap-2 px-5 h-11 transition-all"
                        >
                          {generatingSeo ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                          ) : (
                            <><Sparkles className="h-4 w-4" /> Generate with AI</>
                          )}
                        </Button>
                      )}
                    </CardHeader>
                    
                    <CardContent className="p-4 md:p-6">
                      {section.key === 'hero' && (
                        <div className="mb-8 border border-primary/10 rounded-[2rem] p-4 bg-muted/30">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <Label className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 ml-2">Hero Section View</Label>
                              <p className="text-xs text-muted-foreground ml-2 mt-1">Configure content specific to Desktop or Mobile screens.</p>
                            </div>
                            <div className="w-full sm:w-64">
                              <Select value={heroViewType} onValueChange={(v: 'desktop' | 'mobile') => setHeroViewType(v)}>
                                <SelectTrigger className="w-full h-12 rounded-xl border border-primary/20 bg-background shadow-sm font-bold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-primary/10">
                                  <SelectItem value="desktop" className="font-medium">🖥️ Desktop View</SelectItem>
                                  <SelectItem value="mobile" className="font-medium">📱 Mobile View</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 w-full min-w-0">
                        {section.fields.map(field => {
                          const val = content[section.key]?.[field.key] || '';
                          
                          if (section.key === 'hero') {
                            const isMobileField = field.key === 'mobileImage' || field.key === 'carouselSlides';
                            if (heroViewType === 'desktop' && isMobileField) return null;
                            if (heroViewType === 'mobile' && !isMobileField) return null;
                          }

                          if (field.type === 'list' && field.itemFields) {
                            const listData = parseList(val);
                            
                            return (
                              <div key={field.key} className="space-y-6 col-span-full border border-primary/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-background shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                                  <div>
                                    <h3 className="font-headline text-lg sm:text-xl font-bold">{field.label}</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage multiple items. Reorder them below.</p>
                                  </div>
                                  <Button onClick={() => handleAddListItem(section.key, field.key, field.itemFields!)} variant="secondary" className="rounded-xl shadow-sm font-bold px-5 w-full sm:w-auto">
                                    <Plus className="h-4 w-4 mr-2" /> Add Item
                                  </Button>
                                </div>
                                
                                {listData.length === 0 ? (
                                  <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground">
                                    <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No items added yet.
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    {listData.map((item: any, idx: number) => (
                                      <div key={idx} className="relative group border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-muted/10 transition-colors hover:border-primary/30">
                                        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-bold">Item {idx + 1}</Badge>
                                            <div className="flex items-center gap-0.5 border border-primary/5 rounded-lg bg-background/50 p-0.5 shadow-sm">
                                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded" onClick={() => handleMoveListItem(section.key, field.key, idx, -1)} disabled={idx === 0} title="Move Up">
                                                <ChevronUp className="h-4 w-4" />
                                              </Button>
                                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded" onClick={() => handleMoveListItem(section.key, field.key, idx, 1)} disabled={idx === listData.length - 1} title="Move Down">
                                                <ChevronDown className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl h-8 w-8" onClick={() => handleRemoveListItem(section.key, field.key, idx)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        
                                        <div className="grid gap-4 md:grid-cols-2">
                                          {field.itemFields!.map(subField => (
                                            <div key={subField.key} className={`space-y-2 w-full min-w-0 ${subField.type === 'richtext' || subField.type === 'textarea' ? 'col-span-full' : ''}`}>
                                              <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-0.5">{subField.label}</Label>
                                              {renderField(subField, section.key, item[subField.key] || '', idx, subField.key, field.key)}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          if (field.key === 'mobileImage' || field.key === 'image') {
                            return (
                              <div key={field.key} className="space-y-2 w-full min-w-0 col-span-full border border-primary/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-background shadow-sm">
                                <Label className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 ml-1">{field.label}</Label>
                                <p className="text-xs text-muted-foreground ml-1 mb-4">Configure the image shown on {field.key === 'mobileImage' ? 'mobile phones' : 'desktop computers'}.</p>
                                {renderField(field, section.key, val)}
                              </div>
                            );
                          }

                          return (
                            <div key={field.key} className={`space-y-4 ${field.type === 'richtext' || field.type === 'textarea' || field.type === 'json' ? 'col-span-full' : ''}`}>
                              <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">{field.label}</Label>
                              {renderField(field, section.key, val)}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            ))}

            <TabsContent value="preview" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-muted/20">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b bg-background px-8 py-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <MonitorPlay className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-headline">Live Preview</CardTitle>
                        <CardDescription>Previewing main site layout</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-2xl border border-primary/5">
                      <Button
                        size="sm"
                        variant={previewWidth === '100%' ? 'default' : 'ghost'}
                        className="rounded-xl font-bold px-4"
                        onClick={() => setPreviewWidth('100%')}
                      >
                        Desktop
                      </Button>
                      <Button
                        size="sm"
                        variant={previewWidth === '768px' ? 'default' : 'ghost'}
                        className="rounded-xl font-bold px-4"
                        onClick={() => setPreviewWidth('768px')}
                      >
                        Tablet
                      </Button>
                      <Button
                        size="sm"
                        variant={previewWidth === '375px' ? 'default' : 'ghost'}
                        className="rounded-xl font-bold px-4"
                        onClick={() => setPreviewWidth('375px')}
                      >
                        Mobile
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 bg-muted/10 flex justify-center items-center overflow-x-auto min-h-[850px]">
                    <div 
                      className="border border-primary/10 rounded-3xl shadow-lg bg-background overflow-hidden transition-all duration-300"
                      style={{ width: previewWidth, height: '800px' }}
                    >
                       <iframe 
                         src={`${process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'}/${pageSlug === 'home' ? '' : pageSlug}`}
                         className="w-full h-full border-0" 
                         title="Live Preview" 
                       />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="assets" className="mt-0 outline-none">
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="border-primary/10 shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden bg-background">
                  <CardHeader className="border-b border-primary/5 bg-primary/5 pb-8 pt-10 px-10">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <ImageIcon className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="font-headline text-3xl">Asset Library</CardTitle>
                        <CardDescription className="text-base mt-1">Manage global assets directly from Cloudinary.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 text-center space-y-4">
                    <p className="text-muted-foreground text-lg">Assets are securely managed via Cloudinary integration.</p>
                    <Button variant="outline" className="rounded-2xl h-12 px-6">
                      <a href={process.env.NEXT_PUBLIC_CLOUDINARY_GALLERY_URL || '#'} target="_blank" rel="noreferrer">
                        Open Cloudinary Console
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>

      <SavingOverlay 
        isVisible={saveStatus !== 'idle'}
        status={saveStatus === 'saving' ? 'saving' : saveStatus === 'success' ? 'success' : 'error'}
        progress={saveProgress}
        title="Publishing Changes"
        description="Uploading blocks to MongoDB Atlas..."
        successTitle="Successfully Published!"
        successDescription="All page blocks successfully updated in database."
        errorTitle="Publish Failed"
        errorDescription={saveErrorMessage}
        onClose={() => {
          setSaveStatus('idle');
          setSaving(false);
        }}
      />
    </SidebarProvider>
  );
}
