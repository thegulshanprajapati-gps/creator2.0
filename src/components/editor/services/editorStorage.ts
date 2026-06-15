export type EditorMode = 'tinymce' | 'tiptap';

export function getLocalEditorMode(): EditorMode {
  if (typeof window === 'undefined') return 'tiptap';
  return (localStorage.getItem('editorMode') as EditorMode) || 'tiptap';
}

export function setLocalEditorMode(mode: EditorMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('editorMode', mode);
}

export function saveDraft(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`editor_draft_${key}`, value);
}

export function getDraft(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`editor_draft_${key}`);
}

export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`editor_draft_${key}`);
}

// Queue for pending saves in case of connection failure
export class SaveQueue {
  private static STORAGE_KEY = 'editor_pending_saves';

  public static enqueue(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    const items = this.getQueue();
    items[key] = { value, timestamp: Date.now() };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  public static getQueue(): Record<string, { value: string; timestamp: number }> {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  public static remove(key: string): void {
    if (typeof window === 'undefined') return;
    const items = this.getQueue();
    delete items[key];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}
