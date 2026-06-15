'use client';

import { useState, useEffect } from "react";
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

  // Editable settings structure for image background template
  const [settingsPayload, setSettingsPayload] = useState<any>({});
  const [certificateTemplate, setCertificateTemplate] = useState('');

  // Customizable dynamic PDF text styling states
  const [certFontFamily, setCertFontFamily] = useState('helvetica');
  const [certFontBold, setCertFontBold] = useState(true);
  const [certFontItalic, setCertFontItalic] = useState(false);
  const [certFontColor, setCertFontColor] = useState('#cc3333');
  const [certTitleColor, setCertTitleColor] = useState('#1e3a8a');
  const [certExamColor, setCertExamColor] = useState('#33994c');

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
          cert_exam_color: certExamColor
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
                
                {/* Image Template Customizer */}
                <Card className="border-slate-200 dark:border-white/5 shadow-xl rounded-[2.5rem] bg-background">
                  <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b">
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-500" /> Default PDF Base Graphic
                    </CardTitle>
                    <CardDescription>Upload a standard image template to overlay credential text on PDF files.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <label className="cursor-pointer bg-amber-500 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs hover:bg-amber-600 transition-all select-none shadow">
                            <Palette className="h-4 w-4" /> Upload Base Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setCertificateTemplate(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          {certificateTemplate && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCertificateTemplate("")}
                              className="text-rose-500 hover:text-rose-600 h-9 font-bold border-rose-500/20 hover:bg-rose-500/5 rounded-xl"
                            >
                              Remove Image
                            </Button>
                          )}
                        </div>

                        {/* Preview Area */}
                        <div className="border border-dashed rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[260px] relative">
                          {certificateTemplate ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                              <img src={certificateTemplate} alt="Certificate base preview" className="max-h-[220px] w-auto object-contain border rounded shadow" />
                            </div>
                          ) : (
                            <div className="text-center p-6 space-y-2 text-muted-foreground">
                              <ImageIcon className="h-8 w-8 mx-auto opacity-30 text-amber-500" />
                              <p className="font-semibold text-xs">No graphic template uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t pt-4 border-slate-100 dark:border-white/5">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={fetchSettings} 
                          className="rounded-xl flex items-center gap-1 font-bold h-10 text-xs px-3"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" /> Reset
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={saving} 
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 h-10 text-xs px-4 shadow"
                        >
                          {saving ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="h-3.5 w-3.5" /> Save Image</>
                          )}
                        </Button>
                      </div>
                    </form>
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
