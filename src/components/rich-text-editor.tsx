'use client';

import RichTextEditorComponent from './editor/RichTextEditor';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorComponent {...props} />;
}
