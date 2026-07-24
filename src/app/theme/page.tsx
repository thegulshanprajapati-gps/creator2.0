'use client';

import { useState, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Save, Sun, Moon, Upload, Trash2, Type, Check, RefreshCcw } from "lucide-react";
import { useCMS } from "@/components/cms-provider";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SavingOverlay } from "@/components/saving-overlay";
import { db } from "@/lib/db";
import { GOOGLE_FONTS_LIST } from "@/lib/font-list";

function hexToHSL(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function ThemeSettings() {
  const { settings, customFonts, refreshSettings, refreshFonts } = useCMS();
  const { toast } = useToast();
  
  const [primary, setPrimary] = useState("231 48% 48%");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);

  // Typography State
  const [typography, setTypography] = useState<{
    headings_font: string;
    body_font: string;
    section_headings_font: string;
    subtitles_font: string;
    buttons_font: string;
    nav_font: string;
    cards_font: string;
    code_font: string;
    badges_font: string;
    banners_font: string;
  }>({
    headings_font: "Space Grotesk",
    body_font: "Inter",
    section_headings_font: "Space Grotesk",
    subtitles_font: "Inter",
    buttons_font: "Inter",
    nav_font: "Inter",
    cards_font: "Space Grotesk",
    code_font: "JetBrains Mono",
    badges_font: "Inter",
    banners_font: "Space Grotesk",
  });

  // Font upload state
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [fontName, setFontName] = useState("");
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.primaryColor) setPrimary(settings.primaryColor);
      if (settings.themeMode) setThemeMode(settings.themeMode);
      setTypography({
        headings_font: settings.headings_font || settings.headingsFont || "Space Grotesk",
        body_font: settings.body_font || settings.bodyFont || "Inter",
        section_headings_font: settings.section_headings_font || settings.sectionHeadingsFont || "Space Grotesk",
        subtitles_font: settings.subtitles_font || settings.subtitlesFont || "Inter",
        buttons_font: settings.buttons_font || settings.buttonsFont || "Inter",
        nav_font: settings.nav_font || settings.navFont || "Inter",
        cards_font: settings.cards_font || settings.cardsFont || "Space Grotesk",
        code_font: settings.code_font || settings.codeFont || "JetBrains Mono",
        badges_font: settings.badges_font || settings.badgesFont || "Inter",
        banners_font: settings.banners_font || settings.bannersFont || "Space Grotesk",
      });
    }
  }, [settings]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveProgress(0);

    const interval = setInterval(() => {
      setSaveProgress(prev => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        return prev + Math.random() * 8;
      });
    }, 60);

    // Font family names validation list (accept any font listed in allFontsList)
    const validFonts = new Set([
      ...GOOGLE_FONTS_LIST,
      ...(customFonts || []).map((f) => f.name),
    ]);

    const fontFields = [
      'headings_font', 'body_font', 'section_headings_font', 'subtitles_font',
      'buttons_font', 'nav_font', 'cards_font', 'code_font', 'badges_font', 'banners_font'
    ] as const;

    for (const field of fontFields) {
      const val = typography[field];
      if (val && !validFonts.has(val)) {
        toast({
          variant: "destructive",
          title: "Invalid Font Selected",
          description: `Font "${val}" for ${field.replace('_', ' ')} is not allowed.`,
        });
        setIsSaving(false);
        clearInterval(interval);
        return;
      }
    }

    try {
      const payload = {
        site_name: settings?.siteName || 'Xmarty Creator',
        primary_color: primary,
        secondary_color: primary,
        theme_settings: { themeMode },
        headings_font: typography.headings_font,
        body_font: typography.body_font,
        section_headings_font: typography.section_headings_font,
        subtitles_font: typography.subtitles_font,
        buttons_font: typography.buttons_font,
        nav_font: typography.nav_font,
        cards_font: typography.cards_font,
        code_font: typography.code_font,
        badges_font: typography.badges_font,
        banners_font: typography.banners_font,
      };

      const response = settings?.id
        ? await db.from('site_settings').update(payload).eq('id', settings.id).select().single()
        : await db.from('site_settings').insert(payload).select().single();

      if (response.error) {
        throw response.error;
      }

      await refreshSettings();
      toast({
        title: 'Saved',
        description: 'Brand typography and theme configurations synchronized successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: `Unable to save theme settings: ${String(error)}`,
      });
    } finally {
      setTimeout(() => {
        clearInterval(interval);
        setSaveProgress(100);
        setTimeout(() => setIsSaving(false), 600);
      }, 1500);
    }
  }, [primary, refreshSettings, settings?.id, settings?.siteName, themeMode, typography, customFonts, toast]);

  const handleFontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFontFile(file);
    if (file && !fontName) {
      // Auto-populate font name from file name
      const name = file.name.substring(0, file.name.lastIndexOf('.'));
      setFontName(name.replace(/[-_]/g, ' '));
    }
  };

  const handleUploadFont = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontFile || !fontName.trim()) return;

    setIsUploadingFont(true);
    const formData = new FormData();
    formData.append("file", fontFile);
    formData.append("name", fontName.trim());

    try {
      const res = await fetch("/api/fonts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload font.");
      }

      toast({
        title: "Font Uploaded",
        description: `Custom font "${fontName}" has been successfully added.`,
      });

      setFontFile(null);
      setFontName("");
      // Reset input element
      const fileInput = document.getElementById("font-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      await refreshFonts();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "An error occurred during upload.",
      });
    } finally {
      setIsUploadingFont(false);
    }
  };

  const handleDeleteFont = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete custom font "${name}"?`)) return;

    try {
      const res = await fetch(`/api/fonts?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete font.");
      }

      toast({
        title: "Font Deleted",
        description: `Font "${name}" removed successfully.`,
      });

      await refreshFonts();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err.message || "An error occurred.",
      });
    }
  };

  // Combine standard google fonts with uploaded custom fonts
  const allFontsList = [
    ...GOOGLE_FONTS_LIST,
    ...(customFonts || []).map((f) => f.name),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <SidebarProvider>
      <SavingOverlay 
        isVisible={isSaving} 
        status={saveProgress === 100 ? 'success' : 'saving'} 
        progress={saveProgress}
        title="Saving Theme Settings"
        description="Applying brand colors & custom fonts..."
        successTitle="Successfully Saved Theme!"
        successDescription="Global branding settings updated successfully."
      />
      <AdminSidebar />
      <SidebarInset className="max-w-full">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 sticky top-0 z-50">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl uppercase tracking-tighter">Brand Orchestration</h1>
              <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px]">ADMIN CONSOLE v2.0</Badge>
            </div>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90 font-bold px-6 shadow-lg shadow-primary/20">
              <Save className="mr-2 h-4 w-4" />
              Apply Global Branding
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold tracking-tight">Unified Design Engine</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">Modify the visual pulse of Xmarty Creator. Changes propagate instantly to all student-facing and administrative layers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Color Accent Card */}
            <Card className="border-primary/10 shadow-xl rounded-[2rem] overflow-hidden bg-card transition-all hover:border-primary/30">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg font-headline font-bold">Brand Pulse Color</CardTitle>
                <CardDescription className="text-xs uppercase tracking-widest font-bold">Primary accent used across the ecosystem.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                  <div 
                    className="h-24 w-24 rounded-3xl border-8 border-white dark:border-white/10 shadow-2xl shrink-0 transition-all duration-700 hover:rotate-6"
                    style={{ backgroundColor: `hsl(${primary})` }}
                  />
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        className="h-12 w-12 rounded-xl cursor-pointer border-none p-0 bg-transparent overflow-hidden"
                        onChange={(e) => setPrimary(hexToHSL(e.target.value))}
                      />
                      <Input 
                        value={primary} 
                        onChange={(e) => setPrimary(e.target.value)}
                        placeholder="231 48% 48%"
                        className="font-mono text-sm h-12 rounded-xl border-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <Palette className="h-3 w-3 text-primary" />
                      Dynamic HSL Sync
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Atmosphere Card */}
            <Card className="border-primary/10 shadow-xl rounded-[2rem] overflow-hidden bg-card transition-all hover:border-primary/30">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg font-headline font-bold">Atmosphere</CardTitle>
                <CardDescription className="text-xs uppercase tracking-widest font-bold">Toggle between Light and Deep Dark modes.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                    themeMode === 'light' ? "bg-amber-100 text-amber-600" : "bg-primary/20 text-primary"
                  )}>
                    {themeMode === 'light' ? <Sun className="h-7 w-7" /> : <Moon className="h-7 w-7" />}
                  </div>
                  <div>
                    <p className="font-bold text-xl capitalize">{themeMode} Mode</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Global UI state.</p>
                  </div>
                </div>
                <Switch 
                  checked={themeMode === 'dark'} 
                  onCheckedChange={(checked) => {
                    const next = checked ? 'dark' : 'light';
                    setThemeMode(next);
                    if (next === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                  }} 
                  className="scale-125 data-[state=checked]:bg-primary shadow-lg"
                />
              </CardContent>
            </Card>
          </div>

          {/* Typography Engine Config Card */}
          <Card className="border-primary/10 shadow-xl rounded-[2rem] overflow-hidden bg-card transition-all hover:border-primary/30">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-headline font-bold">Typography Hierarchy Engine</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-bold">Select body and headings fonts across the whole platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Headings Font Family (H1/Hero)</Label>
                  <select
                    value={typography.headings_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, headings_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Section Headings Font Family (H2/H3)</Label>
                  <select
                    value={typography.section_headings_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, section_headings_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Subtitles & Accents Font Family</Label>
                  <select
                    value={typography.subtitles_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, subtitles_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Body Font Family</Label>
                  <select
                    value={typography.body_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, body_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Buttons Font Family</Label>
                  <select
                    value={typography.buttons_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, buttons_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Navigation/Menu Font Family</Label>
                  <select
                    value={typography.nav_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, nav_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Card Titles Font Family</Label>
                  <select
                    value={typography.cards_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, cards_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Code/Monospace Font Family</Label>
                  <select
                    value={typography.code_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, code_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Badge & Mini Text Font Family</Label>
                  <select
                    value={typography.badges_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, badges_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-sm">Banner & Highlights Font Family</Label>
                  <select
                    value={typography.banners_font}
                    onChange={(e) => setTypography(prev => ({ ...prev, banners_font: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-background border border-primary/10 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-foreground"
                  >
                    {allFontsList.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time preview */}
              <div className="border border-dashed border-primary/20 p-6 rounded-2xl bg-muted/5 space-y-4 mt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Typography Pulse Preview</span>
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">headings_font</span>
                    <h1 
                      className="text-3xl font-black transition-all duration-300"
                      style={{ fontFamily: `'${typography.headings_font}', sans-serif` }}
                    >
                      Hero Heading Example Text
                    </h1>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">section_headings_font</span>
                    <h2 
                      className="text-xl font-bold transition-all duration-300"
                      style={{ fontFamily: `'${typography.section_headings_font}', sans-serif` }}
                    >
                      Section Sub-heading Example Text
                    </h2>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">subtitles_font</span>
                    <p 
                      className="text-sm font-semibold transition-all duration-300"
                      style={{ fontFamily: `'${typography.subtitles_font}', sans-serif` }}
                    >
                      Subtitle accent text preview
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">body_font</span>
                    <p 
                      className="text-sm text-muted-foreground leading-relaxed transition-all duration-300"
                      style={{ fontFamily: `'${typography.body_font}', sans-serif` }}
                    >
                      This is your body text font preview. Standard paragraphs, lists, descriptions, and dynamic widgets will render using this typeface, fully synchronized.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">buttons_font</span>
                      <Button style={{ fontFamily: `'${typography.buttons_font}', sans-serif` }}>Interactive Button</Button>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">badges_font</span>
                      <Badge variant="outline" className="text-xs py-1.5 px-3" style={{ fontFamily: `'${typography.badges_font}', sans-serif` }}>Badge Element</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">code_font</span>
                    <pre className="p-3 bg-muted rounded-lg text-xs" style={{ fontFamily: `'${typography.code_font}', monospace` }}>
                      {`const message = "Hello Monospace Font Changer";`}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">cards_font</span>
                    <div className="p-4 border rounded-xl bg-card">
                      <h3 className="font-bold text-sm" style={{ fontFamily: `'${typography.cards_font}', sans-serif` }}>Card Heading Font Preview</h3>
                      <p className="text-xs text-muted-foreground">Card content paragraph using fallback fonts.</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">banners_font</span>
                    <div className="p-3 bg-primary/10 text-primary border border-primary/25 rounded-lg text-xs font-semibold" style={{ fontFamily: `'${typography.banners_font}', sans-serif` }}>
                      Special Highlighted Banner Alert Content Text Here!
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Font Uploader and List Manager Card */}
          <Card className="border-primary/10 shadow-xl rounded-[2rem] overflow-hidden bg-card transition-all hover:border-primary/30">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-headline font-bold">Custom Font Upload Center</CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest font-bold">Add and manage TTF, OTF, WOFF, or WOFF2 custom font files.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleUploadFont} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Font File</Label>
                  <Input 
                    id="font-file-input"
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFontFileChange}
                    className="h-12 rounded-xl flex items-center pt-2 text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Font Family Name</Label>
                  <Input 
                    type="text"
                    value={fontName}
                    onChange={(e) => setFontName(e.target.value)}
                    placeholder="e.g. Arizonia"
                    className="h-12 rounded-xl font-bold"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isUploadingFont || !fontFile || !fontName}
                  className="h-12 rounded-xl font-bold w-full bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition-all"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploadingFont ? "Uploading..." : "Upload Font"}
                </Button>
              </form>

              {/* Uploaded fonts list */}
              <div className="space-y-4 pt-6 border-t border-primary/5">
                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" />
                  Uploaded Custom Fonts ({customFonts?.length || 0})
                </h4>

                {!customFonts || customFonts.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">No custom fonts uploaded yet. Upload your TTF/OTF/WOFF files above.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customFonts.map((font) => (
                      <div 
                        key={font.id} 
                        className="flex items-center justify-between p-4 border border-primary/5 rounded-2xl bg-muted/10 hover:bg-muted/20 hover:border-primary/20 transition-all"
                      >
                        <div className="space-y-1.5 flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-foreground">{font.name}</span>
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-none bg-primary/10 text-primary uppercase font-bold">
                              {font.format}
                            </Badge>
                          </div>
                          {/* Live preview in list */}
                          <p 
                            className="text-lg py-1 border-t border-dashed border-primary/5 mt-2" 
                            style={{ fontFamily: `'${font.name}', sans-serif` }}
                          >
                            Quick brown fox jumps over the lazy dog.
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteFont(font.id, font.name)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
                          title="Delete Custom Font"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
