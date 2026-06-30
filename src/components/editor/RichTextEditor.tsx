'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import { sanitizeHtml } from './services/editorSanitizer';

// Lazy load the upgraded Tiptap editor to improve bundle performance and avoid SSR errors
const TiptapEditor = dynamic(() => import('./TiptapEditor'), {
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
 * Uses the upgraded premium Tiptap Editor.
 */
export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const handleContentChange = (content: string) => {
    const sanitized = sanitizeHtml(content);
    onChange(sanitized);
  };

  return (
    <div className="space-y-2 w-full min-w-0 overflow-hidden">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editor Panel</span>
      </div>
      <div className="relative min-h-[260px]">
        <Suspense fallback={<div className="h-60 bg-muted/10 animate-pulse rounded-2xl border border-primary/5" />}>
          <TiptapEditor 
            value={value} 
            onChange={handleContentChange} 
            placeholder={placeholder} 
            className={className} 
          />
        </Suspense>
      </div>
    </div>
  );
}
