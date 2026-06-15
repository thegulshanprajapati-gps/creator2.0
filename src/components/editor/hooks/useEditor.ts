'use client';

import { useEditorMode } from '../context/EditorProvider';
import { saveDraft, getDraft, clearDraft } from '../services/editorStorage';

export function useEditor(storageKey?: string) {
  const { mode, setMode, toggleMode } = useEditorMode();

  return {
    mode,
    setMode,
    toggleMode,
    saveDraft: (val: string) => {
      if (storageKey) saveDraft(storageKey, val);
    },
    getDraft: () => {
      return storageKey ? getDraft(storageKey) : null;
    },
    clearDraft: () => {
      if (storageKey) clearDraft(storageKey);
    },
  };
}
