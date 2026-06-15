'use client';

import { useEditorMode } from './context/EditorProvider';
import { Button } from '@/components/ui/button';
import { Sparkles, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwitcherProps {
  className?: string;
}

export function EditorSwitcher({ className }: SwitcherProps) {
  const { mode, setMode } = useEditorMode();

  return (
    <div className={cn("inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 select-none shadow-sm", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300",
          mode === 'tiptap' 
            ? "bg-white dark:bg-slate-800 text-primary shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setMode('tiptap')}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Tiptap Editor
      </Button>
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300",
          mode === 'tinymce' 
            ? "bg-white dark:bg-slate-800 text-primary shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setMode('tinymce')}
      >
        <Terminal className="h-3.5 w-3.5" />
        TinyMCE Editor
      </Button>
    </div>
  );
}
