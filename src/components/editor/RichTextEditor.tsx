'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import { useEditorMode, EditorProvider } from './context/EditorProvider';
import { EditorSwitcher } from './EditorSwitcher';
import { sanitizeHtml } from './services/editorSanitizer';

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

function InnerEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const { mode } = useEditorMode();

  const handleContentChange = (content: string) => {
    const sanitized = sanitizeHtml(content);
    onChange(sanitized);
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editor Panel</span>
        <EditorSwitcher />
      </div>
      <div className="relative min-h-[220px]">
        <Suspense fallback={<div className="h-60 bg-muted/10 animate-pulse rounded-2xl border border-primary/5" />}>
          {mode === 'tiptap' ? (
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

/**
 * Global Rich Text Editor System
 * Features a seamless switcher between Tiptap and TinyMCE modes.
 */
export default function RichTextEditor(props: RichTextEditorProps) {
  return (
    <EditorProvider>
      <InnerEditor {...props} />
    </EditorProvider>
  );
}
