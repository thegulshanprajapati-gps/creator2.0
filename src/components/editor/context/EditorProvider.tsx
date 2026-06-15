'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { EditorMode, getLocalEditorMode, setLocalEditorMode } from '../services/editorStorage';

interface EditorContextProps {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  toggleMode: () => void;
}

const EditorContext = createContext<EditorContextProps>({
  mode: 'tiptap',
  setMode: () => {},
  toggleMode: () => {},
});

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<EditorMode>('tiptap');

  useEffect(() => {
    setModeState(getLocalEditorMode());
  }, []);

  const setMode = async (newMode: EditorMode) => {
    setModeState(newMode);
    setLocalEditorMode(newMode);

    // If logged in, optionally try to sync preferences to dashboard settings database
    try {
      await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editorMode: newMode,
        }),
      });
    } catch (e) {
      console.warn('Could not sync editor preference with backend:', e);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'tiptap' ? 'tinymce' : 'tiptap');
  };

  return (
    <EditorContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditorMode = () => useContext(EditorContext);
