'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Settings, Save, RefreshCcw, Palette, Type, Trash2 } from "lucide-react";
import { useCMS } from "@/components/cms-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GOOGLE_FONTS_LIST } from "@/lib/font-list";
import { SavingOverlay } from "@/components/saving-overlay";

export default function SystemSettingsPage() {
  const confirm = useConfirm();
  const { refreshSettings, customFonts } = useCMS();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Editable variables
  const [siteName, setSiteName] = useState('XmartyCreator');
  const [primaryColor, setPrimaryColor] = useState('#FF0000');
  const [secondaryColor, setSecondaryColor] = useState('#FF0000');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [headingsFont, setHeadingsFont] = useState('Times New Roman');
  const [bodyFont, setBodyFont] = useState('Times New Roman');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const allAvailableFonts = [
    "Times New Roman",
    ...customFonts.map(f => f.name),
    ...GOOGLE_FONTS_LIST
  ];

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/dashboard/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSiteName(data.settings.site_name || 'XmartyCreator');
        setPrimaryColor(data.settings.primary_color || '#FF0000');
        setSecondaryColor(data.settings.secondary_color || '#FF0000');
        setThemeMode(data.settings.theme_settings?.themeMode || 'light');
        setHeadingsFont(data.settings.headings_font || 'Times New Roman');
        setBodyFont(data.settings.body_font || 'Times New Roman');
        setInstagramUrl(data.settings.instagram_url || '');
        setYoutubeUrl(data.settings.youtube_url || '');
        setWhatsappUrl(data.settings.whatsapp_url || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleSaveTrigger = () => {
      const mockEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
      handleSaveSettings(mockEvent);
    };
    window.addEventListener('settings-save', handleSaveTrigger);
    return () => {
      window.removeEventListener('settings-save', handleSaveTrigger);
    };
  }, [siteName, primaryColor, secondaryColor, headingsFont, bodyFont, themeMode, instagramUrl, youtubeUrl, whatsappUrl]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isConfirmed = await confirm({
      title: "Save Platform Branding",
      message: "Are you sure you want to update the site title, dynamic brand color palettes, and global typography settings? This modifies styles globally.",
      confirmText: "Save & Deploy",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setSaving(true);
    setSaveStatus('saving');
    setSaveProgress(15);
    setSaveErrorMessage('');

    // Simulate progress increments
    const progressTimer = setInterval(() => {
      setSaveProgress(prev => (prev < 85 ? prev + 12 : prev));
    }, 110);

    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          headings_font: headingsFont,
          body_font: bodyFont,
          theme_settings: { themeMode },
          instagram_url: instagramUrl,
          youtube_url: youtubeUrl,
          whatsapp_url: whatsappUrl,
        })
      });
      clearInterval(progressTimer);
      const data = await res.json();
      if (data.success) {
        setSaveProgress(100);
        setSaveStatus('success');
        toast({ title: "Settings Saved", description: "Dynamic color and typography configurations successfully synced with MongoDB." });
        await refreshSettings();
        setTimeout(() => {
          setSaveStatus('idle');
          setSaving(false);
          // Force refresh to rebuild the dynamic style blocks
          window.location.reload();
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

  const [clearing, setClearing] = useState(false);

  const handleClearData = async () => {
    const isConfirmed = await confirm({
      title: "WARNING: Clear System Data",
      message: "Are you sure you want to clear system telemetry logs, empty the recycle bin, and restore default site branding? This cannot be undone.",
      confirmText: "Yes, Purge Data",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setClearing(true);
    try {
      const res = await fetch('/api/dashboard/clear-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: "System Cleared", description: "Successfully purged telemetry logs and default settings restored." });
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to clear database data.');
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: e.message });
    } finally {
      setClearing(false);
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 border-amber-200/40 dark:border-amber-500/10">
          <SidebarTrigger />
          <div>
            <h1 className="font-headline font-bold text-xl">System Settings</h1>
            <p className="text-xs text-muted-foreground font-medium">Configure primary color configurations and site names in database</p>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500 opacity-50" />
            </div>
          ) : (
            <Card className="border-amber-200/50 dark:border-amber-500/10 shadow-2xl rounded-[2.5rem] bg-background">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b">
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                  <Settings className="h-5 w-5 text-amber-500" /> Orchestration Branding & Typography Settings
                </CardTitle>
                <CardDescription>Adjust brand colors, global fonts, site name tags, and default theme overrides in real time.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="space-y-1">
                    <Label htmlFor="site-name">Website & Site Name Header</Label>
                    <Input 
                      id="site-name" 
                      value={siteName} 
                      onChange={(e) => setSiteName(e.target.value)} 
                      placeholder="e.g. XmartyCreator"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Palette className="h-5 w-5" />
                        <Label className="font-bold text-sm">Primary Brand Hex Color</Label>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="color" 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-12 w-14 rounded-xl border cursor-pointer bg-background"
                        />
                        <Input 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)} 
                          placeholder="#FF0000"
                          className="h-12 rounded-xl font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-3">
                      <div className="flex items-center gap-2 text-amber-500">
                        <Palette className="h-5 w-5" />
                        <Label className="font-bold text-sm">Accent Brand Hex Color</Label>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="color" 
                          value={secondaryColor} 
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="h-12 w-14 rounded-xl border cursor-pointer bg-background"
                        />
                        <Input 
                          value={secondaryColor} 
                          onChange={(e) => setSecondaryColor(e.target.value)} 
                          placeholder="#FF0000"
                          className="h-12 rounded-xl font-mono uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Master Font Changer section */}
                  <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Type className="h-5 w-5" />
                      <Label className="font-bold text-sm">Global Typography Control (Master Font Changer)</Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground ml-1">Headings Font-Family</Label>
                        <Select value={headingsFont} onValueChange={(val: string) => setHeadingsFont(val)}>
                          <SelectTrigger className="w-full bg-background rounded-xl h-11 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="Select Headings Font" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[260px]">
                            {allAvailableFonts.map(f => (
                              <SelectItem key={`headings-${f}`} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground ml-1">Body Font-Family</Label>
                        <Select value={bodyFont} onValueChange={(val: string) => setBodyFont(val)}>
                          <SelectTrigger className="w-full bg-background rounded-xl h-11 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="Select Body Font" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[260px]">
                            {allAvailableFonts.map(f => (
                              <SelectItem key={`body-${f}`} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Social Channel Links */}
                  <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Palette className="h-5 w-5" />
                      <Label className="font-bold text-sm">Official Social Channel Links</Label>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="instagram-url" className="text-xs text-muted-foreground ml-1">Instagram Profile URL</Label>
                        <Input 
                          id="instagram-url" 
                          value={instagramUrl} 
                          onChange={(e) => setInstagramUrl(e.target.value)} 
                          placeholder="https://instagram.com/your-profile"
                          className="h-11 rounded-xl bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="youtube-url" className="text-xs text-muted-foreground ml-1">YouTube Channel URL</Label>
                        <Input 
                          id="youtube-url" 
                          value={youtubeUrl} 
                          onChange={(e) => setYoutubeUrl(e.target.value)} 
                          placeholder="https://youtube.com/@your-channel"
                          className="h-11 rounded-xl bg-background"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="whatsapp-url" className="text-xs text-muted-foreground ml-1">WhatsApp Channel / Group URL</Label>
                        <Input 
                          id="whatsapp-url" 
                          value={whatsappUrl} 
                          onChange={(e) => setWhatsappUrl(e.target.value)} 
                          placeholder="https://chat.whatsapp.com/... or channel link"
                          className="h-11 rounded-xl bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4 border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Interface Mode</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={themeMode === 'light' ? 'default' : 'outline'}
                        onClick={() => setThemeMode('light')}
                        className="rounded-xl px-6 h-11 font-bold"
                      >
                        Light Mode
                      </Button>
                      <Button
                        type="button"
                        variant={themeMode === 'dark' ? 'default' : 'outline'}
                        onClick={() => setThemeMode('dark')}
                        className="rounded-xl px-6 h-11 font-bold"
                      >
                        Dark Mode
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4 border-slate-200 dark:border-slate-800">
                    <Button 
                      type="button" 
                      variant="destructive"
                      disabled={clearing}
                      onClick={handleClearData} 
                      className="rounded-xl flex items-center gap-1 font-bold h-11 px-4 shadow-md bg-rose-600 hover:bg-rose-700 text-white border-0"
                    >
                      <Trash2 className="h-4 w-4" /> {clearing ? "Clearing..." : "Clear System Data"}
                    </Button>
                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={fetchSettings} 
                        className="rounded-xl flex items-center gap-1 font-bold h-11 px-4"
                      >
                        <RefreshCcw className="h-4 w-4" /> Reset Settings
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={saving} 
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 h-11 px-6 shadow-md"
                      >
                        {saving ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="h-4 w-4" /> Save Configuration</>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>
      <SavingOverlay
        isVisible={saveStatus !== 'idle'}
        status={saveStatus === 'saving' ? 'saving' : saveStatus === 'success' ? 'success' : 'error'}
        progress={saveProgress}
        title="Saving Settings"
        description="Writing branding settings to MongoDB..."
        successTitle="Successfully Saved!"
        successDescription="Global branding settings updated successfully."
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
