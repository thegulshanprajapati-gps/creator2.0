'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useState } from 'react';
import { sanitizeHtml } from './services/editorSanitizer';
import { cn } from '@/lib/utils';

// Lazy load editors to improve bundle performance and avoid SSR errors
const TiptapEditor = dynamic(() => import('./TiptapEditor'), {
  ssr: false,
  loading: () => <div className="h-60 bg-muted/10 animate-pulse rounded-2xl border border-primary/5" />,
});

const TinyMCEEditor = dynamic(() => import('./TinyMCEEditor'), {
  ssr: false,
  loading: () => <div className="h-60 bg-muted/10 animate-pulse rounded-2xl border border-primary/5" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Global Rich Text Editor System
 * Supports switching between Tiptap and TinyMCE.
 */
export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [editorType, setEditorType] = useState<'tiptap' | 'tinymce'>('tiptap');

  const handleContentChange = (content: string) => {
    const sanitized = sanitizeHtml(content);
    onChange(sanitized);
  };

  return (
    <div className="space-y-2 w-full min-w-0 overflow-hidden">
      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-xl border border-primary/5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Editor Panel</span>
        <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setEditorType('tiptap')}
            className={cn(
              "px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer",
              editorType === 'tiptap' 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tiptap (Advanced)
          </button>
          <button
            type="button"
            onClick={() => setEditorType('tinymce')}
            className={cn(
              "px-2.5 py-1 text-[10px] font-bold rounded transition-all cursor-pointer",
              editorType === 'tinymce' 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            TinyMCE (Classic)
          </button>
        </div>
      </div>
      <div className="relative min-h-[260px]">
        <Suspense fallback={<div className="h-60 bg-muted/10 animate-pulse rounded-2xl border border-primary/5" />}>
          {editorType === 'tiptap' ? (
            <TiptapEditor 
              value={value} 
              onChange={handleContentChange} 
              placeholder={placeholder} 
              className={className} 
            />
          ) : (
            <TinyMCEEditor 
              value={value} 
              onChange={handleContentChange} 
              placeholder={placeholder} 
              className={className} 
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
