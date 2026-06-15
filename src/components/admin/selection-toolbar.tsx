'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, Copy, X } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onCopyUrls?: () => void;
  isRecycleBin?: boolean;
}

export function SelectionToolbar({
  selectedCount,
  onClear,
  onDelete,
  onRestore,
  onCopyUrls,
  isRecycleBin = false,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900/90 text-white dark:bg-zinc-950/95 px-6 py-4 rounded-3xl border border-amber-500/30 shadow-2xl backdrop-blur-md transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 pr-4 border-r border-zinc-700">
        <span className="text-sm font-black text-yellow-400">{selectedCount}</span>
        <span className="text-xs text-zinc-300 font-bold">selected</span>
      </div>

      <div className="flex items-center gap-2">
        {onCopyUrls && (
          <Button
            size="sm"
            onClick={onCopyUrls}
            variant="ghost"
            className="text-white hover:bg-zinc-800 font-bold h-9 rounded-xl px-3"
          >
            <Copy className="mr-2 h-4 w-4 text-zinc-300" />
            Copy Links
          </Button>
        )}

        {isRecycleBin ? (
          <>
            {onRestore && (
              <Button
                size="sm"
                onClick={onRestore}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 rounded-xl px-3"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore Selected
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                onClick={onDelete}
                variant="destructive"
                className="font-bold h-9 rounded-xl px-3"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Permanently Delete
              </Button>
            )}
          </>
        ) : (
          onDelete && (
            <Button
              size="sm"
              onClick={onDelete}
              variant="destructive"
              className="font-bold h-9 rounded-xl px-3"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Recycle Selected
            </Button>
          )
        )}

        <Button
          size="icon"
          onClick={onClear}
          variant="ghost"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 w-9 rounded-xl ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
