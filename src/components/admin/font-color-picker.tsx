'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const GOOGLE_FONTS = [
  { label: 'Default (Inherited)', value: '' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Raleway', value: 'Raleway' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Source Serif 4', value: 'Source Serif 4' },
  { label: 'EB Garamond', value: 'EB Garamond' },
  { label: 'Crimson Text', value: 'Crimson Text' },
  { label: 'Libre Baskerville', value: 'Libre Baskerville' },
  { label: 'PT Serif', value: 'PT Serif' },
  { label: 'Bitter', value: 'Bitter' },
  { label: 'Amatic SC', value: 'Amatic SC' },
  { label: 'Pacifico', value: 'Pacifico' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Abril Fatface', value: 'Abril Fatface' },
  { label: 'Righteous', value: 'Righteous' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Cinzel', value: 'Cinzel' },
  { label: 'Josefin Sans', value: 'Josefin Sans' },
  { label: 'Space Grotesk', value: 'Space Grotesk' },
  { label: 'DM Serif Display', value: 'DM Serif Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
];

export const PRESET_COLORS = [
  '#0f172a', '#1e293b', '#475569', '#94a3b8',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#dc2626', '#7c3aed', '#059669',
  '#ffffff', '#fafafa',
];

interface FontColorPickerProps {
  font: string;
  color: string;
  onChange: (font: string, color: string) => void;
  previewText?: string;
}

function loadGoogleFont(fontFamily: string) {
  if (!fontFamily || typeof window === 'undefined') return;
  const encoded = encodeURIComponent(fontFamily);
  const linkId = `gfont-${encoded}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }
}

export function FontColorPicker({ font, color, onChange, previewText = 'Sample Text' }: FontColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [localFont, setLocalFont] = useState(font || '');
  const [localColor, setLocalColor] = useState(color || '#0f172a');

  // Sync with external changes
  useEffect(() => {
    setLocalFont(font || '');
    setLocalColor(color || '#0f172a');
  }, [font, color]);

  // Load font when picker opens or font changes
  useEffect(() => {
    if (localFont) loadGoogleFont(localFont);
  }, [localFont]);

  const handleApply = () => {
    onChange(localFont, localColor);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalFont('');
    setLocalColor('#0f172a');
    onChange('', '#0f172a');
    setOpen(false);
  };

  const displayColor = color || '#0f172a';
  const displayFont = font || undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Font: ${font || 'Default'} | Color: ${color || 'Default'}`}
          className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-background flex items-center justify-center text-sm font-extrabold hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-400/60 transition-all"
          style={{ color: displayColor, fontFamily: displayFont }}
        >
          A
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl"
        align="end"
        sideOffset={6}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Font &amp; Color Settings
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Live Preview */}
          <div
            className="rounded-xl border border-dashed border-amber-200 dark:border-amber-900/40 bg-amber-500/5 px-4 py-3 text-sm font-medium transition-all"
            style={{ fontFamily: localFont || undefined, color: localColor }}
          >
            {previewText}
          </div>

          {/* Font Family */}
            <Select value={localFont} onValueChange={(val) => setLocalFont(val)}>
              <SelectTrigger 
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-background text-sm px-3 font-medium cursor-pointer"
                style={{ fontFamily: localFont || undefined }}
              >
                <SelectValue placeholder="Select Font Family" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {GOOGLE_FONTS.map((f) => (
                  <SelectItem 
                    key={f.value} 
                    value={f.value} 
                    style={{ fontFamily: f.value || undefined }}
                    className="font-medium text-xs py-2"
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          {/* Color */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Text Color</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={localColor}
                onChange={(e) => setLocalColor(e.target.value)}
                className="h-9 w-14 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-background p-0.5"
              />
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">
                {localColor}
              </span>
            </div>

            {/* Preset Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setLocalColor(c)}
                  title={c}
                  className="relative h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: localColor === c ? '#f59e0b' : 'transparent',
                    boxShadow: localColor === c ? '0 0 0 2px rgba(245,158,11,0.3)' : '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  {localColor === c && (
                    <Check
                      className="absolute inset-0 m-auto h-3 w-3"
                      style={{ color: c === '#ffffff' || c === '#fafafa' ? '#000' : '#fff' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9"
              onClick={handleApply}
            >
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs h-9 font-semibold"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
