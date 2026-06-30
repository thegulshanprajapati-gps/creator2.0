import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import './globals.css';
import { CMSProvider } from "@/components/cms-provider";
import { ClientLayoutShell } from "@/components/client-layout-shell";
import { getDb } from '@/lib/mongodb';

export const metadata: Metadata = {
  title: {
    default: "Support Console",
    template: "%s | Support Console"
  },
  description: "XmartyCreator Administrative Support Console.",
  robots: { index: false, follow: false }
};

const defaultSettings = {
  themeMode: 'light',
  primaryColor: '#FF0000',
  secondaryColor: '#FF0000',
  siteName: 'XmartyCreator',
};

function hexToHslString(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '0 100% 50%';
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return `${h || 0} ${Math.round((s || 1) * 100)}% ${Math.round(l * 100)}%`;
}

function normalizeColor(color?: string): string {
  if (!color || typeof color !== 'string') return '0 100% 50%';
  return color.startsWith('#') ? hexToHslString(color) : color;
}

function getReadableForeground(hsl: string): string {
  const match = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return '210 40% 98%';
  const l = Number(match[3]);
  return l > 60 ? '222 47% 11%' : '210 40% 98%';
}

function buildThemeStyles(settings: any) {
  const primary = normalizeColor(settings.primaryColor);
  const accent = normalizeColor(settings.secondaryColor || settings.primaryColor);
  const primaryForeground = getReadableForeground(primary);
  const accentForeground = getReadableForeground(accent);
  const headingsFont = settings?.headingsFont || 'Times New Roman';
  const bodyFont = settings?.bodyFont || 'Times New Roman';

  return `:root{--primary:${primary} !important;--primary-foreground:${primaryForeground} !important;--ring:${primary} !important;--accent:${accent} !important;--accent-foreground:${accentForeground} !important;--font-headings:'${headingsFont}';--font-body:'${bodyFont}';}.dark{--primary:${primary} !important;--primary-foreground:${primaryForeground} !important;--ring:${primary} !important;--accent:${accent} !important;--accent-foreground:${accentForeground} !important;--font-headings:'${headingsFont}';--font-body:'${bodyFont}';}.bg-primary{background-color:hsl(${primary}) !important;}.text-primary{color:hsl(${primary}) !important;}.border-primary{border-color:hsl(${primary}) !important;}.decoration-primary{text-decoration-color:hsl(${primary}) !important;}.fill-primary{fill:hsl(${primary}) !important;}.bg-accent{background-color:hsl(${accent}) !important;}.text-accent{color:hsl(${accent}) !important;}`;
}

async function getInitialSettings() {
  try {
    const db = await getDb();
    const row = await db.collection('site_settings').findOne({}, { sort: { updated_at: -1 } });
    if (!row) return defaultSettings;
    return {
      themeMode: row?.theme_settings?.themeMode || defaultSettings.themeMode,
      primaryColor: row?.primary_color || defaultSettings.primaryColor,
      secondaryColor: row?.secondary_color || row?.primary_color || defaultSettings.secondaryColor,
      siteName: row?.site_name || defaultSettings.siteName,
      headingsFont: row?.headings_font || 'Times New Roman',
      bodyFont: row?.body_font || 'Times New Roman',
    };
  } catch (error) {
    console.error('Failed to load site settings for SSR', error);
    return defaultSettings;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getInitialSettings();
  const isDark = settings.themeMode === 'dark';

  return (
    <html lang="en" suppressHydrationWarning className={isDark ? 'dark' : undefined}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__XMARTY_INITIAL_SETTINGS = ${JSON.stringify(settings).replace(/</g, '\\u003c')};`,
          }}
        />
        <style
          id="xmarty-theme"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: buildThemeStyles(settings) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col overflow-x-hidden w-full">
        <div className="flex flex-1 min-h-screen flex-col w-full">
          <CMSProvider>
            <ClientLayoutShell>
              {children}
            </ClientLayoutShell>
          </CMSProvider>
        </div>
      </body>
    </html>
  );
}
