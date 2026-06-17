'use client';

import { useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCcw, Palette, Image as ImageIcon, FileSpreadsheet, Trash2, Info, Plus } from "lucide-react";
import { SavingOverlay } from "@/components/saving-overlay";

export default function CertificateTemplatePage() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [uploadingBg, setUploadingBg] = useState(false);

  // Editable settings structure for image background template
  const [settingsPayload, setSettingsPayload] = useState<any>({});
  const [certificateTemplate, setCertificateTemplate] = useState('');
  const [certLayoutLocked, setCertLayoutLocked] = useState(false);

  // Customizable dynamic PDF text styling states
  const [certFontFamily, setCertFontFamily] = useState('helvetica');
  const [certFontBold, setCertFontBold] = useState(true);
  const [certFontItalic, setCertFontItalic] = useState(false);
  const [certFontColor, setCertFontColor] = useState('#cc3333');
  const [certTitleColor, setCertTitleColor] = useState('#1e3a8a');
  const [certExamColor, setCertExamColor] = useState('#33994c');

  // Certificate text layout coordinates states (X, Y mapped to 800x600 PDF canvas, Y is bottom-up)
  const [currentType, setCurrentType] = useState<'completion' | 'participation'>('completion');
  const [completionLayout, setCompletionLayout] = useState<any>({
    studentName: { x: 400, y: 310, fontSize: 26, color: '#cc3333' },
    examTitle: { x: 400, y: 200, fontSize: 20, color: '#33994c' },
    certificateId: { x: 50, y: 60, fontSize: 10, color: '#808080' },
    verificationKey: { x: 50, y: 45, fontSize: 10, color: '#808080' },
    dateOfCompletion: { x: 400, y: 120, fontSize: 12, color: '#808080' }
  });
  const [participationLayout, setParticipationLayout] = useState<any>({
    studentName: { x: 400, y: 310, fontSize: 26, color: '#cc3333' },
    examTitle: { x: 400, y: 200, fontSize: 20, color: '#33994c' },
    certificateId: { x: 50, y: 60, fontSize: 10, color: '#808080' },
    verificationKey: { x: 50, y: 45, fontSize: 10, color: '#808080' },
    dateOfCompletion: { x: 400, y: 120, fontSize: 12, color: '#808080' }
  });

  const certLayout = currentType === 'completion' ? completionLayout : participationLayout;
  const setCertLayout = (updater: any) => {
    if (currentType === 'completion') {
      if (typeof updater === 'function') {
        setCompletionLayout((prev: any) => updater(prev));
      } else {
        setCompletionLayout(updater);
      }
    } else {
      if (typeof updater === 'function') {
        setParticipationLayout((prev: any) => updater(prev));
      } else {
        setParticipationLayout(updater);
      }
    }
  };

  const [selectedField, setSelectedField] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // PowerPoint (.pptx) templates state
  const [pptxTemplates, setPptxTemplates] = useState<any[]>([]);
  const [uploadingPptx, setUploadingPptx] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/dashboard/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettingsPayload(data.settings);
        setCertificateTemplate(data.settings.certificate_template || '');
        setCertFontFamily(data.settings.cert_font_family || 'helvetica');
        setCertFontBold(data.settings.cert_font_bold !== false);
        setCertFontItalic(data.settings.cert_font_italic === true);
        setCertFontColor(data.settings.cert_font_color || '#cc3333');
        setCertTitleColor(data.settings.cert_title_color || '#1e3a8a');
        setCertExamColor(data.settings.cert_exam_color || '#33994c');
        setCertLayoutLocked(data.settings.cert_layout_locked === true);
        if (data.settings.cert_layout_completion) {
          setCompletionLayout(data.settings.cert_layout_completion);
        } else if (data.settings.cert_layout) {
          setCompletionLayout(data.settings.cert_layout);
        }
        if (data.settings.cert_layout_participation) {
          setParticipationLayout(data.settings.cert_layout_participation);
        } else if (data.settings.cert_layout) {
          setParticipationLayout(data.settings.cert_layout);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPptxTemplates = async () => {
    try {
      const res = await fetch('/api/dashboard/certificate-templates');
      const data = await res.json();
      if (data.success) {
        setPptxTemplates(data.templates || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchPptxTemplates()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const isConfirmed = await confirm({
      title: "Save Certificate Settings",
      message: "Are you sure you want to update the certificate templates and styling configurations?",
      confirmText: "Save Configuration",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setSaving(true);
    setSaveStatus('saving');
    setSaveProgress(20);
    setSaveErrorMessage('');

    const progressTimer = setInterval(() => {
      setSaveProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 100);

    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settingsPayload,
          certificate_template: certificateTemplate,
          cert_font_family: certFontFamily,
          cert_font_bold: certFontBold,
          cert_font_italic: certFontItalic,
          cert_font_color: certFontColor,
          cert_title_color: certTitleColor,
          cert_exam_color: certExamColor,
          cert_layout: completionLayout,
          cert_layout_completion: completionLayout,
          cert_layout_participation: participationLayout,
          cert_layout_locked: certLayoutLocked
        })
      });
      clearInterval(progressTimer);
      const data = await res.json();
      if (data.success) {
        setSaveProgress(100);
        setSaveStatus('success');
        toast({ title: "Settings Saved", description: "Certificate styling configurations successfully updated." });
        setTimeout(() => {
          setSaveStatus('idle');
          setSaving(false);
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to save configuration.');
      }
    } catch (e: any) {
      clearInterval(progressTimer);
      setSaveStatus('error');
      setSaveErrorMessage(e.message || String(e));
      toast({ variant: "destructive", title: "Save Failed", description: e.message });
    }
  };

  const handlePointerDown = (fieldKey: string, e: React.PointerEvent) => {
    if (certLayoutLocked) return;
    e.preventDefault();
    setSelectedField(fieldKey);
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (fieldKey: string, e: React.PointerEvent) => {
    if (certLayoutLocked) return;
    if (!containerRef.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Relative coordinates in container
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Convert to percentages first, then map to 800x600 coordinates
    let pctX = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    let pctY = Math.max(0, Math.min(100, (clientY / rect.height) * 100));
    
    // PDF coordinate conversion: x is 0 to 800 left-to-right, y is 0 to 600 bottom-to-top
    const x = Math.round((pctX / 100) * 800);
    const y = Math.round((1 - pctY / 100) * 600);
    
    setCertLayout((prev: any) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        x,
        y
      }
    }));
  };

  const handlePointerUp = (fieldKey: string, e: React.PointerEvent) => {
    if (certLayoutLocked) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePptxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify it is a PPTX or PPT file
    if (!file.name.endsWith('.pptx') && !file.name.endsWith('.ppt')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload only standard .pptx or .ppt files." });
      return;
    }

    const isConfirmed = await confirm({
      title: "Upload PowerPoint Template",
      message: `Do you want to upload "${file.name}"? This template will be used to generate PowerPoint credentials.`,
      confirmText: "Upload",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setUploadingPptx(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/dashboard/certificate-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            fileData: base64Data
          })
        });
        const data = await res.json();
        if (data.success) {
          toast({ title: "Template Uploaded", description: data.message });
          fetchPptxTemplates();
        } else {
          throw new Error(data.error || 'Failed to upload template.');
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: err.message });
      } finally {
        setUploadingPptx(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePptxDelete = async (type: string, filename: string) => {
    const isConfirmed = await confirm({
      title: "Delete PPTX Template",
      message: `Are you sure you want to delete the "${type}" template (${filename})? This will revert certificate generation to the default layout for this type.`,
      confirmText: "Delete",
      cancelText: "Delete Template"
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/dashboard/certificate-templates?type=${type}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Template Deleted", description: "PPTX certificate template deleted successfully." });
        fetchPptxTemplates();
      } else {
        throw new Error(data.error || 'Failed to delete template.');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const activeTemplate = pptxTemplates.find(t => t.type === currentType);
  const currentBackground = activeTemplate?.fileDataPng || '';

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">Certificate Templates</h1>
            <p className="text-xs text-muted-foreground font-medium">Manage graphic and PowerPoint designs for student certificates</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500 opacity-50" />
            </div>
          ) : (
            <>
              {/* Instructions and Guidelines for Templates */}
              <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-lg rounded-[2rem] bg-gradient-to-r from-amber-500/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Info className="h-5 w-5 text-amber-500" /> Certificate Template Integration Guide
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    You can use standard images as background overlays OR upload complete PowerPoint (`.pptx`) templates containing fields that are replaced dynamically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Supported Placeholders in PowerPoint files (use curly braces):</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                    <div className="p-2.5 rounded-xl border bg-background flex flex-col justify-center">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{`{name}`}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Student Name</span>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-background flex flex-col justify-center">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{`{Test}`}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Assessment Title</span>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-background flex flex-col justify-center">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{`{v-key}`}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Verification Key</span>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-background flex flex-col justify-center">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{`{c-id}`}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Certificate ID</span>
                    </div>
                    <div className="p-2.5 rounded-xl border bg-background flex flex-col justify-center">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{`{doc}`}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Date of Completion</span>
                    </div>
                  </div>
                  <p className="text-[11px] pt-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Note:</span> PowerPoint template files should be named containing either <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-500">participation</span> or <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-500">completion</span> to determine which certificate credential type it represents.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Interactive Drag and Drop Certificate Designer */}
                <Card className="border-slate-200 dark:border-white/5 shadow-xl rounded-[2.5rem] bg-background md:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="font-headline text-lg flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-amber-500" /> Interactive Certificate Layout Designer
                      </CardTitle>
                      <CardDescription>Drag labels directly on the template canvas or tweak coordinates below.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentType('completion');
                            setSelectedField(null);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentType === 'completion'
                              ? 'bg-amber-500 text-white shadow font-extrabold'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          Completion Layout
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentType('participation');
                            setSelectedField(null);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentType === 'participation'
                              ? 'bg-amber-500 text-white shadow font-extrabold'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                          }`}
                        >
                          Participation Layout
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Left: Designer Canvas (Spans 2 cols on lg screens) */}
                      <div className="lg:col-span-2 space-y-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Canvas Preview (800x600 PDF coordinates)</span>
                        <div 
                          ref={containerRef}
                          className="relative w-full aspect-[800/600] border rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/80 shadow-md select-none touch-none"
                        >
                           {currentBackground ? (
                            <img 
                              src={currentBackground} 
                              alt={`${currentType} Certificate PPTX Preview`} 
                              className="absolute inset-0 w-full h-full object-fill pointer-events-none" 
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                              <ImageIcon className="h-12 w-12 mb-3 text-amber-500/60 animate-pulse" />
                              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No PPTX Template Uploaded</h4>
                              <p className="text-xs max-w-xs mt-1 text-slate-500">Please upload a PowerPoint (.pptx) template under PowerPoint Templates below to load the canvas background layout preview.</p>
                            </div>
                          )}

                          {/* Render Draggable Fields */}
                          {Object.entries(certLayout).map(([key, config]: [string, any]) => {
                            const leftPct = (config.x / 800) * 100;
                            const topPct = (1 - config.y / 600) * 100; // y is bottom-up in pdf-lib
                            const isSelected = selectedField === key;
                            
                            const labels: Record<string, string> = {
                              studentName: "STUDENT NAME",
                              examTitle: "ASSESSMENT TITLE",
                              certificateId: "CERTIFICATE ID",
                              verificationKey: "VERIFICATION KEY",
                              dateOfCompletion: "DATE OF COMPLETION"
                            };

                            const sampleText: Record<string, string> = {
                              studentName: "John Doe",
                              examTitle: "Tailwind CSS Developer...",
                              certificateId: "CERT-XM987654",
                              verificationKey: "V-KEY-88776655",
                              dateOfCompletion: "June 11, 2026"
                            };

                            return (
                              <div
                                key={key}
                                onPointerDown={(e) => handlePointerDown(key, e)}
                                onPointerMove={(e) => handlePointerMove(key, e)}
                                onPointerUp={(e) => handlePointerUp(key, e)}
                                style={{
                                  left: `${leftPct}%`,
                                  top: `${topPct}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                                className={`absolute cursor-move select-none px-4 py-2 rounded-xl border font-bold text-center transition-all ${
                                  isSelected 
                                    ? 'bg-amber-500/20 border-amber-500 shadow-lg ring-4 ring-amber-500/10 z-30 scale-105' 
                                    : 'bg-background/95 hover:bg-background border-slate-200 dark:border-white/10 hover:border-amber-500/50 hover:shadow shadow-sm z-20'
                                }`}
                              >
                                <span className="text-[9px] block font-mono opacity-50 uppercase tracking-widest text-slate-500 dark:text-slate-400 pointer-events-none mb-0.5">
                                  {labels[key]}
                                </span>
                                <span 
                                  className="text-xs sm:text-sm truncate max-w-[180px] font-black block" 
                                  style={{ 
                                    color: config.color, 
                                    fontSize: `${Math.max(10, config.fontSize * 0.7)}px`,
                                    fontFamily: config.fontFamily === 'times' 
                                      ? 'Times New Roman, serif' 
                                      : config.fontFamily === 'courier' 
                                      ? 'Courier New, monospace' 
                                      : config.fontFamily === 'cursive' 
                                      ? 'Great Vibes, cursive' 
                                      : 'inherit'
                                  }}
                                >
                                  {sampleText[key]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Style Properties Control Panel */}
                      <div className="space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Properties Controls</span>
                          
                          {/* Selector for fields */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold">Select Placeholders to Configure</Label>
                            <select
                              value={selectedField || ''}
                              onChange={(e) => setSelectedField(e.target.value || null)}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            >
                              <option value="">-- Choose Element --</option>
                              <option value="studentName">Student Name</option>
                              <option value="examTitle">Assessment Title</option>
                              <option value="certificateId">Certificate ID</option>
                              <option value="verificationKey">Verification Key</option>
                              <option value="dateOfCompletion">Date of Completion</option>
                            </select>
                          </div>

                          {selectedField && certLayout[selectedField] ? (
                            <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                              <h4 className="font-bold text-xs capitalize text-amber-500">Styling: {selectedField.replace(/([A-Z])/g, ' $1')}</h4>
                              
                              {/* Position input grid */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-500">Coordinate X (0-800)</Label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="800"
                                    value={certLayout[selectedField].x}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setCertLayout((prev: any) => ({
                                        ...prev,
                                        [selectedField]: { ...prev[selectedField], x: Math.min(800, Math.max(0, val)) }
                                      }));
                                    }}
                                    className="w-full h-9 px-3 rounded-lg border text-xs font-bold bg-background focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-500">Coordinate Y (0-600)</Label>
                                  <input 
                                    type="number"
                                    min="0"
                                    max="600"
                                    value={certLayout[selectedField].y}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setCertLayout((prev: any) => ({
                                        ...prev,
                                        [selectedField]: { ...prev[selectedField], y: Math.min(600, Math.max(0, val)) }
                                      }));
                                    }}
                                    className="w-full h-9 px-3 rounded-lg border text-xs font-bold bg-background focus:outline-none"
                                  />
                                </div>
                              </div>

                              {/* Font size and color */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label className="text-[10px] font-bold text-slate-500">Font Size ({certLayout[selectedField].fontSize}px)</Label>
                                </div>
                                <input 
                                  type="range"
                                  min="8"
                                  max="72"
                                  value={certLayout[selectedField].fontSize}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 12;
                                    setCertLayout((prev: any) => ({
                                      ...prev,
                                      [selectedField]: { ...prev[selectedField], fontSize: val }
                                    }));
                                  }}
                                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-500">Text Hex Color</Label>
                                <div className="flex gap-2">
                                  <input 
                                    type="color"
                                    value={certLayout[selectedField].color}
                                    onChange={(e) => {
                                      setCertLayout((prev: any) => ({
                                        ...prev,
                                        [selectedField]: { ...prev[selectedField], color: e.target.value }
                                      }));
                                    }}
                                    className="h-9 w-10 border rounded-lg cursor-pointer bg-background p-0.5"
                                  />
                                  <input 
                                    type="text"
                                    value={certLayout[selectedField].color}
                                    onChange={(e) => {
                                      setCertLayout((prev: any) => ({
                                        ...prev,
                                        [selectedField]: { ...prev[selectedField], color: e.target.value }
                                      }));
                                    }}
                                    placeholder="#cc3333"
                                    className="flex-1 h-9 px-3 rounded-lg border text-xs font-mono font-bold uppercase focus:outline-none bg-background"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-500">Font Family</Label>
                                <select
                                  value={certLayout[selectedField].fontFamily || 'helvetica'}
                                  onChange={(e) => {
                                    setCertLayout((prev: any) => ({
                                      ...prev,
                                      [selectedField]: { ...prev[selectedField], fontFamily: e.target.value }
                                    }));
                                  }}
                                  className="w-full h-9 px-3 rounded-lg border text-xs font-semibold bg-background focus:outline-none"
                                >
                                  <option value="helvetica">Helvetica (Default)</option>
                                  <option value="times">Times Roman</option>
                                  <option value="courier">Courier</option>
                                  <option value="cursive">Great Vibes (Cursive)</option>
                                </select>
                              </div>

                            </div>
                          ) : (
                            <div className="p-6 rounded-2xl border border-dashed text-center text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-900/20">
                              Click any field badge on the certificate preview canvas to customize its coordinates and styles here.
                            </div>
                          )}
                        </div>

                        {/* Layout Lock option */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label className="text-xs font-bold block cursor-pointer" htmlFor="lock-layout-checkbox">Lock Coordinate Coordinates</Label>
                            <span className="text-[10px] text-muted-foreground block">Locks draggable labels on canvas to prevent accidental edits.</span>
                          </div>
                          <input 
                            id="lock-layout-checkbox"
                            type="checkbox"
                            checked={certLayoutLocked}
                            onChange={(e) => setCertLayoutLocked(e.target.checked)}
                            className="h-4 w-4 accent-amber-500 rounded cursor-pointer"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                          <Button 
                            type="button"
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 h-11 text-xs w-full shadow"
                          >
                            {saving ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                              <><Save className="h-4 w-4" /> Save Designer Layout</>
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={fetchSettings} 
                            className="rounded-xl flex items-center justify-center gap-1.5 font-bold h-11 text-xs w-full"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" /> Revert to Saved
                          </Button>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* PowerPoint Template Customizer */}
                <Card className="border-slate-200 dark:border-white/5 shadow-xl rounded-[2.5rem] bg-background">
                  <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b">
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> PowerPoint (.pptx) Templates
                    </CardTitle>
                    <CardDescription>Upload customized presentations for Certificate of Completion and Participation.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    
                    <div className="flex items-center justify-between">
                      <label className={`cursor-pointer bg-emerald-600 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-emerald-700 transition-all select-none shadow ${uploadingPptx ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingPptx ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                        ) : (
                          <><Plus className="h-3.5 w-3.5" /> Upload PPTX Template</>
                        )}
                        <input
                          type="file"
                          accept=".pptx,.ppt"
                          disabled={uploadingPptx}
                          className="hidden"
                          onChange={handlePptxUpload}
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      {['completion', 'participation'].map((type) => {
                        const template = pptxTemplates.find(t => t.type === type);
                        return (
                          <div 
                            key={type} 
                            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 ${
                              template ? 'border-emerald-500/20 dark:border-emerald-500/10' : 'border-dashed border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                                  type === 'completion' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                                }`}>
                                  {type}
                                </span>
                                {template && (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                    ● Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {template ? template.filename : `No ${type} presentation template uploaded`}
                              </p>
                              {template && (
                                <p className="text-[10px] text-muted-foreground">
                                  Updated: {new Date(template.updatedAt).toLocaleString()}
                                </p>
                              )}
                            </div>

                            {template && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handlePptxDelete(type, template.filename)}
                                className="h-8 w-8 text-rose-500 hover:text-rose-600 border-rose-500/20 hover:bg-rose-500/5 rounded-xl"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                </div>

              {/* PDF Dynamic Text Styling Card */}
              <Card className="border-slate-200 dark:border-white/5 shadow-xl rounded-[2.5rem] bg-background">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b">
                  <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Palette className="h-4 w-4 text-amber-500" /> PDF Dynamic Text Styling
                  </CardTitle>
                  <CardDescription>Customize typography settings for rendering student names, exams, and static label colors on generated PDFs.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Font Family Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="font-family" className="text-xs font-bold text-slate-700 dark:text-slate-300">Font Family</Label>
                        <select
                          id="font-family"
                          value={certFontFamily}
                          onChange={(e) => setCertFontFamily(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="helvetica">Helvetica (Default)</option>
                          <option value="times">Times Roman</option>
                          <option value="courier">Courier</option>
                        </select>
                      </div>

                      {/* Font Weight and Style */}
                      <div className="space-y-2 flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">Text Enhancements</span>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={certFontBold}
                              onChange={(e) => setCertFontBold(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                            Bold Student Name
                          </label>
                          
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={certFontItalic}
                              onChange={(e) => setCertFontItalic(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                            Italic Text
                          </label>
                        </div>
                      </div>

                      {/* Student Name Color */}
                      <div className="space-y-2">
                        <Label htmlFor="font-color" className="text-xs font-bold text-slate-700 dark:text-slate-300">Student Name Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="font-color-picker"
                            value={certFontColor}
                            onChange={(e) => setCertFontColor(e.target.value)}
                            className="h-10 w-12 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer bg-background p-1"
                          />
                          <input
                            type="text"
                            id="font-color"
                            value={certFontColor}
                            onChange={(e) => setCertFontColor(e.target.value)}
                            placeholder="#cc3333"
                            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* Certificate Title Color */}
                      <div className="space-y-2">
                        <Label htmlFor="title-color" className="text-xs font-bold text-slate-700 dark:text-slate-300">Static Title Color (No Template)</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="title-color-picker"
                            value={certTitleColor}
                            onChange={(e) => setCertTitleColor(e.target.value)}
                            className="h-10 w-12 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer bg-background p-1"
                          />
                          <input
                            type="text"
                            id="title-color"
                            value={certTitleColor}
                            onChange={(e) => setCertTitleColor(e.target.value)}
                            placeholder="#1e3a8a"
                            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* Exam Title Color */}
                      <div className="space-y-2">
                        <Label htmlFor="exam-color" className="text-xs font-bold text-slate-700 dark:text-slate-300">Exam Title Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            id="exam-color-picker"
                            value={certExamColor}
                            onChange={(e) => setCertExamColor(e.target.value)}
                            className="h-10 w-12 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer bg-background p-1"
                          />
                          <input
                            type="text"
                            id="exam-color"
                            value={certExamColor}
                            onChange={(e) => setCertExamColor(e.target.value)}
                            placeholder="#33994c"
                            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-background text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4 border-slate-100 dark:border-white/5">
                      <Button 
                        type="submit" 
                        disabled={saving} 
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 h-10 text-xs px-4 shadow animate-pulse-once"
                      >
                        {saving ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-3.5 w-3.5" /> Save Styling Settings</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

            </>
          )}
        </main>
      </SidebarInset>
      <SavingOverlay
        isVisible={saveStatus !== 'idle'}
        status={saveStatus === 'saving' ? 'saving' : saveStatus === 'success' ? 'success' : 'error'}
        progress={saveProgress}
        title="Saving Template"
        description="Uploading certificate background image template to MongoDB..."
        successTitle="Successfully Saved!"
        successDescription="Default certificate background template synced successfully."
        errorTitle="Save Failed"
        errorDescription={saveErrorMessage}
        onClose={() => {
          setSaveStatus('idle');
          setSaving(false);
        }}
      />
    </SidebarProvider>
  );
}
